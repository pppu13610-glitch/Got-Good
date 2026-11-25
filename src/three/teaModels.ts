import * as THREE from 'three';

export const TRAY_SURFACE_Y = 0.08;

export interface TeaVesselHandles {
  root: THREE.Group;
  ceramicGroup: THREE.Group;
  chawanGroup: THREE.Group;
  glassGroup: THREE.Group;
  liquidGroup: THREE.Group;
  liquidMesh: THREE.Mesh;
  liquidMaterial: THREE.MeshPhysicalMaterial;
  leavesGroup: THREE.Group;
  leafMeshes: THREE.Mesh[];
  leafMaterial: THREE.MeshStandardMaterial;
  iceGroup: THREE.Group;
  iceCubes: THREE.Mesh[];
  lemonGroup: THREE.Group;
  honeyGroup: THREE.Group;
  osmanthusGroup: THREE.Group;
  clickProxy: THREE.Mesh;
}

export interface KettleHandles {
  root: THREE.Group;
  bodyGroup: THREE.Group;
  streamMesh: THREE.Mesh;
  clickProxy: THREE.Mesh;
}

export interface ChasenHandles {
  root: THREE.Group;
  whiskGroup: THREE.Group;
}

export function createTeaTableEnvironment(
  woodTex: THREE.CanvasTexture,
  walnutTex: THREE.CanvasTexture,
  matTex: THREE.CanvasTexture,
  ceramicTex: THREE.CanvasTexture,
  shadowTex: THREE.CanvasTexture,
): THREE.Group {
  const envGroup = new THREE.Group();

  // 1. Wide Cedar Tea Countertop (y = -0.18 to 0)
  const tableGeo = new THREE.BoxGeometry(10.5, 0.22, 6.2);
  const tableMat = new THREE.MeshStandardMaterial({
    map: woodTex,
    roughness: 0.62,
    metalness: 0.02,
  });
  const table = new THREE.Mesh(tableGeo, tableMat);
  table.position.set(0, -0.11, 0);
  table.receiveShadow = true;
  envGroup.add(table);

  // Subtle front edge bevel moulding
  const trimGeo = new THREE.BoxGeometry(10.54, 0.06, 0.08);
  const trimMat = new THREE.MeshStandardMaterial({
    color: 0x5c422c,
    roughness: 0.45,
    metalness: 0.05,
  });
  const frontTrim = new THREE.Mesh(trimGeo, trimMat);
  frontTrim.position.set(0, -0.02, 3.1);
  envGroup.add(frontTrim);

  // 2. Woven Bamboo Tea Tray (multi-part group grounded at y = 0)
  const trayGroup = new THREE.Group();
  const trayFloor = new THREE.Mesh(
    new THREE.BoxGeometry(3.8, 0.06, 2.35),
    new THREE.MeshStandardMaterial({
      map: matTex,
      roughness: 0.85,
      metalness: 0,
    }),
  );
  trayFloor.position.y = 0.045;
  trayFloor.receiveShadow = true;
  trayGroup.add(trayFloor);

  const railMat = new THREE.MeshStandardMaterial({
    map: walnutTex,
    roughness: 0.42,
    metalness: 0.04,
  });
  const railH = 0.11;
  const railT = 0.09;
  const backRail = new THREE.Mesh(
    new THREE.BoxGeometry(3.96, railH, railT),
    railMat,
  );
  backRail.position.set(0, railH / 2, -1.18);
  backRail.castShadow = true;
  backRail.receiveShadow = true;

  const frontRail = backRail.clone();
  frontRail.position.z = 1.18;

  const leftRail = new THREE.Mesh(
    new THREE.BoxGeometry(railT, railH, 2.45),
    railMat,
  );
  leftRail.position.set(-1.93, railH / 2, 0);
  leftRail.castShadow = true;
  leftRail.receiveShadow = true;

  const rightRail = leftRail.clone();
  rightRail.position.x = 1.93;

  trayGroup.add(backRail, frontRail, leftRail, rightRail);

  // Brass corner brackets for craft detail
  const brassMat = new THREE.MeshStandardMaterial({
    color: 0xc89d54,
    metalness: 0.85,
    roughness: 0.25,
  });
  const cornerPositions: [number, number][] = [
    [-1.93, -1.18],
    [1.93, -1.18],
    [-1.93, 1.18],
    [1.93, 1.18],
  ];
  for (const [cx, cz] of cornerPositions) {
    const bracket = new THREE.Mesh(
      new THREE.BoxGeometry(0.14, 0.115, 0.14),
      brassMat,
    );
    bracket.position.set(cx, 0.058, cz);
    trayGroup.add(bracket);
  }
  envGroup.add(trayGroup);

  // 3. Decorative Tea Canisters (Left of tray, composite 3-part groups)
  const canisterColors = [0x3c5844, 0x8b5a3c];
  canisterColors.forEach((col, idx) => {
    const canister = new THREE.Group();
    const xPos = -2.65 - idx * 0.65;
    const zPos = -0.35 + idx * 0.55;

    const contact = new THREE.Mesh(
      new THREE.PlaneGeometry(0.65, 0.65),
      new THREE.MeshBasicMaterial({
        map: shadowTex,
        transparent: true,
        depthWrite: false,
        opacity: 0.5,
      }),
    );
    contact.rotation.x = -Math.PI / 2;
    contact.position.y = 0.005;
    canister.add(contact);

    const bodyPts = [
      new THREE.Vector2(0, 0),
      new THREE.Vector2(0.22, 0),
      new THREE.Vector2(0.24, 0.42),
      new THREE.Vector2(0.21, 0.48),
      new THREE.Vector2(0, 0.48),
    ];
    const body = new THREE.Mesh(
      new THREE.LatheGeometry(bodyPts, 28),
      new THREE.MeshStandardMaterial({
        color: col,
        map: ceramicTex,
        roughness: 0.35,
        metalness: 0.06,
      }),
    );
    body.castShadow = true;
    body.receiveShadow = true;
    canister.add(body);

    const lid = new THREE.Mesh(
      new THREE.CylinderGeometry(0.215, 0.225, 0.09, 24),
      new THREE.MeshStandardMaterial({
        map: walnutTex,
        roughness: 0.72,
        metalness: 0.02,
      }),
    );
    lid.position.y = 0.52;
    lid.castShadow = true;
    canister.add(lid);

    const knob = new THREE.Mesh(
      new THREE.SphereGeometry(0.045, 16, 16),
      brassMat,
    );
    knob.position.y = 0.58;
    canister.add(knob);

    canister.position.set(xPos, 0, zPos);
    envGroup.add(canister);
  });

  // 4. Courtyard Bamboo Garden Backdrop (InstancedMesh for calm horizon depth)
  const bambooCount = 26;
  const stalkGeo = new THREE.CylinderGeometry(0.065, 0.08, 4.6, 10);
  const stalkMat = new THREE.MeshStandardMaterial({
    color: 0x628358,
    roughness: 0.55,
    metalness: 0.02,
  });
  const bambooInstanced = new THREE.InstancedMesh(
    stalkGeo,
    stalkMat,
    bambooCount,
  );
  const dummy = new THREE.Object3D();
  const tint = new THREE.Color();

  for (let i = 0; i < bambooCount; i++) {
    const angle = -Math.PI * 0.88 + (i / (bambooCount - 1)) * Math.PI * 0.76;
    const dist = 4.2 + (i % 3) * 1.1;
    dummy.position.set(
      Math.cos(angle) * dist * 1.15,
      1.6,
      -2.2 - Math.abs(Math.sin(angle)) * dist * 0.65,
    );
    dummy.rotation.set(
      ((i % 5) - 2) * 0.025,
      i * 0.4,
      ((i % 7) - 3) * 0.02,
    );
    const s = 0.85 + (i % 4) * 0.12;
    dummy.scale.set(s, 1 + (i % 3) * 0.15, s);
    dummy.updateMatrix();
    bambooInstanced.setMatrixAt(i, dummy.matrix);

    tint.setHSL(0.28 + (i % 4) * 0.015, 0.25, 0.44 + (i % 3) * 0.06);
    bambooInstanced.setColorAt(i, tint);
  }
  bambooInstanced.instanceMatrix.needsUpdate = true;
  if (bambooInstanced.instanceColor) {
    bambooInstanced.instanceColor.needsUpdate = true;
  }
  bambooInstanced.computeBoundingSphere();
  envGroup.add(bambooInstanced);

  // Soft courtyard stone deck beyond counter
  const deck = new THREE.Mesh(
    new THREE.PlaneGeometry(36, 28),
    new THREE.MeshStandardMaterial({
      color: 0xc2cbc0,
      roughness: 0.92,
      metalness: 0,
    }),
  );
  deck.rotation.x = -Math.PI / 2;
  deck.position.set(0, -0.75, -5);
  envGroup.add(deck);

  return envGroup;
}

