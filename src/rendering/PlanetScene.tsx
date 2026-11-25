import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Stars } from '@react-three/drei';
import { Suspense, useEffect, useMemo, useRef, useState } from 'react';
import * as THREE from 'three';
import type { BodyId } from '../types';

const textureFiles: Record<BodyId, string> = {
  earth: './assets/planets/earth-day.jpg',
  moon: './assets/planets/moon.jpg',
  mars: './assets/planets/mars.jpg',
};
const colors: Record<BodyId, string> = { earth: '#315777', moon: '#a9a5a0', mars: '#aa5736' };

function Body({ bodyId, reducedMotion }: { bodyId: BodyId; reducedMotion: boolean }) {
  const mesh = useRef<THREE.Mesh>(null);
  const [texture, setTexture] = useState<THREE.Texture | null>(null);
  useEffect(() => {
    let active = true;
    new THREE.TextureLoader().load(textureFiles[bodyId], (loaded) => {
      loaded.colorSpace = THREE.SRGBColorSpace;
      loaded.anisotropy = 8;
      if (active) setTexture(loaded);
    }, undefined, () => { if (active) setTexture(null); });
    return () => { active = false; };
  }, [bodyId]);
  useFrame((_, delta) => { if (mesh.current && !reducedMotion) mesh.current.rotation.y += delta * 0.025; });
  return (
    <group rotation={[0.15, -0.4, 0]}>
      <mesh ref={mesh} castShadow receiveShadow>
        <sphereGeometry args={[2.3, 128, 128]} />
        <meshStandardMaterial map={texture} color={texture ? '#ffffff' : colors[bodyId]} roughness={0.88} metalness={0.02} />
      </mesh>
      <mesh scale={1.018}>
        <sphereGeometry args={[2.3, 96, 96]} />
        <meshBasicMaterial color={bodyId === 'earth' ? '#79b9ff' : colors[bodyId]} transparent opacity={0.08} side={THREE.BackSide} />
      </mesh>
    </group>
  );
}

export function PlanetScene({ bodyId, trajectory = false, className = '' }: { bodyId: BodyId; trajectory?: boolean; className?: string }) {
  const [reducedMotion, setReducedMotion] = useState(false);
  useEffect(() => {
    const media = window.matchMedia('(prefers-reduced-motion: reduce)');
    const update = () => setReducedMotion(media.matches);
    update(); media.addEventListener('change', update);
    return () => media.removeEventListener('change', update);
  }, []);
  const orbit = useMemo(() => {
    const points: THREE.Vector3[] = [];
    for (let index = 0; index <= 160; index += 1) {
      const angle = (index / 160) * Math.PI * 2;
      points.push(new THREE.Vector3(Math.cos(angle) * 3.25, Math.sin(angle) * 0.65, Math.sin(angle) * 2.55));
    }
    return new THREE.BufferGeometry().setFromPoints(points);
  }, []);
  const orbitLine = useMemo(() => new THREE.Line(orbit, new THREE.LineBasicMaterial({ color: '#f5f5f5', transparent: true, opacity: .75 })), [orbit]);
  return (
    <div className={`scene ${className}`} role="img" aria-label={`Interactive 3D ${bodyId} visualization. Drag to rotate and scroll to zoom.`}>
      <Canvas camera={{ position: [0, 0.3, 7], fov: 45 }} dpr={[0.75, 1.5]} gl={{ antialias: true, powerPreference: 'high-performance' }}>
        <color attach="background" args={['#050607']} />
        <ambientLight intensity={0.22} />
        <directionalLight position={[-4, 4, 5]} intensity={3.5} castShadow />
        <Suspense fallback={null}><Body bodyId={bodyId} reducedMotion={reducedMotion} /></Suspense>
        {trajectory && <primitive object={orbitLine} />}
        <Stars radius={80} depth={30} count={1800} factor={2.2} saturation={0} fade speed={0} />
        <OrbitControls enablePan={false} minDistance={4.2} maxDistance={12} autoRotate={false} />
      </Canvas>
      <div className="scene__label"><span className="status-dot" /> Interactive body model · visual texture</div>
    </div>
  );
}
