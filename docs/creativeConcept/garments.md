---
title: Garments
sidebar_position: 7
---

# Garments (character clothes)

This page explains how to make a garment that game characters can wear: a T-shirt, trousers, gloves, a helmet or
overalls. You model it in Blender, on the game's own body, and export it straight into the game.

It is written for two audiences:
- **3D artists** need [What you need](#what-you-need) through [Troubleshooting](#troubleshooting).
- **Developers** need [How it works](#how-it-works).

Read the general [3D models](./3d_models.md) page first for textures and triangle counts, and the
[Credits](./credits.md) page for how your name reaches the game.

---

## The idea in one paragraph

A garment is a 3D mesh that **hangs on the skin**. Each of its vertices is bound to the point of the body's skin
right under it. Because of this, one garment fits every character: a man, a woman, a thin or a heavy body, a tall or
a short one. It also follows the animations without being rigged.

You model it once, around the reference body, standing at rest. The add-on works out the binding, checks the
garment and writes it into the game repository. Godot picks it up from there.

## What you need

| What | Where |
| --- | --- |
| Blender 4.2 or later (tested with 5.2) | |
| The add-on `dyingstar_garments-<version>.zip` | Nextcloud `3D-Assets/_universe/characters/humanoids/tools/` |
| The reference body `vitruvian_reference.blend` | Nextcloud `3D-Assets/_universe/characters/humanoids/model/` |
| A clone of the [game repository](https://github.com/DyingStar-game/DyingStar) | Your disk: the export writes into it |

Keep your source files in Nextcloud, under `3D-Assets/_universe/characters/humanoids/garments/<zone>/<id>/`. Put
the `.blend` and the full-size textures there, for example `5_mains/leather_gloves_01/leather_gloves_01.blend`.
The zone folders are `0_corps`, `1_tete`, `2_cou`, `3_torse`, `4_bras`, `5_mains`, `6_poignets`, `7_doigts`,
`8_jambes` and `9_pieds`.

### Install the add-on (once)

1. Go to **Edit ▸ Preferences ▸ Add-ons**, open the **▾** menu at the top right, then **Install from Disk**, and pick
   the zip.
2. Tick **Dying Star Garments**.
3. In its preferences, fill in:
   - **Reference body**: the `vitruvian_reference.blend` from Nextcloud.
   - **DyingStar project**: the root of your clone of the game repository (the folder with `project.godot`).
   - **Discord pseudo** and **Discord id**: your credit. They go into the credit file of everything you export.
4. In the 3D View, press **N** and open the **DyingStar** tab.

---

## Where a garment sits: the GDD equipment rules

The game decides what can be worn together with the rules of the GDD page
[Équipements du personnage](../project/3_GDD/5_personnage/4_personnage_équipement.md). Every garment has a
**code** of four figures:

```
zone[side][finger] - support - layer - access
```

| Figure | Meaning | Values |
| --- | --- | --- |
| **zone** | Where it is worn. | `1` head, `2` neck, `3` torso, `4` arms, `5` hands, `6` wrists, `7` fingers, `8` legs, `9` feet, `0` whole body |
| side | Optional. One side only. | `G` left, `D` right (arms, hands, wrists, fingers, legs, feet) |
| finger | Optional. One finger only. | `1` thumb … `5` little finger (hands, fingers) |
| **support** | The highest layer it can be worn **over**. | `0` underwear … `5` heavy armour |
| **layer** | The layer it **counts as**. | `0` underwear, `1` clothing, `2` light jacket, `3` coat, `4` light armour, `5` heavy armour |
| **access** | Whether what is under it can still be reached. | `0` blocks, `1` does not block |

Examples from the GDD and from the game:

| Garment | Code | Reads as |
| --- | --- | --- |
| Underpants | `8-0-0-0` | Legs, on the skin, underwear. |
| Trousers | `8-0-1-0` | Legs, over underwear, clothing. |
| T-shirt with sleeves | `3-0-1-1` + also covers `4` | Torso and arms, over underwear, clothing. |
| Light jacket | `3-1-2-1` + also covers `4` | Over clothing, counts as a light jacket. |
| Coat to the knees | `3-2-3-1` + also covers `4, 8` | Over a jacket, counts as a coat. |
| Gloves | `5-1-1-1` | Hands, can go over a ring, clothing. |
| Wedding ring | `5G4-0-1-0` | Left ring finger, on the skin. |
| Holster | `8D-4-3-0` | Right leg, a coat-level item that can sit on light armour. |
| Hazmat suit | `0-3-4-0` | Whole body, over a coat, counts as light armour. |
| Overalls (MakeHuman) | `3-0-1-0` + also covers `4, 8` | The game's first outfits, top and trousers in one mesh. |

How the game reads the code:
- **Overlap.** Two garments that share a zone overlap. Sides and fingers count: a left glove and a right glove do
  not overlap. The whole body (`0`) overlaps everything, hands hold the fingers, and wrists sit between the arms and
  the hands.
- **Stacking.** Overlapping garments are worn from the inside out, in the order of (support, layer). The one that
  can rest on higher layers goes outside.
- **Conflicts.** For each overlapping pair, the inner garment's layer must be at most the outer one's support. Two
  garments with the same support and layer on the same zone cannot be worn together: no two pairs of trousers.
- **Drawing.** Where a garment is covered by one worn over it, the hidden part is not drawn. A trouser leg inside a
  boot disappears, and so does a T-shirt under a jacket.

In the character creator, the outfit tab is grouped by zone. Each zone has one list per layer from 0 to 3
(underwear, clothing, light jacket, coat). Choosing a garment takes off whatever it cannot be worn with. Layers 4
and 5 (armour) are game equipment and do not appear in the creator.

---

## Step by step

### 1. Load the body

Click **Load the reference body**, then pick the body you model on: **Neutral**, **Man** or **Woman**. Click 🔄
to show it.

The body stands **at rest, in an A pose** (arms down at 45°). This is the pose the game binds garments in.

:::warning Never edit the body
Do not move, scale, pose or edit the body. The garment is bound to its vertices by their **number**. The body
cannot be selected, so you cannot pick it by mistake.
:::

### 2. Model the garment

Model the garment as **its own mesh object**, around the body, at rest:
- **Distance to the skin.** Keep this gap between the skin and the garment's inner side:

  | Layer | 0 | 1 | 2 | 3 | 4 | 5 |
  | --- | --- | --- | --- | --- | --- | --- |
  | Gap | 2 mm | 4 mm | 8 mm | 15 mm | 20 mm | 30 mm |

  A jacket must clear a T-shirt, and a coat must clear a jacket.
- **Shrinkwrap is your friend.** A copy of the body's area with a *Shrinkwrap* (offset) and a *Solidify* is a quick
  start for tight clothes.
- **Modifiers.** Mirror, Subdivision, Solidify and the like are applied at export: you do not need to apply them.
- **No rigging.** The garment takes its bone weights from the skin under it.
- **Triangles.** Aim for about **6 000 triangles** at most for a full piece (the check warns above). Gloves and
  shoes need far fewer.
- **Edges.** Let hems, collars and cuffs overlap the skin slightly rather than stopping short of it: the skin under
  a garment is not drawn.
- **UVs and materials.** Unwrap the garment and give it one Principled material. The add-on finds the textures by
  how they are connected:

  | Texture | How the add-on recognises it | Exported as |
  | --- | --- | --- |
  | Colour | Image node plugged into **Base Color** | `<id>_albedo.webp`, 2048 px at most |
  | Normal map | Image node plugged into a **Normal Map** node | `<id>_normal.webp`, 2048 px |
  | Ambient occlusion | Image node whose label or name contains `ao` | `<id>_ao.webp`, 1024 px |
  | Tint mask (later: player-chosen colour) | Image node whose label or name contains `tint` | `<id>_tint.webp`, 1024 px |

An alpha channel in the colour texture cuts holes (lace, ripped jeans).

**Helmets and hats.** Set **Hangs on** to **Skull**. The helmet then hangs only on the head and neck, and grows
with the head's width, height and depth. It does not bend when a face has a big nose or a strong jaw. Tick
**Hides hair** (and **Hides beard** / **Hides face** for a closed helmet): the game then does not grow what the
helmet hides.

### 3. Fill in the garment's card

Select the garment. The panel shows its card:

| Field | What to put |
| --- | --- |
| **Id** | Lowercase letters, digits and `_`, starting with a letter: `leather_gloves_01`. It is the file name and the catalogue key. **Never rename a garment once it is in the game**: saved characters refer to it. |
| **Name (en) / Nom (fr)** | What players see in the creator. |
| **GDD code** | Zone (plus side and finger when they matter), **Also covers** (other zones, comma-separated: a top with sleeves also covers `4`), **Rests on** (support), **Layer**, **Blocks access**. The panel shows the resulting code, for example `5-1-1-1`. |
| **Hides** | Hair, beard, face: what the game should not grow under it. |
| **Material** | Cloth (matte), Leather (a little shine), Hard (helmet shells, armour plates), Glass (see-through visor). |
| **Hangs on** | Skin (clothes) or Skull (helmets, hats). |
| **Random looks** | Who random characters (NPCs) may wear it on: anyone, men, women. Every player can choose any garment. |

### 4. Check

- **Check** binds the garment and reports two figures:
  - **Inside the skin**: the share of the garment that pokes into the body. **Above 6 % the export is refused.**
  - **Closer than** the gap of its layer: the share that sits too close.

  It also paints the mesh's colour attribute `DS_Check`: **red** inside the skin, **orange** too close, green fine.
  To see it, set the Viewport Shading color to **Attribute**.
- **Hidden skin to a group** writes the skin the garment hides into the body's vertex group `DS_Hide_<id>`. Paint
  it by hand when skin shows through (add) or when the garment has a hole that should show skin (remove). When the
  group exists, the export uses it as it is.
- **Try on this body**: move the body's shape keys (`BodyType_Fat`, `Chest_Breast_Size`, `Hands_Size`,
  `Gender_Female`…), then click it. The garment is put on that body **by the game's own rule**, so what you see is
  what players will see. 🔄 puts the body back and removes the preview.
- **Wear an exported garment** puts a garment already in the game on the body. Use it to check that your jacket
  goes over the T-shirt.
- To see the garment move, pose the bones of **DS_Rig** in Pose Mode. The body follows; the garment does not
  follow in Blender (only in the game).

### 5. Export

Choose the **Credit**:
- **Me (Discord)**: your pseudo and id from the preferences.
- **Third party**: the site, author, URL and licence of what you started from (see [Credits](./credits.md)).

Then click **Export to the game**. The panel lists what is missing first, if anything. The export writes into the
repository:

```
assets/_universe/characters/human/garments/<id>/
    <id>.dsgarment          the mesh and its binding
    <id>_albedo.webp        textures (those it found)
    <id>_normal.webp
    <id>.txt                your credit
```

It also updates three files:
- `human_catalogue.json`: the garment is added at the end, or updated in place if it was already there;
- `test/data/character/catalogue_order.json`: the frozen order the tests check;
- `localisation.csv`: the names (`%%GARMENT_<ID>`).

Exporting again with the same id replaces the garment.

### 6. See it in the game

Open the Godot editor (or bring it to the front): it imports the new garment. Then either:
- open the character creator, **Outfit** tab: the garment is under its zone and layer;
- or put it on a row of bodies:

  ```
  godot --path . res://test/character/human_preview.tscn -- --garments=leather_gloves_01,mh_male_casualsuit01,mh_shoes03
  ```

Commit the garment's folder together with the changes to the catalogue, the frozen order and the localisation, in
the same pull request. The pull request's credit check needs the `.txt` file.

---

## Troubleshooting

| What you see | Why, and what to do |
| --- | --- |
| *"No reference body in the scene"* | Click **Load the reference body**, and check its path in the preferences. |
| Export refused: *"x % of it is inside the skin"* | Look at the red in `DS_Check` and pull those parts out. Then try the extreme bodies with **Try on this body**. |
| Skin shows through the garment in the game | Run **Hidden skin to a group** and paint the missing skin into `DS_Hide_<id>`, then export again. A wider gap to the skin helps too. |
| A hole in the body near a hem | The hidden skin goes past the garment: remove those vertices from `DS_Hide_<id>`. |
| Godot: *"garment … was bound to body …, the bank's is …"* | The game's body changed since the reference body you used. Download the new `vitruvian_reference.blend`, load your garment's `.blend` with it, and export again. |
| The garment is plain grey in the game | No colour texture was found. The Base Color of its material must come from an image node. |
| The garment cannot be chosen with another one | Their codes conflict. Check their support and layer against the rules above. |

---

## How it works

### Files

| Where | What | Job |
| --- | --- | --- |
| Blender | `tools/blender_scripts/addons/dyingstar_garments/` | The add-on. `core.py` turns the scene into arrays and back, `operators.py` holds the buttons, `ui.py` the panel. |
| Python | `tools/character/garments/garment_bind.py` | The binding, pure numpy: the add-on ships a copy. |
| Python | `tools/character/garments/garment_rules.py` | The GDD rules. Its twin is `garment_rules.gd`. |
| Python | `tools/character/garments/garment_labels.py` | Writes the catalogue entry, the frozen order and the names. |
| Python | `tools/character/garments/export_reference_body.py` | Makes `vitruvian_reference.blend` from the bank. |
| Python | `tools/character/garments/convert_bank_outfits.py` | Turned the bank's MakeHuman outfits into garment files, unchanged to the bit. |
| Python | `tools/blender_scripts/build_garments_addon.py` / `test_garments_addon.py` | Builds the zip, and tests it end to end in Blender without a window. |
| Godot | `addons/dyingstar/garment_importer.gd` | Imports a `.dsgarment` as a `HumanAssetData`. It refuses a garment bound to another body. |
| Godot | `scenes/_universe/characters/human/garment_format.gd`, `npz_reader.gd` | The file format, and the body signature. |
| Godot | `scenes/_universe/characters/human/garment_rules.gd` | The GDD rules, used by the creator and the server. |
| Godot | `scenes/_universe/characters/human/garment_library.gd` | Loads the garments worn, once. Keeps their topology. Works out which parts are hidden by a garment worn over them. |

### The binding

The body is the bank's (`human_bank.res`), in its rest pose. For each garment vertex, the add-on finds the closest
point of the skin. It stores the three corners of that skin triangle (`refs`), the point's barycentric `weights`
there, and what is left over (`offsets`). The game puts the garment on any body with the same sum
(`HumanMorph.fit`):

```
position = Σ body[refs[k]] · weights[k] + offsets · size
```

`size` is 1, except for a skull-bound garment: there, it is the head's growth along each axis, measured between
`scale_pairs`. The bone weights are the skin's, blended by the same barycentric weights.

**Hidden skin** (`delete`) is found automatically:
1. A skin vertex is hidden when the garment lies within 6 cm of it, along its outward normal.
2. The gaps are then closed (between the toes, the normals point at the next toe, not at the shoe).
3. The result is shrunk by one ring, so the skin goes on under a hem.

On MakeHuman's outfits, this finds 89 to 100 % of what MakeHuman's own hide groups hid. A garment worn under
another is not drawn where all its vertices hang on skin that the outer one hides.

### The file

A `.dsgarment` is a numpy `.npz`:
- **The arrays** have the same names and types as a worn asset of the bank: `refs`, `weights`, `offsets`,
  `scale_pairs`, `scale_ref`, `vertex`, `uv`, `index`, `tangent`, `bones`, `bone_weights`, `delete`.
- **`meta_json`** holds `id`, `zones`, `support`, `layer`, `access`, `hides`, `material`, `gender`, `binding`,
  `name_en`, `name_fr`, `bound_on`, `body_signature`, and optionally `textures` (another garment whose textures it
  shares).
- **`body_signature`** hashes the body's vertices and triangles. The importer compares it with the bank's: a garment
  bound to an older body would tear, so it is refused instead.

### What a character stores

| Form | How garments are stored |
| --- | --- |
| Replicated string (`CharacterAppearance`, version 7) | After the sliders: `G`, then `G` × `[garment position u16, tint u8]`. Positions are in the catalogue's append-only `garments` list. The server makes the list canonical with `GarmentRules`: unknown garments and conflicting ones are dropped. A version 6 look wears its old outfit as the garments listed in `assets.outfit[i].garments`. The tint is not part of `shape_hash`: changing a colour does not rebuild the mesh. |
| Character document (`CharacterDocument`, version 2) | `"garments": [{"id", "tint"}]`. `CharacterMigrations` turns a version 1 `"outfit"` into its garments. |

A random look (NPCs) draws its garments from its own numbers, so adding garments never changes an NPC's face.

### Regenerating

When the bank's body changes, its signature changes too. Then:
1. Regenerate the reference body (`export_reference_body.py`) and put it on Nextcloud.
2. Bind and export every garment again from its source `.blend`.

The MakeHuman garments are regenerated by `refit_outfits.py`, then `convert_bank_outfits.py --strip` (see
`tools/character/vitruvian/README.md`).

### Tests

- `python3 -m unittest discover -s tools/character/garments`: the binding and the rules.
- GUT: `test_garment_rules`, `test_character_appearance`, `test_character_document`, `test_human_bank`
  (every catalogue garment is imported and bound to this body), `test_catalogue_order`.
- The add-on: `blender -b --factory-startup --python tools/blender_scripts/test_garments_addon.py -- <zip>
  <vitruvian_reference.blend> . <scratch folder>`.

### Not yet

- **Tint.** The byte is there, but the shader and the colour picker are not.
- **Rigid items on a bone.** Rings, watches, holsters and backpacks need a `bone` binding.
- **Armour.** Armour (layers 4 and 5) will come as game equipment, drawn over the outfit by the same rules.
