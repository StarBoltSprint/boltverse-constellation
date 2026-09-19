# Boltverse Constellation — SPACE LOD KEEP

Public KEEP of the **Star Map**. One continuous void. Star Core at the center. Worlds hung in space.

**This is not Odyssey. Do not merge this into `boltverse-odyssey`, Pack, biome/master, or any other Odyssey files.**

## Start here

- **Fresh Grok / new chat:** read [`GROK.md`](GROK.md) first. Product, Law 0 cook, impostor, LOD, Samsung bugs already paid for.
- Law: [`LAW.md`](LAW.md)
- Cook + RIFE + lock_globe + LOD plates: [`METHOD.md`](METHOD.md)

## What it is

- **Zoom in** — Star Core goes cinematic / fullscreen (Imagine loop).
- **Zoom out** — constellation of worlds in the void, with gaps between them.
- **No collage** — no grid, no tiles, no rectangles.
- **Billboard twist OK** — Imagine videos face the camera; twist/parallax crawl is allowed so the plate does not read as a flat card.
- **Canyon rocket zoom** — pinch past the round globe (it **stays round**) → one fade into aerial canyon → later oblique flyover. Imagine plates only. No camera cut.

Worlds: **Star Core · Tide · Canyon · Crystal · Hollow · Drift**

## Run

```bash
npm install
npm run dev
```

App listens on port 8080. Pinch · twist · drag. **Core** flies to the star. **Map** pulls back to the constellation. Lands straight on the map (no play gate).

## Recook a world

```bash
export XAI_API_KEY=...
export RIFE_ROOT=/tmp/Practical-RIFE
node scripts/imagine-planet-hooks.mjs canyon
```

Pipeline: first+last still → Imagine `image` + `last_frame` → lock globe → RIFE 4× → ping-pong.

Do **not** recook `canyon.mp4` / `canyon-lod1.mp4` unless the player asks. Oval / vanish / pinch bugs are draw bugs, not film bugs.

## Repo

**https://github.com/StarBoltSprint/boltverse-constellation**

Public. KEEP-only. Powered by xAI Imagine + StarBoltSprint.
