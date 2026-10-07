import { describe, expect, it } from 'vitest'
import { BASE_SPOT, ROTATIONS, backRowSetterRotation, seatsForRotation } from './lineup'
import { REFERENCE } from './reference'
import { RULES, evaluate } from './rules'
import type { Pos, Pt } from './types'
import { playersFromByPos } from './view'

const roleAt = (rotation: number) =>
  Object.fromEntries(seatsForRotation(rotation).map((s) => [s.pos, s.role.id])) as Record<Pos, string>

describe('rotations', () => {
  it('matches the screenshot (rotations 1-3, front row left→right = 4,3,2, back row = 5,6,1)', () => {
    expect(roleAt(1)).toEqual({ 4: 'S', 3: 'M2', 2: 'OH2', 5: 'OH1', 6: 'M1', 1: 'OP' })
    expect(roleAt(2)).toEqual({ 4: 'OH1', 3: 'S', 2: 'M2', 5: 'M1', 6: 'OP', 1: 'OH2' })
    expect(roleAt(3)).toEqual({ 4: 'M1', 3: 'OH1', 2: 'S', 5: 'OP', 6: 'OH2', 1: 'M2' })
  })

  it('puts the setter in position 4,3,2,1,6,5 for rotations 1-6', () => {
    const setterPos = ROTATIONS.map((r) => seatsForRotation(r).find((s) => s.role.isSetter)!.pos)
    expect(setterPos).toEqual([4, 3, 2, 1, 6, 5])
  })

  it('flags rotations 4-6 as back-row setter', () => {
    expect(ROTATIONS.filter(backRowSetterRotation)).toEqual([4, 5, 6])
  })
})

describe('overlap rules', () => {
  it('has seven comparisons', () => {
    expect(RULES).toHaveLength(7)
  })

  it('every rotation is legal when everyone stays in their spots', () => {
    for (const r of ROTATIONS) {
      const ev = evaluate(playersFromByPos(seatsForRotation(r), BASE_SPOT))
      expect(ev.legal, `rotation ${r}`).toBe(true)
    }
  })

  it('the starting spots do NOT hide a back-row setter (so there is something to solve)', () => {
    for (const r of [4, 5, 6]) {
      const ev = evaluate(playersFromByPos(seatsForRotation(r), BASE_SPOT))
      expect(ev.hidden, `rotation ${r}`).toBe(false)
    }
  })

  it('catches a depth fault and a side fault', () => {
    const bad: Record<Pos, Pt> = {
      4: { x: 0.14, y: 0.3 },
      3: { x: 0.5, y: 0.62 }, // behind position 6
      2: { x: 0.8, y: 0.2 },
      5: { x: 0.5, y: 0.76 }, // right of position 6
      6: { x: 0.36, y: 0.58 },
      1: { x: 0.9, y: 0.8 },
    }
    const ev = evaluate(playersFromByPos(seatsForRotation(4), bad))
    const broken = ev.rules.filter((r) => !r.ok).map((r) => `${r.rule.kind}:${r.rule.a}-${r.rule.b}`)
    expect(broken.sort()).toEqual(['depth:3-6', 'side:5-6'])
  })

  it('treats near-ties as overlaps', () => {
    const tie: Record<Pos, Pt> = { ...BASE_SPOT, 4: { x: 1 / 6, y: 0.74 } } // level with position 5
    const ev = evaluate(playersFromByPos(seatsForRotation(1), tie))
    expect(ev.legal).toBe(false)
  })
})

describe('reference formations', () => {
  for (const r of ROTATIONS) {
    it(`rotation ${r}: every option is legal and hides a back-row setter`, () => {
      expect(REFERENCE[r].length).toBeGreaterThan(0)
      for (const opt of REFERENCE[r]) {
        const ev = evaluate(playersFromByPos(seatsForRotation(r), opt.at))
        expect(ev.legal, `${opt.name}: ${JSON.stringify(ev.rules.filter((x) => !x.ok))}`).toBe(true)
        expect(ev.hidden, `${opt.name}: ${JSON.stringify(ev.hide)}`).toBe(true)
        expect(ev.success).toBe(true)
      }
    })
  }
})
