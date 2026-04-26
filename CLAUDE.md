# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev       # Dev server at http://localhost:5173
npm run build     # Production build
npm run preview   # Preview production build locally
```

No test suite is configured.

## Architecture

**Stack:** React 18 + Vite, plain JavaScript (no TypeScript). Deployed to GitHub Pages via CNAME.

### Screen State Machine

`App.jsx` owns a `screen` string that drives which component renders:

```
PORTAL → DUNGEON_MAP → COMBAT → FLOOR_RESULTS / DUNGEON_RESULTS
```

All screen transitions and inter-component callbacks flow through `App.jsx`. Components receive only props — no shared context or global store.

### Hunter State (`src/hooks/useHunter.js`)

All player progress lives here and is persisted to `localStorage` under key `sl_hunter`. Key fields:

- `xp`, `rank`, `rankIndex` — computed from XP thresholds (`XP_THRESHOLDS = [0, 300, 800, 1800, 3500, 6000, 10000, 16000]`)
- `completedFloors` — `{ [dungeonId]: number[] }` (floor indices)
- `completedDungeons` — `string[]` (dungeon IDs)
- `totalCorrect`, `totalAnswered` — accuracy tracking

### Dungeon Data (`public/dungeons/`)

Dungeons are static JSON files fetched at runtime using `import.meta.env.BASE_URL`:

- `index.json` — array of dungeon IDs (e.g. `["moo1"]`)
- `{id}.json` — dungeon definition

Dungeon schema:
```json
{
  "id": "string",
  "title": "string",
  "description": "string",
  "rank": "E|D|C|B|A|S|SS|SSS",
  "floors": [{
    "title": "string",
    "isBoss": true,
    "mobs": [{
      "concept": "string",
      "lore": "string",
      "questions": [{
        "prompt": "string",
        "choices": ["string"],
        "answer": 0,
        "explanation": "string"
      }]
    }]
  }]
}
```

To add a new dungeon: create `public/dungeons/{id}.json` and append its `id` to `public/dungeons/index.json`.

### Combat XP Rules (`src/components/CombatScreen.jsx`)

- Correct answer: `BASE_XP = 60`
- Correct with streak ≥ 2: `STREAK_XP = 90` ("ARISE" bonus)
- Wrong answer: `-HP_LOSS = 20` HP (HP starts at 100, floor completes regardless of HP reaching 0)