export function createTeaVesselSystem(
  ceramicTex: THREE.CanvasTexture,
  walnutTex: THREE.CanvasTexture,
  shadowTex: THREE.CanvasTexture,
  isSoftwareGl: boolean,
): TeaVesselHandles {
  const root = new THREE.Group();
  root.position.set(-0.22, TRAY_SURFACE_Y, 0.08);

  // Contact shadow disc
  const contactShadow = new THREE.Mesh(
    new THREE.PlaneGeometry(1.55, 1.55),
    new THREE.MeshBasicMaterial({
      map: shadowTex,
      transparent: true,
      depthWrite: false,
      opacity: 0.55,
    }),
  );
  contactShadow.rotation.x = -Math.PI / 2;
  contactShadow.position.y = 0.004;
  root.add(contactShadow);

  // Wooden Coaster (LatheGeometry)
  const coasterPts = [
    new THREE.Vector2(0, 0),
    new THREE.Vector2(0.56, 0),
    new THREE.Vector2(0.60, 0.03),
    new THREE.Vector2(0.58, 0.055),
    new THREE.Vector2(0.46, 0.035),
    new THREE.Vector2(0, 0.035),
  ];
  const coaster = new THREE.Mesh(
    new THREE.LatheGeometry(coasterPts, 40),
    new THREE.MeshStandardMaterial({
      map: walnutTex,
      roughness: 0.65,
      metalness: 0.03,
    }),
  );
  coaster.castShadow = true;
  coaster.receiveShadow = true;
  root.add(coaster);

  // === Style A: Glazed Ceramic Cup (for Green / Oolong / Black) ===
  const ceramicGroup = new THREE.Group();
  ceramicGroup.position.y = 0.035;

  const mugPts = [
    new THREE.Vector2(0, 0),
    new THREE.Vector2(0.28, 0),
    new THREE.Vector2(0.32, 0.06),
    new THREE.Vector2(0.42, 0.34),
    new THREE.Vector2(0.45, 0.68),
    new THREE.Vector2(0.46, 0.74),
    new THREE.Vector2(0.415, 0.74),
    new THREE.Vector2(0.385, 0.36),
    new THREE.Vector2(0.27, 0.07),
    new THREE.Vector2(0, 0.07),
  ];
  const mugBody = new THREE.Mesh(
    new THREE.LatheGeometry(mugPts, 44),
    new THREE.MeshStandardMaterial({
      color: 0xf2efe6,
      map: ceramicTex,
      roughness: 0.28,
      metalness: 0.04,
    }),
  );
  mugBody.castShadow = true;
  mugBody.receiveShadow = true;
  ceramicGroup.add(mugBody);

  // Matte clay foot ring for roughness contrast (>= 0.25 delta)
  const mugFoot = new THREE.Mesh(
    new THREE.CylinderGeometry(0.29, 0.27, 0.045, 32),
    new THREE.MeshStandardMaterial({
      color: 0x9b8873,
      roughness: 0.88,
      metalness: 0,
    }),
  );
  mugFoot.position.y = 0.022;
  ceramicGroup.add(mugFoot);

  // Ceramic handle via TubeGeometry
  const handleCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(0.43, 0.60, 0),
    new THREE.Vector3(0.64, 0.56, 0),
    new THREE.Vector3(0.66, 0.34, 0),
    new THREE.Vector3(0.40, 0.22, 0),
  ]);
  const mugHandle = new THREE.Mesh(
    new THREE.TubeGeometry(handleCurve, 24, 0.045, 14, false),
    new THREE.MeshStandardMaterial({
      color: 0xf2efe6,
      map: ceramicTex,
      roughness: 0.28,
      metalness: 0.04,
    }),
  );
  mugHandle.castShadow = true;
  ceramicGroup.add(mugHandle);
  root.add(ceramicGroup);

  // === Style B: Wide Matcha Chawan Bowl ===
  const chawanGroup = new THREE.Group();
  chawanGroup.position.y = 0.035;

  const chawanPts = [
    new THREE.Vector2(0, 0),
    new THREE.Vector2(0.26, 0),
    new THREE.Vector2(0.32, 0.08),
    new THREE.Vector2(0.50, 0.28),
    new THREE.Vector2(0.54, 0.56),
    new THREE.Vector2(0.53, 0.60),
    new THREE.Vector2(0.48, 0.60),
    new THREE.Vector2(0.44, 0.30),
    new THREE.Vector2(0.24, 0.08),
    new THREE.Vector2(0, 0.08),
  ];
  const chawanBody = new THREE.Mesh(
    new THREE.LatheGeometry(chawanPts, 48),
    new THREE.MeshStandardMaterial({
      color: 0x3b483d,
      map: ceramicTex,
      roughness: 0.34,
      metalness: 0.06,
    }),
  );
  chawanBody.castShadow = true;
  chawanBody.receiveShadow = true;
  chawanGroup.add(chawanBody);

  const chawanRim = new THREE.Mesh(
    new THREE.TorusGeometry(0.505, 0.025, 14, 48),
    new THREE.MeshStandardMaterial({
      color: 0xb6956a,
      roughness: 0.62,
      metalness: 0.04,
    }),
  );
  chawanRim.rotation.x = Math.PI / 2;
  chawanRim.position.y = 0.595;
  chawanGroup.add(chawanRim);

  chawanGroup.visible = false;
  root.add(chawanGroup);

  // === Style C: Heatproof Glass Cup (for Thai Tea / Butterfly Pea / Chamomile) ===
  const glassGroup = new THREE.Group();
  glassGroup.position.y = 0.035;

  const glassPts = [
    new THREE.Vector2(0, 0),
    new THREE.Vector2(0.30, 0),
    new THREE.Vector2(0.34, 0.06),
    new THREE.Vector2(0.44, 0.72),
    new THREE.Vector2(0.45, 0.76),
    new THREE.Vector2(0.42, 0.76),
    new THREE.Vector2(0.39, 0.40),
    new THREE.Vector2(0.28, 0.06),
    new THREE.Vector2(0, 0.06),
  ];
  const glassMat = new THREE.MeshPhysicalMaterial({
    color: 0xffffff,
    metalness: 0,
    roughness: 0.08,
    transmission: isSoftwareGl ? 0 : 0.78,
    transparent: true,
    opacity: isSoftwareGl ? 0.34 : 0.92,
    ior: 1.5,
    thickness: 0.25,
    clearcoat: 1.0,
    depthWrite: false,
  });
  const glassMesh = new THREE.Mesh(
    new THREE.LatheGeometry(glassPts, 44),
    glassMat,
  );
  glassMesh.renderOrder = 6;
  glassGroup.add(glassMesh);

  const glassHandle = new THREE.Mesh(
    new THREE.TubeGeometry(handleCurve, 24, 0.036, 12, false),
    glassMat,
  );
  glassHandle.renderOrder = 6;
  glassGroup.add(glassHandle);
  glassGroup.visible = false;
  root.add(glassGroup);

  // === Dynamic Liquid Volume ===
  const liquidGroup = new THREE.Group();
  liquidGroup.position.y = 0.11; // Bottom inside cup

  const liquidMaterial = new THREE.MeshPhysicalMaterial({
    color: 0xe8e6df,
    roughness: 0.12,
    metalness: 0.02,
    clearcoat: 0.9,
    clearcoatRoughness: 0.08,
    transparent: true,
    opacity: 0.92,
  });

  // Tapered liquid body scaled along Y (height = 0.56 at full)
  const liquidGeo = new THREE.CylinderGeometry(0.415, 0.285, 0.56, 36);
  liquidGeo.translate(0, 0.28, 0);
  const liquidMesh = new THREE.Mesh(liquidGeo, liquidMaterial);
  liquidMesh.renderOrder = 3;
  liquidGroup.add(liquidMesh);
  liquidGroup.scale.y = 0.001;
  liquidGroup.visible = false;
  root.add(liquidGroup);

  // === Tea Leaves / Matcha Powder Bed ===
  const leavesGroup = new THREE.Group();
  leavesGroup.position.y = 0.13;
  const leafMaterial = new THREE.MeshStandardMaterial({
    color: 0x4e7a3a,
    roughness: 0.85,
    metalness: 0,
  });
  const leafMeshes: THREE.Mesh[] = [];
  const leafGeo = new THREE.DodecahedronGeometry(0.042, 0);
  for (let i = 0; i < 14; i++) {
    const m = new THREE.Mesh(leafGeo, leafMaterial);
    const angle = (i / 14) * Math.PI * 2;
    const rad = (i % 3) * 0.065 + 0.03;
    m.position.set(
      Math.cos(angle) * rad,
      (i % 2) * 0.015,
      Math.sin(angle) * rad,
    );
    m.scale.set(1.2, 0.45, 0.85);
    m.rotation.set(i * 0.4, angle, i * 0.2);
    leavesGroup.add(m);
    leafMeshes.push(m);
  }
  root.add(leavesGroup);

  // === Toppings: Ice Cubes ===
  const iceGroup = new THREE.Group();
  iceGroup.position.y = 0.56;
  const iceMat = new THREE.MeshPhysicalMaterial({
    color: 0xe6f4fa,
    roughness: 0.12,
    metalness: 0,
    transparent: true,
    opacity: 0.65,
    clearcoat: 1,
    ior: 1.31,
  });
  const iceCubes: THREE.Mesh[] = [];
  const icePositions: [number, number, number, number][] = [
    [-0.14, 0.02, -0.06, 0.3],
    [0.12, 0.04, -0.09, -0.5],
    [0.02, 0.01, 0.14, 0.8],
  ];
  for (const [ix, iy, iz, rot] of icePositions) {
    const cube = new THREE.Mesh(
      new THREE.BoxGeometry(0.16, 0.15, 0.16),
      iceMat,
    );
    cube.position.set(ix, iy, iz);
    cube.rotation.set(rot * 0.4, rot, rot * 0.3);
    cube.renderOrder = 4;
    iceGroup.add(cube);
    iceCubes.push(cube);
  }
  iceGroup.visible = false;
  root.add(iceGroup);

  // === Toppings: Lemon Wheel perched on rim ===
  const lemonGroup = new THREE.Group();
  const rind = new THREE.Mesh(
    new THREE.CylinderGeometry(0.18, 0.18, 0.032, 24),
    new THREE.MeshStandardMaterial({color: 0xe5be28, roughness: 0.45}),
  );
  const pith = new THREE.Mesh(
    new THREE.CylinderGeometry(0.155, 0.155, 0.035, 24),
    new THREE.MeshStandardMaterial({color: 0xfff6cf, roughness: 0.35}),
  );
  const pulp = new THREE.Mesh(
    new THREE.CylinderGeometry(0.135, 0.135, 0.038, 24),
    new THREE.MeshStandardMaterial({color: 0xf3d44c, roughness: 0.25}),
  );
  lemonGroup.add(rind, pith, pulp);
  lemonGroup.position.set(-0.36, 0.72, 0.16);
  lemonGroup.rotation.set(0.55, 0.3, -0.65);
  lemonGroup.visible = false;
  root.add(lemonGroup);

  // === Toppings: Golden Honey Swirl ===
  const honeyCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(-0.18, 0.34, 0.06),
    new THREE.Vector3(0.05, 0.28, 0.16),
    new THREE.Vector3(0.16, 0.20, -0.06),
    new THREE.Vector3(-0.08, 0.14, -0.14),
  ]);
  const honeyGroup = new THREE.Group();
  const honeyTube = new THREE.Mesh(
    new THREE.TubeGeometry(honeyCurve, 28, 0.018, 8, false),
    new THREE.MeshPhysicalMaterial({
      color: 0xe29d23,
      roughness: 0.18,
      clearcoat: 1,
      transparent: true,
      opacity: 0.85,
    }),
  );
  honeyGroup.add(honeyTube);
  honeyGroup.visible = false;
  root.add(honeyGroup);

  // === Toppings: Osmanthus Floating Petals ===
  const osmanthusGroup = new THREE.Group();
  osmanthusGroup.position.y = 0.67;
  const petalMat = new THREE.MeshStandardMaterial({
    color: 0xf4c752,
    roughness: 0.55,
  });
  const petalGeo = new THREE.CircleGeometry(0.025, 6);
  for (let i = 0; i < 9; i++) {
    const p = new THREE.Mesh(petalGeo, petalMat);
    const a = (i / 9) * Math.PI * 2 + 0.3;
    const r = 0.08 + (i % 3) * 0.08;
    p.position.set(Math.cos(a) * r, 0.004, Math.sin(a) * r);
    p.rotation.x = -Math.PI / 2;
    osmanthusGroup.add(p);
  }
  osmanthusGroup.visible = false;
  root.add(osmanthusGroup);

  // Invisible raycast proxy for easy click-to-steep interaction
  const clickProxy = new THREE.Mesh(
    new THREE.CylinderGeometry(0.56, 0.45, 0.9, 16),
    new THREE.MeshBasicMaterial({visible: false}),
  );
  clickProxy.position.y = 0.45;
  clickProxy.userData = {interactId: 'vessel'};
  root.add(clickProxy);

  return {
    root,
    ceramicGroup,
    chawanGroup,
    glassGroup,
    liquidGroup,
    liquidMesh,
    liquidMaterial,
    leavesGroup,
    leafMeshes,
    leafMaterial,
    iceGroup,
    iceCubes,
    lemonGroup,
    honeyGroup,
    osmanthusGroup,
    clickProxy,
  };
}

