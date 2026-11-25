import React, {useEffect, useRef, useState} from 'react';
import * as THREE from 'three';
import {OrbitControls} from 'three/addons/controls/OrbitControls.js';
import {RoomEnvironment} from 'three/addons/environments/RoomEnvironment.js';
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
  createKettleGroup,
  createTeaTableEnvironment,
  createTeaVesselSystem,
} from '../three/teaModels';
import {BrewStep, CameraPreset, TeaType, ToppingId} from '../types/tea';

interface TeaScene3DProps {
  tea: TeaType;
  step: BrewStep;
  waterLevel: number;
  steepSeconds: number;
  toppings: ToppingId[];
  isPouring: boolean;
  cameraPreset: CameraPreset;
  onKettleClick?: () => void;
  onVesselClick?: () => void;
}

interface SceneSyncState {
  tea: TeaType;
  step: BrewStep;
  waterLevel: number;
  steepSeconds: number;
  toppings: ToppingId[];
  isPouring: boolean;
  cameraPreset: CameraPreset;
}

const CAMERA_PRESETS: Record<
  CameraPreset,
  {pos: [number, number, number]; target: [number, number, number]}
> = {
  table: {pos: [0.35, 2.35, 3.65], target: [0.18, 0.42, 0.05]},
  cup: {pos: [-0.22, 1.45, 2.05], target: [-0.22, 0.48, 0.08]},
  overhead: {pos: [0.08, 3.9, 1.35], target: [0.12, 0.25, 0.05]},
};

// Module-scope scratch variables to keep the render loop GC-free
const _targetLiquidColor = new THREE.Color();
const _targetLeafColor = new THREE.Color();
const _camGoalPos = new THREE.Vector3();
const _camGoalTarget = new THREE.Vector3();
const _pointerNdc = new THREE.Vector2();

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

