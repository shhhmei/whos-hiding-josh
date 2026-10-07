import type { ReactNode } from 'react'
import { Link, Navigate, useParams } from 'react-router-dom'
import Court from '../components/Court'
import { BASE_SPOT, LINEUP, ROTATIONS, describeRotation, isFrontRow, seatsForRotation } from '../logic/lineup'
import { REFERENCE } from '../logic/reference'
import type { Arrow, Pos, Pt, Token } from '../logic/types'
import { arrowsFromBase, linesFromByPos, tokensFromByPos } from '../logic/view'

function Figure({ caption, children }: { caption: ReactNode; children: ReactNode }) {
  return (
    <figure className="figure">
      {children}
      <figcaption>{caption}</figcaption>
    </figure>
  )
}

const SPOT_TOKENS: Token[] = ([4, 3, 2, 5, 6, 1] as Pos[]).map((p) => ({
  id: `p${p}`,
  label: String(p),
  tone: isFrontRow(p) ? 'front' : 'back',
  at: BASE_SPOT[p],
}))

// Everyone moves one spot clockwise when the team rotates.
const ROTATE_ARROWS: Arrow[] = (
  [
    [2, 1],
    [1, 6],
    [6, 5],
    [5, 4],
    [4, 3],
    [3, 2],
  ] as [Pos, Pos][]
).map(([a, b]) => ({ from: BASE_SPOT[a], to: BASE_SPOT[b] }))

