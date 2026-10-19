---
title: Prop & tool sounds
sidebar_position: 5
---

# Prop & tool sounds

Everything that isn't a player or a vehicle: the crates you carry, and the tools you hold. Same
principle as everywhere else — the sounds are **`@export` slots** in an **Audio SFX** group in the
Inspector, with the usual **Db / Falloff / Distance / Attenuation** knobs.

## Props (crates, canisters, anything carriable)

Set on the prop's scene (the slots come from `generic_prop.gd`, so **every** prop has them):

| Group | Slot | When it plays |
|---|---|---|
| **Pick up** | `sfx_pick_up` | the prop is picked up |
| **Landing** | `sfx_landing` (a **`SurfaceSounds`** resource) | the prop is set down or dropped |

The landing sound is not a single clip, because a crate on metal grating and a crate in sand are not
the same noise: the game reads the family of the **surface it lands on** and plays that family's
samples. See [Surface sounds](./surface_sounds.md) for the family list and how to fill the resource.

`scenes/common/prop_landing.tres` is the shared one — most props should point at it rather than get
their own, so a crate sounds like a crate wherever it is dropped.

**Metal boxes** — the hauling box (`hauling_box.tscn`), the battery (`battery_t1.tscn`) and the engine
(`engine_t1.tscn`) — have their own pick-up (`metal-box-pick-up.mp3`) and point their landing at
`scenes/common/metal_box_landing.tres`. That resource has **no per-family entry**: its single put-down
sample sits in **Default Samples**, so a metal box sounds the same whatever it lands on
(see [Surface sounds](./surface_sounds.md#authoring-the-sounds)).

:::tip[A crate is heavier than a step]
Props default to a longer **Falloff** (4 m) and a larger **Distance** (30 m) than footsteps. Something
being set down carries further than someone walking past; keep that gap.
:::

## Tools — the perforator

Set on the `MiningTool` node. A tool has more states than a prop, and the sounds say which one you are
in:

| Sub-group | Slot | When it plays |
|---|---|---|
| **Perforate (loop)** | `sfx_perforate` | **held loop** while drilling a rock — starts on the drill, stops on release or completion |
| **Perforate end** | `sfx_perforate_end` | the cut completes |
| **Perforate fail** | `sfx_perforate_fail` | the bit is put **off a fault line**: it bounces, nothing is cut |
| **Equip** | `sfx_equip` | the perforator is taken out |
| **Unequip** | `sfx_unequip` | it is put back on the belt |

The loop only needs a clean, steady sample — looping is forced at runtime, so don't set the *Loop* flag
in the import dock (same rule as the [vehicle engine](./vehicle_audio.md)).

## Machines that hum: `AmbientLoop3D` and `LoopSound`

A sound that loops for as long as its object stands, such as the generator at the base of the
floodlight. Under the object: **Add Child Node** → `AmbientLoop3D` (`scenes/common/ambient_loop_3d.gd`).
Place it where the sound comes from (the generator's box, not the lamp's head) and give it a **`sound`**.

`sound` is a **`LoopSound`** resource (`scenes/common/loop_sound.gd`): the loop's settings as data.
Saved as a `.tres`, **one file is shared by every loop that must sound alike** — tuning the file retunes
them all — instead of the same five fields copied on every node.

| `LoopSound` field | Default | What it does |
|---|---|---|
| `stream` | | The sample to loop. Looping is forced at runtime, no *Loop* flag to set |
| `volume_db` | -6 dB | Loudness at the falloff distance |
| `falloff` | 2 m | Distance at which it has its nominal loudness; it fades beyond |
| `distance` | 25 m | Hard cut-off: not heard at all beyond it |
| `attenuation` | Realistic | How it fades with distance, as for every other sound |

`AmbientLoop3D` itself keeps one setting, **`autoplay`** (on): the loop starts on its own and never
stops (a generator). Off, it is silent until `set_running(true)` — for a machine that only runs now and
then. An empty `sound`, or one with no stream, is silent.

With `autoplay`, it starts on every client as soon as the object is there: the object being there is all
the state it needs, so nothing is replicated. Each copy starts at a random point of the sample, so a
village full of the same machine does not hum in phase. It is silent on the server and in the editor.

:::warning[A loop in Ogg, not MP3]
An MP3 begins with a little silence that its encoder adds (23 ms in the generator's): looped, it
becomes a tick on every turn. Convert the loop to Ogg Vorbis, which ffmpeg does without that
silence:

```
ffmpeg -i generator_loop.mp3 -c:a libvorbis -q:a 6 generator-loop.ogg
```
:::

As every sound, a loop has its credit in a `.txt` of the same name beside it.

## The vehicle lift

The vehicle lift (`scenes/_universe/structures/industrial/vehicle_lift/`) has three loops, each an
`AmbientLoop3D` with `autoplay` off, switched by the lift as it runs:

| Loop | Node | `LoopSound` |
|---|---|---|
| Winch hum, at the top | `Base/Animated Axis/WinchHum` | `sounds/winch.tres` |
| The cart rolling | `Platform System/RollingNoise` (spawned at run time) | `sounds/rolling.tres` |
| **Departure alarm**, at both landings, for as long as the platform travels | `<landing>/Departure Alarm` | `sounds/alarm.tres` (`lift-departure-alarm.ogg`, 80 m reach) |

The same three files are referenced by the **Vehicle Lift** root, group **Sounds** (`sound_winch`,
`sound_rolling`, `sound_alarm`), so the lift's loops are tuned **from the lift's own Inspector** —
including the rolling noise, whose node only exists at run time. Edit the resource's values there;
picking a different resource in those slots changes nothing, as each node keeps its own reference. The
one-shot start / stop clunk stays a plain stream (`sfx_start_stop`).

Both landings run **one script**, `landings/lift_landing.gd` (`class_name LiftLanding`, replacing the
former `upper_landing.gd` / `lower_landing.gd`). What tells them apart is data on each scene's root:

| Export | Role |
|---|---|
| `is_upper` | Which end it stands at: its call button sends the platform up (on) or down (off) — and the server refuses a call naming the other end. |
| `railing_json_path` | The railing layout (JSON) drawn around it in the editor (`VehicleLift.generate_railings`). |
| `landing_interface` | Its kiosk screen, which shows the trip's progress. |

`start_beacons()` / `stop_beacons()` spin the two beacons **and** run the departure alarm. Like the
other loops, nothing is replicated for the sound: each client hears the lift change state.

## Who hears what

This is the one thing worth knowing before you set levels, because it decides whether a sound is
**shared** or **private**:

| Reach | Sounds | Why |
|---|---|---|
| **Everyone nearby** | the drill loop, equip, unequip, pick up, landing, a machine's hum, the lift's loops | the state behind them (perforating, which tool is out, the prop's position) is **replicated**, so every client can play them on its own |
| **You only** | perforate **fail** | it is feedback about *your* aim, not an event in the world — a bystander has no reason to hear you miss |

Nothing about this costs network traffic: no audio is ever sent. Each client plays the sound from state
it already has.

:::note[Levels are honest now]
Positional sounds used to be capped a few decibels above nominal, which silently clipped anything
emitted **on** the listener — turning a sound down made it quieter for everyone *except* the person
holding it. That cap is lifted and every sound now routes to the **SFX bus**, so the SFX slider in the
settings actually applies to it. If you are re-checking old levels, this is why they may have moved.
:::
