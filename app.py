from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
import os
import base64
from datetime import datetime

app = Flask(__name__)
CORS(app)  # Enable CORS for React frontend

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
IS_VERCEL = os.environ.get('VERCEL') == '1'

# Vercel Functions only allow temporary writes, so use /tmp there.
STORAGE_ROOT = '/tmp' if IS_VERCEL else BASE_DIR
RECORDINGS_DIR = os.path.join(STORAGE_ROOT, 'recordings')
TABS_DIR = os.path.join(STORAGE_ROOT, 'tabs')

os.makedirs(RECORDINGS_DIR, exist_ok=True)
os.makedirs(TABS_DIR, exist_ok=True)


@app.route('/api/recordings/<filename>')
def serve_recording(filename):
    return send_from_directory(RECORDINGS_DIR, filename)


@app.route('/api/save-tab', methods=['POST'])
def save_tab():
    data = request.json
    tab_data = data.get('tab_data', '')
    timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
    filename = f'tab_{timestamp}.txt'
    filepath = os.path.join(TABS_DIR, filename)
    
    with open(filepath, 'w') as f:
        f.write(tab_data)
    
    return jsonify({'success': True, 'filename': filename})


@app.route('/api/save-recording', methods=['POST'])
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


@app.route('/api/get-recordings')
def get_recordings():
    recordings = []
    if os.path.exists(RECORDINGS_DIR):
        recordings = sorted(os.listdir(RECORDINGS_DIR), reverse=True)
    return jsonify({'recordings': recordings})


@app.route('/api/get-tabs')
def get_tabs():
    tabs = []
    if os.path.exists(TABS_DIR):
        tabs = sorted(os.listdir(TABS_DIR), reverse=True)
    return jsonify({'tabs': tabs})


@app.route('/api/get-tab/<filename>')
def get_tab(filename):
    filepath = os.path.join(TABS_DIR, filename)
    if os.path.exists(filepath):
        with open(filepath, 'r') as f:
            content = f.read()
        return jsonify({'success': True, 'content': content, 'filename': filename})
    return jsonify({'success': False, 'error': 'File not found'}), 404


if __name__ == '__main__':
    print("Starting Guitar Tab Studio API server...")
    print("API running at: http://127.0.0.1:5000")
    print("Make sure to also run the frontend: cd frontend && npm run dev")
    app.run(debug=True, port=5000)
