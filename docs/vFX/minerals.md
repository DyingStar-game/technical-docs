---
title: Adding a mineral
sidebar_position: 2
---

# Adding a mineral

A **mineral** is the ore shown *inside* a mining rock — **gold** today, maybe silver, iron or
crystal tomorrow. Each mineral is **data**: a small `MineralDef` resource describing how the ore
*looks*. Adding one is "drop a texture + a `.tres`", with **no shader or code change**.

:::tip[The key split — look vs field]
The ore **FIELD** (how much ore, where it sits in the rock's volume, how it disperses and how it
**stays continuous across fractures**) lives on the **rock** (`rock_mining.gd`). A `MineralDef`
only describes the ore **LOOK** (texture, colour, metalness…). Because the noise field is
untouched, swapping minerals **never** changes the fracture or purity behaviour — and volume,
cut-face reveal and cross-break persistence come for free.
:::

## The pieces

| Piece | Role |
|---|---|
| `MineralDef` (`scenes/props/rock/mineral_def.gd`) | A `Resource`: the visual identity of one mineral (albedo/normal textures, colour tint, metallic, roughness, emission, scale). **One `.tres` per mineral.** |
| `rock_vein.gdshader` (`scenes/props/rock/`) | The rock shader. Renders the ore as a **3D noise field** (local space) and can colour it with a flat colour **or** a **triplanar texture** (driven by the `MineralDef`). |
| `rock_mining.gd` (`scenes/props/rock/`) | The rock. Exposes an `@export var mineral: MineralDef` and pushes its look onto the shader (`_apply_mineral`). Owns the ore field + purity. |
| The `.tres` files (`assets/materials/minerals/<name>/`) | The actual minerals (e.g. `gold/gold.tres`). The textures live in `assets/textures/minerals/<name>/`. |

## Add a new mineral

### 1. Drop the textures

Put the maps in `assets/textures/minerals/<name>/`:

- **`<name>_albedo.png`** — required (the ore colour/pattern).
- **`<name>_normal.png`** — optional (surface relief). Import it as a **Normal Map** (select it
  in the FileSystem dock → *Import* tab → *Normal Map: Enabled* → *Reimport*).

### 2. Create the `MineralDef`

In the FileSystem dock, in `assets/materials/minerals/<name>/`:

- Right-click → **New Resource…** → search **`MineralDef`** → create → name it `<name>.tres`.
- *(Fastest start: duplicate `gold/gold.tres` for a textured metal, or `cryptonite/cryptonite.tres`
  for a flat-colour, self-glowing ore — and swap the values.)*

Fill it in the Inspector:

| Field | Meaning |
|---|---|
| `id` | Identifier, e.g. `&"silver"` (handy for attribution later). |
| `use_texture` | `true` to draw the ore with `albedo_tex`; `false` to use a flat `color`. |
| `albedo_tex` | The ore albedo texture (when `use_texture`). |
| `color` | Tints the texture, **or** *is* the ore colour when `use_texture` is `false`. |
| `normal_tex` | Optional normal map for ore relief. |
| `normal_strength` | Relief strength (`0` = flat). |
| `tex_scale` | Triplanar tiling of the ore textures (local space). |
| `metallic` | `1.0` for metals (gold, silver…), `0.0` for non-metals (crystal). |
| `roughness` | Lower = shinier. Gold uses `0.14`. |
| `emission` | `0` = realistic; `> 0` = the ore glows (the old cryptonite preset used ~`9`). |

### 3. Assign it to rocks

- **Per rock:** select the rock (`rock_mining_01.tscn` root, or an instance) → Inspector →
  **Mineral** → drag your `.tres`.
- **Default for all rocks (current state):** `rock_mining.gd` defaults `mineral` to `gold.tres`,
  so every mined rock is gold for now.

That's it — spawn/mine a rock and the ore shows your mineral, with the same volume, cut-face
reveal and cross-fracture continuity as before.

## Solid meshes (for 3D artists)

A `MineralDef` drives **only the ore shown inside a mining rock**. It is **not** a `Material` and
**cannot** be dropped onto a `MeshInstance3D`. If a 3D artist needs the mineral *directly on a
mesh* — a gold ingot, a vein on a wall, a decorative chunk — the dev must **also** author a
separate **`StandardMaterial3D`** from the same textures and hand it over.

Example: `assets/materials/minerals/gold/gold_material.tres`.

1. Right-click the mineral's folder → **New Resource… → `StandardMaterial3D`** → name it
   `<name>_material.tres`.
2. **Albedo → Texture** = `<name>_albedo.png`.
3. **Normal Map → Enabled** + `<name>_normal.png` *(first set the texture's **Import → Normal
   Map: Enabled → Reimport**, or Godot reads the purple as colour)*.
4. **Metallic** / **Roughness** to taste (gold: `1.0` / `0.14`).
5. The artist drags it onto the mesh's **Material Override**.

So one texture set feeds **two** outputs — keep both in the mineral's folder:

| File | Type | Used for |
|---|---|---|
| `<name>.tres` | `MineralDef` | The ore **inside mining rocks** (consumed by `rock_mining`/the bench). |
| `<name>_material.tres` | `StandardMaterial3D` | A **solid object** in the mineral (ingot, prop…), dropped on a mesh by artists. |
| `<name>_albedo/normal.png` | Textures | The raw maps, shared by both. |

## Notes & gotchas

:::note[A rock's mass is a rock property, not a mineral one]
The `MineralDef` is **look only**. A mining rock's **mass** (its weight as truck cargo) is a
rock-physics property: it comes from the `RigidBody` mass set on the rock scene (the GameDesigner
value), scaled by each cut piece's **volume** — a half weighs ~half, a quarter ~a quarter. See
[Cargo — loading the bed](../networkGame/vehicles.md). Swapping the mineral never changes it.
:::

:::caution[A metal shows its reflection, not its texture]
With `metallic = 1` the surface displays the **reflected environment**, not the albedo: under a
**blue sky** it reads blue-grey, in the **dark** it reads black — it only looks gold with a
neutral/warm environment to reflect (that's why a material-preview cube looks rich gold). To get
a reliable colour anywhere, either **lower `metallic`** (~`0.7`, so the golden albedo shows via
diffuse light), add **reflection probes** where it's used, or — for the in-rock ore only — a
**small `emission`** (`0.2`–`0.5`) so it's findable in the dark without flattening it.
:::

:::note[Reload after creating the class/resource]
If you create `mineral_def.gd` or a new `.tres` **outside** the editor, reload the project once
(*Project → Reload Current Project*) so Godot registers the `MineralDef` class and loads the
resource.
:::

- **Persistence/volume are automatic.** They come from the shader's local-space noise field +
  the rock's inherited `ore_seed` (`noise_offset`) — you don't touch them when adding a mineral.
- **Purity is unaffected.** `rock_mining.gd` measures ore from the *field*, not the look, so it
  stays valid for any mineral.
- **Tune live** in the `.tres` Inspector (roughness, `tex_scale`, `normal_strength`, tint…).

## Future work

Right now every rock uses the default mineral (gold). **Per-rock attribution** (which rock holds
which mineral) and its **multiplayer replication** (a server-decided, persistent property, like
`ore_seed`) are not wired yet — they are the next step when mineral variety goes live.
