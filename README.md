# Boltverse Constellation — SPACE LOD KEEP

Public KEEP of the **Star Map**. One continuous void. Star Core at the center. Worlds hung in space.

**This is not Odyssey. Do not merge this into `boltverse-odyssey`, Pack, biome/master, or any other Odyssey files.**

## What it is

- **Zoom in** — Star Core goes cinematic / fullscreen (Imagine loop).
- **Zoom out** — constellation of worlds in the void, with gaps between them.
- **No collage** — no grid, no tiles, no rectangles.
- **Billboard twist OK** — Imagine videos face the camera; twist/parallax crawl is allowed so the plate does not read as a flat card.

Worlds: **Star Core · Tide · Canyon · Crystal · Hollow · Drift**

Law of this KEEP: [`LAW.md`](LAW.md)

## Run

```bash
npm install
npm run dev
```

App listens on port 8080. Pinch · twist · drag. **Core** flies to the star. **Map** pulls back to the constellation.

## Imagine loops — Law 0

Cinematic plates live in `public/videos/` (`core`, `tide`, `canyon`, `crystal`, `hollow`, `drift` + posters). They are the albedo of each world — radial orbs / sphere impostors, never a tiled collage.

**Always** cook with first frame **and** last frame. Prompt is locked to: **no morph, no size change, only a slow rotation on its own axis.**

```bash
# needs XAI_API_KEY
node scripts/imagine-planet-hooks.mjs canyon
node scripts/imagine-planet-hooks.mjs          # all six
```

Spin worlds get a distinct last still (~20° yaw of the **same** body), then `image` + `last_frame` video, then 5× slow + ping-pong. Core is breath (first = last). Kitchen leftovers stay in `public/videos/_spin/` (gitignored).

## Repo

**https://github.com/StarBoltSprint/boltverse-constellation**

Public. KEEP-only. Powered by xAI Imagine + StarBoltSprint.
