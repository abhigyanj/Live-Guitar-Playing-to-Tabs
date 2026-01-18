import { useContext, useEffect, useState, useRef, useMemo } from 'react'
import { ThemeContext } from '../App'

// Floating particles component - uses useMemo to prevent regeneration on re-render
const FloatingParticles = ({ darkMode }) => {
  const particles = useMemo(() => 
    Array.from({ length: 12 }, (_, i) => ({
      id: i,
      size: Math.random() * 3 + 2,
      left: Math.random() * 100,
      delay: Math.random() * 8,
      duration: Math.random() * 15 + 20,
      opacity: Math.random() * 0.3 + 0.1
    })), []
  )

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {particles.map((p) => (
        <div
          key={p.id}
          className={`particle rounded-full ${darkMode ? 'bg-indigo-400' : 'bg-indigo-500'}`}
          style={{
            width: p.size,
            height: p.size,
            left: `${p.left}%`,
            animationDelay: `${p.delay}s`,
            animationDuration: `${p.duration}s`,
            opacity: p.opacity
          }}
        />
      ))}
    </div>
  )
}

// Animated equalizer bars - static heights to prevent re-render jitter
const eqBarStaticHeights = [65, 45, 80, 35, 70]
const EqualizerBars = () => {
  return (
    <div className="flex items-end gap-1 h-8">
      {eqBarStaticHeights.map((height, i) => (
        <div
          key={i}
          className="eq-bar w-1.5 bg-gradient-to-t from-emerald-500 to-cyan-400 rounded-full"
          style={{ 
            height: `${height}%`,
            minHeight: '20%'
          }}
        />
      ))}
    </div>
  )
}

// 3D Mockup Card Component
const Hero3DCard = ({ className, children, delay = 0, style = {} }) => {
  return (
    <div 
      className={`floating-card-3d hero-card rounded-xl overflow-hidden ${className}`}
      style={{ animationDelay: `${delay}s`, ...style }}
    >
      {children}
    </div>
  )
}

