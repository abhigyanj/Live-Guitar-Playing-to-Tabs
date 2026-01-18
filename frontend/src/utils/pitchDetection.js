/**
 * Pitch Detection Module
 * 
 * Implements the YIN algorithm for accurate monophonic pitch detection.
 * YIN is considered one of the most accurate pitch detection algorithms
 * for musical instruments, especially guitar.
 * 
 * Reference: "YIN, a fundamental frequency estimator for speech and music"
 * by Alain de Cheveigné and Hideki Kawahara
 */

// Standard guitar tuning frequencies (Hz)
export const GUITAR_TUNING = {
  standard: {
    E2: 82.41,   // Low E (6th string)
    A2: 110.00,  // A (5th string)
    D3: 146.83,  // D (4th string)
    G3: 196.00,  // G (3rd string)
    B3: 246.94,  // B (2nd string)
    E4: 329.63,  // High E (1st string)
  }
}

// All chromatic notes with their frequencies (A4 = 440Hz standard)
export const NOTE_FREQUENCIES = generateNoteFrequencies()

function generateNoteFrequencies() {
  const notes = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B']
  const frequencies = {}
  
  // Generate frequencies for octaves 1-7 (covers guitar range and beyond)
  for (let octave = 1; octave <= 7; octave++) {
    for (let i = 0; i < notes.length; i++) {
      const note = notes[i]
      const noteName = `${note}${octave}`
      // Calculate frequency based on A4 = 440Hz
      // Each semitone is 2^(1/12) ratio
      const semitonesFromA4 = (octave - 4) * 12 + (i - 9) // A is at index 9
      frequencies[noteName] = 440 * Math.pow(2, semitonesFromA4 / 12)
    }
  }
  
  return frequencies
}

/**
 * YIN Algorithm Implementation
 * 
 * The YIN algorithm works by:
 * 1. Computing the difference function (how different the signal is from a delayed version)
 * 2. Computing the cumulative mean normalized difference function
 * 3. Finding the first minimum below a threshold (the fundamental period)
 * 4. Refining with parabolic interpolation
 */
export class PitchDetector {
  constructor(sampleRate = 44100) {
    this.sampleRate = sampleRate
    this.threshold = 0.15 // YIN threshold (lower = more strict, 0.1-0.2 recommended)
    this.probabilityThreshold = 0.7 // Minimum confidence to report a pitch
    
    // Guitar frequency range (with some margin)
    this.minFrequency = 70   // Below low E (82.41 Hz)
    this.maxFrequency = 1400 // Above highest practical fret on high E
    
    // Calculate corresponding period range (in samples)
    this.minPeriod = Math.floor(sampleRate / this.maxFrequency)
    this.maxPeriod = Math.ceil(sampleRate / this.minFrequency)
  }

  /**
   * Detect pitch from audio buffer
   * @param {Float32Array} audioBuffer - Raw audio samples
   * @returns {Object} { frequency: number|null, probability: number, note: string|null }
   */
  detect(audioBuffer) {
    if (!audioBuffer || audioBuffer.length < this.maxPeriod * 2) {
      return { frequency: null, probability: 0, note: null }
    }

    // Step 1: Check if there's enough signal (not silence)
    const rms = this.calculateRMS(audioBuffer)
    if (rms < 0.01) {
      return { frequency: null, probability: 0, note: null, rms }
    }

    // Step 2: Compute the difference function
    const yinBuffer = this.differenceFunction(audioBuffer)
    
    // Step 3: Compute cumulative mean normalized difference
    this.cumulativeMeanNormalizedDifference(yinBuffer)
    
    // Step 4: Find the first minimum below threshold (absolute threshold)
    const periodEstimate = this.absoluteThreshold(yinBuffer)
    
    if (periodEstimate === -1) {
      return { frequency: null, probability: 0, note: null, rms }
    }

    // Step 5: Parabolic interpolation for sub-sample accuracy
    const refinedPeriod = this.parabolicInterpolation(yinBuffer, periodEstimate)
    
    // Calculate frequency and probability
    const frequency = this.sampleRate / refinedPeriod
    const probability = 1 - yinBuffer[periodEstimate]
    
    // Only return if confidence is high enough
    if (probability < this.probabilityThreshold) {
      return { frequency: null, probability, note: null, rms }
    }

    // Get the musical note
    const noteInfo = this.frequencyToNote(frequency)
    
    return {
      frequency: Math.round(frequency * 100) / 100,
      probability: Math.round(probability * 100) / 100,
      note: noteInfo.note,
      octave: noteInfo.octave,
      cents: noteInfo.cents,
      rms
    }
  }

