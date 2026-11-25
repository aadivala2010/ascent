# Equations

All runtime calculations use SI units.

## Environment

```text
h = |r| - R
a_gravity = -mu r / |r|^3
v_relative = v - (omega × r)
q = 1/2 rho |v_relative|^2
D = q Cd A
```

The Earth layered atmosphere uses geopotential altitude and the lapse-rate equations specified in `spec/PHYSICS.md`. Exponential mode uses `rho = rho0 exp(-h/H)` and `P = P0 exp(-h/H)` within its documented ceiling.

## Propulsion

```text
alpha = clamp(P / 101325, 0, 1)
F = lerp(F_vac, F_sea, alpha)
Isp = lerp(Isp_vac, Isp_sea, alpha)
massFlow = F / (Isp g0)
deltaV_ideal = Isp g0 ln(m_initial / m_final)
```

## Integration

```text
k1 = f(t, y)
k2 = f(t + dt/2, y + dt k1/2)
k3 = f(t + dt/2, y + dt k2/2)
k4 = f(t + dt, y + dt k3)
y_next = y + dt (k1 + 2 k2 + 2 k3 + k4) / 6
```

## Orbits

```text
specificEnergy = |v|^2/2 - mu/|r|
hVector = r × v
eVector = (v × hVector)/mu - r/|r|
a = -mu/(2 specificEnergy)
rp = a(1-e)
ra = a(1+e)
period = 2 pi sqrt(a^3/mu)
```

Undefined or singular elements display `N/A`; ASCENT does not manufacture an angle or finite period.