export function createKettleGroup(
  walnutTex: THREE.CanvasTexture,
  shadowTex: THREE.CanvasTexture,
): KettleHandles {
  const root = new THREE.Group();
  root.position.set(1.12, TRAY_SURFACE_Y, -0.15);

  // Bamboo warmer coaster
  const contact = new THREE.Mesh(
    new THREE.PlaneGeometry(1.45, 1.45),
    new THREE.MeshBasicMaterial({
      map: shadowTex,
      transparent: true,
      depthWrite: false,
      opacity: 0.5,
    }),
  );
  contact.rotation.x = -Math.PI / 2;
  contact.position.y = 0.004;
  root.add(contact);

  const stand = new THREE.Mesh(
    new THREE.CylinderGeometry(0.46, 0.50, 0.06, 32),
    new THREE.MeshStandardMaterial({
      map: walnutTex,
      roughness: 0.72,
      metalness: 0.02,
    }),
  );
  stand.position.y = 0.03;
  stand.receiveShadow = true;
  root.add(stand);

  // Articulated Kettle Body Group (lifts & tilts during pouring)
  const bodyGroup = new THREE.Group();
  bodyGroup.position.set(0, 0.06, 0);

  const castIronMat = new THREE.MeshStandardMaterial({
    color: 0x262c28,
    roughness: 0.66,
    metalness: 0.35,
  });
  const brassMat = new THREE.MeshStandardMaterial({
    color: 0xc99c4c,
    roughness: 0.22,
    metalness: 0.85,
  });

  // Kettle Vessel (LatheGeometry)
  const kettlePts = [
    new THREE.Vector2(0, 0),
    new THREE.Vector2(0.32, 0),
    new THREE.Vector2(0.44, 0.14),
    new THREE.Vector2(0.46, 0.34),
    new THREE.Vector2(0.36, 0.52),
    new THREE.Vector2(0.24, 0.58),
    new THREE.Vector2(0, 0.58),
  ];
  const potBody = new THREE.Mesh(
    new THREE.LatheGeometry(kettlePts, 36),
    castIronMat,
  );
  potBody.castShadow = true;
  potBody.receiveShadow = true;
  bodyGroup.add(potBody);

  // Brass Lid & Knob
  const lid = new THREE.Mesh(
    new THREE.CylinderGeometry(0.23, 0.25, 0.04, 28),
    brassMat,
  );
  lid.position.y = 0.59;
  bodyGroup.add(lid);

  const knob = new THREE.Mesh(new THREE.SphereGeometry(0.055, 16, 16), brassMat);
  knob.position.y = 0.65;
  bodyGroup.add(knob);

  // Gooseneck Spout pointing toward -X (towards tea cup)
  const spoutCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(-0.36, 0.22, 0),
    new THREE.Vector3(-0.56, 0.34, 0),
    new THREE.Vector3(-0.66, 0.58, 0),
    new THREE.Vector3(-0.75, 0.64, 0),
  ]);
  const spout = new THREE.Mesh(
    new THREE.TubeGeometry(spoutCurve, 24, 0.036, 12, false),
    castIronMat,
  );
  spout.castShadow = true;
  bodyGroup.add(spout);

  // Arching Top Handle
  const handleCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(0.38, 0.42, 0),
    new THREE.Vector3(0.32, 0.84, 0),
    new THREE.Vector3(0, 0.94, 0),
    new THREE.Vector3(-0.30, 0.80, 0),
    new THREE.Vector3(-0.34, 0.44, 0),
  ]);
  const handle = new THREE.Mesh(
    new THREE.TubeGeometry(handleCurve, 28, 0.026, 10, false),
    brassMat,
  );
  handle.castShadow = true;
  bodyGroup.add(handle);

  // Pouring Water Stream (attached to bodyGroup world-aligned or root)
  const streamCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(-0.76, 0.62, 0),
    new THREE.Vector3(-0.92, 0.40, 0),
    new THREE.Vector3(-1.02, -0.25, 0),
  ]);
  const streamMesh = new THREE.Mesh(
    new THREE.TubeGeometry(streamCurve, 20, 0.024, 10, false),
    new THREE.MeshPhysicalMaterial({
      color: 0xe6f4fa,
      roughness: 0.08,
      transparent: true,
      opacity: 0.78,
      clearcoat: 1,
    }),
  );
  streamMesh.visible = false;
  bodyGroup.add(streamMesh);

  root.add(bodyGroup);

  const clickProxy = new THREE.Mesh(
    new THREE.CylinderGeometry(0.55, 0.55, 1.0, 14),
    new THREE.MeshBasicMaterial({visible: false}),
  );
  clickProxy.position.y = 0.5;
  clickProxy.userData = {interactId: 'kettle'};
  root.add(clickProxy);

  return {root, bodyGroup, streamMesh, clickProxy};
}

