---
title: Adding a vehicle
sidebar_position: 4
---

# Adding a vehicle

:::tip[New here? Read the overview first]
**[How DyingStar networking works](./intro.md)** explains the multiplayer basics in plain
language. This is a step-by-step build guide — but good news: most of the time a new vehicle is
just a **scene to assemble**, with little or no new code.
:::

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

You don't wire anything: the `Vehicle` discovers its seats automatically. The seat box is
**passive** — it never monitors. Instead the **player's own detector** is the single monitor that
reports when it walks into a seat zone. This avoids every seat of every vehicle running a
broad-phase overlap test each physics frame, and it works identically on client and server.
Standing in a box shows `[E] Drive Seat` / `[E] Passenger Seat` at the crosshair; a taken driver
seat shows `Driver seat taken` instead. The driver gets free mouse look while driving and exits
with **Y**; the prompt is hidden while seated, and on exit you are dropped beside the seat you used.

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
   `scenename`, `parent_id`, `pilot_uuid`, `steering`, `speed`, `cargo_mass`, `handbrake`, `mass`,
   `headlights`). If you reuse the `vehicle` type, there is nothing to add. A brand-new type needs
   its own `<type>_def.json` — see
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

## Cargo — loading the bed

Two **designer-placed** zones drive cargo (no per-vehicle code):

- **`cargo_bay`** — where cargo *sits*. Tune it via the **Cargo** export group (`cargo_bay_size`,
  `cargo_bay_offset`, `max_payload`, `overload_immobilize`). It is also the passive zone the player's
  detector overlaps to count their weight while standing in the bed.
- **`Cargo_loading_zone`** — where dropping is *allowed to load* (it sticks). Add a `CollisionShape3D`
  with a `BoxShape3D` named `Cargo_loading_zone` (or assign it to the `Vehicle`'s **Cargo loading
  zone** export), sized a bit larger than the bay so reaching over the wall counts. Its physics
  collision is turned off at runtime — it is only a zone marker. If unset, the `cargo_bay` box is
  used as a fallback.

The load counts toward `max_payload`, the overload limiter shown on the dashboard.

- **Loading** — carry a prop (a crate, a mined rock) and **drop it inside the loading zone** —
  whether you stand in the bed *or* reach over from outside; the zone (not your position) decides. The
  `[E]` prompt reads **`[E] Cargo`** when dropping would load it (it sticks) and **`[E] Drop`**
  otherwise. The carrier hands it to the truck: the prop is frozen, parented to the vehicle so it
  rides along, and its mass is folded into the load. The bed never polls — loading happens on drop.
- **Placed in the bay** — a loaded item is tucked **entirely inside** the `cargo_bay` (using its real
  collision bounds, so any size or off-centre pivot fits) and rested on the bed floor, even when
  dropped from far / over the rim.
- **A held prop passes through vehicles** while carried, so a held box can't shove or flip a much
  heavier truck — you load by dropping, not by ramming.
- **Retrieve** — aim at a loaded item and press **E** (`[E] Carry`); it leaves the load and goes
  into your hands, like any [carriable](./props.md#carriables-carry--drop).
- **What counts as load**:
  - the props locked in the bed — each prop's weight is its `RigidBody` **mass**;
  - **on-foot players** standing in the bed (their body mass), **plus whatever they hold** in their
    hands.
- **A mining rock's mass scales with its size**: a whole rock keeps the mass set on its scene
  `RigidBody` (the GameDesigner value); a cut piece weighs that scaled by its volume ratio (a half
  ≈ half, a quarter ≈ a quarter), so smaller pieces load the bed less.
- Over `max_payload` the HUD shows `OVERLOADED`; past `max_payload × overload_immobilize` the
  vehicle won't move. Another **vehicle** is never loaded as cargo (no swallowing a truck with a
  truck).
- **Rollover** — if the vehicle tips past `cargo_unlock_tilt_deg` (default 65°), the bed unlocks and
  spills its whole load (GDD: the lock releases past a certain inclination).

:::note[Riding a moving bed]
Standing in the bed adds the weight, but **walking** in a *moving* bed (riding it on foot) is not
supported yet — it needs client-side prediction. A moving truck currently leaves a walker behind.
:::

### How the load rides the truck (freeze mode)

A loaded crate must follow the truck **rigidly** — and it is a `RigidBody3D`, which the physics engine
places in **global** space, *not* by inheriting its parent's transform. So parenting a crate under the
truck is **not enough**; how it is frozen matters.

:::warning[Use FREEZE_MODE_KINEMATIC for a body riding a moving parent — never STATIC]
A frozen `RigidBody3D` has two modes:

- **`FREEZE_MODE_STATIC`** (the default for a frozen body) behaves like a `StaticBody`: the physics
  server keeps **rewriting its world transform every physics frame**. Under a moving parent it stays
  put in the world while the truck drives off — the *"cargo left behind at speed"* bug.
- **`FREEZE_MODE_KINEMATIC`** is *animatable*: the body **follows its node's transform**
  (`parent_global × local`), so as the truck moves, the crate rides with it.

