---
title: Lighting, day/night & the sky
sidebar_position: 3
---

# Lighting, day/night & the sky

How a planet is lit, why the day/night cycle and the sky look the way they do, and how the
game keeps it working at astronomic scale (a planet sits ~30 billion units from the star). No
graphics background needed.

## The world is lit by the *real* star

There is **no fake rotating light** anymore. Everything is lit by the actual star of the system
(`scenes/star/star.tscn`).

- Each client gets its **own "sun"** — a `DirectionalLight3D` (`PlayerSunLight`) aimed **from the
  star toward the player**. It provides the crisp cast shadows (a mountain or a wall shades you
  automatically) and drives the day/night look.
- The **star's own glow** comes from the star mesh's shader — it lights itself.
- **Distant planets and moons** are lit differently (see below), because a normal light can't
  reach across billions of units.

## Day & night

You stand on a sphere, so your **"up" points away from the planet's centre**. Your day/night
simply follows the **star's height above your local horizon**:

- Star **above** your horizon → **day**. **Below** → **night**.
- The light is **warm at sunrise/sunset** and white at noon (sampled from the star's real
  elevation). Because the star is a **disc**, some light lingers just after its centre dips below
  the horizon — the fade spans the disc's width.
- Night is **genuinely dark**: the sky, the ambient light and the reflections all fade with the
  sun, not just the sun itself.

Now that **planets rotate** (see below), day/night is **temporal**: stay put and the sun crosses
your sky on its own — you don't have to walk around the planet.

## The sky

The sky is a custom **local-frame** shader (`local_sky.gdshader`). Godot's built-in physical sky
measures everything against world axes, which is meaningless on a planet at ~3e10 (your local
"up" is not the world's up), so it just went black. The local sky instead:

- **follows the star** across your sky (blue dome, warm horizon, sun halo);
- is **one continuous gradient** — no hard grey band at the horizon;
- **fades to black space as you climb** (the air thins with altitude, so high up the sky darkens
  and the star becomes a sharp point);
- shows in **every camera**, including the **vehicle mirrors and the reverse-view camera**, not
  just the main view.

:::note[Temporary]
This sky is a placeholder — a full atmosphere model will replace it later. It still feeds the
scene's ambient light and reflections, so night really goes dark.
:::

## Distant planets & moons

A far body is lit **per-fragment in the terrain shader**, from the **real star direction**
(computed in double precision and passed to the shader). So the side facing the star is lit and
the far side is dark — a clean day/night terminator — even seen from thousands of km away. This
fixes the old "black planets in the sky" problem, where a normal light simply couldn't reach.

Distant bodies also keep their **real terrain** (their coarse LOD-3 chunks) at every distance —
there is no low-detail placeholder sphere anymore.

## Planet rotation

Every body **spins on its axis** at its real sidereal period plus its axial tilt (the same
`rotation_h` / `tilt` values the celestial service publishes). The spin angle is a **pure
function of absolute time**, evaluated the same way on the server and on every client, so the
rotation **never travels over the network** — both sides land on the same orientation as long as
their clocks agree.

## Where am I on the planet?

The debug panels show, for the body you're standing on:

- your **altitude** above the terrain (and whether you're in the atmosphere or in space);
- the **local time** of that body;
- your **longitude / latitude** in compass form (e.g. `24.85° N  39.56° O`), matching the real
  terrain geography — it stays constant for a fixed spot on the ground as the planet spins.

Toggle the debug panels with the **debug-panels key** (see
[Controls & shortcuts](/docs/uiux/controls_shortcuts)).

## Scale — real distances (in progress)

The star system is being moved to a **true 1:1 scale** — real distances *and* real body sizes —
instead of the earlier ×⅓ shrink. Consequence: at 1:1 the orbits run at their **real period**
(a 42-day orbit really takes 42 days), so celestial motion is imperceptible in real time — a
time-scale control is the way to actually watch it.

## Seeing it in-game (for developers)

- **Toggle the debug panels** (altitude / local time / lon-lat / celestial markers) with the
  debug key.
- Use the **EVA free-flight** dev tool to fly away from the surface and look at the lit
  planets/moons and the day/night terminator across a whole body.

Both keys are InputMap actions, so their current bindings are in **Settings → Controls**.
