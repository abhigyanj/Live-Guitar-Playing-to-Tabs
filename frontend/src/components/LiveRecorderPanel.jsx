import { useState, useEffect, useRef } from 'react'
import { useAudioContext } from '../contexts/AudioContext'
import { GRID_DIVISIONS, TIME_SIGNATURES } from '../utils/quantization'

// Frequency to color mapping
const getFrequencyColor = (frequency) => {
  if (!frequency) return 'bg-slate-600'
  if (frequency < 150) return 'bg-red-500'
  if (frequency < 250) return 'bg-orange-500'
  if (frequency < 350) return 'bg-yellow-500'
  if (frequency < 500) return 'bg-green-500'
  return 'bg-blue-500'
}

// Cents to tuning indicator
const getTuningIndicator = (cents) => {
  if (cents === undefined || cents === null) return { text: '', color: 'text-slate-400' }
  if (Math.abs(cents) <= 5) return { text: '●', color: 'text-green-400' }
  if (cents > 0) return { text: '♯', color: cents > 20 ? 'text-red-400' : 'text-yellow-400' }
  return { text: '♭', color: cents < -20 ? 'text-red-400' : 'text-yellow-400' }
}

const formatTime = (seconds) => {
  const mins = Math.floor(seconds / 60).toString().padStart(2, '0')
  const secs = (seconds % 60).toString().padStart(2, '0')
  return `${mins}:${secs}`
}

