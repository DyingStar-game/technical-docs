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

## Replicated player properties

Everything the other clients see about a player is a whitelisted entry in `player_def.json`. The
current set:

| Property | Kind | What it is |
|---|---|---|
| `position`, `rotation`, `velocity` | state | body transform + motion |
| `parent_id` | state | the frame the body rides (e.g. a planet) |
| `head`, `head_yaw` | state | look pitch, and the **seated** look yaw (0 while standing) |
| `stance` | state | standing / crouched / prone |
| `floating` | state | weightless (no gravity area for a moment): floating animation, no footsteps, a bare point on the star map. Sent on change. |
| `carrying` | state | holding a carriable |
| `flashlight` | state | torch on / off |
| `datapad` | state | the wrist DataPad is raised (its owner is reading it), so every avatar raises that wrist, a late joiner's view included. Whitelisted in `player_def.json` here **and** in horizonserver's `ds_genericprops/props/player_def.json`. |
| `tools`, `perforating` | state | equipped tool + mining state |
| `carry_prompt` | state | server-decided `[F]` prompt (the `action` key) for the owner |
| `action` | **event** | one-shot events (jump / land / emote / seat / interact) — see below |
| `name`, `scenename`, `spawn_appartment_id` | state | identity / scene |

Adding one means editing `player_def.json` **and** rebuilding Horizon (see the warning above). Most of
these feed the [character animation](./character_animation.md), which is derived from them — no
animation data is sent.

## The `action` field: one-shot events

Some things are **events**, not states: a jump, a landing, an emote, taking a seat. Horizon keeps the
**last value** of every property and re-sends it to new subscribers, so if we simply set
`action = "jump"`, a second identical jump would be **swallowed** by change detection (same value = no
update) and a late joiner would replay the last one.

The idiom is a **monotonic counter**: the server tags each event with an ever-increasing number, so
every occurrence is a **new** value that always replicates:

```
action = "jump:7"            # the 7th jump
action = "land:7"            # touched down
action = "emote:wave:3"      # played an emote
action = "seat:driver:2"     # took the driver seat  (and "unseat:2" on exit)
action = "emote:interact:5"  # reached for a vehicle door, on foot
```

Each client remembers the last value it saw **per event type** and reacts only to a new one. This
needs **no new whitelisted property** — `action` is already in `player_def.json` — which is why
jump, landing, emotes, seating and the door-interact gesture all cost zero extra networking.

## Movement stances (crouch / prone)

The player has three stances, held in the replicated **`stance`** property: `0` standing, `1` crouched
(toggle **C**), `2` prone (toggle **W**). It is server-authoritative — the client only asks:

- The owner sends `{"action": "stance", "value": <0|1|2>}`; the server sets `stance`, replicates it,
  and every client (owner included) reads the echo to drive the crouch / crawl animation.
- The server **caps the speed** (crouch ≈ 0.8 m/s, prone ≈ 0.5 m/s, no sprint) and **shrinks the
  collision capsule** so a crouched or prone player fits under low obstacles. Standing up is **gated by
  a headroom raycast** — you can't stand up under a ceiling.
- The physics space state is only valid during the physics step, so the stance request is **recorded**
  in the action handler and **applied on the next physics tick** (where the headroom ray is valid).

## Carry is standing-only

Picking a box up is only allowed while **standing** (`stance == 0`): the server refuses the grab
otherwise, and no `[E] Carry` prompt is shown while crouched or prone. Changing to crouch / prone — or
**jumping** — **drops** whatever you carry. This keeps the carry pose and the
[belt holster](./tools.md#tools-follow-the-body-belt-holster) simple.

## Your own body on foot: smoothing without prediction

There is **no client prediction** for the player on foot: the server moves the body, its positions come
back at the network rate (about every 70 ms), and `NetInterpolator`
(`scenes/globals/net_interpolator.gd`) glides the owner's body after them (`update_position`, position
only, so the mouse look stays immediate). Two rules keep that from feeling heavy.

### The lead (owner only)

Gliding after targets 70 ms apart, the body caught each one in about 40 ms and waited for the next: it
moved in steps, 14 times a second. So, **for the owner and only while a move key is held**
(`PlayerClient` passes `player.input_direction != Vector2.ZERO` as `lead`), the target is carried on at
the speed of the last two targets:

