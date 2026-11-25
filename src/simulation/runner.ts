import { atmosphere } from '../physics/atmosphere';
import { getBody, g0 } from '../data/catalog';
import { circularVelocity } from '../physics/orbital';
import { add, clamp, cross, norm, scale, subtract, unit, type Vec3 } from '../physics/vector';
import type { SimulationConfig, SimulationEvent, SimulationRun, TelemetryArrays } from '../types';

const SOLVER_VERSION = 'ascent-rk4-0.1.0';
type State = [number, number, number, number, number, number, number];
type Derivative = State;

export interface RunHooks {
  cancelled?: () => boolean;
  progress?: (fraction: number) => void;
}

function validate(config: SimulationConfig): void {
  const numbers = [config.duration_s, config.dt_s, config.outputInterval_s, config.vehicle.height_m, config.vehicle.diameter_m, config.vehicle.payload_kg];
  if (!numbers.every(Number.isFinite)) throw new Error('Simulation input contains a nonfinite value.');
  if (config.duration_s <= 0 || config.duration_s > 1_000_000) throw new Error('Duration must be greater than zero and within the educational run limit.');
  if (config.dt_s < 0.02 || config.dt_s > 5) throw new Error('Time step must be between 0.02 and 5 seconds.');
  if (config.outputInterval_s < config.dt_s || config.outputInterval_s > config.duration_s) throw new Error('Output interval must be at least one step and no longer than the run.');
  if (config.vehicle.diameter_m <= 0 || config.vehicle.payload_kg < 0) throw new Error('Vehicle dimensions and mass are invalid.');
  if (config.scenario === 'vertical' && config.vehicle.stages.length === 0) throw new Error('Vertical flight requires at least one complete synthetic stage.');
  for (const stage of config.vehicle.stages) {
    if (stage.dryMass_kg < 0 || stage.propellantMass_kg < 0 || stage.ispSea_s <= 0 || stage.ispVac_s <= 0) throw new Error('Stage mass and propulsion inputs are invalid.');
  }
}

function stateAdd(state: State, derivative: Derivative, factor: number): State {
  return state.map((value, index) => value + derivative[index] * factor) as State;
}

function activeMass(config: SimulationConfig, stageIndex: number, propellant: number): number {
  let mass = config.vehicle.payload_kg;
  for (let index = stageIndex; index < config.vehicle.stages.length; index += 1) {
    const stage = config.vehicle.stages[index];
    mass += stage.dryMass_kg + (index === stageIndex ? Math.max(0, propellant) : stage.propellantMass_kg);
  }
  return mass;
}

function derivative(config: SimulationConfig, time: number, state: State, stageIndex: number): Derivative {
  const body = getBody(config.bodyId);
  const position: Vec3 = [state[0], state[1], state[2]];
  const velocity: Vec3 = [state[3], state[4], state[5]];
  const radius = norm(position);
  if (!Number.isFinite(radius) || radius <= 0) throw new Error(`Invalid position state at t=${time.toFixed(3)} s.`);
  const altitude = radius - body.radius_m;
  const gravity = scale(position, -body.mu_m3s2 / radius ** 3);
  if (config.scenario === 'circular-orbit') return [velocity[0], velocity[1], velocity[2], gravity[0], gravity[1], gravity[2], 0];

  const stage = config.vehicle.stages[stageIndex];
  const propellant = Math.max(0, state[6]);
  const mass = activeMass(config, stageIndex, propellant);
  if (mass <= 0 || !Number.isFinite(mass)) throw new Error(`Invalid vehicle mass at t=${time.toFixed(3)} s.`);
  const environment = atmosphere(body, altitude, config.atmosphere);
  const rotationVelocity = cross([0, 0, body.omega_rad_s], position);
  const relativeVelocity = subtract(velocity, rotationVelocity);
  const relativeSpeed = norm(relativeVelocity);
  const area = Math.PI * (config.vehicle.diameter_m / 2) ** 2;
  const dragForce = 0.5 * environment.density * stage.dragCoefficient * area * relativeSpeed ** 2;
  const dragAcceleration = relativeSpeed > 0 ? scale(relativeVelocity, -dragForce / (mass * relativeSpeed)) : [0, 0, 0] as Vec3;
  const pressureFraction = clamp(environment.pressure / 101325, 0, 1);
  const thrust = propellant > 0 ? stage.thrustVac_N + (stage.thrustSea_N - stage.thrustVac_N) * pressureFraction : 0;
  const isp = stage.ispVac_s + (stage.ispSea_s - stage.ispVac_s) * pressureFraction;
  const thrustAcceleration = scale(unit(position), thrust / mass);
  const acceleration = add(add(gravity, dragAcceleration), thrustAcceleration);
  const flow = thrust > 0 ? thrust / (isp * g0) : 0;
  return [velocity[0], velocity[1], velocity[2], acceleration[0], acceleration[1], acceleration[2], -flow];
}

