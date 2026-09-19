# How this constellation was made

KEEP-only. Not Odyssey. Copy of the method so anyone can recook a world without guessing.

## The product

One void. Star Core in the middle. Five worlds hung in space.

- **Zoom in** → Star Core goes cinematic.
- **Zoom out** → planets as circular plates with void between them.
- **No collage.** No grid. No rectangles.
- Imagine videos **face the camera** (billboard). A small twist / parallax crawl is allowed so they do not read as flat cards.

Code:

| Piece | File |
|-------|------|
| Map, pinch, twist, Core/Map | `src/components/constellation/ConstellationMap.tsx` |
| Void stars | `src/components/constellation/Starfield.tsx` |
| World positions + video URLs | `src/lib/constellation/world.ts` |
| Camera / yaw-pitch | `src/lib/constellation/camera.ts` |
| Sphere impostor (the round mask) | `src/lib/constellation/impostor.ts` |
| Law | `LAW.md` |

## Why a planet looks round

The Imagine plate is a **square video**. The app draws it with a WebGL **sphere impostor**:

1. Sample the plate.
2. Cut a **geometric disc** (`source` radius). Interior stays opaque — including the night side.
3. **Never luma-key the body.** Keying dark pixels punches a hole in the terminator and breaks the circle.
4. Fake volume with an orthographic `z = sqrt(1 − r²)` and a tiny parallax crawl. One sample only — never stamp a second disc (that nested-globe bug).

Canyon `source` sits **inside** the painted globe so a leftover halo cannot show as a crescent on the rim.

Star Core still uses a **soft luma corona** (it is a star, not a hard limb).

## Law 0 — how a planet film is cooked

**Always** first frame **and** last frame. Copied from Odyssey’s hook. This repo does **not** touch `boltverse-odyssey`.

```
still  →  last still (~20° yaw of the SAME body)
       →  Imagine video  (image + last_frame, locked tripod)
       →  lock_globe     (constant radius + center)
       →  RIFE 4×        (optical-flow slow-mo, same fps)
       →  ping-pong      (forward + reverse = seamless loop)
       →  public/videos/<id>.mp4
```

Cooker: `scripts/imagine-planet-hooks.mjs`

```bash
export XAI_API_KEY=...
# optional
export RIFE_ROOT=/tmp/Practical-RIFE

node scripts/imagine-planet-hooks.mjs canyon    # one world
node scripts/imagine-planet-hooks.mjs --force canyon
node scripts/imagine-planet-hooks.mjs           # all six
```

| Kind | Worlds | First | Last | Motion |
|------|--------|-------|------|--------|
| **spin** | Tide, Canyon, Crystal, Hollow, Drift | globe still | **distinct** still, small yaw | slow axis turn |
| **breath** | Star Core | core still | **same** still | corona pulse, no rotation |

If first = last on a planet, Imagine holds still. Spin **must** be two different stills of the **same** globe.

Prompt (every time): camera is a locked tripod, full disc always visible, black void around the limb, no morph, no size change, **one body only**, only a slow rotation on its axis.

API: `POST /videos/generations` with `image` + `last_frame` (not chat Imagine, not single-still `image_to_video`).

Kitchen leftovers: `public/videos/_spin/` (gitignored).

## lock_globe — stop Imagine zoom

Imagine sometimes dollies. `scripts/lock_globe.py` finds the disc (lit centroid + body radius), then affine-warps every frame to a **fixed radius and center**.

The fade window lives in the **far void** (`1.26×`–`1.48×` radius). It must never stamp a crescent on the limb.

Last still is size-matched to the first still **before** the video call. Reject a last still that is a close-up. Recook if radius spread > 12%.

```bash
python3 scripts/lock_globe.py --video in.mp4 --output locked.mp4
python3 scripts/lock_globe.py --measure --video locked.mp4 --output -
python3 scripts/lock_globe.py --still last.jpg --match-to first.jpg --output last-matched.jpg
```

## RIFE — what it actually does

RIFE does **not** generate a new planet. It **inserts frames** between the ones Imagine already made.

- Model: Practical-RIFE **4.26** (`IFNet_HDv3`, `train_log/flownet.pkl`)
- Wrapper: `scripts/rife_slow.py`
- `--multi 4 --fps 24` → 10 s / 24 fps Imagine clip becomes ~40 s at the **same** 24 fps (4× more frames, same shutter speed)
- Optical flow: each in-between is a warp along the rotation, not a duplicated freeze-frame (`setpts` was the old cheat; it looked like a slideshow)

Then **ping-pong**: play forward, then reverse, concat. The last frame meets the first. Loop is ~80 s for a 10 s source.

```bash
export RIFE_ROOT=/tmp/Practical-RIFE   # clone hzwer/Practical-RIFE + weights here
python3 scripts/rife_slow.py --video locked.mp4 --output rife-raw.mp4 --multi 4 --fps 24
```

Install once:

```bash
git clone --depth 1 https://github.com/hzwer/Practical-RIFE /tmp/Practical-RIFE
# put official 4.26 weights in /tmp/Practical-RIFE/train_log/flownet.pkl
pip install torch opencv-python numpy
```

Weights are **not** in this repo.

## Order matters

```
Imagine clip
    → lock_globe     (kill dolly / size jump FIRST)
    → RIFE 4×        (slow the clean turn)
    → ping-pong
```

RIFE on an unlocked clip **amplifies** zoom. Lock first.

## Live plates

`public/videos/` — `core`, `tide`, `canyon`, `crystal`, `hollow`, `drift` (`.mp4` + `.jpg` poster). Cache-bust in `world.ts` (`?v=…`) when a file is replaced so mobile browsers do not keep the old loop.

## Do not

- Touch `boltverse-odyssey`, Pack, biome/master, or other Odyssey files.
- Cook a spin with only one still.
- Luma-key the interior of a planet disc.
- Mix a second disc on top of the first (nested globe).
- Turn the sky into a photo wall.
