import * as THREE from 'three';

export interface HumanoidBoneSet {
  root: THREE.Bone;
  hips: THREE.Bone;
  spine: THREE.Bone;
  chest: THREE.Bone;
  neck: THREE.Bone;
  head: THREE.Bone;
  leftShoulder: THREE.Bone;
  leftElbow: THREE.Bone;
  leftWrist: THREE.Bone;
  rightShoulder: THREE.Bone;
  rightElbow: THREE.Bone;
  rightWrist: THREE.Bone;
  leftHip: THREE.Bone;
  leftKnee: THREE.Bone;
  leftAnkle: THREE.Bone;
  rightHip: THREE.Bone;
  rightKnee: THREE.Bone;
  rightAnkle: THREE.Bone;
  all: THREE.Bone[];
  skeleton: THREE.Skeleton;
  restHipsY: number;
}

export const BONE = {
  ROOT: 0,
  HIPS: 1,
  SPINE: 2,
  CHEST: 3,
  NECK: 4,
  HEAD: 5,
  L_SHOULDER: 6,
  L_ELBOW: 7,
  L_WRIST: 8,
  R_SHOULDER: 9,
  R_ELBOW: 10,
  R_WRIST: 11,
  L_HIP: 12,
  L_KNEE: 13,
  L_ANKLE: 14,
  R_HIP: 15,
  R_KNEE: 16,
  R_ANKLE: 17,
} as const;

export interface LoftRing {
  center: [number, number, number];
  rx: number;
  rz: number;
  /** Optional custom radial scale factors around ring (e.g. chest contouring) */
  frontScale?: number;
  backScale?: number;
  /** 0 = ellipse, 0.35-0.55 = tailored squircle with flatter chest/back/sides */
  squareness?: number;
  /** Bone pair & weights [boneA, weightA, boneB, weightB] */
  weights: [number, number, number, number];
  v?: number;
}

export interface LoftMaterialSection {
  material: THREE.Material;
  rings: LoftRing[];
}

/**
 * Builds the standard 18-bone upright humanoid skeleton in rest pose (feet at y = 0).
 * Arms hang naturally ~16 deg from vertical so shoulder & armpit skinning stays seamless.
 */
export function createHumanoidSkeleton(heightScale = 1): HumanoidBoneSet {
  const s = heightScale;
  const root = new THREE.Bone();
  root.position.set(0, 0, 0);

  const hips = new THREE.Bone();
  hips.position.set(0, 0.80 * s, 0);
  root.add(hips);

  const spine = new THREE.Bone();
  spine.position.set(0, 0.14 * s, 0);
  hips.add(spine);

  const chest = new THREE.Bone();
  chest.position.set(0, 0.18 * s, 0);
  spine.add(chest);

  const neck = new THREE.Bone();
  neck.position.set(0, 0.17 * s, 0);
  chest.add(neck);

  const head = new THREE.Bone();
  head.position.set(0, 0.09 * s, 0);
  neck.add(head);

  const leftShoulder = new THREE.Bone();
  leftShoulder.position.set(-0.145 * s, 0.115 * s, 0);
  chest.add(leftShoulder);

  const leftElbow = new THREE.Bone();
  leftElbow.position.set(-0.075 * s, -0.22 * s, 0.01 * s);
  leftShoulder.add(leftElbow);

  const leftWrist = new THREE.Bone();
  leftWrist.position.set(-0.048 * s, -0.20 * s, 0.025 * s);
  leftElbow.add(leftWrist);

  const rightShoulder = new THREE.Bone();
  rightShoulder.position.set(0.145 * s, 0.115 * s, 0);
  chest.add(rightShoulder);

  const rightElbow = new THREE.Bone();
  rightElbow.position.set(0.075 * s, -0.22 * s, 0.01 * s);
  rightShoulder.add(rightElbow);

  const rightWrist = new THREE.Bone();
  rightWrist.position.set(0.048 * s, -0.20 * s, 0.025 * s);
  rightElbow.add(rightWrist);

  const leftHip = new THREE.Bone();
  leftHip.position.set(-0.088 * s, -0.02 * s, 0);
  hips.add(leftHip);

  const leftKnee = new THREE.Bone();
  leftKnee.position.set(0, -0.37 * s, 0.008 * s);
  leftHip.add(leftKnee);

  const leftAnkle = new THREE.Bone();
  leftAnkle.position.set(0, -0.35 * s, -0.008 * s);
  leftKnee.add(leftAnkle);

  const rightHip = new THREE.Bone();
  rightHip.position.set(0.088 * s, -0.02 * s, 0);
  hips.add(rightHip);

  const rightKnee = new THREE.Bone();
  rightKnee.position.set(0, -0.37 * s, 0.008 * s);
  rightHip.add(rightKnee);

  const rightAnkle = new THREE.Bone();
  rightAnkle.position.set(0, -0.35 * s, -0.008 * s);
  rightKnee.add(rightAnkle);

  const all: THREE.Bone[] = [
    root,
    hips,
    spine,
    chest,
    neck,
    head,
    leftShoulder,
    leftElbow,
    leftWrist,
    rightShoulder,
    rightElbow,
    rightWrist,
    leftHip,
    leftKnee,
    leftAnkle,
    rightHip,
    rightKnee,
    rightAnkle,
  ];

  root.updateMatrixWorld(true);
  const skeleton = new THREE.Skeleton(all);

  return {
    root,
    hips,
    spine,
    chest,
    neck,
    head,
    leftShoulder,
    leftElbow,
    leftWrist,
    rightShoulder,
    rightElbow,
    rightWrist,
    leftHip,
    leftKnee,
    leftAnkle,
    rightHip,
    rightKnee,
    rightAnkle,
    all,
    skeleton,
    restHipsY: 0.80 * s,
  };
}

