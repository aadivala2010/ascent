export type BodyId = 'earth' | 'moon' | 'mars';
export type ScenarioId = 'vertical' | 'circular-orbit';
export type WorkspaceId =
  | 'control'
  | 'vehicle'
  | 'plan'
  | 'simulation'
  | 'analysis'
  | 'comparison'
  | 'laboratory'
  | 'documentation';

export interface BodyDefinition {
  id: BodyId;
  mu_m3s2: number;
  radius_m: number;
  omega_rad_s: number;
  density0_kgm3: number;
  pressure0_Pa: number;
  scaleHeight_m: number | null;
  muNote?: string;
}

export interface StageDefinition {
  dryMass_kg: number;
  propellantMass_kg: number;
  thrustSea_N: number;
  thrustVac_N: number;
  ispSea_s: number;
  ispVac_s: number;
  dragCoefficient: number;
  visualHeightFraction: number;
}

export interface SyntheticPreset {
  id: string;
  name: string;
  height_m: number;
  diameter_m: number;
  payload_kg: number;
  stages: StageDefinition[];
  defaultScenario: ScenarioId;
  status: string;
}

export interface CatalogVehicle {
  id: string;
  name: string;
  source: string;
  publishedFacts: Record<string, string | number>;
  geometry: string;
  simulationReady: false;
  stageData: null;
  confidence: string;
}

export interface SimulationConfig {
  id: string;
  name: string;
  bodyId: BodyId;
  scenario: ScenarioId;
  vehicle: SyntheticPreset;
  duration_s: number;
  dt_s: number;
  outputInterval_s: number;
  atmosphere: 'layered' | 'exponential' | 'vacuum';
  initialAltitude_m?: number;
}

export interface SimulationEvent {
  type: 'liftoff' | 'stage-depletion' | 'stage-separation' | 'max-q' | 'impact' | 'complete';
  time_s: number;
  label: string;
  stageIndex?: number;
}

export interface TelemetryArrays {
  t: Float64Array;
  positionX: Float64Array;
  positionY: Float64Array;
  positionZ: Float64Array;
  velocityX: Float64Array;
  velocityY: Float64Array;
  velocityZ: Float64Array;
  altitude: Float64Array;
  speed: Float64Array;
  mass: Float64Array;
  thrust: Float64Array;
  density: Float64Array;
  q: Float64Array;
  drag: Float64Array;
  acceleration: Float64Array;
  gravity: Float64Array;
  orbitalEnergy: Float64Array;
}

export interface RunSummary {
  duration_s: number;
  samples: number;
  peakAltitude_m: number;
  peakSpeed_mps: number;
  maxQ_Pa: number;
  finalMass_kg: number;
  termination: string;
}

export interface SimulationRun {
  schemaVersion: 1;
  id: string;
  createdAt: string;
  solverVersion: string;
  input: SimulationConfig;
  telemetry: TelemetryArrays;
  events: SimulationEvent[];
  summary: RunSummary;
  assumptions: string[];
  sourceStatus: 'synthetic educational';
}

export interface ProjectRecord {
  schemaVersion: 1;
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
  bodyId: BodyId;
  vehicleId: string;
  scenario: ScenarioId;
  runIds: string[];
  notes: string;
}
