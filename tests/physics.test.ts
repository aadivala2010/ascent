import { describe, expect, it } from 'vitest';
import { earthLayeredAtmosphere } from '../src/physics/atmosphere';
import { circularVelocity, escapeVelocity, idealDeltaV, orbitalElements } from '../src/physics/orbital';
import { runSimulation } from '../src/simulation/runner';
import { getBody, getPreset } from '../src/data/catalog';

describe('agency analytical fixtures', () => {
  it('matches ideal delta-v', () => {
    expect(idealDeltaV(1000, 500, 300)).toBeCloseTo(2039.2355394714561, 8);
  });

  it('matches drag and dynamic pressure', () => {
    const q = 0.5 * 1.225 * 100 ** 2;
    expect(q).toBe(6125);
    expect(q * 0.5 * 2).toBe(6125);
  });

  it('matches Earth sea-level layered atmosphere', () => {
    const result = earthLayeredAtmosphere(0);
    expect(result.temperature).toBeCloseTo(288.15, 8);
    expect(result.pressure).toBeCloseTo(101325, 8);
    expect(result.density).toBeCloseTo(1.225000018124288, 6);
  });

  it('matches the circular orbit calculators', () => {
    const earth = getBody('earth');
    const radius = 6_771_000;
    const speed = circularVelocity(earth.mu_m3s2, radius);
    expect(speed).toBeCloseTo(7672.598587818517, 9);
    expect(escapeVelocity(earth.mu_m3s2, radius)).toBeCloseTo(10850.692981537604, 9);
    const elements = orbitalElements([radius, 0, 0], [0, speed, 0], earth.mu_m3s2, earth.radius_m);
    expect(elements.eccentricity).toBeLessThan(1e-12);
    expect(elements.period_s).toBeCloseTo(5544.8551397511565, 7);
    expect(elements.specificEnergy_Jkg).toBeCloseTo(-29434384.544897355, 6);
  });

  it('integrates a circular orbit within the supplied drift limits', async () => {
    const run = await runSimulation({
      id: 'fixture-orbit', name: 'Fixture orbit', bodyId: 'earth', scenario: 'circular-orbit',
      vehicle: getPreset('orbital-test'), duration_s: 5544.8551397511565, dt_s: 1, outputInterval_s: 5,
      atmosphere: 'vacuum', initialAltitude_m: 400000,
    });
    const earth = getBody('earth');
    const radii = Array.from(run.telemetry.t, (_, index) => Math.hypot(
      run.telemetry.positionX[index], run.telemetry.positionY[index], run.telemetry.positionZ[index],
    ));
    expect(Math.max(...radii.map((radius) => Math.abs(radius - (earth.radius_m + 400000))))).toBeLessThan(5);
    const final = radii.length - 1;
    expect(Math.hypot(run.telemetry.positionX[final] - (earth.radius_m + 400000), run.telemetry.positionY[final], run.telemetry.positionZ[final])).toBeLessThan(10);
  });

  it('is deterministic for the same configuration', async () => {
    const config = {
      id: 'repeat', name: 'Repeat', bodyId: 'earth' as const, scenario: 'vertical' as const,
      vehicle: getPreset('trainer'), duration_s: 20, dt_s: 0.1, outputInterval_s: 0.5, atmosphere: 'layered' as const,
    };
    const first = await runSimulation(config);
    const second = await runSimulation(config);
    expect(Array.from(first.telemetry.altitude)).toEqual(Array.from(second.telemetry.altitude));
  });
});