The crate is set **KINEMATIC** on both sides: the server does it when it locks the crate, and each
client does it for the replica **derived from the parent** — when a prop is reparented under a
`Vehicle` it switches to KINEMATIC, and back to STATIC when it returns to the world (`PropNet.apply_ride_freeze_mode`). Nothing extra is replicated for this: the client reads it from `parent_id`, which already travels.
:::

On top of that, two pins keep it perfectly stuck:

- **Server pin** — each physics frame the vehicle re-asserts every locked crate's **constant local
  pose** in the bed (`_pin_locked_cargo`), so a KINEMATIC body can't drift relative to the moving
  truck. The replicated local position therefore stays constant.
- **Client pin** — each render frame the prop re-asserts that same local pose
  (`PropNet.ride_pin`), so the crate tracks the **render-interpolated** truck without stepping at the
  physics rate (which would jitter). A direct set, not a lerp.

:::note[Cargo debug envelope]
Turn on **Settings → General → Cargo debug** to draw a green envelope around every crate that is
*really* locked in a bed (i.e. reparented under the vehicle). An item merely resting loose in the bed
gets none — a quick way to tell "stuck" from "just sitting there".
:::

## Hand brake

The driver toggles a parking **hand brake** with a **long press of Space under 3 km/h** (released by
throttle). It holds the vehicle still on flat ground and slopes — once stopped it is **frozen** so
it can't creep — and **stays engaged after the driver leaves**. Shown on the HUD and on the
dashboard.

## Head lights

Head lights are a **drop-in** like seats: add any **`Light3D`** (e.g. a `SpotLight3D` at the front
facing the vehicle's local `-Z`) to the group **`vehicle_light`** anywhere under the scene — no
code. The driver toggles them with **L**; the state is server-authoritative and replicated, so every
client sees them. Shown on the HUD (`[L] lights`) and on the dashboard. The truck ships with two
front SpotLights as the example.

`L` is **contextual**: it drives the **head lights** while seated as driver, and the player's
**flashlight** on foot — the two never fire at once.

## Dashboard — optional in-cab screen

Show live data (speed, RPM, load…) on a screen in the cab using the generic 3D-screen pattern —
see **[GUI on a 3D screen](./in-3d-screen.md)** for the setup (SubViewport, ViewportTexture, and
the Local-to-Scene / viewport-path gotchas).

The **vehicle-specific** part is only the UI script: put `vehicle_dashboard.gd`
(`VehicleDashboard`) on your UI scene's root. It finds its owning `Vehicle` in the tree and shows
the generic Vehicle data each frame (speed, RPM, load, overload, powertrain, transmission) — so it
is reusable by any vehicle, and the Vehicle knows nothing about it. Name the Labels `speed`,
`RPM`, `Load`, `Overloaded`, `Elec_THerm`, `Transmission`, `hanbreak`, `Light` (or adjust them in
the script).

## Rear-view camera & mirrors

A live camera feed on an in-cab screen — a **drop-in** (`scenes/vehicles/rear_camera.tscn`),
reusable and **client-only** (no render on the headless server). Use it for a reversing camera and
for side / rear-view mirrors (the GDD allows "mirrors **or** relayed cameras"). Godot has no cheap
real reflective surface, so a mirror is just a camera too.

**Setup** (no code):

1. Instance `rear_camera.tscn` under the vehicle.
2. `RearCamera` **is** a Camera3D — place and frame it in the editor (gizmo / **Preview**), at the
   back looking behind (or at a side mirror, looking back/outward). It never renders to the player's
   view; a twin camera inside its `SubViewport` (sharing the main `world_3d`) copies its pose + fov
   and renders the feed.
3. Add a screen surface — a `MeshInstance3D` with a **`QuadMesh`** (clean `0..1` UVs) — in the cab
   and set it as the `RearCamera`'s **`screen`**. The feed material is applied at runtime and is
   **one-sided** (shows only on the quad's front face). If a screen is blank, the quad faces the
   wrong way — tick **Flip Faces** on its mesh or rotate it 180°. (Flip Faces only changes which side
   is visible; it does **not** flip the image left/right — that is the `mirror` flag below.)
4. **`mirror`**: off = a reversing camera (true view); on = a mirror (reverses left/right).
5. **`resolution`**: match its aspect to the screen quad to avoid stretching.
6. **`max_distance`** / **`refresh_hz`**: see Performance below.

:::warning[Performance — each feed is a second full render]
Each `RearCamera` renders the whole world again, so a rear cam + two mirrors = three extra renders.
Two built-in limiters keep this cheap on weak GPUs (the screens still stay live for everyone):

- **`max_distance`** — beyond this distance from the viewer the feed stops rendering (keeps its last
  image; it is unreadable from afar anyway). `0` disables the distance cull.
- **`refresh_hz`** — how many times per second the feed re-renders (default 20, not the full frame
  rate). `0` renders every frame.

Also keep `resolution` small.
:::