const _pCur = new THREE.Vector3();
const _pPrev = new THREE.Vector3();
const _pNext = new THREE.Vector3();
const _tangent = new THREE.Vector3();
const _basisU = new THREE.Vector3();
const _basisV = new THREE.Vector3();
const _worldUp = new THREE.Vector3(0, 1, 0);
const _worldFwd = new THREE.Vector3(0, 0, 1);

function pushRingVertices(
  ring: LoftRing,
  tangent: THREE.Vector3,
  radialSeg: number,
  arcStart: number,
  arcEnd: number,
  defaultV: number,
  positions: number[],
  uvs: number[],
  skinIndices: number[],
  skinWeights: number[],
) {
  if (Math.abs(tangent.dot(_worldFwd)) < 0.92) {
    _basisU.crossVectors(_worldFwd, tangent).normalize();
  } else {
    _basisU.set(1, 0, 0);
  }
  _basisV.crossVectors(tangent, _basisU).normalize();

  const [b0, w0Raw, b1, w1Raw] = ring.weights;
  const wSum = w0Raw + w1Raw || 1;
  const w0 = w0Raw / wSum;
  const w1 = w1Raw / wSum;
  const vCoord = ring.v ?? defaultV;
  const cols = radialSeg + 1;

  const squirclePow = ring.squareness ? 2 / (2 + 1.5 * ring.squareness) : 1;

  for (let i = 0; i < cols; i++) {
    const frac = i / radialSeg;
    const theta = arcStart + frac * (arcEnd - arcStart);
    const rawCos = Math.cos(theta);
    const rawSin = Math.sin(theta);
    const cosT =
      squirclePow === 1
        ? rawCos
        : Math.sign(rawCos) * Math.pow(Math.abs(rawCos), squirclePow);
    const sinT =
      squirclePow === 1
        ? rawSin
        : Math.sign(rawSin) * Math.pow(Math.abs(rawSin), squirclePow);

    let rzMod = ring.rz;
    if (sinT < 0 && ring.frontScale) rzMod *= ring.frontScale;
    if (sinT > 0 && ring.backScale) rzMod *= ring.backScale;

    const vx =
      ring.center[0] + _basisU.x * (ring.rx * cosT) + _basisV.x * (rzMod * sinT);
    const vy =
      ring.center[1] + _basisU.y * (ring.rx * cosT) + _basisV.y * (rzMod * sinT);
    const vz =
      ring.center[2] + _basisU.z * (ring.rx * cosT) + _basisV.z * (rzMod * sinT);

    positions.push(vx, vy, vz);
    uvs.push(frac, vCoord);
    skinIndices.push(b0, b1, 0, 0);
    skinWeights.push(w0, w1, 0, 0);
  }
}

function computeRingTangent(rings: LoftRing[], r: number): THREE.Vector3 {
  const ring = rings[r];
  _pCur.set(ring.center[0], ring.center[1], ring.center[2]);

  if (r === 0) {
    _pNext.set(rings[1].center[0], rings[1].center[1], rings[1].center[2]);
    _tangent.subVectors(_pNext, _pCur);
  } else if (r === rings.length - 1) {
    _pPrev.set(
      rings[r - 1].center[0],
      rings[r - 1].center[1],
      rings[r - 1].center[2],
    );
    _tangent.subVectors(_pCur, _pPrev);
  } else {
    _pPrev.set(
      rings[r - 1].center[0],
      rings[r - 1].center[1],
      rings[r - 1].center[2],
    );
    _pNext.set(
      rings[r + 1].center[0],
      rings[r + 1].center[1],
      rings[r + 1].center[2],
    );
    _tangent.subVectors(_pNext, _pPrev);
  }

  if (_tangent.lengthSq() < 1e-8) {
    _tangent.copy(_worldUp);
  } else {
    _tangent.normalize();
  }
  return _tangent;
}

/**
 * Generates a continuous, zero-seam indexed SkinnedMesh along ordered cross-section rings.
 * Outward triangle winding is guaranteed by maintaining a right-handed (tangent, U, V) frame.
 */
