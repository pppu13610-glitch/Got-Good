import * as THREE from 'three';

export function createWoodGrainTexture(
  baseHex: string,
  grainHex: string,
  maxAnisotropy: number,
  compact = false,
): THREE.CanvasTexture {
  const size = compact ? 256 : 512;
  const lineCount = compact ? 46 : 90;
  const stepX = compact ? 32 : 32;
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
      ctx.lineWidth = compact ? 1 : 1 + (i % 3);
      ctx.beginPath();
      const yBase = (i / lineCount) * size;
      ctx.moveTo(0, yBase);
      for (let x = 0; x <= size; x += stepX) {
        const wave = Math.sin(x * 0.02 + i * 0.7) * (compact ? 3 : 5);
        ctx.lineTo(x, yBase + wave);
      }
      ctx.stroke();
    }
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.minFilter = THREE.LinearMipmapLinearFilter;
  texture.magFilter = THREE.LinearFilter;
  texture.anisotropy = compact ? 1 : Math.min(8, maxAnisotropy);
  texture.needsUpdate = true;
  return texture;
}

export function createWovenMatTexture(
  maxAnisotropy: number,
  compact = false,
): THREE.CanvasTexture {
  const size = compact ? 128 : 256;
  const rowStep = compact ? 6 : 8;
  const colStep = compact ? 12 : 16;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');

  if (ctx) {
    ctx.fillStyle = '#B8A88A';
    ctx.fillRect(0, 0, size, size);

    for (let y = 0; y < size; y += rowStep) {
      ctx.fillStyle = y % (rowStep * 2) === 0 ? '#AE9D7E' : '#C2B396';
      ctx.fillRect(0, y, size, rowStep - 2);
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
  texture.minFilter = THREE.LinearMipmapLinearFilter;
  texture.magFilter = THREE.LinearFilter;
  texture.repeat.set(3, 2);
  texture.anisotropy = compact ? 1 : Math.min(8, maxAnisotropy);
  texture.needsUpdate = true;
  return texture;
}

export function createCeramicSpeckleTexture(
  baseHex: string,
  speckHex: string,
  maxAnisotropy: number,
  compact = false,
): THREE.CanvasTexture {
  const size = compact ? 128 : 256;
  const speckCount = compact ? 180 : 420;
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
      const r = (0.5 + rand() * 1.4) * (compact ? 0.65 : 1);
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
  texture.minFilter = THREE.LinearMipmapLinearFilter;
  texture.magFilter = THREE.LinearFilter;
  texture.anisotropy = compact ? 1 : Math.min(4, maxAnisotropy);
  texture.needsUpdate = true;
  return texture;
}

export function createContactShadowTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 128;
  canvas.height = 128;
  const ctx = canvas.getContext('2d');

  if (ctx) {
    ctx.clearRect(0, 0, 128, 128);
    const grad = ctx.createRadialGradient(64, 64, 8, 64, 64, 60);
    grad.addColorStop(0, 'rgba(18, 22, 18, 0.55)');
    grad.addColorStop(0.55, 'rgba(18, 22, 18, 0.22)');
    grad.addColorStop(1, 'rgba(18, 22, 18, 0)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 128, 128);
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

export function createSteamPuffTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 128;
  canvas.height = 128;
  const ctx = canvas.getContext('2d');

  if (ctx) {
    ctx.clearRect(0, 0, 128, 128);
    const grad = ctx.createRadialGradient(64, 64, 4, 64, 64, 56);
    grad.addColorStop(0, 'rgba(248, 248, 244, 0.45)');
    grad.addColorStop(0.5, 'rgba(248, 248, 244, 0.16)');
    grad.addColorStop(1, 'rgba(248, 248, 244, 0)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 128, 128);
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
