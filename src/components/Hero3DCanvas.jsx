import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { asset } from '../asset.js';

// ============================================================
// トップのインタラクティブ 3D ヒーロー
// - models/hero.glb を読み込み、失敗時はクリスタルを表示
// - ドラッグで回転 / ホイール・ピンチで拡大縮小 / 自動回転
// - 画面外では描画を止める(バッテリー配慮)
// - prefers-reduced-motion では自動回転をオフにする
// ============================================================
export default function Hero3DCanvas() {
  const mountRef = useRef(null);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    let width = mount.clientWidth || 480;
    let height = mount.clientHeight || 430;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(40, width / height, 0.1, 100);
    camera.position.set(0, 0, 9.2);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.setSize(width, height);
    renderer.domElement.style.cursor = 'grab';
    renderer.domElement.style.touchAction = 'pan-y';
    mount.appendChild(renderer.domElement);

    const group = new THREE.Group();
    scene.add(group);
    let disposed = false;
    const disposers = [];

    // 任意の Object3D を原点中心・一定サイズに収める
    const fitObject = (obj) => {
      const box = new THREE.Box3().setFromObject(obj);
      const size = new THREE.Vector3();
      const center = new THREE.Vector3();
      box.getSize(size);
      box.getCenter(center);
      const maxDim = Math.max(size.x, size.y, size.z) || 1;
      obj.position.sub(center);
      const wrap = new THREE.Group();
      wrap.add(obj);
      wrap.scale.setScalar(3.7 / maxDim);
      group.add(wrap);
    };

    const fallbackCrystal = () => {
      if (disposed) return;
      const geo = new THREE.IcosahedronGeometry(2, 0);
      const mat = new THREE.MeshStandardMaterial({ color: 0x2563eb, flatShading: true, metalness: 0.18, roughness: 0.34 });
      group.add(new THREE.Mesh(geo, mat));
      disposers.push(geo, mat);
      const wireGeo = new THREE.WireframeGeometry(new THREE.IcosahedronGeometry(2.06, 0));
      const wireMat = new THREE.LineBasicMaterial({ color: 0x9db4ff, transparent: true, opacity: 0.5 });
      group.add(new THREE.LineSegments(wireGeo, wireMat));
      disposers.push(wireGeo, wireMat);
    };

    new GLTFLoader().load(
      asset('/models/hero.glb'),
      (gltf) => {
        if (disposed) return;
        gltf.scene.traverse((o) => {
          if (o.isMesh && o.material) {
            o.material.side = THREE.DoubleSide;
            if ('vertexColors' in o.material && o.geometry.attributes.color) o.material.vertexColors = true;
          }
        });
        fitObject(gltf.scene);
      },
      undefined,
      fallbackCrystal,
    );

    // 周回するキューブ
    const cubeGeo = new THREE.BoxGeometry(0.36, 0.36, 0.36);
    const cubes = [];
    for (let i = 0; i < 3; i++) {
      const mat = new THREE.MeshStandardMaterial({ color: i === 0 ? 0x3b7af0 : 0x1b53d4, metalness: 0.2, roughness: 0.4 });
      const cube = new THREE.Mesh(cubeGeo, mat);
      cube.userData = { a: (i * Math.PI * 2) / 3, r: 2.7, speed: 0.4 + i * 0.1 };
      scene.add(cube);
      cubes.push(cube);
      disposers.push(mat);
    }

    // ダークテーマでは暗いモデルが背景に沈むため、ライトを強める
    const ambient = new THREE.AmbientLight(0xffffff, 0.55);
    scene.add(ambient);
    const key = new THREE.DirectionalLight(0xffffff, 0.95);
    key.position.set(5, 6, 8);
    scene.add(key);
    const fill = new THREE.DirectionalLight(0x9db4ff, 0.6);
    fill.position.set(-6, -3, -4);
    scene.add(fill);

    const applyTheme = () => {
      const dark = document.documentElement.dataset.theme === 'dark';
      ambient.intensity = dark ? 1.0 : 0.55;
      key.intensity = dark ? 1.35 : 0.95;
      fill.intensity = dark ? 0.9 : 0.6;
    };
    applyTheme();
    const themeObserver = new MutationObserver(applyTheme);
    themeObserver.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.08;
    controls.enableZoom = true;
    controls.enablePan = false;
    controls.minDistance = 6.2;
    controls.maxDistance = 12.5;
    controls.zoomSpeed = 0.8;
    controls.autoRotate = !reduceMotion;
    controls.autoRotateSpeed = 1.1;
    controls.rotateSpeed = 0.85;

    const grab = () => { renderer.domElement.style.cursor = 'grabbing'; };
    const release = () => { renderer.domElement.style.cursor = 'grab'; };
    renderer.domElement.addEventListener('pointerdown', grab);
    window.addEventListener('pointerup', release);

    const clock = new THREE.Clock();
    let raf = 0;
    let visible = true;

    const tick = () => {
      const t = clock.getElapsedTime();
      cubes.forEach((cube) => {
        const a = cube.userData.a + t * cube.userData.speed * 0.5;
        cube.position.set(Math.cos(a) * cube.userData.r, Math.sin(a * 0.8) * 0.85, Math.sin(a) * cube.userData.r);
        cube.rotation.x += 0.01;
        cube.rotation.y += 0.012;
      });
      controls.update();
      renderer.render(scene, camera);
      raf = requestAnimationFrame(tick);
    };

    const start = () => {
      if (!raf && visible && !disposed) tick();
    };
    const stop = () => {
      cancelAnimationFrame(raf);
      raf = 0;
    };

    // 画面外に出たら描画を止める
    const io = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      if (visible) start();
      else stop();
    });
    io.observe(mount);
    start();

    const onResize = () => {
      width = mount.clientWidth;
      height = mount.clientHeight;
      if (!width || !height) return;
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height);
    };
    const ro = new ResizeObserver(onResize);
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
      renderer.dispose();
      disposers.forEach((d) => d.dispose?.());
      cubeGeo.dispose();
      renderer.domElement.remove();
    };
  }, []);

  return (
    <div className="hero-3d">
      <div className="hero-3d-backdrop" aria-hidden="true" />
      <div className="hero-3d-canvas" ref={mountRef} />
      <div className="hero-3d-hint">ドラッグで回転・ピンチで拡大縮小</div>
    </div>
  );
}
