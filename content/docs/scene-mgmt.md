---
title: "Scene Management and Transitions in Bappa"
description: "How to manage multiple scenes, scene transitions, and entity transfer in Bappa games"
lead: ""
date: 2025-03-06T10:00:00+00:00
lastmod: 2025-03-06T10:00:00+00:00
draft: false
images: []
weight: 900
toc: true
---

Bappa provides a powerful scene management system that allows you to organize your game into discrete, manageable scenes. The framework supports multiple concurrent scenes, enabling sophisticated gameplay scenarios like split-screen multiplayer, mini-maps, level transitions, and more.

## Understanding Scenes in Bappa

A scene in Bappa is a self-contained game world with its own entities, systems, and logic. Each scene:

- Has its own entity storage (`warehouse.Storage`)
- Can have unique dimensions (width and height)
- Maintains its own loading and activation state
- Has dedicated rendering and logic systems
- Executes its own blueprint plan when initialized

## Scene Lifecycles

Scenes in Bappa go through several states during their lifecycle:

1. **Registered**: Added to the scene cache but not necessarily active. The Blueprint Plan (initialization function) hasn't executed yet, and assets aren't loaded
2. **Loading**: Loading assets but not ready for gameplay
3. **Active**: Currently running and interacting with other systems
4. **Inactive**: May remain in cache but isn't being updated or rendered

## Scene Management Core APIs

Bappa provides several key APIs for managing scenes:

### Scene Registration

```go
// Register a new scene with the client
err := client.RegisterScene(
    "LevelOne",                // Scene name
    640, 360,                  // Scene dimensions
    levelOnePlan,              // Blueprint Plan function
    renderSystems,             // Render systems
    clientSystems,             // Client systems
    coreSystems,               // Core systems
)
```

### Scene Activation

The key to Bappa's multi-scene capabilities is the `ActivateScene` method:

```go
// Activate a scene alongside an already active one
// optionally transferring entities between them
err := client.ActivateScene(
    targetScene,   // Scene to activate
    entityToTransfer, // Optional entity to transfer (can be multiple)
)
```

This method:

- Adds the target scene to the active scenes list
- Keeps the origin scene active
- Optionally transfers specified entities from origin to target

### Scene Deactivation

```go
// Remove a scene from the active scenes list
client.DeactivateScene(targetScene)
```

### Scene Transition (Complete Replacement)

When you want to replace the current scene entirely:

```go
// Replace the current active scene with a new one
// optionally transferring entities
err := client.ChangeScene(
    targetScene,      // Scene to activate
    entityToTransfer, // Optional entity to transfer
)
```

This method:

- Replaces the current active scene with the target scene
- Only works when exactly one scene is active
- Optionally transfers specified entities from origin to target

## Implementing a Scene Transfer System

Let's examine a simple approach for transferring players between scenes:

```go

func (basicTransferSystem) Run(cli coldbrew.Client) error {
 var pending []transfer

 for activeScene := range cli.ActiveScenes() {
  if !activeScene.Ready() {
   continue
  }
  cursor := activeScene.NewCursor(blueprint.Queries.CameraIndex)
  for range cursor.Next() {
   if inpututil.IsKeyJustPressed(ebiten.Key1) {

    currentPlayerEntity, err := cursor.CurrentEntity()
    if err != nil {
     return err
    }

    // --- Determine target scene ---
    // Simple toggle between scenes
    var sceneTargetName string
    if activeScene.Name() == sceneOneName {
     sceneTargetName = sceneTwoName
    } else {
     sceneTargetName = sceneOneName
    }

    transfer := transfer{
     targetSceneName: sceneTargetName,
     playerEntity:    currentPlayerEntity,
    }
    pending = append(pending, transfer)
   }
  }
 }

 for _, transfer := range pending {
  cli.ChangeSceneByName(transfer.targetSceneName, transfer.playerEntity)
 }

 return nil
}
```

This example demonstrates several important concepts:

1. **Cooldown Mechanism**: A simple way to prevent rapid or accidental scene changes
2. **Two-Pass Approach**: Collecting all transfers before applying them - a pattern born from necessity but valuable by design
3. **Scene Cleanup**: Basic deactivation of scenes that no longer have players

{{< callout context="note" title="Technical Limitation → Best Practice" icon="outline/info-circle" >}}

The two-pass approach shown here is _required_ because you can't call `ActivateScene()` while iterating through a cursor (the storage is locked during iteration). However, this limitation leads us to a design pattern that's widely considered best practice in game systems anyway.

{{< /callout >}}

## 1. Camera Management Across Scenes

When working with multiple scenes, you need to manage which cameras are assigned to which scenes:

### Automatic Approach

- Use default `coldbrew` `CameraSceneAssignerSystem` with `client`:

  ```go
  // Register the built-in camera assigner system
  client.RegisterGlobalClientSystem(&clientsystems.CameraSceneAssignerSystem{})

  // In your scene Blueprint Plan, create entities with CameraIndex components
  func MyScenePlan(height, width int, sto warehouse.Storage) error {
      // Create player archetype with camera component
      playerArchetype, err := sto.NewOrExistingArchetype(
          spatial.Components.Position,
          client.Components.SpriteBundle,
          spatial.Components.Direction,
          input.Components.InputBuffer,
          client.Components.CameraIndex, // This links entities to cameras
          // Other components...
      )

      // Create player 1 with camera index 0
      err = playerArchetype.Generate(1,
          spatial.NewPosition(180, 180),
          client.CameraIndex(0), // This entity will be followed by camera 0
          input.InputBuffer{ReceiverIndex: 0}, // First player input
          // Other component values...
      )

      // Create player 2 with camera index 1 (for split-screen)
      err = playerArchetype.Generate(1,
          spatial.NewPosition(540, 180),
          client.CameraIndex(1), // This entity will be followed by camera 1
          input.InputBuffer{ReceiverIndex: 1}, // Second player input
          // Other component values...
      )

      // The CameraSceneAssignerSystem will automatically:
      // - Detect entities with CameraIndex components
      // - Assign the correct cameras to the scene containing those entities
      // - Handle split-screen layout for multiple active cameras

      return nil
  }
  ```