  /**
   * Calculate RMS (Root Mean Square) - measure of signal amplitude
   */
  calculateRMS(buffer) {
    let sum = 0
    for (let i = 0; i < buffer.length; i++) {
      sum += buffer[i] * buffer[i]
    }
    return Math.sqrt(sum / buffer.length)
  }

  /**
   * Step 2: Difference function
   * d(τ) = Σ (x[j] - x[j+τ])²
   */
  differenceFunction(buffer) {
    const bufferSize = buffer.length
    const yinBufferSize = Math.min(bufferSize / 2, this.maxPeriod)
    const yinBuffer = new Float32Array(yinBufferSize)
    
    for (let tau = 0; tau < yinBufferSize; tau++) {
      yinBuffer[tau] = 0
      for (let j = 0; j < yinBufferSize; j++) {
        const delta = buffer[j] - buffer[j + tau]
        yinBuffer[tau] += delta * delta
      }
    }
    
    return yinBuffer
  }

  /**
   * Step 3: Cumulative mean normalized difference
   * d'(τ) = d(τ) / ((1/τ) * Σ d(j))
   */
  cumulativeMeanNormalizedDifference(yinBuffer) {
    yinBuffer[0] = 1
    let runningSum = 0
    
    for (let tau = 1; tau < yinBuffer.length; tau++) {
      runningSum += yinBuffer[tau]
      yinBuffer[tau] *= tau / runningSum
    }
  }

  /**
   * Step 4: Absolute threshold
   * Find first value below threshold after the minimum period
   */
  absoluteThreshold(yinBuffer) {
    for (let tau = this.minPeriod; tau < yinBuffer.length; tau++) {
      if (yinBuffer[tau] < this.threshold) {
        // Look for the local minimum
        while (tau + 1 < yinBuffer.length && yinBuffer[tau + 1] < yinBuffer[tau]) {
          tau++
        }
        return tau
      }
    }
    return -1
  }

  /**
   * Step 5: Parabolic interpolation for better accuracy
   */
  parabolicInterpolation(yinBuffer, tauEstimate) {
    if (tauEstimate === 0 || tauEstimate === yinBuffer.length - 1) {
      return tauEstimate
    }
    
    const x0 = tauEstimate - 1
    const x2 = tauEstimate + 1
    
    const s0 = yinBuffer[x0]
    const s1 = yinBuffer[tauEstimate]
    const s2 = yinBuffer[x2]
    
    const denominator = 2 * (2 * s1 - s2 - s0)
    
    if (denominator === 0) {
      return tauEstimate
    }
    
    const delta = (s2 - s0) / denominator
    return tauEstimate + delta
  }

  /**
   * Convert frequency to musical note
   */
  frequencyToNote(frequency) {
    if (!frequency || frequency <= 0) {
      return { note: null, octave: null, cents: 0 }
    }

    const notes = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B']
    
    // Calculate semitones from A4 (440Hz)
    const semitones = 12 * Math.log2(frequency / 440)
    const roundedSemitones = Math.round(semitones)
    
    // Calculate cents deviation from the nearest note
    const cents = Math.round((semitones - roundedSemitones) * 100)
    
    // Calculate note and octave
    // A4 is at position 9 in the notes array (0-indexed), octave 4
    let noteIndex = (roundedSemitones % 12 + 9) % 12
    if (noteIndex < 0) noteIndex += 12
    
    // Calculate octave (A4 = 440Hz is our reference)
    let octave = 4 + Math.floor((roundedSemitones + 9) / 12)
    
    return {
      note: notes[noteIndex],
      octave,
      cents,
      fullNote: `${notes[noteIndex]}${octave}`
    }
  }
}

/**
 * Guitar-specific utilities for mapping detected notes to fret positions
 */
