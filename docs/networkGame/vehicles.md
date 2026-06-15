---
title: Adding a vehicle
sidebar_position: 4
---

# Adding a vehicle

This guide walks through creating a new drivable vehicle (truck, car, rover…). Vehicles are
server-authoritative networked props: the game server simulates the physics and replicates the
state to every client, exactly like the other props (see
[Props network management](./props.md)). A vehicle adds two things on top:
**driving** (a powertrain) and **seats** (driver / passengers).

All the moving parts already exist as reusable pieces — in most cases a new vehicle is just a
**scene** to assemble, not new code.

## The pieces

| Script | Role |
|---|---|
| `scenes/vehicles/vehicle.gd` (`class_name Vehicle`) | The vehicle base: body/wheels, physics, driving, networking, cargo. Put it on the scene root. |
| `scenes/vehicles/vehicle_powertrain.gd` | Engine math (electric / thermal gearbox). Owned by `Vehicle`, configured through its `@export`s — you don't touch it. |
| `scenes/vehicles/vehicle_seat.gd` (`class_name VehicleSeat`) | One seat zone (driver or passenger). You drop one per seat. |
| `scenes/vehicles/vehicle_debug_hud.gd` | Optional on-screen dashboard (speed, RPM, load). |

## 1. Where to put the files

- **Scene**: `scenes/vehicles/<category>/<name>.tscn` (e.g. `scenes/vehicles/trucks/truck.tscn`).
- **Assets** (3D model, materials, textures): follow the project conventions in
  [Files structure](../creativeConcept/files_structure.md) and
  [3D models](../creativeConcept/3d_models.md). Do **not** invent a new layout.

## 2. Build the scene

Create a scene whose **root is a `VehicleBody3D`** and attach `vehicle.gd` to it.

You have two options for the body:

- **Real 3D model** — add your `MeshInstance3D` model and a `CollisionShape3D` matching it, as
  children of the root.
- **Parametric blockout (placeholder)** — `vehicle.gd` can generate a box-built body, chassis
  collision, four wheels, cameras and the cargo bay from its exported dimensions (`@tool`, so it
  rebuilds live in the editor). This is what the truck uses while waiting for the real model.
  Tune it via the **Body / Cab / Bed / Wheels** export groups, and carve the cab opening with
  **Cab → Cab Cutout Size / Offset**.

The generated nodes are transient (no owner), so the `.tscn` stays minimal — only the root, its
script and your designer-placed nodes (the seats below) are saved.

## 3. Add the seats

For each place, add a **`VehicleSeat`** node (an `Area3D` with `vehicle_seat.gd`) as a child of
the root, then give it two children:

```
Truck (VehicleBody3D, vehicle.gd)
├── SeatDriver      (Area3D, vehicle_seat.gd)   role = Driver
│   ├── CollisionShape3D (BoxShape3D)   ← the "press E here" box, beside the door
│   └── SitPoint (Marker3D)             ← where the occupant sits (driver: the camera eye)
└── SeatPassenger   (Area3D, vehicle_seat.gd)   role = Passenger
    ├── CollisionShape3D (BoxShape3D)
    └── SitPoint (Marker3D)
```

- **`role`** (inspector): `Driver` controls the vehicle (drive input + HUD); `Passenger` just
  rides along. Set this per seat.
- **The box** (`CollisionShape3D`): size and place it where a player on foot stands to board
  (e.g. left of the cab for the driver). It is the zone that enables **E**.
- **`SitPoint`** (`Marker3D`): where the occupant is seated. For the driver it is also the
  **camera eye**, so place it at head height inside the cab, facing forward (the vehicle's local
  `-Z`).

You don't wire anything: the `Vehicle` discovers its seats automatically, and each seat
auto-detects the player (its collision mask is set in code). Standing in a box shows
`[E] Drive Seat` / `[E] Passenger Seat` at the crosshair; the driver gets free mouse look while
driving and exits with **Y**. A taken driver seat shows `Driver seat taken` instead, the prompt is
hidden while you are seated, and on exit you are dropped beside the seat you used.

:::tip[Seats are server-authoritative]
A seat refuses a second occupant, and if a seated player disconnects the server frees their seat
automatically. The driver/passenger logic lives in the **networked** path, so test seats in the
game (F5), not the standalone bench.
:::

## 4. Configure the powertrain

On the root `Vehicle`, open the **Drive** export group:

