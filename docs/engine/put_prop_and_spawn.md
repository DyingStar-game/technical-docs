---
title: Put a prop and spawn it
sidebar_position: 4
---

# Put a prop and spawn it

We have worked on Godot and the Horizon server to spawn and move items easily. This guide shows
the three steps: create the prop scene, declare its network properties in Horizon, then request a
spawn from the client.

## Step 1 — Have the prop in a scene

Create a scene and put the prop (model) in it, with its **mesh** and, if possible, its
**collision** 😀

## Step 2 — Create the property file in Horizon

In the [HorizonServer repository](https://github.com/DyingStar-game/horizonserver), add a file in
`dyingstar_genericprops/props` for the prop **type** (or reuse the existing file for that type —
for example the `box` type already exists, so you don't need to do anything here for a box).

If you need a new item type, add a file named `<type name>_def.json` (for a box:
`box_def.json`). Inside, put the JSON:

```json
{
	"channels": [
		{
			"zone": 0,
			"distance": 150.0,
			"frequency": 30.0,
			"properties": [
				"position",
				"rotation",
				"scenename",
				"parent_id",
				"opened"
			]
		},
		{
			"zone": 1,
			"distance": 200.0,
			"frequency": 15.0,
			"properties": [
				"led_state"
			]
		},
		{
			"zone": 3,
			"distance": 600.0,
			"frequency": 2.0,
			"properties": [
				"qrcode",
				"symbol",
				"parcel_number",
				"weight"
			]
		},
		{
			"zone": 6,
			"distance": 620.0,
			"frequency": 3.0,
			"properties": [
				"scenename",
				"parent_id"
			]
		}
	]
}
```

Each **channel** manages the criticality of messages: a sending **frequency** (in hertz) and a
**distance** (updates are sent to clients between `0` and this distance). You add the properties
you want replicated to the relevant channel.

You **must** have **channel 6** containing the properties `scenename` and `parent_id`.

You don't need to recompile Horizon — **only restart it!**

:::warning A property only reaches the client if it is whitelisted here
Any prop property that is not listed in one of these channels is **dropped** by Horizon and the
client falls back to its default. If a replicated value never arrives on the client, this file is
the first thing to check.
:::

## Step 3 — Send a spawn message to Horizon from the client

From the Godot client, send this message on the websocket:

```json
{
  "namespace": "props",
  "event": "spawn_request",
  "data": {
    "action": "spawn",
    "entity": "box",
    "position": { "x": 10.0, "y": 0.0, "z": 0.0 },
    "scenename": "scenes/props/testbox/mybox.tscn",
    "parent_id": "<parent uuid>"
  }
}
```

Collision and movement are then computed on the **Godot server** and sent automatically to the
Godot client through the Horizon server. It's finished 😎

:::note Code has moved since this guide was written
The client‑side example originally pointed at `scenes/normal_player/normal_player.gd`
(`spawn_box`). The player script has since been **refactored and relocated** to `scenes/player/`
and split into a façade `player.gd` over `player_server.gd` / `player_client.gd`. The spawn flow
is also being made **fully server‑authoritative** (the client sends only a catalogue key; the
server places the prop upright on the ground, or floating in zero‑g). The **message format and
the channel‑definition step above are unchanged** — only the exact file/function where the client
builds the request has moved. See [Network Game → Props](../networkGame/props.md) and
[Server props](../networkGame/server_props.md).
:::
