---
title: Network Game Introduction
sidebar_position: 1
---

# How DyingStar networking works

This page explains the **big picture** of multiplayer in DyingStar, in plain language, before
you read the more technical pages ([Player](./player.md), [Props](./props.md),
[Vehicles](./vehicles.md)). You don't need to be a network engineer to follow it — read it once
and the rest of the section will make sense.

## The one rule that explains everything

> **The server decides. The client only shows.**

In DyingStar, your game (the *client*) is **not** in charge of what happens. It is a window: it
shows you the world and sends your inputs ("I press forward", "I press E") to the server. The
**server** is the only place where the real world exists — it runs the physics, checks the
collisions, and decides the result. Then it tells every client what to display.

This is called **server-authoritative**. It is what keeps everyone's game in sync and stops
cheating. If you ever find yourself making the client "decide" something (move itself through a
wall, pick up an item on its own, change who it is attached to), it is almost always a bug.

## The four actors

Multiplayer in DyingStar is a conversation between four parts. Each one has **a single job**.
Mixing up their jobs is the source of most networking bugs.

| Actor | What it is | Its only job |
|---|---|---|
| **Game server** (GodotServer) | A copy of the game running with no screen ("headless"), on the server | **The authority.** Runs physics, collisions, and all gameplay decisions. The single source of truth. |
| **Horizon** | A separate program written in Rust | The **post office**. It does *no* gameplay. It stores each object's latest state and decides **who receives which update**. |
| **GORC** | A system *inside* Horizon | The **filter**. "This player is close enough to that rock to care about it — send it. That one is too far — don't." |
| **Client** | The game on the player's machine | The **window**. Shows the world, sends your inputs up, and smooths out what it receives. It has **no authority**. |

A useful image: the **game server** is the director of a play who knows the whole script;
**Horizon + GORC** are the stage crew who decide which spectators can see which part of the
stage; the **client** is one spectator watching from their seat.

## Why a separate "post office" (Horizon + GORC)?

An MMO can have thousands of objects. If every client received every update about every object,
the network would melt. So Horizon only sends you what is **near you**, and not too often.

That filtering is **GORC**. For each *type* of object (a box, a player, a vehicle…), a small
configuration file says, per kind of data:

- **how far** it travels (a radius in meters — past it, you simply don't get the update), and
- **how often** it is sent (a few times per second for slow data, up to 30 times for fast data
  like position).

These files are the **replication definition files**, explained in
[Props network management](./props.md#replication-definition-files). The important takeaway:
**a piece of data only reaches other players if it is declared in that file.** Forget to declare
it and it silently never arrives — a very common beginner trap.

## The backbone: parents (`parent_id`)

This is the most important idea in the whole system, and the one that causes the trickiest bugs.

**Every object's position is stored *relative to a parent*, not in absolute world coordinates.**

- A planet is a parent. A city sitting on the planet is its child. A building in the city is a
  child of the city. A box inside a truck is a child of the truck. A crate you carry is a child
  of *you*.
- Each object only knows its **local** position ("I am 2 meters in front of my parent"). The
  parent is identified by a `parent_id`.

Horizon rebuilds the **real (global) position** by adding up the chain:
`my world position = my parent's world position + my local position`.

Why bother? Because the world **moves**. Planets orbit at gigantic coordinates. If a box stored
its own absolute position, it would drift away from the planet it sits on the moment the planet
moved. By storing the box *relative to the planet*, it rides along automatically.

Two consequences worth remembering:

1. **When a parent moves, Horizon automatically recomputes where all its children are.** A box
   in a moving truck does **not** have to keep announcing its position — the truck's movement
   already carries it. (Re-announcing it every frame is exactly the kind of mistake that floods
   the network; see the golden rules below.)
2. **Who your parent is, is a server decision.** When you walk into a building that becomes your
   new parent, the *server* changes your `parent_id` and tells the clients. A client never
   re-parents itself.

## The life of one update

Putting it together — here is what happens when, say, a box is pushed on the server:

1. **Game server**: physics moves the box. The box notices its local position changed and sends
   one small message: "box `1234` is now *here* (relative to my parent)".
2. **Horizon**: receives it, computes the box's real world position from its parent, updates
   GORC (so players who just came into range start receiving it, and those who left stop), and
   forwards the change **only to the clients that are close enough**.
3. **Clients in range**: receive "box `1234` moved" and smoothly update the box on screen. Clients
   too far away never hear about it.

The player works the **same way** — a player is just an object of type `player`. The only extra
part is that *your* client also sends your inputs/actions *up* to the server (see
[Player network management](./player.md)).

## The golden rules

These six rules prevent the great majority of networking bugs. Every later page is an
application of them.

1. **The server decides, the client shows.** Always — including movement, pickups, and parenting,
   for your own player too.
2. **Send a change only when it actually changes**, and send only the field that changed — never
   the whole state every frame. Re-sending unchanged data floods the network and freezes the
   game.
3. **Positions are local to a parent.** Let Horizon rebuild the world position. A child of a
   moving thing does not re-announce itself.
4. **A piece of data only travels if it is declared** in the object type's replication
   definition file.
5. **After re-parenting a node, reset its interpolation** so it doesn't visually slide from its
   old spot (a Godot detail explained in the player/props pages).
6. **Deleting a parent? Re-attach its children first**, otherwise they are left pointing at
   something that no longer exists and turn into "ghosts" on other clients.

## Where to go next

- [Player network management](./player.md) — sending your inputs up, receiving results down.
- [Props network management](./props.md) — how any object (box, rock, building…) replicates,
  the definition files, and deletion.
- [Adding a vehicle](./vehicles.md) — a worked example that combines all of the above.
