import React from 'react'

const STEPS_CONFIG = [
  {
    key: 'downloading',
    icon: '📥',
    label: 'Downloading Video',
    description: 'Fetching video via yt-dlp (up to 720p)',
  },
  {
    key: 'detecting',
    icon: '🔍',
    label: 'Detecting Scenes',
    description: 'ContentDetector finds natural cut points',
  },
  {
    key: 'filtering',
    icon: '🧠',
    label: 'Filtering & Extracting',
    description: 'Skipping frames where person blocks center',
  },
  {
    key: 'building_pdf',
    icon: '📄',
    label: 'Building PDF',
    description: 'Assembling screenshots with timestamps',
  },
]

function getStepStatus(stepKey, steps) {
  const found = steps.find(s => s.step === stepKey)
  if (!found) return 'pending'
  return found.status || 'active'
}

function getStepData(stepKey, steps) {
  return steps.find(s => s.step === stepKey) || {}
}

// Compute overall progress: each step = 25%, weight by step completion
function getOverallPct(steps) {
  const order = ['downloading', 'detecting', 'filtering', 'building_pdf']
  let total = 0
  order.forEach((key, i) => {
    const data = steps.find(s => s.step === key) || {}
    const status = data.status || 'pending'
    if (status === 'done') {
      total += 25
    } else if (status === 'active') {
      const pct = typeof data.pct === 'number' ? data.pct : 0
      total += (pct / 100) * 25
    }
  })
  return Math.min(99, Math.round(total))
}

export default function ProgressStream({ steps }) {
  const overallPct = getOverallPct(steps)

  return (
    <div className="glass-card progress-card">

      {/* ── Header with overall % ── */}
      <div className="progress-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div className="spinner" />
          <span style={{ fontSize: '1.1rem', fontWeight: 700 }}>Processing your video…</span>
        </div>
        <div className="overall-pct-badge">
          {overallPct}%
        </div>
      </div>

      {/* ── Overall bar ── */}
      <div className="overall-bar-wrap">
        <div className="overall-bar" style={{ width: `${overallPct}%` }} />
      </div>

      {/* ── Steps ── */}
      <div className="progress-steps" style={{ marginTop: 28 }}>
        {STEPS_CONFIG.map(({ key, icon, label, description }, idx) => {
          const status = getStepStatus(key, steps)
          const data = getStepData(key, steps)
          const pct = typeof data.pct === 'number' ? data.pct : (status === 'done' ? 100 : 0)

          return (
            <div
              key={key}
              className={`step-item ${status}`}
              style={{ animationDelay: `${idx * 0.05}s` }}
            >
              <div className="step-icon">
                {status === 'done' ? '✓' : status === 'error' ? '✕' : icon}
              </div>

              <div className="step-body">
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div className="step-label">{label}</div>

                  {/* Percentage badge */}
                  {status !== 'pending' && (
                    <div className={`step-pct-badge ${status}`}>
                      {status === 'done'
                        ? <span style={{ color: 'var(--color-green)' }}>100%</span>
                        : status === 'active'
                        ? <span className="pct-counter">{pct}%</span>
                        : null
                      }
                    </div>
                  )}
                </div>

                <div className="step-detail">
                  {status === 'pending' && description}
                  {status === 'active' && (data.message || description)}
                  {status === 'done' && (data.message || '✓ Complete')}
                  {status === 'error' && (data.message || 'Failed')}
                </div>

                {/* Per-step progress bar */}
                {(status === 'active' || status === 'done') && (
                  <div className="step-bar-wrap">
                    <div
                      className="step-bar"
                      style={{
                        width: `${status === 'done' ? 100 : pct}%`,
                        background: status === 'done'
                          ? 'linear-gradient(90deg, var(--color-green), #34d399)'
                          : 'linear-gradient(90deg, var(--color-indigo), var(--color-indigo-light))',
                      }}
                    />
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
