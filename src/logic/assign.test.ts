import { describe, expect, it } from 'vitest'
import { assignLineup, canPickAs, positionsFor, seededRandom, slotsFor } from './assign'
import { LINEUP, LINEUP_62 } from './lineup'
import { ROSTER } from './roster'

const systems = { '5-1': LINEUP, '6-2': LINEUP_62 }

describe('roster filling', () => {
  for (const [name, lineup] of Object.entries(systems)) {
    it(`${name}: every offered (person, position) gives a valid lineup`, () => {
      for (const person of ROSTER) {
        for (const position of positionsFor(person, lineup)) {
          for (let seed = 1; seed <= 5; seed++) {
            const a = assignLineup(lineup, ROSTER, { personId: person.id, position }, seededRandom(seed))
            expect(a, `${person.name} as ${position}`).not.toBeNull()
            const out = a!
            const ids = lineup.map((r) => out.byRole[r.id].id)
            expect(new Set(ids).size).toBe(lineup.length)
            for (const r of lineup) expect(out.byRole[r.id].positions).toContain(r.position)
            expect(out.byRole[out.youRoleId].id).toBe(person.id)
            expect(canPickAs(person, lineup.find((r) => r.id === out.youRoleId)!, position)).toBe(true)
            expect(out.bench).toHaveLength(ROSTER.length - lineup.length)
          }
        }
      }
    })
  }

  it('is deterministic per seed and varies across seeds', () => {
    const pick = { personId: 'ethan', position: 'Outside' as const }
    const key = (seed: number) => {
      const a = assignLineup(LINEUP, ROSTER, pick, seededRandom(seed))!
      return LINEUP.map((r) => a.byRole[r.id].id).join(',')
    }
    expect(key(7)).toBe(key(7))
    expect(new Set([1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(key)).size).toBeGreaterThan(1)
  })

  it('respects a pinned slot', () => {
    for (let seed = 1; seed <= 10; seed++) {
      const a = assignLineup(LINEUP, ROSTER, { personId: 'isaac', position: 'Outside', slot: 'OH2' }, seededRandom(seed))!
      expect(a.youRoleId).toBe('OH2')
    }
    expect(slotsFor(LINEUP, 'Outside').map((r) => r.id)).toEqual(['OH1', 'OH2'])
  })

  it('6-2 setters are exactly Cynthia and Josh Mei', () => {
    for (let seed = 1; seed <= 10; seed++) {
      const a = assignLineup(LINEUP_62, ROSTER, { personId: 'ethan', position: 'Outside' }, seededRandom(seed))!
      const setters = LINEUP_62.filter((r) => r.isSetter).map((r) => a.byRole[r.id].id)
      expect(setters.sort()).toEqual(['cynthia', 'josh-mei'])
    }
  })

  it('offers positions sensibly', () => {
    const joshMei = ROSTER.find((p) => p.id === 'josh-mei')!
    expect(positionsFor(joshMei, LINEUP)).toEqual(['Setter', 'Oppo'])
    expect(positionsFor(joshMei, LINEUP_62)).toEqual(['Setter', 'Oppo'])
    const jeremiah = ROSTER.find((p) => p.id === 'jeremiah')!
    expect(positionsFor(jeremiah, LINEUP_62)).toEqual(['Middle'])
  })

  it('returns null for an ineligible pick', () => {
    expect(assignLineup(LINEUP, ROSTER, { personId: 'ethan', position: 'Setter' }, seededRandom(1))).toBeNull()
  })

  it('6-2: Josh Mei as Oppo takes a setter slot and Cynthia is the other setter', () => {
    for (let seed = 1; seed <= 10; seed++) {
      const a = assignLineup(LINEUP_62, ROSTER, { personId: 'josh-mei', position: 'Oppo' }, seededRandom(seed))!
      expect(['S1', 'S2']).toContain(a.youRoleId)
      const other = a.youRoleId === 'S1' ? 'S2' : 'S1'
      expect(a.byRole[other].id).toBe('cynthia')
    }
  })
})
