---
title: "Networking with Drip"
description: "How to implement multiplayer networking in Bappa games using the Drip package"
lead: "Learn how to create networked multiplayer games using Bappa's Drip package - a simple server-authoritative system without client-side prediction"
date: 2025-04-21T10:00:00+00:00
lastmod: 2025-04-21T10:00:00+00:00
draft: false
images: []
weight: 960
toc: true
---

The Bappa Framework includes the `drip` package for implementing multiplayer networking in your games. Drip provides a simple server-authoritative architecture that handles client connections, state synchronization, and input processing.

Currently, Drip is designed for basic multiplayer experiences with these key characteristics:

1. **Single scene support**: Drip currently supports networking for a single scene at a time (for now)
2. **No client-side prediction**: The implementation uses a pure server-authoritative model without client-side prediction
3. **Hybrid architecture**: Bappa's decoupled architecture allows games to easily support both single-player and multiplayer modes with minimal code changes

## Networking Architecture

Drip follows a server-authoritative architecture where:

1. The server maintains the authoritative game state
2. The server runs all core game systems (physics, collision, etc.)
3. Clients send inputs to the server
4. The server processes inputs and updates the game state
5. The server broadcasts state updates to all clients
6. Clients render the received state and handle local input processing

This architecture helps prevent cheating and ensures consistent gameplay across all clients.

## Server Implementation

### Setting Up a Server

Creating a Drip server requires a few key components:

```go
// Set up callbacks for entity creation and serialization
drip.Callbacks.NewConnectionCreateEntity = NewConnectionEntityCreate
drip.Callbacks.Serialize = SerializeCallback

// Create server configuration
config := drip.DefaultServerConfig()

// Create the server with systems
server := drip.NewServer(config, drip_seversystems.ActionBufferSystem{})

// Register a scene
err := server.RegisterScene(
    "MainScene",
    sceneWidth,
    sceneHeight,
    sceneSetupFunction,
    coreSystems,
)
if err != nil {
    log.Fatalf("Failed to register scene: %v", err)
}

// Start the server
if err := server.Start(); err != nil {
    log.Fatalf("Failed to start server: %v", err)
}
```

### Connection Entity Creation

When a client connects, you need to create an entity for them. This is handled by the `NewConnectionCreateEntity` callback:

```go
func NewConnectionEntityCreate(conn drip.Connection, s drip.Server) (warehouse.Entity, error) {
    // Get the active scene
    serverActiveScenes := s.ActiveScenes()
    if len(serverActiveScenes) == 0 {
        return nil, errors.New("No active scenes to find player spawn in")
    }
    scene := serverActiveScenes[0]
    storage := scene.Storage()

    // Find a spawn point in the scene
    query := warehouse.Factory.NewQuery().And(components.PlayerSpawnComponent)
    cursor := warehouse.Factory.NewCursor(query, storage)

    var spawn components.PlayerSpawn
    for range cursor.Next() {
        match := components.PlayerSpawnComponent.GetFromCursor(cursor)
        spawn = *match
        break
    }

    // Create a new player entity at the spawn point
    return scenes.NewPlayer(spawn.X, spawn.Y, storage)
}
```

### State Serialization

Drip uses the warehouse serialization system to send game state to clients. You need to implement a serialization callback:

```go
func SerializeCallback(scene drip.Scene) ([]byte, error) {
    // Query for entities that have input buffers (typically player-controlled)
    query := blueprint.Queries.ActionBuffer
    cursor := warehouse.Factory.NewCursor(query, scene.Storage())

    sEntities := []warehouse.SerializedEntity{}

    for range cursor.Next() {
        e, err := cursor.CurrentEntity()
        if err != nil {
            return nil, err
        }

        if !e.Valid() {
            continue
        }

        // Exclude client-specific components from serialization
        se := e.SerializeExclude(
            client.Components.SpriteBundle,
            client.Components.SoundBundle,
        )

        sEntities = append(sEntities, se)
    }

    // Create a serialized storage with all entities and the current tick
    serSto := warehouse.SerializedStorage{
        Entities:    sEntities,
        CurrentTick: scene.CurrentTick(),
        Version:     "net",
    }

    // Prepare for JSON marshaling
    stateForJson, err := warehouse.PrepareForJSONMarshal(serSto)
    if err != nil {
        return nil, err
    }

    // Marshal to JSON
    return json.Marshal(stateForJson)
}
```

