import { create } from 'zustand';
import { db } from '../storage/database';
import { getPreset } from '../data/catalog';
import type {
  BodyId, ProjectRecord, ScenarioId, SimulationConfig, SimulationRun, SyntheticPreset, WorkspaceId,
} from '../types';

interface AscentState {
  initialized: boolean;
  workspace: WorkspaceId;
  theme: 'dark' | 'light';
  bodyId: BodyId;
  scenario: ScenarioId;
  selectedVisualId: string;
  activeVehicle: SyntheticPreset;
  projects: ProjectRecord[];
  activeProjectId: string | null;
  runs: SimulationRun[];
  currentRunId: string | null;
  running: boolean;
  progress: number;
  error: string | null;
  playbackTime: number;
  playing: boolean;
  playbackRate: number;
  worker: Worker | null;
  initialize: () => Promise<void>;
  setWorkspace: (workspace: WorkspaceId) => void;
  setTheme: (theme: 'dark' | 'light') => void;
  setBody: (bodyId: BodyId) => void;
  setScenario: (scenario: ScenarioId) => void;
  selectVisual: (id: string) => void;
  selectPreset: (id: string) => void;
  patchVehicle: (patch: Partial<SyntheticPreset>) => void;
  createProject: () => Promise<void>;
  duplicateProject: (id: string) => Promise<void>;
  deleteProject: (id: string) => Promise<void>;
  openProject: (id: string) => void;
  execute: (overrides?: Partial<SimulationConfig>) => void;
  cancel: () => void;
  selectRun: (id: string) => void;
  setPlaybackTime: (time: number) => void;
  setPlaying: (playing: boolean) => void;
  setPlaybackRate: (rate: number) => void;
  clearError: () => void;
}

let didInitialize = false;
const now = () => new Date().toISOString();
const makeProject = (name: string): ProjectRecord => ({
  schemaVersion: 1,
  id: crypto.randomUUID(),
  name,
  createdAt: now(),
  updatedAt: now(),
  bodyId: 'earth',
  vehicleId: 'trainer',
  scenario: 'vertical',
  runIds: [],
  notes: '',
});

