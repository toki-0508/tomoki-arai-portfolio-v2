import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { asset } from '../asset.js';

// ============================================================
// トップの3D表示
// - models/hero.glb(Blenderで作ったマウス)を机の上の物のように見せる
// - ドラッグで回転 / ホイール・ピンチで拡大縮小 / ゆっくり自動回転
// - 真下や真上からは見られないよう角度を制限し、接地影を落とす
// - 画面外では描画を止める。モーションを減らす設定では自動回転しない
// ============================================================

const INITIAL_AZIMUTH_DEG = -140;
const CAMERA_DISTANCE = 9.2;
const CAMERA_HEIGHT = 2.4;

function makeShadowTexture() {
  const size = 128;
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = size;
  const ctx = canvas.getContext('2d');
  const gradient = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
  gradient.addColorStop(0, 'rgba(0,0,0,0.6)');
  gradient.addColorStop(0.45, 'rgba(0,0,0,0.25)');
  gradient.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, size, size);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

export default function Hero3DCanvas() {
  const mountRef = useRef(null);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    let width = mount.clientWidth || 480;
    let height = mount.clientHeight || 420;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(36, width / height, 0.1, 100);
    // 斜め前から見下ろす角度で始める(真後ろからだとマウスに見えないため)。
    // 自動回転しない設定ではこの角度のまま止まる。
    const azimuth = (INITIAL_AZIMUTH_DEG * Math.PI) / 180;
    camera.position.set(Math.sin(azimuth) * CAMERA_DISTANCE, CAMERA_HEIGHT, Math.cos(azimuth) * CAMERA_DISTANCE);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.setSize(width, height);
    renderer.domElement.style.cursor = 'grab';
    renderer.domElement.style.touchAction = 'pan-y';
    renderer.domElement.setAttribute('aria-label', '自作の3Dモデル（マウス）。ドラッグで回転できます');
    renderer.domElement.setAttribute('role', 'img');
    mount.appendChild(renderer.domElement);

    const disposables = [];
    let disposed = false;

    // 接地影: モデルの真下に置く半透明の円
    const shadowTexture = makeShadowTexture();
    const shadowMaterial = new THREE.MeshBasicMaterial({ map: shadowTexture, transparent: true, depthWrite: false });
    const shadow = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), shadowMaterial);
    shadow.rotation.x = -Math.PI / 2;
    shadow.visible = false;
    scene.add(shadow);
    disposables.push(shadowTexture, shadowMaterial, shadow.geometry);

    const placeShadow = (object) => {
      const box = new THREE.Box3().setFromObject(object);
      const size = box.getSize(new THREE.Vector3());
      shadow.position.set((box.min.x + box.max.x) / 2, box.min.y - 0.02, (box.min.z + box.max.z) / 2);
      shadow.scale.set(size.x * 1.35, size.z * 1.6, 1);
      shadow.visible = true;
    };

    // 任意の Object3D を原点中心・一定サイズに収める
    const fitObject = (object) => {
      const box = new THREE.Box3().setFromObject(object);
      const size = box.getSize(new THREE.Vector3());
      const center = box.getCenter(new THREE.Vector3());
      object.position.sub(center);
      const wrap = new THREE.Group();
      wrap.add(object);
      wrap.scale.setScalar(4 / (Math.max(size.x, size.y, size.z) || 1));
      scene.add(wrap);
      placeShadow(wrap);
    };

    const fallback = () => {
      if (disposed) return;
      const geometry = new THREE.IcosahedronGeometry(1.6, 0);
      const material = new THREE.MeshStandardMaterial({ color: 0x3046d1, flatShading: true, roughness: 0.4 });
      const mesh = new THREE.Mesh(geometry, material);
      scene.add(mesh);
      placeShadow(mesh);
      disposables.push(geometry, material);
    };

    new GLTFLoader().load(
      asset('/models/hero.glb'),
      (gltf) => {
        if (disposed) return;
        gltf.scene.traverse((o) => {
          if (o.isMesh && o.material) o.material.side = THREE.DoubleSide;
        });
        fitObject(gltf.scene);
      },
      undefined,
      fallback,
    );

    // 黒い艶のあるマウスなので、輪郭が背景に沈まないよう逆光(リムライト)を足す
    const ambient = new THREE.AmbientLight(0xffffff, 0.5);
    const key = new THREE.DirectionalLight(0xffffff, 1.1);
    key.position.set(5, 7, 6);
    const fill = new THREE.DirectionalLight(0xb9c4ff, 0.5);
    fill.position.set(-6, 2, 4);
    const rim = new THREE.DirectionalLight(0xffffff, 0.9);
    rim.position.set(-2, 4, -7);
    scene.add(ambient, key, fill, rim);

    const applyTheme = () => {
      const dark = document.documentElement.dataset.theme === 'dark';
      ambient.intensity = dark ? 0.9 : 0.5;
      key.intensity = dark ? 1.4 : 1.1;
      rim.intensity = dark ? 1.6 : 0.9;
      shadowMaterial.opacity = dark ? 0.9 : 0.55;
    };
    applyTheme();
    const themeObserver = new MutationObserver(applyTheme);
    themeObserver.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.08;
    controls.enablePan = false;
    controls.minDistance = 7;
    controls.maxDistance = 13;
    controls.zoomSpeed = 0.7;
    controls.rotateSpeed = 0.8;
    controls.minPolarAngle = 0.95;
    controls.maxPolarAngle = 1.48;
    controls.autoRotate = !reduceMotion;
    controls.autoRotateSpeed = 0.9;

    const grab = () => { renderer.domElement.style.cursor = 'grabbing'; };
    const release = () => { renderer.domElement.style.cursor = 'grab'; };
    renderer.domElement.addEventListener('pointerdown', grab);
    window.addEventListener('pointerup', release);

    let raf = 0;
    let visible = true;
    const tick = () => {
      controls.update();
      renderer.render(scene, camera);
      raf = requestAnimationFrame(tick);
    };
    const start = () => { if (!raf && visible && !disposed) tick(); };
    const stop = () => { cancelAnimationFrame(raf); raf = 0; };

    const io = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      if (visible) start();
      else stop();
    });
    io.observe(mount);
    start();

    const ro = new ResizeObserver(() => {
      width = mount.clientWidth;
      height = mount.clientHeight;
      if (!width || !height) return;
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height);
    });
    ro.observe(mount);

    return () => {
      disposed = true;
      stop();
      themeObserver.disconnect();
      io.disconnect();
      ro.disconnect();
      controls.dispose();
      renderer.domElement.removeEventListener('pointerdown', grab);
      window.removeEventListener('pointerup', release);
      scene.traverse((o) => {
        if (o.isMesh) {
          o.geometry?.dispose();
          [].concat(o.material).forEach((m) => m?.dispose());
        }
      });
      disposables.forEach((d) => d.dispose?.());
      renderer.dispose();
      renderer.domElement.remove();
    };
  }, []);

  return <div className="hero-canvas" ref={mountRef} />;
}
