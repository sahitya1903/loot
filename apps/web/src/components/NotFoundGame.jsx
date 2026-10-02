'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { motion, AnimatePresence } from 'framer-motion'
import { Home, RotateCcw, ArrowLeft, ArrowRight } from 'lucide-react'

const GW = 480
const GH = 520
const PAD_W = 90
const PAD_H = 14
const PAD_SPEED = 9
const BASE_SPAWN_RATE = 75
const EMOJIS = ['📸', '🌅', '🎉', '❤️', '🌟', '🎊', '🏖️', '🎭', '✨', '🎆', '🫶', '🥂']

export function NotFoundGame() {
  const canvasRef = useRef(null)
  const phase = useRef('idle')
  const score = useRef(0)
  const lives = useRef(3)
  const photos = useRef([])
  const particles = useRef([])
  const padX = useRef(GW / 2 - PAD_W / 2)
  const keys = useRef({ left: false, right: false })
  const raf = useRef(0)
  const photoId = useRef(0)
  const spawnTimer = useRef(0)
  const level = useRef(1)
  const frameCount = useRef(0)

  const [uiPhase, setUiPhase] = useState('idle')
  const [uiScore, setUiScore] = useState(0)
  const [uiLives, setUiLives] = useState(3)
  const [highScore, setHighScore] = useState(0)
  const [uiLevel, setUiLevel] = useState(1)

  const spawnPhoto = useCallback(() => {
    photos.current.push({
      id: photoId.current++,
      x: 35 + Math.random() * (GW - 70),
      y: -40,
      speed: 1.8 + Math.random() * 1.2 + (level.current - 1) * 0.25,
      emoji: EMOJIS[Math.floor(Math.random() * EMOJIS.length)],
      rot: Math.random() * 30 - 15,
      rotSpeed: (Math.random() - 0.5) * 2.5,
    })
  }, [])

  const burst = useCallback((x, y) => {
    const colors = ['#C84B2F', '#D4A843', '#0D0C0A', '#E05A3A', '#F8F5F0']
    for (let i = 0; i < 14; i++) {
      const angle = (Math.PI * 2 * i) / 14 + Math.random() * 0.4
      const spd = 2 + Math.random() * 4
      particles.current.push({
        x,
        y,
        vx: Math.cos(angle) * spd,
        vy: Math.sin(angle) * spd - 2,
        life: 1,
        color: colors[Math.floor(Math.random() * colors.length)],
        size: 3 + Math.random() * 4,
      })
    }
  }, [])

  const draw = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const W = GW,
      H = GH
    const t = frameCount.current / 60
    frameCount.current++

    // Background — warm ivory
    const bg = ctx.createLinearGradient(0, 0, W, H)
    bg.addColorStop(0, '#F8F5F0')
    bg.addColorStop(0.45, '#EDE9E2')
    bg.addColorStop(1, '#F8F5F0')
    ctx.fillStyle = bg
    ctx.fillRect(0, 0, W, H)

    // Grid — ink subtle
    ctx.strokeStyle = 'rgba(13, 12, 10, 0.06)'
    ctx.lineWidth = 1
    for (let x = 0; x <= W; x += 48) {
      ctx.beginPath()
      ctx.moveTo(x, 0)
      ctx.lineTo(x, H)
      ctx.stroke()
    }
    for (let y = 0; y <= H; y += 48) {
      ctx.beginPath()
      ctx.moveTo(0, y)
      ctx.lineTo(W, y)
      ctx.stroke()
    }

    // Top glow — rust
    const rad = ctx.createRadialGradient(W / 2, 0, 0, W / 2, 0, W * 0.7)
    rad.addColorStop(0, 'rgba(200, 75, 47, 0.08)')
    rad.addColorStop(1, 'rgba(200, 75, 47, 0)')
    ctx.fillStyle = rad
    ctx.fillRect(0, 0, W, H)

    // Danger zone
    const danger = ctx.createLinearGradient(0, H - 50, 0, H)
    danger.addColorStop(0, 'rgba(200, 75, 47, 0)')
    danger.addColorStop(1, 'rgba(200, 75, 47, 0.12)')
    ctx.fillStyle = danger
    ctx.fillRect(0, H - 50, W, 50)

    // Photos — polaroid style
    photos.current.forEach((ph) => {
      ctx.save()
      ctx.translate(ph.x, ph.y)
      ctx.rotate((ph.rot * Math.PI) / 180)
      ctx.shadowColor = 'rgba(13, 12, 10, 0.2)'
      ctx.shadowBlur = 14
      ctx.fillStyle = '#FFFFFF'
      ctx.beginPath()
      ctx.roundRect(-20, -24, 40, 50, 4)
      ctx.fill()
      ctx.shadowBlur = 0
      ctx.fillStyle = '#EDE9E2'
      ctx.fillRect(-17, -21, 34, 32)
      ctx.font = '20px serif'
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillText(ph.emoji, 0, -5)
      ctx.fillStyle = 'rgba(13, 12, 10, 0.04)'
      ctx.fillRect(-20, 18, 40, 8)
      ctx.restore()
    })

    // Particles
    particles.current.forEach((p) => {
      ctx.save()
      ctx.globalAlpha = p.life
      ctx.fillStyle = p.color
      ctx.shadowColor = p.color
      ctx.shadowBlur = 8
      ctx.beginPath()
      ctx.arc(p.x, p.y, p.size * p.life, 0, Math.PI * 2)
      ctx.fill()
      ctx.restore()
    })

    // Paddle — ink with rust glow
    const px = padX.current
    const py = H - 38
    ctx.shadowColor = 'rgba(200, 75, 47, 0.45)'
    ctx.shadowBlur = 28
    const pgr = ctx.createLinearGradient(px, py, px + PAD_W, py)
    pgr.addColorStop(0, '#0D0C0A')
    pgr.addColorStop(1, '#C84B2F')
    ctx.fillStyle = pgr
    ctx.beginPath()
    ctx.roundRect(px, py, PAD_W, PAD_H, 7)
    ctx.fill()
    ctx.shadowBlur = 0
    // Lens dot
    ctx.fillStyle = 'rgba(248, 245, 240, 0.35)'
    ctx.beginPath()
    ctx.arc(px + PAD_W / 2, py + PAD_H / 2, 5, 0, Math.PI * 2)
    ctx.fill()
    ctx.fillStyle = 'rgba(248, 245, 240, 0.7)'
    ctx.beginPath()
    ctx.arc(px + PAD_W / 2 - 1, py + PAD_H / 2 - 1, 2, 0, Math.PI * 2)
    ctx.fill()

    // Idle floating emojis
    if (phase.current === 'idle') {
      const floatEmojis = ['📸', '🌟', '❤️', '🎉', '✨']
      floatEmojis.forEach((em, i) => {
        const ex = (W / 6) * (i + 0.5) + Math.sin(t + i * 1.2) * 14
        const ey = H / 2 - 80 + Math.cos(t * 0.8 + i) * 20
        ctx.font = '26px serif'
        ctx.textAlign = 'center'
        ctx.textBaseline = 'middle'
        ctx.globalAlpha = 0.55 + Math.sin(t * 1.1 + i) * 0.2
        ctx.fillText(em, ex, ey)
      })
      ctx.globalAlpha = 1
    }
  }, [])

  const loopRef = useRef(() => {})
  const idleLoopRef = useRef(() => {})

  const loop = useCallback(() => {
    if (phase.current !== 'playing') return
    if (keys.current.left) padX.current = Math.max(0, padX.current - PAD_SPEED)
    if (keys.current.right) padX.current = Math.min(GW - PAD_W, padX.current + PAD_SPEED)

    spawnTimer.current++
    const rate = Math.max(28, BASE_SPAWN_RATE - (level.current - 1) * 6)
    if (spawnTimer.current >= rate) {
      spawnPhoto()
      spawnTimer.current = 0
    }

    const py = GH - 38
    const toRemove = new Set()

    photos.current.forEach((ph) => {
      ph.y += ph.speed
      ph.rot += ph.rotSpeed
      if (
        ph.y + 24 >= py &&
        ph.y - 24 <= py + PAD_H &&
        ph.x >= padX.current - 8 &&
        ph.x <= padX.current + PAD_W + 8
      ) {
        toRemove.add(ph.id)
        score.current += 10
        setUiScore(score.current)
        level.current = Math.floor(score.current / 80) + 1
        setUiLevel(level.current)
        burst(ph.x, py)
      } else if (ph.y > GH + 50) {
        toRemove.add(ph.id)
        lives.current--
        setUiLives(lives.current)
        if (lives.current <= 0) {
          phase.current = 'gameover'
          setUiPhase('gameover')
          setHighScore((prev) => Math.max(prev, score.current))
        }
      }
    })

    photos.current = photos.current.filter((p) => !toRemove.has(p.id))
    particles.current.forEach((p) => {
      p.x += p.vx
      p.y += p.vy
      p.vy += 0.15
      p.life -= 0.035
    })
    particles.current = particles.current.filter((p) => p.life > 0)
    draw()
    raf.current = requestAnimationFrame(() => loopRef.current())
  }, [draw, spawnPhoto, burst])

  const idleLoop = useCallback(() => {
    if (phase.current !== 'idle') return
    draw()
    raf.current = requestAnimationFrame(() => idleLoopRef.current())
  }, [draw])

  useEffect(() => {
    loopRef.current = loop
  }, [loop])

  useEffect(() => {
    idleLoopRef.current = idleLoop
  }, [idleLoop])

  const startGame = useCallback(() => {
    cancelAnimationFrame(raf.current)
    score.current = 0
    lives.current = 3
    level.current = 1
    photos.current = []
    particles.current = []
    padX.current = GW / 2 - PAD_W / 2
    spawnTimer.current = 0
    frameCount.current = 0
    setUiScore(0)
    setUiLives(3)
    setUiLevel(1)
    phase.current = 'playing'
    setUiPhase('playing')
    raf.current = requestAnimationFrame(loop)
  }, [loop])

  useEffect(() => {
    raf.current = requestAnimationFrame(idleLoop)
    return () => cancelAnimationFrame(raf.current)
  }, [idleLoop])

  useEffect(() => {
    const kd = (e) => {
      if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') keys.current.left = true
      if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') keys.current.right = true
      if ((e.key === 'Enter' || e.key === ' ') && phase.current !== 'playing') startGame()
    }
    const ku = (e) => {
      if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') keys.current.left = false
      if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') keys.current.right = false
    }
    window.addEventListener('keydown', kd)
    window.addEventListener('keyup', ku)
    return () => {
      window.removeEventListener('keydown', kd)
      window.removeEventListener('keyup', ku)
    }
  }, [startGame])

  const handlePointerMove = useCallback((e) => {
    if (phase.current !== 'playing') return
    const canvas = canvasRef.current
    if (!canvas) return
    const rect = canvas.getBoundingClientRect()
    const x = (e.clientX - rect.left) * (GW / rect.width)
    padX.current = Math.max(0, Math.min(GW - PAD_W, x - PAD_W / 2))
  }, [])

  return (
    <div className="flex flex-col items-center gap-6">
      {/* Header */}
      <div className="text-center">
        <div className="mb-4 flex items-center justify-center gap-3">
          <div className="relative h-10 w-10">
            <Image src="/images/logo.svg" alt="Loot" fill sizes="40px" className="object-contain" />
          </div>
          <span className="font-playfair text-2xl font-bold text-[var(--ink)]">Loot</span>
        </div>
        <motion.div
          initial={{ opacity: 0, y: -16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        >
          <div className="mb-3 inline-block rounded-full border border-[var(--rust)]/25 bg-[var(--rust)]/10 px-4 py-1.5">
            <span className="font-instrument text-sm font-medium text-[var(--rust)]">
              404 — Page Not Found
            </span>
          </div>
          <h1 className="font-playfair text-3xl font-bold text-[var(--ink)] sm:text-4xl">
            Lost in the memories?
          </h1>
          <p className="font-caveat mt-2 text-lg text-[var(--l-muted)]">
            While you&apos;re here — catch some moments!
          </p>
        </motion.div>
      </div>

      {/* Game */}
      <motion.div
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, delay: 0.15 }}
        className="relative w-full max-w-[480px]"
      >
        {/* HUD bar */}
        <div className="mb-2 flex items-center justify-between px-1">
          <div className="flex items-center gap-3">
            <span className="font-instrument text-sm font-semibold text-[var(--ink)]">
              Score: <span className="text-[var(--rust)]">{uiScore}</span>
            </span>
            {highScore > 0 && (
              <span className="font-instrument text-xs text-[var(--l-muted)]">
                Best: {highScore}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <span className="font-instrument text-xs text-[var(--rust)]">Lv.{uiLevel}</span>
            <div className="flex gap-1">
              {[1, 2, 3].map((i) => (
                <span
                  key={i}
                  className={`text-base transition-all duration-300 ${i <= uiLives ? 'opacity-100' : 'opacity-20 grayscale'}`}
                >
                  📷
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Canvas */}
        <div className="relative overflow-hidden rounded-2xl shadow-2xl ring-1 ring-[var(--ink)]/10">
          <canvas
            ref={canvasRef}
            width={GW}
            height={GH}
            className="block w-full touch-none"
            style={{
              aspectRatio: `${GW}/${GH}`,
              cursor: uiPhase === 'playing' ? 'none' : 'default',
            }}
            onPointerMove={handlePointerMove}
          />

          {/* Idle overlay */}
          <AnimatePresence>
            {uiPhase === 'idle' && (
              <motion.div
                key="idle"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="absolute inset-0 flex flex-col items-center justify-center gap-5 bg-[var(--ivory)]/40 backdrop-blur-[2px]"
              >
                <div className="text-center">
                  <div className="mb-3 text-5xl">📸</div>
                  <h2 className="font-playfair mb-1 text-xl font-bold text-[var(--ink)]">
                    Catch the Memories
                  </h2>
                  <p className="font-instrument max-w-[230px] text-sm text-[var(--ink)]/55">
                    Move the camera to catch falling polaroids before they hit the ground!
                  </p>
                </div>
                <div className="font-instrument flex items-center gap-1.5 text-xs text-[var(--ink)]/35">
                  <ArrowLeft className="h-3 w-3" />
                  <ArrowRight className="h-3 w-3" />
                  <span>keys · mouse · touch</span>
                </div>
                <motion.button
                  onClick={startGame}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.96 }}
                  className="font-instrument rounded-full bg-[var(--ink)] px-8 py-3 text-sm font-semibold text-[var(--ivory)] shadow-[var(--rust)]/20 shadow-lg transition-colors hover:bg-[var(--rust)]"
                >
                  Start Game
                </motion.button>
                <p className="font-instrument text-xs text-[var(--ink)]/25">
                  or press Space / Enter
                </p>
              </motion.div>
            )}

            {/* Game-over overlay */}
            {uiPhase === 'gameover' && (
              <motion.div
                key="gameover"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
                className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-[var(--ivory)]/60 backdrop-blur-sm"
              >
                <motion.div
                  initial={{ y: -10, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.1 }}
                  className="text-center"
                >
                  <div className="mb-2 text-4xl">🎞️</div>
                  <h2 className="font-playfair text-2xl font-bold text-[var(--ink)]">
                    Reel&apos;s Over
                  </h2>
                  <p className="font-instrument mt-1 text-sm text-[var(--ink)]/60">
                    You caught <span className="font-semibold text-[var(--rust)]">{uiScore}</span>{' '}
                    pts of memories
                  </p>
                  {uiScore > 0 && uiScore === highScore && (
                    <motion.p
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.4 }}
                      className="font-caveat mt-1 text-sm text-[var(--amber)]"
                    >
                      New high score!
                    </motion.p>
                  )}
                </motion.div>
                {highScore > 0 && (
                  <div className="rounded-xl border border-[var(--ink)]/10 bg-[var(--smoke)] px-5 py-2.5 text-center">
                    <p className="font-instrument text-[10px] tracking-wider text-[var(--l-muted)] uppercase">
                      Best
                    </p>
                    <p className="font-playfair text-xl font-bold text-[var(--ink)]">{highScore}</p>
                  </div>
                )}
                <motion.button
                  onClick={startGame}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.96 }}
                  className="font-instrument flex items-center gap-2 rounded-full bg-[var(--ink)] px-7 py-3 text-sm font-semibold text-[var(--ivory)] shadow-[var(--rust)]/20 shadow-lg transition-colors hover:bg-[var(--rust)]"
                >
                  <RotateCcw className="h-3.5 w-3.5" /> Play Again
                </motion.button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {uiPhase === 'playing' && (
          <p className="font-instrument mt-2 text-center text-xs text-[var(--l-muted)]">
            ← → or mouse/touch to move the camera
          </p>
        )}
      </motion.div>

      {/* Nav links */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.3 }}
        className="flex flex-col items-center gap-3 sm:flex-row"
      >
        <Link
          href="/"
          className="font-instrument inline-flex items-center gap-2 rounded-full bg-[var(--ink)] px-6 py-2.5 text-sm font-semibold text-[var(--ivory)] shadow-[var(--rust)]/20 shadow-lg transition-colors hover:bg-[var(--rust)]"
        >
          <Home className="h-4 w-4" /> Go Home
        </Link>
        <Link
          href="/login"
          className="font-instrument inline-flex items-center gap-2 rounded-full border border-[var(--ink)]/15 px-6 py-2.5 text-sm font-medium text-[var(--l-muted)] transition-all hover:border-[var(--rust)] hover:text-[var(--rust)]"
        >
          Sign In
        </Link>
      </motion.div>
    </div>
  )
}
