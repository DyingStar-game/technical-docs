---
title: Player network management
sidebar_position: 2
---

# Player network management

:::tip[New here? Read the overview first]
**[How DyingStar networking works](./intro.md)** explains the whole system in plain language, with
no code. This page is the hands-on guide for the parts that are specific to the player.
:::

In plain terms: your character is just another networked object — the difference is that *your*
game also sends **your inputs** (move, jump, press E) up to the server, which decides the result
and sends it back to everyone.

The player and every generic prop replicate their state to nearby players through the **same**
mechanism: the game server sends property updates to Horizon, which keeps an authoritative copy
of each object and forwards the changes to the clients in range.

The only thing **specific to the player** is that it is the entity *your* client controls — it
sends inputs/actions up to the server. Everything else (how its state reaches the other clients)
works **exactly like a prop**: see [Props network management](./props.md), which the player
simply reuses, with its own `player_def.json`.

## The player scripts: a facade over two roles

The player is one scene (`scenes/player/player.tscn`) but its script is split by responsibility
(a Strategy pattern), so server logic and client presentation never tangle:

- **`player.gd`** (`class_name Player`) — the **facade**. It owns the shared body (a `CharacterBody3D`),
  the shared nodes (camera, interact ray…) and the public network API, and at spawn it creates **one
  role** child node and delegates to it.
- **`player_server.gd`** (`PlayerServer`) — runs **only on the dedicated server**: the physics tick,
  input application, carry / line-of-sight, doors, spawns, and `server_action_received`.
- **`player_client.gd`** (`PlayerClient`) — runs **only on a client** (both the owner *and* a remote
  avatar): local input, camera, HUD prompts, the carry prediction, the remote name tag, and
  `client_channel_data_update`.

So the network entry points below still live on the `Player` facade, but their body has moved into
the role: `server_action_received` is implemented in `PlayerServer`, `client_channel_data_update` in
`PlayerClient` — the facade simply forwards to the active role.

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

## Server-authoritative interaction (carry example)

Interaction must be decided by the **server**, never trusted from the client — this is an MMO,
so the server is the anti-cheat authority. The client may show prompts and predictions for
instant feedback, but the server re-checks everything before acting.

The carry/pickup illustrates the pattern:

- **Reachability + line of sight** are checked **on the server** (it owns the collisions; the
  client often has none — e.g. server-only terrain). Before granting a pickup the server
  raycasts from the player's eye to the prop and refuses if any solid body (a wall/building)
  is in between, so a thin wall can't be exploited to grab through it. The prop itself and its
  holder (a vehicle bed, a depot, the ground it rests on) are ignored, so taking a crate out
  of a bed still works. Very small or fragmented props (e.g. a mining rock) are **exempt** from
  the line-of-sight check: their thin, broken-up colliders made the ray report a false block, so
  the server skips the wall test for them and relies on reach alone.
- **The prompt is server-driven.** The server computes `[E] Carry` / `[E] Drop` (reachable, in
  line of sight, not already carried by someone else) and replicates it to the owning client,
  which only displays it — the client never decides the prompt itself.
- Because that prompt is a replicated player property, it must be whitelisted in
  `player_def.json` (see the warning above) or Horizon drops it.
