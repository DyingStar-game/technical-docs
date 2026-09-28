---
title: Orbital stations
sidebar_position: 7.5
---

# Orbital stations

:::tip[Read the player page first]
**[Player network management](./player.md)** explains frames (`parent_id`: positions are local to the
parent) and the server-authoritative loop this builds on.
:::

A station is a **networked frame** — players aboard are its children, their positions local to it — that
**really orbits** its body. The first one is **Palaka-Pital Orbital Station**: 400 km above SandBox,
inclined 51.6° like the ISS, one orbit in 1 h 44.

## How it moves, and why the server keeps it still

| | Server (and Horizon) | Clients |
|---|---|---|
| The station | keeps its **seed pose** and never moves | placed **every frame** on its orbit from the shared clock (`Globals.sim_time()`), like a moon |
| Players aboard | positions **local to the station** | carried by the scene graph |
| "Where is it now?" | `OrbitalStation.orbit_pose_at(t)`, through `Server.system_transform_of` | the same function |

Why still on the server: Jolt applies a moving frame's motion to kinematic bodies **one physics step
late**. At 7.7 km/s one step (1/60 s) is 128 m — enough to fall through the deck. Moving it on the clients
only is safe: nothing collides there.

Horizon keeps the seed pose too, and a client that receives it puts the station straight back on its
orbit in the same call (`apply_prop_data`). Telling Horizon the true pose once a second was tried and
**measured worse**: Horizon moves what hangs under a moving parent one object at a time and checks zones at
every step, so at 7.7 km per update a player aboard left their own zone and came back 38 times in 35 s —
two players aboard would each have seen the other vanish every second.

Its attitude is the one a real station flies (`StationOrbit.attitude_at`): **+Y away from the planet**, so
the floor faces it, and **−Z along the motion** — one turn per orbit.

## Adding a station (game designers)

1. **Describe it**: a `StationSite` resource in `scenes/systems/<system>/stations/<name>.tres`.

   | Field | Meaning |
   |---|---|
   | `id` | Unique, e.g. `tarsis_3/palaka_pital`. The station's network uuid is derived from it. |
   | `scene` | The networked scene it is built from: `orbital_station.tscn` by default (the test model), or a scene inherited from it (below). |
   | `eva_radius_m` | How far a weightless body still rides in the station's frame, 50 km by default (see [EVA](#eva-beside-a-station)). |
   | `body_key` | The body it orbits, e.g. `tarsis_3`. |
   | `proper_name` | Shown as "*name* Orbital Station" (translated). |
   | `altitude_mode` | `FIXED` uses `altitude_m`. `SYNCHRONOUS` finds the altitude where one orbit lasts one day of the body. |
   | `altitude_m` | Above the body's reference radius. |
   | `inclination_deg` | Tilt of the orbit against the body's **equator**; under 90° is prograde. |
   | `ascending_node_deg` | Where the orbit crosses the equator going north. |
   | `phase_deg` | Where the station is on its orbit at t = 0. |

2. **Generate its seed entry**: `godot --headless --path . -s res://tools/stations/station_seed.gd -- system=tarsis`
   prints the JSON object for `horizonserver/ds_genericprops/startup_items.json`. Paste it there — the tool
   exists so the seed can never drift from what the game computes.
3. **Deploy the seed**: rebuild `horizon-data` (`scripts_windows\build-and-deploy.ps1 horizon-data`) and
   **purge `dyingstar.items`**. Horizon skips the **whole** seed when its first uuid is already in the base.
4. **Nothing else.** The orbit, the star map (badge, orbit, double-click framing), the celestial markers and
   the teleporter all read the sites.

### Another model

`orbital_station.tscn` is a shell around a model: its root carries the `OrbitalStation` script, a `PropSync`
child (type `station`), the model under **`Model`**, an **`Arrival`** marker where travellers land, and
a teleporter cabin — the way back — which an inherited scene keeps. For another look:

1. **Scene → New Inherited Scene** from `orbital_station.tscn`, and save it under
   `scenes/_universe/environment/space/stations/`.
