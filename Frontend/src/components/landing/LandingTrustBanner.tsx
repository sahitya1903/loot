'use client'

function IconTrophy() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
      <path
        d="M6 2h8v7a4 4 0 0 1-8 0V2Z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      <path
        d="M6 5H3.5A1.5 1.5 0 0 0 2 6.5v.5a3 3 0 0 0 3 3H6M14 5h2.5A1.5 1.5 0 0 1 18 6.5v.5a3 3 0 0 1-3 3H14"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <path d="M10 13v4M7 18h6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  )
}

function IconStar() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
      <path
        d="M10 2l2.24 4.54 5.01.73-3.62 3.53.85 4.99L10 13.27l-4.48 2.52.85-4.99L2.75 7.27l5.01-.73L10 2Z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function IconLock() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
      <rect x="4" y="9" width="12" height="9" rx="2" stroke="currentColor" strokeWidth="1.5" />
      <path
        d="M6.5 9V6.5a3.5 3.5 0 0 1 7 0V9"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <circle cx="10" cy="13.5" r="1" fill="currentColor" />
    </svg>
  )
}

function IconGlobe() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
      <circle cx="10" cy="10" r="8" stroke="currentColor" strokeWidth="1.5" />
      <path
        d="M10 2c-2.5 2-4 5-4 8s1.5 6 4 8M10 2c2.5 2 4 5 4 8s-1.5 6-4 8"
        stroke="currentColor"
        strokeWidth="1.5"
      />
      <path d="M2 10h16" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M3 6.5h14M3 13.5h14" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
    </svg>
  )
}

function IconDiamond() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
      <path
        d="M10 17L2 8l2.5-5h11L18 8l-8 9Z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      <path
        d="M2 8h16M6.5 3 5 8l5 9M13.5 3 15 8l-5 9"
        stroke="currentColor"
        strokeWidth="1.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

const AWARDS = [
  { Icon: IconTrophy, name: 'Product Hunt #1', year: '2024' },
  { Icon: IconStar, name: '4.9 App Store', year: '2024' },
  { Icon: IconLock, name: 'SOC 2 Compliant', year: '2024' },
  { Icon: IconGlobe, name: '50+ Countries', year: '2024' },
  { Icon: IconDiamond, name: 'Firebase Award', year: '2023' },
]

export function LandingTrustBanner() {
  return (
    <section className="l-aws l-sr l-sru">
      <div className="l-awi">
        <span className="l-awlbl">Trusted by</span>
        <div className="l-awr">
          {AWARDS.map((a) => (
            <div key={a.name} className="l-awp">
              <span className="l-awic">
                <a.Icon />
              </span>
              <div>
                <div className="l-awn">{a.name}</div>
                <div className="l-awy">{a.year}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
