---
title: Lights that follow the day
sidebar_position: 5
---

# Lights that follow the day

Street lamps, floodlights, [neon signs](./neon_signs.md) and the ceiling lights of some buildings come
on at dusk and go off at dawn, one after the other, the way lamps with a photocell do. Only the lights
you choose: a light with no photocell stays as the scene has it.

## Making a light follow the day

Under the light (`SpotLight3D`, `OmniLight3D`) or the `NeonSign`: **Add Child Node** → `Photocell`.
That is all. With its `targets` list left empty, a photocell drives its parent.

To drive several lights with one photocell, put it anywhere in the scene and list them in `targets`.
A photocell with nothing to switch shows a yellow warning in the scene tree.

| What it drives | Off | On |
|---|---|---|
| A `Light3D` | hidden. A hidden light gives its place in the shadow atlas back (`LampShadowBudget` skips it) | shown |
| A `NeonSign` | keeps its colour, without glow or light | the tube strikes a few times, then holds |
| A `LightGroup` | every lamp under it, sub-groups included | |
| Anything with a `set_lit(on, animate)` method | as that method decides | |

### A whole building: one photocell for its ceiling lights

Put the building's lights under one `Node3D` carrying `scenes/_universe/props/lighting/light_group.gd`
(`LightGroup`), and the `Photocell` under that node. The group switches everything below it: bare
lights, signs, and the ceiling LED panels. One photocell per building, never one per lamp.

The LED panels (`led_panel_1x1m.tscn`, `led_panel_1x0.3m.tscn`) carry `LedPanel`: switched off, the
panel puts out its light **and** its glowing face, which otherwise burned white in a dark room.

Wired today: the floodlight, the lamppost (in the villages and on the menu stage), the four signs, and
the ceiling lights of the garage, of the cargo depot and of the spawn habitation.

:::note[Not switched]
The glowing parts of a 3D model (a lamp's lit glass, painted in its texture) stay as they are: the
photocell switches lights and signs, not materials.
:::

## When

A photocell measures the **light**, not the time or the star's height, like a real one: under the
corundum veil the star can stand 30° up in a dark sky, and the lamps there must be on.

Every photocell reads **one shared resource**, `scenes/common/photocell_tuning.tres`
(`PhotocellTuning`). Open it in the Inspector and every lamp follows: there is nothing to change lamp
by lamp. A lamp that needs its own values takes its own copy: select its `Photocell`, then **Make
Unique** on its `tuning`.

| Setting | Default | Meaning |
|---|---|---|
| `on_below_lux` | 1900 lux | At dusk, the lights come on when the light on the ground falls under this |
| `off_above_lux` | 3100 lux | At dawn, they go off when it rises above this. Keep it above `on_below_lux` |
| `max_delay_s` | 120 s | The longest a lamp waits after the threshold (below) |

The thresholds are in **lux**, the unit the dev panel shows: the `light:` line of its UNIVERS section
gives the light where you stand and the two thresholds. To tune them, wait for the moment the lamps
should come on and read the value there.

The light measured (`Planet.daylight_at`) is the share of the star's full overhead light that reaches
flat ground at the photocell's place, shown in lux as that share × 100 000 (a clear noon): the slant the star's light falls at, times the air it crossed (the
same calculation that dims the sunlight on screen). 1 is the star at the zenith with no air, 0 is
night. Weather, when there is some, will multiply in there, and the lamps will follow storms without
any change to the photocell.

The defaults (1900 and 3100 lux, daylight shares of 0.019 and 0.031) were tuned in game over the plateau: they are the light of the star at +2.9° and +4°
over a village at 5130 m, the median altitude of Tarsis 3's villages (1100 lux, the star at +2°, came on too late). Lower down, the air takes more
of the light, and the same thresholds come with the star higher:

| Altitude | On under | Off above |
|---|---|---|
| 5650 m | 2.8° | 3.9° |
| 3684 m (in the top of the veil) | 7.5° | 9.0° |
| 2000 m | 23° | 26.4° |
| -406 m (under the veil) | 36° | 41.5° |

Under the veil, the star overhead still lets 13 % through: the lamps are off at noon there.

:::note[Simplifications]
- Only the **direct** light of the star counts. The light the haze scatters down from the rest of the
  sky is computed by the sky shader alone; the thresholds are tuned on this very value.
- The planet is taken as a sphere: a mountain hiding the star does not count.
:::

The gap between the two thresholds keeps a lamp sitting at the threshold from blinking. For
reference, a real photocell switches on near 30 lux, some 0.0003 of a clear noon: Tarsis 3's haze
reads dark long before that.

## One after the other, the same for everyone

Each lamp waits its own delay, between 0 and `max_delay_s`, so a village lights up one lamp at a
time over a couple of minutes. The delay is drawn from the uuid of the prop the lamp belongs to: every client draws the same one.
Every client also reads the daylight on the same 2-second ticks of the shared game clock. So every player
sees the same lamp come on at the same moment, **with no message on the network**: it is worked out
on each client, the way the orbits are, and the server takes no part.

Two cases switch at once, without the delay:

- **The first reading.** Arriving at night, the lamps are already on (and the signs do not flicker).
- **A jump of the clock** of more than 30 s between two readings: the hour slider of the graphics
  settings over the menu stage (whose clock is frozen), the dev clock `+` / `−`. Night fell all at
  once.

And nothing ever switches **more than 50 km above the surface** (a station in orbit): there is no
dusk there, and the lights stay as the scene has them.

## Testing it

- **In game**: hold `+` to bring the dev clock to dusk. That is a jump, so everything switches at
  once. To watch the lamps come on one after the other, stop a little before sunset (the star a few
  degrees up) and let time run: it takes a couple of minutes.
- **On the menu stage**: Settings › Graphics, move the hour slider to night.

`test/unit/test_photocell.gd` covers the thresholds, the delay, the jumps, the neon signs, the
daylight over the plateau and under the veil (with Tarsis 3's air), and that each wired scene has its
photocell under the right light. A newly wired scene goes in its `WIRED` list.
