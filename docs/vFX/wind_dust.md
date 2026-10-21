---
title: Wind-blown dust
sidebar_position: 6
---

# Wind-blown dust

The wind lifts dust off the ground: it streams past you in gusts, veils the far relief and the
horizon, and glows in the beams of the lamps at night. It is drawn on the client only, from the
weather the planet gives (`Planet.weather_at`, `wind_world_at`), and costs nothing on the network.

Settings › Graphics › Effects › **Wind-blown dust** decides how much is drawn: **Off** stops all of it
(nothing is read, laid or drawn), **Low** marches fewer steps and draws no lamp beams, **High** draws
everything.

## How much dust

`DustLift` (`scenes/common/dust_lift.gd`) turns the wind into the share of the ground lifted, 0 to 1:

- **A film of settled dust**, on every ground, rock included: the first breeze lifts some of it, more as
  the wind grows, up to 8 % of a full blow.
- **The sand**, over its threshold (the weather's `lift_threshold_m_s`, 21 km/h on Tarsis 3): Owen's
  saltation flux, averaged over the gusts. A real wind is never steady, so the sand starts to stream
  in the gusts from about two thirds of the threshold and thickens as the mean wind climbs to it,
  instead of switching on at once. Full at twice the threshold.

| Mean wind | Lifted |
|---|---|
| 3 km/h | 1 % |
| 10 km/h | 3 % |
| 21 km/h (the threshold) | 10 % |
| 30 km/h | 40 % |
| 42 km/h | 100 % |

## The two layers

`WeatherSky` (`scenes/player/weather_sky.gd`) hands the shader (`dust_layer.gdshaderinc`, drawn by the
aerial pass) two layers of the same dust:

| Layer | Reach | Thickness | Its ground |
|---|---|---|---|
| **Near** | 1 km | densest at the ground, divided by e every 25 m | a 128 × 128 grid of 16 m cells |
| **Far** | 6 km | 60 m | a 128 × 128 grid of 192 m cells |

Each layer lies on the **real ground**, read from its grid (`DustGround`, `scenes/player/dust_ground.gd`):
a hill rises out of the dust, a valley fills with it.

### The dust has the colour of the ground it came from

Each grid also keeps the colour of the dust over its area, one point every 4 cells. The shader takes
the colour of the place each sample stands over: the haze over a far pink range is pink while the
plain underfoot is yellow, and crossing from one biome to the next blends the two. The colour is the
ground's own, from [`GroundLook`](./ground_fringe.md#its-colour-is-the-grounds-by-the-terrains-own-rule),
the rule the fringe and the wheels' dust use too.

### Inside buildings

A building's box (`WeatherMasks`, from its static bodies' collision through `Globals.collision_aabb`)
keeps the dust out of its rooms. A box wider than 200 m on any side is not a building and is never
masked: the menu's set under one node, or the terrain's own collision, once emptied the whole screen.

## What it costs

The ground queries are the dearest part: they read the streamed terrain tiles, on the main thread.
The grids are built within a time budget each frame (1.5 ms near, 1 ms far), and they **slide** as
you move: the next grid is the same plane shifted by whole colour cells, so only the new strips are
asked (128 m on, 1 024 cells instead of 16 384). Rebuilt whole, both grids built all the time in a
fast flight. The colour point reuses the height its cell has just asked for.

To measure, put `debug_dust_probe=true` in the `[debug]` section of your `client.ini`. Every 2 s the
client log gets a `[DustCost]` line:

```
[DustCost] 120 frames | cpu dust 0.42 ms/frame (weather 0.01, worst frame 1.80) | near grid 0.30 ms/frame (colour 0.02) building, last build 1024 cells | far grid 0.00 ms/frame (colour 0.00), last build 16384 cells | gpu frame 6.10 ms | layer: near 0.00130 /m x 20 steps, far 0.00078 /m x 10 steps, 1 lamps, setting 2
```

The GPU time of the dust alone is the difference of `gpu frame` with the setting on Off.
