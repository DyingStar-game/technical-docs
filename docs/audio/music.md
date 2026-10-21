---
title: Music
sidebar_position: 6
---

# Music — which playlist plays where

This page is for anyone adding a track, changing what plays in a place, or giving a building its
own music. None of it needs code: everything is done in the Godot Inspector.

It covers music only. Sound effects are positional and work differently: see
[Audio in DyingStar](./intro.md).

## How it works

Twice a second the game works out **where the player is**, looks up **the table** to find the
playlist that goes with that, and crossfades to it if the answer has changed.

Three kinds of file are involved:

| File | What it is | Where |
|---|---|---|
| A track | An `.ogg` or `.mp3` file | `assets/_universe/audio/music/` |
| A playlist | A list of tracks and how they follow one another | `assets/_universe/audio/music/playlists/*.tres` |
| The table | The list of rules "in this situation, play this playlist" | `scenes/audio/music/music_table.tres` |

The table is the single place where the pairing is decided. Open it to see every pairing of the
game at once.

## Situations

A rule applies to one situation:

| Situation | The player is… |
|---|---|
| `MENU` | not in the world yet: main menu, loading screen |
| `ZONE` | inside a music zone placed in a scene (a building, a room, a city) |
| `EVA` | weightless, away from any ground |
| `STATION` | aboard an orbital station |
| `POI` | on the ground, inside the influence radius of a point of interest |
| `WILD` | on the ground, outside every point of interest |
| `ANYWHERE` | anywhere in the world — a catch-all |

Several can be true at once (in a zone, inside a POI). **Rules are tried from top to bottom and
the first one that fits wins**, so the order of the list is the priority: specific rules go
above general ones.

"On the ground" means within 1,000 m above the highest terrain of a planet or moon. Down there
the ground always decides, even during the developer flight: flying over a town plays the town's
music.

### Narrowing a rule with `Only`

Leave `Only` empty to cover every case of the situation, or fill it in to cover one. Case is
ignored.

| Situation | What `Only` matches | Example |
|---|---|---|
| `ZONE` | the zone's tag | `capital` |
| `STATION` | the station's id | `tarsis_3/palaka_pital` |
| `POI` | the POI's type, **or** the start of its name | `city`, `mining_village_`, `Palaka-Pital` |

Many POIs have no type in the export, which is why the start of the name is accepted too.

### Silence

- A rule with **no playlist** is a deliberate silence: it wins, and nothing plays.
- If **no rule fits**, nothing plays either.

## Common tasks

### Add a track

1. Convert it to `.ogg` or `.mp3`, around 160 kbit/s. A track of 2–3 minutes should weigh
   3–4 MB at most; do not commit `.wav` music.
2. Drop it in `assets/_universe/audio/music/`. Use lowercase names without spaces, accents or
   brackets.
3. In its import settings, leave **Loop off**. A looping track never ends, so the next one never
   starts.
4. Add its credit file (see [Credit file](./intro.md#credit-file)).
5. Open a playlist and add the track to its `Tracks`.

### Create or tune a playlist

Create a new resource of type `MusicPlaylist` in `assets/_universe/audio/music/playlists/`, or
open an existing one.

| Setting | Effect |
|---|---|
| `Tracks` | The tracks of the playlist |
| `Shuffle` | On: random order, never the same track twice in a row. Off: the order of the list |
| `Gap Min S` / `Gap Max S` | Silence between two tracks, drawn between the two. Both at 0: continuous music |
| `Volume Db` | Level of the whole playlist, on top of the player's Music slider |

Two places that use the **same playlist file** share the music: going from one to the other
restarts nothing. This is why the station and the EVA use the same `space.tres`.

### Change what plays somewhere

Open `scenes/audio/music/music_table.tres`, find the rule (or add one), and set its playlist.
Then check its position in the list: it must sit above any more general rule that would also fit.

Two settings at the bottom of the table apply to the whole game:

| Setting | Effect |
|---|---|
| `Crossfade S` | Seconds over which the old music fades out while the new one fades in |
| `Settle S` | Seconds a new situation must hold before the music follows. It stops the music from restarting when the player paces along the edge of a zone |

### Give a building its own music

1. In the building's scene, add an `Area3D` and attach the script
   `scenes/audio/music/music_zone.gd`.
2. Give it a `CollisionShape3D` that covers the place.
3. Then either:
   - **the usual way** — write a `Tag` (for example `bar`) and add a `ZONE` rule with
     `Only = bar` to the table. The pairing stays visible in the table;
   - **the exception** — drop a playlist directly in the zone's `Playlist`. It then plays there
     whatever the table says.

Where two zones overlap (a room inside a building), the one with the higher `Priority` wins.
`Priority` is the standard property of the `Area3D`.

The zone sets its own collision layers when the game starts; there is nothing to configure.

## Checking it in game

In **Settings > Debug**, turn on **Music debug**. A `Music` section appears in the debug panel:

```
track: tin_can.ogg  1:15 / 2:34
playlist: space.tres
case: rule 2: EVA
where: weightless · station tarsis_3/palaka_pital
next: capital.tres
```

| Line | Meaning |
|---|---|
| `track` | The file playing and how far into it. `(silence, next track in 42 s)` between two tracks |
| `playlist` | The playlist it comes from |
| `case` | The rule that won, numbered as the Inspector lists them (from 0). `the zone's own playlist` when a zone imposes its playlist, `no rule fits` when nothing matches |
| `where` | Everything the game knows about the player's situation. A rule can only match what is listed here |
| `next` | The playlist about to take over, while the new situation has not yet held for `Settle S` |

When a rule does not trigger, read `where` first: if the situation you expect is not listed, the
rule cannot match.

The panel only exists once the player is in the world, so it does not show the menu music.
Each change of playlist is also printed in the log as `[Music] now playing: …`.

If you hear nothing at all, check the **Music** slider in Settings > Audio.

## For programmers

| Class | Role |
|---|---|
| `MusicDirector` (autoload) | Reads the situation, asks the table, plays and crossfades. The only thing that plays music |
| `MusicContext` | The situation as plain values, so rules are tested without a world |
| `MusicTable`, `MusicRule` | The table and one of its lines |
| `MusicPlaylist` | The tracks and their order |
| `MusicZone` | The passive `Area3D` placed in scenes |
| `MusicPoi` | Finds the POI whose influence radius holds a ground position |

- `GameOrchestrator` calls `MusicDirector.start()` on a client only; the dedicated server plays
  nothing. `PlayerClient` calls `MusicDirector.follow(player)` once the player is in the world.
- The situation is polled, not signalled: nothing it reads announces its changes.
- POIs are read from `assets/qgis/export/<body>_poi.json`, the same export the star map uses.
  Where influence radii nest, the smallest one holding the player wins.
- `MusicZone` never monitors anything. It is seen by the player's `AreaDetector`, like every
  other zone of the game.
- Tests: `test/unit/test_music_table.gd`.
