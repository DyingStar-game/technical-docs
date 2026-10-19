---
title: Star map
sidebar_position: 4
---

# Star map

The star map (**F2**, `scenes/ui/star_map/star_map.gd`, `class_name StarMap`) is the chart of the
whole system, from the star down to the metre on the ground. It is drawn in its own world, with its own
camera, and lives in the DataPad's **NAVIGATION** tab; seated in a truck it can also be shown on the cab
screen (see [Adding a vehicle](../networkGame/vehicles.md#the-switchable-cab-screen)).

This page covers what a developer touches: putting an object on the chart (`MapMarker`), how the chart
draws markers, why the chart is drawn around a moving origin, its controls, and how another screen can
host it.

## Putting an object on the chart: `MapMarker`

`MapMarker` (`scenes/common/map_marker.gd`, a `@tool` `Node3D`) is **one component per scene**: drop it
as a child of the object's root and set it in the Inspector. The chart reads every `MapMarker` of the
body it shows (group `map_marker`) and knows nothing else about what it draws. The marker stands for its
**parent**.

| Export | Default | Role |
|---|---|---|
| `icon` | *(none)* | The pictogram drawn over the footprint, from `assets/textures/map_markers/`. Empty: the rectangle alone. |
| `label` | `""` | The name shown when the pointer is over it. **A `%%` localisation key** (e.g. `%%MAP_MARKER_VEHICLE_LIFT`). Empty: the scene file's name, capitalised. |
| `importance` | `3` | 1 = most (a garage, the lift, a teleporter), 2 (homes, the truck), 3 (dispensers)… Drawn over the less important. |
| `max_view_m` | `500` | Hidden once the camera stands higher than this above the ground (m): a dispenser is noise from a kilometre up, a garage is still a landmark. |
| `show_footprint` | `true` | Draw the footprint as a rectangle (a building, a dispenser). Off: the pictogram alone (a vehicle). |
| `colour` | grey, 0.85 alpha | The rectangle's colour. |
| `footprint_size` | `(0, 0, 0)` | The footprint (m, parent's frame: x across, z along, y height). Zero: **measured**. |

**The measured footprint** is the box around the parent's visible `MeshInstance3D`s **and**
`CSGShape3D`s (a blockout such as the dispensers has no mesh at all), in the parent's frame
(`LocalFrame.of`). Lights and other `GeometryInstance3D`s are skipped — a headlight's 150 m reach would
otherwise be the box. It is measured once; while nothing is drawn yet (still loading) it is asked again
next frame.

### Adding one

1. Open the object's scene, **Add Child Node** → `MapMarker` under the root.
2. Pick an `icon` from `assets/textures/map_markers/` (a new pictogram goes there with its credit `.txt`
   of the same name, like every asset).
3. Set `label` to a key, and add that key to `tools/localization/localisation.csv` with **en and fr**
   filled — `test_localisation_keys` checks it (see [Localization](./localization.md)). Reuse an existing
   key first: the truck uses `%%SPAWN_TRUCK`.
4. Set `importance` and `max_view_m`; switch `show_footprint` off for something that moves.

**Inherited scenes** override the base scene's marker like any other node: `tool_dispenser.tscn`
inherits `component_dispenser.tscn` and only overrides its `MapMarker`'s `label` and `icon`.

Only what this client knows of is drawn: the objects the server replicates to it, near the player.

## How the chart draws them: `StarMapMarkers`

`scenes/ui/star_map/star_map_markers.gd`, refreshed every frame from the chart (`refresh(planet,
camera, gap_m)`):

- **Sizes on depth.** A rectangle has its true size close in and never less than `FLOOR_SHARE` (0.45 %)
  of its depth in the view further out; every pictogram is the same size on screen (`ICON_SHARE`, some
  3 % of the screen's height).
- **Grouping.** Pictograms with the **same icon** that overlap on screen (closer than `GROUP_OVERLAP` of
  their size) are drawn as **one**, with the count at its corner; the tooltip says e.g. "Habitat ×12".
  The most important are gathered first (`overlapping_groups`, static and tested).
- **Height.** A marker is hidden once the camera's gap to the ground exceeds its `max_view_m`; hidden
  markers are not even projected.
- **Render priorities.** Drawn over the ground with no depth test, under the chart's points of interest
  (default priority, always on top): rectangles at `RECT_PRIORITY` (−20), pictograms at
  `ICON_PRIORITY − importance` (−2 − importance), so importance 1 is over the others.
- **Hover.** The pointer lights the rectangle and the pictogram together (pictogram ×1.3); `pick()`
  prefers a group, then a pictogram, then a rectangle. The name comes before the coordinates in the
  readout.

Tests: `test/unit/test_star_map_markers.gd`, `test/unit/test_star_map_markers_fit.gd`.

## Float32 and the moving origin

A GPU vertex is **float32**, whatever precision the engine is built with. At metre zoom, a vertex
expressed from the planet's centre (6 356 km away) is quantised to about half a metre: the ground swims
and lines hop. The chart keeps everything that is drawn near **its own origin**:

- **The chart's origin goes on the ground under the camera** (`StarMapCamera.origin_point`), not at the
  watched body's centre. Everything drawn near the camera is then within metres of zero, where float32
  is exact to the millimetre. Positions used for reasoning stay absolute; only what is drawn is moved.
- **Relief tiles** are built around their own middle (`StarMapRelief.build_tile(..., local_origin)`): the
  vertices are stored relative to it, the mesh carries it as **meta `"origin"`**, and `StarMapGround`
  places the tile's node at that origin.
- **Road and canyon lines** (`StarMapTileLines`) are re-centred the same way on `middle_of(points)`, and
  `set_lift()` scales them about the body's centre keeping that offset.
- Markers (`StarMapMarkers`) hang from the chart's metres frame and are placed through **local
  transforms up to the planet** (ADR 0011), never a global position.
- The clip planes follow the gap to the ground, so the camera can come down to the metre.

Rule for anything new drawn on the chart close to a surface: lay its vertices around a nearby origin,
never around the body's centre.

## Controls

Every gesture is an InputMap action (**Settings → Controls → General → Star map**), Google Maps' way.
`StarMapGestures` (`scenes/ui/star_map/star_map_gestures.gd`) tells a click from a drag: a press that
moves more than 4 px is a **drag**, otherwise a **click** taken when the button comes back up.

| Default | Action | What it does |
|---|---|---|
| **Left click** | `star_map_select` | Select what is under the pointer; on bare ground, drop a **pin** that reads its coordinates. **Double click**: go there. |
| **Left drag** | `star_map_select` | Turn the view (about the station, over one; else about the world) |
| **Ctrl + left drag** | `star_map_tilt` | Turn the view (matched exactly, so it is never also a select) |
| **Right drag** | `star_map_menu` | Zoom (down = closer) |
| **Right click** | `star_map_menu` | Context menu: copy the coordinates (`lat, lon`, 6 decimals), set the marker, clear the marker |
| **Tab** | `star_map_search` | Into the search box |
| **Middle drag** | `star_map_orbit` | Turn the view |
| **Wheel** | `star_map_zoom_step_in` / `_out` | Zoom one notch |
| **X** (pad) | `star_map_reset` | Reset the view: the whole system (no longer on the right click) |

**Pins** (`StarMapPins`): the **pin** a plain click drops is gone as soon as the view moves; the
**marker** set from the context menu stays until the menu clears it. Opening the chart, and **Me**,
frame the player from 150 m up (`PLAYER_FOCUS_ALTITUDE_M`).

## Hosting the chart elsewhere

The chart is one node per player; another screen borrows it rather than building a second one:

- **`host_in(slot)`** puts the chart's face in a `Control` (the DataPad's NAVIGATION tab, or a cab
  screen's `map_slot()`).
- **`keys_live`** (default `true`): the chart reads its keys and the pad (zoom keys, stick, triggers, Tab).
  Set it **false** while the chart is on a screen in the world — those keys are the driver's then, and
  only the mouse events pushed into its face (by the crosshair) reach it.
- **`view_state()`** returns the view as data: the camera's `zoom`, `yaw`, `pitch`, `lean_turn`,
  `lean_angle` (`StarMapCamera.snapshot`), plus the watched and selected bodies **by key** (`watch`,
  `select`) and the selected point of interest (`poi`) — two charts list the same bodies, but nothing
  promises the same order.
- **`show_view(view)`** shows another chart's view as it is, at once (no travel); what this chart does
  not know is left alone.

The cab screen uses these to share one view between everyone aboard (`VehicleChartView`, replicated as
`chart_view`).
