import { useContext } from 'react'
import { ThemeContext } from '../contexts/ThemeContext'

const PRINCIPLES = [
  {
    title: 'Editor first',
    body: 'The tab remains the main canvas so writing, nudging notes, and auditioning ideas all happen in one place.',
  },
  {
    title: 'One lane at a time',
    body: 'Compose, Analyze, and Library separate drafting, transcription, and retrieval so the studio does not feel like every tool is talking at once.',
  },
  {
    title: 'Secondary tools on demand',
    body: 'Practice controls, text reference, and deeper analysis stay close, but only expand when they actively help the current task.',
  },
]

const STUDIO_FLOW = [
  {
    title: 'Compose',
    body: 'Write in the grid or raw text, keep live capture nearby, and save from the same surface.',
    detail: 'Best for shaping phrases while the editor stays fully visible.',
  },
  {
    title: 'Analyze',
    body: 'Run the slower audio-to-tab pipeline on a current or saved recording, inspect the result, then import only when it is useful.',
    detail: 'Best for recorded takes that need a more deliberate conversion pass.',
  },
  {
    title: 'Library',
    body: 'Reload earlier drafts without turning the whole studio into a permanent saved-files dashboard.',
    detail: 'Best for returning to work you already captured.',
  },
]

const QUICK_START = [
  'Set the section name, tempo, time signature, and bar count at the top of the editor.',
  'Stay in Compose while writing by hand or syncing live notes into the grid.',
  'Open Analyze only when you want the offline audio-to-tab pipeline for a current or saved recording.',
  'Use Library to reopen earlier drafts, then expand practice controls when you are ready to rehearse, shape playback feel, or export.',
]

