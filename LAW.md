# SPACE LOD KEEP — LAW

This repository is the **KEEP** of the Star Map.

It is **not** Odyssey. It is **not** Pack. It is **not** biome/master.

## KEEP

1. One shared void. Star Core at the center.
2. **Zoom in** → Star Core fullscreen cinematic (Imagine loop).
3. **Zoom out** → constellation of planets as Imagine orbs, with **void gaps**.
4. **No collage.** No grid. No tile wall. No rectangles.
5. Worlds are circular / sphere-impostor plates. Billboard facing the camera is allowed.
6. Twist / parallax crawl is allowed so the player does not see a flat card.
7. Lightning threads may bind worlds. Focus banner names the world you are looking at.
8. Mobile-first: pinch, twist, drag. Core / Map gates.

## HARD BAN

- Do not open PRs, push, or edit **boltverse-odyssey**.
- Do not touch Pack, biome/master, or other Odyssey files from this KEEP.
- Do not turn the sky into a photo wall.

## Worlds (this KEEP)

| Id | Name | Epithet |
|----|------|---------|
| core | Star Core | heart of the universe |
| tide | Tide | ocean world |
| canyon | Canyon | scarred world |
| crystal | Crystal | dormant ice |
| hollow | Hollow | quiet vein |
| drift | Drift | ash world |

## Imagine films — Law 0 (from Odyssey, KEEP-only copy)

**ALWAYS** cook with the Odyssey hook: **first frame + last frame** (`scripts/imagine-planet-hooks.mjs` → API `image` + `last_frame`).

Never chat Imagine without `last_frame`. Never `image_to_video` on one still for a spin.

The prompt MUST say, every time:

- **CAMERA LOCKED** — tripod bolted. Never pans, tilts, zooms, dollies, pushes in, pulls out, or flys over the surface. Framing never changes.
- **FULL disc always visible** — black void around the limb. Never a close-up. Never terrain filling the frame.
- **NO morph**
- **NO change of size** (same pixel radius, first to last)
- **ONE body only** — never a second globe, never a nested planet, never a moon
- **ONLY a SLOW rotation** of the same body on its own axis (low yaw)

| Kind | First | Last | Motion |
|------|-------|------|--------|
| **spin** (Tide, Canyon, Crystal, Hollow, Drift) | world still | **distinct** still of the **same** body, small yaw (~15°) | rigid slow axial turn. **NO morph. NO size change. NO camera move. ONE body.** |
| **breath** (Star Core) | core still | **same** still | pulse / filament shimmer. Photosphere stays put. **Filaments stay in every frame. NO morph. NO size change. NO rotation.** |

If first = last on a planet, Imagine holds still (breath). Spin **must** be two different stills of the same globe.

Last still is size-matched to the first still before the video call (same disc radius — Imagine cannot interpolate a zoom). Reject last stills that are close-ups. Recook the clip if radius spread > 12%. After Imagine: **lock globe**, then **RIFE 4×**, then ping-pong. Recook max 2 if the body melts, grows, or becomes a second globe.

Full method (impostor disc, lock_globe, RIFE, recook commands): [`METHOD.md`](METHOD.md).

## Silhouette

Planets are a **geometric disc**. Do not luma-key the interior (that eats the night side and breaks the circle). Star Core may keep a soft corona.

