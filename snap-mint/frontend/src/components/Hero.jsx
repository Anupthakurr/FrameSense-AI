import React, { useEffect, useRef, useState, useCallback } from 'react'

/* ──────────────────────────────────────────────────────
   DATA
────────────────────────────────────────────────────── */
const FEATURES = [
  { icon: '🎬', title: 'Smart Scene Detection',  desc: 'PySceneDetect finds every natural cut point in your video automatically.', color: '#6366f1' },
  { icon: '🧠', title: 'Person Filter AI',        desc: 'Skips frames where a presenter is blocking the slide content.',            color: '#f59e0b' },
  { icon: '⏱️', title: 'Timestamped Pages',       desc: 'Every screenshot has the exact video timecode burned in.',                 color: '#10b981' },
  { icon: '📄', title: 'PDF Export',               desc: 'Clean A4 landscape PDF, one scene per page, ready to share.',             color: '#8b5cf6' },
  { icon: '📡', title: 'Real-time Progress',       desc: 'Live pipeline updates streamed to you as each step runs.',                color: '#ec4899' },
  { icon: '⚡', title: 'Lossless Quality',         desc: 'PNG frames embedded at full 1080p resolution in the PDF.',                color: '#f97316' },
]

const WORDS = ['Lectures', 'Tutorials', 'Webinars', 'Courses', 'Talks', 'Videos']

/* ──────────────────────────────────────────────────────
   PARTICLE CANVAS (more particles + glow + mouse repel)
────────────────────────────────────────────────────── */
function ParticleCanvas() {
  const canvasRef = useRef(null)
  const mouse = useRef({ x: -999, y: -999 })

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    let animId
    let particles = []

    const resize = () => {
      canvas.width  = canvas.offsetWidth
      canvas.height = canvas.offsetHeight
    }
    resize()
    window.addEventListener('resize', resize)

    const parent = canvas.parentElement
    const onMouseMove = e => {
      if (!canvas) return
      const r = canvas.getBoundingClientRect()
      mouse.current = { x: e.clientX - r.left, y: e.clientY - r.top }
    }
    if (parent) parent.addEventListener('mousemove', onMouseMove)

    const COLORS = ['#6366f1', '#f59e0b', '#8b5cf6', '#10b981', '#ec4899', '#818cf8']
    for (let i = 0; i < 90; i++) {
      particles.push({
        x:  Math.random() * window.innerWidth,
        y:  Math.random() * window.innerHeight,
        r:  Math.random() * 2.2 + 0.4,
        dx: (Math.random() - 0.5) * 0.5,
        dy: (Math.random() - 0.5) * 0.5,
        opacity: Math.random() * 0.6 + 0.15,
        color: COLORS[Math.floor(Math.random() * COLORS.length)],
        pulse: Math.random() * Math.PI * 2,
      })
    }

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      const { x: mx, y: my } = mouse.current

      particles.forEach((p, i) => {
        // Mouse repel
        const dx = p.x - mx, dy = p.y - my
        const dist = Math.sqrt(dx * dx + dy * dy)
        if (dist < 100) {
          const force = (100 - dist) / 100
          p.x += dx * force * 0.04
          p.y += dy * force * 0.04
        }

        p.x += p.dx; p.y += p.dy
        p.pulse += 0.04
        const r = Math.max(0.1, p.r + Math.sin(p.pulse) * 0.5)

        if (p.x < 0 || p.x > canvas.width)  p.dx *= -1
        if (p.y < 0 || p.y > canvas.height) p.dy *= -1

        // Glow dot
        const grd = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, r * 4)
        grd.addColorStop(0,   p.color + 'cc')
        grd.addColorStop(0.4, p.color + '55')
        grd.addColorStop(1,   p.color + '00')
        ctx.beginPath()
        ctx.arc(p.x, p.y, r * 4, 0, Math.PI * 2)
        ctx.fillStyle = grd
        ctx.globalAlpha = p.opacity * 0.5
        ctx.fill()

        ctx.beginPath()
        ctx.arc(p.x, p.y, r, 0, Math.PI * 2)
        ctx.fillStyle = p.color
        ctx.globalAlpha = p.opacity
        ctx.fill()

        // Lines
        particles.slice(i + 1).forEach(q => {
          const d = Math.hypot(p.x - q.x, p.y - q.y)
          if (d < 130) {
            ctx.beginPath()
            ctx.moveTo(p.x, p.y)
            ctx.lineTo(q.x, q.y)
            const grad = ctx.createLinearGradient(p.x, p.y, q.x, q.y)
            grad.addColorStop(0, p.color)
            grad.addColorStop(1, q.color)
            ctx.strokeStyle = grad
            ctx.globalAlpha = (1 - d / 130) * 0.18
            ctx.lineWidth = 0.8
            ctx.stroke()
          }
        })
      })
      ctx.globalAlpha = 1
      animId = requestAnimationFrame(draw)
    }
    draw()

    return () => {
      cancelAnimationFrame(animId)
      window.removeEventListener('resize', resize)
      if (parent) parent.removeEventListener('mousemove', onMouseMove)
    }
  }, [])

  return <canvas ref={canvasRef} className="particle-canvas" />
}

