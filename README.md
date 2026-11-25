# ASCENT

ASCENT is a local-first aerospace engineering and flight simulation application for desktop browsers. It combines editable generic vehicles, deterministic educational physics, WebGL visualization, run playback, analysis, comparison, calculators, a research notebook and explicit scientific provenance.

ASCENT is not certified engineering software, a real-flight reconstruction, an operational mission planner or a source of live telemetry. Public real-vehicle facts are kept separate from the complete synthetic presets that can run.

## Start

```powershell
npm install
npm run assets
npm run dev
```

The asset command downloads only the URLs in `spec/assets.json`. It verifies file types, creates texture variants, records checksums and follows each documented fallback. The app can still render its procedural vehicles when external models are unavailable.

## Commands

- `npm run dev` — local Vite development server
- `npm run assets` — prepare the fixed visual asset manifest
- `npm run typecheck` — strict TypeScript validation
- `npm run test` — analytical and integration fixtures
- `npm run test:e2e` — Playwright browser flows at 1920×1080 and 1280×720
- `npm run build` — static production output in `dist/`

## Implemented product flow

1. Create/open a local project.
2. Inspect real catalog facts or select a complete synthetic preset.
3. Configure a body-local vertical or circular-orbit scenario.
4. Run RK4 integration in a Web Worker.
5. Replay actual stored telemetry in 3D.
6. Analyze charts and orbital elements, export CSV/JSON, or compare two runs.
7. Use educational calculators and save local research notes.

See [implementation status](docs/IMPLEMENTATION_STATUS.md), [scientific limitations](docs/LIMITATIONS.md) and [source register](spec/SOURCES.md).

## License

Original source code and original procedural geometry are MIT licensed. Downloaded assets retain their separate terms; see [asset credits](docs/ASSET_CREDITS.md). No endorsement by NASA, launch providers or asset publishers is implied.
