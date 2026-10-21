---
title: Ground dust
sidebar_position: 4
---

# Ground dust

A truck rolling on sand and a player running on dry dirt raise dust; the same truck on rock raises
almost none, and on a metal deck none at all. The dust is the colour of the ground it came from, hangs
in the air behind a vehicle as a trail, and settles.

## Who does what

The same split as the surface sounds (see [Surface sounds](../audio/surface_sounds.md)): one class
answers **which** ground, another **what it gives**, a third **draws** it.

| Piece | File | Job |
|---|---|---|
| `SurfaceProbe` | `scenes/common/surface_probe.gd` | Which family is the ground here (`sand`, `rock`, `metal`…). Already used by the footsteps and the tyres. |
| `SurfaceDust` | `scenes/common/surface_dust.gd`, data in `scenes/common/ground_dust.tres` | Family → how much dust (0..1), optional colour per family, and the air settings. |
| `DustEmitter` | `scenes/common/dust_emitter.gd` | Draws the dust of one actor (one `GPUParticles3D` per player or vehicle). |
| `VehicleDust` | `scenes/_universe/vehicles/vehicle_dust.gd` | How hard each driven tyre stirs the ground. |
| Shaders | `assets/_universe/vfx/ground_dust_process.gdshader`, `ground_dust.gdshader` | The motion (age, gravity, air drag, swelling) and the look (soft ragged blob, lit by the sun). |

The colour comes from `GroundLook` — the very colour the terrain is drawn with at that spot — slightly
lightened (fine grains in the air scatter more light). A family can force its own colour in
`color_by_family` (a concrete slab is not the colour of the planet under it).

## Tuning

Everything a designer tunes is data, in the Inspector:

- **`ground_dust.tres`** — `amount_by_family`: sand 1.0, dirt 0.8, gravel 0.45, rock 0.3, concrete
  0.06, metal 0. `default_amount` for an unknown surface (keep it low: an unmapped floor raising a
  sandstorm reads as a bug). The **Air** group: `air_drag` (how fast the air stops a grain),
  `air_settle` (how fast it falls back, written for the Earth's gravity and scaled by the body's own),
  `air_growth` (how much a puff swells).
- **Vehicle** (`Ground dust` group) — `dust` (the resource, null = no dust) and `dust_full_kmh`: the
  speed at which the tyres throw their full share.
- **Player** (`Ground dust` group) — `dust`.

## The physics

- A tyre lifts loose grains in proportion to how fast it sweeps the ground: the dust **grows with the
  speed** up to `dust_full_kmh`. A **spinning** wheel (wheel speed above road speed) digs and throws far
  more. Only the **driven** wheels are counted.
- The trail is laid by **distance**, not by time: one puff every 0.8 m a driven wheel rolls, spread
  along the stretch rolled since the last frame, so the clouds merge into one trail at any speed. Puffs
  timed per second left gaps of several metres at speed, a string of blobs like a coughing engine. A
  wheel spinning in place, which rolls no distance, still digs, in time.
- The **ground decides the opacity**, once: thick on sand, light on rock. (Counting it twice — in the
  tyre's rate and again in the puff — made rock and corundum dust invisible.)
- A footstep raises a small puff, harder at a run; a landing raises a bigger one.
- **In air**, a grain is braked fast and settles slowly, and the puff swells as it mixes: a cloud that
  hangs behind the vehicle. It sinks at a speed **proportional to the body's gravity**: a fine grain is
  held up by the air's *viscosity* (Stokes drag), which barely depends on the pressure — thin air or
  thick, the dust floats the same, and on a light moon it floats longer. (The air's *density*, which
  sets the wind's push on a door, does not enter here.)
- **On an airless body** (`PlanetData.atmosphere_profile == null`), there is nothing to brake or hold
  the grains: they fly on **ballistic arcs** under the body's real gravity and the puff does not swell.

## Why it is built this way

- **Client only.** The dedicated server draws nothing. Every client raises the dust of every vehicle
  and player it sees from the replicated motion, exactly as it plays their footsteps: nothing new goes
  over the network.
- **Particles live in the ground's frame.** At astronomic coordinates (~1e11 m on a client) a
  particle stored in world space would reach the GPU in float32 and shake by metres. The emitter is an
  *anchor* placed under the actor's parent (usually the planet) with `local_coords = true`: the
  positions stay exact, the cloud turns with the planet, and because the anchor does not follow the
  actor, the dust stays where it was thrown — **the trail draws itself**. Past 1 km a new anchor is
  laid and the old one is left to finish its puffs.
- **Manual emission.** Each actor has one `GPUParticles3D`, fed with `emit_particle()`: one draw call
  per actor however many puffs. Two traps measured in Godot 4.7:
  - `emit_particle()` emits **nothing** when `amount_ratio` is 0 — the emitter is `emitting = false`,
    `amount_ratio = 1`;
  - a `ParticleProcessMaterial` **overwrites** the colour given to `emit_particle()`, hence the custom
    process shader. In that shader, `start()` must not copy `EMISSION_TRANSFORM` (the emitter's frame,
    not the particle's): every particle would start at the emitter's origin.
- **Billboard in high precision.** The look shader keeps `MODELVIEW_MATRIX`'s translation and only
  replaces its rotation; the stock particle billboard rebuilds it from `MODEL_MATRIX`, which shakes at
  astronomic coordinates.
- **Cheap.** Nothing is emitted further than 90 m from the camera, an actor's emitter is built on its
  first puff, and a vehicle's surface is probed twice a second (from a physics frame, the only place a
  ray works).

## Adding dust to something new

Anything that touches the ground can raise dust in three lines:

```gdscript
var dust := DustEmitter.new(self, preload("res://scenes/common/ground_dust.tres"))
# … then, when it scuffs the ground (family from SurfaceProbe, sampled in a physics frame):
dust.puff(contact_point, family, strength, throw_velocity)
```

Call `dust.release()` when the object leaves the tree: the cloud lives in the parent's frame, not
under the object.

## The menu's trucks

The trucks driving around the main menu's outpost are frozen set pieces carried by `StageDriver`: their
physics speed is zero. Their dust, like every vehicle's, follows the speed their wheels are **shown**
rolling at (`Vehicle.shown_speed_kmh`, from the vehicle's own motion), so they raise their trail too.