- for at most **1.5 × the last gap** between targets (`LEAD_GAP_SHARE`) and never more than **0.15 s**
  (`LEAD_MAX_S`) — a lead that stopped at exactly the last gap stopped the body whenever the next
  target came a little late;
- past that cap the lead **comes back as fast as it went** (`lead_time`): the server sends nothing for a
  body that stopped (a wall, a step), and a held lead kept the view inside the wall;
- keys released: no lead, the body settles on what the server said;
- **reset on reparent** (`snap_next()`, called by `Player.net_reset_interp`): the next target is in
  another frame, so no speed is derived across it.

Remote avatars do not lead. Tests: `test/unit/test_net_interpolator_lead.gd`.

### One gait rule: `Player.gait_speed`

The speed the gait asks for — sprint or the wheel-chosen walk speed, capped by the stance, slowed while
aiming or carrying, zero while perforating — is **one function**, `Player.gait_speed(sprint_held,
walk_target, stance, carrying)`, used by the server to move the body **and** by the owner's client to
animate it. On foot (not seated, weightless, airborne or in god mode) the owner's animation and
footsteps follow the gait **its keys** ask for (`PlayerClient.intent_step`, ramped at the same
`acceleration`), instead of the motion measured on the body, which only moves after a round trip:
pressing Shift used to show the run 0.6 s later. Only the owner sees its own animation, so this guess
never becomes state; remote avatars keep the measured motion. If the keys ask for a gait the body does
not take — the body moving under 35 % of it for 0.4 s (`INTENT_FOLLOW_SHARE`, `INTENT_BLOCKED_S`), walking into a wall — the measured motion takes over again.

`acceleration` is now **30 m/s²** (a sprint reached or stopped in 0.17 s; it was 10). Tests:
`test/unit/test_player_gait.gd`.

## Debug probes (`client.ini`)

Two instruments for stutters you feel but cannot see in the code. Add the key to `client.ini` (any
section — `ClientConfig` reads keys from every section; `[debug]` is the convention), restart the client,
and read the client's log (the editor's Output, or the client console).

### `debug_move_probe=true` — on-foot stutters

`MovementProbe` (`scenes/player/movement_probe.gd`) watches the owner's on-foot movement. Each event is
printed at once as a `[MoveHitch]` line with the time since boot (to match what you felt):

| Kind | Meaning |
|---|---|
| `net` | a position came late (a gap over 2.5 × the usual one, and at least 60 ms): the body ran out of target |
| `jump` | one position stepped more than 1 m (a burst after a gap, or a server correction) |
| `back` | the target went back against its direction, keys held (the server put you back) |
| `stall` | keys held, the body drawn under 30 % of its recent speed (once it moved over 1 m/s) |
| `frame` | the frame itself took over 50 ms (the `[CPerf]` hitch lines say why) |
| `snap` | the interpolation was reset: a reparent, with the new frame's name |

Every 2 s a `[MoveProbe]` line sums the period up (the format, with example values):

```
[MoveProbe] positions=28 gap avg 71 max 84 ms | step max 0.42 m | behind avg 0.12 max 0.31 m | frame max 18 ms | keys 100% | cam swing y 1.2 z 2.4 cm | net=0 jump=0 back=0 stall=0 frame=0 snap=0
```

`positions` / `gap` are the server's targets, `behind` is how far the drawn body trails the last target,
`keys` the share of frames with a move key held, and **`cam swing`** how far the first-person camera
pivot moved (y, z, cm) while walking. At most 12 hitch lines per period are printed. Tests:
`test/unit/test_movement_probe.gd`.

### `debug_wrist_probe=true` — the raised wrist

Prints `[WristProbe]` lines from `CharacterAnimator` for **every** avatar (local and remote): one `hold`
line when a wrist starts rising (stance, target distance from the shoulder, eye distance, current clip),
then twice a second the hand's distance from the IK target, the elbow's bend and the clip. It is measured
**after the skeleton is posed** (on `Skeleton3D.skeleton_updated`): read earlier in the frame the bones
are still the clip's, since the IK runs at the end of the frame, and every arm read 0.6 m off target.
A hand far from its target, or an elbow near 180° (straight), is an arm the IK did not move.

