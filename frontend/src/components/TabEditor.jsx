import { useState, useEffect } from 'react'
import axios from 'axios'
import './TabEditor.css'

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
    // Only allow numbers 0-24 or x/X for muted
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
    <div className="tab-editor">
      <div className="card">
        <div className="card-header">
          <h2 className="card-title">Tab Editor</h2>
          <div className="mode-toggle">
            <button 
              className={`toggle-btn ${mode === 'table' ? 'active' : ''}`}
              onClick={() => setMode('table')}
            >
              Grid
            </button>
            <button 
              className={`toggle-btn ${mode === 'text' ? 'active' : ''}`}
              onClick={() => setMode('text')}
            >
              Text
            </button>
          </div>
        </div>

        {mode === 'table' ? (
          <div className="table-mode">
            <div className="tab-grid-container">
              <div className="tab-grid">
                <div className="string-labels">
                  {STRINGS.map(str => (
                    <div key={str} className="string-label">{str}</div>
                  ))}
                </div>
                <div className="fret-inputs-wrapper">
                  <div className="fret-inputs">
                    {STRINGS.map(str => (
                      <div key={str} className="string-row">
                        {tabData[str].map((fret, col) => (
                          <input
                            key={col}
                            type="text"
                            className="fret-input"
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

            <div className="btn-group" style={{ marginTop: '1.5rem' }}>
              <button className="btn btn-secondary" onClick={addColumn}>
                + Add Column
              </button>
              <button className="btn btn-secondary" onClick={removeColumn}>
                − Remove Column
              </button>
              <button className="btn btn-danger" onClick={clearTable}>
                Clear All
              </button>
            </div>
          </div>
        ) : (
          <div className="text-mode">
            <textarea
              className="tab-textarea"
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

        <div className="preview-section">
          <h3 className="preview-title">Preview</h3>
          <pre className="tab-preview">
            {mode === 'table' ? generateTabText() : (textInput || 'No tab data entered')}
          </pre>
        </div>

        <div className="btn-group" style={{ marginTop: '1rem' }}>
          <button className="btn btn-primary" onClick={saveTab}>
            Save Tab
          </button>
        </div>
      </div>

      {savedTabs.length > 0 && (
        <div className="card">
          <div className="card-header">
            <h2 className="card-title">Saved Tabs</h2>
          </div>
          <div className="saved-tabs-list">
            {savedTabs.map((tab, index) => (
              <div key={index} className="saved-tab-item">
                <span className="tab-name">{tab}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {toast && (
        <div className={`toast ${toast.type}`}>
          {toast.message}
        </div>
      )}
    </div>
  )
}

export default TabEditor
