import * as THREE from 'three';
import {BrewStep, CustomerPhase, GameMode} from '../types/tea';

export const SHOP_FLOOR_Y = -0.78;
export const PLAYER_SPAWN_POS = new THREE.Vector3(0.45, SHOP_FLOOR_Y, 2.72);
export const PLAYER_SPAWN_ROT_Y = Math.PI;

const DOOR_OUTSIDE_POS = new THREE.Vector2(6.65, -1.80);
const DOOR_THRESHOLD_X = 5.32;
const SEAT_LEFT_POS = new THREE.Vector3(-1.55, SHOP_FLOOR_Y, -1.92);
const SEAT_LEFT_ROT_Y = 0.28;

// Walkable path from outside stone patio -> under Noren doorway -> guest aisle -> Seat 1
const CUSTOMER_WAYPOINTS: THREE.Vector2[] = [
  new THREE.Vector2(6.65, -1.80),
  new THREE.Vector2(5.10, -1.80),
  new THREE.Vector2(3.65, -2.12),
  new THREE.Vector2(0.85, -2.35),
  new THREE.Vector2(-1.55, -2.38),
  new THREE.Vector2(-1.55, -1.92),
];

export interface CharacterTickResult {
  playerPos: THREE.Vector3;
  playerRotY: number;
  isNearTeaTable: boolean;
  customerPhase: CustomerPhase;
  customerCrossedDoorNow: boolean;
}

export interface ShopCharactersHandles {
  root: THREE.Group;
  teaMasterGroup: THREE.Group;
  guestsContainer: THREE.Group;
  startCustomerWalkIn: (guestId: string) => void;
  setFirstPersonHidden: (hidden: boolean) => void;
  movePlayer: (
    inputX: number,
    inputY: number,
    cameraYaw: number,
    delta: number,
  ) => void;
  getPlayerPosition: () => THREE.Vector3;
  getPlayerRotationY: () => number;
  isNearTeaTable: () => boolean;
  animate: (
    elapsed: number,
    delta: number,
    step: BrewStep,
    isPouring: boolean,
    mode: GameMode,
    guestId: string,
    reducedMotion: boolean,
  ) => CharacterTickResult;
}

interface LimbRig {
  leftLeg: THREE.Group;
  rightLeg: THREE.Group;
  leftShin?: THREE.Group;
  rightShin?: THREE.Group;
  leftArm: THREE.Group;
  rightArm: THREE.Group;
  head: THREE.Group;
  tail?: THREE.Group;
  seatedOnlyGroup?: THREE.Group;
  standingLegsGroup?: THREE.Group;
}

function clampToShopObstacles(x: number, z: number): {x: number; z: number} {
  let nx = THREE.MathUtils.clamp(x, -4.82, 4.82);
  let nz = THREE.MathUtils.clamp(z, -2.68, 4.35);

  // Main Tea Counter AABB (x: -3.2..3.2, z: -1.17..1.28) + character radius padding 0.34
  const cMinX = -3.54;
  const cMaxX = 3.54;
  const cMinZ = -1.52;
  const cMaxZ = 1.64;

  if (nx > cMinX && nx < cMaxX && nz > cMinZ && nz < cMaxZ) {
    const dLeft = Math.abs(nx - cMinX);
    const dRight = Math.abs(cMaxX - nx);
    const dBack = Math.abs(nz - cMinZ);
    const dFront = Math.abs(cMaxZ - nz);
    const minD = Math.min(dLeft, dRight, dBack, dFront);
    if (minD === dFront) nz = cMaxZ;
    else if (minD === dBack) nz = cMinZ;
    else if (minD === dLeft) nx = cMinX;
    else nx = cMaxX;
  }

  // Push outside circular furniture (Guest Chairs & Side Table)
  const circles: [number, number, number][] = [
    [-1.55, -1.92, 0.62],
    [1.55, -1.96, 0.56],
    [2.42, -1.78, 0.52],
  ];
  for (const [cx, cz, rad] of circles) {
    const dx = nx - cx;
    const dz = nz - cz;
    const dist = Math.hypot(dx, dz);
    if (dist < rad) {
      const inv = dist > 0.001 ? 1 / dist : 1;
      nx = cx + (dist > 0.001 ? dx * inv : 0) * rad;
      nz = cz + (dist > 0.001 ? dz * inv : 1) * rad;
    }
  }

  nx = THREE.MathUtils.clamp(nx, -4.82, 4.82);
  nz = THREE.MathUtils.clamp(nz, -2.68, 4.35);
  return {x: nx, z: nz};
}

function checkNearTeaTable(pos: THREE.Vector3): boolean {
  const px = pos.x;
  const pz = pos.z;
  // Front-of-counter brewing spot (customer-facing side of tray) or side access
  const inFrontBrewZone = Math.abs(px) <= 2.35 && pz >= 1.2 && pz <= 2.75;
  const nearCounterCenter = Math.hypot(px, pz - 1.35) <= 2.05;
  const nearLeftOrRightEnd =
    Math.abs(px) <= 4.15 && pz >= -1.25 && pz <= 2.15;
  return inFrontBrewZone || nearCounterCenter || nearLeftOrRightEnd;
}

export function createTeaChair(
  walnutTex: THREE.CanvasTexture,
  cushionColorHex: number,
  compactMode = false,
): THREE.Group {
  const chair = new THREE.Group();
  const woodMat = new THREE.MeshStandardMaterial({
    map: walnutTex,
    roughness: 0.62,
    metalness: 0.03,
  });
  const cushionMat = new THREE.MeshStandardMaterial({
    color: cushionColorHex,
    roughness: 0.88,
    metalness: 0,
  });

  const legGeo = new THREE.CylinderGeometry(
    0.028,
    0.022,
    0.46,
    compactMode ? 6 : 10,
  );
  const legOffsets: [number, number][] = [
    [-0.22, -0.22],
    [0.22, -0.22],
    [-0.22, 0.22],
    [0.22, 0.22],
  ];
  for (const [lx, lz] of legOffsets) {
    const leg = new THREE.Mesh(legGeo, woodMat);
    leg.position.set(lx, 0.23, lz);
    leg.castShadow = !compactMode;
    chair.add(leg);
  }

  const sideBarGeo = new THREE.BoxGeometry(0.032, 0.032, 0.44);
  const leftBar = new THREE.Mesh(sideBarGeo, woodMat);
  leftBar.position.set(-0.22, 0.16, 0);
  const rightBar = new THREE.Mesh(sideBarGeo, woodMat);
  rightBar.position.set(0.22, 0.16, 0);
  chair.add(leftBar, rightBar);

  const seatBase = new THREE.Mesh(
    new THREE.BoxGeometry(0.56, 0.055, 0.54),
    woodMat,
  );
  seatBase.position.y = 0.47;
  seatBase.castShadow = !compactMode;
  seatBase.receiveShadow = true;
  chair.add(seatBase);

  const cushion = new THREE.Mesh(
    new THREE.BoxGeometry(0.49, 0.055, 0.47),
    cushionMat,
  );
  cushion.position.set(0, 0.52, 0.01);
  cushion.receiveShadow = true;
  chair.add(cushion);

  const postGeo = new THREE.CylinderGeometry(
    0.026,
    0.028,
    0.58,
    compactMode ? 6 : 10,
  );
  const leftPost = new THREE.Mesh(postGeo, woodMat);
  leftPost.position.set(-0.22, 0.77, -0.23);
  leftPost.rotation.x = -0.08;
  const rightPost = new THREE.Mesh(postGeo, woodMat);
  rightPost.position.set(0.22, 0.77, -0.23);
  rightPost.rotation.x = -0.08;
  chair.add(leftPost, rightPost);

  const topRail = new THREE.Mesh(
    new THREE.BoxGeometry(0.54, 0.09, 0.045),
    woodMat,
  );
  topRail.position.set(0, 1.01, -0.25);
  topRail.rotation.x = -0.08;
  topRail.castShadow = !compactMode;

  const midRail = new THREE.Mesh(
    new THREE.BoxGeometry(0.46, 0.055, 0.035),
    woodMat,
  );
  midRail.position.set(0, 0.78, -0.23);
  midRail.rotation.x = -0.08;
  chair.add(topRail, midRail);

  chair.traverse((obj) => {
    obj.frustumCulled = false;
  });

  return chair;
}