- **Propulsion Type**: `ELECTRIC` (single-speed, instant torque) or `THERMAL` (automatic
  gearbox). The inspector shows only the relevant sub-group (**Electric** or **Thermal gearbox**).
- Tune `engine_power`, `max_speed_kmh`, `reverse_max_kmh`, steering, brakes, and the wheel /
  suspension settings.
- **Mass** is the standard `RigidBody3D` mass; **Cargo** (`max_payload`, overload) drives the
  load limiter.

You never edit `vehicle_powertrain.gd` — the `Vehicle` copies these settings into it each frame
(so you can tune them live while driving the bench).

## 5. Register it on the network

A vehicle only replicates if the network layer knows it:

1. **Spawn registry** — add the scene path to `props_scene` in **both** `server/client.gd` and
   `server/server.gd`:

   ```
   'scenes/vehicles/<category>/<name>.tscn':
       preload('res://scenes/vehicles/<category>/<name>.tscn'),
   ```

   (These are plain string paths — if you ever **move** the scene, update them by hand; Godot's
   UID rename does not touch string paths.)

2. **Replication definition** — vehicles use the `vehicle` prop type, defined in
   `horizonserver/ds_genericprops/props/vehicle_def.json` (whitelisting `position`, `rotation`,
   `scenename`, `parent_id`, `pilot_uuid`, `steering`, `speed`, `cargo_mass`, `handbrake`,
   `mass`). If you reuse the `vehicle` type, there is nothing to add. A brand-new type needs its
   own `<type>_def.json` — see
   [Replication definition files](./props.md#replication-definition-files).

:::warning[Rebuild Horizon after touching a def]
A property (or a whole type) that is not whitelisted is dropped silently → the vehicle appears on
the server but is **invisible** to clients (`Object definition not found for type: …`). Add it to
the def and **rebuild Horizon**.
:::

## 6. Test

- **Bench (F6)** — `scenes/vehicles/vehicle_bench.tscn` drives the vehicle locally (no network):
  good for tuning the body, suspension and powertrain feel. The bench boards as driver only.
- **In game (F5)** — the full flow: spawn the vehicle, walk into a seat box, **E** to board as
  driver or passenger, drive, **Y** to leave. This is the only place seats and passengers are
  faithful.

## Cargo bed

The blockout body generates a **cargo bay** zone (tune it via the **Cargo** export group:
`cargo_bay_size`, `cargo_bay_offset`, `max_payload`, `overload_immobilize`). Any loose prop (a
crate, a mined rock…) that comes to rest inside the bay is **loaded**: the server freezes it,
parents it to the vehicle so it rides along, and folds its mass into the load. The bay detects
cargo through its mask only and is kept off every collision layer, so it never blocks the player's
interact ray.

- **Load** = bed cargo **+ seated players**. Over `max_payload` the HUD shows `OVERLOADED`; past
  `max_payload × overload_immobilize` the vehicle won't move.
- **Retrieve**: aim at a loaded item and press **E** (`[E] Carry`) — it is removed from the load
  and goes into your hands, like any [carriable](./props.md#carriables-carry--drop).
- Another **vehicle** is never loaded as cargo (so you can't swallow a truck with a truck).

## Hand brake

The driver toggles a parking **hand brake** with a **long press of Space under 3 km/h** (released
by throttle). It holds the vehicle still on flat ground and slopes, stays dynamic so a real impact
can still push it, and **stays engaged after the driver leaves**. It shows on the HUD and on the
dashboard (the `hanbreak` label below).

## Dashboard — optional in-cab screen

Show live data (speed, RPM, load…) on a screen in the cab using the generic 3D-screen pattern —
see **[GUI on a 3D screen](./in-3d-screen.md)** for the setup (SubViewport, ViewportTexture, and
the Local-to-Scene / viewport-path gotchas).

The **vehicle-specific** part is only the UI script: put `vehicle_dashboard.gd`
(`VehicleDashboard`) on your UI scene's root. It finds its owning `Vehicle` in the tree and shows
the generic Vehicle data each frame (speed, RPM, load, overload, powertrain, transmission) — so it
is reusable by any vehicle, and the Vehicle knows nothing about it. Name the Labels `speed`,
`RPM`, `Load`, `Overloaded`, `Elec_THerm`, `Transmission`, `hanbreak` (or adjust them in the
script).
