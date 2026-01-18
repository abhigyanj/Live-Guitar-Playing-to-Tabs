/**
 * Beat Quantization Utility
 * 
 * Handles tempo-based timing and snapping notes to a quantization grid.
 * This module provides tools for:
 * - Converting timestamps to beat positions
 * - Snapping notes to the nearest grid division
 * - Managing tempo and time signatures
 * - Calculating rhythmic values
 */

/**
 * Grid division definitions
 * Each division specifies how many of that note fit in one beat (quarter note)
 */
export const GRID_DIVISIONS = {
  '1/1': { label: 'Whole', divisor: 0.25, beatsPerNote: 4 },
  '1/2': { label: 'Half', divisor: 0.5, beatsPerNote: 2 },
  '1/4': { label: 'Quarter', divisor: 1, beatsPerNote: 1 },
  '1/8': { label: 'Eighth', divisor: 2, beatsPerNote: 0.5 },
  '1/16': { label: 'Sixteenth', divisor: 4, beatsPerNote: 0.25 },
  '1/32': { label: 'Thirty-second', divisor: 8, beatsPerNote: 0.125 },
  '1/4T': { label: 'Quarter Triplet', divisor: 1.5, beatsPerNote: 0.667 },
  '1/8T': { label: 'Eighth Triplet', divisor: 3, beatsPerNote: 0.333 },
  '1/16T': { label: 'Sixteenth Triplet', divisor: 6, beatsPerNote: 0.167 },
}

/**
 * Common time signatures
 */
export const TIME_SIGNATURES = {
  '4/4': { beatsPerMeasure: 4, beatUnit: 4, name: 'Common Time' },
  '3/4': { beatsPerMeasure: 3, beatUnit: 4, name: 'Waltz Time' },
  '2/4': { beatsPerMeasure: 2, beatUnit: 4, name: 'March Time' },
  '6/8': { beatsPerMeasure: 6, beatUnit: 8, name: 'Compound Duple' },
  '12/8': { beatsPerMeasure: 12, beatUnit: 8, name: 'Compound Quadruple' },
}

/**
 * QuantizationEngine Class
 * 
 * Core engine for beat quantization and timing calculations.
 */
export class QuantizationEngine {
  constructor(options = {}) {
    this.tempo = options.tempo || 120 // BPM
    this.gridDivision = options.gridDivision || '1/8'
    this.timeSignature = options.timeSignature || '4/4'
    this.enabled = options.enabled !== false
    this.strength = options.strength || 1.0 // 0-1, how strongly to snap (1 = full snap)
    
    // Session timing
    this.sessionStartTime = null
    this.lastBeatTime = null
    
    // Tap tempo tracking
    this.tapTimes = []
    this.maxTapHistory = 4
    
    this._updateDerivedValues()
  }

  /**
   * Calculate derived timing values from tempo and grid settings
   */
  _updateDerivedValues() {
    // Milliseconds per beat (quarter note)
    this.msPerBeat = 60000 / this.tempo
    
    // Get grid division info
    const division = GRID_DIVISIONS[this.gridDivision] || GRID_DIVISIONS['1/8']
    
    // Milliseconds per grid unit
    this.msPerGridUnit = this.msPerBeat / division.divisor
    
    // Time signature info
    const timeSig = TIME_SIGNATURES[this.timeSignature] || TIME_SIGNATURES['4/4']
    this.beatsPerMeasure = timeSig.beatsPerMeasure
    this.msPerMeasure = this.msPerBeat * this.beatsPerMeasure
  }

  /**
   * Set tempo in BPM
   */
  setTempo(bpm) {
    this.tempo = Math.max(20, Math.min(300, bpm))
    this._updateDerivedValues()
  }

  /**
   * Set grid division
   */
  setGridDivision(division) {
    if (GRID_DIVISIONS[division]) {
      this.gridDivision = division
      this._updateDerivedValues()
    }
  }

