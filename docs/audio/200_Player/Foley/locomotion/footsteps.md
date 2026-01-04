---
title: Footstep
sidebar_position: 102
---

## **Footstep (Definition)**

**Footsteps** are the **sounds produced by a character’s feet** when they move in the game world. They are **dynamic** and vary depending on:

- the **surface material** (dirt, metal, stone, snow, water, etc.)
- the **movement speed** (walk, run, sprint, crouch...)
- the **type of movement** (landing from a jump, sliding, stepping on slopes)
- the **character’s weight and type** (human, robot, alien, creature... )

### Role in Game Audio

Footsteps are important for:
- **Immersion** (making the character feel grounded in the world)
- **Gameplay feedback** (communicating movement speed or stealth)
- **Spatial awareness** (locating NPCs or players around you)
- **Character identity** (heavy/mechanical/organic footsteps)

### Implementation (Summary)
Footsteps are usually triggered by:

- **Animation events / notifies**
- Surface detection systems (raycasts or collision queries)

In **Wwise**, they are often handled using a **Switch Container** driven by a **Surface Type Switch**.

In **Godot**, footsteps can be triggered via:

- Animation notifies
- A linked Wwise event or Godot AudioServer call
- Dynamic surface material lookup