export function buildLoftedSkinnedMesh(
  rings: LoftRing[],
  radialSeg: number,
  material: THREE.Material,
  skeleton: THREE.Skeleton,
  options: {
    capStart?: boolean;
    capEnd?: boolean;
    castShadow?: boolean;
    receiveShadow?: boolean;
    arcStart?: number;
    arcEnd?: number;
  } = {},
): THREE.SkinnedMesh {
  const {
    capStart = false,
    capEnd = false,
    castShadow = false,
    receiveShadow = false,
    arcStart = 0,
    arcEnd = Math.PI * 2,
  } = options;

  const isClosedLoop = Math.abs(arcEnd - arcStart - Math.PI * 2) < 0.001;
  const cols = radialSeg + 1;
  const ringCount = rings.length;

  const positions: number[] = [];
  const uvs: number[] = [];
  const skinIndices: number[] = [];
  const skinWeights: number[] = [];
  const indices: number[] = [];

  for (let r = 0; r < ringCount; r++) {
    const tan = computeRingTangent(rings, r);
    pushRingVertices(
      rings[r],
      tan,
      radialSeg,
      arcStart,
      arcEnd,
      r / Math.max(1, ringCount - 1),
      positions,
      uvs,
      skinIndices,
      skinWeights,
    );
  }

  for (let r = 0; r < ringCount - 1; r++) {
    for (let i = 0; i < radialSeg; i++) {
      const a = r * cols + i;
      const b = r * cols + i + 1;
      const c = (r + 1) * cols + i + 1;
      const d = (r + 1) * cols + i;
      indices.push(a, b, c, a, c, d);
    }
  }

  if (isClosedLoop && capStart) {
    const first = rings[0];
    const centerIdx = positions.length / 3;
    const [b0, w0Raw, b1, w1Raw] = first.weights;
    const wSum = w0Raw + w1Raw || 1;
    positions.push(first.center[0], first.center[1], first.center[2]);
    uvs.push(0.5, 0);
    skinIndices.push(b0, b1, 0, 0);
    skinWeights.push(w0Raw / wSum, w1Raw / wSum, 0, 0);
    for (let i = 0; i < radialSeg; i++) {
      indices.push(centerIdx, i + 1, i);
    }
  }

  if (isClosedLoop && capEnd) {
    const last = rings[ringCount - 1];
    const base = (ringCount - 1) * cols;
    const centerIdx = positions.length / 3;
    const [b0, w0Raw, b1, w1Raw] = last.weights;
    const wSum = w0Raw + w1Raw || 1;
    positions.push(last.center[0], last.center[1], last.center[2]);
    uvs.push(0.5, 1);
    skinIndices.push(b0, b1, 0, 0);
    skinWeights.push(w0Raw / wSum, w1Raw / wSum, 0, 0);
    for (let i = 0; i < radialSeg; i++) {
      indices.push(centerIdx, base + i, base + i + 1);
    }
  }

  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geo.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
  geo.setAttribute('skinIndex', new THREE.Uint16BufferAttribute(skinIndices, 4));
  geo.setAttribute('skinWeight', new THREE.Float32BufferAttribute(skinWeights, 4));
  geo.setIndex(indices);
  geo.computeVertexNormals();

  if (isClosedLoop) {
    const normAttr = geo.getAttribute('normal') as THREE.BufferAttribute;
    for (let r = 0; r < ringCount; r++) {
      const idx0 = r * cols;
      const idxN = r * cols + radialSeg;
      const nx = (normAttr.getX(idx0) + normAttr.getX(idxN)) * 0.5;
      const ny = (normAttr.getY(idx0) + normAttr.getY(idxN)) * 0.5;
      const nz = (normAttr.getZ(idx0) + normAttr.getZ(idxN)) * 0.5;
      const len = Math.hypot(nx, ny, nz) || 1;
      normAttr.setXYZ(idx0, nx / len, ny / len, nz / len);
      normAttr.setXYZ(idxN, nx / len, ny / len, nz / len);
    }
    normAttr.needsUpdate = true;
  }

  const mesh = new THREE.SkinnedMesh(geo, material);
  mesh.castShadow = castShadow;
  mesh.receiveShadow = receiveShadow;
  mesh.frustumCulled = false;
  mesh.bind(skeleton);
  return mesh;
}

/**
 * Builds ONE single continuous multi-material SkinnedMesh across multiple garment/skin
 * sections (e.g., Sleeve -> Cuff -> Forearm -> Hand, or Thigh -> Stocking -> Boot).
 * Adjacent sections duplicate their exact shared boundary ring and weld normals across
 * the transition so there is literally ZERO gap, ZERO overlap flicker, and ZERO crease seam!
 */
