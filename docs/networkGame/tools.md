---
title: Adding a tool
sidebar_position: 5
---

# Adding a tool

A **tool** is a piece of equipment the player holds and uses — the mining hammer-drill today,
maybe a welder, scanner or cutter tomorrow.

:::note[No `Tool` base class yet]
There is currently **one** tool, so there is no formal `Tool` base class. `MiningTool`
(`scenes/normal_player/mining_tool.gd`) is the **reference implementation**, and the generic,
reusable piece is the **`EquipmentMount`** (`scenes/normal_player/equipment_mount.gd`). This
page describes the pattern to follow; copying `MiningTool`'s structure is the fastest start.
See the [recommendation](#recommendation) at the end about factoring a base class.
:::

## The pieces

| Piece | Role |
|---|---|
| `EquipmentMount` (`equipment_mount.gd`) | Generic hand mount: holds **one** item under the player's hand and orients it (follows the camera pitch, or aims its tip at a world point). Reusable by any tool/weapon — open/closed, you don't touch the items themselves. |
| The tool node (e.g. `MiningTool`) | A `Node3D` child of the player holding the tool logic: equip/stow, per-frame update, the action, and its networking. |
| The action channel | How a tool action reaches the server and the other clients — the same client→server channel the player uses (see [Props network management](./props.md)). |

## 1. Where to put the model

Tool models live under `assets/models/equipments/tools/<category>/` (e.g. the drill is
`assets/models/equipments/tools/mining/hammerdrill.glb`). Follow
[Files structure](../creativeConcept/files_structure.md) and
[3D models](../creativeConcept/3d_models.md).

## 2. The tool node

Add a `Node3D`-derived script as a child of the player (like `$MiningTool`), following the
`MiningTool` shape:

- **`setup(camera_pivot, camera)`** — called from the player's `_ready`: cache the camera, get
  the `EquipmentMount`, and `hold()` the tool model in it.
- **`toggle_equip()`** — bound to an input action (the drill uses `toggle_tool`): shows / hides
  the held model.
- **`update_local(delta)`** — called each frame for the local player: aim, animate, detect when
  the action triggers.
- **State flags the player reads** — e.g. `is_aiming`, `is_perforating`. The player uses them to
  slow movement and freeze the mouse while aiming / using the tool.

The model is held and oriented by the `EquipmentMount`, placed through exported offsets (hand
offset, item offset / rotation / scale) — you don't move the model node by hand.

## 3. The tool action (networking)

A tool action is **server-authoritative**, like everything else. The pattern:

1. The local tool emits a **`sync_requested`** signal carrying the action data; the player
   connects it to `client_send_action_to_server`, so the tool stays decoupled from the socket.
2. The server receives it in `server_action_received` and applies the effect (the drill
   fractures the aimed rock).
3. The equipped tool and its visible state are **replicated as player properties** (the drill
   uses a `tools` property + the camera `head` pitch) so other clients see you holding and using
   it. Remote clients apply it through the tool's **`apply_remote(data)`**, and the server sets
   the equipped tool via **`server_set_tool(...)`**.

:::warning[Whitelist the replicated properties]
Any property you replicate for the tool (`tools`, `head`, …) must be declared in
`player_def.json`, or it is dropped silently. See
[Replication definition files](./props.md#replication-definition-files).
:::

## 4. Stowing

If the tool must disappear in some states (the drill stows while the player carries an ore),
expose a **`set_stowed(value)`** and call it from the player when that state changes.

## Tools follow the body (belt holster)

A **stowed** tool is holstered on the animated body so it moves with it (walk / crouch / jump)
instead of floating at a fixed offset from the body origin. The mechanism is shared and DRY:

- The puppet exposes **`player.belt_mount`** — a `BoneAttachment3D` on the hip bone, created once by
  the `CharacterAnimator` (see [Character animation](./character_animation.md)). It follows the
  animation for free.
- **Each tool holsters onto it with its OWN offset.** The mount (the bone) is shared; the offset —
  where *that* tool sits on the belt — is per-tool. The mining tool's `Stow` group (`stow_offset` /
  `stow_rotation_deg`) *is* that belt pose. A new tool just reads `player.belt_mount` and supplies
  its own offset; no duplicated bone-finding code.

:::tip[Owner vs remotes]
The local owner doesn't see his own stowed tool (first-person clutter); it's the **remote** avatars
that show the holstered tool following the body. Tune the offset with a second client watching.
:::

## Recommendation

Because `MiningTool` is the only tool today, equip/stow, the `EquipmentMount` wiring and the
`sync_requested` plumbing all live in one script. When a second tool arrives, factor those
shared parts into a small **`Tool` base class** so a new tool only implements its own action —
the same way [`GenericProp`](./props.md) factors carriable props.