function LiveRecorderPanel({ darkMode, expanded = false, onToggleExpand }) {
  const {
    isListening,
    isRecording,
    currentNote,
    detectedNotes,
    pitchData,
    error,
    settings,
    startListening,
    stopListening,
    clearNotes,
    updateSettings,
    // Recording
    recordingTime,
    currentRecordingUrl,
    saveRecording,
    clearRecording,
    clearAll,
    // Quantization
    quantization,
    currentBeat,
    setTempo,
    setGridDivision,
    tapTempo,
    toggleQuantization,
    // Sync
    syncToEditor,
    setSyncToEditor,
  } = useAudioContext()

  const [isSaving, setIsSaving] = useState(false)
  const [toast, setToast] = useState(null)
  const [showSettings, setShowSettings] = useState(false)

  const showToast = (message, type = 'success') => {
    setToast({ message, type })
    setTimeout(() => setToast(null), 3000)
  }

  const handleSaveRecording = async () => {
    if (!currentRecordingUrl) return
    setIsSaving(true)
    try {
      const filename = await saveRecording()
      if (filename) {
        showToast(`Recording saved as ${filename}`, 'success')
      } else {
        showToast('Error saving recording', 'error')
      }
    } catch (err) {
      showToast('Error saving recording', 'error')
    }
    setIsSaving(false)
  }

  // Compact panel (for inline mode)
  if (!expanded) {
    return (
      <div className={`overflow-hidden rounded-[26px] border shadow-xl backdrop-blur-2xl transition-all duration-300 ${
        darkMode 
          ? 'border-white/10 bg-slate-950/70 shadow-black/20' 
          : 'border-white/80 bg-white/78 shadow-slate-900/8'
      }`}>
        <div className="px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {/* Status indicator */}
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center relative ${
              isListening 
                ? 'bg-gradient-to-br from-green-500 to-emerald-600' 
                : darkMode ? 'bg-white/10' : 'bg-slate-950/[0.08]'
            }`}>
              <svg className={`w-5 h-5 ${isListening ? 'text-white' : darkMode ? 'text-slate-200' : 'text-slate-700'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                  d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
              </svg>
              {isRecording && (
                <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full animate-pulse"></span>
              )}
            </div>

            {/* Current note / status */}
            <div>
              <div className="flex items-center gap-2">
                <span className={`text-sm font-medium ${darkMode ? 'text-white' : 'text-slate-800'}`}>
                  Live Input
                </span>
                {isListening && (
                  <span className="flex items-center gap-1 text-xs text-green-400">
                    <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
                    Active
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2">
                {currentNote ? (
                  <span className="text-xl font-bold text-green-400">
                    {currentNote.note}{currentNote.octave !== undefined && currentNote.octave}
                    {currentNote.position && (
                      <span className="text-sm text-slate-400 ml-1">
                        ({currentNote.position.string} fret {currentNote.position.fret})
                      </span>
                    )}
                  </span>
                ) : (
                  <span className={`text-sm ${darkMode ? 'text-slate-500' : 'text-slate-400'}`}>
                    {isListening ? 'Listening...' : 'Click Start to begin'}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Controls */}
          <div className="flex items-center gap-2">
            {/* Note count */}
            {detectedNotes.length > 0 && (
              <span className={`text-xs px-2 py-1 rounded-full ${
                darkMode ? 'bg-slate-700 text-slate-300' : 'bg-slate-100 text-slate-600'
              }`}>
                {detectedNotes.length} notes
              </span>
            )}

            {/* Recording timer */}
            {isRecording && (
              <div className="flex items-center gap-1 px-2 py-1 rounded-lg bg-red-500/20 border border-red-500/50">
                <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>
                <span className="text-red-400 font-mono text-xs">{formatTime(recordingTime)}</span>
              </div>
            )}

            {/* Sync toggle */}
            <button
              onClick={() => setSyncToEditor(!syncToEditor)}
              className={`p-2 rounded-lg text-xs font-medium transition-colors ${
                syncToEditor
                  ? 'bg-green-500/20 text-green-400 border border-green-500/50'
                  : darkMode 
                    ? 'bg-slate-700 text-slate-400' 
                    : 'bg-slate-100 text-slate-500'
              }`}
              title={syncToEditor ? 'Syncing to editor' : 'Not syncing to editor'}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                  d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </button>

            {/* Start/Stop button */}
            {!isListening ? (
              <button
                onClick={() => startListening(settings.enableRecording)}
                className="flex items-center gap-1.5 rounded-lg bg-emerald-500 px-4 py-2 text-sm font-medium text-white transition-all duration-200 hover:bg-emerald-600"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                    d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                </svg>
                Start
              </button>
            ) : (
              <button
                onClick={stopListening}
                className="px-4 py-2 bg-gradient-to-r from-red-500 to-rose-600 text-white font-medium rounded-lg text-sm flex items-center gap-1.5
                         hover:from-red-600 hover:to-rose-700 transition-all duration-200"
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                  <rect x="6" y="6" width="12" height="12" rx="2" />
                </svg>
                Stop
              </button>
            )}

            {/* Expand button */}
            {onToggleExpand && (
              <button
                onClick={onToggleExpand}
                className={`p-2 rounded-lg transition-colors ${
                  darkMode ? 'hover:bg-slate-700 text-slate-400' : 'hover:bg-slate-100 text-slate-500'
                }`}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
            )}
          </div>
        </div>

        {/* Toast */}
        {toast && (
          <div className={`absolute bottom-4 right-4 px-4 py-2 rounded-lg text-sm font-medium z-50 ${
            toast.type === 'success' ? 'bg-green-500 text-white' : 'bg-red-500 text-white'
          }`}>
            {toast.message}
          </div>
        )}
      </div>
    )
  }

  // Expanded panel (full features)
  return (
    <div className={`overflow-hidden rounded-[28px] border shadow-xl backdrop-blur-2xl transition-colors duration-300 ${
      darkMode 
        ? 'border-white/10 bg-slate-950/70' 
        : 'border-white/80 bg-white/78'
    }`}>
      {/* Header */}
      <div className={`px-4 py-3 border-b flex items-center justify-between ${
        darkMode ? 'border-slate-700' : 'border-slate-100'
      }`}>
        <div className="flex items-center gap-3">
          <div className={`w-8 h-8 rounded-lg flex items-center justify-center relative ${
            isListening 
              ? 'bg-gradient-to-br from-green-500 to-emerald-600' 
              : darkMode ? 'bg-white/10' : 'bg-slate-950/[0.08]'
          }`}>
            <svg className={`w-4 h-4 ${isListening ? 'text-white' : darkMode ? 'text-slate-200' : 'text-slate-700'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
            </svg>
            {isRecording && (
              <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-red-500 rounded-full animate-pulse"></span>
            )}
          </div>
          <div>
            <h3 className={`text-sm font-semibold ${darkMode ? 'text-white' : 'text-slate-800'}`}>
              Live Recording Studio
            </h3>
            <p className={`text-xs ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
              Play to generate tabs in real-time
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {isRecording && (
            <div className="flex items-center gap-1 px-2 py-1 rounded bg-red-500/20 border border-red-500/50">
              <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>
              <span className="text-red-400 font-mono text-xs">{formatTime(recordingTime)}</span>
            </div>
          )}

          <button
            onClick={() => setShowSettings(!showSettings)}
            className={`p-1.5 rounded-lg transition-colors ${
              darkMode ? 'hover:bg-slate-700 text-slate-400' : 'hover:bg-slate-100 text-slate-500'
            }`}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </button>

          {onToggleExpand && (
            <button
              onClick={onToggleExpand}
              className={`p-1.5 rounded-lg transition-colors ${
                darkMode ? 'hover:bg-slate-700 text-slate-400' : 'hover:bg-slate-100 text-slate-500'
              }`}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
              </svg>
            </button>
          )}
        </div>
      </div>

      {/* Settings Panel */}
      {showSettings && (
        <div className={`px-4 py-3 border-b ${
          darkMode ? 'border-slate-700 bg-slate-900/50' : 'border-slate-100 bg-slate-50'
        }`}>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div>
              <label className={`block text-xs font-medium mb-1 ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                Detection Sensitivity
              </label>
              <input
                type="range"
                min="0.05"
                max="0.3"
                step="0.01"
                value={settings.threshold}
                onChange={(e) => updateSettings({ threshold: parseFloat(e.target.value) })}
                className="w-full h-1.5 bg-slate-600 rounded-lg appearance-none cursor-pointer"
              />
            </div>
            <div>
              <label className={`block text-xs font-medium mb-1 ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                Enable Recording
              </label>
              <button
                onClick={() => updateSettings({ enableRecording: !settings.enableRecording })}
                className={`w-full px-2 py-1 rounded text-xs font-medium transition-colors ${
                  settings.enableRecording
                    ? 'bg-green-500/20 text-green-400 border border-green-500/50'
                    : darkMode 
                      ? 'bg-slate-700 text-slate-400 border border-slate-600' 
                      : 'bg-slate-100 text-slate-500 border border-slate-200'
                }`}
              >
                {settings.enableRecording ? '● ON' : '○ OFF'}
              </button>
            </div>
            <div>
              <label className={`block text-xs font-medium mb-1 ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                Sync to Editor
              </label>
              <button
                onClick={() => setSyncToEditor(!syncToEditor)}
                className={`w-full px-2 py-1 rounded text-xs font-medium transition-colors ${
                  syncToEditor
                    ? 'bg-indigo-500/20 text-indigo-400 border border-indigo-500/50'
                    : darkMode 
                      ? 'bg-slate-700 text-slate-400 border border-slate-600' 
                      : 'bg-slate-100 text-slate-500 border border-slate-200'
                }`}
              >
                {syncToEditor ? '● Syncing' : '○ Off'}
              </button>
            </div>
            <div>
              <label className={`block text-xs font-medium mb-1 ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                Quantization
              </label>
              <button
                onClick={toggleQuantization}
                className={`w-full px-2 py-1 rounded text-xs font-medium transition-colors ${
                  quantization.enabled
                    ? 'bg-indigo-500/20 text-indigo-400 border border-indigo-500/50'
                    : darkMode 
                      ? 'bg-slate-700 text-slate-400 border border-slate-600' 
                      : 'bg-slate-100 text-slate-500 border border-slate-200'
                }`}
              >
                {quantization.enabled ? '⊞ Snap' : '⊟ Free'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Tempo Controls */}
      <div className={`px-4 py-2 border-b flex items-center gap-4 ${
        darkMode ? 'border-slate-700' : 'border-slate-100'
      }`}>
        <div className="flex items-center gap-2">
          <button
            onClick={tapTempo}
            className={`px-2 py-1 rounded text-xs font-medium transition-all active:scale-95 ${
              darkMode ? 'bg-slate-700 text-slate-300 hover:bg-slate-600' : 'bg-slate-200 text-slate-700 hover:bg-slate-300'
            }`}
          >
            TAP
          </button>
          <div className="flex items-center">
            <button
              onClick={() => setTempo(quantization.tempo - 1)}
              className={`w-5 h-5 rounded-l flex items-center justify-center text-xs ${
                darkMode ? 'bg-slate-700 text-slate-400 hover:bg-slate-600' : 'bg-slate-200 text-slate-600 hover:bg-slate-300'
              }`}
            >
              -
            </button>
            <input
              type="number"
              min="20"
              max="300"
              value={quantization.tempo}
              onChange={(e) => setTempo(parseInt(e.target.value) || 120)}
              className={`w-12 h-5 text-center text-xs font-mono font-bold border-y ${
                darkMode ? 'bg-slate-800 text-white border-slate-600' : 'bg-white text-slate-800 border-slate-200'
              }`}
            />
            <button
              onClick={() => setTempo(quantization.tempo + 1)}
              className={`w-5 h-5 rounded-r flex items-center justify-center text-xs ${
                darkMode ? 'bg-slate-700 text-slate-400 hover:bg-slate-600' : 'bg-slate-200 text-slate-600 hover:bg-slate-300'
              }`}
            >
              +
            </button>
          </div>
          <span className={`text-xs ${darkMode ? 'text-slate-500' : 'text-slate-400'}`}>BPM</span>
        </div>

        <div className="flex items-center gap-2">
          <span className={`text-xs ${darkMode ? 'text-slate-500' : 'text-slate-400'}`}>Grid:</span>
          <select
            value={quantization.gridDivision}
            onChange={(e) => setGridDivision(e.target.value)}
            className={`px-1.5 py-0.5 rounded text-xs font-medium ${
              darkMode ? 'bg-slate-700 text-white border-slate-600' : 'bg-white text-slate-800 border-slate-200'
            } border`}
          >
            {Object.entries(GRID_DIVISIONS).map(([key]) => (
              <option key={key} value={key}>{key}</option>
            ))}
          </select>
        </div>

        {/* Beat indicator */}
        {isListening && (
          <div className="flex items-center gap-1 ml-auto">
            {Array.from({ length: TIME_SIGNATURES[quantization.timeSignature]?.beatsPerMeasure || 4 }).map((_, i) => (
              <div
                key={i}
                className={`w-2 h-2 rounded-full transition-all duration-75 ${
                  currentBeat.beat === i + 1
                    ? i === 0 
                      ? 'bg-orange-400 scale-125' 
                      : 'bg-indigo-400 scale-110'
                    : darkMode ? 'bg-slate-700' : 'bg-slate-300'
                }`}
              />
            ))}
            <span className={`text-xs font-mono ml-1 ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
              {currentBeat.measureNumber}.{currentBeat.beat}
            </span>
          </div>
        )}
      </div>

      {/* Main Content */}
      <div className="p-4">
        <div className="flex items-center gap-4">
          {/* Audio Level */}
          <div className="flex flex-col items-center">
            <div className={`w-6 h-24 rounded-full overflow-hidden flex flex-col-reverse ${
              darkMode ? 'bg-slate-700' : 'bg-slate-200'
            }`}>
              <div 
                className={`w-full transition-all duration-75 ${getFrequencyColor(pitchData.frequency)}`}
                style={{ height: `${(pitchData.rms || 0) * 100}%` }}
              />
            </div>
          </div>

          {/* Note Display */}
          <div className="flex-1">
            <div className={`text-center p-4 rounded-xl ${
              isListening 
                ? currentNote 
                  ? 'bg-gradient-to-br from-green-500/10 to-emerald-600/10 border border-green-500/50' 
                  : 'bg-gradient-to-br from-indigo-500/10 to-purple-600/10 border border-indigo-500/30'
                : darkMode 
                  ? 'bg-slate-700/50 border border-slate-600' 
                  : 'bg-slate-100 border border-slate-200'
            }`}>
              <div className={`text-3xl font-bold ${
                currentNote ? 'text-green-400' : darkMode ? 'text-slate-500' : 'text-slate-400'
              }`}>
                {currentNote?.note || pitchData.note || '--'}
                {currentNote?.octave !== undefined && (
                  <span className="text-xl">{currentNote.octave}</span>
                )}
              </div>
              {currentNote?.position && (
                <div className={`text-sm mt-1 ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                  String {currentNote.position.string} • Fret {currentNote.position.fret}
                </div>
              )}
              {currentNote?.cents !== undefined && (
                <div className={`text-sm font-medium mt-1 ${getTuningIndicator(currentNote.cents).color}`}>
                  {getTuningIndicator(currentNote.cents).text} {Math.abs(currentNote.cents)}¢
                </div>
              )}
            </div>
          </div>

          {/* Fret display */}
          {currentNote?.position && (
            <div className={`w-16 h-24 rounded-xl flex flex-col items-center justify-center ${
              darkMode ? 'bg-slate-700' : 'bg-slate-100'
            }`}>
              <div className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-slate-800'}`}>
                {currentNote.position.fret}
              </div>
              <div className={`text-sm font-medium ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                {currentNote.position.string}
              </div>
            </div>
          )}
        </div>

        {/* Recording playback */}
        {!isListening && currentRecordingUrl && (
          <div className={`mt-4 p-3 rounded-xl ${darkMode ? 'bg-slate-700/50' : 'bg-slate-100'}`}>
            <audio controls src={currentRecordingUrl} className="w-full h-8" />
            <div className="flex gap-2 mt-2">
              <button
                onClick={handleSaveRecording}
                disabled={isSaving}
                className="flex-1 px-3 py-1.5 bg-gradient-to-r from-green-500 to-emerald-600 text-white font-medium rounded text-xs"
              >
                {isSaving ? 'Saving...' : 'Save Recording'}
              </button>
              <button
                onClick={clearRecording}
                className={`px-3 py-1.5 rounded text-xs font-medium ${
                  darkMode ? 'bg-slate-600 text-white' : 'bg-slate-200 text-slate-700'
                }`}
              >
                Discard
              </button>
            </div>
          </div>
        )}

        {/* Control Buttons */}
        <div className="flex gap-2 justify-center mt-4">
          {!isListening ? (
            <button
              onClick={() => startListening(settings.enableRecording)}
              className="px-6 py-2 bg-gradient-to-r from-green-500 to-emerald-600 text-white font-medium rounded-lg text-sm
                       hover:from-green-600 hover:to-emerald-700 transition-all duration-200 flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                  d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
              </svg>
              Start {settings.enableRecording ? '& Record' : ''}
            </button>
          ) : (
            <button
              onClick={stopListening}
              className="px-6 py-2 bg-gradient-to-r from-red-500 to-rose-600 text-white font-medium rounded-lg text-sm
                       hover:from-red-600 hover:to-rose-700 transition-all duration-200 flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                <rect x="6" y="6" width="12" height="12" rx="2" />
              </svg>
              Stop
            </button>
          )}

          {detectedNotes.length > 0 && (
            <button
              onClick={clearAll}
              className={`px-4 py-2 rounded-lg font-medium text-sm ${
                darkMode ? 'bg-slate-700 text-white hover:bg-slate-600' : 'bg-slate-200 text-slate-700 hover:bg-slate-300'
              }`}
            >
              Clear ({detectedNotes.length})
            </button>
          )}
        </div>

        {/* Error display */}
        {error && (
          <div className="mt-3 p-3 bg-red-500/20 border border-red-500/50 rounded-lg text-red-400 text-xs text-center">
            {error}
          </div>
        )}
      </div>

      {/* Toast */}
      {toast && (
        <div className={`absolute bottom-4 right-4 px-4 py-2 rounded-lg text-sm font-medium z-50 ${
          toast.type === 'success' ? 'bg-green-500 text-white' : 'bg-red-500 text-white'
        }`}>
          {toast.message}
        </div>
      )}
    </div>
  )
}

export default LiveRecorderPanel
