# Guitar Tab Studio

A web application for creating guitar tabs and recording audio. Built with Flask (backend API) and React (frontend).

## Features

- **Tab Editor**: Create guitar tabs using an interactive grid or freeform text input
- **Audio Recorder**: Record audio directly from your browser microphone
- **Audio-to-Tab Analysis**: Run the quantized Python pitch pipeline on a recording and import the result back into the editor
- **Monophonic Cleanup**: Improved monophonic pitch tracking with ghost-note suppression for cleaner tab output
- **YouTube Link Input**: Paste a YouTube video URL in the analysis panel and analyze that audio directly
- **Local Storage**: Tabs and recordings are saved locally on your computer

## Project Structure

```
Live-Guitar-Playing-to-Tabs/
├── api/
│   ├── index.py            # Flask API entrypoint for Vercel
│   └── audio_analysis.py   # Quantized audio-to-tab analysis pipeline
├── run_backend.py          # Local Flask API runner
├── analyze_audio_cli.py    # CLI wrapper for offline analysis
├── run.sh                  # Script to run both servers
├── frontend/               # React frontend application
│   ├── src/
│   │   ├── App.jsx
│   │   ├── App.css
│   │   └── components/
│   │       ├── TabEditor.jsx
│   │       ├── TabEditor.css
│   │       ├── AudioRecorder.jsx
│   │       └── AudioRecorder.css
│   └── package.json
├── tabs/                   # Saved tab files (created automatically)
├── recordings/             # Saved audio recordings (created automatically)
└── README.md
```

## Requirements

- Python 3.8+
- Node.js 18+
- npm
- `requirements.txt` for the lightweight web API
- `requirements-analysis.txt` for local/offline audio-to-tab analysis

## Quick Start

### Option 1: Use the run script (macOS/Linux)

```bash
chmod +x run.sh
./run.sh
```

### Option 2: Run manually (macOS/Linux)

**Step 1: Start the backend (Terminal 1)**

```bash
# Create and activate virtual environment
python3 -m venv .venv
source .venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Optional: install heavy audio-analysis dependencies for
# the Audio-to-Tab Analysis feature when running locally
pip install -r requirements-analysis.txt

# Run the API server
python run_backend.py
```

**Step 2: Start the frontend (Terminal 2)**

```bash
cd frontend
npm install
npm run dev
```

**Step 3: Open the app**

Open your browser to the URL shown in the frontend terminal (usually http://localhost:5173)

---

### Option 3: Run manually (Windows - Command Prompt)

**Step 1: Start the backend (Terminal 1)**

```cmd
:: Create and activate virtual environment
python -m venv .venv
.venv\Scripts\activate.bat

:: Install dependencies
pip install -r requirements.txt

:: Optional: install heavy audio-analysis dependencies for local analysis
pip install -r requirements-analysis.txt

:: Run the API server
python run_backend.py
```

**Step 2: Start the frontend (Terminal 2)**

```cmd
cd frontend
npm install
npm run dev
```

**Step 3: Open the app**

Open your browser to the URL shown in the frontend terminal (usually http://localhost:5173)

---

### Option 4: Run manually (Windows - PowerShell)

**Step 1: Start the backend (Terminal 1)**

```powershell
# Create and activate virtual environment
python -m venv .venv
.venv\Scripts\Activate.ps1

# Install dependencies
pip install -r requirements.txt

# Optional: install heavy audio-analysis dependencies for local analysis
pip install -r requirements-analysis.txt

# Run the API server
python run_backend.py
```

> **Note**: If you get an execution policy error, run:
> ```powershell
> Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
> ```

**Step 2: Start the frontend (Terminal 2)**

```powershell
cd frontend
npm install
npm run dev
```

**Step 3: Open the app**

Open your browser to the URL shown in the frontend terminal (usually http://localhost:5173)

## Usage

### Tab Editor

1. Select **Grid** mode to enter frets in a visual grid, or **Text** mode to type tabs directly
2. In Grid mode:
   - Click on cells and enter fret numbers (0-24) or 'x' for muted strings
   - Use "Add Column" / "Remove Column" to adjust the tab length
3. Click "Save Tab" to save to a local file

### Audio Recorder

1. Click the red record button to start recording
2. Click again to stop
3. Recordings are automatically saved and appear in the list
4. Use the audio player to listen to saved recordings

### Audio-to-Tab Analysis

1. Open the **Tab Studio** page
2. Choose a source: current recording, built-in chart/tab MIDI demo, saved recording, uploaded file, or a YouTube link
3. Use the **Audio-to-Tab Analysis** panel to enter the song BPM and run analysis
4. Preview the detected notes, download the generated MIDI, and import the tab into the editor

## Saved Files

- **Tabs**: Saved as `.txt` files in the `tabs/` directory
- **Recordings**: Saved as `.webm` files in the `recordings/` directory

## Ports

- **Backend API**: http://localhost:5000
- **Frontend**: http://localhost:5173 (may vary if port is in use)

## Deploying to Vercel

This repo is now set up so Vercel can:

- run the Flask app from [api/index.py](/Users/abhigyanj/Documents/Programming/Live-Guitar-Playing-to-Tabs/api/index.py)
- build the React frontend from `frontend/` into the root `public/` directory
- serve the frontend and API from the same domain

### Deploy steps

1. Import the repository into Vercel.
2. Keep the project root as the repository root.
3. Deploy. The build command is already defined in [vercel.json](/Users/abhigyanj/Documents/Programming/Live-Guitar-Playing-to-Tabs/vercel.json).

### Important limitation on Vercel

Tabs and recordings are currently written to local server storage. On Vercel, server storage is temporary, so saved files may disappear between invocations, deployments, or scale events.

The **Audio-to-Tab Analysis** API is also disabled on Vercel because the required Python audio stack (`librosa`, `numpy`, `pretty_midi`, `soundfile`) exceeds Vercel's Python function size limit. That feature still works locally after installing [requirements-analysis.txt](/Users/abhigyanj/Documents/Programming/Live-Guitar-Playing-to-Tabs/requirements-analysis.txt).

For production-grade persistence, replace file writes with a persistent store such as:

- Vercel Blob for audio files
- Postgres, Supabase, or another database for tab metadata/content

### Optional environment variable

The frontend now uses same-origin API requests by default. If you ever host the API separately, set `VITE_API_URL` to the full backend URL before building the frontend.

## Troubleshooting

### "Cannot connect to backend"
- Make sure the Flask server is running (`python run_backend.py`)
- Check that port 5000 is not used by another application

### Microphone not working
- Allow microphone access when prompted by the browser
- Check browser permissions in settings

### Styles not updating
- Hard refresh the page (Cmd+Shift+R on macOS, Ctrl+Shift+R on Windows/Linux)

### MP3 upload not working
- Ensure backend analysis dependencies are installed: `pip install -r requirements-analysis.txt`
- Restart the backend after installing dependencies
- If MP3 decoding still fails, verify `ffmpeg` is installed or available in PATH
