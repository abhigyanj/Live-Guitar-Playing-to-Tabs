import { useState, useRef, useEffect } from 'react'
import axios from 'axios'
import './AudioRecorder.css'

const API_URL = 'http://127.0.0.1:5000'

function AudioRecorder() {
  const [isRecording, setIsRecording] = useState(false)
  const [recordingTime, setRecordingTime] = useState(0)
  const [recordings, setRecordings] = useState([])
  const [toast, setToast] = useState(null)
  const [audioLevel, setAudioLevel] = useState(0)
  
  const mediaRecorderRef = useRef(null)
  const audioChunksRef = useRef([])
  const timerRef = useRef(null)
  const streamRef = useRef(null)
  const analyserRef = useRef(null)
  const animationRef = useRef(null)

  useEffect(() => {
    loadRecordings()
    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current)
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop())
      }
    }
  }, [])

  const loadRecordings = async () => {
    try {
      const response = await axios.get(`${API_URL}/get-recordings`)
      setRecordings(response.data.recordings)
    } catch (error) {
      console.error('Error loading recordings:', error)
    }
  }

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      streamRef.current = stream

      // Set up audio analysis for visualization
      const audioContext = new AudioContext()
      const analyser = audioContext.createAnalyser()
      const source = audioContext.createMediaStreamSource(stream)
      source.connect(analyser)
      analyser.fftSize = 256
      analyserRef.current = analyser
      
      const mediaRecorder = new MediaRecorder(stream)
      mediaRecorderRef.current = mediaRecorder
      audioChunksRef.current = []

      mediaRecorder.ondataavailable = (event) => {
        audioChunksRef.current.push(event.data)
      }

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' })
        await saveRecording(audioBlob)
        stream.getTracks().forEach(track => track.stop())
        if (animationRef.current) cancelAnimationFrame(animationRef.current)
        setAudioLevel(0)
      }

      mediaRecorder.start()
      setIsRecording(true)
      setRecordingTime(0)
      
      timerRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1)
      }, 1000)

      // Start audio level visualization
      visualize()

    } catch (error) {
      console.error('Error starting recording:', error)
      showToast('Could not access microphone', 'error')
    }
  }

  const visualize = () => {
    if (!analyserRef.current) return
    
    const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount)
    
    const update = () => {
      analyserRef.current.getByteFrequencyData(dataArray)
      const average = dataArray.reduce((a, b) => a + b) / dataArray.length
      setAudioLevel(average / 255)
      animationRef.current = requestAnimationFrame(update)
    }
    
    update()
  }

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop()
      setIsRecording(false)
      clearInterval(timerRef.current)
    }
  }

  const saveRecording = async (audioBlob) => {
    try {
      const reader = new FileReader()
      reader.onloadend = async () => {
        const base64data = reader.result
        const response = await axios.post(`${API_URL}/save-recording`, {
          audio_data: base64data
        })
        showToast(`Saved as ${response.data.filename}`, 'success')
        loadRecordings()
      }
      reader.readAsDataURL(audioBlob)
    } catch (error) {
      showToast('Error saving recording', 'error')
    }
  }

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60).toString().padStart(2, '0')
    const secs = (seconds % 60).toString().padStart(2, '0')
    return `${mins}:${secs}`
  }

  const showToast = (message, type = 'success') => {
    setToast({ message, type })
    setTimeout(() => setToast(null), 3000)
  }

  return (
    <div className="audio-recorder">
      <div className="card">
        <div className="card-header">
          <h2 className="card-title">Audio Recorder</h2>
        </div>

        <div className="recorder-container">
          <div className="recorder-visual">
            <div 
              className={`record-button ${isRecording ? 'recording' : ''}`}
              onClick={isRecording ? stopRecording : startRecording}
              style={{
                '--audio-level': audioLevel
              }}
            >
              <div className="record-button-inner">
                {isRecording ? (
                  <div className="stop-icon"></div>
                ) : (
                  <div className="mic-icon"></div>
                )}
              </div>
              {isRecording && (
                <div className="audio-rings">
                  <div className="ring ring-1"></div>
                  <div className="ring ring-2"></div>
                </div>
              )}
            </div>
          </div>

          <div className="recorder-info">
            <div className="timer">{formatTime(recordingTime)}</div>
            <div className="status">
              {isRecording ? (
                <span className="status-recording">
                  <span className="pulse-dot"></span>
                  Recording...
                </span>
              ) : (
                <span className="status-idle">Click to start recording</span>
              )}
            </div>
          </div>

          <div className="recorder-controls">
            {isRecording ? (
              <button className="btn btn-danger" onClick={stopRecording}>
                Stop Recording
              </button>
            ) : (
              <button className="btn btn-primary" onClick={startRecording}>
                Start Recording
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-header">
          <h2 className="card-title">Saved Recordings</h2>
          <span className="recording-count">{recordings.length} files</span>
        </div>

        {recordings.length === 0 ? (
          <div className="empty-state">
            <p>No recordings yet</p>
            <p className="empty-hint">Start recording to see your audio files here</p>
          </div>
        ) : (
          <div className="recordings-list">
            {recordings.map((filename, index) => (
              <div key={index} className="recording-item">
                <div className="recording-info">
                  <span className="recording-name">{filename}</span>
                </div>
                <audio 
                  controls 
                  src={`${API_URL}/recordings/${filename}`}
                  className="audio-player"
                />
              </div>
            ))}
          </div>
        )}
      </div>

      {toast && (
        <div className={`toast ${toast.type}`}>
          {toast.message}
        </div>
      )}
    </div>
  )
}

export default AudioRecorder
