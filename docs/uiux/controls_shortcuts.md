---
title: Controls & shortcuts
sidebar_position: 2
---

# Controls & shortcuts

Every player key is an **InputMap action**, so it shows up — and can be rebound — in
**Settings → Controls**. The keybind menu (`ui/menu_config/menu_config.gd`) builds its list
automatically from `InputMap.get_actions()` and saves the player's choices to
`user://inputs.map`. There is **no hard-coded key** in gameplay code: inputs are read with
`event.is_action_pressed("…")` / `Input.is_action_pressed("…")`.

## Main shortcuts (default keys)

Several keys are **contextual** — the same key does one thing on foot and another in a vehicle.

| Default | Action | On foot | Driving a vehicle |
|---|---|---|---|
| **E** | `action` | Pick up / drop a prop, **enter** a seat | — |
| **Y** | `exit` | — | Leave the vehicle |
| **L** | `toggle_flashlight` / `vehicle_lights` | Torch on/off | Head lights on/off |
| **Space** | `jump` / `brake` | Jump | Brake — **hold** at low speed = hand brake |
| **R** | `vehicle_reset` | — | Flip the vehicle upright |
| **2** | `zapette` | Toggle the admin cleanup tool ("Zapette") | (same) |

Movement (`move_forward/back/left/right`), `sprint`, `crouch`, `interact`, mining
(`toggle_tool`, `aim`, `perforate`), chat (`toggle_chat`, `write_in_chat`) and `pause` are
actions too — see the full list (and rebind them) in **Settings → Controls**.

:::note[Carrying, cargo & lights]
A crate in a vehicle bed is grabbed with **E** (the carry prompt shows `[E] Carry`). While carrying,
**look up / down** to raise or lower the held object — to set it on the ground or stack it on a shelf —
and it **drops on its own** if you drag it out of reach (e.g. left stuck behind a wall). On the in-cab
HUD the active shortcuts are listed live (e.g. `[L] lights`, `[Space] brake`).
:::

## Developer & debug tools

Handy while working on the game. Like every key, these are InputMap actions — rebind them in
**Settings → Controls**.

| Default | Action | What it does |
|---|---|---|
| **Alt + ²** | `toggle_debug` | Show/hide the **debug panels** — server/client stats, and (for the body you're on) your **altitude**, its **local time**, and your **longitude/latitude**. |
| *(see Settings)* | `toggle_eva` | **EVA free-flight** — detach and fly the body freely to inspect planets, moons and the day/night terminator from afar. |
| **Middle mouse (hold)** | `carry_free_rotate` | While carrying a prop, hold and move the mouse to **freely rotate** the held object (mouse wheel = step the yaw by 15°). |

See [Lighting, day/night & the sky](/docs/planetTech/lighting_sky_daynight) for what those readouts mean.

## Chat

The message log is **visible by default**; **F12** (`toggle_chat`) hides/shows the whole
panel. The input bar (channel selector + text field) stays hidden until you write.

To write, press **Enter** (`write_in_chat`): the input bar appears; press **Enter** again
to send the message and close it. **Escape** (or a mouse click) closes the input without
sending — Escape here cancels typing rather than opening the pause menu.

While typing, **Tab** cycles between the channels you can post to (today only the global
channel — group/alliance/region come later). Tab and Escape here are fixed text-field keys,
like in any chat box, so — unlike `toggle_chat` and `write_in_chat` — they are **not** listed
in Settings → Controls and cannot be rebound.

## Adding a shortcut (for developers)

**Always add a new key as an InputMap action — never a raw keycode.** A raw
`event.keycode == KEY_X` is invisible to the settings menu and can't be rebound.

1. Add the action in **Project Settings → Input Map** (or `project.godot` `[input]`), with a
   default key. Name it readably — the menu label is the action name upper-cased with `_` → spaces.
2. Read it with `event.is_action_pressed("my_action")` (events) or
   `Input.is_action_pressed("my_action")` (polling).

It then appears in **Settings → Controls** and is rebindable + persisted, with zero menu code.

:::tip[Exception: dev/bench tools]
Bench and debug-only keys (e.g. the test bench's `T`/`N`, `F4`, `F10`) may stay raw keycodes —
they are developer tools, not part of the player's control settings.
:::
