import * as THREE from 'three';
import {BrewStep, GameMode} from '../types/tea';

export interface ShopCharactersHandles {
  root: THREE.Group;
  teaMasterGroup: THREE.Group;
  teaMasterRightArm: THREE.Group;
  teaMasterLeftArm: THREE.Group;
  teaMasterHead: THREE.Group;
  guestsContainer: THREE.Group;
  somOCatGroup: THREE.Group;
  elaraGroup: THREE.Group;
  maleeGroup: THREE.Group;
  animate: (
    elapsed: number,
    delta: number,
    step: BrewStep,
    isPouring: boolean,
    mode: GameMode,
    guestId: string,
    reducedMotion: boolean,
  ) => void;
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

  // 4 grounded wooden legs (floor is local y = 0, seat bottom at y = 0.46)
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

  // Lower horizontal stretcher bars for craft detail
  const sideBarGeo = new THREE.BoxGeometry(0.032, 0.032, 0.44);
  const leftBar = new THREE.Mesh(sideBarGeo, woodMat);
  leftBar.position.set(-0.22, 0.16, 0);
  const rightBar = new THREE.Mesh(sideBarGeo, woodMat);
  rightBar.position.set(0.22, 0.16, 0);
  chair.add(leftBar, rightBar);

  // Wooden seat base
  const seatBase = new THREE.Mesh(
    new THREE.BoxGeometry(0.56, 0.055, 0.54),
    woodMat,
  );
  seatBase.position.y = 0.47;
  seatBase.castShadow = !compactMode;
  seatBase.receiveShadow = true;
  chair.add(seatBase);

  // Soft woven fabric seat cushion
  const cushion = new THREE.Mesh(
    new THREE.BoxGeometry(0.49, 0.055, 0.47),
    cushionMat,
  );
  cushion.position.set(0, 0.52, 0.01);
  cushion.receiveShadow = true;
  chair.add(cushion);

