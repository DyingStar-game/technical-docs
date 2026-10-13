---
title: GUI on a 3D screen
sidebar_position: 6
---

# GUI on a 3D screen

To display a 2D interface on an in-world surface — a vehicle dashboard, a control panel, a
kiosk — render a normal `Control` UI through a `SubViewport` and show it on a mesh via a
`ViewportTexture`. It can also receive clicks. This is Godot's "GUI in 3D" pattern; the reusable
helper lives at `scenes/interactables/gui_3d.tscn`.

**Used by**: the mining depot screen (`mining_depot.tscn`), the teleporter (`teleporter.tscn`), the
component dispenser (`component_dispenser.tscn`) and the vehicle dashboard
([Adding a vehicle](./vehicles.md)).

## The pieces

- a **UI scene** — a regular `Control` / `Panel` with your labels / buttons (and a script if it
  needs logic),
- a **`SubViewport`** holding that UI scene,
- a **screen `MeshInstance3D`** whose material shows the SubViewport through a `ViewportTexture`,
- the **`Gui3D`** helper (`scenes/interactables/gui_3d.tscn`) — forwards mouse / touch to the
  viewport so the UI is clickable (only needed for an interactive screen),
- (interactive only) an **`Area3D`** over the screen mesh, for the click detection with a free
  mouse cursor (the crosshair does not need it, see below).

## Setup

1. Build the UI scene (Control / Panel + your nodes); attach a script if it has behaviour.
2. Add a `Gui3D` (instance of `gui_3d.tscn`) where you want the screen, with a child
   `SubViewport` containing your UI scene, plus the screen mesh.
3. `SubViewport` → **Update Mode = Always** (otherwise the screen freezes), and set its **Size**
   to your UI size.
4. Screen mesh → `StandardMaterial3D`:
   - **Resource → Local to Scene = On** (required, see below),
   - **Albedo → Texture → New ViewportTexture → Viewport = this scene's `SubViewport`**,
   - **Shading = Unshaded** (or use Emission) so it stays readable.
5. On the `Gui3D`: `node_viewport` = the SubViewport, `node_quad` = the screen mesh, `node_area`
   = the click `Area3D` (for interactivity).

## Using a screen in game: the crosshair

Walking up to a screen does **not** free the cursor nor freeze the view (it used to, through a
`ScreenZone` box laid in front of every console: the player was stuck to every screen they walked
past). The view stays the player's:

- the **crosshair is the pointer**: `PlayerClient._point_screen` finds the nearest `Gui3D` (group
  `screen_gui`) the ray from the eye meets within 4 m (`Gui3D.hit`, pure geometry on the screen
  mesh's plane — the client has no wall collision anyway) and hovers it (`Gui3D.pointer_at`);
- the **`perforate` action** (left click, right trigger) clicks under the crosshair
  (`Gui3D.click_at`), and the tool in hand does not fire meanwhile;
- a **text field** that takes the keyboard locks the gameplay keys (so typing `1750` does not equip
  the drill) but not the view. The next click gives the keyboard back to the game and acts on what
  is under the crosshair, if anything. Escape, or walking away, gives it back too
  (`Gui3D.release_keyboard`).

## Talking to the server: the screen contract

A screen's **owner** is the nearest ancestor of its `Gui3D` with `update_screen()`. The client
**names** the screen in its action, like the truck kiosk; the server finds it again and checks the
player is within reach (`ScreenTarget`, `scenes/interactables/screen_target.gd`):

| On the owner | Side | |
|---|---|---|
| `update_screen(data)` | server | **required** — a validated action |
| `set_screen_actor(player)` | server | optional — who sent it, right before `update_screen` |
| `is_typing() -> bool` | client | optional — a field holds the keyboard |
| `screen_event(event)` | client | optional — what the server announced (below) |

```gdscript
# CLIENT, on a button of the screen's UI: only the request travels.
ScreenTarget.send(self, {"state": "dispense", "spec": spec_path})
```

`send` adds the screen's address (`target_uuid` of the networked node carrying it — the owner or
its nearest ancestor whose `PropSync` has a uuid, `PropSync.networked_from` — and the `screen` path
inside it) to a `screen_state` action. A `PropSync` without a uuid is skipped: a machine placed in a
village layout is networked on its own, the same machine placed inside a garage never gets a uuid,
and the garage names it. `PlayerServer` resolves it (`ScreenTarget.resolve`) and refuses a screen farther than
`ScreenTarget.USE_RANGE_M` from the player's eye. Treat `data` as a request, never as an
instruction: check every field against the server's own state (the dispenser only hands out a part
of its own catalogue, the teleporter re-resolves the destination).

### Showing everyone what a screen does

`ScreenTarget.announce(screen, player, event)` (server) puts the event on the player property
`screen_event` of the player who used the screen; player properties reach every client around them,
and `PlayerClient` hands it to the screen it names (`ScreenTarget.receive` → `screen_event`). It is
stamped with the server's clock (`at`): a client arriving midway joins at the right second
(`ScreenTarget.time_left`), one arriving after it is over ignores the re-broadcast. The key is
whitelisted in `player_def.json` — the game's **and** horizonserver's.

:::warning[An event arrives many times]
Horizon sends a player's properties again with each of their updates — every turn of the head. A
`screen_event` therefore reaches the screen over and over: `receive` hands it over **once** per
screen and `at`. Without that, the dispenser's fan restarted at every mouse move.
:::

## Gotchas

:::warning[The screen material must be "Local to Scene"]
A `ViewportTexture` resolves its viewport per scene instance, so the material holding it (and any
resource containing it) must have **Local to Scene** enabled — otherwise Godot refuses to create
the ViewportTexture ("…not local to the scene").
:::

:::danger[Point the ViewportTexture at THIS scene's SubViewport]
If you copy a screen from another scene, its `ViewportTexture` keeps the **old** `viewport_path`.
A path that does not exist in the current scene shows a blank screen and throws
`common_parent is null` **when you save**. Re-pick the Viewport so it points to this scene's own
`SubViewport`.
:::

## Reference

The mining depot (`mining_depot.tscn` → its `Gui3D`) is a complete, working example, including the
interactive buttons.