  /**
   * Set time signature
   */
  setTimeSignature(signature) {
    if (TIME_SIGNATURES[signature]) {
      this.timeSignature = signature
      this._updateDerivedValues()
    }
  }

  /**
   * Start a new quantization session
   * @param {number} startTime - Timestamp when session started (performance.now())
   */
  startSession(startTime = performance.now()) {
    this.sessionStartTime = startTime
    this.lastBeatTime = startTime
  }

  /**
   * End the current session
   */
  endSession() {
    this.sessionStartTime = null
    this.lastBeatTime = null
  }

  /**
   * Get elapsed time since session start
   */
  getElapsedTime(currentTime = performance.now()) {
    if (!this.sessionStartTime) return 0
    return currentTime - this.sessionStartTime
  }

  /**
   * Convert a timestamp to beat position
   * @param {number} timestamp - The timestamp to convert
   * @returns {object} Beat position info
   */
  timestampToBeatPosition(timestamp) {
    const elapsed = timestamp - (this.sessionStartTime || 0)
    
    const totalBeats = elapsed / this.msPerBeat
    const measureNumber = Math.floor(totalBeats / this.beatsPerMeasure) + 1
    const beatInMeasure = (totalBeats % this.beatsPerMeasure) + 1
    const gridPosition = elapsed / this.msPerGridUnit
    
    return {
      totalBeats,
      measureNumber,
      beatInMeasure: Math.floor(beatInMeasure),
      beatFraction: beatInMeasure % 1,
      gridPosition: Math.round(gridPosition),
      elapsedMs: elapsed,
    }
  }

  /**
   * Quantize a timestamp to the nearest grid position
   * @param {number} timestamp - The timestamp to quantize
   * @returns {object} Quantized timing info
   */
  quantize(timestamp) {
    if (!this.enabled || !this.sessionStartTime) {
      return {
        originalTime: timestamp,
        quantizedTime: timestamp,
        beatPosition: this.timestampToBeatPosition(timestamp),
        wasQuantized: false,
        offset: 0,
      }
    }

    const elapsed = timestamp - this.sessionStartTime
    
    // Calculate the nearest grid position
    const gridUnits = elapsed / this.msPerGridUnit
    const nearestGridUnit = Math.round(gridUnits)
    const quantizedElapsed = nearestGridUnit * this.msPerGridUnit
    
    // Apply strength (soft quantization)
    const finalElapsed = elapsed + (quantizedElapsed - elapsed) * this.strength
    const quantizedTimestamp = this.sessionStartTime + finalElapsed
    
    // Calculate the offset (how much the note was shifted)
    const offset = quantizedElapsed - elapsed
    
    return {
      originalTime: timestamp,
      quantizedTime: quantizedTimestamp,
      beatPosition: this.timestampToBeatPosition(quantizedTimestamp),
      gridUnit: nearestGridUnit,
      wasQuantized: true,
      offset, // Positive = pushed forward, negative = pulled back
      offsetMs: Math.abs(offset),
      division: this.gridDivision,
    }
  }

  /**
   * Check if we're currently on a beat
   * @param {number} tolerance - Tolerance in milliseconds
   */
  isOnBeat(timestamp = performance.now(), tolerance = 50) {
    if (!this.sessionStartTime) return false
    
    const elapsed = timestamp - this.sessionStartTime
    const beatPosition = elapsed % this.msPerBeat
    
    // Check if we're within tolerance of a beat
    return beatPosition < tolerance || beatPosition > (this.msPerBeat - tolerance)
  }

  /**
   * Check if we're on the downbeat (first beat of measure)
   */
  isOnDownbeat(timestamp = performance.now(), tolerance = 50) {
    if (!this.sessionStartTime) return false
    
    const elapsed = timestamp - this.sessionStartTime
    const measurePosition = elapsed % this.msPerMeasure
    
    return measurePosition < tolerance || measurePosition > (this.msPerMeasure - tolerance)
  }

