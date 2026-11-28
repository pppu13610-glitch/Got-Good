import * as THREE from 'three';

export interface AnimeFaceOptions {
  skinHex: string;
  blushHex: string;
  irisTopHex: string;
  irisBottomHex: string;
  browHex: string;
  lipHex: string;
  eyeScale?: number;
  smileCurve?: number;
  warmAgeLines?: boolean;
}

export type TailoredClothingStyle =
  | 'cardigan'
  | 'waistcoat'
  | 'trench'
  | 'kimono'
  | 'thai-blouse'
  | 'shirt'
  | 'hoodie-jacket';

export interface TailoredClothingOptions {
  style: TailoredClothingStyle;
  baseHex: string;
  grainHex: string;
  accentHex?: string;
  trimHex?: string;
  buttonHex?: string;
}

function makeCanvasTex(
  size: number,
  draw: (ctx: CanvasRenderingContext2D, s: number) => void,
): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    draw(ctx, size);
  }
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.generateMipmaps = false;
  tex.minFilter = THREE.LinearFilter;
  tex.magFilter = THREE.LinearFilter;
  tex.wrapS = THREE.ClampToEdgeWrapping;
  tex.wrapT = THREE.ClampToEdgeWrapping;
  tex.needsUpdate = true;
  return tex;
}

