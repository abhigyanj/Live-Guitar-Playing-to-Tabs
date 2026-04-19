import { useState, useRef, useCallback, useEffect } from 'react'
import { AudioTranscriber } from '../utils/pitchDetection'
import { QuantizationEngine, RhythmAnalyzer, GRID_DIVISIONS, TIME_SIGNATURES } from '../utils/quantization'
import axios from 'axios'
import { API_URL } from '../config/api'

/**
 * React hook for real-time audio transcription with recording and quantization
 * 
 * Usage:
 * const {
 *   isListening,
 *   isRecording,
 *   currentNote,
 *   detectedNotes,
 *   startListening,
 *   stopListening,
 *   clearNotes,
 *   pitchData,
 *   settings,
 *   updateSettings,
 *   recordings,
 *   recordingTime,
 *   currentRecordingBlob,
 *   // Quantization
 *   quantization,
 *   currentBeat,
 *   tapTempo,
 *   setTempo,
 *   setGridDivision,
 *   toggleQuantization
 * } = useAudioTranscription()
 */
export function useAudioTranscription(options = {}) {
  // State
  const [isListening, setIsListening] = useState(false)
  const [isRecording, setIsRecording] = useState(false)
  const [currentNote, setCurrentNote] = useState(null)
  const [detectedNotes, setDetectedNotes] = useState([])
  const [pitchData, setPitchData] = useState({
    frequency: null,
    probability: 0,
    note: null,
    rms: 0
  })
  const [error, setError] = useState(null)
  const [settings, setSettings] = useState({
    threshold: 0.15,
    probabilityThreshold: 0.7,
    noteHoldThreshold: 80,
    autoAddToTab: false,
    enableRecording: true,
    ...options.initialSettings
  })
  
  // Recording state
  const [recordings, setRecordings] = useState([])
  const [recordingTime, setRecordingTime] = useState(0)
  const [currentRecordingBlob, setCurrentRecordingBlob] = useState(null)
  const [currentRecordingUrl, setCurrentRecordingUrl] = useState(null)

  // Quantization state
  const [quantization, setQuantization] = useState({
    enabled: true,
    tempo: 120,
    gridDivision: '1/8',
    timeSignature: '4/4',
    strength: 1.0,
  })
  const [currentBeat, setCurrentBeat] = useState({
    beat: 1,
    totalBeats: 0,
    isDownbeat: true,
    phase: 0,
    measureNumber: 1,
  })
  const [suggestedTempo, setSuggestedTempo] = useState(null)

  // Refs
  const transcriberRef = useRef(null)
  const notesRef = useRef([])
  const mediaRecorderRef = useRef(null)
  const audioChunksRef = useRef([])
  const timerRef = useRef(null)
  const mediaStreamRef = useRef(null)
  const quantizerRef = useRef(null)
  const rhythmAnalyzerRef = useRef(null)
  const beatUpdateRef = useRef(null)

  // Load saved recordings on mount
  useEffect(() => {
    loadRecordings()
  }, [])

  // Initialize quantization engine
  useEffect(() => {
    quantizerRef.current = new QuantizationEngine(quantization)
    rhythmAnalyzerRef.current = new RhythmAnalyzer()
    
    return () => {
      if (beatUpdateRef.current) {
        cancelAnimationFrame(beatUpdateRef.current)
      }
    }
  }, [])

  // Update quantizer when settings change
  useEffect(() => {
    if (quantizerRef.current) {
      quantizerRef.current.setTempo(quantization.tempo)
      quantizerRef.current.setGridDivision(quantization.gridDivision)
      quantizerRef.current.setTimeSignature(quantization.timeSignature)
      quantizerRef.current.enabled = quantization.enabled
      quantizerRef.current.strength = quantization.strength
    }
  }, [quantization])

  const loadRecordings = async () => {
    try {
      const response = await axios.get(`${API_URL}/get-recordings`)
      setRecordings(Array.isArray(response.data?.recordings) ? response.data.recordings : [])
    } catch (error) {
      console.error('Error loading recordings:', error)
      setRecordings([])
    }
  }

  // Callbacks
  const handlePitchDetected = useCallback((data) => {
    setPitchData(data)
  }, [])

  const handleNoteDetected = useCallback((noteData, isNewNote) => {
    // Add timestamp for rhythm analysis
    const timestamp = performance.now()
    
    // Apply quantization if enabled
    let quantizedNote = { ...noteData, timestamp }
    
    if (quantizerRef.current && quantizerRef.current.sessionStartTime) {
      const quantResult = quantizerRef.current.quantize(timestamp)
      quantizedNote = {
        ...noteData,
        timestamp,
        quantization: quantResult,
        beatPosition: quantResult.beatPosition,
        gridUnit: quantResult.gridUnit,
      }
      
      // Add to rhythm analyzer for tempo detection
      if (rhythmAnalyzerRef.current) {
        rhythmAnalyzerRef.current.addNote(timestamp)
        
        // Periodically suggest tempo based on playing
        if (notesRef.current.length > 0 && notesRef.current.length % 8 === 0) {
          const suggestion = rhythmAnalyzerRef.current.suggestTempo()
          if (suggestion && suggestion.confidence > 0.5) {
            setSuggestedTempo(suggestion)
          }
        }
      }
    }
    
    setCurrentNote(quantizedNote)
    
    if (isNewNote) {
      setDetectedNotes(prev => {
        const newNotes = [...prev, quantizedNote]
        notesRef.current = newNotes
        return newNotes
      })
      
      if (options.onNoteDetected) {
        options.onNoteDetected(quantizedNote)
      }
    }
  }, [options])

  const handleError = useCallback((err) => {
    setError(err.message || 'Microphone access denied')
    setIsListening(false)
    setIsRecording(false)
  }, [])

  // Initialize transcriber
  useEffect(() => {
    transcriberRef.current = new AudioTranscriber({
      onPitchDetected: handlePitchDetected,
      onNoteDetected: handleNoteDetected,
      onError: handleError,
      ...settings
    })

    return () => {
      if (transcriberRef.current) {
        transcriberRef.current.stop()
      }
      if (timerRef.current) {
        clearInterval(timerRef.current)
      }
    }
  }, [])

  // Update transcriber settings when they change
  useEffect(() => {
    if (transcriberRef.current) {
      transcriberRef.current.updateSettings(settings)
    }
  }, [settings])

  // Start listening and optionally recording
  const startListening = useCallback(async (enableRecording = true) => {
    if (!transcriberRef.current) return false
    
    setError(null)
    setCurrentRecordingBlob(null)
    setCurrentRecordingUrl(null)
    
    try {
      // Get microphone stream
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: false,
          noiseSuppression: false,
          autoGainControl: false
        }
      })
      
      mediaStreamRef.current = stream
      
      // Start transcription
      const success = await transcriberRef.current.start()
      if (!success) {
        stream.getTracks().forEach(track => track.stop())
        return false
      }
      
      setIsListening(true)
      
      // Start quantization session
      if (quantizerRef.current) {
        quantizerRef.current.startSession()
        
        // Clear rhythm analyzer
        if (rhythmAnalyzerRef.current) {
          rhythmAnalyzerRef.current.clear()
        }
        setSuggestedTempo(null)
        
        // Start beat update loop for visual metronome
        const updateBeat = () => {
          if (quantizerRef.current && quantizerRef.current.sessionStartTime) {
            const beat = quantizerRef.current.getCurrentBeat()
            setCurrentBeat(beat)
          }
          beatUpdateRef.current = requestAnimationFrame(updateBeat)
        }
        updateBeat()
      }
      
      // Start recording if enabled
      if (enableRecording && settings.enableRecording) {
        const mediaRecorder = new MediaRecorder(stream)
        mediaRecorderRef.current = mediaRecorder
        audioChunksRef.current = []
        
        mediaRecorder.ondataavailable = (event) => {
          if (event.data.size > 0) {
            audioChunksRef.current.push(event.data)
          }
        }
        
        mediaRecorder.onstop = () => {
          const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' })
          setCurrentRecordingBlob(audioBlob)
          setCurrentRecordingUrl(URL.createObjectURL(audioBlob))
        }
        
        mediaRecorder.start()
        setIsRecording(true)
        setRecordingTime(0)
        
        // Start timer
        timerRef.current = setInterval(() => {
          setRecordingTime(prev => prev + 1)
        }, 1000)
      }
      
      return true
    } catch (err) {
      handleError(err)
      return false
    }
  }, [settings.enableRecording, handleError])

  // Stop listening and recording
  const stopListening = useCallback(() => {
    // Stop transcription
    if (transcriberRef.current) {
      transcriberRef.current.stop()
    }
    
    // Stop quantization session
    if (quantizerRef.current) {
      quantizerRef.current.endSession()
    }
    
    // Stop beat update loop
    if (beatUpdateRef.current) {
      cancelAnimationFrame(beatUpdateRef.current)
      beatUpdateRef.current = null
    }
    
    // Stop recording
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop()
    }
    
    // Stop timer
    if (timerRef.current) {
      clearInterval(timerRef.current)
      timerRef.current = null
    }
    
    // Stop media stream
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach(track => track.stop())
      mediaStreamRef.current = null
    }
    
    setIsListening(false)
    setIsRecording(false)
    setCurrentNote(null)
    setPitchData({ frequency: null, probability: 0, note: null, rms: 0 })
    setCurrentBeat({ beat: 1, totalBeats: 0, isDownbeat: true, phase: 0, measureNumber: 1 })
  }, [isRecording])

  // Save the current recording
  const saveRecording = useCallback(async () => {
    if (!currentRecordingBlob) return null
    
    try {
      const reader = new FileReader()
      return new Promise((resolve, reject) => {
        reader.onloadend = async () => {
          try {
            const base64data = reader.result
            const response = await axios.post(`${API_URL}/save-recording`, {
              audio_data: base64data
            })
            await loadRecordings()
            resolve(response.data.filename)
          } catch (err) {
            reject(err)
          }
        }
        reader.onerror = reject
        reader.readAsDataURL(currentRecordingBlob)
      })
    } catch (error) {
      console.error('Error saving recording:', error)
      return null
    }
  }, [currentRecordingBlob])

  // Clear detected notes
  const clearNotes = useCallback(() => {
    setDetectedNotes([])
    notesRef.current = []
    if (transcriberRef.current) {
      transcriberRef.current.clearHistory()
    }
  }, [])

  // Clear recording
  const clearRecording = useCallback(() => {
    if (currentRecordingUrl) {
      URL.revokeObjectURL(currentRecordingUrl)
    }
    setCurrentRecordingBlob(null)
    setCurrentRecordingUrl(null)
    setRecordingTime(0)
  }, [currentRecordingUrl])

  // Clear everything
  const clearAll = useCallback(() => {
    clearNotes()
    clearRecording()
  }, [clearNotes, clearRecording])

  // Update settings
  const updateSettings = useCallback((newSettings) => {
    setSettings(prev => ({ ...prev, ...newSettings }))
  }, [])

  // Get notes as tab format with quantization info
  const getNotesAsTabData = useCallback(() => {
    const notes = notesRef.current
    if (notes.length === 0) return null

    const STRINGS = ['e', 'B', 'G', 'D', 'A', 'E']
    const tabData = {}
    STRINGS.forEach(str => {
      tabData[str] = []
    })

    notes.forEach(note => {
      if (note.position) {
        STRINGS.forEach(str => {
          if (str === note.position.string) {
            tabData[str].push(note.position.fret.toString())
          } else {
            tabData[str].push('')
          }
        })
      }
    })

    return tabData
  }, [])

  // Get notes with full timing data (for rhythm export)
  const getNotesWithTiming = useCallback(() => {
    return notesRef.current.map(note => ({
      ...note,
      beatPosition: note.beatPosition,
      gridUnit: note.gridUnit,
    }))
  }, [])

  // ============ Quantization Controls ============

  // Set tempo
  const setTempo = useCallback((bpm) => {
    setQuantization(prev => ({ ...prev, tempo: Math.max(20, Math.min(300, bpm)) }))
  }, [])

  // Set grid division
  const setGridDivision = useCallback((division) => {
    if (GRID_DIVISIONS[division]) {
      setQuantization(prev => ({ ...prev, gridDivision: division }))
    }
  }, [])

  // Set time signature
  const setTimeSignature = useCallback((signature) => {
    if (TIME_SIGNATURES[signature]) {
      setQuantization(prev => ({ ...prev, timeSignature: signature }))
    }
  }, [])

  // Toggle quantization
  const toggleQuantization = useCallback(() => {
    setQuantization(prev => ({ ...prev, enabled: !prev.enabled }))
  }, [])

  // Set quantization strength
  const setQuantizationStrength = useCallback((strength) => {
    setQuantization(prev => ({ ...prev, strength: Math.max(0, Math.min(1, strength)) }))
  }, [])

  // Tap tempo
  const tapTempo = useCallback(() => {
    if (quantizerRef.current) {
      const newBpm = quantizerRef.current.tapTempo()
      setQuantization(prev => ({ ...prev, tempo: newBpm }))
      return newBpm
    }
    return null
  }, [])

  // Accept suggested tempo
  const acceptSuggestedTempo = useCallback(() => {
    if (suggestedTempo) {
      setTempo(suggestedTempo.tempo)
      if (suggestedTempo.suggestedGrid) {
        setGridDivision(suggestedTempo.suggestedGrid)
      }
      setSuggestedTempo(null)
    }
  }, [suggestedTempo, setTempo])

  // Dismiss suggested tempo
  const dismissSuggestedTempo = useCallback(() => {
    setSuggestedTempo(null)
  }, [])

  return {
    // Transcription
    isListening,
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
    getNotesWithTiming,
    
    // Recording
    isRecording,
    recordings,
    recordingTime,
    currentRecordingBlob,
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
    GRID_DIVISIONS,
    TIME_SIGNATURES,
  }
}

export default useAudioTranscription
