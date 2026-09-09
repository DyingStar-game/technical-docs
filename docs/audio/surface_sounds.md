---
title: Surface sounds
sidebar_position: 4
---

# Surface sounds — one sound per material

A footstep on metal grating and a footstep on sand are not the same sound. So instead of one list of
footstep clips, the game asks **what am I standing on?** and picks the samples for that surface. The
same question serves a crate set down on the ground and a tyre scuffing as it is turned, and will
serve impacts later.

For you, adding a surface is **files plus one slot in the Inspector** — there is no code to write and
nothing to ask a programmer for.

## The two halves

The system is deliberately split in two, and neither half knows the other's job:

| Half | Question it answers |
|---|---|
| `SurfaceProbe` | **Which surface is under this point?** — it returns a *family*: `metal`, `sand`, `snow`… |
| `SurfaceSounds` | **What does that family sound like?** — a resource you fill with clips |

That split is why one probe can feed several sounds: footsteps and prop landings ask the same question
and answer it with their own clips.

## The vocabulary: families

A **family** is a material's acoustic category. The list is the project's taxonomy
(`tools/schema/tags.json`), shared with the material library — it is not an audio invention:

```
metal · grate · stone · rock · mineral · concrete · brick · ceramic · glass · plastic
rubber · composite · wood · fabric · leather · foam · paper · organic · flesh
vegetation · liquid · ice · snow · sand · gravel · dirt · mud · ground · energy
```

Use these names exactly. A slot keyed `rocks` instead of `rock` is simply never found.

## How the game knows which surface it is

Two worlds, built differently, so they are asked differently.

### Props, buildings, vehicles — the material says so

Anything with a real material declares its family **in the material id**:

```
mat_<family>_<name>          e.g.  mat_metal_diamondplate2k
                                   mat_sand_dune_fine
```

The game **parses** that id. It does not guess from the file name: `mat_metal_diamondplate2k` is metal
because the id says `metal`, not because the word appears somewhere in the string.

:::warning[This is a 3D artist's job, and most of the library predates it]
Only a handful of materials carry a `mat_` id today. Everything else answers **unknown** and falls back
to the generic sound below — a correct crate-on-something noise, but not a crate on *metal*.

The durable fix is upstream: **name the material `mat_<family>_<name>` in Blender / the material
library**, and every sound that ever asks about that surface gets the right answer for free. Renaming a
material is worth more than any amount of tuning down here.
:::

### The terrain — the biome says so

Terrain has no discrete material; it is a biome shader. So the probe asks the planet which biome covers
that spot and translates it, in two steps: the biome's **kind** first (`sandy_desert` → `sand`,
`glacier` → `ice`), then its **category** if the kind is not listed (`forest` → `vegetation`,
`rocky_landform` → `rock`). Fifteen lines cover all 126 biome definitions.

A biome that deserves better overrides it directly: set **`surface_family`** on its `BiomeDefinition`.
That is the one to reach for when a specific biome sounds wrong — not the shared tables.

### Unknown is a real answer

When nothing answers, the probe says so rather than inventing a family. That is on purpose: a wrong
sound played confidently is worse than a neutral one, and it hides the hole instead of showing it.

## Authoring the sounds

A `SurfaceSounds` resource holds the clips. Three exist today — `scenes/common/footsteps.tres`,
`scenes/common/prop_landing.tres` and `scenes/common/wheel_scrub.tres` — and each object points at
one (`Sfx Footsteps` on the Player, `Sfx Wheel Scrub` on a vehicle).

| Field | What to put in it |
|---|---|
| **By Family** | The real work: one entry per family, each holding **several** samples. One repeated sample is instantly recognisable as one repeated sample. |
| **Default Samples** | Played when the family has nothing of its own. A crate set down on an unmapped surface still deserves to sound like a crate being set down — only the timbre is unknown, not the event. |
| **Missing** | Last resort when even the default is empty. It is meant to be an **error sound**, not a plausible one. |
| **Pitch Jitter** | Random pitch spread (±) applied to every sample, so a repeated step does not sound mechanical. |

The game also never plays the same sample twice in a row when a family has two or more.

:::tip[Leave "Default Samples" empty while you work]
With no default, an unmapped surface plays the **missing** marker and you hear exactly where the holes
are. Fill the default in at the end, once you have covered the families that matter. Silence would hide
the gap; a plausible substitute would hide it even better.
:::

## The wheels: the same probe, and one sound that does not use it

A vehicle makes two tyre noises, and only one of them is a surface question:

| Sound | Resource | Why |
|---|---|---|
| **Tyre scrub** — the tyre shoved sideways as the wheel is turned | `wheel_scrub.tres`, a `SurfaceSounds` | Scuffing gravel and scuffing metal grating are different sounds. The same question as a footstep, asked from a vehicle. |
| **Tyre roll** — the tyres simply going round | one looped clip, no resource | Gated on **speed alone**, and a single loop covers it. Give it its own `SurfaceSounds` the day you record a rolling sample per family. |

The probe is fired **from the vehicle**, not from a wheel. `SurfaceProbe` excludes the node it starts
from, and it can only exclude a physics body — a `VehicleWheel3D` is not one, so a ray fired from a
wheel would not exclude the truck and would report the truck's own chassis as the ground.

:::warning[The wheel set ships with "Default Samples" filled, on purpose]
The tip above tells you to leave the default empty while you work, so the holes stay audible. The
wheel set breaks that rule **deliberately**: Sandbox's terrain reports the family `mineral`, and with
no default the wheels would be silent on the only planet you can currently drive on. Gravel is a
passable stand-in for any dry granular ground — only the timbre is wrong, not the event.

Fill in a real `mineral` entry when you have one, and the default stops being reached.
:::

## Where the files go

Under `assets/_universe/audio/sfx/`, following the existing layout — footsteps in `sfx/characters/`,
named per family and numbered (`step_metal_1.mp3`, `step_metal_2.mp3`…). The same
[file rules](./intro.md#file-rules) apply: `.mp3` or `.ogg`, trimmed tight.

## Adding a new surface, start to finish

1. Check the family name against the list above.
2. Record or source **three or four** samples of it.
3. Drop them in `assets/_universe/audio/sfx/…`.
4. Open the `SurfaceSounds` resource (e.g. `footsteps.tres`), add an entry to **By Family** keyed with
   the family name, and drop the clips in.
5. Walk on it in game.

If it still plays the default, the surface is not *declaring* that family — the material has no `mat_`
id, or the biome maps to something else. That is a content fix, not an audio one.
