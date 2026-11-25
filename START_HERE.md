# ASCENT — Codex implementation handoff

Extract this entire archive into an empty project directory (or copy the contents to the existing ASCENT repository without overwriting your work). Open that folder in Codex. Paste the following prompt exactly:

> Read MASTER_BUILD_PROMPT.md and every file under spec/, then inspect every PNG under reference-ui/. Implement the ASCENT application in this repository now. These documents are the agency's implementation decisions, not suggestions. Use the supplied JSON as authoritative inputs, run tests, capture screenshots, fix defects, and deliver the best working version possible in this run. Do not research new designs, assets, vehicle parameters or architecture; use the named assets and procedural fallbacks. Do not substitute mock screens or invented telemetry. Begin with the vertical slice and expand in the prescribed order. Keep an honest completion matrix and report actual test results.

## Files
- MASTER_BUILD_PROMPT.md: scope, architecture, work order, acceptance rules.
- spec/UI.md: screen-level design and interaction decisions.
- spec/PHYSICS.md: models, algorithms, numerical policy, learning and validation requirements.
- spec/vehicles.json: source-grounded public vehicle facts and explicitly synthetic simulation presets.
- spec/GEOMETRY.md: specified procedural fallback art direction and dimensional profiles.
- spec/assets.json: direct download URLs and attribution/fallback rules.
- spec/validation.json: analytical test fixtures; expected values, not executed test results.
- spec/SOURCES.md: source links and qualification of the data.
- reference-ui/: all 13 original UI concept images (illustrative, not data).

This is an implementation package, not the built software. Remote asset URLs are supplied, not bundled binaries; the implementation agent should download exactly those assets and follow deterministic fallbacks. Real vehicle stage-level data and flight telemetry not established by public sources are deliberately omitted, not guessed. Real-vehicle geometry is schematic unless otherwise established. Synthetic simulation presets are separate from catalog facts.
