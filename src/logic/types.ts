/** Court positions, numbered the usual way: front row 4-3-2, back row 5-6-1 (left to right, facing the net). */
export type Pos = 1 | 2 | 3 | 4 | 5 | 6

/**
 * A point on our half of the court.
 * x: 0 = left sideline → 1 = right sideline (as the team faces the net)
 * y: 0 = the net → 1 = the end line
 */
export interface Pt {
  x: number
  y: number
}

export type Tone = 'setter' | 'front' | 'back'

/** The kinds of position a person can play. */
export type PositionType = 'Setter' | 'Outside' | 'Middle' | 'Oppo'

export interface Token {
  id: string
  label: string
  tone: Tone
  at: Pt
  /** Small second line under the label (e.g. the role under a player's name). */
  sub?: string
  /** Highlight this token as "you". */
  you?: boolean
}

export interface Arrow {
  from: Pt
  to: Pt
}

export interface LineMark {
  a: Pt
  b: Pt
  ok: boolean
}
