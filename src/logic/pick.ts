import { useCallback, useEffect, useMemo, useState } from 'react'
import { assignLineup, positionsFor, seededRandom, slotsFor } from './assign'
import { LINEUP, LINEUP_62 } from './lineup'
import { ROSTER } from './roster'

export type System = '5-1' | '6-2'

/** Who you are and where you play. Saved in the browser so it follows you between rotations and pages. */
export interface PickState {
  system: System
  personId: string
  position: string
  slot: string
  seed: number
}

const KEY = 'whj.pick.v1'
const newSeed = () => Math.floor(Math.random() * 2 ** 31)

function load(): PickState {
  const fresh: PickState = { system: '5-1', personId: '', position: '', slot: 'any', seed: newSeed() }
  try {
    const raw = JSON.parse(localStorage.getItem(KEY) ?? 'null')
    if (!raw || typeof raw !== 'object') return fresh
    return {
      system: raw.system === '6-2' ? '6-2' : '5-1',
      personId: ROSTER.some((p) => p.id === raw.personId) ? raw.personId : '',
      position: typeof raw.position === 'string' ? raw.position : '',
      slot: typeof raw.slot === 'string' ? raw.slot : 'any',
      seed: Number.isFinite(raw.seed) ? raw.seed : fresh.seed,
    }
  } catch {
    return fresh
  }
}

/**
 * The saved pick, plus everything derived from it for a lineup. `forceSystem` lets a page (Practice)
 * stay on one system while still sharing the same person, position and shuffle.
 */
export function usePick(forceSystem?: System) {
  const [state, setState] = useState<PickState>(load)

  useEffect(() => {
    try {
      localStorage.setItem(KEY, JSON.stringify(state))
    } catch {
      /* private mode etc.: the pick just won't survive a reload */
    }
  }, [state])

  const set = useCallback((patch: Partial<PickState>) => setState((s) => ({ ...s, ...patch })), [])
  const shuffle = useCallback(() => setState((s) => ({ ...s, seed: newSeed() })), [])
  const clear = useCallback(() => setState((s) => ({ ...s, personId: '', position: '', slot: 'any' })), [])

  const system = forceSystem ?? state.system
  const lineup = system === '6-2' ? LINEUP_62 : LINEUP

  // What you can pick depends on the person and the system, so work it out rather than storing it
  // (an old pick that no longer applies just falls away).
  const person = ROSTER.find((p) => p.id === state.personId)
  const positions = person ? positionsFor(person, lineup) : []
  const chosen = positions.find((p) => p === state.position) ?? (positions.length === 1 ? positions[0] : undefined)
  const slots = person && chosen ? slotsFor(lineup, chosen, person) : []
  const chosenSlot = slots.some((s) => s.id === state.slot) ? state.slot : 'any'

  const assignment = useMemo(
    () =>
      person && chosen
        ? assignLineup(
            lineup,
            ROSTER,
            { personId: person.id, position: chosen, slot: chosenSlot === 'any' ? undefined : chosenSlot },
            seededRandom(state.seed),
          )
        : null,
    [lineup, person, chosen, chosenSlot, state.seed],
  )

  return { state, set, shuffle, clear, system, lineup, person, positions, chosen, slots, chosenSlot, assignment }
}

export type PickApi = ReturnType<typeof usePick>