export function createAnimeFaceTexture(
  opts: AnimeFaceOptions,
  compactMode = false,
): THREE.CanvasTexture {
  const size = compactMode ? 256 : 512;
  const eyeScale = opts.eyeScale ?? 1.0;
  const smileCurve = opts.smileCurve ?? 1.0;

  return makeCanvasTex(size, (ctx, s) => {
    // Base skin fill + soft chin/jaw/temple ambient contour
    ctx.fillStyle = opts.skinHex;
    ctx.fillRect(0, 0, s, s);

    const chinGrad = ctx.createLinearGradient(0, s * 0.66, 0, s);
    chinGrad.addColorStop(0, 'rgba(0,0,0,0)');
    chinGrad.addColorStop(1, 'rgba(130, 72, 56, 0.16)');
    ctx.fillStyle = chinGrad;
    ctx.fillRect(0, s * 0.66, s, s * 0.34);

    // Subtle nose bridge highlight
    const cx = s * 0.5;
    const eyeY = s * 0.532;
    const eyeOffsetX = s * 0.086;
    const ew = s * 0.043 * eyeScale;
    const eh = s * 0.050 * eyeScale;

    // Soft rosy cheek blush
    for (const side of [-1, 1] as const) {
      const bx = cx + side * (eyeOffsetX + s * 0.018);
      const by = eyeY + eh * 1.15;
      const bGrad = ctx.createRadialGradient(bx, by, 1, bx, by, s * 0.055);
      bGrad.addColorStop(0, opts.blushHex);
      bGrad.addColorStop(1, 'rgba(255,180,180,0)');
      ctx.fillStyle = bGrad;
      ctx.beginPath();
      ctx.ellipse(bx, by, s * 0.056, s * 0.032, 0, 0, Math.PI * 2);
      ctx.fill();
    }

    // Crisp expressive anime/human eyes
    for (const side of [-1, 1] as const) {
      const ex = cx + side * eyeOffsetX;

      // Upper eyelid crease
      ctx.strokeStyle = 'rgba(110, 68, 56, 0.45)';
      ctx.lineWidth = Math.max(1.2, s * 0.004);
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.ellipse(
        ex,
        eyeY - eh * 0.24,
        ew * 0.95,
        eh * 0.85,
        0,
        Math.PI * 1.15,
        Math.PI * 1.85,
      );
      ctx.stroke();

      // Sclera
      ctx.fillStyle = '#fcfbfd';
      ctx.beginPath();
      ctx.ellipse(ex, eyeY, ew, eh * 0.9, 0, 0, Math.PI * 2);
      ctx.fill();

      // Clip iris inside sclera
      ctx.save();
      ctx.beginPath();
      ctx.ellipse(ex, eyeY, ew * 0.96, eh * 0.88, 0, 0, Math.PI * 2);
      ctx.clip();

      const irisGrad = ctx.createLinearGradient(0, eyeY - eh * 0.85, 0, eyeY + eh * 0.85);
      irisGrad.addColorStop(0, opts.irisTopHex);
      irisGrad.addColorStop(0.58, opts.irisBottomHex);
      irisGrad.addColorStop(1, '#ffffff');
      ctx.fillStyle = irisGrad;
      ctx.beginPath();
      ctx.ellipse(ex, eyeY + eh * 0.04, ew * 0.72, eh * 0.84, 0, 0, Math.PI * 2);
      ctx.fill();

      // Pupil
      ctx.fillStyle = 'rgba(20, 14, 34, 0.84)';
      ctx.beginPath();
      ctx.ellipse(ex, eyeY + eh * 0.04, ew * 0.34, eh * 0.42, 0, 0, Math.PI * 2);
      ctx.fill();

      // Upper shadow inside eye
      ctx.fillStyle = 'rgba(25, 16, 40, 0.22)';
      ctx.fillRect(ex - ew, eyeY - eh, ew * 2, eh * 0.54);
      ctx.restore();

      // Upper eyelash arc
      ctx.strokeStyle = '#241a24';
      ctx.lineWidth = Math.max(2, s * 0.0105);
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.ellipse(
        ex,
        eyeY + eh * 0.05,
        ew * 1.06,
        eh * 0.96,
        side * 0.05,
        Math.PI * 1.08,
        Math.PI * 1.94,
      );
      ctx.stroke();

      // Subtle lower lash hint
      ctx.strokeStyle = 'rgba(42, 28, 38, 0.52)';
      ctx.lineWidth = Math.max(1, s * 0.0042);
      ctx.beginPath();
      ctx.ellipse(ex, eyeY, ew * 0.85, eh * 0.9, 0, Math.PI * 0.22, Math.PI * 0.78);
      ctx.stroke();

      // Catchlights
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(ex - ew * 0.28, eyeY - eh * 0.26, ew * 0.23, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(ex + ew * 0.26, eyeY + eh * 0.3, ew * 0.12, 0, Math.PI * 2);
      ctx.fill();

      // Eyebrow
      ctx.strokeStyle = opts.browHex;
      ctx.lineWidth = Math.max(1.5, s * 0.0072);
      ctx.beginPath();
      ctx.moveTo(ex - ew * 0.9, eyeY - eh * 1.38);
      ctx.quadraticCurveTo(
        ex,
        eyeY - eh * 1.62,
        ex + ew * 0.85,
        eyeY - eh * 1.32,
      );
      ctx.stroke();

      // Gentle warm smile/character lines for elder guest
      if (opts.warmAgeLines) {
        ctx.strokeStyle = 'rgba(130, 82, 62, 0.32)';
        ctx.lineWidth = Math.max(1, s * 0.003);
        ctx.beginPath();
        ctx.moveTo(ex + side * ew * 1.05, eyeY + eh * 0.25);
        ctx.quadraticCurveTo(
          ex + side * ew * 1.32,
          eyeY + eh * 0.45,
          ex + side * ew * 1.15,
          eyeY + eh * 0.65,
        );
        ctx.stroke();
      }
    }

    // Gentle nose shadow dot & bridge sheen
    ctx.fillStyle = 'rgba(155, 92, 74, 0.36)';
    ctx.beginPath();
    ctx.ellipse(cx, eyeY + eh * 1.45, s * 0.006, s * 0.004, 0, 0, Math.PI * 2);
    ctx.fill();

    // Soft gentle mouth smile
    const mouthY = eyeY + eh * 2.25;
    ctx.strokeStyle = opts.lipHex;
    ctx.lineWidth = Math.max(1.4, s * 0.0062);
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(cx - s * 0.026, mouthY);
    ctx.quadraticCurveTo(
      cx,
      mouthY + s * 0.0155 * smileCurve,
      cx + s * 0.026,
      mouthY,
    );
    ctx.stroke();

    if (opts.warmAgeLines) {
      ctx.strokeStyle = 'rgba(130, 82, 62, 0.26)';
      ctx.lineWidth = Math.max(1, s * 0.003);
      for (const side of [-1, 1] as const) {
        ctx.beginPath();
        ctx.moveTo(cx + side * s * 0.032, mouthY - s * 0.018);
        ctx.quadraticCurveTo(
          cx + side * s * 0.044,
          mouthY + s * 0.005,
          cx + side * s * 0.034,
          mouthY + s * 0.024,
        );
        ctx.stroke();
      }
    }
  });
}

/**
 * Silky anisotropic hair strand texture with curved glossy highlight halo
 * and optional smooth ombre tip coloration.
 */
export function createHairStrandTexture(
  baseHex: string,
  highlightHex: string,
  shadowHex: string,
  tipHex?: string,
  compactMode = false,
): THREE.CanvasTexture {
  const size = compactMode ? 128 : 256;
  const tex = makeCanvasTex(size, (ctx, s) => {
    // Base hair tone with root depth -> optional ombre tip gradient
    const bg = ctx.createLinearGradient(0, 0, 0, s);
    bg.addColorStop(0, shadowHex);
    bg.addColorStop(0.22, baseHex);
    bg.addColorStop(0.72, baseHex);
    bg.addColorStop(1, tipHex ?? baseHex);
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, s, s);

    // Fine vertical silk hair fibers
    const fiberCount = compactMode ? 36 : 64;
    for (let i = 0; i < fiberCount; i++) {
      const x = (i / fiberCount) * s;
      ctx.strokeStyle = i % 3 === 0 ? highlightHex : shadowHex;
      ctx.globalAlpha = i % 3 === 0 ? 0.24 : 0.16;
      ctx.lineWidth = Math.max(1, (s / fiberCount) * 0.65);
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, s);
      ctx.stroke();
    }

    // Signature curved silky hair specular sheen band across upper-mid hair
    const sheen = ctx.createLinearGradient(0, s * 0.22, 0, s * 0.48);
    sheen.addColorStop(0, 'rgba(255,255,255,0)');
    sheen.addColorStop(0.45, highlightHex);
    sheen.addColorStop(0.55, 'rgba(255,255,255,0.45)');
    sheen.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.globalAlpha = 0.36;
    ctx.fillStyle = sheen;
    ctx.fillRect(0, s * 0.22, s, s * 0.26);
    ctx.globalAlpha = 1;
  });
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.ClampToEdgeWrapping;
  return tex;
}

