import { useEffect, useMemo, useState } from 'react'
import HomePage from './components/HomePage'
import AboutPage from './components/AboutPage'
import TabEditor from './components/TabEditor'
import StudioErrorBoundary from './components/StudioErrorBoundary'
import { AudioProvider } from './contexts/AudioContext'
import { ThemeContext } from './contexts/ThemeContext'
import './index.css'

const NAV_ITEMS = [
  {
    id: 'home',
    label: 'Overview',
    description: 'Product story and flow',
  },
  {
    id: 'editor',
    label: 'Studio',
    description: 'Editing, live capture, export',
  },
  {
    id: 'about',
    label: 'Guide',
    description: 'FAQ, shortcuts, roadmap',
  },
]

const QUICK_START_ITEMS = [
  {
    title: 'Write directly in the grid',
    text: 'Click any cell and enter a fret number or a technique marker like h, p, /, \\, or x.',
  },
  {
    title: 'Capture ideas live',
    text: 'Open the live panel to listen, quantize, and sync your playing into the editor in real time.',
  },
  {
    title: 'Refine before you export',
    text: 'Use practice mode, looping, and tempo controls to audition the part before generating a PDF or saving it.',
  },
]

function App() {
  const [activeTab, setActiveTab] = useState('home')
  const [darkMode, setDarkMode] = useState(() => {
    const saved = localStorage.getItem('darkMode')
    return saved ? JSON.parse(saved) : false
  })
  const [showGuide, setShowGuide] = useState(false)

  useEffect(() => {
    localStorage.setItem('darkMode', JSON.stringify(darkMode))
    document.documentElement.classList.toggle('dark', darkMode)
  }, [darkMode])

  const activeItem = useMemo(
    () => NAV_ITEMS.find((item) => item.id === activeTab) ?? NAV_ITEMS[0],
    [activeTab]
  )

  const shellTone = darkMode
    ? 'border-white/10 bg-slate-950/70 text-white shadow-black/35'
    : 'border-white/70 bg-white/78 text-slate-900 shadow-slate-900/8'

  const modalTone = darkMode
    ? 'border-white/10 bg-slate-950/92 text-slate-100'
    : 'border-white/80 bg-white/92 text-slate-900'

  const segmentedTone = darkMode
    ? 'bg-white/5 ring-1 ring-white/8'
    : 'bg-slate-950/[0.045] ring-1 ring-slate-950/5'

  return (
    <AudioProvider>
      <ThemeContext.Provider value={{ darkMode, setDarkMode }}>
        <div className={`relative min-h-screen transition-colors duration-500 ${darkMode ? 'text-slate-100' : 'text-slate-900'}`}>
          <div className="pointer-events-none fixed inset-0 overflow-hidden">
            <div className={`ambient-orb ambient-orb-left ${darkMode ? 'opacity-80' : 'opacity-100'}`} />
            <div className={`ambient-orb ambient-orb-right ${darkMode ? 'opacity-65' : 'opacity-95'}`} />
            <div className={`ambient-grid ${darkMode ? 'opacity-35' : 'opacity-45'}`} />
          </div>

          {showGuide && (
            <div className="fixed inset-0 z-[60] flex items-center justify-center px-4 py-8">
              <button
                type="button"
                aria-label="Close guide"
                className="absolute inset-0 bg-black/38 backdrop-blur-xl"
                onClick={() => setShowGuide(false)}
              />
              <div className={`relative w-full max-w-3xl overflow-hidden rounded-[32px] border p-8 shadow-2xl backdrop-blur-2xl ${modalTone}`}>
                <div className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
                  <div className="max-w-xl">
                    <p className="app-kicker">Quick start</p>
                    <h2 className="mt-3 text-3xl font-semibold tracking-[-0.03em] sm:text-4xl">
                      Everything the app can do, without the clutter.
                    </h2>
                    <p className={`mt-4 max-w-lg text-sm sm:text-base ${darkMode ? 'text-slate-300' : 'text-slate-600'}`}>
                      Guitar Tab Studio is built to move from idea capture to polished tab without switching tools.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowGuide(false)}
                    className={`h-11 w-11 rounded-full transition-colors ${darkMode ? 'bg-white/8 text-slate-300 hover:bg-white/14' : 'bg-slate-950/5 text-slate-600 hover:bg-slate-950/10'}`}
                  >
                    <svg className="mx-auto h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                <div className="mt-8 grid gap-4 md:grid-cols-3">
                  {QUICK_START_ITEMS.map((item) => (
                    <div
                      key={item.title}
                      className={`rounded-[24px] border px-5 py-5 ${darkMode ? 'border-white/8 bg-white/5' : 'border-slate-950/6 bg-slate-950/[0.03]'}`}
                    >
                      <h3 className="text-base font-semibold tracking-[-0.02em]">{item.title}</h3>
                      <p className={`mt-3 text-sm leading-6 ${darkMode ? 'text-slate-300' : 'text-slate-600'}`}>{item.text}</p>
                    </div>
                  ))}
                </div>

                <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                  <button
                    type="button"
                    onClick={() => {
                      setShowGuide(false)
                      setActiveTab('editor')
                    }}
                    className="app-button-primary"
                  >
                    Open Studio
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowGuide(false)
                      setActiveTab('about')
                    }}
                    className="app-button-secondary"
                  >
                    Read the guide
                  </button>
                </div>
              </div>
            </div>
          )}

          <header className="sticky top-0 z-50 px-4 pt-4 sm:px-6 lg:px-8">
            <div className={`mx-auto max-w-7xl rounded-[30px] border px-4 py-4 shadow-xl backdrop-blur-2xl transition-colors duration-500 ${shellTone}`}>
              <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div className="flex items-center gap-3">
                  <div className={`flex h-12 w-12 items-center justify-center rounded-2xl border ${darkMode ? 'border-white/12 bg-white/8' : 'border-slate-950/7 bg-slate-950/[0.04]'}`}>
                    <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9 19V6l11-3v13M9 19c0 1.1-1.34 2-3 2s-3-.9-3-2 1.34-2 3-2 3 .9 3 2Zm11-3c0 1.1-1.34 2-3 2s-3-.9-3-2 1.34-2 3-2 3 .9 3 2ZM9 10l11-3" />
                    </svg>
                  </div>
                  <div>
                    <div className="text-[0.72rem] font-semibold uppercase tracking-[0.24em] text-sky-500">Guitar Tab Studio</div>
                    <div className={`text-sm ${darkMode ? 'text-slate-300' : 'text-slate-600'}`}>{activeItem.description}</div>
                  </div>
                </div>

                <nav className={`no-scrollbar flex items-center gap-1 overflow-x-auto rounded-full p-1 ${segmentedTone}`}>
                  {NAV_ITEMS.map((item) => {
                    const isActive = item.id === activeTab
                    const activeTone = darkMode
                      ? 'bg-white text-slate-950 shadow-lg shadow-black/20'
                      : 'bg-slate-950 text-white shadow-lg shadow-slate-900/10'

                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => setActiveTab(item.id)}
                        className={`whitespace-nowrap rounded-full px-4 py-2 text-sm font-medium transition-all duration-300 ${isActive ? activeTone : darkMode ? 'text-slate-300 hover:bg-white/8 hover:text-white' : 'text-slate-600 hover:bg-white hover:text-slate-950'}`}
                      >
                        {item.label}
                      </button>
                    )
                  })}
                </nav>

                <div className="flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setShowGuide(true)}
                    className="app-button-secondary"
                  >
                    Guide
                  </button>
                  <button
                    type="button"
                    onClick={() => setDarkMode((current) => !current)}
                    className="app-button-secondary px-4"
                    title={darkMode ? 'Switch to light mode' : 'Switch to dark mode'}
                  >
                    {darkMode ? 'Light' : 'Dark'}
                  </button>
                </div>
              </div>
            </div>
          </header>

          <main className="relative z-10 pb-20">
            {activeTab === 'home' ? (
              <HomePage onNavigate={setActiveTab} />
            ) : (
              <div className="mx-auto max-w-7xl px-4 pt-8 sm:px-6 lg:px-8">
                {activeTab === 'editor' && (
                  <StudioErrorBoundary darkMode={darkMode}>
                    <TabEditor darkMode={darkMode} />
                  </StudioErrorBoundary>
                )}
                {activeTab === 'about' && <AboutPage onNavigate={setActiveTab} />}
              </div>
            )}
          </main>

          <footer className="relative z-10 px-4 pb-8 sm:px-6 lg:px-8">
            <div className={`mx-auto flex max-w-7xl flex-col gap-2 rounded-[26px] border px-5 py-4 text-sm backdrop-blur-xl sm:flex-row sm:items-center sm:justify-between ${darkMode ? 'border-white/10 bg-slate-950/55 text-slate-400' : 'border-white/70 bg-white/72 text-slate-500'}`}>
              <span>Write, hear, capture, and export from one continuous workspace.</span>
              <span className="text-xs uppercase tracking-[0.22em] text-sky-500">Open source guitar workflow</span>
            </div>
          </footer>
        </div>
      </ThemeContext.Provider>
    </AudioProvider>
  )
}

export default App
