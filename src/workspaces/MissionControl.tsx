import { Copy, FolderOpen, Plus, Rocket, Trash2 } from 'lucide-react';
import { bodies } from '../data/catalog';
import { useAscentStore } from '../app/store';
import { PlanetScene } from '../rendering/PlanetScene';
import { Panel } from '../ui/Panel';
import { formatNumber } from '../ui/format';

export function MissionControl() {
  const { bodyId, setBody, projects, activeProjectId, createProject, duplicateProject, deleteProject, openProject, runs, setWorkspace } = useAscentStore();
  const body = bodies.find((candidate) => candidate.id === bodyId)!;
  const bodyRuns = runs.filter((run) => run.input.bodyId === bodyId);
  return (
    <div className="workspace workspace--control">
      <aside className="workspace__side workspace__side--left">
        <Panel title="Projects" icon={<FolderOpen size={15} />} actions={<button className="icon-button" onClick={() => void createProject()} aria-label="Create project"><Plus size={16} /></button>}>
          <div className="project-list">
            {projects.map((project) => <div className={`project-row ${activeProjectId === project.id ? 'is-active' : ''}`} key={project.id}>
              <button className="project-row__open" onClick={() => openProject(project.id)}><FolderOpen size={16} /><span><strong>{project.name}</strong><small>{project.runIds.length} run{project.runIds.length === 1 ? '' : 's'} · {project.bodyId}</small></span></button>
              <button className="icon-button icon-button--small" onClick={() => void duplicateProject(project.id)} aria-label={`Duplicate ${project.name}`}><Copy size={13} /></button>
              <button className="icon-button icon-button--small" onClick={() => void deleteProject(project.id)} aria-label={`Delete ${project.name}`}><Trash2 size={13} /></button>
            </div>)}
          </div>
        </Panel>
        <Panel title="Saved runs" icon={<Rocket size={15} />}>
          {runs.length === 0 ? <p className="muted-copy">No numerical runs yet. Configure a synthetic vehicle and run a scenario.</p> : runs.slice(0, 4).map((run) => <button key={run.id} className="list-button" onClick={() => { useAscentStore.getState().selectRun(run.id); setWorkspace('analysis'); }}><span>{run.input.name}</span><small>{run.summary.samples} samples</small></button>)}
        </Panel>
      </aside>
      <main className="workspace__viewport">
        <PlanetScene bodyId={bodyId} trajectory={bodyRuns.length > 0} />
        <div className="viewport-heading"><span className="eyebrow">Mission Control</span><h1>{bodyId.toUpperCase()} SYSTEM</h1><p>{bodyRuns.length ? `${bodyRuns.length} saved numerical trajectory ${bodyRuns.length === 1 ? 'run' : 'runs'}` : 'No saved trajectory for this body'}</p></div>
        <div className="body-switch" role="group" aria-label="Select central body">
          {bodies.map((candidate) => <button key={candidate.id} className={candidate.id === bodyId ? 'is-active' : ''} onClick={() => setBody(candidate.id)}>{candidate.id}</button>)}
        </div>
      </main>
      <aside className="workspace__side workspace__side--right">
        <Panel title={`${body.id} overview`}>
          <dl className="data-list"><div><dt>Radius</dt><dd>{formatNumber(body.radius_m / 1000, 1)} km</dd></div><div><dt>μ (GM)</dt><dd>{body.mu_m3s2.toExponential(4)} m³/s²</dd></div><div><dt>Rotation</dt><dd>{body.omega_rad_s.toExponential(4)} rad/s</dd></div><div><dt>Sea-level density</dt><dd>{formatNumber(body.density0_kgm3, 3)} kg/m³</dd></div></dl>
          {body.muNote && <p className="notice">{body.muNote}</p>}
        </Panel>
        <Panel title="Quick actions">
          <button className="action-row" onClick={() => setWorkspace('vehicle')}><Rocket size={18} /><span><strong>Design vehicle</strong><small>Catalog and synthetic models</small></span></button>
          <button className="action-row" onClick={() => setWorkspace('plan')}><span className="action-glyph">◎</span><span><strong>Plan scenario</strong><small>Body-local educational physics</small></span></button>
          <button className="action-row" onClick={() => setWorkspace('laboratory')}><span className="action-glyph">∑</span><span><strong>Open laboratory</strong><small>Equations and calculators</small></span></button>
        </Panel>
        <Panel title="Data status"><p className="status-line"><span className="status-dot status-dot--ok" /> Authoritative body constants loaded</p><p className="status-line"><span className="status-dot" /> No external live data connected</p></Panel>
      </aside>
    </div>
  );
}
