---
title: Localization
sidebar_position: 3
---

# Localization

The game ships in **English and French**, and the player picks which in
**Settings ▸ General** (*Automatic* follows the operating system). The choice is applied
immediately — no restart — and remembered in `user://settings.ini`.

## How a string gets translated

One CSV is the single source: **`tools/localization/localisation.csv`**, columns
`keys,en,fr,es`. Godot's `csv_translation` importer turns it into the `.translation` files
listed in `project.godot`. The `.translation` files are generated and **gitignored** — only
the CSV is versioned, so the CSV is the only thing you ever edit.

```
tools/localization/localisation.csv
  → csv_translation importer
  → localisation.{en,fr}.translation
  → project.godot → locale/translations
```

### Keys start with `%%`

`%%MENU_SETTINGS`, `%%HUD_DROP`, `%%ACT_JUMP`. The prefix is not decoration: an untranslated
key renders **as itself** on screen, so a missing translation is visible the moment anyone
opens that screen, instead of quietly showing English to a French player.

Prefixes by area: `%%MENU_*` menus and settings, `%%ACT_*` keybinding labels,
`%%KM_*` the controls page, `%%HUD_*` in-game, `%%CHAT_*`, `%%EMOTE_*`, `%%SPAWN_*`,
`%%ERR_*` errors.

### Adding one

1. Add a row to the CSV. Fill **both** `en` and `fr` (`es` exists for a future contributor and
   is not shipped).
2. Use the key. Where depends on what draws the text:

| The text is… | What to write | Why |
|---|---|---|
| a property in a `.tscn` (`text`, `placeholder_text`, `tooltip_text`) | the key itself: `text = "%%MENU_QUIT"` | `Control` auto-translates its own text, **and re-translates it when the language changes** |
| assigned to a `Control` from a script | the key: `label.text = "%%HUD_DROP"` | same mechanism — prefer this to `tr()`, it survives a language change for free |
| built into a larger string | `tr("%%HUD_RPM") % value` | a key buried inside a sentence matches nothing and would show through raw |
| drawn by hand (`draw_string`) | already handled — see the radial menu below | nothing auto-translates a canvas draw |

**Rule of thumb:** assign the *key* whenever a `Control` will render it; call `tr()` only when
you have to assemble or format the result.

### Strings with holes

Translate the **whole pattern**, never fragments:

```gdscript
# good — the sentence can be reordered in another language
title.text = tr("%%MENU_SETTINGS_TITLE") % tr(category_key)

# bad — word order is not universal, and this cannot be reordered
title.text = "Settings - " + category_name
```

### What not to translate

Units (`km/h`, `kg`, `m3`), sizes (`S`, `M`, `L`), proper nouns (planet, star and faction
names), and the modifier keys `Ctrl` / `Alt` / `Shift` — those are what is printed on the
keyboard. Language names in the picker are shown in their own language on purpose, so someone
who picked a language they cannot read can still find their way back.

Do not translate the placeholders a scene is authored with when a script overwrites them every
frame (speed, rpm, a depot's splash line). They are never seen, and translating them puts
fiction in the table.

## Key prompts read the real binding

Interaction prompts do **not** hardcode a key. `InputLabel.for_action(&"action")` returns the
key currently bound, named as it is printed on the player's own layout (`²` on an AZERTY row),
so a rebind is reflected everywhere:

```gdscript
player.interact_label.text = _prompt(&"action", tr("%%HUD_DROP"))   # "[E] Drop"
```

The bracket layout is presentation, not language, so it lives in the code rather than inside
every translated string. The same helper names keys in **Settings ▸ Controls** — one answer per
key for the whole game.

## Radial menus

The wheel (`scenes/ui/radial_menu.gd`) paints its labels with `draw_string`, which nothing
auto-translates. It therefore translates **what it draws**, so a catalogue just passes keys:

```gdscript
{"text": "%%EMOTE_DANCE", "data": "dance"}
```

Any wheel added later inherits this without doing anything.

## The network boundary

**The server sends a symbol, the client turns it into words.** The carry prompt travels as
`"drop"` / `"carry"` / `"install"` and the client decides what that reads like; no translatable
text goes over the wire.

Anything that arrives from the network as a finished sentence cannot be localized by the
client. That is the case today for **NPC dialogue**, written in the NPC service and sent as
text, and for server-side connection error messages. Fixing those means sending a key plus its
arguments instead of a sentence.

## Tests

`test/unit/test_localisation_keys.gd` checks the table and the code against each other:

- every key used in a `.gd` or `.tscn` **exists** in the CSV;
- every key in the CSV **is used** somewhere (an unused one only rots);
- `en` and `fr` are both filled;
- both languages have the **same `%`-holes** — a translation that loses a `%s` throws at
  runtime, in one language only, in front of a player.

⚠️ The "Run GUT tests" CI job is currently disabled upstream, so run GUT by hand.

## Adding a language

1. Add a column to the CSV and fill it.
2. Add its `.translation` to `locale/translations` in `project.godot`.
3. Add one entry to `LanguageSettings.LANGUAGES` — `"de": "Deutsch"`, written in its own
   language. Code and display name live in the same structure precisely so the two cannot
   drift apart.

The picker, the fallback and the "Automatic" resolution then work with no further changes.