export function buildMultiMaterialLoftedSkinnedMesh(
  sections: LoftMaterialSection[],
  radialSeg: number,
  skeleton: THREE.Skeleton,
  options: {
    capStart?: boolean;
    capEnd?: boolean;
    castShadow?: boolean;
    receiveShadow?: boolean;
  } = {},
): THREE.SkinnedMesh {
  const {
    capStart = false,
    capEnd = false,
    castShadow = false,
    receiveShadow = false,
  } = options;

  const cols = radialSeg + 1;
  const positions: number[] = [];
  const uvs: number[] = [];
  const skinIndices: number[] = [];
  const skinWeights: number[] = [];
  const indices: number[] = [];
  const materials: THREE.Material[] = [];

  // Flatten all rings to compute smooth continuous tangents across section boundaries!
  const allRingsForTangent: LoftRing[] = [];
  const sectionOffsets: {startRingIdx: number; ringCount: number}[] = [];

  for (let sIdx = 0; sIdx < sections.length; sIdx++) {
    const sec = sections[sIdx];
    const startRingIdx = allRingsForTangent.length;
    for (let r = 0; r < sec.rings.length; r++) {
      // Skip duplicated boundary ring when computing continuous spine tangent
      if (sIdx > 0 && r === 0) continue;
      allRingsForTangent.push(sec.rings[r]);
    }
    sectionOffsets.push({startRingIdx, ringCount: sec.rings.length});
  }

  const geo = new THREE.BufferGeometry();
  const ringVertexStart: number[] = [];
  const boundaryPairs: [number, number][] = [];

  let globalRingCounter = 0;
  for (let sIdx = 0; sIdx < sections.length; sIdx++) {
    const sec = sections[sIdx];
    const matIdx = materials.length;
    materials.push(sec.material);

    const groupIndexStart = indices.length;
    const secBaseRing = ringVertexStart.length;

    for (let r = 0; r < sec.rings.length; r++) {
      const tangentLookupIdx =
        sIdx > 0 && r === 0
          ? sectionOffsets[sIdx].startRingIdx - 1
          : globalRingCounter++;

      const tan = computeRingTangent(
        allRingsForTangent,
        Math.min(allRingsForTangent.length - 1, Math.max(0, tangentLookupIdx)),
      );
      const startVertex = positions.length / 3;
      ringVertexStart.push(startVertex);

      pushRingVertices(
        sec.rings[r],
        tan,
        radialSeg,
        0,
        Math.PI * 2,
        r / Math.max(1, sec.rings.length - 1),
        positions,
        uvs,
        skinIndices,
        skinWeights,
      );

      if (sIdx > 0 && r === 0) {
        boundaryPairs.push([
          ringVertexStart[secBaseRing - 1],
          startVertex,
        ]);
      }
    }

    for (let r = 0; r < sec.rings.length - 1; r++) {
      const rowA = ringVertexStart[secBaseRing + r];
      const rowB = ringVertexStart[secBaseRing + r + 1];
      for (let i = 0; i < radialSeg; i++) {
        const a = rowA + i;
        const b = rowA + i + 1;
        const c = rowB + i + 1;
        const d = rowB + i;
        indices.push(a, b, c, a, c, d);
      }
    }

    if (sIdx === 0 && capStart) {
      const first = sec.rings[0];
      const centerIdx = positions.length / 3;
      const [b0, w0Raw, b1, w1Raw] = first.weights;
      const wSum = w0Raw + w1Raw || 1;
      positions.push(first.center[0], first.center[1], first.center[2]);
      uvs.push(0.5, 0);
      skinIndices.push(b0, b1, 0, 0);
      skinWeights.push(w0Raw / wSum, w1Raw / wSum, 0, 0);
      for (let i = 0; i < radialSeg; i++) {
        indices.push(centerIdx, i + 1, i);
      }
    }

    if (sIdx === sections.length - 1 && capEnd) {
      const last = sec.rings[sec.rings.length - 1];
      const base = ringVertexStart[ringVertexStart.length - 1];
      const centerIdx = positions.length / 3;
      const [b0, w0Raw, b1, w1Raw] = last.weights;
      const wSum = w0Raw + w1Raw || 1;
      positions.push(last.center[0], last.center[1], last.center[2]);
      uvs.push(0.5, 1);
      skinIndices.push(b0, b1, 0, 0);
      skinWeights.push(w0Raw / wSum, w1Raw / wSum, 0, 0);
      for (let i = 0; i < radialSeg; i++) {
        indices.push(centerIdx, base + i, base + i + 1);
      }
    }

    geo.addGroup(groupIndexStart, indices.length - groupIndexStart, matIdx);
  }

  geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geo.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
  geo.setAttribute('skinIndex', new THREE.Uint16BufferAttribute(skinIndices, 4));
  geo.setAttribute('skinWeight', new THREE.Float32BufferAttribute(skinWeights, 4));
  geo.setIndex(indices);
  geo.computeVertexNormals();

  // Weld seam normals around each closed ring AND across adjacent material boundary rings!
  const normAttr = geo.getAttribute('normal') as THREE.BufferAttribute;
  for (const rowStart of ringVertexStart) {
    const idx0 = rowStart;
    const idxN = rowStart + radialSeg;
    const nx = (normAttr.getX(idx0) + normAttr.getX(idxN)) * 0.5;
    const ny = (normAttr.getY(idx0) + normAttr.getY(idxN)) * 0.5;
    const nz = (normAttr.getZ(idx0) + normAttr.getZ(idxN)) * 0.5;
    const len = Math.hypot(nx, ny, nz) || 1;
    normAttr.setXYZ(idx0, nx / len, ny / len, nz / len);
    normAttr.setXYZ(idxN, nx / len, ny / len, nz / len);
  }
  for (const [prevRow, nextRow] of boundaryPairs) {
    for (let i = 0; i < cols; i++) {
      const a = prevRow + i;
      const b = nextRow + i;
      const nx = (normAttr.getX(a) + normAttr.getX(b)) * 0.5;
      const ny = (normAttr.getY(a) + normAttr.getY(b)) * 0.5;
      const nz = (normAttr.getZ(a) + normAttr.getZ(b)) * 0.5;
      const len = Math.hypot(nx, ny, nz) || 1;
      normAttr.setXYZ(a, nx / len, ny / len, nz / len);
      normAttr.setXYZ(b, nx / len, ny / len, nz / len);
    }
  }
  normAttr.needsUpdate = true;

  const mesh = new THREE.SkinnedMesh(geo, materials);
  mesh.castShadow = castShadow;
  mesh.receiveShadow = receiveShadow;
  mesh.frustumCulled = false;
  mesh.bind(skeleton);
  return mesh;
}

/**
 * Builds an anatomically sculpted humanoid head mesh with:
 * - Smooth jawline & chin blending naturally into the neck
 * - Sculpted 3D nose bridge & tip
 * - Subtle brow ridge, orbital eye-socket depth, and soft cheekbone fullness
 * UV seam cleanly tucked at -Z.
 */
