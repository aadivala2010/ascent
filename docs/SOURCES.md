# Source register

The authoritative source and confidence register is [spec/SOURCES.md](../spec/SOURCES.md). The application imports catalog values directly from [spec/vehicles.json](../spec/vehicles.json) and does not independently replace them.

Key source classes are:

- vehicle summary pages from SpaceX, NASA and Rocket Lab;
- JPL central-body parameters;
- NASA Glenn ideal rocket equations;
- U.S. Standard Atmosphere 1976;
- Solar System Scope / INOVE visual textures under CC BY 4.0;
- NASA/Michael D. Carbajal Saturn V and Shuttle models under NASA media usage terms.

Source links qualify published summaries only. They do not establish complete stage mass, propellant, aerodynamic or telemetry models. The runnable ASCENT T1, T2 and O1 configurations are explicitly synthetic educational inputs.
