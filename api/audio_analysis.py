import argparse
import math
import os
import shutil
import subprocess
import tempfile

import numpy as np


COMPRESSED_AUDIO_EXTENSIONS = {
    ".mp3",
    ".m4a",
    ".aac",
    ".ogg",
    ".opus",
    ".webm",
    ".mp4",
}

MIN_NOTE_DURATION_SECONDS = 0.07
GHOST_MERGE_GAP_SECONDS = 0.045
GHOST_MERGE_MAX_CENTS = 35.0


STRING_ORDER = ["e", "B", "G", "D", "A", "E"]
GUITAR_STRINGS = [
    {"name": "e", "string_index": 0, "open_freq": 329.63},
    {"name": "B", "string_index": 1, "open_freq": 246.94},
    {"name": "G", "string_index": 2, "open_freq": 196.00},
    {"name": "D", "string_index": 3, "open_freq": 146.83},
    {"name": "A", "string_index": 4, "open_freq": 110.00},
    {"name": "E", "string_index": 5, "open_freq": 82.41},
]


def freq_to_midi(freq):
    """Convert frequency (Hz) to a MIDI note number."""
    if freq is None or freq <= 0 or np.isnan(freq):
        return None
    return int(round(69 + 12 * math.log2(freq / 440.0)))


def midi_to_freq(midi_note):
    if midi_note is None:
        return None
    return 440.0 * math.pow(2.0, (midi_note - 69) / 12.0)


