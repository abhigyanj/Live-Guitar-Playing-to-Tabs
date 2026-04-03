import { useContext } from 'react'
import { ThemeContext } from '../contexts/ThemeContext'

const PRINCIPLES = [
  {
    title: 'Editor first',
    body: 'The tab itself stays primary while recording, analysis, and export remain close enough to feel like part of the same instrument.',
  },
  {
    title: 'Capture without switching modes',
    body: 'Live listening and offline transcription sit inside the studio so riffs can move from audio to notation without context loss.',
  },
  {
    title: 'Built for iteration',
    body: 'Playback, loop controls, and saved tabs make the app useful for both drafting and deliberate practice.',
  },
]

const STACK = [
  'React + Vite for a fast editing surface',
  'Tailwind CSS for controlled spacing and theming',
  'Flask endpoints for persistence and analysis',
  'Web Audio for playback and metronome feedback',
  'jsPDF and html2canvas for printable exports',
]

const FAQS = [
  {
    q: 'How do I enter techniques?',
    a: 'Click a cell in the editor and type h, p, /, \\, or x. Technique hints can stay visible while you write or be toggled off for a cleaner view.',
  },
  {
    q: 'Can I bring live playing directly into the grid?',
    a: 'Yes. Open the live panel, enable sync to editor, and the detected fret positions will advance through the insertion point as you play.',
  },
  {
    q: 'What is the audio-to-tab analysis for?',
    a: 'It is the slower, more deliberate import path. You can analyze a current or saved recording with the Python pipeline, inspect the results, then import them into the editor.',
  },
  {
    q: 'Can I practice inside the app?',
    a: 'Yes. Practice mode supports looping, playback speed changes, gradual speed increases, and a metronome click so the tab doubles as a rehearsal surface.',
  },
]

const SHORTCUTS = [
  { keys: 'Arrow keys', action: 'Move between cells' },
  { keys: 'Tab', action: 'Advance to the next cell' },
  { keys: '0-9', action: 'Enter fret numbers' },
  { keys: 'h / p / x', action: 'Add technique notation' },
]

const ROADMAP = [
  { state: 'Shipped', item: 'Live capture sync into the editor' },
  { state: 'Shipped', item: 'PDF export and saved tab management' },
  { state: 'Shipped', item: 'Offline audio analysis pipeline' },
  { state: 'Next', item: 'Richer instrument sounds and broader tuning support' },
  { state: 'Next', item: 'More import/export formats such as MIDI and Guitar Pro' },
  { state: 'Future', item: 'Collaboration and more structured practice feedback' },
]