  // Backrest posts & slats
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
): {
  group: THREE.Group;
  rightArm: THREE.Group;
  leftArm: THREE.Group;
  head: THREE.Group;
} {
  const seg = ultraCompact ? 10 : compactMode ? 12 : 18;
  const group = new THREE.Group();
  // Grounded behind/right side of counter without occluding kettle or vessel
  group.position.set(2.38, -0.78, 0.48);
  group.rotation.y = -1.16;

  const skinMat = new THREE.MeshStandardMaterial({
    color: 0xf2cfb4,
    roughness: 0.7,
    metalness: 0,
  });
  const shirtMat = new THREE.MeshStandardMaterial({
    color: 0xf6f1e6,
    roughness: 0.82,
    metalness: 0,
  });
  const apronMat = new THREE.MeshStandardMaterial({
    color: 0x2e6f40,
    roughness: 0.78,
    metalness: 0,
  });
  const pantsMat = new THREE.MeshStandardMaterial({
    color: 0x3b352f,
    roughness: 0.85,
  });
  const hairMat = new THREE.MeshStandardMaterial({
    color: 0x26211e,
    roughness: 0.75,
  });
  const eyeMat = new THREE.MeshStandardMaterial({
    color: 0x1b1917,
    roughness: 0.35,
  });
  const woodPinMat = new THREE.MeshStandardMaterial({
    color: 0xb7844c,
    roughness: 0.5,
  });

  // Legs (grounded at y = 0)
  const legGeo = new THREE.CylinderGeometry(0.085, 0.075, 0.74, seg);
  const leftLeg = new THREE.Mesh(legGeo, pantsMat);
  leftLeg.position.set(-0.11, 0.37, 0);
  const rightLeg = new THREE.Mesh(legGeo, pantsMat);
  rightLeg.position.set(0.11, 0.37, 0);
  group.add(leftLeg, rightLeg);

  // Linen Shirt Torso
  const torso = new THREE.Mesh(
    new THREE.CylinderGeometry(0.20, 0.22, 0.56, seg),
    shirtMat,
  );
  torso.position.y = 1.01;
  torso.castShadow = !compactMode;
  group.add(torso);

  // Tea-Master Apron Bib & Skirt
  const apronFront = new THREE.Mesh(
    new THREE.BoxGeometry(0.34, 0.62, 0.06),
    apronMat,
  );
  apronFront.position.set(0, 0.94, 0.19);
  apronFront.castShadow = !compactMode;
  group.add(apronFront);

  const apronPocket = new THREE.Mesh(
    new THREE.BoxGeometry(0.18, 0.14, 0.025),
    new THREE.MeshStandardMaterial({color: 0x245932, roughness: 0.82}),
  );
  apronPocket.position.set(0, 0.84, 0.22);
  group.add(apronPocket);

  // Articulated Arms
  const armGeo = new THREE.CylinderGeometry(0.055, 0.048, 0.46, seg);
  const handGeo = new THREE.SphereGeometry(0.058, seg, seg);

  const rightArm = new THREE.Group();
  rightArm.position.set(0.25, 1.24, 0);
  const rightSleeve = new THREE.Mesh(armGeo, shirtMat);
  rightSleeve.position.set(0.02, -0.20, 0.06);
  rightSleeve.rotation.x = -0.35;
  const rightHand = new THREE.Mesh(handGeo, skinMat);
  rightHand.position.set(0.02, -0.40, 0.15);
  rightArm.add(rightSleeve, rightHand);
  group.add(rightArm);

  const leftArm = new THREE.Group();
  leftArm.position.set(-0.25, 1.24, 0);
  const leftSleeve = new THREE.Mesh(armGeo, shirtMat);
  leftSleeve.position.set(-0.02, -0.20, 0.05);
  leftSleeve.rotation.x = -0.28;
  const leftHand = new THREE.Mesh(handGeo, skinMat);
  leftHand.position.set(-0.02, -0.40, 0.12);
  leftArm.add(leftSleeve, leftHand);
  group.add(leftArm);

  // Head Group
  const head = new THREE.Group();
  head.position.set(0, 1.41, 0);

  const neck = new THREE.Mesh(
    new THREE.CylinderGeometry(0.065, 0.075, 0.12, seg),
    skinMat,
  );
  neck.position.y = -0.08;
  head.add(neck);

  const cranium = new THREE.Mesh(
    new THREE.SphereGeometry(0.185, seg, seg),
    skinMat,
  );
  cranium.position.y = 0.05;
  cranium.castShadow = !compactMode;
  head.add(cranium);

  // Hair cap & tied bun
  const hairCap = new THREE.Mesh(
    new THREE.SphereGeometry(
      0.194,
      seg,
      seg,
      0,
      Math.PI * 2,
      0,
      Math.PI * 0.58,
    ),
    hairMat,
  );
  hairCap.position.y = 0.075;
  hairCap.rotation.x = -0.22;
  head.add(hairCap);

  const hairBun = new THREE.Mesh(
    new THREE.SphereGeometry(0.085, seg, seg),
    hairMat,
  );
  hairBun.position.set(0, 0.12, -0.18);
  head.add(hairBun);

  const hairPin = new THREE.Mesh(
    new THREE.CylinderGeometry(0.008, 0.008, 0.24, 6),
    woodPinMat,
  );
  hairPin.position.set(0, 0.13, -0.19);
  hairPin.rotation.z = 1.18;
  head.add(hairPin);

  // Eyes & warm smile
  const eyeGeo = new THREE.SphereGeometry(0.019, 8, 8);
  const leftEye = new THREE.Mesh(eyeGeo, eyeMat);
  leftEye.position.set(-0.065, 0.055, 0.168);
  const rightEye = new THREE.Mesh(eyeGeo, eyeMat);
  rightEye.position.set(0.065, 0.055, 0.168);
  head.add(leftEye, rightEye);

  const blushMat = new THREE.MeshStandardMaterial({
    color: 0xe6988a,
    roughness: 0.9,
  });
  const blushGeo = new THREE.CircleGeometry(0.028, 10);
  const leftBlush = new THREE.Mesh(blushGeo, blushMat);
  leftBlush.position.set(-0.095, 0.015, 0.162);
  leftBlush.rotation.y = -0.35;
  const rightBlush = new THREE.Mesh(blushGeo, blushMat);
  rightBlush.position.set(0.095, 0.015, 0.162);
  rightBlush.rotation.y = 0.35;
  head.add(leftBlush, rightBlush);

  group.add(head);

  group.traverse((obj) => {
    obj.frustumCulled = false;
  });

  return {group, rightArm, leftArm, head};
}