export function createFabricTwillTexture(
  baseHex: string,
  grainHex: string,
  compactMode = false,
): THREE.CanvasTexture {
  const size = compactMode ? 128 : 256;
  const tex = makeCanvasTex(size, (ctx, s) => {
    ctx.fillStyle = baseHex;
    ctx.fillRect(0, 0, s, s);

    ctx.strokeStyle = grainHex;
    ctx.lineWidth = 1;
    ctx.globalAlpha = 0.18;
    const step = s / 32;
    for (let i = -s; i < s * 2; i += step) {
      ctx.beginPath();
      ctx.moveTo(i, 0);
      ctx.lineTo(i + s, s);
      ctx.stroke();
    }
    ctx.globalAlpha = 0.1;
    for (let y = 0; y < s; y += step * 2) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(s, y);
      ctx.stroke();
    }
    ctx.globalAlpha = 1;
  });
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  return tex;
}

/**
 * Tailored garment textures mapped to torso/coat UVs (center front is u = 0.5, top = collar).
 */
export function createTailoredClothingTexture(
  opts: TailoredClothingOptions,
  compactMode = false,
): THREE.CanvasTexture {
  const size = compactMode ? 128 : 256;
  return makeCanvasTex(size, (ctx, s) => {
    ctx.fillStyle = opts.baseHex;
    ctx.fillRect(0, 0, s, s);

    // Subtle fabric grain or knit ribbing
    ctx.strokeStyle = opts.grainHex;
    ctx.lineWidth = Math.max(1, s * 0.005);
    if (opts.style === 'cardigan') {
      // Cozy vertical knit ribs
      ctx.globalAlpha = 0.22;
      const ribStep = s / 26;
      for (let x = 0; x < s; x += ribStep) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, s);
        ctx.stroke();
      }
      ctx.globalAlpha = 1;

      // Ribbed bottom hem & front opening placket along open-coat edges (u = 0 & u = 1)
      const trim = opts.trimHex ?? opts.grainHex;
      ctx.fillStyle = trim;
      ctx.globalAlpha = 0.42;
      ctx.fillRect(0, s * 0.88, s, s * 0.12);
      ctx.fillRect(0, 0, s * 0.07, s);
      ctx.fillRect(s * 0.93, 0, s * 0.07, s);
      ctx.globalAlpha = 1;
      // Cardigan wooden buttons along right front edge
      if (opts.buttonHex) {
        ctx.fillStyle = opts.buttonHex;
        for (let b = 0; b < 4; b++) {
          ctx.beginPath();
          ctx.arc(s * 0.955, s * (0.24 + b * 0.17), s * 0.015, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    } else if (opts.style === 'thai-blouse') {
      // Woven cotton-indigo stripes + center-front vertical geometric embroidery at u = 0.75 (+Z)
      ctx.globalAlpha = 0.15;
      for (let x = 0; x < s; x += s / 36) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, s);
        ctx.stroke();
      }
      ctx.globalAlpha = 1;

      const cx = s * 0.75;
      const accent = opts.accentHex ?? '#8fa0bf';
      // Embroidered stand-collar trim at top (note: lofted torso v=1 is at top, flipY=true maps v=1 to y=0!)
      ctx.fillStyle = accent;
      ctx.globalAlpha = 0.42;
      ctx.fillRect(0, 0, s, s * 0.09);
      // Vertical embroidered border flanking center placket
      ctx.strokeStyle = accent;
      ctx.lineWidth = Math.max(1.2, s * 0.008);
      ctx.globalAlpha = 0.62;
      for (const side of [-1, 1] as const) {
        const px = cx + side * s * 0.044;
        ctx.beginPath();
        ctx.moveTo(px, s * 0.06);
        ctx.lineTo(px, s * 0.92);
        ctx.stroke();
        for (let y = s * 0.16; y < s * 0.86; y += s * 0.11) {
          ctx.beginPath();
          ctx.moveTo(px, y - s * 0.022);
          ctx.lineTo(px + s * 0.015, y);
          ctx.lineTo(px, y + s * 0.022);
          ctx.lineTo(px - s * 0.015, y);
          ctx.closePath();
          ctx.stroke();
        }
      }
      // Top mandarin clasp button
      ctx.fillStyle = opts.buttonHex ?? '#c9cfd8';
      ctx.globalAlpha = 0.92;
      ctx.beginPath();
      ctx.arc(cx, s * 0.14, s * 0.018, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 1;
    } else if (opts.style === 'waistcoat') {
      // Fine suiting twill + front lapels/buttons near open coat edges + side welt pockets
      ctx.globalAlpha = 0.2;
      for (let i = -s; i < s * 2; i += s / 32) {
        ctx.beginPath();
        ctx.moveTo(i, 0);
        ctx.lineTo(i + s, s);
        ctx.stroke();
      }
      ctx.globalAlpha = 1;
      // Front edge stitching & buttons
      ctx.fillStyle = opts.buttonHex ?? '#525763';
      for (let b = 0; b < 4; b++) {
        const by = s * (0.44 + b * 0.12);
        ctx.beginPath();
        ctx.arc(s * 0.955, by, s * 0.016, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(s * 0.045, by, s * 0.016, 0, Math.PI * 2);
        ctx.fill();
      }
      // Side welt pockets (at u ~ 0.14 and 0.86)
      ctx.strokeStyle = opts.accentHex ?? '#353842';
      ctx.lineWidth = Math.max(1.4, s * 0.012);
      ctx.beginPath();
      ctx.moveTo(s * 0.10, s * 0.72);
      ctx.lineTo(s * 0.18, s * 0.74);
      ctx.moveTo(s * 0.90, s * 0.72);
      ctx.lineTo(s * 0.82, s * 0.74);
      ctx.stroke();
    } else if (opts.style === 'trench') {
      // Heavy weathered canvas trench coat texture + stitched back/edge storm seams
      ctx.globalAlpha = 0.22;
      for (let i = -s; i < s * 2; i += s / 28) {
        ctx.beginPath();
        ctx.moveTo(i, 0);
        ctx.lineTo(i + s, s);
        ctx.stroke();
      }
      ctx.fillStyle = opts.accentHex ?? 'rgba(18, 19, 23, 0.35)';
      ctx.fillRect(0, s * 0.88, s, s * 0.12);
      ctx.globalAlpha = 0.35;
      ctx.strokeStyle = opts.trimHex ?? '#454850';
      ctx.lineWidth = Math.max(1.5, s * 0.012);
      ctx.strokeRect(s * 0.03, s * 0.03, s * 0.94, s * 0.94);
      // Center back vent seam at u = 0.5
      ctx.beginPath();
      ctx.moveTo(s * 0.5, s * 0.45);
      ctx.lineTo(s * 0.5, s);
      ctx.stroke();
      ctx.globalAlpha = 1;
    } else if (opts.style === 'shirt') {
      // Crisp woven shirt + clean center-front button placket at u = 0.75 (+Z)
      ctx.globalAlpha = 0.14;
      for (let y = 0; y < s; y += s / 24) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(s, y);
        ctx.stroke();
      }
      ctx.globalAlpha = 1;
      const cx = s * 0.75;
      ctx.strokeStyle = opts.grainHex;
      ctx.lineWidth = Math.max(1, s * 0.006);
      ctx.beginPath();
      ctx.moveTo(cx - s * 0.018, 0);
      ctx.lineTo(cx - s * 0.018, s);
      ctx.moveTo(cx + s * 0.018, 0);
      ctx.lineTo(cx + s * 0.018, s);
      ctx.stroke();
      ctx.fillStyle = opts.buttonHex ?? '#d2c9b8';
      for (let b = 0; b < 4; b++) {
        ctx.beginPath();
        ctx.arc(cx, s * (0.2 + b * 0.2), s * 0.012, 0, Math.PI * 2);
        ctx.fill();
      }
    } else {
      // hoodie-jacket or kimono fallback grain
      ctx.globalAlpha = 0.18;
      for (let i = -s; i < s * 2; i += s / 28) {
        ctx.beginPath();
        ctx.moveTo(i, 0);
        ctx.lineTo(i + s, s);
        ctx.stroke();
      }
      ctx.globalAlpha = 1;
      if (opts.trimHex) {
        ctx.fillStyle = opts.trimHex;
        ctx.fillRect(0, s * 0.9, s, s * 0.07);
      }
    }
  });
}

