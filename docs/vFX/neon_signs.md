---
title: Neon signs
sidebar_position: 4
---

# Neon signs

A `NeonSign` writes a word on a facade as a lit neon tube: **GARAGE** over the garage doors,
**TÉLÉPORTEUR** over the teleporter cabin, **DÉPÔT DE FRET** on the cargo depot. The text follows the
game's language, and a small light tints the wall around it.

## Placing one

1. Open the building's scene, select its root, **Add Child Node** → `NeonSign`.
2. Move it onto the facade. The text is read from the node's **+Z side** (the blue arrow, in local
   space): turn it so that +Z points at the street, not at the wall. Leave a few centimetres between
   the node and the wall: the letters are extruded `depth` around it.
3. Give it a `text_key` (below).
4. To have it come on at dusk and go off at dawn, add a [Photocell](./photocell.md) under it.

There is nothing to do for the network: the sign belongs to the building's scene, so every client
draws it when the building appears. The dedicated server, which draws nothing, drops it.

## Its text is a translation key

`text_key` is a key of `tools/localization/localisation.csv`, written `%%SIGN_<NAME>`. Add the line
with its English and French text:

```
%%SIGN_GARAGE,GARAGE,GARAGE,
%%SIGN_TELEPORTER,TELEPORTER,TÉLÉPORTEUR,
```

The sign shows the translation, and changes when the player changes language. A key missing from
the file shows as itself, without its `%%` (`SIGN_GARAGE`), and `test_localisation_keys` fails.

:::warning[No default text]
`text_key` has no default value on purpose. Godot does not save a property whose value equals its
default, so with a default text, the scene of a sign showing that text would hold no text at all, and
the day the default changed, the sign would change with it.
:::

:::tip[The game still shows the key]
The game reads `.translation` files that the editor builds from the CSV when it notices the change.
If a new sign shows its key, give the editor's window the focus (or reimport the CSV) and relaunch.
:::

## Settings

| Setting | What it does | On the village signs |
|---|---|---|
| `color` | Colour of the tube; its light takes the same | amber (garage), cyan (cabin) |
| `glow` | Emission energy of the tube. Above about 1, the environment's glow makes it bloom | 1.5 to 2.5 |
| `letter_height` | Height of a capital letter, in metres | 0.14 (a label on a machine) to 1.4 (the garage) |
| `depth` | Thickness of the tube | 0.04 to 0.2 |
| `font` | Font of the letters | Xolonium |
| **Light** › `light_energy`, `light_range`, `light_attenuation`, `light_offset` | The light on the wall (below) | |
| **Distance** › `fade_distance` | Beyond it the sign is not drawn and its light fades out | 300 to 400 m |

## A soft patch of light, not a disc

Inside its range, a light's brightness goes as **1 / distance^attenuation**; over the last third of
the range it is then forced down to zero. At an attenuation of 1 (Godot's default) the light has
hardly faded when that cut comes, and the cut draws a **sharp round edge** on the ground.

To get a patch that melts away:

- `light_attenuation` around **2** (the physical inverse square; 2.2 to 2.7 on the village signs);
- `light_range` far enough that the cut falls where the light is already faint;
- `light_energy` raised to make up for the faster fading;
- `light_offset` puts the light in front of the letters: a few metres lights the ground in front of
  the building rather than the wall.

The same holds for any `OmniLight3D` or `SpotLight3D` (their **Attenuation** and **Range**). A
`SpotLight3D` has one more edge, the rim of its cone: an **Angle Attenuation** below 1 softens it.

## Why not a `Label3D`

A `Label3D` cannot make a neon: its colour cannot go above 1, so the glow never catches it. The sign
builds a `TextMesh` (real extruded letters) with an emissive material instead.

The tube and the light are **internal** children, rebuilt by the script: they never get saved into
the building's scene. No generated mesh ends up in your diff, and two signs never share one text.

## Tests

`test/unit/test_neon_sign.gd` checks, for every building that wears a sign, that it reads its own
key, and for a sign on a facade, that its +Z points away from the middle of the building. It also
checks that the tube glows, follows the language and switches off. A new building with a sign goes in
its `BUILDINGS` list, and in `ON_FACADE` when the sign hangs on a facade.
