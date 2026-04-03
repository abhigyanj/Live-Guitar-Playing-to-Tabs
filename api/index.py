import base64
import os
import tempfile
import uuid
from datetime import datetime

from flask import Flask, jsonify, redirect, request, send_from_directory
from flask_cors import CORS
from werkzeug.utils import secure_filename

app = Flask(__name__)
CORS(app)  # Enable CORS for React frontend

PROJECT_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
IS_VERCEL = os.environ.get('VERCEL') == '1'

# Vercel Functions only allow temporary writes, so use /tmp there.
STORAGE_ROOT = '/tmp' if IS_VERCEL else PROJECT_ROOT
RECORDINGS_DIR = os.path.join(STORAGE_ROOT, 'recordings')
TABS_DIR = os.path.join(STORAGE_ROOT, 'tabs')
MIDIS_DIR = os.path.join(STORAGE_ROOT, 'midis')

os.makedirs(RECORDINGS_DIR, exist_ok=True)
os.makedirs(TABS_DIR, exist_ok=True)
os.makedirs(MIDIS_DIR, exist_ok=True)


@app.route('/')
def serve_home():
    return redirect('/index.html', code=307)


@app.route('/favicon.ico')
def serve_favicon():
    return redirect('/guitar-tab.svg', code=307)


def _to_float(value, default=None):
    if value in (None, ''):
        return default
    return float(value)


def _to_int(value, default=None):
    if value in (None, ''):
        return default
    return int(value)


def _parse_analysis_options(payload):
    bpm = _to_float(payload.get('bpm'))
    if bpm is None or bpm <= 0:
        raise ValueError('A valid BPM is required for audio analysis.')

    subdivision = _to_int(payload.get('subdivision'), 2)
    if subdivision not in {1, 2, 4, 8}:
        raise ValueError('Subdivision must be one of 1, 2, 4, or 8.')

    velocity = _to_int(payload.get('velocity'), 90)
    if velocity is None or not 1 <= velocity <= 127:
        raise ValueError('Velocity must be between 1 and 127.')

    return {
        'bpm': bpm,
        'subdivision': subdivision,
        'smooth': _to_int(payload.get('smooth'), 7),
        'drift': _to_float(payload.get('drift'), 8.0),
        'note_len': _to_float(payload.get('note_len'), 0.12),
        'velocity': velocity,
        'delta': _to_float(payload.get('delta'), 0.07),
    }


@app.route('/recordings/<filename>')
def serve_recording(filename):
    return send_from_directory(RECORDINGS_DIR, filename)


@app.route('/midi/<filename>')
def serve_midi(filename):
    return send_from_directory(MIDIS_DIR, filename, as_attachment=True)


@app.route('/save-tab', methods=['POST'])
def save_tab():
    data = request.json
    tab_data = data.get('tab_data', '')
    timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
    filename = f'tab_{timestamp}.txt'
    filepath = os.path.join(TABS_DIR, filename)
    
    with open(filepath, 'w') as f:
        f.write(tab_data)
    
    return jsonify({'success': True, 'filename': filename})


@app.route('/save-recording', methods=['POST'])
def save_recording():
    data = request.json
    audio_data = data.get('audio_data', '')
    
    # Remove the data URL prefix
    if ',' in audio_data:
        audio_data = audio_data.split(',')[1]
    
    timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
    filename = f'recording_{timestamp}.webm'
    filepath = os.path.join(RECORDINGS_DIR, filename)
    
    # Decode base64 and save
    audio_bytes = base64.b64decode(audio_data)
    with open(filepath, 'wb') as f:
        f.write(audio_bytes)
    
    return jsonify({'success': True, 'filename': filename})


@app.route('/get-recordings')
def get_recordings():
    recordings = []
    if os.path.exists(RECORDINGS_DIR):
        recordings = sorted(os.listdir(RECORDINGS_DIR), reverse=True)
    return jsonify({'recordings': recordings})


@app.route('/get-tabs')
def get_tabs():
    tabs = []
    if os.path.exists(TABS_DIR):
        tabs = sorted(os.listdir(TABS_DIR), reverse=True)
    return jsonify({'tabs': tabs})


@app.route('/get-tab/<filename>')
def get_tab(filename):
    filepath = os.path.join(TABS_DIR, filename)
    if os.path.exists(filepath):
        with open(filepath, 'r') as f:
            content = f.read()
        return jsonify({'success': True, 'content': content, 'filename': filename})
    return jsonify({'success': False, 'error': 'File not found'}), 404


@app.route('/analyze-audio', methods=['POST'])
def analyze_audio():
    temp_path = None

    try:
        if IS_VERCEL:
            return jsonify({
                'success': False,
                'error': (
                    'Audio-to-tab analysis is disabled on this Vercel deployment because '
                    'the required Python audio dependencies exceed Vercel function size limits. '
                    'Run the backend locally with `pip install -r requirements-analysis.txt`, '
                    'or host the analysis API on a larger Python service.'
                ),
            }), 501

        payload = request.form if request.files else (request.json or {})
        options = _parse_analysis_options(payload)

        if request.files and 'audio_file' in request.files:
            audio_file = request.files['audio_file']
            if audio_file.filename == '':
                return jsonify({'success': False, 'error': 'Please choose an audio file to analyze.'}), 400

            original_name = secure_filename(audio_file.filename) or 'uploaded_audio.webm'
            _, ext = os.path.splitext(original_name)
            ext = ext or '.webm'

            with tempfile.NamedTemporaryFile(delete=False, suffix=ext, dir=STORAGE_ROOT) as tmp_file:
                audio_file.save(tmp_file)
                temp_path = tmp_file.name

            source_path = temp_path
            source_name = original_name
        else:
            recording_filename = secure_filename(payload.get('recording_filename', ''))
            if not recording_filename:
                return jsonify({
                    'success': False,
                    'error': 'Provide either an uploaded audio file or a saved recording filename.'
                }), 400

            source_path = os.path.join(RECORDINGS_DIR, recording_filename)
            if not os.path.exists(source_path):
                return jsonify({'success': False, 'error': 'Saved recording not found.'}), 404

            source_name = recording_filename

        try:
            from .audio_analysis import analyze_audio_file
        except ModuleNotFoundError as exc:
            missing_name = getattr(exc, 'name', None) or 'audio analysis dependency'
            return jsonify({
                'success': False,
                'error': (
                    f'Audio analysis is not available because `{missing_name}` is not installed. '
                    'Run `pip install -r requirements-analysis.txt` in the backend environment.'
                ),
            }), 500

        midi_filename = f"analysis_{datetime.now().strftime('%Y%m%d_%H%M%S')}_{uuid.uuid4().hex[:8]}.mid"
        midi_path = os.path.join(MIDIS_DIR, midi_filename)

        result = analyze_audio_file(
            source_path,
            bpm=options['bpm'],
            subdivision=options['subdivision'],
            smooth=options['smooth'],
            drift=options['drift'],
            note_len=options['note_len'],
            velocity=options['velocity'],
            delta=options['delta'],
            midi_output=midi_path,
        )

        return jsonify({
            'success': True,
            'sourceFilename': source_name,
            'midiFilename': midi_filename,
            'midiUrl': f'/api/midi/{midi_filename}',
            **result,
        })
    except ValueError as exc:
        return jsonify({'success': False, 'error': str(exc)}), 400
    except RuntimeError as exc:
        return jsonify({'success': False, 'error': str(exc)}), 422
    except Exception as exc:
        return jsonify({'success': False, 'error': f'Audio analysis failed: {exc}'}), 500
    finally:
        if temp_path and os.path.exists(temp_path):
            os.remove(temp_path)
