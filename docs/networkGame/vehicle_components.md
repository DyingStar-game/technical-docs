---
title: Vehicle components
sidebar_position: 4.5
---

# Vehicle components (engines, and what comes next)

:::tip[Read the vehicle page first]
This page assumes you know how a vehicle is built and replicated — see
[Adding a vehicle](./vehicles.md).
:::

A **component** is a part you can hold in your hands and bolt into a vehicle: today a **T1 electric
motor**, tomorrow a battery, a tank, a set of tyres. It is an ordinary carriable prop that happens
to fit in a **bay**, and **what is fitted is what decides how the vehicle performs**.

That last point is the whole idea. Before this, a truck's performance was typed into the editor —
`engine_power = 850`, `max_speed_kmh = 55`, both chosen by ear. A vehicle could not be upgraded,
could not break down, could not be repaired. Now: pull one motor out of a truck and it measurably
loses a third of its pull; pull all three and it will not move, and will not even start.

## The pieces

| File | What it is |
|---|---|
| `scenes/_universe/vehicles/vehicle_component_spec.gd` | `VehicleComponentSpec` — what **any** component is: `display_name`, `kind` (`ENGINE` / `BATTERY` / `TANK`), `tier`, `mass_kg`, `scene_path`. |
| `scenes/_universe/vehicles/vehicle_engine_spec.gd` | `VehicleEngineSpec extends VehicleComponentSpec` — what an **engine** is: `power_w`, `torque_nm`, `efficiency`, `propulsion`, gearbox fields. |
| `scenes/_universe/vehicles/specs/engine_t1.tres` | The T1 itself: 100 kW, 600 N·m, efficiency 0.9, 25 kg. |
| `scenes/_universe/props/vehicles/engine_t1.tscn` | The **object in the world**: a `RigidBody3D` with a `PropSync` (`type_name = "vehicle_component"`), carriable like a hauling crate. |
| `scenes/_universe/vehicles/vehicle_component_slot.gd` | `VehicleComponentSlot` — a **bay**, placed by the designer. It also owns what it means to *sit* in it. |
| `scenes/_universe/vehicles/vehicle_component_bays.gd` | `VehicleComponentBays` — the bookkeeping for one vehicle: what exists, what is fitted, what it adds up to. |
| `scenes/_universe/vehicles/vehicle_drive_spec.gd` | `VehicleDriveSpec` — the sizing model, translated 1:1 from the design sheet. Pure, no nodes. |

**A spec is data, a component is an object.** The `.tres` says what a T1 *is*; the `.tscn` is the
thing lying on the floor that you can trip over. Keeping them apart is what lets a battery ship
later without a line of engine code moving.

## The drive model

`VehicleDriveSpec` is the sizing sheet and nothing else — no gameplay fudge, no clamp. It is
unit-tested against the sheet's five reference vehicles.

| Quantity | Formula | MVP truck, 3 × T1 |
|---|---|---|
| Mechanical power | `sum(P_elec × efficiency) × pump_eff × hydraulic_eff` | 172.8 kW |
| Mechanical torque | `sum(torque) × torque_factor` — **no efficiency term** | 1800 N·m |
| Angular speed `w_max` | `P / C` | 96 rad/s = **917 rpm** |
| Top speed | `w_max × R_wheel` | **103.7 km/h** |
| Tractive force | `C / R_wheel` | **6000 N** |
| Rolling resistance | `Cr × rolling_factor × m × g` | 103 N empty |
| Climbable slope | `asin((F − F_roll) / (m·g))` | **33°** |
| Max acceleration | `(F − F_roll) / m` | 3.93 m/s² |

Note the **sum**: over the motors actually fitted, not "× count". Mixing a T1 and a T2 costs zero
extra lines. And `efficiency` belongs to the **motor** (a T2 may be better), while
`pump_efficiency` / `hydraulic_efficiency` belong to the **chassis** — that is its transmission.

### The motor count does not change the top speed

`w_max = P / C`, and both are proportional to the number of motors, so **it cancels**. That is
physically right — identical motors in parallel spin at the same speed and add their torque — and it
is good design: **motors are a question of pull and payload, not of speed.**

| Motors | Force | Acceleration | 0–100 km/h | Top speed |
|---|---|---|---|---|
| 0 | 0 N | — | — | **cannot move, cannot start** |
| 1 | 2000 N | 1.26 m/s² | 22.0 s | 103.7 km/h |
| 2 | 4000 N | 2.60 m/s² | 10.7 s | 103.7 km/h |
| **3 (nominal)** | **6000 N** | **3.93 m/s²** | **7.1 s** | **103.7 km/h** |

Top speed follows the motor **tier**, the chassis `torque_factor` and the **wheel radius** — not the
number of motors. If you ever see the top speed move when you add a motor, `w_max` is wrong.

