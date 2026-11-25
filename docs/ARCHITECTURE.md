# Architecture

## Runtime flow

`Authoritative JSON → Zod validation → Zustand project state → simulation worker → immutable run → IndexedDB → playback/analysis/export`

The numerical runner is pure apart from cooperative progress/cancellation hooks. The Web Worker owns execution and transfers `Float64Array` buffers back to the UI. Rendering reads stored snapshots; it never mutates physical state.

## Modules

- `src/app/` — shell, navigation, theme, errors and central state
- `src/data/` — validated imports from the unchanged authoritative JSON files
- `src/physics/` — vector math, atmosphere, orbital calculators and equations
- `src/simulation/` — event-aware RK4 runner and worker protocol
- `src/rendering/` — Three.js planets, procedural vehicle profiles and run playback
- `src/workspaces/` — all eight user workspaces
- `src/storage/` — Dexie schema for projects, runs, layouts and notebooks
- `src/ui/` — shared panels, charts, formatters and design tokens
- `scripts/` — bounded, manifest-only visual asset preparation
- `tests/` — numerical fixtures and authored browser flows

## Data integrity

Real catalog entries remain `simulationReady: false`. A runnable `SimulationConfig` always contains a complete synthetic preset snapshot. Each saved `SimulationRun` records its solver version, immutable input, assumptions, event list, source status and asset-independent telemetry.

Projects and notebooks are local browser records. There is no account, server or hidden network data source.

## Rendering boundary

Physics remains SI double precision. Scene coordinates are derived views. Planet and vehicle meshes, textures, lighting, CAD modes and camera movement cannot change the saved trajectory. Quality changes affect rendering only.
