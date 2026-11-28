import * as THREE from 'three';
import {
  createAnimeFaceTexture,
  createFishnetStockingTexture,
  createHairStrandTexture,
  createLowPolyPbrTextureSet,
  createSakuraKimonoTexture,
  createTailoredClothingTexture,
} from './characterTextures';
import {
  BONE,
  buildAnatomicalEarsSkinnedMesh,
  buildCoatShellSkinnedMesh,
  buildHairCapSkinnedMesh,
  buildHairRibbonSkinnedMesh,
  buildLoftedSkinnedMesh,
  buildMultiMaterialLoftedSkinnedMesh,
  buildSculptedHeadSkinnedMesh,
  buildSculptedThumbSkinnedMesh,
  buildTaperedCurveSkinnedMesh,
  createHumanoidSkeleton,
  HumanoidBoneSet,
  LoftMaterialSection,
  LoftRing,
} from './seamlessHumanRig';

export interface SeamlessCharacterHandle {
  group: THREE.Group;
  bones: HumanoidBoneSet;
  spiritOrbGroup?: THREE.Group;
  textures: THREE.Texture[];
}

/**
 * Builds ONE single continuous multi-material SkinnedMesh for the entire arm:
 * Deltoid Shoulder -> Bicep -> Elbow (optional Rolled Cuff) -> Forearm -> Wrist -> Sculpted Palm & Curled Fingers,
 * plus an articulated opposable thumb SkinnedMesh anchored at the palm base.
 */
function buildSeamlessArm(
  side: -1 | 1,
  s: number,
  radialSeg: number,
  skeleton: THREE.Skeleton,
  upperMat: THREE.Material,
  forearmMat: THREE.Material,
  handMat: THREE.Material,
  options: {
    sleeveEndsAtElbow?: boolean;
    bulkySleeve?: boolean;
    castShadow?: boolean;
  } = {},
): THREE.SkinnedMesh[] {
  const {
    sleeveEndsAtElbow = false,
    bulkySleeve = false,
    castShadow = false,
  } = options;
  const shoulderBone = side === -1 ? BONE.L_SHOULDER : BONE.R_SHOULDER;
  const elbowBone = side === -1 ? BONE.L_ELBOW : BONE.R_ELBOW;
  const wristBone = side === -1 ? BONE.L_WRIST : BONE.R_WRIST;

  const sBulk = bulkySleeve ? 1.28 : 1.0;
  const wristPos: [number, number, number] = [side * 0.268 * s, 0.798 * s, 0.036 * s];

  const wristBoundary: LoftRing = {
    center: wristPos,
    rx: 0.029 * s,
    rz: 0.023 * s,
    weights: [elbowBone, 0.20, wristBone, 0.80],
    v: 1.0,
  };

  // Sculpted palm -> knuckles -> gently curled 4-finger block
  const handChain: LoftRing[] = [
    {...wristBoundary, v: 0},
    {center: [side * 0.271 * s, 0.764 * s, 0.042 * s], rx: 0.035 * s, rz: 0.020 * s, weights: [wristBone, 1, 0, 0], v: 0.28},
    {center: [side * 0.273 * s, 0.728 * s, 0.048 * s], rx: 0.036 * s, rz: 0.017 * s, weights: [wristBone, 1, 0, 0], v: 0.56},
    {center: [side * 0.269 * s, 0.692 * s, 0.054 * s], rx: 0.031 * s, rz: 0.013 * s, weights: [wristBone, 1, 0, 0], v: 0.82},
    {center: [side * 0.264 * s, 0.668 * s, 0.049 * s], rx: 0.022 * s, rz: 0.009 * s, weights: [wristBone, 1, 0, 0], v: 1.0},
  ];

  const thumbMesh = buildSculptedThumbSkinnedMesh(
    side,
    s,
    wristPos,
    wristBone,
    handMat,
    skeleton,
    1.0,
    castShadow,
  );

  if (sleeveEndsAtElbow) {
    const cuffBoundary: LoftRing = {
      center: [side * 0.240 * s, 0.928 * s, 0.020 * s],
      rx: 0.039 * s,
      rz: 0.039 * s,
      squareness: 0.18,
      weights: [elbowBone, 0.92, shoulderBone, 0.08],
      v: 1.0,
    };
    const sleeveRings: LoftRing[] = [
      {center: [side * 0.095 * s, 1.235 * s, 0], rx: 0.052 * s, rz: 0.052 * s, squareness: 0.18, weights: [BONE.CHEST, 0.78, shoulderBone, 0.22], v: 0},
      {center: [side * 0.148 * s, 1.228 * s, 0.003 * s], rx: 0.052 * s * sBulk, rz: 0.052 * s * sBulk, squareness: 0.18, weights: [BONE.CHEST, 0.26, shoulderBone, 0.74], v: 0.22},
      {center: [side * 0.194 * s, 1.118 * s, 0.007 * s], rx: 0.047 * s * sBulk, rz: 0.047 * s * sBulk, squareness: 0.18, weights: [shoulderBone, 0.90, elbowBone, 0.10], v: 0.54},
      {center: [side * 0.224 * s, 0.995 * s, 0.013 * s], rx: 0.044 * s * sBulk, rz: 0.044 * s * sBulk, squareness: 0.18, weights: [shoulderBone, 0.42, elbowBone, 0.58], v: 0.76},
      // Tailored rolled sleeve cuff just above elbow crease
      {center: [side * 0.236 * s, 0.946 * s, 0.018 * s], rx: 0.046 * s * sBulk, rz: 0.046 * s * sBulk, squareness: 0.18, weights: [elbowBone, 0.88, shoulderBone, 0.12], v: 0.91},
      cuffBoundary,
    ];

    if (forearmMat === handMat) {
      const bareArmAndHand: LoftRing[] = [
        {...cuffBoundary, v: 0},
        {center: [side * 0.249 * s, 0.885 * s, 0.025 * s], rx: 0.037 * s, rz: 0.036 * s, weights: [elbowBone, 0.80, wristBone, 0.20], v: 0.24},
        {center: [side * 0.260 * s, 0.838 * s, 0.031 * s], rx: 0.032 * s, rz: 0.030 * s, weights: [elbowBone, 0.50, wristBone, 0.50], v: 0.46},
        {...wristBoundary, v: 0.60},
        ...handChain.slice(1).map((r, idx) => ({...r, v: 0.70 + idx * 0.10})),
      ];
      return [
        buildMultiMaterialLoftedSkinnedMesh(
          [
            {material: upperMat, rings: sleeveRings},
            {material: forearmMat, rings: bareArmAndHand},
          ],
          radialSeg,
          skeleton,
          {capEnd: true, castShadow},
        ),
        thumbMesh,
      ];
    }

    const forearmRings: LoftRing[] = [
      {...cuffBoundary, v: 0},
      {center: [side * 0.250 * s, 0.880 * s, 0.025 * s], rx: 0.038 * s, rz: 0.037 * s, weights: [elbowBone, 0.80, wristBone, 0.20], v: 0.35},
      {center: [side * 0.262 * s, 0.832 * s, 0.031 * s], rx: 0.034 * s, rz: 0.032 * s, weights: [elbowBone, 0.48, wristBone, 0.52], v: 0.72},
      wristBoundary,
    ];

    return [
      buildMultiMaterialLoftedSkinnedMesh(
        [
          {material: upperMat, rings: sleeveRings},
          {material: forearmMat, rings: forearmRings},
          {material: handMat, rings: handChain},
        ],
        radialSeg,
        skeleton,
        {capEnd: true, castShadow},
      ),
      thumbMesh,
    ];
  }

  // Full sleeve down to tailored cuff -> seamless hand + opposable thumb
  const sleeveRings: LoftRing[] = [
    {center: [side * 0.095 * s, 1.235 * s, 0], rx: 0.052 * s, rz: 0.052 * s, squareness: 0.18, weights: [BONE.CHEST, 0.78, shoulderBone, 0.22], v: 0},
    {center: [side * 0.148 * s, 1.228 * s, 0.003 * s], rx: 0.050 * s * sBulk, rz: 0.050 * s * sBulk, squareness: 0.18, weights: [BONE.CHEST, 0.26, shoulderBone, 0.74], v: 0.18},
    {center: [side * 0.194 * s, 1.118 * s, 0.007 * s], rx: 0.045 * s * sBulk, rz: 0.045 * s * sBulk, squareness: 0.18, weights: [shoulderBone, 0.90, elbowBone, 0.10], v: 0.42},
    {center: [side * 0.224 * s, 0.995 * s, 0.013 * s], rx: 0.042 * s * sBulk, rz: 0.042 * s * sBulk, squareness: 0.18, weights: [shoulderBone, 0.42, elbowBone, 0.58], v: 0.62},
    {center: [side * 0.250 * s, 0.880 * s, 0.024 * s], rx: 0.039 * s * sBulk, rz: 0.039 * s * sBulk, squareness: 0.18, weights: [elbowBone, 0.76, wristBone, 0.24], v: 0.82},
    {center: [side * 0.264 * s, 0.818 * s, 0.032 * s], rx: 0.036 * s * sBulk, rz: 0.034 * s * sBulk, squareness: 0.18, weights: [elbowBone, 0.35, wristBone, 0.65], v: 0.94},
    wristBoundary,
  ];

  return [
    buildMultiMaterialLoftedSkinnedMesh(
      [
        {material: upperMat, rings: sleeveRings},
        {material: handMat, rings: handChain},
      ],
      radialSeg,
      skeleton,
      {capEnd: true, castShadow},
    ),
    thumbMesh,
  ];
}

/**
 * Builds ONE single continuous multi-material SkinnedMesh for the entire leg & two-tone shoe:
 * Hip/Thigh -> Knee -> Muscular Calf -> Ankle -> Sculpted Shoe Upper -> Grounded Outsole!
 */
function buildSeamlessLegAndShoe(
  side: -1 | 1,
  s: number,
  radialSeg: number,
  skeleton: THREE.Skeleton,
  thighMat: THREE.Material,
  calfMat: THREE.Material,
  shoeMat: THREE.Material,
  soleMat: THREE.Material,
  options: {
    thighWidth?: number;
    kneeHighStartY?: number;
    castShadow?: boolean;
  } = {},
): THREE.SkinnedMesh[] {
  const {
    thighWidth = 1.0,
    kneeHighStartY = 0.78,
    castShadow = false,
  } = options;
  const hipBone = side === -1 ? BONE.L_HIP : BONE.R_HIP;
  const kneeBone = side === -1 ? BONE.L_KNEE : BONE.R_KNEE;
  const ankleBone = side === -1 ? BONE.L_ANKLE : BONE.R_ANKLE;

  const x = side * 0.088 * s;

  const ankleBoundary: LoftRing = {
    center: [x, 0.112 * s, 0.004 * s],
    rx: 0.043 * s,
    rz: 0.046 * s,
    weights: [kneeBone, 0.28, ankleBone, 0.72],
    v: 0.0,
  };

  const soleTopBoundary: LoftRing = {
    center: [x, 0.022 * s, 0.050 * s],
    rx: 0.054 * s,
    rz: 0.106 * s,
    weights: [ankleBone, 1, 0, 0],
    v: 1.0,
  };

  const shoeUpperRings: LoftRing[] = [
    {...ankleBoundary, v: 0},
    {center: [x, 0.082 * s, 0.010 * s], rx: 0.049 * s, rz: 0.058 * s, weights: [ankleBone, 0.92, kneeBone, 0.08], v: 0.30},
    {center: [x, 0.050 * s, 0.030 * s], rx: 0.053 * s, rz: 0.086 * s, weights: [ankleBone, 1, 0, 0], v: 0.66},
    soleTopBoundary,
  ];

  const soleRings: LoftRing[] = [
    {...soleTopBoundary, v: 0},
    {center: [x, 0.011 * s, 0.052 * s], rx: 0.057 * s, rz: 0.112 * s, weights: [ankleBone, 1, 0, 0], v: 0.5},
    {center: [x, 0.002 * s, 0.050 * s], rx: 0.054 * s, rz: 0.106 * s, weights: [ankleBone, 1, 0, 0], v: 1.0},
  ];

  if (kneeHighStartY < 0.75) {
    const splitY = kneeHighStartY * s;
    const splitBoundary: LoftRing = {
      center: [x, splitY, 0.007 * s],
      rx: 0.048 * s,
      rz: 0.050 * s,
      squareness: 0.14,
      weights: [hipBone, 0.45, kneeBone, 0.55],
      v: 1.0,
    };

    const thighRings: LoftRing[] = [
      {center: [x, 0.82 * s, 0], rx: 0.078 * s * thighWidth, rz: 0.078 * s * thighWidth, squareness: 0.18, weights: [BONE.HIPS, 0.68, hipBone, 0.32], v: 0},
      {center: [x, 0.66 * s, 0.004 * s], rx: 0.068 * s * thighWidth, rz: 0.070 * s * thighWidth, squareness: 0.18, weights: [hipBone, 0.94, BONE.HIPS, 0.06], v: 0.46},
      {center: [x, Math.max(splitY + 0.04 * s, 0.51 * s), 0.007 * s], rx: 0.054 * s, rz: 0.056 * s, squareness: 0.14, weights: [hipBone, 0.68, kneeBone, 0.32], v: 0.80},
      splitBoundary,
    ];

    const calfRings: LoftRing[] = [
      {...splitBoundary, v: 1.0},
      {center: [x, 0.34 * s, 0.005 * s], rx: 0.050 * s, rz: 0.054 * s, backScale: 1.10, weights: [kneeBone, 0.86, hipBone, 0.14], v: 0.70},
      {center: [x, 0.22 * s, 0.003 * s], rx: 0.045 * s, rz: 0.048 * s, weights: [kneeBone, 0.94, ankleBone, 0.06], v: 0.40},
      {...ankleBoundary, v: 0.0},
    ];

    return [
      buildMultiMaterialLoftedSkinnedMesh(
        [
          {material: thighMat, rings: thighRings},
          {material: calfMat, rings: calfRings},
          {material: shoeMat, rings: shoeUpperRings},
          {material: soleMat, rings: soleRings},
        ],
        radialSeg,
        skeleton,
        {capEnd: true, castShadow},
      ),
    ];
  }

  // Full trousers continuously down to sculpted ankle cuff -> two-tone shoe + outsole
  const trousersBoundary: LoftRing = {
    center: [x, 0.112 * s, 0.004 * s],
    rx: 0.048 * s,
    rz: 0.050 * s,
    squareness: 0.16,
    weights: [kneeBone, 0.28, ankleBone, 0.72],
    v: 1.0,
  };
  const legRings: LoftRing[] = [
    {center: [x, 0.82 * s, 0], rx: 0.080 * s * thighWidth, rz: 0.082 * s * thighWidth, squareness: 0.18, weights: [BONE.HIPS, 0.70, hipBone, 0.30], v: 0},
    {center: [x, 0.64 * s, 0.004 * s], rx: 0.072 * s * thighWidth, rz: 0.074 * s * thighWidth, squareness: 0.18, weights: [hipBone, 0.94, BONE.HIPS, 0.06], v: 0.28},
    {center: [x, 0.46 * s, 0.008 * s], rx: 0.060 * s, rz: 0.062 * s, squareness: 0.18, weights: [hipBone, 0.55, kneeBone, 0.45], v: 0.55},
    {center: [x, 0.29 * s, 0.004 * s], rx: 0.056 * s, rz: 0.059 * s, squareness: 0.16, backScale: 1.06, weights: [kneeBone, 0.92, hipBone, 0.08], v: 0.78},
    trousersBoundary,
  ];
  const shoeFromTrouser: LoftRing[] = [
    {...trousersBoundary, v: 0},
    ...shoeUpperRings.slice(1),
  ];

  return [
    buildMultiMaterialLoftedSkinnedMesh(
      [
        {material: thighMat, rings: legRings},
        {material: shoeMat, rings: shoeFromTrouser},
        {material: soleMat, rings: soleRings},
      ],
      radialSeg,
      skeleton,
      {capEnd: true, castShadow},
    ),
  ];
}

