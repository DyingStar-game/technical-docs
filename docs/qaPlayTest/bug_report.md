---
title: In-game bug report
sidebar_position: 2
---

# In-game bug report

A player reports a bug **without leaving the game**: one key, the QA team's template to fill in, and
the report lands in the QA channel on Discord with its capture.

## For the player

1. Press **F9** (`bug_report`, rebindable in **Settings › Controls**, with the capture keys).
2. The game takes the bug-report capture — the F8 one: the screen as it is, debug panels shown —
   **before** the form opens, so the form is not in the picture.
3. Fill in the **template** — every part is required — leave *Attach the end of the game's log*
   ticked unless there is a reason not to, and send.

| Part of the template | What goes in it | Limit |
|---|---|---|
| **Title** | What goes wrong, in a few words | 3 to 80 characters |
| **Description** | What goes wrong, in a sentence or two | 1000 |
| **Steps** | How to get there, one step a line | 1500 |
| **Actual result** | What happened | 700 |
| **Expected result** | What should have happened | 700 |
| **Capture** | Taken by the game, debug panels shown | — |

The four texts are posted as titled sections of one Discord message, in the player's language
(*Description / Étapes / Résultat obtenu / Résultat attendu* for a French client).

What leaves with the report:

| Part | Content |
|---|---|
| The template | What the player typed, part by part |
| Capture | A JPEG no wider than 1920 px (the PNG stays in `screenshots/debug`) |
| Context | Build (`version · build id`), OS, GPU, FPS, language, the body and frame the player is in, their position in it |
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
| preprod | `social-bug-report` in `dyingstar-preprod` | `[BUG][PREPROD][<build>] <title>` |
| prod (once its values exist in the chart) | `social-bug-report` in `dyingstar-prod` | `[BUG][PROD][<build>] <title>` |
| dev-local | none by default: the feature is off | `[BUG][DEV][<build>] <title>` |

The Secret holds the URL under the key `DISCORD_BUG_WEBHOOK_URL` and is created out of band, never
committed:

```bash
kubectl -n dyingstar-preprod create secret generic social-bug-report \
  --from-literal=DISCORD_BUG_WEBHOOK_URL='https://discord.com/api/webhooks/…'
```

The chart reads it as **optional**: an environment that names the Secret before it exists starts all
the same, with bug reports off. A leaked URL is fixed on Discord's side — delete the webhook, create
another, update the Secret.

If the QA channel is a **forum**, set `bugReport.forum: true` in the chart's values: each report then
opens a post named after its title (and `bugReport.forumTagIds` applies the tags a forum may require).

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