function createSomOGuest(seg: number, compactMode: boolean): THREE.Group {
  const cat = new THREE.Group();
  const furOrange = new THREE.MeshStandardMaterial({
    color: 0xe2954b,
    roughness: 0.85,
  });
  const furCream = new THREE.MeshStandardMaterial({
    color: 0xf9efe2,
    roughness: 0.85,
  });
  const collarMat = new THREE.MeshStandardMaterial({
    color: 0x3b7a57,
    roughness: 0.65,
  });
  const brassMat = new THREE.MeshStandardMaterial({
    color: 0xd9b34d,
    metalness: 0.8,
    roughness: 0.25,
  });
  const darkMat = new THREE.MeshStandardMaterial({
    color: 0x1e1915,
    roughness: 0.3,
  });

  // Seated plump torso on cushion (seat top = y ~ 0.55)
  const body = new THREE.Mesh(
    new THREE.SphereGeometry(0.22, seg, seg),
    furOrange,
  );
  body.scale.set(0.95, 1.25, 0.95);
  body.position.set(0, 0.81, 0.01);
  body.castShadow = !compactMode;
  cat.add(body);

  const belly = new THREE.Mesh(
    new THREE.SphereGeometry(0.16, seg, seg),
    furCream,
  );
  belly.scale.set(0.88, 1.08, 0.55);
  belly.position.set(0, 0.79, 0.13);
  cat.add(belly);

  // Cute front paws resting forward
  const pawGeo = new THREE.SphereGeometry(0.055, seg, seg);
  const leftPaw = new THREE.Mesh(pawGeo, furCream);
  leftPaw.position.set(-0.09, 0.62, 0.21);
  const rightPaw = new THREE.Mesh(pawGeo, furCream);
  rightPaw.position.set(0.09, 0.62, 0.21);
  cat.add(leftPaw, rightPaw);

  // Collar + Golden Bell
  const collar = new THREE.Mesh(
    new THREE.TorusGeometry(0.14, 0.022, 8, seg),
    collarMat,
  );
  collar.rotation.x = Math.PI / 2;
  collar.position.set(0, 1.03, 0.02);
  const bell = new THREE.Mesh(new THREE.SphereGeometry(0.032, 10, 10), brassMat);
  bell.position.set(0, 1.00, 0.16);
  cat.add(collar, bell);

  // Cat Head & Ears
  const head = new THREE.Group();
  head.position.set(0, 1.20, 0.03);
  const headSphere = new THREE.Mesh(
    new THREE.SphereGeometry(0.19, seg, seg),
    furOrange,
  );
  headSphere.scale.set(1.06, 0.94, 0.96);
  headSphere.castShadow = !compactMode;
  head.add(headSphere);

  const muzzle = new THREE.Mesh(
    new THREE.SphereGeometry(0.09, seg, seg),
    furCream,
  );
  muzzle.scale.set(1.15, 0.78, 0.7);
  muzzle.position.set(0, -0.04, 0.15);
  head.add(muzzle);

  const earGeo = new THREE.ConeGeometry(0.068, 0.14, 6);
  const leftEar = new THREE.Mesh(earGeo, furOrange);
  leftEar.position.set(-0.12, 0.18, 0);
  leftEar.rotation.z = 0.28;
  const rightEar = new THREE.Mesh(earGeo, furOrange);
  rightEar.position.set(0.12, 0.18, 0);
  rightEar.rotation.z = -0.28;
  head.add(leftEar, rightEar);

  const eyeGeo = new THREE.SphereGeometry(0.024, 8, 8);
  const leftEye = new THREE.Mesh(eyeGeo, darkMat);
  leftEye.position.set(-0.072, 0.03, 0.165);
  const rightEye = new THREE.Mesh(eyeGeo, darkMat);
  rightEye.position.set(0.072, 0.03, 0.165);
  const nose = new THREE.Mesh(
    new THREE.SphereGeometry(0.018, 6, 6),
    new THREE.MeshStandardMaterial({color: 0xd9737a, roughness: 0.5}),
  );
  nose.position.set(0, -0.01, 0.21);
  head.add(leftEye, rightEye, nose);
  cat.add(head);

  // Curled Orange Tail
  const tailCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(0, 0.63, -0.17),
    new THREE.Vector3(0.16, 0.68, -0.22),
    new THREE.Vector3(0.24, 0.84, -0.14),
  ]);
  const tail = new THREE.Mesh(
    new THREE.TubeGeometry(tailCurve, 12, 0.034, 8, false),
    furOrange,
  );
  cat.add(tail);

  cat.traverse((obj) => {
    obj.frustumCulled = false;
  });
  return cat;
}