def freq_to_note_name(freq):
    """Convert frequency to a human-readable note name like C4 or D#5."""
    midi_note = freq_to_midi(freq)
    if midi_note is None:
        return "?"
    notes = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"]
    octave = (midi_note // 12) - 1
    note = notes[midi_note % 12]
    return f"{note}{octave}"


def _import_librosa():
    try:
        import librosa
    except ModuleNotFoundError as exc:
        raise ModuleNotFoundError(
            "Audio analysis requires librosa. Install backend dependencies with "
            "`pip install -r requirements.txt`."
        ) from exc
    return librosa


def _import_pretty_midi():
    try:
        import pretty_midi
    except ModuleNotFoundError as exc:
        raise ModuleNotFoundError(
            "MIDI export requires pretty_midi. Install backend dependencies with "
            "`pip install -r requirements.txt`."
        ) from exc
    return pretty_midi


def _resolve_ffmpeg_binary():
    ffmpeg = shutil.which("ffmpeg")
    if ffmpeg:
        return ffmpeg

    try:
        import imageio_ffmpeg
    except ModuleNotFoundError:
        return None

    try:
        return imageio_ffmpeg.get_ffmpeg_exe()
    except Exception:
        return None


def _load_audio_with_ffmpeg(audio_path, librosa):
    ffmpeg = _resolve_ffmpeg_binary()
    if ffmpeg is None:
        raise RuntimeError(
            "Could not decode compressed audio (MP3/WebM/etc). Install ffmpeg "
            "or install `imageio-ffmpeg` in the backend environment."
        )

    with tempfile.NamedTemporaryFile(suffix=".wav", delete=False) as tmp_file:
        wav_path = tmp_file.name

    try:
        completed = subprocess.run(
            [
                ffmpeg,
                "-y",
                "-i",
                audio_path,
                "-ac",
                "1",
                "-ar",
                "44100",
                wav_path,
            ],
            check=False,
            capture_output=True,
            text=True,
        )
        if completed.returncode != 0:
            stderr = completed.stderr.strip() or "ffmpeg failed to convert the audio."
            raise RuntimeError(stderr)

        return librosa.load(wav_path, sr=None, mono=True)
    finally:
        if os.path.exists(wav_path):
            os.remove(wav_path)


def load_audio_file(audio_path):
    """Load audio with robust handling for compressed browser formats and MP3 uploads."""
    librosa = _import_librosa()
    extension = os.path.splitext(audio_path)[1].lower()
    should_transcode = extension in COMPRESSED_AUDIO_EXTENSIONS

    try:
        if should_transcode:
            return _load_audio_with_ffmpeg(audio_path, librosa)
        return librosa.load(audio_path, sr=None, mono=True)
    except Exception as original_error:
        try:
            return _load_audio_with_ffmpeg(audio_path, librosa)
        except RuntimeError as transcode_error:
            raise RuntimeError(
                f"Could not decode the uploaded audio: {transcode_error}"
            ) from original_error


def detect_pitch_for_segment(y, sr, t_start, t_end, hop_length=512):
    """Estimate monophonic pitch for a note segment, preferring pYIN for stability."""
    librosa = _import_librosa()

    start_sample = int(t_start * sr)
    end_sample = int(t_end * sr)
    segment = y[start_sample:end_sample]

    if len(segment) < 2048:
        segment = np.pad(segment, (0, 2048 - len(segment)))

    fmin = librosa.note_to_hz("C2")
    fmax = librosa.note_to_hz("C7")

    try:
        f0, _, voiced_prob = librosa.pyin(
            segment,
            fmin=fmin,
            fmax=fmax,
            sr=sr,
            hop_length=hop_length,
            frame_length=2048,
        )

        valid = np.isfinite(f0)
        if voiced_prob is not None:
            valid &= voiced_prob >= 0.55

        voiced_f0 = f0[valid]
        if len(voiced_f0) > 0:
            return float(np.median(voiced_f0))
    except Exception:
        pass

    pitches = librosa.yin(
        segment,
        fmin=fmin,
        fmax=fmax,
        sr=sr,
        hop_length=hop_length,
    )

    voiced = pitches[(pitches > fmin * 1.02) & np.isfinite(pitches)]

    if len(voiced) == 0:
        return None

    return float(np.median(voiced))


def detect_note_events(y, sr, hop_length=512, min_separation=0.08, delta=0.07):
    librosa = _import_librosa()

    y_harm, y_perc = librosa.effects.hpss(y, margin=2.5)
    onset_signal = (0.65 * y_harm) + (0.35 * y_perc)

    onset_env = librosa.onset.onset_strength(
        y=onset_signal,
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

    frame_indexes = np.clip(onset_frames.astype(int), 0, max(0, len(onset_env) - 1))
    onset_strengths = onset_env[frame_indexes]
    onset_times = librosa.frames_to_time(onset_frames, sr=sr, hop_length=hop_length)

    attack_rms = []
    for onset_time in onset_times:
        start_sample = int(onset_time * sr)
        attack_end = min(len(y), start_sample + int(0.08 * sr))
        segment = y[start_sample:attack_end]
        rms = float(np.sqrt(np.mean(segment ** 2))) if len(segment) > 0 else 0.0
        attack_rms.append(rms)

    attack_rms = np.asarray(attack_rms, dtype=float)
    if len(attack_rms) == 0:
        return np.array([], dtype=float)

    strength_threshold = max(float(np.percentile(onset_strengths, 30)), float(np.max(onset_strengths)) * 0.12)
    rms_threshold = max(float(np.percentile(attack_rms, 30)) * 0.45, float(np.median(attack_rms)) * 0.35)
    valid_mask = (onset_strengths >= strength_threshold) & (attack_rms >= rms_threshold)

    candidate_times = onset_times[valid_mask]
    candidate_strengths = onset_strengths[valid_mask]
    candidate_rms = attack_rms[valid_mask]

    if len(candidate_times) == 0:
        strongest_idx = int(np.argmax(onset_strengths))
        return np.asarray([onset_times[strongest_idx]], dtype=float)

    filtered = []
    for onset_time, strength, rms in zip(candidate_times, candidate_strengths, candidate_rms):
        current = {
            "time": float(onset_time),
            "strength": float(strength),
            "rms": float(rms),
        }

        if not filtered:
            filtered.append(current)
            continue

        previous = filtered[-1]
        if current["time"] - previous["time"] < min_separation:
            prev_score = previous["strength"] * 0.7 + previous["rms"] * 0.3
            curr_score = current["strength"] * 0.7 + current["rms"] * 0.3
            if curr_score > prev_score * 1.05:
                filtered[-1] = current
            continue

        filtered.append(current)

    return np.asarray([item["time"] for item in filtered], dtype=float)


def _pitch_distance_cents(freq_a, freq_b):
    if freq_a is None or freq_b is None or freq_a <= 0 or freq_b <= 0:
        return None
    return abs(1200.0 * math.log2(float(freq_a) / float(freq_b)))


def suppress_ghost_notes(
    note_events,
    min_note_duration=MIN_NOTE_DURATION_SECONDS,
    merge_gap=GHOST_MERGE_GAP_SECONDS,
    merge_cents=GHOST_MERGE_MAX_CENTS,
):
    voiced_events = [dict(note) for note in note_events if note.get("frequency") not in (None, 0)]
    if not voiced_events:
        return []

    merged_events = []
    for note in voiced_events:
        if not merged_events:
            merged_events.append(note)
            continue

        previous = merged_events[-1]
        cents = _pitch_distance_cents(previous.get("frequency"), note.get("frequency"))
        gap = float(note["startTime"]) - float(previous["endTime"])

        if cents is not None and gap <= merge_gap and cents <= merge_cents:
            previous["endTime"] = max(float(previous["endTime"]), float(note["endTime"]))
            if note.get("position") and not previous.get("position"):
                previous["position"] = note.get("position")
            continue

        merged_events.append(note)

    filtered_events = []
    total = len(merged_events)
    for idx, note in enumerate(merged_events):
        duration = float(note["endTime"]) - float(note["startTime"])
        if duration >= min_note_duration:
            filtered_events.append(note)
            continue

        prev_note = merged_events[idx - 1] if idx > 0 else None
        next_note = merged_events[idx + 1] if idx + 1 < total else None

        prev_close = False
        next_close = False

        if prev_note is not None:
            prev_cents = _pitch_distance_cents(prev_note.get("frequency"), note.get("frequency"))
            prev_close = prev_cents is not None and prev_cents <= merge_cents

        if next_note is not None:
            next_cents = _pitch_distance_cents(next_note.get("frequency"), note.get("frequency"))
            next_close = next_cents is not None and next_cents <= merge_cents

        if prev_close or next_close:
            continue

        filtered_events.append(note)

    for index, note in enumerate(filtered_events, start=1):
        note["index"] = index

    return filtered_events


def running_median(values, w=7):
    if w <= 1:
        return values.copy()

    window = int(w)
    if window % 2 == 0:
        window += 1

    half_window = window // 2
    output = np.empty_like(values, dtype=float)
    for index in range(len(values)):
        start = max(0, index - half_window)
        end = min(len(values), index + half_window + 1)
        output[index] = np.median(values[start:end])
    return output


def clamp(values, lower, upper):
    return np.minimum(np.maximum(values, lower), upper)


def build_adaptive_grid(onsets, duration, bpm_nominal, subdivision, smooth_w=7, max_drift_pct=8.0):
    step0 = (60.0 / bpm_nominal) / subdivision

    if len(onsets) < 3:
        return np.arange(0.0, duration + step0, step0)

    iois = np.diff(onsets)
    multiples = np.maximum(1, np.round(iois / step0)).astype(int)
    local_step = iois / multiples
    smoothed_step = running_median(local_step, w=smooth_w)
    drift = max_drift_pct / 100.0
    smoothed_step = clamp(smoothed_step, step0 * (1 - drift), step0 * (1 + drift))

    grid = [0.0]
    current_time = 0.0
    region_idx = 0
    while current_time < duration:
        while region_idx < len(onsets) - 2 and current_time >= onsets[region_idx + 1]:
            region_idx += 1
        step = smoothed_step[min(region_idx, len(smoothed_step) - 1)]
        current_time += float(step)
        grid.append(current_time)

    return np.asarray(grid, dtype=float)


def quantize_notes_to_grid(onsets, grid, snap_window_ratio=0.49):
    if len(grid) < 2:
        return [
            {
                "original_time": float(onset),
                "quantized_time": float(onset),
                "grid_index": None,
                "shift_ms": 0.0,
                "snapped": False,
            }
            for onset in onsets
        ]

    median_step = float(np.median(np.diff(grid)))
    snap_window = snap_window_ratio * median_step
    quantized_notes = []

    for onset in onsets:
        nearest_index = int(np.argmin(np.abs(grid - onset)))
        quantized_time = float(grid[nearest_index])
        snapped = abs(quantized_time - onset) <= snap_window
        final_time = quantized_time if snapped else float(onset)
        quantized_notes.append(
            {
                "original_time": float(onset),
                "quantized_time": final_time,
                "grid_index": nearest_index,
                "shift_ms": abs(final_time - float(onset)) * 1000.0,
                "snapped": snapped,
            }
        )

    return quantized_notes


def quantize_to_grid(onsets, grid, snap_window_ratio=0.49):
    quantized_notes = quantize_notes_to_grid(onsets, grid, snap_window_ratio=snap_window_ratio)
    return np.asarray([note["quantized_time"] for note in quantized_notes], dtype=float)


def frequency_to_fret_positions(freq, max_fret=24):
    if freq is None or freq < 70 or freq > 1400:
        return []

    positions = []
    for string in GUITAR_STRINGS:
        fret = 12 * math.log2(freq / string["open_freq"])
        rounded_fret = round(fret)
        if rounded_fret < 0 or rounded_fret > max_fret:
            continue

        exact_freq = string["open_freq"] * math.pow(2, rounded_fret / 12)
        cents_error = 1200 * math.log2(freq / exact_freq)
        if abs(cents_error) > 50:
            continue

        positions.append(
            {
                "string": string["name"],
                "stringIndex": string["string_index"],
                "fret": int(rounded_fret),
                "centsError": int(round(cents_error)),
                "exactFrequency": round(exact_freq, 2),
            }
        )

    return positions


def get_most_likely_position(freq, last_position=None):
    positions = frequency_to_fret_positions(freq)
    if not positions:
        return None
    if len(positions) == 1:
        return positions[0]

    scored_positions = []
    for position in positions:
        score = 100.0
        score -= position["fret"] * 2

        if 1 <= position["stringIndex"] <= 4:
            score += 10

        if last_position:
            fret_distance = abs(position["fret"] - last_position["fret"])
            string_distance = abs(position["stringIndex"] - last_position["stringIndex"])
            score -= fret_distance * 3
            score -= string_distance * 5

        score -= abs(position["centsError"]) / 10.0
        scored_positions.append({**position, "score": score})

    scored_positions.sort(key=lambda item: item["score"], reverse=True)
    return scored_positions[0]


def build_tab_data(notes, subdivision):
    slots_per_bar = 4 * subdivision
    tab_data = {string_name: [] for string_name in STRING_ORDER}
    last_used_slot = -1

    for note in notes:
        position = note.get("position")
        if position is None:
            continue

        slot_index = note.get("slotIndex")
        if slot_index is None:
            continue

        slot_index = max(int(slot_index), 0)
        if slot_index <= last_used_slot:
            slot_index = last_used_slot + 1

        needed_length = slot_index + 1
        for string_name in STRING_ORDER:
            while len(tab_data[string_name]) < needed_length:
                tab_data[string_name].append("")

        tab_data[position["string"]][slot_index] = str(position["fret"])
        last_used_slot = slot_index

    total_slots = max((len(values) for values in tab_data.values()), default=0)
    if total_slots == 0:
        return tab_data, 0

    bars = max(1, math.ceil(total_slots / slots_per_bar))
    padded_slots = bars * slots_per_bar

    for string_name in STRING_ORDER:
        while len(tab_data[string_name]) < padded_slots:
            tab_data[string_name].append("")

    return tab_data, padded_slots


def tab_data_to_text(tab_data):
    lines = []
    for string_name in STRING_ORDER:
        fret_text = "-".join(
            "--" if fret == "" else f"-{fret}" if len(str(fret)) == 1 else str(fret)
            for fret in tab_data[string_name]
        )
        lines.append(f"{string_name}|{fret_text}|")
    return "\n".join(lines)


def write_midi(onsets, pitches_midi, midi_out, bpm, note_len=0.12, velocity=90, fallback_pitch=60):
    pretty_midi = _import_pretty_midi()

    midi = pretty_midi.PrettyMIDI(initial_tempo=float(bpm))
    instrument = pretty_midi.Instrument(
        program=pretty_midi.instrument_name_to_program("Acoustic Grand Piano")
    )

    for onset, pitch_value in zip(onsets, pitches_midi):
        pitch = pitch_value if pitch_value is not None else fallback_pitch
        pitch = int(np.clip(pitch, 0, 127))
        instrument.notes.append(
            pretty_midi.Note(
                velocity=int(velocity),
                pitch=pitch,
                start=float(onset),
                end=float(onset + note_len),
            )
        )

    midi.instruments.append(instrument)
    midi.write(midi_out)


def analyze_audio_file(
    audio_file,
    bpm,
    subdivision=2,
    smooth=7,
    drift=8.0,
    note_len=0.12,
    velocity=90,
    delta=0.07,
    midi_output=None,
):
    if bpm is None or bpm <= 0:
        raise ValueError("BPM must be greater than 0.")

    y, sr = load_audio_file(audio_file)
    duration = float(len(y) / sr) if sr else 0.0

    onsets = detect_note_events(y, sr, delta=delta)
    if len(onsets) == 0:
        raise RuntimeError("No onsets detected. Try a different recording or adjust the onset threshold.")

    note_events = []
    midi_notes = []
    last_position = None

    for index, onset_time in enumerate(onsets):
        end_time = onsets[index + 1] if index + 1 < len(onsets) else onset_time + 0.5
        freq = detect_pitch_for_segment(y, sr, onset_time, end_time)
        midi_note = freq_to_midi(freq)
        note_name = freq_to_note_name(freq) if freq is not None else "?"
        position = get_most_likely_position(freq, last_position=last_position) if freq is not None else None
        if position is not None:
            last_position = position

        midi_notes.append(midi_note)
        note_events.append(
            {
                "index": index + 1,
                "startTime": float(onset_time),
                "endTime": float(end_time),
                "frequency": None if freq is None else round(float(freq), 2),
                "midi": midi_note,
                "noteName": note_name,
                "position": position,
            }
        )

    note_events = suppress_ghost_notes(note_events)
    if len(note_events) == 0:
        raise RuntimeError(
            "No stable monophonic notes detected. Try cleaner single-note input or raise onset threshold."
        )

    onsets = np.asarray([float(note["startTime"]) for note in note_events], dtype=float)
    midi_notes = [note.get("midi") for note in note_events]

    grid = build_adaptive_grid(
        onsets=onsets,
        duration=duration,
        bpm_nominal=bpm,
        subdivision=subdivision,
        smooth_w=smooth,
        max_drift_pct=drift,
    )
    quantized_notes = quantize_notes_to_grid(onsets, grid, snap_window_ratio=0.49)
    quantized_onsets = np.asarray([note["quantized_time"] for note in quantized_notes], dtype=float)
    average_shift_ms = float(np.mean([note["shift_ms"] for note in quantized_notes]))

    nominal_step = (60.0 / bpm) / subdivision
    for note_event, quantized_note in zip(note_events, quantized_notes):
        slot_index = quantized_note["grid_index"]
        if slot_index is None and nominal_step > 0:
            slot_index = int(round(quantized_note["quantized_time"] / nominal_step))

        note_event["quantizedStartTime"] = round(quantized_note["quantized_time"], 6)
        note_event["shiftMs"] = round(quantized_note["shift_ms"], 2)
        note_event["snappedToGrid"] = bool(quantized_note["snapped"])
        note_event["slotIndex"] = slot_index

    tab_data, total_slots = build_tab_data(note_events, subdivision=subdivision)
    tab_text = tab_data_to_text(tab_data)

    if midi_output:
        write_midi(
            quantized_onsets,
            midi_notes,
            midi_output,
            bpm=bpm,
            note_len=note_len,
            velocity=velocity,
        )

    mapped_note_count = sum(1 for note in note_events if note["position"] is not None)
    return {
        "summary": {
            "durationSeconds": round(duration, 3),
            "sampleRate": int(sr),
            "bpm": float(bpm),
            "subdivision": int(subdivision),
            "noteCount": len(note_events),
            "mappedNoteCount": mapped_note_count,
            "gridPoints": len(grid),
            "averageQuantizationShiftMs": round(average_shift_ms, 2),
            "tabSlotCount": int(total_slots),
        },
        "notes": note_events,
        "tabData": tab_data,
        "tabText": tab_text,
    }


def main():
    parser = argparse.ArgumentParser(description="Pitch-detecting quantized MIDI exporter")
    parser.add_argument("audio_file", nargs="?", help="Path to audio file (.wav, .mp3, .webm, etc.)")
    parser.add_argument("--bpm", type=float, help="Tempo in BPM")
    parser.add_argument(
        "--subdivision",
        type=int,
        default=2,
        help="Grid subdivision: 1=quarter, 2=eighth, 4=sixteenth (default: 2)",
    )
    parser.add_argument("--smooth", type=int, default=7, help="Tempo smoothness window, odd int (default: 7)")
    parser.add_argument("--drift", type=float, default=8.0, help="Max tempo drift %% (default: 8)")
    parser.add_argument("--note-len", type=float, default=0.12, help="MIDI note length in seconds (default: 0.12)")
    parser.add_argument("--velocity", type=int, default=90, help="MIDI velocity 1-127 (default: 90)")
    parser.add_argument("--output", type=str, default="output.mid", help="Output MIDI filename (default: output.mid)")
    parser.add_argument(
        "--delta",
        type=float,
        default=0.07,
        help="Onset threshold: lower = more notes detected (default: 0.07)",
    )
    args = parser.parse_args()

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

    result = analyze_audio_file(
        audio_file,
        bpm=bpm,
        subdivision=subdivision,
        smooth=smooth_w,
        drift=max_drift,
        note_len=note_len,
        velocity=velocity,
        delta=delta,
        midi_output=out_mid,
    )

    print(f"\n🎵 Loaded audio: {audio_file}")
    print(
        "   Duration: "
        f"{result['summary']['durationSeconds']:.2f}s  |  Sample rate: {result['summary']['sampleRate']} Hz"
    )
    print(f"   Found {result['summary']['noteCount']} onsets")
    print("🎼 Detected notes:")
    for note in result["notes"]:
        hz_str = f"{note['frequency']:.1f} Hz" if note["frequency"] is not None else "unvoiced"
        midi_str = note["midi"] if note["midi"] is not None else "None"
        print(
            f"   [{note['index']:3d}] t={note['startTime']:.3f}s  ->  "
            f"{hz_str}  ->  {note['noteName']}  (MIDI {midi_str})"
        )

    print("\n📐 Quantization summary:")
    print(f"   Grid points: {result['summary']['gridPoints']}")
    print(f"   Average quantization shift: {result['summary']['averageQuantizationShiftMs']:.1f} ms")
    print(f"\n✅ MIDI written to: {out_mid}")
    print(
        "   Notes: "
        f"{result['summary']['noteCount']}  |  BPM: {result['summary']['bpm']}  |  "
        f"Subdivision: {result['summary']['subdivision']}"
    )


if __name__ == "__main__":
    main()
