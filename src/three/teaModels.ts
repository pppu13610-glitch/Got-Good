import * as THREE from 'three';

export const TRAY_SURFACE_Y = 0.08;

export interface TeaVesselHandles {
  root: THREE.Group;
  ceramicGroup: THREE.Group;
  ceramicBodyMat: THREE.MeshStandardMaterial;
  ceramicHandleMat: THREE.MeshStandardMaterial;
  saucerMesh: THREE.Mesh;
  chawanGroup: THREE.Group;
  chawanBodyMat: THREE.MeshStandardMaterial;
  chawanRimMat: THREE.MeshStandardMaterial;
  kintsugiSeam: THREE.Mesh;
  glassGroup: THREE.Group;
  liquidGroup: THREE.Group;
  liquidMesh: THREE.Mesh;
  liquidMaterial: THREE.MeshStandardMaterial;
  leavesGroup: THREE.Group;
  leafMeshes: THREE.Mesh[];
  leafMaterial: THREE.MeshStandardMaterial;
  iceGroup: THREE.Group;
  iceCubes: THREE.Mesh[];
  lemonGroup: THREE.Group;
  honeyGroup: THREE.Group;
  osmanthusGroup: THREE.Group;
  strawberryGroup: THREE.Group;
  brownSugarGroup: THREE.Group;
  cinnamonGroup: THREE.Group;
  milkFoamGroup: THREE.Group;
  mintGroup: THREE.Group;
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
  caddyGroup: THREE.Group;
  chashakuGroup: THREE.Group;
}

export interface EquipmentRigHandles {
  root: THREE.Group;
  frotherSet: THREE.Group;
  frotherWand: THREE.Group;
  clayTeapotSet: THREE.Group;
  strainerSet: THREE.Group;
  herbalInfuserSet: THREE.Group;
  coldDripSet: THREE.Group;
  coldDripDrop: THREE.Mesh;
}

function makeContactShadow(
  size: number,
  shadowTex: THREE.CanvasTexture,
  opacity = 0.45,
): THREE.Mesh {
  const m = new THREE.Mesh(
    new THREE.PlaneGeometry(size, size),
    new THREE.MeshBasicMaterial({
      map: shadowTex,
      transparent: true,
      depthWrite: false,
      polygonOffset: true,
      polygonOffsetFactor: -1,
      polygonOffsetUnits: -1,
      opacity,
    }),
  );
  m.rotation.x = -Math.PI / 2;
  m.position.y = 0.004;
  return m;
}

