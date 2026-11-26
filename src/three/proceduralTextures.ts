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
