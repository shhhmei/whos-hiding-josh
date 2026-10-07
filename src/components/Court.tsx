import { useId, useRef, useState } from 'react'
import type { KeyboardEvent, PointerEvent } from 'react'
import { BASE_SPOT } from '../logic/lineup'
import { HIDE } from '../logic/rules'
import type { Arrow, LineMark, Pos, Pt, Token } from '../logic/types'

interface Props {
  tokens: Token[]
  arrows?: Arrow[]
  lines?: LineMark[]
  /** Show the six numbered rotation spots. */
  spots?: boolean
  /** Shade the sideline "hide zones". */
  zones?: boolean
  size?: 'sm' | 'md' | 'lg'
  /** When provided, tokens can be dragged (or moved with the arrow keys). */
  onMove?: (id: string, at: Pt) => void
  label?: string
}

const MARGIN = 0.04
const clamp = (v: number) => Math.min(1 - MARGIN, Math.max(MARGIN, v))

// Token radius as a fraction of the court, and SVG stroke width, per size.
const RADIUS = { sm: 0.1, md: 0.08, lg: 0.065 }
const STROKE = { sm: 1.4, md: 1.1, lg: 0.9 }

/** The point `r` short of `to`, on the way from `from`. */
function stopShort(from: Pt, to: Pt, r: number): Pt {
  const dx = to.x - from.x
  const dy = to.y - from.y
  const d = Math.hypot(dx, dy) || 1
  return { x: to.x - (dx / d) * r, y: to.y - (dy / d) * r }
}

const SPOT_ORDER: Pos[] = [4, 3, 2, 5, 6, 1]

export default function Court({
  tokens,
  arrows = [],
  lines = [],
  spots = false,
  zones = false,
  size = 'lg',
  onMove,
  label,
}: Props) {
  const ref = useRef<HTMLDivElement>(null)
  const drag = useRef<{ id: string; dx: number; dy: number } | null>(null)
  const [active, setActive] = useState<string | null>(null)
  const markerId = 'arrow' + useId().replace(/[^a-zA-Z0-9_-]/g, '')
  const r = RADIUS[size]
  const sw = STROKE[size]

  function toCourt(e: PointerEvent<HTMLDivElement>): Pt | null {
    if (!ref.current) return null
    const rect = ref.current.getBoundingClientRect()
    return { x: (e.clientX - rect.left) / rect.width, y: (e.clientY - rect.top) / rect.height }
  }

  function down(e: PointerEvent<HTMLDivElement>, t: Token) {
    if (!onMove) return
    const p = toCourt(e)
    if (!p) return
    drag.current = { id: t.id, dx: t.at.x - p.x, dy: t.at.y - p.y }
    e.currentTarget.setPointerCapture(e.pointerId)
    setActive(t.id)
  }

  function move(e: PointerEvent<HTMLDivElement>) {
    const d = drag.current
    const p = toCourt(e)
    if (!d || !p || !onMove) return
    onMove(d.id, { x: clamp(p.x + d.dx), y: clamp(p.y + d.dy) })
  }

  function up() {
    drag.current = null
    setActive(null)
  }

  function key(e: KeyboardEvent<HTMLDivElement>, t: Token) {
    if (!onMove) return
    const step = e.shiftKey ? 0.05 : 0.02
    const deltas: Record<string, [number, number]> = {
      ArrowLeft: [-step, 0],
      ArrowRight: [step, 0],
      ArrowUp: [0, -step],
      ArrowDown: [0, step],
    }
    const d = deltas[e.key]
    if (!d) return
    e.preventDefault()
    onMove(t.id, { x: clamp(t.at.x + d[0]), y: clamp(t.at.y + d[1]) })
  }

  return (
    <div className={`court ${size}${onMove ? ' live' : ''}`} ref={ref} role="group" aria-label={label}>
      <div className="net" aria-hidden="true" />
      <div className="attack-line" aria-hidden="true" />

      {zones && (
        <>
          <div className="zone left" style={{ width: `${HIDE.edge * 100}%` }} aria-hidden="true">
            <span>hide zone</span>
          </div>
          <div className="zone right" style={{ width: `${HIDE.edge * 100}%` }} aria-hidden="true">
            <span>hide zone</span>
          </div>
        </>
      )}

      {spots &&
        SPOT_ORDER.map((p) => (
          <div
            key={p}
            className="spot"
            style={{ left: `${BASE_SPOT[p].x * 100}%`, top: `${BASE_SPOT[p].y * 100}%` }}
            aria-hidden="true"
          >
            {p}
          </div>
        ))}

      <svg className="overlay" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
        <defs>
          <marker id={markerId} viewBox="0 0 10 10" refX="7" refY="5" markerWidth="4" markerHeight="4" orient="auto">
            <path d="M0,0 L10,5 L0,10 z" fill="#3b3b3b" />
          </marker>
        </defs>
        {lines.map((l, i) => (
          <line
            key={`l${i}`}
            className={l.ok ? 'rule-line ok' : 'rule-line bad'}
            x1={l.a.x * 100}
            y1={l.a.y * 100}
            x2={l.b.x * 100}
            y2={l.b.y * 100}
          />
        ))}
        {arrows.map((a, i) => {
          if (Math.hypot(a.to.x - a.from.x, a.to.y - a.from.y) < 2 * r + 0.04) return null
          const s = stopShort(a.to, a.from, r)
          const e = stopShort(a.from, a.to, r)
          return (
            <line
              key={`a${i}`}
              x1={s.x * 100}
              y1={s.y * 100}
              x2={e.x * 100}
              y2={e.y * 100}
              stroke="#3b3b3b"
              strokeWidth={sw}
              strokeLinecap="round"
              markerEnd={`url(#${markerId})`}
            />
          )
        })}
      </svg>

      {tokens.map((t) => (
        <div
          key={t.id}
          className={`token ${t.tone}${active === t.id ? ' dragging' : ''}`}
          style={{ left: `${t.at.x * 100}%`, top: `${t.at.y * 100}%` }}
          tabIndex={onMove ? 0 : -1}
          aria-label={`${t.label} token`}
          onPointerDown={(e) => down(e, t)}
          onPointerMove={move}
          onPointerUp={up}
          onPointerCancel={up}
          onKeyDown={(e) => key(e, t)}
        >
          {t.label}
        </div>
      ))}
    </div>
  )
}
