---
title: Network system (draft)
sidebar_position: 5
---

# Network system (draft)

This is the description of the network system used in the game.

:::warning Draft & known divergences from the current code
This page is a **design draft**. Several services below are **planned, not yet built**, and a few
details have moved on since it was written:

- **Persistence storage.** The draft shows **Dgraph** as the persistence database. The current
  persistence service (`service-persistence`, Rust) uses **ScyllaDB**. Treat "Dgraph" here as the
  original intent, not today's implementation.
- **Voice/video.** The "VOIP service" is implemented with **LiveKit** (SFU WebRTC + TURN).
- Ports and message shapes for the unbuilt services are **provisional**.

For the current, plain‑language explanation of how multiplayer actually works today, read
[Network Game → Introduction](../networkGame/intro.md).
:::

## Global schema

```mermaid
flowchart TB
  Cl@{ shape: procs, label: "client (player)"} <-- Websocket --> HSCo
  HSPlGS <-- Websocket --> GS@{ shape: procs, label: "Game Server"}

  subgraph "Horizon Server"
    HSCo("Core") <---> HSPlGS("plugin_game_server")
    HSCo("Core") <---> HSPlPr("plugin_props")
    HSCo("Core") <---> HSPlAu("plugin_auth<br>*Authentication*")
  end

  HSPlPr <-- gRPC --> Dg("Persistence database<br>*Data persistence*")
  HSPlAu <-- HTTPS --> KC("Keycloak")
```

## Authentication of a player

Sequence when a player connects & authenticates into the game:

```mermaid
sequenceDiagram
  Actor Client as Client (player)
  participant HSCore as Horizon Server<br>Core
  participant HSPlAuth as Horizon Server<br>Plugin Auth
  participant HSPlProp as Horizon Server<br>Plugin Props
  participant HSPlGS as Horizon Server<br>Plugin Game Server
  participant KC as Keycloak<br>(Authentication server)
  participant DGraph as Persistence<br>(database)
  participant GS as Game Server<br>(godot server)
  autonumber
  rect rgb(81, 162, 255)
    Client->>HSCore: event message (player+init)
    HSCore->>HSPlAuth: event message (player+init)
    HSPlAuth->>KC: login / request a token
    alt Authentication failed
      rect rgb(255, 100, 103)
        KC-->>HSPlAuth: TODO
        HSPlAuth-->>HSCore: TODO
        HSCore-->>Client: auth failed + disconnect
      end
    else Authentication OK
      rect rgb(49, 212, 146)
        KC->>HSPlAuth: TODO
        HSPlAuth->>HSPlProp: event message
        HSPlProp->>DGraph: request for player and for props around him
        DGraph->>HSPlProp: list of props
        HSPlProp->>HSPlProp: check for props already loaded
        par Send props to player
          HSPlProp->>HSCore: event message (list of all props)
          HSCore->>Client: event message (list of all props)
        and Send props to Game Server
          HSPlProp->>HSPlGS: event message (list of new props)
          HSPlGS->>GS: event message (list of new props)
        end
      end
    end
  end
```

The client → Horizon Core init message looks like:

```json
{
  "namespace": "player",
  "event": "init",
  "data": {
    "login": "jdoe",
    "password": "pass"
  }
}
```

## Player movement

Sequence of player movement (forward, right, left, back, rotation):

```mermaid
sequenceDiagram
  Actor Clients as All clients (players)
  Actor Client as Client (player)
  participant HSCore as Horizon Server<br>Core
  participant HSPlProp as Horizon Server<br>Plugin Props
  participant HSPlGS as Horizon Server<br>Plugin Game Server
  participant GS as Game Server<br>(godot server)
  autonumber
  rect rgb(81, 162, 255)
    Client->>HSCore: event message (player+move = direction + rotation)
    par rotation
      HSCore->>HSPlProp: event message (rotation only)
      HSPlProp->>Clients: event message (rotation only)
    and direction
      HSCore->>HSPlGS: event message (direction only)
      HSPlGS->>GS: event message
      alt player can't move (on wall for example)
        rect rgb(255, 100, 103)
          GS-->Clients: not send message
        end
      else player can move, new position on tick server
        rect rgb(49, 212, 146)
          GS->>HSPlGS: event message (new position)
          HSPlGS->>HSCore: event message (new position)
          par Update player position in cache
            HSCore->>HSPlProp: event message (new position)
          and Update to clients
            HSCore->>Clients: event message (new position)
          end
        end
      end
    end
  end
```