export function createTeaTableEnvironment(
  woodTex: THREE.CanvasTexture,
  walnutTex: THREE.CanvasTexture,
  matTex: THREE.CanvasTexture,
  ceramicTex: THREE.CanvasTexture,
  shadowTex: THREE.CanvasTexture,
  compactMode = false,
): THREE.Group {
  const envGroup = new THREE.Group();

  // 1. Wide Cedar Tea Countertop (y = -0.22 to 0)
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

  // Brass corner brackets for craft detail (shared geometry)
  const brassMat = new THREE.MeshStandardMaterial({
    color: 0xc89d54,
    metalness: 0.85,
    roughness: 0.25,
  });
  const bracketGeo = new THREE.BoxGeometry(0.14, 0.115, 0.14);
  const cornerPositions: [number, number][] = [
    [-1.93, -1.18],
    [1.93, -1.18],
    [-1.93, 1.18],
    [1.93, 1.18],
  ];
  for (const [cx, cz] of cornerPositions) {
    const bracket = new THREE.Mesh(bracketGeo, brassMat);
    bracket.position.set(cx, 0.058, cz);
    trayGroup.add(bracket);
  }
  envGroup.add(trayGroup);

  // 3. Decorative Tea Canisters (shared geometry buffers across canisters)
  const canisterColors = [0x3c5844, 0x8b5a3c];
  const canisterSeg = compactMode ? 18 : 28;
  const bodyPts = [
    new THREE.Vector2(0, 0),
    new THREE.Vector2(0.22, 0),
    new THREE.Vector2(0.24, 0.42),
    new THREE.Vector2(0.21, 0.48),
    new THREE.Vector2(0, 0.48),
  ];
  const canisterBodyGeo = new THREE.LatheGeometry(bodyPts, canisterSeg);
  const canisterLidGeo = new THREE.CylinderGeometry(
    0.215,
    0.225,
    0.09,
    compactMode ? 16 : 24,
  );
  const canisterKnobGeo = new THREE.SphereGeometry(
    0.045,
    compactMode ? 10 : 16,
    compactMode ? 10 : 16,
  );
  const canisterLidMat = new THREE.MeshStandardMaterial({
    map: walnutTex,
    roughness: 0.72,
    metalness: 0.02,
  });

  canisterColors.forEach((col, idx) => {
    const canister = new THREE.Group();
    const xPos = -2.65 - idx * 0.65;
    const zPos = -0.35 + idx * 0.55;

    canister.add(makeContactShadow(0.65, shadowTex, 0.5));

    const body = new THREE.Mesh(
      canisterBodyGeo,
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

    const lid = new THREE.Mesh(canisterLidGeo, canisterLidMat);
    lid.position.y = 0.52;
    lid.castShadow = true;
    canister.add(lid);

    const knob = new THREE.Mesh(canisterKnobGeo, brassMat);
    knob.position.y = 0.58;
    canister.add(knob);

    canister.position.set(xPos, 0, zPos);
    envGroup.add(canister);
  });

  // 4. Courtyard Bamboo Garden Backdrop (InstancedMesh for calm horizon depth)
  const bambooCount = compactMode ? 18 : 26;
  const stalkGeo = new THREE.CylinderGeometry(
    0.065,
    0.08,
    4.6,
    compactMode ? 7 : 10,
  );
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
  compactMode = false,
): TeaVesselHandles {
  const root = new THREE.Group();
  root.position.set(-0.22, TRAY_SURFACE_Y, 0.08);

  const radialLg = compactMode ? 28 : 44;
  const radialXl = compactMode ? 30 : 48;
  const radialMd = compactMode ? 22 : 36;
  const radialTube = compactMode ? 16 : 24;

  // Contact shadow disc
  root.add(makeContactShadow(1.55, shadowTex, 0.55));

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
    new THREE.LatheGeometry(coasterPts, compactMode ? 26 : 40),
    new THREE.MeshStandardMaterial({
      map: walnutTex,
      roughness: 0.65,
      metalness: 0.03,
    }),
  );
  coaster.castShadow = true;
  coaster.receiveShadow = true;
  root.add(coaster);

  // === Style A: Glazed Ceramic Cup (for Green / Oolong / Black / Rosetta Latte) ===
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
  const ceramicBodyMat = new THREE.MeshStandardMaterial({
    color: 0xf2efe6,
    map: ceramicTex,
    roughness: 0.28,
    metalness: 0.04,
  });
  const mugBody = new THREE.Mesh(
    new THREE.LatheGeometry(mugPts, radialLg),
    ceramicBodyMat,
  );
  mugBody.castShadow = true;
  mugBody.receiveShadow = true;
  ceramicGroup.add(mugBody);

  // Matte clay foot ring for roughness contrast (>= 0.25 delta)
  const mugFoot = new THREE.Mesh(
    new THREE.CylinderGeometry(0.29, 0.27, 0.045, compactMode ? 20 : 32),
    new THREE.MeshStandardMaterial({
      color: 0x9b8873,
      roughness: 0.88,
      metalness: 0,
    }),
  );
  mugFoot.position.y = 0.022;
  ceramicGroup.add(mugFoot);

  // Ceramic saucer (shown for rosetta latte)
  const saucerPts = [
    new THREE.Vector2(0, 0),
    new THREE.Vector2(0.34, 0),
    new THREE.Vector2(0.62, 0.045),
    new THREE.Vector2(0.66, 0.07),
    new THREE.Vector2(0.63, 0.075),
    new THREE.Vector2(0.32, 0.022),
    new THREE.Vector2(0, 0.022),
  ];
  const saucerMesh = new THREE.Mesh(
    new THREE.LatheGeometry(saucerPts, radialLg),
    new THREE.MeshStandardMaterial({
      color: 0xf8f6ef,
      roughness: 0.24,
      metalness: 0.04,
    }),
  );
  saucerMesh.castShadow = true;
  saucerMesh.receiveShadow = true;
  saucerMesh.visible = false;
  ceramicGroup.add(saucerMesh);

  // Ceramic handle via TubeGeometry
  const handleCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(0.43, 0.60, 0),
    new THREE.Vector3(0.64, 0.56, 0),
    new THREE.Vector3(0.66, 0.34, 0),
    new THREE.Vector3(0.40, 0.22, 0),
  ]);
  const ceramicHandleMat = new THREE.MeshStandardMaterial({
    color: 0xf2efe6,
    map: ceramicTex,
    roughness: 0.28,
    metalness: 0.04,
  });
  const mugHandle = new THREE.Mesh(
    new THREE.TubeGeometry(handleCurve, radialTube, 0.045, compactMode ? 10 : 14, false),
    ceramicHandleMat,
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
  const chawanBodyMat = new THREE.MeshStandardMaterial({
    color: 0x3b483d,
    map: ceramicTex,
    roughness: 0.34,
    metalness: 0.06,
  });
  const chawanBody = new THREE.Mesh(
    new THREE.LatheGeometry(chawanPts, radialXl),
    chawanBodyMat,
  );
  chawanBody.castShadow = true;
  chawanBody.receiveShadow = true;
  chawanGroup.add(chawanBody);

  const chawanRimMat = new THREE.MeshStandardMaterial({
    color: 0xb6956a,
    roughness: 0.55,
    metalness: 0.12,
  });
  const chawanRim = new THREE.Mesh(
    new THREE.TorusGeometry(0.505, 0.025, compactMode ? 10 : 14, radialXl),
    chawanRimMat,
  );
  chawanRim.rotation.x = Math.PI / 2;
  chawanRim.position.y = 0.595;
  chawanGroup.add(chawanRim);

  // Golden Kintsugi Repair Seam (for kintsugi-matcha)
  const kintsugiCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(-0.06, 0.57, 0.52),
    new THREE.Vector3(0.03, 0.42, 0.50),
    new THREE.Vector3(-0.04, 0.27, 0.45),
    new THREE.Vector3(0.04, 0.11, 0.32),
  ]);
  const kintsugiSeam = new THREE.Mesh(
    new THREE.TubeGeometry(kintsugiCurve, compactMode ? 14 : 20, 0.013, 6, false),
    new THREE.MeshStandardMaterial({
      color: 0xe6be53,
      metalness: 0.9,
      roughness: 0.2,
    }),
  );
  kintsugiSeam.visible = false;
  chawanGroup.add(kintsugiSeam);

  chawanGroup.visible = false;
  root.add(chawanGroup);

  // === Style C: Heatproof Glass Cup (for Latte / Thai Tea / Butterfly Pea / Chamomile) ===
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
  const liteShader = isSoftwareGl || compactMode;
  const glassMat = liteShader
    ? new THREE.MeshStandardMaterial({
        color: 0xeaf2ef,
        metalness: 0.05,
        roughness: 0.14,
        transparent: true,
        opacity: 0.36,
        depthWrite: false,
      })
    : new THREE.MeshPhysicalMaterial({
        color: 0xffffff,
        metalness: 0,
        roughness: 0.08,
        transmission: 0.78,
        transparent: true,
        opacity: 0.92,
        ior: 1.5,
        thickness: 0.25,
        clearcoat: 1.0,
        depthWrite: false,
      });
  const glassMesh = new THREE.Mesh(
    new THREE.LatheGeometry(glassPts, radialLg),
    glassMat,
  );
  glassMesh.renderOrder = 6;
  glassGroup.add(glassMesh);

  const glassHandle = new THREE.Mesh(
    new THREE.TubeGeometry(handleCurve, radialTube, 0.036, compactMode ? 8 : 12, false),
    glassMat,
  );
  glassHandle.renderOrder = 6;
  glassGroup.add(glassHandle);
  glassGroup.visible = false;
  root.add(glassGroup);

  // === Dynamic Liquid Volume ===
  const liquidGroup = new THREE.Group();
  liquidGroup.position.y = 0.11;

  const liquidMaterial: THREE.MeshStandardMaterial = liteShader
    ? new THREE.MeshStandardMaterial({
        color: 0xe8e6df,
        roughness: 0.14,
        metalness: 0.04,
        transparent: true,
        opacity: 0.92,
      })
    : new THREE.MeshPhysicalMaterial({
        color: 0xe8e6df,
        roughness: 0.12,
        metalness: 0.02,
        clearcoat: 0.9,
        clearcoatRoughness: 0.08,
        transparent: true,
        opacity: 0.92,
      });

  const liquidGeo = new THREE.CylinderGeometry(0.415, 0.285, 0.56, radialMd);
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
  const leafCount = compactMode ? 10 : 14;
  for (let i = 0; i < leafCount; i++) {
    const m = new THREE.Mesh(leafGeo, leafMaterial);
    const angle = (i / leafCount) * Math.PI * 2;
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

  // === Toppings: Ice Cubes (shared geometry) ===
  const iceGroup = new THREE.Group();
  iceGroup.position.y = 0.56;
  const iceMat = liteShader
    ? new THREE.MeshStandardMaterial({
        color: 0xe6f4fa,
        roughness: 0.16,
        metalness: 0.05,
        transparent: true,
        opacity: 0.65,
      })
    : new THREE.MeshPhysicalMaterial({
        color: 0xe6f4fa,
        roughness: 0.12,
        metalness: 0,
        transparent: true,
        opacity: 0.65,
        clearcoat: 1,
        ior: 1.31,
      });
  const iceGeo = new THREE.BoxGeometry(0.16, 0.15, 0.16);
  const iceCubes: THREE.Mesh[] = [];
  const icePositions: [number, number, number, number][] = [
    [-0.14, 0.02, -0.06, 0.3],
    [0.12, 0.04, -0.09, -0.5],
    [0.02, 0.01, 0.14, 0.8],
  ];
  for (const [ix, iy, iz, rot] of icePositions) {
    const cube = new THREE.Mesh(iceGeo, iceMat);
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
    new THREE.TubeGeometry(honeyCurve, compactMode ? 18 : 28, 0.018, 8, false),
    liteShader
      ? new THREE.MeshStandardMaterial({
          color: 0xe29d23,
          roughness: 0.2,
          transparent: true,
          opacity: 0.85,
        })
      : new THREE.MeshPhysicalMaterial({
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

  // === Toppings: Strawberry Puree Layer & Berry Garnish ===
  const strawberryGroup = new THREE.Group();
  const berryLayerMat = liteShader
    ? new THREE.MeshStandardMaterial({
        color: 0xd95670,
        roughness: 0.24,
        transparent: true,
        opacity: 0.92,
      })
    : new THREE.MeshPhysicalMaterial({
        color: 0xd95670,
        roughness: 0.22,
        clearcoat: 0.65,
        transparent: true,
        opacity: 0.92,
      });
  const berryBase = new THREE.Mesh(
    new THREE.CylinderGeometry(0.31, 0.275, 0.14, compactMode ? 22 : 32),
    berryLayerMat,
  );
  berryBase.position.y = 0.185;
  berryBase.renderOrder = 2;
  strawberryGroup.add(berryBase);

  const berryBody = new THREE.Mesh(
    new THREE.ConeGeometry(0.075, 0.14, compactMode ? 12 : 16),
    new THREE.MeshStandardMaterial({color: 0xd1364f, roughness: 0.45}),
  );
  berryBody.rotation.x = Math.PI;
  berryBody.position.set(0.34, 0.76, 0.15);
  berryBody.rotation.z = -0.35;
  strawberryGroup.add(berryBody);

  const berryLeaf = new THREE.Mesh(
    new THREE.CylinderGeometry(0.055, 0.02, 0.02, 6),
    new THREE.MeshStandardMaterial({color: 0x458038, roughness: 0.6}),
  );
  berryLeaf.position.set(0.36, 0.82, 0.15);
  berryLeaf.rotation.z = -0.35;
  strawberryGroup.add(berryLeaf);
  strawberryGroup.visible = false;
  root.add(strawberryGroup);

  // === Toppings: Brown Sugar Caramel Layer & Tapioca/Sugar Pearls ===
  const brownSugarGroup = new THREE.Group();
  const caramelLayer = new THREE.Mesh(
    new THREE.CylinderGeometry(0.31, 0.275, 0.13, compactMode ? 22 : 32),
    liteShader
      ? new THREE.MeshStandardMaterial({
          color: 0x7a4218,
          roughness: 0.2,
          transparent: true,
          opacity: 0.92,
        })
      : new THREE.MeshPhysicalMaterial({
          color: 0x7a4218,
          roughness: 0.18,
          clearcoat: 0.85,
          transparent: true,
          opacity: 0.92,
        }),
  );
  caramelLayer.position.y = 0.18;
  caramelLayer.renderOrder = 2;
  brownSugarGroup.add(caramelLayer);

  const pearlMat = liteShader
    ? new THREE.MeshStandardMaterial({
        color: 0x3b200d,
        roughness: 0.18,
      })
    : new THREE.MeshPhysicalMaterial({
        color: 0x3b200d,
        roughness: 0.15,
        clearcoat: 0.9,
      });
  const pearlGeo = new THREE.SphereGeometry(0.038, 12, 12);
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2;
    const pearl = new THREE.Mesh(pearlGeo, pearlMat);
    pearl.position.set(
      Math.cos(a) * 0.17,
      0.15 + (i % 2) * 0.03,
      Math.sin(a) * 0.17,
    );
    pearl.renderOrder = 2;
    brownSugarGroup.add(pearl);
  }
  brownSugarGroup.visible = false;
  root.add(brownSugarGroup);

  // === Toppings: Cinnamon Stick & Pumpkin Spice Garnish ===
  const cinnamonGroup = new THREE.Group();
  const cinnamonBarkMat = new THREE.MeshStandardMaterial({
    color: 0x7b421f,
    roughness: 0.82,
    metalness: 0.02,
  });
  const stick = new THREE.Mesh(
    new THREE.CylinderGeometry(0.034, 0.038, 0.62, 12),
    cinnamonBarkMat,
  );
  stick.position.set(0.24, 0.64, 0.06);
  stick.rotation.set(0.2, 0.15, -1.08);
  stick.castShadow = true;
  cinnamonGroup.add(stick);

  const spiceDotGeo = new THREE.SphereGeometry(0.014, 8, 8);
  const spiceDotMat = new THREE.MeshStandardMaterial({
    color: 0x994a1c,
    roughness: 0.9,
  });
  for (let i = 0; i < 7; i++) {
    const a = (i / 7) * Math.PI * 2;
    const dot = new THREE.Mesh(spiceDotGeo, spiceDotMat);
    dot.scale.set(1.2, 0.35, 1.2);
    dot.position.set(Math.cos(a) * 0.13, 0.675, Math.sin(a) * 0.13);
    cinnamonGroup.add(dot);
  }
  cinnamonGroup.visible = false;
  root.add(cinnamonGroup);

  // === Toppings: Creamy Milk Foam Cap ===
  const milkFoamGroup = new THREE.Group();
  milkFoamGroup.position.y = 0.67;
  const foamMat = new THREE.MeshStandardMaterial({
    color: 0xfbf7ee,
    roughness: 0.72,
    metalness: 0,
  });
  const foamCap = new THREE.Mesh(
    new THREE.CylinderGeometry(0.38, 0.405, 0.055, 36),
    foamMat,
  );
  foamCap.renderOrder = 5;
  milkFoamGroup.add(foamCap);

  const foamCrown = new THREE.Mesh(
    new THREE.SphereGeometry(0.38, 28, 16, 0, Math.PI * 2, 0, Math.PI * 0.32),
    foamMat,
  );
  foamCrown.scale.y = 0.28;
  foamCrown.position.y = -0.04;
  foamCrown.renderOrder = 5;
  milkFoamGroup.add(foamCrown);

  // Delicate green matcha art leaf on foam
  const artDisc = new THREE.Mesh(
    new THREE.CircleGeometry(0.12, 16),
    new THREE.MeshStandardMaterial({color: 0x629b45, roughness: 0.78}),
  );
  artDisc.rotation.x = -Math.PI / 2;
  artDisc.position.y = 0.068;
  artDisc.renderOrder = 5;
  milkFoamGroup.add(artDisc);

  milkFoamGroup.visible = false;
  root.add(milkFoamGroup);

  // === Toppings: Fresh Mint Sprig (shared leaf geometry) ===
  const mintGroup = new THREE.Group();
  mintGroup.position.set(0.08, 0.68, 0.12);
  const mintMat = new THREE.MeshStandardMaterial({
    color: 0x438a4b,
    roughness: 0.55,
  });
  const mintLeafGeo = new THREE.SphereGeometry(0.055, compactMode ? 8 : 10, compactMode ? 8 : 10);
  const leafAngles = [-0.6, 0.1, 0.8];
  leafAngles.forEach((a, idx) => {
    const leaf = new THREE.Mesh(mintLeafGeo, mintMat);
    leaf.scale.set(1.4, 0.22, 0.78);
    leaf.position.set(
      Math.cos(a) * 0.06,
      0.015 + idx * 0.008,
      Math.sin(a) * 0.06,
    );
    leaf.rotation.set(0.2, -a, 0.15);
    mintGroup.add(leaf);
  });
  mintGroup.visible = false;
  root.add(mintGroup);

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
    ceramicBodyMat,
    ceramicHandleMat,
    saucerMesh,
    chawanGroup,
    chawanBodyMat,
    chawanRimMat,
    kintsugiSeam,
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
    strawberryGroup,
    brownSugarGroup,
    cinnamonGroup,
    milkFoamGroup,
    mintGroup,
    clickProxy,
  };
}

export function createKettleGroup(
  walnutTex: THREE.CanvasTexture,
  shadowTex: THREE.CanvasTexture,
  compactMode = false,
): KettleHandles {
  const root = new THREE.Group();
  root.position.set(1.12, TRAY_SURFACE_Y, -0.15);

  root.add(makeContactShadow(1.45, shadowTex, 0.5));

  const stand = new THREE.Mesh(
    new THREE.CylinderGeometry(0.46, 0.50, 0.06, compactMode ? 20 : 32),
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
    new THREE.LatheGeometry(kettlePts, compactMode ? 22 : 36),
    castIronMat,
  );
  potBody.castShadow = true;
  potBody.receiveShadow = true;
  bodyGroup.add(potBody);

  const lid = new THREE.Mesh(
    new THREE.CylinderGeometry(0.23, 0.25, 0.04, compactMode ? 18 : 28),
    brassMat,
  );
  lid.position.y = 0.59;
  bodyGroup.add(lid);

  const knob = new THREE.Mesh(
    new THREE.SphereGeometry(0.055, compactMode ? 10 : 16, compactMode ? 10 : 16),
    brassMat,
  );
  knob.position.y = 0.65;
  bodyGroup.add(knob);

  const spoutCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(-0.36, 0.22, 0),
    new THREE.Vector3(-0.56, 0.34, 0),
    new THREE.Vector3(-0.66, 0.58, 0),
    new THREE.Vector3(-0.75, 0.64, 0),
  ]);
  const spout = new THREE.Mesh(
    new THREE.TubeGeometry(spoutCurve, compactMode ? 16 : 24, 0.036, compactMode ? 8 : 12, false),
    castIronMat,
  );
  spout.castShadow = true;
  bodyGroup.add(spout);

  const handleCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(0.38, 0.42, 0),
    new THREE.Vector3(0.32, 0.84, 0),
    new THREE.Vector3(0, 0.94, 0),
    new THREE.Vector3(-0.30, 0.80, 0),
    new THREE.Vector3(-0.34, 0.44, 0),
  ]);
  const handle = new THREE.Mesh(
    new THREE.TubeGeometry(handleCurve, compactMode ? 18 : 28, 0.026, compactMode ? 7 : 10, false),
    brassMat,
  );
  handle.castShadow = true;
  bodyGroup.add(handle);

  const streamCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(-0.76, 0.62, 0),
    new THREE.Vector3(-0.92, 0.40, 0),
    new THREE.Vector3(-1.02, -0.25, 0),
  ]);
  const streamMesh = new THREE.Mesh(
    new THREE.TubeGeometry(streamCurve, compactMode ? 14 : 20, 0.024, compactMode ? 7 : 10, false),
    compactMode
      ? new THREE.MeshStandardMaterial({
          color: 0xe6f4fa,
          roughness: 0.12,
          transparent: true,
          opacity: 0.78,
        })
      : new THREE.MeshPhysicalMaterial({
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
    new THREE.CylinderGeometry(0.55, 0.55, 1.0, 12),
    new THREE.MeshBasicMaterial({visible: false}),
  );
  clickProxy.position.y = 0.5;
  clickProxy.userData = {interactId: 'kettle'};
  root.add(clickProxy);

  return {root, bodyGroup, streamMesh, clickProxy};
}

export function createChasenGroup(
  ceramicTex: THREE.CanvasTexture,
  walnutTex: THREE.CanvasTexture,
  shadowTex: THREE.CanvasTexture,
  compactMode = false,
): ChasenHandles {
  const root = new THREE.Group();

  // 1. Chasen + Ceramic Stand (front-right of tray)
  const whiskStandRoot = new THREE.Group();
  whiskStandRoot.position.set(1.18, TRAY_SURFACE_Y, 0.72);
  whiskStandRoot.add(makeContactShadow(0.65, shadowTex, 0.45));

  const holderPts = [
    new THREE.Vector2(0, 0),
    new THREE.Vector2(0.14, 0),
    new THREE.Vector2(0.15, 0.14),
    new THREE.Vector2(0.09, 0.24),
    new THREE.Vector2(0.12, 0.30),
    new THREE.Vector2(0, 0.30),
  ];
  const holder = new THREE.Mesh(
    new THREE.LatheGeometry(holderPts, compactMode ? 16 : 24),
    new THREE.MeshStandardMaterial({
      color: 0xdfe5da,
      map: ceramicTex,
      roughness: 0.32,
      metalness: 0.03,
    }),
  );
  holder.castShadow = true;
  whiskStandRoot.add(holder);

  const whiskGroup = new THREE.Group();
  whiskGroup.position.y = 0.16;
  const bambooMat = new THREE.MeshStandardMaterial({
    color: 0xd5bc8a,
    roughness: 0.72,
    metalness: 0,
  });

  const handle = new THREE.Mesh(
    new THREE.CylinderGeometry(0.055, 0.05, 0.22, compactMode ? 12 : 16),
    bambooMat,
  );
  handle.position.y = 0.34;
  whiskGroup.add(handle);

  const collar = new THREE.Mesh(
    new THREE.TorusGeometry(0.06, 0.012, 6, compactMode ? 14 : 20),
    new THREE.MeshStandardMaterial({color: 0x2b2520, roughness: 0.8}),
  );
  collar.rotation.x = Math.PI / 2;
  collar.position.y = 0.24;
  whiskGroup.add(collar);

  const tines = new THREE.Mesh(
    new THREE.CylinderGeometry(0.06, 0.135, 0.26, compactMode ? 14 : 20, 1, true),
    new THREE.MeshStandardMaterial({
      color: 0xdcc596,
      roughness: 0.76,
      side: THREE.DoubleSide,
    }),
  );
  tines.position.y = 0.12;
  whiskGroup.add(tines);

  whiskStandRoot.add(whiskGroup);
  root.add(whiskStandRoot);

  // 2. Lacquered Natsume Matcha Powder Caddy (back-left of tray)
  const caddyGroup = new THREE.Group();
  caddyGroup.position.set(-1.26, TRAY_SURFACE_Y, -0.45);
  caddyGroup.add(makeContactShadow(0.75, shadowTex, 0.45));

  const lacquerMat = compactMode
    ? new THREE.MeshStandardMaterial({
        color: 0x231d19,
        roughness: 0.22,
        metalness: 0.08,
      })
    : new THREE.MeshPhysicalMaterial({
        color: 0x231d19,
        roughness: 0.2,
        metalness: 0.08,
        clearcoat: 0.9,
      });
  const caddyPts = [
    new THREE.Vector2(0, 0),
    new THREE.Vector2(0.16, 0),
    new THREE.Vector2(0.24, 0.18),
    new THREE.Vector2(0.23, 0.36),
    new THREE.Vector2(0.19, 0.38),
    new THREE.Vector2(0, 0.38),
  ];
  const caddyBody = new THREE.Mesh(
    new THREE.LatheGeometry(caddyPts, compactMode ? 20 : 32),
    lacquerMat,
  );
  caddyBody.castShadow = true;
  caddyGroup.add(caddyBody);

  const goldBand = new THREE.Mesh(
    new THREE.TorusGeometry(0.232, 0.008, 6, compactMode ? 20 : 32),
    new THREE.MeshStandardMaterial({
      color: 0xd4a948,
      metalness: 0.85,
      roughness: 0.22,
    }),
  );
  goldBand.rotation.x = Math.PI / 2;
  goldBand.position.y = 0.27;
  caddyGroup.add(goldBand);

  root.add(caddyGroup);

  // 3. Curved Bamboo Chashaku Scoop + Resting Tray (front-left)
  const chashakuGroup = new THREE.Group();
  chashakuGroup.position.set(-1.18, TRAY_SURFACE_Y, 0.62);

  const rest = new THREE.Mesh(
    new THREE.BoxGeometry(0.32, 0.035, 0.12),
    new THREE.MeshStandardMaterial({map: walnutTex, roughness: 0.7}),
  );
  rest.position.y = 0.018;
  chashakuGroup.add(rest);

  const scoopCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(-0.32, 0.055, 0),
    new THREE.Vector3(0.05, 0.065, 0),
    new THREE.Vector3(0.26, 0.075, 0),
    new THREE.Vector3(0.33, 0.04, 0),
  ]);
  const scoopStick = new THREE.Mesh(
    new THREE.TubeGeometry(scoopCurve, compactMode ? 12 : 20, 0.016, 6, false),
    bambooMat,
  );
  scoopStick.scale.set(1, 0.45, 1.45);
  scoopStick.rotation.y = 0.35;
  chashakuGroup.add(scoopStick);

  const powderPinch = new THREE.Mesh(
    new THREE.SphereGeometry(0.032, 8, 8),
    new THREE.MeshStandardMaterial({color: 0x5c9642, roughness: 0.9}),
  );
  powderPinch.scale.set(1.2, 0.55, 0.9);
  powderPinch.position.set(0.26, 0.04, -0.09);
  chashakuGroup.add(powderPinch);

  root.add(chashakuGroup);

  return {root, whiskGroup, caddyGroup, chashakuGroup};
}

