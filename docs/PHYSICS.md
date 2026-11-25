# Implemented physics

ASCENT implements the educational model fixed in `spec/PHYSICS.md`:

- state `[rx, ry, rz, vx, vy, vz, remaining active-stage propellant]`;
- spherical central gravity around Earth, Moon or Mars;
- rotating-body surface-relative velocity for a co-rotating atmosphere;
- lower Earth layered atmosphere, exponential Earth/Mars approximation and lunar vacuum;
- constant reference area and drag coefficient for supplied generic stages;
- pressure-interpolated generic thrust and specific impulse;
- consistent mass flow `F / (Isp g0)` at every RK4 evaluation;
- serial-stage dry-mass discard without artificial momentum impulses;
- fixed-step classical RK4 with exact output intervals;
- bracketed propellant-depletion events and surface termination;
- osculating central-body orbital elements and conservation quantities.

Vertical scenarios use prescribed radial thrust. Circular-orbit scenarios initialize tangential velocity `sqrt(mu/r)` and are not claims that a launch vehicle reached that state.

Telemetry uses a common time axis and `Float64Array` storage for position, velocity, altitude, speed, mass, thrust, density, dynamic pressure, drag, acceleration, gravity and specific orbital energy.

See [limitations](LIMITATIONS.md) before interpreting a result.
