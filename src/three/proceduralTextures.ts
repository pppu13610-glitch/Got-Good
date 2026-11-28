import * as THREE from 'three';

export function createWoodGrainTexture(
  baseHex: string,
  grainHex: string,
  maxAnisotropy: number,
  compact = false,
  ultraCompact = false,
): THREE.CanvasTexture {
  const size = ultraCompact ? 128 : compact ? 256 : 512;
  const lineCount = ultraCompact ? 28 : compact ? 46 : 90;
  const stepX = 32;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');

  if (ctx) {
    ctx.fillStyle = baseHex;
    ctx.fillRect(0, 0, size, size);

    ctx.strokeStyle = grainHex;
    for (let i = 0; i < lineCount; i++) {
      ctx.globalAlpha = 0.08 + (i % 5) * 0.03;
      ctx.lineWidth = compact || ultraCompact ? 1 : 1 + (i % 3);
      ctx.beginPath();
      const yBase = (i / lineCount) * size;
      ctx.moveTo(0, yBase);
      for (let x = 0; x <= size; x += stepX) {
        const wave = Math.sin(x * 0.02 + i * 0.7) * (compact || ultraCompact ? 2.5 : 5);
        ctx.lineTo(x, yBase + wave);
      }
      ctx.stroke();
    }
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  if (compact || ultraCompact) {
    // Disabling mipmaps on ARM Mali-G57 / 2GB RAM saves 33% VRAM and eliminates missing mip-tile glitches while rotating
    texture.generateMipmaps = false;
    texture.minFilter = THREE.LinearFilter;
    texture.magFilter = THREE.LinearFilter;
    texture.anisotropy = 1;
  } else {
    texture.minFilter = THREE.LinearMipmapLinearFilter;
    texture.magFilter = THREE.LinearFilter;
    texture.anisotropy = Math.min(8, maxAnisotropy);
  }
  texture.needsUpdate = true;
  return texture;
}

export function createWovenMatTexture(
  maxAnisotropy: number,
  compact = false,
  ultraCompact = false,
): THREE.CanvasTexture {
  const size = ultraCompact ? 64 : compact ? 128 : 256;
  const rowStep = ultraCompact ? 4 : compact ? 6 : 8;
  const colStep = ultraCompact ? 8 : compact ? 12 : 16;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');

  if (ctx) {
    ctx.fillStyle = '#B8A88A';
    ctx.fillRect(0, 0, size, size);

    for (let y = 0; y < size; y += rowStep) {
      ctx.fillStyle = y % (rowStep * 2) === 0 ? '#AE9D7E' : '#C2B396';
      ctx.fillRect(0, y, size, Math.max(1, rowStep - 2));
    }

    ctx.fillStyle = 'rgba(72, 58, 40, 0.08)';
    for (let x = 0; x < size; x += colStep) {
      ctx.fillRect(x, 0, 2, size);
    }
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(3, 2);
  if (compact || ultraCompact) {
    texture.generateMipmaps = false;
    texture.minFilter = THREE.LinearFilter;
    texture.magFilter = THREE.LinearFilter;
    texture.anisotropy = 1;
  } else {
    texture.minFilter = THREE.LinearMipmapLinearFilter;
    texture.magFilter = THREE.LinearFilter;
    texture.anisotropy = Math.min(8, maxAnisotropy);
  }
  texture.needsUpdate = true;
  return texture;
}

export function createCeramicSpeckleTexture(
  baseHex: string,
  speckHex: string,
  maxAnisotropy: number,
  compact = false,
  ultraCompact = false,
): THREE.CanvasTexture {
  const size = ultraCompact ? 64 : compact ? 128 : 256;
  const speckCount = ultraCompact ? 90 : compact ? 180 : 420;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');

  if (ctx) {
    ctx.fillStyle = baseHex;
    ctx.fillRect(0, 0, size, size);

    // Subtle organic stoneware speckles
    let seed = 42;
    const rand = () => {
      seed = (seed * 1664525 + 1013904223) % 4294967296;
      return seed / 4294967296;
    };

    ctx.fillStyle = speckHex;
    for (let i = 0; i < speckCount; i++) {
      const x = rand() * size;
      const y = rand() * size;
      const r = (0.5 + rand() * 1.4) * (compact || ultraCompact ? 0.65 : 1);
      ctx.globalAlpha = 0.12 + rand() * 0.22;
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  if (compact || ultraCompact) {
    texture.generateMipmaps = false;
    texture.minFilter = THREE.LinearFilter;
    texture.magFilter = THREE.LinearFilter;
    texture.anisotropy = 1;
  } else {
    texture.minFilter = THREE.LinearMipmapLinearFilter;
    texture.magFilter = THREE.LinearFilter;
    texture.anisotropy = Math.min(4, maxAnisotropy);
  }
  texture.needsUpdate = true;
  return texture;
}

export function createContactShadowTexture(
  ultraCompact = false,
): THREE.CanvasTexture {
  const size = ultraCompact ? 64 : 128;
  const half = size / 2;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');

  if (ctx) {
    ctx.clearRect(0, 0, size, size);
    const grad = ctx.createRadialGradient(
      half,
      half,
      ultraCompact ? 4 : 8,
      half,
      half,
      half - 4,
    );
    grad.addColorStop(0, 'rgba(18, 22, 18, 0.55)');
    grad.addColorStop(0.55, 'rgba(18, 22, 18, 0.22)');
    grad.addColorStop(1, 'rgba(18, 22, 18, 0)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, size, size);
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.wrapS = THREE.ClampToEdgeWrapping;
  texture.wrapT = THREE.ClampToEdgeWrapping;
  texture.generateMipmaps = false;
  texture.minFilter = THREE.LinearFilter;
  texture.magFilter = THREE.LinearFilter;
  texture.anisotropy = 1;
  texture.needsUpdate = true;
  return texture;
}

export function createSteamPuffTexture(
  ultraCompact = false,
): THREE.CanvasTexture {
  const size = ultraCompact ? 64 : 128;
  const half = size / 2;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');

  if (ctx) {
    ctx.clearRect(0, 0, size, size);
    const grad = ctx.createRadialGradient(
      half,
      half,
      ultraCompact ? 2 : 4,
      half,
      half,
      half - 6,
    );
    grad.addColorStop(0, 'rgba(248, 248, 244, 0.45)');
    grad.addColorStop(0.5, 'rgba(248, 248, 244, 0.16)');
    grad.addColorStop(1, 'rgba(248, 248, 244, 0)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, size, size);
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.wrapS = THREE.ClampToEdgeWrapping;
  texture.wrapT = THREE.ClampToEdgeWrapping;
  texture.generateMipmaps = false;
  texture.minFilter = THREE.LinearFilter;
  texture.magFilter = THREE.LinearFilter;
  texture.anisotropy = 1;
  texture.needsUpdate = true;
  return texture;
}

export interface TeaMenuBoardCanvasHandle {
  canvas: HTMLCanvasElement;
  texture: THREE.CanvasTexture;
  redraw: (
    unlockedTeas: {
      id: string;
      name: string;
      idealTempLabel: string;
      richColor: string;
      categoryLabel: string;
    }[],
    playerLevel: number,
    orderedTeaId?: string | null,
  ) => void;
}

function truncateCanvasText(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number,
): string {
  if (ctx.measureText(text).width <= maxWidth) return text;
  let cut = text;
  while (cut.length > 1 && ctx.measureText(`${cut}…`).width > maxWidth) {
    cut = cut.slice(0, -1);
  }
  return `${cut}…`;
}

export function createTeaMenuBoardTexture(
  maxAnisotropy: number,
  compact = false,
  ultraCompact = false,
): TeaMenuBoardCanvasHandle {
  const w = ultraCompact ? 384 : compact ? 512 : 768;
  const h = ultraCompact ? 480 : compact ? 640 : 960;
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d');

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.wrapS = THREE.ClampToEdgeWrapping;
  texture.wrapT = THREE.ClampToEdgeWrapping;
  texture.generateMipmaps = false;
  texture.minFilter = THREE.LinearFilter;
  texture.magFilter = THREE.LinearFilter;
  texture.anisotropy = compact || ultraCompact ? 1 : Math.min(4, maxAnisotropy);

  const redraw: TeaMenuBoardCanvasHandle['redraw'] = (
    unlockedTeas,
    playerLevel,
    orderedTeaId,
  ) => {
    if (!ctx) return;
    const s = w / 512;

    // Warm Japanese parchment backing
    ctx.fillStyle = '#FAF5E8';
    ctx.fillRect(0, 0, w, h);

    // Subtle double border frame
    ctx.strokeStyle = '#C89D54';
    ctx.lineWidth = Math.max(2, 3 * s);
    ctx.strokeRect(10 * s, 10 * s, w - 20 * s, h - 20 * s);
    ctx.strokeStyle = 'rgba(46, 111, 64, 0.28)';
    ctx.lineWidth = Math.max(1, 1.5 * s);
    ctx.strokeRect(16 * s, 16 * s, w - 32 * s, h - 32 * s);

    // Header Ribbon
    ctx.fillStyle = '#263B2C';
    ctx.fillRect(16 * s, 16 * s, w - 32 * s, 82 * s);

    ctx.fillStyle = '#FAF5E8';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = `700 ${Math.round(25 * s)}px "Kanit", "Sarabun", sans-serif`;
    ctx.fillText('ป้ายเมนูชาประจำร้าน', w / 2, 46 * s);

    ctx.fillStyle = '#DFC48C';
    ctx.font = `500 ${Math.round(14 * s)}px "Sarabun", sans-serif`;
    ctx.fillText(
      `พร้อมชงเสิร์ฟ ${unlockedTeas.length} เมนู · ระดับร้าน Lv.${playerLevel}`,
      w / 2,
      78 * s,
    );

    // Menu Rows (strictly ONLY unlocked teas that we can brew)
    const startY = 114 * s;
    const availH = h - startY - 38 * s;
    const useTwoCols = unlockedTeas.length > 10;
    const cols = useTwoCols ? 2 : 1;
    const rowsPerCol = Math.ceil(unlockedTeas.length / cols);
    const colGap = useTwoCols ? 14 * s : 0;
    const padX = 26 * s;
    const colW = (w - padX * 2 - colGap * (cols - 1)) / cols;
    const rowH = Math.min(44 * s, availH / Math.max(1, rowsPerCol));

    unlockedTeas.forEach((tea, idx) => {
      const col = useTwoCols ? Math.floor(idx / rowsPerCol) : 0;
      const row = useTwoCols ? idx % rowsPerCol : idx;
      const rx = padX + col * (colW + colGap);
      const ry = startY + row * rowH;
      const isOrdered = Boolean(orderedTeaId && tea.id === orderedTeaId);

      // Highlight ordered tea row cleanly
      if (isOrdered) {
        ctx.fillStyle = '#E1F0E3';
        ctx.fillRect(rx, ry + 2 * s, colW, rowH - 4 * s);
        ctx.strokeStyle = '#2E6F40';
        ctx.lineWidth = Math.max(1.5, 2 * s);
        ctx.strokeRect(rx, ry + 2 * s, colW, rowH - 4 * s);
      } else if (row % 2 === 1) {
        ctx.fillStyle = 'rgba(31, 40, 35, 0.035)';
        ctx.fillRect(rx, ry + 2 * s, colW, rowH - 4 * s);
      }

      // Tea color swatch circle
      const dotR = (useTwoCols ? 5.5 : 6.5) * s;
      const dotX = rx + 12 * s;
      const dotY = ry + rowH / 2;
      ctx.beginPath();
      ctx.arc(dotX, dotY, dotR, 0, Math.PI * 2);
      ctx.fillStyle = tea.richColor;
      ctx.fill();
      ctx.strokeStyle = 'rgba(0,0,0,0.22)';
      ctx.lineWidth = 1 * s;
      ctx.stroke();

      // Tea name
      ctx.textAlign = 'left';
      ctx.textBaseline = 'middle';
      ctx.fillStyle = isOrdered ? '#194A27' : '#1F2823';
      const fontSize = Math.round((useTwoCols ? 13 : 16.5) * s);
      ctx.font = `${isOrdered ? '700' : '600'} ${fontSize}px "Kanit", "Sarabun", sans-serif`;

      const rightLabel = isOrdered ? '★ สั่ง' : tea.idealTempLabel;
      ctx.font = `600 ${Math.round((useTwoCols ? 11 : 13) * s)}px "Sarabun", sans-serif`;
      const rightW = ctx.measureText(rightLabel).width + 10 * s;

      ctx.font = `${isOrdered ? '700' : '600'} ${fontSize}px "Kanit", "Sarabun", sans-serif`;
      const nameMaxW = Math.max(40 * s, colW - 26 * s - rightW);
      const displayName = truncateCanvasText(ctx, tea.name, nameMaxW);
      ctx.fillText(displayName, rx + 24 * s, dotY);

      // Right meta (temp or ordered indicator)
      ctx.textAlign = 'right';
      ctx.fillStyle = isOrdered ? '#2E6F40' : '#5A655D';
      ctx.font = `${isOrdered ? '700' : '500'} ${Math.round((useTwoCols ? 11 : 13) * s)}px "Sarabun", sans-serif`;
      ctx.fillText(rightLabel, rx + colW - 8 * s, dotY);
    });

    // Subtle footer hint
    ctx.textAlign = 'center';
    ctx.fillStyle = '#5A655D';
    ctx.font = `500 ${Math.round(12 * s)}px "Sarabun", sans-serif`;
    ctx.fillText('แตะที่ป้ายเพื่อเปิดดูหน้าเมนูชาฉบับเต็ม', w / 2, h - 22 * s);

    texture.needsUpdate = true;
  };

  return {canvas, texture, redraw};
}

