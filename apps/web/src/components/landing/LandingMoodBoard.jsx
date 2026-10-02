'use client'

import { useEffect, useRef } from 'react'

/** Convert a design-time pixel value to a responsive CSS value using the --bp board-pixel variable. */
const b = (n) => `calc(var(--bp) * ${n})`

/* ── helpers ── */
function makeDraggable(el) {
  let isDrag = false,
    ox = 0,
    oy = 0
  const origTransform = el.style.transform || ''

  const onDown = (e) => {
    isDrag = true
    const r = el.getBoundingClientRect()
    ox = e.clientX - r.left
    oy = e.clientY - r.top
    el.style.zIndex = '30'
    el.style.transition = 'box-shadow .2s'
    e.preventDefault()
  }
  const onMove = (e) => {
    if (!isDrag) return
    const parent = el.offsetParent || document.body
    const pr = parent.getBoundingClientRect()
    el.style.left = e.clientX - pr.left - ox + 'px'
    el.style.top = e.clientY - pr.top - oy + 'px'
    const parentLeft = el.offsetParent?.getBoundingClientRect().left ?? 0
    const drift = (e.clientX - (ox + parentLeft)) * 0.04
    el.style.transform = `rotate(${drift}deg)`
  }
  const onUp = () => {
    if (!isDrag) return
    isDrag = false
    el.style.zIndex = ''
    el.style.transition = 'box-shadow .4s,transform .6s cubic-bezier(.16,1,.3,1)'
    el.style.transform = origTransform
    setTimeout(() => {
      el.style.transition = ''
    }, 700)
  }

  el.addEventListener('mousedown', onDown)
  document.addEventListener('mousemove', onMove)
  document.addEventListener('mouseup', onUp)

  return () => {
    el.removeEventListener('mousedown', onDown)
    document.removeEventListener('mousemove', onMove)
    document.removeEventListener('mouseup', onUp)
  }
}

