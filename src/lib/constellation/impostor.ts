import { NODES, type NodeId } from "./world";

export interface ImpostorCfg {
  source: number;
  halo: number;
  cx: number;
  cy: number;
  parallax: number;
  /** 0 star, 1 ocean, 2 rock, 3 ice, 4 dark, 5 ash */
  kind: number;
  a: [number, number, number];
  b: [number, number, number];
  c: [number, number, number];
  seed: number;
}

/** Disc in the Imagine plate + palette for the far-side wrap. */
export const IMPOSTOR: Record<NodeId, ImpostorCfg> = {
  core: {
    source: 0.205,
    halo: 0.40,
    cx: 0.5,
    cy: 0.5,
    parallax: 0.04,
    kind: 0,
    a: [0.72, 0.32, 0.05],
    b: [1.0, 0.68, 0.18],
    c: [1.0, 0.92, 0.62],
    seed: 11.2,
  },
  tide: {
    source: 0.248,
    halo: 0.46,
    cx: 0.5,
    cy: 0.5,
    parallax: 0.11,
    kind: 1,
    a: [0.05, 0.22, 0.42],
    b: [0.16, 0.48, 0.22],
    c: [0.9, 0.95, 1.0],
    seed: 4.7,
  },
  canyon: {
    source: 0.312,
    halo: 0.355,
    cx: 0.5,
    cy: 0.5,
    parallax: 0.13,
    kind: 2,
    a: [0.38, 0.14, 0.06],
    b: [0.78, 0.38, 0.16],
    c: [0.9, 0.72, 0.48],
    seed: 8.1,
  },
  crystal: {
    source: 0.13,
    halo: 0.2,
    cx: 0.5,
    cy: 0.5,
    parallax: 0.1,
    kind: 3,
    a: [0.38, 0.52, 0.66],
    b: [0.78, 0.9, 0.98],
    c: [1.0, 1.0, 1.0],
    seed: 2.4,
  },
  hollow: {
    source: 0.17,
    halo: 0.22,
    cx: 0.5,
    cy: 0.5,
    parallax: 0.1,
    kind: 4,
    a: [0.07, 0.08, 0.1],
    b: [0.18, 0.2, 0.24],
    c: [0.32, 0.36, 0.4],
    seed: 6.6,
  },
  drift: {
    source: 0.09,
    halo: 0.135,
    cx: 0.5,
    cy: 0.5,
    parallax: 0.11,
    kind: 5,
    a: [0.2, 0.18, 0.16],
    b: [0.42, 0.38, 0.34],
    c: [0.62, 0.55, 0.48],
    seed: 13.9,
  },
};

export interface ImpostorSprite {
  id: NodeId;
  x: number;
  y: number;
  z: number;
  size: number;
  opacity: number;
  yaw: number;
  pitch: number;
  lod: number;
}

export interface ImpostorFrame {
  vw: number;
  vh: number;
  sprites: ImpostorSprite[];
  liveId: string | null;
}

const VERT = `
attribute vec2 aPos;
varying vec2 vUv;
void main() {
  vUv = aPos * 0.5 + 0.5;
  gl_Position = vec4(aPos, 0.0, 1.0);
}
`;