export function createFishnetStockingTexture(
  baseHex: string,
  netHex: string,
  cuffHex: string,
  compactMode = false,
): THREE.CanvasTexture {
  const size = compactMode ? 128 : 256;
  return makeCanvasTex(size, (ctx, s) => {
    ctx.fillStyle = baseHex;
    ctx.fillRect(0, 0, s, s);

    // Soft cylindrical leg contour shading
    const shade = ctx.createLinearGradient(0, 0, s, 0);
    shade.addColorStop(0, 'rgba(0,0,0,0.16)');
    shade.addColorStop(0.5, 'rgba(255,255,255,0.08)');
    shade.addColorStop(1, 'rgba(0,0,0,0.16)');
    ctx.fillStyle = shade;
    ctx.fillRect(0, 0, s, s);

    // Fine diamond fishnet lattice
    ctx.strokeStyle = netHex;
    ctx.lineWidth = Math.max(1, s * 0.0085);
    ctx.globalAlpha = 0.58;
    const spacing = s / 16;
    for (let i = -s; i < s * 2; i += spacing) {
      ctx.beginPath();
      ctx.moveTo(i, 0);
      ctx.lineTo(i + s, s);
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(i, s);
      ctx.lineTo(i + s, 0);
      ctx.stroke();
    }
    ctx.globalAlpha = 1;

    // Pink top cuff band + crisp white lace stripe (top of canvas = top of stocking)
    ctx.fillStyle = cuffHex;
    ctx.fillRect(0, 0, s, s * 0.13);
    ctx.fillStyle = 'rgba(255,255,255,0.45)';
    ctx.fillRect(0, s * 0.108, s, s * 0.024);
  });
}