/**
 * Builds ONE single continuous multi-material SkinnedMesh for the entire Torso & Neck:
 * Pelvis/Hips -> Tapered Waist -> Contoured Ribcage/Chest/Clavicles -> Neck seamlessly into Jaw!
 */
function buildSeamlessTorso(
  s: number,
  radialSeg: number,
  skeleton: THREE.Skeleton,
  lowerMat: THREE.Material,
  upperMat: THREE.Material,
  skinMat: THREE.Material,
  options: {
    hasHead: boolean;
    slender?: boolean;
    castShadow?: boolean;
  },
): THREE.SkinnedMesh[] {
  const {hasHead, slender = false, castShadow = false} = options;
  const wScale = slender ? 0.87 : 1.0;

  const waistBoundary: LoftRing = {
    center: [0, 0.91 * s, 0],
    rx: 0.132 * s * wScale,
    rz: 0.094 * s * wScale,
    squareness: 0.45,
    weights: [BONE.HIPS, 0.38, BONE.SPINE, 0.62],
    v: 1.0,
  };

  const hipRings: LoftRing[] = [
    {center: [0, 0.74 * s, 0], rx: 0.156 * s * wScale, rz: 0.110 * s * wScale, squareness: 0.45, weights: [BONE.HIPS, 1, 0, 0], v: 0},
    {center: [0, 0.83 * s, 0], rx: 0.164 * s * wScale, rz: 0.114 * s * wScale, squareness: 0.45, backScale: 1.05, weights: [BONE.HIPS, 0.85, BONE.SPINE, 0.15], v: 0.55},
    waistBoundary,
  ];

  const neckBaseBoundary: LoftRing = {
    center: [0, 1.325 * s, -0.003 * s],
    rx: 0.052 * s,
    rz: 0.052 * s,
    squareness: 0.1,
    weights: [BONE.CHEST, 0.38, BONE.NECK, 0.62],
    v: 1.0,
  };

  const upperRings: LoftRing[] = [
    {...waistBoundary, v: 0},
    {center: [0, 1.06 * s, 0.005 * s], rx: 0.150 * s * wScale, rz: 0.108 * s * wScale, squareness: 0.45, weights: [BONE.SPINE, 0.32, BONE.CHEST, 0.68], v: 0.32},
    {center: [0, 1.18 * s, 0.006 * s], rx: 0.174 * s * wScale, rz: 0.114 * s * wScale, squareness: 0.45, backScale: 1.03, weights: [BONE.CHEST, 0.90, BONE.SPINE, 0.10], v: 0.66},
    {center: [0, 1.275 * s, -0.001 * s], rx: 0.140 * s * wScale, rz: 0.090 * s * wScale, squareness: 0.45, weights: [BONE.CHEST, 0.72, BONE.NECK, 0.28], v: 0.88},
    neckBaseBoundary,
  ];

  const sections: LoftMaterialSection[] = [
    {material: lowerMat, rings: hipRings},
    {material: upperMat, rings: upperRings},
  ];

  if (hasHead) {
    const neckRings: LoftRing[] = [
      {...neckBaseBoundary, v: 0},
      {center: [0, 1.37 * s, -0.002 * s], rx: 0.048 * s, rz: 0.049 * s, weights: [BONE.NECK, 0.76, BONE.HEAD, 0.24], v: 0.5},
      {center: [0, 1.435 * s, 0], rx: 0.054 * s, rz: 0.056 * s, weights: [BONE.NECK, 0.24, BONE.HEAD, 0.76], v: 1.0},
    ];
    sections.push({material: skinMat, rings: neckRings});
  }

  return [
    buildMultiMaterialLoftedSkinnedMesh(sections, radialSeg, skeleton, {
      capStart: true,
      capEnd: !hasHead,
      castShadow,
    }),
  ];
}

function createCharacterMats(colors: {
  skin?: number;
  faceTex?: THREE.CanvasTexture;
}) {
  const skinMat = new THREE.MeshStandardMaterial({
    color: colors.skin ?? 0xf3d4be,
    roughness: 0.56,
    metalness: 0.02,
  });
  const headMat = colors.faceTex
    ? new THREE.MeshStandardMaterial({
        map: colors.faceTex,
        roughness: 0.52,
        metalness: 0.01,
      })
    : skinMat;
  return {skinMat, headMat};
}

/**
 * NEW FLAGSHIP PLAYER CHARACTER MODEL:
 * เจ้าบ้านชาโฉมใหม่ (Complete Anatomical Edition)
 * Replaces all old models with a refined, anatomically complete 3D character featuring:
 * - Sculpted 3D head (nose bridge & tip, orbital eye sockets, brow ridge, cheekbones, jawline, sculpted 3D ears)
 * - Multi-layered swept hairstyle (contoured cap + side-swept bangs + temple locks + layered nape)
 * - Complete torso (clavicles, chest contour, tapered waist, hips) with mandarin-collar linen shirt & sage artisan vest/apron
 * - Complete arms & articulated hands (rolled sleeves, muscular forearms, sculpted palms, curled fingers, opposable thumbs)
 * - Complete legs & two-tone leather derby shoes with separate outsoles grounded flush at y = 0
 */
export function buildCompleteTeaArtisanCharacter(
  compactMode: boolean,
  ultraCompact: boolean,
): SeamlessCharacterHandle {
  const seg = ultraCompact ? 12 : compactMode ? 16 : 20;
  const s = 1.02;
  const bones = createHumanoidSkeleton(s);
  const group = new THREE.Group();
  group.add(bones.root);

  const faceTex = createAnimeFaceTexture(
    {
      skinHex: '#f5d2ba',
      blushHex: 'rgba(232, 134, 126, 0.36)',
      irisTopHex: '#33241c',
      irisBottomHex: '#7d573a',
      browHex: '#281d18',
      lipHex: '#b86d63',
      eyeScale: 0.94,
      smileCurve: 1.05,
    },
    compactMode,
  );
  const hairTex = createHairStrandTexture(
    '#2a1f1a',
    '#523d33',
    '#17110e',
    '#382a23',
    compactMode,
  );
  const shirtPbr = createLowPolyPbrTextureSet(
    'tunic',
    {
      baseHex: '#f5f1e6',
      shadeHex: '#d5cdbc',
      accentHex: '#ede7d8',
      trimHex: '#c7a461',
    },
    compactMode,
  );
  const apronTex = createTailoredClothingTexture(
    {
      style: 'cardigan',
      baseHex: '#2d6a42',
      grainHex: '#1c472b',
      trimHex: '#225232',
    },
    compactMode,
  );
  const trouserTex = createTailoredClothingTexture(
    {
      style: 'waistcoat',
      baseHex: '#282d35',
      grainHex: '#191c22',
      buttonHex: '#434a56',
    },
    compactMode,
  );
  const leatherPbr = createLowPolyPbrTextureSet(
    'leather',
    {
      baseHex: '#633c24',
      shadeHex: '#3a2112',
      trimHex: '#c4964c',
    },
    compactMode,
  );

  const textures: THREE.Texture[] = [
    faceTex,
    hairTex,
    ...shirtPbr.textures,
    apronTex,
    trouserTex,
    ...leatherPbr.textures,
  ];

  const {skinMat, headMat} = createCharacterMats({skin: 0xf5d2ba, faceTex});
  const shirtMat = new THREE.MeshStandardMaterial({
    map: shirtPbr.map,
    normalMap: shirtPbr.normalMap,
    roughness: 0.84,
    metalness: 0.02,
  });
  const apronMat = new THREE.MeshStandardMaterial({
    map: apronTex,
    roughness: 0.78,
    metalness: 0.04,
    side: THREE.DoubleSide,
  });
  const trouserMat = new THREE.MeshStandardMaterial({
    map: trouserTex,
    roughness: 0.80,
    metalness: 0.03,
  });
  const hairMat = new THREE.MeshStandardMaterial({
    map: hairTex,
    roughness: 0.44,
    metalness: 0.08,
  });
  const leatherMat = new THREE.MeshStandardMaterial({
    map: leatherPbr.map,
    normalMap: leatherPbr.normalMap,
    roughness: 0.42,
    metalness: 0.08,
  });
  const soleMat = new THREE.MeshStandardMaterial({
    color: 0x1d1b1c,
    roughness: 0.88,
    metalness: 0.02,
  });
  const brassMat = new THREE.MeshStandardMaterial({
    color: 0xd5a84e,
    roughness: 0.28,
    metalness: 0.82,
  });

  const castShadow = !compactMode;
  const meshes: THREE.SkinnedMesh[] = [
    ...buildSeamlessTorso(s, seg, bones.skeleton, trouserMat, shirtMat, skinMat, {
      hasHead: true,
      castShadow,
    }),
    ...buildSeamlessArm(-1, s, seg, bones.skeleton, shirtMat, skinMat, skinMat, {
      sleeveEndsAtElbow: true,
      castShadow,
    }),
    ...buildSeamlessArm(1, s, seg, bones.skeleton, shirtMat, skinMat, skinMat, {
      sleeveEndsAtElbow: true,
      castShadow,
    }),
    ...buildSeamlessLegAndShoe(-1, s, seg, bones.skeleton, trouserMat, trouserMat, leatherMat, soleMat, {
      castShadow,
    }),
    ...buildSeamlessLegAndShoe(1, s, seg, bones.skeleton, trouserMat, trouserMat, leatherMat, soleMat, {
      castShadow,
    }),
    // Sculpted 3D Head & Outer Ears
    buildSculptedHeadSkinnedMesh(1.52 * s, 0.15 * s, seg, headMat, bones.skeleton, {
      jawTaper: 0.72,
      faceFlatten: 0.90,
      castShadow,
    }),
    ...buildAnatomicalEarsSkinnedMesh(1.515 * s, 0.15 * s, skinMat, bones.skeleton, castShadow),
    // Mandarin Stand-Collar Rim
    buildLoftedSkinnedMesh(
      [
        {center: [0, 1.320 * s, -0.002 * s], rx: 0.057 * s, rz: 0.057 * s, squareness: 0.1, weights: [BONE.CHEST, 0.35, BONE.NECK, 0.65], v: 0},
        {center: [0, 1.362 * s, -0.002 * s], rx: 0.055 * s, rz: 0.055 * s, squareness: 0.1, weights: [BONE.NECK, 0.85, BONE.CHEST, 0.15], v: 1},
      ],
      seg,
      shirtMat,
      bones.skeleton,
    ),
    // Tailored Sage-Forest Sommelier Vest (snug fit hugging the torso contour)
    buildCoatShellSkinnedMesh(
      [
        {y: 0.74 * s, zOffset: 0, rx: 0.164 * s, rz: 0.117 * s, squareness: 0.45, arcStart: -Math.PI * 0.28, arcEnd: Math.PI * 1.28, upperBone: BONE.HIPS, upperWeight: 0.94, v: 0},
        {y: 0.83 * s, zOffset: 0, rx: 0.171 * s, rz: 0.121 * s, squareness: 0.45, arcStart: -Math.PI * 0.28, arcEnd: Math.PI * 1.28, upperBone: BONE.HIPS, upperWeight: 0.85, v: 0.22},
        {y: 0.91 * s, zOffset: 0, rx: 0.139 * s, rz: 0.101 * s, squareness: 0.45, arcStart: -Math.PI * 0.28, arcEnd: Math.PI * 1.28, upperBone: BONE.SPINE, upperWeight: 1, v: 0.42},
        {y: 1.06 * s, zOffset: 0.005 * s, rx: 0.157 * s, rz: 0.115 * s, squareness: 0.45, arcStart: -Math.PI * 0.28, arcEnd: Math.PI * 1.28, upperBone: BONE.CHEST, upperWeight: 1, v: 0.68},
        {y: 1.18 * s, zOffset: 0.006 * s, rx: 0.181 * s, rz: 0.121 * s, squareness: 0.45, arcStart: -Math.PI * 0.26, arcEnd: Math.PI * 1.26, upperBone: BONE.CHEST, upperWeight: 1, v: 0.88},
        {y: 1.27 * s, zOffset: -0.001 * s, rx: 0.146 * s, rz: 0.097 * s, squareness: 0.45, arcStart: -Math.PI * 0.20, arcEnd: Math.PI * 1.20, upperBone: BONE.CHEST, upperWeight: 1, v: 1.0},
      ],
      seg,
      apronMat,
      bones.skeleton,
      castShadow,
    ),
    // Snug Leather Artisan Waist Belt
    buildLoftedSkinnedMesh(
      [
        {center: [0, 0.875 * s, 0], rx: 0.154 * s, rz: 0.112 * s, squareness: 0.45, weights: [BONE.HIPS, 0.72, BONE.SPINE, 0.28], v: 0},
        {center: [0, 0.912 * s, 0], rx: 0.143 * s, rz: 0.105 * s, squareness: 0.45, weights: [BONE.HIPS, 0.55, BONE.SPINE, 0.45], v: 1},
      ],
      seg,
      leatherMat,
      bones.skeleton,
    ),
    // Contoured Scalp Hair Cap + Multi-Layered Swept Hairstyle
    buildHairCapSkinnedMesh(1.52 * s, 0.15 * s, seg, hairMat, bones.skeleton, {
      backDrop: 0.22,
      castShadow,
    }),
    // Side-parted swept front bang (left-to-right flow)
    buildHairRibbonSkinnedMesh(
      [
        [-0.035, 1.640 * s, 0.045],
        [-0.015, 1.605 * s, 0.136],
        [0.048, 1.565 * s, 0.138],
        [0.092, 1.515 * s, 0.118],
      ],
      [0.068, 0.062, 0.044, 0.012],
      [0.020, 0.018, 0.014, 0.005],
      hairMat,
      bones.skeleton,
    ),
    // Left temple framing sweep
    buildHairRibbonSkinnedMesh(
      [
        [-0.045, 1.635 * s, 0.048],
        [-0.088, 1.590 * s, 0.118],
        [-0.118, 1.520 * s, 0.094],
      ],
      [0.056, 0.042, 0.014],
      [0.018, 0.014, 0.005],
      hairMat,
      bones.skeleton,
    ),
    // Soft center-left accent strand
    buildHairRibbonSkinnedMesh(
      [
        [-0.02, 1.642 * s, 0.062],
        [-0.042, 1.592 * s, 0.140],
        [-0.056, 1.545 * s, 0.139],
      ],
      [0.034, 0.028, 0.010],
      [0.014, 0.012, 0.004],
      hairMat,
      bones.skeleton,
    ),
    // Sideburns framing sculpted ears
    buildHairRibbonSkinnedMesh(
      [
        [-0.104, 1.58 * s, 0.022],
        [-0.128, 1.505 * s, 0.036],
        [-0.116, 1.445 * s, 0.028],
      ],
      [0.026, 0.020, 0.008],
      [0.012, 0.010, 0.004],
      hairMat,
      bones.skeleton,
    ),
    buildHairRibbonSkinnedMesh(
      [
        [0.104, 1.58 * s, 0.022],
        [0.128, 1.505 * s, 0.036],
        [0.116, 1.445 * s, 0.028],
      ],
      [0.026, 0.020, 0.008],
      [0.012, 0.010, 0.004],
      hairMat,
      bones.skeleton,
    ),
    // Layered nape taper
    buildHairRibbonSkinnedMesh(
      [
        [0, 1.54 * s, -0.115],
        [0, 1.44 * s, -0.135],
        [0, 1.36 * s, -0.095],
      ],
      [0.118, 0.096, 0.048],
      [0.024, 0.020, 0.010],
      hairMat,
      bones.skeleton,
    ),
  ];

  for (const m of meshes) group.add(m);

  // Flush Brushed Brass Belt Buckle & Side Vest Pocket + Shirt Collar Clasps
  const beltBuckle = new THREE.Mesh(
    new THREE.BoxGeometry(0.046 * s, 0.034 * s, 0.012 * s),
    brassMat,
  );
  beltBuckle.position.set(0, 0.090 * s, 0.107 * s);
  bones.hips.add(beltBuckle);

  const apronPocket = new THREE.Mesh(
    new THREE.BoxGeometry(0.068 * s, 0.074 * s, 0.010 * s),
    apronMat,
  );
  apronPocket.position.set(0.088 * s, -0.020 * s, 0.106 * s);
  apronPocket.rotation.y = 0.34;
  bones.hips.add(apronPocket);

  const collarBtnGeo = new THREE.CylinderGeometry(0.008 * s, 0.008 * s, 0.007 * s, 10);
  collarBtnGeo.rotateX(Math.PI * 0.5);
  for (const [by, bz] of [
    [0.085 * s, 0.113 * s],
    [0.015 * s, 0.118 * s],
  ]) {
    const btn = new THREE.Mesh(collarBtnGeo, brassMat);
    btn.position.set(0, by, bz);
    bones.chest.add(btn);
  }

  return {group, bones, textures};
}