  /**
   * Get the current beat number (for metronome/visualization)
   */
  getCurrentBeat(timestamp = performance.now()) {
    if (!this.sessionStartTime) return { beat: 1, isDownbeat: true, phase: 0 }
    
    const elapsed = timestamp - this.sessionStartTime
    const totalBeats = elapsed / this.msPerBeat
    const beatInMeasure = Math.floor(totalBeats % this.beatsPerMeasure) + 1
    const phase = (elapsed % this.msPerBeat) / this.msPerBeat // 0-1 within beat
    
    return {
      beat: beatInMeasure,
      totalBeats: Math.floor(totalBeats),
      isDownbeat: beatInMeasure === 1,
      phase,
      measureNumber: Math.floor(totalBeats / this.beatsPerMeasure) + 1,
    }
  }

  /**
   * Tap tempo - call this on each tap to calculate BPM
   */
  tapTempo() {
    const now = performance.now()
    
    // If too much time passed since last tap, reset
    if (this.tapTimes.length > 0) {
      const lastTap = this.tapTimes[this.tapTimes.length - 1]
      if (now - lastTap > 2000) {
        this.tapTimes = []
      }
    }
    
    this.tapTimes.push(now)
    
    // Keep only recent taps
    if (this.tapTimes.length > this.maxTapHistory) {
      this.tapTimes.shift()
    }
    
    // Calculate BPM if we have enough taps
    if (this.tapTimes.length >= 2) {
      const intervals = []
      for (let i = 1; i < this.tapTimes.length; i++) {
        intervals.push(this.tapTimes[i] - this.tapTimes[i - 1])
      }
      const avgInterval = intervals.reduce((a, b) => a + b, 0) / intervals.length
      const bpm = Math.round(60000 / avgInterval)
      this.setTempo(bpm)
      return bpm
    }
    
    return this.tempo
  }

  /**
   * Reset tap tempo history
   */
  resetTapTempo() {
    this.tapTimes = []
  }

  /**
   * Get timing info for display
   */
  getTimingInfo() {
    return {
      tempo: this.tempo,
      gridDivision: this.gridDivision,
      gridLabel: GRID_DIVISIONS[this.gridDivision]?.label || this.gridDivision,
      timeSignature: this.timeSignature,
      msPerBeat: this.msPerBeat,
      msPerGridUnit: this.msPerGridUnit,
      msPerMeasure: this.msPerMeasure,
      enabled: this.enabled,
      strength: this.strength,
    }
  }

  /**
   * Create a serializable state for saving
   */
  toJSON() {
    return {
      tempo: this.tempo,
      gridDivision: this.gridDivision,
      timeSignature: this.timeSignature,
      enabled: this.enabled,
      strength: this.strength,
    }
  }

  /**
   * Restore from saved state
   */
  fromJSON(data) {
    if (data.tempo) this.setTempo(data.tempo)
    if (data.gridDivision) this.setGridDivision(data.gridDivision)
    if (data.timeSignature) this.setTimeSignature(data.timeSignature)
    if (typeof data.enabled === 'boolean') this.enabled = data.enabled
    if (typeof data.strength === 'number') this.strength = data.strength
    return this
  }
}

/**
 * RhythmAnalyzer Class
 * 
 * Analyzes note timing patterns to suggest tempo and detect rhythmic patterns.
 */
export class RhythmAnalyzer {
  constructor() {
    this.noteTimings = []
    this.intervalHistory = []
  }

  /**
   * Add a note timing for analysis
   */
  addNote(timestamp) {
    this.noteTimings.push(timestamp)
    
    // Calculate interval from previous note
    if (this.noteTimings.length >= 2) {
      const interval = timestamp - this.noteTimings[this.noteTimings.length - 2]
      this.intervalHistory.push(interval)
    }
  }