function createSeatedHumanGuest(
  seg: number,
  compactMode: boolean,
  config: {
    coatColor: number;
    innerColor: number;
    skirtColor: number;
    hairColor: number;
    hasGlasses?: boolean;
    hasBun?: boolean;
  },
): THREE.Group {
  const person = new THREE.Group();
  const skinMat = new THREE.MeshStandardMaterial({
    color: 0xf1ccb0,
    roughness: 0.72,
  });
  const coatMat = new THREE.MeshStandardMaterial({
    color: config.coatColor,
    roughness: 0.82,
  });
  const innerMat = new THREE.MeshStandardMaterial({
    color: config.innerColor,
    roughness: 0.85,
  });
  const skirtMat = new THREE.MeshStandardMaterial({
    color: config.skirtColor,
    roughness: 0.86,
  });
  const hairMat = new THREE.MeshStandardMaterial({
    color: config.hairColor,
    roughness: 0.78,
  });
  const darkMat = new THREE.MeshStandardMaterial({
    color: 0x1d1a18,
    roughness: 0.35,
  });

  // Seated lap + bent lower legs resting naturally toward floor
  const lap = new THREE.Mesh(
    new THREE.BoxGeometry(0.32, 0.14, 0.36),
    skirtMat,
  );
  lap.position.set(0, 0.61, 0.10);
  person.add(lap);

  const calfGeo = new THREE.CylinderGeometry(0.062, 0.052, 0.48, seg);
  const leftCalf = new THREE.Mesh(calfGeo, skirtMat);
  leftCalf.position.set(-0.09, 0.31, 0.25);
  const rightCalf = new THREE.Mesh(calfGeo, skirtMat);
  rightCalf.position.set(0.09, 0.31, 0.25);
  person.add(leftCalf, rightCalf);

  // Seated torso + cardigan/shawl
  const torso = new THREE.Mesh(
    new THREE.CylinderGeometry(0.175, 0.195, 0.50, seg),
    coatMat,
  );
  torso.position.set(0, 0.90, -0.02);
  torso.castShadow = !compactMode;
  person.add(torso);

  const innerFront = new THREE.Mesh(
    new THREE.BoxGeometry(0.14, 0.44, 0.05),
    innerMat,
  );
  innerFront.position.set(0, 0.90, 0.15);
  person.add(innerFront);

  // Arms resting calmly on lap / table edge
  const armGeo = new THREE.CylinderGeometry(0.046, 0.04, 0.38, seg);
  const leftArm = new THREE.Mesh(armGeo, coatMat);
  leftArm.position.set(-0.21, 0.86, 0.08);
  leftArm.rotation.x = -0.58;
  const rightArm = new THREE.Mesh(armGeo, coatMat);
  rightArm.position.set(0.21, 0.86, 0.08);
  rightArm.rotation.x = -0.58;
  person.add(leftArm, rightArm);

  // Head & Hair
  const headGroup = new THREE.Group();
  headGroup.position.set(0, 1.29, 0);

  const head = new THREE.Mesh(
    new THREE.SphereGeometry(0.168, seg, seg),
    skinMat,
  );
  head.castShadow = !compactMode;
  headGroup.add(head);

  const hairCap = new THREE.Mesh(
    new THREE.SphereGeometry(
      0.178,
      seg,
      seg,
      0,
      Math.PI * 2,
      0,
      Math.PI * 0.6,
    ),
    hairMat,
  );
  hairCap.position.y = 0.025;
  hairCap.rotation.x = -0.25;
  headGroup.add(hairCap);

  if (config.hasBun) {
    const bun = new THREE.Mesh(
      new THREE.SphereGeometry(0.075, seg, seg),
      hairMat,
    );
    bun.position.set(0, 0.08, -0.17);
    headGroup.add(bun);
  } else {
    // Soft shoulder-length hair bob
    const backHair = new THREE.Mesh(
      new THREE.BoxGeometry(0.32, 0.24, 0.14),
      hairMat,
    );
    backHair.position.set(0, -0.07, -0.10);
    headGroup.add(backHair);
  }

  const eyeGeo = new THREE.SphereGeometry(0.017, 8, 8);
  const leftEye = new THREE.Mesh(eyeGeo, darkMat);
  leftEye.position.set(-0.058, 0.015, 0.155);
  const rightEye = new THREE.Mesh(eyeGeo, darkMat);
  rightEye.position.set(0.058, 0.015, 0.155);
  headGroup.add(leftEye, rightEye);

  if (config.hasGlasses) {
    const rimMat = new THREE.MeshStandardMaterial({
      color: 0x9b7946,
      metalness: 0.75,
      roughness: 0.25,
    });
    const lensRingGeo = new THREE.TorusGeometry(0.036, 0.005, 6, 14);
    const lGlass = new THREE.Mesh(lensRingGeo, rimMat);
    lGlass.position.set(-0.058, 0.015, 0.168);
    const rGlass = new THREE.Mesh(lensRingGeo, rimMat);
    rGlass.position.set(0.058, 0.015, 0.168);
    headGroup.add(lGlass, rGlass);
  }

  person.add(headGroup);
  person.traverse((obj) => {
    obj.frustumCulled = false;
  });

  return person;
}