const FAQS = [
  {
    q: 'How do I enter techniques?',
    a: 'Stay in Compose, click a cell, and type h, p, /, \\, or x. Technique hints can remain visible while you work or be turned off for a cleaner surface.',
  },
  {
    q: 'Can I bring live playing directly into the grid?',
    a: 'Yes. Compose keeps the live panel close to the editor, so you can enable sync to editor and let detected fret positions advance from the insertion point.',
  },
  {
    q: 'What is the Analyze lane for?',
    a: 'Analyze is the slower, more deliberate path. It runs the Python audio pipeline on a current or saved recording, lets you inspect the result, then gives you the choice to import it into the editor.',
  },
  {
    q: 'Where are saved tabs now?',
    a: 'Open Library inside the studio flow switcher. Saved tabs live there instead of occupying a permanent panel on the main editing surface.',
  },
  {
    q: 'Can playback sound more like a guitar now?',
    a: 'Yes. Practice mode now includes tone profiles, articulation choices, strum direction and spread, plus a room mix control so playback feels closer to a plucked instrument instead of a plain synth voice.',
  },
  {
    q: 'Can I still practice inside the app?',
    a: 'Yes. Practice controls still live inside the editor, but they stay collapsed until you open them. Once expanded, they cover speed, loops, metronome, and the new guitar-style playback feel controls.',
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
              The studio is now organized around clearer lanes of work.
            </h1>
            <p className={`mt-5 max-w-3xl text-lg leading-8 ${mutedText}`}>
              The redesign keeps the app feature-rich, but the interface now reads in layers: compose first, analyze when needed, and reopen saved work from a dedicated library lane.
            </p>
          </div>

          <div className={`rounded-[28px] border p-5 ${panelTone}`}>
            <div className="text-[0.72rem] font-semibold uppercase tracking-[0.22em] text-sky-500">Studio map</div>
            <div className="mt-4 space-y-3">
              {['Compose', 'Analyze', 'Library'].map((item) => (
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
            The studio reads in layers, not clutter.
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
          <p className="app-kicker">Studio flow</p>
          <h2 className="mt-4 text-3xl font-semibold tracking-[-0.05em] sm:text-4xl">What each lane is for.</h2>
          <div className="mt-6 space-y-3">
            {STUDIO_FLOW.map((item, index) => (
              <div key={item.title} className={`rounded-[20px] border px-4 py-4 ${panelTone}`} style={{ animationDelay: `${0.08 * index}s` }}>
                <div className="flex items-center justify-between gap-3">
                  <h3 className="text-lg font-semibold tracking-[-0.03em]">{item.title}</h3>
                  <span className={`text-[0.68rem] font-semibold uppercase tracking-[0.22em] ${secondaryText}`}>Lane {index + 1}</span>
                </div>
                <p className={`mt-3 text-sm leading-7 ${mutedText}`}>{item.body}</p>
                <p className={`mt-2 text-xs uppercase tracking-[0.18em] ${secondaryText}`}>{item.detail}</p>
              </div>
            ))}
          </div>
        </div>

        <div className={`reveal-up rounded-[34px] border p-6 shadow-xl backdrop-blur-xl ${heroTone}`} style={{ animationDelay: '0.12s' }}>
          <p className="app-kicker">Quick start</p>
          <h2 className="mt-4 text-3xl font-semibold tracking-[-0.05em] sm:text-4xl">How to move through the studio without friction.</h2>
          <div className="mt-6 space-y-3">
            {QUICK_START.map((item, index) => (
              <div key={item} className={`flex items-start gap-4 rounded-[20px] border px-4 py-4 ${panelTone}`}>
                <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-semibold ${
                  darkMode ? 'bg-white/8 text-white' : 'bg-slate-950/[0.06] text-slate-700'
                }`}>
                  {index + 1}
                </div>
                <p className={`text-sm leading-6 ${mutedText}`}>{item}</p>
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
            <h2 className="mt-4 text-3xl font-semibold tracking-[-0.05em] sm:text-4xl">When this studio feels strongest.</h2>
            <p className={`mt-5 text-base leading-7 ${mutedText}`}>
              It works best when you want the speed of tablature, the convenience of live capture, the safety of a slower analysis pass, and the confidence of rehearsal tools without stepping through several separate apps.
            </p>
          </div>
        </div>
      </section>

      <section className="grid gap-8 lg:grid-cols-2">
        <div className={`reveal-up rounded-[34px] border p-6 shadow-xl backdrop-blur-xl ${heroTone}`}>
          <p className="app-kicker">Roadmap</p>
          <h2 className="mt-4 text-3xl font-semibold tracking-[-0.05em] sm:text-4xl">What is already here and what comes next.</h2>
          <div className="mt-6 space-y-3">
            {ROADMAP.map((item) => (
              <div key={item.item} className={`flex items-start gap-4 rounded-[20px] border px-4 py-4 ${panelTone}`}>
                <div className={`min-w-[4.5rem] rounded-full px-3 py-1 text-center text-[0.68rem] font-semibold uppercase tracking-[0.22em] ${
                  item.state === 'Shipped'
                    ? darkMode ? 'bg-emerald-500/16 text-emerald-300' : 'bg-emerald-100 text-emerald-700'
                    : item.state === 'Next'
                      ? darkMode ? 'bg-sky-500/16 text-sky-300' : 'bg-sky-100 text-sky-700'
                      : darkMode ? 'bg-white/8 text-slate-300' : 'bg-slate-950/[0.05] text-slate-600'
                }`}>
                  {item.state}
                </div>
                <p className={`text-sm leading-6 ${mutedText}`}>{item.item}</p>
              </div>
            ))}
          </div>
        </div>

        <div className={`reveal-up rounded-[34px] border p-6 shadow-xl backdrop-blur-xl ${heroTone}`} style={{ animationDelay: '0.12s' }}>
          <p className="app-kicker">Mental model</p>
          <h2 className="mt-4 text-3xl font-semibold tracking-[-0.05em] sm:text-4xl">Think of it like one instrument with three modes.</h2>
          <p className={`mt-5 text-base leading-7 ${mutedText}`}>
            Compose is where ideas take shape. Analyze is where recordings get translated more carefully. Library is where your earlier drafts wait to be reopened. Everything else supports those three jobs.
          </p>
        </div>
      </section>

      <section className={`reveal-up rounded-[38px] border px-6 py-10 text-center shadow-2xl backdrop-blur-2xl sm:px-10 ${heroTone}`}>
        <p className="app-kicker">Next step</p>
        <h2 className="mt-4 text-4xl font-semibold tracking-[-0.05em] text-balance sm:text-5xl">
          Open the studio and work through one lane at a time.
        </h2>
        <p className={`mx-auto mt-5 max-w-2xl text-lg leading-8 ${mutedText}`}>
          The app still includes the deeper recording, analysis, practice, and export tools. They are just arranged to feel calmer on first contact and clearer while you work.
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
