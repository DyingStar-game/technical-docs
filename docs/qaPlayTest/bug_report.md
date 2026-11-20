---
title: In-game bug report
sidebar_position: 2
---

# In-game bug report

A player reports a bug **without leaving the game**: one key, the QA team's template to fill in, and
the report lands in the QA channel on Discord with its capture.

## For the player

1. Press **F9** (`bug_report`, rebindable in **Settings › Controls**, with the capture keys). It answers
   wherever the bug shows: in the world, in the pause menu, the settings, the DataPad or the main menu.
   A line in the bottom right corner of the screen recalls it everywhere, with the key as it is bound
   (`[F9] Report a bug`); the F7 photo leaves it out, like the rest of the interface.
2. The game takes the bug-report capture — the F8 one: the screen as it is, debug panels shown —
   **before** the form opens, so the form is not in the picture.
3. Fill in the **template** — every part is required, **Tab** goes from one field to the next —
   leave *Attach the end of the game's log* ticked unless there is a reason not to, and send.

The form has three other ways out:

- **Attach another capture**: the form steps aside with what you typed. Go and show what you want,
  press the key again: the new capture joins the report and the form comes back. Five captures at
  most; a click on one in the form takes it off.
- **Continue later**: the form closes and keeps everything. The key brings it back as it was (and
  takes no capture then). Kept until the game is closed.
- **Cancel** (or Escape): the report is dropped.

The line in the corner of the screen says what the key will do: report a bug, add this view to your
report, or resume it.

| Part of the template | What goes in it | Limit |
|---|---|---|
| **Title** | What goes wrong, in a few words | 3 to 80 characters |
| **Severity** | How bad it is, chosen in a list (below) | *Minor* unless changed |
| **Description** | What goes wrong, in a sentence or two | 1000 |
| **Steps** | How to get there, one step a line | 1500 |
| **Actual result** | What happened | 700 |
| **Expected result** | What should have happened | 700 |
| **Captures** | Taken by the game, debug panels shown; the first one when the key is pressed | 5 |

The severity and the four texts are posted as titled sections of one Discord message, in the
player's language (*Sévérité / Description / Étapes / Résultat obtenu / Résultat attendu* for a
French client).

| Severity | Means | Mark in the title | Message colour |
|---|---|---|---|
| **Blocker** | You cannot go on playing | 🔴 | red |
| **Major** | A feature does not work | 🟠 | orange |
| **Minor** | Annoying, but there is a way round | 🟡 | yellow |
| **Cosmetic** | A look, a text, a sound | 🟣 | purple |

The round mark opens the post's title, so the list of posts reads by severity at a glance.

What leaves with the report:

| Part | Content |
|---|---|
| The template | What the player typed, part by part |
| Captures | JPEGs no wider than 1920 px (the PNGs stay in `screenshots/debug`), the first as the message's picture |
| Context | Version and build (the export's build id; run from the sources, the branch and the commit), FPS, language |
| Place | Where the player stood at the first capture, shown in the form too: world coordinates (m), the planet with latitude, longitude and elevation when on one, and the node carrying the player. Nothing in a menu |
| Machine | System and architecture, processor and threads, memory (total, free, used by the game), graphics card (vendor, dedicated or integrated), its driver, video memory used, renderer, screen and window, engine version. Nothing that names the owner |
| Log | The last 256 kB of `godot.log`, with every token taken out |
| Author | The player's name and id, read from their token by the service |

The form says so when reports are **not relayed** from where the player is (local dev, a server with
no webhook): the capture is then in the screenshots folder, to be posted by hand.

:::note[After a crash]
A game that crashed cannot send anything. Its log is on disk, to be attached by hand to a post in the
QA channel. On Windows:

```
%APPDATA%\Godot\app_userdata\DyingStar\logs\godot.log
```

`godot.log` is the session **in progress**: once the game has been started again, the crashed
session is the newest of the dated files beside it (`godot<date>.log`).
:::

## How it travels

```
game (F9) ──POST /social/api/bug-reports──▶ service-social ──webhook──▶ Discord, QA channel
```

The game never talks to Discord. Posting there takes a **webhook URL**, and whoever holds that URL
can post in the channel: it cannot ship in an open-source client. `service-social` is the only holder,
checks who is reporting (the player's Keycloak token), paces them (one report a minute, twenty a day)
and switches every mention off, so `@everyone` in a title stays text.

Nothing is stored by the service: a report lives in Discord.

## One webhook per environment

| Environment | Secret | Title |
|---|---|---|
| preprod | `social-bug-report` in `dyingstar-preprod` | `🔴 [PREPROD] <title>` |
| prod (once its values exist in the chart) | `social-bug-report` in `dyingstar-prod` | `🔴 [PROD] <title>` |
| dev-local | none by default: the feature is off | `🔴 [DEV] <title>` |

The title is the round mark of the severity, the environment, then the player's words: the channel
holds nothing but bugs, the severity is the mark's colour, and the version is in the fields of the
message.

The Secret holds the URL under the key `DISCORD_BUG_WEBHOOK_URL` and is created out of band, never
committed:

```bash
kubectl -n dyingstar-preprod create secret generic social-bug-report \
  --from-literal=DISCORD_BUG_WEBHOOK_URL='https://discord.com/api/webhooks/…'
```

The chart reads it as **optional**: an environment that names the Secret before it exists starts all
the same, with bug reports off. A leaked URL is fixed on Discord's side — delete the webhook, create
another, update the Secret.

The QA channel is a **forum**: `bugReport.forum: true` is set in the chart's values, and each report
opens a post named after its title (`bugReport.forumTagIds` applies the tags a forum may require).
Without it Discord refuses the report (error 220001) and the form says *not sent*; the reason is in
the logs of `service-social`.

## Trying it locally

Create a webhook on a Discord server of your own, put it in a `social-bug-report` Secret in the
`dyingstar` namespace and set `bugReport.webhook.existingSecret: social-bug-report` on your local
branch of the `kubernetes` repository. Do not test with the preprod webhook: it posts in the real QA
channel.

## Where the code is

| What | Where |
|---|---|
| The key, the capture, the context, the log tail | `scenes/player/bug_reporter.gd` (game) |
| The form | `ui/bug_report/bug_report_dialog.gd` (game) |
| The call | `PlayerServices.bug_report_create` (game) |
| The relay, its limits, the Discord payload | `social/src/services/bugReports.service.ts` (services) |
| The Secret and the environment label | `service-social/values*.yaml` (kubernetes) |
