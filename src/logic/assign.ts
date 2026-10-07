import type { Role } from './lineup'
import { POSITION_TYPES } from './roster'
import type { Person } from './roster'
import type { PositionType } from './types'

/** Small seeded random generator, so a lineup stays put across re-renders until you ask for a new one. */
export function seededRandom(seed: number): () => number {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

/**
 * Can this person take this slot when picked as `position`? Normally the slot's position must match.
 * In a 6-2 a setter-capable player can also be picked as 'Oppo': they take a setter slot and hit
 * (as the opposite) while the other setter sets from the back row.
 */
export function canPickAs(person: Person, role: Role, position: PositionType): boolean {
  if (!person.positions.includes(position)) return false
  if (role.position === position) return true
  return role.isSetter && !!role.pickAs?.includes(position) && person.positions.includes('Setter')
}

/** The positions this person can play that the lineup actually has a slot for. */
export function positionsFor(person: Person, lineup: Role[]): PositionType[] {
  return POSITION_TYPES.filter((pt) => lineup.some((r) => canPickAs(person, r, pt)))
}

/** The slots a position can fill (e.g. OH1 and OH2 for Outside). */
export function slotsFor(lineup: Role[], position: PositionType, person?: Person): Role[] {
  return lineup.filter((r) => (person ? canPickAs(person, r, position) : r.position === position))
}

export interface Assignment {
  /** Who plays each slot, keyed by role id. */
  byRole: Record<string, Person>
  /** The slot the user took. */
  youRoleId: string
  /** Roster members not in the lineup. */
  bench: Person[]
}

export interface Pick {
  personId: string
  position: PositionType
  /** Pin the user to one slot (e.g. 'OH2'). Omit to let it be either. */
  slot?: string
}

/**
 * Put the user in a slot for their chosen position, then fill every other slot with someone who can
 * play it. Every valid lineup is equally likely: we list them all (a few thousand at most) and pick one.
 * Returns null if no valid lineup exists.
 */
export function assignLineup(lineup: Role[], roster: Person[], pick: Pick, rng: () => number): Assignment | null {
  const you = roster.find((p) => p.id === pick.personId)
  if (!you || !you.positions.includes(pick.position)) return null

  const others = roster.filter((p) => p.id !== you.id)
  const found: { roleId: string; byRole: Record<string, Person> }[] = []

  for (const yourRole of lineup) {
    if (!canPickAs(you, yourRole, pick.position)) continue
    if (pick.slot && yourRole.id !== pick.slot) continue
    const rest = lineup.filter((r) => r !== yourRole)
    const used = new Set<string>()
    const acc: Record<string, Person> = { [yourRole.id]: you }

    const fill = (i: number) => {
      if (i === rest.length) {
        found.push({ roleId: yourRole.id, byRole: { ...acc } })
        return
      }
      for (const p of others) {
        if (used.has(p.id) || !p.positions.includes(rest[i].position)) continue
        used.add(p.id)
        acc[rest[i].id] = p
        fill(i + 1)
        delete acc[rest[i].id]
        used.delete(p.id)
      }
    }
    fill(0)
  }

  if (found.length === 0) return null
  const chosen = found[Math.floor(rng() * found.length)]
  const inLineup = new Set(Object.values(chosen.byRole).map((p) => p.id))
  return { byRole: chosen.byRole, youRoleId: chosen.roleId, bench: roster.filter((p) => !inLineup.has(p.id)) }
}
