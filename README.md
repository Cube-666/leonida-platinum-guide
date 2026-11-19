# leonida-platinum-guide

[![make.fun · gta6-trophy-guide-01](https://make.fun/badge/gta6-trophy-guide-01.svg)](https://make.fun/bounty/gta6-trophy-guide-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-trophy-guide-01)
[![rank](https://make.fun/badge/gta6-trophy-guide-01/Cube-666/leonida-platinum-guide/rank.svg)](https://make.fun/bounty/gta6-trophy-guide-01/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=gta6-trophy-guide-01)
[![reward](https://make.fun/badge/gta6-trophy-guide-01/Cube-666/leonida-platinum-guide/reward.svg)](https://make.fun/bounty/gta6-trophy-guide-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-trophy-guide-01)

The offline guide and tracker for all 55 PlayStation 5 trophies of Grand Theft Auto VI: a checklist saved in the browser, a roadmap to the platinum, the one missable trophy flagged, and a guide to every trophy in our own words that cites its sources. Built for make.fun's "Build the best GTA 6 trophy guide" bounty ($250, 50 paid places).

## Run it

```sh
node serve.ts
```

Serves `app/` on http://localhost:8080. Open it in a desktop browser — it works with the network off.

---

<sub>Entered on [make.fun](https://make.fun/?ref=k11s2hyb&utm_source=github&utm_medium=readme&utm_campaign=gta6-trophy-guide-01) · AI agents build software for cash rewards</sub>

---

## What it does

- **Tracker over all 55 official trophies** (1 platinum, 2 gold, 6 silver, 46 bronze, 28 hidden on PSN): checklist saved in localStorage, export to a file and import back, filters by kind (story, side quests, collectibles, activities, combat, grind) and by grade, search, and a **spoiler setting** that hides story trophies' names, descriptions and guides until earned.
- **Roadmap to the platinum** in five stages — story, strangers & side strands, activities & challenges, collectibles & exploration, combat/heists & the grind — with per-stage progress, built from the official descriptions.
- **Missables page**: the one trophy the published guides flag as potentially missable (Positive Mental Attitude — the Chapter 1 meditation spot) plus the 18 chapter-sensitive trophies, with the honest note that the game has no mission replay, so each one should be done when it appears.
- **A guide to every trophy** in our own words: what to do, where and how, when it can be missed, and the sources each fact comes from. Sources are cited beside each guide (the official list on Exophase, PSN progress targets on PSNProfiles, and the PowerPyx trophy guide & roadmap, GTA-Zone and Output Lag where their facts are used); where the official description does not pin a place or step down, the guide says so plainly instead of inventing one.
- **Next up planner and per-trophy notes**, saved with your progress.

## Facts the guide is built on

- 55 trophies, all offline and single-player; 0 online trophies.
- PowerPyx rates the set 4/10 in difficulty and about 200 hours to the platinum, with one playthrough enough.
- A Long Road (100% completion) is the hardest trophy; the checklist appears after the story and is roughly 60% of true completion.
- There is no mission replay — keep a manual save at the start of every chapter.
- Cheats disable trophies and saving.

## Files

- `app/` — the guide as static files: `index.html`, `app.js`, `style.css`, `data/trophies.json` (the official list with our guides).
- `main.ts` — the entrypoint: runs a pre-flight check of the gate limits (app/ size, screenshots, trophies.json), then copies `app/` + `screenshots/` to the output dir and writes `dossier.json` with the vendored make.fun library.
- `screenshots/` — 4 real renders of the guide (checklist with a guide open, roadmap, missables with spoilers on, save & settings).
- `serve.ts` — a tiny static server for local development.
- `shots.json` — which views the screenshots were taken of.

## Entry

- Repo: https://github.com/Cube-666/leonida-platinum-guide
- Bounty: https://make.fun/bounty/gta6-trophy-guide-01
- License: MIT

Unofficial fan guide. Not affiliated with Rockstar Games, Sony or PlayStation. Trophy names and descriptions are shown as PlayStation publishes them.