:::warning[`engine_force` is applied PER DRIVEN WHEEL]
Godot applies `VehicleBody3D.engine_force` to **each** wheel flagged `use_as_traction`, so the
sheet's total force is divided by the driven-wheel count before it is handed over. Getting this
wrong is a factor of four on a 4×4 and **nothing would report it** — the truck would simply
accelerate four times too hard, and someone would "fix" it by tuning a magic number back in. So it
is **measured**, not assumed: `test/integration/test_engine_force_per_wheel.gd` runs two identical
rigs, one 4WD and one 2WD, and compares them. Measured ratio: **1.90** (2.0 = per wheel, 1.0 = whole
body).
:::

## Bays

A bay is a `VehicleComponentSlot`, a **`Marker3D`** dropped under the vehicle. Nothing has to be
*detected*: the player fitting a part is aiming with the carry placement ray, which already resolves
a world point, and the vehicle picks the nearest free bay to it. A marker gives the editor gizmo for
free and costs nothing at runtime — no broad-phase entry, no monitoring pass.

| Property | Default | Role |
|---|---|---|
| `door_id` | `""` | The hatch guarding this bay — the `door_id` of a `VehicleDoorHandle` on the same vehicle. Empty = open access. Same spelling as `VehicleSeat.door_id`. |
| `snap_range` | `0.5` | How near the drop point must land (m) for this bay to claim the part. |

**A bay does not decide what goes into it.** The truck's four hatches are four identical boxes;
typing a kind into each would freeze game design into a scene, and a bay's node name is the key the
replicated and persisted table is written with — it has to describe **where** the bay is, nothing
else. How many engines a chassis will run is the **chassis's** business: `max_engines` on the
`Vehicle`. A refusal comes back as a *sentence* (`"This chassis takes 3 T1 Electric Motor"`),
because a refusal the player cannot read is indistinguishable from a bug.

:::danger[Never parent a physics body under a hatch mesh]
The truck's hatch meshes carry a **non-uniform scale** `(0.175, 0.225, 0.325)`. Jolt handles a
non-uniformly scaled shape badly, and a `RigidBody3D` reparented under one inherits it. Bays are
direct children of the vehicle, exactly like `SeatDriver` and `Handle_FL`.
:::

## Fitting and removing

Fitting **extends the existing drop path** rather than adding a network action: the gesture we
wanted — *aim at the bay, press E* — **is** putting an object down. `CarryPlacement.resolve()`
already follows your gaze and snaps to shelf slots; bays are one more candidate. Three lines
client-side instead of a full round trip, and the anti-cheat checks (`_can_see`,
`_is_blocked_by_geometry`) are already in place. Removing is free: the part is in the `carriable`
group, so **[E] Carry** takes it back out.

The bay owns what it means to sit in it — `VehicleComponentSlot.seat()`:

- frozen **KINEMATIC** (a `STATIC` frozen body gets its world transform rewritten every physics
  frame instead of riding its parent);
- excepted from the vehicle's own collision, so it cannot shove the truck it is bolted into, while
  keeping its collision **layer** so you can still aim at it to take it back;
- seated **on** the bay rather than left where it happened to land — a fitted part is at its bay by
  definition, and a freshly spawned one has usually fallen a little before anyone gets to it.

That one call is used by all three paths that need it — fitting by hand, restoring from the database
at boot, and mirroring the replicated table on a client. They used to spell the same six lines out
each, and the one that drifts is the client, where the part then falls out of a truck the server is
holding pinned.

