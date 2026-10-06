---
title: Engine (Godot) — Overview
sidebar_position: 1
---

# Engine — Godot

This section gathers the **engine-level** technical documentation for DyingStar: how the
Godot project is set up, how the world coordinate system works, how props are spawned, the
overall network architecture, the planet generation tech, and the observability stack.

It was migrated from the community wiki and **updated against the current code** where the two
diverged; every such divergence is called out in a `:::note` or `:::warning` block on the page.

Pages:

- [Local dev setup](./local_dev_setup.md) — run the client and a local server together inside the Godot editor.
- [Coordinate's system](./coordinates_system.md) — how world positions are expressed (star at origin, planet‑relative frames).
- [Put a prop and spawn it](./put_prop_and_spawn.md) — add a new prop type and spawn it from the client.
- [Network system (draft)](./network_system.md) — the full multiplayer architecture and the planned service catalogue.
- [Planet tech](./planet_tech.md) — procedural planet generation (quadtree, heightmaps, V2).
- [Observability with Grafana & Godot](./observability.md) — logs, metrics and traces from Godot.

For the deeper, player‑facing networking explanations, see the [Network Game](../networkGame/intro.md)
section; for the planet pipeline, see [Planet Tech](../planetTech/1_intro.md).
