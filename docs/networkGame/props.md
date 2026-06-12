---
title: Props network management
sidebar_position: 3
---

# Props network management

Generic props replicate their state through the same mechanism as the player: the game server
sends property updates to Horizon, which keeps an authoritative copy and forwards them to the
clients in range. This page also covers the **player's replication** to other clients — the
player is just an object of type `player` (with its own `player_def.json`); only its
input/action channel is specific (see [Player network management](./player.md)).

Which properties are actually replicated (and how far / how often) is **not** decided in your
GDScript: it is declared in a per-type **definition file**. See
[Replication definition files](#replication-definition-files) below — read it first, because a
property that is not declared there will silently never reach the clients.

## What is a generic prop?

A generic prop is any scene spawned in the game, except for the player scene (*normal_player.tscn*).

It can be a planet, a box, a building, a car...

## Writing a generic prop

The recommended way is to make your prop **extend `GenericProp`**
(`scenes/globals/generic_prop.gd`). It already provides everything a networked, carriable
prop needs:

- the replication signals (`hs_server_prop_update` / `hs_server_prop_delete`),
- the `uuid` / `type_name` / position state,
- server -> client replication every physics frame via `PropNet.server_tick(self)` —
  including **following the carrier** while the prop is held,
- the `"carriable"` group and the carry contract (`interact()` / `set_carried()`, which also
  disables the prop's collision while it is carried),
- reparenting and delete-on-exit.

So a carriable prop is just:

```
class_name Box50cm
extends GenericProp

func _ready() -> void:
	type_name = "box"
	super()
```

Build the scene (a body + collision shape + mesh), attach the script, and declare a
`<type>_def.json` (see [Replication definition files](#replication-definition-files)). Done —
no boilerplate to copy.

### Complex props

A prop with special behaviour may stay a standalone script (extending whatever body it needs)
and implement the contract itself, but it should still call `PropNet.server_tick(self)` from
its `_physics_process` so replication and carry-follow stay consistent. Example: the mining
rock (`rock_mining.gd`) is custom because it fractures, and only a **fully-fractured ore
piece** is carriable (it overrides `interact()` for that) — a whole rock is not carriable.

## Update properties

### Server sends update to client

The server can send updated properties to the client, for example, a LED state.

For that, you need to emit a signal on *hs_server_prop_update* with this code:

```
emit_signal(
"hs_server_prop_update",
uuid,
{
"led": true,
},
type_name,
has_parent
)
```

In the argument where we have *led*, we can put many properties.
All other arguments are the same.

### Client receives update

The client receives the properties updated by the server in the function *client_channel_data_update*.

The *data* argument is a dictionary where the key is the property and the value is the property value.

You can update or do what you want with the value.

:::note[value int]
Be careful, the int value sent by the server is a float when it arrives, so you need to convert it to int before use.
:::

## Delete prop

To delete a prop, the function *_exit_tree* sends the signal to the client, and the client deletes the scene; it's automatic!

## Replication definition files

Emitting `hs_server_prop_update` (props) or `server_send_properties_to_client` (player) is
**not enough** for a property to reach the clients. Horizon only replicates the properties
that are **declared** for that object type, in a definition file.

These files live in the Horizon plugins, one per object type:

```
horizonserver/ds_genericprops/props/<type>_def.json
```

where `<type>` is the prop's `type_name` (e.g. `box`, `miningrock`, `player`).

Example (`box_def.json`):

```json
{
  "channels": [
    {
      "zone": 0,
      "distance": 150.0,
      "frequency": 30.0,
      "properties": ["position", "rotation", "opened", "parent_id"]
    },
    {
      "zone": 6,
      "distance": 153.0,
      "frequency": 3.0,
      "properties": ["scenename"]
    }
  ]
}
```

Each entry in `channels` is a replication **zone**:

- `distance` — clients within this radius (meters) of the object receive this zone's properties.
- `frequency` — how many times per second this zone is replicated (use a high rate for fast-changing data like `position`, a low rate for rarely-changing data).
- `properties` — the **whitelist**: only these property names are replicated.

:::danger[The whitelist is silent]
A property you send that is **not** listed in any zone is dropped without any error. The
client simply keeps its default value (empty string, `0`, ...). Symptom: the object behaves
correctly on the server but is wrong on the other clients. Whenever you add a new replicated
property, **add it to the type's `_def.json`** (and rebuild Horizon).
:::

:::warning[Keep creation properties in the same zone]
A client instantiates an object as soon as it receives its `scenename`. If `scenename` is in
a farther zone than `position`/`parent_id`, a client standing *between* the two distances
receives the scene **without** its placement and spawns the object at the world origin
`(0,0,0)`. Keep `scenename`, `position` and `parent_id` within the **same** `distance`.
:::

:::danger[Always declare zone 6 — the deletion channel]
Object deletion is sent on **channel 6**. Every prop type's def **must** include a `zone 6`
entry (it carries `scenename`). Without it, deleting the object fails with
`Channel 6 not defined for object <uuid>`: it is removed server-side and from GORC, but the
**delete never reaches the clients**, so it stays on screen (a "ghost"). When you add a new
prop type, copy the `zone 6` block from `box_def.json` / `miningrock_def.json`.
:::

## Spawning a prop from the game server

If the game server creates a prop at runtime (not through the normal spawn flow), registering
it in Horizon is **not** enough: Horizon's replication is players-only and does not echo the
object back to the game server, so the prop would have no server-side body (it floats / can't
be interacted with until a reconnect reloads it from persistence).

Create it **both** in Horizon (for the other clients) **and** locally on the game server. The
helper does both:

```
NetworkOrchestrator.spawn_prop_authoritative(data)  # data must hold "uuid" and "type"
```
