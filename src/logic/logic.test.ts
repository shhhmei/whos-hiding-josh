import { describe, expect, it } from 'vitest'
import { BASE_SPOT, LINEUP_62, ROTATIONS, SEQ, backRowSetterRotation, isFrontRow, seatsForRotation } from './lineup'
import { REFERENCE, referenceForSeats } from './reference'
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

describe('stacking', () => {
  const seats = seatsForRotation(5)
  const stack = REFERENCE[5].find((o) => o.name === 'Stack behind the opposite')!

  it('rotation 5 has a preferred stack-behind-the-opposite option', () => {
    expect(stack).toBeDefined()
    expect(stack.preferred).toBe(true)
  })

  it('counts as hidden through the stack, not a sideline zone', () => {
    const ev = evaluate(playersFromByPos(seats, stack.at))
    expect(ev.legal).toBe(true)
    expect(ev.success).toBe(true)
    const [h] = ev.hide
    expect(h.setterId).toBe('S')
    expect(h.onSideline).toBe(false)
    expect(h.stackId).toBe('OP')
  })

  it('stops counting when the setter drifts too far behind', () => {
    const drifted = { ...stack.at, 6: { x: 0.72, y: 0.6 } } // 0.46 behind position 3
    const ev = evaluate(playersFromByPos(seats, drifted))
    expect(ev.hidden).toBe(false)
  })

  it('stops counting when the setter slides off to the side', () => {
    const slid = { ...stack.at, 6: { x: 0.55, y: 0.36 } } // 0.17 left of position 3
    const ev = evaluate(playersFromByPos(seats, slid))
    expect(ev.hidden).toBe(false)
  })
})

describe('6-2 lineup', () => {
  const seats62 = (r: number) => seatsForRotation(r, LINEUP_62)
  const setters = (r: number) => seats62(r).filter((s) => s.role.isSetter)

  it('puts the two setters three spots apart in the serving order', () => {
    for (const r of ROTATIONS) {
      const [a, b] = setters(r).map((s) => SEQ.indexOf(s.pos))
      expect(Math.abs(a - b), `rotation ${r}`).toBe(3)
    }
  })

  it('always has exactly one setter in the back row and one in the front row', () => {
    for (const r of ROTATIONS) {
      const rows = setters(r).map((s) => isFrontRow(s.pos))
      expect(rows.filter(Boolean), `rotation ${r}`).toHaveLength(1)
    }
  })

  it('has S2 setting in rotations 1-3 (positions 1, 6, 5) and S1 setting in rotations 4-6', () => {
    const backSetter = (r: number) => setters(r).find((s) => !isFrontRow(s.pos))!
    expect(ROTATIONS.map((r) => `${backSetter(r).role.id}@${backSetter(r).pos}`)).toEqual([
      'S2@1',
      'S2@6',
      'S2@5',
      'S1@1',
      'S1@6',
      'S1@5',
    ])
  })

  it('is legal in the starting spots, and not hidden until the setter moves', () => {
    for (const r of ROTATIONS) {
      const ev = evaluate(playersFromByPos(seats62(r), BASE_SPOT))
      expect(ev.legal, `rotation ${r}`).toBe(true)
      expect(ev.hidden, `rotation ${r}`).toBe(false)
    }
  })

  it('every reference formation hides whichever setter is in the back row', () => {
    for (const r of ROTATIONS) {
      const seats = seats62(r)
      for (const opt of referenceForSeats(seats)) {
        const ev = evaluate(playersFromByPos(seats, opt.at))
        expect(ev.success, `rotation ${r}: ${opt.name}`).toBe(true)
      }
    }
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
