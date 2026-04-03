import { useContext } from 'react'
import { ThemeContext } from '../contexts/ThemeContext'

const HERO_STATS = [
  { value: '24', label: 'frets supported' },
  { value: 'Live', label: 'capture + sync' },
  { value: 'PDF', label: 'ready exports' },
]

const CAPABILITIES = [
  {
    title: 'Author with precision',
    body: 'A focused tablature grid, section naming, bar management, tempo control, and technique notation keep writing fast without feeling thin.',
  },
  {
    title: 'Capture ideas in motion',
    body: 'Listen live, quantize incoming notes, and sync directly into the editor when a riff lands before you have time to type it.',
  },
  {
    title: 'Refine before you share',
    body: 'Playback, looping, offline audio analysis, and PDF export keep drafting, practicing, and delivery in the same workspace.',
  },
]

const WORKFLOW = [
  {
    step: '01',
    title: 'Open the studio',
    body: 'Start with the grid, load a sample riff, or bring in a saved tab to avoid blank-page friction.',
  },
  {
    step: '02',
    title: 'Record or analyze',
    body: 'Use live capture for immediate ideas or run the offline analysis pipeline on a saved take.',
  },
  {
    step: '03',
    title: 'Practice and export',
    body: 'Loop difficult phrases, adjust playback speed, and export a clean PDF when the arrangement is ready.',
  },
]

const DETAIL_POINTS = [
  'One workspace for notation, playback, recording, and import',
  'Minimal chrome so the tab itself stays primary',
  'Fast entry for ideas that start on the fretboard, not in a menu',
]

