---
title: GUI on a 3D screen
sidebar_position: 6
---

# GUI on a 3D screen

To display a 2D interface on an in-world surface — a vehicle dashboard, a control panel, a
kiosk — render a normal `Control` UI through a `SubViewport` and show it on a mesh via a
`ViewportTexture`. It can also receive clicks. This is Godot's "GUI in 3D" pattern; the reusable
helper lives at `scenes/interactables/gui_3d.tscn`.

**Used by**: the mining depot screen (`mining_depot.tscn`) and the vehicle dashboard
([Adding a vehicle](./vehicles.md)).

## The pieces

- a **UI scene** — a regular `Control` / `Panel` with your labels / buttons (and a script if it
  needs logic),
- a **`SubViewport`** holding that UI scene,
- a **screen `MeshInstance3D`** whose material shows the SubViewport through a `ViewportTexture`,
- the **`Gui3D`** helper (`scenes/interactables/gui_3d.tscn`) — forwards mouse / touch to the
  viewport so the UI is clickable (only needed for an interactive screen),
- (interactive only) an **`Area3D`** over the screen mesh, for the click detection.

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

## Pointing a screen from code

A screen can also be driven by a ray rather than the mouse — the crosshair on a console, the cab
screen's chart. `Gui3D` (`scenes/interactables/gui_3d.gd`) exposes the pieces:

| Method | What it does |
|---|---|
| `hit(from, dir, reach)` | Where a ray meets the screen (world point), or `null`. |
| `pointer_at(point)` | A mouse motion at that point (hover). |
| `click_at(point, pressed)` | The left button pressed / released there. |
| `push_at(event, point)` | Any real mouse event (a button, the wheel) placed at that point; a copy is pushed. |
| `point_at_uv(uv)` | The inverse: the world point at a screen UV (0..1, top-left = (0, 0)). |

### Tilted screen meshes: `uv_frame`

By default a hit is mapped to the screen through the mesh's **local XY plane**, which assumes the screen
face lies flat in its node's frame. A screen **modelled tilted inside its mesh** breaks that: the
truck's middle cab screen leans about 33° in its own frame, and the XY reading pointed beside the
crosshair.

Tick **`uv_frame`** on such a `Gui3D`: it then maps hits through the mesh's **own UVs**. It takes three
vertices of the first surface whose UVs are not in a line and solves `P(u, v) = origin + u·du + v·dv`
(`Gui3D.frame_from`, static and tested); the plane's normal goes through the inverse-transpose, so an
unevenly scaled mesh still hits right. It needs a **flat** mesh whose UVs span the face **linearly
0..1** — what a screen showing a viewport has anyway. `RearCamera` turns it on for the switchable cab
screen's `Gui3D` (see [Adding a vehicle](./vehicles.md#the-switchable-cab-screen)).

## Reference

The mining depot (`mining_depot.tscn` → its `Gui3D`) is a complete, working example, including the
interactive buttons.