function createTeaMasterCharacter(
  compactMode: boolean,
  ultraCompact: boolean,
): {group: THREE.Group; rig: LimbRig} {
  const seg = ultraCompact ? 10 : compactMode ? 12 : 18;
  const group = new THREE.Group();
  group.position.copy(PLAYER_SPAWN_POS);
  group.rotation.y = PLAYER_SPAWN_ROT_Y;

  const skinMat = new THREE.MeshStandardMaterial({color: 0xf3d0b5, roughness: 0.65});
  const shirtMat = new THREE.MeshStandardMaterial({color: 0xf8f4eb, roughness: 0.78});
  const collarMat = new THREE.MeshStandardMaterial({color: 0xe6ddc9, roughness: 0.8});
  const apronMat = new THREE.MeshStandardMaterial({color: 0x2e6f40, roughness: 0.72});
  const apronDarkMat = new THREE.MeshStandardMaterial({color: 0x204d2c, roughness: 0.78});
  const obiMat = new THREE.MeshStandardMaterial({color: 0x7c5335, roughness: 0.76});
  const pantsMat = new THREE.MeshStandardMaterial({color: 0x332e29, roughness: 0.84});
  const hairMat = new THREE.MeshStandardMaterial({color: 0x25201d, roughness: 0.66});
  const eyeMat = new THREE.MeshStandardMaterial({color: 0x1a1715, roughness: 0.25});
  const woodPinMat = new THREE.MeshStandardMaterial({color: 0xb9854c, roughness: 0.45});
  const jadeMat = new THREE.MeshStandardMaterial({color: 0x62aa7a, roughness: 0.32});
  const sockMat = new THREE.MeshStandardMaterial({color: 0xf8f6f0, roughness: 0.85});
  const sandalMat = new THREE.MeshStandardMaterial({color: 0x775030, roughness: 0.62});

  // Articulated Left & Right Legs with spherical hip & knee joints and traditional Geta sandals
  const buildLeg = (side: -1 | 1) => {
    const hip = new THREE.Group();
    hip.position.set(side * 0.112, 0.72, 0);

    const hipJoint = new THREE.Mesh(new THREE.SphereGeometry(0.084, seg, seg), pantsMat);
    hip.add(hipJoint);

    const thigh = new THREE.Mesh(
      new THREE.CylinderGeometry(0.084, 0.072, 0.34, seg),
      pantsMat,
    );
    thigh.position.y = -0.17;
    thigh.castShadow = !compactMode;
    hip.add(thigh);

    const shin = new THREE.Group();
    shin.position.set(0, -0.34, 0);

    const kneeJoint = new THREE.Mesh(new THREE.SphereGeometry(0.069, seg, seg), pantsMat);
    const calf = new THREE.Mesh(
      new THREE.CylinderGeometry(0.07, 0.056, 0.29, seg),
      pantsMat,
    );
    calf.position.y = -0.145;
    calf.castShadow = !compactMode;

    const sock = new THREE.Mesh(
      new THREE.CylinderGeometry(0.053, 0.05, 0.085, seg),
      sockMat,
    );
    sock.position.y = -0.295;

    const footCap = new THREE.Mesh(
      new THREE.SphereGeometry(0.054, seg, seg),
      sockMat,
    );
    footCap.scale.set(0.95, 0.62, 1.55);
    footCap.position.set(0, -0.325, 0.035);

    const sole = new THREE.Mesh(
      new THREE.BoxGeometry(0.112, 0.028, 0.215),
      sandalMat,
    );
    sole.position.set(0, -0.352, 0.03);

    // Dual geta wooden teeth underneath sandal
    const toothFront = new THREE.Mesh(
      new THREE.BoxGeometry(0.105, 0.02, 0.024),
      sandalMat,
    );
    toothFront.position.set(0, -0.372, 0.08);
    const toothBack = new THREE.Mesh(
      new THREE.BoxGeometry(0.105, 0.02, 0.024),
      sandalMat,
    );
    toothBack.position.set(0, -0.372, -0.04);

    const strapL = new THREE.Mesh(
      new THREE.CylinderGeometry(0.008, 0.008, 0.09, 6),
      apronMat,
    );
    strapL.position.set(-0.028, -0.322, 0.055);
    strapL.rotation.set(0.65, 0, -0.38);
    const strapR = strapL.clone();
    strapR.position.x = 0.028;
    strapR.rotation.z = 0.38;

    shin.add(kneeJoint, calf, sock, footCap, sole, toothFront, toothBack, strapL, strapR);
    hip.add(shin);

    return {hip, shin};
  };

  const leftLegBuilt = buildLeg(-1);
  const rightLegBuilt = buildLeg(1);
  group.add(leftLegBuilt.hip, rightLegBuilt.hip);

  // Sculpted Torso, Curved Waist & Layered Kimono-Style Collar Lapels
  const pelvis = new THREE.Mesh(
    new THREE.SphereGeometry(0.218, seg, seg),
    pantsMat,
  );
  pelvis.scale.set(1.02, 0.56, 0.88);
  pelvis.position.set(0, 0.72, 0);
  group.add(pelvis);

  const torsoLower = new THREE.Mesh(
    new THREE.CylinderGeometry(0.195, 0.215, 0.3, seg),
    shirtMat,
  );
  torsoLower.position.y = 0.87;
  torsoLower.castShadow = !compactMode;
  group.add(torsoLower);

  const torsoChest = new THREE.Mesh(
    new THREE.SphereGeometry(0.215, seg, seg),
    shirtMat,
  );
  torsoChest.scale.set(1.06, 1.05, 0.82);
  torsoChest.position.set(0, 1.11, 0);
  torsoChest.castShadow = !compactMode;
  group.add(torsoChest);

  const shoulderYoke = new THREE.Mesh(
    new THREE.CapsuleGeometry(0.068, 0.34, 6, seg),
    shirtMat,
  );
  shoulderYoke.rotation.z = Math.PI / 2;
  shoulderYoke.position.set(0, 1.24, -0.01);
  group.add(shoulderYoke);

  const leftLapel = new THREE.Mesh(
    new THREE.CapsuleGeometry(0.025, 0.19, 4, 8),
    collarMat,
  );
  leftLapel.position.set(-0.058, 1.19, 0.168);
  leftLapel.rotation.z = -0.4;
  const rightLapel = new THREE.Mesh(
    new THREE.CapsuleGeometry(0.025, 0.19, 4, 8),
    collarMat,
  );
  rightLapel.position.set(0.058, 1.19, 0.168);
  rightLapel.rotation.z = 0.4;
  group.add(leftLapel, rightLapel);

  // Wrap-Around Sommelier Apron, Brass Ring Straps, Pocket + Bamboo Chashaku & Back Obi Bow
  const apronSkirt = new THREE.Mesh(
    new THREE.CylinderGeometry(0.222, 0.245, 0.4, seg, 1, false, -Math.PI * 0.62, Math.PI * 1.24),
    apronMat,
  );
  apronSkirt.position.set(0, 0.72, 0.015);
  apronSkirt.castShadow = !compactMode;
  group.add(apronSkirt);

  const apronBib = new THREE.Mesh(
    new THREE.CylinderGeometry(0.205, 0.218, 0.32, seg, 1, false, -Math.PI * 0.36, Math.PI * 0.72),
    apronMat,
  );
  apronBib.position.set(0, 1.04, 0.02);
  group.add(apronBib);

  const apronNeckStrap = new THREE.Mesh(
    new THREE.TorusGeometry(0.115, 0.014, 6, 14),
    apronDarkMat,
  );
  apronNeckStrap.rotation.x = Math.PI / 2 + 0.35;
  apronNeckStrap.position.set(0, 1.24, 0.03);
  group.add(apronNeckStrap);

  const apronWaist = new THREE.Mesh(
    new THREE.TorusGeometry(0.21, 0.032, 8, seg),
    obiMat,
  );
  apronWaist.rotation.x = Math.PI / 2;
  apronWaist.scale.set(1.04, 0.88, 1);
  apronWaist.position.set(0, 0.84, 0);
  group.add(apronWaist);

  const apronBackKnot = new THREE.Mesh(
    new THREE.SphereGeometry(0.048, 8, 8),
    obiMat,
  );
  apronBackKnot.position.set(0, 0.84, -0.215);
  const bowLoopGeo = new THREE.TorusGeometry(0.044, 0.015, 6, 10);
  const bowL = new THREE.Mesh(bowLoopGeo, obiMat);
  bowL.position.set(-0.048, 0.85, -0.22);
  bowL.rotation.y = 0.28;
  const bowR = new THREE.Mesh(bowLoopGeo, obiMat);
  bowR.position.set(0.048, 0.85, -0.22);
  bowR.rotation.y = -0.28;
  const ribbonL = new THREE.Mesh(
    new THREE.CapsuleGeometry(0.016, 0.16, 4, 6),
    obiMat,
  );
  ribbonL.position.set(-0.036, 0.71, -0.22);
  ribbonL.rotation.z = -0.2;
  const ribbonR = ribbonL.clone();
  ribbonR.position.x = 0.036;
  ribbonR.rotation.z = 0.2;
  group.add(apronBackKnot, bowL, bowR, ribbonL, ribbonR);

  const apronPocket = new THREE.Mesh(
    new THREE.BoxGeometry(0.175, 0.13, 0.025),
    apronDarkMat,
  );
  apronPocket.position.set(0, 0.72, 0.228);
  const scoopStick = new THREE.Mesh(
    new THREE.CylinderGeometry(0.008, 0.007, 0.145, 6),
    woodPinMat,
  );
  scoopStick.position.set(0.045, 0.79, 0.232);
  scoopStick.rotation.z = -0.22;
  group.add(apronPocket, scoopStick);

  // Articulated Arms with Spherical Shoulders, Rolled Cuffs & Forearms
  const buildArm = (side: -1 | 1) => {
    const shoulder = new THREE.Group();
    shoulder.position.set(side * 0.245, 1.23, 0);

    const shoulderSphere = new THREE.Mesh(
      new THREE.SphereGeometry(0.064, seg, seg),
      shirtMat,
    );
    const upperSleeve = new THREE.Mesh(
      new THREE.CylinderGeometry(0.06, 0.054, 0.21, seg),
      shirtMat,
    );
    upperSleeve.position.set(side * 0.008, -0.1, 0.015);
    upperSleeve.castShadow = !compactMode;

    const cuffRing = new THREE.Mesh(
      new THREE.TorusGeometry(0.056, 0.016, 6, seg),
      collarMat,
    );
    cuffRing.rotation.x = Math.PI / 2;
    cuffRing.position.set(side * 0.008, -0.21, 0.025);

    const elbow = new THREE.Mesh(
      new THREE.SphereGeometry(0.046, 8, 8),
      skinMat,
    );
    elbow.position.set(side * 0.008, -0.22, 0.028);

    const forearm = new THREE.Mesh(
      new THREE.CylinderGeometry(0.045, 0.036, 0.19, seg),
      skinMat,
    );
    forearm.position.set(side * 0.008, -0.31, 0.062);
    forearm.rotation.x = -0.3;

    const hand = new THREE.Mesh(
      new THREE.SphereGeometry(0.048, seg, seg),
      skinMat,
    );
    hand.scale.set(0.95, 1.12, 0.85);
    hand.position.set(side * 0.008, -0.405, 0.095);

    shoulder.add(shoulderSphere, upperSleeve, cuffRing, elbow, forearm, hand);
    return shoulder;
  };

  const leftArm = buildArm(-1);
  const rightArm = buildArm(1);
  group.add(leftArm, rightArm);

  // Expressive Sculpted Head: Soft Chin/Jaw, Smooth Curved Hair & Bun + Jade Pin
  const head = new THREE.Group();
  head.position.set(0, 1.4, 0);

  const neck = new THREE.Mesh(
    new THREE.CylinderGeometry(0.06, 0.072, 0.12, seg),
    skinMat,
  );
  neck.position.y = -0.07;
  head.add(neck);

  const cranium = new THREE.Mesh(
    new THREE.SphereGeometry(0.18, seg, seg),
    skinMat,
  );
  cranium.scale.set(0.98, 1.03, 0.96);
  cranium.position.y = 0.058;
  cranium.castShadow = !compactMode;
  head.add(cranium);

  const earGeo = new THREE.SphereGeometry(0.036, 8, 8);
  const leftEar = new THREE.Mesh(earGeo, skinMat);
  leftEar.scale.set(0.65, 1.1, 0.85);
  leftEar.position.set(-0.174, 0.045, 0);
  const rightEar = leftEar.clone();
  rightEar.position.x = 0.174;
  head.add(leftEar, rightEar);

  // Sculpted Layered Curved Hair (zero sharp boxes!)
  const hairCap = new THREE.Mesh(
    new THREE.SphereGeometry(
      0.191,
      seg,
      seg,
      0,
      Math.PI * 2,
      0,
      Math.PI * 0.62,
    ),
    hairMat,
  );
  hairCap.position.y = 0.072;
  hairCap.rotation.x = -0.24;
  head.add(hairCap);

  const bangL = new THREE.Mesh(
    new THREE.SphereGeometry(0.075, seg, seg),
    hairMat,
  );
  bangL.scale.set(1.25, 0.72, 0.72);
  bangL.position.set(-0.078, 0.165, 0.122);
  bangL.rotation.z = 0.32;
  const bangR = new THREE.Mesh(
    new THREE.SphereGeometry(0.075, seg, seg),
    hairMat,
  );
  bangR.scale.set(1.25, 0.72, 0.72);
  bangR.position.set(0.078, 0.165, 0.122);
  bangR.rotation.z = -0.32;

  const sideLockGeo = new THREE.CapsuleGeometry(0.034, 0.12, 6, 8);
  const sideLockL = new THREE.Mesh(sideLockGeo, hairMat);
  sideLockL.position.set(-0.155, 0.025, 0.075);
  sideLockL.rotation.z = 0.12;
  const sideLockR = new THREE.Mesh(sideLockGeo, hairMat);
  sideLockR.position.set(0.155, 0.025, 0.075);
  sideLockR.rotation.z = -0.12;
  head.add(bangL, bangR, sideLockL, sideLockR);

  const hairBun = new THREE.Mesh(
    new THREE.SphereGeometry(0.088, seg, seg),
    hairMat,
  );
  hairBun.scale.set(1, 0.92, 0.88);
  hairBun.position.set(0, 0.125, -0.175);
  const bunScrunchie = new THREE.Mesh(
    new THREE.TorusGeometry(0.068, 0.015, 6, 12),
    apronMat,
  );
  bunScrunchie.position.set(0, 0.125, -0.16);
  const hairPin = new THREE.Mesh(
    new THREE.CylinderGeometry(0.008, 0.006, 0.25, 6),
    woodPinMat,
  );
  hairPin.position.set(0, 0.135, -0.185);
  hairPin.rotation.z = 1.18;
  const pinBead = new THREE.Mesh(
    new THREE.SphereGeometry(0.022, 8, 8),
    jadeMat,
  );
  pinBead.position.set(0.115, 0.185, -0.185);
  head.add(hairBun, bunScrunchie, hairPin, pinBead);

  // Expressive Eyes, Catchlights, Nose Tip, Brows, Blush & Smile
  const eyeGeo = new THREE.SphereGeometry(0.021, 8, 8);
  const leftEye = new THREE.Mesh(eyeGeo, eyeMat);
  leftEye.scale.set(1, 1.12, 0.8);
  leftEye.position.set(-0.062, 0.056, 0.162);
  const rightEye = leftEye.clone();
  rightEye.position.x = 0.062;

  const shineGeo = new THREE.SphereGeometry(0.007, 6, 6);
  const shineMat = new THREE.MeshBasicMaterial({color: 0xffffff});
  const lShine = new THREE.Mesh(shineGeo, shineMat);
  lShine.position.set(-0.056, 0.065, 0.177);
  const rShine = new THREE.Mesh(shineGeo, shineMat);
  rShine.position.set(0.068, 0.065, 0.177);

  const noseTip = new THREE.Mesh(
    new THREE.SphereGeometry(0.013, 6, 6),
    new THREE.MeshStandardMaterial({color: 0xe6b697, roughness: 0.7}),
  );
  noseTip.position.set(0, 0.032, 0.174);

  const browGeo = new THREE.CapsuleGeometry(0.006, 0.034, 4, 6);
  const lBrow = new THREE.Mesh(browGeo, hairMat);
  lBrow.rotation.z = Math.PI / 2 + 0.09;
  lBrow.position.set(-0.062, 0.095, 0.16);
  const rBrow = new THREE.Mesh(browGeo, hairMat);
  rBrow.rotation.z = Math.PI / 2 - 0.09;
  rBrow.position.set(0.062, 0.095, 0.16);

  const smile = new THREE.Mesh(
    new THREE.TorusGeometry(0.026, 0.006, 6, 10, Math.PI),
    new THREE.MeshStandardMaterial({color: 0x9b544c, roughness: 0.6}),
  );
  smile.position.set(0, 0.002, 0.164);
  smile.rotation.z = Math.PI;

  const blushMat = new THREE.MeshStandardMaterial({color: 0xe7988a, roughness: 0.9});
  const blushGeo = new THREE.SphereGeometry(0.026, 8, 8);
  const leftBlush = new THREE.Mesh(blushGeo, blushMat);
  leftBlush.scale.set(1.15, 0.68, 0.25);
  leftBlush.position.set(-0.095, 0.02, 0.146);
  leftBlush.rotation.y = -0.38;
  const rightBlush = leftBlush.clone();
  rightBlush.position.x = 0.095;
  rightBlush.rotation.y = 0.38;

  head.add(
    leftEye,
    rightEye,
    lShine,
    rShine,
    noseTip,
    lBrow,
    rBrow,
    smile,
    leftBlush,
    rightBlush,
  );
  group.add(head);

  group.traverse((obj) => {
    obj.frustumCulled = false;
  });

  return {
    group,
    rig: {
      leftLeg: leftLegBuilt.hip,
      rightLeg: rightLegBuilt.hip,
      leftShin: leftLegBuilt.shin,
      rightShin: rightLegBuilt.shin,
      leftArm,
      rightArm,
      head,
    },
  };
}