export function createSakuraKimonoTexture(
  baseHex: string,
  accentHex: string,
  petalHex: string,
  compactMode = false,
): THREE.CanvasTexture {
  const size = compactMode ? 128 : 256;
  return makeCanvasTex(size, (ctx, s) => {
    ctx.fillStyle = baseHex;
    ctx.fillRect(0, 0, s, s);

    const grad = ctx.createLinearGradient(0, 0, 0, s);
    grad.addColorStop(0, 'rgba(255,255,255,0.28)');
    grad.addColorStop(0.7, 'rgba(255,255,255,0)');
    grad.addColorStop(1, accentHex);
    ctx.globalAlpha = 0.36;
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, s, s);
    ctx.globalAlpha = 1;

    ctx.fillStyle = petalHex;
    const spots = [
      [0.2, 0.25],
      [0.72, 0.34],
      [0.45, 0.58],
      [0.18, 0.74],
      [0.82, 0.78],
    ];
    for (const [fx, fy] of spots) {
      const x = fx * s;
      const y = fy * s;
      const r = s * 0.032;
      for (let p = 0; p < 5; p++) {
        const ang = (p / 5) * Math.PI * 2;
        ctx.beginPath();
        ctx.ellipse(
          x + Math.cos(ang) * r,
          y + Math.sin(ang) * r,
          r * 0.55,
          r * 0.35,
          ang,
          0,
          Math.PI * 2,
        );
        ctx.fill();
      }
    }
  });
}

