import { useState, useEffect } from 'react'
import axios from 'axios'

const API_URL = 'http://127.0.0.1:5000'

const STRINGS = ['e', 'B', 'G', 'D', 'A', 'E']
const INITIAL_COLUMNS = 16

function TabEditor() {
  const [mode, setMode] = useState('table')
  const [columns, setColumns] = useState(INITIAL_COLUMNS)
  const [tabData, setTabData] = useState(() => {
    const initial = {}
    STRINGS.forEach(str => {
      initial[str] = Array(INITIAL_COLUMNS).fill('')
    })
    return initial
  })
  const [textInput, setTextInput] = useState('')
  const [toast, setToast] = useState(null)
  const [savedTabs, setSavedTabs] = useState([])

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
    if (value !== '' && !/^[0-9]{1,2}$|^[xX]$/.test(value)) return
    if (value !== '' && !isNaN(value) && parseInt(value) > 24) return

    setTabData(prev => ({
      ...prev,
      [string]: prev[string].map((v, i) => i === col ? value : v)
    }))
  }

  const addColumn = () => {
    setColumns(prev => prev + 1)
    setTabData(prev => {
      const updated = {}
      STRINGS.forEach(str => {
        updated[str] = [...prev[str], '']
      })
      return updated
    })
  }

  const removeColumn = () => {
    if (columns <= 4) return
    setColumns(prev => prev - 1)
    setTabData(prev => {
      const updated = {}
      STRINGS.forEach(str => {
        updated[str] = prev[str].slice(0, -1)
      })
      return updated
    })
  }

  const clearTable = () => {
    setTabData(() => {
      const cleared = {}
      STRINGS.forEach(str => {
        cleared[str] = Array(columns).fill('')
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
    const tabText = mode === 'table' ? generateTabText() : textInput
    
    if (!tabText.trim()) {
      showToast('Please enter some tab data first', 'error')
      return
    }

    try {
      const response = await axios.post(`${API_URL}/save-tab`, {
        tab_data: tabText
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

  return (
    <div className="space-y-6">
      {/* Main Editor Card */}
      <div className="bg-white rounded-2xl shadow-lg shadow-slate-200/50 border border-slate-100 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-slate-800">Tab Editor</h2>
          <div className="flex bg-slate-100 rounded-lg p-1">
            <button 
              className={`px-4 py-1.5 text-sm font-medium rounded-md transition-all duration-200 ${
                mode === 'table' 
                  ? 'bg-white text-slate-800 shadow-sm' 
                  : 'text-slate-500 hover:text-slate-700'
              }`}
              onClick={() => setMode('table')}
            >
              Grid
            </button>
            <button 
              className={`px-4 py-1.5 text-sm font-medium rounded-md transition-all duration-200 ${
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

        <div className="p-6">
          {mode === 'table' ? (
            <div className="space-y-4">
              <div className="overflow-x-auto">
                <div className="flex gap-2">
                  {/* String labels */}
                  <div className="flex flex-col gap-1">
                    {STRINGS.map(str => (
                      <div 
                        key={str} 
                        className="w-8 h-10 flex items-center justify-center text-sm font-bold text-indigo-600 bg-indigo-50 rounded-lg"
                      >
                        {str}
                      </div>
                    ))}
                  </div>
                  
                  {/* Fret inputs */}
                  <div className="flex-1 overflow-x-auto">
                    <div className="flex flex-col gap-1">
                      {STRINGS.map(str => (
                        <div key={str} className="flex gap-1">
                          {tabData[str].map((fret, col) => (
                            <input
                              key={col}
                              type="text"
                              className="w-10 h-10 text-center text-sm font-mono border border-slate-200 rounded-lg 
                                       focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent
                                       placeholder:text-slate-300 transition-all duration-200"
                              value={fret}
                              maxLength={2}
                              onChange={(e) => handleFretChange(str, col, e.target.value)}
                              placeholder="-"
                            />
                          ))}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex gap-2 flex-wrap">
                <button 
                  className="px-4 py-2 text-sm font-medium text-slate-600 bg-slate-100 rounded-lg hover:bg-slate-200 transition-colors"
                  onClick={addColumn}
                >
                  + Add Column
                </button>
                <button 
                  className="px-4 py-2 text-sm font-medium text-slate-600 bg-slate-100 rounded-lg hover:bg-slate-200 transition-colors"
                  onClick={removeColumn}
                >
                  − Remove Column
                </button>
                <button 
                  className="px-4 py-2 text-sm font-medium text-red-600 bg-red-50 rounded-lg hover:bg-red-100 transition-colors"
                  onClick={clearTable}
                >
                  Clear All
                </button>
              </div>
            </div>
          ) : (
            <textarea
              className="w-full h-64 p-4 font-mono text-sm border border-slate-200 rounded-xl 
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
          )}

          {/* Preview */}
          <div className="mt-6 pt-6 border-t border-slate-100">
            <h3 className="text-sm font-medium text-slate-500 mb-3">Preview</h3>
            <pre className="p-4 bg-slate-50 rounded-xl font-mono text-sm text-slate-700 overflow-x-auto">
              {mode === 'table' ? generateTabText() : (textInput || 'No tab data entered')}
            </pre>
          </div>

          <div className="mt-6">
            <button 
              className="w-full sm:w-auto px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-medium rounded-xl 
                       hover:from-indigo-700 hover:to-purple-700 shadow-lg shadow-indigo-200 transition-all duration-200"
              onClick={saveTab}
            >
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