function createSomOGuest(
  seg: number,
  compactMode: boolean,
): {group: THREE.Group; rig: LimbRig} {
  const cat = new THREE.Group();
  const furOrange = new THREE.MeshStandardMaterial({color: 0xe3964c, roughness: 0.82});
  const furStripe = new THREE.MeshStandardMaterial({color: 0xc26c29, roughness: 0.84});
  const furCream = new THREE.MeshStandardMaterial({color: 0xfaf0e3, roughness: 0.84});
  const innerEarMat = new THREE.MeshStandardMaterial({color: 0xf4b6b3, roughness: 0.78});
  const collarMat = new THREE.MeshStandardMaterial({color: 0x3b7a57, roughness: 0.65});
  const brassMat = new THREE.MeshStandardMaterial({color: 0xd9b34d, metalness: 0.8, roughness: 0.25});
  const irisMat = new THREE.MeshStandardMaterial({color: 0x4b7d53, roughness: 0.28});
  const darkMat = new THREE.MeshStandardMaterial({color: 0x1b1714, roughness: 0.25});
  const whiskerMat = new THREE.MeshStandardMaterial({color: 0xf5efe6, roughness: 0.5});

  // Standing / walking legs with plush paws
  const standingLegsGroup = new THREE.Group();
  const buildPawLeg = (side: -1 | 1) => {
    const leg = new THREE.Group();
    leg.position.set(side * 0.092, 0.58, 0.02);
    const hipJoint = new THREE.Mesh(new THREE.SphereGeometry(0.056, seg, seg), furOrange);
    const upper = new THREE.Mesh(
      new THREE.CylinderGeometry(0.056, 0.048, 0.43, seg),
      furOrange,
    );
    upper.position.y = -0.215;
    const paw = new THREE.Mesh(new THREE.SphereGeometry(0.062, seg, seg), furCream);
    paw.scale.set(1.02, 0.72, 1.28);
    paw.position.set(0, -0.515, 0.032);
    leg.add(hipJoint, upper, paw);
    return leg;
  };
  const leftLeg = buildPawLeg(-1);
  const rightLeg = buildPawLeg(1);
  standingLegsGroup.add(leftLeg, rightLeg);
  cat.add(standingLegsGroup);

  // Seated paws forward with pink toe beans
  const seatedOnlyGroup = new THREE.Group();
  const frontPawGeo = new THREE.SphereGeometry(0.058, seg, seg);
  const seatedPawL = new THREE.Mesh(frontPawGeo, furCream);
  seatedPawL.scale.set(1, 0.76, 1.25);
  seatedPawL.position.set(-0.095, 0.62, 0.21);
  const seatedPawR = seatedPawL.clone();
  seatedPawR.position.x = 0.095;
  seatedOnlyGroup.add(seatedPawL, seatedPawR);
  cat.add(seatedOnlyGroup);

  // Plush Pear Body + Cream Belly + Curved Tabby Stripes
  const body = new THREE.Mesh(new THREE.SphereGeometry(0.225, seg, seg), furOrange);
  body.scale.set(0.96, 1.24, 0.96);
  body.position.set(0, 0.81, 0.01);
  body.castShadow = !compactMode;
  cat.add(body);

  const belly = new THREE.Mesh(new THREE.SphereGeometry(0.165, seg, seg), furCream);
  belly.scale.set(0.88, 1.08, 0.54);
  belly.position.set(0, 0.79, 0.132);
  cat.add(belly);

  for (let s = 0; s < 3; s++) {
    const stripe = new THREE.Mesh(
      new THREE.TorusGeometry(0.175 - s * 0.012, 0.016, 6, 12, Math.PI * 0.75),
      furStripe,
    );
    stripe.rotation.x = Math.PI / 2;
    stripe.rotation.z = Math.PI * 0.12;
    stripe.position.set(0, 0.72 + s * 0.1, -0.02);
    cat.add(stripe);
  }

  // Articulated Front Paws/Arms with Rounded Shoulders
  const buildCatArm = (side: -1 | 1) => {
    const arm = new THREE.Group();
    arm.position.set(side * 0.18, 0.96, 0.055);
    const shoulder = new THREE.Mesh(new THREE.SphereGeometry(0.048, seg, seg), furOrange);
    const armMesh = new THREE.Mesh(
      new THREE.CylinderGeometry(0.045, 0.04, 0.25, seg),
      furOrange,
    );
    armMesh.position.y = -0.12;
    const pawTip = new THREE.Mesh(new THREE.SphereGeometry(0.049, seg, seg), furCream);
    pawTip.position.y = -0.25;
    arm.add(shoulder, armMesh, pawTip);
    return arm;
  };
  const leftArm = buildCatArm(-1);
  const rightArm = buildCatArm(1);
  cat.add(leftArm, rightArm);

  // Woven Scarf Collar + Knot + Golden Bell
  const collar = new THREE.Mesh(
    new THREE.TorusGeometry(0.145, 0.026, 8, seg),
    collarMat,
  );
  collar.rotation.x = Math.PI / 2;
  collar.position.set(0, 1.03, 0.02);
  const scarfTab = new THREE.Mesh(
    new THREE.CapsuleGeometry(0.028, 0.07, 4, 8),
    collarMat,
  );
  scarfTab.position.set(0.05, 0.97, 0.15);
  scarfTab.rotation.z = -0.28;
  const bell = new THREE.Mesh(new THREE.SphereGeometry(0.032, 10, 10), brassMat);
  bell.position.set(0, 1.0, 0.165);
  cat.add(collar, scarfTab, bell);

  // Cat Head + Plush Cheeks + Emerald-Gold Eyes + Whiskers
  const head = new THREE.Group();
  head.position.set(0, 1.21, 0.03);
  const headSphere = new THREE.Mesh(new THREE.SphereGeometry(0.195, seg, seg), furOrange);
  headSphere.scale.set(1.07, 0.94, 0.95);
  headSphere.castShadow = !compactMode;
  head.add(headSphere);

  // Plush rounded cheeks
  const cheekGeo = new THREE.SphereGeometry(0.072, seg, seg);
  const cheekL = new THREE.Mesh(cheekGeo, furOrange);
  cheekL.scale.set(1.15, 0.85, 0.9);
  cheekL.position.set(-0.115, -0.045, 0.11);
  const cheekR = cheekL.clone();
  cheekR.position.x = 0.115;
  head.add(cheekL, cheekR);

  // Forehead Tabby Stripes
  for (const sx of [-0.04, 0, 0.04]) {
    const fStripe = new THREE.Mesh(
      new THREE.CapsuleGeometry(0.008, 0.046, 4, 6),
      furStripe,
    );
    fStripe.position.set(sx, 0.118, 0.155);
    fStripe.rotation.x = -0.45;
    head.add(fStripe);
  }

  const muzzleL = new THREE.Mesh(new THREE.SphereGeometry(0.056, seg, seg), furCream);
  muzzleL.scale.set(1.1, 0.82, 0.8);
  muzzleL.position.set(-0.036, -0.045, 0.165);
  const muzzleR = muzzleL.clone();
  muzzleR.position.x = 0.036;
  head.add(muzzleL, muzzleR);

  const earGeo = new THREE.ConeGeometry(0.072, 0.15, 8);
  const innerEarGeo = new THREE.ConeGeometry(0.042, 0.095, 6);
  const leftEar = new THREE.Mesh(earGeo, furOrange);
  leftEar.position.set(-0.122, 0.175, 0);
  leftEar.rotation.z = 0.28;
  const leftInner = new THREE.Mesh(innerEarGeo, innerEarMat);
  leftInner.position.set(-0.12, 0.17, 0.025);
  leftInner.rotation.z = 0.28;

  const rightEar = new THREE.Mesh(earGeo, furOrange);
  rightEar.position.set(0.122, 0.175, 0);
  rightEar.rotation.z = -0.28;
  const rightInner = new THREE.Mesh(innerEarGeo, innerEarMat);
  rightInner.position.set(0.12, 0.17, 0.025);
  rightInner.rotation.z = -0.28;
  head.add(leftEar, leftInner, rightEar, rightInner);

  const irisGeo = new THREE.SphereGeometry(0.031, 8, 8);
  const lIris = new THREE.Mesh(irisGeo, irisMat);
  lIris.scale.set(1, 1.08, 0.72);
  lIris.position.set(-0.076, 0.032, 0.162);
  const rIris = lIris.clone();
  rIris.position.x = 0.076;

  const pupilGeo = new THREE.SphereGeometry(0.021, 8, 8);
  const leftEye = new THREE.Mesh(pupilGeo, darkMat);
  leftEye.scale.set(0.75, 1.15, 0.8);
  leftEye.position.set(-0.076, 0.032, 0.172);
  const rightEye = leftEye.clone();
  rightEye.position.x = 0.076;

  const shineGeo = new THREE.SphereGeometry(0.008, 6, 6);
  const shineMat = new THREE.MeshBasicMaterial({color: 0xffffff});
  const lShine = new THREE.Mesh(shineGeo, shineMat);
  lShine.position.set(-0.068, 0.042, 0.187);
  const rShine = new THREE.Mesh(shineGeo, shineMat);
  rShine.position.set(0.084, 0.042, 0.187);

  const nose = new THREE.Mesh(
    new THREE.SphereGeometry(0.02, 8, 8),
    new THREE.MeshStandardMaterial({color: 0xd9737a, roughness: 0.45}),
  );
  nose.scale.set(1.2, 0.85, 0.8);
  nose.position.set(0, -0.012, 0.212);

  // Whiskers
  const whiskerGeo = new THREE.CylinderGeometry(0.003, 0.002, 0.12, 4);
  for (const side of [-1, 1] as const) {
    for (let w = -1; w <= 1; w++) {
      const whisker = new THREE.Mesh(whiskerGeo, whiskerMat);
      whisker.rotation.z = Math.PI / 2 + w * 0.18 * side;
      whisker.position.set(side * 0.145, -0.035 + w * 0.02, 0.16);
      head.add(whisker);
    }
  }

  head.add(lIris, rIris, leftEye, rightEye, lShine, rShine, nose);
  cat.add(head);

  // Articulated Wagging Tail
  const tailGroup = new THREE.Group();
  tailGroup.position.set(0, 0.66, -0.17);
  const tailCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(0, 0, 0),
    new THREE.Vector3(0.14, 0.07, -0.06),
    new THREE.Vector3(0.22, 0.24, 0.02),
  ]);
  const tailMesh = new THREE.Mesh(
    new THREE.TubeGeometry(tailCurve, 12, 0.035, 8, false),
    furOrange,
  );
  const tailTip = new THREE.Mesh(new THREE.SphereGeometry(0.038, 8, 8), furCream);
  tailTip.position.set(0.22, 0.24, 0.02);
  tailGroup.add(tailMesh, tailTip);
  cat.add(tailGroup);

  cat.traverse((obj) => {
    obj.frustumCulled = false;
  });

  return {
    group: cat,
    rig: {
      leftLeg,
      rightLeg,
      leftArm,
      rightArm,
      head,
      tail: tailGroup,
      seatedOnlyGroup,
      standingLegsGroup,
    },
  };
}

