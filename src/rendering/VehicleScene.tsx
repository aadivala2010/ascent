import { Canvas } from '@react-three/fiber';
import { Grid, OrbitControls } from '@react-three/drei';
import { Suspense } from 'react';
import * as THREE from 'three';

export type CadMode = 'solid' | 'wireframe' | 'cutaway' | 'exploded';

function Profile({ points, color, mode, radialSegments = 96 }: { points: Array<[number, number]>; color: string; mode: CadMode; radialSegments?: number }) {
  const profile = points.map(([height, radius]) => new THREE.Vector2(radius, height));
  return <mesh castShadow receiveShadow>
    <latheGeometry args={[profile, mode === 'solid' ? radialSegments : Math.max(24, radialSegments / 2)]} />
    <meshStandardMaterial color={color} metalness={color === '#9aa0a3' ? .78 : .15} roughness={color === '#9aa0a3' ? .32 : .44} wireframe={mode === 'wireframe'} transparent={mode === 'cutaway'} opacity={mode === 'cutaway' ? .32 : 1} side={THREE.DoubleSide} />
  </mesh>;
}

function Cylinder({ y, height, radius, color, mode, offset = 0 }: { y: number; height: number; radius: number; color: string; mode: CadMode; offset?: number }) {
  return (
    <mesh position={[0, y + offset, 0]} castShadow receiveShadow>
      <cylinderGeometry args={[radius, radius, height, mode === 'solid' ? 64 : 32]} />
      <meshStandardMaterial color={color} metalness={color === '#9aa0a3' ? 0.78 : 0.15} roughness={0.38} wireframe={mode === 'wireframe'} transparent={mode === 'cutaway'} opacity={mode === 'cutaway' ? 0.34 : 1} side={THREE.DoubleSide} />
    </mesh>
  );
}

function EngineRing({ y, radius, count = 9, mode }: { y: number; radius: number; count?: number; mode: CadMode }) {
  return <group>{Array.from({ length: count }, (_, index) => {
    const angle = (index / count) * Math.PI * 2;
    const radial = count === 1 ? 0 : radius * 0.62;
    return <mesh key={index} position={[Math.cos(angle) * radial, y, Math.sin(angle) * radial]} rotation={[Math.PI, 0, 0]}>
      <coneGeometry args={[radius * 0.12, radius * 0.09, radius * 0.32, 16]} />
      <meshStandardMaterial color="#232629" metalness={0.65} roughness={0.44} wireframe={mode === 'wireframe'} />
    </mesh>;
  })}</group>;
}

function Core({ mode, color = '#dedede', scale = 1, x = 0, booster = false }: { mode: CadMode; color?: string; scale?: number; x?: number; booster?: boolean }) {
  const exploded = mode === 'exploded';
  return <group position={[x, -3.6, 0]} scale={scale}>
    <Cylinder y={2.2} height={4.4} radius={0.7} color={color} mode={mode} />
    <Cylinder y={5.1} height={1.35} radius={0.7} color={booster ? color : '#24272a'} mode={mode} offset={exploded ? 0.35 : 0} />
    <Cylinder y={6.4} height={1.25} radius={0.7} color={color} mode={mode} offset={exploded ? 0.75 : 0} />
    <mesh position={[0, 7.55 + (exploded ? 1.1 : 0), 0]}>
      <coneGeometry args={[booster ? 0.7 : 1.02, 1.7, 64]} />
      <meshStandardMaterial color={color} metalness={0.16} roughness={0.38} wireframe={mode === 'wireframe'} transparent={mode === 'cutaway'} opacity={mode === 'cutaway' ? 0.35 : 1} />
    </mesh>
    <EngineRing y={-0.12} radius={0.7} count={9} mode={mode} />
  </group>;
}

