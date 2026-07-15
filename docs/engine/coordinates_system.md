---
title: Coordinate's system
sidebar_position: 3
---

# Coordinate's system

This page describes how the coordinates system works.

The rules are:

- Each **planetary system** has its own coordinates system.
- The **star** is at `0.0, 0.0, 0.0`.
- The coordinates of items **on a planet** are relative to the coordinate of the planet — which
  is **not fixed**: the planet moves around the star. Items therefore ride the planet's moving
  frame rather than sitting at absolute world positions.
- The expected maximum extent of a system is about **±900 000 000 000** (±900 billion) on each
  axis.

:::note Why this matters for gameplay code
Because a planet's frame is huge and constantly moving, a prop that is left in the "world" frame
(`parent_id = ""`) drifts away from the planet and appears to jump or disappear on clients. Props
that belong to a planet (or a vehicle) must be **parented** to it and stored with a **local**
position — the server re-parents them and the frame does the rest. See
[Network Game → Props](../networkGame/props.md).

These astronomic magnitudes also stress the physics engine: Jolt's narrowphase runs in
**float32 relative to each body's origin**, so collision points and raycasts become imprecise
(tens of metres of error) far from the origin. The engine mitigates this by chunking terrain and
centring large bodies near their own origin; app‑level code validates raycast hits in double
precision. See [Network Game → Collision layers](../networkGame/collision_layers.md).
:::