### Server Systems

The server runs both core systems and special server systems. Core systems handle game logic, while server systems handle networking concerns:

```go
// ActionBufferSystem injects network-received actions into the core sim action buffers
type ActionBufferSystem struct{}

func (ActionBufferSystem) Run(s drip.Server) error {
    actionsToProcess := s.ConsumeAllActions()

    if len(actionsToProcess) > 0 {
        activeScenesCopy := s.ActiveScenes()

        // Process each action batch
        for _, item := range actionsToProcess {
            var targetEntity warehouse.Entity = nil
            var found bool = false

            // Find the target entity in active scenes
            for _, scene := range activeScenesCopy {
                potentialEntity, err := scene.Storage().Entity(int(item.TargetEntityID))
                if err == nil && potentialEntity.Valid() && potentialEntity.Recycled() == item.Recycled {
                    targetEntity = potentialEntity
                    found = true
                    break
                }
            }

            if !found {
                continue
            }

            // Get action buffer component
            actionBuffer := input.Components.ActionBuffer.GetFromEntity(targetEntity)
            if actionBuffer == nil {
                continue
            }

            // Verify receiver index matches
            if actionBuffer.ReceiverIndex != item.ReceiverIndex {
                continue
            }

            // Add the received actions to the entity's action buffer
            actionBuffer.AddBatch(item.Actions)
        }
    }
    return nil
}
```

## Client Implementation

### Setting Up a Network Client

On the client side, you need to create a `NetworkClient` instead of a regular client:

```go
// Create a network client
client := coldbrew.NewNetworkClient(
    resolutionX,
    resolutionY,
    maxSpritesCached,
    maxSoundsCached,
    maxScenesCached,
    embeddedFS,
)

// Set deserialization callback
client.SetDeserCallback(Deserializer)

// Configure client systems for networking
client.RegisterGlobalClientSystem(
    &coldbrew_clientsystems.InputSenderSystem{},
    coldbrew_clientsystems.InputBufferSystem{},
    &coldbrew_clientsystems.CameraSceneAssignerSystem{},
)

// Connect to server
err := client.Connect(serverAddress)
if err != nil {
    log.Fatalf("Failed to connect to server: %v", err)
}
```

### Deserialization Callback

You need to implement a deserialization callback to process state updates from the server:

```go
func Deserializer(nc coldbrew.NetworkClient, data []byte) error {
    // Get the active scene
    activeScenes := nc.ActiveScenes()
    var scene coldbrew.Scene
    for s := range activeScenes {
        scene = s
        break
    }

    if scene != nil && scene.Ready() {
        storage := scene.Storage()
        if storage != nil {
            // Unmarshal the JSON data
            var world warehouse.SerializedStorage
            err := json.Unmarshal(data, &world)
            if err != nil {
                return err
            }

            seen := map[int]struct{}{}

            // Process each entity in the update
            for _, se := range world.Entities {
                seen[int(se.ID)] = struct{}{}

                // Create or update the entity without affecting client-specific components
                en, err := storage.ForceSerializedEntityExclude(
                    se, client.Components.SoundBundle,
                    client.Components.SpriteBundle,
                )
                if err != nil {
                    return err
                }

                // Apply the server component values
                err = se.SetValue(en)
                if err != nil {
                    return err
                }

                // Add client-specific components if missing
                if !en.Table().Contains(client.Components.SpriteBundle) {
                    err := en.AddComponentWithValue(client.Components.SpriteBundle, DefaultSpriteBundle)
                    if err != nil {
                        return err
                    }

                    err = en.AddComponentWithValue(client.Components.SoundBundle, DefaultSoundBundle)
                    if err != nil {
                        return err
                    }
                }
            }

            // Remove entities that weren't in the server update
            purge := []warehouse.Entity{}
            query := blueprint.Queries.ActionBuffer
            cursor := scene.NewCursor(query)

            for range cursor.Next() {
                e, _ := cursor.CurrentEntity()
                if _, ok := seen[int(e.ID())]; !ok {
                    purge = append(purge, e)
                }
            }

            err = storage.DestroyEntities(purge...)
            if err != nil {
                return err
            }

            // Update client tick to match server
            coldbrew.ForceSetTick(world.CurrentTick)
        }
    }
    return nil
}
```

