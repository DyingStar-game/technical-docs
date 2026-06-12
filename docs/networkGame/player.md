---
title: Player network management
sidebar_position: 2
---

# Player network management

The player and every generic prop replicate their state to nearby players through the **same**
mechanism: the game server sends property updates to Horizon, which keeps an authoritative copy
of each object and forwards the changes to the clients in range.

The only thing **specific to the player** is that it is the entity *your* client controls — it
sends inputs/actions up to the server. Everything else (how its state reaches the other clients)
works **exactly like a prop**: see [Props network management](./props.md), which the player
simply reuses, with its own `player_def.json`.

## Update properties

The player-specific part is the **input/action channel**: the client sends actions up, the
server applies them and sends results back down.

### Client sends update to server

To update properties or actions from the client to the Godot server, you need to call the function *client_send_action_to_server*.

This is an example for a jump request:

```
client_send_action_to_server({"action": "jump"})
```

You can add more than one property in the argument.

### Server receive update

The properties / actions received on the Godot server (can be sent by the client or by a Horizon service), these properties arrive in the function *server_action_received*. You need to manage the key => values.

For example, for the *jump* action received, we have:

```
func server_action_received(data: Dictionary) -> void:
match data["action"]:
"jump":
is_jumping = true
```

### Server sends update to client

The server can send updated properties to the client, for example, the health.

To do that, call the function *server_send_properties_to_client*.

For example:

```
server_send_properties_to_client({"health": 80})
```

:::warning[Declare the property first]
`health` will only reach the clients if it is listed in the player definition file
(`player_def.json`). A property that is not whitelisted there is dropped silently. See
[Replication definition files](./props.md#replication-definition-files).
:::

### Client receives update

The client receives all properties modified in the function *client_channel_data_update*, such as the new position and health.

For example:

```
func client_channel_data_update(data: Dictionary) -> void:
if data.has("health"):
health = data["health"]
```
