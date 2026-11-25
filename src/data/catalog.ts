import { z } from 'zod';
import vehiclesJson from '../../spec/vehicles.json';
import assetsJson from '../../spec/assets.json';
import validationJson from '../../spec/validation.json';
import type { BodyDefinition, CatalogVehicle, SyntheticPreset } from '../types';

const bodySchema = z.object({
  id: z.enum(['earth', 'moon', 'mars']),
  mu_m3s2: z.number().positive(),
  radius_m: z.number().positive(),
  omega_rad_s: z.number().nonnegative(),
  density0_kgm3: z.number().nonnegative(),
  pressure0_Pa: z.number().nonnegative(),
  scaleHeight_m: z.number().positive().nullable(),
  muNote: z.string().optional(),
});

const stageSchema = z.object({
  dryMass_kg: z.number().nonnegative(),
  propellantMass_kg: z.number().nonnegative(),
  thrustSea_N: z.number().nonnegative(),
  thrustVac_N: z.number().nonnegative(),
  ispSea_s: z.number().positive(),
  ispVac_s: z.number().positive(),
  dragCoefficient: z.number().nonnegative(),
  visualHeightFraction: z.number().min(0).max(1),
});

const vehicleFileSchema = z.object({
  schemaVersion: z.literal(1),
  constants: z.object({ g0_mps2: z.number().positive(), bodies: z.array(bodySchema).length(3) }),
  catalog: z.array(z.object({
    id: z.string(), name: z.string(), source: z.string().url(),
    publishedFacts: z.record(z.string(), z.union([z.string(), z.number()])),
    geometry: z.string(), simulationReady: z.literal(false), stageData: z.null(), confidence: z.string(),
  })),
  syntheticPresets: z.array(z.object({
    id: z.string(), name: z.string(), height_m: z.number().positive(), diameter_m: z.number().positive(),
    payload_kg: z.number().nonnegative(), stages: z.array(stageSchema),
    defaultScenario: z.enum(['vertical', 'circular-orbit']), status: z.string(),
  })),
  extensionBacklog: z.array(z.string()),
});

export const vehicleData = vehicleFileSchema.parse(vehiclesJson);
export const bodies = vehicleData.constants.bodies as BodyDefinition[];
export const catalog = vehicleData.catalog as CatalogVehicle[];
export const syntheticPresets = vehicleData.syntheticPresets as SyntheticPreset[];
export const g0 = vehicleData.constants.g0_mps2;
export const assetManifest = assetsJson;
export const validationFixtures = validationJson;

export function getBody(id: string): BodyDefinition {
  const body = bodies.find((candidate) => candidate.id === id);
  if (!body) throw new Error(`Unsupported body: ${id}`);
  return body;
}

export function getPreset(id: string): SyntheticPreset {
  const preset = syntheticPresets.find((candidate) => candidate.id === id);
  if (!preset) throw new Error(`Unsupported synthetic preset: ${id}`);
  return structuredClone(preset);
}
