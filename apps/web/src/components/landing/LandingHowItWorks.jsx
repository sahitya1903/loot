'use client'

const IconPin = () => (
  <svg width="22" height="22" viewBox="0 0 22 22" fill="none" aria-hidden="true">
    <path
      d="M11 20s6.5-5.6 6.5-11a6.5 6.5 0 1 0-13 0c0 5.4 6.5 11 6.5 11Z"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinejoin="round"
    />
    <circle cx="11" cy="9" r="2.5" stroke="currentColor" strokeWidth="1.5" />
  </svg>
)

const IconClock = () => (
  <svg width="22" height="22" viewBox="0 0 22 22" fill="none" aria-hidden="true">
    <circle cx="11" cy="12" r="8" stroke="currentColor" strokeWidth="1.5" />
    <path
      d="M11 8v4l2.5 2.5M8.5 2h5"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
    />
  </svg>
)

const IconQR = () => (
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

const IconStore = () => (
  <svg width="22" height="22" viewBox="0 0 22 22" fill="none" aria-hidden="true">
    <path
      d="M3 8.5 4.5 3h13L19 8.5"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinejoin="round"
    />
    <path
      d="M3 8.5c0 1.4 1.1 2.5 2.7 2.5S8.3 9.9 8.3 8.5c0 1.4 1.2 2.5 2.7 2.5s2.7-1.1 2.7-2.5c0 1.4 1.1 2.5 2.6 2.5S19 9.9 19 8.5"
      stroke="currentColor"
      strokeWidth="1.5"
    />
    <path
      d="M4.5 11v8h13v-8M9 19v-4.5h4V19"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinejoin="round"
    />
  </svg>
)

const STEPS = [
  {
    Icon: IconPin,
    num: '01',
    title: 'Open the feed',
    desc: 'See what businesses around you are dropping right now — Nearby, Following, Trending and Fresh.',
  },
  {
    Icon: IconClock,
    num: '02',
    title: 'Watch the clock',
    desc: 'Every loot expires. Drops that are ending soon pulse, so you never miss the good ones.',
  },
  {
    Icon: IconQR,
    num: '03',
    title: 'Claim it',
    desc: 'One tap gets you a code or QR. Show it at the counter or use it online.',
  },
  {
    Icon: IconStore,
    num: '04',
    title: 'Run a business?',
    desc: 'Drop loot in a minute and reach the people nearby who are looking for something to do now.',
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
