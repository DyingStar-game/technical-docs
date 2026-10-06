---
title: Props network management
sidebar_position: 3
---

# Props network management

:::tip[New here? Read the overview first]
**[How DyingStar networking works](./intro.md)** explains the whole system in plain language, with
no code — start there if words like *replicate*, *Horizon* or *GORC* are new to you. This page is
the hands-on guide for people who write props.
:::

In plain terms: a "prop" is any object in the world — a box, a rock, a building, a vehicle. This
page shows how to make one that **every player sees** and that **stays in sync** for everyone.

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

**A prop is networked because it carries a `PropSync` child node**, not because of what its script
inherits from. Add a `Node` named **`PropSync`** to the scene, give it the
`scenes/globals/prop_sync.gd` script, and set two things in the Inspector:

| Property | What it does |
|---|---|
| `type_name` | The GORC type, e.g. `box`. **Must match** a `<type>_def.json` on Horizon, or the prop is dropped in silence — see [Replication definition files](#replication-definition-files). |
| `enable_carry` | Puts the prop in the `"carriable"` group and wires the carry contract. |

That child provides everything a networked prop needs:

- the replication signals (`hs_server_prop_update` / `hs_server_prop_delete`),
- the `uuid` / `type_name` / position state,
- server -> client replication driven by `PropNet.server_tick`, which sends an update **only when**
  the prop's local position/rotation/parent actually changes (not every frame); a held or loaded
  prop does **not** re-announce itself — Horizon rebuilds its world position from its parent (see
  [Carriables](#carriables-carry--drop)),
- the carry contract (`interact()` / `set_carried()`),
- reparenting and delete-on-exit.

:::tip[The simplest prop has no script at all]
`scenes/_universe/props/containers/box_50cm.tscn` is a body, a collision shape, a mesh and a
`PropSync` child with `type_name = "box"`. Build the scene, declare its `<type>_def.json`, done.
:::

### Why a child node instead of a base class

Because props are not all the same kind of body. A crate is a `RigidBody3D`, a shelf is a
`StaticBody3D`, a warehouse is a `Node3D`, the star is a `MeshInstance3D` — **no single base class
can cover them**, and before this each one hand-copied the same networking code. A child node is
composition: any body type gets the identical implementation by containing it.

### `GenericProp`: a convenience, not the contract

`GenericProp` (`scenes/globals/generic_prop.gd`) still exists and is still worth extending — but it
is now a **thin facade over the PropSync child**, for `RigidBody3D` roots only. It forwards what
other systems reach by raycast **on the body** (`uuid`, carry, interact, parent) to the child, and
it owns the printed serial (see [Crate IDs](./crate_ids.md)).

- Extending it is **optional**, and it does **not** replace the `PropSync` child: a `GenericProp`
  scene without that child does nothing at all.
- A non-`RigidBody3D` prop **cannot** extend it and inlines the same short facade instead. There is
  no logic to duplicate there — only delegation.

:::note[Set the prop's mass]
Set the `RigidBody3D` **Mass** on your prop's scene (Inspector). It is the prop's weight
everywhere in the game — its physics behaviour, and what a vehicle bed counts as cargo load
(see [Cargo — loading the bed](./vehicles.md)). A prop left at the default **1 kg** feels
weightless and barely registers as cargo, so give it a realistic value. (The mining rock sets
this per-piece from its volume instead of a fixed value.)
:::

:::note[Set the prop's collision layer & mask]
On your prop's body, set the collision **Layer** to `prop` and the **Mask** to `MASK_SOLID`
(world + player + vehicle + prop) in the Inspector. A prop left on the default layer/mask either
falls through the floor, gets ignored by tools, or drags down the server's frame rate. If your prop
also has a purely **static** part (a fixed collision that never moves), put it on `world` with
**Mask 0**. See [Collision layers & masks](./collision_layers.md) for the full table and the why.
:::

### Complex props

A prop with special behaviour keeps its own script (extending whatever body it needs) and still
carries a `PropSync` child, which drives `PropNet.server_tick` for it — so replication and
carry-follow stay consistent whatever the script does. Example: the mining
rock (`rock_mining.gd`) is custom because it fractures, and only a **fully-fractured ore
piece** is carriable (it overrides `interact()` for that) — a whole rock is not carriable.

## Positions are relative to a parent

A prop never stores its absolute world position. It stores a **local** position plus a
`parent_id` — the uuid of the object it is attached to (a planet, a city, a vehicle, the player
carrying it…). Horizon rebuilds the real world position by walking the chain
(`world = parent's world + local`). See [the introduction](./intro.md#the-backbone-parents-parent_id)
for the why; this section is what it means when you write a prop.

Three rules follow from it:

- **A child of a moving thing does not re-announce its position.** When a truck drives, the box
  in its bed keeps the *same* local position, so `PropNet.server_tick` sends nothing — and that
  is correct. Horizon moves the box because its **parent** moved. Re-sending the box every frame
  "to keep it fresh" is wrong: it floods the network for no reason (it was a real cause of the
  game freezing under load).

- **Re-parenting is a server decision.** Only the game server changes a prop's (or a player's)
  parent and replicates the new `parent_id`; clients **apply** it, they never decide it. On the
  client, after applying a new parent to a node, call `reset_physics_interpolation()` on it, or
  it will visually slide in from its previous world position.

- **Deleting a parent? Re-attach its children first.** Before freeing a prop that has replicated
  children (a warehouse full of crates, a vehicle with cargo, a rock about to break apart),
  move those children up to the deleted prop's own parent. Otherwise they are left pointing at
  an object that no longer exists, their world position becomes wrong, and they turn into
  collision-less **ghosts** on the other clients.

:::tip[Only replicate what changed]
`PropNet.server_tick` compares the prop's position/rotation/parent to the last values it sent
and emits **only on a real change** — and, for multi-field objects like a vehicle, only the
fields that changed. When you write your own replication, do the same: never send a full
snapshot every frame. A lost message is solved by reliable change-detection, not by re-sending
"just in case".
:::

## Carriables (carry / drop)

Any prop in the `"carriable"` group can be picked up. The flow is **server-authoritative**: the
client only aims, the server decides.

- **Aiming** — the client casts its interact ray (areas only) and sends the `uuid` it looks at.
  Hands free, it shows `[E] Carry` when the target's `interact()` allows it; while holding
  something it shows `[E] Drop`.
- **Pick up** (server) — the prop is parented to the player and marked carried (`set_carried(true)`),
  but it stays a **live `RigidBody3D`**: the server steers it toward a hold spot in front of the
  player by **velocity** (gravity off; it is angular‑damped rather than locked, so a knock against a wall or
  another prop **nudges its orientation** instead of it being rigid). A carried prop **physically collides
  with the world** — blocked by the ground, walls and vehicles, and it pushes lighter props (needed
  to load a container) — instead of clipping through. Its `parent_id` becomes the player so Horizon
  keeps its GORC global fresh, and its physics-driven transform replicates as it moves. The pickup
  also needs a **clear line of sight**: the server casts a solids ray and the prop must be the
  **first thing hit** (a wall, or the side of the bed it sits in, blocks it) — the client can't
  check this (it has no collisions), so it is the server's call.
- **Drop** (server) — the prop's normal physics is restored, it is reparented back to the world, and
  `set_carried(false)`. Dropped **while standing in a vehicle bed**, it is loaded onto that vehicle
  instead (see [Vehicles → Cargo bed](./vehicles.md#cargo--loading-the-bed)). Dropped and left to rest inside a **container**, it locks in place there (see [Containers](./containers.md)).

`interact(interactor) -> bool` is the gate (default: not already carried; the mining rock also
requires a fully-fractured piece). `set_carried(bool)` only flips the flag. A carried prop **keeps
its collision** and stays solid to the world and to other players; only the **carrier** is excepted
(`add_collision_exception_with()`, removed on drop) so it is not blocked by what it holds.

:::note[Physics-held carry — feel]
The velocity follow is **eased** (proportional), so on pickup the object does **not** snap to the hand —
it stays where it was grabbed and **glides** in. A **horizontal dead zone** lets it trail as you move;
the **vertical** follow has a dead zone that **shrinks as you look down**, so a level pickup doesn't drop
the object but looking **down** takes it all the way to the **floor** to place it (and up when you look up).
The hold spot is clamped between the **floor and any ceiling** (rays from the eye), so looking up inside a
container can't fling it onto the roof. It **auto‑drops** if dragged past the carry reach (derived from the
hold offset — NOT the interaction ray, which is a separate, tunable grab distance: see
`interact_ray_length` on the Player). Collision is **never suppressed**: the object is solid the instant
you grab it (it eases in, it doesn't snap *through* things).
:::

:::note[parent_id is replicated, and only re-applied on change]
A carriable rides its carrier purely through `parent_id` (the player's, or a vehicle's bed). The
server replicates `parent_id` **only when it actually changes**, and the client reparents only
then. Delivering that single message reliably is Horizon's job — the prop does not re-send it
"just in case".
:::

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

Deletion is **server-authoritative**: a prop is removed by freeing its node **on the Godot
server** — never directly by a client. When the node is **freed** (`NOTIFICATION_PREDELETE`, in `PropSync`),
it emits `hs_server_prop_delete` and the rest is automatic:

1. the Godot server sends a `props/delete_object` message to Horizon,
2. Horizon removes the object from GORC, so every nearby client gets a zone-exit and despawns
   the scene (the prop disappears for everyone),
3. Horizon forwards the deletion to the **persistence** service, which removes the row from the
   database — so the prop does **not** respawn after a restart.

:::caution[Leaving the tree is not a deletion]
Only a real free counts. A reparent — of the prop, or of **anything it hangs from** — takes it out of the
tree and back in, and must never delete it: when this was keyed on `_exit_tree`, a crate in the hands of a
player being teleported was deleted from Horizon and from the base while the server still held it. A prop
the server frees without destroying it (handed over to another server) sets `server_reparenting` first,
which vetoes the delete.
:::

### Triggering a deletion (server side)

Free the prop node on the server — e.g. the mining depot consuming a deposited rock:

```
func _collect_rock(rock: Node) -> void:
	rock.queue_free()  # freed -> hs_server_prop_delete -> GORC + database
```

### Requesting a deletion from a client

A client never deletes a prop itself: it sends an action (the same channel as any other action,
see [Player network management](./player.md)); the server validates it and frees the node.

```
# client
client_send_action_to_server({"action": "delete_prop", "type": type_name, "uuid": uuid})

# server, in server_action_received(data)
"delete_prop":
	var prop := _find_deletable_prop(str(data.get("uuid", "")))
	if prop != null:
		prop.queue_free()  # held locally -> freeing it replicates the delete
	else:
		# Not held as a node by THIS server (e.g. loaded from the database elsewhere): send the
		# delete message to Horizon directly so it still leaves GORC and the database.
		_on_prop_delete(str(data.get("uuid", "")), str(data.get("type", "")))
```

:::note[The delete message vs the trigger]
What actually deletes the object is the `props/delete_object` message sent to Horizon. Freeing
the node is just the usual trigger; a server can also send that message directly
for a prop it does not currently hold as a node.
:::

:::warning[Database deletion needs the bridge subscription]
For the deletion to reach the database, the `ds_bridge` persistence service must be subscribed to
`plugin:genericprops:delete_object` in `plugins.toml`. The Docker config (`.docker/plugins.toml`)
already is; a bare-metal `plugins.toml` may not be.
:::

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

:::danger[Never name a property `type` or `uuid`]
The game server sends every update as `{"uuid": ..., "type": <the prop's type>, ...properties}`. A
property **named** like one of those two envelope keys is overwritten by every update: a
`poi_village`'s `type` ("mining" / "factory") became `"poi_village"` at the village's first update,
Horizon stopped seeing it as a mining village, and every new player woke two more villages (horizon
#110, 2026-10-05). Pick another name (`poi_type`, `kind`...). And before Horizon or the server
**decides** anything from a replicated property, read that property back after the object's first
update, not only from the seed.
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

## Placing a networked prop in the world

A scene you drop into another scene by hand (a cabin in a planet scene, a kiosk in a station) is
**not** a networked object, even if it carries a `PropSync`. Every machine loads it from its own copy
of the scene file: it has no uuid, Horizon and the database never hear of it, and its `PropSync` stays
inert. A networked object is an **entry in the world's data**. There are two ways to make one.

### In every village: the village layout

`scenes/_universe/structures/urban/villages/ares_village_mining.tscn` is the layout of a mining
village, and `scenes/_universe/structures/urban/cities/ares_city_factory.tscn` the layout of a factory
city. When a village is loaded (a player within ~5 km, or Horizon asking for its homes), the
server reads the layout (`poi_villages.gd`) and spawns **every direct child that has a `PropSync`
and comes from a scene**, one per village:

- its uuid is stable, `"<village uuid>|<node name>"`: a restart upserts it, never duplicates it;
- it is protected as world infrastructure (the admin cleanup tool cannot delete it);
- its type is the `type_name` of its `PropSync`, and its other network properties are read from the
  node, as its definition (`items_def/<type>_def.json`) lists them.

To add a building to every village, instance its scene as a direct child of the layout, under a
name of its own, and position it there. The garage, the teleporter, the floodlights, the lampposts
and the containers are placed this way. The name is part of the uuid: two children of one layout
never share a name.

Which layout a POI gets is its `spawn_scene`, in its `poi_village` entry of Horizon's seed. The
mining villages are of type `mining`; the factory cities, of type `factory`, have no homes, and
Horizon only looks for apartments for new players in the villages of type `mining`. Otherwise a
city whose homes never arrive would count, for ever, as a whole village's worth of places to come.

:::danger[Its type must have a definition]
The `type_name` of the `PropSync` node must name a definition, `items_def/<type>_def.json` (and its
twin in Horizon). Left at its default, `generic_prop`, it names none: Horizon drops the object
(`Object definition not found for type: generic_prop` in its log), and **nothing fails on the game
side**: the object exists on the server and on no client. For a fixed object with no state of its
own (a lamppost, a floodlight), `simple_building` is enough. `test_prop_sync_definitions` fails on any
scene whose `PropSync` names a type without a definition.
:::

:::warning
A village that has already spawned (`is_spawned`, saved in the database) does not read the layout
again: it only gets the new building after a purge of the world.
:::

### What needs a purge, and what only a restart

The database keeps **where** each object is and **which scene** it loads, nothing else. So:

| You change | To see it |
|---|---|
| **What** a village holds: add, remove or move an object in the layout, change a `type_name` | purge the world, so that the villages spawn again |
| **How** an object looks or sounds: a light, a material, a sign, a sound, a photocell | relaunch the client: every client builds the object from its scene |

A client keeps a scene in memory once it has read it: reconnecting is not enough, relaunch it.

### Anywhere else: Horizon's seed

A networked object in a particular place (aboard the station, in a city) is an entry of Horizon's
seed, `horizonserver/ds_genericprops/startup_items.json`: its `object_type`, a fixed
`object_uuid`, and in `object_data` its `scenename`, its `parent_id` (the uuid of the networked frame
it stands in) and its `position` / `rotation` in that frame. The station's teleporter is placed this
way. The seed ships in the `horizon-data` image: rebuild it to test a change locally.

:::warning
Horizon skips the **whole** seed when its first uuid is already in the database: an existing world
needs a purge to get a new entry.
:::

### Containers stand in a storage area

The shipping containers (`scenes/_universe/props/containers/container_*_1200x240x240.tscn`) are
fixed networked props: a `StaticBody3D` (a `RigidBody3D` would be thawed by the server's culler when
a player comes near, and a 9 t container would fall over), of type `simple_building`. Every model is
12 x 2.5 x 2.4 m. They have **no** `TerrainPad`: they do not level the ground, a **storage area**
does, and they stand in it.

The storage area (`scenes/_universe/structures/industrial/storage/pad_storage_area.tscn`, type
`storage_area`) is a stretch of levelled ground. To place containers in a layout:

1. Instance `pad_storage_area.tscn` in the layout, and set its **Size** in the Inspector (width along
   its X, length along its Z, in metres). The yellow box shows the ground it levels.
2. Drop the containers **under it** in the Scene tree, standing on its top face (y = 0 in the area).
   Stack them by raising them 2.5 m per container.

`poi_villages.gd` spawns the area, then everything the layout placed under it as its **children**,
their pose local to it. The server seats the area on the ground it levels and the containers move
with it. A container placed beside an area instead would keep the layout's height while the ground
under it settles elsewhere: 16 cm away at the median, more than 50 cm one time in five, measured on
5726 buildings. `test_containers` checks that every container of a layout stands in an area.

:::tip[Why the size is a network property]
A value you set on a node of the layout never travels: each machine builds the object from its scene
file and from the properties its definition lists. The area's `size` is in `storage_area_def.json`
(game and Horizon), so the server and every client level the same ground.
:::

### Level the ground under it

A building that stands on a planet gets a `TerrainPad` child with a `CSGBox3D` under it: the box is
the platform, its top face the height of the levelled ground, `apron_m` the flat margin around it.
Sink the box until its top face is just under the building's floor. The pad's measures travel in
`terrain_settled`, which the `simple_building` definition already replicates: a building with no
state of its own can use that type and needs no new definition. A pad more than ~50 km from the
surface (a station in orbit) levels nothing.

## Moving or reparenting a prop on the Horizon side (GORC)

Most prop work is done from the game server (Godot). But if you ever **change an object's position
inside a Horizon plugin** (a move, a drop, a reparent, or recomputing a child's world position),
there is one rule that is **essential** — getting it wrong silently breaks replication.

:::warning[Always emit GORC zone events when an object moves]
In a Horizon handler, update an object's position through **`events.update_object_position(...)`**,
never `gorc_instances.update_object_position(...)` directly.

`gorc_instances.update_object_position` moves the object but **discards the GORC zone entry/exit
events**. So a player who comes within range of the object's *new* position is never subscribed to
it and stops receiving its updates — the symptom is an object that "teleported" on the server but
is stale on a client (e.g. a dropped item glued to the carrier's hand). `events.update_object_position`
recomputes the zones **and delivers** the entry/exit messages, so nearby clients (re)subscribe.

For a **child** object (e.g. cargo riding in a vehicle bed), compute its world position as
`parent_global + child_LOCAL` — read the child's **local** position from its zone data, not its
already-global `position()`, otherwise you double-count the parent's position.
:::

This is the root cause of the old *"can't drop an item retrieved from a bed"* bug (horizonserver
`Fix reparent`, `ds_genericprops/src/handlers/update.rs`). It is **not** fixable from the game
server: re-sending the data more often does nothing if the client was never zone-subscribed — this
kind of "update never reaches a client after the prop moved" is always a **GORC subscription**
issue, so it belongs in Horizon, not in the Godot prop.
