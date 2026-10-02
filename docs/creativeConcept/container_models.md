---
title: Container 3D models
sidebar_position: 5
---

# Container 3D models (for 3D modelers)

This page is for **3D artists** preparing a **container** mesh in Blender. Read the general
[3D models](./3d_models.md) page first (LODs, textures, export); this page only adds what is specific to
containers.

For what containers do in-game see [Game Design → Containers](../gameDesign/containers.md); for the code
side see [Network Game → Containers](../networkGame/containers.md).

## Current sizes (temporary meshes)

Two sizes exist so far — the meshes are **placeholders** (that's why they're named *test* containers).
Both use **4 cm walls**, giving a usable interior width of **2.52 m** (2.6 − 2 × 0.04).

| Container | Exterior (L × W) | Wall thickness | Interior width |
|---|---|---|---|
| `test_containers_6x2.6` | 6 × 2.6 m | 4 cm | 2.52 m |
| `test_containers_12x2.6` | 12 × 2.6 m | 4 cm | 2.52 m |

## Modeling notes

- **Walls & interior**: keep the **4 cm** wall thickness and the resulting **2.52 m** clear inner width —
  crates are sized against that inner volume, and the game's storage zone is fitted to it.
- **Interior volume must be reachable**: the container has an inner `Area3D` (set up by level/dev) sized
  to the empty space; the mesh's inner faces should match it so objects settle where the game expects.
- **Collision**: model the **floor and walls** as collision (like other props) so carried objects rest
  on the floor and stop at the walls. An open side (benne) simply has no wall there.
- **Origin**: keep the object origin sensible (centred on the footprint) — game code uses the mesh /
  collision bounds, so an off-origin model still works, but a clean origin makes placement easier.

## Variants to come

Future containers will differ by use (refrigerated, tanks, ore hoppers, flat decks) — those are new
**meshes/features**, not new dimensions rules. Coordinate sizes with game design before modeling a new
variant.
