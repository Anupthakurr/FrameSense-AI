import React from 'react'

export default function PdfDownload({ result, onDownload, onReset }) {
  const { title, total_scenes, captured, filtered } = result

  return (
    <div className="glass-card download-card">
      <div className="download-icon">📄</div>

      <h2>Your PDF is Ready!</h2>
      <p style={{ maxWidth: 480, margin: '0 auto 28px' }}>
        <strong style={{ color: 'var(--text-primary)' }}>{title}</strong>
        <br />
        <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
          PDF contains {captured} scene screenshot{captured !== 1 ? 's' : ''} with timestamps
        </span>
      </p>

      <div className="download-stats">
        <div className="dl-stat green">
          <div className="stat-num">{captured}</div>
          <div className="stat-label">Scenes Captured</div>
        </div>
        <div className="dl-stat amber">
          <div className="stat-num">{filtered}</div>
          <div className="stat-label">Frames Filtered</div>
        </div>
        <div className="dl-stat indigo">
          <div className="stat-num">{total_scenes}</div>
          <div className="stat-label">Total Scenes</div>
        </div>
      </div>

      <div>
        <button
          id="download-pdf-btn"
          className="btn-download"
          onClick={onDownload}
        >
          <span>⬇️</span>
          Download PDF
        </button>
      </div>

      <div>
        <button
          id="new-video-btn"
          className="btn-new"
          onClick={onReset}
        >
          ↩ Process another video
        </button>
      </div>
    </div>
  )
}
