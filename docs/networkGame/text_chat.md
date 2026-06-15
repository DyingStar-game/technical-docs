---
title: Text chat
sidebar_position: 7
---

# Text chat

The in-game text chat is **not** built on the gameplay replication path (game server →
Horizon → clients). It runs over a dedicated **MQTT broker**: each client connects to the
broker directly, subscribes to the channels it is allowed to read, and publishes its own
messages there. The broker — not the game server — is the authority for chat.

## Why MQTT

MQTT is a lightweight publish/subscribe protocol. A **broker** holds *topics*; clients
**publish** to a topic and **subscribe** to topics, and the broker fans messages out to all
subscribers. This decoupled, many-to-many model fits chat well and, because the broker is a
shared bus, it also scales to cross-server / cross-region channels later (alliance, global)
without routing everything through one game server.

```
   ┌──────────┐   ws + JWT (prod)   ┌─────────────────────┐
   │  Client  │ ───────────────────►│  Mosquitto broker   │
   │ (Godot)  │ ◄─── messages ──────│  (k8s: textchat)    │
   └──────────┘                     └─────────────────────┘
   publish/subscribe on topics:
     chat/general            (open)
     chat/region/<id>   ┐
     chat/group/<id>    ├─ need a context id (filled later, see below)
     chat/alliance/<id> ┘
     chat/dm/<player_id>
```

## The pieces

| Piece | Where | Role |
|---|---|---|
| `ChatNetwork` | `scenes/globals/chat_network.gd` (autoload) | The transport. Owns the broker connection, publishes outgoing messages, re-emits incoming ones. |
| `DirectChat` | `ui/direct_chat/direct_chat.gd` + `.tscn` | The UI (message log, input line, channel selector). Binds to `ChatNetwork`. |
| `ChatMessage` | `ui/direct_chat/chat_message.gd` | Plain data: content / channel / author / timestamp. |
| MQTT client | `addons/mqtt/` | GDScript MQTT-over-WebSocket implementation. |
| Broker | `kubernetes` repo, `textchat/` Helm chart | Mosquitto (`eclipse-mosquitto`). |

Chat networking is intentionally kept **out** of `NetworkOrchestrator` (which handles the
Horizon gameplay path): it is a separate concern with its own transport.

## Flow

1. The local player's `DirectChat._ready` calls `ChatNetwork.ensure_connected()` (clients
   only — never the headless server, and not remote player copies).
2. `ChatNetwork` connects to the broker (WebSocket) and, once connected, subscribes to every
   **active** channel's topic.
3. Typing a message emits `DirectChat.send_message` → `ChatNetwork.publish_message`, which
   stamps the author and publishes `{author, content, channel}` (JSON) on the channel topic.
4. The broker echoes the message to all subscribers (including the sender) →
   `ChatNetwork.message_received` → `DirectChat.receive_message_from_server` → displayed.

## Channels and the extension point

All channels are listed in the selector, but a channel is only usable once its topic can be
resolved. `chat/general` is static (always active). The others —
`region` / `group` / `alliance` / `dm` — need a **context id** ("which group?") that does not
exist until those gameplay systems are designed. Until then they are **greyed out** ("À venir").

Wiring one up later is a single call — the extension point:

```gdscript
# When the group system knows the local player's group id:
ChatNetwork.set_id_provider(DirectChat.ChannelE.GROUP, func() -> String:
    return current_group_id)
```

`ChatNetwork` then resolves `chat/group/<id>`, subscribes to it, and `DirectChat` shows the
channel as selectable — no other change needed.

## Authentication (roadmap)

In local dev the broker runs **anonymous**. In production it authenticates with the **same JWT
the player already uses to join the game** (Discord → Keycloak), so it is transparent — no
second login. The client passes that token (`network_agent.token`, from the `--token=` launch
argument) as the MQTT password; the broker validates it.

The planned setup is **`mosquitto-go-auth` validating the JWT locally** against Keycloak's
public key (JWKS), with **topic ACLs derived from the JWT claims** (e.g. you may only
subscribe to `chat/group/<id>` if your token carries that group). Those claims are the same
"sockets" the channel id-providers fill on the client side.

## Infrastructure

The broker is deployed by the `textchat/` Helm chart in the `kubernetes` repo (modelled on
`dev-services`). It exposes MQTT on `1883` and MQTT-over-WebSocket on `9001`. In local dev,
skaffold port-forwards `9001` to `127.0.0.1:9001` (like horizon's `7040`); the client reads
the broker URL from `client.ini` `[chat] broker_url`, defaulting to `ws://127.0.0.1:9001`.

For the chat keyboard shortcuts (F12 / Enter / Tab), see the Controls & shortcuts page.
