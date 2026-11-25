# ASCENT — Final agency specification

## Role and constraints
You are the implementation engineer. The agency has supplied the product, architecture, visuals, selected assets, numerical models, sample data and acceptance tests. Do not act as a research agency, product designer or source finder. You may choose implementation details such as mesh topology, shader optimization and component internals; you may download exact listed assets or use the specified procedural replacements. Do not ask the project owner to create models, search links or assemble the UI. Do not invent real-world specifications. If an external download fails, log it, use the supplied fallback and continue. Use no paid services, no accounts, no Unity/Unreal/Blender, no server requirement. All files and project results stored locally. Open-source original code under MIT; separate asset credits and license terms. Do not imply endorsement by rocket manufacturers or NASA.

The product is **ASCENT — Aerospace Engineering & Flight Simulation**, desktop browser engineering software (not a game), approximately 80% engineering and 20% cinematic visualization. Undergraduate-level scientific models, simple and advanced modes, historical and custom vehicles, Earth/Moon/Mars, automated scenario playback, CAD and realistic rendering, analysis, research notebook, educational laboratory, light/dark modes, monochrome original wordmark. No arcade HUD, XP, achievements, fake live data or invented validation. See UI.md for exact layout. References are visual inspiration; no screenshot values or charts may become real data.

## Stack (fixed)
Vite + React + TypeScript (strict), Three.js + @react-three/fiber + @react-three/drei; Zustand for application state; Dockview for docked/split tabs and native overlay drag/resize for floating panels; ECharts for plots; Dexie/IndexedDB; KaTeX; Lucide React; CSS variables and CSS modules (Tailwind optional only if already installed); Vitest and Playwright; Web Workers; Web Audio. Use WebGL2 as baseline, not experimental WebGPU dependency. Pin mutually compatible packages in lockfile. Avoid external runtime dependencies, APIs or CDNs. Target Win11, Intel Core 5 120U, 16GB and integrated Intel GPU, desktop 1280–2560 px; default adaptive quality, Ultra optional. 30 FPS target on target laptop and 60 where practical, not a guaranteed benchmark. Do not reduce physics accuracy with rendering quality. Static production hosting, base-relative asset paths, offline after assets loaded where practical. No authentication.

## Authority and files
Read spec/UI.md, PHYSICS.md, GEOMETRY.md, SOURCES.md, vehicles.json, assets.json, validation.json. Use JSON verbatim as seed data with schema validation. Reference image numbers are not inputs. Published catalog values and synthetic scenario inputs must remain separate. The public catalog must not silently become flight-model input; only complete explicitly labeled synthetic presets or user-provided complete inputs can run. Implement the chosen asset recipe exactly, with quality-driven original geometry refinement allowed but no sourcing decisions left to the agent. No research or additional external data acquisition is necessary to finish the first release.

## Structure and contracts
```
src/app/                    shell, routing, errors
src/ui/                     design tokens, controls, docking, panels
src/workspaces/             control, vehicle, plan, simulation, analysis, comparison, lab, docs
src/physics/                vectors, atmosphere, integrators, orbital, calculators
src/simulation/             pure runner, events, presets, worker protocol, replay
src/rendering/              planet, vehicle, geometry, materials, scene, cameras, effects
src/data/                   validated catalog + manifests
src/storage/                Dexie schema + migrations
src/research/               notebook, experiment, report
scripts/                    prepare-assets.mjs
public/assets/              acquired/generated files
 tests/                     unit, integration, browser
 docs/                      sources, limitations, actual test output
```
Data contract: a Project has schemaVersion, id, name, createdAt, updatedAt, vehicle configuration, body ID, scenario configuration, run IDs, notes. A Run stores immutable input snapshot, solver version, settings, asset-independent numerical data, events, model assumptions, source/approximation status. Telemetry arrays Float64Array with common time axis: t, position xyz, velocity xyz, altitude, speed, mass, thrust, density, q, drag, acceleration; optional unavailable quantities explicitly null or NaN internally and displayed N/A. Worker receives run/cancel requests and emits progress, results or structured error, transferable arrays. Rendering reads interpolated snapshots only. Save run config and output to IndexedDB, allow JSON/CSV exports; no simulated statuses presented as live missions.

## Implementation order, one continuous run
1. Build app shell, theme, dockable workspace, persistent project CRUD; implement a single scientific vertical slice (generic vehicle editor -> numerical run -> animation -> analysis -> export) before expanding. Do not start with a landing-page-only mockup.
2. Build numerical core and execute supplied analytical fixtures. Add errors for nonfinite input, invalid mass, invalid state, unsupported scenario. Implement worker cancellation and stable replay.
3. Prepare assets from assets.json with local file cache, actual download/decoding checks, license text/credits and fallback generation; build planetary rendering, procedural models and CAD modes, inspect visually.
4. Build catalog, parameter forms, mission planning and simulation with body-local physics, event-derived telemetry, camera transition and timeline. Automated educational scenarios and conceptual recovery playback only where physics unsupported; label them distinctly.
5. Build analysis, comparison, charts, parameter studies of generic educational models, calculators, learning modules, research notebook and exports.
6. Add remaining catalog geometry, original visual effects/audio, high/ultra rendering, both themes, responsive desktop panels, reduced motion and keyboard accessibility. Capture screenshots at 1920x1080 and 1280x720.
7. Run typecheck, unit/integration/browser tests, production build, verify asset credits and model labels. Fix errors. Write final completion matrix and actual test results, including unimplemented items. Never declare a feature done if it is a mockup.

## Completion gates
- All eight nav workspaces render meaningful functional content. All main controls work or are clearly labeled unavailable; no inert placeholder buttons.
- Generic configurable models run numerically; an orbital example and analytical validation tests work; scientific state, playback and plots agree.
- Three bodies render with appropriate maps/lighting. Catalog includes the supplied real entries and generic presets; source status shown. At least Falcon 9, Starship, Saturn V, Electron, SLS and Shuttle have recognizable visual models (import or prescribed geometry). CAD mode selection changes actual rendering. No claims of exact proprietary internals.
- Editable design parameters, local project save/reopen, compare two runs, synchronized charts, CSV and JSON export, research notes, equation explanations work.
- Conceptual recovery methods include propulsive, parachute/splashdown, winged runway, lunar/Mars, tower catch. Treat as illustrative animations or documented generic physics exercises, never as a precision predictor or proprietary guidance implementation. No operational mission targeting or actual flight-control output.
- Both themes, panel visibility, drag/resize, docking, layout restore and persistence work. 3D viewport remains dominant by default. Optional sound works only after interaction; external vacuum scenes are silent unless soundtrack enabled.
- Show actual measured test results and limitations; no fake data or performance. If full scope exceeds coding run limits, prioritize a functioning vertical slice and preserve extension points, then report status.

## Required commands and outputs
npm install; npm run dev; npm run build; npm run test; npm run typecheck; npm run test:e2e; npm run assets. Provide README, LICENSE, ARCHITECTURE, PHYSICS, EQUATIONS, VALIDATION, LIMITATIONS, SOURCES, ASSET_CREDITS, ENGINEERING_NOTEBOOK, AI_DISCLOSURE, CHANGELOG and IMPLEMENTATION_STATUS. Use actual outputs for validation. Creator profile editable locally; do not fabricate personal biography, awards or research. User-authored hypotheses and conclusions stay empty until entered. Implement now, do not just propose a plan.
