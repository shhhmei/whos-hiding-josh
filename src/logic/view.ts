import { BASE_SPOT, isFrontRow } from './lineup'
import type { Seat } from './lineup'
import { checkRules } from './rules'
import type { Player } from './rules'
import type { Arrow, LineMark, Pos, Pt, Token, Tone } from './types'

type ByPos = Record<Pos, Pt>

export function toneFor(seat: Seat): Tone {
  if (seat.role.isSetter) return 'setter'
  return isFrontRow(seat.pos) ? 'front' : 'back'
}

export function tokensFromByPos(seats: Seat[], byPos: ByPos): Token[] {
  return seats.map((s) => ({ id: s.role.id, label: s.role.label, tone: toneFor(s), at: byPos[s.pos] }))
}

/** Arrows from each rotation spot to where that player stands (skipping tiny moves). */
export function arrowsFromBase(seats: Seat[], byPos: ByPos, minDistance = 0.12): Arrow[] {
  return seats
    .map((s) => ({ from: BASE_SPOT[s.pos], to: byPos[s.pos] }))
    .filter((a) => Math.hypot(a.to.x - a.from.x, a.to.y - a.from.y) >= minDistance)
}

export function linesFromByPos(byPos: ByPos): LineMark[] {
  return checkRules(byPos).map((r) => ({ a: byPos[r.rule.a], b: byPos[r.rule.b], ok: r.ok }))
}

export function playersFromByPos(seats: Seat[], byPos: ByPos): Player[] {
  return seats.map((s) => ({ id: s.role.id, pos: s.pos, isSetter: s.role.isSetter, at: byPos[s.pos] }))
}
