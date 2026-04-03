import { useState, useRef, useEffect } from 'react'
import axios from 'axios'
import { API_URL } from '../config/api'

function AudioRecorder({ darkMode }) {
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
    <div className="space-y-6">
      {/* Recorder Card */}
      <div className={`rounded-2xl shadow-xl overflow-hidden transition-colors duration-300 ${
        darkMode 
          ? 'bg-slate-800/50 border border-slate-700 shadow-slate-900/50' 
          : 'bg-white border border-slate-200 shadow-slate-200/50'
      }`}>
        <div className={`px-6 py-4 border-b ${darkMode ? 'border-slate-700' : 'border-slate-100'}`}>
          <h2 className={`text-lg font-semibold ${darkMode ? 'text-white' : 'text-slate-800'}`}>Audio Recorder</h2>
        </div>

        <div className="p-8 flex flex-col items-center">
          {/* Record Button */}
          <div className="relative">
            <button
              className={`w-32 h-32 rounded-full flex items-center justify-center transition-all duration-300 ${
                isRecording 
                  ? 'bg-gradient-to-br from-red-500 to-rose-600 shadow-lg shadow-red-500/30' 
                  : 'bg-gradient-to-br from-indigo-500 to-purple-600 shadow-lg shadow-indigo-500/30 hover:shadow-indigo-500/50'
              }`}
              onClick={isRecording ? stopRecording : startRecording}
              style={{
                transform: isRecording ? `scale(${1 + audioLevel * 0.1})` : 'scale(1)'
              }}
            >
              {isRecording ? (
                <div className="w-8 h-8 bg-white rounded-sm"></div>
              ) : (
                <svg className="w-12 h-12 text-white" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3z"/>
                  <path d="M17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z"/>
                </svg>
              )}
            </button>
            
            {/* Animated rings when recording */}
            {isRecording && (
              <>
                <div className="absolute inset-0 rounded-full border-4 border-red-300 animate-ping opacity-20"></div>
                <div className="absolute inset-0 rounded-full border-4 border-red-400 animate-pulse opacity-40"></div>
              </>
            )}
          </div>

          {/* Timer */}
          <div className={`mt-6 text-4xl font-mono font-bold ${darkMode ? 'text-white' : 'text-slate-800'}`}>
            {formatTime(recordingTime)}
          </div>

          {/* Status */}
          <div className="mt-2 flex items-center gap-2">
            {isRecording ? (
              <>
                <span className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></span>
                <span className="text-sm font-medium text-red-400">Recording...</span>
              </>
            ) : (
              <span className={`text-sm ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>Click to start recording</span>
            )}
          </div>

          {/* Control Button */}
          <div className="mt-8">
            {isRecording ? (
              <button 
                className="px-8 py-3 bg-gradient-to-r from-red-500 to-rose-600 text-white font-medium rounded-xl shadow-lg shadow-red-500/25 transition-all duration-200 hover:shadow-red-500/40"
                onClick={stopRecording}
              >
                Stop Recording
              </button>
            ) : (
              <button 
                className="px-8 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-medium rounded-xl shadow-lg shadow-indigo-500/25 transition-all duration-200 hover:shadow-indigo-500/40"
                onClick={startRecording}
              >
                Start Recording
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Recordings Card */}
      <div className={`rounded-2xl shadow-xl overflow-hidden transition-colors duration-300 ${
        darkMode 
          ? 'bg-slate-800/50 border border-slate-700' 
          : 'bg-white border border-slate-200'
      }`}>
        <div className={`px-6 py-4 border-b flex items-center justify-between ${darkMode ? 'border-slate-700' : 'border-slate-100'}`}>
          <h2 className={`text-lg font-semibold ${darkMode ? 'text-white' : 'text-slate-800'}`}>Saved Recordings</h2>
          <span className={`text-sm px-3 py-1 rounded-full ${
            darkMode ? 'text-slate-300 bg-slate-700' : 'text-slate-500 bg-slate-100'
          }`}>
            {recordings.length} files
          </span>
        </div>

        {recordings.length === 0 ? (
          <div className="p-12 text-center">
            <div className={`w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center ${
              darkMode ? 'bg-slate-700' : 'bg-slate-100'
            }`}>
              <svg className={`w-8 h-8 ${darkMode ? 'text-slate-500' : 'text-slate-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
              </svg>
            </div>
            <p className={`font-medium ${darkMode ? 'text-slate-200' : 'text-slate-600'}`}>No recordings yet</p>
            <p className={`text-sm mt-1 ${darkMode ? 'text-slate-500' : 'text-slate-400'}`}>Start recording to see your audio files here</p>
          </div>
        ) : (
          <div className={`divide-y ${darkMode ? 'divide-slate-700' : 'divide-slate-100'}`}>
            {recordings.map((filename, index) => (
              <div key={index} className={`p-4 transition-colors ${darkMode ? 'hover:bg-slate-700/50' : 'hover:bg-slate-50'}`}>
                <div className="flex items-center gap-4">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
                    darkMode ? 'bg-indigo-500/20' : 'bg-gradient-to-br from-indigo-100 to-purple-100'
                  }`}>
                    <svg className="w-5 h-5 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
                    </svg>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-medium truncate ${darkMode ? 'text-slate-200' : 'text-slate-700'}`}>{filename}</p>
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

      {/* Toast */}
      {toast && (
        <div className={`fixed bottom-6 right-6 px-5 py-3 rounded-xl shadow-2xl text-white font-medium 
          flex items-center gap-2 animate-in slide-in-from-bottom-5 fade-in duration-300 ${
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

export default AudioRecorder