export class GuitarNoteMapper {
  constructor(tuning = 'standard') {
    // String frequencies in standard tuning (from high E to low E)
    this.strings = [
      { name: 'e', openFreq: 329.63, openNote: 'E4' }, // 1st string (highest)
      { name: 'B', openFreq: 246.94, openNote: 'B3' }, // 2nd string
      { name: 'G', openFreq: 196.00, openNote: 'G3' }, // 3rd string
      { name: 'D', openFreq: 146.83, openNote: 'D3' }, // 4th string
      { name: 'A', openFreq: 110.00, openNote: 'A2' }, // 5th string
      { name: 'E', openFreq: 82.41,  openNote: 'E2' }, // 6th string (lowest)
    ]
    
    this.maxFret = 24
    this.lastPositions = [] // For tracking hand position
  }

  /**
   * Convert a frequency to all possible fret positions on a guitar
   * @param {number} frequency - Detected frequency in Hz
   * @returns {Array} Array of possible positions { string, fret, distance }
   */
  frequencyToFretPositions(frequency) {
    if (!frequency || frequency < 70 || frequency > 1400) {
      return []
    }

    const positions = []

    for (let stringIdx = 0; stringIdx < this.strings.length; stringIdx++) {
      const string = this.strings[stringIdx]
      
      // Calculate fret number using: f = f0 * 2^(fret/12)
      // Therefore: fret = 12 * log2(f / f0)
      const fret = 12 * Math.log2(frequency / string.openFreq)
      const roundedFret = Math.round(fret)
      
      // Check if this is a valid fret (0-24)
      if (roundedFret >= 0 && roundedFret <= this.maxFret) {
        // Calculate how close the frequency is to the exact fret pitch
        const exactFreq = string.openFreq * Math.pow(2, roundedFret / 12)
        const centsError = 1200 * Math.log2(frequency / exactFreq)
        
        // Only include if within reasonable tuning tolerance (±50 cents)
        if (Math.abs(centsError) <= 50) {
          positions.push({
            string: string.name,
            stringIndex: stringIdx,
            fret: roundedFret,
            centsError: Math.round(centsError),
            exactFrequency: Math.round(exactFreq * 100) / 100
          })
        }
      }
    }

    return positions
  }

  /**
   * Choose the most likely fret position based on playability heuristics
   * @param {number} frequency - Detected frequency
   * @param {Object} context - Additional context like previous notes
   * @returns {Object|null} Most likely position { string, fret }
   */
  getMostLikelyPosition(frequency, context = {}) {
    const positions = this.frequencyToFretPositions(frequency)
    
    if (positions.length === 0) {
      return null
    }

    if (positions.length === 1) {
      return positions[0]
    }

    // Score each position based on playability
    const scoredPositions = positions.map(pos => {
      let score = 100

      // Prefer lower frets (easier to play, more common)
      score -= pos.fret * 2

      // Prefer middle strings (2-5) over outer strings
      const middleStringBonus = pos.stringIndex >= 1 && pos.stringIndex <= 4 ? 10 : 0
      score += middleStringBonus

      // If we have a previous position, prefer staying close
      if (context.lastPosition) {
        const fretDistance = Math.abs(pos.fret - context.lastPosition.fret)
        const stringDistance = Math.abs(pos.stringIndex - context.lastPosition.stringIndex)
        
        // Penalize large jumps
        score -= fretDistance * 3
        score -= stringDistance * 5
      }

      // Prefer positions with less tuning error
      score -= Math.abs(pos.centsError) / 10

      return { ...pos, score }
    })

    // Sort by score (highest first)
    scoredPositions.sort((a, b) => b.score - a.score)
    
    return scoredPositions[0]
  }

  /**
   * Get all notes playable at a specific fret position
   */
  getNoteAtPosition(stringName, fret) {
    const string = this.strings.find(s => s.name === stringName)
    if (!string) return null

    const frequency = string.openFreq * Math.pow(2, fret / 12)
    const detector = new PitchDetector()
    return detector.frequencyToNote(frequency)
  }
}

/**
 * Real-time audio processor using Web Audio API
 */
export class AudioTranscriber {
  constructor(options = {}) {
    this.sampleRate = options.sampleRate || 44100
    this.bufferSize = options.bufferSize || 2048
    this.smoothingTimeConstant = options.smoothingTimeConstant || 0.8
    
    this.pitchDetector = new PitchDetector(this.sampleRate)
    this.noteMapper = new GuitarNoteMapper()
    
    this.audioContext = null
    this.analyser = null
    this.mediaStream = null
    this.isListening = false
    
    this.onPitchDetected = options.onPitchDetected || (() => {})
    this.onNoteDetected = options.onNoteDetected || (() => {})
    this.onError = options.onError || console.error
    
    // For tracking note changes
    this.lastNote = null
    this.noteStartTime = null
    this.noteHoldThreshold = 80 // ms - how long a note must be held to register
    this.noteHistory = []
    this.maxHistoryLength = 50
  }

