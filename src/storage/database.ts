import Dexie, { type EntityTable } from 'dexie';
import type { ProjectRecord, SimulationRun } from '../types';

export interface LayoutRecord {
  id: string;
  workspace: string;
  data: unknown;
  updatedAt: string;
}

export interface NotebookRecord {
  id: string;
  title: string;
  question: string;
  hypothesis: string;
  notes: string;
  conclusions: string;
  runIds: string[];
  updatedAt: string;
}

class AscentDatabase extends Dexie {
  projects!: EntityTable<ProjectRecord, 'id'>;
  runs!: EntityTable<SimulationRun, 'id'>;
  layouts!: EntityTable<LayoutRecord, 'id'>;
  notebooks!: EntityTable<NotebookRecord, 'id'>;

  constructor() {
    super('ascent-local');
    this.version(1).stores({
      projects: 'id, updatedAt, name',
      runs: 'id, createdAt, [input.bodyId+input.scenario]',
      layouts: 'id, workspace, updatedAt',
      notebooks: 'id, updatedAt',
    });
  }
}

export const db = new AscentDatabase();