/* ──────────────────────────────────────────────────────
   AURORA BACKGROUND
────────────────────────────────────────────────────── */
function Aurora() {
  return (
    <div className="aurora-wrap" aria-hidden>
      <div className="aurora a1" />
      <div className="aurora a2" />
      <div className="aurora a3" />
    </div>
  )
}

/* ──────────────────────────────────────────────────────
   TYPEWRITER
────────────────────────────────────────────────────── */
function TypewriterWord() {
  const [idx, setIdx]       = useState(0)
  const [display, setDisplay] = useState('')
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    const word = WORDS[idx]
    let t
    if (!deleting) {
      if (display.length < word.length) t = setTimeout(() => setDisplay(word.slice(0, display.length + 1)), 80)
      else t = setTimeout(() => setDeleting(true), 1600)
    } else {
      if (display.length > 0) t = setTimeout(() => setDisplay(display.slice(0, -1)), 40)
      else { setDeleting(false); setIdx(i => (i + 1) % WORDS.length) }
    }
    return () => clearTimeout(t)
  }, [display, deleting, idx])

  return (
    <span className="typewriter-word">
      {display}
      <span className="typewriter-cursor">|</span>
    </span>
  )
}

/* ──────────────────────────────────────────────────────
   FLOATING PDF MOCKUP
────────────────────────────────────────────────────── */
const MOCK_SCENES = [
  { label: 'Scene 01', tc: '00:02:14' },
  { label: 'Scene 02', tc: '00:08:37' },
  { label: 'Scene 03', tc: '00:15:52' },
]
function PdfMockup() {
  return (
    <div className="pdf-mockup" aria-hidden>
      <div className="pdf-mockup-header">
        <span className="pdf-dot r" /><span className="pdf-dot y" /><span className="pdf-dot g" />
        <span className="pdf-title-text">snapmint_output.pdf</span>
      </div>
      <div className="pdf-pages">
        {MOCK_SCENES.map((s, i) => (
          <div key={i} className="pdf-page" style={{ animationDelay: `${i * 0.25}s` }}>
            <div className="pdf-img-placeholder" style={{ background: `hsl(${230 + i * 30}, 40%, 20%)` }}>
              <div className="pdf-img-lines">
                {[...Array(4)].map((_, j) => <div key={j} className="pdf-line" style={{ width: `${60 + j * 8}%` }} />)}
              </div>
            </div>
            <div className="pdf-page-footer">
              <span>{s.label}</span>
              <span className="pdf-tc">{s.tc}</span>
            </div>
          </div>
        ))}
      </div>
      <div className="pdf-glow-badge">✓ 3 scenes captured</div>
    </div>
  )
}

/* ──────────────────────────────────────────────────────
   SCROLL REVEAL
────────────────────────────────────────────────────── */
function useReveal(threshold = 0.15) {
  const ref = useRef(null)
  const [visible, setVisible] = useState(false)
  useEffect(() => {
    const obs = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) { setVisible(true); obs.disconnect() } },
      { threshold }
    )
    if (ref.current) obs.observe(ref.current)
    return () => obs.disconnect()
  }, [threshold])
  return [ref, visible]
}

