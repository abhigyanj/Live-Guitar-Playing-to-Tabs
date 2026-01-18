import { useContext } from 'react'
import { ThemeContext } from '../App'

function AboutPage({ onNavigate }) {
  const { darkMode } = useContext(ThemeContext)

  const team = [
    {
      role: 'Built With',
      items: [
        { name: 'React', desc: 'Modern UI library' },
        { name: 'Tailwind CSS', desc: 'Utility-first styling' },
        { name: 'Vite', desc: 'Lightning-fast builds' },
        { name: 'Flask', desc: 'Python backend' },
      ]
    }
  ]

  const faqs = [
    {
      q: 'How do I create a guitar tab?',
      a: 'Click on "Tab Editor" in the navigation. Use the grid interface to input fret numbers on each string. Click a cell and type the fret number (0-24) or technique symbol (h, p, /, \\, x).'
    },
    {
      q: 'Can I hear my tabs played back?',
      a: 'Yes! Click the green "Play" button to hear your tab played with synthesized guitar sounds. The playback follows your tempo setting and shows a visual indicator as it plays.'
    },
    {
      q: 'How do I export my tabs?',
      a: 'Click the "Export PDF" button to generate a professional PDF document with your tab notation, including the section name, tempo, and a legend for techniques.'
    },
    {
      q: 'What techniques are supported?',
      a: 'We support hammer-ons (h), pull-offs (p), slide up (/), slide down (\\), and muted notes (x). Visual symbols appear above notes when technique hints are enabled.'
    },
    {
      q: 'Can I save my work?',
      a: 'Yes! Click "Save Tab" to save your tab to the server. Your saved tabs appear in the "Saved Tabs" section where you can load them again anytime.'
    },
    {
      q: 'Is my data stored securely?',
      a: 'Your tabs and recordings are stored locally on the server running Guitar Tab Studio. For personal use, your data stays on your machine.'
    }
  ]

  const roadmap = [
    { status: 'done', text: 'Grid-based tab editor' },
    { status: 'done', text: 'Playback with synthesized audio' },
    { status: 'done', text: 'PDF export' },
    { status: 'done', text: 'Audio recording' },
    { status: 'done', text: 'Dark/Light theme' },
    { status: 'planned', text: 'Better guitar sounds (Tone.js)' },
    { status: 'planned', text: 'Import Guitar Pro files' },
    { status: 'planned', text: 'MIDI export' },
    { status: 'planned', text: 'Chord diagrams' },
    { status: 'planned', text: 'Multiple tunings' },
    { status: 'future', text: 'Real-time collaboration' },
    { status: 'future', text: 'Audio-to-tab AI conversion' },
  ]

  return (
    <div className="space-y-16 pb-20">
      {/* Hero Section */}
      <section className="text-center pt-8">
        <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium mb-6 ${
          darkMode 
            ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30' 
            : 'bg-purple-100 text-purple-700'
        }`}>
          About the Project
        </div>
        
        <h1 className={`text-4xl sm:text-5xl font-extrabold mb-6 ${darkMode ? 'text-white' : 'text-slate-900'}`}>
          Built for
          <span className="bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 bg-clip-text text-transparent"> Guitarists</span>,
          <br />By Music Lovers
        </h1>
        
        <p className={`text-xl max-w-3xl mx-auto ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>
          Guitar Tab Studio is a modern, open-source web application for creating, playing, and sharing 
          guitar tablature. We believe everyone should have access to professional music notation tools.
        </p>
      </section>

      {/* Mission Section */}
      <section className="grid md:grid-cols-2 gap-8">
        <div className={`rounded-2xl p-8 ${
          darkMode ? 'bg-slate-800/50 border border-slate-700' : 'bg-white border border-slate-200 shadow-xl'
        }`}>
          <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center mb-6">
            <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z"/>
            </svg>
          </div>
          <h3 className={`text-2xl font-bold mb-3 ${darkMode ? 'text-white' : 'text-slate-900'}`}>
            Our Mission
          </h3>
          <p className={`leading-relaxed ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>
            To provide guitarists of all skill levels with a free, intuitive, and powerful tool for 
            creating and learning guitar music. We want to eliminate barriers to music education and 
            make tablature creation accessible to everyone.
          </p>
        </div>

        <div className={`rounded-2xl p-8 ${
          darkMode ? 'bg-slate-800/50 border border-slate-700' : 'bg-white border border-slate-200 shadow-xl'
        }`}>
          <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center mb-6">
            <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"/>
            </svg>
          </div>
          <h3 className={`text-2xl font-bold mb-3 ${darkMode ? 'text-white' : 'text-slate-900'}`}>
            Open Source
          </h3>
          <p className={`leading-relaxed ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>
            Guitar Tab Studio is completely free and open source. You can use it, modify it, and 
            contribute to its development. We believe in the power of community-driven software 
            to create better tools for everyone.
          </p>
        </div>
      </section>

      {/* Tech Stack */}
      <section>
        <h2 className={`text-2xl font-bold mb-6 text-center ${darkMode ? 'text-white' : 'text-slate-900'}`}>
          Built With Modern Technology
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { 
              name: 'React', 
              desc: 'UI Components',
              icon: (
                <svg viewBox="0 0 24 24" className="w-8 h-8" fill="currentColor">
                  <circle cx="12" cy="12" r="2.5" className="text-cyan-400" fill="currentColor"/>
                  <ellipse cx="12" cy="12" rx="10" ry="4" fill="none" stroke="currentColor" strokeWidth="1" className="text-cyan-400"/>
                  <ellipse cx="12" cy="12" rx="10" ry="4" fill="none" stroke="currentColor" strokeWidth="1" className="text-cyan-400" transform="rotate(60 12 12)"/>
                  <ellipse cx="12" cy="12" rx="10" ry="4" fill="none" stroke="currentColor" strokeWidth="1" className="text-cyan-400" transform="rotate(120 12 12)"/>
                </svg>
              )
            },
            { 
              name: 'Tailwind CSS', 
              desc: 'Styling',
              icon: (
                <svg viewBox="0 0 24 24" className="w-8 h-8 text-teal-400" fill="currentColor">
                  <path d="M12.001,4.8c-3.2,0-5.2,1.6-6,4.8c1.2-1.6,2.6-2.2,4.2-1.8c0.913,0.228,1.565,0.89,2.288,1.624 C13.666,10.618,15.027,12,18.001,12c3.2,0,5.2-1.6,6-4.8c-1.2,1.6-2.6,2.2-4.2,1.8c-0.913-0.228-1.565-0.89-2.288-1.624 C16.337,6.182,14.976,4.8,12.001,4.8z M6.001,12c-3.2,0-5.2,1.6-6,4.8c1.2-1.6,2.6-2.2,4.2-1.8c0.913,0.228,1.565,0.89,2.288,1.624 c1.177,1.194,2.538,2.576,5.512,2.576c3.2,0,5.2-1.6,6-4.8c-1.2,1.6-2.6,2.2-4.2,1.8c-0.913-0.228-1.565-0.89-2.288-1.624 C10.337,13.382,8.976,12,6.001,12z"/>
                </svg>
              )
            },
            { 
              name: 'Vite', 
              desc: 'Build Tool',
              icon: (
                <svg viewBox="0 0 24 24" className="w-8 h-8" fill="none">
                  <path d="M21.928 5.655L12.732 21.29a.5.5 0 01-.873-.012L2.041 5.654a.5.5 0 01.549-.733l9.378 1.755a.5.5 0 00.183 0l9.228-1.754a.5.5 0 01.549.733z" fill="url(#vite-gradient)"/>
                  <path d="M15.954 1.72L8.476 3.217a.25.25 0 00-.197.237l-.486 8.145a.25.25 0 00.299.261l2.483-.556a.25.25 0 01.296.298l-.593 2.91a.25.25 0 00.313.295l1.535-.441a.25.25 0 01.312.295l-.944 4.107a.156.156 0 00.286.121l.077-.127 4.27-8.164a.25.25 0 00-.254-.366l-2.545.431a.25.25 0 01-.284-.31l1.211-4.413a.25.25 0 00-.286-.32z" fill="url(#vite-gradient-2)"/>
                  <defs>
                    <linearGradient id="vite-gradient" x1="1.907" y1="4.376" x2="13.459" y2="19.26" gradientUnits="userSpaceOnUse">
                      <stop stopColor="#41D1FF"/>
                      <stop offset="1" stopColor="#BD34FE"/>
                    </linearGradient>
                    <linearGradient id="vite-gradient-2" x1="10.035" y1="2.171" x2="12.378" y2="16.885" gradientUnits="userSpaceOnUse">
                      <stop stopColor="#FFBD4F"/>
                      <stop offset="1" stopColor="#FF980E"/>
                    </linearGradient>
                  </defs>
                </svg>
              )
            },
            { 
              name: 'Flask', 
              desc: 'Backend API',
              icon: (
                <svg viewBox="0 0 24 24" className={`w-8 h-8 ${darkMode ? 'text-white' : 'text-slate-800'}`} fill="currentColor">
                  <path d="M7.172 20.36c-.667-.283-1.213-.648-1.72-1.091a7.413 7.413 0 01-1.212-1.357c-.746-1.023-1.2-2.152-1.428-3.396-.085-.469-.134-.945-.136-1.42C2.67 11.645 3.3 10.3 4.286 9.12c.18-.214.371-.418.586-.597.054-.045.07-.086.063-.155a5.84 5.84 0 01.043-1.207 5.79 5.79 0 01.66-2.031c.376-.682.849-1.284 1.457-1.77.193-.155.399-.293.608-.426.033-.02.07-.035.126-.062-.01.087-.015.159-.026.23a7.63 7.63 0 00-.048.931c.007.39.05.777.13 1.16.025.117.009.164-.102.217a4.15 4.15 0 00-.934.582c-.472.394-.83.875-1.088 1.432a4.212 4.212 0 00-.356 1.47c-.02.332-.015.665.024.996.014.111.003.159-.114.184a6.463 6.463 0 00-1.79.683 5.096 5.096 0 00-1.385 1.109 4.94 4.94 0 00-.946 1.595 5.618 5.618 0 00-.288 1.376 6.457 6.457 0 00.217 2.244c.218.748.548 1.442.99 2.08.36.52.78.982 1.254 1.395.473.414.991.765 1.55 1.058.12.063.148.123.104.247-.247.691-.483 1.386-.723 2.08-.016.046-.037.09-.06.148-.113-.048-.22-.089-.323-.138zM16.4 20.345c-.077-.214-.152-.423-.229-.632-.182-.5-.366-.998-.542-1.5-.046-.131-.02-.196.101-.262a8.198 8.198 0 001.648-1.12c.62-.528 1.138-1.14 1.548-1.846a6.144 6.144 0 00.706-1.994c.097-.521.126-1.048.093-1.576a5.137 5.137 0 00-.509-1.856 4.89 4.89 0 00-.89-1.319 5.178 5.178 0 00-1.327-.994 6.452 6.452 0 00-1.564-.642c-.115-.034-.134-.083-.118-.194.072-.519.092-1.04.059-1.562a4.257 4.257 0 00-.352-1.426 4.183 4.183 0 00-1.018-1.44 4.2 4.2 0 00-1.086-.737c-.14-.07-.166-.129-.102-.275.302-.693.593-1.39.886-2.087.016-.038.035-.074.06-.127.071.034.138.063.202.097.678.357 1.287.814 1.819 1.372a6.062 6.062 0 011.306 2.005c.222.55.36 1.123.424 1.713.014.125.025.25.032.376.002.044.015.066.06.078a7.37 7.37 0 012.047.866c.712.439 1.318.996 1.803 1.683.595.843.943 1.784 1.065 2.814.062.522.07 1.046.018 1.569-.092.924-.345 1.805-.753 2.637a7.63 7.63 0 01-1.417 2.01c-.557.572-1.18 1.061-1.87 1.463a8.158 8.158 0 01-1.716.793c-.138.047-.172.112-.127.249.252.765.496 1.533.742 2.3.01.034.018.068.031.118-.094.022-.183.047-.274.064a8.98 8.98 0 01-1.14.153c-.087.006-.12-.022-.147-.103z"/>
                </svg>
              )
            },
            { 
              name: 'Web Audio', 
              desc: 'Sound Synthesis',
              icon: (
                <svg viewBox="0 0 24 24" className="w-8 h-8 text-violet-400" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19.114 5.636a9 9 0 010 12.728M16.463 8.288a5.25 5.25 0 010 7.424M6.75 8.25l4.72-4.72a.75.75 0 011.28.53v15.88a.75.75 0 01-1.28.53l-4.72-4.72H4.51c-.88 0-1.704-.507-1.938-1.354A9.01 9.01 0 012.25 12c0-.83.112-1.633.322-2.396C2.806 8.756 3.63 8.25 4.51 8.25H6.75z"/>
                </svg>
              )
            },
            { 
              name: 'jsPDF', 
              desc: 'PDF Generation',
              icon: (
                <svg viewBox="0 0 24 24" className="w-8 h-8 text-red-400" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z"/>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 15.75l1.5-1.5m0 0l1.5-1.5m-1.5 1.5l-1.5-1.5m1.5 1.5l1.5 1.5"/>
                </svg>
              )
            },
            { 
              name: 'html2canvas', 
              desc: 'Canvas Rendering',
              icon: (
                <svg viewBox="0 0 24 24" className="w-8 h-8 text-emerald-400" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z"/>
                </svg>
              )
            },
            { 
              name: 'Axios', 
              desc: 'HTTP Client',
              icon: (
                <svg viewBox="0 0 24 24" className="w-8 h-8 text-indigo-400" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 21a9.004 9.004 0 008.716-6.747M12 21a9.004 9.004 0 01-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 017.843 4.582M12 3a8.997 8.997 0 00-7.843 4.582m15.686 0A11.953 11.953 0 0112 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0121 12c0 .778-.099 1.533-.284 2.253m0 0A17.919 17.919 0 0112 16.5c-3.162 0-6.133-.815-8.716-2.247m0 0A9.015 9.015 0 013 12c0-1.605.42-3.113 1.157-4.418"/>
                </svg>
              )
            },
          ].map((tech, i) => (
            <div 
              key={i}
              className={`rounded-xl p-4 text-center transition-all hover:scale-105 ${
                darkMode ? 'bg-slate-800/50 border border-slate-700' : 'bg-white border border-slate-200 shadow-md'
              }`}
            >
              <div className="flex justify-center mb-2">{tech.icon}</div>
              <div className={`font-semibold ${darkMode ? 'text-white' : 'text-slate-900'}`}>{tech.name}</div>
              <div className={`text-xs ${darkMode ? 'text-slate-500' : 'text-slate-500'}`}>{tech.desc}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Roadmap */}
      <section className={`rounded-2xl p-8 ${
        darkMode ? 'bg-slate-800/50 border border-slate-700' : 'bg-white border border-slate-200 shadow-xl'
      }`}>
        <h2 className={`text-2xl font-bold mb-6 ${darkMode ? 'text-white' : 'text-slate-900'}`}>
          Development Roadmap
        </h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {roadmap.map((item, i) => (
            <div 
              key={i}
              className={`flex items-center gap-3 p-3 rounded-lg ${
                darkMode ? 'bg-slate-700/50' : 'bg-slate-50'
              }`}
            >
              {item.status === 'done' && (
                <div className="w-6 h-6 rounded-full bg-emerald-500/20 flex items-center justify-center flex-shrink-0">
                  <svg className="w-4 h-4 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7"/>
                  </svg>
                </div>
              )}
              {item.status === 'planned' && (
                <div className="w-6 h-6 rounded-full bg-amber-500/20 flex items-center justify-center flex-shrink-0">
                  <div className="w-2 h-2 rounded-full bg-amber-500"></div>
                </div>
              )}
              {item.status === 'future' && (
                <div className="w-6 h-6 rounded-full bg-slate-500/20 flex items-center justify-center flex-shrink-0">
                  <div className="w-2 h-2 rounded-full bg-slate-500"></div>
                </div>
              )}
              <span className={`text-sm ${
                item.status === 'done' 
                  ? (darkMode ? 'text-white' : 'text-slate-900')
                  : (darkMode ? 'text-slate-400' : 'text-slate-600')
              }`}>
                {item.text}
              </span>
            </div>
          ))}
        </div>
        <div className="flex gap-6 mt-6 pt-6 border-t border-slate-200 dark:border-slate-700">
          <div className="flex items-center gap-2 text-sm">
            <div className="w-3 h-3 rounded-full bg-emerald-500"></div>
            <span className={darkMode ? 'text-slate-400' : 'text-slate-600'}>Completed</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <div className="w-3 h-3 rounded-full bg-amber-500"></div>
            <span className={darkMode ? 'text-slate-400' : 'text-slate-600'}>In Progress</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <div className="w-3 h-3 rounded-full bg-slate-500"></div>
            <span className={darkMode ? 'text-slate-400' : 'text-slate-600'}>Planned</span>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section>
        <h2 className={`text-2xl font-bold mb-6 text-center ${darkMode ? 'text-white' : 'text-slate-900'}`}>
          Frequently Asked Questions
        </h2>
        <div className="space-y-4 max-w-3xl mx-auto">
          {faqs.map((faq, i) => (
            <details 
              key={i}
              className={`group rounded-xl overflow-hidden ${
                darkMode ? 'bg-slate-800/50 border border-slate-700' : 'bg-white border border-slate-200 shadow-md'
              }`}
            >
              <summary className={`flex items-center justify-between p-5 cursor-pointer font-medium ${
                darkMode ? 'text-white hover:bg-slate-700/50' : 'text-slate-900 hover:bg-slate-50'
              }`}>
                {faq.q}
                <svg className="w-5 h-5 transition-transform group-open:rotate-180" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7"/>
                </svg>
              </summary>
              <div className={`px-5 pb-5 ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                {faq.a}
              </div>
            </details>
          ))}
        </div>
      </section>

      {/* Keyboard Shortcuts */}
      <section className={`rounded-2xl p-8 ${
        darkMode ? 'bg-gradient-to-br from-indigo-900/30 to-purple-900/30 border border-indigo-500/20' : 'bg-gradient-to-br from-indigo-50 to-purple-50'
      }`}>
        <h2 className={`text-2xl font-bold mb-6 text-center ${darkMode ? 'text-white' : 'text-slate-900'}`}>
          Keyboard Shortcuts
        </h2>
        <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-4 max-w-3xl mx-auto">
          {[
            { keys: ['←', '→', '↑', '↓'], action: 'Navigate cells' },
            { keys: ['Tab'], action: 'Move to next cell' },
            { keys: ['0-9'], action: 'Enter fret number' },
            { keys: ['h'], action: 'Hammer-on' },
            { keys: ['p'], action: 'Pull-off' },
            { keys: ['x'], action: 'Muted note' },
          ].map((shortcut, i) => (
            <div key={i} className={`flex items-center gap-3 p-3 rounded-lg ${
              darkMode ? 'bg-slate-800/50' : 'bg-white shadow-sm'
            }`}>
              <div className="flex gap-1">
                {shortcut.keys.map((key, j) => (
                  <kbd 
                    key={j}
                    className={`px-2 py-1 text-xs font-mono rounded ${
                      darkMode 
                        ? 'bg-slate-700 text-slate-300 border border-slate-600' 
                        : 'bg-slate-100 text-slate-700 border border-slate-200'
                    }`}
                  >
                    {key}
                  </kbd>
                ))}
              </div>
              <span className={`text-sm ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                {shortcut.action}
              </span>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="text-center">
        <h2 className={`text-2xl font-bold mb-4 ${darkMode ? 'text-white' : 'text-slate-900'}`}>
          Ready to Start?
        </h2>
        <p className={`mb-6 ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>
          Jump into the editor and create your first guitar tab!
        </p>
        <div className="flex gap-4 justify-center">
          <button
            onClick={() => onNavigate('editor')}
            className="px-8 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-semibold rounded-xl
                     shadow-lg shadow-indigo-500/25 hover:shadow-indigo-500/40 transition-all duration-300"
          >
            Open Tab Editor
          </button>
          <button
            onClick={() => onNavigate('recorder')}
            className={`px-8 py-3 font-semibold rounded-xl transition-all duration-300 ${
              darkMode 
                ? 'bg-slate-700 text-white hover:bg-slate-600' 
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            Try Recording
          </button>
        </div>
      </section>
    </div>
  )
}

export default AboutPage
