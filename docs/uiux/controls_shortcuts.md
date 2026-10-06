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
| **F** | `action` | Pick up / drop a prop, open / close a door, **enter** a seat, use a console | — |
| **Y** | `exit` | — | Leave the vehicle |
| **L** | `toggle_flashlight` / `vehicle_lights` | Torch on/off | Head lights on/off |
| **Space** | `jump` / `brake` | Jump | Brake — **hold** at low speed = hand brake |
| **R** | `vehicle_reset` | — | Flip the vehicle upright |
| **2** | `zapette` | Toggle the admin cleanup tool ("Zapette") | (same) |
| **I** | `vehicle_ignition` | — | Start / stop the engine |
| **T** | `emote_wheel` / `vehicle_speed_limiter` | Hold to open the **emote wheel**, release on a slice to play it | **Speed limiter** on/off |
| **Alt + wheel** | `vehicle_limiter_up` / `_down` | — | Speed limit **±5 km/h** (shown on the dashboard) |
| **F7** | `screenshot` | **Photo**: the world alone, no interface nor debug visuals | (same) |
| **F8** | `screenshot_debug` | **Bug-report shot**: the screen as it is, plus the debug panels | (same) |
| **F2** | `star_map` | Open / close the **star map** | (same) |
| **+** / **−** | `star_map_zoom_in` / `_out` | Zoom the star map, held (numpad or the top row; triggers on the pad) | (same) |

### Star map

Every gesture of the star map is an action too, listed under **Settings → Controls → General → Star
map**, so any of them can move to another button, a key or the pad:

| Default (mouse / pad) | Action | What it does |
|---|---|---|
| **Left click** / **A** | `star_map_select` | Select what is under the pointer (the centre of the screen on the pad); **twice** = go there |
| **Right click** / **X** | `star_map_reset` | Reset the view: the whole system |
| **Middle click (hold)** | `star_map_orbit` | Turn the view as the mouse moves (about the station, over one) |
| **Right stick** | `star_map_orbit_left/right/up/down` | Turn the view |
| **Wheel up / down** | `star_map_zoom_step_in` / `_out` | Zoom one notch |

The help line at the **foot of the map** is built from these bindings, for the device in your hands: a
rebound gesture shows its new key, an unbound one is left out. Mouse buttons are named in the game's
language (*Clic gauche*, *Molette haut*…), on the Controls page too.

The **arrows** steer **progressively** while driving: a tap turns the wheels a little, and they keep
their angle when released (they straighten up on their own only while rolling).

:::note[Screenshots]
F7 and F8 save a PNG and **copy it to the clipboard**. Files go to `<game folder>/screenshots` (F8 in
`screenshots/debug`, the F6 recordings in `screenshots/records`) — the game folder being the
executable's in a build, the project's in the editor. When that folder is not writable they fall
back to `Documents/DyingStar/screenshots`. **Settings › Video › Screenshot gallery** opens it.

For developers: the photo hides everything drawn on the window's canvas by itself, but it cannot tell
a **debug visual drawn in the 3D world** from scenery — such a node must join the group
`Globals.GROUP_DEBUG_OVERLAY` (as the celestial markers and the cargo envelope do).
:::

Movement (`move_forward/back/left/right`), `sprint`, `crouch`, `prone`, mining
(`toggle_tool`, `aim`, `perforate`), chat (`toggle_chat`, `write_in_chat`) and `pause` are
actions too — see the full list (and rebind them) in **Settings → Controls**.

:::note[Seated, the panels come first]
Sitting in a vehicle no longer locks you out of the rest of the game: the star map, the emote wheel and
the debug panels all still open, and the dashboard instruments stay usable at the wheel. While a panel
holds the keyboard, **driving input is neutralised** and the mouse cursor is released, so opening the
map cannot make you honk or drive off — and closing it hands control straight back.
:::

:::note[Carrying, cargo & lights]
A crate in a vehicle bed is grabbed with **F** (the carry prompt shows `[F] Carry`). While carrying,
**look up / down** to raise or lower the held object — to set it on the ground or stack it on a shelf —
and it **drops on its own** if you drag it out of reach (e.g. left stuck behind a wall). On the in-cab
HUD the active shortcuts are listed live (e.g. `[L] lights`, `[Space] brake`).
:::

:::note[One key, one use: F]
`action` moved from **E** to **F** (E is now the EVA roll), and the separate `interact` action that also sat on F
is **gone**: one press used to do two things — carrying a crate while using a console put the crate down as
well. A console under the crosshair now takes the `action` press first, and only it.
:::

## In space (EVA)

