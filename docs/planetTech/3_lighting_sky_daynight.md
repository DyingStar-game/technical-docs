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

## The sky — a real atmosphere

The sky is not a painted gradient: it is a **scattering model** evaluated per pixel, from the ground to
orbit, and it is what makes the air look like air. Sunlight bounces off the gas (**Rayleigh** — why a
thin sky is blue and a low star is red) and off suspended dust (**Mie** — the haze, the glow around the
star), and both are integrated along the view ray.

It replaced an earlier hand-tuned local sky. The reason to switch was not prettiness but consistency:
one model covers standing in a valley, standing on a 5 600 m plateau, and looking down from orbit,
without three sets of settings that disagree at the seams.

### One profile per body

Everything the model needs sits in an **`AtmosphereProfile`** resource per body
(`scenes/planet/atmospheres/`): planet radius, atmosphere top, gravity, the Rayleigh and Mie
coefficients, the haze slab, the absorption layer, and the star's irradiance and angular size.

Those files are **generated, not authored**. The composition published by the celestial service is the
source of truth for what the air is made of, and `addons/dyingstar/build_atmosphere_profiles.gd` turns a
gas mix into scattering constants once, at edit time — so the client never integrates anything at
runtime. Run it (**File ▸ Run**) after the system data changes; never hand-edit the `.tres`.

:::note[The dust is the exception]
Mie parameters cannot be derived from a gas mix — they come from an offline computation on the
suspended dust and are pinned in the generator, with the study that produced them.
:::

### What it gives you

- a **continuous sky** from horizon to zenith, that thins and darkens as you climb until the star is a
  sharp point against black;
- **aerial perspective**: distant terrain is veiled by the air in front of it, which is what makes a
  mountain read as *far* rather than *small*;
- a **haze slab** with a floor and a ceiling, so a valley can sit *below* the dust with clear air around
  it while a plateau sits inside it — the three regimes look different because they are different;
- **ambient light and reflections** taken from the same sky, so night really goes dark and a sunset
  really warms the walls.

:::warning[Altitude is clamped at the surface]
Below the reference sphere the density term would run away (it grows exponentially downward) and reach
infinity within a few hundred kilometres, turning the whole lower half of the screen black. Altitude is
therefore floored at zero in **both** twins — the shader and its GDScript counterpart. Half of Sandbox's
surface is below that sphere, so this is not an edge case.
:::

## Distant planets & moons

A far body is lit **per-fragment in the terrain shader**, from the **real star direction**
(computed in double precision and passed to the shader). So the side facing the star is lit and
the far side is dark — a clean day/night terminator — even seen from thousands of km away. This
fixes the old "black planets in the sky" problem, where a normal light simply couldn't reach.

Distant bodies also keep their **real terrain** (their coarse LOD-3 chunks) at every distance —
there is no low-detail placeholder sphere anymore.

## Planet rotation and orbits

Every body **spins on its axis** at its real sidereal period plus its axial tilt, and every planet and
moon also **travels its orbit** — the Keplerian elements the celestial service publishes.

Both are **pure functions of absolute time**, evaluated the same way on the server and on every client,
so neither the spin nor the orbital position ever travels over the network: both sides land on the same
place as long as their clocks agree. The only celestial quantity that crosses the wire is the **time**
itself.

:::note[Why moving a frame is safe, and turning one is not]
A player standing on a planet is a **child** of that planet in the scene tree, so the whole world moves
with them and nothing changes underfoot — a planet can travel 33 km/s along its orbit and cost nothing.
**Rotating** a frame is the dangerous one: at astronomical coordinates the physics engine quantises
collision boxes, so spinning a body under its contents is what makes things jitter.
:::

## Where am I on the planet?

The debug panels show, for the body you're standing on:

- your **altitude** above the terrain (and whether you're in the atmosphere or in space);
- the **local time** of that body;
- your **longitude / latitude** in compass form (e.g. `24.85° N  39.56° O`), matching the real
  terrain geography — it stays constant for a fixed spot on the ground as the planet spins.

Toggle the debug panels with the **debug-panels key** (see
[Controls & shortcuts](/docs/uiux/controls_shortcuts)).

## Scale — real distances

The star system runs at **true 1:1**: real distances *and* real body sizes. An earlier ×⅓ shrink is
gone from the game and from the celestial service.

The consequence is worth knowing before you go looking for motion: at 1:1 an orbit runs at its **real
period**, so a 171-day year is imperceptible in real time. Use the **simulated-time offset** keys
(see below) to sweep the sky rather than waiting for it.

It also changes how the star reads. Seen from Sandbox, Tarsis subtends **0.80°** against the Sun's
0.53° from Earth — half again as wide, and 1 490 W/m² against Earth's 1 361. But at the game's field of
view that is still only a handful of pixels, so a star that "looks small" is not a scale bug: the lever
for making it feel big is the **glow**, not the geometry, which is now correct.

## Seeing it in-game (for developers)

- **Toggle the debug panels** (altitude / local time / lon-lat / celestial markers) with the
  debug key.
- **Shift the simulated time** by an hour with `+` / `−`; hold them to sweep the star and the moons
  across the sky. Safe by construction — the sky is a pure function of time, and everything standing on
  a body is parented to it, so the ground never moves under anyone. The HUD shows the offset.
- **Cut the moon lights** with `Alt+L`. It also prints each factor (phase, elevation, extinction,
  energy), which is how you tell "the night is too dark" from "that moon is 40° below the horizon".
- **Isolate a light contributor** with `Alt+I`: no aerial perspective, no sky reflection, no sky
  ambient. Each step removes exactly one, so whatever still lights the scene names its own source.
- Use the **EVA free-flight** dev tool to fly away from the surface and look at the lit
  planets/moons and the day/night terminator across a whole body.

Both keys are InputMap actions, so their current bindings are in **Settings → Controls**.
