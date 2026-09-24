---
title: Ground fringe
sidebar_position: 3
---

# Ground fringe

An object standing on a planet used to meet the ground along a perfectly straight line. Nothing in
nature does that: there is always sand, dust or gravel banked against whatever sits on it, and the
absence of it is what makes a scene read as a model placed on a table.

The ground fringe paints the terrain's **own colour and texture** over the bottom of an object, with
an irregular, wind-drifted edge.

![A building on Tarsis 3: the pale corundum ground rises over the base of the wall, its upper limit
broken into tongues of sand rather than a level line](./static_files/ground_fringe_wall.png)

## What it actually does

Three things, and it is worth knowing which is which when something looks wrong:

1. It reads **the material the ground is really drawn with** at that spot — which is not always the
   same shader from one biome to the next — and borrows its colour and its texture.
2. It fades that out over the first few dozen centimetres, with the limit **displaced** by noise at
   three scales, so the band rises and falls along a wall instead of keeping one thickness.
3. At the contact it lights the band **as though it were ground**, not as part of the wall. Without
   that, a wall in shadow keeps a dark band while the sand beside it is in full sun, and the cut line
   comes straight back as a step in brightness.

![The same effect on a shaded face: the band stays as bright as the lit ground in front of it
instead of darkening with the wall](./static_files/ground_fringe_shaded.png)

## Networked props: nothing to do

**Any prop spawned through the network registry gets the fringe automatically.** You do not add
anything, and you do not need to know this page exists.

That includes rocks, crates, pallets, the cargo depot, the mining depot, the habitations — and any
prop added to the registry later. The hook lives at the single place props are instantiated, so a new
entry in `server/client.gd` inherits the effect with no code change at all.

:::tip[When it does *not* apply]
Buildings and structures placed **directly in a planet scene** are not networked props, so they are
not covered. That is the case below.
:::

## Placing your own object: add the component

If you drop a structure straight into a planet scene — the way the teleporter and the wind valley are
placed — you add the component yourself. It takes one node:

1. Select the **root** of your object in the scene tree.
2. **Add Child Node** → `Node`.
3. Drag `scenes/common/terrain_blend.gd` onto it.

The node's name does not matter; the type is what is recognised. Name it `TerrainBlend` anyway, so
the next person recognises it at a glance.

That is all. The component finds the planet on its own, measures the ground under the object, and
takes the fringe off again if the object ever leaves the ground.

:::tip[Also use this to override the automatic setting]
A networked prop that carries its own `TerrainBlend` node keeps it: the automatic path finds it and
leaves it alone. That is how you give one asset a taller or shorter band than the default.
:::

### Settings on the node

| Setting | Default | What it does |
| --- | --- | --- |
| `height` | 0.9 m | How high the sand reaches, at most. |
| `max_height_ratio` | 0.3 | Hard ceiling as a fraction of the object's own height. A 0.9 m band would otherwise swallow a 0.5 m crate whole. |
| `grounded_clearance` | 0.6 m | Above this height off the ground, the object is treated as airborne and loses its fringe. |
| `fallback_color` | sand brown | Used only when the biome yields no usable colour. |

### Settings shared by every object

These live on the material, `assets/_universe/_shared/materials/terrain_blend.tres`, and changing one
changes it everywhere. Edit it in the Inspector and restart the game — the per-texture copies are made
at startup, so an edit made mid-session only touches the template.

| Setting | Default | What it does |
| --- | --- | --- |
| `blend_noise_strength` | 0.6 | How much the limit rises and falls. Raise it for a more broken edge. |
| `blend_noise_scale` | 0.15 | Size of the pattern. **Lower** it for longer, wider tongues of sand. |
| `blend_noise_swell` | 0.22 | The low, slow octave — the one that makes the band deep in places and thin in others. |
| `blend_curve` | 3.5 | How fast the band gives way as it climbs. Higher fades sooner. |
| `blend_normal_lift` | 0.85 | How much the band is lit like ground rather than like the wall. |
| `blend_face_weight` | 1.0 | How much a **horizontal** surface loses the band. A slab is a floor, not a contact line. |
| `blend_inward_weight` | 1.0 | How much an **inward-facing** wall loses it — the inside of a building. |

## What never gets a fringe

Four exclusions, all deliberate:

- **Planets.** They are networked props too, and a celestial body is what everything else rests *on*.
- **Vehicles.** They drive, and the band is measured when an object settles, not every frame — a truck
  would carry a strip of sand from wherever it was last parked.
- **Players and NPCs.** A character standing inside a building is reparented under it, so without this
  the building's fringe would walk into their legs.
- **Any mesh that already carries a `material_overlay`** — the cargo depot's concrete floor, the
  mining depot's conveyor belt. There is only one overlay slot per mesh, and taking it would silently
  undo whatever was there.

## Known limits

- **A street can look like a room.** The interior test compares a face's normal to the object's
  centre, which is geometry, not space: it cannot tell the inside of a room from an alley between two
  halves of the *same* object. If an asset is shaped that way, lower `blend_inward_weight` on it.
- **No atmospheric haze on the band.** The aerial-perspective pass reads a copy of the screen taken
  before transparent surfaces are drawn, so nothing transparent can receive the veil. The band simply
  stops at 150 m, where the missing haze is under one step of 8-bit colour.
- **The pattern is anchored to the object**, not to the terrain grid: the same grain as the ground,
  not the same position. On a vertical face — the only place it is drawn — this is not visible.

## Measuring its cost

Put `debug_no_terrain_blend=true` in the `[debug]` section of your `client.ini`. The component then
attaches nothing at all, so this removes the **draw calls** and not merely the shader's cost: compare
`draw=` and `rgpu=` on the `[CPerf]` heartbeat with and without it, and the difference is the real
price of the feature.

:::warning[It is a measurement mode, not a fix]
With it on, objects meet the ground on a hard cut line again.
:::
