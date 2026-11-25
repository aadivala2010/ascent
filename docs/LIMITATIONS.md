# Limitations

## Scientific

- Educational 3D point mass, not 6DOF dynamics.
- No attitude dynamics, CFD, structural analysis, slosh, control allocation or certified guidance.
- No operational targeting, manual piloting or real mission control output.
- Constant drag coefficient for the supplied synthetic models.
- Earth layered atmosphere ends at 84.852 km; Mars is a fixed-temperature exponential approximation; Moon is vacuum.
- No quantitative heat-flux or temperature prediction.
- Maximum dynamic pressure is derived from stored samples, so its resolution is the output cadence.
- Real vehicle catalog facts are incomplete and are never promoted into a runnable stage model.
- Recovery methods beyond the implemented point-mass trajectory remain educational concepts, not landing predictions.

## Rendering

- Procedural vehicles are exterior visual approximations, not proprietary internals or manufacturing drawings.
- Cutaway tanks are schematic visual elements.
- The Saturn V and Shuttle download paths are prepared, but the current viewport uses deterministic procedural geometry instead of importing those GLBs at runtime.
- Night lights, clouds, normal/specular maps and the starfield texture are prepared by the asset script but are not all consumed by the current renderer.
- Frame rate has not been measured on the target Intel integrated GPU.

## Product

- Panel layouts are responsive but Dockview drag/drop grouping, floating panel resize and persisted panel geometry are incomplete.
- CSV and JSON export work; report PDF, PNG chart export and CSV reimport are incomplete.
- Parameter sweeps, convergence UI and uncertainty propagation are incomplete.
- Conceptual recovery playback, optional audio and imported observed-data alignment are incomplete.
- Creator profile editing is incomplete; no biography is fabricated.
- The browser and production suites were authored but not executed after final code-only changes.
