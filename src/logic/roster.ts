import type { PositionType } from './types'

export interface Person {
  id: string
  /** Full name, for the dropdown and the lineup table. */
  name: string
  /** What shows on the court (first names clash, so the two Joshes get an initial). */
  short: string
  /** Everything they can play. */
  positions: PositionType[]
}

export const POSITION_TYPES: PositionType[] = ['Setter', 'Outside', 'Middle', 'Oppo']

/** The team. Edit this list to add people or change who can play what. */
export const ROSTER: Person[] = [
  { id: 'ethan', name: 'Ethan Chiu', short: 'Ethan', positions: ['Outside'] },
  { id: 'priya', name: 'Priya Parameswaran', short: 'Priya', positions: ['Outside'] },
  { id: 'jeremiah', name: 'Jeremiah Lee', short: 'Jeremiah', positions: ['Middle', 'Oppo'] },
  { id: 'cynthia', name: 'Cynthia Mahoney', short: 'Cynthia', positions: ['Setter'] },
  { id: 'josh-john', name: 'Josh John', short: 'Josh J.', positions: ['Middle'] },
  { id: 'isaac', name: 'Isaac Butterfield', short: 'Isaac', positions: ['Middle', 'Outside'] },
  { id: 'alexis', name: 'Alexis', short: 'Alexis', positions: ['Outside', 'Oppo'] },
  { id: 'josh-mei', name: 'Josh Mei', short: 'Josh M.', positions: ['Setter', 'Oppo'] },
]