function Sls({ mode }: { mode: CadMode }) {
  return <group>
    <group position={[0, -3.8, 0]}>
      <Cylinder y={2.7} height={5.4} radius={0.82} color="#b8672d" mode={mode} />
      <Cylinder y={6.1} height={1.45} radius={0.62} color="#ededed" mode={mode} offset={mode === 'exploded' ? .5 : 0} />
      <mesh position={[0, 7.55 + (mode === 'exploded' ? .85 : 0), 0]}><coneGeometry args={[0.62, 1.7, 48]} /><meshStandardMaterial color="#ededed" wireframe={mode === 'wireframe'} /></mesh>
      <EngineRing y={-0.12} radius={.82} count={4} mode={mode} />
    </group>
    {[-1.28, 1.28].map((x) => <group key={x} position={[x, -3.2, 0]}><Cylinder y={2.6} height={5.2} radius={.35} color="#f2f2f2" mode={mode} /><mesh position={[0, 5.5, 0]}><coneGeometry args={[.35,.65,32]} /><meshStandardMaterial color="#f2f2f2" wireframe={mode==='wireframe'} /></mesh></group>)}
  </group>;
}

function Starship({ mode }: { mode: CadMode }) {
  const gap = mode === 'exploded' ? 0.85 : 0;
  return <group position={[0,-4,0]}>
    <Cylinder y={2.9} height={5.8} radius={0.82} color="#90989c" mode={mode} />
    <Cylinder y={6.65 + gap} height={1.7} radius={0.82} color="#9ca3a6" mode={mode} />
    <mesh position={[0,8.2+gap,0]}><coneGeometry args={[.82,1.4,64]} /><meshStandardMaterial color="#9ca3a6" metalness={.8} roughness={.3} wireframe={mode==='wireframe'} transparent={mode==='cutaway'} opacity={mode==='cutaway'?.4:1} /></mesh>
    {[-1,1].flatMap((sign) => [
      <mesh key={`low${sign}`} position={[sign*.9,6.05+gap,0]} rotation={[0,0,sign*-.25]}><boxGeometry args={[.52,1.25,.08]} /><meshStandardMaterial color="#55595b" /></mesh>,
      <mesh key={`high${sign}`} position={[sign*.65,7.7+gap,0]} rotation={[0,0,sign*-.35]}><boxGeometry args={[.38,.8,.07]} /><meshStandardMaterial color="#55595b" /></mesh>,
    ])}
    <EngineRing y={-.12} radius={.82} count={13} mode={mode} />
    {mode === 'cutaway' && <group><Cylinder y={2.0} height={2.15} radius={.58} color="#7ea4b8" mode="solid" /><Cylinder y={4.45} height={2.15} radius={.58} color="#c8c8c8" mode="solid" /></group>}
  </group>;
}

function Shuttle({ mode }: { mode: CadMode }) {
  return <group position={[0,-3.6,0]}>
    <Cylinder y={3} height={6} radius={.72} color="#bb6a2f" mode={mode} />
    {[-1.1,1.1].map((x)=><group key={x} position={[x,0,0]}><Cylinder y={2.6} height={5.2} radius={.3} color="#f0f0f0" mode={mode}/><mesh position={[0,5.55,0]}><coneGeometry args={[.3,.7,32]}/><meshStandardMaterial color="#f0f0f0" /></mesh></group>)}
    <group position={[0,3.45,.9]} rotation={[0,0,0]}>
      <mesh><capsuleGeometry args={[.42,3.5,16,32]} /><meshStandardMaterial color="#e4e4e4" roughness={.5} wireframe={mode==='wireframe'} /></mesh>
      <mesh position={[0,-.2,0]}><boxGeometry args={[3.1,.08,1.15]} /><meshStandardMaterial color="#d9d9d9" wireframe={mode==='wireframe'} /></mesh>
      <mesh position={[0,-1.15,-.15]}><boxGeometry args={[.12,1.6,1.1]} /><meshStandardMaterial color="#303235" /></mesh>
    </group>
  </group>;
}