## Update from Game Server

Each tick on the Game Server, some objects have a new rotation, a new position, perhaps other
things.

```mermaid
sequenceDiagram
  Actor Clients as All clients (players)
  participant HSCore as Horizon Server<br>Core
  participant HSPlProp as Horizon Server<br>Plugin Props
  participant HSPlGS as Horizon Server<br>Plugin Game Server
  participant GS as Game Server<br>(godot server)
  autonumber
  rect rgb(81, 162, 255)
    GS->>HSPlGS: event message<br>(objects with data modifications)
    HSPlGS->>HSCore: event message
    par all players
      HSCore->>Clients: event message with modifications
    and update props
      HSCore->>HSPlProp: event message with modifications
    end
  end
```

## Command sent by a player

Command sent by a player — here, a command to display the datapad (name not yet defined at the
time of writing):

```mermaid
sequenceDiagram
  Actor Clients as All clients (players)
  Actor Client as Client (player)
  participant HSCore as Horizon Server<br>Core
  participant HSPlProp as Horizon Server<br>Plugin Props
  autonumber
  rect rgb(81, 162, 255)
    Client->>HSCore: event message with input pressed
    HSCore->>HSPlProp: update player state (datapad in hand)
    HSPlProp->>HSPlProp: get information (like mission, health...)
    par all players
      HSPlProp->>Clients: event message with player state (datapad in hand)
    and player
      HSPlProp->>Client: event message with datapad information to display
    end
  end
```

## Player spawns a box

Player presses a key to spawn a box (`box50cm` in this example):

```mermaid
sequenceDiagram
  Actor Clients as All clients (players)
  Actor Client as Client (player)
  participant HSCore as Horizon Server<br>Core
  participant HSPlProp as Horizon Server<br>Plugin Props
  participant HSPlGS as Horizon Server<br>Plugin Game Server
  participant GS as Game Server<br>(godot server)
  autonumber
  rect rgb(81, 162, 255)
    Client->>HSCore: event message (spawn + init)
    HSCore->>HSPlProp: event message
    HSPlProp->>HSPlProp: create a box instance + manage position
    HSPlProp->>HSPlGS: event message
    HSPlGS->>GS: event message
    GS->>GS: spawn the box<br>check if position is possible to spawn<br>else apply fixes
    GS->>HSPlGS: send position, rotation
    HSPlGS->>HSPlProp: event message
    HSPlProp->>HSPlProp: update properties of the box
    HSPlProp->>Clients: event message to spawn the box
  end
```

See the concrete client message in [Put a prop and spawn it](./put_prop_and_spawn.md).

## Schema with the services