/* ──────────────────────────────────────────────────────
   3D TILT FEATURE CARD
────────────────────────────────────────────────────── */
function FeatureCard({ feature, index }) {
  const [ref, visible] = useReveal()
  const cardRef = useRef(null)

  const handleMouseMove = useCallback(e => {
    const card = cardRef.current
    if (!card) return
    const { left, top, width, height } = card.getBoundingClientRect()
    const x = ((e.clientX - left) / width  - 0.5) * 18
    const y = ((e.clientY - top)  / height - 0.5) * -18
    card.style.transform = `perspective(600px) rotateY(${x}deg) rotateX(${y}deg) translateY(-4px)`
    card.style.setProperty('--shine-x', `${((e.clientX - left) / width * 100).toFixed(1)}%`)
    card.style.setProperty('--shine-y', `${((e.clientY - top)  / height * 100).toFixed(1)}%`)
  }, [])

  const handleMouseLeave = useCallback(() => {
    if (cardRef.current)
      cardRef.current.style.transform = 'perspective(600px) rotateY(0) rotateX(0) translateY(0)'
  }, [])

  return (
    <div
      ref={el => { ref.current = el; cardRef.current = el }}
      className={`feature-card ${visible ? 'revealed' : ''}`}
      style={{ '--delay': `${index * 0.07}s`, '--accent': feature.color, transition: 'opacity .5s ease var(--delay), transform .5s ease var(--delay)' }}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
    >
      {/* Shine layer */}
      <div className="card-shine" />
      <div className="feature-icon-wrap" style={{ background: `${feature.color}22` }}>
        <span className="feature-icon">{feature.icon}</span>
      </div>
      <h3 className="feature-title">{feature.title}</h3>
      <p  className="feature-desc">{feature.desc}</p>
      <div className="feature-line" style={{ background: `linear-gradient(90deg, ${feature.color}, transparent)` }} />
    </div>
  )
}

/* ──────────────────────────────────────────────────────
   ANIMATED COUNTER
────────────────────────────────────────────────────── */
function Counter({ target, suffix = '' }) {
  const [val, setVal] = useState(0)
  const [ref, visible] = useReveal()
  useEffect(() => {
    if (!visible) return
    let current = 0
    const total = 60
    let frame = 0
    const id = setInterval(() => {
      frame++
      const t = frame / total
      const ease = 1 - Math.pow(1 - t, 3)
      current = Math.round(ease * target)
      setVal(current)
      if (frame >= total) { setVal(target); clearInterval(id) }
    }, 20)
    return () => clearInterval(id)
  }, [visible, target])
  return <span ref={ref}>{val.toLocaleString()}{suffix}</span>
}

/* ──────────────────────────────────────────────────────
   STEP CARD
────────────────────────────────────────────────────── */
function StepBox({ num, icon, title, desc, delay, showArrow }) {
  const [ref, visible] = useReveal()
  return (
    <div
      ref={ref}
      className={`step-box ${visible ? 'revealed' : ''}`}
      style={{ '--delay': delay }}
    >
      <div className="step-num">{num}</div>
      <div className="step-icon-big step-icon-animated">{icon}</div>
      <div className="step-title">{title}</div>
      <div className="step-desc">{desc}</div>
      {showArrow && <div className="step-arrow">→</div>}
    </div>
  )
}