### Input Sender System

The `InputSenderSystem` collects inputs from local receivers and sends them to the server:

```go
// InputSenderSystem collects inputs and sends them to the server
type InputSenderSystem struct{}

func (s InputSenderSystem) Run(cli coldbrew.Client) error {
    networkCli, ok := cli.(coldbrew.NetworkClient)
    if !ok || !networkCli.IsConnected() {
        return nil
    }

    // Check each potential receiver slot
    for i := 0; i < coldbrew.MaxSplit; i++ {
        receiver := cli.Receiver(i)
        if !receiver.Active() {
            continue
        }

        // Get actions since last frame
        poppedActions := receiver.PopActions()
        if len(poppedActions) == 0 {
            continue
        }

        // Construct message payload
        message := input.ClientActionMessage{
            ReceiverIndex: i,
            Actions:       poppedActions,
        }

        // Serialize to JSON
        jsonData, err := json.Marshal(message)
        if err != nil {
            continue
        }

        // Send to server
        err = networkCli.Send(jsonData)
        if err != nil {
            log.Printf("Error sending input: %v", err)
        }
    }
    return nil
}
```

### Optimizing State Updates

For better performance, consider these optimizations:

1. **Selective Entity Serialization**: Only serialize entities that are relevant to clients
2. **Component Filtering**: Exclude components that don't need network synchronization
3. **Delta Compression**: Only send entities that have changed since the last update
4. **Area of Interest**: Only send entities that are within a certain distance of the player

### Handling Latency

Drip uses a simple server-authoritative model without client-side prediction, which means:

1. Inputs sent from the client experience full round-trip latency
2. The client does not predict the results of inputs
3. The server is the authoritative source of truth for all game state
4. The client simply renders the state it receives from the server

This approach is simple to implement and prevents cheating, but it does result in perceptible input lag, especially on higher-latency connections. For a more responsive feel in latency-sensitive games, you would need to implement additional techniques like client-side prediction and server reconciliation, which are not currently built into Drip.

## Example Networking Setup

### Server-Side Configuration

```go
package main

import (
    "log"
    "os"
    "os/signal"
    "syscall"

    "github.com/TheBitDrifter/bappa/drip"
    "github.com/TheBitDrifter/bappa/drip/drip_seversystems"
    "mygame/shared/coresystems"
    "mygame/shared/scenes"
)

func main() {
    // Register callbacks
    drip.Callbacks.NewConnectionCreateEntity = NewConnectionEntityCreate
    drip.Callbacks.Serialize = SerializeCallback

    // Create server config
    config := drip.DefaultServerConfig()
    config.Port = 8080
    config.TPS = 60

    // Create server
    server := drip.NewServer(config, drip_seversystems.ActionBufferSystem{})

    // Register a scene
    err := server.RegisterScene(
        scenes.MainScene.Name,
        scenes.MainScene.Width,
        scenes.MainScene.Height,
        scenes.MainScene.Plan,
        coresystems.DefaultCoreSystems,
    )
    if err != nil {
        log.Fatalf("Failed to register scene: %v", err)
    }

    // Start the server
    if err := server.Start(); err != nil {
        log.Fatalf("Failed to start server: %v", err)
    }

    // Wait for interrupt signal
    quit := make(chan os.Signal, 1)
    signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)
    log.Println("Server running. Press Ctrl+C to stop.")
    <-quit

    // Shutdown gracefully
    log.Println("Shutting down server...")
    if err := server.Stop(); err != nil {
        log.Printf("Error stopping server: %v", err)
    }
}
```

### Client-Side Configuration