```mermaid
flowchart LR
    CL["Client godot"] <-- WebSocket --> HC["Horizon CORE"] & VOIP("VOIP Service<br>**Low latency**")
    VOIP <-- WebSocket --> HC
    PROPS("Horizon GORC plugin")

    BDDDE("Data balance service<br>**normal latency**")
    RES("Resources dynamic<br>**normal latency**")
    PERS("Persistence service<br>**Low latency**")
    SIMING("Engineering simulation<br>**normal latency**")

    HC <--> AuthS("Auth JWT plugin")
    HC <-- WebSocket --> PROPS & ECO("Economy service<br>**normal latency**") & DIAG("Dialog (audio & text) + lore<br>**Low latency**") & SOCIAL("Social service<br>**normal latency**") & GODSER["Godot server"]
    HC <-- websocket --> SIMINDUS

    PROPS <-- WebSocket --> BDDDE & RES & SIMING
    PROPS <-- gRPC --> PERS
    PERS <-- gRPC --> SIMING
    BDDDE <-- REST API --> SIMING

    MISS("Missions<br>**normal latency**")
    SIMPNJ("PNJ simulation<br>**Low latency**")
    USER("User description, reputation<br>**normal latency**")
    SIMINDUS("Industrial simulation<br>**normal latency**")
    WEATHER("Weather<br>**High latency**")

    HC <-- Websocket --> MISS
    HC <-- Websocket --> SIMPNJ
    HC <-- Websocket --> USER
    HC <-- Websocket --> WEATHER

    style CL fill:#00C853,color:white
    style GODSER fill:#00C853
    style HC fill:#D50000,color:white
    style PROPS fill:#D50000,color:white
    style AuthS fill:#D50000,color:white
    style SIMINDUS fill:#87ceeb
    style USER fill:#87ceeb
    style MISS fill:#87ceeb
    style SOCIAL fill:#87ceeb
    style RES fill:#87ceeb
    style BDDDE fill:#87ceeb
    style ECO fill:#87ceeb
    style SIMING fill:#87ceeb
    style PERS fill:#1434a4,color:white
    style SIMPNJ fill:#1434a4,color:white
    style VOIP fill:#1434a4,color:white
    style DIAG fill:#1434a4,color:white
```

## Message format from Horizon to services (WebSocket)

Between Horizon and a service (both directions) we use the same data structure. For each
`namespace` + `event` couple, the data values are defined:

```json
{
  "namespace": "service_mission",
  "event": "new_mission",
  "from": "client|plugin|core",
  "data": {
    "propxxx": "xxx"
  }
}
```

## Services specifications

:::note
Except where noted, these services are **planned**. Each one is described with its purpose, its
databases and its communication channels. Many features are still "to be written".
:::

### Service: resources dynamic

Delivers the position and rotation of planetary‑system items (planets and moons) and transports
(train and orbital elevator).

- **Databases:** PostgreSQL (list of items) + DuckDB (pre‑computed positions/rotations at a given
  time).
- **Communication:** WebSocket server, port **9200**, binary data — planet & moon initialization,
  item position for the next tick, item positions for the next *N* ticks. REST API (HTTP) — update
  planet/moon name, import a planetary system JSON.

```mermaid
flowchart LR
  RES("Resources dynamic<br>**normal latency**")
  PROPS("Horizon GORC plugin")
  POSTGRES[(PostgreSQL)]
  DUCKDB[(DuckDB)]
  WEB("Admin website")

  PROPS <-- WebSocket --> RES
  RES --> POSTGRES
  RES --> DUCKDB
  WEB -- REST API --> RES

  style PROPS fill:#D50000,color:white
  style RES fill:#87ceeb
  style WEB fill:#e699ff
  style POSTGRES fill:#ffb366
  style DUCKDB fill:#ffb366
```

### Service: persistence

Persists data. Stores objects (properties, positions…) in a graph database and returns them when
servers restart or when an object must become visible to a player.

- **Database:** graph database (draft says Dgraph; **current implementation uses ScyllaDB**).
- **Communication:** gRPC server with Horizon; REST API (HTTP) — features to be defined.

### Other planned services

Each of the following shares the same pattern — WebSocket server on port **9200** (binary) and a
REST API (HTTP) — with features still to be written:

- **Social service** — social interactions between players (friends, groups). Low latency.
- **PNJ simulation** — non‑player‑character simulation. Low latency.
- **Engineering simulation** — e.g. *N* battery modules + *N* engine components on a ship = a
  total, and *N* is consumed.
- **Data balance service** — tune game balance from a web admin (e.g. change an engine component
  from 10 kW to 8 kW).
- **Economy service** — money transfers between players, mission payouts…
- **Dialog (audio & text)** — in‑game dialogs (NPC↔player, NPC↔NPC…).
- **Industrial simulation** — industrial processes such as refining.
- **Missions** — mission management (connects to many other services).
- **User description / reputation** — user descriptions and reputation (players & NPCs).
- **Weather** — weather on planets. High latency.
