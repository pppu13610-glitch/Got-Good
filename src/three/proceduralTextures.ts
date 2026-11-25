import * as THREE from 'three';

export function createWoodGrainTexture(
  baseHex: string,
  grainHex: string,
  maxAnisotropy: number,
): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d');

  if (ctx) {
    ctx.fillStyle = baseHex;
    ctx.fillRect(0, 0, 512, 512);

    ctx.strokeStyle = grainHex;
    for (let i = 0; i < 90; i++) {
      ctx.globalAlpha = 0.08 + (i % 5) * 0.03;
      ctx.lineWidth = 1 + (i % 3);
      ctx.beginPath();
      const yBase = (i / 90) * 512;
      ctx.moveTo(0, yBase);
      for (let x = 0; x <= 512; x += 32) {
        const wave = Math.sin(x * 0.02 + i * 0.7) * 5;
        ctx.lineTo(x, yBase + wave);
      }
      ctx.stroke();
    }
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.anisotropy = Math.min(8, maxAnisotropy);
  return texture;
}

export function createWovenMatTexture(maxAnisotropy: number): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d');

  if (ctx) {
    ctx.fillStyle = '#B8A88A';
    ctx.fillRect(0, 0, 256, 256);

    for (let y = 0; y < 256; y += 8) {
      ctx.fillStyle = y % 16 === 0 ? '#AE9D7E' : '#C2B396';
      ctx.fillRect(0, y, 256, 6);
    }

    ctx.fillStyle = 'rgba(72, 58, 40, 0.08)';
    for (let x = 0; x < 256; x += 16) {
      ctx.fillRect(x, 0, 2, 256);
    }
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(3, 2);
  texture.anisotropy = Math.min(8, maxAnisotropy);
  return texture;
}

export function createCeramicSpeckleTexture(
  baseHex: string,
  speckHex: string,
  maxAnisotropy: number,
): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d');

  if (ctx) {
    ctx.fillStyle = baseHex;
    ctx.fillRect(0, 0, 256, 256);

    // Subtle organic stoneware speckles
    let seed = 42;
    const rand = () => {
      seed = (seed * 1664525 + 1013904223) % 4294967296;
      return seed / 4294967296;
    };

    ctx.fillStyle = speckHex;
    for (let i = 0; i < 420; i++) {
      const x = rand() * 256;
      const y = rand() * 256;
      const r = 0.5 + rand() * 1.4;
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
  texture.anisotropy = Math.min(4, maxAnisotropy);
  return texture;
}

export function createContactShadowTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 128;
  canvas.height = 128;
  const ctx = canvas.getContext('2d');

  if (ctx) {
    const grad = ctx.createRadialGradient(64, 64, 8, 64, 64, 62);
    grad.addColorStop(0, 'rgba(18, 22, 18, 0.55)');
    grad.addColorStop(0.55, 'rgba(18, 22, 18, 0.22)');
    grad.addColorStop(1, 'rgba(18, 22, 18, 0)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 128, 128);
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

export function createSteamPuffTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 128;
  canvas.height = 128;
  const ctx = canvas.getContext('2d');

  if (ctx) {
    const grad = ctx.createRadialGradient(64, 64, 4, 64, 64, 58);
    grad.addColorStop(0, 'rgba(248, 248, 244, 0.45)');
    grad.addColorStop(0.5, 'rgba(248, 248, 244, 0.16)');
    grad.addColorStop(1, 'rgba(248, 248, 244, 0)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 128, 128);
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}