```go
package main

import (
    "log"

    "github.com/TheBitDrifter/bappa/coldbrew"
    "github.com/TheBitDrifter/bappa/coldbrew/coldbrew_clientsystems"
    "github.com/TheBitDrifter/bappa/coldbrew/coldbrew_rendersystems"
    "mygame/shared/actions"
    "mygame/shared/scenes"
    "mygame/sharedclient/assets"
    "mygame/sharedclient/clientsystems"
    "mygame/sharedclient/rendersystems"
    "github.com/hajimehoshi/ebiten/v2"
)

func main() {
    // Create network client
    client := coldbrew.NewNetworkClient(
        640, 360,  // Resolution
        100, 50, 10,  // Cache sizes
        assets.FS,
    )

    // Set deserializer callback
    client.SetDeserCallback(Deserializer)

    // Configure client
    client.SetTitle("Networked Game")
    client.SetResizable(true)

    // Register scene
    err := client.RegisterScene(
        scenes.MainScene.Name,
        scenes.MainScene.Width,
        scenes.MainScene.Height,
        scenes.MainScene.Plan,
        rendersystems.DefaultRenderSystems,
        clientsystems.DefaultClientSystemsNetworked,
        []blueprint.CoreSystem{},  // Core systems run on server only
    )
    if err != nil {
        log.Fatalf("Failed to register scene: %v", err)
    }

    // Register global systems
    client.RegisterGlobalRenderSystem(
        coldbrew_rendersystems.GlobalRenderer{},
    )
    client.RegisterGlobalClientSystem(
        &coldbrew_clientsystems.InputSenderSystem{},
        coldbrew_clientsystems.InputBufferSystem{},
        &coldbrew_clientsystems.CameraSceneAssignerSystem{},
    )

    // Set up input
    camera, _ := client.ActivateCamera()
    receiver, _ := client.ActivateReceiver()
    receiver.RegisterKey(ebiten.KeyW, actions.Jump)
    receiver.RegisterKey(ebiten.KeyA, actions.Left)
    receiver.RegisterKey(ebiten.KeyD, actions.Right)

    // Connect to server
    err = client.Connect("localhost:8080")
    if err != nil {
        log.Fatalf("Failed to connect: %v", err)
    }
    defer client.Disconnect()

    // Start game loop
    if err := client.Start(); err != nil {
        log.Fatalf("Game exited with error: %v", err)
    }
}
```

Notice that we register an empty slice of core systems (`[]blueprint.CoreSystem{}`). This is because in a networked setup, the core systems (physics, collision, etc.) only run on the server side. The client only renders the state and sends inputs. Allowing the client to also run the coresystems would be the first step
for prediction, but it's not currently tested/setup.

## Hybrid Architecture: Supporting Both Single-Player and Multiplayer

One of the significant advantages of Bappa's architecture is how easily games can support both single-player and multiplayer modes without massive code changes. This is possible because:

1. **Shared Core Systems**: The same core systems can run either on a standalone client or a server
2. **Scene Definitions**: The same scene definitions can be used in both modes
3. **Component-Based Design**: The ECS architecture keeps data and behavior separate

### Example: System Registration Differences

```go
// Single-player mode: Core systems run locally
client.RegisterScene(
    scenes.MainScene.Name,
    scenes.MainScene.Width,
    scenes.MainScene.Height,
    scenes.MainScene.Plan,
    rendersystems.DefaultRenderSystems,
    clientsystems.DefaultClientSystems,  // Standalone client systems
    coresystems.DefaultCoreSystems,      // Core systems run locally
)

// Multiplayer mode: Core systems run on server only
client.RegisterScene(
    scenes.MainScene.Name,
    scenes.MainScene.Width,
    scenes.MainScene.Height,
    scenes.MainScene.Plan,
    rendersystems.DefaultRenderSystems,
    clientsystems.DefaultClientSystemsNetworked,  // Network-aware client systems
    []blueprint.CoreSystem{},                     // No core systems (run on server)
)
```

This design allows you to:

- Prototype in single-player mode for quick iteration
- Share most code between single-player and multiplayer
- Test features locally before implementing networked versions

## Conclusion

The Drip package provides a simple foundation for implementing multiplayer networking in your Bappa games. By leveraging the warehouse serialization system for state synchronization and implementing proper client-server architecture, you can create basic multiplayer experiences with a server-authoritative model.

Currently, Drip has several limitations to be aware of:

- Support for only a single active scene
- No built-in client-side prediction (resulting in perceptible input lag)
- Basic TCP-based networking without optimization for high packet rates

Despite these limitations, the server-authoritative approach provided by Drip offers a good balance between simplicity, security, and implementation ease for many types of games. For games where responsiveness is critical, you would need to extend this foundation with more advanced techniques like prediction, interpolation, and delta compression.
