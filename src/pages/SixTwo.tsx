import { Link } from 'react-router-dom'
import Court from '../components/Court'
import { BASE_SPOT, LINEUP_62, ROTATIONS, isFrontRow, seatsForRotation } from '../logic/lineup'
import type { Seat } from '../logic/lineup'
import { referenceForSeats } from '../logic/reference'
import type { Pos, Pt, Token } from '../logic/types'
import { arrowsFromBase } from '../logic/view'

type ByPos = Record<Pos, Pt>

/** In a 6-2 only the back-row setter is "the setter"; the front-row one is hitting, so it is coloured like any front-row hitter. */
function tokens62(seats: Seat[], byPos: ByPos): Token[] {
  return seats.map((s) => ({
    id: s.role.id,
    label: s.role.label,
    tone: s.role.isSetter && !isFrontRow(s.pos) ? 'setter' : isFrontRow(s.pos) ? 'front' : 'back',
    at: byPos[s.pos],
  }))
}

const backSetter = (seats: Seat[]) => seats.find((s) => s.role.isSetter && !isFrontRow(s.pos))!
const frontSetter = (seats: Seat[]) => seats.find((s) => s.role.isSetter && isFrontRow(s.pos))!

// The three hiding situations. Rotations 4-6 repeat them with S1 and S2 swapped.
const CASES = [1, 2, 3]

export default function SixTwo() {
  return (
    <article className="page">
      <h2>6-2: two setters</h2>
      <p>
        In a 6-2 we run two setters, S1 and S2, who stand opposite each other in the rotation: three spots apart, so the
        serving order is <b>{LINEUP_62.map((r) => r.label).join(' → ')}</b>. Whichever setter is in the{' '}
        <b>back row</b> does the setting. The one in the front row plays opposite and hits.
      </p>
      <p>
        So each setter sets for three rotations (while in positions 1, 6 and 5), then hits for three (positions 4, 3 and
        2). The setter is never in the front row while setting.
      </p>

      <h3>The six rotations</h3>
      <p>
        Same rotation numbering as the rest of the app, but now the second setter takes the spot the opposite had in a
        5-1. The setter who is setting is red; the one hitting is blue like any front-row player.
      </p>
      <div className="mini-grid">
        {ROTATIONS.map((rot) => {
          const seats = seatsForRotation(rot, LINEUP_62)
          const back = backSetter(seats)
          const front = frontSetter(seats)
          return (
            <figure className="figure" key={rot}>
              <Court size="sm" tokens={tokens62(seats, BASE_SPOT)} label={`6-2 rotation ${rot}`} />
              <figcaption>
                Rotation {rot}
                <span className="muted">
                  {' '}
                  · {back.role.label} sets from position {back.pos}, {front.role.label} hits from position {front.pos}
                </span>
              </figcaption>
            </figure>
          )
        })}
      </div>
      <ul className="legend">
        <li>
          <i className="dot setter" /> Setter who is setting (back row)
        </li>
        <li>
          <i className="dot front" /> Front-row player (including the other setter)
        </li>
        <li>
          <i className="dot back" /> Back-row player
        </li>
      </ul>

      <h3>What that changes</h3>
      <ul>
        <li>
          <b>Every rotation has a back-row setter to hide.</b> There are no free front-row-setter rotations. It is always
          the Rotation 4, 5 or 6 situation from the Practice page, with the other setter holding the opposite's spot.
        </li>
        <li>
          <b>The overlap rules do not change.</b> They only care about the six spots, not who is standing in them.
        </li>
        <li>
          <b>The front-row setter is just a hitter.</b> No need to hide them. They are in position 4, 3 or 2 when the
          setter is in position 1, 6 or 5.
        </li>
        <li>
          <b>Only three hiding pictures exist.</b> They repeat every three rotations, with S1 and S2 swapped.
        </li>
      </ul>

      <h3>Hiding the setter in a 6-2</h3>
      <p>
        Here are the three cases with S2 setting (Rotations 1–3). In Rotations 4–6 the pictures are identical with S1
        and S2 swapped. Arrows go from each rotation spot to where that player stands; the shaded strips are the hide
        zones.
      </p>
      {CASES.map((rot) => {
        const seats = seatsForRotation(rot, LINEUP_62)
        const back = backSetter(seats)
        const front = frontSetter(seats)
        return (
          <section key={rot}>
            <h3>
              Rotations {rot} and {rot + 3}: setter in position {back.pos}
              <span className="muted"> · other setter hitting from position {front.pos}</span>
            </h3>
            <div className="figure-row">
              {referenceForSeats(seats).map((opt, i) => (
                <figure className="figure" key={opt.name}>
                  <Court
                    size="md"
                    zones
                    tokens={tokens62(seats, opt.at)}
                    arrows={arrowsFromBase(seats, opt.at)}
                    label={`Rotation ${rot}, ${opt.name}`}
                  />
                  <figcaption>
                    <b>
                      Option {i + 1}: {opt.name}
                      {opt.preferred ? ' ★ preferred' : ''}.
                    </b>{' '}
                    {opt.blurb}
                  </figcaption>
                </figure>
              ))}
            </div>
          </section>
        )
      })}

      <nav className="pager" aria-label="6-2 page">
        <Link className="btn" to="/rules/3">
          ← Hiding the setter
        </Link>
        <span />
        <Link className="btn primary" to="/practice">
          Practice →
        </Link>
      </nav>
    </article>
  )
}
