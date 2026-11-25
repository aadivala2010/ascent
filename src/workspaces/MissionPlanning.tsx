import { CirclePlay, Orbit, Rocket } from 'lucide-react';
import { useMemo, useState } from 'react';
import { useAscentStore } from '../app/store';
import { bodies } from '../data/catalog';
import { circularVelocity, escapeVelocity } from '../physics/orbital';
import { PlanetScene } from '../rendering/PlanetScene';
import { Panel, Metric } from '../ui/Panel';
import { formatNumber } from '../ui/format';

export function MissionPlanning() {
  const { bodyId, setBody, scenario, setScenario, activeVehicle, execute, running, progress } = useAscentStore();
  const [duration, setDuration] = useState(scenario === 'circular-orbit' ? 6000 : 240);
  const [step, setStep] = useState(scenario === 'circular-orbit' ? 1 : .1);
  const [altitude, setAltitude] = useState(400);
  const body = bodies.find((candidate) => candidate.id === bodyId)!;
  const orbit = useMemo(() => {
    const radius = body.radius_m + altitude * 1000;
    return { circular: circularVelocity(body.mu_m3s2, radius), escape: escapeVelocity(body.mu_m3s2, radius) };
  }, [body, altitude]);
  const start = () => execute({ duration_s: duration, dt_s: step, outputInterval_s: scenario === 'circular-orbit' ? 5 : .5, initialAltitude_m: scenario === 'circular-orbit' ? altitude * 1000 : 0 });
  return <div className="workspace workspace--plan">
    <aside className="workspace__side workspace__side--left">
      <Panel title="Scenario configuration" icon={<Orbit size={15} />}>
        <label className="field"><span>Central body</span><select value={bodyId} onChange={(event) => setBody(event.target.value as typeof bodyId)}>{bodies.map((candidate) => <option key={candidate.id} value={candidate.id}>{candidate.id}</option>)}</select></label>
        <label className="field"><span>Scenario</span><select value={scenario} onChange={(event) => { const next = event.target.value as typeof scenario; setScenario(next); if (next === 'circular-orbit') { setDuration(6000); setStep(1); } else { setDuration(240); setStep(.1); } }}><option value="vertical">Vertical ascent / ballistic coast</option><option value="circular-orbit">Initialized circular orbit</option></select></label>
        <label className="field"><span>Duration (s)</span><input type="number" min="1" max="1000000" value={duration} onChange={(event) => setDuration(Number(event.target.value))} /></label>
        <label className="field"><span>Fixed RK4 step (s)</span><input type="number" min="0.02" max="5" step="0.02" value={step} onChange={(event) => setStep(Number(event.target.value))} /></label>
        {scenario === 'circular-orbit' && <label className="field"><span>Initial altitude (km)</span><input type="number" min="1" value={altitude} onChange={(event) => setAltitude(Number(event.target.value))} /></label>}
      </Panel>
      <Panel title="Vehicle"><div className="vehicle-summary"><Rocket size={34} /><div><strong>{activeVehicle.name}</strong><small>{activeVehicle.status}</small></div></div><dl className="data-list"><div><dt>Height</dt><dd>{activeVehicle.height_m} m</dd></div><div><dt>Payload</dt><dd>{activeVehicle.payload_kg.toLocaleString()} kg</dd></div><div><dt>Complete stages</dt><dd>{activeVehicle.stages.length}</dd></div></dl></Panel>
    </aside>
    <main className="workspace__viewport plan-viewport"><PlanetScene bodyId={bodyId} trajectory={scenario === 'circular-orbit'} /><div className="viewport-heading"><span className="eyebrow">Mission Planning</span><h1>{scenario === 'circular-orbit' ? 'BODY-LOCAL ORBIT' : 'VERTICAL FLIGHT'}</h1><p>Calculated from authoritative body constants · visual scale schematic</p></div></main>
    <aside className="workspace__side workspace__side--right">
      <Panel title="Calculated initial state"><div className="metric-grid"><Metric label="Circular speed" value={formatNumber(orbit.circular/1000,3)} unit="km/s" /><Metric label="Escape speed" value={formatNumber(orbit.escape/1000,3)} unit="km/s" /><Metric label="Radius" value={formatNumber((body.radius_m+altitude*1000)/1000,1)} unit="km" /><Metric label="Atmosphere" value={bodyId==='moon'?'vacuum':bodyId==='earth'?'layered':'exponential'} /></div></Panel>
      <Panel title="Model assumptions"><ul className="compact-list"><li>Spherical rotating central body</li><li>Point-mass vehicle, SI units, double precision</li><li>Prescribed radial thrust in vertical mode</li><li>No guidance optimization or real launch targeting</li></ul></Panel>
      <Panel title="Run numerical simulation"><p className="muted-copy">The worker will integrate the configured state and store full numerical output locally.</p><button className="button button--primary button--large" disabled={running} onClick={start}><CirclePlay size={17} />{running ? `Computing ${Math.round(progress*100)}%` : 'Run simulation'}</button>{running && <progress value={progress} max={1} />}</Panel>
    </aside>
    <div className="workspace__bottom plan-bottom"><div><span className="eyebrow">Integrator</span><strong>Fixed-step RK4 · event-aware</strong></div><div><span className="eyebrow">Output cadence</span><strong>{scenario === 'circular-orbit' ? '5.0' : '0.5'} s</strong></div><div><span className="eyebrow">Maximum</span><strong>2,000,000 steps · 200,000 points</strong></div></div>
  </div>;
}
