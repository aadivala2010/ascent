import {
  Activity, BarChart3, Beaker, BookOpen, Boxes, CircleGauge, GitCompareArrows, Maximize,
  Moon, Orbit, Rocket, Settings, Sun,
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { useAscentStore } from './store';
import type { WorkspaceId } from '../types';
import { Wordmark } from '../ui/Wordmark';
import { MissionControl } from '../workspaces/MissionControl';
import { VehicleDesign } from '../workspaces/VehicleDesign';
import { MissionPlanning } from '../workspaces/MissionPlanning';
import { SimulationWorkspace } from '../workspaces/SimulationWorkspace';
import { Analysis } from '../workspaces/Analysis';
import { Comparison } from '../workspaces/Comparison';
import { Laboratory } from '../workspaces/Laboratory';
import { Documentation } from '../workspaces/Documentation';

const navigation: Array<{ id: WorkspaceId; label: string; icon: typeof Activity }> = [
  { id: 'control', label: 'Mission Control', icon: CircleGauge },
  { id: 'vehicle', label: 'Vehicle Design', icon: Rocket },
  { id: 'plan', label: 'Mission Planning', icon: Orbit },
  { id: 'simulation', label: 'Simulation', icon: Activity },
  { id: 'analysis', label: 'Analysis', icon: BarChart3 },
  { id: 'comparison', label: 'Comparison', icon: GitCompareArrows },
  { id: 'laboratory', label: 'Laboratory', icon: Beaker },
  { id: 'documentation', label: 'Documentation', icon: BookOpen },
];

function useFps() {
  const [fps, setFps] = useState(0);
  useEffect(() => {
    let frames = 0; let start = performance.now(); let frame = 0;
    const tick = (now: number) => {
      frames += 1;
      if (now - start >= 1000) { setFps(Math.round((frames * 1000) / (now - start))); frames = 0; start = now; }
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, []);
  return fps;
}

export function App() {
  const { initialize, initialized, workspace, setWorkspace, theme, setTheme, bodyId, projects, activeProjectId, runs, running, error, clearError } = useAscentStore();
  const fps = useFps();
  useEffect(() => { void initialize(); }, [initialize]);
  useEffect(() => { document.documentElement.dataset.theme = theme; }, [theme]);
  const project = useMemo(() => projects.find((candidate) => candidate.id === activeProjectId), [projects, activeProjectId]);
  const Workspace = {
    control: MissionControl, vehicle: VehicleDesign, plan: MissionPlanning, simulation: SimulationWorkspace,
    analysis: Analysis, comparison: Comparison, laboratory: Laboratory, documentation: Documentation,
  }[workspace];
  if (!initialized) return <div className="boot-screen"><Wordmark /><span>Initializing local engineering workspace…</span></div>;
  return <div className="app-shell">
    <header className="topbar">
      <button className="brand-button" onClick={() => setWorkspace('control')}><Wordmark /></button>
      <nav className="topnav" aria-label="Primary workspaces">{navigation.map(({id,label,icon:Icon})=><button key={id} className={workspace===id?'is-active':''} onClick={()=>setWorkspace(id)} aria-current={workspace===id?'page':undefined}><Icon size={17}/><span>{label}</span></button>)}</nav>
      <div className="topbar__tools"><button className="icon-button" onClick={()=>setTheme(theme==='dark'?'light':'dark')} aria-label={`Use ${theme==='dark'?'light':'dark'} theme`}>{theme==='dark'?<Sun size={17}/>:<Moon size={17}/>}</button><button className="icon-button" onClick={()=>void document.documentElement.requestFullscreen()} aria-label="Enter fullscreen"><Maximize size={16}/></button><button className="icon-button" onClick={()=>setWorkspace('documentation')} aria-label="Open settings and documentation"><Settings size={17}/></button></div>
    </header>
    <main className="app-main"><Workspace /></main>
    <footer className="statusbar"><div><span className={`status-dot ${running?'status-dot--working':'status-dot--ok'}`}/>{running?'SIMULATING':'READY'}</div><div><strong>{project?.name??'No project'}</strong></div><div>{bodyId.toUpperCase()}</div><div><Boxes size={12}/> {runs.length} stored run{runs.length===1?'':'s'}</div><div className="statusbar__spacer"/><div>GRAPHICS AUTO</div><div>{fps||'—'} FPS</div><div>LOCAL STORAGE</div></footer>
    {error&&<div className="dialog-backdrop" role="presentation" onMouseDown={clearError}><div className="dialog" role="alertdialog" aria-modal="true" aria-labelledby="error-title" onMouseDown={event=>event.stopPropagation()}><span className="eyebrow">ASCENT message</span><h2 id="error-title">Unable to continue</h2><p>{error}</p><button className="button button--primary" autoFocus onClick={clearError}>Dismiss</button></div></div>}
  </div>;
}
