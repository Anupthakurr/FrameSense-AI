import React, { useState, useCallback } from 'react'
import Hero from './components/Hero'
import UrlInput from './components/UrlInput'
import ProgressStream from './components/ProgressStream'
import SceneGallery from './components/SceneGallery'
import PdfDownload from './components/PdfDownload'

// Backend URL: Uses empty string in production to proxy via Vercel, enabling ISP block bypass
const API_BASE = import.meta.env.DEV ? 'http://localhost:5000' : ''

export default function App() {
  const [phase, setPhase] = useState('idle') // idle | processing | done | error
  const [jobId, setJobId] = useState(null)
  const [steps, setSteps] = useState([])
  const [result, setResult] = useState(null)
  const [errorMsg, setErrorMsg] = useState('')

  const handleGetStarted = useCallback(() => {
    document.getElementById('generate')?.scrollIntoView({ behavior: 'smooth' })
  }, [])

  const handleGenerate = useCallback(async ({ url, threshold, enablePersonFilter, centerFraction }) => {
    setPhase('processing')
    setSteps([])
    setResult(null)
    setErrorMsg('')

    let jobIdLocal
    try {
      const res = await fetch(`${API_BASE}/api/process`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          url,
          threshold,
          enable_person_filter: enablePersonFilter,
          center_fraction: centerFraction,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Server error')
      jobIdLocal = data.job_id
      setJobId(jobIdLocal)
    } catch (e) {
      setErrorMsg(e.message)
      setPhase('error')
      return
    }

    const es = new EventSource(`${API_BASE}/api/progress/${jobIdLocal}`)

    es.onmessage = (e) => {
      try {
        const { event, data } = JSON.parse(e.data)

        if (event === 'step') {
          setSteps(prev => {
            const existing = prev.findIndex(s => s.step === data.step)
            if (existing >= 0) {
              const updated = [...prev]
              updated[existing] = { ...updated[existing], ...data, status: data.pct === 100 ? 'done' : 'active' }
              return updated
            }
            return [...prev, { ...data, status: 'active' }]
          })
        }

        if (event === 'progress') {
          setSteps(prev =>
            prev.map(s =>
              s.step === data.step
                ? { ...s, pct: data.pct, detail: data.timecode || data.message || s.detail }
                : s
            )
          )
        }

        if (event === 'done') {
          setResult(data)
          setPhase('done')
          setSteps(prev => prev.map(s => ({ ...s, status: 'done' })))
          es.close()
        }

        if (event === 'error') {
          setErrorMsg(data.message)
          setPhase('error')
          es.close()
        }

        if (event === 'end') es.close()
      } catch (_) {}
    }

    es.onerror = () => {
      setErrorMsg('Connection lost. Please try again.')
      setPhase('error')
      es.close()
    }
  }, [])

  const handleReset = useCallback(() => {
    if (jobId) {
      fetch(`${API_BASE}/api/cleanup/${jobId}`, { method: 'DELETE' }).catch(() => {})
    }
    setPhase('idle')
    setJobId(null)
    setSteps([])
    setResult(null)
    setErrorMsg('')
  }, [jobId])

  const handleDownload = useCallback(() => {
    if (!jobId) return
    window.open(`${API_BASE}/api/download/${jobId}`, '_blank')
  }, [jobId])

  return (
    <>
      {/* Navbar */}
      <nav className="navbar">
        <div className="navbar-logo">
          <div className="logo-icon">📸</div>
          <span className="logo-text">SnapMint</span>
        </div>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <span className="navbar-badge">Scene AI</span>
          <button
            className="btn-nav-cta"
            onClick={handleGetStarted}
            id="navbar-cta-btn"
          >
            Try Free →
          </button>
        </div>
      </nav>

      <main>
        {/* Landing page — always shown when idle */}
        {phase === 'idle' && <Hero onGetStarted={handleGetStarted} />}

        <div className="container">
          {/* URL Input */}
          {(phase === 'idle' || phase === 'error') && (
            <section className="url-input-section">
              <UrlInput onGenerate={handleGenerate} />
              {phase === 'error' && errorMsg && (
                <div className="glass-card error-card" style={{ marginTop: 20 }}>
                  <h3>⚠️ Something went wrong</h3>
                  <p>{errorMsg}</p>
                </div>
              )}
            </section>
          )}

          {/* Processing */}
          {phase === 'processing' && (
            <section className="progress-section">
              <ProgressStream steps={steps} />
            </section>
          )}

          {/* Results */}
          {phase === 'done' && result && (
            <>
              <section className="gallery-section">
                <SceneGallery thumbnails={result.thumbnails} />
              </section>
              <section className="download-section">
                <PdfDownload
                  result={result}
                  onDownload={handleDownload}
                  onReset={handleReset}
                />
              </section>
            </>
          )}

          {/* Error retry */}
          {phase === 'error' && (
            <div style={{ textAlign: 'center', marginBottom: 40 }}>
              <button className="btn-new" onClick={handleReset}>↩ Try Again</button>
            </div>
          )}
        </div>
      </main>

      <footer className="footer">
        <div className="container">
          Built with ❤️ by SnapMint &nbsp;•&nbsp; Powered by PySceneDetect + OpenCV
        </div>
      </footer>
    </>
  )
}