export interface HumanGuestConfig {
  preset: string;
  heightScale?: number;
  slender?: boolean;
  isElder?: boolean;
  skinHex?: string;
  skinColor?: number;
  blushHex?: string;
  jawTaper?: number;
  smileCurve?: number;
  coatHex: string;
  innerHex: string;
  skirtHex: string;
  hairBaseHex: string;
  hairHighlightHex: string;
  hairShadowHex: string;
  hairTipHex?: string;
  shoeColor: number;
  irisTopHex: string;
  irisBottomHex: string;
  browHex?: string;
  clothingStyle:
    | 'cardigan'
    | 'thai-blouse'
    | 'waistcoat'
    | 'hoodie-jacket'
    | 'trench';
  clothingAccentHex?: string;
  bottomStyle?: 'skirt' | 'trousers';
  sleeveEndsAtElbow?: boolean;
  hairstyle:
    | 'wavy-shoulder'
    | 'low-messy-bun'
    | 'elder-top-bun'
    | 'short-bob'
    | 'high-ponytail'
    | 'short-quiff'
    | 'neat-parted'
    | 'twin-braids';
  hasGlasses?: boolean;
  glassStyle?: 'round' | 'rect';
  hasPearlEarrings?: boolean;
  earringColor?: number;
  hasHairClip?: boolean;
  hairClipColor?: number;
  hasMustache?: boolean;
  hasHeadphones?: boolean;
  hasCamera?: boolean;
  hasNotebook?: boolean;
  hasHandbag?: boolean;
  bagColor?: number;
}

/**
 * Human Tea House Guests (12 diverse characters across ages, genders & styles)
 * Built with complete anatomical structure: sculpted 3D nose/brow/ears, sculpted palms + thumbs,
 * two-tone shoes + outsoles, tailored squircle garments, and layered hairstyles.
 */
