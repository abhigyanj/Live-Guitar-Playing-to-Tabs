import { Component } from 'react'

class StudioErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = {
      hasError: false,
      errorMessage: '',
    }
  }

  static getDerivedStateFromError(error) {
    return {
      hasError: true,
      errorMessage: error?.message || 'Unknown studio error',
    }
  }

  componentDidCatch(error, errorInfo) {
    console.error('Studio render error:', error)
    console.error('Studio component stack:', errorInfo?.componentStack)
  }

  handleReset = () => {
    this.setState({ hasError: false, errorMessage: '' })
  }

  render() {
    const { children, darkMode = false } = this.props

    if (!this.state.hasError) {
      return children
    }

    return (
      <div className={`rounded-[28px] border px-6 py-8 shadow-xl backdrop-blur-2xl ${
        darkMode
          ? 'border-red-500/25 bg-slate-950/80 text-slate-100'
          : 'border-red-200 bg-white/92 text-slate-900'
      }`}>
        <p className="app-kicker">Studio recovery</p>
        <h2 className="mt-3 text-2xl font-semibold tracking-[-0.03em]">
          The studio hit a rendering error.
        </h2>
        <p className={`mt-3 text-sm leading-7 ${darkMode ? 'text-slate-300' : 'text-slate-600'}`}>
          This panel has been safely recovered so the app does not go blank. You can continue or retry the failed action.
        </p>
        {this.state.errorMessage && (
          <p className={`mt-3 rounded-xl px-3 py-2 text-xs font-medium ${
            darkMode ? 'bg-red-500/15 text-red-200' : 'bg-red-50 text-red-700'
          }`}>
            {this.state.errorMessage}
          </p>
        )}

        <div className="mt-5 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={this.handleReset}
            className={`rounded-xl px-4 py-2 text-sm font-semibold transition-colors ${
              darkMode ? 'bg-white text-slate-950 hover:bg-slate-100' : 'bg-slate-950 text-white hover:bg-slate-800'
            }`}
          >
            Retry studio
          </button>
          <button
            type="button"
            onClick={() => window.location.reload()}
            className={`rounded-xl px-4 py-2 text-sm font-medium transition-colors ${
              darkMode ? 'bg-slate-700 text-slate-200 hover:bg-slate-600' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            Reload page
          </button>
        </div>
      </div>
    )
  }
}

export default StudioErrorBoundary
