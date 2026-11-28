import React, {useEffect, useRef, useState} from 'react';
import * as THREE from 'three';
import {Box, Pause, Play, RotateCcw} from 'lucide-react';
import {buildCompleteTeaArtisanCharacter} from '../three/characterBuilders';
import {soundEngine} from '../utils/soundEngine';

export const LowPolyCharacterPreview: React.FC = () => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [wireframe, setWireframe] = useState(false);
  const [autoSpin, setAutoSpin] = useState(true);
  const wireframeRef = useRef(false);
  const autoSpinRef = useRef(true);
  const yawRef = useRef(0.32);
  const pitchRef = useRef(0.08);
  const draggingRef = useRef(false);
  const lastPointerRef = useRef<{x: number; y: number}>({x: 0, y: 0});
  const meshesRef = useRef<THREE.Mesh[]>([]);

  useEffect(() => {
    wireframeRef.current = wireframe;
    for (const mesh of meshesRef.current) {
      const mats = Array.isArray(mesh.material)
        ? mesh.material
        : [mesh.material];
      for (const m of mats) {
        if (m instanceof THREE.MeshStandardMaterial) {
          m.wireframe = wireframe;
          m.needsUpdate = true;
        }
      }
    }
  }, [wireframe]);

  useEffect(() => {
    autoSpinRef.current = autoSpin;
  }, [autoSpin]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const width = Math.max(240, container.clientWidth || 320);
    const height = Math.max(200, container.clientHeight || 230);

    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      powerPreference: 'default',
    });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.setSize(width, height, false);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.08;
    renderer.domElement.style.width = '100%';
    renderer.domElement.style.height = '100%';
    renderer.domElement.style.display = 'block';
    container.appendChild(renderer.domElement);

    const scene = new THREE.Scene();

    const camera = new THREE.PerspectiveCamera(36, width / height, 0.1, 25);
    camera.position.set(0, 1.02, 2.55);
    camera.lookAt(0, 0.88, 0);

    // 3-Point Studio PBR Lighting to highlight Normal, Roughness, Metalness & Low Poly facets
    const hemi = new THREE.HemisphereLight(0xf6f3ea, 0x3b4940, 0.95);
    scene.add(hemi);

    const keyLight = new THREE.DirectionalLight(0xfff5e4, 2.05);
    keyLight.position.set(2.4, 3.2, 2.6);
    scene.add(keyLight);

    const rimLight = new THREE.DirectionalLight(0xaad5ff, 1.05);
    rimLight.position.set(-2.4, 2.2, -2.1);
    scene.add(rimLight);

    const fillLight = new THREE.DirectionalLight(0xeef5ec, 0.65);
    fillLight.position.set(-1.6, 0.9, 2.0);
    scene.add(fillLight);

    // Subtle Turntable Pedestal
    const pedestalGeo = new THREE.CylinderGeometry(0.68, 0.74, 0.05, 16);
    const pedestalMat = new THREE.MeshStandardMaterial({
      color: 0x2c3b32,
      roughness: 0.48,
      metalness: 0.25,
      flatShading: true,
    });
    const pedestal = new THREE.Mesh(pedestalGeo, pedestalMat);
    pedestal.position.y = -0.025;
    scene.add(pedestal);

    const ringGeo = new THREE.RingGeometry(0.60, 0.63, 24);
    const ringMat = new THREE.MeshBasicMaterial({
      color: 0xcfa14b,
      side: THREE.DoubleSide,
    });
    const ring = new THREE.Mesh(ringGeo, ringMat);
    ring.rotation.x = -Math.PI / 2;
    ring.position.y = 0.002;
    scene.add(ring);

    const handle = buildCompleteTeaArtisanCharacter(false, false);
    const pivot = new THREE.Group();
    pivot.add(handle.group);
    scene.add(pivot);

    const collectedMeshes: THREE.Mesh[] = [];
    handle.group.traverse((obj) => {
      if (obj instanceof THREE.Mesh) {
        collectedMeshes.push(obj);
      }
    });
    meshesRef.current = collectedMeshes;

    const ro = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (!entry) return;
      const w = Math.max(200, Math.round(entry.contentRect.width));
      const h = Math.max(180, Math.round(entry.contentRect.height));
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h, false);
    });
    ro.observe(container);

    let rafId = 0;
    let lastTime = performance.now();

    const tick = (now: number) => {
      const dt = Math.min(0.05, (now - lastTime) / 1000);
      lastTime = now;

      if (autoSpinRef.current && !draggingRef.current) {
        yawRef.current += dt * 0.55;
      }
      pivot.rotation.y = yawRef.current;
      pivot.rotation.x = THREE.MathUtils.clamp(pitchRef.current, -0.35, 0.45);
      renderer.render(scene, camera);
      rafId = requestAnimationFrame(tick);
    };
    rafId = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(rafId);
      ro.disconnect();
      meshesRef.current = [];
      for (const tex of handle.textures) {
        tex.dispose();
      }
      handle.group.traverse((obj) => {
        if (obj instanceof THREE.Mesh) {
          obj.geometry.dispose();
          const mats = Array.isArray(obj.material)
            ? obj.material
            : [obj.material];
          for (const m of mats) {
            m.dispose();
          }
        }
      });
      pedestalGeo.dispose();
      pedestalMat.dispose();
      ringGeo.dispose();
      ringMat.dispose();
      renderer.dispose();
      if (renderer.domElement.parentNode === container) {
        container.removeChild(renderer.domElement);
      }
    };
  }, []);

  return (
    <div className="rounded-xl border border-[#2E6F40]/20 bg-gradient-to-b from-[#1E2B23] to-[#131C16] p-3 text-[#FAF8F3]">
      <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
        <div className="flex items-center gap-2">
          <Box className="h-4 w-4 text-[#8CD19A]" aria-hidden="true" />
          <span className="text-xs font-bold text-[#FAF8F3]">
            ตัวอย่างโมเดล 3D: เจ้าบ้านชาโฉมใหม่ (โครงสร้างสมบูรณ์)
          </span>
        </div>
        <span className="text-[10px] text-[#C5D8C9]">
          ลากเพื่อหมุนดูโมเดล 360°
        </span>
      </div>

      <div
        ref={containerRef}
        onPointerDown={(e) => {
          draggingRef.current = true;
          lastPointerRef.current = {x: e.clientX, y: e.clientY};
          e.currentTarget.setPointerCapture(e.pointerId);
        }}
        onPointerMove={(e) => {
          if (!draggingRef.current) return;
          const dx = e.clientX - lastPointerRef.current.x;
          const dy = e.clientY - lastPointerRef.current.y;
          lastPointerRef.current = {x: e.clientX, y: e.clientY};
          yawRef.current += dx * 0.012;
          pitchRef.current = THREE.MathUtils.clamp(
            pitchRef.current + dy * 0.008,
            -0.35,
            0.45,
          );
        }}
        onPointerUp={(e) => {
          draggingRef.current = false;
          if (e.currentTarget.hasPointerCapture(e.pointerId)) {
            e.currentTarget.releasePointerCapture(e.pointerId);
          }
        }}
        onPointerCancel={() => {
          draggingRef.current = false;
        }}
        className="h-[220px] sm:h-[240px] w-full rounded-lg bg-black/20 touch-none cursor-grab active:cursor-grabbing overflow-hidden"
      />

      <div className="mt-2.5 flex flex-wrap items-center justify-between gap-2">
          <span className="text-[11px] text-[#C5D8C9]">
          3D Rig: 18 Bones · Sculpted Face, Hands, Ears & Two-Tone Footwear
        </span>
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => {
              soundEngine.playTap();
              setWireframe((v) => !v);
            }}
            className={`min-h-[34px] rounded-lg border px-2.5 text-[11px] font-semibold transition-colors ${
              wireframe
                ? 'border-[#8CD19A] bg-[#2E6F40] text-white'
                : 'border-white/20 bg-white/10 text-[#E5EFE7] hover:bg-white/15'
            }`}
          >
            {wireframe ? 'ปิด Wireframe' : 'ดูโครงสร้าง Mesh'}
          </button>

          <button
            type="button"
            onClick={() => {
              soundEngine.playTap();
              setAutoSpin((v) => !v);
            }}
            className="inline-flex min-h-[34px] items-center gap-1 rounded-lg border border-white/20 bg-white/10 px-2.5 text-[11px] font-semibold text-[#E5EFE7] hover:bg-white/15"
          >
            {autoSpin ? (
              <>
                <Pause className="h-3 w-3" aria-hidden="true" />
                <span>หยุดหมุน</span>
              </>
            ) : (
              <>
                <Play className="h-3 w-3" aria-hidden="true" />
                <span>หมุนอัตโนมัติ</span>
              </>
            )}
          </button>

          <button
            type="button"
            onClick={() => {
              soundEngine.playTap();
              yawRef.current = 0.32;
              pitchRef.current = 0.08;
            }}
            aria-label="รีเซ็ตมุมกล้อง"
            className="inline-flex min-h-[34px] min-w-[34px] items-center justify-center rounded-lg border border-white/20 bg-white/10 text-[#E5EFE7] hover:bg-white/15"
          >
            <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
          </button>
        </div>
      </div>
    </div>
  );
};
