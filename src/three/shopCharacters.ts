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

  const skinMat = new THREE.MeshStandardMaterial({color: 0xf2cfb4, roughness: 0.68});
  const shirtMat = new THREE.MeshStandardMaterial({color: 0xf7f3ea, roughness: 0.8});
  const collarMat = new THREE.MeshStandardMaterial({color: 0xebe3d3, roughness: 0.82});
  const apronMat = new THREE.MeshStandardMaterial({color: 0x2e6f40, roughness: 0.75});
  const apronDarkMat = new THREE.MeshStandardMaterial({color: 0x225430, roughness: 0.8});
  const obiMat = new THREE.MeshStandardMaterial({color: 0x7a5436, roughness: 0.78});
  const pantsMat = new THREE.MeshStandardMaterial({color: 0x36312c, roughness: 0.85});
  const hairMat = new THREE.MeshStandardMaterial({color: 0x26211e, roughness: 0.72});
  const eyeMat = new THREE.MeshStandardMaterial({color: 0x1b1917, roughness: 0.3});
  const woodPinMat = new THREE.MeshStandardMaterial({color: 0xb7844c, roughness: 0.48});
  const jadeMat = new THREE.MeshStandardMaterial({color: 0x62a879, roughness: 0.35});
  const sockMat = new THREE.MeshStandardMaterial({color: 0xf7f5ef, roughness: 0.85});
  const sandalMat = new THREE.MeshStandardMaterial({color: 0x7c5432, roughness: 0.65});

  // Articulated Left & Right Legs (hip pivot at y = 0.72)
  const buildLeg = (side: -1 | 1) => {
    const hip = new THREE.Group();
    hip.position.set(side * 0.115, 0.72, 0);

    const thigh = new THREE.Mesh(
      new THREE.CylinderGeometry(0.086, 0.075, 0.36, seg),
      pantsMat,
    );
    thigh.position.y = -0.18;
    thigh.castShadow = !compactMode;
    hip.add(thigh);

    const shin = new THREE.Group();
    shin.position.set(0, -0.35, 0);
    const calf = new THREE.Mesh(
      new THREE.CylinderGeometry(0.072, 0.058, 0.30, seg),
      pantsMat,
    );
    calf.position.y = -0.15;
    calf.castShadow = !compactMode;
    const sock = new THREE.Mesh(
      new THREE.CylinderGeometry(0.054, 0.052, 0.08, seg),
      sockMat,
    );
    sock.position.y = -0.30;
    const sole = new THREE.Mesh(
      new THREE.BoxGeometry(0.11, 0.04, 0.21),
      sandalMat,
    );
    sole.position.set(0, -0.35, 0.03);
    const strap = new THREE.Mesh(
      new THREE.BoxGeometry(0.115, 0.02, 0.045),
      apronMat,
    );
    strap.position.set(0, -0.325, 0.05);
    shin.add(calf, sock, sole, strap);
    hip.add(shin);

    return {hip, shin};
  };

  const leftLegBuilt = buildLeg(-1);
  const rightLegBuilt = buildLeg(1);
  group.add(leftLegBuilt.hip, rightLegBuilt.hip);

  // Layered Linen Shirt & Collar Lapels
  const torso = new THREE.Mesh(
    new THREE.CylinderGeometry(0.205, 0.22, 0.56, seg),
    shirtMat,
  );
  torso.position.y = 1.00;
  torso.castShadow = !compactMode;
  group.add(torso);

  const leftLapel = new THREE.Mesh(
    new THREE.BoxGeometry(0.09, 0.22, 0.04),
    collarMat,
  );
  leftLapel.position.set(-0.06, 1.20, 0.18);
  leftLapel.rotation.z = -0.36;
  const rightLapel = new THREE.Mesh(
    new THREE.BoxGeometry(0.09, 0.22, 0.04),
    collarMat,
  );
  rightLapel.position.set(0.06, 1.20, 0.18);
  rightLapel.rotation.z = 0.36;
  group.add(leftLapel, rightLapel);

  // Apron Bib + Skirt + Pocket with Bamboo Scoop + Obi Waist Sash & Back Ribbons
  const apronBib = new THREE.Mesh(
    new THREE.BoxGeometry(0.34, 0.64, 0.055),
    apronMat,
  );
  apronBib.position.set(0, 0.93, 0.195);
  apronBib.castShadow = !compactMode;
  group.add(apronBib);

  const apronWaist = new THREE.Mesh(
    new THREE.CylinderGeometry(0.23, 0.235, 0.085, seg),
    obiMat,
  );
  apronWaist.position.set(0, 0.78, 0.01);
  group.add(apronWaist);

  const apronBackKnot = new THREE.Mesh(
    new THREE.SphereGeometry(0.055, 8, 8),
    obiMat,
  );
  apronBackKnot.position.set(0, 0.78, -0.24);
  const ribbonL = new THREE.Mesh(
    new THREE.BoxGeometry(0.045, 0.24, 0.018),
    obiMat,
  );
  ribbonL.position.set(-0.04, 0.67, -0.25);
  ribbonL.rotation.z = -0.18;
  const ribbonR = new THREE.Mesh(
    new THREE.BoxGeometry(0.045, 0.24, 0.018),
    obiMat,
  );
  ribbonR.position.set(0.04, 0.67, -0.25);
  ribbonR.rotation.z = 0.18;
  group.add(apronBackKnot, ribbonL, ribbonR);

  const apronPocket = new THREE.Mesh(
    new THREE.BoxGeometry(0.18, 0.14, 0.028),
    apronDarkMat,
  );
  apronPocket.position.set(0, 0.85, 0.222);
  const scoopStick = new THREE.Mesh(
    new THREE.CylinderGeometry(0.009, 0.009, 0.14, 6),
    woodPinMat,
  );
  scoopStick.position.set(0.045, 0.92, 0.228);
  scoopStick.rotation.z = -0.18;
  group.add(apronPocket, scoopStick);

  // Articulated Arms with Rolled Sleeves & Hands
  const buildArm = (side: -1 | 1) => {
    const shoulder = new THREE.Group();
    shoulder.position.set(side * 0.255, 1.23, 0);

    const upperSleeve = new THREE.Mesh(
      new THREE.CylinderGeometry(0.062, 0.056, 0.24, seg),
      shirtMat,
    );
    upperSleeve.position.set(side * 0.01, -0.11, 0.02);
    upperSleeve.castShadow = !compactMode;

    const cuffRing = new THREE.Mesh(
      new THREE.CylinderGeometry(0.062, 0.062, 0.045, seg),
      collarMat,
    );
    cuffRing.position.set(side * 0.01, -0.23, 0.03);

    const forearm = new THREE.Mesh(
      new THREE.CylinderGeometry(0.046, 0.038, 0.20, seg),
      skinMat,
    );
    forearm.position.set(side * 0.01, -0.32, 0.06);
    forearm.rotation.x = -0.25;

    const hand = new THREE.Mesh(
      new THREE.SphereGeometry(0.054, seg, seg),
      skinMat,
    );
    hand.position.set(side * 0.01, -0.42, 0.09);

    shoulder.add(upperSleeve, cuffRing, forearm, hand);
    return shoulder;
  };

  const leftArm = buildArm(-1);
  const rightArm = buildArm(1);
  group.add(leftArm, rightArm);

  // Detailed Head: Ears, Eyes with Shine, Brows, Smile, Side Hair Locks, Bun + Jade Pin
  const head = new THREE.Group();
  head.position.set(0, 1.40, 0);

  const neck = new THREE.Mesh(
    new THREE.CylinderGeometry(0.066, 0.076, 0.12, seg),
    skinMat,
  );
  neck.position.y = -0.07;
  head.add(neck);

  const cranium = new THREE.Mesh(
    new THREE.SphereGeometry(0.185, seg, seg),
    skinMat,
  );
  cranium.position.y = 0.055;
  cranium.castShadow = !compactMode;
  head.add(cranium);

  const earGeo = new THREE.SphereGeometry(0.04, 8, 8);
  const leftEar = new THREE.Mesh(earGeo, skinMat);
  leftEar.position.set(-0.182, 0.045, 0);
  const rightEar = new THREE.Mesh(earGeo, skinMat);
  rightEar.position.set(0.182, 0.045, 0);
  head.add(leftEar, rightEar);

  const hairCap = new THREE.Mesh(
    new THREE.SphereGeometry(
      0.195,
      seg,
      seg,
      0,
      Math.PI * 2,
      0,
      Math.PI * 0.59,
    ),
    hairMat,
  );
  hairCap.position.y = 0.075;
  hairCap.rotation.x = -0.22;
  head.add(hairCap);

  const bangLeft = new THREE.Mesh(
    new THREE.BoxGeometry(0.11, 0.07, 0.06),
    hairMat,
  );
  bangLeft.position.set(-0.075, 0.165, 0.145);
  bangLeft.rotation.z = 0.25;
  const bangRight = new THREE.Mesh(
    new THREE.BoxGeometry(0.11, 0.07, 0.06),
    hairMat,
  );
  bangRight.position.set(0.075, 0.165, 0.145);
  bangRight.rotation.z = -0.25;
  const sideLockL = new THREE.Mesh(
    new THREE.BoxGeometry(0.05, 0.15, 0.07),
    hairMat,
  );
  sideLockL.position.set(-0.16, 0.04, 0.08);
  const sideLockR = sideLockL.clone();
  sideLockR.position.x = 0.16;
  head.add(bangLeft, bangRight, sideLockL, sideLockR);

  const hairBun = new THREE.Mesh(
    new THREE.SphereGeometry(0.088, seg, seg),
    hairMat,
  );
  hairBun.position.set(0, 0.13, -0.18);
  const hairPin = new THREE.Mesh(
    new THREE.CylinderGeometry(0.008, 0.008, 0.25, 6),
    woodPinMat,
  );
  hairPin.position.set(0, 0.135, -0.19);
  hairPin.rotation.z = 1.18;
  const pinBead = new THREE.Mesh(
    new THREE.SphereGeometry(0.022, 8, 8),
    jadeMat,
  );
  pinBead.position.set(0.115, 0.185, -0.19);
  head.add(hairBun, hairPin, pinBead);

  const eyeGeo = new THREE.SphereGeometry(0.02, 8, 8);
  const leftEye = new THREE.Mesh(eyeGeo, eyeMat);
  leftEye.position.set(-0.065, 0.058, 0.168);
  const rightEye = new THREE.Mesh(eyeGeo, eyeMat);
  rightEye.position.set(0.065, 0.058, 0.168);

  const shineGeo = new THREE.SphereGeometry(0.007, 6, 6);
  const shineMat = new THREE.MeshBasicMaterial({color: 0xffffff});
  const lShine = new THREE.Mesh(shineGeo, shineMat);
  lShine.position.set(-0.059, 0.066, 0.184);
  const rShine = new THREE.Mesh(shineGeo, shineMat);
  rShine.position.set(0.071, 0.066, 0.184);

  const browGeo = new THREE.BoxGeometry(0.046, 0.012, 0.015);
  const lBrow = new THREE.Mesh(browGeo, hairMat);
  lBrow.position.set(-0.065, 0.095, 0.168);
  lBrow.rotation.z = 0.08;
  const rBrow = new THREE.Mesh(browGeo, hairMat);
  rBrow.position.set(0.065, 0.095, 0.168);
  rBrow.rotation.z = -0.08;

  const smile = new THREE.Mesh(
    new THREE.TorusGeometry(0.028, 0.006, 6, 10, Math.PI),
    new THREE.MeshStandardMaterial({color: 0x9b544c, roughness: 0.6}),
  );
  smile.position.set(0, 0.002, 0.172);
  smile.rotation.z = Math.PI;

  const blushMat = new THREE.MeshStandardMaterial({color: 0xe6988a, roughness: 0.9});
  const blushGeo = new THREE.CircleGeometry(0.026, 10);
  const leftBlush = new THREE.Mesh(blushGeo, blushMat);
  leftBlush.position.set(-0.098, 0.018, 0.162);
  leftBlush.rotation.y = -0.35;
  const rightBlush = new THREE.Mesh(blushGeo, blushMat);
  rightBlush.position.set(0.098, 0.018, 0.162);
  rightBlush.rotation.y = 0.35;

  head.add(
    leftEye,
    rightEye,
    lShine,
    rShine,
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
  const furOrange = new THREE.MeshStandardMaterial({color: 0xe2954b, roughness: 0.84});
  const furStripe = new THREE.MeshStandardMaterial({color: 0xc26c29, roughness: 0.85});
  const furCream = new THREE.MeshStandardMaterial({color: 0xf9efe2, roughness: 0.85});
  const innerEarMat = new THREE.MeshStandardMaterial({color: 0xf2b5b2, roughness: 0.8});
  const collarMat = new THREE.MeshStandardMaterial({color: 0x3b7a57, roughness: 0.65});
  const brassMat = new THREE.MeshStandardMaterial({color: 0xd9b34d, metalness: 0.8, roughness: 0.25});
  const darkMat = new THREE.MeshStandardMaterial({color: 0x1e1915, roughness: 0.3});
  const whiskerMat = new THREE.MeshStandardMaterial({color: 0xf5efe6, roughness: 0.5});

  // Standing / walking legs (visible when walking in)
  const standingLegsGroup = new THREE.Group();
  const buildPawLeg = (side: -1 | 1) => {
    const leg = new THREE.Group();
    leg.position.set(side * 0.09, 0.58, 0.02);
    const upper = new THREE.Mesh(
      new THREE.CylinderGeometry(0.056, 0.048, 0.44, seg),
      furOrange,
    );
    upper.position.y = -0.22;
    const paw = new THREE.Mesh(new THREE.SphereGeometry(0.062, seg, seg), furCream);
    paw.scale.set(1, 0.72, 1.25);
    paw.position.set(0, -0.52, 0.03);
    leg.add(upper, paw);
    return leg;
  };
  const leftLeg = buildPawLeg(-1);
  const rightLeg = buildPawLeg(1);
  standingLegsGroup.add(leftLeg, rightLeg);
  cat.add(standingLegsGroup);

  // Seated paws forward (visible when seated on chair)
  const seatedOnlyGroup = new THREE.Group();
  const frontPawGeo = new THREE.SphereGeometry(0.058, seg, seg);
  const seatedPawL = new THREE.Mesh(frontPawGeo, furCream);
  seatedPawL.position.set(-0.095, 0.62, 0.21);
  const seatedPawR = new THREE.Mesh(frontPawGeo, furCream);
  seatedPawR.position.set(0.095, 0.62, 0.21);
  seatedOnlyGroup.add(seatedPawL, seatedPawR);
  cat.add(seatedOnlyGroup);

  // Plump Body + Cream Belly + Back Stripes
  const body = new THREE.Mesh(new THREE.SphereGeometry(0.22, seg, seg), furOrange);
  body.scale.set(0.95, 1.25, 0.95);
  body.position.set(0, 0.81, 0.01);
  body.castShadow = !compactMode;
  cat.add(body);

  const belly = new THREE.Mesh(new THREE.SphereGeometry(0.16, seg, seg), furCream);
  belly.scale.set(0.88, 1.08, 0.55);
  belly.position.set(0, 0.79, 0.13);
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

  // Articulated Front Paws/Arms
  const buildCatArm = (side: -1 | 1) => {
    const arm = new THREE.Group();
    arm.position.set(side * 0.18, 0.96, 0.06);
    const armMesh = new THREE.Mesh(
      new THREE.CylinderGeometry(0.044, 0.04, 0.26, seg),
      furOrange,
    );
    armMesh.position.y = -0.12;
    const pawTip = new THREE.Mesh(new THREE.SphereGeometry(0.048, seg, seg), furCream);
    pawTip.position.y = -0.25;
    arm.add(armMesh, pawTip);
    return arm;
  };
  const leftArm = buildCatArm(-1);
  const rightArm = buildCatArm(1);
  cat.add(leftArm, rightArm);

  // Collar + Green Scarf Knot + Golden Bell
  const collar = new THREE.Mesh(
    new THREE.TorusGeometry(0.145, 0.025, 8, seg),
    collarMat,
  );
  collar.rotation.x = Math.PI / 2;
  collar.position.set(0, 1.03, 0.02);
  const scarfTab = new THREE.Mesh(
    new THREE.BoxGeometry(0.065, 0.11, 0.025),
    collarMat,
  );
  scarfTab.position.set(0.05, 0.98, 0.15);
  scarfTab.rotation.z = -0.25;
  const bell = new THREE.Mesh(new THREE.SphereGeometry(0.032, 10, 10), brassMat);
  bell.position.set(0, 1.00, 0.165);
  cat.add(collar, scarfTab, bell);

  // Cat Head + Forehead Stripes + Inner Ears + Whiskers + Eye Highlights
  const head = new THREE.Group();
  head.position.set(0, 1.21, 0.03);
  const headSphere = new THREE.Mesh(new THREE.SphereGeometry(0.195, seg, seg), furOrange);
  headSphere.scale.set(1.06, 0.94, 0.96);
  headSphere.castShadow = !compactMode;
  head.add(headSphere);

  // Forehead Tabby Stripes
  for (const sx of [-0.04, 0, 0.04]) {
    const fStripe = new THREE.Mesh(
      new THREE.BoxGeometry(0.016, 0.065, 0.02),
      furStripe,
    );
    fStripe.position.set(sx, 0.12, 0.155);
    fStripe.rotation.x = -0.45;
    head.add(fStripe);
  }

  const muzzle = new THREE.Mesh(new THREE.SphereGeometry(0.095, seg, seg), furCream);
  muzzle.scale.set(1.18, 0.78, 0.72);
  muzzle.position.set(0, -0.042, 0.15);
  head.add(muzzle);

  const earGeo = new THREE.ConeGeometry(0.072, 0.15, 6);
  const innerEarGeo = new THREE.ConeGeometry(0.04, 0.095, 5);
  const leftEar = new THREE.Mesh(earGeo, furOrange);
  leftEar.position.set(-0.12, 0.18, 0);
  leftEar.rotation.z = 0.28;
  const leftInner = new THREE.Mesh(innerEarGeo, innerEarMat);
  leftInner.position.set(-0.118, 0.175, 0.025);
  leftInner.rotation.z = 0.28;

  const rightEar = new THREE.Mesh(earGeo, furOrange);
  rightEar.position.set(0.12, 0.18, 0);
  rightEar.rotation.z = -0.28;
  const rightInner = new THREE.Mesh(innerEarGeo, innerEarMat);
  rightInner.position.set(0.118, 0.175, 0.025);
  rightInner.rotation.z = -0.28;
  head.add(leftEar, leftInner, rightEar, rightInner);

  const eyeGeo = new THREE.SphereGeometry(0.026, 8, 8);
  const leftEye = new THREE.Mesh(eyeGeo, darkMat);
  leftEye.position.set(-0.074, 0.032, 0.166);
  const rightEye = new THREE.Mesh(eyeGeo, darkMat);
  rightEye.position.set(0.074, 0.032, 0.166);

  const shineGeo = new THREE.SphereGeometry(0.008, 6, 6);
  const shineMat = new THREE.MeshBasicMaterial({color: 0xffffff});
  const lShine = new THREE.Mesh(shineGeo, shineMat);
  lShine.position.set(-0.068, 0.04, 0.186);
  const rShine = new THREE.Mesh(shineGeo, shineMat);
  rShine.position.set(0.08, 0.04, 0.186);

  const nose = new THREE.Mesh(
    new THREE.SphereGeometry(0.02, 6, 6),
    new THREE.MeshStandardMaterial({color: 0xd9737a, roughness: 0.5}),
  );
  nose.position.set(0, -0.01, 0.214);

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

  head.add(leftEye, rightEye, lShine, rShine, nose);
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
    new THREE.TubeGeometry(tailCurve, 12, 0.034, 8, false),
    furOrange,
  );
  const tailTip = new THREE.Mesh(new THREE.SphereGeometry(0.036, 8, 8), furCream);
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
  const skinMat = new THREE.MeshStandardMaterial({color: 0xf1ccb0, roughness: 0.72});
  const coatMat = new THREE.MeshStandardMaterial({color: config.coatColor, roughness: 0.8});
  const innerMat = new THREE.MeshStandardMaterial({color: config.innerColor, roughness: 0.85});
  const skirtMat = new THREE.MeshStandardMaterial({color: config.skirtColor, roughness: 0.84});
  const hairMat = new THREE.MeshStandardMaterial({color: config.hairColor, roughness: 0.76});
  const shoeMat = new THREE.MeshStandardMaterial({color: config.shoeColor, roughness: 0.65});
  const bagMat = new THREE.MeshStandardMaterial({color: config.bagColor, roughness: 0.75});
  const darkMat = new THREE.MeshStandardMaterial({color: 0x1d1a18, roughness: 0.35});

  // Standing / walking legs
  const standingLegsGroup = new THREE.Group();
  const buildWalkLeg = (side: -1 | 1) => {
    const leg = new THREE.Group();
    leg.position.set(side * 0.095, 0.68, 0);
    const thigh = new THREE.Mesh(
      new THREE.CylinderGeometry(0.068, 0.056, 0.36, seg),
      skirtMat,
    );
    thigh.position.y = -0.18;
    const calf = new THREE.Mesh(
      new THREE.CylinderGeometry(0.052, 0.044, 0.28, seg),
      skinMat,
    );
    calf.position.y = -0.46;
    const shoe = new THREE.Mesh(new THREE.BoxGeometry(0.095, 0.075, 0.19), shoeMat);
    shoe.position.set(0, -0.64, 0.03);
    leg.add(thigh, calf, shoe);
    return leg;
  };
  const leftLeg = buildWalkLeg(-1);
  const rightLeg = buildWalkLeg(1);
  standingLegsGroup.add(leftLeg, rightLeg);
  person.add(standingLegsGroup);

  // Seated lap + bent calves (visible only when seated in chair)
  const seatedOnlyGroup = new THREE.Group();
  const lap = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.14, 0.38), skirtMat);
  lap.position.set(0, 0.61, 0.10);
  const calfGeo = new THREE.CylinderGeometry(0.058, 0.048, 0.44, seg);
  const leftCalf = new THREE.Mesh(calfGeo, skirtMat);
  leftCalf.position.set(-0.09, 0.32, 0.24);
  const rightCalf = new THREE.Mesh(calfGeo, skirtMat);
  rightCalf.position.set(0.09, 0.32, 0.24);
  const shoeSeatGeo = new THREE.BoxGeometry(0.09, 0.065, 0.17);
  const shoeL = new THREE.Mesh(shoeSeatGeo, shoeMat);
  shoeL.position.set(-0.09, 0.04, 0.27);
  const shoeR = new THREE.Mesh(shoeSeatGeo, shoeMat);
  shoeR.position.set(0.09, 0.04, 0.27);
  seatedOnlyGroup.add(lap, leftCalf, rightCalf, shoeL, shoeR);
  person.add(seatedOnlyGroup);

  // Pleated Skirt Waist Flare
  const skirtHem = new THREE.Mesh(
    new THREE.CylinderGeometry(0.18, 0.24, 0.24, seg),
    skirtMat,
  );
  skirtHem.position.set(0, 0.64, 0);
  person.add(skirtHem);

  // Torso + Coat + Inner Blouse + Collar / Cardigan Buttons
  const torso = new THREE.Mesh(
    new THREE.CylinderGeometry(0.175, 0.195, 0.50, seg),
    coatMat,
  );
  torso.position.set(0, 0.90, -0.01);
  torso.castShadow = !compactMode;
  person.add(torso);

  const innerFront = new THREE.Mesh(
    new THREE.BoxGeometry(0.14, 0.44, 0.055),
    innerMat,
  );
  innerFront.position.set(0, 0.90, 0.155);
  person.add(innerFront);

  if (config.hasShawl) {
    const shawl = new THREE.Mesh(
      new THREE.TorusGeometry(0.19, 0.055, 8, seg, Math.PI * 1.45),
      new THREE.MeshStandardMaterial({color: 0xc29268, roughness: 0.88}),
    );
    shawl.rotation.x = Math.PI / 2 + 0.2;
    shawl.rotation.z = -Math.PI * 0.22;
    shawl.position.set(0, 1.07, 0);
    person.add(shawl);
  } else {
    const btnGeo = new THREE.SphereGeometry(0.013, 6, 6);
    const btnMat = new THREE.MeshStandardMaterial({color: 0xd8c39b, roughness: 0.4});
    for (let b = 0; b < 3; b++) {
      const btn = new THREE.Mesh(btnGeo, btnMat);
      btn.position.set(0.045, 0.80 + b * 0.09, 0.185);
      person.add(btn);
    }
  }

  // Articulated Arms + Accessory Bag / Notebook
  const buildArm = (side: -1 | 1) => {
    const armGroup = new THREE.Group();
    armGroup.position.set(side * 0.215, 1.10, 0);
    const sleeve = new THREE.Mesh(
      new THREE.CylinderGeometry(0.048, 0.04, 0.36, seg),
      coatMat,
    );
    sleeve.position.y = -0.18;
    const hand = new THREE.Mesh(new THREE.SphereGeometry(0.042, 8, 8), skinMat);
    hand.position.y = -0.37;
    armGroup.add(sleeve, hand);

    if (side === 1) {
      if (config.hasGlasses) {
        // Elara holds a small writer's notebook
        const book = new THREE.Mesh(
          new THREE.BoxGeometry(0.12, 0.024, 0.16),
          bagMat,
        );
        book.position.set(-0.02, -0.38, 0.06);
        armGroup.add(book);
      } else {
        // Malee carries a neat woven handbag
        const bag = new THREE.Mesh(
          new THREE.BoxGeometry(0.09, 0.18, 0.16),
          bagMat,
        );
        bag.position.set(0.03, -0.42, 0.02);
        armGroup.add(bag);
      }
    }
    return armGroup;
  };
  const leftArm = buildArm(-1);
  const rightArm = buildArm(1);
  person.add(leftArm, rightArm);

  // Detailed Head, Hair, Eyes, Blush, Smile & Accessories
  const head = new THREE.Group();
  head.position.set(0, 1.29, 0);

  const cranium = new THREE.Mesh(
    new THREE.SphereGeometry(0.168, seg, seg),
    skinMat,
  );
  cranium.castShadow = !compactMode;
  head.add(cranium);

  const earGeo = new THREE.SphereGeometry(0.032, 6, 6);
  const earL = new THREE.Mesh(earGeo, skinMat);
  earL.position.set(-0.166, 0, 0);
  const earR = new THREE.Mesh(earGeo, skinMat);
  earR.position.set(0.166, 0, 0);
  head.add(earL, earR);

  const hairCap = new THREE.Mesh(
    new THREE.SphereGeometry(0.178, seg, seg, 0, Math.PI * 2, 0, Math.PI * 0.6),
    hairMat,
  );
  hairCap.position.y = 0.025;
  hairCap.rotation.x = -0.25;
  head.add(hairCap);

  if (config.hasBun) {
    const bun = new THREE.Mesh(new THREE.SphereGeometry(0.078, seg, seg), hairMat);
    bun.position.set(0, 0.08, -0.175);
    const pearlPin = new THREE.Mesh(
      new THREE.SphereGeometry(0.022, 8, 8),
      new THREE.MeshStandardMaterial({color: 0xf7f2e8, roughness: 0.25}),
    );
    pearlPin.position.set(0.06, 0.11, -0.18);
    head.add(bun, pearlPin);
  } else {
    const backHair = new THREE.Mesh(
      new THREE.BoxGeometry(0.32, 0.25, 0.15),
      hairMat,
    );
    backHair.position.set(0, -0.07, -0.10);
    const sideLockL = new THREE.Mesh(
      new THREE.BoxGeometry(0.045, 0.20, 0.065),
      hairMat,
    );
    sideLockL.position.set(-0.145, -0.04, 0.07);
    const sideLockR = sideLockL.clone();
    sideLockR.position.x = 0.145;
    head.add(backHair, sideLockL, sideLockR);
  }

  const eyeGeo = new THREE.SphereGeometry(0.017, 8, 8);
  const leftEye = new THREE.Mesh(eyeGeo, darkMat);
  leftEye.position.set(-0.058, 0.015, 0.155);
  const rightEye = new THREE.Mesh(eyeGeo, darkMat);
  rightEye.position.set(0.058, 0.015, 0.155);

  const smile = new THREE.Mesh(
    new THREE.TorusGeometry(0.024, 0.005, 6, 10, Math.PI),
    new THREE.MeshStandardMaterial({color: 0x9b544c, roughness: 0.6}),
  );
  smile.position.set(0, -0.04, 0.158);
  smile.rotation.z = Math.PI;
  head.add(leftEye, rightEye, smile);

  if (config.hasGlasses) {
    const rimMat = new THREE.MeshStandardMaterial({
      color: 0xa68144,
      metalness: 0.78,
      roughness: 0.24,
    });
    const lensRingGeo = new THREE.TorusGeometry(0.036, 0.005, 6, 14);
    const lGlass = new THREE.Mesh(lensRingGeo, rimMat);
    lGlass.position.set(-0.058, 0.015, 0.168);
    const rGlass = new THREE.Mesh(lensRingGeo, rimMat);
    rGlass.position.set(0.058, 0.015, 0.168);
    const bridge = new THREE.Mesh(new THREE.BoxGeometry(0.044, 0.006, 0.006), rimMat);
    bridge.position.set(0, 0.02, 0.17);
    head.add(lGlass, rGlass, bridge);
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
  root.add(guestChairLeft);

  // 2. Companion Guest Chair + Small Side Table
  const guestChairRight = createTeaChair(walnutTex, 0xa87c56, compactMode);
  guestChairRight.position.set(1.55, SHOP_FLOOR_Y, -1.96);
  guestChairRight.rotation.y = -0.34;
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
