---
title: "Entity Serialization and Persistence"
description: "How to save and load entities to/from JSON in the Bappa Framework"
lead: "Learn how to implement save/load functionality in your Bappa games using the warehouse serialization system"
date: 2025-04-21T10:00:00+00:00
lastmod: 2025-04-21T10:00:00+00:00
draft: false
images: []
weight: 930
toc: true
---

The Bappa Framework's warehouse package includes a powerful serialization system that allows you to convert entities and their components to JSON and back. This enables save/load functionality, game state persistence, and data transfer between different parts of your application.

## Serialization Overview

The serialization system provides two main capabilities:

1. **Entity Serialization**: Convert entities and their components to a JSON-compatible format
2. **Storage Serialization**: Save and load entire entity collections to/from disk

The system handles component type registration, component data conversion, and entity reference preservation automatically, making it straightforward to implement save/load functionality in your games.

## Basic Usage

### Saving Game State

To save your game's entity state to a file:

```go
// Save all entities in the storage to a file
err := warehouse.SaveStorage(storage, "savegame.json", currentTick)
if err != nil {
    log.Fatalf("Failed to save game: %v", err)
}
```

The `SaveStorage` function serializes the entire storage (including all entities and their components) and writes it to the specified file. The `currentTick` parameter allows you to store the current game tick for time-based systems.

### Loading Game State

To load a previously saved game state:

```go
// Load serialized data from a file
serializedWorld, err := warehouse.LoadStorage("savegame.json")
if err != nil {
    log.Fatalf("Failed to load game: %v", err)
}

// Create a new storage or use an existing one
schema := table.Factory.NewSchema()
storage := warehouse.Factory.NewStorage(schema)

// Deserialize the data into the storage
storage, err = warehouse.DeserializeStorage(storage, serializedWorld)
if err != nil {
    log.Fatalf("Failed to deserialize game: %v", err)
}
```

## Advanced Serialization Features

### Selective Entity Serialization

Sometimes you may want to serialize only specific entities or components. The `SerializeInclude` and `SerializeExclude` methods allow for more granular control:

```go
// Serialize an entity including only specific components
serializedEntity := entity.SerializeInclude(
    positionComponent,
    healthComponent,
)

// Serialize an entity excluding specific components
serializedEntity := entity.SerializeExclude(
    temporaryEffectsComponent,
    debugComponent,
)
```

### Non-Destructive Updates

The deserialization system supports non-destructive updates, meaning you can update existing entities rather than replacing them entirely. This is particularly useful for implementing:

- Partial saves/loads
- Incremental state updates
- Mod patches that modify specific entities

```go
// Deserialize without purging existing entities not in the serialized data
storage, err = warehouse.DeserializeStorageNoPurge(storage, serializedWorld)
```

### Entity References

The serialization system automatically handles entity references within components. If a component stores a reference to another entity (via its `EntryID`), that reference will be correctly maintained when deserializing:

```go
// Example component with an entity reference
type Relationship struct {
    ParentID table.EntryID
}
```

When serializing and deserializing, the entity IDs are preserved, ensuring that relationships between entities remain intact.

## Type Registration

The framework automatically registers component types when they're created. This registration is essential for the serialization system to properly map component types during deserialization.

```go
// Component types are registered automatically when created
positionComp := warehouse.FactoryNewComponent[Position]()
velocityComp := warehouse.FactoryNewComponent[Velocity]()
```

If you create multiple components with the same underlying structure, ensure they use type aliases to distinguish them during serialization:

```go
// Use type aliases to distinguish similar components
type Position struct { X, Y float64 }
type StartPosition Position  // Alias type
```

## Serialization Format

The serialized data is stored in JSON format with the following structure:

```json
{
  "version": "1.0",
  "current_tick": 1234,
  "entities": [
    {
      "id": 1,
      "recycled": 0,
      "components": ["Position", "Velocity"],
      "data": {
        "Position": { "X": 10.0, "Y": 20.0 },
        "Velocity": { "X": 1.0, "Y": 2.0 }
      }
    },
    {
      "id": 5,
      "recycled": 0,
      "components": ["Position", "Health", "Player"],
      "data": {
        "Position": { "X": 50.0, "Y": 60.0 },
        "Health": { "Current": 100, "Max": 100 },
        "Player": {}
      }
    }
  ]
}
```

## Performance Considerations

When working with serialization, keep these performance considerations in mind:

1. **File Size**: The JSON format prioritizes readability over compactness. For very large game states, consider implementing compression.

