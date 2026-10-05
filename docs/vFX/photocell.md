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

| Setting | Default | Meaning |
|---|---|---|
| `on_below_deg` | +2° | At dusk, the lights come on when the star sinks under this height above the horizon |
| `off_above_deg` | +4° | At dawn, they go off when it rises above this one |
| `max_delay_s` | 120 s | The longest a lamp waits after the threshold (below) |

The height is the star's at the photocell's own place, the planet taken as a sphere: a mountain hiding
the star does not count. The lamps come on **before** the star has set, because under Tarsis 3's haze
the light is already failing (tuned in game). Under a clear Earth sky, real photocells switch on
nearer -3°, at some 30 lux. The gap between the two thresholds keeps a lamp sitting at the threshold
from blinking.

## One after the other, the same for everyone

Each lamp waits its own delay, between 0 and `max_delay_s`, so a village lights up one lamp at a
time over a couple of minutes. The delay is drawn from the uuid of the prop the lamp belongs to: every client draws the same one.
Every client also reads the star on the same 2-second ticks of the shared game clock. So every player
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

`test/unit/test_photocell.gd` covers the thresholds, the delay, the jumps, the neon signs, and that
each wired scene has its photocell under the right light. A newly wired scene goes in its `WIRED` list.
