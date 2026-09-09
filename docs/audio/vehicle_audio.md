---
title: Vehicle sounds
sidebar_position: 3
---

# Vehicle sounds (the truck)

:::tip[Read the intro first]
**[Audio in DyingStar](./intro.md)** explains positional sound, the five knobs on every slot, and the
file rules (mp3/ogg, trim the silence). This page is just *where the truck's sounds are* and what each
one is.
:::

A vehicle's sounds are set on the **`Vehicle`** node (the truck's root), in the **Audio SFX** group of
the Inspector. Every slot is optional (empty = silent). Sounds play on the **clients**, driven by the
truck's **replicated** state — so a horn, a door or an engine you hear is the *same event* every nearby
player hears.

![The Truck node in the Godot Inspector: the Audio SFX group listing Door open/close, Engine start/stop, Lights on/off, Handbrake on/off, Engine running, Horn and Horn (special)](./static_files/audio_truck_slots.png)

## The slots

| Slot | Kind | When it plays | Default attenuation |
|---|---|---|---|
| **Door open** / **Door close** | one-shot | a door opens / closes | `VERY_SHORT` |
| **Engine start** / **Engine stop** | one-shot | the engine is turned on / off | `REALISTIC` |
| **Engine running** | **loop** | held while the engine runs (idle → redline) | `REALISTIC` |
| **Lights on** / **Lights off** | one-shot | headlights toggled | `VERY_SHORT` |
| **Handbrake on** / **Handbrake off** | one-shot | handbrake set / released | `VERY_SHORT` |
| **Horn** | **held loop** | held while the horn button is pressed | `FAR_REACHING` |
| **Horn (special)** | one-shot | the special horn | `FAR_REACHING` |
| **Tyre scrub** | **held loop** | held while the wheel is *turned*, below the crossover speed | `VERY_SHORT` |
| **Tyre roll** | **held loop** | held while the vehicle *moves*, turning or not | `VERY_SHORT` |

Each has the usual **Db / Falloff / Distance / Attenuation** knobs. Horns default to **`FAR_REACHING`**
so they carry across the map; the engine uses **`REALISTIC`**; the small clicks use **`VERY_SHORT`**.

## The engine loop — one idle sample covers everything

You only record **one steady idle loop** for **Engine running**. The game holds it while the engine is
on and, as the RPM rises, **raises its pitch and volume** — so a single sample plays idle through full
throttle. It's held back until the **Engine start** (cranking) clip finishes, then fades in. Three knobs
shape it:

- **Engine Rev Pitch** — the maximum pitch multiplier at the redline (e.g. `2.0` = twice as high).
- **Engine Rev Db** — extra volume (dB) added at the redline.
- **Engine Rev Response** — how quickly the note chases the RPM (the engine's "inertia").

The **Horn** is a held loop too, with **Horn Min Secs** (a minimum honk length even on a quick tap) and
**Horn Fade Secs** (a short release fade so it doesn't click when you let go).

:::tip[Deliver a clean loop — the Loop flag is set in code]
For **Engine running** and **Horn**, don't worry about the *Loop* import flag in Godot — the game forces
looping on at runtime. Just make sure the clip loops seamlessly (no gap or click at the seams). See the
[intro's looping note](./intro.md#file-rules).
:::

## The tyres — two sounds, two unrelated questions

They are easy to confuse and they are gated on different things:

| | Gated on | Behaviour |
|---|---|---|
| **Scrub** | the steering **rate** | Holding full lock is silent; *turning* is what scuffs. It stands down once the roll reaches full level. |
| **Roll** | the **speed** alone | Its level rises from a standstill to full at `Sfx Wheel Roll Kmh`, then holds. Turning has nothing to do with it. |

Both are **held loops**, never a stream of one-shots: a sample longer than the gap between two shots
piles onto the tail of the one before, and a single turn ends up sounding like a crowd.

The scrub draws from a [`SurfaceSounds`](./surface_sounds.md) set, so it changes with what the tyre is
standing on. The roll is a single clip — see that page for why only one of the two asks the surface.

| Setting | What it does |
|---|---|
| `Sfx Wheel Scrub Min Rate` | How fast the steering must turn (rad/s) before a tyre is heard. Too low and it hisses at every trim of the line. |
| `Sfx Wheel Roll Kmh` | The speed at which the roll reaches **full volume**. It is a ramp, not a switch: below it the sound rises with the speed. |
| `Sfx Wheel Roll Attack Secs` | A slew limiter on that ramp, not a fade-in. It only bites when the speed *jumps* — a vehicle spawning mid-drive, or landing. |
| `Sfx Wheel Scrub Fade Secs` | How fast both die once their condition stops. Deliberately short: a tyre sound that outlives the movement is heard as a sound that forgot to stop. |

## What's replicated

The truck replicates the **state** that drives its sounds (engine on/off, handbrake, headlights, the
doors map, the held-horn bool, and a special-horn **counter**), and each client plays the matching sound
from it. The engine loop's pitch/volume are derived locally from the replicated **speed**, so no audio
stream is ever sent over the network. (For the networking side, see the developer page
[Adding a vehicle](../networkGame/vehicles.md).)
