# Who's hiding Josh (and Cynthia)

A small app for learning volleyball serve-receive rotations from first principles.

1. **Rules** (3 static pages): the court and rotation, the overlap rules, and what it means to hide the setter.
2. **Practice**: you get one of the six rotations, drag the players into a legal serve-receive formation, and (when the setter is in the back row) hide the setter. The app checks the overlap rules, explains what's broken, and can show alternative formations.

Vite + React + TypeScript. No backend or database: everything is hard-coded and runs in the browser.

## Run it

```bash
npm install
npm run dev      # http://localhost:5173
npm test         # rules + reference-formation checks
npm run build    # type-check + production build into dist/
```

## Where things live

| File | What it does |
| --- | --- |
| `src/logic/lineup.ts` | **Start here for naming changes.** `LINEUP` is the roles in serving order (labels, `isSetter`). Also the rotation math (`seatsForRotation`) and the six base spots. |
| `src/logic/rules.ts` | The seven overlap comparisons (`RULES`), the "hidden" check (`HIDE` thresholds), and `evaluate()`. |
| `src/logic/reference.ts` | Hard-coded "ways to do it" per rotation, in court coordinates. |
| `src/logic/logic.test.ts` | Checks the rotation order, the rules, and that every reference formation is legal and hides the setter. |
| `src/components/Court.tsx` | The court: draggable tokens, rule lines, movement arrows, hide zones. |
| `src/pages/` | `Home`, `Rules` (3 steps), `SixTwo` (the 6-2 page), `Practice`. |

The 6-2 lineup (`LINEUP_62` in `lineup.ts`) is the same six spots with a second setter where the opposite would be. The hiding formations only depend on which spot the back-row setter is in, so the 6-2 page reuses the same `REFERENCE` entries via `referenceForSeats()`.

### Conventions

- Court coordinates: `x` 0 = left sideline → 1 = right sideline (facing the net), `y` 0 = the net → 1 = the end line.
- Rotations are numbered by where the setter starts: 1 → position 4, 2 → 3, 3 → 2 (front row), 4 → 1, 5 → 6, 6 → 5 (back row).
- Near-ties count as overlaps (`EPS` in `rules.ts`), so formations need a clear gap.
- "Hidden" = legal formation, and the setter is either **tucked** (inside a sideline strip, `HIDE.edge`, with a teammate within `HIDE.shieldWidth` sideways / `HIDE.shieldDepth` deep in front) or **stacked** (tightly right behind a teammate, within `HIDE.stackWidth` / `HIDE.stackDepth`). Change the numbers in `rules.ts` to taste. A reference option can be flagged `preferred: true` to show a star.

## Deploy (Vercel)

It's a standard Vite project: Vercel auto-detects it (build `npm run build`, output `dist`). `vercel.json` rewrites every path to `index.html` so deep links like `/rules/2` and `/practice` work.
