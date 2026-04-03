import numpy as np
import librosa
import pretty_midi
import math
import argparse


# Pitch stuff
def freq_to_midi(freq):
    """Convert frequency (Hz) to MIDI note number. Returns None if invalid."""
    if freq is None or freq <= 0 or np.isnan(freq):
        return None
    return int(round(69 + 12 * math.log2(freq / 440.0)))


def freq_to_note_name(freq):
    """Convert frequency to human-readable note name e.g. C4, D#5."""
    midi = freq_to_midi(freq)
    if midi is None:
        return "?"
    notes = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B']
    octave = (midi // 12) - 1
    note = notes[midi % 12]
    return f"{note}{octave}"


def detect_pitch_for_segment(y, sr, t_start, t_end, hop_length=512):
    """
    Slice audio between t_start and t_end, run YIN pitch detection,
    and return the median frequency in Hz.
    """
    s = int(t_start * sr)
    e = int(t_end * sr)
    segment = y[s:e]
 
    if len(segment) < 2048:
        segment = np.pad(segment, (0, 2048 - len(segment)))

    pitches = librosa.yin(
        segment,
        fmin=librosa.note_to_hz('C2'),   #65 Hz
        fmax=librosa.note_to_hz('C7'),   #2093 Hz
        sr=sr,
        hop_length=hop_length,
    )

    # Filter out stuff
    fmin = librosa.note_to_hz('C2')
    voiced = pitches[pitches > fmin * 1.05]

    if len(voiced) == 0:
        return None

    return float(np.median(voiced))


# Quantization stuff
def detect_note_events(y, sr, hop_length=512, min_separation=0.06, delta=0.07):
    _, y_perc = librosa.effects.hpss(y, margin=3.0)

    onset_env = librosa.onset.onset_strength(
        y=y_perc,
        sr=sr,
        hop_length=hop_length,
        aggregate=np.median,
    )

    onset_frames = librosa.onset.onset_detect(
        onset_envelope=onset_env,
        sr=sr,
        hop_length=hop_length,
        backtrack=True,
        pre_max=2,
        post_max=2,
        pre_avg=3,
        post_avg=3,
        delta=delta,
        wait=int(min_separation * sr / hop_length),
    )

    if len(onset_frames) == 0:
        return np.array([], dtype=float)

    onset_times = librosa.frames_to_time(onset_frames, sr=sr, hop_length=hop_length)

    # Ghost note filter
    # Compute attack RMS (~80ms) for every onset candidate
    attack_rms = []
    for i, t in enumerate(onset_times):
        s = int(t * sr)
        attack_end = min(len(y), s + int(0.08 * sr))
        seg = y[s:attack_end]
        rms = float(np.sqrt(np.mean(seg ** 2))) if len(seg) > 0 else 0.0
        attack_rms.append(rms)
    attack_rms = np.array(attack_rms)

    # 20% threshold to get rid of ghost notes
    rms_threshold = np.median(attack_rms) * 0.20
    valid_mask = attack_rms >= rms_threshold

    return onset_times[valid_mask]


# Adaptive grid
def running_median(x, w=7):
    if w <= 1:
        return x.copy()
    w = int(w)
    if w % 2 == 0:
        w += 1
    half = w // 2
    out = np.empty_like(x, dtype=float)
    for i in range(len(x)):
        a = max(0, i - half)
        b = min(len(x), i + half + 1)
        out[i] = np.median(x[a:b])
    return out


def clamp(x, lo, hi):
    return np.minimum(np.maximum(x, lo), hi)


def build_adaptive_grid(onsets, duration, bpm_nominal, subdivision, smooth_w=7, max_drift_pct=8.0):
    if len(onsets) < 3:
        step0 = (60.0 / bpm_nominal) / subdivision
        return np.arange(0.0, duration + step0, step0)

    step0 = (60.0 / bpm_nominal) / subdivision
    iois = np.diff(onsets)
    k = np.maximum(1, np.round(iois / step0)).astype(int)
    local_step = iois / k
    local_step_s = running_median(local_step, w=smooth_w)
    drift = max_drift_pct / 100.0
    local_step_s = clamp(local_step_s, step0 * (1 - drift), step0 * (1 + drift))

    grid = [0.0]
    t = 0.0
    region_idx = 0
    while t < duration:
        while region_idx < len(onsets) - 2 and t >= onsets[region_idx + 1]:
            region_idx += 1
        step = local_step_s[min(region_idx, len(local_step_s) - 1)]
        t = t + float(step)
        grid.append(t)

    return np.asarray(grid, dtype=float)


# Quantize to nearest grid
def quantize_to_grid(onsets, grid, snap_window_ratio=0.49):
    if len(grid) < 2:
        return onsets.copy()
    step = float(np.median(np.diff(grid)))
    snap_window = snap_window_ratio * step
    q = []
    for t in onsets:
        idx = int(np.argmin(np.abs(grid - t)))
        qt = float(grid[idx])
        q.append(qt if abs(qt - t) <= snap_window else float(t))
    return np.asarray(q, dtype=float)


# MIDI output
def write_midi(onsets, pitches_midi, midi_out, bpm, note_len=0.12, velocity=90, fallback_pitch=60):
    pm = pretty_midi.PrettyMIDI(initial_tempo=float(bpm))
    inst = pretty_midi.Instrument(
        program=pretty_midi.instrument_name_to_program("Acoustic Grand Piano")
    )
    for t, p in zip(onsets, pitches_midi):
        pitch = p if p is not None else fallback_pitch
        pitch = int(np.clip(pitch, 0, 127))
        inst.notes.append(pretty_midi.Note(
            velocity=int(velocity),
            pitch=pitch,
            start=float(t),
            end=float(t + note_len),
        ))
    pm.instruments.append(inst)
    pm.write(midi_out)


# Main (with queries)
def main():
    parser = argparse.ArgumentParser(description="Pitch-detecting quantized MIDI exporter")
    parser.add_argument("audio_file", nargs="?", help="Path to audio file (.wav, .mp3, etc.)")
    parser.add_argument("--bpm", type=float, help="Tempo in BPM")
    parser.add_argument("--subdivision", type=int, default=2,
                        help="Grid subdivision: 1=quarter, 2=eighth, 4=sixteenth (default: 2)")
    parser.add_argument("--smooth", type=int, default=7,
                        help="Tempo smoothness window, odd int (default: 7)")
    parser.add_argument("--drift", type=float, default=8.0,
                        help="Max tempo drift %% (default: 8)")
    parser.add_argument("--note-len", type=float, default=0.12,
                        help="MIDI note length in seconds (default: 0.12)")
    parser.add_argument("--velocity", type=int, default=90,
                        help="MIDI velocity 1-127 (default: 90)")
    parser.add_argument("--output", type=str, default="output.mid",
                        help="Output MIDI filename (default: output.mid)")
    parser.add_argument("--delta", type=float, default=0.07,
                        help="Onset threshold: lower = more notes detected (default: 0.07)")
    args = parser.parse_args()

    # Interactive fallback
    audio_file = args.audio_file or input("Audio file path (e.g., input.wav): ").strip()
    bpm = args.bpm or float(input("Tempo (BPM): ").strip())

    if not args.audio_file:
        print("\nSubdivision: 1=quarter  2=eighth  4=sixteenth  8=32nd")
        subdivision = int(input("Subdivision [2]: ").strip() or "2")
        smooth_w = int(input("Tempo smoothness (odd int, try 7): ").strip() or "7")
        max_drift = float(input("Max tempo drift % (try 8): ").strip() or "8")
        note_len = float(input("Note length in seconds [0.12]: ").strip() or "0.12")
        velocity = int(input("MIDI velocity 1-127 [90]: ").strip() or "90")
        delta = float(input("Onset threshold, lower=more notes [0.07]: ").strip() or "0.07")
        out_mid = input("Output filename [output.mid]: ").strip() or "output.mid"
    else:
        subdivision = args.subdivision
        smooth_w = args.smooth
        max_drift = args.drift
        note_len = args.note_len
        velocity = args.velocity
        delta = args.delta
        out_mid = args.output

    print(f"\n🎵 Loading audio: {audio_file}")
    y, sr = librosa.load(audio_file, sr=None, mono=True)
    duration = librosa.get_duration(y=y, sr=sr)
    print(f"   Duration: {duration:.2f}s  |  Sample rate: {sr} Hz")

    # Onset detection
    print("🔍 Detecting onsets...")
    onsets = detect_note_events(y, sr, delta=delta)
    if len(onsets) == 0:
        raise RuntimeError("No onsets detected. Try a different file or adjust onset settings.")
    print(f"   Found {len(onsets)} onsets")

    # Pitch detection per note
    print("🎼 Detecting pitch for each note...")
    pitches_midi = []
    for i, t_start in enumerate(onsets):
        # end of segment = next onset (or +0.5s for last note)
        t_end = onsets[i + 1] if i + 1 < len(onsets) else t_start + 0.5
        freq = detect_pitch_for_segment(y, sr, t_start, t_end)
        midi_note = freq_to_midi(freq)
        note_name = freq_to_note_name(freq) if freq else "?"
        pitches_midi.append(midi_note)
        hz_str = f"{freq:.1f} Hz" if freq else "unvoiced"
        print(f"   [{i+1:3d}] t={t_start:.3f}s  →  {hz_str}  →  {note_name}  (MIDI {midi_note})")

    # Build adaptive quantization grid
    print("\n📐 Building adaptive quantization grid...")
    grid = build_adaptive_grid(
        onsets=onsets,
        duration=duration,
        bpm_nominal=bpm,
        subdivision=subdivision,
        smooth_w=smooth_w,
        max_drift_pct=max_drift,
    )
    print(f"   Grid points: {len(grid)}")

    # Quantize onsets
    q_onsets = quantize_to_grid(onsets, grid, snap_window_ratio=0.49)

    avg_shift_ms = float(np.mean(np.abs(q_onsets - onsets)) * 1000)
    print(f"   Average quantization shift: {avg_shift_ms:.1f} ms")

    # Write MIDI
    write_midi(q_onsets, pitches_midi, out_mid, bpm=bpm, note_len=note_len, velocity=velocity)
    print(f"\n✅ MIDI written to: {out_mid}")
    print(f"   Notes: {len(q_onsets)}  |  BPM: {bpm}  |  Subdivision: {subdivision}")


if __name__ == "__main__":
    main()