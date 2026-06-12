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
driving and exits with **Y**.

:::tip[Seats are server-authoritative]
A seat refuses a second occupant. The driver/passenger logic lives in the **networked** path, so
test seats in the game (F5), not the standalone bench.
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
   `scenename`, `parent_id`, `pilot_uuid`, `steering`). If you reuse the `vehicle` type, there is
   nothing to add. A brand-new type needs its own `<type>_def.json` — see
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

## Dashboard — optional in-cab screen

To show live data (speed, RPM, load…) on a screen in the cab, use Godot's "GUI in 3D" pattern: a
2D UI is rendered through a `SubViewport` and displayed on a mesh via a `ViewportTexture`. The
mining depot's screen (`mining_depot.tscn`) is the reference.

The pieces:

- a **UI scene** (a `Control` / `Panel` with your `Label`s) with `vehicle_dashboard.gd`
  (`VehicleDashboard`) on its root — it finds its owning `Vehicle` in the tree and shows its data
  each frame (reusable; the vehicle knows nothing about it),
- a **`SubViewport`** holding that UI scene,
- a **screen `MeshInstance3D`** whose material displays the SubViewport via a `ViewportTexture`,
- `scenes/interactables/gui_3d.tscn` — the reusable helper that forwards mouse/touch to the
  viewport (only needed once the screen is interactive).

Setup:

1. Build the UI scene (Labels named `speed`, `RPM`, `Load`, `Overloaded`, `Elec_THerm`,
   `Transmission`, or adjust the names in `vehicle_dashboard.gd`) and put `vehicle_dashboard.gd`
   on its root.
2. Under the vehicle, add a `Gui3D` (instance of `gui_3d.tscn`) with a child `SubViewport`
   containing your UI scene, plus the screen mesh.
3. `SubViewport` → **Update Mode = Always** (otherwise the screen freezes).
4. Screen mesh → `StandardMaterial3D`:
   - **Resource → Local to Scene = On** (required, see below),
   - **Albedo → Texture → New ViewportTexture → Viewport = this vehicle's `Gui3D/SubViewport`**,
   - **Shading = Unshaded** (or use Emission) so it stays readable.
5. On the `Gui3D`: `node_viewport` = the SubViewport, `node_quad` = the screen mesh, `node_area` =
   the touch `Area3D` (for interactivity).

:::warning[The screen material must be "Local to Scene"]
A `ViewportTexture` resolves its viewport per scene instance, so the material holding it (and any
resource containing it) must have **Local to Scene** enabled — otherwise Godot refuses to create
the ViewportTexture ("…not local to the scene").
:::

:::danger[Point the ViewportTexture at THIS vehicle's SubViewport]
If you copy a screen from another scene, its `ViewportTexture` keeps the **old** `viewport_path`
(e.g. `miningdepot/Gui3D/SubViewport`). A path that does not exist in this scene shows a blank
screen and throws `common_parent is null` **when you save**. Re-pick the Viewport so it points to
this vehicle's own `SubViewport`.
:::