function createHumanGuest(
  seg: number,
  compactMode: boolean,
  config: {
    coatColor: number;
    innerColor: number;
    skirtColor: number;
    hairColor: number;
    shoeColor: number;
    bagColor: number;
    hasGlasses?: boolean;
    hasBun?: boolean;
    hasShawl?: boolean;
  },
): {group: THREE.Group; rig: LimbRig} {
  const person = new THREE.Group();
  const skinMat = new THREE.MeshStandardMaterial({color: 0xf1ccb0, roughness: 0.68});
  const coatMat = new THREE.MeshStandardMaterial({color: config.coatColor, roughness: 0.78});
  const innerMat = new THREE.MeshStandardMaterial({color: config.innerColor, roughness: 0.84});
  const skirtMat = new THREE.MeshStandardMaterial({color: config.skirtColor, roughness: 0.82});
  const hairMat = new THREE.MeshStandardMaterial({color: config.hairColor, roughness: 0.7});
  const shoeMat = new THREE.MeshStandardMaterial({color: config.shoeColor, roughness: 0.6});
  const bagMat = new THREE.MeshStandardMaterial({color: config.bagColor, roughness: 0.72});
  const darkMat = new THREE.MeshStandardMaterial({color: 0x1d1a18, roughness: 0.28});

  // Standing / walking legs with smooth knees & rounded shoes
  const standingLegsGroup = new THREE.Group();
  const buildWalkLeg = (side: -1 | 1) => {
    const leg = new THREE.Group();
    leg.position.set(side * 0.095, 0.68, 0);
    const thigh = new THREE.Mesh(
      new THREE.CylinderGeometry(0.068, 0.056, 0.35, seg),
      skirtMat,
    );
    thigh.position.y = -0.175;
    const calf = new THREE.Mesh(
      new THREE.CylinderGeometry(0.052, 0.043, 0.28, seg),
      skinMat,
    );
    calf.position.y = -0.455;
    const shoeBase = new THREE.Mesh(
      new THREE.SphereGeometry(0.055, seg, seg),
      shoeMat,
    );
    shoeBase.scale.set(0.92, 0.65, 1.68);
    shoeBase.position.set(0, -0.635, 0.032);
    leg.add(thigh, calf, shoeBase);
    return leg;
  };
  const leftLeg = buildWalkLeg(-1);
  const rightLeg = buildWalkLeg(1);
  standingLegsGroup.add(leftLeg, rightLeg);
  person.add(standingLegsGroup);

  // Seated lap + bent knees/calves (visible only when seated in chair)
  const seatedOnlyGroup = new THREE.Group();
  const lap = new THREE.Mesh(
    new THREE.SphereGeometry(0.21, seg, seg),
    skirtMat,
  );
  lap.scale.set(1.02, 0.42, 1.05);
  lap.position.set(0, 0.60, 0.11);
  const calfGeo = new THREE.CylinderGeometry(0.058, 0.048, 0.43, seg);
  const leftCalf = new THREE.Mesh(calfGeo, skirtMat);
  leftCalf.position.set(-0.092, 0.32, 0.24);
  const rightCalf = new THREE.Mesh(calfGeo, skirtMat);
  rightCalf.position.set(0.092, 0.32, 0.24);
  const shoeSeatGeo = new THREE.SphereGeometry(0.052, seg, seg);
  const shoeL = new THREE.Mesh(shoeSeatGeo, shoeMat);
  shoeL.scale.set(0.92, 0.65, 1.65);
  shoeL.position.set(-0.092, 0.045, 0.275);
  const shoeR = shoeL.clone();
  shoeR.position.x = 0.092;
  seatedOnlyGroup.add(lap, leftCalf, rightCalf, shoeL, shoeR);
  person.add(seatedOnlyGroup);

  // Flared Pleated Skirt Waist Flare
  const skirtHem = new THREE.Mesh(
    new THREE.CylinderGeometry(0.172, 0.255, 0.28, seg),
    skirtMat,
  );
  skirtHem.position.set(0, 0.62, 0);
  person.add(skirtHem);

  // Sculpted Torso, Coat, Inner Blouse, Waist Belt & Shawl / Buttons
  const torsoLower = new THREE.Mesh(
    new THREE.CylinderGeometry(0.165, 0.185, 0.28, seg),
    coatMat,
  );
  torsoLower.position.set(0, 0.83, -0.01);
  torsoLower.castShadow = !compactMode;
  const torsoChest = new THREE.Mesh(
    new THREE.SphereGeometry(0.182, seg, seg),
    coatMat,
  );
  torsoChest.scale.set(1.06, 1.04, 0.84);
  torsoChest.position.set(0, 1.01, -0.01);
  torsoChest.castShadow = !compactMode;
  person.add(torsoLower, torsoChest);

  const innerFront = new THREE.Mesh(
    new THREE.CapsuleGeometry(0.068, 0.3, 4, 8),
    innerMat,
  );
  innerFront.scale.set(1.05, 1, 0.55);
  innerFront.position.set(0, 0.92, 0.135);
  person.add(innerFront);

  if (config.hasShawl) {
    const shawlMat = new THREE.MeshStandardMaterial({color: 0xc29268, roughness: 0.86});
    const shawl = new THREE.Mesh(
      new THREE.TorusGeometry(0.188, 0.056, 8, seg, Math.PI * 1.48),
      shawlMat,
    );
    shawl.rotation.x = Math.PI / 2 + 0.22;
    shawl.rotation.z = -Math.PI * 0.24;
    shawl.position.set(0, 1.07, 0);
    const shawlDrape = new THREE.Mesh(
      new THREE.CapsuleGeometry(0.036, 0.16, 4, 8),
      shawlMat,
    );
    shawlDrape.position.set(0.08, 0.94, 0.148);
    shawlDrape.rotation.z = -0.18;
    person.add(shawl, shawlDrape);
  } else {
    const btnGeo = new THREE.SphereGeometry(0.013, 6, 6);
    const btnMat = new THREE.MeshStandardMaterial({color: 0xd8c39b, roughness: 0.4});
    for (let b = 0; b < 3; b++) {
      const btn = new THREE.Mesh(btnGeo, btnMat);
      btn.position.set(0.048, 0.81 + b * 0.085, 0.172);
      person.add(btn);
    }
    // Coat lapels
    const lCollar = new THREE.Mesh(new THREE.CapsuleGeometry(0.02, 0.16, 4, 6), coatMat);
    lCollar.position.set(-0.055, 1.05, 0.145);
    lCollar.rotation.z = -0.32;
    const rCollar = lCollar.clone();
    rCollar.position.x = 0.055;
    rCollar.rotation.z = 0.32;
    person.add(lCollar, rCollar);
  }

  // Articulated Arms with Spherical Shoulders + Accessory Bag / Notebook
  const buildArm = (side: -1 | 1) => {
    const armGroup = new THREE.Group();
    armGroup.position.set(side * 0.21, 1.1, 0);
    const shoulder = new THREE.Mesh(
      new THREE.SphereGeometry(0.052, seg, seg),
      coatMat,
    );
    const sleeve = new THREE.Mesh(
      new THREE.CylinderGeometry(0.048, 0.04, 0.34, seg),
      coatMat,
    );
    sleeve.position.y = -0.17;
    const cuff = new THREE.Mesh(
      new THREE.TorusGeometry(0.042, 0.012, 6, seg),
      innerMat,
    );
    cuff.rotation.x = Math.PI / 2;
    cuff.position.y = -0.34;
    const hand = new THREE.Mesh(new THREE.SphereGeometry(0.042, 8, 8), skinMat);
    hand.position.y = -0.375;
    armGroup.add(shoulder, sleeve, cuff, hand);

    if (side === 1) {
      if (config.hasGlasses) {
        // Elara carries a warm writer's notebook with bookmark ribbon
        const book = new THREE.Mesh(
          new THREE.BoxGeometry(0.125, 0.026, 0.165),
          bagMat,
        );
        book.position.set(-0.02, -0.385, 0.06);
        const pageEdge = new THREE.Mesh(
          new THREE.BoxGeometry(0.115, 0.018, 0.155),
          new THREE.MeshStandardMaterial({color: 0xf7f2e5, roughness: 0.85}),
        );
        pageEdge.position.set(-0.018, -0.385, 0.062);
        armGroup.add(book, pageEdge);
      } else {
        // Malee carries a rounded woven rattan handbag
        const bagBody = new THREE.Mesh(
          new THREE.SphereGeometry(0.088, seg, seg),
          bagMat,
        );
        bagBody.scale.set(0.65, 1.05, 1.05);
        bagBody.position.set(0.032, -0.455, 0.02);
        const bagHandle = new THREE.Mesh(
          new THREE.TorusGeometry(0.045, 0.008, 6, 10, Math.PI),
          bagMat,
        );
        bagHandle.position.set(0.032, -0.365, 0.02);
        bagHandle.rotation.y = Math.PI / 2;
        armGroup.add(bagBody, bagHandle);
      }
    }
    return armGroup;
  };
  const leftArm = buildArm(-1);
  const rightArm = buildArm(1);
  person.add(leftArm, rightArm);

  // Detailed Head, Curved Layered Hair (zero boxy blocks!), Eyes, Blush & Accessories
  const head = new THREE.Group();
  head.position.set(0, 1.29, 0);

  const neck = new THREE.Mesh(
    new THREE.CylinderGeometry(0.052, 0.062, 0.11, seg),
    skinMat,
  );
  neck.position.y = -0.075;
  head.add(neck);

  const cranium = new THREE.Mesh(
    new THREE.SphereGeometry(0.166, seg, seg),
    skinMat,
  );
  cranium.scale.set(0.97, 1.03, 0.96);
  cranium.castShadow = !compactMode;
  head.add(cranium);

  const earGeo = new THREE.SphereGeometry(0.03, 6, 6);
  const earL = new THREE.Mesh(earGeo, skinMat);
  earL.scale.set(0.65, 1.1, 0.85);
  earL.position.set(-0.162, 0, 0);
  const earR = earL.clone();
  earR.position.x = 0.162;
  head.add(earL, earR);

  const hairCap = new THREE.Mesh(
    new THREE.SphereGeometry(0.178, seg, seg, 0, Math.PI * 2, 0, Math.PI * 0.62),
    hairMat,
  );
  hairCap.position.y = 0.026;
  hairCap.rotation.x = -0.24;
  head.add(hairCap);

  if (config.hasBun) {
    const bun = new THREE.Mesh(new THREE.SphereGeometry(0.082, seg, seg), hairMat);
    bun.scale.set(1, 0.92, 0.88);
    bun.position.set(0, 0.078, -0.175);
    const pearlPin = new THREE.Mesh(
      new THREE.SphereGeometry(0.022, 8, 8),
      new THREE.MeshStandardMaterial({color: 0xf7f2e8, roughness: 0.25}),
    );
    pearlPin.position.set(0.06, 0.105, -0.18);
    const combMat = new THREE.MeshStandardMaterial({color: 0x62a879, roughness: 0.35});
    const comb = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.022, 0.012), combMat);
    comb.position.set(-0.04, 0.115, -0.165);
    comb.rotation.z = 0.25;
    head.add(bun, pearlPin, comb);
  } else {
    // Smooth sculpted flowing shoulder-length hair & soft curved bangs for Elara
    const backHairDome = new THREE.Mesh(
      new THREE.SphereGeometry(0.176, seg, seg),
      hairMat,
    );
    backHairDome.scale.set(1.04, 1.38, 0.82);
    backHairDome.position.set(0, -0.08, -0.068);

    const waveGeo = new THREE.CapsuleGeometry(0.046, 0.18, 6, 8);
    const sideLockL = new THREE.Mesh(waveGeo, hairMat);
    sideLockL.position.set(-0.145, -0.06, 0.045);
    sideLockL.rotation.z = 0.08;
    const sideLockR = new THREE.Mesh(waveGeo, hairMat);
    sideLockR.position.set(0.145, -0.06, 0.045);
    sideLockR.rotation.z = -0.08;

    const bangL = new THREE.Mesh(
      new THREE.SphereGeometry(0.066, seg, seg),
      hairMat,
    );
    bangL.scale.set(1.22, 0.68, 0.65);
    bangL.position.set(-0.068, 0.11, 0.116);
    bangL.rotation.z = 0.34;
    const bangR = bangL.clone();
    bangR.position.x = 0.068;
    bangR.rotation.z = -0.34;

    head.add(backHairDome, sideLockL, sideLockR, bangL, bangR);
  }

  const eyeGeo = new THREE.SphereGeometry(0.018, 8, 8);
  const leftEye = new THREE.Mesh(eyeGeo, darkMat);
  leftEye.scale.set(1, 1.12, 0.8);
  leftEye.position.set(-0.056, 0.015, 0.152);
  const rightEye = leftEye.clone();
  rightEye.position.x = 0.056;

  const shineGeo = new THREE.SphereGeometry(0.006, 6, 6);
  const shineMat = new THREE.MeshBasicMaterial({color: 0xffffff});
  const lShine = new THREE.Mesh(shineGeo, shineMat);
  lShine.position.set(-0.051, 0.022, 0.166);
  const rShine = new THREE.Mesh(shineGeo, shineMat);
  rShine.position.set(0.061, 0.022, 0.166);

  const noseTip = new THREE.Mesh(
    new THREE.SphereGeometry(0.012, 6, 6),
    new THREE.MeshStandardMaterial({color: 0xe3b192, roughness: 0.72}),
  );
  noseTip.position.set(0, -0.01, 0.164);

  const smile = new THREE.Mesh(
    new THREE.TorusGeometry(0.024, 0.005, 6, 10, Math.PI),
    new THREE.MeshStandardMaterial({color: 0x9b544c, roughness: 0.6}),
  );
  smile.position.set(0, -0.04, 0.156);
  smile.rotation.z = Math.PI;

  const blushMat = new THREE.MeshStandardMaterial({color: 0xe5998c, roughness: 0.9});
  const blushGeo = new THREE.SphereGeometry(0.023, 8, 8);
  const leftBlush = new THREE.Mesh(blushGeo, blushMat);
  leftBlush.scale.set(1.15, 0.65, 0.25);
  leftBlush.position.set(-0.088, -0.02, 0.136);
  leftBlush.rotation.y = -0.35;
  const rightBlush = leftBlush.clone();
  rightBlush.position.x = 0.088;
  rightBlush.rotation.y = 0.35;

  head.add(leftEye, rightEye, lShine, rShine, noseTip, smile, leftBlush, rightBlush);

  if (config.hasGlasses) {
    const rimMat = new THREE.MeshStandardMaterial({
      color: 0xa68144,
      metalness: 0.78,
      roughness: 0.24,
    });
    const lensRingGeo = new THREE.TorusGeometry(0.036, 0.005, 6, 14);
    const lGlass = new THREE.Mesh(lensRingGeo, rimMat);
    lGlass.position.set(-0.056, 0.015, 0.168);
    const rGlass = new THREE.Mesh(lensRingGeo, rimMat);
    rGlass.position.set(0.056, 0.015, 0.168);
    const bridge = new THREE.Mesh(new THREE.BoxGeometry(0.044, 0.006, 0.006), rimMat);
    bridge.position.set(0, 0.02, 0.17);
    const templeGeo = new THREE.CylinderGeometry(0.003, 0.003, 0.14, 4);
    const lTemple = new THREE.Mesh(templeGeo, rimMat);
    lTemple.rotation.x = Math.PI / 2;
    lTemple.position.set(-0.092, 0.018, 0.095);
    const rTemple = lTemple.clone();
    rTemple.position.x = 0.092;
    head.add(lGlass, rGlass, bridge, lTemple, rTemple);
  }

  person.add(head);
  person.traverse((obj) => {
    obj.frustumCulled = false;
  });

  return {
    group: person,
    rig: {
      leftLeg,
      rightLeg,
      leftArm,
      rightArm,
      head,
      seatedOnlyGroup,
      standingLegsGroup,
    },
  };
}