export function createEquipmentRig(
  ceramicTex: THREE.CanvasTexture,
  walnutTex: THREE.CanvasTexture,
  shadowTex: THREE.CanvasTexture,
  isSoftwareGl: boolean,
  compactMode = false,
): EquipmentRigHandles {
  const root = new THREE.Group();
  const segMd = compactMode ? 20 : 32;
  const segSm = compactMode ? 16 : 24;

  const steelMat = new THREE.MeshStandardMaterial({
    color: 0xd3d8dc,
    metalness: 0.88,
    roughness: 0.24,
  });
  const brassMat = new THREE.MeshStandardMaterial({
    color: 0xc99c4c,
    metalness: 0.85,
    roughness: 0.24,
  });
  const walnutMat = new THREE.MeshStandardMaterial({
    map: walnutTex,
    roughness: 0.68,
    metalness: 0.02,
  });
  const liteShader = isSoftwareGl || compactMode;
  const glassMat = liteShader
    ? new THREE.MeshStandardMaterial({
        color: 0xeaf2ef,
        metalness: 0.05,
        roughness: 0.14,
        transparent: true,
        opacity: 0.36,
        depthWrite: false,
      })
    : new THREE.MeshPhysicalMaterial({
        color: 0xffffff,
        metalness: 0,
        roughness: 0.08,
        transmission: 0.76,
        transparent: true,
        opacity: 0.92,
        ior: 1.5,
        clearcoat: 1,
        depthWrite: false,
      });

  // =========================================================
  // 1. Milk Frother Pitcher + Frother Wand Set (milk-frother)
  // =========================================================
  const frotherSet = new THREE.Group();

  // Stainless Steel Milk Pitcher at back-left
  const pitcher = new THREE.Group();
  pitcher.position.set(-1.24, TRAY_SURFACE_Y, -0.45);
  pitcher.add(makeContactShadow(0.85, shadowTex, 0.45));

  const pitcherPts = [
    new THREE.Vector2(0, 0),
    new THREE.Vector2(0.24, 0),
    new THREE.Vector2(0.25, 0.28),
    new THREE.Vector2(0.21, 0.54),
    new THREE.Vector2(0.24, 0.58),
    new THREE.Vector2(0.20, 0.58),
    new THREE.Vector2(0, 0.04),
  ];
  const pitcherBody = new THREE.Mesh(
    new THREE.LatheGeometry(pitcherPts, segMd),
    steelMat,
  );
  pitcherBody.castShadow = true;
  pitcher.add(pitcherBody);

  const pitcherHandleCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(0.21, 0.48, 0),
    new THREE.Vector3(0.36, 0.44, 0),
    new THREE.Vector3(0.35, 0.18, 0),
    new THREE.Vector3(0.24, 0.12, 0),
  ]);
  const pitcherHandle = new THREE.Mesh(
    new THREE.TubeGeometry(pitcherHandleCurve, compactMode ? 12 : 18, 0.022, 8, false),
    steelMat,
  );
  pitcher.add(pitcherHandle);

  const milkInside = new THREE.Mesh(
    new THREE.CylinderGeometry(0.19, 0.19, 0.04, segSm),
    new THREE.MeshStandardMaterial({color: 0xf7f3ea, roughness: 0.3}),
  );
  milkInside.position.y = 0.44;
  pitcher.add(milkInside);
  frotherSet.add(pitcher);

  // Handheld Milk Frother on Walnut Stand at front-right
  const frotherStand = new THREE.Group();
  frotherStand.position.set(1.22, TRAY_SURFACE_Y, 0.72);
  frotherStand.add(makeContactShadow(0.55, shadowTex, 0.42));

  const basePad = new THREE.Mesh(
    new THREE.CylinderGeometry(0.14, 0.16, 0.05, segSm),
    walnutMat,
  );
  basePad.position.y = 0.025;
  frotherStand.add(basePad);

  const frotherWand = new THREE.Group();
  frotherWand.position.y = 0.05;
  const wandHandle = new THREE.Mesh(
    new THREE.CylinderGeometry(0.045, 0.038, 0.32, compactMode ? 12 : 16),
    walnutMat,
  );
  wandHandle.position.y = 0.44;
  wandHandle.castShadow = true;
  frotherWand.add(wandHandle);

  const wandShaft = new THREE.Mesh(
    new THREE.CylinderGeometry(0.01, 0.01, 0.28, 8),
    steelMat,
  );
  wandShaft.position.y = 0.16;
  frotherWand.add(wandShaft);

  const wandCoil = new THREE.Mesh(
    new THREE.TorusGeometry(0.05, 0.008, 6, compactMode ? 14 : 20),
    steelMat,
  );
  wandCoil.rotation.x = Math.PI / 2;
  wandCoil.position.y = 0.025;
  frotherWand.add(wandCoil);

  frotherStand.add(frotherWand);
  frotherSet.add(frotherStand);
  frotherSet.visible = false;
  root.add(frotherSet);

  // =========================================================
  // 2. Yixing Clay Teapot & Bamboo Strainer (clay-teapot)
  // =========================================================
  const clayTeapotSet = new THREE.Group();
  const clayMat = new THREE.MeshStandardMaterial({
    color: 0x8f4c36,
    map: ceramicTex,
    roughness: 0.68,
    metalness: 0.04,
  });

  const teapot = new THREE.Group();
  teapot.position.set(-1.24, TRAY_SURFACE_Y, -0.38);
  teapot.add(makeContactShadow(0.95, shadowTex, 0.48));

  const potPts = [
    new THREE.Vector2(0, 0),
    new THREE.Vector2(0.24, 0),
    new THREE.Vector2(0.36, 0.16),
    new THREE.Vector2(0.34, 0.34),
    new THREE.Vector2(0.20, 0.44),
    new THREE.Vector2(0, 0.44),
  ];
  const clayBody = new THREE.Mesh(new THREE.LatheGeometry(potPts, segMd), clayMat);
  clayBody.castShadow = true;
  teapot.add(clayBody);

  const clayLid = new THREE.Mesh(
    new THREE.SphereGeometry(0.18, segSm, compactMode ? 8 : 12, 0, Math.PI * 2, 0, Math.PI * 0.45),
    clayMat,
  );
  clayLid.position.y = 0.40;
  teapot.add(clayLid);

  const clayFinial = new THREE.Mesh(
    new THREE.SphereGeometry(0.042, 12, 12),
    clayMat,
  );
  clayFinial.position.y = 0.59;
  teapot.add(clayFinial);

  const claySpoutCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(0.31, 0.18, 0),
    new THREE.Vector3(0.46, 0.28, 0),
    new THREE.Vector3(0.52, 0.40, 0),
  ]);
  const claySpout = new THREE.Mesh(
    new THREE.TubeGeometry(claySpoutCurve, 16, 0.032, 10, false),
    clayMat,
  );
  teapot.add(claySpout);

  const clayHandleCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(-0.28, 0.36, 0),
    new THREE.Vector3(-0.48, 0.34, 0),
    new THREE.Vector3(-0.46, 0.14, 0),
    new THREE.Vector3(-0.26, 0.10, 0),
  ]);
  const clayHandle = new THREE.Mesh(
    new THREE.TubeGeometry(clayHandleCurve, 16, 0.028, 10, false),
    clayMat,
  );
  teapot.add(clayHandle);
  teapot.rotation.y = -0.35;
  clayTeapotSet.add(teapot);

  // Bamboo Strainer resting on left-front
  const strainer = new THREE.Group();
  strainer.position.set(-1.14, TRAY_SURFACE_Y + 0.04, 0.62);
  const bambooMat = new THREE.MeshStandardMaterial({
    color: 0xd4b67d,
    roughness: 0.74,
  });
  const strainerRim = new THREE.Mesh(
    new THREE.TorusGeometry(0.19, 0.02, 10, 28),
    bambooMat,
  );
  strainerRim.rotation.x = Math.PI / 2;
  strainer.add(strainerRim);

  const strainerMesh = new THREE.Mesh(
    new THREE.SphereGeometry(0.18, 18, 10, 0, Math.PI * 2, Math.PI * 0.5, Math.PI * 0.5),
    new THREE.MeshStandardMaterial({
      color: 0xc2a26b,
      roughness: 0.85,
      wireframe: true,
    }),
  );
  strainer.add(strainerMesh);

  const strainerStem = new THREE.Mesh(
    new THREE.CylinderGeometry(0.018, 0.022, 0.34, 10),
    bambooMat,
  );
  strainerStem.rotation.z = Math.PI / 2;
  strainerStem.position.set(-0.34, 0, 0);
  strainer.add(strainerStem);
  clayTeapotSet.add(strainer);

  clayTeapotSet.visible = false;
  root.add(clayTeapotSet);

  // =========================================================
  // 3. Traditional Cloth Tea Filter & Brass Pitcher (strainer-kettle)
  // =========================================================
  const strainerSet = new THREE.Group();
  const clothHolder = new THREE.Group();
  clothHolder.position.set(-1.20, TRAY_SURFACE_Y, -0.36);
  clothHolder.add(makeContactShadow(0.85, shadowTex, 0.45));

  const tallMug = new THREE.Mesh(
    new THREE.CylinderGeometry(0.24, 0.21, 0.62, 28),
    steelMat,
  );
  tallMug.position.y = 0.31;
  tallMug.castShadow = true;
  clothHolder.add(tallMug);

  const clothRing = new THREE.Mesh(
    new THREE.TorusGeometry(0.23, 0.016, 10, 28),
    brassMat,
  );
  clothRing.rotation.x = Math.PI / 2;
  clothRing.position.y = 0.63;
  clothHolder.add(clothRing);

  const clothBag = new THREE.Mesh(
    new THREE.ConeGeometry(0.21, 0.38, 22, 1, true),
    new THREE.MeshStandardMaterial({
      color: 0xd9b38c,
      roughness: 0.92,
      side: THREE.DoubleSide,
    }),
  );
  clothBag.rotation.x = Math.PI;
  clothBag.position.y = 0.44;
  clothHolder.add(clothBag);

  const clothHandle = new THREE.Mesh(
    new THREE.CylinderGeometry(0.014, 0.014, 0.32, 8),
    steelMat,
  );
  clothHandle.rotation.z = Math.PI / 2;
  clothHandle.position.set(0.38, 0.63, 0);
  clothHolder.add(clothHandle);

  strainerSet.add(clothHolder);
  strainerSet.visible = false;
  root.add(strainerSet);

  // =========================================================
  // 4. Glass Herbal Infuser & Honey Dipper (herbal-infuser)
  // =========================================================
  const herbalInfuserSet = new THREE.Group();
  const herbalPot = new THREE.Group();
  herbalPot.position.set(-1.22, TRAY_SURFACE_Y, -0.38);
  herbalPot.add(makeContactShadow(0.9, shadowTex, 0.45));

  const glassBowl = new THREE.Mesh(
    new THREE.SphereGeometry(0.32, 28, 20),
    glassMat,
  );
  glassBowl.scale.set(1, 0.85, 1);
  glassBowl.position.y = 0.28;
  glassBowl.renderOrder = 6;
  herbalPot.add(glassBowl);

  const herbalInfuseTea = new THREE.Mesh(
    new THREE.SphereGeometry(0.26, compactMode ? 18 : 24, compactMode ? 12 : 16, 0, Math.PI * 2, Math.PI * 0.25, Math.PI * 0.75),
    liteShader
      ? new THREE.MeshStandardMaterial({
          color: 0xe6c86e,
          roughness: 0.16,
          transparent: true,
          opacity: 0.84,
        })
      : new THREE.MeshPhysicalMaterial({
          color: 0xe6c86e,
          roughness: 0.12,
          transparent: true,
          opacity: 0.84,
        }),
  );
  herbalInfuseTea.scale.set(1, 0.82, 1);
  herbalInfuseTea.position.y = 0.26;
  herbalInfuseTea.renderOrder = 3;
  herbalPot.add(herbalInfuseTea);

  const bambooLid = new THREE.Mesh(
    new THREE.CylinderGeometry(0.18, 0.19, 0.05, 24),
    walnutMat,
  );
  bambooLid.position.y = 0.53;
  herbalPot.add(bambooLid);
  herbalInfuserSet.add(herbalPot);

  // Honey Dipper on front-left
  const dipper = new THREE.Group();
  dipper.position.set(-1.14, TRAY_SURFACE_Y + 0.04, 0.62);
  const dipperRod = new THREE.Mesh(
    new THREE.CylinderGeometry(0.015, 0.015, 0.44, 10),
    walnutMat,
  );
  dipperRod.rotation.z = Math.PI / 2;
  dipper.add(dipperRod);
  const dipperRingGeo = new THREE.TorusGeometry(0.036, 0.01, 6, compactMode ? 12 : 16);
  for (let i = 0; i < 4; i++) {
    const ring = new THREE.Mesh(dipperRingGeo, walnutMat);
    ring.rotation.y = Math.PI / 2;
    ring.position.x = 0.17 + i * 0.022;
    dipper.add(ring);
  }
  herbalInfuserSet.add(dipper);
  herbalInfuserSet.visible = false;
  root.add(herbalInfuserSet);

  // =========================================================
  // 5. Cold-Drip Dew Glass Tower (cold-drip)
  // =========================================================
  const coldDripSet = new THREE.Group();
  const tower = new THREE.Group();
  tower.position.set(-1.24, TRAY_SURFACE_Y, -0.35);
  tower.add(makeContactShadow(0.85, shadowTex, 0.45));

  const towerBase = new THREE.Mesh(
    new THREE.CylinderGeometry(0.28, 0.30, 0.05, 28),
    walnutMat,
  );
  towerBase.position.y = 0.025;
  tower.add(towerBase);

  const postLeft = new THREE.Mesh(
    new THREE.CylinderGeometry(0.022, 0.022, 0.96, 12),
    walnutMat,
  );
  postLeft.position.set(-0.22, 0.50, 0);
  const postRight = postLeft.clone();
  postRight.position.x = 0.22;
  tower.add(postLeft, postRight);

  const topChamber = new THREE.Mesh(
    new THREE.CylinderGeometry(0.16, 0.05, 0.32, 24),
    glassMat,
  );
  topChamber.position.y = 0.80;
  topChamber.renderOrder = 6;
  tower.add(topChamber);

  const bottomCarafe = new THREE.Mesh(
    new THREE.CylinderGeometry(0.12, 0.21, 0.36, 24),
    glassMat,
  );
  bottomCarafe.position.y = 0.24;
  bottomCarafe.renderOrder = 6;
  tower.add(bottomCarafe);

  const dripMatcha = new THREE.Mesh(
    new THREE.CylinderGeometry(0.14, 0.18, 0.18, compactMode ? 14 : 20),
    liteShader
      ? new THREE.MeshStandardMaterial({
          color: 0x5d9d47,
          roughness: 0.18,
          transparent: true,
          opacity: 0.88,
        })
      : new THREE.MeshPhysicalMaterial({
          color: 0x5d9d47,
          roughness: 0.14,
          transparent: true,
          opacity: 0.88,
        }),
  );
  dripMatcha.position.y = 0.15;
  dripMatcha.renderOrder = 3;
  tower.add(dripMatcha);

  const coldDripDrop = new THREE.Mesh(
    new THREE.SphereGeometry(0.022, 8, 8),
    liteShader
      ? new THREE.MeshStandardMaterial({
          color: 0x82c768,
          roughness: 0.12,
          transparent: true,
          opacity: 0.88,
        })
      : new THREE.MeshPhysicalMaterial({
          color: 0x82c768,
          roughness: 0.08,
          transparent: true,
          opacity: 0.88,
        }),
  );
  coldDripDrop.position.y = 0.55;
  tower.add(coldDripDrop);

  coldDripSet.add(tower);
  coldDripSet.visible = false;
  root.add(coldDripSet);

  return {
    root,
    frotherSet,
    frotherWand,
    clayTeapotSet,
    strainerSet,
    herbalInfuserSet,
    coldDripSet,
    coldDripDrop,
  };
}