  /**
   * Suggest a tempo based on note intervals
   */
  suggestTempo() {
    if (this.intervalHistory.length < 3) return null
    
    // Get recent intervals (last 20)
    const recentIntervals = this.intervalHistory.slice(-20)
    
    // Find common intervals using clustering
    const clusters = this._clusterIntervals(recentIntervals)
    
    if (clusters.length === 0) return null
    
    // Find the most common interval cluster
    const dominantCluster = clusters.reduce((a, b) => 
      a.count > b.count ? a : b
    )
    
    // Convert to BPM (assuming the interval represents an eighth note or quarter note)
    const intervalMs = dominantCluster.center
    
    // Try different note values to find a reasonable tempo
    const possibleTempos = [
      { bpm: Math.round(60000 / intervalMs), note: '1/4' },
      { bpm: Math.round(30000 / intervalMs), note: '1/2' },
      { bpm: Math.round(120000 / intervalMs), note: '1/8' },
      { bpm: Math.round(240000 / intervalMs), note: '1/16' },
    ]
    
    // Find the tempo closest to a "normal" range (60-180 BPM)
    const bestTempo = possibleTempos.reduce((best, current) => {
      const bestScore = Math.abs(120 - best.bpm)
      const currentScore = Math.abs(120 - current.bpm)
      return currentScore < bestScore && current.bpm >= 40 && current.bpm <= 200 
        ? current 
        : best
    })
    
    return {
      tempo: bestTempo.bpm,
      suggestedGrid: bestTempo.note,
      confidence: Math.min(1, dominantCluster.count / recentIntervals.length),
      sampleSize: recentIntervals.length,
    }
  }

  /**
   * Cluster intervals to find patterns
   */
  _clusterIntervals(intervals, tolerance = 50) {
    if (intervals.length === 0) return []
    
    const clusters = []
    const sorted = [...intervals].sort((a, b) => a - b)
    
    let currentCluster = { center: sorted[0], sum: sorted[0], count: 1 }
    
    for (let i = 1; i < sorted.length; i++) {
      if (sorted[i] - currentCluster.center < tolerance) {
        currentCluster.sum += sorted[i]
        currentCluster.count++
        currentCluster.center = currentCluster.sum / currentCluster.count
      } else {
        if (currentCluster.count >= 2) {
          clusters.push({ ...currentCluster })
        }
        currentCluster = { center: sorted[i], sum: sorted[i], count: 1 }
      }
    }
    
    if (currentCluster.count >= 2) {
      clusters.push(currentCluster)
    }
    
    return clusters
  }

  /**
   * Clear analysis history
   */
  clear() {
    this.noteTimings = []
    this.intervalHistory = []
  }
}

/**
 * Convert grid position to tab notation duration
 */
export function gridToTabDuration(gridDivision) {
  const mapping = {
    '1/1': 'w',   // whole
    '1/2': 'h',   // half
    '1/4': 'q',   // quarter
    '1/8': 'e',   // eighth
    '1/16': 's', // sixteenth
    '1/32': 't', // thirty-second
    '1/4T': 'qt', // quarter triplet
    '1/8T': 'et', // eighth triplet
    '1/16T': 'st', // sixteenth triplet
  }
  return mapping[gridDivision] || 'e'
}

/**
 * Format beat position for display
 */
export function formatBeatPosition(beatPosition) {
  const { measureNumber, beatInMeasure, beatFraction } = beatPosition
  
  // Format subdivision
  let subdivision = ''
  if (beatFraction > 0.125 && beatFraction < 0.375) subdivision = '+'
  else if (beatFraction >= 0.375 && beatFraction < 0.625) subdivision = '&'
  else if (beatFraction >= 0.625 && beatFraction < 0.875) subdivision = 'a'
  
  return `${measureNumber}.${beatInMeasure}${subdivision}`
}

/**
 * Calculate time until next beat
 */
export function msUntilNextBeat(currentTime, sessionStart, tempo) {
  const msPerBeat = 60000 / tempo
  const elapsed = currentTime - sessionStart
  const currentBeatPosition = elapsed % msPerBeat
  return msPerBeat - currentBeatPosition
}

export default QuantizationEngine