2. Replace the `Model` child with your model. It brings its own floors with their collision, its gravity
   (`scenes/grid/physics_grid.tscn`: `REPLACE`, "down" is the area's −Y, and the station's +Y points away
   from the planet) and its [rings](#spinning-rings).
3. Move `Arrival` onto a floor.
4. Name that scene in the site's `scene`, and generate the seed entry again: its `scenename` comes from it.

A test checks that every site's scene exists, has an `OrbitalStation` root and an `Arrival` marker.

## Frames: the sphere of influence decides

A weightless body belongs to the body whose **Laplace sphere of influence** holds it:
r = a·(m/M)^(2/5), from the scene's own orbit elements (`Planet.sphere_of_influence_m`). For SandBox that is
**516 290 km** — the celestial service announces 516 295. Spheres nest (a moon's lies inside its planet's)
and the smallest wins (`Server.soi_body_at`); outside every one is the star's space, the world frame.

- Asked four times a second, of **weightless** bodies only (`PlayerServer._server_update_frame`). A body in a
  gravity well belongs to what the tree says: a building, a city, a station's deck, a vehicle.
- A move keeps the body **where it is** (its system transform) and turns its velocity with it
  (`_move_to_frame`). The frame's own motion — an orbit, a spin — is not added: frames carry no velocity in
  this model.
- In a planet's frame you hover over the same ground, since that frame turns with the planet.

:::note[Why not the top of the atmosphere]
Bodies used to be released ~110 km up. Their planet then left at its orbital speed, 33 km/s, and the
atmosphere left the sky with it. 400 km up, gravity is still 89 % of the ground's: an astronaut floats
because they fall **around** the planet, not because it stopped pulling.
:::

## EVA beside a station

- **No drag in space**: you keep your speed until you push against it.
- **Within the site's `eva_radius_m` (50 km)** the station's frame holds, and a free body drifts the way orbital mechanics
  says — the **Clohessy-Wiltshire** equations, in the station's axes (`StationOrbit.hill_acceleration`):
  ẍ = 3n²x + 2nẏ, ÿ = −2nẋ, z̈ = −n²z, with x radial, y along the motion, z along the orbit normal, and
  n = 1.009e-3 rad/s at 400 km. **Higher is slower**: let go 100 m above the station and you are 3.8 km behind
  it one orbit later. The equations are linearised: good to ~1 % at 70 km from a 400 km orbit, and the error
  grows with the distance over the orbit's radius — the reason the radius belongs to the site.
- **Brake** (`eva_stabilize`, **X**): the thrusters fire against the motion until you are still relative to
  your frame — station-keeping.
- **Beyond 50 km** the planet's frame takes over, and the station leaves you at its orbital speed.

The keys are in [Controls & shortcuts](../uiux/controls_shortcuts.md).

## Spinning rings

`SpinGravityRing` turns a ring at the rate its floor's gravity needs: **ω = √(g / r)**. For 1 g on the test
station's 99 m rims, one turn in 20 s. The angle is a pure function of the shared clock, so the server and
every client agree, collision included.

Put each ring (rim and spokes) under its **own** `CSGCombiner3D` carrying the script, **outside** the
station's CSG tree: a CSG child that moves makes its root rebuild the whole combined mesh every frame, while a
root that moves just moves. `floor_radius_m = 0` reads the floor off the widest CSG cylinder.

The spin gravity is **visual**: a ring has no gravity area.

## Teleporter

Stations are destinations. Players only: vehicles in the cabin are refused and stay behind. The way back
is a **cabin standing aboard** (the test station has one). There is no Return button: you only ever leave
from a cabin, and a trip lands you where there is none.

## Pitfalls

- **The dev clock (+ / −) is client-only.** Shifted, a client draws the station somewhere else than the
  server has it, and leaving it lands you where the **server** has it. A red banner says so.
- **The seed is skipped as a whole** when its first uuid exists: purge when deploying.
- **Beyond the EVA radius** (50 km) a client stops showing the station: Horizon keeps it at its seed pose,
  and GORC measures from there. At that distance it is too small to see anyway.
- `CSGCylinder3D.radius` is stored in single precision (98.8682 reads back 98.86820221).

## Code map

| What | Where |
|---|---|
| Site, orbit, list of sites | `scenes/_universe/environment/space/stations/station_site.gd`, `station_orbit.gd`, `station_sites.gd` |
| The station | `orbital_station.gd` / `.tscn`, model under `test_station/` |
| Rings | `spin_gravity_ring.gd` |
| Frames | `server/server.gd` (`soi_body_at`, `system_transform_of`), `scenes/player/player_server.gd` (`_server_update_frame`, `_move_to_frame`) |
| Sphere of influence | `scenes/planet/planet_body.gd` (`sphere_of_influence_m`) |
| Seed tool | `tools/stations/station_seed.gd` |
| Horizon | `ds_genericprops/props/station_def.json`, `startup_items.json` |
