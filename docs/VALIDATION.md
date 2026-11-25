# Validation status

The expected values in `spec/validation.json` are agency-supplied analytical references. They are not simulator results.

## Executed before the owner requested code-only delivery

On 2026-11-24, the implementation engineer executed:

- `npm run typecheck` — passed with no TypeScript diagnostics.
- `npm run test` — 1 test file passed; 6 tests passed; 0 failed.

The executed suite covered ideal delta-v, drag/dynamic pressure, Earth sea-level atmosphere, circular-orbit calculators, one-period RK4 radius/end-position limits, and deterministic repeat.

## Not executed

At the owner's request, no later self-testing was performed. In particular:

- the authored Playwright suite was not run;
- the production build was not run after final code changes;
- the asset preparation script was not run;
- light/dark and 1920×1080 / 1280×720 visual checks were not run;
- worker cancellation, export/reimport, stage mass balance, convergence series and measured-flight comparison were not fully validated.

The application must therefore be treated as unverified after the final code-only changes until the owner runs the commands in `README.md`.

No observed flight dataset is included. Status remains **not validated against measured flight**.