function StepOne() {
  return (
    <>
      <h2>1 · The court and the rotation</h2>
      <p>
        Picture your half of the court with the net at the top. There are six players and six spots, numbered like this
        (left and right are from your team's point of view, facing the net):
      </p>
      <div className="figure-row">
        <Figure caption="Front row at the net: 4 · 3 · 2. Back row: 5 · 6 · 1. The arrows show the rotation.">
          <Court size="md" spots={false} tokens={SPOT_TOKENS} arrows={ROTATE_ARROWS} label="Court positions 1 to 6" />
        </Figure>
        <div className="prose-side">
          <p>
            <b>Serving.</b> The player in position 1 serves.
          </p>
          <p>
            <b>Rotating.</b> Each time your team wins the ball back from the other team's serve, everyone rotates one
            spot clockwise: 2→1, 1→6, 6→5, 5→4, 4→3, 3→2. Whoever lands in position 1 serves next.
          </p>
          <p>
            <b>Row follows the spot, not the role.</b> Your row is decided by your rotation spot (4, 3, 2 are front row;
            5, 6, 1 are back row), no matter where you actually stand when the ball is served.
          </p>
        </div>
      </div>

      <h3>Serving order and the six rotations</h3>
      <p>
        Because everyone rotates together, the serving order never changes. In this app it is{' '}
        <b>{LINEUP.map((r) => r.label).join(' → ')}</b>. Going around the court counter-clockwise (4, 5, 6, 1, 2, 3) you
        meet them in that order when the setter is in position 4.
      </p>
      <p>
        That gives six different looks. We number them by where the setter starts: Rotations 1–3 have the setter in the
        front row (positions 4, 3, 2); Rotations 4–6 have the setter in the back row (positions 1, 6, 5).
      </p>
      <div className="mini-grid">
        {ROTATIONS.map((rot) => {
          const seats = seatsForRotation(rot)
          const byPos = Object.fromEntries(seats.map((s) => [s.pos, BASE_SPOT[s.pos]])) as Record<Pos, Pt>
          return (
            <Figure key={rot} caption={<>Rotation {rot}<span className="muted"> · {describeRotation(rot).where}</span></>}>
              <Court size="sm" tokens={tokensFromByPos(seats, byPos)} label={`Rotation ${rot}`} />
            </Figure>
          )
        })}
      </div>
      <ul className="legend">
        <li>
          <i className="dot setter" /> Setter
        </li>
        <li>
          <i className="dot front" /> Front-row spot
        </li>
        <li>
          <i className="dot back" /> Back-row spot
        </li>
      </ul>
    </>
  )
}

const ROT4 = seatsForRotation(4)
const LEGAL_EXAMPLE = REFERENCE[4][0].at
// Two faults: position 3 is behind position 6, and position 5 is right of position 6.
const ILLEGAL_EXAMPLE: Record<Pos, Pt> = {
  4: { x: 0.14, y: 0.3 },
  3: { x: 0.5, y: 0.76 },
  2: { x: 0.8, y: 0.2 },
  5: { x: 0.76, y: 0.58 },
  6: { x: 0.28, y: 0.5 },
  1: { x: 0.9, y: 0.8 },
}

function StepTwo() {
  return (
    <>
      <h2>2 · The overlap rules</h2>
      <p>
        At the moment the ball is served, your team has to be standing in an order that matches your rotation spots.
        Once the server hits the ball, nobody is restricted any more and everyone can run wherever they like.
      </p>
      <p>
        The idea is simple: each player has to fit <b>in between</b> the players next to them in the rotation (the ones
        before and after them in the serving order). That boils down to seven comparisons:
      </p>
      <div className="rule-cols">
        <div className="card">
          <h3>Front to back</h3>
          <p>Each front-row player is closer to the net than the back-row player on their line.</p>
          <ul>
            <li>4 is in front of 5</li>
            <li>3 is in front of 6</li>
            <li>2 is in front of 1</li>
          </ul>
        </div>
        <div className="card">
          <h3>Side to side</h3>
          <p>Within a row, players keep their left-to-right order.</p>
          <ul>
            <li>Front row: 4 is left of 3, and 3 is left of 2</li>
            <li>Back row: 5 is left of 6, and 6 is left of 1</li>
          </ul>
        </div>
      </div>
      <p>
        <b>Everything else is free.</b> For example, nothing compares 4 with 6, or 2 with 6. A front-row player can even
        stand deep in the court, as long as the back-row player on their line is deeper still. In real matches the
        referee judges by where your feet touch the floor; here, a near-tie counts as an overlap, so leave a clear gap.
      </p>
      <div className="figure-row">
        <Figure caption="Legal: all seven comparisons hold (green lines).">
          <Court
            size="md"
            tokens={tokensFromByPos(ROT4, LEGAL_EXAMPLE)}
            lines={linesFromByPos(LEGAL_EXAMPLE)}
            label="A legal formation"
          />
        </Figure>
        <Figure caption="Illegal: M1 (position 3) is behind M2 (position 6), and OH2 (position 5) is right of M2 (position 6).">
          <Court
            size="md"
            tokens={tokensFromByPos(ROT4, ILLEGAL_EXAMPLE)}
            lines={linesFromByPos(ILLEGAL_EXAMPLE)}
            label="An illegal formation"
          />
        </Figure>
      </div>
    </>
  )
}

function StepThree() {
  const base = Object.fromEntries(ROT4.map((s) => [s.pos, BASE_SPOT[s.pos]])) as Record<Pos, Pt>
  return (
    <>
      <h2>3 · Hiding the setter</h2>
      <p>
        When the setter is in the back row, they are not there to pass. They need to get to the net, near the target on
        the right side, and set. So we want them legal but <b>hidden</b>: out in a corner and screened by a teammate.
      </p>
      <p>This app calls a back-row setter hidden when all of these are true:</p>
      <ol>
        <li>The whole formation is legal (no overlap faults).</li>
        <li>The setter is inside one of the sideline hide zones (the shaded strips below).</li>
        <li>
          A teammate is between the setter and the net, close enough to screen them (roughly within a fifth of the court
          sideways and under half the court deep).
        </li>
      </ol>
      <p>
        If the setter is in the <b>front row</b> (Rotations 1–3) there is nothing to hide. You only need a legal formation.
      </p>
      <h3>Example: the setter in position 1 (Rotation 4)</h3>
      <div className="figure-row">
        <Figure caption="Standing in your spots is legal, but the setter is sitting in the open.">
          <Court size="md" zones tokens={tokensFromByPos(ROT4, base)} label="Legal but not hidden" />
        </Figure>
        {REFERENCE[4].map((opt, i) => (
          <Figure key={opt.name} caption={<><b>Option {i + 1}: {opt.name}.</b> {opt.blurb}</>}>
            <Court
              size="md"
              zones
              tokens={tokensFromByPos(ROT4, opt.at)}
              arrows={arrowsFromBase(ROT4, opt.at)}
              label={opt.name}
            />
          </Figure>
        ))}
      </div>
    </>
  )
}

const STEPS = [StepOne, StepTwo, StepThree]

export default function Rules() {
  const { step } = useParams()
  const n = Number(step)
  if (!Number.isInteger(n) || n < 1 || n > STEPS.length) return <Navigate to="/rules/1" replace />
  const Step = STEPS[n - 1]

  return (
    <article className="page">
      <Step />
      <nav className="pager" aria-label="Rules pages">
        {n > 1 ? (
          <Link className="btn" to={`/rules/${n - 1}`}>
            ← Back
          </Link>
        ) : (
          <span />
        )}
        <span className="muted">
          Page {n} of {STEPS.length}
        </span>
        {n < STEPS.length ? (
          <Link className="btn primary" to={`/rules/${n + 1}`}>
            Next →
          </Link>
        ) : (
          <Link className="btn primary" to="/practice">
            Start practicing →
          </Link>
        )}
      </nav>
    </article>
  )
}