export function buildSculptedHeadSkinnedMesh(
  centerY: number,
  radius: number,
  seg: number,
  material: THREE.Material,
  skeleton: THREE.Skeleton,
  options: {
    jawTaper?: number;
    faceFlatten?: number;
    castShadow?: boolean;
  } = {},
): THREE.SkinnedMesh {
  const {jawTaper = 0.72, faceFlatten = 0.88, castShadow = false} = options;
  const latSeg = Math.max(18, seg + 6);
  const lonSeg = Math.max(24, seg + 10);
  const cols = lonSeg + 1;

  const positions: number[] = [];
  const uvs: number[] = [];
  const skinIndices: number[] = [];
  const skinWeights: number[] = [];
  const indices: number[] = [];

  for (let lat = 0; lat <= latSeg; lat++) {
    const vNorm = lat / latSeg; // 0 = bottom chin/neck root, 1 = top crown
    const theta = (1 - vNorm) * Math.PI;
    const sinT = Math.sin(theta);
    const cosT = Math.cos(theta);

    const lowerMask = vNorm < 0.45 ? 1 - (0.45 - vNorm) / 0.45 : 1;
    const widthCurve = THREE.MathUtils.lerp(jawTaper, 1.0, Math.pow(lowerMask, 0.72));
    const depthCurve = THREE.MathUtils.lerp(jawTaper * 0.9, 1.0, Math.pow(lowerMask, 0.68));

    for (let lon = 0; lon <= lonSeg; lon++) {
      const uNorm = lon / lonSeg;
      const phi = uNorm * Math.PI * 2;
      const rawX = -Math.sin(phi) * sinT;
      const rawZ = -Math.cos(phi) * sinT;

      let x = rawX * radius * 0.95 * widthCurve;
      let z = rawZ * radius * 0.96 * depthCurve;
      if (rawZ > 0) {
        z *= faceFlatten;

        // Angle from dead-center front (+Z is phi = Math.PI)
        const frontAng = Math.abs(phi - Math.PI);

        // 1. Subtle chin / lower lip curve
        if (vNorm > 0.08 && vNorm < 0.30) {
          const chinArch = Math.sin(((vNorm - 0.08) / 0.22) * Math.PI);
          const chinMask = Math.exp(-Math.pow(frontAng / 0.55, 2));
          z += chinArch * chinMask * radius * 0.085 * rawZ;
        }

        // 2. Gentle brow ridge & cheek fullness
        if (vNorm > 0.56 && vNorm < 0.68) {
          const browMask = Math.sin(((vNorm - 0.56) / 0.12) * Math.PI);
          const arch = Math.exp(-Math.pow((frontAng - 0.32) / 0.35, 2));
          z += browMask * arch * radius * 0.032;
        }

        // 3. Soft orbital eye-socket recess
        if (vNorm > 0.47 && vNorm < 0.58) {
          const eyeV = Math.sin(((vNorm - 0.47) / 0.11) * Math.PI);
          const eyeH = Math.exp(-Math.pow((frontAng - 0.34) / 0.16, 2));
          z -= eyeV * eyeH * radius * 0.028;
        }

        // 4. Cheekbone contour
        if (vNorm > 0.34 && vNorm < 0.47) {
          const cheekV = Math.sin(((vNorm - 0.34) / 0.13) * Math.PI);
          const cheekH = Math.exp(-Math.pow((frontAng - 0.56) / 0.24, 2));
          z += cheekV * cheekH * radius * 0.038;
        }

        // 5. Sculpted 3D nose bridge & tip
        if (vNorm > 0.36 && vNorm < 0.57 && frontAng < 0.26) {
          const noseT = (vNorm - 0.36) / 0.21; // 0 = base, 1 = bridge top
          const noseH = Math.exp(-Math.pow(frontAng / 0.105, 2));
          const noseProfile =
            noseT < 0.28
              ? Math.sin((noseT / 0.28) * (Math.PI * 0.5))
              : THREE.MathUtils.lerp(1.0, 0.22, (noseT - 0.28) / 0.72);
          z += noseH * noseProfile * radius * 0.115;
        }
      }
      const y = centerY + cosT * radius * 1.06;

      positions.push(x, y, z);
      uvs.push(uNorm, vNorm);
      const headW = vNorm < 0.14 ? THREE.MathUtils.lerp(0.45, 1.0, vNorm / 0.14) : 1.0;
      skinIndices.push(BONE.HEAD, BONE.NECK, 0, 0);
      skinWeights.push(headW, 1 - headW, 0, 0);
    }
  }

  for (let lat = 0; lat < latSeg; lat++) {
    for (let lon = 0; lon < lonSeg; lon++) {
      const a = lat * cols + lon;
      const b = lat * cols + lon + 1;
      const c = (lat + 1) * cols + lon + 1;
      const d = (lat + 1) * cols + lon;
      indices.push(a, b, c, a, c, d);
    }
  }

  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geo.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
  geo.setAttribute('skinIndex', new THREE.Uint16BufferAttribute(skinIndices, 4));
  geo.setAttribute('skinWeight', new THREE.Float32BufferAttribute(skinWeights, 4));
  geo.setIndex(indices);
  geo.computeVertexNormals();

  const normAttr = geo.getAttribute('normal') as THREE.BufferAttribute;
  for (let lat = 0; lat <= latSeg; lat++) {
    const idx0 = lat * cols;
    const idxN = lat * cols + lonSeg;
    const nx = (normAttr.getX(idx0) + normAttr.getX(idxN)) * 0.5;
    const ny = (normAttr.getY(idx0) + normAttr.getY(idxN)) * 0.5;
    const nz = (normAttr.getZ(idx0) + normAttr.getZ(idxN)) * 0.5;
    const len = Math.hypot(nx, ny, nz) || 1;
    normAttr.setXYZ(idx0, nx / len, ny / len, nz / len);
    normAttr.setXYZ(idxN, nx / len, ny / len, nz / len);
  }
  normAttr.needsUpdate = true;

  const mesh = new THREE.SkinnedMesh(geo, material);
  mesh.castShadow = castShadow;
  mesh.frustumCulled = false;
  mesh.bind(skeleton);
  return mesh;
}

