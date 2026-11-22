---
title: Virtual reality
sidebar_position: 5
---

# Virtual reality

DyingStar plays in VR on PC (Linux and Windows) with **any OpenXR headset**: SteamVR (Steam Frame, Index,
Vive, Pico or Quest through Steam Link), Meta Quest Link / Air Link, Virtual Desktop, Monado / WiVRn. The
game talks to whatever OpenXR runtime is active, never to one headset.

## Launching in VR

VR is turned on by Godot's own launch argument, and by nothing else (there is no in-game switch):

```
DyingStar --xr-mode on
```

- **From the editor**: *Project ▸ Project Settings ▸ Editor ▸ Run ▸ Main Run Args* = `--xr-mode on`.
- **Steam**: *Properties ▸ Launch options* = `--xr-mode on`.
- Start the runtime (SteamVR, Quest Link...) **before** the game, headset on.

Without the argument the game is the flat-screen game: no VR runtime is woken and the VR shaders are not
compiled. With it but no runtime answering, Godot says so in a dialog and the game plays on the flat
screen.

## Controls

The controllers play as a gamepad: every gamepad binding works, rebinding included, and the HUD names the
pad's buttons. Labels below are those printed on most controllers.

| Controller | Does |
|---|---|
| Walking stick (left) | walk (towards where you look, or where the hand points: comfort setting) |
| Walking stick click | run, until the stick comes back to the centre |
| Turning stick (right) | turn, in steps or smoothly (comfort setting) |
| Turning stick held 1 s | recentre the view (hands free) |
| A / B | jump / crouch, back |
| X | the action key: open, board, take, use, get up |
| Y | get out, take the tool out |
| Right grip | the action key too |
| Triggers | aim / use the tool; on a 3D screen, click |
| Menu | pause |
| View (Steam Frame) | star map |
| D-pad (Steam Frame) | torch, prone, emotes, ignition |

- **Aiming is the hand's**: a dot shows where the aiming hand points; the controller ticks on anything that
  can be used, and the prompt (`[X] Open`) hangs over it.
- **3D screens**: point and pull the trigger, or touch them with the controller.
- **Menus** float in front of you; point with either hand, the trigger clicks, the stick scrolls.

## Comfort settings

*Settings ▸ General ▸ VR comfort* (shown in VR only): turning by steps (angle) or smooth (speed), darkened
edges of the view while the stick moves you, the hand that aims and turns (left-handed players), where the
stick walks, and seated play (a lean is not a step).

## For developers

### Where it lives

| Script | Role |
|---|---|
| `scenes/globals/xr_mode.gd` (`XRMode`) | is VR on, far plane, physics steps, the virtual pad's device |
| `scenes/globals/xr_manager.gd` (autoload) | session, the headset following any flat camera (menus), perf log |
| `scenes/globals/xr_screen.gd` | the 2D (menus, HUD) on an OpenXR quad layer, the menus' laser |
| `scenes/player/vr/vr_rig.gd` (`VrRig`) | the owner's XR origin: its camera replaces the flat one |
| `vr_input.gd`, `vr_body.gd` | controllers as a pad; body under the head (turn, room-scale, recentre) |
| `vr_pointer.gd`, `vr_prompt.gd`, `vr_tool.gd` | hand aiming, prompt over the target, the tool in hand |
| `vr_arms.gd` | the avatar's arms and fingers on the player's hands (own and remote) |
| `vr_hands_codec.gd`, `vr_hands_sender.gd` | the hands on the network |
| `vr_vignette.gd`, `scenes/globals/vr_comfort_settings.gd` | comfort |

Gameplay code keeps one input path: the controllers are a gamepad (device 15), and `player.camera` is the
headset's camera. A feature that works on a gamepad works in VR.

### Hands on the network

`vr_hands` is 30 bytes for both hands (base64, 40 characters), in the body's frame: per hand the wrist
(mm), its turn (a quaternion, about a degree) and how closed each finger is -- never the joints. The owner
sends it at most 20 Hz and only when a hand moved enough to show. Horizon gives it a zone of its own in
`horizonserver/ds_genericprops/props/player_def.json` (zone 2): **20 Hz within 15 m, 8 Hz to 40 m,
nothing past 40 m**. The game server only checks the text (`VrHandsCodec.valid`).

### Engine patches

Two patches of our Godot build (`godot-build-scripts/patches/`) are needed, editor **and** export templates:

- `0001-xr-multiview-far-plane-large-worlds`: in stereo, buildings vanished depending on where the head
  looked (culling frustum built from the world's origin, 4e10 m away).
- `0002-billboards-large-worlds`: billboards, fixed-size labels and particle billboards were drawn
  kilometres away far from the world's origin (flat screen too).

### Traps met

- `--xr-mode` is removed from `OS.get_cmdline_args()`: ask `XRMode.is_active()`.
- SMAA and a 3D render scale under 1 break stereo in Godot 4.7: `RenderApplier` forces FXAA and 1.0 in VR.
- The headset's far plane is 500 km (`XRMode.FAR_M`): larger, the stereo sky turns black.
- An `XROrigin3D` leaving the tree (any server reparent) loses `current` for good: `VrRig` takes it back.
- Never use a material billboard or a world-space `GPUParticles3D` on a planet without patch 0002 /
  `local_coords` (4e10 m of float).
- Godot hands tracked hand joints over in **its** humanoid convention (+Y to the fingers, -Z out of the
  back of the hand), not OpenXR's.
- A runtime's controller-only hand tracking still fills `XRHandTracker`: `VrArms` prefers it to the grip pose.
