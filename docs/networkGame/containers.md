---
title: Containers
sidebar_position: 3.7
---

# Containers (dev)

The **developer** view of containers: how a container **locks** the objects placed inside it, and how
that behaves over the network. For the other trades:

- **Game design** (what they're for, variants, transport loop) → [Game Design → Containers](../gameDesign/containers.md).
- **3D** (meshes & dimensions) → [Creative → Container 3D models](../creativeConcept/container_models.md).
- **Level design** (placing one in a scene) → the [Setting one up](#setting-one-up) section below.

In one line: an object carried into a container (see [Props → Carriables](./props.md#carriables-carry--drop))
and left to **rest on the floor** inside gets **locked** (immovable) until someone picks it back up.

## How it works (server-authoritative)

A container scene carries the **`StorageContainer`** script (`scenes/props/StorageBoxes/container.gd`)
on its root, plus an **`Area3D`** covering the **interior volume**.

- Every few physics ticks the server scans that interior (`intersect_shape`, filtered to the **prop**
  collision layer) for carriables that have come to **rest** (low velocity) and are **not currently
  carried**.
- For each one it runs a **supported-from-below** check — a short ray straight down from the object's
  real underside (its collision AABB, not its origin) — so it only locks an object that is genuinely
  **resting on the floor** (or on a crate below it), never one held up sideways by a wall.
- A locked object is **frozen** (`FREEZE_MODE_STATIC`): the physics engine treats it as immovable, so
  nothing can push it. Picking it up sets `freeze = false` again, so it needs **no special release
  code** — the normal carry pickup frees it.

:::note[Why it's frozen-in-place and not re-parented — for now]
The container is **static** (it rides the planet frame like any prop), so freezing the object where it
rests, in the **same planet frame**, keeps it inside the container and replicates for free.

It is **not** re-parented under the container. Re-parenting a networked prop needs the parent to be a
**frame Horizon knows** — Horizon recomposes each child's world position from `parent_id` + the
parent's position. A container that is only known locally isn't a Horizon frame, so `parent_id =
container` would be **dropped by Horizon** and the object would **vanish on clients** (while the server
still has it). When containers become **movable**, they'll be promoted to real Horizon props (a def
with replicated position) and their contents re-parented under them — exactly like a vehicle's cargo
bed does today. See [Props → Positions are relative to a parent](./props.md#positions-are-relative-to-a-parent).
:::

## Setting one up

Put the `StorageContainer` script on the container scene root, add an **`Area3D` with a `BoxShape3D`**
covering the inside, and the container works — the script auto-finds the interior area and starts
locking any settled cargo. No Horizon change is needed while containers are static (a locked object
keeps its own `parent_id`; only its frozen state matters, and that rides its normal position
replication).

The interior `Area3D` must match the mesh's inner volume (that shape is what the lock scan uses); the
current sizes and wall thickness are on the [Container 3D models](../creativeConcept/container_models.md)
page.