Weightless — around a station, or beyond a planet's air — the same movement keys push you with your suit's
thrusters, and there is **no drag**: you keep your speed until you push against it. They are grouped in the
**EVA** tab of **Settings → Controls**. How the drift works: [Orbital stations](../networkGame/stations.md).

| Default | Action | What it does |
|---|---|---|
| **W A S D** (**Z Q S D** on AZERTY) | `move_*` | Thrust forward / left / back / right |
| **Space** / **Ctrl** | `strafe_up` / `strafe_down` | Thrust up / down, along your own up |
| **Q** / **E** (**A** / **E** on AZERTY) | `roll_left` / `roll_right` | Roll, with momentum; a released roll slows down on its own |
| **X** | `eva_stabilize` | Brake: the thrusters fire against your motion until you are still relative to your frame (the station, beside one) |

## Developer & debug tools

Handy while working on the game. Like every key, these are InputMap actions — rebind them in
**Settings → Controls**.

| Default | Action | What it does |
|---|---|---|
| **Alt + ²** | `toggle_debug` | Show/hide the **debug panels** — server/client stats, and (for the body you're on) your **altitude**, its **local time**, and your **longitude/latitude**. |
| *(Settings → Debug)* | Star map debug | A **Star map** section in the debug panel while the map is open: bodies, followed body, zoom, simulated time, relief tiles. The panel goes over the map, and the map's info panel steps aside. |
| *(see Settings)* | `toggle_eva` | **EVA free-flight** — detach and fly the body freely to inspect planets, moons and the day/night terminator from afar. |
| **Middle mouse (hold)** | `carry_free_rotate` | While carrying a prop, hold and move the mouse to **freely rotate** the held object (mouse wheel = step the yaw by 15°). |
| **+** / **−** | `debug_time_forward` / `_back` | Shift the **simulated time** by an hour, on **this client only**; hold to sweep the sky (a tool for judging an atmosphere at another hour). While it is shifted a **red banner** says so: everything worked out from the time on both sides — an orbital station's place — no longer matches the server, and leaving a station lands you where the server has it. Shares its keys with the star-map zoom, which only reads them while the map is open. |
| **Alt + L** | `debug_toggle_moon_lights` | Cut the **moon lights** and print each factor (phase, elevation, extinction, energy) — the way to tell "the night is too dark" from "the moon is below the horizon". |
| **Alt + I** | `debug_isolate_light` | Cycle the **light isolation** modes: no aerial perspective, no sky reflection, no sky ambient. Each step removes exactly one contributor, so whatever still lights the scene names its own source. |
| **F6** | `game_record` | Start / stop the gameplay recording (saved in `screenshots/records`). |

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

## Families and labels

The controls page groups its actions into tabs — **General, On foot, In a vehicle, In flight,
Debug** — from `MenuConfig.ACTION_GROUPS`, which maps family → action → translation key. That is
one table, not a list of families beside a table of labels: two of those drift, and you end up with
an action in a family with no label, or the reverse.

A new action you do not file lands in an **Other** tab rather than disappearing from the page, and
shows the opened-out form of its name. Filing it is one line.

Give it a label whenever the action name does not say what the key does. `jump` also starts a vault
and a climb — it was reported as "the vault key is not configurable" when it had been configurable
all along, under a name that never mentioned vaulting. `action` and `interact` are worse: two
different keys whose names say the same thing.

The search box searches **all** families, not the open tab — you type in it precisely because you do
not know where the key lives. See [Localization](./localization.md) for the label keys themselves.

## Prompts show the key that is bound

Never write a key into a prompt. `"[E] Drop"` lies to anyone who rebound `interact`.

```gdscript
# InputLabel names the key as printed on the player's own layout ("²" on AZERTY)
player.interact_label.text = _prompt(&"action", tr("%%HUD_DROP"))
```

The same helper names keys in the controls list, so there is one answer per key for the whole game.

:::danger[A modifier does not separate two actions on its own]
`is_action_pressed()` **ignores modifiers**: an action bound to `L` matches a plain `L` *and* `Alt+L`.
So binding `Alt+L` next to an existing `L` gives you two actions that both fire on the same press —
the torch toggles while you meant to cut the moon lights.

Three actions currently sit on **L** and two on **I** for exactly this reason. When you add a
modified variant of a key that is already taken, guard **both sides symmetrically**: the plain action
must reject the press when the modifier is held, and the modified one must require it. Checking only
the new action leaves the old one firing.
:::

:::tip[Exception: dev/bench tools]
Bench and debug-only keys (e.g. the test bench's `T`/`N`, `F4`, `F10`) may stay raw keycodes —
they are developer tools, not part of the player's control settings.
:::
