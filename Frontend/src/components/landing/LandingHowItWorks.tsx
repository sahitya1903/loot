'use client'

import { type FC } from 'react'

const IconCalendar: FC = () => (
  <svg width="22" height="22" viewBox="0 0 22 22" fill="none" aria-hidden="true">
    <rect x="2" y="4" width="18" height="16" rx="2.5" stroke="currentColor" strokeWidth="1.5" />
    <path d="M7 2v4M15 2v4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    <path d="M2 9h18" stroke="currentColor" strokeWidth="1.5" />
    <path
      d="M7 13h2M11 13h2M7 16.5h2M11 16.5h2M15 13h.5"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
    />
  </svg>
)

const IconQR: FC = () => (
  <svg width="22" height="22" viewBox="0 0 22 22" fill="none" aria-hidden="true">
    <rect x="2" y="2" width="7" height="7" rx="1" stroke="currentColor" strokeWidth="1.5" />
    <rect x="13" y="2" width="7" height="7" rx="1" stroke="currentColor" strokeWidth="1.5" />
    <rect x="2" y="13" width="7" height="7" rx="1" stroke="currentColor" strokeWidth="1.5" />
    <rect x="4" y="4" width="3" height="3" fill="currentColor" />
    <rect x="15" y="4" width="3" height="3" fill="currentColor" />
    <rect x="4" y="15" width="3" height="3" fill="currentColor" />
    <path d="M13 13h2v2h-2zM17 13h2v2h-2zM13 17h2v2h-2zM17 17h2v2h-2z" fill="currentColor" />
  </svg>
)

const IconCamera: FC = () => (
  <svg width="22" height="22" viewBox="0 0 22 22" fill="none" aria-hidden="true">
    <path
      d="M2 7.5A2.5 2.5 0 0 1 4.5 5h.88L6.5 3h9l1.12 2h.88A2.5 2.5 0 0 1 20 7.5V16a2.5 2.5 0 0 1-2.5 2.5h-13A2.5 2.5 0 0 1 2 16V7.5Z"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinejoin="round"
    />
    <circle cx="11" cy="11.5" r="3" stroke="currentColor" strokeWidth="1.5" />
    <circle cx="17" cy="8" r="1" fill="currentColor" />
  </svg>
)

const IconGrid: FC = () => (
  <svg width="22" height="22" viewBox="0 0 22 22" fill="none" aria-hidden="true">
    <rect x="2" y="2" width="8" height="8" rx="1.5" stroke="currentColor" strokeWidth="1.5" />
    <rect x="12" y="2" width="8" height="8" rx="1.5" stroke="currentColor" strokeWidth="1.5" />
    <rect x="2" y="12" width="8" height="8" rx="1.5" stroke="currentColor" strokeWidth="1.5" />
    <rect x="12" y="12" width="8" height="8" rx="1.5" stroke="currentColor" strokeWidth="1.5" />
  </svg>
)

const STEPS = [
  {
    Icon: IconCalendar,
    num: '01',
    title: 'Create Event',
    desc: 'Set up your event in seconds with a name, date, and cover photo.',
  },
  {
    Icon: IconQR,
    num: '02',
    title: 'Invite Guests',
    desc: 'Share a QR code or link — guests join instantly, no app required.',
  },
  {
    Icon: IconCamera,
    num: '03',
    title: 'Upload Moments',
    desc: 'Everyone uploads photos and videos in real time as the event unfolds.',
  },
  {
    Icon: IconGrid,
    num: '04',
    title: 'Relive Together',
    desc: 'Browse a beautiful gallery, download originals, and share highlights.',
  },
]

export function LandingHowItWorks() {
  return (
    <section className="l-ps" id="howitworks">
      <h2 className="l-stitle l-sr l-sru">
        How it
        <br />
        works
      </h2>

      <div className="l-pst">
        {STEPS.map((s, i) => (
          <div key={s.num} className={`l-pp l-sr l-sru l-sd${i + 1}`}>
            <div className="l-piw">
              <span className="l-pic">
                <s.Icon />
              </span>
              <span className="l-pno">{s.num}</span>
            </div>
            <div className="l-ptitle">{s.title}</div>
            <p className="l-pdesc">{s.desc}</p>
          </div>
        ))}
      </div>
    </section>
  )
}