export function createShopCharactersSystem(
  walnutTex: THREE.CanvasTexture,
  ceramicTex: THREE.CanvasTexture,
  compactMode = false,
  ultraCompact = false,
): ShopCharactersHandles {
  const root = new THREE.Group();
  const seg = ultraCompact ? 10 : compactMode ? 12 : 16;

  // 1. Primary Guest Chair (Left across the counter facing the tray)
  const guestChairLeft = createTeaChair(walnutTex, 0x708b69, compactMode);
  guestChairLeft.position.copy(SEAT_LEFT_POS);
  guestChairLeft.rotation.y = SEAT_LEFT_ROT_Y;
  guestChairLeft.traverse((obj) => {
    obj.updateMatrix();
    obj.matrixAutoUpdate = false;
  });
  root.add(guestChairLeft);

  // 2. Companion Guest Chair + Small Side Table
  const guestChairRight = createTeaChair(walnutTex, 0xa87c56, compactMode);
  guestChairRight.position.set(1.55, SHOP_FLOOR_Y, -1.96);
  guestChairRight.rotation.y = -0.34;
  guestChairRight.traverse((obj) => {
    obj.updateMatrix();
    obj.matrixAutoUpdate = false;
  });
  root.add(guestChairRight);

  const sideTable = new THREE.Group();
  sideTable.position.set(2.42, SHOP_FLOOR_Y, -1.78);
  const tableWoodMat = new THREE.MeshStandardMaterial({map: walnutTex, roughness: 0.64});
  const stTop = new THREE.Mesh(
    new THREE.CylinderGeometry(0.32, 0.30, 0.045, compactMode ? 14 : 22),
    tableWoodMat,
  );
  stTop.position.y = 0.52;
  stTop.receiveShadow = true;
  const stStem = new THREE.Mesh(
    new THREE.CylinderGeometry(0.045, 0.06, 0.50, compactMode ? 8 : 12),
    tableWoodMat,
  );
  stStem.position.y = 0.26;
  const stFoot = new THREE.Mesh(
    new THREE.CylinderGeometry(0.18, 0.22, 0.035, compactMode ? 12 : 18),
    tableWoodMat,
  );
  stFoot.position.y = 0.018;
  const spareCup = new THREE.Mesh(
    new THREE.CylinderGeometry(0.075, 0.055, 0.12, compactMode ? 10 : 16),
    new THREE.MeshStandardMaterial({
      color: 0xece8de,
      map: ceramicTex,
      roughness: 0.32,
    }),
  );
  spareCup.position.y = 0.60;
  sideTable.add(stTop, stStem, stFoot, spareCup);
  sideTable.traverse((obj) => {
    obj.updateMatrix();
    obj.matrixAutoUpdate = false;
  });
  root.add(sideTable);

  // 3. Free-Walking Player Character (Tea Master)
  const teaMaster = createTeaMasterCharacter(compactMode, ultraCompact);
  root.add(teaMaster.group);

  // 4. Customer Characters (Spawn outside -> walk inside -> sit on Chair 1)
  const guestsContainer = new THREE.Group();
  guestsContainer.position.set(DOOR_OUTSIDE_POS.x, SHOP_FLOOR_Y, DOOR_OUTSIDE_POS.y);
  guestsContainer.rotation.y = -Math.PI / 2;

  const somO = createSomOGuest(seg, compactMode);
  const elara = createHumanGuest(seg, compactMode, {
    coatColor: 0x5c7361,
    innerColor: 0xf4efe4,
    skirtColor: 0x3b443e,
    hairColor: 0x3c281e,
    shoeColor: 0x4b3426,
    bagColor: 0x8d5a3b,
    hasGlasses: true,
    hasBun: false,
  });
  const malee = createHumanGuest(seg, compactMode, {
    coatColor: 0xe9dfd0,
    innerColor: 0xf8f3eb,
    skirtColor: 0x4f4339,
    hairColor: 0xd6d4cf,
    shoeColor: 0x6f513b,
    bagColor: 0xb78b5e,
    hasGlasses: false,
    hasBun: true,
    hasShawl: true,
  });

  elara.group.visible = false;
  malee.group.visible = false;
  guestsContainer.add(somO.group, elara.group, malee.group);
  root.add(guestsContainer);

  // Player walk state
  let playerWalkSpeed = 0;
  let playerWalkPhase = 0;
  let isPlayerMoving = false;
  let firstPersonHidden = false;

  // Customer walk-in state machine
  let customerPhase: CustomerPhase = 'ENTERING';
  let waypointIdx = 1;
  let customerWalkPhase = 0;
  let customerDoorCrossedEmitted = false;

  const startCustomerWalkIn = (_guestId: string) => {
    customerPhase = 'ENTERING';
    waypointIdx = 1;
    customerWalkPhase = 0;
    customerDoorCrossedEmitted = false;
    guestsContainer.position.set(DOOR_OUTSIDE_POS.x, SHOP_FLOOR_Y, DOOR_OUTSIDE_POS.y);
    guestsContainer.rotation.y = -Math.PI / 2;
  };

  const setFirstPersonHidden = (hidden: boolean) => {
    firstPersonHidden = hidden;
    teaMaster.group.visible = !hidden;
  };

  const movePlayer = (
    inputX: number,
    inputY: number,
    cameraYaw: number,
    delta: number,
  ) => {
    const mag = Math.hypot(inputX, inputY);
    if (mag < 0.06) {
      isPlayerMoving = false;
      playerWalkSpeed = THREE.MathUtils.damp(playerWalkSpeed, 0, 10, delta);
      return;
    }

    const clampedMag = Math.min(1, mag);
    const nx = inputX / mag;
    const ny = inputY / mag;

    // Camera forward vector in XZ plane is (-sin(yaw), -cos(yaw)), right vector is (cos(yaw), -sin(yaw))
    const sinY = Math.sin(cameraYaw);
    const cosY = Math.cos(cameraYaw);
    const moveDirX = nx * cosY - ny * sinY;
    const moveDirZ = -nx * sinY - ny * cosY;

    const speed = 2.45 * clampedMag;
    const rawX = teaMaster.group.position.x + moveDirX * speed * delta;
    const rawZ = teaMaster.group.position.z + moveDirZ * speed * delta;
    const resolved = clampToShopObstacles(rawX, rawZ);

    teaMaster.group.position.x = resolved.x;
    teaMaster.group.position.z = resolved.z;

    const targetAngle = Math.atan2(moveDirX, moveDirZ);
    // Shortest angular interpolation
    let angleDiff = targetAngle - teaMaster.group.rotation.y;
    while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
    while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;
    teaMaster.group.rotation.y += angleDiff * Math.min(1, delta * 12);

    isPlayerMoving = true;
    playerWalkSpeed = clampedMag;
    playerWalkPhase += delta * 9.5 * clampedMag;
  };

  const animate = (
    elapsed: number,
    delta: number,
    step: BrewStep,
    isPouring: boolean,
    mode: GameMode,
    guestId: string,
    reducedMotion: boolean,
  ): CharacterTickResult => {
    const showGuest = mode === 'guest';
    guestsContainer.visible = showGuest;

    let activeGuestRig = somO.rig;
    if (showGuest) {
      somO.group.visible = guestId === 'som-o';
      elara.group.visible = guestId === 'elara';
      malee.group.visible = guestId === 'malee';
      activeGuestRig =
        guestId === 'elara' ? elara.rig : guestId === 'malee' ? malee.rig : somO.rig;
    }

    // 1. Update Player Tea Master Pose (Walking in Shop vs Brewing in First-Person)
    if (!firstPersonHidden) {
      if (isPlayerMoving && !reducedMotion) {
        const swing = Math.sin(playerWalkPhase) * 0.56 * playerWalkSpeed;
        teaMaster.rig.leftLeg.rotation.x = swing;
        teaMaster.rig.rightLeg.rotation.x = -swing;
        if (teaMaster.rig.leftShin && teaMaster.rig.rightShin) {
          teaMaster.rig.leftShin.rotation.x = Math.max(0, -swing * 0.75);
          teaMaster.rig.rightShin.rotation.x = Math.max(0, swing * 0.75);
        }
        teaMaster.rig.leftArm.rotation.x = -swing * 0.72;
        teaMaster.rig.rightArm.rotation.x = swing * 0.72;
        teaMaster.group.position.y =
          SHOP_FLOOR_Y + Math.abs(Math.sin(playerWalkPhase)) * 0.032;
        teaMaster.rig.head.rotation.y = Math.sin(elapsed * 0.9) * 0.04;
      } else {
        const damp = Math.min(1, delta * 9);
        const breathe = reducedMotion ? 0 : Math.sin(elapsed * 1.9) * 0.02;
        teaMaster.rig.leftLeg.rotation.x = THREE.MathUtils.lerp(
          teaMaster.rig.leftLeg.rotation.x,
          0,
          damp,
        );
        teaMaster.rig.rightLeg.rotation.x = THREE.MathUtils.lerp(
          teaMaster.rig.rightLeg.rotation.x,
          0,
          damp,
        );
        if (teaMaster.rig.leftShin && teaMaster.rig.rightShin) {
          teaMaster.rig.leftShin.rotation.x = THREE.MathUtils.lerp(
            teaMaster.rig.leftShin.rotation.x,
            0,
            damp,
          );
          teaMaster.rig.rightShin.rotation.x = THREE.MathUtils.lerp(
            teaMaster.rig.rightShin.rotation.x,
            0,
            damp,
          );
        }

        let targetRightArm = -0.14 + breathe;
        let targetLeftArm = -0.12 - breathe;
        if (isPouring || step === 'POUR_WATER') {
          targetRightArm = -0.68;
          targetLeftArm = -0.25;
        } else if (step === 'STEEP_TEA') {
          targetRightArm = -0.52;
          targetLeftArm = -0.42;
        }
        teaMaster.rig.rightArm.rotation.x = THREE.MathUtils.lerp(
          teaMaster.rig.rightArm.rotation.x,
          targetRightArm,
          damp,
        );
        teaMaster.rig.leftArm.rotation.x = THREE.MathUtils.lerp(
          teaMaster.rig.leftArm.rotation.x,
          targetLeftArm,
          damp,
        );
        teaMaster.group.position.y = THREE.MathUtils.lerp(
          teaMaster.group.position.y,
          SHOP_FLOOR_Y,
          damp,
        );
        teaMaster.rig.head.rotation.y = reducedMotion
          ? 0
          : Math.sin(elapsed * 0.7) * 0.06;
      }
    }

    // 2. Customer Walk-In from Outside -> Doorway Alert -> Seated Ordering
    let customerCrossedDoorNow = false;
    if (showGuest) {
      if (step === 'SERVED') {
        customerPhase = 'SERVED_ENJOYING';
      }

      if (customerPhase === 'ENTERING') {
        const wp = CUSTOMER_WAYPOINTS[waypointIdx];
        if (wp) {
          const dx = wp.x - guestsContainer.position.x;
          const dz = wp.y - guestsContainer.position.z;
          const dist = Math.hypot(dx, dz);
          const walkSpeed = 1.65;

          if (dist <= walkSpeed * delta + 0.04) {
            guestsContainer.position.x = wp.x;
            guestsContainer.position.z = wp.y;
            waypointIdx += 1;
            if (waypointIdx >= CUSTOMER_WAYPOINTS.length) {
              customerPhase = 'SEATED_ORDERING';
              guestsContainer.position.copy(SEAT_LEFT_POS);
              guestsContainer.rotation.y = SEAT_LEFT_ROT_Y;
            }
          } else {
            guestsContainer.position.x += (dx / dist) * walkSpeed * delta;
            guestsContainer.position.z += (dz / dist) * walkSpeed * delta;
            const targetYaw = Math.atan2(dx, dz);
            let diff = targetYaw - guestsContainer.rotation.y;
            while (diff > Math.PI) diff -= Math.PI * 2;
            while (diff < -Math.PI) diff += Math.PI * 2;
            guestsContainer.rotation.y += diff * Math.min(1, delta * 10);
          }
        }

        if (
          !customerDoorCrossedEmitted &&
          guestsContainer.position.x <= DOOR_THRESHOLD_X
        ) {
          customerDoorCrossedEmitted = true;
          customerCrossedDoorNow = true;
        }

        // Standing/walking limbs visible while walking in
        if (activeGuestRig.standingLegsGroup && activeGuestRig.seatedOnlyGroup) {
          activeGuestRig.standingLegsGroup.visible = true;
          activeGuestRig.seatedOnlyGroup.visible = false;
        }
        customerWalkPhase += delta * 8.2;
        const gSwing = reducedMotion ? 0 : Math.sin(customerWalkPhase) * 0.52;
        activeGuestRig.leftLeg.rotation.x = gSwing;
        activeGuestRig.rightLeg.rotation.x = -gSwing;
        activeGuestRig.leftArm.rotation.x = -gSwing * 0.65;
        activeGuestRig.rightArm.rotation.x = gSwing * 0.65;
        guestsContainer.position.y =
          SHOP_FLOOR_Y + (reducedMotion ? 0 : Math.abs(Math.sin(customerWalkPhase)) * 0.025);
        if (activeGuestRig.tail) {
          activeGuestRig.tail.rotation.y = reducedMotion ? 0 : Math.sin(elapsed * 4.5) * 0.25;
        }
      } else {
        // Seated calmly in Seat 1
        guestsContainer.position.x = SEAT_LEFT_POS.x;
        guestsContainer.position.z = SEAT_LEFT_POS.z;
        let rotDiff = SEAT_LEFT_ROT_Y - guestsContainer.rotation.y;
        while (rotDiff > Math.PI) rotDiff -= Math.PI * 2;
        while (rotDiff < -Math.PI) rotDiff += Math.PI * 2;
        guestsContainer.rotation.y += rotDiff * Math.min(1, delta * 8);

        if (activeGuestRig.standingLegsGroup && activeGuestRig.seatedOnlyGroup) {
          activeGuestRig.standingLegsGroup.visible = false;
          activeGuestRig.seatedOnlyGroup.visible = true;
        }
        activeGuestRig.leftLeg.rotation.x = 0;
        activeGuestRig.rightLeg.rotation.x = 0;
        activeGuestRig.leftArm.rotation.x = -0.58;
        activeGuestRig.rightArm.rotation.x = -0.58;

        const bob = reducedMotion
          ? 0
          : customerPhase === 'SERVED_ENJOYING'
            ? Math.sin(elapsed * 3.6) * 0.016
            : Math.sin(elapsed * 1.5) * 0.008;
        guestsContainer.position.y = SHOP_FLOOR_Y + bob;
        if (activeGuestRig.tail) {
          activeGuestRig.tail.rotation.y = reducedMotion ? 0 : Math.sin(elapsed * 2.2) * 0.14;
        }
      }
    }

    return {
      playerPos: teaMaster.group.position,
      playerRotY: teaMaster.group.rotation.y,
      isNearTeaTable: checkNearTeaTable(teaMaster.group.position),
      customerPhase,
      customerCrossedDoorNow,
    };
  };

  return {
    root,
    teaMasterGroup: teaMaster.group,
    guestsContainer,
    startCustomerWalkIn,
    setFirstPersonHidden,
    movePlayer,
    getPlayerPosition: () => teaMaster.group.position,
    getPlayerRotationY: () => teaMaster.group.rotation.y,
    isNearTeaTable: () => checkNearTeaTable(teaMaster.group.position),
    animate,
  };
}
