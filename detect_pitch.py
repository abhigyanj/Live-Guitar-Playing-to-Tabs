import sounddevice as sd
import numpy as np
import librosa
import math
import time

RATE = 44100
BLOCK = 2048

def freq_to_pos(target_hz):
    # Standard tuning frequencies for open strings (E2, A2, D3, G3, B3, E4)
    # String 1 is high E, String 6 is low E
    open_strings_freqs = [329.63, 246.94, 196.00, 146.83, 110.00, 82.41]
    string_names = ['E4 (1st)', 'B3 (2nd)', 'G3 (3rd)', 'D3 (4th)', 'A2 (5th)', 'E2 (6th)']
    string_matches = [-1 for _ in range(6)]
    
    for current_string_idx in range(0, 6):
        current_fret_freq = open_strings_freqs[current_string_idx]
        min_diff = float("inf")
        for fret in range(0, 21):
            if fret == 0 and current_fret_freq > target_hz:
                break
            diff = abs(current_fret_freq - target_hz)
            if diff < min_diff:
                min_diff = diff
                string_matches[current_string_idx] = fret
            current_fret_freq *= 2 ** (1 / 12)
    
    string_matches = [10 ** 5 if item == -1 else item for item in string_matches]
    minimum_fret = min(string_matches)
    minimum_string_idx = string_matches.index(minimum_fret)
    minimum_string_name = string_names[minimum_string_idx]

    if 81 < target_hz < 83:
        minimum_string_name = string_names[-1]
        minimum_fret = 0
    if minimum_fret == 10 ** 5:
        minimum_fret = 0

    #print(string_matches)

    return minimum_string_name, minimum_fret


def freq_to_note(freq):
    if freq <= 0 or np.isnan(freq):
        return None
    A4 = 440.0
    notes = ['C','C#','D','D#','E','F','F#','G','G#','A','A#','B']
    n = round(12 * math.log2(freq / A4))
    return f"{notes[(n+9)%12]}{4 + (n+9)//12}"

def callback(indata, frames, time_info, status):
    audio = indata[:,0]

    pitches = librosa.yin(
        audio,
        fmin=22,
        fmax=22000,
        sr=RATE
    )

    pitch = np.nanmedian(pitches)
    note = freq_to_note(pitch)
    string, fret = freq_to_pos(pitch)

    if note:
        print(f"{pitch:.1f} Hz → {note} {string} string {fret} fret", flush=True)

with sd.InputStream(
    samplerate=RATE,
    blocksize=BLOCK,
    channels=1,
    callback=callback
):
    print("Listening...")
    while True:
        time.sleep(0.1)