import React, {useEffect, useRef, useState} from 'react';
import * as THREE from 'three';
import {RoomEnvironment} from 'three/addons/environments/RoomEnvironment.js';
import {Coffee} from 'lucide-react';
import {getLiquidColor} from '../data/teas';
import {
  createCeramicSpeckleTexture,
  createContactShadowTexture,
  createSteamPuffTexture,
  createWoodGrainTexture,
  createWovenMatTexture,
} from '../three/proceduralTextures';
import {
  createChasenGroup,
  createEquipmentRig,
  createKettleGroup,
  createTeaTableEnvironment,
  createTeaVesselSystem,
} from '../three/teaModels';
import {
  createShopCharactersSystem,
  ShopCharactersHandles,
} from '../three/shopCharacters';
import {
  BrewStep,
  CustomerPhase,
  GameMode,
  GameSettings,
  PlayerMoveInput,
  TeaType,
  ToppingId,
} from '../types/tea';
import {probeDeviceOptimization} from '../utils/deviceOptimizer';

interface TeaScene3DProps {
  tea: TeaType;
  step: BrewStep;
  mode: GameMode;
  guestId: string;
  customerSequenceKey: number;
  waterLevel: number;
  steepSeconds: number;
  toppings: ToppingId[];
  isPouring: boolean;
  settings: GameSettings;
  playerMoveRef: React.MutableRefObject<PlayerMoveInput>;
  onProximityChange: (near: boolean) => void;
  onBrewAtTableClick: () => void;
  onCustomerEnteredDoor: () => void;
  onCustomerPhaseChange: (phase: CustomerPhase) => void;
  onKettleClick?: () => void;
  onVesselClick?: () => void;
}

interface SceneSyncState {
  tea: TeaType;
  step: BrewStep;
  mode: GameMode;
  guestId: string;
  waterLevel: number;
  steepSeconds: number;
  toppings: ToppingId[];
  isPouring: boolean;
  settings: GameSettings;
}

// Module-scope scratch variables to keep the render loop GC-free
const _targetLiquidColor = new THREE.Color();
const _targetLeafColor = new THREE.Color();
const _camGoalPos = new THREE.Vector3();
const _camGoalTarget = new THREE.Vector3();
const _camCurrentTarget = new THREE.Vector3(0.45, 0.25, 2.72);
const _pointerNdc = new THREE.Vector2();
const _TABLE_ANCHOR = new THREE.Vector3(-0.1, 0.72, 0.18);
const _tableProj = new THREE.Vector3();

function detectSoftwareWebGL(): boolean {
  try {
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl2') || canvas.getContext('webgl');
    if (!gl) return true;
    const ext = gl.getExtension('WEBGL_debug_renderer_info');
    const param = ext ? ext.UNMASKED_RENDERER_WEBGL : gl.RENDERER;
    const gpu = String(gl.getParameter(param) ?? '');
    gl.getExtension('WEBGL_lose_context')?.loseContext();
    return /SwiftShader|llvmpipe|softpipe|Software|Basic Render/i.test(gpu);
  } catch {
    return true;
  }
}

function resolvePixelRatio(
  settings: GameSettings,
  isSoftwareGl: boolean,
  liteGpuMode: boolean,
  isUltraLowRam: boolean,
  galaxyA10Boost: boolean,
  realmeNote50Boost: boolean,
  containerWidth: number,
  containerHeight: number,
  dynamicScale = 1,
): number {
  if (isSoftwareGl) return 1;
  const deviceDpr =
    typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1;
  const shortCss = Math.max(240, Math.min(containerWidth, containerHeight));

  let targetShortPx = 720;
  let minFloor = 0.75;
  let maxCap = 1.5;

  switch (settings.resolutionScale) {
    case 'hd':
      targetShortPx = 540;
      minFloor = galaxyA10Boost ? 0.6 : 0.65;
      maxCap = galaxyA10Boost ? 0.86 : isUltraLowRam ? 0.92 : 1.2;
      break;
    case 'hd-plus':
      targetShortPx = 720;
      minFloor = galaxyA10Boost ? 0.65 : 0.75;
      maxCap = galaxyA10Boost
        ? 0.94
        : realmeNote50Boost
          ? 1.12
          : isUltraLowRam
            ? 1.05
            : liteGpuMode
              ? 1.32
              : 1.5;
      break;
    case 'fhd':
      targetShortPx = 1080;
      minFloor = 0.9;
      maxCap = galaxyA10Boost ? 1.05 : isUltraLowRam ? 1.25 : 2.0;
      break;
    case 'fhd-plus':
    default:
      targetShortPx = 1280;
      minFloor = 1.0;
      maxCap = galaxyA10Boost
        ? 1.15
        : isUltraLowRam
          ? 1.35
          : Math.min(Math.max(deviceDpr, 1.5), 2.5);
      break;
  }

  const desiredRatio = Math.min(
    maxCap,
    Math.max(minFloor, targetShortPx / shortCss),
  );
  return Math.max(galaxyA10Boost ? 0.58 : 0.6, desiredRatio * dynamicScale);
}

