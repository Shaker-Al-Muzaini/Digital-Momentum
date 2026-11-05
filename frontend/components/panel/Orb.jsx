'use client';
import { useEffect, useRef } from 'react';
export default function Orb() {
  const ref = useRef(null);
  useEffect(() => {
    let disposed = false,
      release;
    async function mount() {
      const THREE = await import('three');
      if (disposed) return;
      const canvas = ref.current,
        renderer = new THREE.WebGLRenderer({
          canvas,
          alpha: true,
          antialias: true,
        });
      const scene = new THREE.Scene(),
        camera = new THREE.PerspectiveCamera(45, 1, 0.1, 100);
      const geometry = new THREE.IcosahedronGeometry(1.5, 2);
      const material = new THREE.MeshBasicMaterial({
        color: 0x2997ff,
        wireframe: true,
        transparent: true,
        opacity: 0.5,
      });
      const mesh = new THREE.Mesh(geometry, material);
      camera.position.z = 4.2;
      scene.add(mesh);
      const reduce = matchMedia('(prefers-reduced-motion: reduce)');
      let target = 0;
      function pointer(e) {
        target = (e.clientY / innerHeight - 0.5) * 0.6;
      }
      function frame() {
        if (!reduce.matches) {
          mesh.rotation.y += 0.004;
          mesh.rotation.x += (target - mesh.rotation.x) * 0.02;
        }
        renderer.render(scene, camera);
      }
      function resize() {
        const { clientWidth: w, clientHeight: h } = canvas;
        if (!w || !h) return;
        renderer.setSize(w, h, false);
        camera.aspect = w / h;
        camera.updateProjectionMatrix();
        frame();
      }
      const observer = new ResizeObserver(resize);
      observer.observe(canvas);
      resize();
      function motion() {
        renderer.setAnimationLoop(reduce.matches ? null : frame);
        frame();
      }
      reduce.addEventListener('change', motion);
      motion();
      window.addEventListener('pointermove', pointer);
      release = () => {
        observer.disconnect();
        window.removeEventListener('pointermove', pointer);
        reduce.removeEventListener('change', motion);
        renderer.setAnimationLoop(null);
        geometry.dispose();
        material.dispose();
        renderer.dispose();
      };
    }
    mount().catch(() => {}); // The heading stays readable when WebGL is unavailable.
    return () => {
      disposed = true;
      release?.();
    };
  }, []);
  return <canvas ref={ref} aria-hidden="true" />;
}