export function LandingMoodBoard() {
  const sectionRef = useRef(null)
  const boardRef = useRef(null)

  useEffect(() => {
    const board = boardRef.current
    if (!board) return

    // Make items draggable — collect cleanup fns
    const cleanups = []
    board.querySelectorAll('.l-polaroid,.l-sticky,.l-mag-clip').forEach((el) => {
      cleanups.push(makeDraggable(el))
    })

    // Section parallax — throttled via rAF
    const section = sectionRef.current
    if (!section) return

    const polaroids = Array.from(board.querySelectorAll('.l-polaroid'))
    let rafPending = false

    const onMove = (e) => {
      if (rafPending) return
      rafPending = true
      requestAnimationFrame(() => {
        rafPending = false
        const r = section.getBoundingClientRect()
        const cx = (e.clientX - r.left) / r.width - 0.5
        const cy = (e.clientY - r.top) / r.height - 0.5
        polaroids.forEach((el, i) => {
          const depth = ((i % 3) + 1) * 0.8
          el.style.translate = `${cx * depth * 6}px ${cy * depth * 4}px`
        })
      })
    }
    const onLeave = () => {
      polaroids.forEach((el) => {
        el.style.transition = 'translate .8s cubic-bezier(.16,1,.3,1)'
        el.style.translate = '0 0'
        setTimeout(() => {
          el.style.transition = ''
        }, 900)
      })
    }

    section.addEventListener('mousemove', onMove)
    section.addEventListener('mouseleave', onLeave)
    return () => {
      section.removeEventListener('mousemove', onMove)
      section.removeEventListener('mouseleave', onLeave)
      cleanups.forEach((fn) => fn())
    }
  }, [])

  return (
    <>
      {/* Torn paper top */}
      <div className="l-torn">
        <svg viewBox="0 0 1440 48" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="none">
          <path
            d="M0,0 L0,28 Q20,48 40,28 Q60,8 80,28 Q100,48 120,32 Q140,16 160,36 Q180,48 200,28 Q220,8 240,32 Q260,48 280,24 Q300,0 320,32 Q340,48 360,28 Q380,8 400,36 Q420,48 440,24 Q460,0 480,32 Q500,48 520,28 Q540,8 560,34 Q580,48 600,28 Q620,8 640,32 Q660,48 680,24 Q700,0 720,32 Q740,48 760,28 Q780,8 800,34 Q820,48 840,24 Q860,0 880,32 Q900,48 920,28 Q940,8 960,36 Q980,48 1000,28 Q1020,8 1040,32 Q1060,48 1080,24 Q1100,0 1120,32 Q1140,48 1160,28 Q1180,8 1200,36 Q1220,48 1240,24 Q1260,0 1280,32 Q1300,48 1320,28 Q1340,8 1360,34 Q1380,48 1400,24 L1440,28 L1440,0 Z"
            fill="var(--smoke)"
          />
        </svg>
      </div>

      <section className="l-mb-section l-sr l-sru" id="moodboard" ref={sectionRef}>
        {/* Top tape strip */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: b(32),
            overflow: 'hidden',
            pointerEvents: 'none',
            display: 'flex',
          }}
        >
          <div style={{ width: b(180), height: b(32), background: 'rgba(212,168,67,.35)' }} />
          <div style={{ width: b(120), height: b(32) }} />
          <div style={{ width: b(240), height: b(32), background: 'rgba(200,75,47,.2)' }} />
          <div style={{ width: b(160), height: b(32) }} />
          <div style={{ width: b(200), height: b(32), background: 'rgba(90,140,160,.25)' }} />
        </div>

        <div className="l-mb-header">
          <span className="l-mb-handlabel">↓ our memory board ↓</span>
          <h2 className="l-stitle">
            The Moments
            <br />
            We Live For
          </h2>
        </div>

        <div className="l-mb-board" ref={boardRef}>
          {/* SVG thread connections */}
          <svg
            className="l-thread-canvas"
            width="100%"
            height="100%"
            viewBox="0 0 1160 760"
            preserveAspectRatio="none"
          >
            <line
              x1="200"
              y1="80"
              x2="520"
              y2="200"
              stroke="var(--rust)"
              strokeWidth="1"
              strokeDasharray="4 3"
              opacity=".3"
            />
            <line
              x1="520"
              y1="200"
              x2="820"
              y2="120"
              stroke="var(--amber)"
              strokeWidth="1"
              strokeDasharray="4 3"
              opacity=".3"
            />
            <line
              x1="820"
              y1="120"
              x2="1040"
              y2="300"
              stroke="var(--ink)"
              strokeWidth="1"
              strokeDasharray="4 3"
              opacity=".15"
            />
            <line
              x1="280"
              y1="350"
              x2="620"
              y2="440"
              stroke="var(--amber)"
              strokeWidth="1"
              strokeDasharray="3 4"
              opacity=".25"
            />
            <line
              x1="620"
              y1="440"
              x2="960"
              y2="380"
              stroke="var(--rust)"
              strokeWidth="1"
              strokeDasharray="3 4"
              opacity=".2"
            />
            {[
              [200, 80],
              [520, 200],
              [820, 120],
              [1040, 300],
              [280, 350],
              [620, 440],
              [960, 380],
            ].map(([cx, cy], i) => (
              <circle key={i} cx={cx} cy={cy} r="3" fill="var(--rust)" opacity=".4" />
            ))}
          </svg>

          {/* ── POLAROIDS ── */}
          <div
            className="l-polaroid l-sr l-srsc"
            style={{ width: b(200), top: b(20), left: '2%', transform: 'rotate(-6deg)', zIndex: 4 }}
          >
            <div className="l-pol-pin" />
            <div
              className="l-pol-img l-cf1"
              style={{
                height: b(160),
                backgroundImage: 'url("/images/wedding.png")',
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                backgroundRepeat: 'no-repeat',
              }}
            />
            <span className="l-pol-caption">Wedding Day</span>
            <div
              className="l-tape l-tape-solid"
              style={{
                '--tape-col': 'rgba(212,168,67,.7)',
                position: 'absolute',
                width: b(80),
                top: b(-8),
                left: b(-12),
                transform: 'rotate(-12deg)',
              }}
            >
              <div className="l-tape-inner" />
            </div>
          </div>

          <div
            className="l-polaroid l-sr l-srsc l-sd1"
            style={{ width: b(180), top: b(60), left: '22%', transform: 'rotate(4deg)', zIndex: 3 }}
          >
            <div className="l-pol-pin" style={{ left: '30%' }} />
            <div
              className="l-pol-img l-cf3"
              style={{
                height: b(140),
                backgroundImage: 'url("/images/reunion.png")',
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                backgroundRepeat: 'no-repeat',
              }}
            />
            <span className="l-pol-caption">Graduation</span>
            <div
              className="l-tape l-tape-stripe"
              style={{
                '--tape-col': 'rgba(200,75,47,.6)',
                position: 'absolute',
                width: b(70),
                top: b(-6),
                right: b(-8),
                transform: 'rotate(8deg)',
              }}
            >
              <div className="l-tape-inner" />
            </div>
          </div>

          <div
            className="l-polaroid l-sr l-srsc l-sd2"
            style={{
              width: b(220),
              top: b(10),
              left: '44%',
              transform: 'rotate(-2deg)',
              zIndex: 5,
            }}
          >
            <div className="l-pol-pin" />
            <div
              className="l-pol-img l-cf2"
              style={{
                height: b(180),
                backgroundImage: 'url("/images/graduation.png")',
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                backgroundRepeat: 'no-repeat',
              }}
            />
            <span className="l-pol-caption">Family Reunion</span>
            <div
              className="l-tape l-tape-dots"
              style={{
                '--tape-col': 'rgba(90,140,160,.65)',
                position: 'absolute',
                width: b(90),
                top: b(-8),
                left: '20%',
                transform: 'rotate(2deg)',
              }}
            >
              <div className="l-tape-inner">✦ ✦ ✦</div>
            </div>
          </div>

          <div
            className="l-polaroid l-sr l-srsc l-sd1"
            style={{ width: b(190), top: b(30), right: '8%', transform: 'rotate(7deg)', zIndex: 4 }}
          >
            <div className="l-pol-pin" style={{ left: '60%' }} />
            <div
              className="l-pol-img l-cf4"
              style={{
                height: b(150),
                backgroundImage: 'url("/images/concert.png")',
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                backgroundRepeat: 'no-repeat',
              }}
            />
            <span className="l-pol-caption">Concert Night</span>
          </div>

          <div
            className="l-polaroid l-sr l-srsc l-sd3"
            style={{ width: b(200), top: b(320), left: '5%', transform: 'rotate(3deg)', zIndex: 3 }}
          >
            <div className="l-pol-pin" />
            <div
              className="l-pol-img l-cf5"
              style={{
                height: b(160),
                backgroundImage: 'url("/images/birthday.png")',
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                backgroundRepeat: 'no-repeat',
              }}
            />
            <span className="l-pol-caption">Birthday Bash</span>
            <div
              className="l-tape l-tape-solid"
              style={{
                '--tape-col': 'rgba(200,75,47,.5)',
                position: 'absolute',
                width: b(75),
                top: b(-7),
                left: '15%',
                transform: 'rotate(-5deg)',
              }}
            >
              <div className="l-tape-inner" />
            </div>
          </div>

          <div
            className="l-polaroid l-sr l-srsc l-sd2"
            style={{
              width: b(185),
              top: b(360),
              right: '6%',
              transform: 'rotate(-5deg)',
              zIndex: 3,
            }}
          >
            <div className="l-pol-pin" style={{ left: '65%' }} />
            <div
              className="l-pol-img"
              style={{
                height: b(145),
                background: 'url("/images/team.png") center/cover no-repeat',
              }}
            />
            <span className="l-pol-caption">Team Trip</span>
          </div>

          {/* ── STICKY NOTES ── */}
          <div
            className="l-sticky l-sty-yellow l-sr l-sru"
            style={{
              width: b(172),
              top: b(230),
              left: '16%',
              transform: 'rotate(-4deg)',
              zIndex: 6,
            }}
          >
            <h4>Quick tip</h4>
            <p>&ldquo;Upload in seconds — no app needed for guests.&rdquo;</p>
          </div>

          <div
            className="l-sticky l-sty-pink l-sr l-sru l-sd1"
            style={{
              width: b(156),
              top: b(180),
              left: '38%',
              transform: 'rotate(3.5deg)',
              zIndex: 6,
            }}
          >
            <h4>Share easily</h4>
            <p>
              One QR code.
              <br />
              Everyone uploads.
              <br />
              Instantly.
            </p>
          </div>

          <div
            className="l-sticky l-sty-blue l-sr l-sru l-sd2"
            style={{
              width: b(164),
              top: b(270),
              right: '18%',
              transform: 'rotate(-5deg)',
              zIndex: 6,
            }}
          >
            <h4>Your memories</h4>
            <p>
              Beautiful galleries.
              <br />
              Original quality.
              <br />
              Yours forever.
            </p>
          </div>

          <div
            className="l-sticky l-sty-green l-sr l-sru l-sd3"
            style={{
              width: b(150),
              top: b(510),
              left: '32%',
              transform: 'rotate(2deg)',
              zIndex: 6,
            }}
          >
            <p>
              ✓ Real-time sync
              <br />✓ HD downloads
              <br />✓ No storage limit
              <br />✓ Private by default
            </p>
          </div>

          <div
            className="l-sticky l-sty-peach l-sr l-sru l-sd1"
            style={{
              width: b(168),
              top: b(480),
              right: '22%',
              transform: 'rotate(-3deg)',
              zIndex: 6,
            }}
          >
            <h4>Relive it</h4>
            <p>
              &ldquo;Every photo
              <br />
              tells your story —<br />
              forever.&rdquo;
            </p>
          </div>

          {/* ── MAGAZINE CLIPPINGS ── */}
          <div
            className="l-mag-clip l-sr l-srl"
            style={{
              width: b(240),
              top: b(200),
              left: '58%',
              transform: 'rotate(2deg)',
              zIndex: 4,
            }}
          >
            <div className="l-mc-label">TechCrunch · 2024</div>
            <div className="l-mc-headline">The App Making Event Memories Last Forever</div>
            <div className="l-mc-body">
              Loot is reimagining how people capture and relive their most important life events
              through collaborative photo sharing...
            </div>
            <div className="l-mc-torn" />
            <div
              className="l-tape l-tape-solid"
              style={{
                '--tape-col': 'rgba(212,168,67,.65)',
                position: 'absolute',
                width: b(65),
                top: b(-7),
                left: '20%',
                transform: 'rotate(-6deg)',
              }}
            >
              <div className="l-tape-inner" />
            </div>
          </div>

          <div
            className="l-mag-clip l-sr l-srr l-sd1"
            style={{
              width: b(210),
              top: b(490),
              left: '8%',
              transform: 'rotate(-2deg)',
              zIndex: 4,
            }}
          >
            <div className="l-mc-label">Wired · Issue 12</div>
            <div className="l-mc-headline">Why Shared Photo Albums Are the New Social</div>
            <div className="l-mc-body">
              Private, curated, and collaborative — the future of memories is not about filters,
              it&apos;s about connection...
            </div>
            <div className="l-mc-torn" />
          </div>

          {/* ── COLOR SWATCHES ── */}
          <div
            className="l-swatch-cluster l-sr l-srsc"
            style={{ top: b(420), left: '46%', zIndex: 5, transform: 'rotate(-3deg)' }}
          >
            <div style={{ position: 'relative' }}>
              <div
                className="l-tape l-tape-dots"
                style={{
                  '--tape-col': 'rgba(200,75,47,.5)',
                  position: 'absolute',
                  width: '100%',
                  top: -8,
                  left: 0,
                  transform: 'rotate(-1deg)',
                }}
              >
                <div className="l-tape-inner">palette</div>
              </div>
            </div>
            <div className="l-swatch-row">
              {['#C84B2F', '#D4A843', '#0D0C0A', '#F8F5F0'].map((c, i) => (
                <div
                  key={i}
                  className="l-swatch"
                  style={{ background: c, border: c === '#F8F5F0' ? '1px solid #ddd' : undefined }}
                />
              ))}
            </div>
            <div className="l-swatch-row">
              {['#7BA4C0', '#8FA870', '#A07FC0', '#C4956A'].map((c, i) => (
                <div key={i} className="l-swatch" style={{ background: c }} />
              ))}
            </div>
            <span className="l-swatch-label">Brand palette 2025</span>
          </div>

          {/* ── FILM STRIP ── */}
          <div
            className="l-film-strip l-sr l-sru l-sd2"
            style={{ top: b(550), right: '10%', transform: 'rotate(-4deg)' }}
          >
            <div className="l-film-hole" />
            <div className="l-film-frame l-ff1" />
            <div className="l-film-hole" />
            <div className="l-film-frame l-ff2" />
            <div className="l-film-hole" />
            <div className="l-film-frame l-ff3" />
            <div className="l-film-hole" />
          </div>

          {/* ── ANNOTATION ARROWS ── */}
          <div
            className="l-annotation"
            style={{ top: b(290), left: '10%', transform: 'rotate(12deg)', zIndex: 7 }}
          >
            <svg style={{ width: b(80), height: b(40) }} viewBox="0 0 80 40" fill="none">
              <path
                d="M4 8 Q40 0 72 30"
                stroke="var(--rust)"
                strokeWidth="1.8"
                fill="none"
                strokeLinecap="round"
              />
              <path
                d="M66 22 L72 30 L62 32"
                stroke="var(--rust)"
                strokeWidth="1.8"
                fill="none"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            <span
              className="l-ann-text"
              style={{ position: 'absolute', top: 0, left: b(4), color: 'var(--rust)' }}
            >
              share link!
            </span>
          </div>

          <div
            className="l-annotation"
            style={{ top: b(148), left: '40%', transform: 'rotate(-8deg)', zIndex: 7 }}
          >
            <svg style={{ width: b(60), height: b(50) }} viewBox="0 0 60 50" fill="none">
              <path
                d="M4 4 Q8 30 50 44"
                stroke="var(--ink)"
                strokeWidth="1.5"
                fill="none"
                strokeLinecap="round"
              />
              <path
                d="M44 38 L50 44 L42 48"
                stroke="var(--ink)"
                strokeWidth="1.5"
                fill="none"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            <span
              className="l-ann-text"
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                color: 'var(--ink)',
                opacity: 0.6,
              }}
            >
              instant upload
            </span>
          </div>

          <div
            className="l-annotation"
            style={{ top: b(460), right: '38%', transform: 'rotate(6deg)', zIndex: 7 }}
          >
            <svg style={{ width: b(70), height: b(36) }} viewBox="0 0 70 36" fill="none">
              <path
                d="M66 6 Q30 4 4 28"
                stroke="var(--amber)"
                strokeWidth="1.8"
                fill="none"
                strokeLinecap="round"
              />
              <path
                d="M10 22 L4 28 L12 32"
                stroke="var(--amber)"
                strokeWidth="1.8"
                fill="none"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            <span
              className="l-ann-text"
              style={{
                position: 'absolute',
                top: 0,
                right: 0,
                color: 'var(--amber)',
              }}
            >
              so beautiful!
            </span>
          </div>

          {/* ── PAPER CLIPS ── */}
          {[
            { top: b(14), left: '19%' },
            { top: b(200), left: '55%' },
            { top: b(490), right: '32%' },
          ].map((s, i) => (
            <div key={i} style={{ position: 'absolute', pointerEvents: 'none', zIndex: 15, ...s }}>
              <svg style={{ width: b(22), height: b(48) }} viewBox="0 0 22 48" fill="none">
                <path
                  d="M11 2 C5 2 2 6 2 11 L2 36 C2 43 5 46 11 46 C17 46 20 43 20 36 L20 14 C20 9 17 7 13 7 C9 7 7 10 7 14 L7 34 C7 37 9 39 11 39 C13 39 15 37 15 34 L15 14"
                  stroke={i === 0 ? '#888' : i === 1 ? 'var(--amber)' : 'var(--rust)'}
                  strokeWidth="1.8"
                  fill="none"
                  strokeLinecap="round"
                  transform={
                    i === 1 ? 'rotate(20,11,24)' : i === 2 ? 'rotate(-15,11,24)' : undefined
                  }
                />
              </svg>
            </div>
          ))}

          {/* ── HANDWRITTEN LABELS ── */}
          <div
            style={{
              position: 'absolute',
              top: b(640),
              left: '2%',
              zIndex: 3,
              transform: 'rotate(-2deg)',
            }}
          >
            <span
              style={{
                fontFamily: 'var(--font-caveat)',
                fontSize: b(26),
                fontWeight: 700,
                color: 'var(--ink)',
                opacity: 0.2,
                whiteSpace: 'nowrap',
              }}
            >
              loot — 2026
            </span>
          </div>
          <div
            style={{
              position: 'absolute',
              bottom: b(30),
              right: '4%',
              zIndex: 3,
              transform: 'rotate(1deg)',
            }}
          >
            <span
              style={{
                fontFamily: 'var(--font-caveat)',
                fontSize: b(18),
                fontWeight: 600,
                color: 'var(--l-muted)',
                opacity: 0.5,
              }}
            >
              preserved ✓
            </span>
          </div>

          {/* ── CIRCULAR STAMP ── */}
          <div
            style={{
              position: 'absolute',
              bottom: b(60),
              left: '44%',
              zIndex: 5,
              transform: 'rotate(-8deg)',
            }}
          >
            <svg style={{ width: b(110), height: b(110) }} viewBox="0 0 110 110">
              <circle
                cx="55"
                cy="55"
                r="50"
                fill="none"
                stroke="var(--rust)"
                strokeWidth="2"
                strokeDasharray="3 2"
                opacity=".4"
              />
              <circle
                cx="55"
                cy="55"
                r="42"
                fill="none"
                stroke="var(--rust)"
                strokeWidth="1"
                opacity=".25"
              />
              <text
                fontFamily="var(--font-caveat)"
                fontSize="11"
                fontWeight="700"
                fill="var(--rust)"
                opacity=".6"
              >
                <textPath href="#lstamp">LOOT · NEAR YOU · RIGHT NOW · </textPath>
              </text>
              <defs>
                <path id="lstamp" d="M55,10 a45,45 0 1,1 -0.1,0" />
              </defs>
              <text
                x="55"
                y="50"
                textAnchor="middle"
                fontFamily="var(--font-playfair)"
                fontSize="14"
                fontWeight="900"
                fill="var(--rust)"
                opacity=".6"
              >
                MEMO
              </text>
              <text
                x="55"
                y="66"
                textAnchor="middle"
                fontFamily="var(--font-caveat)"
                fontSize="11"
                fill="var(--rust)"
                opacity=".5"
              >
                captured
              </text>
            </svg>
          </div>

          {/* ── EXTRA TAPES ── */}
          <div
            className="l-tape l-tape-stripe"
            style={{
              '--tape-col': 'rgba(144,184,130,.6)',
              position: 'absolute',
              width: b(140),
              top: b(360),
              left: '26%',
              transform: 'rotate(-45deg)',
              zIndex: 2,
            }}
          >
            <div className="l-tape-inner" />
          </div>
          <div
            className="l-tape l-tape-dots"
            style={{
              '--tape-col': 'rgba(120,160,200,.55)',
              position: 'absolute',
              width: b(100),
              top: b(500),
              left: '58%',
              transform: 'rotate(38deg)',
              zIndex: 2,
            }}
          >
            <div className="l-tape-inner">✦</div>
          </div>
          <div
            className="l-tape l-tape-solid"
            style={{
              '--tape-col': 'rgba(200,75,47,.4)',
              position: 'absolute',
              width: b(80),
              bottom: b(100),
              left: '18%',
              transform: 'rotate(10deg)',
              zIndex: 2,
            }}
          >
            <div className="l-tape-inner" />
          </div>
        </div>
      </section>

      {/* Torn paper bottom */}
      <div className="l-torn l-torn-below">
        <svg viewBox="0 0 1440 48" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="none">
          <path
            d="M0,0 L0,28 Q20,48 40,28 Q60,8 80,28 Q100,48 120,32 Q140,16 160,36 Q180,48 200,28 Q220,8 240,32 Q260,48 280,24 Q300,0 320,32 Q340,48 360,28 Q380,8 400,36 Q420,48 440,24 Q460,0 480,32 Q500,48 520,28 Q540,8 560,34 Q580,48 600,28 Q620,8 640,32 Q660,48 680,24 Q700,0 720,32 Q740,48 760,28 Q780,8 800,34 Q820,48 840,24 Q860,0 880,32 Q900,48 920,28 Q940,8 960,36 Q980,48 1000,28 Q1020,8 1040,32 Q1060,48 1080,24 Q1100,0 1120,32 Q1140,48 1160,28 Q1180,8 1200,36 Q1220,48 1240,24 Q1260,0 1280,32 Q1300,48 1320,28 Q1340,8 1360,34 Q1380,48 1400,24 L1440,28 L1440,0 Z"
            fill="var(--ivory)"
          />
        </svg>
      </div>
    </>
  )
}
