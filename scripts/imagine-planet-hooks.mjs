#!/usr/bin/env node
// Constellation KEEP — Odyssey Law 0 (read-only): Imagine films = image + last_frame.
// ALWAYS pass first frame AND last frame. Copied API plumbing only. Does not touch boltverse-odyssey.
import { readFileSync, writeFileSync, existsSync, mkdirSync, copyFileSync } from "node:fs";
import { dirname, extname, join } from "node:path";
import { spawnSync } from "node:child_process";

const BASE = process.env.IMAGINE_BASE || "https://api.x.ai/v1";
const IMAGE_MODEL = process.env.IMAGINE_IMAGE_MODEL || "grok-imagine-image-2.0";
const VIDEO_MODEL = process.env.IMAGINE_VIDEO_MODEL || "grok-imagine-video-1.5";

/** Law 0 — every film, every time. */
const LAW = [
  "Photoreal square 1:1 plate, black void, ONE celestial body centered.",
  "Camera COMPLETELY LOCKED — never pan, tilt, zoom, or dolly.",
  "NO morph. NO melting. NO new continents. NO second body. NO text. NO UI.",
  "NO change of size. The body keeps the exact same pixel radius from first frame to last frame.",
  "ONLY a SLOW rotation of the SAME body on its own vertical axis. Low yaw. Not a fast spin.",
  "Silent plate.",
].join(" ");

export const PLANET_LAW = LAW;

const WORLDS = {
  tide: {
    kind: "spin",
    paint:
      "Blue ocean world with a thin bright ring. The globe rotates slowly on its vertical axis inside the ring. The ring stays in the same plane and does not tumble. Water stays water. Clouds drift with the rotation only. Same size the whole time.",
  },
  canyon: {
    kind: "spin",
    paint:
      "Rust-red scarred desert globe. The same canyons and highlands rotate slowly into view. Surface markings travel across the limb. No new mountains. Same size the whole time.",
  },
  crystal: {
    kind: "spin",
    paint:
      "The same ice-crystal body, rigid. Existing shards stay attached. The whole cluster rotates slowly as one solid around the vertical axis. Never becomes a smooth planet. Never grows new spikes. Never melts. Same size the whole time.",
  },
  hollow: {
    kind: "spin",
    paint:
      "Dark grey cratered moon. The same craters rotate slowly into view. No new impact features. No atmosphere bloom. Same size the whole time.",
  },
  drift: {
    kind: "spin",
    paint:
      "Ash-grey dusty globe. The same pale surface rotates slowly. Fine dust may catch light. No morph. No new oceans. Same size the whole time.",
  },
  core: {
    kind: "breath",
    paint:
      "Golden star photosphere. Completely stationary in place. Corona and plasma may pulse and breathe. Size of the star body never changes. NO morph into another shape. NO rotation.",
  },
};

function key() {
  const k = process.env.XAI_API_KEY;
  if (!k) throw new Error("XAI_API_KEY missing");
  return k;
}

function mime(p) {
  const e = extname(p).toLowerCase();
  if (e === ".png") return "image/png";
  if (e === ".webp") return "image/webp";
  if (e === ".mp4") return "video/mp4";
  return "image/jpeg";
}

function dataUri(path) {
  const b = readFileSync(path).toString("base64");
  return `data:${mime(path)};base64,${b}`;
}

