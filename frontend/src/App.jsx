import { useState } from 'react'
import TabEditor from './components/TabEditor'
import AudioRecorder from './components/AudioRecorder'
import './App.css'

function App() {
  const [activeTab, setActiveTab] = useState('editor')

  return (
    <div className="app">
      <header className="header">
        <h1>Guitar Tab Studio</h1>
        <nav className="nav">
          <button 
            className={`nav-btn ${activeTab === 'editor' ? 'active' : ''}`}
            onClick={() => setActiveTab('editor')}
          >
            Tab Editor
          </button>
          <button 
            className={`nav-btn ${activeTab === 'recorder' ? 'active' : ''}`}
            onClick={() => setActiveTab('recorder')}
          >
            Audio Recorder
          </button>
        </nav>
      </header>

      <main className="main">
        {activeTab === 'editor' && <TabEditor />}
        {activeTab === 'recorder' && <AudioRecorder />}
      </main>
    </div>
  )
}

export default App
