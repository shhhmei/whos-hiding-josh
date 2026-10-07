import { ROSTER } from '../logic/roster'
import type { PickApi } from '../logic/pick'

/** Name / position / slot dropdowns plus shuffle and clear. State lives in usePick. */
export default function PlayAs({ pick }: { pick: PickApi }) {
  const { person, positions, chosen, slots, chosenSlot, assignment } = pick
  return (
    <>
      <div className="form-grid">
        <label className="field">
          Who are you?
          <select value={pick.state.personId} onChange={(e) => pick.set({ personId: e.target.value, position: '' })}>
            <option value="">Choose your name…</option>
            {ROSTER.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </label>

        <label className="field">
          Position you're playing
          <select value={chosen ?? ''} disabled={!person} onChange={(e) => pick.set({ position: e.target.value })}>
            <option value="">{person ? 'Choose a position…' : 'Pick your name first'}</option>
            {positions.map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </select>
        </label>

        {slots.length > 1 && (
          <label className="field">
            Which one?
            <select value={chosenSlot} onChange={(e) => pick.set({ slot: e.target.value })}>
              <option value="any">Either (random)</option>
              {slots.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.label} ({s.title.toLowerCase()})
                </option>
              ))}
            </select>
          </label>
        )}
      </div>

      <div className="actions">
        <button className="btn" disabled={!assignment} onClick={pick.shuffle}>
          Shuffle teammates 🎲
        </button>
        <button className="btn" disabled={!person} onClick={pick.clear}>
          Clear
        </button>
      </div>

      {person && chosen && !assignment && (
        <p className="banner bad" role="status">
          <b>No lineup works with that choice.</b>
          <span>
            With the current roster there is nobody who can fill every other slot. Try a different position or system.
          </span>
        </p>
      )}
    </>
  )
}
