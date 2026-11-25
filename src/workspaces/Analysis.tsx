import { Download, FileJson, Orbit, Table2 } from 'lucide-react';
import { selectCurrentRun, useAscentStore } from '../app/store';
import { getBody } from '../data/catalog';
import { orbitalElements } from '../physics/orbital';
import { PlanetScene } from '../rendering/PlanetScene';
import { EmptyState, Panel } from '../ui/Panel';
import { pairs, TelemetryChart } from '../ui/TelemetryChart';
import { downloadFile, formatNumber } from '../ui/format';

function exportCsv(run: NonNullable<ReturnType<typeof selectCurrentRun>>) {
  const columns = ['time_s','position_x_m','position_y_m','position_z_m','velocity_x_mps','velocity_y_mps','velocity_z_mps','altitude_m','speed_mps','mass_kg','thrust_N','density_kgm3','q_Pa','drag_N','acceleration_mps2'];
  const rows = [columns.join(',')];
  for (let i=0;i<run.telemetry.t.length;i+=1) rows.push([
    run.telemetry.t[i],run.telemetry.positionX[i],run.telemetry.positionY[i],run.telemetry.positionZ[i],run.telemetry.velocityX[i],run.telemetry.velocityY[i],run.telemetry.velocityZ[i],run.telemetry.altitude[i],run.telemetry.speed[i],run.telemetry.mass[i],run.telemetry.thrust[i],run.telemetry.density[i],run.telemetry.q[i],run.telemetry.drag[i],run.telemetry.acceleration[i],
  ].join(','));
  downloadFile(`${run.id}.csv`, rows.join('\n'), 'text/csv');
}

function exportJson(run: NonNullable<ReturnType<typeof selectCurrentRun>>) {
  const serializable = { ...run, telemetry: Object.fromEntries(Object.entries(run.telemetry).map(([key,value])=>[key,Array.from(value)])) };
  downloadFile(`${run.id}.json`, JSON.stringify(serializable,null,2), 'application/json');
}

export function Analysis() {
  const run = useAscentStore(selectCurrentRun);
  const { runs, selectRun, setWorkspace } = useAscentStore();
  if (!run) return <div className="workspace workspace--centered"><EmptyState title="Analysis requires a run" description="Numerical charts and orbital elements are generated only from stored simulation output." action={<button className="button button--primary" onClick={()=>setWorkspace('plan')}>Run a scenario</button>} /></div>;
  const last = run.telemetry.t.length-1;
  const body = getBody(run.input.bodyId);
  const elements = orbitalElements(
    [run.telemetry.positionX[last],run.telemetry.positionY[last],run.telemetry.positionZ[last]],
    [run.telemetry.velocityX[last],run.telemetry.velocityY[last],run.telemetry.velocityZ[last]],
    body.mu_m3s2,body.radius_m,
  );
  return <div className="workspace workspace--analysis">
    <aside className="workspace__side workspace__side--left"><Panel title="Run selector"><label className="field"><span>Stored run</span><select value={run.id} onChange={(event)=>selectRun(event.target.value)}>{runs.map(candidate=><option key={candidate.id} value={candidate.id}>{candidate.input.name} · {new Date(candidate.createdAt).toLocaleTimeString()}</option>)}</select></label></Panel><Panel title="Model assumptions"><ul className="compact-list">{run.assumptions.map(item=><li key={item}>{item}</li>)}</ul><p className="notice">Status: not validated against measured flight.</p></Panel><Panel title="Exports"><button className="action-row" onClick={()=>exportCsv(run)}><Table2 size={17}/><span><strong>Full CSV</strong><small>All stored telemetry samples</small></span></button><button className="action-row" onClick={()=>exportJson(run)}><FileJson size={17}/><span><strong>Run JSON</strong><small>Inputs, events and arrays</small></span></button></Panel></aside>
    <main className="analysis-main"><div className="analysis-orbit"><PlanetScene bodyId={run.input.bodyId} trajectory /><div className="viewport-heading"><span className="eyebrow">Analysis · {run.input.scenario}</span><h1>{elements.classification.toUpperCase()}</h1><p>Final-state osculating elements · run-derived</p></div></div><div className="analysis-charts"><TelemetryChart title="Altitude" unit="km" series={[{name:'Altitude',data:pairs(run.telemetry.t,run.telemetry.altitude,1000)}]} /><TelemetryChart title="Speed" unit="km/s" series={[{name:'Speed',data:pairs(run.telemetry.t,run.telemetry.speed,1000)}]} /><TelemetryChart title="Dynamic pressure" unit="kPa" series={[{name:'q',data:pairs(run.telemetry.t,run.telemetry.q,1000)}]} /></div></main>
    <aside className="workspace__side workspace__side--right"><Panel title="Key results"><dl className="data-list"><div><dt>Peak altitude</dt><dd>{formatNumber(run.summary.peakAltitude_m/1000,2)} km</dd></div><div><dt>Peak speed</dt><dd>{formatNumber(run.summary.peakSpeed_mps/1000,3)} km/s</dd></div><div><dt>Max sampled q</dt><dd>{formatNumber(run.summary.maxQ_Pa/1000,2)} kPa</dd></div><div><dt>Final mass</dt><dd>{formatNumber(run.summary.finalMass_kg,1)} kg</dd></div><div><dt>Termination</dt><dd>{run.summary.termination}</dd></div></dl></Panel><Panel title="Orbital elements" icon={<Orbit size={15}/>}><dl className="data-list"><div><dt>Eccentricity</dt><dd>{formatNumber(elements.eccentricity,8)}</dd></div><div><dt>Specific energy</dt><dd>{formatNumber(elements.specificEnergy_Jkg/1e6,4)} MJ/kg</dd></div><div><dt>Periapsis altitude</dt><dd>{elements.periapsis_m===null?'N/A':`${formatNumber((elements.periapsis_m-body.radius_m)/1000,2)} km`}</dd></div><div><dt>Apoapsis altitude</dt><dd>{elements.apoapsis_m===null?'N/A':`${formatNumber((elements.apoapsis_m-body.radius_m)/1000,2)} km`}</dd></div><div><dt>Period</dt><dd>{elements.period_s===null?'N/A':`${formatNumber(elements.period_s/60,2)} min`}</dd></div></dl></Panel><Panel title="Validation"><p className="status-line"><span className="status-dot status-dot--ok"/>Analytical fixture suite available</p><p className="status-line"><span className="status-dot"/>Measured flight comparison unavailable</p><button className="button" onClick={()=>setWorkspace('documentation')}><Download size={15}/>View actual test report</button></Panel></aside>
  </div>;
}
