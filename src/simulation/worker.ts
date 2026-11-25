import { runSimulation } from './runner';
import type { SimulationConfig } from '../types';

let cancelled = false;

self.onmessage = async (event: MessageEvent<{ type: 'run'; config: SimulationConfig } | { type: 'cancel' }>) => {
  if (event.data.type === 'cancel') { cancelled = true; return; }
  cancelled = false;
  try {
    const run = await runSimulation(event.data.config, {
      cancelled: () => cancelled,
      progress: (fraction) => self.postMessage({ type: 'progress', fraction }),
    });
    const transferables = Object.values(run.telemetry).map((array) => array.buffer);
    self.postMessage({ type: 'result', run }, { transfer: transferables });
  } catch (error) {
    self.postMessage({
      type: 'error',
      error: error instanceof Error ? { name: error.name, message: error.message } : { name: 'Error', message: String(error) },
    });
  }
};
