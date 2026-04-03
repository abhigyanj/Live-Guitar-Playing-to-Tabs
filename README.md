# Guitar Tab Studio

A web application for creating guitar tabs and recording audio. Built with Flask (backend API) and React (frontend).

## Features

- **Tab Editor**: Create guitar tabs using an interactive grid or freeform text input
- **Audio Recorder**: Record audio directly from your browser microphone
- **Local Storage**: Tabs and recordings are saved locally on your computer

## Project Structure

```
Live-Guitar-Playing-to-Tabs/
├── app.py                  # Flask API server
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

# Run the API server
python app.py
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

:: Run the API server
python app.py
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

# Run the API server
python app.py
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

## Saved Files

- **Tabs**: Saved as `.txt` files in the `tabs/` directory
- **Recordings**: Saved as `.webm` files in the `recordings/` directory

## Ports

- **Backend API**: http://localhost:5000
- **Frontend**: http://localhost:5173 (may vary if port is in use)

## Deploying to Vercel

This repo is now set up so Vercel can:

- run the Flask app from [app.py](/Users/abhigyanj/Documents/Programming/Live-Guitar-Playing-to-Tabs/app.py)
- build the React frontend from `frontend/` into the root `public/` directory
- serve the frontend and API from the same domain

### Deploy steps

1. Import the repository into Vercel.
2. Keep the project root as the repository root.
3. Deploy. The build command is already defined in [vercel.json](/Users/abhigyanj/Documents/Programming/Live-Guitar-Playing-to-Tabs/vercel.json).

### Important limitation on Vercel

Tabs and recordings are currently written to local server storage. On Vercel, server storage is temporary, so saved files may disappear between invocations, deployments, or scale events.

For production-grade persistence, replace file writes with a persistent store such as:

- Vercel Blob for audio files
- Postgres, Supabase, or another database for tab metadata/content

### Optional environment variable

The frontend now uses same-origin API requests by default. If you ever host the API separately, set `VITE_API_URL` to the full backend URL before building the frontend.

## Troubleshooting

### "Cannot connect to backend"
- Make sure the Flask server is running (`python app.py`)
- Check that port 5000 is not used by another application

### Microphone not working
- Allow microphone access when prompted by the browser
- Check browser permissions in settings

### Styles not updating
- Hard refresh the page (Cmd+Shift+R on macOS, Ctrl+Shift+R on Windows/Linux)
