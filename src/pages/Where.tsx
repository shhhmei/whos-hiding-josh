import { useState } from 'react'
import Court from '../components/Court'
import PlayAs from '../components/PlayAs'
import { BASE_SPOT, LINEUP, LINEUP_62, ROTATIONS, isFrontRow, seatsForRotation } from '../logic/lineup'
import { usePick } from '../logic/pick'
import type { System } from '../logic/pick'
import { referenceForSeats } from '../logic/reference'
import { ROSTER } from '../logic/roster'
import { arrowsFromBase, namedTokens } from '../logic/view'

const LINEUPS = { '5-1': LINEUP, '6-2': LINEUP_62 }
const SYSTEM_LABEL: Record<System, string> = {
  '5-1': '5-1 (one setter and an opposite)',
  '6-2': '6-2 (two setters)',
}

export default function Where() {
  const pick = usePick()
  const { system, lineup, assignment, chosen } = pick
  const [rotation, setRotation] = useState(1)
  const [optionPick, setOptionPick] = useState<number | null>(null)

  const frontSetterHits = lineup.filter((r) => r.isSetter).length > 1
  const youRole = assignment ? lineup.find((r) => r.id === assignment.youRoleId)! : null

  function describeYou(rot: number) {
    if (!assignment || !youRole) return ''
    const seat = seatsForRotation(rot, lineup).find((s) => s.role.id === assignment.youRoleId)!
    const front = isFrontRow(seat.pos)
    const extra = youRole.isSetter ? (front ? (frontSetterHits ? ', hitting' : '') : ', setting') : ''
    return `you're ${youRole.label} in position ${seat.pos} (${front ? 'front' : 'back'} row${extra})`
  }

  // Serve receive view
  const seats = seatsForRotation(rotation, lineup)
  const options = referenceForSeats(seats)
  const defaultOption = Math.max(
    0,
    options.findIndex((o) => o.preferred),
  )
  const optionIndex = Math.min(optionPick ?? defaultOption, options.length - 1)
  const option = options[optionIndex]

  return (
    <section className="page">
      <h1>See where you'd be</h1>
      <p className="lede">
        Pick your name and the position you're playing. We fill in the rest of the lineup at random from the roster,
        according to who can play what, then show where you start in every rotation and where you'd stand in serve
        receive.
      </p>

      <div className="card">
        <div className="form-grid">
          <label className="field">
            System
            <select value={system} onChange={(e) => pick.set({ system: e.target.value as System })}>
              {(Object.keys(LINEUPS) as System[]).map((k) => (
                <option key={k} value={k}>
                  {SYSTEM_LABEL[k]}
                </option>
              ))}
            </select>
          </label>
        </div>
        <PlayAs pick={pick} />

        <details className="roster">
          <summary>Roster and who can play what</summary>
          <table className="lineup">
            <tbody>
              {ROSTER.map((p) => (
                <tr key={p.id}>
                  <td>{p.name}</td>
                  <td>{p.positions.join(', ')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </details>
      </div>

      {assignment && youRole && (
        <>
          <h2>Your lineup</h2>
          <p className="muted">
            In serving order. {system === '6-2' ? 'S1 and S2 are the two setters. ' : ''}You are highlighted.
          </p>
          <table className="lineup">
            <thead>
              <tr>
                <th>Slot</th>
                <th>Player</th>
                <th>Plays</th>
              </tr>
            </thead>
            <tbody>
              {lineup.map((r) => (
                <tr key={r.id} className={r.id === assignment.youRoleId ? 'you' : undefined}>
                  <td>{r.label}</td>
                  <td>
                    {assignment.byRole[r.id].name}
                    {r.id === assignment.youRoleId ? ' (you)' : ''}
                  </td>
                  <td>{r.id === assignment.youRoleId && chosen ? chosen : r.position}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {assignment.bench.length > 0 && (
            <p className="muted">On the bench: {assignment.bench.map((p) => p.name).join(', ')}.</p>
          )}

          <h2>Where you start in each rotation</h2>
          <div className="mini-grid">
            {ROTATIONS.map((rot) => {
              const s = seatsForRotation(rot, lineup)
              const byPos = BASE_SPOT
              return (
                <figure className="figure" key={rot}>
                  <Court
                    size="sm"
                    tokens={namedTokens(s, byPos, assignment.byRole, assignment.youRoleId, frontSetterHits)}
                    label={`Rotation ${rot}`}
                  />
                  <figcaption>
                    <b>Rotation {rot}</b>
                    <span className="muted"> · {describeYou(rot)}</span>
                  </figcaption>
                </figure>
              )
            })}
          </div>
          <ul className="legend">
            <li>
              <i className="dot you" /> You
            </li>
            <li>
              <i className="dot setter" /> Setter who is setting
            </li>
            <li>
              <i className="dot front" /> Front row
            </li>
            <li>
              <i className="dot back" /> Back row
            </li>
          </ul>

          <h2>Where you'd stand in serve receive</h2>
          <div className="chips" role="group" aria-label="Choose a rotation">
            {ROTATIONS.map((r) => (
              <button
                key={r}
                className={`chip${r === rotation ? ' on' : ''}`}
                onClick={() => {
                  setRotation(r)
                  setOptionPick(null)
                }}
              >
                {r}
                <small>rotation</small>
              </button>
            ))}
          </div>
          <div className="practice-grid" style={{ marginTop: '1rem' }}>
            <Court
              size="lg"
              spots
              tokens={namedTokens(seats, option.at, assignment.byRole, assignment.youRoleId, frontSetterHits)}
              arrows={arrowsFromBase(seats, option.at)}
              label={`Rotation ${rotation}, ${option.name}`}
            />
            <div className="side">
              <p>
                <b>Rotation {rotation}:</b> {describeYou(rotation)}.
              </p>
              {options.length > 1 && (
                <div className="chips" role="group" aria-label="Choose a formation">
                  {options.map((o, i) => (
                    <button
                      key={o.name}
                      className={`chip${i === optionIndex ? ' on' : ''}`}
                      onClick={() => setOptionPick(i)}
                    >
                      {i + 1}
                      <small>{o.preferred ? '★ preferred' : 'option'}</small>
                    </button>
                  ))}
                </div>
              )}
              <div className="card">
                <h3>
                  {option.name}
                  {option.preferred ? ' ★' : ''}
                </h3>
                <p>{option.blurb}</p>
                <p className="muted">Arrows go from each rotation spot to where that player stands.</p>
              </div>
            </div>
          </div>
        </>
      )}
    </section>
  )
}
