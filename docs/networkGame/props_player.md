---
title: Props and player network management
sidebar_position: 2
---

# Props and player network management

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
client_send_action_to_server({"health": 80})
```

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

Deletion is **server-authoritative**: a prop is removed by freeing its node **on the Godot
server** — never directly by a client. When the node leaves the tree, its *_exit_tree* emits
*hs_server_prop_delete* and the rest is automatic:

1. The Godot server sends a `props/delete_object` message to Horizon.
2. Horizon removes the object from GORC, so every nearby client receives a zone-exit and
   despawns the scene (the prop disappears for everyone).
3. Horizon also forwards the deletion to the **persistence** service, which removes the row
   from the database — so the prop does **not** respawn after a restart.

#### Triggering a deletion (server side)

Free the prop node on the server. For example, the mining depot consumes a deposited rock:

```
func _collect_rock(rock: Node) -> void:
    # ... accumulate stats ...
    rock.queue_free()  # _exit_tree -> hs_server_prop_delete -> GORC + database
```

#### Requesting a deletion from a client

A client never deletes a prop itself. It sends an action to the server (the same channel as
any other action, see *Update properties* above); the server validates it and triggers the
deletion:

```
# client
client_send_action_to_server({"action": "delete_prop", "type": type_name, "uuid": uuid})

# server, in server_action_received(data)
"delete_prop":
    var prop := _find_prop_by_uuid(str(data.get("uuid", "")))
    if prop != null:
        prop.queue_free()  # held locally -> _exit_tree replicates the delete
    else:
        # Not held by THIS server (e.g. the prop was loaded from the database on another
        # instance): emit the delete message to Horizon directly so it leaves the GORC and
        # the database anyway.
        _on_prop_delete(str(data.get("uuid", "")), str(data.get("type", "")))
```

:::note[The delete message vs the trigger]
What actually deletes the object is the `props/delete_object` message sent to Horizon
(`{namespace: "props", event: "delete_object", data: [{uuid, type}]}`). Freeing the node via
*_exit_tree* is just the **usual trigger**; a server can also send that message directly for
a prop it does not currently hold as a node.
:::

:::warning[Database deletion requires a bridge subscription]
For the deletion to reach the database, the `ds_bridge` persistence service must be
subscribed to `plugin:genericprops:delete_object` in `plugins.toml`. The Docker
configuration (`.docker/plugins.toml`) already is; a bare-metal `plugins.toml` may not be.
:::

