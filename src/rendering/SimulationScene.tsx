import { Canvas } from '@react-three/fiber';
import { Grid, OrbitControls, Stars } from '@react-three/drei';
import { useMemo } from 'react';
import * as THREE from 'three';
import { getBody } from '../data/catalog';
import type { SimulationRun } from '../types';
import { telemetryIndex } from '../ui/format';

function VerticalScene({ run, time }: { run: SimulationRun; time: number }) {
  const index = telemetryIndex(run.telemetry.t, time);
  const altitude = Math.max(0, run.telemetry.altitude[index]);
  const peak = Math.max(1, run.summary.peakAltitude_m);
  const visualY = Math.min(9.5, (altitude / peak) * 8.5 + .2);
  const thrusting = run.telemetry.thrust[index] > 0;
  return <>
    <ambientLight intensity={.75} />
    <directionalLight position={[4,8,5]} intensity={3.2} castShadow />
    <group position={[0, visualY, 0]} scale={.55}>
      <mesh position={[0,1.7,0]} castShadow><cylinderGeometry args={[.42,.42,3.4,32]} /><meshStandardMaterial color="#ececec" metalness={.15} roughness={.4} /></mesh>
      <mesh position={[0,3.75,0]}><coneGeometry args={[.42,.75,32]} /><meshStandardMaterial color="#ececec" /></mesh>
      <mesh position={[0,-.1,0]} rotation={[Math.PI,0,0]}><coneGeometry args={[.28,.14,.55,20]} /><meshStandardMaterial color="#3a3d40" metalness={.7} /></mesh>
      {thrusting && <mesh position={[0,-.8,0]} rotation={[Math.PI,0,0]}><coneGeometry args={[.38,.04,1.3,24]} /><meshBasicMaterial color="#f7f2dc" transparent opacity={.9} /></mesh>}
    </group>
    <Grid args={[30,30]} position={[0,0,0]} cellSize={1} cellColor="#33373c" sectionSize={5} sectionColor="#565c63" fadeDistance={25} infiniteGrid />
    <OrbitControls target={[0,3.5,0]} minDistance={4} maxDistance={28} />
  </>;
}

function OrbitScene({ run, time }: { run: SimulationRun; time: number }) {
  const index = telemetryIndex(run.telemetry.t, time);
  const body = getBody(run.input.bodyId);
  const scale = 2.5 / body.radius_m;
  const current: [number, number, number] = [run.telemetry.positionX[index] * scale, run.telemetry.positionZ[index] * scale, run.telemetry.positionY[index] * scale];
  const pathGeometry = useMemo(() => {
    const points: THREE.Vector3[] = [];
    const stride = Math.max(1, Math.floor(run.telemetry.t.length / 1000));
    for (let sample = 0; sample < run.telemetry.t.length; sample += stride) {
      points.push(new THREE.Vector3(run.telemetry.positionX[sample] * scale, run.telemetry.positionZ[sample] * scale, run.telemetry.positionY[sample] * scale));
    }
    return new THREE.BufferGeometry().setFromPoints(points);
  }, [run, scale]);
  const pathLine = useMemo(() => new THREE.Line(pathGeometry, new THREE.LineBasicMaterial({ color: '#f5f5f5' })), [pathGeometry]);
  const color = run.input.bodyId === 'earth' ? '#315777' : run.input.bodyId === 'moon' ? '#999999' : '#a65336';
  return <>
    <ambientLight intensity={.3} /><directionalLight position={[-4,5,7]} intensity={3.5} />
    <mesh><sphereGeometry args={[2.5,96,96]} /><meshStandardMaterial color={color} roughness={.86} /></mesh>
    <primitive object={pathLine} />
    <mesh position={current}><sphereGeometry args={[.07,20,20]} /><meshBasicMaterial color="#ffffff" /></mesh>
    <Stars radius={80} depth={30} count={1500} factor={2} saturation={0} fade speed={0} />
    <OrbitControls enablePan={false} minDistance={4} maxDistance={14} />
  </>;
}

export function SimulationScene({ run, time }: { run: SimulationRun; time: number }) {
  return <div className="scene scene--simulation" role="img" aria-label="3D visualization driven by the selected simulation run telemetry.">
    <Canvas shadows camera={{ position: run.input.scenario === 'vertical' ? [7,4.5,10] : [0,1.4,8], fov: 44 }} dpr={[.75,1.5]} gl={{ antialias:true, powerPreference:'high-performance' }}>
      <color attach="background" args={['#060708']} />
      {run.input.scenario === 'vertical' ? <VerticalScene run={run} time={time} /> : <OrbitScene run={run} time={time} />}
    </Canvas>
  </div>;
}
