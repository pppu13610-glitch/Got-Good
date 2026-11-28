import * as THREE from 'three';
import {BrewStep, CustomerPhase, GameMode, PlayerCharacterId} from '../types/tea';
import {
  animateSeamlessHumanoid,
  buildCompleteTeaArtisanCharacter,
  buildLegacyShopkeeperGuest,
  buildSeamlessHumanGuest,
  HumanGuestConfig,
  LegacyShopkeeperGuestId,
  SeamlessCharacterHandle,
} from './characterBuilders';

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
  setPlayerCharacter: (characterId: PlayerCharacterId) => void;
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
  dispose: () => void;
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

export function createShopCharactersSystem(
  walnutTex: THREE.CanvasTexture,
  ceramicTex: THREE.CanvasTexture,
  compactMode = false,
  ultraCompact = false,
): ShopCharactersHandles {
  const root = new THREE.Group();

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

  // 3. Free-Walking Seamless Skinned Player Characters (Zero visible joints)
  const playerContainer = new THREE.Group();
  playerContainer.position.copy(PLAYER_SPAWN_POS);
  playerContainer.rotation.y = PLAYER_SPAWN_ROT_Y;

  const teaArtisan = buildCompleteTeaArtisanCharacter(compactMode, ultraCompact);

  const playerModels: Record<PlayerCharacterId, SeamlessCharacterHandle> = {
    'tea-artisan': teaArtisan,
  };

  let activePlayerId: PlayerCharacterId = 'tea-artisan';
  playerContainer.add(teaArtisan.group);
  root.add(playerContainer);

  // 4. Seamless Customer Characters (12 Diverse Guests, lazy-cached so startup stays instant)
  const guestsContainer = new THREE.Group();
  guestsContainer.position.set(DOOR_OUTSIDE_POS.x, SHOP_FLOOR_Y, DOOR_OUTSIDE_POS.y);
  guestsContainer.rotation.y = -Math.PI / 2;

  const GUEST_PRESET_CONFIGS: Record<string, HumanGuestConfig> = {
    'som-o': {
      preset: 'som-o',
      heightScale: 0.97,
      slender: true,
      coatHex: '#df7e38',
      innerHex: '#f5efe5',
      skirtHex: '#3c2d25',
      hairBaseHex: '#9e6135',
      hairHighlightHex: '#dfb17a',
      hairShadowHex: '#693c1c',
      hairTipHex: '#c9884c',
      shoeColor: 0x543928,
      irisTopHex: '#5d381e',
      irisBottomHex: '#9a6539',
      browHex: '#693c1c',
      clothingStyle: 'cardigan',
      clothingAccentHex: '#c26525',
      bottomStyle: 'skirt',
      hairstyle: 'wavy-shoulder',
    },
    elara: {
      preset: 'elara',
      heightScale: 0.97,
      slender: true,
      coatHex: '#637043',
      innerHex: '#f4efe4',
      skirtHex: '#38332e',
      hairBaseHex: '#4d3324',
      hairHighlightHex: '#7d5943',
      hairShadowHex: '#2f1d14',
      shoeColor: 0x4b3426,
      irisTopHex: '#4b6b52',
      irisBottomHex: '#84b08a',
      browHex: '#3d281c',
      clothingStyle: 'cardigan',
      clothingAccentHex: '#4b5732',
      bottomStyle: 'skirt',
      hairstyle: 'low-messy-bun',
      hasGlasses: true,
      glassStyle: 'round',
      hasNotebook: true,
      bagColor: 0x7d4c2d,
    },
    malee: {
      preset: 'malee',
      heightScale: 0.95,
      slender: true,
      isElder: true,
      coatHex: '#2a3652',
      innerHex: '#2a3652',
      skirtHex: '#252936',
      hairBaseHex: '#d6d8dd',
      hairHighlightHex: '#f4f6fa',
      hairShadowHex: '#9ca0aa',
      shoeColor: 0x563f30,
      irisTopHex: '#4d3629',
      irisBottomHex: '#826049',
      browHex: '#9c9ea4',
      clothingStyle: 'thai-blouse',
      clothingAccentHex: '#9aa8c7',
      bottomStyle: 'skirt',
      hairstyle: 'elder-top-bun',
      hasPearlEarrings: true,
      hasHandbag: true,
      bagColor: 0xb78b5e,
    },
    non: {
      preset: 'non',
      heightScale: 1.03,
      slender: false,
      skinHex: '#eab995',
      skinColor: 0xeab995,
      coatHex: '#424752',
      innerHex: '#f3eee2',
      skirtHex: '#2e3139',
      hairBaseHex: '#211c19',
      hairHighlightHex: '#453c36',
      hairShadowHex: '#120f0d',
      shoeColor: 0x3b281e,
      irisTopHex: '#2e221b',
      irisBottomHex: '#634b3c',
      browHex: '#1d1714',
      clothingStyle: 'waistcoat',
      clothingAccentHex: '#2e333c',
      bottomStyle: 'trousers',
      hairstyle: 'short-quiff',
      hasGlasses: true,
      glassStyle: 'rect',
      hasNotebook: true,
      bagColor: 0x6b4528,
    },
    milin: {
      preset: 'milin',
      heightScale: 0.95,
      slender: true,
      skinHex: '#f8dac5',
      skinColor: 0xf8dac5,
      coatHex: '#7fa17f',
      innerHex: '#faf8f4',
      skirtHex: '#2d374c',
      hairBaseHex: '#6e452b',
      hairHighlightHex: '#a8704a',
      hairShadowHex: '#462a18',
      shoeColor: 0xebe6db,
      irisTopHex: '#4c3221',
      irisBottomHex: '#8d5f3e',
      browHex: '#563621',
      clothingStyle: 'hoodie-jacket',
      clothingAccentHex: '#648564',
      bottomStyle: 'skirt',
      hairstyle: 'high-ponytail',
      smileCurve: 1.25,
    },
    somchai: {
      preset: 'somchai',
      heightScale: 1.00,
      slender: false,
      isElder: true,
      skinHex: '#e7ba98',
      skinColor: 0xe7ba98,
      coatHex: '#c68838',
      innerHex: '#f2ece0',
      skirtHex: '#6f5c45',
      hairBaseHex: '#cfd2d9',
      hairHighlightHex: '#f0f2f7',
      hairShadowHex: '#9196a1',
      shoeColor: 0x4b3527,
      irisTopHex: '#3f2c20',
      irisBottomHex: '#72523e',
      browHex: '#92969f',
      clothingStyle: 'cardigan',
      clothingAccentHex: '#a36b24',
      bottomStyle: 'trousers',
      hairstyle: 'neat-parted',
      hasMustache: true,
    },
    kiryu: {
      preset: 'kiryu',
      heightScale: 1.02,
      slender: false,
      skinHex: '#f0c6a6',
      skinColor: 0xf0c6a6,
      coatHex: '#6f2e3b',
      innerHex: '#2d3138',
      skirtHex: '#232730',
      hairBaseHex: '#61483b',
      hairHighlightHex: '#9c7863',
      hairShadowHex: '#3b2920',
      shoeColor: 0x262122,
      irisTopHex: '#33241c',
      irisBottomHex: '#6e4f3d',
      browHex: '#443127',
      clothingStyle: 'trench',
      clothingAccentHex: '#4f1f29',
      bottomStyle: 'trousers',
      hairstyle: 'short-quiff',
      hasHeadphones: true,
    },
    ploysai: {
      preset: 'ploysai',
      heightScale: 0.96,
      slender: true,
      skinHex: '#f7d6c0',
      skinColor: 0xf7d6c0,
      coatHex: '#c9888b',
      innerHex: '#f7f2e8',
      skirtHex: '#59483b',
      hairBaseHex: '#30221c',
      hairHighlightHex: '#5d463c',
      hairShadowHex: '#1b120f',
      shoeColor: 0x5c3e2e,
      irisTopHex: '#3f281f',
      irisBottomHex: '#7d5443',
      browHex: '#2c1e18',
      clothingStyle: 'cardigan',
      clothingAccentHex: '#a8696c',
      bottomStyle: 'skirt',
      hairstyle: 'short-bob',
      hasPearlEarrings: true,
      hasHairClip: true,
      hairClipColor: 0xe8be5e,
    },
    pheem: {
      preset: 'pheem',
      heightScale: 1.02,
      slender: false,
      skinHex: '#f3cfb4',
      skinColor: 0xf3cfb4,
      coatHex: '#3c4c66',
      innerHex: '#9eb8d2',
      skirtHex: '#2c3442',
      hairBaseHex: '#3a2920',
      hairHighlightHex: '#664c3d',
      hairShadowHex: '#211611',
      shoeColor: 0x3b2a20,
      irisTopHex: '#34251c',
      irisBottomHex: '#6c4d3b',
      browHex: '#2e1f17',
      clothingStyle: 'waistcoat',
      clothingAccentHex: '#2a374c',
      bottomStyle: 'trousers',
      hairstyle: 'neat-parted',
      hasGlasses: true,
      glassStyle: 'round',
    },
    meilin: {
      preset: 'meilin',
      heightScale: 0.96,
      slender: true,
      skinHex: '#f8dbc6',
      skinColor: 0xf8dbc6,
      coatHex: '#c67d47',
      innerHex: '#f5efe2',
      skirtHex: '#382c25',
      hairBaseHex: '#1d1c22',
      hairHighlightHex: '#464452',
      hairShadowHex: '#0f0e12',
      shoeColor: 0x452d20,
      irisTopHex: '#292121',
      irisBottomHex: '#5c4640',
      browHex: '#1c191c',
      clothingStyle: 'trench',
      clothingAccentHex: '#a15e30',
      bottomStyle: 'trousers',
      hairstyle: 'twin-braids',
    },
    win: {
      preset: 'win',
      heightScale: 1.01,
      slender: false,
      skinHex: '#e3b089',
      skinColor: 0xe3b089,
      coatHex: '#596b45',
      innerHex: '#f1ebe0',
      skirtHex: '#3a424d',
      hairBaseHex: '#4d3527',
      hairHighlightHex: '#7d5a45',
      hairShadowHex: '#2e1e15',
      shoeColor: 0x4a3525,
      irisTopHex: '#3b291e',
      irisBottomHex: '#75533e',
      browHex: '#38261c',
      clothingStyle: 'trench',
      clothingAccentHex: '#404f30',
      bottomStyle: 'trousers',
      hairstyle: 'short-quiff',
      hasCamera: true,
    },
    chandra: {
      preset: 'chandra',
      heightScale: 0.96,
      slender: true,
      isElder: false,
      skinHex: '#ebc09f',
      skinColor: 0xebc09f,
      coatHex: '#632d48',
      innerHex: '#632d48',
      skirtHex: '#351c2c',
      hairBaseHex: '#1f1e24',
      hairHighlightHex: '#494754',
      hairShadowHex: '#111014',
      shoeColor: 0x4b2f28,
      irisTopHex: '#30221e',
      irisBottomHex: '#664940',
      browHex: '#1e1b20',
      clothingStyle: 'thai-blouse',
      clothingAccentHex: '#d5ae5b',
      bottomStyle: 'skirt',
      sleeveEndsAtElbow: true,
      hairstyle: 'low-messy-bun',
      earringColor: 0xe5b856,
      hasHairClip: true,
      hairClipColor: 0xe8bd5c,
      hasHandbag: true,
      bagColor: 0x7d4c2d,
    },
  };

  const LEGACY_SHOPKEEPER_GUEST_IDS = new Set<LegacyShopkeeperGuestId>([
    'tea-master',
    'spirit-blossom-kindred',
    'mococo-abyssgard',
    'diego-body',
    'cicada-suit-v2',
  ]);

  const guestHandles = new Map<string, SeamlessCharacterHandle>();
  const getOrCreateGuestHandle = (guestId: string): SeamlessCharacterHandle => {
    if (LEGACY_SHOPKEEPER_GUEST_IDS.has(guestId as LegacyShopkeeperGuestId)) {
      const existing = guestHandles.get(guestId);
      if (existing) return existing;
      const created = buildLegacyShopkeeperGuest(
        guestId as LegacyShopkeeperGuestId,
        compactMode,
        ultraCompact,
      );
      guestHandles.set(guestId, created);
      guestsContainer.add(created.group);
      return created;
    }

    const resolvedId = GUEST_PRESET_CONFIGS[guestId] ? guestId : 'som-o';
    const existing = guestHandles.get(resolvedId);
    if (existing) return existing;
    const created = buildSeamlessHumanGuest(
      compactMode,
      ultraCompact,
      GUEST_PRESET_CONFIGS[resolvedId],
    );
    guestHandles.set(resolvedId, created);
    guestsContainer.add(created.group);
    return created;
  };

  // Pre-build initial default guest so first scene frame is ready immediately
  getOrCreateGuestHandle('som-o');
  root.add(guestsContainer);

  // Collect all character procedural CanvasTextures for clean WebGL disposal
  const allCharacterTextures: THREE.Texture[] = [...teaArtisan.textures];

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

  const startCustomerWalkIn = (guestId: string) => {
    customerPhase = 'ENTERING';
    waypointIdx = 1;
    customerWalkPhase = 0;
    customerDoorCrossedEmitted = false;
    guestsContainer.position.set(DOOR_OUTSIDE_POS.x, SHOP_FLOOR_Y, DOOR_OUTSIDE_POS.y);
    guestsContainer.rotation.y = -Math.PI / 2;
    const active = getOrCreateGuestHandle(guestId);
    for (const handle of guestHandles.values()) {
      handle.group.visible = handle === active;
    }
  };

  const setFirstPersonHidden = (hidden: boolean) => {
    firstPersonHidden = hidden;
    playerContainer.visible = !hidden;
  };

  const setPlayerCharacter = (characterId: PlayerCharacterId) => {
    activePlayerId = characterId;
    teaArtisan.group.visible = characterId === 'tea-artisan';
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

    const sinY = Math.sin(cameraYaw);
    const cosY = Math.cos(cameraYaw);
    const moveDirX = nx * cosY - ny * sinY;
    const moveDirZ = -nx * sinY - ny * cosY;

    const speed = 2.45 * clampedMag;
    const rawX = playerContainer.position.x + moveDirX * speed * delta;
    const rawZ = playerContainer.position.z + moveDirZ * speed * delta;
    const resolved = clampToShopObstacles(rawX, rawZ);

    playerContainer.position.x = resolved.x;
    playerContainer.position.z = resolved.z;

    const targetAngle = Math.atan2(moveDirX, moveDirZ);
    let angleDiff = targetAngle - playerContainer.rotation.y;
    while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
    while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;
    playerContainer.rotation.y += angleDiff * Math.min(1, delta * 12);

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

    const activePlayer = playerModels[activePlayerId] ?? teaArtisan;

    // 1. Update Active Seamless Player Character Pose
    if (!firstPersonHidden) {
      if (activePlayer.spiritOrbGroup && !reducedMotion) {
        activePlayer.spiritOrbGroup.position.y =
          1.38 + Math.sin(elapsed * 2.4) * 0.045;
        activePlayer.spiritOrbGroup.rotation.y = elapsed * 0.85;
      }

      animateSeamlessHumanoid(activePlayer.bones, elapsed, delta, {
        isMoving: isPlayerMoving,
        walkPhase: playerWalkPhase,
        walkSpeed: playerWalkSpeed,
        isPouring,
        step,
        isSeated: false,
        reducedMotion,
      });

      const walkBounce =
        isPlayerMoving && !reducedMotion
          ? Math.abs(Math.sin(playerWalkPhase)) * 0.018 * playerWalkSpeed
          : 0;
      playerContainer.position.y = THREE.MathUtils.lerp(
        playerContainer.position.y,
        SHOP_FLOOR_Y + walkBounce,
        Math.min(1, delta * 12),
      );
    }

    // 2. Customer Walk-In from Outside -> Doorway Alert -> Seated Ordering
    let customerCrossedDoorNow = false;
    if (showGuest) {
      const activeGuest = getOrCreateGuestHandle(guestId);
      for (const handle of guestHandles.values()) {
        handle.group.visible = handle === activeGuest;
      }

      if (activeGuest.spiritOrbGroup && !reducedMotion) {
        activeGuest.spiritOrbGroup.position.y =
          1.38 + Math.sin(elapsed * 2.4) * 0.045;
        activeGuest.spiritOrbGroup.rotation.y = elapsed * 0.85;
      }

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

        customerWalkPhase += delta * 8.2;
        animateSeamlessHumanoid(activeGuest.bones, elapsed, delta, {
          isMoving: true,
          walkPhase: customerWalkPhase,
          walkSpeed: 0.9,
          isPouring: false,
          step,
          isSeated: false,
          reducedMotion,
        });
        guestsContainer.position.y =
          SHOP_FLOOR_Y +
          (reducedMotion ? 0 : Math.abs(Math.sin(customerWalkPhase)) * 0.015);
      } else {
        guestsContainer.position.x = SEAT_LEFT_POS.x;
        guestsContainer.position.z = SEAT_LEFT_POS.z;
        let rotDiff = SEAT_LEFT_ROT_Y - guestsContainer.rotation.y;
        while (rotDiff > Math.PI) rotDiff -= Math.PI * 2;
        while (rotDiff < -Math.PI) rotDiff += Math.PI * 2;
        guestsContainer.rotation.y += rotDiff * Math.min(1, delta * 8);

        animateSeamlessHumanoid(activeGuest.bones, elapsed, delta, {
          isMoving: false,
          walkPhase: 0,
          walkSpeed: 0,
          isPouring: false,
          step,
          isSeated: true,
          reducedMotion,
        });

        const bob = reducedMotion
          ? 0
          : customerPhase === 'SERVED_ENJOYING'
            ? Math.sin(elapsed * 3.6) * 0.014
            : Math.sin(elapsed * 1.5) * 0.007;
        guestsContainer.position.y = SHOP_FLOOR_Y + bob;
      }
    }

    return {
      playerPos: playerContainer.position,
      playerRotY: playerContainer.rotation.y,
      isNearTeaTable: checkNearTeaTable(playerContainer.position),
      customerPhase,
      customerCrossedDoorNow,
    };
  };

  const dispose = () => {
    for (const tex of allCharacterTextures) {
      tex.dispose();
    }
    for (const handle of guestHandles.values()) {
      for (const tex of handle.textures) {
        tex.dispose();
      }
    }
  };

  return {
    root,
    teaMasterGroup: playerContainer,
    guestsContainer,
    startCustomerWalkIn,
    setFirstPersonHidden,
    setPlayerCharacter,
    movePlayer,
    getPlayerPosition: () => playerContainer.position,
    getPlayerRotationY: () => playerContainer.rotation.y,
    isNearTeaTable: () => checkNearTeaTable(playerContainer.position),
    animate,
    dispose,
  };
}
