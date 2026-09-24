'use client'

import { useEffect, useRef, useState } from 'react'

const QUOTES = [
  {
    t: 'Loot transformed how we handled photos at our wedding. Guests uploaded hundreds of candid shots we would have never gotten otherwise — and the gallery is just breathtaking.',
    n: 'Priya Sharma',
    r: 'Bride, The Grand Celebration 2024',
    i: 'P',
  },
  {
    t: 'We used Loot for our annual company retreat and the engagement was incredible. Everyone uploaded in real-time, and having a shared gallery brought the whole team closer.',
    n: 'Daniel Osei',
    r: 'Head of Culture, NovaTech Solutions',
    i: 'D',
  },
  {
    t: 'I plan birthday parties professionally and Loot is now non-negotiable for every event. The QR code sharing is seamless and the quality of the gallery is unmatched.',
    n: 'Sofia Nakamura',
    r: 'Event Planner, Bloom Events Studio',
    i: 'S',
  },
]

const CARDS = [
  {
    src: '/images/wedding.png',
    role: 'Wedding Planner',
    name: 'Aria Novak',
    quote: '"Loot made our wedding gallery something guests still talk about six months later."',
  },
  {
    src: '/images/team.png',
    role: 'Corporate Events Manager',
    name: 'Marcus Osei',
    quote:
      '"The real-time upload feature is a game-changer for team events. Everyone contributes instantly."',
  },
  {
    src: '/images/birthday.png',
    role: 'Birthday Party Organiser',
    name: 'Yuki Tanaka',
    quote: '"One link, one QR, and suddenly 200 guests are building a gallery together. Magic."',
  },
]

export function LandingTestimonials() {
  const [current, setCurrent] = useState(0)
  const qtRef = useRef<HTMLParagraphElement>(null)
  const qnmRef = useRef<HTMLDivElement>(null)
  const qrlRef = useRef<HTMLDivElement>(null)
  const qavRef = useRef<HTMLDivElement>(null)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const goTo = (i: number) => {
    const els = [qtRef.current, qnmRef.current, qrlRef.current, qavRef.current]
    els.forEach((el) => {
      if (el) {
        el.style.opacity = '0'
        el.style.transform = 'translateY(10px)'
      }
    })
    setTimeout(() => {
      setCurrent(i)
      els.forEach((el) => {
        if (el) {
          el.style.transition = 'opacity .5s ease,transform .5s ease'
          el.style.opacity = '1'
          el.style.transform = 'translateY(0)'
        }
      })
    }, 280)
  }

  useEffect(() => {
    timerRef.current = setInterval(() => {
      setCurrent((c) => {
        const next = (c + 1) % QUOTES.length
        goTo(next)
        return next
      })
    }, 5500)
    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [])

  // 3D tilt
  useEffect(() => {
    const cards = document.querySelectorAll<HTMLElement>('.l-tilt')
    cards.forEach((card) => {
      card.addEventListener('mousemove', (e) => {
        const r = card.getBoundingClientRect()
        const rx2 = -((e.clientY - (r.top + r.height / 2)) / (r.height / 2)) * 8
        const ry2 = ((e.clientX - (r.left + r.width / 2)) / (r.width / 2)) * 8
        card.style.transform = `perspective(900px) rotateX(${rx2}deg) rotateY(${ry2}deg) scale(1.02)`
      })
      card.addEventListener('mouseleave', () => {
        card.style.transition = 'transform .6s cubic-bezier(.16,1,.3,1)'
        card.style.transform = 'perspective(900px) rotateX(0) rotateY(0) scale(1)'
      })
      card.addEventListener('mouseenter', () => {
        card.style.transition = 'transform .1s'
      })
    })
  }, [])

  const q = QUOTES[current]

  return (
    <>
      {/* Quote carousel */}
      <section className="l-qs" id="testimonials">
        <div className="l-qbt">unforgettable.</div>
        <div className="l-qi l-sr l-sru">
          <span className="l-qmk">&ldquo;</span>
          <p className="l-qt" ref={qtRef}>
            {q.t}
          </p>
          <div className="l-qau">
            <div className="l-qav" ref={qavRef}>
              {q.i}
            </div>
            <div>
              <div className="l-qnm" ref={qnmRef}>
                {q.n}
              </div>
              <div className="l-qrl" ref={qrlRef}>
                {q.r}
              </div>
            </div>
          </div>
          <div className="l-qdots">
            {QUOTES.map((_, i) => (
              <div
                key={i}
                className={['l-qdot', i === current ? 'act' : ''].filter(Boolean).join(' ')}
                onClick={() => goTo(i)}
              />
            ))}
          </div>
        </div>
      </section>

      {/* Testimonial cards */}
      <section className="l-ts">
        <div className="l-tg">
          {CARDS.map((c, i) => (
            <div key={c.name} className={`l-tc l-tilt l-sr l-sru l-sd${i + 1}`}>
              <div className="l-timg">
                <div className="l-timgi" style={{ backgroundImage: `url(${c.src})`, backgroundSize: 'cover', backgroundPosition: 'center', backgroundRepeat: 'no-repeat' }} />
              </div>
              <div className="l-tinfo">
                <div className="l-trole">{c.role}</div>
                <div className="l-tname">{c.name}</div>
                <p className="l-tbio">{c.quote}</p>
              </div>
            </div>
          ))}
        </div>
      </section>
    </>
  )
}
