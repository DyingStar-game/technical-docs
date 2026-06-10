---
title: Props and player network management
sidebar_position: 2
---

# Props and player network management

The player and every generic prop replicate their state to nearby players through the
**same** mechanism: the game server sends property updates to Horizon, which keeps an
authoritative copy of each object and forwards the changes to the clients in range. The
player is simply an object of type `player` — there is no longer a player-specific update
path.

Which properties are actually replicated (and how far / how often) is **not** decided in
your GDScript: it is declared in a per-type **definition file**. See
[Replication definition files](#replication-definition-files) below — read
it first, because a property that is not declared there will silently never reach the
clients.

## Player management

### Update properties


#### Client sends update to server

To update properties or actions from the client to the Godot server, you need to call the function *client_send_action_to_server*.

This is an example for a jump request:

```
client_send_action_to_server({"action": "jump"})
```

You can add more than one property in the argument.

#### Server receive update

The properties / actions received on the Godot server (can be sent by the client or by a Horizon service), these properties arrive in the function *server_action_received*. You need to manage the key => values.

For example, for the *jump* action received, we have:

```
func server_action_received(data: Dictionary) -> void:
match data["action"]:
"jump":
is_jumping = true
```


#### Server sends update to client

The server can send updated properties to the client, for example, the health.

To do that, call the function *server_send_properties_to_client*.

For example: 

```
server_send_properties_to_client({"health": 80})
```

:::warning[Declare the property first]
`health` will only reach the clients if it is listed in the player definition file
(`player_def.json`). A property that is not whitelisted there is dropped silently. See
[Replication definition files](#replication-definition-files).
:::

#### Client receives update

The client receives all properties modified in the function *client_channel_data_update*, such as the new position and health.

For example: 

```
func client_channel_data_update(data: Dictionary) -> void:
if data.has("health"):
health = data["health"]
```


## Generic props management

### What is a generic prop?

A generic prop is any scene spawned in the game, except for the player scene (*normal_player.tscn*).

It can be a planet, a box, a building, a car...


### Structure of the gd file

For each generic prop scene, it **MUST HAVE A GD SCRIPT ATTACHED**.

This GD script must have at a minimum the following data inside (you can copy the content and paste it):

```
# TODO Change the class_name
class_name Box50cm

# TODO Update to the right node
extends RigidBody3D

signal hs_server_prop_update
signal hs_server_prop_delete

@export var uuid: String = ""

# TODO change the type
var type_name = "box"

var spawn_position: Vector3 = Vector3.ZERO
var spawn_rotation: Vector3 = Vector3.UP

var server_last_position = Vector3.ZERO
var server_last_rotation = Vector3.ZERO

var has_parent: bool = false

func _ready() -> void:
	position = spawn_position

func _physics_process(_delta: float) -> void:
	if GameOrchestrator.is_server():
    # this part send the position or rotation if changed since last frame
		var my_position = snapped(position, Vector3(0.001, 0.001, 0.001))
		var my_rotation = snapped(rotation, Vector3(0.0001, 0.0001, 0.0001))
		if server_last_position != my_position or server_last_rotation != my_rotation:
			emit_signal(
				"hs_server_prop_update",
				uuid,
				{
					"position": my_position,
					"rotation": my_rotation,
				},
				type_name,
				has_parent
			)
			server_last_position = my_position
			server_last_rotation = my_rotation

func _exit_tree() -> void:
	if GameOrchestrator.is_server():
    # send the information to the client the server delete this scene
		emit_signal(
			"hs_server_prop_delete",
			uuid,
			type_name
		)

# manage the parent changes
func client_parent_change(parent: Node) -> void:
	reparent(parent)
	has_parent = true

# receive the update from server, in this example, we manage position and rotation properties
func client_channel_data_update(data: Dictionary) -> void:
	if data.has("position"):
		position = Vector3(
			data["position"]["x"],
			data["position"]["y"],
			data["position"]["z"]
		)
	if data.has("rotation"):
		rotation = Vector3(
			data["rotation"]["x"],
			data["rotation"]["y"],
			data["rotation"]["z"]
		)

```


### Update properties


#### Server sends update to client

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


#### Client receives update

The client receives the properties updated by the server in the function *client_channel_data_update*.

The *data* argument is a dictionary where the key is the property and the value is the property value.

You can update or do what you want with the value.

:::note[value int]
Be careful, the int value sent by the server is a float when it arrives, so you need to convert it to int before use.
:::


### Delete prop

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

