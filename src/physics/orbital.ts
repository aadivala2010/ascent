import type { Vec3 } from './vector';
import { clamp, cross, dot, norm, scale, subtract } from './vector';

export interface OrbitalElements {
  specificEnergy_Jkg: number;
  angularMomentum_m2s: number;
  eccentricity: number;
  semiMajorAxis_m: number | null;
  periapsis_m: number | null;
  apoapsis_m: number | null;
  period_s: number | null;
  inclination_rad: number | null;
  classification: string;
}

export const circularVelocity = (mu: number, radius: number): number => Math.sqrt(mu / radius);
export const escapeVelocity = (mu: number, radius: number): number => Math.sqrt((2 * mu) / radius);
export const idealDeltaV = (initialMass_kg: number, finalMass_kg: number, isp_s: number, g0 = 9.80665): number => {
  if (![initialMass_kg, finalMass_kg, isp_s].every(Number.isFinite) || initialMass_kg <= finalMass_kg || finalMass_kg <= 0 || isp_s <= 0) {
    throw new Error('Ideal delta-v requires finite positive mass and Isp, with initial mass greater than final mass.');
  }
  return isp_s * g0 * Math.log(initialMass_kg / finalMass_kg);
};

export function orbitalElements(position: Vec3, velocity: Vec3, mu: number, bodyRadius = 0): OrbitalElements {
  const radius = norm(position);
  const speed2 = dot(velocity, velocity);
  if (!Number.isFinite(mu) || mu <= 0 || radius <= 0) throw new Error('Orbital state requires positive radius and gravitational parameter.');
  const angular = cross(position, velocity);
  const angularMagnitude = norm(angular);
  const energy = speed2 / 2 - mu / radius;
  const eccentricityVector = subtract(scale(cross(velocity, angular), 1 / mu), scale(position, 1 / radius));
  const eccentricity = norm(eccentricityVector);
  const parabolicTolerance = 1e-10 * (mu / radius);
  const semiMajorAxis = Math.abs(energy) <= parabolicTolerance ? null : -mu / (2 * energy);
  const periapsis = semiMajorAxis === null ? null : semiMajorAxis * (1 - eccentricity);
  const apoapsis = semiMajorAxis !== null && energy < 0 && eccentricity < 1 ? semiMajorAxis * (1 + eccentricity) : null;
  const period = semiMajorAxis !== null && semiMajorAxis > 0 && eccentricity < 1 && (periapsis ?? 0) > bodyRadius
    ? 2 * Math.PI * Math.sqrt(semiMajorAxis ** 3 / mu)
    : null;
  const inclination = angularMagnitude > 1e-12 ? Math.acos(clamp(angular[2] / angularMagnitude, -1, 1)) : null;
  const classification = periapsis !== null && periapsis <= bodyRadius
    ? 'surface-intersecting'
    : energy > 0 ? 'escape' : eccentricity < 1 ? 'bound orbit' : 'parabolic';
  return {
    specificEnergy_Jkg: energy,
    angularMomentum_m2s: angularMagnitude,
    eccentricity,
    semiMajorAxis_m: semiMajorAxis,
    periapsis_m: periapsis,
    apoapsis_m: apoapsis,
    period_s: period,
    inclination_rad: inclination,
    classification,
  };
}

export function hohmannTransfer(mu: number, initialRadius_m: number, finalRadius_m: number) {
  if (![mu, initialRadius_m, finalRadius_m].every(Number.isFinite) || Math.min(mu, initialRadius_m, finalRadius_m) <= 0) {
    throw new Error('Hohmann transfer requires finite positive inputs.');
  }
  const transferAxis = (initialRadius_m + finalRadius_m) / 2;
  const first = Math.sqrt(mu * (2 / initialRadius_m - 1 / transferAxis)) - Math.sqrt(mu / initialRadius_m);
  const second = Math.sqrt(mu / finalRadius_m) - Math.sqrt(mu * (2 / finalRadius_m - 1 / transferAxis));
  return {
    deltaV1_mps: first,
    deltaV2_mps: second,
    totalDeltaV_mps: Math.abs(first) + Math.abs(second),
    transferTime_s: Math.PI * Math.sqrt(transferAxis ** 3 / mu),
  };
}