function HomePage({ onNavigate }) {
  const { darkMode } = useContext(ThemeContext)

  const heroTone = darkMode
    ? 'border-white/10 bg-slate-950/70 text-white'
    : 'border-white/70 bg-white/72 text-slate-900'

  const stageTone = darkMode
    ? 'border-white/10 bg-slate-950/78'
    : 'border-white/75 bg-white/82'

  const mutedText = darkMode ? 'text-slate-300' : 'text-slate-600'
  const secondaryText = darkMode ? 'text-slate-400' : 'text-slate-500'

  return (
    <div className="px-4 pt-6 sm:px-6 lg:px-8">
      <section className="mx-auto flex min-h-[calc(100svh-7rem)] max-w-7xl items-start py-10 sm:py-14 lg:items-center">
        <div className="grid w-full gap-14 lg:grid-cols-[minmax(0,0.94fr)_minmax(430px,1.06fr)] lg:items-center">
          <div className="reveal-up max-w-2xl">
            <p className="app-kicker">Minimal surface. Full guitar workflow.</p>
            <h1 className="mt-5 text-[clamp(3.2rem,8vw,6.8rem)] font-semibold tracking-[-0.075em] text-balance leading-[0.92]">
              Write, hear, and capture guitar ideas in one quiet place.
            </h1>
            <p className={`mt-6 max-w-xl text-lg leading-8 ${mutedText}`}>
              Guitar Tab Studio brings precise tab editing, live note capture, offline transcription, and polished export into a single editorial-style workspace.
            </p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <button type="button" onClick={() => onNavigate('editor')} className="app-button-primary">
                Open Studio
              </button>
              <button type="button" onClick={() => onNavigate('about')} className="app-button-secondary">
                Explore the workflow
              </button>
            </div>

            <div className="mt-10 grid max-w-xl grid-cols-3 gap-4 border-t border-white/10 pt-6">
              {HERO_STATS.map((item) => (
                <div key={item.label}>
                  <div className="text-2xl font-semibold tracking-[-0.05em] sm:text-3xl">{item.value}</div>
                  <div className={`mt-1 text-xs uppercase tracking-[0.2em] ${secondaryText}`}>{item.label}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="reveal-up relative lg:justify-self-end" style={{ animationDelay: '0.12s' }}>
            <div className={`absolute inset-x-[12%] top-[8%] h-40 rounded-full blur-3xl ${darkMode ? 'bg-sky-500/24' : 'bg-sky-200/95'}`} />
            <div className={`relative overflow-hidden rounded-[34px] border p-5 shadow-2xl backdrop-blur-2xl ${heroTone}`}>
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-[0.7rem] font-semibold uppercase tracking-[0.22em] text-sky-500">Studio Preview</div>
                  <div className={`mt-2 text-sm ${secondaryText}`}>Tab editing, live sync, and export on one surface</div>
                </div>
                <div className={`rounded-full px-3 py-1 text-xs font-medium ${darkMode ? 'bg-white/8 text-slate-300' : 'bg-slate-950/[0.05] text-slate-600'}`}>
                  Live-ready
                </div>
              </div>

              <div className={`mt-5 overflow-hidden rounded-[28px] border p-4 ${stageTone}`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className={`h-2.5 w-2.5 rounded-full ${darkMode ? 'bg-white/25' : 'bg-slate-300'}`} />
                    <span className={`h-2.5 w-2.5 rounded-full ${darkMode ? 'bg-white/18' : 'bg-slate-200'}`} />
                    <span className={`h-2.5 w-2.5 rounded-full ${darkMode ? 'bg-white/12' : 'bg-slate-200'}`} />
                  </div>
                  <span className={`text-xs uppercase tracking-[0.2em] ${secondaryText}`}>Section · Intro</span>
                </div>

                <div className={`mt-5 rounded-[24px] border p-5 ${darkMode ? 'border-white/8 bg-white/[0.03]' : 'border-slate-950/6 bg-slate-950/[0.025]'}`}>
                  <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <div className="text-base font-semibold tracking-[-0.03em]">Main tab workspace</div>
                      <div className={`mt-1 text-sm ${secondaryText}`}>Tempo 120 BPM · 4/4 · 4 bars</div>
                    </div>
                    <div className={`rounded-full px-3 py-1 text-xs font-medium ${darkMode ? 'bg-emerald-500/16 text-emerald-300' : 'bg-emerald-100 text-emerald-700'}`}>
                      Sync to editor
                    </div>
                  </div>

                  <div className={`overflow-hidden rounded-[20px] border px-4 py-4 font-mono text-[0.76rem] leading-7 sm:text-sm ${darkMode ? 'border-white/8 bg-slate-950/80 text-sky-200' : 'border-slate-950/7 bg-slate-950 text-sky-200'}`}>
                    <div>e|--0--2--3--0--|--0--2--3--5--|</div>
                    <div>B|--1--3--0--1--|--1--3--5--3--|</div>
                    <div>G|--0--2--0--0--|--2--2--4--2--|</div>
                    <div>D|--2--0--0--2--|--2--0--0--2--|</div>
                    <div>A|--3--x--2--3--|--0--0--2--3--|</div>
                    <div>E|----------------|----------------|</div>
                  </div>

                  <div className="mt-4 grid gap-3 sm:grid-cols-[1.25fr_0.95fr]">
                    <div className={`rounded-[18px] border px-4 py-4 ${darkMode ? 'border-white/8 bg-white/[0.03]' : 'border-slate-950/6 bg-white/88'}`}>
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">Live capture</span>
                        <span className="flex items-center gap-2 text-xs text-emerald-400">
                          <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                          active
                        </span>
                      </div>
                      <div className="mt-4 flex items-end gap-1.5">
                        {[32, 48, 68, 45, 78, 58, 41, 70, 52, 35].map((height, index) => (
                          <span
                            key={height + index}
                            className="eq-bar w-2 rounded-full bg-gradient-to-t from-sky-500 via-cyan-400 to-emerald-300"
                            style={{ height: `${height}px`, animationDelay: `${index * 0.04}s` }}
                          />
                        ))}
                      </div>
                      <div className={`mt-4 text-xs ${secondaryText}`}>Pitch stream is quantized before it reaches the grid.</div>
                    </div>

                    <div className={`rounded-[18px] border px-4 py-4 ${darkMode ? 'border-white/8 bg-white/[0.03]' : 'border-slate-950/6 bg-white/88'}`}>
                      <div className="text-sm font-medium">Export panel</div>
                      <div className="mt-4 space-y-3">
                        <div className={`rounded-2xl px-3 py-3 ${darkMode ? 'bg-white/6' : 'bg-slate-950/[0.035]'}`}>
                          <div className="text-xs uppercase tracking-[0.18em] text-sky-500">PDF</div>
                          <div className={`mt-1 text-sm ${mutedText}`}>Print-ready sheet with title, tempo, and notation legend.</div>
                        </div>
                        <div className={`rounded-2xl px-3 py-3 ${darkMode ? 'bg-white/6' : 'bg-slate-950/[0.035]'}`}>
                          <div className="text-xs uppercase tracking-[0.18em] text-sky-500">Audio analysis</div>
                          <div className={`mt-1 text-sm ${mutedText}`}>Run a saved take through the quantized pitch pipeline and import it back.</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className={`absolute -right-4 top-28 rounded-[22px] border px-4 py-3 shadow-xl backdrop-blur-xl ${darkMode ? 'border-white/10 bg-slate-950/78' : 'border-white/80 bg-white/84'}`}>
                <div className="text-[0.7rem] font-semibold uppercase tracking-[0.22em] text-sky-500">Detected note</div>
                <div className="mt-2 text-2xl font-semibold tracking-[-0.05em]">A4</div>
                <div className={`mt-1 text-xs ${secondaryText}`}>String 3 · Fret 2</div>
              </div>

              <div className={`absolute -left-4 bottom-8 rounded-[22px] border px-4 py-3 shadow-xl backdrop-blur-xl ${darkMode ? 'border-white/10 bg-slate-950/78' : 'border-white/80 bg-white/84'}`}>
                <div className="text-[0.7rem] font-semibold uppercase tracking-[0.22em] text-sky-500">Playback</div>
                <div className={`mt-2 text-sm ${mutedText}`}>Looping phrases, slower practice passes, then clean export.</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl border-t border-white/10 py-14">
        <div className="grid gap-8 lg:grid-cols-3">
          {CAPABILITIES.map((item, index) => (
            <div key={item.title} className="reveal-up" style={{ animationDelay: `${0.08 * index}s` }}>
              <div className="text-[0.7rem] font-semibold uppercase tracking-[0.22em] text-sky-500">{String(index + 1).padStart(2, '0')}</div>
              <h2 className="mt-4 text-2xl font-semibold tracking-[-0.04em]">{item.title}</h2>
              <p className={`mt-4 max-w-md text-base leading-7 ${mutedText}`}>{item.body}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto grid max-w-7xl gap-12 border-t border-white/10 py-14 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] lg:items-center">
        <div className="reveal-up">
          <p className="app-kicker">Why the interface feels lighter</p>
          <h2 className="mt-4 text-4xl font-semibold tracking-[-0.05em] text-balance sm:text-5xl">
            The tab stays central. The tooling stays nearby.
          </h2>
          <p className={`mt-5 max-w-xl text-lg leading-8 ${mutedText}`}>
            Instead of treating every feature like a separate dashboard, the app now reads as one instrument panel with context that steps forward only when you need it.
          </p>

          <div className="mt-8 space-y-4">
            {DETAIL_POINTS.map((point) => (
              <div key={point} className="flex items-start gap-3">
                <span className="mt-2 h-2.5 w-2.5 rounded-full bg-sky-500" />
                <p className={`text-base leading-7 ${mutedText}`}>{point}</p>
              </div>
            ))}
          </div>
        </div>

        <div className={`reveal-up rounded-[34px] border p-6 shadow-2xl backdrop-blur-2xl ${heroTone}`} style={{ animationDelay: '0.12s' }}>
          <div className={`rounded-[28px] border p-5 ${darkMode ? 'border-white/8 bg-white/[0.03]' : 'border-slate-950/6 bg-slate-950/[0.025]'}`}>
            <div className="grid gap-5 md:grid-cols-2">
              <div className={`rounded-[24px] border p-5 ${darkMode ? 'border-white/8 bg-slate-950/80' : 'border-slate-950/7 bg-slate-950 text-slate-100'}`}>
                <div className="text-[0.72rem] font-semibold uppercase tracking-[0.22em] text-sky-400">Practice mode</div>
                <div className="mt-3 text-2xl font-semibold tracking-[-0.04em]">A/B looping with speed ramps</div>
                <div className="mt-5 grid gap-2 text-sm text-slate-300">
                  <div className="flex items-center justify-between rounded-2xl bg-white/5 px-3 py-2">
                    <span>Loop range</span>
                    <span>A5 to B16</span>
                  </div>
                  <div className="flex items-center justify-between rounded-2xl bg-white/5 px-3 py-2">
                    <span>Playback speed</span>
                    <span>75%</span>
                  </div>
                  <div className="flex items-center justify-between rounded-2xl bg-white/5 px-3 py-2">
                    <span>Metronome</span>
                    <span>On</span>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div className={`rounded-[24px] border px-4 py-4 ${darkMode ? 'border-white/8 bg-white/[0.03]' : 'border-slate-950/6 bg-white/88'}`}>
                  <div className="text-[0.72rem] font-semibold uppercase tracking-[0.22em] text-sky-500">Import path</div>
                  <div className="mt-2 text-lg font-semibold tracking-[-0.03em]">Current take or saved recording</div>
                  <p className={`mt-2 text-sm leading-6 ${mutedText}`}>The analysis flow stays close to the editor instead of sending you to a separate toolchain.</p>
                </div>
                <div className={`rounded-[24px] border px-4 py-4 ${darkMode ? 'border-white/8 bg-white/[0.03]' : 'border-slate-950/6 bg-white/88'}`}>
                  <div className="text-[0.72rem] font-semibold uppercase tracking-[0.22em] text-sky-500">Output</div>
                  <div className="mt-2 text-lg font-semibold tracking-[-0.03em]">Readable, shareable, editable</div>
                  <p className={`mt-2 text-sm leading-6 ${mutedText}`}>Tabs can be played back, stored, exported, and revised without leaving the same visual rhythm.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl border-t border-white/10 py-14">
        <div className="grid gap-10 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
          <div className="reveal-up">
            <p className="app-kicker">Workflow</p>
            <h2 className="mt-4 text-4xl font-semibold tracking-[-0.05em] text-balance sm:text-5xl">
              A shorter path from riff to finished tab.
            </h2>
          </div>

          <div className="space-y-8">
            {WORKFLOW.map((item, index) => (
              <div key={item.step} className="reveal-up flex gap-5 border-b border-white/10 pb-8 last:border-none" style={{ animationDelay: `${0.08 * index}s` }}>
                <div className="text-lg font-semibold tracking-[-0.04em] text-sky-500">{item.step}</div>
                <div>
                  <h3 className="text-2xl font-semibold tracking-[-0.04em]">{item.title}</h3>
                  <p className={`mt-3 max-w-xl text-base leading-7 ${mutedText}`}>{item.body}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl py-6 pb-20">
        <div className={`reveal-up rounded-[38px] border px-6 py-10 text-center shadow-2xl backdrop-blur-2xl sm:px-10 ${heroTone}`}>
          <p className="app-kicker">Ready when the idea arrives</p>
          <h2 className="mt-4 text-4xl font-semibold tracking-[-0.05em] text-balance sm:text-5xl">
            Open the studio and start writing before the riff disappears.
          </h2>
          <p className={`mx-auto mt-5 max-w-2xl text-lg leading-8 ${mutedText}`}>
            The refreshed interface keeps the app minimal at first glance, but all the serious tools are still there when you lean in.
          </p>
          <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
            <button type="button" onClick={() => onNavigate('editor')} className="app-button-primary">
              Start in the editor
            </button>
            <button type="button" onClick={() => onNavigate('about')} className="app-button-secondary">
              See shortcuts and FAQ
            </button>
          </div>
        </div>
      </section>
    </div>
  )
}

export default HomePage