function rk4(config: SimulationConfig, time: number, state: State, dt: number, stageIndex: number): State {
  const k1 = derivative(config, time, state, stageIndex);
  const k2 = derivative(config, time + dt / 2, stateAdd(state, k1, dt / 2), stageIndex);
  const k3 = derivative(config, time + dt / 2, stateAdd(state, k2, dt / 2), stageIndex);
  const k4 = derivative(config, time + dt, stateAdd(state, k3, dt), stageIndex);
  return state.map((value, index) => value + (dt / 6) * (k1[index] + 2 * k2[index] + 2 * k3[index] + k4[index])) as State;
}

function sample(config: SimulationConfig, time: number, state: State, stageIndex: number) {
  const body = getBody(config.bodyId);
  const position: Vec3 = [state[0], state[1], state[2]];
  const velocity: Vec3 = [state[3], state[4], state[5]];
  const radius = norm(position);
  const altitude = radius - body.radius_m;
  const environment = atmosphere(body, altitude, config.atmosphere);
  const relativeVelocity = subtract(velocity, cross([0, 0, body.omega_rad_s], position));
  const relativeSpeed = norm(relativeVelocity);
  const stage = config.vehicle.stages[stageIndex];
  const mass = config.scenario === 'circular-orbit' ? config.vehicle.payload_kg : activeMass(config, stageIndex, state[6]);
  const area = Math.PI * (config.vehicle.diameter_m / 2) ** 2;
  const drag = stage ? 0.5 * environment.density * stage.dragCoefficient * area * relativeSpeed ** 2 : 0;
  const pressureFraction = clamp(environment.pressure / 101325, 0, 1);
  const thrust = stage && state[6] > 0 ? stage.thrustVac_N + (stage.thrustSea_N - stage.thrustVac_N) * pressureFraction : 0;
  const accelerationDerivative = derivative(config, time, state, stageIndex);
  const acceleration = norm([accelerationDerivative[3], accelerationDerivative[4], accelerationDerivative[5]]);
  return {
    position, velocity, altitude, speed: norm(velocity), mass, thrust, density: environment.density,
    q: 0.5 * environment.density * relativeSpeed ** 2, drag, acceleration,
    gravity: body.mu_m3s2 / radius ** 2, orbitalEnergy: norm(velocity) ** 2 / 2 - body.mu_m3s2 / radius,
  };
}