const FRAG = `
precision mediump float;
varying vec2 vUv;
uniform sampler2D uTex;
uniform vec2 uView;
uniform vec2 uCenter;
uniform vec4 uParams;
uniform float uOpacity;
uniform float uKind;
uniform float uTide;
uniform float uSeed;
uniform float uTime;
uniform vec3 uA;
uniform vec3 uB;
uniform vec3 uC;

float hash31(vec3 p) {
  p = fract(p * vec3(0.1031, 0.1030, 0.0973));
  p += dot(p, p.yxz + 33.33);
  return fract((p.x + p.y) * p.z);
}

float vnoise(vec3 p) {
  vec3 i = floor(p);
  vec3 f = fract(p);
  f = f * f * (3.0 - 2.0 * f);
  float n000 = hash31(i);
  float n100 = hash31(i + vec3(1.0, 0.0, 0.0));
  float n010 = hash31(i + vec3(0.0, 1.0, 0.0));
  float n110 = hash31(i + vec3(1.0, 1.0, 0.0));
  float n001 = hash31(i + vec3(0.0, 0.0, 1.0));
  float n101 = hash31(i + vec3(1.0, 0.0, 1.0));
  float n011 = hash31(i + vec3(0.0, 1.0, 1.0));
  float n111 = hash31(i + vec3(1.0, 1.0, 1.0));
  float x00 = mix(n000, n100, f.x);
  float x10 = mix(n010, n110, f.x);
  float x01 = mix(n001, n101, f.x);
  float x11 = mix(n011, n111, f.x);
  return mix(mix(x00, x10, f.y), mix(x01, x11, f.y), f.z);
}

float fbm(vec3 p) {
  float s = 0.0;
  float a = 0.5;
  for (int i = 0; i < 4; i++) {
    s += a * vnoise(p);
    p *= 2.07;
    a *= 0.5;
  }
  return s;
}

vec3 rotY(vec3 p, float a) {
  float c = cos(a);
  float s = sin(a);
  return vec3(p.x * c + p.z * s, p.y, -p.x * s + p.z * c);
}

vec3 rotX(vec3 p, float a) {
  float c = cos(a);
  float s = sin(a);
  return vec3(p.x, p.y * c - p.z * s, p.y * s + p.z * c);
}

void main() {
  float source = uParams.x;
  float halo0 = uParams.y;
  float para = uParams.z;
  float lod = uParams.w;
  float halo = uKind < 0.5 ? mix(halo0, 0.52, lod) : halo0;
  float isTide = max(uTide, step(0.5, uKind) * (1.0 - step(1.5, uKind)));

  vec2 d = vUv - uCenter;
  float pr = length(d);
  if (pr > halo) {
    gl_FragColor = vec4(0.0);
    return;
  }

  vec4 raw = texture2D(uTex, vUv);

  vec2 sph = d / max(source, 0.0001);
  float sr2 = dot(sph, sph);
  float onBody = 1.0 - smoothstep(0.9, 1.03, sr2);
  float z = sqrt(max(0.0, 1.0 - min(sr2, 1.0)));
  vec3 nCam = normalize(vec3(sph, z));

  float twist = 1.0 - lod * 0.8;
  float yaw = uView.x * twist;
  float pit = uView.y * twist;

  vec2 tilt = vec2(sin(yaw), sin(pit)) * para;
  vec2 samp = d + tilt * z * source;
  float sampR = length(samp);
  float maxR = source * 0.86;
  if (sampR > maxR) samp *= maxR / max(sampR, 0.0001);
  vec3 face = texture2D(uTex, uCenter + samp).rgb;

  vec3 nWrap = rotX(rotY(nCam, -yaw * 0.55), -pit * 0.55);
  float grain = fbm(nWrap * 6.0 + vec3(uSeed));
  float crag = fbm(nWrap * 16.0 + vec3(uSeed * 1.7));
  float spark = fbm(nWrap * 10.0 + vec3(uTime * 0.05));
  float amt = 0.12 * twist * (1.0 - lod * 0.5);
  float rawLuma = max(raw.r, max(raw.g, raw.b));

  // Bump from fbm so canyons catch the light (no derivatives — Samsung safe).
  vec3 t1 = normalize(vec3(-nCam.z, 0.0, nCam.x));
  vec3 t2 = cross(nCam, t1);
  nCam = normalize(nCam + (t1 * (grain - 0.5) + t2 * (crag - 0.5)) * 0.55 * onBody);

  vec3 rgb = raw.rgb;
  if (uKind < 0.5) {
    vec3 starFace = mix(raw.rgb, face, twist * 0.4 * (1.0 - lod));
    starFace += uC * (spark - 0.4) * 0.18 * twist * smoothstep(0.08, 0.26, rawLuma);
    rgb = mix(starFace, raw.rgb, lod * 0.8);
  } else {
    rgb = mix(raw.rgb, face, twist * 0.38 * (1.0 - lod) * onBody);
    rgb *= mix(1.0, mix(0.9, 1.12, grain), amt * onBody);

    vec3 key = normalize(vec3(-0.42, 0.5, 0.76));
    vec3 fill = normalize(vec3(0.55, -0.15, 0.45));
    float ndl = clamp(dot(nCam, key), 0.0, 1.0);
    float fillL = clamp(dot(nCam, fill), 0.0, 1.0);
    float wrap = clamp(ndl * 0.62 + 0.28 + fillL * 0.18, 0.0, 1.15);
    float fres = pow(clamp(1.0 - nCam.z, 0.0, 1.0), 1.8);
    vec3 lit = rgb * mix(0.48, 1.18, wrap);
    lit += mix(uA, uC, 0.4) * fres * 0.32;
    float specPow = mix(18.0, 42.0, isTide);
    float spec = pow(max(dot(nCam, normalize(key + vec3(0.0, 0.0, 1.0))), 0.0), specPow);
    lit += uC * spec * mix(0.14, 0.38, isTide) * twist;
    rgb = mix(rgb, lit, onBody);
  }

  float luma = max(rgb.r, max(rgb.g, rgb.b));
  float window = 1.0 - smoothstep(halo * 0.88, halo, pr);
  float starA = smoothstep(0.08, 0.22, luma) * window;

  float globe = 1.0 - smoothstep(source * 0.975, source * 1.008, pr);
  float ring = smoothstep(0.14, 0.30, luma) * (1.0 - smoothstep(halo * 0.86, halo, pr));
  float planetA = mix(globe, max(globe, ring), isTide);
  planetA *= mix(1.0, max(globe, smoothstep(0.05, 0.12, luma)), isTide);

  // Colored air, not a black cookie. Lives just outside the limb.
  float atmo = smoothstep(source * 0.92, source * 1.01, pr) *
               (1.0 - smoothstep(source * 1.02, source * 1.12, pr));
  atmo *= (1.0 - isTide * 0.25);
  vec3 air = mix(uA, uC, 0.45);
  float airA = atmo * mix(0.42, 0.22, lod);
  rgb = mix(rgb, air, atmo * 0.75);
  planetA = max(planetA, airA);

  float a = mix(starA, planetA, step(0.5, uKind)) * uOpacity;
  gl_FragColor = vec4(rgb * a, a);
}
`;