export function createChasenGroup(
  ceramicTex: THREE.CanvasTexture,
  shadowTex: THREE.CanvasTexture,
): ChasenHandles {
  const root = new THREE.Group();
  root.position.set(1.22, TRAY_SURFACE_Y, 0.72);

  const contact = new THREE.Mesh(
    new THREE.PlaneGeometry(0.65, 0.65),
    new THREE.MeshBasicMaterial({
      map: shadowTex,
      transparent: true,
      depthWrite: false,
      opacity: 0.45,
    }),
  );
  contact.rotation.x = -Math.PI / 2;
  contact.position.y = 0.004;
  root.add(contact);

  // Ceramic holder stand
  const holderPts = [
    new THREE.Vector2(0, 0),
    new THREE.Vector2(0.14, 0),
    new THREE.Vector2(0.15, 0.14),
    new THREE.Vector2(0.09, 0.24),
    new THREE.Vector2(0.12, 0.30),
    new THREE.Vector2(0, 0.30),
  ];
  const holder = new THREE.Mesh(
    new THREE.LatheGeometry(holderPts, 24),
    new THREE.MeshStandardMaterial({
      color: 0xdfe5da,
      map: ceramicTex,
      roughness: 0.32,
      metalness: 0.03,
    }),
  );
  holder.castShadow = true;
  root.add(holder);

  // Bamboo whisk resting upright on stand
  const whiskGroup = new THREE.Group();
  whiskGroup.position.y = 0.16;
  const bambooMat = new THREE.MeshStandardMaterial({
    color: 0xd5bc8a,
    roughness: 0.72,
    metalness: 0,
  });

  const handle = new THREE.Mesh(
    new THREE.CylinderGeometry(0.055, 0.05, 0.22, 16),
    bambooMat,
  );
  handle.position.y = 0.34;
  whiskGroup.add(handle);

  const collar = new THREE.Mesh(
    new THREE.TorusGeometry(0.06, 0.012, 8, 20),
    new THREE.MeshStandardMaterial({color: 0x2b2520, roughness: 0.8}),
  );
  collar.rotation.x = Math.PI / 2;
  collar.position.y = 0.24;
  whiskGroup.add(collar);

  const tines = new THREE.Mesh(
    new THREE.CylinderGeometry(0.06, 0.135, 0.26, 20, 1, true),
    new THREE.MeshStandardMaterial({
      color: 0xdcc596,
      roughness: 0.76,
      side: THREE.DoubleSide,
    }),
  );
  tines.position.y = 0.12;
  whiskGroup.add(tines);

  root.add(whiskGroup);
  return {root, whiskGroup};
}