export const useAscentStore = create<AscentState>((set, get) => ({
  initialized: false,
  workspace: 'control',
  theme: (localStorage.getItem('ascent-theme') === 'light' ? 'light' : 'dark'),
  bodyId: 'earth',
  scenario: 'vertical',
  selectedVisualId: 'falcon9',
  activeVehicle: getPreset('trainer'),
  projects: [],
  activeProjectId: null,
  runs: [],
  currentRunId: null,
  running: false,
  progress: 0,
  error: null,
  playbackTime: 0,
  playing: false,
  playbackRate: 1,
  worker: null,

  initialize: async () => {
    if (didInitialize) return;
    didInitialize = true;
    let projects = await db.projects.orderBy('updatedAt').reverse().toArray();
    if (projects.length === 0) {
      const project = makeProject('First ASCENT Project');
      await db.projects.add(project);
      projects = [project];
    }
    const runs = await db.runs.orderBy('createdAt').reverse().toArray();
    const active = projects[0];
    set({
      initialized: true, projects, runs, activeProjectId: active.id, bodyId: active.bodyId,
      scenario: active.scenario, activeVehicle: getPreset(active.vehicleId), currentRunId: runs[0]?.id ?? null,
    });
  },
  setWorkspace: (workspace) => set({ workspace }),
  setTheme: (theme) => { localStorage.setItem('ascent-theme', theme); set({ theme }); },
  setBody: (bodyId) => set({ bodyId }),
  setScenario: (scenario) => set({ scenario }),
  selectVisual: (selectedVisualId) => set({ selectedVisualId }),
  selectPreset: (id) => set({ activeVehicle: getPreset(id), selectedVisualId: id, scenario: getPreset(id).defaultScenario }),
  patchVehicle: (patch) => set((state) => ({
    activeVehicle: { ...state.activeVehicle, ...patch, id: state.activeVehicle.id.startsWith('custom-') ? state.activeVehicle.id : `custom-${crypto.randomUUID()}`, status: 'synthetic educational; user-edited' },
    selectedVisualId: 'custom',
  })),
  createProject: async () => {
    const project = makeProject(`ASCENT Project ${get().projects.length + 1}`);
    await db.projects.add(project);
    set((state) => ({ projects: [project, ...state.projects], activeProjectId: project.id, bodyId: 'earth', scenario: 'vertical', activeVehicle: getPreset('trainer') }));
  },
  duplicateProject: async (id) => {
    const source = get().projects.find((project) => project.id === id);
    if (!source) return;
    const copy: ProjectRecord = { ...structuredClone(source), id: crypto.randomUUID(), name: `${source.name} — Copy`, createdAt: now(), updatedAt: now(), runIds: [...source.runIds] };
    await db.projects.add(copy);
    set((state) => ({ projects: [copy, ...state.projects], activeProjectId: copy.id }));
  },
  deleteProject: async (id) => {
    const state = get();
    if (state.projects.length <= 1) { set({ error: 'At least one local project must remain.' }); return; }
    await db.projects.delete(id);
    const projects = state.projects.filter((project) => project.id !== id);
    set({ projects, activeProjectId: state.activeProjectId === id ? projects[0].id : state.activeProjectId });
  },
  openProject: (id) => {
    const project = get().projects.find((candidate) => candidate.id === id);
    if (!project) return;
    set({ activeProjectId: id, bodyId: project.bodyId, scenario: project.scenario, activeVehicle: getPreset(project.vehicleId), workspace: 'control' });
  },
  execute: (overrides = {}) => {
    const state = get();
    if (state.running) return;
    const id = crypto.randomUUID();
    const config: SimulationConfig = {
      id,
      name: `${state.activeVehicle.name} — ${state.scenario === 'vertical' ? 'vertical flight' : 'circular orbit'}`,
      bodyId: state.bodyId,
      scenario: state.scenario,
      vehicle: structuredClone(state.activeVehicle),
      duration_s: state.scenario === 'circular-orbit' ? 6000 : 240,
      dt_s: state.scenario === 'circular-orbit' ? 1 : 0.1,
      outputInterval_s: state.scenario === 'circular-orbit' ? 5 : 0.5,
      atmosphere: state.bodyId === 'moon' ? 'vacuum' : state.bodyId === 'earth' ? 'layered' : 'exponential',
      initialAltitude_m: state.scenario === 'circular-orbit' ? 400_000 : 0,
      ...overrides,
    };
    const worker = new Worker(new URL('../simulation/worker.ts', import.meta.url), { type: 'module' });
    worker.onmessage = async (event: MessageEvent<{ type: string; fraction?: number; run?: SimulationRun; error?: { message: string } }>) => {
      if (event.data.type === 'progress') { set({ progress: event.data.fraction ?? 0 }); return; }
      if (event.data.type === 'error') {
        set({ running: false, worker: null, error: event.data.error?.message ?? 'Simulation failed.' });
        worker.terminate();
        return;
      }
      if (event.data.type === 'result' && event.data.run) {
        const run = event.data.run;
        await db.runs.put(run);
        const current = get();
        const project = current.projects.find((candidate) => candidate.id === current.activeProjectId);
        let projects = current.projects;
        if (project) {
          const updated: ProjectRecord = {
            ...project, updatedAt: now(), bodyId: config.bodyId, scenario: config.scenario,
            vehicleId: ['trainer', 'two-stage', 'orbital-test'].includes(config.vehicle.id) ? config.vehicle.id : 'trainer',
            runIds: [run.id, ...project.runIds],
          };
          await db.projects.put(updated);
          projects = projects.map((candidate) => candidate.id === updated.id ? updated : candidate);
        }
        set((latest) => ({
          runs: [run, ...latest.runs], currentRunId: run.id, running: false, worker: null, progress: 1,
          playbackTime: 0, playing: false, projects, workspace: 'simulation',
        }));
        worker.terminate();
      }
    };
    worker.onerror = (event) => { set({ running: false, worker: null, error: event.message || 'Simulation worker failed.' }); worker.terminate(); };
    set({ running: true, progress: 0, error: null, worker, workspace: 'simulation' });
    worker.postMessage({ type: 'run', config });
  },
  cancel: () => { const worker = get().worker; if (worker) { worker.postMessage({ type: 'cancel' }); set({ error: 'Cancelling simulation…' }); } },
  selectRun: (currentRunId) => set({ currentRunId, playbackTime: 0, playing: false }),
  setPlaybackTime: (playbackTime) => set({ playbackTime }),
  setPlaying: (playing) => set({ playing }),
  setPlaybackRate: (playbackRate) => set({ playbackRate }),
  clearError: () => set({ error: null }),
}));

export const selectCurrentRun = (state: AscentState) => state.runs.find((run) => run.id === state.currentRunId) ?? null;
