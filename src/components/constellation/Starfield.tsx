import { useEffect, useRef, type RefObject } from "react";

export interface SkyMotion {
  x: number;
  y: number;
  yaw: number;
  pitch: number;
  flatten: number;
}

interface Speck {
  x: number;
  y: number;
  r: number;
  a: number;
  p: number;
  s: number;
  depth: number;
  cr: number;
  cg: number;
  cb: number;
  glow: boolean;
}

interface Meteor {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  len: number;
}

function frac(n: number) {
  return n - Math.floor(n);
}

function mulberry32(seed: number) {
  let a = seed | 0;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function seedLayer(
  rng: () => number,
  count: number,
  depth: number,
  rMin: number,
  rMax: number,
  aMin: number,
  aMax: number,
): Speck[] {
  return Array.from({ length: count }, () => {
    const kind = rng();
    let cr = 232;
    let cg = 238;
    let cb = 248;
    if (kind < 0.18) {
      cr = 255;
      cg = 228;
      cb = 196;
    } else if (kind > 0.78) {
      cr = 186;
      cg = 210;
      cb = 255;
    }
    const r = rMin + rng() * (rMax - rMin);
    return {
      x: rng(),
      y: rng(),
      r,
      a: aMin + rng() * (aMax - aMin),
      p: rng() * Math.PI * 2,
      s: 0.28 + rng() * 1.15,
      depth,
      cr,
      cg,
      cb,
      glow: r > (rMin + rMax) * 0.42 && rng() > 0.55,
    };
  });
}

function paint(
  ctx: CanvasRenderingContext2D,
  specks: Speck[],
  w: number,
  h: number,
  t: number,
  motion: SkyMotion,
  k: number,
  twinkle: boolean,
) {
  const pan = 1 - motion.flatten * 0.88;
  for (const s of specks) {
    const d = s.depth * pan * k;
    const px = frac(s.x - motion.x * d * 0.00011 - motion.yaw * d * 0.07) * w;
    const py = frac(s.y - motion.y * d * 0.00011 - motion.pitch * d * 0.09) * h;
    const tw = twinkle ? s.a * (0.58 + 0.42 * Math.sin(t * s.s + s.p)) : s.a;
    if (s.glow && tw > 0.12) {
      ctx.fillStyle = `rgba(${s.cr},${s.cg},${s.cb},${tw * 0.16})`;
      ctx.beginPath();
      ctx.arc(px, py, s.r * 4.2, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.fillStyle = `rgba(${s.cr},${s.cg},${s.cb},${tw})`;
    ctx.beginPath();
    ctx.arc(px, py, s.r, 0, Math.PI * 2);
    ctx.fill();
  }
}

function paintBand(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  motion: SkyMotion,
) {
  const a = 0.055 * (1 - motion.flatten * 0.75);
  if (a < 0.008) return;
  ctx.save();
  ctx.translate(w * 0.5, h * 0.5);
  ctx.rotate(-0.38 + motion.yaw * 0.12 + motion.pitch * 0.04);
  ctx.translate(-w * 0.5, -h * 0.5);
  const g = ctx.createLinearGradient(0, h * 0.34, 0, h * 0.66);
  g.addColorStop(0, "rgba(170,186,220,0)");
  g.addColorStop(0.5, `rgba(196,208,232,${a})`);
  g.addColorStop(1, "rgba(170,186,220,0)");
  ctx.fillStyle = g;
  ctx.fillRect(-w * 0.4, h * 0.32, w * 1.8, h * 0.36);
  ctx.restore();
}

export function Starfield({ motion }: { motion: RefObject<SkyMotion> }) {
  const farRef = useRef<HTMLCanvasElement>(null);
  const dustRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const far = farRef.current;
    const dust = dustRef.current;
    if (!far || !dust) return;
    const farCtx = far.getContext("2d");
    const dustCtx = dust.getContext("2d");
    if (!farCtx || !dustCtx) return;

    const rng = mulberry32(0x51a7);
    const farStars = seedLayer(rng, 140, 0.14, 0.12, 0.55, 0.08, 0.28);
    const midStars = seedLayer(rng, 78, 0.4, 0.32, 1.0, 0.14, 0.4);
    const nearStars = seedLayer(rng, 40, 0.76, 0.48, 1.28, 0.16, 0.4);
    const motes = seedLayer(rng, 26, 1.42, 0.65, 1.65, 0.08, 0.24);

    const meteor: Meteor = { x: 0, y: 0, vx: 0, vy: 0, life: 0, len: 0 };
    let nextMeteor = 4 + rng() * 8;

    let w = 0;
    let h = 0;
    let dpr = 1;
    const resize = () => {
      dpr = Math.min(2, window.devicePixelRatio || 1);
      w = window.innerWidth;
      h = window.innerHeight;
      for (const c of [far, dust]) {
        c.width = Math.floor(w * dpr);
        c.height = Math.floor(h * dpr);
        c.style.width = `${w}px`;
        c.style.height = `${h}px`;
      }
    };
    resize();
    window.addEventListener("resize", resize);

    let raf = 0;
    const t0 = performance.now();
    let last = t0;
    const loop = (now: number) => {
      const t = (now - t0) / 1000;
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      const m = motion.current;
      farCtx.setTransform(dpr, 0, 0, dpr, 0, 0);
      farCtx.clearRect(0, 0, w, h);
      paintBand(farCtx, w, h, m);
      paint(farCtx, farStars, w, h, t, m, 1, true);
      paint(farCtx, midStars, w, h, t, m, 1, true);
      paint(farCtx, nearStars, w, h, t, m, 1, true);

      if (meteor.life > 0) {
        meteor.life -= dt;
        meteor.x += meteor.vx * dt;
        meteor.y += meteor.vy * dt;
        const fade = Math.max(0, meteor.life / 0.72);
        const nx = meteor.vx / Math.hypot(meteor.vx, meteor.vy);
        const ny = meteor.vy / Math.hypot(meteor.vx, meteor.vy);
        farCtx.strokeStyle = `rgba(232,238,248,${0.55 * fade * (1 - m.flatten)})`;
        farCtx.lineWidth = 1.15;
        farCtx.beginPath();
        farCtx.moveTo(meteor.x, meteor.y);
        farCtx.lineTo(meteor.x - nx * meteor.len, meteor.y - ny * meteor.len);
        farCtx.stroke();
      } else {
        nextMeteor -= dt;
        if (nextMeteor <= 0 && m.flatten < 0.7) {
          meteor.x = rng() * w * 0.8;
          meteor.y = rng() * h * 0.45;
          meteor.vx = 380 + rng() * 220;
          meteor.vy = 140 + rng() * 160;
          meteor.life = 0.55 + rng() * 0.25;
          meteor.len = 48 + rng() * 36;
          nextMeteor = 9 + rng() * 14;
        }
      }

      dustCtx.setTransform(dpr, 0, 0, dpr, 0, 0);
      dustCtx.clearRect(0, 0, w, h);
      const dustK = (1 - m.flatten) * (1 - m.flatten);
      if (dustK > 0.04) {
        paint(dustCtx, motes, w, h, t, m, dustK, false);
      }
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
    };
  }, [motion]);

  return (
    <>
      <canvas
        ref={farRef}
        className="pointer-events-none absolute inset-0"
        aria-hidden="true"
      />
      <canvas
        ref={dustRef}
        className="dust-field pointer-events-none absolute inset-0"
        aria-hidden="true"
      />
    </>
  );
}
