import { useState } from 'react'
import Court from '../components/Court'
import PlayAs from '../components/PlayAs'
import {
  BASE_SPOT,
  ROTATIONS,
  backRowSetterRotation,
  describeRotation,
  seatsForRotation,
} from '../logic/lineup'
import type { Seat } from '../logic/lineup'
import { usePick } from '../logic/pick'
import { REFERENCE, placementFromOption } from '../logic/reference'
import { evaluate } from '../logic/rules'
import type { Rule } from '../logic/rules'
import type { Pos, Pt } from '../logic/types'
import { arrowsFromBase, namedTokens, tokensFromByPos } from '../logic/view'

const pick = <T,>(xs: T[]): T => xs[Math.floor(Math.random() * xs.length)]

function basePlacement(seats: Seat[]): Record<string, Pt> {
  return Object.fromEntries(seats.map((s) => [s.role.id, { ...BASE_SPOT[s.pos] }]))
}

export default function Practice() {
  const [rotation, setRotation] = useState(() => pick(ROTATIONS))
  const [placed, setPlaced] = useState<Record<string, Pt>>(() => basePlacement(seatsForRotation(rotation)))
  const [checked, setChecked] = useState(false)
  const [showOptions, setShowOptions] = useState(false)
  const [showZones, setShowZones] = useState(false)
  const [onlyBackRow, setOnlyBackRow] = useState(false)

  // Your name and position are saved, so the same teammates follow you from rotation to rotation.
  const me = usePick('5-1')
  const who = me.assignment
  const seats = seatsForRotation(rotation)
  const info = describeRotation(rotation)

  function start(r: number) {
    setRotation(r)
    setPlaced(basePlacement(seatsForRotation(r)))
    setChecked(false)
    setShowOptions(false)
  }

  function nextRandom() {
    const pool = (onlyBackRow ? ROTATIONS.filter(backRowSetterRotation) : ROTATIONS).filter((r) => r !== rotation)
    start(pick(pool))
  }

  // Everything below is recomputed on each render, so feedback stays live while dragging.
  const players = seats.map((s) => ({ id: s.role.id, pos: s.pos, isSetter: s.role.isSetter, at: placed[s.role.id] }))
  const byPos = Object.fromEntries(players.map((p) => [p.pos, p.at])) as Record<Pos, Pt>
  const ev = evaluate(players)
  const tokens = who ? namedTokens(seats, byPos, who.byRole, who.youRoleId, false) : tokensFromByPos(seats, byPos)
  const showAt = (at: Record<Pos, Pt>) => (who ? namedTokens(seats, at, who.byRole, who.youRoleId, false) : tokensFromByPos(seats, at))
  const lines = checked ? ev.rules.map((r) => ({ a: byPos[r.rule.a], b: byPos[r.rule.b], ok: r.ok })) : []

  const labelAt = (p: Pos) => seats.find((s) => s.pos === p)!.role.label
  const ruleText = (rule: Rule) =>
    rule.kind === 'depth'
      ? `${labelAt(rule.a)} (position ${rule.a}) is closer to the net than ${labelAt(rule.b)} (position ${rule.b})`
      : `${labelAt(rule.a)} (position ${rule.a}) is left of ${labelAt(rule.b)} (position ${rule.b})`
  const labelOf = (id: string) => seats.find((s) => s.role.id === id)!.role.label

  const broken = ev.rules.filter((r) => !r.ok).length

  let banner: { tone: 'good' | 'warn' | 'bad'; title: string; body: string }
  if (!ev.legal) {
    banner = {
      tone: 'bad',
      title: `Overlap fault: ${broken} rule${broken === 1 ? '' : 's'} broken`,
      body: 'The red lines on the court show which pairs are out of order.',
    }
  } else if (!ev.hidden) {
    banner = {
      tone: 'warn',
      title: 'Legal, but the setter is not hidden yet',
      body: 'Tuck the setter into a sideline hide zone with a teammate in front, or stack them tightly right behind a teammate.',
    }
  } else if (ev.hide.length === 0) {
    banner = {
      tone: 'good',
      title: 'Legal formation',
      body: 'The setter is in the front row, so there is nothing to hide in this rotation.',
    }
  } else {
    banner = { tone: 'good', title: 'Legal, and the setter is hidden', body: 'Nicely done. Try the options below, or take another rotation.' }
  }

  const options = REFERENCE[rotation] ?? []

  return (
    <section className="practice">
      <div className="practice-head">
        <h1>Rotation {rotation}</h1>
        <p className="lede">
          {info.where} — {info.backRow ? 'back row, so hide them!' : 'front row, so there is nothing to hide.'}
        </p>
      </div>

      <div className="practice-grid">
        <div>
          <Court
            size="lg"
            spots
            zones={showZones}
            tokens={tokens}
            lines={lines}
            onMove={(id, at) => setPlaced((prev) => ({ ...prev, [id]: at }))}
            label="Serve-receive court. Drag the players, or focus one and use the arrow keys."
          />
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
            {who && (
              <li>
                <i className="dot you" /> You
              </li>
            )}
          </ul>
        </div>

        <div className="side">
          <p>
            Drag the players into a legal serve-receive formation
            {info.backRow ? ', and hide the setter.' : '.'} Dashed circles mark the rotation spots.
          </p>

          <div className="actions">
            <button className="btn primary" onClick={() => setChecked(true)}>
              Check formation
            </button>
            <button
              className="btn"
              onClick={() => {
                setPlaced(basePlacement(seats))
                setChecked(false)
              }}
            >
              Reset
            </button>
            <button className="btn" onClick={() => setShowOptions((v) => !v)}>
              {showOptions ? 'Hide options' : 'Show options'}
            </button>
            <button className="btn" onClick={nextRandom}>
              Next rotation 🎲
            </button>
          </div>

          <div className="chips" role="group" aria-label="Choose a rotation">
            {ROTATIONS.map((r) => (
              <button key={r} className={`chip${r === rotation ? ' on' : ''}`} onClick={() => start(r)}>
                {r}
                <small>{backRowSetterRotation(r) ? 'back' : 'front'}</small>
              </button>
            ))}
          </div>

          <details className="roster" open={!!me.person}>
            <summary>Play as yourself (names instead of S, OH1…)</summary>
            <PlayAs pick={me} />
            {who && (
              <p className="muted">
                You're {who.youRoleId}. Saved on this device, so you'll keep the same teammates in every rotation.
              </p>
            )}
          </details>

          <label className="check">
            <input type="checkbox" checked={onlyBackRow} onChange={(e) => setOnlyBackRow(e.target.checked)} /> Random
            rotations: only back-row setter (aka a "6-2", aka what we played last weekend)
          </label>
          <label className="check">
            <input type="checkbox" checked={showZones} onChange={(e) => setShowZones(e.target.checked)} /> Hint: show the
            hide zones
          </label>

          {checked && (
            <div className={`banner ${banner.tone}`} role="status">
              <b>{banner.title}</b>
              <span>{banner.body}</span>
            </div>
          )}

          {checked && (
            <div className="card">
              <h3>Overlap rules</h3>
              <ul className="results">
                {[...ev.rules]
                  .sort((a, b) => Number(a.ok) - Number(b.ok))
                  .map((r) => (
                    <li key={`${r.rule.kind}${r.rule.a}${r.rule.b}`} className={r.ok ? 'ok' : 'bad'}>
                      <span aria-hidden="true">{r.ok ? '✓' : '✗'}</span> {ruleText(r.rule)}
                    </li>
                  ))}
              </ul>
              {ev.hide.length > 0 && (
                <>
                  <h3>Hiding</h3>
                  <ul className="results">
                    {ev.hide.map((h) => (
                      <li key={h.setterId} className="stack">
                        {h.stackId ? (
                          <span className="ok">
                            <span aria-hidden="true">✓</span> {labelOf(h.setterId)} is stacked right behind{' '}
                            {labelOf(h.stackId)}
                          </span>
                        ) : (
                          <>
                            <span className={h.onSideline ? 'ok' : 'bad'}>
                              <span aria-hidden="true">{h.onSideline ? '✓' : '✗'}</span> {labelOf(h.setterId)} is in a
                              sideline hide zone
                            </span>
                            <span className={h.shieldId ? 'ok' : 'bad'}>
                              <span aria-hidden="true">{h.shieldId ? '✓' : '✗'}</span>{' '}
                              {h.shieldId
                                ? `${labelOf(h.shieldId)} is between ${labelOf(h.setterId)} and the net`
                                : `a teammate is close enough, in front of ${labelOf(h.setterId)}, to screen them`}
                            </span>
                            {!h.ok && (
                              <span className="muted">
                                Or stack {labelOf(h.setterId)} tightly right behind a teammate instead.
                              </span>
                            )}
                          </>
                        )}
                      </li>
                    ))}
                  </ul>
                </>
              )}
            </div>
          )}
        </div>
      </div>

      {showOptions && (
        <div className="options">
          <h2>Ways to do it</h2>
          <p className="muted">
            There is usually more than one right answer. Arrows go from each rotation spot to where that player stands.
          </p>
          <div className="mini-grid">
            {options.map((opt, i) => (
              <figure key={opt.name} className="figure">
                <Court
                  size="sm"
                  zones={info.backRow}
                  tokens={showAt(opt.at)}
                  arrows={arrowsFromBase(seats, opt.at)}
                  label={opt.name}
                />
                <figcaption>
                  <b>
                    Option {i + 1}: {opt.name}
                    {opt.preferred ? ' ★ preferred' : ''}
                  </b>
                  <br />
                  {opt.blurb}
                  <br />
                  <button
                    className="btn small"
                    onClick={() => {
                      setPlaced(placementFromOption(seats, opt))
                      setChecked(true)
                    }}
                  >
                    Load onto the court
                  </button>
                </figcaption>
              </figure>
            ))}
          </div>
        </div>
      )}
    </section>
  )
}
