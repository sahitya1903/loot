'use client'

import { useEffect, useRef } from 'react'

export function LandingCursor() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const dotRef = useRef<HTMLDivElement>(null)
  const ringRef = useRef<HTMLDivElement>(null)
  const labelRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (window.matchMedia('(pointer: coarse)').matches) return

    const dot = dotRef.current
    const ring = ringRef.current
    const label = labelRef.current
    const canvas = canvasRef.current
    if (!dot || !ring || !label || !canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    let mx = 0,
      my = 0,
      rx = 0,
      ry = 0,
      rafId = 0

    const resize = () => {
      canvas.width = window.innerWidth
      canvas.height = window.innerHeight
    }
    resize()
    window.addEventListener('resize', resize)

    type Particle = { x: number; y: number; vx: number; vy: number; life: number; size: number }
    const MAX_PARTICLES = 30
    let particles: Particle[] = []

    const onMouseMove = (e: MouseEvent) => {
      mx = e.clientX
      my = e.clientY
      dot.style.left = mx + 'px'
      dot.style.top = my + 'px'
      label.style.left = mx + 'px'
      label.style.top = my + 'px'

      if (particles.length < MAX_PARTICLES) {
        for (let i = 0; i < 2; i++) {
          particles.push({
            x: e.clientX,
            y: e.clientY,
            vx: (Math.random() - 0.5) * 1.5,
            vy: (Math.random() - 0.5) * 1.5,
            life: 1,
            size: Math.random() * 3 + 1,
          })
        }
      }
    }

    document.addEventListener('mousemove', onMouseMove)

    // Single unified RAF loop — ring lerp + particles
    const tick = () => {
      // Ring lerp
      rx += (mx - rx) * 0.11
      ry += (my - ry) * 0.11
      ring.style.left = rx + 'px'
      ring.style.top = ry + 'px'

      // Particles
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      particles = particles.filter((p) => p.life > 0.01)
      for (const p of particles) {
        p.x += p.vx
        p.y += p.vy
        p.life *= 0.88
        p.size *= 0.95
        ctx.beginPath()
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2)
        ctx.fillStyle = `rgba(200,75,47,${p.life * 0.6})`
        ctx.fill()
      }

      rafId = requestAnimationFrame(tick)
    }
    rafId = requestAnimationFrame(tick)

    // Hover effects
    const landing = document.querySelector('.landing-page')
    if (landing) {
      const addHover = (el: Element) => {
        el.addEventListener('mouseenter', () => document.body.classList.add('lcl'))
        el.addEventListener('mouseleave', () => document.body.classList.remove('lcl'))
      }
      const addView = (el: Element) => {
        el.addEventListener('mouseenter', () => {
          document.body.classList.add('lcv')
          label.textContent = 'View'
        })
        el.addEventListener('mouseleave', () => document.body.classList.remove('lcv'))
      }
      landing.querySelectorAll('a,button').forEach(addHover)
      landing.querySelectorAll('.lcvt').forEach(addView)
    }

    return () => {
      cancelAnimationFrame(rafId)
      document.removeEventListener('mousemove', onMouseMove)
      window.removeEventListener('resize', resize)
    }
  }, [])

  return (
    <>
      <canvas ref={canvasRef} id="lcanvas" />
      <div ref={dotRef} id="lcd" />
      <div ref={ringRef} id="lcr" />
      <div ref={labelRef} id="lct">
        View
      </div>
    </>
  )
}