:::warning[Two of the truck's hatches are inside the cargo loading zone]
So a part put down there would be swallowed as **freight** unless something says otherwise. The rule
is about **state**, not type: a **loose** component is ordinary cargo and loads into the bed like a
crate (hauling a spare motor is the point of the feature); only a **fitted** one is refused. The bay
is also tested **before** the bed on the drop path.
:::

A fitted component is deliberately **not** in the bed's `_locked_cargo`, which has a pleasant side
effect: a bolted-in motor is **not** thrown out by the rollover spill. A bolted engine stays bolted.

## Mass

```
vehicle mass = empty_mass + sum(fitted component mass_kg) + cargo
```

A component's mass is part of the **vehicle**, never of its payload. Routed through
`get_cargo_mass()` it would eat the load limiter's budget and could **immobilise a truck for being
overloaded by its own engines**. On the MVP truck: 1425 kg bare chassis + 3 × 25 kg = the sheet's
1500 kg *mVide*, and `max_payload = 1200` gives 2700 kg fully laden = *mChargé*.

:::warning[`empty_mass` is declared, not captured]
It is an `@export`, not a snapshot of `mass` taken at `_ready`. A persisted vehicle is given its
**replicated** mass *before* `_ready` runs — `create_generic_object` applies the channel data first,
and `uuid` is still empty at that point, so the "the server never applies channel updates" guard
does not fire. The old snapshot therefore captured chassis + modules + whoever sat in it last
session, and **the truck grew heavier at every single reload**.
:::

## Replication and persistence

Two GORC definitions, in `horizonserver/ds_genericprops/props/`:

- **`vehicle_component_def.json`** — `position`, `rotation`, `parent_id`, `slot_id`, `weight` on
  zone 0; `scenename` on both zones.
- **`vehicle_def.json`** gains **`components`** on zone 0: the bay-to-part table
  `{bay name: component uuid}`, built exactly like the existing `seats`.

:::danger[Deploy Horizon first]
A property missing from a definition is dropped **without a word**. Ship the game side first and
`components` — and the whole `vehicle_component` type — simply vanishes, with nothing in any log to
say so. `scenename` **and** `parent_id` are both mandatory (the client waits for both before it will
instance a prop), and `weight` is too (`PropSync.send_properties_to_client()` sends it for every
prop). See [Replication definition files](./props.md#replication-definition-files).
:::

**Three levels, no redundancy:**

| Level | Holds | Lives |
|---|---|---|
| `slot.occupant` | the runtime truth | server memory |
| `VehicleComponent.slot_id` | the persistence link | replicated **and** persisted, on the part |
| `components` | the replicated view | **derived** on every replication, so it cannot diverge |

`slot_id` on the part **simplifies rather than costs**. After a restart, persistence returns the
part parented to the vehicle with the right pose — but nothing says which **bay** it belongs to, so
it is neither frozen nor pinned and it falls straight through the truck. The shelf solves the same
problem geometrically, with a tolerance and a 600-frame retry window; naming the bay deletes that
function outright.

The **client needs `components` too** — it is not a convenience. `_sync_powertrain()` is only called
from the server's drive path, so without the table a replica keeps the helper's defaults and its
**rev counter lies**. For now one tier exists, so "uuid count × `engine_t1.tres`" is enough; **the
day a T2 ships, the tier has to be replicated.**

## Factory engines

`startup_items.json` seeds vehicles with empty bays — so **none of them would move**.
`factory_engines: Array[VehicleEngineSpec]` on the `Vehicle` is what the chassis leaves the works
with, and the server turns it into **real, removable parts** with

```
uuid = PropSpawn.stable_uuid("<vehicle uuid>:<bay name>")
```

Same seed, same uuid, so a restart **upserts instead of piling on a duplicate** — a direct answer to
the "Horizon re-seeds and doubles the world" trap.

:::note[Known limitation: orphan rows]
Horizon re-seeds vehicles with **new** uuids on every boot over a non-empty database. A vehicle that
is replaced leaves its engines behind, keyed to a parent that no longer exists. Measured on a fresh
world: **59 engine rows for 16 trucks** instead of 48 — 48 attached to a live vehicle, **11
orphans**. They are inert rows, not a gameplay bug, and the duplicate guard itself works. The
underlying behaviour is Horizon's re-seed, which affects every prop type.
:::

## Adding a new kind of component

`VehicleComponentSpec` is the base class and the extension point:

1. Write `VehicleBatterySpec extends VehicleComponentSpec` with whatever a battery needs. **No
   engine code moves.**
2. Add a `.tres` for the tier and a `.tscn` for the object (copy `engine_t1.tscn`: a `RigidBody3D`
   on the prop layer, a `PropSync` with `type_name = "vehicle_component"` and `enable_carry = true`,
   a mesh, a collision shape, and an `Area3D` on the interactable layer so the interact ray sees
   it).
3. Register the scene in `SpawnCatalog` and in `props_scene` on **both** `server/client.gd` and
   `server/server.gd`.
4. Give the chassis its limit: one more branch in `VehicleComponentBays.limit_for()`.

The GORC type stays `vehicle_component`, so **there is no new Horizon definition and no lockstep
PR** — that is the point of a shared type.

:::danger[No `CSGBox3D` for the mesh]
A CSG node only draws when it is the **root** of its CSG tree. Under a `RigidBody3D` it is simply
**invisible** — an object that is correct in every piece of data and absent from the screen. Use
`MeshInstance3D` + `BoxMesh`: same cube, and you can see it.
:::

## Testing

Four suites. GUT is **disabled in CI**, so run them by hand:

```bash
godot --headless -s addons/gut/gut_cmdln.gd -gdir=res://test/unit -gexit
godot --headless -s addons/gut/gut_cmdln.gd -gdir=res://test/integration \
  -gselect=test_engine_force_per_wheel -gexit
```

| Suite | Asks |
|---|---|
| `test_vehicle_drive_spec` | Does the model reproduce the sheet's five reference vehicles? |
| `test_truck_factory_fit` | Do the truck's bays, limits and factory engines agree with the scene? |
| `test_engine_component` | Is the part carriable, aimable, and does its GORC type match the def? |
| `test_engine_force_per_wheel` | Per wheel or whole body? (**integration** — it runs real physics.) |

In game, the HUD carries the same instrument: the model's prediction and the **measured**
acceleration side by side, with a 0–100 stopwatch. A model you cannot compare against a measurement
is a model you have to take on faith. It can be hidden from **Settings ▸ General ▸ Vehicle
dashboard**.