export function buildSeamlessHumanGuest(
  compactMode: boolean,
  ultraCompact: boolean,
  config: HumanGuestConfig,
): SeamlessCharacterHandle {
  const seg = ultraCompact ? 10 : compactMode ? 12 : 16;
  const s = config.heightScale ?? 0.97;
  const isSlender = config.slender ?? true;
  const wScale = isSlender ? 0.87 : 1.0;
  const isElder = config.isElder ?? config.preset === 'malee';
  const usesTrousers = config.bottomStyle === 'trousers';
  const sleeveEndsAtElbow =
    config.sleeveEndsAtElbow ?? Boolean(isElder && !usesTrousers);

  const bones = createHumanoidSkeleton(s);
  const group = new THREE.Group();
  group.add(bones.root);

  const skinHex = config.skinHex ?? (isElder ? '#ecc4a8' : '#f6d5be');
  const skinColorNum =
    config.skinColor ?? (isElder ? 0xecc4a8 : 0xf6d5be);

  const faceTex = createAnimeFaceTexture(
    {
      skinHex,
      blushHex:
        config.blushHex ??
        (isElder
          ? 'rgba(218, 125, 118, 0.34)'
          : isSlender
            ? 'rgba(238, 136, 130, 0.42)'
            : 'rgba(214, 128, 118, 0.24)'),
      irisTopHex: config.irisTopHex,
      irisBottomHex: config.irisBottomHex,
      browHex: config.browHex ?? '#46342a',
      lipHex: isElder ? '#ad6b62' : isSlender ? '#c46a64' : '#a96b62',
      eyeScale: isElder ? 0.90 : isSlender ? 1.0 : 0.92,
      smileCurve: config.smileCurve ?? (config.preset === 'som-o' ? 1.2 : 1.0),
      warmAgeLines: isElder,
    },
    compactMode,
  );
  const hairTex = createHairStrandTexture(
    config.hairBaseHex,
    config.hairHighlightHex,
    config.hairShadowHex,
    config.hairTipHex,
    compactMode,
  );
  const coatTex = createTailoredClothingTexture(
    {
      style: config.clothingStyle,
      baseHex: config.coatHex,
      grainHex: '#252629',
      accentHex: config.clothingAccentHex,
      trimHex: config.clothingAccentHex,
      buttonHex: isElder ? '#c9cfd8' : '#7b5438',
    },
    compactMode,
  );
  const innerTex = createTailoredClothingTexture(
    {
      style: 'shirt',
      baseHex: config.innerHex,
      grainHex: '#d5cdbf',
      buttonHex: '#c8bfb0',
    },
    compactMode,
  );
  const textures: THREE.Texture[] = [faceTex, hairTex, coatTex, innerTex];

  const {skinMat, headMat} = createCharacterMats({
    skin: skinColorNum,
    faceTex,
  });
  const coatMat = new THREE.MeshStandardMaterial({
    map: coatTex,
    roughness: 0.74,
    side: THREE.DoubleSide,
  });
  const innerMat = new THREE.MeshStandardMaterial({
    map: innerTex,
    roughness: 0.78,
  });
  const bottomMat = new THREE.MeshStandardMaterial({
    color: config.skirtHex,
    roughness: 0.80,
    side: THREE.DoubleSide,
  });
  const hairMat = new THREE.MeshStandardMaterial({
    map: hairTex,
    roughness: 0.46,
    metalness: 0.06,
  });
  const shoeMat = new THREE.MeshStandardMaterial({
    color: config.shoeColor,
    roughness: 0.48,
  });
  const soleMat = new THREE.MeshStandardMaterial({
    color: 0x221d1b,
    roughness: 0.88,
  });
  const pearlMat = new THREE.MeshStandardMaterial({
    color: 0xf7f5ef,
    roughness: 0.25,
    metalness: 0.15,
  });

  const castShadow = !compactMode;
  const usesOuterShell =
    config.clothingStyle === 'cardigan' ||
    config.clothingStyle === 'waistcoat' ||
    config.clothingStyle === 'hoodie-jacket' ||
    config.clothingStyle === 'trench';
  const isSleevelessVest = config.clothingStyle === 'waistcoat';
  const torsoUpperMat = usesOuterShell ? innerMat : coatMat;
  const armSleeveMat = isSleevelessVest ? innerMat : coatMat;

  const legStartY = usesTrousers ? 0.85 : 0.56;
  const backDropMap: Record<HumanGuestConfig['hairstyle'], number> = {
    'wavy-shoulder': 0.30,
    'short-bob': 0.24,
    'twin-braids': 0.20,
    'low-messy-bun': 0.16,
    'short-quiff': 0.16,
    'high-ponytail': 0.14,
    'neat-parted': 0.14,
    'elder-top-bun': 0.14,
  };

  const meshes: THREE.SkinnedMesh[] = [
    ...buildSeamlessTorso(s, seg, bones.skeleton, bottomMat, torsoUpperMat, skinMat, {
      hasHead: true,
      slender: isSlender,
      castShadow,
    }),
    ...buildSeamlessArm(-1, s, seg, bones.skeleton, armSleeveMat, skinMat, skinMat, {
      sleeveEndsAtElbow,
      castShadow,
    }),
    ...buildSeamlessArm(1, s, seg, bones.skeleton, armSleeveMat, skinMat, skinMat, {
      sleeveEndsAtElbow,
      castShadow,
    }),
    ...buildSeamlessLegAndShoe(-1, s, seg, bones.skeleton, bottomMat, skinMat, shoeMat, soleMat, {
      thighWidth: isSlender ? 0.96 : 1.0,
      kneeHighStartY: legStartY,
      castShadow,
    }),
    ...buildSeamlessLegAndShoe(1, s, seg, bones.skeleton, bottomMat, skinMat, shoeMat, soleMat, {
      thighWidth: isSlender ? 0.96 : 1.0,
      kneeHighStartY: legStartY,
      castShadow,
    }),
    buildSculptedHeadSkinnedMesh(1.52 * s, 0.15 * s, seg, headMat, bones.skeleton, {
      jawTaper: config.jawTaper ?? (isSlender ? (isElder ? 0.76 : 0.68) : 0.78),
      faceFlatten: isSlender ? 0.90 : 0.92,
      castShadow,
    }),
    ...buildAnatomicalEarsSkinnedMesh(1.515 * s, 0.15 * s, skinMat, bones.skeleton, castShadow),
    buildHairCapSkinnedMesh(1.52 * s, 0.15 * s, seg, hairMat, bones.skeleton, {
      backDrop: backDropMap[config.hairstyle],
      castShadow,
    }),
  ];

  if (!usesTrousers) {
    meshes.push(
      buildCoatShellSkinnedMesh(
        [
          {y: isElder ? 0.44 * s : 0.54 * s, rx: (0.172 * wScale + 0.010) * s, rz: (0.122 * wScale + 0.008) * s, squareness: 0.40, arcStart: 0, arcEnd: Math.PI * 2, upperBone: BONE.HIPS, upperWeight: 0.45, v: 0},
          {y: 0.65 * s, rx: (0.165 * wScale + 0.009) * s, rz: (0.116 * wScale + 0.008) * s, squareness: 0.40, arcStart: 0, arcEnd: Math.PI * 2, upperBone: BONE.HIPS, upperWeight: 0.72, v: 0.48},
          {y: 0.78 * s, rx: (0.156 * wScale + 0.008) * s, rz: (0.110 * wScale + 0.007) * s, squareness: 0.42, arcStart: 0, arcEnd: Math.PI * 2, upperBone: BONE.HIPS, upperWeight: 0.92, v: 1},
        ],
        seg,
        bottomMat,
        bones.skeleton,
        castShadow,
      ),
    );
  }

  if (usesOuterShell) {
    const gap = 0.007 * s;
    const frontArcGap =
      config.clothingStyle === 'hoodie-jacket'
        ? 0.20
        : config.clothingStyle === 'waistcoat'
          ? 0.26
          : 0.30;
    meshes.push(
      buildCoatShellSkinnedMesh(
        [
          {y: 0.76 * s, zOffset: 0, rx: 0.158 * s * wScale + gap, rz: 0.111 * s * wScale + gap, squareness: 0.43, arcStart: -Math.PI * frontArcGap, arcEnd: Math.PI * (1 + frontArcGap), upperBone: BONE.HIPS, upperWeight: 0.80, v: 0},
          {y: 0.91 * s, zOffset: 0, rx: 0.132 * s * wScale + gap, rz: 0.094 * s * wScale + gap, squareness: 0.43, arcStart: -Math.PI * (frontArcGap + 0.02), arcEnd: Math.PI * (1 + frontArcGap + 0.02), upperBone: BONE.SPINE, upperWeight: 1, v: 0.34},
          {y: 1.06 * s, zOffset: 0.005 * s, rx: 0.150 * s * wScale + gap, rz: 0.108 * s * wScale + gap, squareness: 0.43, arcStart: -Math.PI * (frontArcGap + 0.02), arcEnd: Math.PI * (1 + frontArcGap + 0.02), upperBone: BONE.CHEST, upperWeight: 1, v: 0.68},
          {y: 1.22 * s, zOffset: 0.005 * s, rx: 0.168 * s * wScale + gap, rz: 0.110 * s * wScale + gap, squareness: 0.43, arcStart: -Math.PI * (frontArcGap - 0.02), arcEnd: Math.PI * (1 + frontArcGap - 0.02), upperBone: BONE.CHEST, upperWeight: 1, v: 1},
        ],
        seg,
        coatMat,
        bones.skeleton,
        castShadow,
      ),
    );
    if (config.clothingStyle === 'hoodie-jacket') {
      meshes.push(
        buildCoatShellSkinnedMesh(
          [
            {y: 1.28 * s, zOffset: -0.022 * s, rx: 0.112 * s * wScale, rz: 0.082 * s * wScale, squareness: 0.35, arcStart: Math.PI * 0.08, arcEnd: Math.PI * 0.92, upperBone: BONE.CHEST, upperWeight: 0.85, v: 0},
            {y: 1.35 * s, zOffset: -0.042 * s, rx: 0.104 * s * wScale, rz: 0.078 * s * wScale, squareness: 0.30, arcStart: Math.PI * 0.12, arcEnd: Math.PI * 0.88, upperBone: BONE.NECK, upperWeight: 0.65, v: 1},
          ],
          seg,
          coatMat,
          bones.skeleton,
          castShadow,
        ),
      );
    }
  } else {
    meshes.push(
      buildLoftedSkinnedMesh(
        [
          {center: [0, 1.315 * s, -0.002 * s], rx: 0.058 * s, rz: 0.057 * s, squareness: 0.1, weights: [BONE.CHEST, 0.35, BONE.NECK, 0.65], v: 0},
          {center: [0, 1.36 * s, -0.002 * s], rx: 0.056 * s, rz: 0.055 * s, squareness: 0.1, weights: [BONE.NECK, 0.85, BONE.CHEST, 0.15], v: 1},
        ],
        seg,
        coatMat,
        bones.skeleton,
      ),
    );
  }

  // Hairstyles (8 distinct options)
  if (config.hairstyle === 'wavy-shoulder') {
    meshes.push(
      buildHairRibbonSkinnedMesh(
        [
          [0, 1.62 * s, -0.08],
          [0, 1.48 * s, -0.162],
          [0, 1.32 * s, -0.155],
          [0, 1.21 * s, -0.125],
        ],
        [0.145, 0.155, 0.142, 0.08],
        [0.028, 0.030, 0.024, 0.012],
        hairMat,
        bones.skeleton,
        {followChestLower: true, castShadow},
      ),
      buildHairRibbonSkinnedMesh(
        [
          [-0.085, 1.61 * s, -0.05],
          [-0.145, 1.44 * s, -0.065],
          [-0.155, 1.28 * s, 0.01],
          [-0.12, 1.19 * s, 0.055],
        ],
        [0.065, 0.068, 0.052, 0.015],
        [0.022, 0.022, 0.018, 0.006],
        hairMat,
        bones.skeleton,
        {followChestLower: true, curlRoll: 0.2},
      ),
      buildHairRibbonSkinnedMesh(
        [
          [0.085, 1.61 * s, -0.05],
          [0.145, 1.44 * s, -0.065],
          [0.155, 1.28 * s, 0.01],
          [0.12, 1.19 * s, 0.055],
        ],
        [0.065, 0.068, 0.052, 0.015],
        [0.022, 0.022, 0.018, 0.006],
        hairMat,
        bones.skeleton,
        {followChestLower: true, curlRoll: -0.2},
      ),
      buildHairRibbonSkinnedMesh(
        [
          [0, 1.64 * s, 0.05],
          [-0.042, 1.602 * s, 0.138],
          [-0.065, 1.545 * s, 0.140],
        ],
        [0.046, 0.038, 0.012],
        [0.014, 0.012, 0.004],
        hairMat,
        bones.skeleton,
      ),
      buildHairRibbonSkinnedMesh(
        [
          [0, 1.64 * s, 0.05],
          [0.042, 1.602 * s, 0.138],
          [0.065, 1.545 * s, 0.140],
        ],
        [0.046, 0.038, 0.012],
        [0.014, 0.012, 0.004],
        hairMat,
        bones.skeleton,
      ),
      buildHairRibbonSkinnedMesh(
        [
          [0, 1.64 * s, 0.055],
          [0, 1.602 * s, 0.143],
          [0.006, 1.55 * s, 0.144],
        ],
        [0.032, 0.028, 0.010],
        [0.012, 0.010, 0.003],
        hairMat,
        bones.skeleton,
      ),
    );
  } else if (config.hairstyle === 'short-bob') {
    meshes.push(
      // Smooth curved chin-length bob back & sides
      buildHairRibbonSkinnedMesh(
        [
          [0, 1.62 * s, -0.07],
          [0, 1.49 * s, -0.155],
          [0, 1.38 * s, -0.125],
        ],
        [0.142, 0.150, 0.120],
        [0.026, 0.028, 0.016],
        hairMat,
        bones.skeleton,
        {castShadow},
      ),
      buildHairRibbonSkinnedMesh(
        [
          [-0.08, 1.61 * s, -0.03],
          [-0.148, 1.49 * s, 0.015],
          [-0.124, 1.39 * s, 0.042],
        ],
        [0.058, 0.055, 0.036],
        [0.020, 0.020, 0.012],
        hairMat,
        bones.skeleton,
      ),
      buildHairRibbonSkinnedMesh(
        [
          [0.08, 1.61 * s, -0.03],
          [0.148, 1.49 * s, 0.015],
          [0.124, 1.39 * s, 0.042],
        ],
        [0.058, 0.055, 0.036],
        [0.020, 0.020, 0.012],
        hairMat,
        bones.skeleton,
      ),
      // Side-swept fringe
      buildHairRibbonSkinnedMesh(
        [
          [-0.03, 1.64 * s, 0.05],
          [0.02, 1.602 * s, 0.138],
          [0.085, 1.545 * s, 0.126],
        ],
        [0.056, 0.046, 0.016],
        [0.016, 0.014, 0.005],
        hairMat,
        bones.skeleton,
      ),
      buildHairRibbonSkinnedMesh(
        [
          [-0.035, 1.635 * s, 0.055],
          [-0.088, 1.585 * s, 0.118],
          [-0.116, 1.51 * s, 0.092],
        ],
        [0.046, 0.038, 0.014],
        [0.015, 0.012, 0.005],
        hairMat,
        bones.skeleton,
      ),
    );
  } else if (config.hairstyle === 'high-ponytail') {
    meshes.push(
      // Wispy bangs
      buildHairRibbonSkinnedMesh(
        [
          [0, 1.64 * s, 0.055],
          [-0.045, 1.595 * s, 0.138],
          [-0.072, 1.548 * s, 0.136],
        ],
        [0.044, 0.034, 0.012],
        [0.014, 0.011, 0.004],
        hairMat,
        bones.skeleton,
      ),
      buildHairRibbonSkinnedMesh(
        [
          [0, 1.64 * s, 0.055],
          [0.045, 1.595 * s, 0.138],
          [0.072, 1.548 * s, 0.136],
        ],
        [0.044, 0.034, 0.012],
        [0.014, 0.011, 0.004],
        hairMat,
        bones.skeleton,
      ),
      buildHairRibbonSkinnedMesh(
        [
          [0, 1.64 * s, 0.06],
          [0.005, 1.596 * s, 0.143],
          [0.012, 1.552 * s, 0.143],
        ],
        [0.030, 0.024, 0.010],
        [0.012, 0.009, 0.003],
        hairMat,
        bones.skeleton,
      ),
      // Lively high ponytail tail sweeping down the back
      buildTaperedCurveSkinnedMesh(
        [
          [0, 1.615 * s, -0.132],
          [0, 1.625 * s, -0.205],
          [0, 1.495 * s, -0.242],
          [0, 1.355 * s, -0.210],
        ],
        [0.042, 0.058, 0.048, 0.016],
        1.15,
        0.88,
        12,
        BONE.HEAD,
        hairMat,
        bones.skeleton,
        castShadow,
      ),
    );
  } else if (config.hairstyle === 'twin-braids') {
    meshes.push(
      // Smooth center-parted front hair
      buildHairRibbonSkinnedMesh(
        [
          [0, 1.64 * s, 0.05],
          [-0.062, 1.595 * s, 0.126],
          [-0.106, 1.505 * s, 0.095],
        ],
        [0.048, 0.040, 0.018],
        [0.016, 0.014, 0.006],
        hairMat,
        bones.skeleton,
      ),
      buildHairRibbonSkinnedMesh(
        [
          [0, 1.64 * s, 0.05],
          [0.062, 1.595 * s, 0.126],
          [0.106, 1.505 * s, 0.095],
        ],
        [0.048, 0.040, 0.018],
        [0.016, 0.014, 0.006],
        hairMat,
        bones.skeleton,
      ),
      // Left & right twin braids draping over shoulders onto upper chest
      buildHairRibbonSkinnedMesh(
        [
          [-0.104, 1.48 * s, -0.01],
          [-0.118, 1.35 * s, 0.058],
          [-0.094, 1.21 * s, 0.108],
          [-0.086, 1.13 * s, 0.112],
        ],
        [0.032, 0.034, 0.026, 0.010],
        [0.024, 0.026, 0.020, 0.008],
        hairMat,
        bones.skeleton,
        {followChestLower: true, castShadow},
      ),
      buildHairRibbonSkinnedMesh(
        [
          [0.104, 1.48 * s, -0.01],
          [0.118, 1.35 * s, 0.058],
          [0.094, 1.21 * s, 0.108],
          [0.086, 1.13 * s, 0.112],
        ],
        [0.032, 0.034, 0.026, 0.010],
        [0.024, 0.026, 0.020, 0.008],
        hairMat,
        bones.skeleton,
        {followChestLower: true, castShadow},
      ),
    );
  } else if (config.hairstyle === 'short-quiff') {
    meshes.push(
      // Swept textured quiff front + sideburns + clean tapered nape
      buildHairRibbonSkinnedMesh(
        [
          [-0.04, 1.642 * s, 0.048],
          [-0.01, 1.622 * s, 0.128],
          [0.058, 1.580 * s, 0.132],
          [0.098, 1.525 * s, 0.108],
        ],
        [0.068, 0.060, 0.042, 0.012],
        [0.024, 0.022, 0.015, 0.005],
        hairMat,
        bones.skeleton,
      ),
      buildHairRibbonSkinnedMesh(
        [
          [-0.05, 1.635 * s, 0.05],
          [-0.094, 1.588 * s, 0.114],
          [-0.118, 1.515 * s, 0.086],
        ],
        [0.052, 0.038, 0.014],
        [0.018, 0.014, 0.005],
        hairMat,
        bones.skeleton,
      ),
      buildHairRibbonSkinnedMesh(
        [
          [-0.106, 1.56 * s, 0.024],
          [-0.126, 1.495 * s, 0.032],
          [-0.114, 1.445 * s, 0.024],
        ],
        [0.024, 0.018, 0.007],
        [0.011, 0.009, 0.004],
        hairMat,
        bones.skeleton,
      ),
      buildHairRibbonSkinnedMesh(
        [
          [0.106, 1.56 * s, 0.024],
          [0.126, 1.495 * s, 0.032],
          [0.114, 1.445 * s, 0.024],
        ],
        [0.024, 0.018, 0.007],
        [0.011, 0.009, 0.004],
        hairMat,
        bones.skeleton,
      ),
      buildHairRibbonSkinnedMesh(
        [
          [0, 1.52 * s, -0.118],
          [0, 1.44 * s, -0.126],
          [0, 1.38 * s, -0.092],
        ],
        [0.106, 0.086, 0.044],
        [0.020, 0.016, 0.008],
        hairMat,
        bones.skeleton,
      ),
    );
  } else if (config.hairstyle === 'neat-parted') {
    meshes.push(
      // Classic side-parted gentleman wave
      buildHairRibbonSkinnedMesh(
        [
          [-0.045, 1.635 * s, 0.052],
          [0.012, 1.612 * s, 0.128],
          [0.082, 1.576 * s, 0.115],
        ],
        [0.056, 0.048, 0.020],
        [0.018, 0.016, 0.007],
        hairMat,
        bones.skeleton,
      ),
      buildHairRibbonSkinnedMesh(
        [
          [-0.05, 1.628 * s, 0.05],
          [-0.106, 1.572 * s, 0.092],
          [-0.120, 1.505 * s, 0.065],
        ],
        [0.042, 0.032, 0.012],
        [0.014, 0.011, 0.005],
        hairMat,
        bones.skeleton,
      ),
      buildHairRibbonSkinnedMesh(
        [
          [0, 1.52 * s, -0.118],
          [0, 1.44 * s, -0.122],
          [0, 1.385 * s, -0.088],
        ],
        [0.102, 0.082, 0.042],
        [0.018, 0.014, 0.007],
        hairMat,
        bones.skeleton,
      ),
    );
  } else if (config.hairstyle === 'low-messy-bun') {
    meshes.push(
      buildHairRibbonSkinnedMesh(
        [
          [0, 1.64 * s, 0.045],
          [-0.048, 1.595 * s, 0.136],
          [-0.105, 1.505 * s, 0.112],
        ],
        [0.050, 0.038, 0.010],
        [0.016, 0.014, 0.004],
        hairMat,
        bones.skeleton,
      ),
      buildHairRibbonSkinnedMesh(
        [
          [0, 1.64 * s, 0.045],
          [0.048, 1.595 * s, 0.136],
          [0.105, 1.505 * s, 0.112],
        ],
        [0.050, 0.038, 0.010],
        [0.016, 0.014, 0.004],
        hairMat,
        bones.skeleton,
      ),
      buildHairRibbonSkinnedMesh(
        [
          [-0.095, 1.59 * s, 0.05],
          [-0.125, 1.495 * s, 0.088],
          [-0.112, 1.405 * s, 0.096],
        ],
        [0.018, 0.014, 0.005],
        [0.008, 0.006, 0.003],
        hairMat,
        bones.skeleton,
      ),
      buildHairRibbonSkinnedMesh(
        [
          [0.095, 1.59 * s, 0.05],
          [0.125, 1.495 * s, 0.088],
          [0.112, 1.405 * s, 0.096],
        ],
        [0.018, 0.014, 0.005],
        [0.008, 0.006, 0.003],
        hairMat,
        bones.skeleton,
      ),
      buildTaperedCurveSkinnedMesh(
        [
          [0, 1.475 * s, -0.135],
          [0, 1.455 * s, -0.205],
        ],
        [0.068, 0.038],
        1.08,
        0.95,
        10,
        BONE.HEAD,
        hairMat,
        bones.skeleton,
      ),
    );
  } else {
    // elder-top-bun
    meshes.push(
      buildHairRibbonSkinnedMesh(
        [
          [-0.09, 1.60 * s, 0.03],
          [-0.122, 1.50 * s, 0.065],
          [-0.115, 1.43 * s, 0.06],
        ],
        [0.022, 0.016, 0.005],
        [0.009, 0.007, 0.003],
        hairMat,
        bones.skeleton,
      ),
      buildHairRibbonSkinnedMesh(
        [
          [0.09, 1.60 * s, 0.03],
          [0.122, 1.50 * s, 0.065],
          [0.115, 1.43 * s, 0.06],
        ],
        [0.022, 0.016, 0.005],
        [0.009, 0.007, 0.003],
        hairMat,
        bones.skeleton,
      ),
      buildTaperedCurveSkinnedMesh(
        [
          [0, 1.67 * s, -0.02],
          [0, 1.755 * s, -0.04],
        ],
        [0.072, 0.042],
        1.06,
        1.0,
        10,
        BONE.HEAD,
        hairMat,
        bones.skeleton,
      ),
      buildTaperedCurveSkinnedMesh(
        [
          [-0.085, 1.71 * s, -0.035],
          [0.085, 1.74 * s, -0.035],
        ],
        [0.006, 0.009],
        1.0,
        1.0,
        6,
        BONE.HEAD,
        pearlMat,
        bones.skeleton,
      ),
    );
  }

  for (const m of meshes) group.add(m);

  if (config.hasPearlEarrings || config.earringColor !== undefined || config.preset === 'som-o') {
    const earMat =
      config.earringColor !== undefined
        ? new THREE.MeshStandardMaterial({color: config.earringColor, metalness: 0.72, roughness: 0.25})
        : config.preset === 'som-o'
          ? new THREE.MeshStandardMaterial({color: 0xe6b85c, metalness: 0.72, roughness: 0.25})
          : pearlMat;
    const studGeo = new THREE.SphereGeometry(0.011 * s, 8, 8);
    for (const side of [-1, 1] as const) {
      const stud = new THREE.Mesh(studGeo, earMat);
      stud.position.set(side * 0.148 * s, 0.090 * s, 0.002 * s);
      bones.head.add(stud);
    }
  }

  if (config.hasHairClip) {
    const clipMat = new THREE.MeshStandardMaterial({
      color: config.hairClipColor ?? 0xe8bd5c,
      metalness: 0.65,
      roughness: 0.25,
    });
    const clip = new THREE.Mesh(new THREE.BoxGeometry(0.026 * s, 0.010 * s, 0.012 * s), clipMat);
    clip.position.set(-0.095 * s, 0.205 * s, 0.092 * s);
    clip.rotation.z = 0.28;
    clip.rotation.y = -0.52;
    bones.head.add(clip);
  }

  if (config.hasMustache) {
    const stache = new THREE.Mesh(
      new THREE.BoxGeometry(0.056 * s, 0.011 * s, 0.012 * s),
      hairMat,
    );
    stache.position.set(0, 0.088 * s, 0.145 * s);
    bones.head.add(stache);
  }

  if (config.hasGlasses) {
    const rimMat = new THREE.MeshStandardMaterial({
      color: config.glassStyle === 'rect' ? 0x26282e : 0x3b3d42,
      metalness: 0.78,
      roughness: 0.24,
    });
    if (config.glassStyle === 'rect') {
      const frameGeo = new THREE.BoxGeometry(0.050 * s, 0.032 * s, 0.005 * s);
      const lGlass = new THREE.Mesh(frameGeo, rimMat);
      lGlass.position.set(-0.046 * s, 0.132 * s, 0.140 * s);
      // Hollow look using thin rim frame pieces on top/bottom/sides
      lGlass.scale.set(1, 0.16, 1);
      lGlass.position.y = 0.145 * s;
      const lBottom = new THREE.Mesh(frameGeo, rimMat);
      lBottom.scale.set(1, 0.14, 1);
      lBottom.position.set(-0.046 * s, 0.118 * s, 0.140 * s);
      const rTop = lGlass.clone();
      rTop.position.x = 0.046 * s;
      const rBottom = lBottom.clone();
      rBottom.position.x = 0.046 * s;
      const sidePostGeo = new THREE.BoxGeometry(0.005 * s, 0.030 * s, 0.005 * s);
      const p1 = new THREE.Mesh(sidePostGeo, rimMat);
      p1.position.set(-0.070 * s, 0.132 * s, 0.140 * s);
      const p2 = new THREE.Mesh(sidePostGeo, rimMat);
      p2.position.set(-0.022 * s, 0.132 * s, 0.140 * s);
      const p3 = new THREE.Mesh(sidePostGeo, rimMat);
      p3.position.set(0.022 * s, 0.132 * s, 0.140 * s);
      const p4 = new THREE.Mesh(sidePostGeo, rimMat);
      p4.position.set(0.070 * s, 0.132 * s, 0.140 * s);
      const bridge = new THREE.Mesh(new THREE.BoxGeometry(0.040 * s, 0.005 * s, 0.005 * s), rimMat);
      bridge.position.set(0, 0.141 * s, 0.140 * s);
      bones.head.add(lGlass, lBottom, rTop, rBottom, p1, p2, p3, p4, bridge);
    } else {
      const lensGeo = new THREE.TorusGeometry(0.03 * s, 0.0038 * s, 6, 14);
      const lGlass = new THREE.Mesh(lensGeo, rimMat);
      lGlass.position.set(-0.046 * s, 0.132 * s, 0.138 * s);
      const rGlass = new THREE.Mesh(lensGeo, rimMat);
      rGlass.position.set(0.046 * s, 0.132 * s, 0.138 * s);
      const bridge = new THREE.Mesh(new THREE.BoxGeometry(0.034 * s, 0.0045 * s, 0.0045 * s), rimMat);
      bridge.position.set(0, 0.136 * s, 0.140 * s);
      bones.head.add(lGlass, rGlass, bridge);
    }
  }

  if (config.hasHeadphones) {
    const bandMat = new THREE.MeshStandardMaterial({
      color: 0x262529,
      roughness: 0.42,
      metalness: 0.25,
    });
    const padMat = new THREE.MeshStandardMaterial({
      color: 0x8b5b34,
      roughness: 0.65,
    });
    const neckBand = new THREE.Mesh(
      new THREE.TorusGeometry(0.078 * s, 0.010 * s, 8, 16, Math.PI * 1.25),
      bandMat,
    );
    neckBand.rotation.x = Math.PI * 0.42;
    neckBand.rotation.z = -Math.PI * 0.12;
    neckBand.position.set(0, 0.18 * s, 0.018 * s);
    const cupGeo = new THREE.CylinderGeometry(0.028 * s, 0.028 * s, 0.022 * s, 10);
    cupGeo.rotateZ(Math.PI * 0.5);
    const lCup = new THREE.Mesh(cupGeo, padMat);
    lCup.position.set(-0.068 * s, 0.155 * s, 0.088 * s);
    const rCup = new THREE.Mesh(cupGeo, padMat);
    rCup.position.set(0.068 * s, 0.155 * s, 0.088 * s);
    bones.chest.add(neckBand, lCup, rCup);
  }

  if (config.hasCamera) {
    const camBodyMat = new THREE.MeshStandardMaterial({
      color: 0x24262b,
      roughness: 0.45,
      metalness: 0.35,
    });
    const camMetalMat = new THREE.MeshStandardMaterial({
      color: 0xd0d4dc,
      roughness: 0.28,
      metalness: 0.85,
    });
    const camGroup = new THREE.Group();
    const camBody = new THREE.Mesh(new THREE.BoxGeometry(0.095 * s, 0.056 * s, 0.036 * s), camBodyMat);
    const camTop = new THREE.Mesh(new THREE.BoxGeometry(0.095 * s, 0.014 * s, 0.036 * s), camMetalMat);
    camTop.position.y = 0.034 * s;
    const camLens = new THREE.Mesh(new THREE.CylinderGeometry(0.022 * s, 0.024 * s, 0.028 * s, 12), camMetalMat);
    camLens.rotation.x = Math.PI * 0.5;
    camLens.position.set(0, -0.002 * s, 0.028 * s);
    camGroup.add(camBody, camTop, camLens);
    camGroup.position.set(-0.015 * s, -0.055 * s, 0.045 * s);
    bones.rightWrist.add(camGroup);
  }

  if (config.hasNotebook && config.bagColor !== undefined) {
    const bookMat = new THREE.MeshStandardMaterial({
      color: config.bagColor,
      roughness: 0.72,
    });
    const book = new THREE.Mesh(new THREE.BoxGeometry(0.11, 0.024, 0.145), bookMat);
    book.position.set(-0.015, -0.05, 0.05);
    bones.rightWrist.add(book);
  } else if (config.hasHandbag && config.bagColor !== undefined) {
    const bagMat = new THREE.MeshStandardMaterial({
      color: config.bagColor,
      roughness: 0.76,
    });
    const bagBody = new THREE.Mesh(new THREE.SphereGeometry(0.074, seg, seg), bagMat);
    bagBody.scale.set(0.62, 1.04, 1.0);
    bagBody.position.set(0.025, -0.10, 0.02);
    bones.rightWrist.add(bagBody);
  }

  return {group, bones, textures};
}