function HomePage({ onNavigate }) {
  const { darkMode } = useContext(ThemeContext)
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 })
  const heroRef = useRef(null)
  const rafRef = useRef(null)

  // Stable bar heights for the equalizer animation
  const eqBarHeights = useMemo(() => 
    Array.from({ length: 12 }, () => 20 + Math.random() * 80), []
  )

  // Track mouse for parallax effect - throttled with requestAnimationFrame
  useEffect(() => {
    const handleMouseMove = (e) => {
      if (rafRef.current) return // Skip if already scheduled
      
      rafRef.current = requestAnimationFrame(() => {
        if (heroRef.current) {
          const rect = heroRef.current.getBoundingClientRect()
          setMousePosition({
            x: (e.clientX - rect.left - rect.width / 2) / rect.width,
            y: (e.clientY - rect.top - rect.height / 2) / rect.height
          })
        }
        rafRef.current = null
      })
    }
    
    window.addEventListener('mousemove', handleMouseMove)
    return () => {
      window.removeEventListener('mousemove', handleMouseMove)
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
    }
  }, [])

  const features = [
    {
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="url(#gradient-indigo)" viewBox="0 0 24 24">
          <defs>
            <linearGradient id="gradient-indigo" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#6366f1" />
              <stop offset="100%" stopColor="#9333ea" />
            </linearGradient>
          </defs>
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3"/>
        </svg>
      ),
      title: 'Professional Tab Editor',
      description: 'Create guitar tablature with an intuitive grid interface. Add bars, set tempo, time signatures, and section names.',
      color: 'from-indigo-500 to-purple-600',
      bgColor: darkMode ? 'bg-indigo-500/10' : 'bg-indigo-50'
    },
    {
      icon: (
        <svg className="w-6 h-6" fill="url(#gradient-emerald)" viewBox="0 0 24 24">
          <defs>
            <linearGradient id="gradient-emerald" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#10b981" />
              <stop offset="100%" stopColor="#0d9488" />
            </linearGradient>
          </defs>
          <path d="M8 5v14l11-7z"/>
        </svg>
      ),
      title: 'Playback & Listen',
      description: 'Hear your tabs come to life with synthesized guitar sounds. Adjust tempo and watch visual playback indicators.',
      color: 'from-emerald-500 to-teal-600',
      bgColor: darkMode ? 'bg-emerald-500/10' : 'bg-emerald-50'
    },
    {
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="url(#gradient-purple)" viewBox="0 0 24 24">
          <defs>
            <linearGradient id="gradient-purple" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#a855f7" />
              <stop offset="100%" stopColor="#ec4899" />
            </linearGradient>
          </defs>
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"/>
        </svg>
      ),
      title: 'Export to PDF',
      description: 'Generate professional sheet music ready to print or share. Perfect for practice sessions or band members.',
      color: 'from-purple-500 to-pink-600',
      bgColor: darkMode ? 'bg-purple-500/10' : 'bg-purple-50'
    },
    {
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="url(#gradient-amber)" viewBox="0 0 24 24">
          <defs>
            <linearGradient id="gradient-amber" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#f59e0b" />
              <stop offset="100%" stopColor="#ea580c" />
            </linearGradient>
          </defs>
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"/>
        </svg>
      ),
      title: 'Audio Recording',
      description: 'Record your guitar playing directly in the browser. Save and manage multiple recordings with ease.',
      color: 'from-amber-500 to-orange-600',
      bgColor: darkMode ? 'bg-amber-500/10' : 'bg-amber-50'
    },
    {
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="url(#gradient-green)" viewBox="0 0 24 24">
          <defs>
            <linearGradient id="gradient-green" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#22c55e" />
              <stop offset="100%" stopColor="#10b981" />
            </linearGradient>
          </defs>
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2z"/>
        </svg>
      ),
      title: 'Live Transcription ✨',
      description: 'Play your guitar and watch tabs generate in real-time! AI-powered pitch detection converts your playing into tablature.',
      color: 'from-green-500 to-emerald-600',
      bgColor: darkMode ? 'bg-green-500/10' : 'bg-green-50',
      isNew: true
    },
    {
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="url(#gradient-cyan)" viewBox="0 0 24 24">
          <defs>
            <linearGradient id="gradient-cyan" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#06b6d4" />
              <stop offset="100%" stopColor="#2563eb" />
            </linearGradient>
          </defs>
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01"/>
        </svg>
      ),
      title: 'Technique Notation',
      description: 'Support for hammer-ons, pull-offs, slides, bends, and muted notes with visual indicators.',
      color: 'from-cyan-500 to-blue-600',
      bgColor: darkMode ? 'bg-cyan-500/10' : 'bg-cyan-50'
    },
    {
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="url(#gradient-slate)" viewBox="0 0 24 24">
          <defs>
            <linearGradient id="gradient-slate" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#64748b" />
              <stop offset="100%" stopColor="#334155" />
            </linearGradient>
          </defs>
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"/>
        </svg>
      ),
      title: 'Dark & Light Mode',
      description: 'Switch between themes for comfortable editing day or night. Your preference is saved automatically.',
      color: 'from-slate-500 to-slate-700',
      bgColor: darkMode ? 'bg-slate-500/10' : 'bg-slate-100'
    }
  ]

  const stats = [
    { value: '24', label: 'Frets Supported' },
    { value: '6', label: 'String Standard' },
    { value: '∞', label: 'Bars Available' },
    { value: '40-240', label: 'BPM Range' }
  ]

  return (
    <div className="relative space-y-20">
      {/* Hero Section with 3D Elements */}
      <section ref={heroRef} className="relative min-h-[90vh] flex items-center z-10">
        {/* Hero-specific Background Elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {/* Floating Particles */}
          <FloatingParticles darkMode={darkMode} />
          
          {/* Grid Pattern */}
          <div 
              className={`absolute inset-0 bg-[linear-gradient(rgba(99,102,241,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(99,102,241,0.03)_1px,transparent_1px)] bg-[size:60px_60px] ${
                darkMode ? 'opacity-100' : 'opacity-50'
              }`}
            />
          </div>

          <div className="relative w-full max-w-7xl mx-auto px-4 grid lg:grid-cols-2 gap-12 items-center">
            {/* Left Content */}
            <div className="text-center lg:text-left z-10">
              {/* Badge */}
              <div 
                className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium mb-8 animate-in fade-in ${
                darkMode 
                  ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30' 
                  : 'bg-indigo-100 text-indigo-700 border border-indigo-200'
              }`}
              style={{ animationDuration: '0.6s' }}
            >
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-500"></span>
              </span>
              Free & Open Source
            </div>

            {/* Main heading with gradient */}
            <h1 
              className={`text-5xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight mb-6 animate-in slide-in-from-bottom-5 ${
                darkMode ? 'text-white' : 'text-slate-900'
              }`}
              style={{ animationDuration: '0.8s', animationDelay: '0.1s' }}
            >
              <span className="bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 bg-clip-text text-transparent animate-gradient">
                Guitar Tab
              </span>
              <br />
              <span className="inline-block mt-2">Studio</span>
            </h1>

            {/* Subtitle */}
            <p 
              className={`text-xl sm:text-2xl max-w-xl mx-auto lg:mx-0 mb-10 animate-in slide-in-from-bottom-5 ${
                darkMode ? 'text-slate-400' : 'text-slate-600'
              }`}
              style={{ animationDuration: '0.8s', animationDelay: '0.2s' }}
            >
              Create, play, and share professional guitar tablature.
              The modern way to write and learn guitar music.
            </p>

            {/* CTA Buttons */}
            <div 
              className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start items-center animate-in slide-in-from-bottom-5"
              style={{ animationDuration: '0.8s', animationDelay: '0.3s' }}
            >
              <button
                onClick={() => onNavigate('editor')}
                className="group relative px-8 py-4 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-semibold rounded-2xl
                         shadow-xl shadow-indigo-500/25 hover:shadow-indigo-500/50 transition-all duration-300
                         flex items-center gap-3 hover:scale-105 overflow-hidden"
              >
                {/* Shimmer effect */}
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
                
                <svg className="w-5 h-5 relative z-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3"/>
                </svg>
                <span className="relative z-10">Open Tab Studio</span>
                <svg className="w-4 h-4 relative z-10 transition-transform group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6"/>
                </svg>
              </button>
              
              <button
                onClick={() => onNavigate('editor')}
                className={`group px-8 py-4 font-semibold rounded-2xl transition-all duration-300 flex items-center gap-3 hover:scale-105 ${
                  darkMode 
                    ? 'glass-dark text-white hover:bg-slate-700/50' 
                    : 'bg-white/80 backdrop-blur text-slate-700 hover:bg-white shadow-xl border border-slate-200'
                }`}
              >
                <span className="relative flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
                </span>
                Live Recording
              </button>
            </div>

            {/* Quick stats */}
            <div 
              className="flex gap-8 mt-12 justify-center lg:justify-start animate-in fade-in"
              style={{ animationDuration: '1s', animationDelay: '0.5s' }}
            >
              {[
                { value: '24', label: 'Frets' },
                { value: '∞', label: 'Bars' },
                { value: 'AI', label: 'Powered' }
              ].map((stat, i) => (
                <div key={i} className="text-center">
                  <div className="text-2xl font-bold bg-gradient-to-r from-indigo-500 to-purple-500 bg-clip-text text-transparent">
                    {stat.value}
                  </div>
                  <div className={`text-xs ${darkMode ? 'text-slate-500' : 'text-slate-500'}`}>
                    {stat.label}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Right Side - 3D Floating UI Mockups */}
          <div className="hidden lg:block relative perspective-container h-[600px]">
            {/* Main Editor Card */}
            <Hero3DCard 
              className="absolute top-8 left-0 w-80 animate-float"
              delay={0}
            >
              <div className="p-3 border-b border-white/5">
                <div className="flex items-center gap-2">
                  <div className="flex gap-1.5">
                    <div className="w-3 h-3 rounded-full bg-red-500"></div>
                    <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                    <div className="w-3 h-3 rounded-full bg-green-500"></div>
                  </div>
                  <span className="text-slate-400 text-xs font-medium ml-2">Tab Editor</span>
                </div>
              </div>
              <div className="p-4 hero-card-content">
                <div className="flex items-center gap-3 mb-4">
                  <span className="text-white font-semibold text-sm">Intro - 4 bars</span>
                  <span className="text-emerald-400 text-xs">♩ = 120</span>
                </div>
                <div className="font-mono text-xs text-emerald-400 leading-relaxed">
                  <div>e|--0--2--3--0--|</div>
                  <div>B|--1--3--0--1--|</div>
                  <div>G|--0--2--0--0--|</div>
                  <div>D|--2--0--0--2--|</div>
                  <div>A|--3--x--2--3--|</div>
                  <div>E|--x--x--3--x--|</div>
                </div>
              </div>
            </Hero3DCard>

            {/* Live Waveform Card */}
            <Hero3DCard 
              className="absolute top-32 right-0 w-64 animate-float-reverse"
              delay={0.5}
            >
              <div className="p-3 border-b border-white/5">
                <div className="flex items-center justify-between">
                  <span className="text-slate-400 text-xs font-medium">Live Audio</span>
                  <span className="flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-2 w-2 rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                  </span>
                </div>
              </div>
              <div className="p-4 hero-card-content">
                <div className="flex items-end justify-center gap-1 h-16 mb-3">
                  {eqBarHeights.map((height, i) => (
                    <div
                      key={i}
                      className="eq-bar w-2 bg-gradient-to-t from-indigo-500 via-purple-500 to-pink-500 rounded-full"
                      style={{ 
                        height: `${height}%`,
                        animationDelay: `${i * 0.05}s`
                      }}
                    />
                  ))}
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-slate-500">Frequency</span>
                  <span className="text-emerald-400">440 Hz (A4)</span>
                </div>
              </div>
            </Hero3DCard>

            {/* Notes Detection Card */}
            <Hero3DCard 
              className="absolute bottom-24 left-8 w-72 animate-float-slow"
              delay={1}
            >
              <div className="p-3 border-b border-white/5">
                <span className="text-slate-400 text-xs font-medium">Detected Notes</span>
              </div>
              <div className="p-4 hero-card-content">
                <div className="flex flex-wrap gap-2 mb-3">
                  {['E', 'G#', 'B', 'E', 'G#'].map((note, i) => (
                    <span 
                      key={i}
                      className="px-3 py-1 rounded-lg text-sm font-semibold"
                      style={{
                        background: `linear-gradient(135deg, ${
                          ['#6366f1', '#a855f7', '#ec4899', '#10b981', '#f59e0b'][i]
                        }20, ${
                          ['#6366f1', '#a855f7', '#ec4899', '#10b981', '#f59e0b'][i]
                        }40)`,
                        color: ['#818cf8', '#c084fc', '#f472b6', '#34d399', '#fbbf24'][i],
                        animationDelay: `${i * 0.1}s`
                      }}
                    >
                      {note}
                    </span>
                  ))}
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500 text-xs">Chord detected:</span>
                  <span className="text-indigo-400 font-semibold">E Major</span>
                </div>
              </div>
            </Hero3DCard>

            {/* Output/Success Card */}
            <Hero3DCard 
              className="absolute bottom-8 right-8 w-56 animate-float"
              delay={1.5}
            >
              <div className="p-3 border-b border-white/5 flex items-center justify-between">
                <span className="text-slate-400 text-xs font-medium">Export</span>
                <button className="px-3 py-1 bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-semibold rounded-lg transition-colors">
                  PDF
                </button>
              </div>
              <div className="p-4 hero-card-content">
                <div className="flex items-center gap-2 text-emerald-400">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7"/>
                  </svg>
                  <span className="text-sm font-medium">Tab saved!</span>
                </div>
                <div className="mt-2 h-2 bg-slate-700 rounded-full overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-emerald-500 to-cyan-500 rounded-full w-full animate-pulse"/>
                </div>
              </div>
            </Hero3DCard>

            {/* Decorative Elements */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-72 h-72 border border-indigo-500/20 rounded-full animate-pulse" style={{ animationDuration: '4s' }}/>
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 border border-purple-500/10 rounded-full animate-pulse" style={{ animationDuration: '6s', animationDelay: '1s' }}/>
          </div>
        </div>

        {/* Scroll Indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 scroll-indicator">
          <div className={`flex flex-col items-center gap-2 ${darkMode ? 'text-slate-500' : 'text-slate-400'}`}>
            <span className="text-xs font-medium">Scroll to explore</span>
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3"/>
            </svg>
          </div>
        </div>
      </section>

      {/* Stats Section with Animated Counters */}
      <section className="relative max-w-7xl mx-auto px-4 z-10">
        <div className={`rounded-3xl p-8 sm:p-12 overflow-hidden relative ${
          darkMode ? 'bg-slate-800/50 border border-slate-700' : 'bg-white/80 backdrop-blur-sm border border-slate-200 shadow-xl'
        }`}>
          {/* Background decoration */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div className={`absolute -top-20 -right-20 w-40 h-40 rounded-full blur-3xl ${
              darkMode ? 'bg-indigo-500/10' : 'bg-indigo-200/50'
            }`}/>
            <div className={`absolute -bottom-20 -left-20 w-40 h-40 rounded-full blur-3xl ${
              darkMode ? 'bg-purple-500/10' : 'bg-purple-200/50'
            }`}/>
          </div>
          
          <div className="relative grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <div 
                key={index} 
                className="text-center group cursor-default"
              >
                <div className={`text-4xl sm:text-5xl font-bold bg-gradient-to-r from-indigo-500 to-purple-600 bg-clip-text text-transparent 
                              transition-transform duration-300 group-hover:scale-110`}>
                  {stat.value}
                </div>
                <div className={`mt-2 text-sm font-medium ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                  {stat.label}
                </div>
                {/* Decorative line */}
                <div className="mt-3 mx-auto w-12 h-0.5 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-full 
                              transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300"/>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Grid with Hover Effects */}
      <section className="max-w-7xl mx-auto px-4 z-10 relative">
        <div className="text-center mb-12">
          <h2 className={`text-3xl sm:text-4xl font-bold mb-4 ${darkMode ? 'text-white' : 'text-slate-900'}`}>
            Everything You Need
          </h2>
          <p className={`text-lg max-w-2xl mx-auto ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>
            A complete toolkit for creating and sharing guitar tablature, right in your browser.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, index) => (
            <div 
              key={index}
              className={`group p-6 rounded-2xl transition-all duration-500 hover:scale-[1.02] relative cursor-pointer ${
                darkMode 
                  ? 'bg-slate-800/50 border border-slate-700 hover:border-slate-500' 
                  : 'bg-white border border-slate-200 shadow-lg hover:shadow-2xl'
              } ${feature.isNew ? (darkMode ? 'ring-2 ring-green-500/50' : 'ring-2 ring-green-400/50') : ''}`}
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              {/* Hover gradient overlay */}
              <div className={`absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none rounded-2xl overflow-hidden
                            bg-gradient-to-br ${feature.color} mix-blend-soft-light`}/>
              
              {/* Shimmer effect on hover */}
              <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 
                            bg-gradient-to-r from-transparent via-white/5 to-transparent pointer-events-none rounded-2xl overflow-hidden"/>
              
              {feature.isNew && (
                <span className="absolute -top-3 -right-3 px-2.5 py-1 text-xs font-bold bg-gradient-to-r from-green-500 to-emerald-600 
                              text-white rounded-full shadow-lg animate-pulse z-20">
                  NEW
                </span>
              )}
              
              <div className={`relative w-12 h-12 rounded-xl ${feature.bgColor} flex items-center justify-center mb-4 
                            transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3`}>
                {feature.icon}
              </div>
              
              <h3 className={`relative text-lg font-semibold mb-2 transition-colors duration-300 ${
                darkMode ? 'text-white group-hover:text-indigo-300' : 'text-slate-900'
              }`}>
                {feature.title}
              </h3>
              
              <p className={`relative text-sm leading-relaxed ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                {feature.description}
              </p>
              
              {/* Arrow indicator on hover */}
              <div className="absolute bottom-6 right-6 opacity-0 translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 
                            transition-all duration-300">
                <svg className={`w-5 h-5 ${darkMode ? 'text-indigo-400' : 'text-indigo-600'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3"/>
                </svg>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Technique Guide with 3D Cards */}
      <section className="perspective-container max-w-7xl mx-auto px-4 z-10 relative">
        <div className={`rounded-3xl overflow-hidden relative ${
          darkMode ? 'bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-700' : 'bg-gradient-to-br from-slate-900 to-slate-800'
        }`}>
          {/* Animated background pattern */}
          <div className="absolute inset-0 opacity-30">
            <div className="absolute inset-0 bg-[linear-gradient(rgba(99,102,241,0.1)_1px,transparent_1px),linear-gradient(90deg,rgba(99,102,241,0.1)_1px,transparent_1px)] bg-[size:40px_40px]"/>
          </div>
          
          <div className="relative p-8 sm:p-12">
            <div className="flex flex-col lg:flex-row gap-12 items-center">
              <div className="flex-1">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-400 text-sm font-medium mb-4">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                  </svg>
                  Pro Features
                </div>
                
                <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
                  Master Guitar <span className="bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent">Notation</span>
                </h2>
                <p className="text-slate-400 text-lg mb-8">
                  Our editor supports all standard guitar tablature symbols and techniques.
                  Visual hints help you understand what each symbol means.
                </p>
                
                <div className="flex flex-wrap gap-4">
                  <button
                    onClick={() => onNavigate('editor')}
                    className="group px-6 py-3 bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-semibold rounded-xl
                             shadow-lg shadow-emerald-500/25 hover:shadow-emerald-500/50 transition-all duration-300 hover:scale-105
                             flex items-center gap-2"
                  >
                    Try the Editor
                    <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6"/>
                    </svg>
                  </button>
                  
                  <button
                    onClick={() => onNavigate('about')}
                    className="px-6 py-3 bg-white/10 hover:bg-white/20 text-white font-semibold rounded-xl
                             border border-white/20 transition-all duration-300"
                  >
                    Learn More
                  </button>
                </div>
              </div>
              
              <div className="flex-1 w-full">
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                  {[
                    { symbol: 'h', name: 'Hammer-on', visual: '⌢', color: 'from-blue-500 to-blue-600', textColor: 'text-blue-400' },
                    { symbol: 'p', name: 'Pull-off', visual: '⌣', color: 'from-purple-500 to-purple-600', textColor: 'text-purple-400' },
                    { symbol: '/', name: 'Slide Up', visual: '↗', color: 'from-green-500 to-green-600', textColor: 'text-green-400' },
                    { symbol: '\\', name: 'Slide Down', visual: '↘', color: 'from-yellow-500 to-yellow-600', textColor: 'text-yellow-400' },
                    { symbol: 'x', name: 'Muted', visual: '✕', color: 'from-red-500 to-red-600', textColor: 'text-red-400' },
                    { symbol: '0-24', name: 'Fret', visual: '●', color: 'from-emerald-500 to-emerald-600', textColor: 'text-emerald-400' },
                  ].map((tech, i) => (
                    <div 
                      key={i} 
                      className="group bg-slate-800/50 hover:bg-slate-700/50 rounded-xl p-4 text-center border border-slate-700/50 
                               hover:border-slate-600 transition-all duration-300 cursor-pointer hover:scale-105 hover:-translate-y-1"
                      style={{ animationDelay: `${i * 0.1}s` }}
                    >
                      <div className={`text-3xl mb-2 ${tech.textColor} group-hover:scale-110 transition-transform duration-300`}>
                        {tech.visual}
                      </div>
                      <code className={`inline-block px-2 py-0.5 rounded bg-gradient-to-r ${tech.color} text-white font-mono text-sm font-semibold`}>
                        {tech.symbol}
                      </code>
                      <div className="text-slate-400 text-xs mt-2 group-hover:text-slate-300 transition-colors">
                        {tech.name}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section with Animated Background */}
      <section className="text-center relative max-w-7xl mx-auto px-4 z-10">
        <div className={`rounded-3xl p-12 overflow-hidden relative ${
          darkMode 
            ? 'bg-gradient-to-r from-indigo-900/50 to-purple-900/50 border border-indigo-500/20' 
            : 'bg-gradient-to-r from-indigo-100 to-purple-100'
        }`}>
          {/* Animated orbs */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div className={`absolute w-64 h-64 rounded-full blur-3xl animate-float-slow ${
              darkMode ? 'bg-indigo-500/20' : 'bg-indigo-300/30'
            }`} style={{ top: '-20%', left: '10%' }}/>
            <div className={`absolute w-48 h-48 rounded-full blur-3xl animate-float ${
              darkMode ? 'bg-purple-500/20' : 'bg-purple-300/30'
            }`} style={{ bottom: '-10%', right: '15%', animationDelay: '-3s' }}/>
            <div className={`absolute w-32 h-32 rounded-full blur-2xl animate-float-reverse ${
              darkMode ? 'bg-pink-500/15' : 'bg-pink-300/25'
            }`} style={{ top: '30%', right: '30%', animationDelay: '-5s' }}/>
          </div>
          
          <div className="relative z-10">
            <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium mb-6 ${
              darkMode ? 'bg-white/10 text-white' : 'bg-white text-indigo-700'
            }`}>
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M13 10V3L4 14h7v7l9-11h-7z"/>
              </svg>
              Start in seconds
            </div>
            
            <h2 className={`text-3xl sm:text-4xl font-bold mb-4 ${darkMode ? 'text-white' : 'text-slate-900'}`}>
              Ready to Create?
            </h2>
            <p className={`text-lg mb-8 max-w-xl mx-auto ${darkMode ? 'text-slate-300' : 'text-slate-600'}`}>
              Start writing your first guitar tab in seconds. No signup required.
            </p>
            
            <button
              onClick={() => onNavigate('editor')}
              className="group relative px-10 py-4 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-bold text-lg rounded-2xl
                       shadow-xl shadow-indigo-500/25 hover:shadow-indigo-500/50 transition-all duration-300 hover:scale-105 overflow-hidden"
            >
              {/* Animated shine */}
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent 
                            -translate-x-full group-hover:translate-x-full transition-transform duration-700"/>
              
              <span className="relative flex items-center gap-3">
                Open Tab Editor
                <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6"/>
                </svg>
              </span>
            </button>
            
            {/* Trust indicators */}
            <div className={`flex items-center justify-center gap-6 mt-8 text-sm ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
              <span className="flex items-center gap-1">
                <svg className="w-4 h-4 text-green-500" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                </svg>
                No signup
              </span>
              <span className="flex items-center gap-1">
                <svg className="w-4 h-4 text-green-500" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                </svg>
                100% Free
              </span>
              <span className="flex items-center gap-1">
                <svg className="w-4 h-4 text-green-500" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                </svg>
                Open Source
              </span>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}

export default HomePage