/* ──────────────────────────────────────────────────────
   HERO
────────────────────────────────────────────────────── */
export default function Hero({ onGetStarted }) {
  const [statsRef, statsVisible] = useReveal()
  const heroRef = useRef(null)

  // Mouse parallax on orbs
  useEffect(() => {
    const hero = heroRef.current
    if (!hero) return
    const orbs = hero.querySelectorAll('.orb')
    const onMove = e => {
      const { left, top, width, height } = hero.getBoundingClientRect()
      const cx = (e.clientX - left) / width  - 0.5
      const cy = (e.clientY - top)  / height - 0.5
      orbs.forEach((orb, i) => {
        const depth = [25, 18, 12][i] || 12
        orb.style.transform = `translate(${cx * depth}px, ${cy * depth}px) scale(1.05)`
      })
    }
    hero.addEventListener('mousemove', onMove)
    return () => hero.removeEventListener('mousemove', onMove)
  }, [])

  return (
    <div className="landing">

      {/* ── HERO ── */}
      <section className="hero-landing" ref={heroRef}>
        <Aurora />
        <ParticleCanvas />
        <div className="hero-grid-overlay" />

        <div className="orb orb-1" />
        <div className="orb orb-2" />
        <div className="orb orb-3" />

        <div className="hero-landing-center">

            <div className="badge-pill">
              <span className="badge-dot" />
              <span>AI-Powered Scene Extraction</span>
              <span className="badge-new">NEW</span>
            </div>

            <h1 className="landing-title">
              Turn <TypewriterWord /><br />
              into a <span className="shine-text">Smart PDF</span>
            </h1>

            <p className="landing-subtitle">
              SnapMint downloads your YouTube video, detects scene changes,
              filters presenter-blocked frames, and delivers a crisp timestamped PDF.
            </p>

            <div className="hero-cta-row">
              <button className="btn-hero-primary glow-btn" onClick={onGetStarted} id="hero-get-started-btn">
                <span className="rotating-border" />
                ✨ Generate PDF Free
              </button>
              <a href="https://github.com" target="_blank" rel="noreferrer" className="btn-hero-ghost">
                ⭐ Star on GitHub
              </a>
            </div>

            <div className="trust-row">
              <span>🔒 No login</span>
              <span className="trust-dot" />
              <span>⚡ Runs locally</span>
              <span className="trust-dot" />
              <span>📂 Your data stays with you</span>
            </div>

        </div>

        {/* Scroll hint */}
        <div className="scroll-hint">
          <div className="scroll-mouse"><div className="scroll-wheel" /></div>
          <span>Scroll to explore</span>
        </div>
      </section>

      {/* ── STATS BAND ── */}
      <div className="stats-band" ref={statsRef}>
        {[
          { label: 'Videos Processed',    value: 1240,  suffix: '+' },
          { label: 'PDFs Generated',      value: 980,   suffix: '+' },
          { label: 'Frames Filtered',     value: 24000, suffix: '+' },
          { label: 'Avg. Processing Time',value: 3,     suffix: ' min' },
        ].map(s => (
          <div className="stat-box" key={s.label}>
            <div className="stat-big stat-glow">
              {statsVisible ? <Counter target={s.value} suffix={s.suffix} /> : `0${s.suffix}`}
            </div>
            <div className="stat-label-text">{s.label}</div>
          </div>
        ))}
      </div>

      {/* ── HOW IT WORKS ── */}
      <section className="how-section">
        <div className="section-label">How it works</div>
        <h2 className="section-title">Four steps, zero hassle</h2>
        <div className="steps-row">
          {[
            { num: '01', icon: '🔗', title: 'Paste URL',    desc: 'Drop in any YouTube link' },
            { num: '02', icon: '⚙️', title: 'We Process',   desc: 'Download → detect → filter → stamp' },
            { num: '03', icon: '🖼️', title: 'Preview Scenes',desc: 'See every captured & filtered frame' },
            { num: '04', icon: '📄', title: 'Download PDF', desc: 'Crisp, timestamped PDF' },
          ].map((s, i) => (
            <StepBox
              key={s.num}
              {...s}
              delay={`${i * 0.1}s`}
              showArrow={i < 3}
            />
          ))}
        </div>
      </section>

      {/* ── FEATURES ── */}
      <section className="features-section">
        <div className="section-label">Everything included</div>
        <h2 className="section-title">Built for quality & speed</h2>
        <div className="features-grid">
          {FEATURES.map((f, i) => <FeatureCard key={f.title} feature={f} index={i} />)}
        </div>
      </section>

      {/* ── FINAL CTA ── */}
      <section className="final-cta-section">
        <div className="final-cta-glow" />
        <div className="final-cta-orbs">
          <div className="fc-orb fc-orb-1" />
          <div className="fc-orb fc-orb-2" />
        </div>
        <h2 className="final-cta-title">Ready to snap your first PDF?</h2>
        <p className="final-cta-sub">Paste a YouTube URL and we'll handle the rest — free forever.</p>
        <button className="btn-hero-primary glow-btn" onClick={onGetStarted} id="final-cta-btn">
          <span className="rotating-border" />
          🚀 Get Started Now — It's Free
        </button>
      </section>
    </div>
  )
}
