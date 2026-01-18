import { createContext, useContext, useState, useCallback, useRef, useEffect } from 'react'
import { useAudioTranscription } from '../hooks/useAudioTranscription'

const AudioRecordingContext = createContext(null)

export function AudioProvider({ children }) {
  const transcription = useAudioTranscription()
  
  // Shared state for live mode visibility
  const [isLiveModeActive, setIsLiveModeActive] = useState(false)
  const [syncToEditor, setSyncToEditor] = useState(true)
  
  // Callbacks for when notes are detected (to sync with editor)
  const noteCallbacksRef = useRef([])
  
  // Register a callback for note detection
  const onNoteDetected = useCallback((callback) => {
    noteCallbacksRef.current.push(callback)
    return () => {
      noteCallbacksRef.current = noteCallbacksRef.current.filter(cb => cb !== callback)
    }
  }, [])
  
  // Notify all listeners when a note is detected
  useEffect(() => {
    if (transcription.currentNote && syncToEditor) {
      noteCallbacksRef.current.forEach(cb => cb(transcription.currentNote))
    }
  }, [transcription.currentNote, syncToEditor])
  
  // Notify listeners of all detected notes changes
  const notesCallbacksRef = useRef([])
  
  const onNotesChanged = useCallback((callback) => {
    notesCallbacksRef.current.push(callback)
    return () => {
      notesCallbacksRef.current = notesCallbacksRef.current.filter(cb => cb !== callback)
    }
  }, [])
  
  useEffect(() => {
    if (syncToEditor) {
      notesCallbacksRef.current.forEach(cb => cb(transcription.detectedNotes))
    }
  }, [transcription.detectedNotes, syncToEditor])
  
  const value = {
    ...transcription,
    isLiveModeActive,
    setIsLiveModeActive,
    syncToEditor,
    setSyncToEditor,
    onNoteDetected,
    onNotesChanged,
  }
  
  return (
    <AudioRecordingContext.Provider value={value}>
      {children}
    </AudioRecordingContext.Provider>
  )
}

export function useAudioContext() {
  const context = useContext(AudioRecordingContext)
  if (!context) {
    throw new Error('useAudioContext must be used within an AudioProvider')
  }
  return context
}

export default AudioRecordingContext