### Manual Approach (not recommended)

```go
// CameraSceneAssigner system example (simplified)
type CameraSceneAssigner struct{}

func (CameraSceneAssigner) Run(cli coldbrew.Client) error {
    // Get active scenes and cameras
    activeSceneCount := cli.SceneCount()
    cameras := cli.Cameras()

    // Assign first camera to first scene
    if activeSceneCount > 0 && cameras[0].Active() {
        cli.CameraSceneTracker()[cameras[0]] = coldbrew.CameraSceneRecord{
            Scene: cli.ActiveScene(0),
            Tick: cli.CurrentTick(),
        }
    }

    // Assign second camera to second scene if available
    if activeSceneCount > 1 && cameras[1].Active() {
        cli.CameraSceneTracker()[cameras[1]] = coldbrew.CameraSceneRecord{
            Scene: cli.ActiveScene(0),
            Tick: cli.CurrentTick(),
        }
    }

    return nil
}
```

## Scene Instantiation Patterns

### 1. Template-Based Scenes

Create scenes from reusable templates:

```go
// Define a scene template
func CreateLevelScene(levelNumber int, width, height int) blueprint.Plan {
    return func(sceneWidth, sceneHeight int, storage warehouse.Storage) error {
        // Common level setup...

        // Level-specific configuration
        levelData := LoadLevelData(levelNumber)

        // Generate entities based on level data
        for _, entityData := range levelData.Entities {
            CreateEntityFromData(storage, entityData)
        }

        return nil
    }
}

// Register scenes using the template
client.RegisterScene("Level1", 640, 360, CreateLevelScene(1, 640, 360), ...)
client.RegisterScene("Level2", 640, 360, CreateLevelScene(2, 640, 360), ...)
```

### 2. Procedural Scene Generation

Generate scenes procedurally:

```go
// Register a procedurally generated level scene
client.RegisterScene(
    "ProceduralLevel",
    640, 360,
    func(width, height int, storage warehouse.Storage) error {
        // Generate terrain procedurally
        seed := time.Now().UnixNano()
        terrain := GenerateTerrain(seed, width, height)

        // Create entities based on procedural data
        for _, point := range terrain.SpawnPoints {
            // Create enemies, items, etc.
        }

        return nil
    },
    renderSystems,
    clientSystems,
    coreSystems,
)
```

## Implementation Constraints and Best Practices

### Storage Locking During Entity Iteration

One of the most important constraints to understand when managing scenes in Bappa is storage locking:

```go
// ❌ This will FAIL - never do this!
cursor := scene.NewCursor(someQuery)
for cursor.Next() {
    // Get entity
    entity, _ := cursor.CurrentEntity()

    // WRONG: This will cause panic because storage is locked during cursor iteration
    client.ActivateScene(newScene, entity)
}

// ✅ This is correct - two-pass approach
var entitiesToTransfer []warehouse.Entity
cursor := scene.NewCursor(someQuery)
for cursor.Next() {
    // Collect entities to transfer
    entity, _ := cursor.CurrentEntity()
    entitiesToTransfer = append(entitiesToTransfer, entity)
}
// Now storage is unlocked, safe to transfer entities
for _, entity := range entitiesToTransfer {
    client.ActivateScene(newScene, entity)
}
```

The reason for this constraint is that:

1. When a cursor is iterating through entities, it locks the underlying storage to prevent modifications that would invalidate the iteration
2. Transferring entities between scenes requires modifying the storage (removing from one, adding to another)
3. Attempting these operations while the storage is locked will result in an error

Always use a two-pass approach when transferring entities based on query results:

1. First collect the entities you want to transfer
2. Then transfer them after completing all cursor iterations

## Scene Management Performance Considerations

When working with multiple scenes, consider these performance factors:

1. **Active Scene Count**: Each active scene consumes resources and processing time
2. **Scene Size**: Larger scenes with many entities require more memory and processing
3. **Asset Duplication**: Shared assets between scenes are not duplicated in memory
4. **Scene Loading**: Loading happens asynchronously, but can still impact performance
5. **Transfer Overhead**: Moving entities between scenes has some overhead

Best practices:

- Limit the number of simultaneously active scenes (2-3 is usually sufficient)
- Deactivate scenes when they're not needed
- Consider using scene segmentation for large worlds (load/unload sections as needed)

## Conclusion

Bappa's multi-scene architecture provides exceptional flexibility for structuring your game. By leveraging the ability to have multiple active scenes simultaneously, you can create seamless transitions, split-screen experiences, and sophisticated game structures that would be challenging in single-scene engines.

The scene management API offers a clean, simple interface that hides the complexity of entity transfer and scene coordination, allowing you to focus on creating engaging gameplay experiences.

By understanding the principles and patterns covered in this guide, you can effectively organize your game into manageable scenes while maintaining smooth transitions and optimal performance.
