import { Camera, Gauge, Pause, Play, RotateCcw, StepForward } from 'lucide-react';
import { useEffect, useRef } from 'react';
import { selectCurrentRun, useAscentStore } from '../app/store';
import { SimulationScene } from '../rendering/SimulationScene';
import { EmptyState, Metric, Panel } from '../ui/Panel';
import { formatDuration, formatNumber, telemetryIndex } from '../ui/format';

export function SimulationWorkspace() {
  const run = useAscentStore(selectCurrentRun);
  const { running, progress, cancel, playbackTime, setPlaybackTime, playing, setPlaying, playbackRate, setPlaybackRate, setWorkspace } = useAscentStore();
  const frame = useRef<number | null>(null);
  const last = useRef<number | null>(null);
  useEffect(() => {
    if (!playing || !run) return;
    const tick = (now: number) => {
      if (last.current === null) last.current = now;
      const delta = ((now - last.current) / 1000) * playbackRate;
      last.current = now;
      const next = playbackTime + delta;
      if (next >= run.summary.duration_s) { setPlaybackTime(run.summary.duration_s); setPlaying(false); last.current = null; return; }
      setPlaybackTime(next);
      frame.current = requestAnimationFrame(tick);
    };
    frame.current = requestAnimationFrame(tick);
    return () => { if (frame.current !== null) cancelAnimationFrame(frame.current); last.current = null; };
  }, [playing, playbackRate, playbackTime, run, setPlaybackTime, setPlaying]);

  if (running) return <div className="workspace workspace--centered"><div className="run-progress"><Gauge size={34} /><span className="eyebrow">Numerical worker</span><h1>Integrating trajectory</h1><strong>{Math.round(progress*100)}%</strong><progress value={progress} max={1} /><button className="button" onClick={cancel}>Cancel run</button></div></div>;
  if (!run) return <div className="workspace workspace--centered"><EmptyState title="No simulation selected" description="Configure a complete synthetic preset in Mission Planning, then execute a numerical run." action={<button className="button button--primary" onClick={() => setWorkspace('plan')}>Open Mission Planning</button>} /></div>;
  const index = telemetryIndex(run.telemetry.t, playbackTime);
  const eventsBefore = run.events.filter((event) => event.time_s <= playbackTime);
  const activeStage = eventsBefore.filter((event) => event.type === 'stage-separation').length + 1;
  return <div className="workspace workspace--simulation">
    <aside className="workspace__side workspace__side--left">
      <Panel title="Simulation" icon={<Gauge size={15} />}><p className="status-line is-success"><span className="status-dot status-dot--ok" /> Stored numerical run</p><dl className="data-list"><div><dt>Scenario</dt><dd>{run.input.scenario}</dd></div><div><dt>Body</dt><dd>{run.input.bodyId}</dd></div><div><dt>Solver</dt><dd>{run.solverVersion}</dd></div><div><dt>Samples</dt><dd>{run.summary.samples.toLocaleString()}</dd></div></dl></Panel>
      <Panel title="Flight state"><Metric label="Elapsed time" value={formatDuration(playbackTime)} large /><Metric label="Altitude" value={formatNumber(run.telemetry.altitude[index]/1000,2)} unit="km" large /><Metric label="Speed" value={formatNumber(run.telemetry.speed[index],1)} unit="m/s" large /><Metric label="Mass" value={formatNumber(run.telemetry.mass[index],1)} unit="kg" /><Metric label="Active stage" value={run.input.scenario==='vertical' ? activeStage : 'N/A'} /></Panel>
    </aside>
    <main className="workspace__viewport simulation-viewport"><SimulationScene run={run} time={playbackTime} /><div className="simulation-overlay"><span className="eyebrow">{run.input.name}</span><strong>{formatDuration(playbackTime)}</strong><small>Actual saved run playback</small></div><div className="camera-strip"><button><Camera size={14} /> Follow</button><button>Orbit</button><button>Free</button></div></main>
    <aside className="workspace__side workspace__side--right">
      <Panel title="Telemetry"><dl className="data-list data-list--telemetry"><div><dt>Acceleration</dt><dd>{formatNumber(run.telemetry.acceleration[index]/9.80665,2)} g</dd></div><div><dt>Dynamic pressure</dt><dd>{formatNumber(run.telemetry.q[index]/1000,2)} kPa</dd></div><div><dt>Thrust</dt><dd>{formatNumber(run.telemetry.thrust[index]/1000,1)} kN</dd></div><div><dt>Drag</dt><dd>{formatNumber(run.telemetry.drag[index]/1000,2)} kN</dd></div><div><dt>Density</dt><dd>{run.telemetry.density[index].toExponential(3)} kg/m³</dd></div><div><dt>Gravity</dt><dd>{formatNumber(run.telemetry.gravity[index],4)} m/s²</dd></div></dl></Panel>
      <Panel title="Calculated events"><div className="event-list">{run.events.map((event) => <button key={`${event.type}-${event.time_s}`} className={event.time_s <= playbackTime ? 'is-past' : ''} onClick={() => setPlaybackTime(event.time_s)}><span /><time>{formatDuration(event.time_s).replace('T+ ','')}</time><strong>{event.label}</strong></button>)}</div></Panel>
    </aside>
    <div className="playback-bar"><div className="playback-buttons"><button className="icon-button icon-button--large" onClick={() => setPlaying(!playing)} aria-label={playing?'Pause':'Play'}>{playing?<Pause size={18}/>:<Play size={18}/>}</button><button className="icon-button icon-button--large" onClick={() => {setPlaying(false);setPlaybackTime(0);}} aria-label="Restart"><RotateCcw size={17}/></button><button className="icon-button icon-button--large" onClick={() => setPlaybackTime(Math.min(run.summary.duration_s, playbackTime + run.input.outputInterval_s))} aria-label="Step one output sample"><StepForward size={17}/></button></div><input className="timeline-range" type="range" min="0" max={run.summary.duration_s} step={run.input.outputInterval_s} value={playbackTime} onChange={(event)=>setPlaybackTime(Number(event.target.value))} aria-label="Playback timeline"/><select value={playbackRate} onChange={(event)=>setPlaybackRate(Number(event.target.value))} aria-label="Playback speed">{[.25,1,5,10,100].map(rate=><option key={rate} value={rate}>{rate}×</option>)}</select><button className="button" onClick={()=>setWorkspace('analysis')}>Analyze run</button></div>
  </div>;
}