export type LegacyShopkeeperGuestId =
  | 'tea-master'
  | 'spirit-blossom-kindred'
  | 'mococo-abyssgard'
  | 'diego-body'
  | 'cicada-suit-v2';

/**
 * Returning Former Shopkeeper Models as Shop Guests (excluding T-pose):
 * 1. tea-master (Traditional Tea Master)
 * 2. spirit-blossom-kindred (Spirit Blossom Kindred + floating spirit orb)
 * 3. mococo-abyssgard (Mococo Abyssgard with twin-tails, wolf ears/tail & fishnet tights)
 * 4. diego-body (Diego / Body with 4-button charcoal waistcoat & rolled shirt sleeves)
 * 5. cicada-suit-v2 (Ultimate CICADA Suit V2 tactical high-collar trench coat & shades)
 */
export function buildLegacyShopkeeperGuest(
  guestId: LegacyShopkeeperGuestId,
  compactMode: boolean,
  ultraCompact: boolean,
): SeamlessCharacterHandle {
  const seg = ultraCompact ? 10 : compactMode ? 12 : 16;
  const castShadow = !compactMode;

  if (guestId === 'tea-master') {
    const s = 1.01;
    const bones = createHumanoidSkeleton(s);
    const group = new THREE.Group();
    group.add(bones.root);

    const faceTex = createAnimeFaceTexture(
      {
        skinHex: '#f0cbb1',
        blushHex: 'rgba(218, 128, 118, 0.30)',
        irisTopHex: '#33241c',
        irisBottomHex: '#6c4d3a',
        browHex: '#28201c',
        lipHex: '#ab6a61',
        eyeScale: 0.92,
        smileCurve: 1.12,
        warmAgeLines: true,
      },
      compactMode,
    );
    const hairTex = createHairStrandTexture(
      '#2e2623',
      '#584942',
      '#1a1412',
      '#3a302b',
      compactMode,
    );
    const kimonoTex = createTailoredClothingTexture(
      {
        style: 'thai-blouse',
        baseHex: '#5a7856',
        grainHex: '#2f452d',
        accentHex: '#274d4b',
        buttonHex: '#d5c9ab',
      },
      compactMode,
    );
    const obiTex = createTailoredClothingTexture(
      {
        style: 'shirt',
        baseHex: '#e8dfc7',
        grainHex: '#c6ba9d',
      },
      compactMode,
    );
    const textures: THREE.Texture[] = [faceTex, hairTex, kimonoTex, obiTex];

    const {skinMat, headMat} = createCharacterMats({skin: 0xf0cbb1, faceTex});
    const kimonoMat = new THREE.MeshStandardMaterial({
      map: kimonoTex,
      roughness: 0.80,
      side: THREE.DoubleSide,
    });
    const tealTrimMat = new THREE.MeshStandardMaterial({
      color: 0x264b49,
      roughness: 0.78,
    });
    const obiMat = new THREE.MeshStandardMaterial({
      map: obiTex,
      roughness: 0.76,
    });
    const hakamaMat = new THREE.MeshStandardMaterial({
      color: 0x273f3f,
      roughness: 0.82,
    });
    const hairMat = new THREE.MeshStandardMaterial({
      map: hairTex,
      roughness: 0.48,
      metalness: 0.05,
    });
    const jadeMat = new THREE.MeshStandardMaterial({
      color: 0x529b6d,
      roughness: 0.25,
      metalness: 0.15,
    });
    const shoeMat = new THREE.MeshStandardMaterial({
      color: 0x6b472b,
      roughness: 0.54,
    });
    const soleMat = new THREE.MeshStandardMaterial({
      color: 0x2a1b12,
      roughness: 0.86,
    });

    const meshes: THREE.SkinnedMesh[] = [
      ...buildSeamlessTorso(s, seg, bones.skeleton, hakamaMat, kimonoMat, skinMat, {
        hasHead: true,
        slender: false,
        castShadow,
      }),
      ...buildSeamlessArm(-1, s, seg, bones.skeleton, kimonoMat, skinMat, skinMat, {
        sleeveEndsAtElbow: true,
        bulkySleeve: true,
        castShadow,
      }),
      ...buildSeamlessArm(1, s, seg, bones.skeleton, kimonoMat, skinMat, skinMat, {
        sleeveEndsAtElbow: true,
        bulkySleeve: true,
        castShadow,
      }),
      ...buildSeamlessLegAndShoe(-1, s, seg, bones.skeleton, hakamaMat, hakamaMat, shoeMat, soleMat, {
        castShadow,
      }),
      ...buildSeamlessLegAndShoe(1, s, seg, bones.skeleton, hakamaMat, hakamaMat, shoeMat, soleMat, {
        castShadow,
      }),
      buildSculptedHeadSkinnedMesh(1.52 * s, 0.15 * s, seg, headMat, bones.skeleton, {
        jawTaper: 0.76,
        faceFlatten: 0.91,
        castShadow,
      }),
      ...buildAnatomicalEarsSkinnedMesh(1.515 * s, 0.15 * s, skinMat, bones.skeleton, castShadow),
      // Stand collar + Teal Kimono lapel
      buildLoftedSkinnedMesh(
        [
          {center: [0, 1.318 * s, -0.002 * s], rx: 0.058 * s, rz: 0.058 * s, squareness: 0.1, weights: [BONE.CHEST, 0.35, BONE.NECK, 0.65], v: 0},
          {center: [0, 1.362 * s, -0.002 * s], rx: 0.056 * s, rz: 0.056 * s, squareness: 0.1, weights: [BONE.NECK, 0.85, BONE.CHEST, 0.15], v: 1},
        ],
        seg,
        tealTrimMat,
        bones.skeleton,
      ),
      // Snug Cream Obi Sash
      buildLoftedSkinnedMesh(
        [
          {center: [0, 0.855 * s, 0], rx: 0.158 * s, rz: 0.114 * s, squareness: 0.45, weights: [BONE.HIPS, 0.72, BONE.SPINE, 0.28], v: 0},
          {center: [0, 0.935 * s, 0], rx: 0.144 * s, rz: 0.104 * s, squareness: 0.45, weights: [BONE.HIPS, 0.45, BONE.SPINE, 0.55], v: 1},
        ],
        seg,
        obiMat,
        bones.skeleton,
      ),
      // Traditional Top-Bun Hairstyle
      buildHairCapSkinnedMesh(1.52 * s, 0.15 * s, seg, hairMat, bones.skeleton, {
        backDrop: 0.14,
        castShadow,
      }),
      buildHairRibbonSkinnedMesh(
        [
          [-0.088, 1.60 * s, 0.03],
          [-0.120, 1.505 * s, 0.062],
          [-0.112, 1.44 * s, 0.052],
        ],
        [0.022, 0.016, 0.005],
        [0.009, 0.007, 0.003],
        hairMat,
        bones.skeleton,
      ),
      buildHairRibbonSkinnedMesh(
        [
          [0.088, 1.60 * s, 0.03],
          [0.120, 1.505 * s, 0.062],
          [0.112, 1.44 * s, 0.052],
        ],
        [0.022, 0.016, 0.005],
        [0.009, 0.007, 0.003],
        hairMat,
        bones.skeleton,
      ),
      buildTaperedCurveSkinnedMesh(
        [
          [0, 1.67 * s, -0.02],
          [0, 1.75 * s, -0.038],
        ],
        [0.066, 0.038],
        1.05,
        1.0,
        10,
        BONE.HEAD,
        hairMat,
        bones.skeleton,
      ),
      buildTaperedCurveSkinnedMesh(
        [
          [-0.082, 1.71 * s, -0.034],
          [0.082, 1.735 * s, -0.034],
        ],
        [0.006, 0.008],
        1.0,
        1.0,
        6,
        BONE.HEAD,
        jadeMat,
        bones.skeleton,
      ),
    ];

    for (const m of meshes) group.add(m);

    // Back Obi Bow Knot
    const obiKnot = new THREE.Mesh(
      new THREE.BoxGeometry(0.11 * s, 0.065 * s, 0.045 * s),
      obiMat,
    );
    obiKnot.position.set(0, -0.045 * s, -0.118 * s);
    bones.spine.add(obiKnot);

    return {group, bones, textures};
  }

  if (guestId === 'spirit-blossom-kindred') {
    const s = 0.98;
    const bones = createHumanoidSkeleton(s);
    const group = new THREE.Group();
    group.add(bones.root);

    const faceTex = createAnimeFaceTexture(
      {
        skinHex: '#f8e7ea',
        blushHex: 'rgba(232, 148, 184, 0.36)',
        irisTopHex: '#5b488c',
        irisBottomHex: '#b89fe8',
        browHex: '#8d83a8',
        lipHex: '#c9788e',
        eyeScale: 1.04,
        smileCurve: 1.15,
      },
      compactMode,
    );
    const hairTex = createHairStrandTexture(
      '#e4e1f2',
      '#ffffff',
      '#b2add0',
      '#d5c4f0',
      compactMode,
    );
    const kimonoTex = createSakuraKimonoTexture(
      '#f2c6db',
      '#9e7cc4',
      '#fff4f9',
      compactMode,
    );
    const textures: THREE.Texture[] = [faceTex, hairTex, kimonoTex];

    const {skinMat, headMat} = createCharacterMats({skin: 0xf8e7ea, faceTex});
    const kimonoMat = new THREE.MeshStandardMaterial({
      map: kimonoTex,
      roughness: 0.74,
      side: THREE.DoubleSide,
    });
    const obiMat = new THREE.MeshStandardMaterial({
      color: 0x7c5ca6,
      roughness: 0.68,
    });
    const furMat = new THREE.MeshStandardMaterial({
      color: 0xfff8fc,
      roughness: 0.94,
    });
    const hornMat = new THREE.MeshStandardMaterial({
      color: 0x2c224d,
      roughness: 0.36,
      metalness: 0.14,
    });
    const hairMat = new THREE.MeshStandardMaterial({
      map: hairTex,
      roughness: 0.42,
      metalness: 0.08,
    });
    const stockingMat = new THREE.MeshStandardMaterial({
      color: 0xe3d8f5,
      roughness: 0.72,
    });
    const shoeMat = new THREE.MeshStandardMaterial({
      color: 0x674978,
      roughness: 0.48,
    });
    const soleMat = new THREE.MeshStandardMaterial({
      color: 0x352542,
      roughness: 0.85,
    });

    const wScale = 0.87;
    const meshes: THREE.SkinnedMesh[] = [
      ...buildSeamlessTorso(s, seg, bones.skeleton, kimonoMat, kimonoMat, skinMat, {
        hasHead: true,
        slender: true,
        castShadow,
      }),
      ...buildSeamlessArm(-1, s, seg, bones.skeleton, kimonoMat, skinMat, skinMat, {
        sleeveEndsAtElbow: true,
        bulkySleeve: true,
        castShadow,
      }),
      ...buildSeamlessArm(1, s, seg, bones.skeleton, kimonoMat, skinMat, skinMat, {
        sleeveEndsAtElbow: true,
        bulkySleeve: true,
        castShadow,
      }),
      ...buildSeamlessLegAndShoe(-1, s, seg, bones.skeleton, skinMat, stockingMat, shoeMat, soleMat, {
        thighWidth: 0.94,
        kneeHighStartY: 0.56,
        castShadow,
      }),
      ...buildSeamlessLegAndShoe(1, s, seg, bones.skeleton, skinMat, stockingMat, shoeMat, soleMat, {
        thighWidth: 0.94,
        kneeHighStartY: 0.56,
        castShadow,
      }),
      // Kimono Wrap Skirt
      buildCoatShellSkinnedMesh(
        [
          {y: 0.48 * s, rx: (0.174 * wScale + 0.010) * s, rz: (0.122 * wScale + 0.008) * s, squareness: 0.40, arcStart: 0, arcEnd: Math.PI * 2, upperBone: BONE.HIPS, upperWeight: 0.42, v: 0},
          {y: 0.64 * s, rx: (0.165 * wScale + 0.009) * s, rz: (0.116 * wScale + 0.008) * s, squareness: 0.42, arcStart: 0, arcEnd: Math.PI * 2, upperBone: BONE.HIPS, upperWeight: 0.72, v: 0.48},
          {y: 0.78 * s, rx: (0.156 * wScale + 0.008) * s, rz: (0.110 * wScale + 0.007) * s, squareness: 0.44, arcStart: 0, arcEnd: Math.PI * 2, upperBone: BONE.HIPS, upperWeight: 0.92, v: 1},
        ],
        seg,
        kimonoMat,
        bones.skeleton,
        castShadow,
      ),
      // Lavender Obi Sash
      buildLoftedSkinnedMesh(
        [
          {center: [0, 0.855 * s, 0], rx: 0.145 * s, rz: 0.105 * s, squareness: 0.45, weights: [BONE.HIPS, 0.72, BONE.SPINE, 0.28], v: 0},
          {center: [0, 0.935 * s, 0], rx: 0.128 * s, rz: 0.094 * s, squareness: 0.45, weights: [BONE.HIPS, 0.45, BONE.SPINE, 0.55], v: 1},
        ],
        seg,
        obiMat,
        bones.skeleton,
      ),
      buildSculptedHeadSkinnedMesh(1.52 * s, 0.15 * s, seg, headMat, bones.skeleton, {
        jawTaper: 0.68,
        faceFlatten: 0.90,
        castShadow,
      }),
      ...buildAnatomicalEarsSkinnedMesh(1.515 * s, 0.15 * s, skinMat, bones.skeleton, castShadow),
      buildHairCapSkinnedMesh(1.52 * s, 0.15 * s, seg, hairMat, bones.skeleton, {
        backDrop: 0.28,
        castShadow,
      }),
      // Long silvery back hair & front sakura bangs
      buildHairRibbonSkinnedMesh(
        [
          [0, 1.62 * s, -0.08],
          [0, 1.46 * s, -0.165],
          [0, 1.24 * s, -0.155],
          [0, 1.08 * s, -0.125],
        ],
        [0.148, 0.156, 0.135, 0.068],
        [0.026, 0.028, 0.022, 0.010],
        hairMat,
        bones.skeleton,
        {followChestLower: true, castShadow},
      ),
      buildHairRibbonSkinnedMesh(
        [
          [0, 1.64 * s, 0.055],
          [-0.045, 1.595 * s, 0.138],
          [-0.082, 1.525 * s, 0.125],
        ],
        [0.046, 0.036, 0.012],
        [0.014, 0.011, 0.004],
        hairMat,
        bones.skeleton,
      ),
      buildHairRibbonSkinnedMesh(
        [
          [0, 1.64 * s, 0.055],
          [0.045, 1.595 * s, 0.138],
          [0.082, 1.525 * s, 0.125],
        ],
        [0.046, 0.036, 0.012],
        [0.014, 0.011, 0.004],
        hairMat,
        bones.skeleton,
      ),
      // Curved Indigo Spirit Horns
      buildTaperedCurveSkinnedMesh(
        [
          [-0.078, 1.635 * s, 0.02],
          [-0.135, 1.715 * s, -0.025],
          [-0.145, 1.765 * s, -0.095],
          [-0.105, 1.735 * s, -0.145],
        ],
        [0.024, 0.020, 0.013, 0.005],
        1.0,
        1.0,
        8,
        BONE.HEAD,
        hornMat,
        bones.skeleton,
      ),
      buildTaperedCurveSkinnedMesh(
        [
          [0.078, 1.635 * s, 0.02],
          [0.135, 1.715 * s, -0.025],
          [0.145, 1.765 * s, -0.095],
          [0.105, 1.735 * s, -0.145],
        ],
        [0.024, 0.020, 0.013, 0.005],
        1.0,
        1.0,
        8,
        BONE.HEAD,
        hornMat,
        bones.skeleton,
      ),
    ];

    for (const m of meshes) group.add(m);

    // Fluffy Fur Collar Wrap around shoulders
    const furCollar = new THREE.Mesh(
      new THREE.TorusGeometry(0.118 * s, 0.028 * s, 8, 16),
      furMat,
    );
    furCollar.rotation.x = Math.PI * 0.46;
    furCollar.position.set(0, 0.155 * s, 0.005 * s);
    bones.chest.add(furCollar);

    // Tall Spirit Fox Ears + Porcelain Side Mask on head
    for (const side of [-1, 1] as const) {
      const earGroup = new THREE.Group();
      const outerEar = new THREE.Mesh(
        new THREE.ConeGeometry(0.036 * s, 0.115 * s, 8),
        hairMat,
      );
      const innerEar = new THREE.Mesh(
        new THREE.ConeGeometry(0.020 * s, 0.082 * s, 6),
        new THREE.MeshStandardMaterial({color: 0xf4b6cf, roughness: 0.8}),
      );
      innerEar.position.set(0, -0.005 * s, 0.016 * s);
      earGroup.add(outerEar, innerEar);
      earGroup.position.set(side * 0.075 * s, 0.295 * s, 0.012 * s);
      earGroup.rotation.z = -side * 0.28;
      earGroup.rotation.x = 0.12;
      bones.head.add(earGroup);
    }

    const sideMask = new THREE.Mesh(
      new THREE.SphereGeometry(0.048 * s, 10, 10),
      furMat,
    );
    sideMask.scale.set(0.85, 1.05, 0.45);
    sideMask.position.set(0.132 * s, 0.195 * s, 0.055 * s);
    sideMask.rotation.y = Math.PI * 0.36;
    sideMask.rotation.z = -0.22;
    bones.head.add(sideMask);

    // Floating Pastel Spirit Orb hovering beside Kindred
    const spiritOrbGroup = new THREE.Group();
    spiritOrbGroup.position.set(0.38 * s, 1.38 * s, -0.06 * s);
    const orbCore = new THREE.Mesh(
      new THREE.SphereGeometry(0.055 * s, 12, 12),
      new THREE.MeshStandardMaterial({
        color: 0xd9c2ff,
        emissive: 0x8b6be6,
        emissiveIntensity: 0.65,
        roughness: 0.25,
      }),
    );
    const orbHalo = new THREE.Mesh(
      new THREE.SphereGeometry(0.082 * s, 12, 12),
      new THREE.MeshStandardMaterial({
        color: 0xf5dcff,
        transparent: true,
        opacity: 0.35,
        roughness: 0.2,
      }),
    );
    spiritOrbGroup.add(orbCore, orbHalo);
    group.add(spiritOrbGroup);

    return {group, bones, spiritOrbGroup, textures};
  }

  if (guestId === 'mococo-abyssgard') {
    const s = 0.95;
    const wScale = 0.87;
    const bones = createHumanoidSkeleton(s);
    const group = new THREE.Group();
    group.add(bones.root);

    const faceTex = createAnimeFaceTexture(
      {
        skinHex: '#fbe0d0',
        blushHex: 'rgba(244, 138, 152, 0.44)',
        irisTopHex: '#733856',
        irisBottomHex: '#ee89ad',
        browHex: '#b38953',
        lipHex: '#d66e80',
        eyeScale: 1.05,
        smileCurve: 1.28,
      },
      compactMode,
    );
    const hairTex = createHairStrandTexture(
      '#f4db96',
      '#fff4cc',
      '#c7a55d',
      '#f296b8',
      compactMode,
    );
    const jacketTex = createTailoredClothingTexture(
      {
        style: 'hoodie-jacket',
        baseHex: '#25222c',
        grainHex: '#151319',
        trimHex: '#ef76a4',
      },
      compactMode,
    );
    const cropTex = createTailoredClothingTexture(
      {
        style: 'shirt',
        baseHex: '#faf7f9',
        grainHex: '#e1d9e0',
      },
      compactMode,
    );
    const fishnetTex = createFishnetStockingTexture(
      '#fbe0d0',
      '#241e29',
      '#ef78a6',
      compactMode,
    );
    const textures: THREE.Texture[] = [faceTex, hairTex, jacketTex, cropTex, fishnetTex];

    const {skinMat, headMat} = createCharacterMats({skin: 0xfbe0d0, faceTex});
    const jacketMat = new THREE.MeshStandardMaterial({
      map: jacketTex,
      roughness: 0.72,
      side: THREE.DoubleSide,
    });
    const cropMat = new THREE.MeshStandardMaterial({
      map: cropTex,
      roughness: 0.78,
    });
    const shortsMat = new THREE.MeshStandardMaterial({
      color: 0xf5f0f4,
      roughness: 0.78,
      side: THREE.DoubleSide,
    });
    const fishnetMat = new THREE.MeshStandardMaterial({
      map: fishnetTex,
      roughness: 0.68,
    });
    const pinkMat = new THREE.MeshStandardMaterial({
      color: 0xef74a2,
      roughness: 0.48,
    });
    const furMat = new THREE.MeshStandardMaterial({
      color: 0xfff8fb,
      roughness: 0.94,
    });
    const chokerMat = new THREE.MeshStandardMaterial({
      color: 0x1d1b22,
      roughness: 0.45,
    });
    const hairMat = new THREE.MeshStandardMaterial({
      map: hairTex,
      roughness: 0.44,
      metalness: 0.08,
    });
    const soleMat = new THREE.MeshStandardMaterial({
      color: 0xf5edf2,
      roughness: 0.85,
    });

    const meshes: THREE.SkinnedMesh[] = [
      ...buildSeamlessTorso(s, seg, bones.skeleton, shortsMat, cropMat, skinMat, {
        hasHead: true,
        slender: true,
        castShadow,
      }),
      ...buildSeamlessArm(-1, s, seg, bones.skeleton, jacketMat, skinMat, skinMat, {
        sleeveEndsAtElbow: true,
        castShadow,
      }),
      ...buildSeamlessArm(1, s, seg, bones.skeleton, jacketMat, skinMat, skinMat, {
        sleeveEndsAtElbow: true,
        castShadow,
      }),
      ...buildSeamlessLegAndShoe(-1, s, seg, bones.skeleton, skinMat, fishnetMat, pinkMat, soleMat, {
        thighWidth: 0.95,
        kneeHighStartY: 0.62,
        castShadow,
      }),
      ...buildSeamlessLegAndShoe(1, s, seg, bones.skeleton, skinMat, fishnetMat, pinkMat, soleMat, {
        thighWidth: 0.95,
        kneeHighStartY: 0.62,
        castShadow,
      }),
      // Snug Short White Pleat Skirt/Shorts Over Hip
      buildCoatShellSkinnedMesh(
        [
          {y: 0.64 * s, rx: (0.168 * wScale + 0.009) * s, rz: (0.118 * wScale + 0.008) * s, squareness: 0.42, arcStart: 0, arcEnd: Math.PI * 2, upperBone: BONE.HIPS, upperWeight: 0.72, v: 0},
          {y: 0.78 * s, rx: (0.156 * wScale + 0.008) * s, rz: (0.110 * wScale + 0.007) * s, squareness: 0.44, arcStart: 0, arcEnd: Math.PI * 2, upperBone: BONE.HIPS, upperWeight: 0.94, v: 1},
        ],
        seg,
        shortsMat,
        bones.skeleton,
        castShadow,
      ),
      // Snug Cropped Black-and-Pink Jacket Shell
      buildCoatShellSkinnedMesh(
        [
          {y: 0.90 * s, zOffset: 0, rx: (0.132 * wScale + 0.007) * s, rz: (0.094 * wScale + 0.007) * s, squareness: 0.43, arcStart: -Math.PI * 0.20, arcEnd: Math.PI * 1.20, upperBone: BONE.SPINE, upperWeight: 1, v: 0},
          {y: 1.06 * s, zOffset: 0.005 * s, rx: (0.150 * wScale + 0.007) * s, rz: (0.108 * wScale + 0.007) * s, squareness: 0.43, arcStart: -Math.PI * 0.22, arcEnd: Math.PI * 1.22, upperBone: BONE.CHEST, upperWeight: 1, v: 0.5},
          {y: 1.22 * s, zOffset: 0.005 * s, rx: (0.168 * wScale + 0.007) * s, rz: (0.110 * wScale + 0.007) * s, squareness: 0.43, arcStart: -Math.PI * 0.18, arcEnd: Math.PI * 1.18, upperBone: BONE.CHEST, upperWeight: 1, v: 1},
        ],
        seg,
        jacketMat,
        bones.skeleton,
        castShadow,
      ),
      // Pink Waist Belt
      buildLoftedSkinnedMesh(
        [
          {center: [0, 0.79 * s, 0], rx: 0.162 * wScale * s, rz: 0.116 * wScale * s, squareness: 0.44, weights: [BONE.HIPS, 0.85, BONE.SPINE, 0.15], v: 0},
          {center: [0, 0.825 * s, 0], rx: 0.158 * wScale * s, rz: 0.113 * wScale * s, squareness: 0.44, weights: [BONE.HIPS, 0.80, BONE.SPINE, 0.20], v: 1},
        ],
        seg,
        pinkMat,
        bones.skeleton,
      ),
      // Black Choker Collar
      buildLoftedSkinnedMesh(
        [
          {center: [0, 1.345 * s, -0.002 * s], rx: 0.053 * s, rz: 0.053 * s, weights: [BONE.NECK, 0.8, BONE.HEAD, 0.2], v: 0},
          {center: [0, 1.372 * s, -0.002 * s], rx: 0.053 * s, rz: 0.053 * s, weights: [BONE.NECK, 0.7, BONE.HEAD, 0.3], v: 1},
        ],
        seg,
        chokerMat,
        bones.skeleton,
      ),
      buildSculptedHeadSkinnedMesh(1.52 * s, 0.15 * s, seg, headMat, bones.skeleton, {
        jawTaper: 0.66,
        faceFlatten: 0.90,
        castShadow,
      }),
      ...buildAnatomicalEarsSkinnedMesh(1.515 * s, 0.15 * s, skinMat, bones.skeleton, castShadow),
      buildHairCapSkinnedMesh(1.52 * s, 0.15 * s, seg, hairMat, bones.skeleton, {
        backDrop: 0.18,
        castShadow,
      }),
      // Wispy Front Bangs
      buildHairRibbonSkinnedMesh(
        [
          [0, 1.64 * s, 0.055],
          [-0.045, 1.595 * s, 0.138],
          [-0.072, 1.545 * s, 0.136],
        ],
        [0.044, 0.034, 0.012],
        [0.014, 0.011, 0.004],
        hairMat,
        bones.skeleton,
      ),
      buildHairRibbonSkinnedMesh(
        [
          [0, 1.64 * s, 0.055],
          [0.045, 1.595 * s, 0.138],
          [0.072, 1.545 * s, 0.136],
        ],
        [0.044, 0.034, 0.012],
        [0.014, 0.011, 0.004],
        hairMat,
        bones.skeleton,
      ),
      // Iconic Blonde-to-Pink Twin-Tails
      buildTaperedCurveSkinnedMesh(
        [
          [-0.122 * s, 1.59 * s, -0.035],
          [-0.215 * s, 1.54 * s, -0.075],
          [-0.245 * s, 1.36 * s, -0.085],
          [-0.210 * s, 1.18 * s, -0.065],
        ],
        [0.038, 0.052, 0.044, 0.014],
        1.1,
        0.9,
        10,
        BONE.HEAD,
        hairMat,
        bones.skeleton,
        castShadow,
      ),
      buildTaperedCurveSkinnedMesh(
        [
          [0.122 * s, 1.59 * s, -0.035],
          [0.215 * s, 1.54 * s, -0.075],
          [0.245 * s, 1.36 * s, -0.085],
          [0.210 * s, 1.18 * s, -0.065],
        ],
        [0.038, 0.052, 0.044, 0.014],
        1.1,
        0.9,
        10,
        BONE.HEAD,
        hairMat,
        bones.skeleton,
        castShadow,
      ),
    ];

    for (const m of meshes) group.add(m);

    // Wolf Ears on Head
    for (const side of [-1, 1] as const) {
      const ear = new THREE.Mesh(
        new THREE.ConeGeometry(0.038 * s, 0.11 * s, 8),
        hairMat,
      );
      const earInner = new THREE.Mesh(
        new THREE.ConeGeometry(0.022 * s, 0.075 * s, 6),
        pinkMat,
      );
      earInner.position.set(0, -0.008 * s, 0.015 * s);
      const earGrp = new THREE.Group();
      earGrp.add(ear, earInner);
      earGrp.position.set(side * 0.082 * s, 0.285 * s, 0.01 * s);
      earGrp.rotation.z = -side * 0.34;
      earGrp.rotation.x = 0.14;
      bones.head.add(earGrp);
    }

    // Fluffy Fur Collar & Wolf Tail
    const collarFur = new THREE.Mesh(
      new THREE.TorusGeometry(0.098 * s, 0.020 * s, 8, 14),
      furMat,
    );
    collarFur.rotation.x = Math.PI * 0.46;
    collarFur.position.set(0, 0.15 * s, 0.006 * s);
    bones.chest.add(collarFur);

    const wolfTail = new THREE.Mesh(
      new THREE.ConeGeometry(0.058 * s, 0.28 * s, 10),
      hairMat,
    );
    wolfTail.position.set(0, -0.05 * s, -0.175 * s);
    wolfTail.rotation.x = -Math.PI * 0.36;
    bones.hips.add(wolfTail);

    return {group, bones, textures};
  }

  if (guestId === 'diego-body') {
    const s = 1.03;
    const bones = createHumanoidSkeleton(s);
    const group = new THREE.Group();
    group.add(bones.root);

    const faceTex = createAnimeFaceTexture(
      {
        skinHex: '#ecc19e',
        blushHex: 'rgba(210, 122, 112, 0.22)',
        irisTopHex: '#2b1e18',
        irisBottomHex: '#5e4334',
        browHex: '#1e1714',
        lipHex: '#a5675e',
        eyeScale: 0.92,
        smileCurve: 0.96,
      },
      compactMode,
    );
    const hairTex = createHairStrandTexture(
      '#201b18',
      '#463c36',
      '#100d0b',
      '#201b18',
      compactMode,
    );
    const waistcoatTex = createTailoredClothingTexture(
      {
        style: 'waistcoat',
        baseHex: '#2d3038',
        grainHex: '#1b1d23',
        accentHex: '#20232a',
        buttonHex: '#4f5563',
      },
      compactMode,
    );
    const shirtTex = createTailoredClothingTexture(
      {
        style: 'shirt',
        baseHex: '#737c8a',
        grainHex: '#59616e',
        buttonHex: '#9ba3b0',
      },
      compactMode,
    );
    const trouserTex = createTailoredClothingTexture(
      {
        style: 'waistcoat',
        baseHex: '#24272f',
        grainHex: '#16181e',
      },
      compactMode,
    );
    const textures: THREE.Texture[] = [
      faceTex,
      hairTex,
      waistcoatTex,
      shirtTex,
      trouserTex,
    ];

    const {skinMat, headMat} = createCharacterMats({skin: 0xecc19e, faceTex});
    const vestMat = new THREE.MeshStandardMaterial({
      map: waistcoatTex,
      roughness: 0.76,
      side: THREE.DoubleSide,
    });
    const shirtMat = new THREE.MeshStandardMaterial({
      map: shirtTex,
      roughness: 0.78,
    });
    const trouserMat = new THREE.MeshStandardMaterial({
      map: trouserTex,
      roughness: 0.80,
    });
    const hairMat = new THREE.MeshStandardMaterial({
      map: hairTex,
      roughness: 0.46,
      metalness: 0.06,
    });
    const shoeMat = new THREE.MeshStandardMaterial({
      color: 0x3b261b,
      roughness: 0.42,
      metalness: 0.06,
    });
    const soleMat = new THREE.MeshStandardMaterial({
      color: 0x1d1715,
      roughness: 0.88,
    });
    const buttonMat = new THREE.MeshStandardMaterial({
      color: 0x181a20,
      roughness: 0.35,
      metalness: 0.35,
    });

    const gap = 0.007 * s;
    const meshes: THREE.SkinnedMesh[] = [
      ...buildSeamlessTorso(s, seg, bones.skeleton, trouserMat, shirtMat, skinMat, {
        hasHead: true,
        slender: false,
        castShadow,
      }),
      ...buildSeamlessArm(-1, s, seg, bones.skeleton, shirtMat, skinMat, skinMat, {
        sleeveEndsAtElbow: true,
        castShadow,
      }),
      ...buildSeamlessArm(1, s, seg, bones.skeleton, shirtMat, skinMat, skinMat, {
        sleeveEndsAtElbow: true,
        castShadow,
      }),
      ...buildSeamlessLegAndShoe(-1, s, seg, bones.skeleton, trouserMat, trouserMat, shoeMat, soleMat, {
        castShadow,
      }),
      ...buildSeamlessLegAndShoe(1, s, seg, bones.skeleton, trouserMat, trouserMat, shoeMat, soleMat, {
        castShadow,
      }),
      // Tailored Charcoal 4-Button Waistcoat Shell
      buildCoatShellSkinnedMesh(
        [
          {y: 0.77 * s, zOffset: 0, rx: 0.158 * s + gap, rz: 0.111 * s + gap, squareness: 0.44, arcStart: -Math.PI * 0.28, arcEnd: Math.PI * 1.28, upperBone: BONE.HIPS, upperWeight: 0.82, v: 0},
          {y: 0.91 * s, zOffset: 0, rx: 0.132 * s + gap, rz: 0.094 * s + gap, squareness: 0.44, arcStart: -Math.PI * 0.28, arcEnd: Math.PI * 1.28, upperBone: BONE.SPINE, upperWeight: 1, v: 0.34},
          {y: 1.06 * s, zOffset: 0.005 * s, rx: 0.150 * s + gap, rz: 0.108 * s + gap, squareness: 0.44, arcStart: -Math.PI * 0.28, arcEnd: Math.PI * 1.28, upperBone: BONE.CHEST, upperWeight: 1, v: 0.68},
          {y: 1.22 * s, zOffset: 0.005 * s, rx: 0.168 * s + gap, rz: 0.110 * s + gap, squareness: 0.44, arcStart: -Math.PI * 0.24, arcEnd: Math.PI * 1.24, upperBone: BONE.CHEST, upperWeight: 1, v: 1},
        ],
        seg,
        vestMat,
        bones.skeleton,
        castShadow,
      ),
      buildSculptedHeadSkinnedMesh(1.52 * s, 0.15 * s, seg, headMat, bones.skeleton, {
        jawTaper: 0.78,
        faceFlatten: 0.92,
        castShadow,
      }),
      ...buildAnatomicalEarsSkinnedMesh(1.515 * s, 0.15 * s, skinMat, bones.skeleton, castShadow),
      buildHairCapSkinnedMesh(1.52 * s, 0.15 * s, seg, hairMat, bones.skeleton, {
        backDrop: 0.15,
        castShadow,
      }),
      // Neat Short Quiff Hair
      buildHairRibbonSkinnedMesh(
        [
          [-0.04, 1.642 * s, 0.048],
          [-0.01, 1.622 * s, 0.128],
          [0.058, 1.580 * s, 0.132],
          [0.098, 1.525 * s, 0.108],
        ],
        [0.068, 0.060, 0.042, 0.012],
        [0.024, 0.022, 0.015, 0.005],
        hairMat,
        bones.skeleton,
      ),
      buildHairRibbonSkinnedMesh(
        [
          [-0.05, 1.635 * s, 0.05],
          [-0.094, 1.588 * s, 0.114],
          [-0.118, 1.515 * s, 0.086],
        ],
        [0.052, 0.038, 0.014],
        [0.018, 0.014, 0.005],
        hairMat,
        bones.skeleton,
      ),
      buildHairRibbonSkinnedMesh(
        [
          [0, 1.52 * s, -0.118],
          [0, 1.44 * s, -0.124],
          [0, 1.38 * s, -0.090],
        ],
        [0.106, 0.086, 0.044],
        [0.020, 0.016, 0.008],
        hairMat,
        bones.skeleton,
      ),
    ];

    for (const m of meshes) group.add(m);

    // 4 Sculpted Vest Buttons down front
    const btnGeo = new THREE.CylinderGeometry(0.008 * s, 0.008 * s, 0.007 * s, 8);
    btnGeo.rotateX(Math.PI * 0.5);
    for (const by of [0.015 * s, -0.045 * s, -0.105 * s, -0.165 * s]) {
      const btn = new THREE.Mesh(btnGeo, buttonMat);
      btn.position.set(0, by, 0.118 * s);
      bones.chest.add(btn);
    }

    return {group, bones, textures};
  }

  // 'cicada-suit-v2': Ultimate CICADA Suit V2
  const s = 1.04;
  const bones = createHumanoidSkeleton(s);
  const group = new THREE.Group();
  group.add(bones.root);

  const faceTex = createAnimeFaceTexture(
    {
      skinHex: '#e8bc9a',
      blushHex: 'rgba(202, 118, 110, 0.20)',
      irisTopHex: '#251e22',
      irisBottomHex: '#4f3f48',
      browHex: '#1b1a1f',
      lipHex: '#9d625a',
      eyeScale: 0.90,
      smileCurve: 0.72,
    },
    compactMode,
  );
  const hairTex = createHairStrandTexture(
    '#1b1b21',
    '#414250',
    '#0e0e12',
    '#1b1b21',
    compactMode,
  );
  const trenchTex = createTailoredClothingTexture(
    {
      style: 'trench',
      baseHex: '#22242d',
      grainHex: '#14151b',
      accentHex: '#15171e',
      trimHex: '#414554',
    },
    compactMode,
  );
  const innerShirtTex = createTailoredClothingTexture(
    {
      style: 'shirt',
      baseHex: '#dfe2eb',
      grainHex: '#b9becb',
    },
    compactMode,
  );
  const textures: THREE.Texture[] = [faceTex, hairTex, trenchTex, innerShirtTex];

  const {skinMat, headMat} = createCharacterMats({skin: 0xe8bc9a, faceTex});
  const trenchMat = new THREE.MeshStandardMaterial({
    map: trenchTex,
    roughness: 0.68,
    metalness: 0.08,
    side: THREE.DoubleSide,
  });
  const shirtMat = new THREE.MeshStandardMaterial({
    map: innerShirtTex,
    roughness: 0.76,
  });
  const gloveMat = new THREE.MeshStandardMaterial({
    color: 0x1b1c22,
    roughness: 0.44,
    metalness: 0.10,
  });
  const trouserMat = new THREE.MeshStandardMaterial({
    color: 0x1b1d24,
    roughness: 0.78,
  });
  const tieMat = new THREE.MeshStandardMaterial({
    color: 0x5c3088,
    roughness: 0.56,
  });
  const hairMat = new THREE.MeshStandardMaterial({
    map: hairTex,
    roughness: 0.44,
    metalness: 0.06,
  });
  const shadeMat = new THREE.MeshStandardMaterial({
    color: 0x101116,
    roughness: 0.18,
    metalness: 0.65,
  });
  const metalMat = new THREE.MeshStandardMaterial({
    color: 0xc2c8d4,
    roughness: 0.28,
    metalness: 0.85,
  });
  const bootMat = new THREE.MeshStandardMaterial({
    color: 0x17181d,
    roughness: 0.48,
    metalness: 0.08,
  });
  const soleMat = new THREE.MeshStandardMaterial({
    color: 0x0f1014,
    roughness: 0.88,
  });

  const gap = 0.008 * s;
  const meshes: THREE.SkinnedMesh[] = [
    ...buildSeamlessTorso(s, seg, bones.skeleton, trouserMat, shirtMat, skinMat, {
      hasHead: true,
      slender: false,
      castShadow,
    }),
    // Long trench sleeves + dark tactical leather gloves!
    ...buildSeamlessArm(-1, s, seg, bones.skeleton, trenchMat, trenchMat, gloveMat, {
      sleeveEndsAtElbow: false,
      castShadow,
    }),
    ...buildSeamlessArm(1, s, seg, bones.skeleton, trenchMat, trenchMat, gloveMat, {
      sleeveEndsAtElbow: false,
      castShadow,
    }),
    ...buildSeamlessLegAndShoe(-1, s, seg, bones.skeleton, trouserMat, trouserMat, bootMat, soleMat, {
      castShadow,
    }),
    ...buildSeamlessLegAndShoe(1, s, seg, bones.skeleton, trouserMat, trouserMat, bootMat, soleMat, {
      castShadow,
    }),
    // Snug Dark Trench Coat Shell + High Stand Collar
    buildCoatShellSkinnedMesh(
      [
        {y: 0.62 * s, zOffset: 0, rx: 0.168 * s + gap, rz: 0.118 * s + gap, squareness: 0.44, arcStart: -Math.PI * 0.25, arcEnd: Math.PI * 1.25, upperBone: BONE.HIPS, upperWeight: 0.68, v: 0},
        {y: 0.77 * s, zOffset: 0, rx: 0.158 * s + gap, rz: 0.112 * s + gap, squareness: 0.44, arcStart: -Math.PI * 0.26, arcEnd: Math.PI * 1.26, upperBone: BONE.HIPS, upperWeight: 0.85, v: 0.25},
        {y: 0.91 * s, zOffset: 0, rx: 0.132 * s + gap, rz: 0.094 * s + gap, squareness: 0.44, arcStart: -Math.PI * 0.28, arcEnd: Math.PI * 1.28, upperBone: BONE.SPINE, upperWeight: 1, v: 0.50},
        {y: 1.06 * s, zOffset: 0.005 * s, rx: 0.150 * s + gap, rz: 0.108 * s + gap, squareness: 0.44, arcStart: -Math.PI * 0.28, arcEnd: Math.PI * 1.28, upperBone: BONE.CHEST, upperWeight: 1, v: 0.75},
        {y: 1.23 * s, zOffset: 0.004 * s, rx: 0.168 * s + gap, rz: 0.110 * s + gap, squareness: 0.44, arcStart: -Math.PI * 0.24, arcEnd: Math.PI * 1.24, upperBone: BONE.CHEST, upperWeight: 1, v: 1},
      ],
      seg,
      trenchMat,
      bones.skeleton,
      castShadow,
    ),
    // High Tactical Coat Collar
    buildCoatShellSkinnedMesh(
      [
        {y: 1.29 * s, zOffset: -0.004 * s, rx: 0.068 * s, rz: 0.066 * s, squareness: 0.18, arcStart: -Math.PI * 0.18, arcEnd: Math.PI * 1.18, upperBone: BONE.NECK, upperWeight: 0.65, v: 0},
        {y: 1.38 * s, zOffset: -0.005 * s, rx: 0.072 * s, rz: 0.070 * s, squareness: 0.18, arcStart: -Math.PI * 0.16, arcEnd: Math.PI * 1.16, upperBone: BONE.NECK, upperWeight: 0.88, v: 1},
      ],
      seg,
      trenchMat,
      bones.skeleton,
      castShadow,
    ),
    buildSculptedHeadSkinnedMesh(1.52 * s, 0.15 * s, seg, headMat, bones.skeleton, {
      jawTaper: 0.78,
      faceFlatten: 0.92,
      castShadow,
    }),
    ...buildAnatomicalEarsSkinnedMesh(1.515 * s, 0.15 * s, skinMat, bones.skeleton, castShadow),
    buildHairCapSkinnedMesh(1.52 * s, 0.15 * s, seg, hairMat, bones.skeleton, {
      backDrop: 0.14,
      castShadow,
    }),
    // Slicked-Back Gentleman Side-Part
    buildHairRibbonSkinnedMesh(
      [
        [-0.045, 1.635 * s, 0.052],
        [0.012, 1.612 * s, 0.128],
        [0.082, 1.576 * s, 0.115],
      ],
      [0.056, 0.048, 0.020],
      [0.018, 0.016, 0.007],
      hairMat,
      bones.skeleton,
    ),
    buildHairRibbonSkinnedMesh(
      [
        [-0.05, 1.628 * s, 0.05],
        [-0.106, 1.572 * s, 0.092],
        [-0.120, 1.505 * s, 0.065],
      ],
      [0.042, 0.032, 0.012],
      [0.014, 0.011, 0.005],
      hairMat,
      bones.skeleton,
    ),
    buildHairRibbonSkinnedMesh(
      [
        [0, 1.52 * s, -0.118],
        [0, 1.44 * s, -0.122],
        [0, 1.385 * s, -0.088],
      ],
      [0.102, 0.082, 0.042],
      [0.018, 0.014, 0.007],
      hairMat,
      bones.skeleton,
    ),
  ];

  for (const m of meshes) group.add(m);

  // Purple Necktie & Tactical Diagonal Chest Strap
  const tieKnot = new THREE.Mesh(
    new THREE.BoxGeometry(0.030 * s, 0.028 * s, 0.018 * s),
    tieMat,
  );
  tieKnot.position.set(0, 0.145 * s, 0.100 * s);
  const tieBlade = new THREE.Mesh(
    new THREE.BoxGeometry(0.032 * s, 0.195 * s, 0.012 * s),
    tieMat,
  );
  tieBlade.position.set(0, 0.038 * s, 0.115 * s);
  bones.chest.add(tieKnot, tieBlade);

  const strap = new THREE.Mesh(
    new THREE.BoxGeometry(0.030 * s, 0.36 * s, 0.014 * s),
    gloveMat,
  );
  strap.position.set(0, 0.01 * s, 0.119 * s);
  strap.rotation.z = 0.62;
  const strapBuckle = new THREE.Mesh(
    new THREE.BoxGeometry(0.038 * s, 0.028 * s, 0.018 * s),
    metalMat,
  );
  strapBuckle.position.set(0.035 * s, 0.04 * s, 0.122 * s);
  bones.chest.add(strap, strapBuckle);

  // Sleek Black Sunglasses + Tactical Earpiece on Head
  const lShade = new THREE.Mesh(
    new THREE.BoxGeometry(0.056 * s, 0.032 * s, 0.010 * s),
    shadeMat,
  );
  lShade.position.set(-0.046 * s, 0.132 * s, 0.144 * s);
  const rShade = lShade.clone();
  rShade.position.x = 0.046 * s;
  const shadeBridge = new THREE.Mesh(
    new THREE.BoxGeometry(0.040 * s, 0.008 * s, 0.008 * s),
    shadeMat,
  );
  shadeBridge.position.set(0, 0.140 * s, 0.144 * s);
  const earpiece = new THREE.Mesh(
    new THREE.BoxGeometry(0.014 * s, 0.026 * s, 0.016 * s),
    shadeMat,
  );
  earpiece.position.set(0.145 * s, 0.115 * s, 0.008 * s);
  bones.head.add(lShade, rShade, shadeBridge, earpiece);

  return {group, bones, textures};
}

