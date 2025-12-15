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

To delete a prop, the function *_exit_tree* sends the signal to the client, and the client deletes the scene; it's automatic!