/**
 * Builds sculpted left & right anatomical outer ears smoothly bound to BONE.HEAD.
 */
export function buildAnatomicalEarsSkinnedMesh(
  headCenterY: number,
  headRadius: number,
  material: THREE.Material,
  skeleton: THREE.Skeleton,
  castShadow = false,
): THREE.SkinnedMesh[] {
  const ears: THREE.SkinnedMesh[] = [];
  for (const side of [-1, 1] as const) {
    ears.push(
      buildTaperedCurveSkinnedMesh(
        [
          [side * headRadius * 0.90, headCenterY - headRadius * 0.14, -headRadius * 0.04],
          [side * headRadius * 1.00, headCenterY + headRadius * 0.01, -headRadius * 0.07],
          [side * headRadius * 0.96, headCenterY + headRadius * 0.15, -headRadius * 0.05],
          [side * headRadius * 0.89, headCenterY + headRadius * 0.10, 0.0],
        ],
        [headRadius * 0.09, headRadius * 0.13, headRadius * 0.11, headRadius * 0.06],
        0.55,
        1.15,
        8,
        BONE.HEAD,
        material,
        skeleton,
        castShadow,
      ),
    );
  }
  return ears;
}

/**
 * Builds an anatomical opposable thumb curved cleanly from the palm base, bound to wristBone.
 */
export function buildSculptedThumbSkinnedMesh(
  side: -1 | 1,
  s: number,
  wristPos: [number, number, number],
  wristBone: number,
  material: THREE.Material,
  skeleton: THREE.Skeleton,
  scale = 1.0,
  castShadow = false,
): THREE.SkinnedMesh {
  const [wx, wy, wz] = wristPos;
  return buildTaperedCurveSkinnedMesh(
    [
      [wx - side * 0.008 * s * scale, wy - 0.018 * s * scale, wz + 0.012 * s * scale],
      [wx - side * 0.018 * s * scale, wy - 0.048 * s * scale, wz + 0.026 * s * scale],
      [wx - side * 0.015 * s * scale, wy - 0.076 * s * scale, wz + 0.030 * s * scale],
    ],
    [0.013 * s * scale, 0.011 * s * scale, 0.008 * s * scale],
    0.95,
    1.05,
    7,
    wristBone,
    material,
    skeleton,
    castShadow,
  );
}

/**
 * Contoured scalp hair dome hugging the upper cranium & nape with sculpted hairline
 * (temple sweep + lifted forehead arch + low nape coverage), UV-mapped for vertical hair sheen!
 */
export function buildHairCapSkinnedMesh(
  centerY: number,
  radius: number,
  seg: number,
  material: THREE.Material,
  skeleton: THREE.Skeleton,
  options: {
    backDrop?: number;
    castShadow?: boolean;
  } = {},
): THREE.SkinnedMesh {
  const {backDrop = 0.25, castShadow = false} = options;
  const latSeg = Math.max(10, Math.round(seg * 0.75));
  const lonSeg = Math.max(16, seg + 4);
  const cols = lonSeg + 1;

  const positions: number[] = [];
  const uvs: number[] = [];
  const skinIndices: number[] = [];
  const skinWeights: number[] = [];
  const indices: number[] = [];

  for (let lat = 0; lat <= latSeg; lat++) {
    const vNorm = lat / latSeg; // 0 = hairline rim, 1 = crown center
    for (let lon = 0; lon <= lonSeg; lon++) {
      const uNorm = lon / lonSeg;
      const phi = uNorm * Math.PI * 2; // 0 = back (-Z), PI = front (+Z)
      const isFront = Math.cos(phi) < 0 ? -Math.cos(phi) : 0; // 1 at forehead, 0 at back
      const isBack = Math.cos(phi) > 0 ? Math.cos(phi) : 0; // 1 at back, 0 at front

      // Forehead sits higher (~ 0.48 PI from crown), back drops lower down nape!
      const maxTheta = THREE.MathUtils.lerp(
        Math.PI * (0.64 + backDrop * 0.25),
        Math.PI * 0.44,
        Math.pow(isFront, 0.8),
      );
      const theta = (1 - vNorm) * maxTheta;
      const sinT = Math.sin(theta);
      const cosT = Math.cos(theta);

      const rawX = -Math.sin(phi) * sinT;
      const rawZ = -Math.cos(phi) * sinT;

      // Extra plush volume at crown & back-of-head
      const shellR = radius * (1.06 + (1 - vNorm) * 0.04 * isBack + vNorm * 0.03);
      const x = rawX * shellR * 0.99;
      const z = rawZ * shellR * 0.96;
      const y = centerY + cosT * shellR * 1.07 + 0.01 * radius;

      positions.push(x, y, z);
      uvs.push(uNorm * 2, vNorm);
      skinIndices.push(BONE.HEAD, 0, 0, 0);
      skinWeights.push(1, 0, 0, 0);
    }
  }

  for (let lat = 0; lat < latSeg; lat++) {
    for (let lon = 0; lon < lonSeg; lon++) {
      const a = lat * cols + lon;
      const b = lat * cols + lon + 1;
      const c = (lat + 1) * cols + lon + 1;
      const d = (lat + 1) * cols + lon;
      indices.push(a, b, c, a, c, d);
    }
  }

  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geo.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
  geo.setAttribute('skinIndex', new THREE.Uint16BufferAttribute(skinIndices, 4));
  geo.setAttribute('skinWeight', new THREE.Float32BufferAttribute(skinWeights, 4));
  geo.setIndex(indices);
  geo.computeVertexNormals();

  const normAttr = geo.getAttribute('normal') as THREE.BufferAttribute;
  for (let lat = 0; lat <= latSeg; lat++) {
    const idx0 = lat * cols;
    const idxN = lat * cols + lonSeg;
    const nx = (normAttr.getX(idx0) + normAttr.getX(idxN)) * 0.5;
    const ny = (normAttr.getY(idx0) + normAttr.getY(idxN)) * 0.5;
    const nz = (normAttr.getZ(idx0) + normAttr.getZ(idxN)) * 0.5;
    const len = Math.hypot(nx, ny, nz) || 1;
    normAttr.setXYZ(idx0, nx / len, ny / len, nz / len);
    normAttr.setXYZ(idxN, nx / len, ny / len, nz / len);
  }
  normAttr.needsUpdate = true;

  const mesh = new THREE.SkinnedMesh(geo, material);
  mesh.castShadow = castShadow;
  mesh.frustumCulled = false;
  mesh.bind(skeleton);
  return mesh;
}

