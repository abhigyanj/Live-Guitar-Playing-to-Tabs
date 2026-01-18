import { useState, useEffect, createContext } from 'react'
import TabEditor from './components/TabEditor'
import HomePage from './components/HomePage'
import AboutPage from './components/AboutPage'
import { AudioProvider } from './contexts/AudioContext'
import './index.css'

// Theme Context
export const ThemeContext = createContext()

function App() {
  const [activeTab, setActiveTab] = useState('home')
  const [darkMode, setDarkMode] = useState(() => {
    const saved = localStorage.getItem('darkMode')
    return saved ? JSON.parse(saved) : false
  })
  const [showWelcome, setShowWelcome] = useState(() => {
    const seen = localStorage.getItem('welcomeSeen')
    return !seen
  })

  useEffect(() => {
    localStorage.setItem('darkMode', JSON.stringify(darkMode))
    if (darkMode) {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
  }, [darkMode])

  const dismissWelcome = () => {
    setShowWelcome(false)
    localStorage.setItem('welcomeSeen', 'true')
  }

  return (
    <AudioProvider>
    <ThemeContext.Provider value={{ darkMode, setDarkMode }}>
      <div className={`min-h-screen flex flex-col transition-colors duration-300 relative ${
        darkMode 
          ? 'bg-slate-900' 
          : 'bg-slate-50'
      }`}>
        {/* Global Animated Background Gradient */}
        <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
          <div 
            className={`absolute w-[800px] h-[800px] rounded-full blur-3xl ${
              darkMode ? 'bg-indigo-600/15' : 'bg-indigo-300/25'
            }`}
            style={{ top: '5%', right: '-15%' }}
          />
          <div 
            className={`absolute w-[700px] h-[700px] rounded-full blur-3xl ${
              darkMode ? 'bg-purple-600/12' : 'bg-purple-300/20'
            }`}
            style={{ bottom: '-10%', left: '-15%' }}
          />
          <div 
            className={`absolute w-[500px] h-[500px] rounded-full blur-3xl ${
              darkMode ? 'bg-pink-600/8' : 'bg-pink-300/15'
            }`}
            style={{ top: '50%', left: '40%' }}
          />
        </div>

        {/* Welcome Modal */}
        {showWelcome && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
            <div className={`max-w-2xl w-full rounded-3xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-300 ${
              darkMode ? 'bg-slate-800' : 'bg-white'
            }`}>
              {/* Header with gradient */}
              <div className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-500 p-8 text-white">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur">
                    <svg className="w-7 h-7" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M19.952 2.962l-1.307-.753A2 2 0 0016.669 2H7.331a2 2 0 00-1.976.209l-1.307.753A2 2 0 003 4.627v14.746a2 2 0 001.048 1.665l1.307.753A2 2 0 007.331 22h9.338a2 2 0 001.976-.209l1.307-.753A2 2 0 0021 19.373V4.627a2 2 0 00-1.048-1.665zM12 18a1 1 0 110-2 1 1 0 010 2zm2-4H10V6h4v8z"/>
                    </svg>
                  </div>
                  <div>
                    <h1 className="text-2xl font-bold">Welcome to Guitar Tab Studio</h1>
                    <p className="text-white/80 text-sm">Your professional guitar tablature editor</p>
                  </div>
                </div>
              </div>

              <div className={`p-8 ${darkMode ? 'text-slate-200' : 'text-slate-700'}`}>
                <h2 className={`text-lg font-semibold mb-4 ${darkMode ? 'text-white' : 'text-slate-900'}`}>
                  What you can do:
                </h2>
                
                <div className="grid gap-4 mb-6">
                  <div className="flex gap-4 items-start">
                    <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-900/50 flex items-center justify-center flex-shrink-0">
                      <svg className="w-5 h-5 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3"/>
                      </svg>
                    </div>
                    <div>
                      <h3 className="font-medium">Create Professional Tabs</h3>
                      <p className="text-sm opacity-75">Use the interactive grid editor with bar lines, time signatures, and tempo markings</p>
                    </div>
                  </div>

                  <div className="flex gap-4 items-start">
                    <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-900/50 flex items-center justify-center flex-shrink-0">
                      <svg className="w-5 h-5 text-blue-600" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M8 5v14l11-7z"/>
                      </svg>
                    </div>
                    <div>
                      <h3 className="font-medium">Play & Listen</h3>
                      <p className="text-sm opacity-75">Hear your tabs played back with synthesized guitar sounds at your chosen tempo</p>
                    </div>
                  </div>

                  <div className="flex gap-4 items-start">
                    <div className="w-10 h-10 rounded-xl bg-purple-100 dark:bg-purple-900/50 flex items-center justify-center flex-shrink-0">
                      <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"/>
                      </svg>
                    </div>
                    <div>
                      <h3 className="font-medium">Export to PDF</h3>
                      <p className="text-sm opacity-75">Generate professional sheet music ready to print or share</p>
                    </div>
                  </div>

                  <div className="flex gap-4 items-start">
                    <div className="w-10 h-10 rounded-xl bg-amber-100 dark:bg-amber-900/50 flex items-center justify-center flex-shrink-0">
                      <svg className="w-5 h-5 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"/>
                      </svg>
                    </div>
                    <div>
                      <h3 className="font-medium">Record Audio</h3>
                      <p className="text-sm opacity-75">Capture your guitar playing directly in the browser</p>
                    </div>
                  </div>
                </div>

                <div className={`p-4 rounded-xl mb-6 ${darkMode ? 'bg-slate-700/50' : 'bg-slate-100'}`}>
                  <h3 className="font-medium mb-2 flex items-center gap-2">
                    <span>🎸</span> Technique Notation
                  </h3>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-sm">
                    <div className="flex items-center gap-2">
                      <code className="px-2 py-0.5 bg-emerald-500/20 text-emerald-600 rounded font-mono">h</code>
                      <span>Hammer-on</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <code className="px-2 py-0.5 bg-emerald-500/20 text-emerald-600 rounded font-mono">p</code>
                      <span>Pull-off</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <code className="px-2 py-0.5 bg-emerald-500/20 text-emerald-600 rounded font-mono">/</code>
                      <span>Slide up</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <code className="px-2 py-0.5 bg-emerald-500/20 text-emerald-600 rounded font-mono">\</code>
                      <span>Slide down</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <code className="px-2 py-0.5 bg-emerald-500/20 text-emerald-600 rounded font-mono">x</code>
                      <span>Muted</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <code className="px-2 py-0.5 bg-emerald-500/20 text-emerald-600 rounded font-mono">0-24</code>
                      <span>Fret number</span>
                    </div>
                  </div>
                </div>

                <button
                  onClick={dismissWelcome}
                  className="w-full py-3 px-6 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-semibold rounded-xl
                           hover:from-indigo-700 hover:to-purple-700 transition-all duration-200 shadow-lg shadow-indigo-500/25
                           flex items-center justify-center gap-2"
                >
                  Get Started
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6"/>
                  </svg>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Header */}
        <header className={`sticky top-0 z-50 backdrop-blur-xl border-b transition-colors duration-300 ${
          darkMode 
            ? 'bg-slate-900/80 border-slate-700' 
            : 'bg-white/80 border-slate-200'
        }`}>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              {/* Logo */}
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/25">
                  <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M19.952 2.962l-1.307-.753A2 2 0 0016.669 2H7.331a2 2 0 00-1.976.209l-1.307.753A2 2 0 003 4.627v14.746a2 2 0 001.048 1.665l1.307.753A2 2 0 007.331 22h9.338a2 2 0 001.976-.209l1.307-.753A2 2 0 0021 19.373V4.627a2 2 0 00-1.048-1.665zM12 18a1 1 0 110-2 1 1 0 010 2zm2-4H10V6h4v8z"/>
                  </svg>
                </div>
                <h1 className="text-xl font-bold bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 bg-clip-text text-transparent">
                  Guitar Tab Studio
                </h1>
              </div>

              {/* Navigation */}
              <div className="flex items-center gap-4">
                <nav className={`flex p-1 rounded-xl ${darkMode ? 'bg-slate-800' : 'bg-slate-100'}`}>
                  <button 
                    className={`px-4 py-2 rounded-lg font-medium text-sm transition-all duration-200 flex items-center gap-2 ${
                      activeTab === 'home' 
                        ? 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-md' 
                        : darkMode ? 'text-slate-400 hover:text-white' : 'text-slate-600 hover:text-slate-900'
                    }`}
                    onClick={() => setActiveTab('home')}
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"/>
                    </svg>
                    Home
                  </button>
                  <button 
                    className={`px-4 py-2 rounded-lg font-medium text-sm transition-all duration-200 flex items-center gap-2 ${
                      activeTab === 'editor' 
                        ? 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-md' 
                        : darkMode ? 'text-slate-400 hover:text-white' : 'text-slate-600 hover:text-slate-900'
                    }`}
                    onClick={() => setActiveTab('editor')}
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3"/>
                    </svg>
                    Tab Studio
                  </button>
                  <button 
                    className={`px-4 py-2 rounded-lg font-medium text-sm transition-all duration-200 flex items-center gap-2 ${
                      activeTab === 'about' 
                        ? 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-md' 
                        : darkMode ? 'text-slate-400 hover:text-white' : 'text-slate-600 hover:text-slate-900'
                    }`}
                    onClick={() => setActiveTab('about')}
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
                    </svg>
                    About
                  </button>
                </nav>

                {/* Theme Toggle */}
                <button
                  onClick={() => setDarkMode(!darkMode)}
                  className={`p-2.5 rounded-xl transition-all duration-300 ${
                    darkMode 
                      ? 'bg-slate-800 text-yellow-400 hover:bg-slate-700' 
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                  title={darkMode ? 'Switch to light mode' : 'Switch to dark mode'}
                >
                  {darkMode ? (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <circle cx="12" cy="12" r="4"/>
                      <path strokeLinecap="round" d="M12 2v2m0 16v2m10-10h-2M4 12H2m15.07-7.07l-1.41 1.41M8.34 15.66l-1.41 1.41m12.14 0l-1.41-1.41M8.34 8.34L6.93 6.93"/>
                    </svg>
                  ) : (
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"/>
                    </svg>
                  )}
                </button>

                {/* Help Button */}
                <button
                  onClick={() => setShowWelcome(true)}
                  className={`p-2.5 rounded-xl transition-all duration-300 ${
                    darkMode 
                      ? 'bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-white' 
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                  title="Help"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </header>

        <main className={`flex-1 relative z-10 ${activeTab === 'home' ? '' : 'py-8 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'}`}>
          {activeTab === 'home' && <HomePage darkMode={darkMode} onNavigate={setActiveTab} />}
          {activeTab === 'editor' && (
            <TabEditor 
              darkMode={darkMode} 
            />
          )}
          {activeTab === 'about' && <AboutPage darkMode={darkMode} onNavigate={setActiveTab} />}
        </main>

        {/* Footer */}
        <footer className={`relative z-10 py-6 mt-auto transition-colors duration-300 ${
          darkMode ? 'text-slate-500' : 'text-slate-400'
        }`}>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-sm">
            Guitar Tab Studio • Create, play, and share guitar tablature
          </div>
        </footer>
      </div>
    </ThemeContext.Provider>
    </AudioProvider>
  )
}

export default App