export function createShopCharactersSystem(
  walnutTex: THREE.CanvasTexture,
  ceramicTex: THREE.CanvasTexture,
  compactMode = false,
  ultraCompact = false,
): ShopCharactersHandles {
  const root = new THREE.Group();
  const seg = ultraCompact ? 10 : compactMode ? 12 : 16;

  // 1. Primary Guest Chair (Left across the counter facing the cup)
  const guestChairLeft = createTeaChair(walnutTex, 0x708b69, compactMode);
  guestChairLeft.position.set(-1.55, -0.78, -1.92);
  guestChairLeft.rotation.y = 0.28;
  root.add(guestChairLeft);

  // 2. Companion Guest Chair + Small Side Table (Right across counter)
  const guestChairRight = createTeaChair(walnutTex, 0xa87c56, compactMode);
  guestChairRight.position.set(1.55, -0.78, -1.96);
  guestChairRight.rotation.y = -0.34;
  root.add(guestChairRight);

  const sideTable = new THREE.Group();
  sideTable.position.set(2.42, -0.78, -1.78);
  const tableWoodMat = new THREE.MeshStandardMaterial({
    map: walnutTex,
    roughness: 0.64,
  });
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

  // 3. Player Character (Tea Master) behind right counter side
  const teaMaster = createTeaMasterCharacter(compactMode, ultraCompact);
  root.add(teaMaster.group);

  // 4. Customer Characters Seated on Guest Chair 1
  const guestsContainer = new THREE.Group();
  guestsContainer.position.copy(guestChairLeft.position);
  guestsContainer.rotation.copy(guestChairLeft.rotation);

  const somOCatGroup = createSomOGuest(seg, compactMode);
  const elaraGroup = createSeatedHumanGuest(seg, compactMode, {
    coatColor: 0x5c7361,
    innerColor: 0xf4efe4,
    skirtColor: 0x3b443e,
    hairColor: 0x3c281e,
    hasGlasses: true,
    hasBun: false,
  });
  const maleeGroup = createSeatedHumanGuest(seg, compactMode, {
    coatColor: 0x9c7258,
    innerColor: 0xf2e8d8,
    skirtColor: 0x4f4339,
    hairColor: 0xd6d4cf,
    hasGlasses: false,
    hasBun: true,
  });

  elaraGroup.visible = false;
  maleeGroup.visible = false;
  guestsContainer.add(somOCatGroup, elaraGroup, maleeGroup);
  root.add(guestsContainer);

  const animate = (
    elapsed: number,
    delta: number,
    step: BrewStep,
    isPouring: boolean,
    mode: GameMode,
    guestId: string,
    reducedMotion: boolean,
  ) => {
    // Toggle seated guest presence based on mode and active guestId
    const showGuest = mode === 'guest';
    guestsContainer.visible = showGuest;
    if (showGuest) {
      somOCatGroup.visible = guestId === 'som-o';
      elaraGroup.visible = guestId === 'elara';
      maleeGroup.visible = guestId === 'malee';
    }

    if (reducedMotion) return;

    // Player Tea Master gentle breathing + reactive brewing posture
    const breathe = Math.sin(elapsed * 1.9) * 0.015;
    teaMaster.head.rotation.y = Math.sin(elapsed * 0.7) * 0.06;

    let targetRightArmX = -0.15 + breathe;
    let targetLeftArmX = -0.12 - breathe;
    let targetBodyY = -0.78;

    if (isPouring || step === 'POUR_WATER') {
      targetRightArmX = -0.68 + Math.sin(elapsed * 3.2) * 0.08;
      targetLeftArmX = -0.25;
      teaMaster.head.rotation.x = 0.14;
    } else if (step === 'STEEP_TEA') {
      targetRightArmX = -0.52 + Math.sin(elapsed * 4.5) * 0.12;
      targetLeftArmX = -0.42 + Math.cos(elapsed * 4.5) * 0.08;
      teaMaster.head.rotation.x = 0.10;
    } else if (step === 'SERVED') {
      targetRightArmX = -0.78;
      targetLeftArmX = -0.62;
      targetBodyY = -0.765 + Math.abs(Math.sin(elapsed * 2.4)) * 0.012;
      teaMaster.head.rotation.x = -0.05;
    } else {
      teaMaster.head.rotation.x = 0.04;
    }

    const dampFactor = Math.min(1, delta * 6);
    teaMaster.rightArm.rotation.x = THREE.MathUtils.lerp(
      teaMaster.rightArm.rotation.x,
      targetRightArmX,
      dampFactor,
    );
    teaMaster.leftArm.rotation.x = THREE.MathUtils.lerp(
      teaMaster.leftArm.rotation.x,
      targetLeftArmX,
      dampFactor,
    );
    teaMaster.group.position.y = THREE.MathUtils.lerp(
      teaMaster.group.position.y,
      targetBodyY,
      dampFactor,
    );

    // Subtle seated guest anticipation / delight idle motion
    if (showGuest) {
      const bob =
        step === 'SERVED'
          ? Math.sin(elapsed * 3.6) * 0.018
          : Math.sin(elapsed * 1.5) * 0.008;
      guestsContainer.position.y = -0.78 + bob;
    }
  };

  return {
    root,
    teaMasterGroup: teaMaster.group,
    teaMasterRightArm: teaMaster.rightArm,
    teaMasterLeftArm: teaMaster.leftArm,
    teaMasterHead: teaMaster.head,
    guestsContainer,
    somOCatGroup,
    elaraGroup,
    maleeGroup,
    animate,
  };
}
