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
 * Either of these is enough (and the formation must be legal too):
 *  1. Tucked: in a sideline strip `edge` wide (fraction of court width), with a teammate who is
 *     within `shieldWidth` sideways and no more than `shieldDepth` closer to the net.
 *  2. Stacked: tightly right behind a teammate, within `stackWidth` sideways and
 *     no more than `stackDepth` closer to the net. Works anywhere on the court.
 */
export const HIDE = { edge: 0.22, shieldWidth: 0.22, shieldDepth: 0.45, stackWidth: 0.1, stackDepth: 0.3 }

export interface Player {
  id: string
  pos: Pos
  isSetter: boolean
  at: Pt
}

export interface HideResult {
  setterId: string
  /** In a sideline hide zone. */
  onSideline: boolean
  /** A teammate between the setter and the net, close enough to screen them. */
  shieldId: string | null
  /** A teammate the setter is stacked tightly behind. */
  stackId: string | null
  ok: boolean
}

export function checkHidden(players: Player[]): HideResult[] {
  return players
    .filter((p) => p.isSetter && !isFrontRow(p.pos))
    .map((s) => {
      const onSideline = s.at.x <= HIDE.edge + TOL || s.at.x >= 1 - HIDE.edge - TOL
      const nearest = (width: number, depth: number): string | null => {
        const found = players
          .filter((o) => {
            if (o.id === s.id) return false
            const ahead = s.at.y - o.at.y
            return Math.abs(o.at.x - s.at.x) <= width + TOL && ahead >= EPS - TOL && ahead <= depth + TOL
          })
          .sort(
            (p, q) =>
              Math.hypot(p.at.x - s.at.x, p.at.y - s.at.y) - Math.hypot(q.at.x - s.at.x, q.at.y - s.at.y),
          )
        return found.length > 0 ? found[0].id : null
      }
      const shieldId = nearest(HIDE.shieldWidth, HIDE.shieldDepth)
      const stackId = nearest(HIDE.stackWidth, HIDE.stackDepth)
      return { setterId: s.id, onSideline, shieldId, stackId, ok: stackId !== null || (onSideline && shieldId !== null) }
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
