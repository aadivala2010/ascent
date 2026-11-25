import type { BodyDefinition } from '../types';

export interface AtmosphereState {
  density: number;
  pressure: number;
  temperature: number | null;
  soundSpeed: number | null;
  status: string;
}

const layerBases = [0, 11000, 20000, 32000, 47000, 51000, 71000, 84852];
const lapseRates = [-0.0065, 0, 0.001, 0.0028, 0, -0.0028, -0.002];
const earthRadiusGeopotential = 6_356_766;
const gasConstant = 287.05287;
const standardGravity = 9.80665;

const layerStates = (() => {
  const result = [{ temperature: 288.15, pressure: 101325 }];
  for (let index = 0; index < lapseRates.length; index += 1) {
    const base = result[index];
    const delta = layerBases[index + 1] - layerBases[index];
    const lapse = lapseRates[index];
    const temperature = base.temperature + lapse * delta;
    const pressure = lapse === 0
      ? base.pressure * Math.exp((-standardGravity * delta) / (gasConstant * base.temperature))
      : base.pressure * (base.temperature / temperature) ** (standardGravity / (gasConstant * lapse));
    result.push({ temperature, pressure });
  }
  return result;
})();

export function earthLayeredAtmosphere(altitude_m: number): AtmosphereState {
  if (!Number.isFinite(altitude_m)) throw new Error('Atmosphere altitude must be finite.');
  const h = Math.max(0, altitude_m);
  const geopotential = (earthRadiusGeopotential * h) / (earthRadiusGeopotential + h);
  if (geopotential > layerBases.at(-1)!) {
    return { density: 0, pressure: 0, temperature: null, soundSpeed: null, status: 'outside lower atmosphere model' };
  }
  let index = lapseRates.length - 1;
  for (let candidate = 0; candidate < lapseRates.length; candidate += 1) {
    if (geopotential < layerBases[candidate + 1]) { index = candidate; break; }
  }
  const base = layerStates[index];
  const delta = geopotential - layerBases[index];
  const lapse = lapseRates[index];
  const temperature = base.temperature + lapse * delta;
  const pressure = lapse === 0
    ? base.pressure * Math.exp((-standardGravity * delta) / (gasConstant * base.temperature))
    : base.pressure * (base.temperature / temperature) ** (standardGravity / (gasConstant * lapse));
  const density = pressure / (gasConstant * temperature);
  return { density, pressure, temperature, soundSpeed: Math.sqrt(1.4 * gasConstant * temperature), status: 'lower-atmosphere approximation' };
}

export function atmosphere(body: BodyDefinition, altitude_m: number, model: 'layered' | 'exponential' | 'vacuum'): AtmosphereState {
  if (model === 'vacuum' || body.id === 'moon') return { density: 0, pressure: 0, temperature: null, soundSpeed: null, status: 'vacuum' };
  if (body.id === 'earth' && model === 'layered') return earthLayeredAtmosphere(altitude_m);
  const ceiling = body.id === 'earth' ? 150_000 : 100_000;
  if (altitude_m > ceiling || body.scaleHeight_m === null) {
    return { density: 0, pressure: 0, temperature: null, soundSpeed: null, status: 'educational atmosphere truncated' };
  }
  const exponent = Math.exp(-Math.max(0, altitude_m) / body.scaleHeight_m);
  const temperature = body.id === 'mars' ? 210 : null;
  return {
    density: body.density0_kgm3 * exponent,
    pressure: body.pressure0_Pa * exponent,
    temperature,
    soundSpeed: body.id === 'mars' ? Math.sqrt(1.29 * 188.92 * 210) : null,
    status: 'exponential educational approximation',
  };
}