async function api(path, body) {
  const res = await fetch(BASE + path, {
    method: "POST",
    headers: {
      Authorization: "Bearer " + key(),
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });
  const text = await res.text();
  let json = {};
  try {
    json = JSON.parse(text);
  } catch {
    json = { raw: text };
  }
  if (!res.ok) throw new Error("Imagine " + res.status + " " + path + " " + text.slice(0, 280));
  return json;
}

async function download(url, dest) {
  const r = await fetch(url);
  if (!r.ok) throw new Error("download " + r.status);
  mkdirSync(dirname(dest), { recursive: true });
  writeFileSync(dest, Buffer.from(await r.arrayBuffer()));
}

function ffmpeg(args) {
  const r = spawnSync("ffmpeg", args, { encoding: "utf8" });
  if (r.status !== 0) throw new Error((r.stderr || r.stdout || "ffmpeg failed").slice(0, 400));
}

function encodeStill(src, dest) {
  ffmpeg(["-y", "-i", src, "-vf", "scale=720:720:force_original_aspect_ratio=increase,crop=720:720", dest]);
}

function encodeClip(src, dest) {
  ffmpeg([
    "-y",
    "-i",
    src,
    "-vf",
    "scale=720:720:force_original_aspect_ratio=increase,crop=720:720",
    "-c:v",
    "libx264",
    "-pix_fmt",
    "yuv420p",
    "-an",
    "-movflags",
    "+faststart",
    dest,
  ]);
}

async function pollVideo(id) {
  for (let i = 0; i < 60; i++) {
    const res = await fetch(BASE + "/videos/" + id, {
      headers: { Authorization: "Bearer " + key() },
    });
    const j = await res.json();
    const st = j.status || j.state;
    const url = j.video?.url || j.url || j.data?.[0]?.url;
    if (url && (st === "done" || st === "completed" || !st)) return url;
    if (st === "failed" || st === "expired") throw new Error("video " + st);
    await new Promise((r) => setTimeout(r, 5000));
  }
  throw new Error("video poll timeout");
}

function spinLine(paint) {
  return [
    "First frame and last frame are already pinned by the API — do not redraw them.",
    "ONLY a SLOW rotation of the SAME body on its own vertical axis, from the first still to the last still.",
    "Low yaw. A gentle turn. Not a fast spin. Not a morph. Not a zoom.",
    "NO morph. NO change of size. NO silhouette scale change. Same pixel radius the whole time.",
    "Features that exist only travel around the sphere. Nothing new appears. Nothing melts.",
    "Camera lock-off. Same center. Black void stays black.",
    paint,
    "NO morph. NO size change. ONE body only. Never a second globe.",
  ].join(" ");
}

function breathLine(paint) {
  return [
    "Seamless loop. First frame and last frame are the same still (already pinned).",
    "The body remains COMPLETELY STATIONARY in place. NEVER walking. NEVER shifting. NEVER rotating.",
    "Gentle living motion only: pulse, shimmer, corona breath. NO morph of form.",
    "NO change of size. Same pixel radius the whole time.",
    "Camera lock-off. Same center.",
    paint,
    "ONE body only.",
  ].join(" ");
}

export async function imagineLastStill({ first, dest, paint }) {
  const prompt = [
    LAW,
    "Edit: rotate the SAME body a SMALL amount (~20 degrees) around the vertical axis.",
    "Last pose of a SLOW spin. Same size. Same pixel radius. Same lighting family. Same void.",
    "NO morph. NO change of size. Do not invent a new planet. Do not change the silhouette scale.",
    paint,
  ].join(" ");
  const body = {
    model: IMAGE_MODEL,
    prompt,
    image: { url: dataUri(first) },
    aspect_ratio: "1:1",
  };
  const j = await api("/images/edits", body);
  const url = j.url || j.data?.[0]?.url;
  if (!url) throw new Error("no still url");
  const raw = dest + ".raw.jpg";
  await download(url, raw);
  encodeStill(raw, dest);
  return dest;
}

export async function imaginePlanetClip({ first, last, dest, kind, paint, seconds }) {
  if (!first) throw new Error("clip needs first frame");
  if (!last) throw new Error("Law 0: last_frame is required — always pass first AND last");
  if (kind === "spin" && last === first) {
    throw new Error("spin last_frame must be distinct from first (a low-yaw pose of the SAME body)");
  }
  const prompt = [LAW, kind === "breath" ? breathLine(paint) : spinLine(paint)].join(" ");
  const dur = seconds ?? (kind === "breath" ? 6 : 10);
  const body = {
    model: VIDEO_MODEL,
    prompt,
    duration: dur,
    aspect_ratio: "1:1",
    resolution: "720p",
    image: { url: dataUri(first) },
    last_frame: { url: dataUri(last) },
  };
  const j = await api("/videos/generations", body);
  let url = j.url || j.video?.url || j.data?.[0]?.url;
  const vid = j.request_id || j.id;
  if (!url && vid) url = await pollVideo(vid);
  if (!url) throw new Error("no video url");
  const raw = dest + ".raw.mp4";
  await download(url, raw);
  encodeClip(raw, dest);
  return dest;
}

function posterFromClip(clip, dest) {
  ffmpeg(["-y", "-i", clip, "-ss", "0.12", "-frames:v", "1", dest]);
}

function pingPong(src, dest) {
  ffmpeg([
    "-y",
    "-i",
    src,
    "-filter_complex",
    "[0:v]split[a][b];[b]reverse[r];[a][r]concat=n=2:v=1:a=0,fps=24,format=yuv420p[v]",
    "-map",
    "[v]",
    "-an",
    "-c:v",
    "libx264",
    "-preset",
    "fast",
    "-crf",
    "20",
    "-pix_fmt",
    "yuv420p",
    "-movflags",
    "+faststart",
    dest,
  ]);
}

function encodeH264(src, dest) {
  ffmpeg([
    "-y",
    "-i",
    src,
    "-an",
    "-c:v",
    "libx264",
    "-preset",
    "fast",
    "-crf",
    "20",
    "-pix_fmt",
    "yuv420p",
    "-movflags",
    "+faststart",
    dest,
  ]);
}

/** RIFE 4× — keep fps, insert optical-flow frames (a turn, not freeze-frames). */
function rifeSlow(src, dest, multi = 4) {
  const script = join(process.cwd(), "scripts/rife_slow.py");
  const rifeRoot = process.env.RIFE_ROOT || "/tmp/Practical-RIFE";
  const model = join(rifeRoot, "train_log/flownet.pkl");
  if (!existsSync(script) || !existsSync(model)) {
    throw new Error("RIFE not installed (need scripts/rife_slow.py + " + model + ")");
  }
  const raw = dest.replace(/\.mp4$/, "-rife-raw.mp4");
  const r = spawnSync(
    "python3",
    [script, "--video", src, "--output", raw, "--multi", String(multi), "--fps", "24"],
    { encoding: "utf8", env: { ...process.env, RIFE_ROOT: rifeRoot } },
  );
  if (r.status !== 0) {
    throw new Error((r.stderr || r.stdout || "rife failed").slice(0, 600));
  }
  encodeH264(raw, dest);
}

export async function cookWorld(id, videosDir) {
  const spec = WORLDS[id];
  if (!spec) throw new Error("unknown world " + id);
  const first = join(videosDir, id + ".jpg");
  if (!existsSync(first)) throw new Error("missing first still " + first);
  const kitchen = join(videosDir, "_spin");
  mkdirSync(kitchen, { recursive: true });
  const last = join(kitchen, id + "-last.jpg");
  const dest = join(kitchen, id + ".mp4");
  if (spec.kind === "spin") {
    if (!existsSync(last)) {
      console.log("still last", id);
      await imagineLastStill({ first, dest: last, paint: spec.paint });
    }
    console.log("clip spin (first+last, no morph, no size change, slow axis)", id);
    await imaginePlanetClip({ first, last, dest, kind: "spin", paint: spec.paint, seconds: 10 });
    const rife = join(kitchen, id + "-rife.mp4");
    const ping = join(kitchen, id + "-slow-ping.mp4");
    console.log("RIFE 4x slow-mo", id);
    rifeSlow(dest, rife, 4);
    console.log("ping-pong", id);
    pingPong(rife, ping);
    return ping;
  }
  console.log("clip breath (first=last, no morph, no size change)", id);
  await imaginePlanetClip({
    first,
    last: first,
    dest,
    kind: "breath",
    paint: spec.paint,
    seconds: 6,
  });
  return dest;
}

const ids = process.argv.slice(2).filter((a) => !a.startsWith("-"));
const isCli = process.argv[1] && process.argv[1].includes("imagine-planet-hooks");
if (isCli) {
  const videosDir = join(process.cwd(), "public/videos");
  const queue = ids.length ? ids : Object.keys(WORLDS);
  for (const id of queue) {
    const out = await cookWorld(id, videosDir);
    const live = join(videosDir, id + ".mp4");
    const bak = join(videosDir, "_spin", id + ".prev.mp4");
    if (existsSync(live)) copyFileSync(live, bak);
    copyFileSync(out, live);
    posterFromClip(live, join(videosDir, id + ".jpg"));
    console.log("hung", id, live);
  }
}