function Falcon9Profile({ mode, heavy = false }: { mode: CadMode; heavy?: boolean }) {
  const scale = .102;
  const vehicle = <group scale={scale} position={[0, -3.6, 0]}>
    <Profile points={[[0,1.85],[41,1.85],[45,1.85],[56,1.85],[59,2.6],[64,2.6],[67,2],[69,.9],[70,0]]} color="#eeeeec" mode={mode} />
    <Cylinder y={43} height={4.1} radius={1.88} color="#202326" mode={mode} />
    <EngineRing y={-.5} radius={1.85} count={9} mode={mode} />
    {[0,Math.PI/2,Math.PI,Math.PI*1.5].map((angle)=><group key={angle} rotation={[0,angle,0]}><mesh position={[0,6,2.2]} rotation={[.2,0,0]}><boxGeometry args={[.42,12,.22]}/><meshStandardMaterial color="#292c2e" /></mesh><mesh position={[0,37,2]}><boxGeometry args={[1.25,2.2,.12]}/><meshStandardMaterial color="#292c2e" /></mesh></group>)}
    {mode==='cutaway'&&<group><Cylinder y={16} height={27} radius={1.42} color="#7f9caa" mode="solid"/><Cylinder y={32.5} height={5.2} radius={1.42} color="#c2c7ca" mode="solid"/><Cylinder y={51} height={8} radius={1.42} color="#899eaa" mode="solid"/></group>}
  </group>;
  if (!heavy) return vehicle;
  return <group>{vehicle}<group position={[-.76,-3.6,0]} scale={scale}><Profile points={[[0,1.85],[41,1.85],[45,1.85],[51,1.45],[54,0]]} color="#eeeeec" mode={mode}/><EngineRing y={-.5} radius={1.85} count={9} mode={mode}/></group><group position={[.76,-3.6,0]} scale={scale}><Profile points={[[0,1.85],[41,1.85],[45,1.85],[51,1.45],[54,0]]} color="#eeeeec" mode={mode}/><EngineRing y={-.5} radius={1.85} count={9} mode={mode}/></group></group>;
}

function StarshipProfile({ mode }: { mode: CadMode }) {
  const s=.066;
  const gap=mode==='exploded'?8:0;
  return <group scale={s} position={[0,-4.1,0]}>
    <Profile points={[[0,4.5],[70.5,4.5],[72.3,4.1]]} color="#92999c" mode={mode}/>
    <group position={[0,gap,0]}><Profile points={[[72.3,4.5],[111,4.5],[116,4.1],[120,2.8],[123,1],[124.4,0]]} color="#9aa0a3" mode={mode}/>
      {[-1,1].map(sign=><mesh key={`lower-${sign}`} position={[sign*5.2,78,0]} rotation={[0,0,sign*-.22]}><boxGeometry args={[2.8,10,.35]}/><meshStandardMaterial color="#393d3f" /></mesh>)}
      {[-1,1].map(sign=><mesh key={`upper-${sign}`} position={[sign*3.7,109,0]} rotation={[0,0,sign*-.35]}><boxGeometry args={[2.2,8,.3]}/><meshStandardMaterial color="#393d3f" /></mesh>)}
    </group>
    {[0,Math.PI/2,Math.PI,Math.PI*1.5].map(angle=><mesh key={angle} position={[Math.cos(angle)*4.9,65,Math.sin(angle)*4.9]} rotation={[0,-angle,0]}><boxGeometry args={[3.2,4,.35]}/><meshStandardMaterial color="#303436" /></mesh>)}
    <EngineRing y={-.5} radius={4.5} count={13} mode={mode}/>
    {mode==='cutaway'&&<group><Cylinder y={24} height={42} radius={3.7} color="#778f9b" mode="solid"/><Cylinder y={54} height={16} radius={3.7} color="#c4c7c8" mode="solid"/><Cylinder y={88+gap} height={21} radius={3.7} color="#8599a2" mode="solid"/><Cylinder y={106+gap} height={13} radius={3.7} color="#c4c7c8" mode="solid"/></group>}
  </group>;
}

function SaturnProfile({ mode }: { mode: CadMode }) {
  const s=.076;
  const gap=mode==='exploded'?5:0;
  return <group scale={s} position={[0,-4.2,0]}>
    <Profile points={[[0,5.05],[42.1,5.05],[44,4.7],[67,5.05],[70,4.2],[84.9,3.3],[91,3.3],[99,2.2],[105,1.15],[108,.35],[111,0]]} color="#eeeeda" mode={mode}/>
    <Cylinder y={20} height={14} radius={5.08} color="#252729" mode={mode}/><Cylinder y={60+gap} height={4} radius={5.08} color="#252729" mode={mode}/><Cylinder y={79+gap*2} height={5} radius={3.35} color="#252729" mode={mode}/>
    <EngineRing y={-.5} radius={5.05} count={5} mode={mode}/>
  </group>;
}

