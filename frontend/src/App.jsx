import { useState } from 'react'
import TabEditor from './components/TabEditor'
import AudioRecorder from './components/AudioRecorder'
import './index.css'

function App() {
  const [activeTab, setActiveTab] = useState('editor')

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <header className="bg-white border-b border-slate-200 shadow-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <h1 className="text-xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
              Guitar Tab Studio
            </h1>
            <nav className="flex gap-2">
              <button 
                className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
                  activeTab === 'editor' 
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-200' 
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
                onClick={() => setActiveTab('editor')}
              >
                Tab Editor
              </button>
              <button 
                className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
                  activeTab === 'recorder' 
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-200' 
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
                onClick={() => setActiveTab('recorder')}
              >
                Audio Recorder
              </button>
            </nav>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'editor' && <TabEditor />}
        {activeTab === 'recorder' && <AudioRecorder />}
      </main>
    </div>
  )
}

export default App
