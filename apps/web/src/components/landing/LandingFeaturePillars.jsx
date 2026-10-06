'use client'

const PILLARS = [
  { num: '01', name: 'Nearby', tag: 'Walking distance · Live map' },
  { num: '02', name: 'Right now', tag: 'Countdowns · Ending soon' },
  { num: '03', name: 'Claim', tag: 'Codes · QR · In-store' },
  { num: '04', name: 'Follow', tag: 'Your favourite spots' },
]

export function LandingFeaturePillars() {
  return (
    <section className="l-svs" id="pillars">
      <div className="l-svh l-sr l-sru">
        <h2 className="l-stitle">
          What
          <br />
          Loot does
        </h2>
        <a href="#howitworks" className="l-slink">
          How it works →
        </a>
      </div>

      <div className="l-svl l-sr l-sru l-sd2">
        {PILLARS.map((p) => (
          <div key={p.num} className="l-sr2">
            <span className="l-sn2">{p.num}</span>
            <span className="l-sname">{p.name}</span>
            <span className="l-stg">{p.tag}</span>
            <span className="l-sarr">↗</span>
          </div>
        ))}
      </div>
    </section>
  )
}