function ElectronProfile({ mode }: { mode: CadMode }) {
  return <group scale={.46} position={[0,-4.1,0]}><Profile points={[[0,.6],[12,.6],[13,.6],[15,.6],[17,.45],[18,0]]} color="#202326" mode={mode}/><Cylinder y={12.5} height={.35} radius={.62} color="#e7e7e7" mode={mode}/><EngineRing y={-.15} radius={.6} count={9} mode={mode}/></group>;
}

function SlsProfile({ mode }: { mode: CadMode }) {
  const s=.083;
  return <group scale={s} position={[0,-4.1,0]}><Profile points={[[0,4.2],[64.6,4.2],[70,3.7],[82,2.5],[90,2.5],[95,.8],[98.3,0]]} color="#b8682f" mode={mode}/><Cylinder y={76} height={20} radius={2.52} color="#efefed" mode={mode}/>{[-6.1,6.1].map(x=><group key={x} position={[x,0,0]}><Profile points={[[0,1.85],[50,1.85],[54,0]]} color="#ededeb" mode={mode}/></group>)}<EngineRing y={-.5} radius={4.2} count={4} mode={mode}/></group>;
}

function Vehicle({ id, mode, height, diameter }: { id: string; mode: CadMode; height: number; diameter: number }) {
  if (id === 'starship') return <StarshipProfile mode={mode} />;
  if (id === 'falcon9') return <Falcon9Profile mode={mode}/>;
  if (id === 'falconheavy') return <Falcon9Profile mode={mode} heavy/>;
  if (id === 'sls') return <SlsProfile mode={mode} />;
  if (id === 'shuttle') return <Shuttle mode={mode} />;
  if (id === 'electron') return <ElectronProfile mode={mode} />;
  if (id === 'saturnv') return <SaturnProfile mode={mode} />;
  if (id === 'dragon') return <group position={[0,-.8,0]}><Cylinder y={0} height={1.2} radius={1.05} color="#dedede" mode={mode}/><mesh position={[0,1.1,0]}><coneGeometry args={[1.05,.95,48]}/><meshStandardMaterial color="#dedede" wireframe={mode==='wireframe'} /></mesh></group>;
  return <group scale={[Math.max(.45,diameter/3.7),Math.max(.45,height/70),Math.max(.45,diameter/3.7)]}><Core mode={mode} /></group>;
}

export function VehicleScene({ vehicleId, mode, height = 70, diameter = 3.7 }: { vehicleId: string; mode: CadMode; height?: number; diameter?: number }) {
  return (
    <div className="scene scene--vehicle" role="img" aria-label={`${vehicleId} procedural exterior visualization in ${mode} mode. Drag to rotate and scroll to zoom.`}>
      <Canvas shadows camera={{ position: [8.2, 2.2, 10.5], fov: 38 }} dpr={[.75,1.5]} gl={{ antialias: true, powerPreference: 'high-performance', localClippingEnabled: true }}>
        <color attach="background" args={['#090a0b']} />
        <fog attach="fog" args={['#090a0b', 18, 32]} />
        <ambientLight intensity={0.75} />
        <directionalLight position={[5,8,7]} intensity={3.2} castShadow shadow-mapSize={[2048,2048]} />
        <directionalLight position={[-5,1,-3]} intensity={1.1} color="#8295aa" />
        <Suspense fallback={null}><Vehicle id={vehicleId} mode={mode} height={height} diameter={diameter} /></Suspense>
        <Grid args={[30,30]} position={[0,-3.8,0]} cellSize={.5} cellThickness={.45} cellColor="#373b40" sectionSize={5} sectionThickness={.85} sectionColor="#5b6066" fadeDistance={24} infiniteGrid />
        <OrbitControls target={[0,0.5,0]} minDistance={5} maxDistance={28} />
      </Canvas>
      <div className="scene__axis">Y ↑ <span>X ↗</span></div>
    </div>
  );
}