export const TeaScene3D: React.FC<TeaScene3DProps> = ({
  tea,
  step,
  waterLevel,
  steepSeconds,
  toppings,
  isPouring,
  cameraPreset,
  onKettleClick,
  onVesselClick,
}) => {
  const mountRef = useRef<HTMLDivElement | null>(null);
  const [webglError, setWebglError] = useState(false);

  const syncRef = useRef<SceneSyncState>({
    tea,
    step,
    waterLevel,
    steepSeconds,
    toppings,
    isPouring,
    cameraPreset,
  });

  const callbacksRef = useRef({
    onKettleClick,
    onVesselClick,
  });

  const presetAnimatingRef = useRef<boolean>(true);
  const lastPresetRef = useRef<CameraPreset>(cameraPreset);

  useEffect(() => {
    syncRef.current = {
      tea,
      step,
      waterLevel,
      steepSeconds,
      toppings,
      isPouring,
      cameraPreset,
    };
    if (lastPresetRef.current !== cameraPreset) {
      lastPresetRef.current = cameraPreset;
      presetAnimatingRef.current = true;
    }
  }, [tea, step, waterLevel, steepSeconds, toppings, isPouring, cameraPreset]);

  useEffect(() => {
    callbacksRef.current = {onKettleClick, onVesselClick};
  }, [onKettleClick, onVesselClick]);

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const isSoftwareGl = detectSoftwareWebGL();
    const reducedMotion =
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({
        antialias: !isSoftwareGl,
        powerPreference: 'high-performance',
      });
    } catch {
      setWebglError(true);
      return;
    }

    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.08;
    renderer.setPixelRatio(
      isSoftwareGl ? 1 : Math.min(window.devicePixelRatio || 1, 2),
    );
    renderer.shadowMap.enabled = !isSoftwareGl;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    const initW = Math.max(container.clientWidth, 320);
    const initH = Math.max(container.clientHeight, 260);
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

    // Scene & Atmosphere
    const scene = new THREE.Scene();
    const horizonHex = 0xd8dfd5;
    scene.background = new THREE.Color(horizonHex);
    scene.fog = new THREE.FogExp2(horizonHex, 0.068);

    const pmremGenerator = new THREE.PMREMGenerator(renderer);
    const envTexture = pmremGenerator.fromScene(
      new RoomEnvironment(),
      0.04,
    ).texture;
    scene.environment = envTexture;
    pmremGenerator.dispose();

    // Camera & OrbitControls (tuned for landscape proportions so subject sits clearly above bottom dock)
    const isShortLandscape = initH < 520;
    const camera = new THREE.PerspectiveCamera(
      isShortLandscape ? 46 : 42,
      initW / initH,
      0.1,
      45,
    );
    const initialPreset = CAMERA_PRESETS[syncRef.current.cameraPreset];
    camera.position.set(
      initialPreset.pos[0],
      initialPreset.pos[1] + (isShortLandscape ? 0.15 : 0),
      initialPreset.pos[2] + (isShortLandscape ? 0.45 : 0),
    );

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.target.set(
      initialPreset.target[0],
      initialPreset.target[1] - (isShortLandscape ? 0.16 : 0),
      initialPreset.target[2],
    );
    controls.enableDamping = !isSoftwareGl;
    controls.dampingFactor = 0.06;
    controls.minDistance = 1.5;
    controls.maxDistance = 6.2;
    controls.minPolarAngle = 0.28;
    controls.maxPolarAngle = Math.PI / 2 - 0.08;
    controls.minAzimuthAngle = -Math.PI / 2.4;
    controls.maxAzimuthAngle = Math.PI / 2.4;
    controls.enablePan = false;
    controls.update();

    const handleControlStart = () => {
      presetAnimatingRef.current = false;
    };
    controls.addEventListener('start', handleControlStart);

    // 3-Point Studio Lighting Rig
    const hemiLight = new THREE.HemisphereLight(0xdfe8ec, 0x8b7358, 0.85);
    scene.add(hemiLight);

    const keyLight = new THREE.DirectionalLight(0xfff1dc, 1.65);
    keyLight.position.set(4.5, 6.2, 3.8);
    keyLight.castShadow = !isSoftwareGl;
    keyLight.shadow.mapSize.width = 1024;
    keyLight.shadow.mapSize.height = 1024;
    keyLight.shadow.camera.near = 0.5;
    keyLight.shadow.camera.far = 18;
    const d = 4.2;
    keyLight.shadow.camera.left = -d;
    keyLight.shadow.camera.right = d;
    keyLight.shadow.camera.top = d;
    keyLight.shadow.camera.bottom = -d;
    keyLight.shadow.bias = -0.0005;
    keyLight.shadow.normalBias = 0.02;
    scene.add(keyLight);

    const rimLight = new THREE.DirectionalLight(0xd9ebd6, 0.65);
    rimLight.position.set(-4.0, 3.2, -3.5);
    scene.add(rimLight);

    // Procedural Textures
    const maxAniso = renderer.capabilities.getMaxAnisotropy();
    const cedarTex = createWoodGrainTexture('#A87B4F', '#6B4728', maxAniso);
    const walnutTex = createWoodGrainTexture('#69492F', '#3E2817', maxAniso);
    const matTex = createWovenMatTexture(maxAniso);
    const ceramicTex = createCeramicSpeckleTexture('#EFECE3', '#9D9688', maxAniso);
    const shadowTex = createContactShadowTexture();
    const steamTex = createSteamPuffTexture();

    // Assemble Multi-Part 3D Models
    const envGroup = createTeaTableEnvironment(
      cedarTex,
      walnutTex,
      matTex,
      ceramicTex,
      shadowTex,
    );
    scene.add(envGroup);

    const vessel = createTeaVesselSystem(
      ceramicTex,
      walnutTex,
      shadowTex,
      isSoftwareGl,
    );
    scene.add(vessel.root);

    const kettle = createKettleGroup(walnutTex, shadowTex);
    scene.add(kettle.root);

    const chasen = createChasenGroup(ceramicTex, shadowTex);
    scene.add(chasen.root);

    // Rising Steam Wisps (Sprites above tea vessel)
    const steamSprites: {
      sprite: THREE.Sprite;
      phase: number;
      speed: number;
      driftX: number;
    }[] = [];
    for (let i = 0; i < 6; i++) {
      const mat = new THREE.SpriteMaterial({
        map: steamTex,
        transparent: true,
        opacity: 0,
        depthWrite: false,
      });
      const sprite = new THREE.Sprite(mat);
      sprite.position.set(-0.22, 0.9, 0.08);
      sprite.scale.set(0.32, 0.32, 1);
      scene.add(sprite);
      steamSprites.push({
        sprite,
        phase: i / 6,
        speed: 0.24 + (i % 3) * 0.05,
        driftX: ((i % 2 === 0 ? 1 : -1) * (0.04 + i * 0.015)),
      });
    }

    if (!isSoftwareGl) {
      renderer.compile(scene, camera);
    }

    // Raycasting for 3D Kettle & Vessel clicks
    const raycaster = new THREE.Raycaster();
    const clickables = [kettle.clickProxy, vessel.clickProxy];
    let pointerDownPos = {x: 0, y: 0};

    const onPointerDown = (e: PointerEvent) => {
      pointerDownPos = {x: e.clientX, y: e.clientY};
    };

    const onPointerUp = (e: PointerEvent) => {
      // Ignore camera drag releases
      const moveDist = Math.hypot(
        e.clientX - pointerDownPos.x,
        e.clientY - pointerDownPos.y,
      );
      if (moveDist > 8) return;

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
      const now = performance.now();
      if (now - lastHoverCheck < 60) return;
      lastHoverCheck = now;

      const rect = renderer.domElement.getBoundingClientRect();
      _pointerNdc.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      _pointerNdc.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

      raycaster.setFromCamera(_pointerNdc, camera);
      const hits = raycaster.intersectObjects(clickables, false);
      const curStep = syncRef.current.step;
      let canInteract = false;
      if (hits.length > 0) {
        const id = hits[0].object.userData.interactId;
        if (id === 'kettle' && curStep === 'POUR_WATER') canInteract = true;
        if (id === 'vessel' && curStep === 'STEEP_TEA') canInteract = true;
      }
      renderer.domElement.style.cursor = canInteract ? 'pointer' : 'grab';
    };

    renderer.domElement.addEventListener('pointerdown', onPointerDown);
    renderer.domElement.addEventListener('pointerup', onPointerUp);
    renderer.domElement.addEventListener('pointermove', onPointerMove);

    // ResizeObserver for crisp container fitting
    const handleResize = () => {
      if (!container) return;
      const w = Math.max(container.clientWidth, 280);
      const h = Math.max(container.clientHeight, 260);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    const resizeObserver = new ResizeObserver(handleResize);
    resizeObserver.observe(container);

    // Animation Loop State
    const clock = new THREE.Clock();
    let frameId = 0;
    let isDisposed = false;
    let kettleSlide = 0;
    let smoothedLevel = 0;

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

      const delta = Math.min(clock.getDelta(), 0.1);
      const elapsed = clock.getElapsedTime();
      const state = syncRef.current;

      // 1. Camera Preset Smooth Interpolation
      if (presetAnimatingRef.current) {
        const preset = CAMERA_PRESETS[state.cameraPreset];
        _camGoalPos.set(...preset.pos);
        _camGoalTarget.set(...preset.target);
        const lambda = isSoftwareGl ? 12 : 4.5;
        camera.position.x = THREE.MathUtils.damp(
          camera.position.x,
          _camGoalPos.x,
          lambda,
          delta,
        );
        camera.position.y = THREE.MathUtils.damp(
          camera.position.y,
          _camGoalPos.y,
          lambda,
          delta,
        );
        camera.position.z = THREE.MathUtils.damp(
          camera.position.z,
          _camGoalPos.z,
          lambda,
          delta,
        );
        controls.target.x = THREE.MathUtils.damp(
          controls.target.x,
          _camGoalTarget.x,
          lambda,
          delta,
        );
        controls.target.y = THREE.MathUtils.damp(
          controls.target.y,
          _camGoalTarget.y,
          lambda,
          delta,
        );
        controls.target.z = THREE.MathUtils.damp(
          controls.target.z,
          _camGoalTarget.z,
          lambda,
          delta,
        );
        if (
          camera.position.distanceTo(_camGoalPos) < 0.015 &&
          controls.target.distanceTo(_camGoalTarget) < 0.015
        ) {
          presetAnimatingRef.current = false;
        }
      }
      controls.update();

      // 2. Vessel Shell Style Switching
      vessel.chawanGroup.visible = state.tea.vesselStyle === 'chawan';
      vessel.ceramicGroup.visible = state.tea.vesselStyle === 'ceramic';
      vessel.glassGroup.visible = state.tea.vesselStyle === 'glass';

      // Show Chasen whisk prominently when brewing Matcha
      chasen.root.visible = state.tea.category === 'matcha';

      // 3. Liquid Fill & Color Interpolation
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
          state.tea.vesselStyle === 'chawan' ? 1.12 : 1.0;
        vessel.liquidGroup.scale.z =
          state.tea.vesselStyle === 'chawan' ? 1.12 : 1.0;

        const targetHex = getLiquidColor(
          state.tea,
          state.steepSeconds,
          state.toppings,
        );
        _targetLiquidColor.set(targetHex);
        vessel.liquidMaterial.color.lerp(
          _targetLiquidColor,
          Math.min(1, delta * 5),
        );
        vessel.liquidMaterial.opacity = state.toppings.includes('milk')
          ? 0.98
          : 0.9;
      } else {
        vessel.liquidGroup.visible = false;
      }

      // 4. Tea Leaves Color & Gentle Swirl
      _targetLeafColor.set(state.tea.deepColor);
      vessel.leafMaterial.color.copy(_targetLeafColor);
      vessel.leavesGroup.visible = state.step !== 'SERVED';
      if (state.isPouring || state.step === 'STEEP_TEA') {
        vessel.leavesGroup.rotation.y += delta * 0.65;
      }

      // 5. Kettle Pouring Kinematics
      const targetSlide = state.isPouring ? 1 : 0;
      kettleSlide = THREE.MathUtils.damp(kettleSlide, targetSlide, 6.5, delta);
      kettle.bodyGroup.position.x = -kettleSlide * 0.48;
      kettle.bodyGroup.position.y = 0.06 + kettleSlide * 0.68;
      kettle.bodyGroup.position.z = kettleSlide * 0.22;
      kettle.bodyGroup.rotation.z = kettleSlide * 0.42;
      kettle.streamMesh.visible = state.isPouring && kettleSlide > 0.45;

      // 6. Toppings Visibility & Bobbing
      const liquidSurfaceY =
        0.11 +
        smoothedLevel *
          (state.tea.vesselStyle === 'chawan' ? 0.82 : 1.0) *
          0.56;
      const showToppings = smoothedLevel > 0.45;

      vessel.iceGroup.visible =
        showToppings && state.toppings.includes('ice');
      if (vessel.iceGroup.visible && !reducedMotion) {
        vessel.iceGroup.position.y = liquidSurfaceY - 0.04;
        vessel.iceCubes.forEach((cube, idx) => {
          cube.position.y = Math.sin(elapsed * 1.8 + idx * 1.4) * 0.012;
        });
      }

      vessel.lemonGroup.visible =
        showToppings && state.toppings.includes('lemon');
      vessel.lemonGroup.position.y =
        state.tea.vesselStyle === 'chawan' ? 0.59 : 0.73;

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

      // 7. Rising Steam Wisps (Hot teas without ice)
      const emitSteam =
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
      controls.removeEventListener('start', handleControlStart);
      controls.dispose();
      renderer.domElement.removeEventListener('pointerdown', onPointerDown);
      renderer.domElement.removeEventListener('pointerup', onPointerUp);
      renderer.domElement.removeEventListener('pointermove', onPointerMove);
      renderer.domElement.removeEventListener(
        'webglcontextlost',
        handleContextLost,
      );
      renderer.domElement.removeEventListener(
        'webglcontextrestored',
        handleContextRestored,
      );

      scene.traverse((obj) => {
        if ((obj as THREE.Mesh).isMesh) {
          const mesh = obj as THREE.Mesh;
          mesh.geometry?.dispose();
          if (Array.isArray(mesh.material)) {
            mesh.material.forEach((m) => m.dispose());
          } else {
            mesh.material?.dispose();
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
      renderer.dispose();
    };
  }, []);

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
    <div
      ref={mountRef}
      className="h-full w-full select-none"
      aria-label={`ฉากโต๊ะชงชา 3 มิติ: ${tea.name}`}
    />
  );
};