export type LowPolyPbrSurfaceKind =
  | 'tunic'
  | 'leather'
  | 'trousers'
  | 'metal-trim'
  | 'hair'
  | 'skin';

export interface PbrTextureSet {
  map: THREE.CanvasTexture;
  normalMap: THREE.CanvasTexture;
  roughnessMap: THREE.CanvasTexture;
  metalnessMap: THREE.CanvasTexture;
  textures: THREE.Texture[];
}

function makeLinearDataTex(canvas: HTMLCanvasElement): THREE.CanvasTexture {
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.NoColorSpace;
  tex.generateMipmaps = false;
  tex.minFilter = THREE.LinearFilter;
  tex.magFilter = THREE.LinearFilter;
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.needsUpdate = true;
  return tex;
}

function buildNormalCanvasFromHeight(
  heightField: Float32Array,
  size: number,
  strength: number,
): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  if (!ctx) return canvas;

  const img = ctx.createImageData(size, size);
  const data = img.data;
  const idx = (x: number, y: number) =>
    ((y + size) % size) * size + ((x + size) % size);

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const hL = heightField[idx(x - 1, y)];
      const hR = heightField[idx(x + 1, y)];
      const hU = heightField[idx(x, y - 1)];
      const hD = heightField[idx(x, y + 1)];

      const dx = (hL - hR) * strength;
      const dy = (hU - hD) * strength;
      const dz = 1.0;
      const invLen = 1 / Math.hypot(dx, dy, dz);

      const p = (y * size + x) * 4;
      data[p] = Math.round((dx * invLen * 0.5 + 0.5) * 255);
      data[p + 1] = Math.round((dy * invLen * 0.5 + 0.5) * 255);
      data[p + 2] = Math.round((dz * invLen * 0.5 + 0.5) * 255);
      data[p + 3] = 255;
    }
  }
  ctx.putImageData(img, 0, 0);
  return canvas;
}

/**
 * Generates a ready-to-use 4-map PBR texture set (BaseColor, Tangent Normal, Roughness, Metalness)
 * tailored for Low Poly stylized game characters.
 */
