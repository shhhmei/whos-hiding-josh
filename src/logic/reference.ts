import { BASE_SPOT, isFrontRow } from './lineup'
import type { Seat } from './lineup'
import type { Pos, Pt } from './types'

type ByPos = Record<Pos, Pt>

const P = (x: number, y: number): Pt => ({ x, y })

export interface RefOption {
  name: string
  blurb: string
  /** The team's favourite way to do it. Shown with a star. */
  preferred?: boolean
  /** Where each ROTATION SPOT's player stands when the ball is served. */
  at: ByPos
}

/**
 * Hand-picked legal formations, keyed by rotation number (1-6 = setter in position 4,3,2,1,6,5).
 * Back-row-setter rotations (4, 5, 6) must also hide the setter; logic.test.ts checks every
 * entry against the same validator the practice page uses.
 */
export const REFERENCE: Record<number, RefOption[]> = {
  1: [
    {
      name: 'Stay in your spots',
      blurb: 'Front-row setter, so there is nothing to hide. Standing in your rotation spots is always legal.',
      at: BASE_SPOT,
    },
    {
      name: 'Setter slides toward the target',
      blurb: 'The front row shifts right so the setter starts closer to where they will set from.',
      at: { 4: P(0.46, 0.14), 3: P(0.72, 0.14), 2: P(0.93, 0.14), 5: P(0.2, 0.72), 6: P(0.5, 0.74), 1: P(0.8, 0.72) },
    },
  ],
  2: [
    {
      name: 'Stay in your spots',
      blurb: 'Front-row setter, so there is nothing to hide. Standing in your rotation spots is always legal.',
      at: BASE_SPOT,
    },
    {
      name: 'Setter slides toward the target',
      blurb: 'The player in position 2 slides out wide so the setter can start further right.',
      at: { 4: P(0.16, 0.14), 3: P(0.66, 0.14), 2: P(0.92, 0.14), 5: P(0.2, 0.72), 6: P(0.5, 0.74), 1: P(0.8, 0.72) },
    },
  ],
  3: [
    {
      name: 'Stay in your spots',
      blurb: 'The setter already starts at the right side of the net, so there is nothing to hide or fix.',
      at: BASE_SPOT,
    },
  ],
  4: [
    {
      name: 'Tuck behind the front-right hitter',
      blurb:
        'The position 2 hitter stays at the net and the setter stands just behind them on the sideline, ready to slip out to the target.',
      at: { 4: P(0.12, 0.45), 3: P(0.48, 0.16), 2: P(0.8, 0.14), 5: P(0.34, 0.72), 6: P(0.62, 0.74), 1: P(0.92, 0.32) },
    },
    {
      name: 'Front-right hitter drops back',
      blurb:
        'The position 2 hitter steps back into the passing line, and the setter hides in the corner behind them (still behind position 2, so still legal).',
      at: { 4: P(0.06, 0.22), 3: P(0.5, 0.22), 2: P(0.76, 0.62), 5: P(0.22, 0.72), 6: P(0.49, 0.7), 1: P(0.93, 0.84) },
    },
  ],
  5: [
    {
      name: 'Tuck beside the position 1 passer',
      blurb:
        'Position 1 shoves out to the right sideline, which lets the setter (position 6) stand just inside them, screened from the net.',
      at: { 4: P(0.14, 0.4), 3: P(0.5, 0.16), 2: P(0.78, 0.16), 5: P(0.36, 0.74), 6: P(0.84, 0.78), 1: P(0.95, 0.62) },
    },
    {
      name: 'Step up beside the front-right hitter',
      blurb:
        'Position 1 drops deep in the corner and the setter steps up the right side, right next to the position 2 hitter.',
      at: { 4: P(0.14, 0.4), 3: P(0.5, 0.16), 2: P(0.72, 0.18), 5: P(0.3, 0.72), 6: P(0.84, 0.46), 1: P(0.95, 0.82) },
    },
    {
      name: 'Stack behind the opposite',
      preferred: true,
      blurb:
        'The setter (position 6) stands directly behind the position 3 player, who slides right toward the target with the position 2 hitter out wide. They start stacked, so the setter is screened without needing a sideline.',
      at: { 4: P(0.14, 0.4), 3: P(0.72, 0.14), 2: P(0.92, 0.14), 5: P(0.3, 0.74), 6: P(0.72, 0.36), 1: P(0.94, 0.6) },
    },
  ],
  6: [
    {
      name: 'Tuck behind the front-left hitter',
      blurb:
        'The setter (position 5) hides on the left sideline directly behind the position 4 hitter, who stays up at the net.',
      at: { 4: P(0.14, 0.16), 3: P(0.48, 0.16), 2: P(0.82, 0.16), 5: P(0.08, 0.4), 6: P(0.4, 0.72), 1: P(0.78, 0.72) },
    },
    {
      name: 'Hide deep in the left corner',
      blurb: 'The setter drops into the left corner and the position 4 hitter stands between them and the net.',
      at: { 4: P(0.16, 0.4), 3: P(0.5, 0.16), 2: P(0.84, 0.16), 5: P(0.06, 0.78), 6: P(0.4, 0.72), 1: P(0.8, 0.76) },
    },
  ],
}

/** Which REFERENCE entry goes with the setter starting in each position. */
const ROTATION_FOR_SETTER_POS: Record<Pos, number> = { 4: 1, 3: 2, 2: 3, 1: 4, 6: 5, 5: 6 }

/**
 * Reference formations for any lineup. The formations only depend on which spot the setter is in,
 * so this works for a 6-2 too: it follows the setter who is in the back row.
 */
export function referenceForSeats(seats: Seat[]): RefOption[] {
  const setters = seats.filter((s) => s.role.isSetter)
  const lead = setters.find((s) => !isFrontRow(s.pos)) ?? setters[0]
  return REFERENCE[ROTATION_FOR_SETTER_POS[lead.pos]]
}

/** Placement keyed by role id, ready to drop onto the practice court. */
export function placementFromOption(seats: Seat[], option: RefOption): Record<string, Pt> {
  return Object.fromEntries(seats.map((s) => [s.role.id, { ...option.at[s.pos] }]))
}
