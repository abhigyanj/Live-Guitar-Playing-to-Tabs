import { useState, useEffect, useRef, useCallback } from 'react'
import { useAudioTranscription } from '../hooks/useAudioTranscription'
import { GRID_DIVISIONS, TIME_SIGNATURES } from '../utils/quantization'
import { API_URL } from '../config/api'

const STRINGS = ['e', 'B', 'G', 'D', 'A', 'E']

// Frequency to color mapping for visual feedback
const getFrequencyColor = (frequency) => {
  if (!frequency) return 'bg-slate-600'
  if (frequency < 150) return 'bg-red-500'      // Low notes
  if (frequency < 250) return 'bg-orange-500'   // Mid-low
  if (frequency < 350) return 'bg-yellow-500'   // Mid
  if (frequency < 500) return 'bg-green-500'    // Mid-high
  return 'bg-blue-500'                          // High notes
}

// Cents to tuning indicator
const getTuningIndicator = (cents) => {
  if (cents === undefined || cents === null) return { text: '', color: 'text-slate-400' }
  if (Math.abs(cents) <= 5) return { text: '●', color: 'text-green-400' }
  if (cents > 0) return { text: '♯', color: cents > 20 ? 'text-red-400' : 'text-yellow-400' }
  return { text: '♭', color: cents < -20 ? 'text-red-400' : 'text-yellow-400' }
}

// Format time display
const formatTime = (seconds) => {
  const mins = Math.floor(seconds / 60).toString().padStart(2, '0')
  const secs = (seconds % 60).toString().padStart(2, '0')
  return `${mins}:${secs}`
}