export function createLowPolyPbrTextureSet(
  kind: LowPolyPbrSurfaceKind,
  opts: {
    baseHex: string;
    shadeHex: string;
    accentHex?: string;
    trimHex?: string;
  },
  compactMode = false,
): PbrTextureSet {
  const size = compactMode ? 128 : 256;
  const heightField = new Float32Array(size * size);

  const albedoCanvas = document.createElement('canvas');
  albedoCanvas.width = size;
  albedoCanvas.height = size;
  const aCtx = albedoCanvas.getContext('2d');

  const roughCanvas = document.createElement('canvas');
  roughCanvas.width = size;
  roughCanvas.height = size;
  const rCtx = roughCanvas.getContext('2d');

  const metalCanvas = document.createElement('canvas');
  metalCanvas.width = size;
  metalCanvas.height = size;
  const mCtx = metalCanvas.getContext('2d');

  const baseRoughByte =
    kind === 'metal-trim'
      ? 68
      : kind === 'leather'
        ? 116
        : kind === 'hair'
          ? 122
          : kind === 'skin'
            ? 148
            : 210;

  const baseMetalByte = kind === 'metal-trim' ? 228 : 0;

  if (aCtx && rCtx && mCtx) {
    aCtx.fillStyle = opts.baseHex;
    aCtx.fillRect(0, 0, size, size);

    const roughColor = `rgb(${baseRoughByte},${baseRoughByte},${baseRoughByte})`;
    rCtx.fillStyle = roughColor;
    rCtx.fillRect(0, 0, size, size);

    const metalColor = `rgb(${baseMetalByte},${baseMetalByte},${baseMetalByte})`;
    mCtx.fillStyle = metalColor;
    mCtx.fillRect(0, 0, size, size);

    // Subtle vertical ambient gradient on BaseColor
    const grad = aCtx.createLinearGradient(0, 0, 0, size);
    grad.addColorStop(0, 'rgba(255,255,255,0.12)');
    grad.addColorStop(0.55, 'rgba(255,255,255,0)');
    grad.addColorStop(1, opts.shadeHex);
    aCtx.globalAlpha = 0.28;
    aCtx.fillStyle = grad;
    aCtx.fillRect(0, 0, size, size);
    aCtx.globalAlpha = 1;

    if (kind === 'tunic') {
      // Stylized cloth weave + geometric trim band + stitched gold/brass seam
      for (let y = 0; y < size; y++) {
        for (let x = 0; x < size; x++) {
          const weave =
            Math.sin((x / size) * Math.PI * 36) *
            Math.cos((y / size) * Math.PI * 36);
          heightField[y * size + x] = 0.5 + weave * 0.08;
        }
      }
      aCtx.strokeStyle = opts.shadeHex;
      aCtx.globalAlpha = 0.14;
      aCtx.lineWidth = Math.max(1, size * 0.008);
      for (let i = 0; i < size; i += Math.max(6, size / 24)) {
        aCtx.beginPath();
        aCtx.moveTo(0, i);
        aCtx.lineTo(size, i);
        aCtx.stroke();
      }
      aCtx.globalAlpha = 1;

      if (opts.accentHex) {
        // Vertical placket / tabard strip + horizontal hem trim
        aCtx.fillStyle = opts.accentHex;
        aCtx.fillRect(size * 0.44, 0, size * 0.12, size);
        aCtx.fillRect(0, size * 0.84, size, size * 0.08);
      }
      if (opts.trimHex) {
        aCtx.fillStyle = opts.trimHex;
        aCtx.fillRect(size * 0.45, 0, size * 0.015, size);
        aCtx.fillRect(size * 0.535, 0, size * 0.015, size);
        // Metallic gold/brass buttons along placket
        for (let b = 0; b < 4; b++) {
          const by = size * (0.2 + b * 0.16);
          aCtx.beginPath();
          aCtx.arc(size * 0.5, by, size * 0.022, 0, Math.PI * 2);
          aCtx.fill();

          mCtx.fillStyle = 'rgb(225,225,225)';
          mCtx.beginPath();
          mCtx.arc(size * 0.5, by, size * 0.024, 0, Math.PI * 2);
          mCtx.fill();

          rCtx.fillStyle = 'rgb(65,65,65)';
          rCtx.beginPath();
          rCtx.arc(size * 0.5, by, size * 0.024, 0, Math.PI * 2);
          rCtx.fill();

          const rPx = Math.round(size * 0.024);
          const cx = Math.round(size * 0.5);
          const cy = Math.round(by);
          for (let yy = -rPx; yy <= rPx; yy++) {
            for (let xx = -rPx; xx <= rPx; xx++) {
              if (xx * xx + yy * yy <= rPx * rPx) {
                const px = Math.max(0, Math.min(size - 1, cx + xx));
                const py = Math.max(0, Math.min(size - 1, cy + yy));
                heightField[py * size + px] = 0.92;
              }
            }
          }
        }
      }
    } else if (kind === 'leather') {
      // Grainy leather normal + stitched border + metallic rivets
      for (let y = 0; y < size; y++) {
        for (let x = 0; x < size; x++) {
          const cell =
            Math.sin(x * 0.42 + Math.cos(y * 0.37) * 2.1) *
            Math.cos(y * 0.48 + Math.sin(x * 0.31) * 1.8);
          heightField[y * size + x] = 0.5 + cell * 0.14;
        }
      }
      aCtx.strokeStyle = opts.shadeHex;
      aCtx.lineWidth = Math.max(1.5, size * 0.015);
      aCtx.strokeRect(size * 0.06, size * 0.06, size * 0.88, size * 0.88);
      if (opts.trimHex) {
        aCtx.strokeStyle = opts.trimHex;
        aCtx.setLineDash([size * 0.03, size * 0.025]);
        aCtx.lineWidth = Math.max(1, size * 0.01);
        aCtx.strokeRect(size * 0.1, size * 0.1, size * 0.8, size * 0.8);
        aCtx.setLineDash([]);
      }
    } else if (kind === 'trousers') {
      for (let y = 0; y < size; y++) {
        for (let x = 0; x < size; x++) {
          const twill = Math.sin(((x + y) / size) * Math.PI * 44);
          heightField[y * size + x] = 0.5 + twill * 0.07;
        }
      }
      aCtx.strokeStyle = opts.shadeHex;
      aCtx.globalAlpha = 0.22;
      aCtx.lineWidth = Math.max(1, size * 0.012);
      aCtx.beginPath();
      aCtx.moveTo(size * 0.25, 0);
      aCtx.lineTo(size * 0.25, size);
      aCtx.moveTo(size * 0.75, 0);
      aCtx.lineTo(size * 0.75, size);
      aCtx.stroke();
      aCtx.globalAlpha = 1;
    } else if (kind === 'metal-trim') {
      // Brushed metal streaks + bevel frame
      for (let y = 0; y < size; y++) {
        const streak = Math.sin(y * 0.65) * 0.06;
        for (let x = 0; x < size; x++) {
          const border =
            x < size * 0.08 ||
            x > size * 0.92 ||
            y < size * 0.08 ||
            y > size * 0.92
              ? 0.2
              : 0.75;
          heightField[y * size + x] = border + streak;
        }
      }
      aCtx.strokeStyle = opts.shadeHex;
      aCtx.lineWidth = Math.max(1.5, size * 0.024);
      aCtx.strokeRect(size * 0.05, size * 0.05, size * 0.9, size * 0.9);
      aCtx.fillStyle = 'rgba(255,255,255,0.28)';
      aCtx.fillRect(size * 0.12, size * 0.12, size * 0.76, size * 0.14);
    } else if (kind === 'hair') {
      for (let y = 0; y < size; y++) {
        for (let x = 0; x < size; x++) {
          const strand = Math.sin((x / size) * Math.PI * 28 + Math.sin(y * 0.06));
          heightField[y * size + x] = 0.5 + strand * 0.18;
        }
      }
      aCtx.fillStyle = opts.accentHex ?? 'rgba(255,255,255,0.22)';
      aCtx.globalAlpha = 0.28;
      aCtx.fillRect(0, size * 0.34, size, size * 0.14);
      aCtx.globalAlpha = 1;
    } else {
      for (let i = 0; i < heightField.length; i++) {
        heightField[i] = 0.5;
      }
    }
  }

  const normalCanvas = buildNormalCanvasFromHeight(
    heightField,
    size,
    kind === 'metal-trim' || kind === 'leather' ? 2.4 : 1.7,
  );

  const map = new THREE.CanvasTexture(albedoCanvas);
  map.colorSpace = THREE.SRGBColorSpace;
  map.generateMipmaps = false;
  map.minFilter = THREE.LinearFilter;
  map.magFilter = THREE.LinearFilter;
  map.wrapS = THREE.RepeatWrapping;
  map.wrapT = THREE.RepeatWrapping;
  map.needsUpdate = true;

  const normalMap = makeLinearDataTex(normalCanvas);
  const roughnessMap = makeLinearDataTex(roughCanvas);
  const metalnessMap = makeLinearDataTex(metalCanvas);

  return {
    map,
    normalMap,
    roughnessMap,
    metalnessMap,
    textures: [map, normalMap, roughnessMap, metalnessMap],
  };
}