/**
 * Builds a sleek, stylized anime/sculpted hair lock ribbon (pointed tip, diamond-crescent profile,
 * inward curl hugging face/shoulders) rather than a round sausage tube!
 * Can blend smoothly between HEAD and CHEST/NECK for long flowing back locks.
 */
export function buildHairRibbonSkinnedMesh(
  points: [number, number, number][],
  widths: number[],
  thicknesses: number[],
  material: THREE.Material,
  skeleton: THREE.Skeleton,
  options: {
    followChestLower?: boolean;
    curlRoll?: number;
    castShadow?: boolean;
    radialSeg?: number;
  } = {},
): THREE.SkinnedMesh {
  const {
    followChestLower = false,
    curlRoll = 0,
    castShadow = false,
    radialSeg = 8,
  } = options;
  const curve = new THREE.CatmullRomCurve3(
    points.map((p) => new THREE.Vector3(p[0], p[1], p[2])),
  );
  const steps = Math.max(points.length * 4, 12);
  const cols = radialSeg + 1;

  const positions: number[] = [];
  const uvs: number[] = [];
  const skinIndices: number[] = [];
  const skinWeights: number[] = [];
  const indices: number[] = [];

  for (let s = 0; s <= steps; s++) {
    const t = s / steps;
    const pt = curve.getPoint(t);
    const tangent = curve.getTangent(t).normalize();

    const wFloat = t * (widths.length - 1);
    const w0 = Math.floor(wFloat);
    const w1 = Math.min(widths.length - 1, w0 + 1);
    const halfW = Math.max(0.001, THREE.MathUtils.lerp(widths[w0], widths[w1], wFloat - w0));

    const thFloat = t * (thicknesses.length - 1);
    const th0 = Math.floor(thFloat);
    const th1 = Math.min(thicknesses.length - 1, th0 + 1);
    const halfTh = Math.max(
      0.001,
      THREE.MathUtils.lerp(thicknesses[th0], thicknesses[th1], thFloat - th0),
    );

    // Orient ribbon flat width tangentially around head center (outward radial = normalize(pt.x, 0, pt.z))
    _pPrev.set(pt.x, 0, pt.z);
    if (_pPrev.lengthSq() < 1e-5) _pPrev.set(0, 0, -1);
    _pPrev.normalize(); // outward radial normal
    _basisU.crossVectors(_pPrev, tangent).normalize(); // width across strand
    if (Math.abs(curlRoll) > 0.001) {
      _basisU.applyAxisAngle(tangent, curlRoll);
    }
    _basisV.crossVectors(tangent, _basisU).normalize(); // outward thickness

    // Smoothly blend long back hair ends subtly between HEAD and CHEST so shoulders stay tidy
    const chestBlend = followChestLower ? Math.max(0, (t - 0.45) * 0.45) : 0;
    const headW = 1 - chestBlend;

    for (let i = 0; i < cols; i++) {
      const frac = i / radialSeg;
      const theta = frac * Math.PI * 2;
      const cosT = Math.cos(theta);
      const sinT = Math.sin(theta);

      // Slight crescent cupping (edges curve softly inward toward skull)
      const cupOffset = -cosT * cosT * halfTh * 0.35;

      const vx =
        pt.x + _basisU.x * (halfW * cosT) + _basisV.x * (halfTh * sinT + cupOffset);
      const vy =
        pt.y + _basisU.y * (halfW * cosT) + _basisV.y * (halfTh * sinT + cupOffset);
      const vz =
        pt.z + _basisU.z * (halfW * cosT) + _basisV.z * (halfTh * sinT + cupOffset);

      positions.push(vx, vy, vz);
      uvs.push(frac, 1 - t); // top of canvas at root (t=0), tips at bottom (t=1)
      skinIndices.push(BONE.HEAD, BONE.CHEST, 0, 0);
      skinWeights.push(headW, chestBlend, 0, 0);
    }
  }

  for (let s = 0; s < steps; s++) {
    for (let i = 0; i < radialSeg; i++) {
      const a = s * cols + i;
      const b = s * cols + i + 1;
      const c = (s + 1) * cols + i + 1;
      const d = (s + 1) * cols + i;
      indices.push(a, b, c, a, c, d);
    }
  }

  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geo.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
  geo.setAttribute('skinIndex', new THREE.Uint16BufferAttribute(skinIndices, 4));
  geo.setAttribute('skinWeight', new THREE.Float32BufferAttribute(skinWeights, 4));
  geo.setIndex(indices);
  geo.computeVertexNormals();

  const normAttr = geo.getAttribute('normal') as THREE.BufferAttribute;
  for (let s = 0; s <= steps; s++) {
    const idx0 = s * cols;
    const idxN = s * cols + radialSeg;
    const nx = (normAttr.getX(idx0) + normAttr.getX(idxN)) * 0.5;
    const ny = (normAttr.getY(idx0) + normAttr.getY(idxN)) * 0.5;
    const nz = (normAttr.getZ(idx0) + normAttr.getZ(idxN)) * 0.5;
    const len = Math.hypot(nx, ny, nz) || 1;
    normAttr.setXYZ(idx0, nx / len, ny / len, nz / len);
    normAttr.setXYZ(idxN, nx / len, ny / len, nz / len);
  }
  normAttr.needsUpdate = true;

  const mesh = new THREE.SkinnedMesh(geo, material);
  mesh.castShadow = castShadow;
  mesh.frustumCulled = false;
  mesh.bind(skeleton);
  return mesh;
}

