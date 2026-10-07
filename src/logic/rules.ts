import { isFrontRow } from './lineup'
import type { Pos, Pt } from './types'

/** Near-ties count as overlaps, so a formation needs a clear gap (fraction of the court). */
export const EPS = 0.02
const TOL = 1e-9

export type RuleKind = 'depth' | 'side'

/**
 * depth: `a` must be closer to the net than `b`
 * side:  `a` must be left of `b`
 */
export interface Rule {
  kind: RuleKind
  a: Pos
  b: Pos
}

/** The seven overlap comparisons. Anything not listed here is unrestricted. */
export const RULES: Rule[] = [
  { kind: 'depth', a: 4, b: 5 },
  { kind: 'depth', a: 3, b: 6 },
  { kind: 'depth', a: 2, b: 1 },
  { kind: 'side', a: 4, b: 3 },
  { kind: 'side', a: 3, b: 2 },
  { kind: 'side', a: 5, b: 6 },
  { kind: 'side', a: 6, b: 1 },
]

export interface RuleResult {
  rule: Rule
  ok: boolean
  /** How much room there is (negative = broken). */
  gap: number
}

export function checkRules(at: Record<Pos, Pt>): RuleResult[] {
  return RULES.map((rule) => {
    const a = at[rule.a]
    const b = at[rule.b]
    const gap = rule.kind === 'depth' ? b.y - a.y : b.x - a.x
    return { rule, gap, ok: gap >= EPS - TOL }
  })
}

/**
 * What counts as "hidden" for a back-row setter. Tweak these to taste.
 *  - edge:        the setter is in a sideline strip this wide (fraction of court width)
 *  - shieldWidth: a teammate within this much sideways...
 *  - shieldDepth: ...and no more than this far closer to the net, screens the setter
 */
export const HIDE = { edge: 0.22, shieldWidth: 0.22, shieldDepth: 0.45 }

export interface Player {
  id: string
  pos: Pos
  isSetter: boolean
  at: Pt
}

export interface HideResult {
  setterId: string
  onSideline: boolean
  shieldId: string | null
  ok: boolean
}

export function checkHidden(players: Player[]): HideResult[] {
  return players
    .filter((p) => p.isSetter && !isFrontRow(p.pos))
    .map((s) => {
      const onSideline = s.at.x <= HIDE.edge + TOL || s.at.x >= 1 - HIDE.edge - TOL
      const shields = players
        .filter((o) => {
          if (o.id === s.id) return false
          const ahead = s.at.y - o.at.y
          return Math.abs(o.at.x - s.at.x) <= HIDE.shieldWidth + TOL && ahead >= EPS - TOL && ahead <= HIDE.shieldDepth + TOL
        })
        .sort(
          (p, q) =>
            Math.hypot(p.at.x - s.at.x, p.at.y - s.at.y) - Math.hypot(q.at.x - s.at.x, q.at.y - s.at.y),
        )
      const shieldId = shields.length > 0 ? shields[0].id : null
      return { setterId: s.id, onSideline, shieldId, ok: onSideline && shieldId !== null }
    })
}

export interface Evaluation {
  rules: RuleResult[]
  legal: boolean
  /** One entry per back-row setter (empty when the setter is in the front row). */
  hide: HideResult[]
  hidden: boolean
  success: boolean
}

export function evaluate(players: Player[]): Evaluation {
  const byPos = Object.fromEntries(players.map((p) => [p.pos, p.at])) as Record<Pos, Pt>
  const rules = checkRules(byPos)
  const legal = rules.every((r) => r.ok)
  const hide = checkHidden(players)
  const hidden = hide.every((h) => h.ok)
  return { rules, legal, hide, hidden, success: legal && hidden }
}