function LiveTranscription({ darkMode, onNotesGenerated }) {
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
    getNotesAsTabData,
    // Recording
    recordings,
    recordingTime,
    currentRecordingUrl,
    saveRecording,
    clearRecording,
    clearAll,
    loadRecordings,
    // Quantization
    quantization,
    currentBeat,
    suggestedTempo,
    setTempo,
    setGridDivision,
    setTimeSignature,
    toggleQuantization,
    setQuantizationStrength,
    tapTempo,
    acceptSuggestedTempo,
    dismissSuggestedTempo,
  } = useAudioTranscription()

  const [showSettings, setShowSettings] = useState(false)
  const [showQuantization, setShowQuantization] = useState(false)
  const [tabPreview, setTabPreview] = useState(() => {
    const initial = {}
    STRINGS.forEach(str => { initial[str] = [] })
    return initial
  })
  const [isExporting, setIsExporting] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [toast, setToast] = useState(null)
  const [activeTab, setActiveTab] = useState('live') // 'live' or 'recordings'
  const scrollRef = useRef(null)
  const lastTapRef = useRef(null)

  // Update tab preview when notes change
  useEffect(() => {
    if (detectedNotes.length > 0) {
      const newTabData = {}
      STRINGS.forEach(str => { newTabData[str] = [] })

      detectedNotes.forEach(note => {
        if (note.position) {
          STRINGS.forEach(str => {
            if (str === note.position.string) {
              newTabData[str].push(note.position.fret.toString())
            } else {
              newTabData[str].push('')
            }
          })
        }
      })

      setTabPreview(newTabData)
    }
  }, [detectedNotes])

  // Auto-scroll to latest notes
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollLeft = scrollRef.current.scrollWidth
    }
  }, [tabPreview])

  const showToast = (message, type = 'success') => {
    setToast({ message, type })
    setTimeout(() => setToast(null), 3000)
  }

  // Export to tab editor
  const exportToTabEditor = useCallback(() => {
    if (onNotesGenerated && detectedNotes.length > 0) {
      const tabData = getNotesAsTabData()
      onNotesGenerated(tabData, detectedNotes)
      setIsExporting(true)
      setTimeout(() => setIsExporting(false), 1500)
    }
  }, [onNotesGenerated, detectedNotes, getNotesAsTabData])

  // Save recording and tab
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

  // Generate tab text for display
  const generateTabText = () => {
    if (Object.values(tabPreview).every(arr => arr.length === 0)) {
      return null
    }

    return STRINGS.map(str => {
      const frets = tabPreview[str].map(f => {
        if (f === '') return '--'
        if (f.length === 1) return '-' + f
        return f
      }).join('-')
      return `${str}|${frets}|`
    }).join('\n')
  }

  return (
    <div className="space-y-6">
      {/* Main Transcription Card */}
      <div className={`rounded-2xl shadow-xl overflow-hidden transition-colors duration-300 ${
        darkMode 
          ? 'bg-slate-800/50 border border-slate-700 shadow-slate-900/50' 
          : 'bg-white border border-slate-200 shadow-slate-200/50'
      }`}>
        {/* Header */}
        <div className={`px-6 py-4 border-b flex items-center justify-between ${
          darkMode ? 'border-slate-700' : 'border-slate-100'
        }`}>
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center relative ${
              isListening 
                ? 'bg-gradient-to-br from-green-500 to-emerald-600' 
                : 'bg-gradient-to-br from-indigo-500 to-purple-600'
            }`}>
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                  d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
              </svg>
              {isRecording && (
                <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full animate-pulse"></span>
              )}
            </div>
            <div>
              <h2 className={`text-lg font-semibold ${darkMode ? 'text-white' : 'text-slate-800'}`}>
                Live Transcription & Recording
              </h2>
              <p className={`text-xs ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                Play guitar to generate tabs and record audio simultaneously
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            {/* Recording Timer */}
            {isRecording && (
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-red-500/20 border border-red-500/50">
                <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>
                <span className="text-red-400 font-mono text-sm font-medium">
                  {formatTime(recordingTime)}
                </span>
              </div>
            )}
            
            <button
              onClick={() => setShowSettings(!showSettings)}
              className={`p-2 rounded-lg transition-colors ${
                darkMode 
                  ? 'hover:bg-slate-700 text-slate-400' 
                  : 'hover:bg-slate-100 text-slate-500'
              }`}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                  d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className={`px-6 py-2 border-b ${darkMode ? 'border-slate-700' : 'border-slate-100'}`}>
          <div className="flex gap-1">
            <button
              onClick={() => setActiveTab('live')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeTab === 'live'
                  ? 'bg-gradient-to-r from-green-500 to-emerald-600 text-white'
                  : darkMode ? 'text-slate-400 hover:text-white hover:bg-slate-700' : 'text-slate-500 hover:text-slate-800 hover:bg-slate-100'
              }`}
            >
              <span className="flex items-center gap-2">
                <span className={`w-2 h-2 rounded-full ${isListening ? 'bg-green-400 animate-pulse' : 'bg-slate-500'}`}></span>
                Live Session
              </span>
            </button>
            <button
              onClick={() => { setActiveTab('recordings'); loadRecordings(); }}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeTab === 'recordings'
                  ? 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white'
                  : darkMode ? 'text-slate-400 hover:text-white hover:bg-slate-700' : 'text-slate-500 hover:text-slate-800 hover:bg-slate-100'
              }`}
            >
              <span className="flex items-center gap-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"/>
                </svg>
                Recordings ({recordings.length})
              </span>
            </button>
          </div>
        </div>

        {/* Settings Panel */}
        {showSettings && (
          <div className={`px-6 py-4 border-b ${
            darkMode ? 'border-slate-700 bg-slate-900/50' : 'border-slate-100 bg-slate-50'
          }`}>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className={`block text-xs font-medium mb-1.5 ${
                  darkMode ? 'text-slate-400' : 'text-slate-600'
                }`}>
                  Detection Sensitivity
                </label>
                <input
                  type="range"
                  min="0.05"
                  max="0.3"
                  step="0.01"
                  value={settings.threshold}
                  onChange={(e) => updateSettings({ threshold: parseFloat(e.target.value) })}
                  className="w-full h-2 bg-slate-600 rounded-lg appearance-none cursor-pointer"
                />
                <div className="flex justify-between text-xs mt-1">
                  <span className={darkMode ? 'text-slate-500' : 'text-slate-400'}>Strict</span>
                  <span className={darkMode ? 'text-slate-500' : 'text-slate-400'}>Loose</span>
                </div>
              </div>

              <div>
                <label className={`block text-xs font-medium mb-1.5 ${
                  darkMode ? 'text-slate-400' : 'text-slate-600'
                }`}>
                  Confidence Threshold
                </label>
                <input
                  type="range"
                  min="0.5"
                  max="0.95"
                  step="0.05"
                  value={settings.probabilityThreshold}
                  onChange={(e) => updateSettings({ probabilityThreshold: parseFloat(e.target.value) })}
                  className="w-full h-2 bg-slate-600 rounded-lg appearance-none cursor-pointer"
                />
                <div className="flex justify-between text-xs mt-1">
                  <span className={darkMode ? 'text-slate-500' : 'text-slate-400'}>Low</span>
                  <span className={darkMode ? 'text-slate-500' : 'text-slate-400'}>High</span>
                </div>
              </div>

              <div>
                <label className={`block text-xs font-medium mb-1.5 ${
                  darkMode ? 'text-slate-400' : 'text-slate-600'
                }`}>
                  Note Hold Time (ms)
                </label>
                <input
                  type="number"
                  min="30"
                  max="200"
                  value={settings.noteHoldThreshold}
                  onChange={(e) => updateSettings({ noteHoldThreshold: parseInt(e.target.value) })}
                  className={`w-full px-3 py-1.5 rounded-lg text-sm ${
                    darkMode 
                      ? 'bg-slate-700 text-white border-slate-600' 
                      : 'bg-white text-slate-800 border-slate-200'
                  } border`}
                />
              </div>

              <div>
                <label className={`block text-xs font-medium mb-1.5 ${
                  darkMode ? 'text-slate-400' : 'text-slate-600'
                }`}>
                  Enable Recording
                </label>
                <button
                  onClick={() => updateSettings({ enableRecording: !settings.enableRecording })}
                  className={`w-full px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                    settings.enableRecording
                      ? 'bg-green-500/20 text-green-400 border border-green-500/50'
                      : darkMode 
                        ? 'bg-slate-700 text-slate-400 border border-slate-600' 
                        : 'bg-slate-100 text-slate-500 border border-slate-200'
                  }`}
                >
                  {settings.enableRecording ? '● Recording ON' : '○ Recording OFF'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Beat Quantization Panel */}
        <div className={`px-6 py-3 border-b flex items-center justify-between ${
          darkMode ? 'border-slate-700 bg-slate-800/30' : 'border-slate-100 bg-slate-50/50'
        }`}>
          <div className="flex items-center gap-4">
            {/* Tempo Display & Controls */}
            <div className="flex items-center gap-2">
              <button
                onClick={tapTempo}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all active:scale-95 ${
                  darkMode 
                    ? 'bg-slate-700 text-slate-300 hover:bg-slate-600' 
                    : 'bg-slate-200 text-slate-700 hover:bg-slate-300'
                }`}
              >
                TAP
              </button>
              <div className="flex items-center">
                <button
                  onClick={() => setTempo(quantization.tempo - 1)}
                  className={`w-6 h-6 rounded-l flex items-center justify-center ${
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
                  className={`w-14 h-6 text-center text-sm font-mono font-bold border-y ${
                    darkMode 
                      ? 'bg-slate-800 text-white border-slate-600' 
                      : 'bg-white text-slate-800 border-slate-200'
                  }`}
                />
                <button
                  onClick={() => setTempo(quantization.tempo + 1)}
                  className={`w-6 h-6 rounded-r flex items-center justify-center ${
                    darkMode ? 'bg-slate-700 text-slate-400 hover:bg-slate-600' : 'bg-slate-200 text-slate-600 hover:bg-slate-300'
                  }`}
                >
                  +
                </button>
              </div>
              <span className={`text-xs ${darkMode ? 'text-slate-500' : 'text-slate-400'}`}>BPM</span>
            </div>

            {/* Grid Division Selector */}
            <div className="flex items-center gap-2">
              <span className={`text-xs ${darkMode ? 'text-slate-500' : 'text-slate-400'}`}>Grid:</span>
              <select
                value={quantization.gridDivision}
                onChange={(e) => setGridDivision(e.target.value)}
                className={`px-2 py-1 rounded text-xs font-medium ${
                  darkMode 
                    ? 'bg-slate-700 text-white border-slate-600' 
                    : 'bg-white text-slate-800 border-slate-200'
                } border`}
              >
                {Object.entries(GRID_DIVISIONS).map(([key, { label }]) => (
                  <option key={key} value={key}>{key} ({label})</option>
                ))}
              </select>
            </div>

            {/* Time Signature */}
            <div className="flex items-center gap-2">
              <span className={`text-xs ${darkMode ? 'text-slate-500' : 'text-slate-400'}`}>Time:</span>
              <select
                value={quantization.timeSignature}
                onChange={(e) => setTimeSignature(e.target.value)}
                className={`px-2 py-1 rounded text-xs font-medium ${
                  darkMode 
                    ? 'bg-slate-700 text-white border-slate-600' 
                    : 'bg-white text-slate-800 border-slate-200'
                } border`}
              >
                {Object.entries(TIME_SIGNATURES).map(([key, { name }]) => (
                  <option key={key} value={key}>{key}</option>
                ))}
              </select>
            </div>

            {/* Quantization Toggle */}
            <button
              onClick={toggleQuantization}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                quantization.enabled
                  ? 'bg-indigo-500/20 text-indigo-400 border border-indigo-500/50'
                  : darkMode 
                    ? 'bg-slate-700 text-slate-500 border border-slate-600' 
                    : 'bg-slate-200 text-slate-400 border border-slate-200'
              }`}
            >
              {quantization.enabled ? '⊞ Snap ON' : '⊟ Snap OFF'}
            </button>
          </div>

          {/* Beat Indicator (Visual Metronome) */}
          {isListening && (
            <div className="flex items-center gap-2">
              <div className="flex gap-1">
                {Array.from({ length: TIME_SIGNATURES[quantization.timeSignature]?.beatsPerMeasure || 4 }).map((_, i) => (
                  <div
                    key={i}
                    className={`w-3 h-3 rounded-full transition-all duration-75 ${
                      currentBeat.beat === i + 1
                        ? i === 0 
                          ? 'bg-orange-400 scale-125 shadow-lg shadow-orange-500/50' 
                          : 'bg-indigo-400 scale-110 shadow-lg shadow-indigo-500/50'
                        : darkMode ? 'bg-slate-700' : 'bg-slate-300'
                    }`}
                  />
                ))}
              </div>
              <span className={`text-xs font-mono ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                {currentBeat.measureNumber}.{currentBeat.beat}
              </span>
            </div>
          )}
        </div>

        {/* Suggested Tempo Banner */}
        {suggestedTempo && (
          <div className={`px-6 py-2 flex items-center justify-between ${
            darkMode ? 'bg-yellow-500/10 border-b border-yellow-500/30' : 'bg-yellow-50 border-b border-yellow-200'
          }`}>
            <div className="flex items-center gap-2">
              <svg className="w-4 h-4 text-yellow-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
              <span className={`text-xs ${darkMode ? 'text-yellow-400' : 'text-yellow-700'}`}>
                Detected tempo: <strong>{suggestedTempo.tempo} BPM</strong> 
                {suggestedTempo.suggestedGrid && ` (${suggestedTempo.suggestedGrid})`}
                <span className="opacity-60 ml-1">({Math.round(suggestedTempo.confidence * 100)}% confidence)</span>
              </span>
            </div>
            <div className="flex gap-2">
              <button
                onClick={acceptSuggestedTempo}
                className="px-2 py-1 text-xs rounded bg-yellow-500/20 text-yellow-400 hover:bg-yellow-500/30 transition-colors"
              >
                Apply
              </button>
              <button
                onClick={dismissSuggestedTempo}
                className={`px-2 py-1 text-xs rounded transition-colors ${
                  darkMode ? 'text-slate-400 hover:bg-slate-700' : 'text-slate-500 hover:bg-slate-200'
                }`}
              >
                Dismiss
              </button>
            </div>
          </div>
        )}

        {/* Live Session Tab */}
        {activeTab === 'live' && (
          <div className="p-6">
            {/* Main Pitch Visualization */}
            <div className="flex items-center justify-center gap-8 mb-6">
              {/* Audio Level Meter */}
              <div className="flex flex-col items-center">
                <div className="w-8 h-32 bg-slate-700 rounded-full overflow-hidden flex flex-col-reverse">
                  <div 
                    className={`w-full transition-all duration-75 ${getFrequencyColor(pitchData.frequency)}`}
                    style={{ height: `${(pitchData.rms || 0) * 100}%` }}
                  />
                </div>
                <span className={`text-xs mt-2 ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                  Level
                </span>
              </div>

              {/* Main Note Display */}
              <div className="text-center">
                <div className={`w-40 h-40 rounded-full flex items-center justify-center ${
                  isListening 
                    ? currentNote 
                      ? 'bg-gradient-to-br from-green-500/20 to-emerald-600/20 border-2 border-green-500' 
                      : 'bg-gradient-to-br from-indigo-500/20 to-purple-600/20 border-2 border-indigo-500/50 animate-pulse'
                    : darkMode 
                      ? 'bg-slate-700/50 border-2 border-slate-600' 
                      : 'bg-slate-100 border-2 border-slate-200'
                }`}>
                  <div>
                    <div className={`text-5xl font-bold ${
                      currentNote 
                        ? 'text-green-400' 
                        : darkMode ? 'text-slate-500' : 'text-slate-400'
                    }`}>
                      {currentNote?.note || pitchData.note || '--'}
                      {currentNote?.octave !== undefined && (
                        <span className="text-2xl">{currentNote.octave}</span>
                      )}
                    </div>
                    {pitchData.frequency && (
                      <div className={`text-sm ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                        {pitchData.frequency} Hz
                      </div>
                    )}
                    {currentNote?.cents !== undefined && (
                      <div className={`text-lg font-medium ${getTuningIndicator(currentNote.cents).color}`}>
                        {getTuningIndicator(currentNote.cents).text} {Math.abs(currentNote.cents)}¢
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Fret Position Display */}
              <div className="flex flex-col items-center">
                {currentNote?.position ? (
                  <div className={`w-20 h-32 rounded-xl flex flex-col items-center justify-center ${
                    darkMode ? 'bg-slate-700' : 'bg-slate-100'
                  }`}>
                    <div className={`text-4xl font-bold ${
                      darkMode ? 'text-white' : 'text-slate-800'
                    }`}>
                      {currentNote.position.fret}
                    </div>
                    <div className={`text-lg font-medium ${
                      darkMode ? 'text-slate-400' : 'text-slate-500'
                    }`}>
                      {currentNote.position.string}
                    </div>
                    <div className={`text-xs ${darkMode ? 'text-slate-500' : 'text-slate-400'}`}>
                      string
                    </div>
                  </div>
                ) : (
                  <div className={`w-20 h-32 rounded-xl flex items-center justify-center ${
                    darkMode ? 'bg-slate-700/50' : 'bg-slate-100'
                  }`}>
                    <span className={`text-xs ${darkMode ? 'text-slate-500' : 'text-slate-400'}`}>
                      No note
                    </span>
                  </div>
                )}
                <span className={`text-xs mt-2 ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                  Position
                </span>
              </div>
            </div>

            {/* Confidence Bar */}
            <div className="mb-6">
              <div className="flex justify-between text-xs mb-1">
                <span className={darkMode ? 'text-slate-400' : 'text-slate-500'}>Detection Confidence</span>
                <span className={darkMode ? 'text-slate-400' : 'text-slate-500'}>
                  {Math.round((pitchData.probability || 0) * 100)}%
                </span>
              </div>
              <div className={`h-2 rounded-full overflow-hidden ${
                darkMode ? 'bg-slate-700' : 'bg-slate-200'
              }`}>
                <div 
                  className={`h-full transition-all duration-100 ${
                    pitchData.probability > 0.8 ? 'bg-green-500' :
                    pitchData.probability > 0.6 ? 'bg-yellow-500' : 'bg-red-500'
                  }`}
                  style={{ width: `${(pitchData.probability || 0) * 100}%` }}
                />
              </div>
            </div>

            {/* Recording Playback (when stopped) */}
            {!isListening && currentRecordingUrl && (
              <div className={`mb-6 p-4 rounded-xl ${darkMode ? 'bg-slate-700/50' : 'bg-slate-100'}`}>
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-8 h-8 rounded-lg bg-red-500/20 flex items-center justify-center">
                    <svg className="w-4 h-4 text-red-400" fill="currentColor" viewBox="0 0 24 24">
                      <circle cx="12" cy="12" r="10"/>
                    </svg>
                  </div>
                  <div>
                    <p className={`text-sm font-medium ${darkMode ? 'text-white' : 'text-slate-800'}`}>
                      Session Recording
                    </p>
                    <p className={`text-xs ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                      Duration: {formatTime(recordingTime)}
                    </p>
                  </div>
                </div>
                <audio 
                  controls 
                  src={currentRecordingUrl}
                  className="w-full h-10"
                />
                <div className="flex gap-2 mt-3">
                  <button
                    onClick={handleSaveRecording}
                    disabled={isSaving}
                    className="flex-1 px-4 py-2 bg-gradient-to-r from-green-500 to-emerald-600 text-white font-medium rounded-lg text-sm
                             hover:from-green-600 hover:to-emerald-700 transition-all duration-200 flex items-center justify-center gap-2"
                  >
                    {isSaving ? (
                      <>
                        <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
                        </svg>
                        Saving...
                      </>
                    ) : (
                      <>
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4"/>
                        </svg>
                        Save Recording
                      </>
                    )}
                  </button>
                  <button
                    onClick={clearRecording}
                    className={`px-4 py-2 rounded-lg text-sm font-medium ${
                      darkMode 
                        ? 'bg-slate-600 text-white hover:bg-slate-500' 
                        : 'bg-slate-200 text-slate-700 hover:bg-slate-300'
                    }`}
                  >
                    Discard
                  </button>
                </div>
              </div>
            )}

            {/* Control Buttons */}
            <div className="flex gap-3 justify-center flex-wrap">
              {!isListening ? (
                <button
                  onClick={() => startListening(settings.enableRecording)}
                  className="px-8 py-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white font-medium rounded-xl shadow-lg shadow-green-500/25 hover:shadow-green-500/40 transition-all duration-200 flex items-center gap-2"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                      d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                  </svg>
                  Start {settings.enableRecording ? '& Record' : 'Listening'}
                </button>
              ) : (
                <button
                  onClick={stopListening}
                  className="px-8 py-3 bg-gradient-to-r from-red-500 to-rose-600 text-white font-medium rounded-xl shadow-lg shadow-red-500/25 hover:shadow-red-500/40 transition-all duration-200 flex items-center gap-2"
                >
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <rect x="6" y="6" width="12" height="12" rx="2" />
                  </svg>
                  Stop
                </button>
              )}

              <button
                onClick={clearAll}
                disabled={detectedNotes.length === 0 && !currentRecordingUrl}
                className={`px-4 py-3 rounded-xl font-medium transition-all duration-200 ${
                  detectedNotes.length === 0 && !currentRecordingUrl
                    ? darkMode ? 'bg-slate-700 text-slate-500' : 'bg-slate-100 text-slate-400'
                    : darkMode 
                      ? 'bg-slate-700 text-white hover:bg-slate-600' 
                      : 'bg-slate-200 text-slate-700 hover:bg-slate-300'
                }`}
              >
                Clear All
              </button>

              {onNotesGenerated && (
                <button
                  onClick={exportToTabEditor}
                  disabled={detectedNotes.length === 0}
                  className={`px-4 py-3 rounded-xl font-medium transition-all duration-200 flex items-center gap-2 ${
                    detectedNotes.length === 0
                      ? darkMode ? 'bg-slate-700 text-slate-500' : 'bg-slate-100 text-slate-400'
                      : isExporting
                        ? 'bg-green-500 text-white'
                        : 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-lg shadow-indigo-500/25 hover:shadow-indigo-500/40'
                  }`}
                >
                  {isExporting ? (
                    <>
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      Exported!
                    </>
                  ) : (
                    <>
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                          d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                      </svg>
                      Send to Editor
                    </>
                  )}
                </button>
              )}
            </div>

            {/* Error Display */}
            {error && (
              <div className="mt-4 p-4 bg-red-500/20 border border-red-500/50 rounded-xl text-red-400 text-sm text-center">
                {error}
              </div>
            )}
          </div>
        )}

        {/* Recordings Tab */}
        {activeTab === 'recordings' && (
          <div className="p-6">
            {recordings.length === 0 ? (
              <div className="text-center py-12">
                <div className={`w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center ${
                  darkMode ? 'bg-slate-700' : 'bg-slate-100'
                }`}>
                  <svg className={`w-8 h-8 ${darkMode ? 'text-slate-500' : 'text-slate-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                  </svg>
                </div>
                <p className={`font-medium ${darkMode ? 'text-slate-200' : 'text-slate-600'}`}>No recordings yet</p>
                <p className={`text-sm mt-1 ${darkMode ? 'text-slate-500' : 'text-slate-400'}`}>
                  Start a session with recording enabled to save audio
                </p>
              </div>
            ) : (
              <div className={`divide-y ${darkMode ? 'divide-slate-700' : 'divide-slate-100'}`}>
                {recordings.map((filename, index) => (
                  <div key={index} className={`py-4 ${index === 0 ? '' : ''}`}>
                    <div className="flex items-center gap-4">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
                        darkMode ? 'bg-indigo-500/20' : 'bg-gradient-to-br from-indigo-100 to-purple-100'
                      }`}>
                        <svg className="w-5 h-5 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
                        </svg>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm font-medium truncate ${darkMode ? 'text-slate-200' : 'text-slate-700'}`}>
                          {filename}
                        </p>
                        <audio 
                          controls 
                          src={`${API_URL}/recordings/${filename}`}
                          className="w-full mt-2 h-10"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Live Tab Preview Card with Rhythm */}
      {detectedNotes.length > 0 && (
        <div className={`rounded-2xl shadow-xl overflow-hidden transition-colors duration-300 ${
          darkMode 
            ? 'bg-slate-800/50 border border-slate-700' 
            : 'bg-white border border-slate-200'
        }`}>
          <div className={`px-6 py-4 border-b flex items-center justify-between ${
            darkMode ? 'border-slate-700' : 'border-slate-100'
          }`}>
            <div className="flex items-center gap-3">
              <h3 className={`font-semibold ${darkMode ? 'text-white' : 'text-slate-800'}`}>
                Live Tab Preview
              </h3>
              {quantization.enabled && (
                <span className={`text-xs px-2 py-0.5 rounded ${
                  darkMode ? 'bg-indigo-500/20 text-indigo-400' : 'bg-indigo-100 text-indigo-600'
                }`}>
                  ⊞ Quantized @ {quantization.tempo} BPM
                </span>
              )}
            </div>
            <span className={`text-sm px-3 py-1 rounded-full ${
              darkMode ? 'text-slate-300 bg-slate-700' : 'text-slate-500 bg-slate-100'
            }`}>
              {detectedNotes.length} notes
            </span>
          </div>

          {/* Beat Markers Row */}
          {quantization.enabled && detectedNotes.some(n => n.beatPosition) && (
            <div className={`px-4 pt-3 overflow-x-auto ${darkMode ? 'bg-slate-900/30' : 'bg-slate-50'}`}>
              <div className="flex items-center font-mono text-xs">
                <div className="w-4" /> {/* Spacer for string labels */}
                <div className={darkMode ? 'text-slate-600' : 'text-slate-300'}>|</div>
                {detectedNotes.map((note, idx) => {
                  const isDownbeat = note.beatPosition?.beatInMeasure === 1
                  const measureChange = idx === 0 || 
                    (detectedNotes[idx - 1]?.beatPosition?.measureNumber !== note.beatPosition?.measureNumber)
                  
                  return (
                    <div 
                      key={idx} 
                      className={`w-4 text-center ${
                        isDownbeat 
                          ? 'text-orange-400 font-bold' 
                          : darkMode ? 'text-slate-500' : 'text-slate-400'
                      }`}
                    >
                      {measureChange && note.beatPosition ? note.beatPosition.measureNumber : 
                       note.beatPosition ? note.beatPosition.beatInMeasure : '-'}
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* Tab Grid Preview */}
          <div className="p-4 overflow-x-auto" ref={scrollRef}>
            <div className={`font-mono text-sm ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>
              {STRINGS.map(str => (
                <div key={str} className="flex items-center">
                  <span className={`w-4 font-bold ${darkMode ? 'text-indigo-400' : 'text-indigo-600'}`}>
                    {str}
                  </span>
                  <span className={darkMode ? 'text-slate-500' : 'text-slate-400'}>|</span>
                  {tabPreview[str].map((fret, idx) => {
                    const note = detectedNotes[idx]
                    const isDownbeat = note?.beatPosition?.beatInMeasure === 1
                    
                    return (
                      <span 
                        key={idx}
                        className={`w-4 text-center ${
                          fret !== '' 
                            ? isDownbeat 
                              ? 'text-orange-400 font-bold' 
                              : 'text-green-400 font-bold' 
                            : darkMode ? 'text-slate-600' : 'text-slate-300'
                        }`}
                        title={note?.beatPosition ? `M${note.beatPosition.measureNumber}.${note.beatPosition.beatInMeasure}` : ''}
                      >
                        {fret !== '' ? fret : '-'}
                      </span>
                    )
                  })}
                  <span className={darkMode ? 'text-slate-500' : 'text-slate-400'}>|</span>
                </div>
              ))}
            </div>
          </div>

          {/* Rhythm Info */}
          {quantization.enabled && detectedNotes.some(n => n.beatPosition) && (
            <div className={`px-4 pb-2 flex items-center gap-4 text-xs ${
              darkMode ? 'text-slate-500' : 'text-slate-400'
            }`}>
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-orange-400"></span>
                Downbeat (measure start)
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-green-400"></span>
                Beat note
              </span>
              <span>
                Grid: {GRID_DIVISIONS[quantization.gridDivision]?.label || quantization.gridDivision}
              </span>
            </div>
          )}

          {/* Text Preview */}
          <div className={`px-4 pb-4 ${darkMode ? 'border-slate-700' : 'border-slate-100'}`}>
            <details className={`text-sm ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
              <summary className="cursor-pointer hover:text-indigo-400 transition-colors">
                Show as text
              </summary>
              <pre className={`mt-2 p-3 rounded-lg font-mono text-xs overflow-x-auto ${
                darkMode ? 'bg-slate-900 text-slate-300' : 'bg-slate-50 text-slate-700'
              }`}>
                {generateTabText()}
              </pre>
            </details>
          </div>
        </div>
      )}

      {/* Fretboard Visualization */}
      <FretboardVisualization 
        darkMode={darkMode} 
        currentNote={currentNote} 
        detectedNotes={detectedNotes.slice(-10)}
      />

      {/* Tips Card */}
      <div className={`rounded-2xl shadow-xl overflow-hidden ${
        darkMode 
          ? 'bg-slate-800/50 border border-slate-700' 
          : 'bg-white border border-slate-200'
      }`}>
        <div className={`px-6 py-4 ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>
          <h3 className={`font-semibold mb-3 ${darkMode ? 'text-white' : 'text-slate-800'}`}>
            Tips for Best Results
          </h3>
          <ul className="space-y-2 text-sm">
            <li className="flex items-start gap-2">
              <span className="text-green-400 mt-0.5">✓</span>
              Use a quiet environment with minimal background noise
            </li>
            <li className="flex items-start gap-2">
              <span className="text-green-400 mt-0.5">✓</span>
              Position your guitar close to the microphone
            </li>
            <li className="flex items-start gap-2">
              <span className="text-green-400 mt-0.5">✓</span>
              Play notes clearly and let them ring for better detection
            </li>
            <li className="flex items-start gap-2">
              <span className="text-green-400 mt-0.5">✓</span>
              Single notes work best - chords may not transcribe accurately
            </li>
            <li className="flex items-start gap-2">
              <span className="text-yellow-400 mt-0.5">!</span>
              Enable recording in settings to save your audio along with the tab
            </li>
          </ul>
        </div>
      </div>

      {/* Toast Notification */}
      {toast && (
        <div className={`fixed bottom-6 right-6 px-5 py-3 rounded-xl shadow-2xl text-white font-medium 
          flex items-center gap-2 animate-in slide-in-from-bottom-5 fade-in duration-300 z-50 ${
          toast.type === 'success' 
            ? 'bg-gradient-to-r from-emerald-500 to-teal-600' 
            : 'bg-gradient-to-r from-red-500 to-rose-600'
        }`}>
          {toast.type === 'success' ? (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7"/>
            </svg>
          ) : (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/>
            </svg>
          )}
          {toast.message}
        </div>
      )}
    </div>
  )
}

/**
 * Fretboard Visualization Component
 */
function FretboardVisualization({ darkMode, currentNote, detectedNotes }) {
  const FRETS = 12
  const STRINGS_DATA = [
    { name: 'e', note: 'E4' },
    { name: 'B', note: 'B3' },
    { name: 'G', note: 'G3' },
    { name: 'D', note: 'D3' },
    { name: 'A', note: 'A2' },
    { name: 'E', note: 'E2' },
  ]

  const FRET_MARKERS = [3, 5, 7, 9, 12]
  const DOUBLE_MARKERS = [12]

  return (
    <div className={`rounded-2xl shadow-xl overflow-hidden ${
      darkMode 
        ? 'bg-slate-800/50 border border-slate-700' 
        : 'bg-white border border-slate-200'
    }`}>
      <div className={`px-6 py-4 border-b ${darkMode ? 'border-slate-700' : 'border-slate-100'}`}>
        <h3 className={`font-semibold ${darkMode ? 'text-white' : 'text-slate-800'}`}>
          Fretboard
        </h3>
      </div>

      <div className="p-4 overflow-x-auto">
        <div className="relative min-w-[600px]">
          {/* Fret numbers */}
          <div className="flex mb-2">
            <div className="w-8" />
            {Array.from({ length: FRETS + 1 }, (_, i) => (
              <div 
                key={i}
                className={`flex-1 text-center text-xs ${
                  darkMode ? 'text-slate-500' : 'text-slate-400'
                }`}
              >
                {i}
              </div>
            ))}
          </div>

          {/* Fretboard */}
          <div className={`relative rounded-lg overflow-hidden ${
            darkMode ? 'bg-amber-900/30' : 'bg-amber-100'
          }`}>
            {/* Fret markers */}
            <div className="absolute inset-0 flex">
              <div className="w-8" />
              {Array.from({ length: FRETS + 1 }, (_, i) => (
                <div key={i} className="flex-1 flex items-center justify-center">
                  {FRET_MARKERS.includes(i) && (
                    <div className={`w-3 h-3 rounded-full ${
                      DOUBLE_MARKERS.includes(i) ? 'shadow-lg' : ''
                    } ${darkMode ? 'bg-slate-600' : 'bg-slate-300'}`} />
                  )}
                </div>
              ))}
            </div>

            {/* Strings */}
            {STRINGS_DATA.map((string, stringIdx) => (
              <div key={string.name} className="flex items-center h-8 relative">
                <div className={`w-8 text-center text-xs font-bold ${
                  darkMode ? 'text-slate-400' : 'text-slate-600'
                }`}>
                  {string.name}
                </div>

                {Array.from({ length: FRETS + 1 }, (_, fretIdx) => {
                  const isCurrentNote = currentNote?.position?.string === string.name && 
                                        currentNote?.position?.fret === fretIdx
                  const recentNote = detectedNotes.find(
                    n => n.position?.string === string.name && n.position?.fret === fretIdx
                  )

                  return (
                    <div 
                      key={fretIdx}
                      className={`flex-1 h-full flex items-center justify-center border-r relative ${
                        fretIdx === 0 
                          ? darkMode ? 'border-r-4 border-slate-400' : 'border-r-4 border-slate-600'
                          : darkMode ? 'border-slate-600' : 'border-slate-300'
                      }`}
                    >
                      <div className={`absolute inset-x-0 h-0.5 ${
                        stringIdx < 3 
                          ? darkMode ? 'bg-slate-400' : 'bg-slate-500'
                          : darkMode ? 'bg-slate-300' : 'bg-slate-400'
                      }`} style={{ height: `${1 + stringIdx * 0.3}px` }} />

                      {(isCurrentNote || recentNote) && (
                        <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold z-10 ${
                          isCurrentNote 
                            ? 'bg-green-500 text-white animate-pulse shadow-lg shadow-green-500/50' 
                            : 'bg-indigo-500/70 text-white'
                        }`}>
                          {fretIdx}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

export default LiveTranscription