  /**
   * Start listening to audio input
   */
  async start() {
    try {
      // Request microphone access
      this.mediaStream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: false,
          noiseSuppression: false,
          autoGainControl: false,
          sampleRate: this.sampleRate
        }
      })

      // Create audio context
      this.audioContext = new (window.AudioContext || window.webkitAudioContext)({
        sampleRate: this.sampleRate
      })

      // Create analyser node
      this.analyser = this.audioContext.createAnalyser()
      this.analyser.fftSize = this.bufferSize * 2
      this.analyser.smoothingTimeConstant = this.smoothingTimeConstant

      // Connect microphone to analyser
      const source = this.audioContext.createMediaStreamSource(this.mediaStream)
      source.connect(this.analyser)

      this.isListening = true
      this.processAudio()
      
      return true
    } catch (error) {
      this.onError(error)
      return false
    }
  }

  /**
   * Stop listening
   */
  stop() {
    this.isListening = false
    
    if (this.mediaStream) {
      this.mediaStream.getTracks().forEach(track => track.stop())
      this.mediaStream = null
    }
    
    if (this.audioContext) {
      this.audioContext.close()
      this.audioContext = null
    }
    
    this.analyser = null
    this.lastNote = null
    this.noteStartTime = null
  }

  /**
   * Main audio processing loop
   */
  processAudio() {
    if (!this.isListening || !this.analyser) return

    // Get time-domain data
    const buffer = new Float32Array(this.analyser.fftSize)
    this.analyser.getFloatTimeDomainData(buffer)

    // Detect pitch
    const pitchResult = this.pitchDetector.detect(buffer)
    
    // Always report pitch data (even if no note detected)
    this.onPitchDetected(pitchResult)

    // If a note was detected, process it
    if (pitchResult.frequency && pitchResult.probability > 0.7) {
      const position = this.noteMapper.getMostLikelyPosition(
        pitchResult.frequency,
        { lastPosition: this.lastNote }
      )

      if (position) {
        const noteData = {
          ...pitchResult,
          position,
          timestamp: Date.now()
        }

        // Check if this is a new note or continuation
        const isNewNote = !this.lastNote || 
          this.lastNote.position.string !== position.string ||
          this.lastNote.position.fret !== position.fret

        if (isNewNote) {
          // New note detected
          if (this.lastNote && this.noteStartTime) {
            const duration = Date.now() - this.noteStartTime
            if (duration >= this.noteHoldThreshold) {
              // Previous note was held long enough, add to history
              this.noteHistory.push({
                ...this.lastNote,
                duration
              })
              if (this.noteHistory.length > this.maxHistoryLength) {
                this.noteHistory.shift()
              }
            }
          }
          
          this.lastNote = noteData
          this.noteStartTime = Date.now()
          this.onNoteDetected(noteData, true) // true = new note
        } else {
          // Same note continuing
          this.lastNote = noteData
          this.onNoteDetected(noteData, false) // false = continuation
        }
      }
    }

    // Schedule next frame
    requestAnimationFrame(() => this.processAudio())
  }

  /**
   * Get the note history
   */
  getNoteHistory() {
    return [...this.noteHistory]
  }

  /**
   * Clear note history
   */
  clearHistory() {
    this.noteHistory = []
    this.lastNote = null
    this.noteStartTime = null
  }

  /**
   * Update settings
   */
  updateSettings(settings) {
    if (settings.threshold !== undefined) {
      this.pitchDetector.threshold = settings.threshold
    }
    if (settings.probabilityThreshold !== undefined) {
      this.pitchDetector.probabilityThreshold = settings.probabilityThreshold
    }
    if (settings.noteHoldThreshold !== undefined) {
      this.noteHoldThreshold = settings.noteHoldThreshold
    }
  }
}

export default {
  PitchDetector,
  GuitarNoteMapper,
  AudioTranscriber,
  NOTE_FREQUENCIES,
  GUITAR_TUNING
}