/**
 * Shared skeletal animator for all seamless humanoids (walking, idle, brewing, seated).
 */
export function animateSeamlessHumanoid(
  bones: HumanoidBoneSet,
  elapsed: number,
  delta: number,
  options: {
    isMoving: boolean;
    walkPhase: number;
    walkSpeed: number;
    isPouring: boolean;
    step: string;
    isSeated: boolean;
    reducedMotion: boolean;
  },
) {
  const {
    isMoving,
    walkPhase,
    walkSpeed,
    isPouring,
    step,
    isSeated,
    reducedMotion,
  } = options;
  const damp = Math.min(1, delta * 10);

  if (isSeated) {
    bones.hips.position.y = THREE.MathUtils.lerp(
      bones.hips.position.y,
      bones.restHipsY - 0.25,
      damp,
    );
    bones.hips.rotation.y = THREE.MathUtils.lerp(bones.hips.rotation.y, 0, damp);
    bones.chest.rotation.y = THREE.MathUtils.lerp(bones.chest.rotation.y, 0, damp);
    bones.chest.rotation.x = reducedMotion ? 0 : Math.sin(elapsed * 1.5) * 0.018;

    bones.leftHip.rotation.x = THREE.MathUtils.lerp(
      bones.leftHip.rotation.x,
      -Math.PI * 0.46,
      damp,
    );
    bones.rightHip.rotation.x = THREE.MathUtils.lerp(
      bones.rightHip.rotation.x,
      -Math.PI * 0.46,
      damp,
    );
    bones.leftKnee.rotation.x = THREE.MathUtils.lerp(
      bones.leftKnee.rotation.x,
      Math.PI * 0.46,
      damp,
    );
    bones.rightKnee.rotation.x = THREE.MathUtils.lerp(
      bones.rightKnee.rotation.x,
      Math.PI * 0.46,
      damp,
    );
    bones.leftShoulder.rotation.x = THREE.MathUtils.lerp(
      bones.leftShoulder.rotation.x,
      -0.36,
      damp,
    );
    bones.rightShoulder.rotation.x = THREE.MathUtils.lerp(
      bones.rightShoulder.rotation.x,
      -0.36,
      damp,
    );
    bones.leftElbow.rotation.x = THREE.MathUtils.lerp(
      bones.leftElbow.rotation.x,
      -0.45,
      damp,
    );
    bones.rightElbow.rotation.x = THREE.MathUtils.lerp(
      bones.rightElbow.rotation.x,
      -0.45,
      damp,
    );
    bones.head.rotation.y = reducedMotion ? 0 : Math.sin(elapsed * 0.65) * 0.08;
    return;
  }

  if (isMoving && !reducedMotion) {
    const swing = Math.sin(walkPhase) * 0.56 * walkSpeed;
    bones.hips.position.y =
      bones.restHipsY + Math.abs(Math.sin(walkPhase)) * 0.022 * walkSpeed;
    bones.hips.rotation.y = Math.sin(walkPhase) * 0.055 * walkSpeed;
    bones.chest.rotation.y = -Math.sin(walkPhase) * 0.06 * walkSpeed;
    bones.chest.rotation.x = 0.03 * walkSpeed;

    bones.leftHip.rotation.x = -swing;
    bones.rightHip.rotation.x = swing;
    bones.leftKnee.rotation.x = Math.max(0.06, swing * 0.78);
    bones.rightKnee.rotation.x = Math.max(0.06, -swing * 0.78);

    bones.leftShoulder.rotation.x = swing * 0.46;
    bones.rightShoulder.rotation.x = -swing * 0.46;
    bones.leftElbow.rotation.x = -0.22 - Math.max(0, -swing * 0.25);
    bones.rightElbow.rotation.x = -0.22 - Math.max(0, swing * 0.25);
    bones.head.rotation.y = Math.sin(elapsed * 0.9) * 0.04;
    return;
  }

  // Idle / Brewing Stand Pose
  const breathe = reducedMotion ? 0 : Math.sin(elapsed * 1.9) * 0.018;
  bones.hips.position.y = THREE.MathUtils.lerp(
    bones.hips.position.y,
    bones.restHipsY,
    damp,
  );
  bones.hips.rotation.y = THREE.MathUtils.lerp(bones.hips.rotation.y, 0, damp);
  bones.chest.rotation.y = THREE.MathUtils.lerp(bones.chest.rotation.y, 0, damp);
  bones.chest.rotation.x = breathe;

  bones.leftHip.rotation.x = THREE.MathUtils.lerp(bones.leftHip.rotation.x, 0, damp);
  bones.rightHip.rotation.x = THREE.MathUtils.lerp(bones.rightHip.rotation.x, 0, damp);
  bones.leftKnee.rotation.x = THREE.MathUtils.lerp(bones.leftKnee.rotation.x, 0.04, damp);
  bones.rightKnee.rotation.x = THREE.MathUtils.lerp(bones.rightKnee.rotation.x, 0.04, damp);

  let targetRightShoulder = -0.06 + breathe;
  let targetLeftShoulder = -0.06 - breathe;
  let targetRightElbow = -0.14;
  let targetLeftElbow = -0.14;

  if (isPouring || step === 'POUR_WATER') {
    targetRightShoulder = -0.62;
    targetRightElbow = -0.35;
    targetLeftShoulder = -0.22;
  } else if (step === 'STEEP_TEA') {
    targetRightShoulder = -0.46;
    targetLeftShoulder = -0.38;
    targetRightElbow = -0.45;
    targetLeftElbow = -0.45;
  }

  bones.rightShoulder.rotation.x = THREE.MathUtils.lerp(
    bones.rightShoulder.rotation.x,
    targetRightShoulder,
    damp,
  );
  bones.leftShoulder.rotation.x = THREE.MathUtils.lerp(
    bones.leftShoulder.rotation.x,
    targetLeftShoulder,
    damp,
  );
  bones.rightElbow.rotation.x = THREE.MathUtils.lerp(
    bones.rightElbow.rotation.x,
    targetRightElbow,
    damp,
  );
  bones.leftElbow.rotation.x = THREE.MathUtils.lerp(
    bones.leftElbow.rotation.x,
    targetLeftElbow,
    damp,
  );
  bones.head.rotation.y = reducedMotion ? 0 : Math.sin(elapsed * 0.7) * 0.06;
}
