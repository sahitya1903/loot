// Illustrative loot drops for the landing hero and login collage — polaroid
// cards drawn with CSS (no photos). They're examples, not live data.

export const LOOT_DROPS = [
  {
    cls: 'l-hc1',
    cf: 'l-cf1',
    emoji: '☕',
    cap: 'Free cold brew',
    chip: 'ends in 42m',
    dist: '350 m',
    sp: '0.06',
    tape: { col: 'rgba(212,168,67,.7)', type: 'solid', rot: '-8deg', left: '20%' },
  },
  {
    cls: 'l-hc2',
    cf: 'l-cf2',
    emoji: '🍕',
    cap: '2-for-1 slices',
    chip: 'ends in 2h',
    dist: '1.2 km',
    sp: '-0.04',
    tape: { col: 'rgba(200,75,47,.65)', type: 'stripe', rot: '6deg', left: '25%' },
  },
  {
    cls: 'l-hc3',
    cf: 'l-cf3',
    emoji: '🎧',
    cap: 'Vinyl drop',
    chip: '12 left',
    dist: '800 m',
    sp: '0.05',
    tape: null,
  },
  {
    cls: 'l-hc4',
    cf: 'l-cf4',
    emoji: '🧘',
    cap: 'Free trial class',
    chip: 'today only',
    dist: '2.1 km',
    sp: '-0.07',
    tape: { col: 'rgba(120,160,200,.6)', type: 'dots', rot: '-4deg', left: '20%' },
  },
  {
    cls: 'l-hc5',
    cf: 'l-cf5',
    emoji: '👟',
    cap: 'Sneaker restock',
    chip: 'ends in 9m',
    dist: '600 m',
    sp: '0.09',
    tape: null,
  },
]

/** One polaroid-style loot card. `data-sp` drives the mouse parallax in the collages. */
export function LootDropCard({ drop }) {
  return (
    <div className={`l-hc ${drop.cls} l-pol`} data-sp={drop.sp}>
      <div className={`l-cf l-drop ${drop.cf}`} style={{ height: 'calc(100% - 34px)' }}>
        <span className="l-drop-chip">{drop.chip}</span>
        <span className="l-drop-emoji" aria-hidden>
          {drop.emoji}
        </span>
        <span className="l-drop-dist">{drop.dist}</span>
      </div>
      <span className="l-pol-cap">{drop.cap}</span>
      {drop.tape && (
        <div
          className={`l-tape l-tape-${drop.tape.type}`}
          style={{
            ['--tape-col']: drop.tape.col,
            position: 'absolute',
            width: '70px',
            top: '-7px',
            left: drop.tape.left,
            transform: `rotate(${drop.tape.rot})`,
            zIndex: 10,
          }}
        >
          <div className="l-tape-inner" />
        </div>
      )}
    </div>
  )
}