export const TeaScene3D: React.FC<TeaScene3DProps> = React.memo(({
  tea,
  step,
  mode,
  guestId,
  customerSequenceKey,
  waterLevel,
  steepSeconds,
  toppings,
  isPouring,
  settings,
  playerMoveRef,
  onProximityChange,
  onBrewAtTableClick,
  onCustomerEnteredDoor,
  onCustomerPhaseChange,
  onKettleClick,
  onVesselClick,
}) => {
  const mountRef = useRef<HTMLDivElement | null>(null);
  const tableBtnRef = useRef<HTMLButtonElement | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const keyLightRef = useRef<THREE.DirectionalLight | null>(null);
  const charactersRef = useRef<ShopCharactersHandles | null>(null);
  const isSoftwareGlRef = useRef<boolean>(false);
  const shadowDirtyRef = useRef<boolean>(true);
  const dynamicScaleRef = useRef<number>(1);
  const [webglError, setWebglError] = useState(false);

  const deviceReport = probeDeviceOptimization(settings.optimizationProfile);
  const liteGpuMode = deviceReport.liteGpuActive;
  const isUltraLowRam = deviceReport.isUltraLowRam;
  const isMaliG71Hardware = deviceReport.isMaliG71OrExynos7884;
  const galaxyA10Boost = deviceReport.galaxyA10BoostActive;
  const realmeNote50Boost = deviceReport.realmeNote50BoostActive;

  const syncRef = useRef<SceneSyncState>({
    tea,
    step,
    mode,
    guestId,
    waterLevel,
    steepSeconds,
    toppings,
    isPouring,
    settings,
  });

  const callbacksRef = useRef({
    onKettleClick,
    onVesselClick,
    onProximityChange,
    onCustomerEnteredDoor,
    onCustomerPhaseChange,
  });

  useEffect(() => {
    syncRef.current = {
      tea,
      step,
      mode,
      guestId,
      waterLevel,
      steepSeconds,
      toppings,
      isPouring,
      settings,
    };
  }, [
    tea,
    step,
    mode,
    guestId,
    waterLevel,
    steepSeconds,
    toppings,
    isPouring,
    settings,
  ]);

  useEffect(() => {
    callbacksRef.current = {
      onKettleClick,
      onVesselClick,
      onProximityChange,
      onCustomerEnteredDoor,
      onCustomerPhaseChange,
    };
  }, [
    onKettleClick,
    onVesselClick,
    onProximityChange,
    onCustomerEnteredDoor,
    onCustomerPhaseChange,
  ]);

  // Spawn walking guest whenever guestId/customerSequenceKey updates in guest mode
  useEffect(() => {
    if (mode === 'guest' && charactersRef.current) {
      charactersRef.current.startCustomerWalkIn(guestId);
    }
  }, [customerSequenceKey, guestId, mode]);

  // Hot-swap active 3D player character rig without tearing down WebGL context
  useEffect(() => {
    charactersRef.current?.setPlayerCharacter(settings.playerCharacter);
  }, [settings.playerCharacter]);

  useEffect(() => {
    shadowDirtyRef.current = true;
  }, [tea.id, step, mode, guestId, toppings, isPouring, settings.shadowsEnabled]);

  useEffect(() => {
    const renderer = rendererRef.current;
    const keyLight = keyLightRef.current;
    const container = mountRef.current;
    const softwareGl = isSoftwareGlRef.current;
    if (!renderer || !container) return;

    dynamicScaleRef.current = 1;
    const w = Math.max(container.clientWidth, 280);
    const h = Math.max(container.clientHeight, 260);
    renderer.setPixelRatio(
      resolvePixelRatio(
        settings,
        softwareGl,
        liteGpuMode,
        isUltraLowRam,
        galaxyA10Boost,
        realmeNote50Boost,
        w,
        h,
        1,
      ),
    );
    renderer.setSize(w, h);
    const allowShadows =
      !softwareGl &&
      !isUltraLowRam &&
      !isMaliG71Hardware &&
      !galaxyA10Boost &&
      !realmeNote50Boost &&
      settings.shadowsEnabled;
    renderer.shadowMap.enabled = allowShadows;
    renderer.shadowMap.needsUpdate = true;
    shadowDirtyRef.current = true;
    if (keyLight) {
      keyLight.castShadow = allowShadows;
    }
  }, [
    settings.resolutionScale,
    settings.shadowsEnabled,
    settings.optimizationProfile,
    liteGpuMode,
    isUltraLowRam,
    isMaliG71Hardware,
    galaxyA10Boost,
    realmeNote50Boost,
  ]);

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const isSoftwareGl = detectSoftwareWebGL();
    isSoftwareGlRef.current = isSoftwareGl;
    const reducedMotion =
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const initSettings = syncRef.current.settings;
    dynamicScaleRef.current = 1;

    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({
        antialias:
          !isSoftwareGl &&
          !liteGpuMode &&
          !isUltraLowRam &&
          !galaxyA10Boost &&
          !realmeNote50Boost &&
          initSettings.antialiasEnabled,
        powerPreference:
          isUltraLowRam || galaxyA10Boost ? 'default' : 'high-performance',
        precision: 'highp',
      });
    } catch {
      setWebglError(true);
      return;
    }
    rendererRef.current = renderer;

    const initW = Math.max(container.clientWidth, 320);
    const initH = Math.max(container.clientHeight, 260);

    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.08;
    renderer.setPixelRatio(
      resolvePixelRatio(
        initSettings,
        isSoftwareGl,
        liteGpuMode,
        isUltraLowRam,
        galaxyA10Boost,
        realmeNote50Boost,
        initW,
        initH,
        1,
      ),
    );
    const allowInitShadows =
      !isSoftwareGl &&
      !isUltraLowRam &&
      !isMaliG71Hardware &&
      !galaxyA10Boost &&
      !realmeNote50Boost &&
      initSettings.shadowsEnabled;
    renderer.shadowMap.enabled = allowInitShadows;
    renderer.shadowMap.type = liteGpuMode
      ? THREE.PCFShadowMap
      : THREE.PCFSoftShadowMap;
    renderer.shadowMap.autoUpdate = !liteGpuMode;
    renderer.shadowMap.needsUpdate = true;

    renderer.setSize(initW, initH);
    renderer.domElement.style.display = 'block';
    renderer.domElement.style.width = '100%';
    renderer.domElement.style.height = '100%';
    renderer.domElement.style.touchAction = 'none';

    container.innerHTML = '';
    container.appendChild(renderer.domElement);

    const handleContextLost = (e: Event) => {
      e.preventDefault();
      setWebglError(true);
    };
    const handleContextRestored = () => {
      setWebglError(false);
    };
    renderer.domElement.addEventListener('webglcontextlost', handleContextLost);
    renderer.domElement.addEventListener(
      'webglcontextrestored',
      handleContextRestored,
    );

    const scene = new THREE.Scene();
    const horizonHex = 0xd8dfd5;
    scene.background = new THREE.Color(horizonHex);
    scene.fog = new THREE.FogExp2(horizonHex, 0.048);

    const pmremGenerator = new THREE.PMREMGenerator(renderer);
    const roomEnv = new RoomEnvironment();
    const envRenderTarget = pmremGenerator.fromScene(roomEnv, 0.04);
    const envTexture = envRenderTarget.texture;
    scene.environment = envTexture;
    scene.environmentIntensity = galaxyA10Boost
      ? 0.72
      : realmeNote50Boost
        ? 0.88
        : 1.0;
    roomEnv.dispose();
    pmremGenerator.dispose();

    const isShortLandscape = initH < 520;
    const camera = new THREE.PerspectiveCamera(
      isShortLandscape ? 50 : 46,
      initW / initH,
      0.08,
      60,
    );
    // Start in Third-Person View behind player spawn
    camera.position.set(0.45, 1.38, 4.48);
    _camCurrentTarget.set(0.45, 0.25, 2.72);
    camera.lookAt(_camCurrentTarget);

    // 3-Point Studio Lighting Rig + Cozy Paper Lantern Accent
    const hemiLight = new THREE.HemisphereLight(0xdfe8ec, 0x8b7358, 0.92);
    scene.add(hemiLight);

    const keyLight = new THREE.DirectionalLight(0xfff1dc, 1.6);
    keyLight.position.set(4.5, 6.2, 3.8);
    keyLight.castShadow = allowInitShadows;
    keyLightRef.current = keyLight;
    const shadowSize = liteGpuMode ? 512 : 1024;
    keyLight.shadow.mapSize.width = shadowSize;
    keyLight.shadow.mapSize.height = shadowSize;
    keyLight.shadow.camera.near = 0.5;
    keyLight.shadow.camera.far = 18;
    const d = 4.6;
    keyLight.shadow.camera.left = -d;
    keyLight.shadow.camera.right = d;
    keyLight.shadow.camera.top = d;
    keyLight.shadow.camera.bottom = -d;
    keyLight.shadow.bias = -0.0005;
    keyLight.shadow.normalBias = liteGpuMode ? 0.032 : 0.02;
    scene.add(keyLight);

    const rimLight = new THREE.DirectionalLight(0xd9ebd6, 0.65);
    rimLight.position.set(-4.0, 3.2, -3.5);
    scene.add(rimLight);

    if (!isUltraLowRam && !isMaliG71Hardware) {
      const lanternWarmLight = new THREE.PointLight(0xffcf82, 0.9, 6.5, 1.6);
      lanternWarmLight.position.set(-2.45, 2.0, -2.05);
      scene.add(lanternWarmLight);
    }

    const rawAniso = renderer.capabilities.getMaxAnisotropy();
    const maxAniso = liteGpuMode ? 1 : rawAniso;
    const compactAssets = liteGpuMode || isSoftwareGl;
    const ultraCompactAssets = isUltraLowRam || isMaliG71Hardware;

    const cedarTex = createWoodGrainTexture(
      '#A87B4F',
      '#6B4728',
      maxAniso,
      compactAssets,
      ultraCompactAssets,
    );
    const walnutTex = createWoodGrainTexture(
      '#69492F',
      '#3E2817',
      maxAniso,
      compactAssets,
      ultraCompactAssets,
    );
    const matTex = createWovenMatTexture(
      maxAniso,
      compactAssets,
      ultraCompactAssets,
    );
    const ceramicTex = createCeramicSpeckleTexture(
      '#EFECE3',
      '#9D9688',
      maxAniso,
      compactAssets,
      ultraCompactAssets,
    );
    const shadowTex = createContactShadowTexture(ultraCompactAssets);
    const steamTex = createSteamPuffTexture(ultraCompactAssets);

    const disableExtraGlassPass = isSoftwareGl || liteGpuMode || isUltraLowRam;
    const envGroup = createTeaTableEnvironment(
      cedarTex,
      walnutTex,
      matTex,
      ceramicTex,
      shadowTex,
      compactAssets,
      ultraCompactAssets,
    );
    envGroup.traverse((obj) => {
      obj.updateMatrix();
      obj.matrixAutoUpdate = false;
    });
    scene.add(envGroup);

    const shopCharacters = createShopCharactersSystem(
      walnutTex,
      ceramicTex,
      compactAssets,
      ultraCompactAssets,
    );
    shopCharacters.setPlayerCharacter(initSettings.playerCharacter);
    charactersRef.current = shopCharacters;
    scene.add(shopCharacters.root);

    if (syncRef.current.mode === 'guest') {
      shopCharacters.startCustomerWalkIn(syncRef.current.guestId);
    }

    const vessel = createTeaVesselSystem(
      ceramicTex,
      walnutTex,
      shadowTex,
      disableExtraGlassPass,
      compactAssets,
      ultraCompactAssets,
    );
    scene.add(vessel.root);

    const kettle = createKettleGroup(walnutTex, shadowTex, compactAssets);
    scene.add(kettle.root);

    const chasen = createChasenGroup(ceramicTex, walnutTex, shadowTex, compactAssets);
    scene.add(chasen.root);

    const equipmentRig = createEquipmentRig(
      ceramicTex,
      walnutTex,
      shadowTex,
      disableExtraGlassPass,
      compactAssets,
    );
    scene.add(equipmentRig.root);

    const steamCount = isUltraLowRam ? 0 : liteGpuMode ? 3 : 6;
    const steamSprites: {
      sprite: THREE.Sprite;
      phase: number;
      speed: number;
      driftX: number;
    }[] = [];
    for (let i = 0; i < steamCount; i++) {
      const mat = new THREE.SpriteMaterial({
        map: steamTex,
        transparent: true,
        opacity: 0,
        depthWrite: false,
      });
      const sprite = new THREE.Sprite(mat);
      sprite.position.set(-0.22, 0.9, 0.08);
      sprite.scale.set(0.32, 0.32, 1);
      sprite.frustumCulled = false;
      scene.add(sprite);
      steamSprites.push({
        sprite,
        phase: i / steamCount,
        speed: 0.24 + (i % 3) * 0.05,
        driftX: (i % 2 === 0 ? 1 : -1) * (0.04 + i * 0.015),
      });
    }

    if (!isSoftwareGl) {
      renderer.compile(scene, camera);
    }

    // Camera Drag + Raycasting for First-Person Vessel/Kettle Clicks
    let thirdPersonYaw = 0;
    let thirdPersonHeightOffset = 2.05;
    let firstPersonLookYaw = 0;
    let firstPersonLookPitch = 0;

    let activePointerId: number | null = null;
    let dragLastPos = {x: 0, y: 0};
    let pointerDownPos = {x: 0, y: 0};

    const raycaster = new THREE.Raycaster();
    const clickables = [kettle.clickProxy, vessel.clickProxy];

    const onPointerDown = (e: PointerEvent) => {
      if (activePointerId !== null) return;
      activePointerId = e.pointerId;
      pointerDownPos = {x: e.clientX, y: e.clientY};
      dragLastPos = {x: e.clientX, y: e.clientY};
    };

    const onPointerUp = (e: PointerEvent) => {
      if (activePointerId === e.pointerId) {
        activePointerId = null;
      }
      const moveDist = Math.hypot(
        e.clientX - pointerDownPos.x,
        e.clientY - pointerDownPos.y,
      );
      if (moveDist > 8) return;

      if (syncRef.current.step === 'EXPLORE_SHOP') return;

      const rect = renderer.domElement.getBoundingClientRect();
      _pointerNdc.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      _pointerNdc.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

      raycaster.setFromCamera(_pointerNdc, camera);
      const hits = raycaster.intersectObjects(clickables, false);
      if (hits.length > 0) {
        const id = hits[0].object.userData.interactId;
        if (id === 'kettle') {
          callbacksRef.current.onKettleClick?.();
        } else if (id === 'vessel') {
          callbacksRef.current.onVesselClick?.();
        }
      }
    };

    let lastHoverCheck = 0;
    const onPointerMove = (e: PointerEvent) => {
      if (activePointerId === e.pointerId) {
        const dx = e.clientX - dragLastPos.x;
        const dy = e.clientY - dragLastPos.y;
        dragLastPos = {x: e.clientX, y: e.clientY};

        if (syncRef.current.step === 'EXPLORE_SHOP') {
          thirdPersonYaw -= dx * 0.0065;
          thirdPersonHeightOffset = THREE.MathUtils.clamp(
            thirdPersonHeightOffset + dy * 0.0045,
            1.35,
            2.9,
          );
        } else {
          firstPersonLookYaw = THREE.MathUtils.clamp(
            firstPersonLookYaw - dx * 0.0032,
            -0.52,
            0.52,
          );
          firstPersonLookPitch = THREE.MathUtils.clamp(
            firstPersonLookPitch - dy * 0.0025,
            -0.25,
            0.25,
          );
        }
        return;
      }

      const now = performance.now();
      if (now - lastHoverCheck < 75) return;
      lastHoverCheck = now;

      const curStep = syncRef.current.step;
      if (curStep === 'EXPLORE_SHOP') {
        renderer.domElement.style.cursor = 'grab';
        return;
      }

      const rect = renderer.domElement.getBoundingClientRect();
      _pointerNdc.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      _pointerNdc.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

      raycaster.setFromCamera(_pointerNdc, camera);
      const hits = raycaster.intersectObjects(clickables, false);
      let canInteract = false;
      if (hits.length > 0) {
        const id = hits[0].object.userData.interactId;
        if (id === 'kettle' && curStep === 'POUR_WATER') canInteract = true;
        if (id === 'vessel' && curStep === 'STEEP_TEA') canInteract = true;
      }
      renderer.domElement.style.cursor = canInteract ? 'pointer' : 'grab';
    };

    renderer.domElement.addEventListener('pointerdown', onPointerDown);
    window.addEventListener('pointerup', onPointerUp);
    window.addEventListener('pointermove', onPointerMove);

    const handleResize = () => {
      if (!container) return;
      const w = Math.max(container.clientWidth, 280);
      const h = Math.max(container.clientHeight, 260);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setPixelRatio(
        resolvePixelRatio(
          syncRef.current.settings,
          isSoftwareGl,
          liteGpuMode,
          isUltraLowRam,
          galaxyA10Boost,
          realmeNote50Boost,
          w,
          h,
          dynamicScaleRef.current,
        ),
      );
      renderer.setSize(w, h);
    };
    const resizeObserver = new ResizeObserver(handleResize);
    resizeObserver.observe(container);

    const clock = new THREE.Clock();
    let frameId = 0;
    let isDisposed = false;
    let kettleSlide = 0;
    let smoothedLevel = 0;
    let lastDrawMs = 0;
    let slowFrameStreak = 0;
    let shadowTickCounter = 0;
    let lastAppliedTeaId = '';
    let lastLiquidCacheKey = '';
    let lastNearState = false;
    let lastCustomerPhase: CustomerPhase = 'ENTERING';
    let lastStep: BrewStep = syncRef.current.step;

    function afterDraw(cb: () => void) {
      const gl = renderer.getContext() as WebGL2RenderingContext;
      if (!gl || typeof gl.fenceSync !== 'function') {
        frameId = window.setTimeout(cb, 80);
        return;
      }
      const sync = gl.fenceSync(gl.SYNC_GPU_COMMANDS_COMPLETE, 0);
      gl.flush();
      const poll = () => {
        if (isDisposed) {
          if (sync) gl.deleteSync(sync);
          return;
        }
        const state = sync && gl.getSyncParameter(sync, gl.SYNC_STATUS);
        if (state === gl.UNSIGNALED) {
          frameId = window.setTimeout(poll, 5);
        } else {
          if (sync) gl.deleteSync(sync);
          frameId = window.setTimeout(cb, 80);
        }
      };
      frameId = window.setTimeout(poll, 5);
    }

    function tick() {
      if (isDisposed) return;

      const state = syncRef.current;
      const nowMs = performance.now();
      if (!isSoftwareGl && state.settings.targetFps < 120 && lastDrawMs > 0) {
        const minInterval = 1000 / state.settings.targetFps;
        if (nowMs - lastDrawMs < minInterval - 1.2) {
          frameId = requestAnimationFrame(tick);
          return;
        }
      }
      const prevDrawMs = lastDrawMs;
      lastDrawMs = nowMs;

      const delta = Math.min(clock.getDelta(), 0.1);
      const elapsed = clock.getElapsedTime();

      if (
        (liteGpuMode || isUltraLowRam || galaxyA10Boost || realmeNote50Boost) &&
        !isSoftwareGl &&
        prevDrawMs > 0 &&
        state.settings.targetFps >= 60
      ) {
        const frameSpanMs = nowMs - prevDrawMs;
        const slowThresholdMs = galaxyA10Boost
          ? 19
          : realmeNote50Boost && state.settings.targetFps >= 90
            ? 14.5
            : 28;
        const streakLimit = galaxyA10Boost ? 10 : realmeNote50Boost ? 12 : 18;
        const scaleFloor = galaxyA10Boost ? 0.62 : 0.74;

        if (frameSpanMs > slowThresholdMs) {
          slowFrameStreak += 1;
          if (
            slowFrameStreak >= streakLimit &&
            dynamicScaleRef.current > scaleFloor + 0.02
          ) {
            dynamicScaleRef.current = Math.max(
              scaleFloor,
              dynamicScaleRef.current - 0.1,
            );
            slowFrameStreak = 0;
            const cw = Math.max(mountRef.current?.clientWidth ?? 280, 280);
            const ch = Math.max(mountRef.current?.clientHeight ?? 260, 260);
            renderer.setPixelRatio(
              resolvePixelRatio(
                state.settings,
                isSoftwareGl,
                liteGpuMode,
                isUltraLowRam,
                galaxyA10Boost,
                realmeNote50Boost,
                cw,
                ch,
                dynamicScaleRef.current,
              ),
            );
          }
        } else if (slowFrameStreak > 0) {
          slowFrameStreak -= 1;
        }
      }

      // Reset subtle head look-around when switching between third-person and first-person brewing
      if (lastStep !== state.step) {
        if (lastStep === 'EXPLORE_SHOP' || state.step === 'EXPLORE_SHOP') {
          firstPersonLookYaw = 0;
          firstPersonLookPitch = 0;
        }
        lastStep = state.step;
      }

      const isThirdPerson = state.step === 'EXPLORE_SHOP';
      shopCharacters.setFirstPersonHidden(!isThirdPerson);

      if (isThirdPerson) {
        const moveInput = playerMoveRef.current;
        shopCharacters.movePlayer(moveInput.x, moveInput.y, thirdPersonYaw, delta);
      } else {
        shopCharacters.movePlayer(0, 0, thirdPersonYaw, delta);
      }

      const charTick = shopCharacters.animate(
        elapsed,
        delta,
        state.step,
        state.isPouring,
        state.mode,
        state.guestId,
        reducedMotion,
      );

      if (charTick.customerCrossedDoorNow) {
        callbacksRef.current.onCustomerEnteredDoor();
      }
      if (charTick.customerPhase !== lastCustomerPhase) {
        lastCustomerPhase = charTick.customerPhase;
        callbacksRef.current.onCustomerPhaseChange(charTick.customerPhase);
      }
      if (charTick.isNearTeaTable !== lastNearState) {
        lastNearState = charTick.isNearTeaTable;
        callbacksRef.current.onProximityChange(charTick.isNearTeaTable);
      }

      // Camera Rig: Strictly Third-Person in Shop OR First-Person while Brewing at Table
      const camLambda = isSoftwareGl ? 14 : 9.5;
      if (isThirdPerson) {
        const p = charTick.playerPos;
        const followDist = 2.55;
        const desiredCamX = THREE.MathUtils.clamp(
          p.x + Math.sin(thirdPersonYaw) * followDist,
          -4.95,
          4.95,
        );
        const desiredCamY = THREE.MathUtils.clamp(
          p.y + thirdPersonHeightOffset,
          0.65,
          2.65,
        );
        const desiredCamZ = THREE.MathUtils.clamp(
          p.z + Math.cos(thirdPersonYaw) * followDist,
          -2.75,
          4.55,
        );
        _camGoalPos.set(desiredCamX, desiredCamY, desiredCamZ);
        _camGoalTarget.set(p.x, p.y + 1.02, p.z);
      } else {
        // First-Person View at the Tea Counter (Tea Master's standing eye level looking across tray & guest)
        _camGoalPos.set(
          0.06 + firstPersonLookYaw * 0.18,
          1.26 + firstPersonLookPitch * 0.14,
          1.62,
        );
        _camGoalTarget.set(
          -0.14 + firstPersonLookYaw * 0.85,
          0.26 + firstPersonLookPitch * 0.48,
          -0.24,
        );
      }

      camera.position.x = THREE.MathUtils.damp(
        camera.position.x,
        _camGoalPos.x,
        camLambda,
        delta,
      );
      camera.position.y = THREE.MathUtils.damp(
        camera.position.y,
        _camGoalPos.y,
        camLambda,
        delta,
      );
      camera.position.z = THREE.MathUtils.damp(
        camera.position.z,
        _camGoalPos.z,
        camLambda,
        delta,
      );

      _camCurrentTarget.x = THREE.MathUtils.damp(
        _camCurrentTarget.x,
        _camGoalTarget.x,
        camLambda,
        delta,
      );
      _camCurrentTarget.y = THREE.MathUtils.damp(
        _camCurrentTarget.y,
        _camGoalTarget.y,
        camLambda,
        delta,
      );
      _camCurrentTarget.z = THREE.MathUtils.damp(
        _camCurrentTarget.z,
        _camGoalTarget.z,
        camLambda,
        delta,
      );
      camera.lookAt(_camCurrentTarget);

      // Update floating On-Table Brew Button screen position without React re-renders
      const btnEl = tableBtnRef.current;
      if (btnEl) {
        if (isThirdPerson && charTick.isNearTeaTable) {
          _tableProj.copy(_TABLE_ANCHOR).project(camera);
          if (_tableProj.z < 1) {
            const cw = mountRef.current?.clientWidth || initW;
            const ch = mountRef.current?.clientHeight || initH;
            const sx = THREE.MathUtils.clamp(
              (_tableProj.x * 0.5 + 0.5) * cw,
              96,
              cw - 96,
            );
            const sy = THREE.MathUtils.clamp(
              (-_tableProj.y * 0.5 + 0.5) * ch,
              78,
              ch - 76,
            );
            btnEl.style.opacity = '1';
            btnEl.style.pointerEvents = 'auto';
            btnEl.style.transform = `translate3d(${sx.toFixed(1)}px, ${sy.toFixed(1)}px, 0) translate(-50%, -50%)`;
          } else {
            btnEl.style.opacity = '0';
            btnEl.style.pointerEvents = 'none';
          }
        } else {
          btnEl.style.opacity = '0';
          btnEl.style.pointerEvents = 'none';
        }
      }

      // Vessel & Recipe Visuals
      if (lastAppliedTeaId !== state.tea.id) {
        lastAppliedTeaId = state.tea.id;

        vessel.chawanGroup.visible = state.tea.vesselStyle === 'chawan';
        vessel.ceramicGroup.visible = state.tea.vesselStyle === 'ceramic';
        vessel.glassGroup.visible = state.tea.vesselStyle === 'glass';

        vessel.saucerMesh.visible = state.tea.id === 'matcha-rosetta-latte';
        if (state.tea.id === 'matcha-rosetta-latte') {
          vessel.ceramicBodyMat.color.setHex(0xf9f7f2);
          vessel.ceramicHandleMat.color.setHex(0xf9f7f2);
        } else {
          vessel.ceramicBodyMat.color.setHex(0xf2efe6);
          vessel.ceramicHandleMat.color.setHex(0xf2efe6);
        }

        vessel.kintsugiSeam.visible = state.tea.id === 'kintsugi-matcha';
        if (state.tea.id === 'kintsugi-matcha') {
          vessel.chawanBodyMat.color.setHex(0x232629);
          vessel.chawanRimMat.color.setHex(0xd8b04a);
        } else if (state.tea.id === 'classic-heritage-matcha') {
          vessel.chawanBodyMat.color.setHex(0x6d2f29);
          vessel.chawanRimMat.color.setHex(0xc99c46);
        } else if (state.tea.id === 'uji-roasted-matcha') {
          vessel.chawanBodyMat.color.setHex(0x78533f);
          vessel.chawanRimMat.color.setHex(0xc49a6c);
        } else if (state.tea.id === 'sakura-matcha') {
          vessel.chawanBodyMat.color.setHex(0xf0e1da);
          vessel.chawanRimMat.color.setHex(0xd88e99);
        } else if (
          state.tea.id === 'uji-matcha' ||
          state.tea.id === 'stone-milled-koicha'
        ) {
          vessel.chawanBodyMat.color.setHex(0x2c3138);
          vessel.chawanRimMat.color.setHex(0x5a6068);
        } else if (
          state.tea.id === 'ceremonial-matcha' ||
          state.tea.id === 'pumpkin-spice-matcha'
        ) {
          vessel.chawanBodyMat.color.setHex(0xf0ece0);
          vessel.chawanRimMat.color.setHex(0x4e823c);
        } else {
          vessel.chawanBodyMat.color.setHex(0x3b483d);
          vessel.chawanRimMat.color.setHex(0xb6956a);
        }

        chasen.root.visible =
          state.tea.category === 'matcha' || state.tea.category === 'latte';
        equipmentRig.frotherSet.visible =
          state.tea.equipmentId === 'milk-frother';
        equipmentRig.clayTeapotSet.visible =
          state.tea.equipmentId === 'clay-teapot';
        equipmentRig.strainerSet.visible =
          state.tea.equipmentId === 'strainer-kettle';
        equipmentRig.herbalInfuserSet.visible =
          state.tea.equipmentId === 'herbal-infuser';
        equipmentRig.coldDripSet.visible =
          state.tea.equipmentId === 'cold-drip';

        _targetLeafColor.set(state.tea.deepColor);
        vessel.leafMaterial.color.copy(_targetLeafColor);
      }

      if (!reducedMotion) {
        if (chasen.root.visible && state.step === 'STEEP_TEA') {
          chasen.whiskGroup.rotation.y = elapsed * 4.2;
          chasen.whiskGroup.position.y = 0.22 + Math.sin(elapsed * 6) * 0.03;
        } else if (chasen.whiskGroup.rotation.y !== 0) {
          chasen.whiskGroup.rotation.y = 0;
          chasen.whiskGroup.position.y = 0.16;
        }

        if (equipmentRig.frotherSet.visible && state.step === 'STEEP_TEA') {
          equipmentRig.frotherWand.rotation.y = elapsed * 8;
        } else if (equipmentRig.frotherWand.rotation.y !== 0) {
          equipmentRig.frotherWand.rotation.y = 0;
        }

        if (equipmentRig.coldDripSet.visible) {
          const dropPhase = (elapsed * 0.85) % 1;
          equipmentRig.coldDripDrop.position.y = 0.62 - dropPhase * 0.36;
          equipmentRig.coldDripDrop.visible = dropPhase < 0.85;
        }
      }

      smoothedLevel = THREE.MathUtils.damp(
        smoothedLevel,
        state.waterLevel,
        8,
        delta,
      );
      if (smoothedLevel > 0.01) {
        vessel.liquidGroup.visible = true;
        const maxScale = state.tea.vesselStyle === 'chawan' ? 0.82 : 1.0;
        vessel.liquidGroup.scale.y = Math.max(0.01, smoothedLevel * maxScale);
        vessel.liquidGroup.scale.x =
          state.tea.vesselStyle === 'chawan' ? 1.02 : 1.0;
        vessel.liquidGroup.scale.z =
          state.tea.vesselStyle === 'chawan' ? 1.02 : 1.0;

        const liquidKey = `${state.tea.id}:${state.steepSeconds}:${state.toppings.join(',')}`;
        if (liquidKey !== lastLiquidCacheKey) {
          lastLiquidCacheKey = liquidKey;
          const targetHex = getLiquidColor(
            state.tea,
            state.steepSeconds,
            state.toppings,
          );
          _targetLiquidColor.set(targetHex);
        }
        vessel.liquidMaterial.color.lerp(
          _targetLiquidColor,
          Math.min(1, delta * 5),
        );
      } else {
        vessel.liquidGroup.visible = false;
      }

      vessel.leavesGroup.visible = state.step !== 'SERVED';
      if (state.isPouring || state.step === 'STEEP_TEA') {
        vessel.leavesGroup.rotation.y += delta * 0.65;
      }

      const targetSlide = state.isPouring ? 1 : 0;
      kettleSlide = THREE.MathUtils.damp(kettleSlide, targetSlide, 6.5, delta);
      kettle.bodyGroup.position.x = -kettleSlide * 0.48;
      kettle.bodyGroup.position.y = 0.06 + kettleSlide * 0.68;
      kettle.bodyGroup.position.z = kettleSlide * 0.22;
      kettle.bodyGroup.rotation.z = kettleSlide * 0.42;
      kettle.streamMesh.visible = state.isPouring && kettleSlide > 0.45;

      const liquidSurfaceY =
        0.11 +
        smoothedLevel *
          (state.tea.vesselStyle === 'chawan' ? 0.82 : 1.0) *
          0.56;
      const showToppings = smoothedLevel > 0.45;
      const isChawan = state.tea.vesselStyle === 'chawan';

      vessel.iceGroup.visible = showToppings && state.toppings.includes('ice');
      if (vessel.iceGroup.visible && !reducedMotion) {
        vessel.iceGroup.position.y = liquidSurfaceY - 0.04;
        vessel.iceCubes.forEach((cube, idx) => {
          cube.position.y = Math.sin(elapsed * 1.8 + idx * 1.4) * 0.012;
        });
      }

      vessel.lemonGroup.visible =
        showToppings && state.toppings.includes('lemon');
      vessel.lemonGroup.position.y = isChawan ? 0.59 : 0.73;

      vessel.honeyGroup.visible =
        showToppings && state.toppings.includes('honey');

      vessel.osmanthusGroup.visible =
        showToppings && state.toppings.includes('osmanthus');
      if (vessel.osmanthusGroup.visible) {
        vessel.osmanthusGroup.position.y = liquidSurfaceY + 0.005;
        if (!reducedMotion) {
          vessel.osmanthusGroup.rotation.y = elapsed * 0.15;
        }
      }

      vessel.strawberryGroup.visible =
        showToppings && state.toppings.includes('strawberry');
      vessel.brownSugarGroup.visible =
        showToppings && state.toppings.includes('brown-sugar');
      vessel.cinnamonGroup.visible =
        showToppings && state.toppings.includes('cinnamon');
      vessel.cinnamonGroup.position.y = isChawan ? -0.08 : 0;

      vessel.milkFoamGroup.visible =
        showToppings && state.toppings.includes('milk-foam');
      if (vessel.milkFoamGroup.visible) {
        vessel.milkFoamGroup.position.y = liquidSurfaceY - 0.01;
        vessel.milkFoamGroup.scale.set(
          isChawan ? 1.08 : 1.0,
          1,
          isChawan ? 1.08 : 1.0,
        );
      }

      vessel.mintGroup.visible =
        showToppings && state.toppings.includes('mint');
      if (vessel.mintGroup.visible) {
        vessel.mintGroup.position.y = liquidSurfaceY + 0.01;
      }

      const emitSteam =
        state.settings.particlesEnabled &&
        !reducedMotion &&
        smoothedLevel > 0.45 &&
        !state.toppings.includes('ice') &&
        (state.step === 'STEEP_TEA' ||
          state.step === 'ADD_TOPPING' ||
          state.step === 'SERVED');

      for (const s of steamSprites) {
        if (!emitSteam) {
          s.sprite.material.opacity = 0;
          continue;
        }
        s.phase = (s.phase + delta * s.speed) % 1;
        s.sprite.position.y = 0.86 + s.phase * 0.95;
        s.sprite.position.x =
          -0.22 + Math.sin(s.phase * Math.PI * 2) * s.driftX;
        s.sprite.position.z =
          0.08 + Math.cos(s.phase * Math.PI * 2) * 0.04;
        const scale = 0.28 + s.phase * 0.35;
        s.sprite.scale.set(scale, scale, 1);
        s.sprite.material.opacity = Math.sin(s.phase * Math.PI) * 0.42;
      }

      if (liteGpuMode && renderer.shadowMap.enabled) {
        shadowTickCounter = (shadowTickCounter + 1) % 3;
        const movingShadowCasters =
          state.isPouring ||
          kettleSlide > 0.015 ||
          state.step === 'STEEP_TEA' ||
          isThirdPerson ||
          charTick.customerPhase === 'ENTERING';
        if (
          shadowDirtyRef.current ||
          (movingShadowCasters && shadowTickCounter === 0)
        ) {
          renderer.shadowMap.needsUpdate = true;
          shadowDirtyRef.current = false;
        }
      }

      renderer.render(scene, camera);

      if (isSoftwareGl) {
        afterDraw(tick);
      } else {
        frameId = requestAnimationFrame(tick);
      }
    }

    tick();

    return () => {
      isDisposed = true;
      cancelAnimationFrame(frameId);
      clearTimeout(frameId);
      resizeObserver.disconnect();
      renderer.domElement.removeEventListener('pointerdown', onPointerDown);
      window.removeEventListener('pointerup', onPointerUp);
      window.removeEventListener('pointermove', onPointerMove);
      renderer.domElement.removeEventListener(
        'webglcontextlost',
        handleContextLost,
      );
      renderer.domElement.removeEventListener(
        'webglcontextrestored',
        handleContextRestored,
      );

      const disposedGeos = new Set<THREE.BufferGeometry>();
      const disposedMats = new Set<THREE.Material>();
      scene.traverse((obj) => {
        if ((obj as THREE.Mesh).isMesh) {
          const mesh = obj as THREE.Mesh;
          if (mesh.geometry && !disposedGeos.has(mesh.geometry)) {
            disposedGeos.add(mesh.geometry);
            mesh.geometry.dispose();
          }
          if (Array.isArray(mesh.material)) {
            mesh.material.forEach((m) => {
              if (!disposedMats.has(m)) {
                disposedMats.add(m);
                m.dispose();
              }
            });
          } else if (mesh.material && !disposedMats.has(mesh.material)) {
            disposedMats.add(mesh.material);
            mesh.material.dispose();
          }
        }
      });

      steamSprites.forEach((s) => s.sprite.material.dispose());
      cedarTex.dispose();
      walnutTex.dispose();
      matTex.dispose();
      ceramicTex.dispose();
      shadowTex.dispose();
      steamTex.dispose();
      envTexture.dispose();
      envRenderTarget.dispose();
      renderer.renderLists.dispose();
      renderer.dispose();
      rendererRef.current = null;
      keyLightRef.current = null;
      charactersRef.current = null;
    };
  }, [
    settings.antialiasEnabled,
    liteGpuMode,
    isUltraLowRam,
    isMaliG71Hardware,
    galaxyA10Boost,
    realmeNote50Boost,
    playerMoveRef,
  ]);

  if (webglError) {
    return (
      <div className="flex h-full w-full flex-col items-center justify-center bg-[#233029] p-6 text-center text-[#F3F1EC]">
        <p className="font-display text-lg font-semibold">{tea.name}</p>
        <p className="mt-2 max-w-sm text-sm text-[#C7D4C3]">
          อุปกรณ์นี้ไม่รองรับการแสดงผล WebGL 3D ในขณะนี้ แต่ยังสามารถเลือกชาและชงต่อได้ตามปกติ
        </p>
      </div>
    );
  }

  return (
    <div className="relative h-full w-full select-none overflow-hidden">
      <div
        ref={mountRef}
        className="h-full w-full select-none"
        aria-label={`ฉากร้านน้ำชา 3 มิติ: ${tea.name}`}
      />

      {/* World-Anchored Button directly over the Tea Counter when Player Walks Near */}
      <button
        ref={tableBtnRef}
        type="button"
        onClick={onBrewAtTableClick}
        style={{
          opacity: 0,
          pointerEvents: 'none',
          top: 0,
          left: 0,
        }}
        className="fixed z-20 inline-flex min-h-[48px] items-center gap-2 rounded-2xl border-2 border-[#C5DCBA] bg-[#2E6F40] px-5 py-2.5 text-sm font-bold text-white shadow-xl transition-opacity duration-150 hover:bg-[#245732] active:scale-95 whitespace-nowrap"
      >
        <Coffee className="h-4 w-4 shrink-0" aria-hidden="true" />
        <span>ชงชาที่โต๊ะ</span>
      </button>
    </div>
  );
});
