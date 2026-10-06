---
title: Lights that follow the day
sidebar_position: 5
---

# Lights that follow the day

Street lamps, floodlights and [neon signs](./neon_signs.md) come on at dusk and go off at dawn, one
after the other, the way lamps with a photocell do. Only the lights you choose: the ceiling lamps of a
building stay as they are.

## Making a light follow the day

Under the light (`SpotLight3D`, `OmniLight3D`) or the `NeonSign`: **Add Child Node** → `Photocell`.
That is all. With its `targets` list left empty, a photocell drives its parent.

To drive several lights with one photocell, put it anywhere in the scene and list them in `targets`.
A photocell with nothing to switch shows a yellow warning in the scene tree.

| What it drives | Off | On |
|---|---|---|
| A `Light3D` | hidden. A hidden light gives its place in the shadow atlas back (`LampShadowBudget` skips it) | shown |
| A `NeonSign` | keeps its colour, without glow or light | the tube strikes a few times, then holds |
| Anything with a `set_lit(on, animate)` method | as that method decides | |

Wired today: the floodlight, the lamppost (in the villages and on the menu stage), and the four
signs.

:::note[Not switched]
The glowing parts of a 3D model (a lamp's lit glass, painted in its texture) stay as they are: the
photocell switches lights and signs, not materials.
:::

## When

A photocell measures the **light**, not the time or the star's height, like a real one: under the
corundum veil the star can stand 30° up in a dark sky, and the lamps there must be on.

| Setting | Default | Meaning |
|---|---|---|
| `on_below_light` | 0.011 | At dusk, the lights come on when the daylight falls under this |
| `off_above_light` | 0.031 | At dawn, they go off when it rises above this |
| `max_delay_s` | 120 s | The longest a lamp waits after the threshold (below) |

The daylight (`Planet.daylight_at`) is the share of the star's full overhead light that reaches flat
ground at the photocell's place: the slant the star's light falls at, times the air it crossed (the
same calculation that dims the sunlight on screen). 1 is the star at the zenith with no air, 0 is
night. Weather, when there is some, will multiply in there, and the lamps will follow storms without
any change to the photocell.

The defaults keep what was tuned by eye over the plateau: they are the light of the star at +2° and +4°
over a village at 5130 m, the median altitude of Tarsis 3's villages. Lower down, the air takes more
of the light, and the same thresholds come with the star higher:

| Altitude | On under | Off above |
|---|---|---|
| 5650 m | 2.0° | 4.0° |
| 3684 m (in the top of the veil) | 6.2° | 9.0° |
| 2000 m | 20° | 26.5° |
| -406 m (under the veil) | 31.5° | 41.6° |

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