export async function runSimulation(config: SimulationConfig, hooks: RunHooks = {}): Promise<SimulationRun> {
  validate(config);
  const body = getBody(config.bodyId);
  const initialRadius = body.radius_m + (config.initialAltitude_m ?? (config.scenario === 'circular-orbit' ? 400_000 : 0));
  const initialTangentialSpeed = config.scenario === 'circular-orbit' ? circularVelocity(body.mu_m3s2, initialRadius) : body.omega_rad_s * initialRadius;
  let state: State = [initialRadius, 0, 0, 0, initialTangentialSpeed, 0, config.vehicle.stages[0]?.propellantMass_kg ?? 0];
  let time = 0;
  let stageIndex = 0;
  const events: SimulationEvent[] = [];
  if (config.scenario === 'vertical') {
    const initial = derivative(config, 0, state, stageIndex);
    const radialAcceleration = initial[3];
    if (radialAcceleration <= 0) throw new Error('Unable to lift: initial outward acceleration is not positive.');
    events.push({ type: 'liftoff', time_s: 0, label: 'Liftoff' });
  }

  const values: Record<keyof TelemetryArrays, number[]> = {
    t: [], positionX: [], positionY: [], positionZ: [], velocityX: [], velocityY: [], velocityZ: [], altitude: [], speed: [], mass: [],
    thrust: [], density: [], q: [], drag: [], acceleration: [], gravity: [], orbitalEnergy: [],
  };
  let nextOutput = 0;
  let stepCount = 0;
  let termination = 'duration reached';
  let peakQ = { value: -Infinity, time: 0 };

  const record = () => {
    const point = sample(config, time, state, stageIndex);
    values.t.push(time); values.positionX.push(point.position[0]); values.positionY.push(point.position[1]); values.positionZ.push(point.position[2]);
    values.velocityX.push(point.velocity[0]); values.velocityY.push(point.velocity[1]); values.velocityZ.push(point.velocity[2]);
    values.altitude.push(point.altitude); values.speed.push(point.speed); values.mass.push(point.mass); values.thrust.push(point.thrust);
    values.density.push(point.density); values.q.push(point.q); values.drag.push(point.drag); values.acceleration.push(point.acceleration);
    values.gravity.push(point.gravity); values.orbitalEnergy.push(point.orbitalEnergy);
    if (point.q > peakQ.value) peakQ = { value: point.q, time };
  };

  record();
  nextOutput += config.outputInterval_s;
  while (time < config.duration_s - 1e-12) {
    if (stepCount >= 2_000_000) throw new Error('Simulation exceeded the two-million-step safety limit.');
    if (values.t.length >= 200_000) throw new Error('Simulation exceeded the stored-point safety limit.');
    if (hooks.cancelled?.()) throw new DOMException('Simulation cancelled.', 'AbortError');
    let dt = Math.min(config.dt_s, config.duration_s - time, nextOutput - time);
    if (dt <= 1e-12) { record(); nextOutput += config.outputInterval_s; continue; }
    const before = state;
    let after = rk4(config, time, state, dt, stageIndex);

    if (config.scenario === 'vertical' && before[6] > 0 && after[6] <= 0) {
      let low = 0; let high = dt;
      for (let iteration = 0; iteration < 50 && high - low > 1e-6; iteration += 1) {
        const middle = (low + high) / 2;
        const candidate = rk4(config, time, before, middle, stageIndex);
        if (candidate[6] > 0) low = middle; else high = middle;
      }
      const eventDt = high;
      state = rk4(config, time, before, eventDt, stageIndex);
      state[6] = 0;
      time += eventDt;
      events.push({ type: 'stage-depletion', time_s: time, label: `Stage ${stageIndex + 1} propellant depleted`, stageIndex });
      if (stageIndex + 1 < config.vehicle.stages.length) {
        events.push({ type: 'stage-separation', time_s: time, label: `Stage ${stageIndex + 1} separated`, stageIndex });
        stageIndex += 1;
        state[6] = config.vehicle.stages[stageIndex].propellantMass_kg;
      }
      const remainder = dt - eventDt;
      if (remainder > 1e-9) state = rk4(config, time, state, remainder, stageIndex);
      time += remainder;
    } else {
      state = after;
      time += dt;
    }

    if (config.scenario === 'vertical' && norm([state[0], state[1], state[2]]) < body.radius_m) {
      state[0] = body.radius_m;
      termination = 'surface impact';
      events.push({ type: 'impact', time_s: time, label: 'Surface contact' });
      record();
      break;
    }
    stepCount += 1;
    if (Math.abs(time - nextOutput) < 1e-8 || time >= nextOutput) { record(); nextOutput += config.outputInterval_s; }
    if (stepCount % 256 === 0) {
      hooks.progress?.(time / config.duration_s);
      await new Promise<void>((resolve) => setTimeout(resolve, 0));
    }
  }
  if (values.t.at(-1)! < time - 1e-8) record();
  if (peakQ.value > 0) events.push({ type: 'max-q', time_s: peakQ.time, label: 'Maximum sampled dynamic pressure' });
  events.push({ type: 'complete', time_s: time, label: termination });
  events.sort((a, b) => a.time_s - b.time_s);

  const telemetry = Object.fromEntries(Object.entries(values).map(([key, series]) => [key, new Float64Array(series)])) as unknown as TelemetryArrays;
  return {
    schemaVersion: 1,
    id: config.id,
    createdAt: new Date().toISOString(),
    solverVersion: SOLVER_VERSION,
    input: structuredClone(config),
    telemetry,
    events,
    summary: {
      duration_s: time,
      samples: telemetry.t.length,
      peakAltitude_m: Math.max(...telemetry.altitude),
      peakSpeed_mps: Math.max(...telemetry.speed),
      maxQ_Pa: Math.max(...telemetry.q),
      finalMass_kg: telemetry.mass.at(-1) ?? 0,
      termination,
    },
    assumptions: [
      'Educational 3D point-mass model with spherical central body',
      'Simplified prescribed radial thrust direction for vertical scenarios',
      'Constant drag coefficient and simplified pressure-dependent engine interpolation',
      'Not a 6DOF, structural, CFD, guidance, or certified prediction model',
    ],
    sourceStatus: 'synthetic educational',
  };
}
