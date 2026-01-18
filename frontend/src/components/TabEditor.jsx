import { useState, useEffect, useRef } from 'react'
import axios from 'axios'

const API_URL = 'http://127.0.0.1:5000'

const STRINGS = ['e', 'B', 'G', 'D', 'A', 'E']
const INITIAL_BARS = 4
const NOTES_PER_BAR = 8

function TabEditor() {
  const [bars, setBars] = useState(INITIAL_BARS)
  const [tempo, setTempo] = useState(120)
  const [timeSignature, setTimeSignature] = useState({ top: 4, bottom: 4 })
  const [sectionName, setSectionName] = useState('Intro')
  const [tabData, setTabData] = useState(() => {
    const initial = {}
    STRINGS.forEach(str => {
      initial[str] = Array(INITIAL_BARS * NOTES_PER_BAR).fill('')
    })
    return initial
  })
  const [selectedCell, setSelectedCell] = useState(null)
  const [toast, setToast] = useState(null)
  const [savedTabs, setSavedTabs] = useState([])
  const [mode, setMode] = useState('grid')
  const [textInput, setTextInput] = useState('')
  const tabRef = useRef(null)

  useEffect(() => {
    loadSavedTabs()
  }, [])

  const loadSavedTabs = async () => {
    try {
      const response = await axios.get(`${API_URL}/get-tabs`)
      setSavedTabs(response.data.tabs)
    } catch (error) {
      console.error('Error loading tabs:', error)
    }
  }

  const handleFretChange = (string, col, value) => {
    if (value !== '' && !/^[0-9]{1,2}$|^[xXhHpP\/\\]$/.test(value)) return
    if (value !== '' && !isNaN(value) && parseInt(value) > 24) return

    setTabData(prev => ({
      ...prev,
      [string]: prev[string].map((v, i) => i === col ? value : v)
    }))
  }

  const handleKeyDown = (e, stringIdx, col) => {
    const totalCols = bars * NOTES_PER_BAR
    
    if (e.key === 'ArrowRight' && col < totalCols - 1) {
      setSelectedCell({ string: stringIdx, col: col + 1 })
    } else if (e.key === 'ArrowLeft' && col > 0) {
      setSelectedCell({ string: stringIdx, col: col - 1 })
    } else if (e.key === 'ArrowDown' && stringIdx < STRINGS.length - 1) {
      setSelectedCell({ string: stringIdx + 1, col })
    } else if (e.key === 'ArrowUp' && stringIdx > 0) {
      setSelectedCell({ string: stringIdx - 1, col })
    } else if (e.key === 'Tab') {
      e.preventDefault()
      if (col < totalCols - 1) {
        setSelectedCell({ string: stringIdx, col: col + 1 })
      } else if (stringIdx < STRINGS.length - 1) {
        setSelectedCell({ string: stringIdx + 1, col: 0 })
      }
    }
  }

  const addBar = () => {
    setBars(prev => prev + 1)
    setTabData(prev => {
      const updated = {}
      STRINGS.forEach(str => {
        updated[str] = [...prev[str], ...Array(NOTES_PER_BAR).fill('')]
      })
      return updated
    })
  }

  const removeBar = () => {
    if (bars <= 1) return
    setBars(prev => prev - 1)
    setTabData(prev => {
      const updated = {}
      STRINGS.forEach(str => {
        updated[str] = prev[str].slice(0, -NOTES_PER_BAR)
      })
      return updated
    })
  }

  const clearAll = () => {
    setTabData(() => {
      const cleared = {}
      STRINGS.forEach(str => {
        cleared[str] = Array(bars * NOTES_PER_BAR).fill('')
      })
      return cleared
    })
  }

  const generateTabText = () => {
    let text = ''
    STRINGS.forEach(str => {
      const frets = tabData[str].map(f => {
        if (f === '') return '--'
        if (f.length === 1) return '-' + f
        return f
      }).join('-')
      text += `${str}|${frets}|\n`
    })
    return text
  }

  const saveTab = async () => {
    const tabText = mode === 'grid' ? generateTabText() : textInput
    
    if (!tabText.trim()) {
      showToast('Please enter some tab data first', 'error')
      return
    }

    try {
      const response = await axios.post(`${API_URL}/save-tab`, {
        tab_data: tabText,
        section_name: sectionName,
        tempo: tempo
      })
      showToast(`Saved as ${response.data.filename}`, 'success')
      loadSavedTabs()
    } catch (error) {
      showToast('Error saving tab', 'error')
    }
  }

  const showToast = (message, type = 'success') => {
    setToast({ message, type })
    setTimeout(() => setToast(null), 3000)
  }

  // Render a single bar
  const renderBar = (barIndex) => {
    const startCol = barIndex * NOTES_PER_BAR
    const endCol = startCol + NOTES_PER_BAR

    return (
      <div key={barIndex} className="flex-shrink-0">
        {/* Bar number */}
        <div className="h-6 flex items-end pb-1">
          <span className="text-xs text-slate-400 font-medium">{barIndex + 1}</span>
        </div>
        
        {/* Bar content */}
        <div className="relative border-l-2 border-r border-slate-600">
          {STRINGS.map((str, stringIdx) => (
            <div key={str} className="flex items-center h-8 relative">
              {/* String line background */}
              <div className="absolute inset-0 flex items-center">
                <div className="w-full h-px bg-slate-500"></div>
              </div>
              
              {/* Fret inputs */}
              <div className="flex relative z-10">
                {tabData[str].slice(startCol, endCol).map((fret, idx) => {
                  const col = startCol + idx
                  const isSelected = selectedCell?.string === stringIdx && selectedCell?.col === col
                  
                  return (
                    <div
                      key={col}
                      className="w-8 flex items-center justify-center relative"
                    >
                      <input
                        type="text"
                        className={`w-6 h-6 text-center text-xs font-bold bg-transparent border-0 outline-none
                                  ${fret ? 'text-emerald-400' : 'text-transparent'}
                                  ${isSelected ? 'ring-2 ring-emerald-400 rounded bg-slate-700' : ''}
                                  focus:ring-2 focus:ring-emerald-400 focus:rounded focus:bg-slate-700 focus:text-emerald-400
                                  placeholder:text-slate-600 caret-emerald-400`}
                        value={fret}
                        maxLength={2}
                        onChange={(e) => handleFretChange(str, col, e.target.value)}
                        onFocus={() => setSelectedCell({ string: stringIdx, col })}
                        onKeyDown={(e) => handleKeyDown(e, stringIdx, col)}
                        placeholder="·"
                      />
                    </div>
                  )
                })}
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Controls Card */}
      <div className="bg-white rounded-2xl shadow-lg shadow-slate-200/50 border border-slate-100 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between flex-wrap gap-4">
          <h2 className="text-lg font-semibold text-slate-800">Tab Editor</h2>
          
          <div className="flex items-center gap-4 flex-wrap">
            {/* Section Name */}
            <div className="flex items-center gap-2">
              <label className="text-xs text-slate-500">Section:</label>
              <input
                type="text"
                className="w-32 px-2 py-1 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                value={sectionName}
                onChange={(e) => setSectionName(e.target.value)}
              />
            </div>
            
            {/* Tempo */}
            <div className="flex items-center gap-2">
              <label className="text-xs text-slate-500">♩ =</label>
              <input
                type="number"
                className="w-16 px-2 py-1 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                value={tempo}
                onChange={(e) => setTempo(parseInt(e.target.value) || 120)}
                min={40}
                max={240}
              />
            </div>

            {/* Time Signature */}
            <div className="flex items-center gap-1">
              <input
                type="number"
                className="w-10 px-1 py-1 text-sm text-center border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                value={timeSignature.top}
                onChange={(e) => setTimeSignature(prev => ({ ...prev, top: parseInt(e.target.value) || 4 }))}
                min={1}
                max={16}
              />
              <span className="text-slate-400">/</span>
              <input
                type="number"
                className="w-10 px-1 py-1 text-sm text-center border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                value={timeSignature.bottom}
                onChange={(e) => setTimeSignature(prev => ({ ...prev, bottom: parseInt(e.target.value) || 4 }))}
                min={1}
                max={16}
              />
            </div>

            {/* Mode Toggle */}
            <div className="flex bg-slate-100 rounded-lg p-1">
              <button 
                className={`px-3 py-1 text-xs font-medium rounded-md transition-all duration-200 ${
                  mode === 'grid' 
                    ? 'bg-white text-slate-800 shadow-sm' 
                    : 'text-slate-500 hover:text-slate-700'
                }`}
                onClick={() => setMode('grid')}
              >
                Grid
              </button>
              <button 
                className={`px-3 py-1 text-xs font-medium rounded-md transition-all duration-200 ${
                  mode === 'text' 
                    ? 'bg-white text-slate-800 shadow-sm' 
                    : 'text-slate-500 hover:text-slate-700'
                }`}
                onClick={() => setMode('text')}
              >
                Text
              </button>
            </div>
          </div>
        </div>

        {mode === 'grid' ? (
          <div className="p-6">
            {/* Professional Tab Display */}
            <div className="bg-slate-800 rounded-xl p-6 overflow-hidden" ref={tabRef}>
              {/* Section Header */}
              <div className="mb-4 flex items-baseline gap-4">
                <h3 className="text-white font-semibold text-lg">{sectionName} - {bars} bars</h3>
                <span className="text-slate-400 text-sm">♩ = {tempo}</span>
              </div>

              {/* Tab Grid */}
              <div className="overflow-x-auto pb-4">
                <div className="flex gap-0">
                  {/* String Labels Column */}
                  <div className="flex-shrink-0 pr-2">
                    <div className="h-6"></div>
                    {STRINGS.map((str) => (
                      <div 
                        key={str} 
                        className="h-8 flex items-center justify-end pr-2"
                      >
                        <span className="text-sm font-bold text-slate-300">{str}</span>
                      </div>
                    ))}
                  </div>

                  {/* Time Signature */}
                  <div className="flex-shrink-0 pr-3">
                    <div className="h-6"></div>
                    <div className="flex flex-col items-center justify-center h-48">
                      <span className="text-2xl font-bold text-white leading-none">{timeSignature.top}</span>
                      <span className="text-2xl font-bold text-white leading-none">{timeSignature.bottom}</span>
                    </div>
                  </div>

                  {/* Bars */}
                  {Array.from({ length: bars }).map((_, barIdx) => renderBar(barIdx))}

                  {/* End bar line */}
                  <div className="flex-shrink-0 border-l-2 border-slate-600"></div>
                </div>
              </div>

              {/* Legend */}
              <div className="mt-4 pt-4 border-t border-slate-700 flex gap-6 text-xs text-slate-400">
                <span>h = hammer-on</span>
                <span>p = pull-off</span>
                <span>/ = slide up</span>
                <span>\ = slide down</span>
                <span>x = muted</span>
              </div>
            </div>

            {/* Bar Controls */}
            <div className="flex gap-2 flex-wrap mt-4">
              <button 
                className="px-4 py-2 text-sm font-medium text-slate-600 bg-slate-100 rounded-lg hover:bg-slate-200 transition-colors flex items-center gap-1"
                onClick={addBar}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Add Bar
              </button>
              <button 
                className="px-4 py-2 text-sm font-medium text-slate-600 bg-slate-100 rounded-lg hover:bg-slate-200 transition-colors flex items-center gap-1"
                onClick={removeBar}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                </svg>
                Remove Bar
              </button>
              <button 
                className="px-4 py-2 text-sm font-medium text-red-600 bg-red-50 rounded-lg hover:bg-red-100 transition-colors flex items-center gap-1"
                onClick={clearAll}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
                Clear All
              </button>
            </div>
          </div>
        ) : (
          <div className="p-6">
            <textarea
              className="w-full h-64 p-4 font-mono text-sm bg-slate-800 text-emerald-400 border border-slate-700 rounded-xl 
                       focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent
                       resize-none"
              value={textInput}
              onChange={(e) => setTextInput(e.target.value)}
              placeholder={`Enter your guitar tabs here...

Example:
e|--0--2--3--0--|
B|--1--3--0--1--|
G|--0--2--0--0--|
D|--2--0--0--2--|
A|--3--x--2--3--|
E|--x--x--3--x--|`}
            />
          </div>
        )}

        {/* Preview Section */}
        <div className="px-6 pb-6">
          <div className="pt-4 border-t border-slate-100">
            <h3 className="text-sm font-medium text-slate-500 mb-3">Text Preview</h3>
            <pre className="p-4 bg-slate-900 rounded-xl font-mono text-sm text-emerald-400 overflow-x-auto">
              {mode === 'grid' ? generateTabText() : (textInput || 'No tab data entered')}
            </pre>
          </div>

          <div className="mt-6">
            <button 
              className="w-full sm:w-auto px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-medium rounded-xl 
                       hover:from-indigo-700 hover:to-purple-700 shadow-lg shadow-indigo-200 transition-all duration-200 flex items-center justify-center gap-2"
              onClick={saveTab}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
              </svg>
              Save Tab
            </button>
          </div>
        </div>
      </div>

      {/* Saved Tabs Card */}
      {savedTabs.length > 0 && (
        <div className="bg-white rounded-2xl shadow-lg shadow-slate-200/50 border border-slate-100 overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100">
            <h2 className="text-lg font-semibold text-slate-800">Saved Tabs</h2>
          </div>
          <div className="p-2">
            {savedTabs.map((tab, index) => (
              <div 
                key={index} 
                className="px-4 py-3 hover:bg-slate-50 rounded-lg transition-colors flex items-center gap-3"
              >
                <div className="w-8 h-8 bg-indigo-100 rounded-lg flex items-center justify-center">
                  <svg className="w-4 h-4 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <span className="text-sm text-slate-700">{tab}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Toast */}
      {toast && (
        <div className={`fixed bottom-6 right-6 px-4 py-3 rounded-xl shadow-lg text-white font-medium animate-pulse ${
          toast.type === 'success' ? 'bg-emerald-500' : 'bg-red-500'
        }`}>
          {toast.message}
        </div>
      )}
    </div>
  )
}

export default TabEditor
