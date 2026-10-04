---
title: Containers
sidebar_position: 2
---

# Containers (game design)

Containers are storage props the player **puts objects into to move and secure them**. They are a
cornerstone of the **transport / logistics** loop (load → haul → unload) and will grow into a big
system. This page is the **design** view; the other trades have their own:

- **Developers** → [Network Game → Containers](../networkGame/containers.md) (the mechanic & networking).
- **3D artists** → [Creative → Container 3D models](../creativeConcept/container_models.md) (meshes & dimensions).
- **Level designers** → [Level Design → Containers](../project/2_GCD/7_level_design.md#containers) (placing them).

## What the player experiences

- **Store**: carry an object into a container and set it down on the floor inside. Once it settles it
  **locks** — it becomes immovable, so it can't be knocked around by the player or another crate. The
  container stays tidy while you haul it around.
- **Retrieve**: pick a locked object back up to **free** it.
- **Honest placement**: only objects that actually **rest on the floor** inside lock. You can't hang
  something against a wall or wedge it on a crate's side to cheat storage.

This is the base contract. Everything below is design intent to build on it.

## Variants (by use)

The **mechanic is one and the same** for every container — variants are about *what* is stored and the
container's features, not different storage rules:

- **Refrigerated / sealed** — food, medical.
- **Tanks** — liquids and gases.
- **Ore hopper / open benne** — mining bulk.
- **Flat / strappable deck** — logistics, vehicles.

Content is signalled on the container itself (hazard/type **E‑INK symbol**, **status light**, parcel
number) — see the fuller list in [Transport / Inventaire](../project/3_GDD/1_Gameplay/Transport/1_Inventaire/0_Inventaire.md).

## Where it's going

Foreseen extensions (not built yet): **stacking**, **grids / magnets** to snap and pile crates,
**movable containers** (hauled by vehicles/cranes, not by hand), size/capacity tiers, and the mission
economy around them. The transport gameplay that frames all this lives in the
[Transport](../project/3_GDD/1_Gameplay/Transport/1_Inventaire/0_Inventaire.md) game-design section.