/**
 * Helper to create a curved, tapered 3D horn, bow limb, braid, or accessory bound to a bone.
 */
export function buildTaperedCurveSkinnedMesh(
  points: [number, number, number][],
  radii: number[],
  rxScale: number,
  rzScale: number,
  radialSeg: number,
  boneIdx: number,
  material: THREE.Material,
  skeleton: THREE.Skeleton,
  castShadow = false,
): THREE.SkinnedMesh {
  const curve = new THREE.CatmullRomCurve3(
    points.map((p) => new THREE.Vector3(p[0], p[1], p[2])),
  );
  const steps = Math.max(points.length * 3, 10);
  const rings: LoftRing[] = [];
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const pt = curve.getPoint(t);
    const rFloat = t * (radii.length - 1);
    const r0 = Math.floor(rFloat);
    const r1 = Math.min(radii.length - 1, r0 + 1);
    const rad = THREE.MathUtils.lerp(radii[r0], radii[r1], rFloat - r0);
    rings.push({
      center: [pt.x, pt.y, pt.z],
      rx: Math.max(0.002, rad * rxScale),
      rz: Math.max(0.002, rad * rzScale),
      weights: [boneIdx, 1, 0, 0],
      v: t,
    });
  }
  return buildLoftedSkinnedMesh(rings, radialSeg, material, skeleton, {
    capStart: true,
    capEnd: true,
    castShadow,
  });
}

/**
 * Builds an open or full coat/skirt shell smoothly skinned across chest -> spine -> hips -> legs!
 */
export function buildCoatShellSkinnedMesh(
  rings: {
    y: number;
    zOffset?: number;
    rx: number;
    rz: number;
    squareness?: number;
    arcStart: number;
    arcEnd: number;
    upperBone: number;
    upperWeight: number;
    v: number;
  }[],
  radialSeg: number,
  material: THREE.Material,
  skeleton: THREE.Skeleton,
  castShadow = false,
): THREE.SkinnedMesh {
  const cols = radialSeg + 1;
  const positions: number[] = [];
  const uvs: number[] = [];
  const skinIndices: number[] = [];
  const skinWeights: number[] = [];
  const indices: number[] = [];

  for (let r = 0; r < rings.length; r++) {
    const ring = rings[r];
    const zOff = ring.zOffset ?? 0;
    const sqPow = ring.squareness ? 2 / (2 + 1.5 * ring.squareness) : 1;
    for (let i = 0; i < cols; i++) {
      const frac = i / radialSeg;
      const theta = ring.arcStart + frac * (ring.arcEnd - ring.arcStart);
      const rawCos = Math.cos(theta);
      const rawSin = Math.sin(theta);
      const cosT =
        sqPow === 1
          ? rawCos
          : Math.sign(rawCos) * Math.pow(Math.abs(rawCos), sqPow);
      const sinT =
        sqPow === 1
          ? rawSin
          : Math.sign(rawSin) * Math.pow(Math.abs(rawSin), sqPow);
      const x = cosT * ring.rx;
      const z = zOff - sinT * ring.rz;
      positions.push(x, ring.y, z);
      uvs.push(frac, ring.v);

      const legInfluence = 1 - ring.upperWeight;
      if (legInfluence > 0.01) {
        const legBone = x < 0 ? BONE.L_HIP : BONE.R_HIP;
        skinIndices.push(ring.upperBone, legBone, 0, 0);
        skinWeights.push(ring.upperWeight, legInfluence, 0, 0);
      } else {
        skinIndices.push(ring.upperBone, 0, 0, 0);
        skinWeights.push(1, 0, 0, 0);
      }
    }
  }

  for (let r = 0; r < rings.length - 1; r++) {
    for (let i = 0; i < radialSeg; i++) {
      const a = r * cols + i;
      const b = r * cols + i + 1;
      const c = (r + 1) * cols + i + 1;
      const d = (r + 1) * cols + i;
      indices.push(a, b, c, a, c, d);
    }
  }

  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geo.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
  geo.setAttribute('skinIndex', new THREE.Uint16BufferAttribute(skinIndices, 4));
  geo.setAttribute('skinWeight', new THREE.Float32BufferAttribute(skinWeights, 4));
  geo.setIndex(indices);
  geo.computeVertexNormals();

  const mesh = new THREE.SkinnedMesh(geo, material);
  mesh.castShadow = castShadow;
  mesh.frustumCulled = false;
  mesh.bind(skeleton);
  return mesh;
}