2. **Serialization Frequency**: Frequent serialization of large storages can impact performance. Consider serializing only when necessary (e.g., during explicit save points).

3. **Selective Serialization**: Use the selective serialization methods to reduce the amount of data being processed.

## Example: Implementing Save/Load in a Game

Here's a complete example showing how to implement save/load functionality in a simple game:

```go
package main

import (
    "log"
    "os"

    "github.com/TheBitDrifter/bappa/blueprint/vector"
    "github.com/TheBitDrifter/bappa/table"
    "github.com/TheBitDrifter/bappa/warehouse"
)

// Game components
type Position struct {
    X, Y float64
}

type Health struct {
    Current, Max int
}

type PlayerTag struct{}

func main() {
    // Create storage
    schema := table.Factory.NewSchema()
    storage := warehouse.Factory.NewStorage(schema)

    // Create components
    posComp := warehouse.FactoryNewComponent[Position]()
    healthComp := warehouse.FactoryNewComponent[Health]()
    playerTagComp := warehouse.FactoryNewComponent[PlayerTag]()

    // Create a player entity
    playerEntities, err := storage.NewEntities(1, posComp, healthComp, playerTagComp)
    if err != nil {
        log.Fatalf("Failed to create player: %v", err)
    }
    player := playerEntities[0]

    // Set initial values
    pos := posComp.GetFromEntity(player)
    health := healthComp.GetFromEntity(player)
    pos.X = 100
    pos.Y = 200
    health.Current = 100
    health.Max = 100

    // Save the game
    err = warehouse.SaveStorage(storage, "savegame.json", 0)
    if err != nil {
        log.Fatalf("Failed to save game: %v", err)
    }
    log.Println("Game saved successfully!")

    // Simulate player movement and damage
    pos.X += 50
    pos.Y += 25
    health.Current -= 30

    // Load the saved game (which will revert the changes)
    serializedWorld, err := warehouse.LoadStorage("savegame.json")
    if err != nil {
        log.Fatalf("Failed to load game: %v", err)
    }

    // Create a new storage for the loaded data
    newSchema := table.Factory.NewSchema()
    loadedStorage := warehouse.Factory.NewStorage(newSchema)

    // Deserialize the data
    loadedStorage, err = warehouse.DeserializeStorage(loadedStorage, serializedWorld)
    if err != nil {
        log.Fatalf("Failed to deserialize game: %v", err)
    }
    log.Println("Game loaded successfully!")

    // Verify the loaded data
    loadedPlayer, err := loadedStorage.Entity(int(player.ID()))
    if err != nil {
        log.Fatalf("Failed to get player: %v", err)
    }

    loadedPos := posComp.GetFromEntity(loadedPlayer)
    loadedHealth := healthComp.GetFromEntity(loadedPlayer)

    log.Printf("Loaded player position: (%v, %v)", loadedPos.X, loadedPos.Y)
    log.Printf("Loaded player health: %v/%v", loadedHealth.Current, loadedHealth.Max)
}
```

## Internal Implementation Details

### PrepareForJSONMarshal

The `PrepareForJSONMarshal` function handles special cases during serialization:

```go
// Convert Go structures to JSON-compatible formats
stateForJson, err := warehouse.PrepareForJSONMarshal(serSto)
if err != nil {
    return nil, err
}
// Now safe to marshal to JSON
jsonData, err := json.Marshal(stateForJson)
```

This function:

1. Handles special float values like `Infinity` and `NaN`
2. Converts structs to maps for JSON compatibility
3. Processes nested structures recursively

### ForceSerializedEntity

For advanced use cases where you need to create entities with specific IDs:

```go
// Create or update an entity with the exact ID from serialized data
entity, err := storage.ForceSerializedEntity(serializedEntity)
```

This method ensures that entity IDs are preserved during deserialization, which is essential for maintaining entity references.

## Best Practices

1. **Component Design**: Design your components with serialization in mind. Use basic Go types that can be easily converted to/from JSON.

2. **Error Handling**: Always check for errors during serialization and deserialization. File I/O can fail for various reasons.

3. **Versioning**: Add version information to your saved data to handle format changes over time.

4. **Testing**: Thoroughly test your serialization code, especially with complex component structures and entity relationships.

5. **Security**: If loading save files from untrusted sources, implement validation to prevent potential exploits.

## Conclusion

The warehouse serialization system provides a robust foundation for implementing save/load functionality in your Bappa games. By leveraging these capabilities, you can create games with persistent state, implement save points, and even support modding through external data files.

For more advanced serialization needs, you can extend the system with custom component serialization, compression, or encryption as required for your specific game.
