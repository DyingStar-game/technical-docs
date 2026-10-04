---
title: Credits
sidebar_position: 6
---

# Credits

Every sound, model and texture someone made for DyingStar gets its author named in the game, on
the **Credits** entry of the main menu and of the pause menu (right after Settings). You do not edit
that page: it is built from a small credit file you put next to your asset.

This page is for **anyone adding an asset** (what to write) and for **developers** (how the list is
built, in [How it works](#how-it-works)).

---

## The credit file

Next to the asset, a `.txt` with the **same base name**:

```
assets/_universe/audio/music/a_starry_night.ogg
assets/_universe/audio/music/a_starry_night.txt   <- the credit
```

For a texture set, name the `.txt` after the shared prefix: `metal_iron_041A_4K.txt` credits
`metal_iron_041A_4K_Color.jpg`, `metal_iron_041A_4K_Normal.jpg`, and so on.

Inside, **one line per author**, in one of the forms below.

### You made it (community member)

```
Discord - <pseudo> - <numeric Discord id>
```

```
Discord - Pierro - 852633379459039302
```

- The id is the long number, not your user name: in Discord, right-click your profile > **Copy User
  ID** (turn on *Developer Mode* in Discord's advanced settings if the entry is missing).
- Always use the same pseudo for the same id: the check refuses one person under two names.
- Contributions are under the project's asset licence (CC BY-NC-SA 4.0, `assets/LICENSE` in the
  game repository), so nothing is written after the id.

### It comes from a site (third party)

```
<Site> - <author> - <URL> - <licence>
```

```
Freesound - RescopicSound - https://freesound.org/s/750433/ - CC BY-NC 4.0
Pixabay - tanweraman - https://pixabay.com/sound-effects/wave-cape-cloth-in-wind-350430/ - Pixabay Content License
```

Always write the licence, even though the page does not show it: it is the record of what we may
do with the file.

### The author's name was lost

```
Unknown
```

Only for a work that **was given to the project** but whose author's name was lost (some tracks were
recovered that way after an accident). The line stands **alone** in its file. The Credits page shows
*Owner wanted — contact us on Discord* in place of the name, and the track keeps its play button so
its author can recognise it. When they come forward, the line becomes theirs; if they want the work
out, it leaves the project.

An asset whose **source** is unknown (found somewhere, origin unclear) is not credited `Unknown`: it
is removed.

### Several authors

One line each:

```
Discord - [3D] Stup Boulon - 369271943003635713
Discord - ddurieux - 456525763215228948
Discord - The_Moye - 215147560246050816
```

### Shared materials

A material of the shared library is credited by the `author` and `license` of its
`material.json` (see [Materials](./materials.md)); put the source page in `notes`.

## What the page shows

One section per kind of asset, one line per work and author:

| Section | Holds |
|---|---|
| Music | audio under `assets/_universe/audio/music/` |
| Sound effects | every other sound |
| Models and textures | Blender sources, models, textures, shared materials |

A line reads **author — work**, nothing else: the work is the file name without its extension, words
apart (`a_starry_night.ogg` → *A starry night*). Icons and fonts are not listed.

- While the page is open, one credited track drawn at random plays.
- Every track has a **play button** before its name: it plays that track instead, and pressed again
  it stops and the drawn track comes back. *Accept* on a focused line (Enter, Space, the pad's A)
  does the same.
- A work credited `Unknown` reads *Owner wanted — contact us on Discord*, after the named works of
  its section.

## How it works

The `.txt` files never reach a build (the export keeps only resources and `*.json`), so the game
cannot read them. `tools/generate_credits.py` gathers them into **`assets/credits.json`**, which
the export does include, and the Credits page reads that.

```
asset.txt / material.json  ──>  tools/generate_credits.py  ──>  assets/credits.json  ──>  main menu > Credits
```

You never run it by hand on a pull request:

- **`.github/workflows/credits.yml`**, on every pull request towards `develop` that touches an asset,
  checks the credit files, rewrites `assets/credits.json` and pushes it onto the pull request as a
  `chore(credits): regenerate the credits list` commit. From a fork, it cannot push: it fails and
  asks you to run the script yourself.
- **`godot-tests.yml`** checks that the committed list is up to date, as a safety net.

To check or rebuild locally (Python 3, nothing to install):

```bash
python3 tools/generate_credits.py --validate   # check the credit files only
python3 tools/generate_credits.py              # rewrite assets/credits.json
python3 tools/generate_credits.py --check      # fail if it is out of date
python3 tools/generate_credits.py --validate --new-since origin/develop   # as on a pull request
```

The check fails, naming the file and line, when:

- a line is in none of the forms, or a Discord id is not a number;
- an `Unknown` line shares its file with an author's line;
- a `.txt` credits no file (its asset was renamed or removed);
- one Discord id appears under two pseudos;
- a sound has no credit file;
- on a pull request, a model or texture it **adds** is credited by nothing: no `.txt` of its name,
  no `<prefix>.txt` for a `<prefix>_*` set (the textures exported with a model named alike), no
  `material.json` in its folder, no `License.txt` of a library folder. Those already in the project
  are not asked for one yet.
