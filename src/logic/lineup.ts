import type { Pos, Pt } from './types'

export interface Role {
  id: string
  /** Short name shown on the token. */
  label: string
  /** Long name used in the rules text. */
  title: string
  isSetter: boolean
}

/**
 * The lineup, in SERVING ORDER.
 *
 * This is the one place to rename positions or change the system (e.g. a 6-2 would
 * flag two roles as setters). Everything else (rotations, rules, hide check) reads from here.
 */
export const LINEUP: Role[] = [
  { id: 'S', label: 'S', title: 'Setter', isSetter: true },
  { id: 'OH1', label: 'OH1', title: 'Outside hitter 1', isSetter: false },
  { id: 'M1', label: 'M1', title: 'Middle blocker 1', isSetter: false },
  { id: 'OP', label: 'OP', title: 'Opposite', isSetter: false },
  { id: 'OH2', label: 'OH2', title: 'Outside hitter 2', isSetter: false },
  { id: 'M2', label: 'M2', title: 'Middle blocker 2', isSetter: false },
]

/**
 * The 6-2 lineup: two setters (S1, S2) three spots apart, no dedicated opposite.
 * Whichever setter is in the back row sets; the one in the front row hits as the opposite.
 */
export const LINEUP_62: Role[] = [
  { id: 'S1', label: 'S1', title: 'Setter 1', isSetter: true },
  { id: 'OH1', label: 'OH1', title: 'Outside hitter 1', isSetter: false },
  { id: 'M1', label: 'M1', title: 'Middle blocker 1', isSetter: false },
  { id: 'S2', label: 'S2', title: 'Setter 2', isSetter: true },
  { id: 'OH2', label: 'OH2', title: 'Outside hitter 2', isSetter: false },
  { id: 'M2', label: 'M2', title: 'Middle blocker 2', isSetter: false },
]

/**
 * The court positions in serving-order direction (counter-clockwise around the court):
 * down the left side, across the back, up the right side, back across the net.
 * In Rotation 1 the first role in LINEUP (the setter) is at SEQ[0] = position 4.
 */
export const SEQ: Pos[] = [4, 5, 6, 1, 2, 3]

export const ROTATIONS = [1, 2, 3, 4, 5, 6]

export const isFrontRow = (pos: Pos): boolean => pos === 4 || pos === 3 || pos === 2

/** Where each rotation spot sits on the court before anyone moves. */
export const BASE_SPOT: Record<Pos, Pt> = {
  4: { x: 1 / 6, y: 0.2 },
  3: { x: 1 / 2, y: 0.2 },
  2: { x: 5 / 6, y: 0.2 },
  5: { x: 1 / 6, y: 0.74 },
  6: { x: 1 / 2, y: 0.74 },
  1: { x: 5 / 6, y: 0.74 },
}

export interface Seat {
  role: Role
  pos: Pos
}

/**
 * Who is in which rotation spot. Each rotation moves everyone one spot clockwise
 * (4→3→2→1→6→5→4), which is one step backwards along SEQ.
 * Rotation 1 = setter in position 4, then 3, 2 (front row), 1, 6, 5 (back row).
 */
export function seatsForRotation(rotation: number, lineup: Role[] = LINEUP): Seat[] {
  const shift = rotation - 1
  const n = SEQ.length
  return lineup.map((role, i) => ({ role, pos: SEQ[(((i - shift) % n) + n) % n] }))
}

export function describeRotation(rotation: number): { where: string; backRow: boolean } {
  const setters = seatsForRotation(rotation).filter((s) => s.role.isSetter)
  return {
    where: setters.map((s) => `${s.role.label} in position ${s.pos}`).join(' and '),
    backRow: setters.some((s) => !isFrontRow(s.pos)),
  }
}

export const backRowSetterRotation = (rotation: number): boolean => describeRotation(rotation).backRow