function compile(gl: WebGLRenderingContext, type: number, src: string) {
  const sh = gl.createShader(type);
  if (!sh) return null;
  gl.shaderSource(sh, src);
  gl.compileShader(sh);
  if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) {
    gl.deleteShader(sh);
    return null;
  }
  return sh;
}

export function createImpostorLayer(
  canvas: HTMLCanvasElement,
  onReady?: () => void,
) {
  const gl = canvas.getContext("webgl", {
    alpha: true,
    premultipliedAlpha: true,
    antialias: true,
    depth: false,
    stencil: false,
  });
  if (!gl) return null;

  const vs = compile(gl, gl.VERTEX_SHADER, VERT);
  const fs = compile(gl, gl.FRAGMENT_SHADER, FRAG);
  if (!vs || !fs) return null;
  const prog = gl.createProgram();
  if (!prog) return null;
  gl.attachShader(prog, vs);
  gl.attachShader(prog, fs);
  gl.linkProgram(prog);
  if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) return null;
  gl.useProgram(prog);

  const buf = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buf);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
  const loc = gl.getAttribLocation(prog, "aPos");
  gl.enableVertexAttribArray(loc);
  gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);

  const uTex = gl.getUniformLocation(prog, "uTex");
  const uView = gl.getUniformLocation(prog, "uView");
  const uCenter = gl.getUniformLocation(prog, "uCenter");
  const uParams = gl.getUniformLocation(prog, "uParams");
  const uOpacity = gl.getUniformLocation(prog, "uOpacity");
  const uKind = gl.getUniformLocation(prog, "uKind");
  const uTide = gl.getUniformLocation(prog, "uTide");
  const uSeed = gl.getUniformLocation(prog, "uSeed");
  const uTime = gl.getUniformLocation(prog, "uTime");
  const uA = gl.getUniformLocation(prog, "uA");
  const uB = gl.getUniformLocation(prog, "uB");
  const uC = gl.getUniformLocation(prog, "uC");
  gl.uniform1i(uTex, 0);

  const textures: Record<string, WebGLTexture> = {};

  const makeTex = () => {
    const t = gl.createTexture();
    if (!t) return null;
    gl.bindTexture(gl.TEXTURE_2D, t);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texImage2D(
      gl.TEXTURE_2D,
      0,
      gl.RGBA,
      1,
      1,
      0,
      gl.RGBA,
      gl.UNSIGNED_BYTE,
      new Uint8Array([0, 0, 0, 0]),
    );
    return t;
  };

  let loaded = 0;
  for (const n of NODES) {
    const t = makeTex();
    if (!t) continue;
    textures[n.id] = t;
    const img = new Image();
    img.decoding = "async";
    img.onload = () => {
      gl.bindTexture(gl.TEXTURE_2D, t);
      gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, 1);
      try {
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img);
      } catch {
        /* tainted */
      }
      loaded += 1;
      if (loaded >= NODES.length) onReady?.();
    };
    img.onerror = () => {
      loaded += 1;
      if (loaded >= NODES.length) onReady?.();
    };
    img.src = n.poster;
  }

  const uploadVideo = (id: string, video: HTMLVideoElement) => {
    const t = textures[id];
    if (!t || video.readyState < 2) return;
    gl.bindTexture(gl.TEXTURE_2D, t);
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, 1);
    try {
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, video);
    } catch {
      /* not ready */
    }
  };

  gl.enable(gl.BLEND);
  gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
  gl.clearColor(0, 0, 0, 0);

  const draw = (frame: ImpostorFrame, videos: Record<string, HTMLVideoElement | null>) => {
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    const w = Math.max(1, Math.floor(frame.vw * dpr));
    const h = Math.max(1, Math.floor(frame.vh * dpr));
    if (canvas.width !== w || canvas.height !== h) {
      canvas.width = w;
      canvas.height = h;
    }
    gl.viewport(0, 0, w, h);
    gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
    gl.clear(gl.COLOR_BUFFER_BIT);

    if (frame.liveId && videos[frame.liveId]) {
      uploadVideo(frame.liveId, videos[frame.liveId]!);
    }

    const tSec = performance.now() * 0.001;
    const sprites = frame.sprites.slice().sort((a, b) => b.z - a.z);
    for (const s of sprites) {
      if (s.opacity < 0.03 || s.size < 8) continue;
      const tex = textures[s.id];
      if (!tex) continue;
      const cfg = IMPOSTOR[s.id];
      const px = s.x * dpr;
      const py = s.y * dpr;
      const sz = s.size * dpr;
      const x0 = px - sz / 2;
      const y0 = h - (py + sz / 2);
      if (x0 + sz < 0 || y0 + sz < 0 || x0 > w || y0 > h) continue;

      gl.viewport(
        Math.floor(x0),
        Math.floor(y0),
        Math.max(1, Math.floor(sz)),
        Math.max(1, Math.floor(sz)),
      );
      gl.bindTexture(gl.TEXTURE_2D, tex);
      gl.uniform2f(uView, s.yaw, s.pitch);
      gl.uniform2f(uCenter, cfg.cx, cfg.cy);
      gl.uniform4f(uParams, cfg.source, cfg.halo, cfg.parallax, s.lod);
      gl.uniform1f(uOpacity, s.opacity);
      gl.uniform1f(uKind, cfg.kind);
      gl.uniform1f(uTide, s.id === "tide" ? 1.0 : 0.0);
      gl.uniform1f(uSeed, cfg.seed);
      gl.uniform1f(uTime, tSec);
      gl.uniform3f(uA, cfg.a[0], cfg.a[1], cfg.a[2]);
      gl.uniform3f(uB, cfg.b[0], cfg.b[1], cfg.b[2]);
      gl.uniform3f(uC, cfg.c[0], cfg.c[1], cfg.c[2]);
      if (cfg.kind < 0.5) gl.blendFunc(gl.ONE, gl.ONE);
      else gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    }
    gl.viewport(0, 0, w, h);
  };

  const destroy = () => {
    for (const t of Object.values(textures)) gl.deleteTexture(t);
    gl.deleteBuffer(buf);
    gl.deleteProgram(prog);
  };

  return { draw, destroy, ok: true as const };
}