function AboutPage({ onNavigate }) {
  const { darkMode } = useContext(ThemeContext)

  const heroTone = darkMode
    ? 'border-white/10 bg-slate-950/70 text-white'
    : 'border-white/72 bg-white/76 text-slate-900'

  const panelTone = darkMode
    ? 'border-white/8 bg-white/[0.035]'
    : 'border-slate-950/6 bg-slate-950/[0.03]'

  const mutedText = darkMode ? 'text-slate-300' : 'text-slate-600'
  const secondaryText = darkMode ? 'text-slate-400' : 'text-slate-500'

  return (
    <div className="space-y-14 pb-20">
      <section className={`reveal-up overflow-hidden rounded-[38px] border px-6 py-10 shadow-2xl backdrop-blur-2xl sm:px-10 ${heroTone}`}>
        <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_22rem] lg:items-end">
          <div>
            <p className="app-kicker">Guide</p>
            <h1 className="mt-4 text-4xl font-semibold tracking-[-0.06em] text-balance sm:text-6xl">
              A calmer interface for a feature-rich guitar workflow.
            </h1>
            <p className={`mt-5 max-w-3xl text-lg leading-8 ${mutedText}`}>
              The app is designed to feel minimal on first contact while still covering the real work: writing tablature, capturing performances, analyzing recordings, practicing parts, and exporting clean output.
            </p>
          </div>

          <div className={`rounded-[28px] border p-5 ${panelTone}`}>
            <div className="text-[0.72rem] font-semibold uppercase tracking-[0.22em] text-sky-500">Built for the full loop</div>
            <div className="mt-4 space-y-3">
              {['Compose', 'Capture', 'Analyze', 'Practice', 'Export'].map((item) => (
                <div key={item} className="flex items-center justify-between border-b border-white/8 pb-3 last:border-none last:pb-0">
                  <span className="text-sm font-medium">{item}</span>
                  <span className={`text-xs uppercase tracking-[0.18em] ${secondaryText}`}>Ready</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-10 lg:grid-cols-[minmax(0,0.92fr)_minmax(0,1.08fr)]">
        <div className="reveal-up">
          <p className="app-kicker">Principles</p>
          <h2 className="mt-4 text-4xl font-semibold tracking-[-0.05em] text-balance sm:text-5xl">
            Fewer visual tricks. Better operational clarity.
          </h2>
        </div>
        <div className="space-y-8">
          {PRINCIPLES.map((item, index) => (
            <div key={item.title} className="reveal-up border-b border-white/10 pb-8 last:border-none" style={{ animationDelay: `${0.08 * index}s` }}>
              <h3 className="text-2xl font-semibold tracking-[-0.04em]">{item.title}</h3>
              <p className={`mt-3 max-w-2xl text-base leading-7 ${mutedText}`}>{item.body}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="grid gap-8 lg:grid-cols-2">
        <div className={`reveal-up rounded-[34px] border p-6 shadow-xl backdrop-blur-xl ${heroTone}`}>
          <p className="app-kicker">Stack</p>
          <h2 className="mt-4 text-3xl font-semibold tracking-[-0.05em] sm:text-4xl">What the studio runs on.</h2>
          <div className="mt-6 space-y-3">
            {STACK.map((item) => (
              <div key={item} className={`flex items-start gap-3 rounded-[20px] border px-4 py-4 ${panelTone}`}>
                <span className="mt-2 h-2.5 w-2.5 rounded-full bg-sky-500" />
                <p className={`text-sm leading-6 ${mutedText}`}>{item}</p>
              </div>
            ))}
          </div>
        </div>

        <div className={`reveal-up rounded-[34px] border p-6 shadow-xl backdrop-blur-xl ${heroTone}`} style={{ animationDelay: '0.12s' }}>
          <p className="app-kicker">Roadmap</p>
          <h2 className="mt-4 text-3xl font-semibold tracking-[-0.05em] sm:text-4xl">What is already here and what comes next.</h2>
          <div className="mt-6 space-y-3">
            {ROADMAP.map((item) => (
              <div key={item.item} className={`flex items-start gap-4 rounded-[20px] border px-4 py-4 ${panelTone}`}>
                <div className={`min-w-[4.5rem] rounded-full px-3 py-1 text-center text-[0.68rem] font-semibold uppercase tracking-[0.22em] ${item.state === 'Shipped' ? darkMode ? 'bg-emerald-500/16 text-emerald-300' : 'bg-emerald-100 text-emerald-700' : item.state === 'Next' ? darkMode ? 'bg-sky-500/16 text-sky-300' : 'bg-sky-100 text-sky-700' : darkMode ? 'bg-white/8 text-slate-300' : 'bg-slate-950/[0.05] text-slate-600'}`}>
                  {item.state}
                </div>
                <p className={`text-sm leading-6 ${mutedText}`}>{item.item}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="grid gap-8 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]">
        <div className={`reveal-up rounded-[34px] border p-6 shadow-xl backdrop-blur-xl ${heroTone}`}>
          <p className="app-kicker">FAQ</p>
          <h2 className="mt-4 text-3xl font-semibold tracking-[-0.05em] sm:text-4xl">Common questions, answered fast.</h2>
          <div className="mt-6 space-y-3">
            {FAQS.map((faq) => (
              <details key={faq.q} className={`group rounded-[22px] border px-5 py-4 ${panelTone}`}>
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-base font-semibold tracking-[-0.02em]">
                  <span>{faq.q}</span>
                  <svg className="h-5 w-5 shrink-0 transition-transform duration-300 group-open:rotate-180" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M19 9l-7 7-7-7" />
                  </svg>
                </summary>
                <p className={`mt-4 pr-8 text-sm leading-7 ${mutedText}`}>{faq.a}</p>
              </details>
            ))}
          </div>
        </div>

        <div className="space-y-8">
          <div className={`reveal-up rounded-[34px] border p-6 shadow-xl backdrop-blur-xl ${heroTone}`} style={{ animationDelay: '0.08s' }}>
            <p className="app-kicker">Shortcuts</p>
            <h2 className="mt-4 text-3xl font-semibold tracking-[-0.05em] sm:text-4xl">Move faster inside the grid.</h2>
            <div className="mt-6 space-y-3">
              {SHORTCUTS.map((item) => (
                <div key={item.keys} className={`flex items-center justify-between gap-3 rounded-[20px] border px-4 py-4 ${panelTone}`}>
                  <kbd className={`rounded-xl px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.18em] ${darkMode ? 'bg-white/8 text-slate-200' : 'bg-slate-950/[0.06] text-slate-700'}`}>
                    {item.keys}
                  </kbd>
                  <span className={`text-sm ${mutedText}`}>{item.action}</span>
                </div>
              ))}
            </div>
          </div>

          <div className={`reveal-up rounded-[34px] border p-6 shadow-xl backdrop-blur-xl ${heroTone}`} style={{ animationDelay: '0.16s' }}>
            <p className="app-kicker">Best use</p>
            <h2 className="mt-4 text-3xl font-semibold tracking-[-0.05em] sm:text-4xl">When this app is strongest.</h2>
            <p className={`mt-5 text-base leading-7 ${mutedText}`}>
              It shines when you want the speed of tablature, the confidence of playback, and the convenience of recording utilities without moving through separate tools or a heavier DAW-style interface.
            </p>
          </div>
        </div>
      </section>

      <section className={`reveal-up rounded-[38px] border px-6 py-10 text-center shadow-2xl backdrop-blur-2xl sm:px-10 ${heroTone}`}>
        <p className="app-kicker">Next step</p>
        <h2 className="mt-4 text-4xl font-semibold tracking-[-0.05em] text-balance sm:text-5xl">
          Open the studio and put the new shell to work.
        </h2>
        <p className={`mx-auto mt-5 max-w-2xl text-lg leading-8 ${mutedText}`}>
          The redesign simplifies the first impression, but the editor still holds the advanced recording, analysis, practice, and export tools behind it.
        </p>
        <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
          <button type="button" onClick={() => onNavigate('editor')} className="app-button-primary">
            Open the studio
          </button>
          <button type="button" onClick={() => onNavigate('home')} className="app-button-secondary">
            Back to overview
          </button>
        </div>
      </section>
    </div>
  )
}

export default AboutPage
