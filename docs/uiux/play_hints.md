---
title: Play hints
sidebar_position: 4
---

# Play hints

On the left of the screen, a short list reminds the player of the keys that matter **right now**: on
foot, at the wheel, carrying a crate, with the drill out. Each line disappears once the player has
used its key **3 times** while it was shown, and comes back after a week without using it.
**Settings ▸ General** has a switch for the whole panel and a button to show the learnt hints again.

It is not the controls page (F1 lists everything): six lines at most, the ones of the moment.

## Adding hints to your feature

One call, from wherever your feature knows its context:

```gdscript
PlayHints.provide(self, &"mining_tool", [
    PlayHints.row(&"aim"),                    # label = the controls page's own (%%ACT_AIM)
    PlayHints.row(&"perforate"),
    PlayHints.row(&"action", "%%HUD_DROP"),   # or any key of localisation.csv
], func() -> bool: return is_equipped(), 20)
```

- **`self`** owns the lines: they disappear on their own when it is freed. Nothing to clean up.
- **The context** (`&"mining_tool"`) names them: offering the same owner + context again replaces
  them, and `PlayHints.withdraw(self, &"mining_tool")` takes them back.
- **`when`** is asked a few times a second; the lines show while it answers `true`. Leave it out to
  show them for as long as the owner lives (then withdraw them yourself).
- **The priority** (here 20) orders the list, highest first. An action offered by several contexts is
  listed once, by the highest. The player's own contexts use: on foot 0, floating 5, at the wheel or
  as a passenger 10, carrying or the drill 20; `HintSource` defaults to 30.
- **A row may group actions** that are one thing to the player — the four move keys:
  `PlayHints.row([&"move_forward", &"move_left", &"move_back", &"move_right"], "%%HELP_MOVE")`.

The panel does the rest:

- it shows the **keys bound now** on the device in hand (keyboard or gamepad), through
  `InputLabel` / `ControlsHelpRows.name_of` — a rebound key shows rebound;
- an action with **no binding** on that device is not listed;
- it hides under menus, the star map, the controls help and the chat, and with the rest of the HUD
  for the pause menu and the F7 photo.

### Without code: `HintSource`

Drop a **`HintSource`** node anywhere in a scene — under a console, a machine, a vehicle — and fill
its **rows** in the Inspector (each: the action(s) and a label key, empty = the controls page's).
Its lines show while it is in the tree and `active`, and, with **`near_m`** set, only while the camera
is within that distance of its parent. Switch `active` from code or an `AnimationPlayer`.

## Labels and translation

A label is a **translation key written out in full** (`"%%HUD_DROP"`, never built by concatenation):
`test_localisation_keys` looks for every key in the code and fails on one missing from
`tools/localization/localisation.csv`. Leave the label empty to reuse the controls page's label of the
action (`MenuConfig.ACTION_GROUPS`) — most hints need no new text at all.

## Where things are

| Piece | File |
|---|---|
| The registry (`provide`, `withdraw`, `row`) | `scenes/globals/play_hints.gd` |
| What the player has learnt (`user://hints.cfg`) | `scenes/globals/play_hints_memory.gd` |
| The panel on the left | `ui/play_hints/play_hints_panel.gd` |
| The no-code node and its rows | `scenes/globals/hint_source.gd`, `scenes/globals/hint_row.gd` |
| The player's own contexts | `PlayerClient._offer_play_hints()` in `scenes/player/player_client.gd` |
| The settings switch and reset | `SettingsManager.is_play_hints_enabled()`, Settings ▸ General |
