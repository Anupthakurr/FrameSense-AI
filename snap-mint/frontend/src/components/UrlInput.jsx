import React, { useState, useRef, useEffect } from 'react'

const MIN_THRESHOLD = 5
const MAX_THRESHOLD = 40
const DEFAULT_THRESHOLD = 5

export default function UrlInput({ onGenerate }) {
  const [url, setUrl] = useState('')
  const [threshold, setThreshold] = useState(DEFAULT_THRESHOLD)
  const [enablePersonFilter, setEnablePersonFilter] = useState(true)
  const [centerFraction, setCenterFraction] = useState(40)
  const [loading, setLoading] = useState(false)
  const inputRef = useRef(null)

  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  const isValidUrl = url.includes('youtube.com/watch') || url.includes('youtu.be/')

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!isValidUrl || loading) return
    setLoading(true)
    try {
      await onGenerate({
        url: url.trim(),
        threshold,
        enablePersonFilter,
        centerFraction: centerFraction / 100,
      })
    } finally {
      setLoading(false)
    }
  }

  // Compute slider percentage for CSS gradient
  const thresholdPct = ((threshold - MIN_THRESHOLD) / (MAX_THRESHOLD - MIN_THRESHOLD)) * 100
  const centerPct = ((centerFraction - 20) / (60 - 20)) * 100

  return (
    <div id="generate" className="glass-card url-card">
      <h2>🎯 Generate PDF from YouTube</h2>
      <p>Paste a YouTube video URL and we'll extract smart scene screenshots for you.</p>

      <form onSubmit={handleSubmit}>
        <div className="url-input-wrapper">
          <input
            ref={inputRef}
            id="youtube-url-input"
            type="text"
            className="url-input"
            placeholder="https://www.youtube.com/watch?v=..."
            value={url}
            onChange={e => setUrl(e.target.value)}
            autoComplete="off"
            spellCheck="false"
          />
          <button
            id="generate-btn"
            type="submit"
            className="btn-primary"
            disabled={!isValidUrl || loading}
          >
            {loading
              ? <><div className="spinner" /> Processing…</>
              : <><span>✨</span> Generate PDF</>
            }
          </button>
        </div>

        <div className="settings-grid">
          {/* Threshold slider */}
          <div className="setting-group">
            <label>
              Scene Sensitivity
              <span className="value-badge">{threshold}</span>
            </label>
            <input
              id="threshold-slider"
              type="range"
              className="slider"
              min={MIN_THRESHOLD}
              max={MAX_THRESHOLD}
              value={threshold}
              style={{ '--val': `${thresholdPct}%` }}
              onChange={e => setThreshold(Number(e.target.value))}
            />
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6 }}>
              <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>More scenes</span>
              <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Fewer scenes</span>
            </div>
          </div>

          {/* Person filter toggle */}
          <div className="setting-group">
            <label>Smart Filtering</label>
            <div className="toggle-row">
              <div className="toggle-info">
                <strong>Person Center Filter</strong>
                <span>Skip frames where presenter blocks content</span>
              </div>
              <label className="toggle" htmlFor="person-filter-toggle">
                <input
                  id="person-filter-toggle"
                  type="checkbox"
                  checked={enablePersonFilter}
                  onChange={e => setEnablePersonFilter(e.target.checked)}
                />
                <span className="toggle-track" />
              </label>
            </div>
          </div>

          {/* Center zone slider — only shown when filter is on */}
          {enablePersonFilter && (
            <div className="setting-group" style={{ gridColumn: '1 / -1' }}>
              <label>
                Center Zone Width
                <span className="value-badge">{centerFraction}%</span>
              </label>
              <input
                id="center-zone-slider"
                type="range"
                className="slider"
                min={20}
                max={60}
                value={centerFraction}
                style={{ '--val': `${centerPct}%` }}
                onChange={e => setCenterFraction(Number(e.target.value))}
              />
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6 }}>
                <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Narrow (20%)</span>
                <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Wide (60%)</span>
              </div>
              <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: 8 }}>
                If a person's center point is within the middle <strong style={{ color: 'var(--color-amber)' }}>{centerFraction}%</strong> of the frame, the screenshot is skipped.
              </p>
            </div>
          )}
        </div>
      </form>
    </div>
  )
}
