---
title: Asset library (Godot)
sidebar_position: 8
---

# Asset library (Godot)

The **Library** tab of the Godot editor lists the project's assets by what they
are, whatever folder they are in: models, scenes, materials, textures, sounds.
It is there for level design, where the FileSystem dock makes you browse folder
by folder.

It is part of the `DyingStar` editor plugin, which the project enables for
everyone. There is nothing to install and nothing to configure.

## Opening it

- The **Library** button in the bottom left corner of the 3D view opens and
  closes it.
- It is also a tab of the bottom panel, next to *Output* and *Debugger*.
- It opens by itself when the editor starts. To stop that, untick
  *DyingStar > Open the asset library at start* (your own choice, kept for this
  project).

## Finding an asset

**Categories**, on the left, each with its count: 3D models, Scenes, Materials,
Textures, Icons & markers, Sounds, Shaders, and *All*. Under *All*, each
thumbnail carries the icon of its category, so a model and the scene of the same
name are told apart.

**Tags**, on the line above the grid. A tag is a folder the asset sits in:
`assets/_universe/structures/industrial/garage.glb` is tagged `structures` and
`industrial`. A shared material is also tagged with its family (`metal` for
`mat_metal_yellow_rusty`), the same word as in Blender's Asset Browser. Click a
tag to keep only its assets, click it again to release it. Type in the *Tag...*
field to find one: the line keeps the tags that match, and Enter takes the first.
The tags that do not fit on the line are behind `...`.

**Search**, at the top: every word typed is looked for in the name, the tags and
the path.

**Zoom**: the slider at the top, or Ctrl + wheel over the grid.

## Using an asset

**Drag it** from the grid into the 3D view, the scene tree or the inspector,
exactly as from the FileSystem dock: a model dropped in the 3D view is instanced
there.

Or select it and use the detail column, on the right:

| Kind | Action |
| --- | --- |
| Model, scene | **Add to scene**: instanced under the selected node, or under the scene's root |
| Material | **Apply to selection**: set as the material override of the selected meshes |
| Texture, shader | **Open** |
| Sound | **Play** / **Stop**, with a volume. *Auto-play*, at the top, plays a sound as soon as it is selected |

Every action is one undo step (Ctrl+Z). **Show in FileSystem** selects the file
in the dock. A double click opens a scene, plays a sound, or opens the resource.

A selected model is shown in 3D: drag to turn it, right-drag to move the view,
wheel to zoom.

## What the marks on a thumbnail mean

| Where | Mark | Meaning |
| --- | --- | --- |
| Top right | Green tick | The asset has its credit |
| Top right | Red cross | The asset needs a credit and has none |
| Bottom left | `LOD` | The asset has several levels of detail |
| Top left | An icon | Its category (under *All* only) |

**Credits** follow the rule of `tools/generate_credits.py`, the one the pull
request check applies (see [Credits](./credits.md)): a `.txt` of the asset's name
beside it, one `<prefix>.txt` for a set of `<prefix>_*` files, the `material.json`
of a shared material, or a library's own licence file. Only sounds, models and
textures under `assets/` are marked. **No credit**, at the top, lists the assets
that have none, and the detail column names the file to add.

**Levels of detail**: files named `<asset>_lod<N>` in the same folder are one
tile, under the asset's name. Select it and the detail column lists its levels;
pick one to see it, and *Add to scene* then adds that level. Dragging from the
grid takes the finest.

## What is not listed

- Planets and whole systems (`scenes/systems`, `scenes/planet`): they are worlds,
  not something to place in one.
- Anything outside `res://assets` and `res://scenes`.

## Editor colours

*DyingStar > Use DyingStar colours* puts the editor in the game's colours: the
website's near-black background, its amber as the accent. *DyingStar > Restore my
editor colours* gives back the ones you had. The colours are applied once, the
first time you open the project. They are editor settings, not project ones: they
apply to every project you open with this Godot.

## For developers

The code is in `addons/dyingstar/asset_library/`:

| File | Job |
| --- | --- |
| `asset_catalog.gd` | Pure logic, no editor: what is an asset, its category, its tags, the credit rule, the grouping of levels of detail, the filter. Tested by `test/unit/test_asset_catalog.gd` |
| `asset_library_panel.gd` | The panel: layout, thumbnails, actions, sound |
| `asset_grid.gd` | The grid and its drag data, `{"type": "files", "files": [...]}`, which is what the FileSystem dock hands over |
| `asset_stage.gd` | A small 3D stage with its own world, for a model's picture and for the preview |
| `asset_thumbnailer.gd` | Draws the pictures the editor does not have, one at a time, with a cache in `.godot/editor/ds_asset_thumbs/` |

Three rules keep it from ever stopping the editor. They come from a real freeze:
a planet's scene, instanced for its thumbnail, started generating its planet,
because tool scripts run in the editor.

1. **A picture never runs a scene's code.** A scene is put on the stage with its
   scripts taken off, before it enters a tree.
2. **Nothing is done while the tab is closed**: no listing, no thumbnail.
3. **An asset that stopped the editor is not drawn again.** It is marked while it
   is being drawn; a mark still there at the next start puts it in
   `skipped.txt`, in the cache folder. Delete that file to try again.

The kind of an asset is read from the editor's own file index
(`EditorFileSystemDirectory.get_file_type`), so listing opens no file.
