---
title: "Blueprint Plans and Scene Creation"
description: "Understanding how to build game scenes using Blueprint Plans in Bappa"
lead: ""
date: 2024-11-18T10:00:00+00:00
lastmod: 2024-11-18T10:00:00+00:00
draft: false
images: []
weight: 300
toc: true
---

In Bappa, a Blueprint Plan serves as the foundation for scene creation. Plans are functions that define how to initialize all the entities, components, and state that will make up a scene when it's loaded. The actual scene isn't created until the plan is executed during the loading process. Understanding how to effectively create and structure these plans is essential for building well-organized games that load efficiently.

## The Signature

A Blueprint Plan is a Go function with this signature:

```go
type Plan func(height, width int, storage warehouse.Storage) error
```

This function receives:

- `height` and `width`: The dimensions of the scene
- `storage`: The ECS storage where all entities and components will be stored

The plan's job is to:

- Create archetypes (templates for entities with specific component collections)
- Generate entities from those archetypes with initial component values
- Set up the complete initial state of your scene

{{< callout context="note" title="Loading State from External Files" icon="outline/info-circle" >}}
If you need to load state from external files, the plan function is the ideal place to implement this. Please note that currently only assets are loaded asynchronously and concurrently. When building your implementation, design your code with this limitation in mind.
{{< /callout >}}

## Creating Your First Blueprint Plan

Here's a simple pseudo example of a Blueprint Plan that creates a basic platformer level:

```go
func SimplePlatformerLevel(height, width int, sto warehouse.Storage) error {
    // Create player archetype
    playerArchetype, err := sto.NewOrExistingArchetype(
        blueprintspatial.Components.Position,
        blueprintclient.Components.SpriteBundle,
        blueprintspatial.Components.Direction,
        blueprintinput.Components.InputBuffer,
        blueprintclient.Components.CameraIndex,
        blueprintspatial.Components.Shape,
        blueprintmotion.Components.Dynamics,
    )
    if err != nil {
        return err
    }

    // Generate player entity
    err = playerArchetype.Generate(1,
        blueprintspatial.NewPosition(180, 180),
        blueprintspatial.NewRectangle(18, 58),
        blueprintmotion.NewDynamics(10),
        blueprintspatial.NewDirectionRight(),
        blueprintinput.InputBuffer{ReceiverIndex: 0},
        blueprintclient.CameraIndex(0),
        blueprintclient.NewSpriteBundle().
            AddSprite("characters/player.png", true).
            WithAnimations(animations.IdleAnimation, animations.RunAnimation).
            SetActiveAnimation(animations.IdleAnimation),
    )
    if err != nil {
        return err
    }

    // Create and add terrain elements
    err = addTerrain(sto)
    if err != nil {
        return err
    }

    return nil
}
```

This plan initializes a scene with a player character and terrain elements. It demonstrates the basic pattern of creating archetypes, generating entities, and organizing related functionality into helper functions.

## Understanding Archetypes

Archetypes are a fundamental concept in Bappa's ECS implementation. An archetype defines a unique combination of component types that a group of entities will share.

```go
// Creating an archetype for terrain entities
terrainArchetype, err := sto.NewOrExistingArchetype(
    components.TerrainTag,
    blueprintclient.Components.SpriteBundle,
    blueprintspatial.Components.Shape,
    blueprintspatial.Components.Position,
)
```

Benefits of archetypes:

- **Performance**: Entities with the same components are stored together in memory for efficient processing
- **Organization**: They provide a clear template for different types of game objects
- **Reusability**: You can create multiple similar entities from the same archetype

When you call `NewOrExistingArchetype()`, Bappa checks if an archetype with that exact component combination already exists. If it does, that archetype is returned; otherwise, a new one is created.

## Generating Entities

Once you have an archetype, you can create entities from it using the `Generate()` method:

```go
// Generate a floor entity
err = terrainArchetype.Generate(1,
    blueprintspatial.NewPosition(400, 470),
    blueprintspatial.NewRectangle(800, 50),
    blueprintclient.NewSpriteBundle().
        AddSprite("terrain/floor.png", true).
        WithOffset(vector.Two{X: -400, Y: -25}),
)
```

The `Generate()` method accepts:

1. The number of entities to create
2. Initial component values for those entities

You can create multiple entities at once by specifying a count greater than 1, which is useful for things like particle systems or large groups of similar objects.

## Registering Scenes with Blueprint Plans

Once you've created your Blueprint Plan, you need to register it with the client.

```go
func main() {
    client := coldbrew.NewClient(640, 360, 10, embeddedFS)

    // Configure client
    client.SetTitle("My Platformer Game")
    client.SetWindowSize(1280, 720)

    // Register render systems, client systems, and core systems
    // (Details about systems will be covered in the next documentation section)
    renderSystems := []coldbrew.RenderSystem{/* ... */}
    clientSystems := []coldbrew.ClientSystem{/* ... */}
    coreSystems := []blueprint.CoreSystem{/* ... */}

    // Register the scene with its Blueprint Plan
    err := client.RegisterScene(
        "Level1",                // Scene name
        640, 360,                // Scene dimensions
        SimplePlatformerLevel,   // Blueprint Plan function
        renderSystems,           // Render systems
        clientSystems,           // Client systems
        coreSystems,             // Core systems
    )
    if err != nil {
        log.Fatal(err)
    }

    // Start the game
    if err := client.Start(); err != nil {
        log.Fatal(err)
    }
}
```

## Best Practices

As scenes become more complex, organizing your Blueprint Plans becomes essential. Here are some patterns to help structure your code:

### Helper Functions for Related Entities

Break down your plan into smaller, focused functions that handle specific parts of the scene:

```go
func GameLevel(height, width int, sto warehouse.Storage) error {
    // Create main player
    if err := createPlayer(sto); err != nil {
        return err
    }

    // Create environment
    if err := createTerrain(sto); err != nil {
        return err
    }

    // Create enemies
    if err := createEnemies(sto); err != nil {
        return err
    }

    // Create collectibles
    if err := createCollectibles(sto); err != nil {
        return err
    }

    // Create background elements
    if err := createBackground(sto); err != nil {
        return err
    }

    return nil
}
```

This approach makes your main plan function readable at a glance while keeping related entity creation grouped together.

### Reusable Entity Creation Functions

For entity types that appear in multiple scenes, create reusable functions:

```go
// Create a standard platform at the specified position
func createPlatform(sto warehouse.Storage, x, y float64, width float64) error {
    platformArchetype, err := sto.NewOrExistingArchetype(
        components.PlatformTag,
        blueprintspatial.Components.Position,
        blueprintspatial.Components.Shape,
        blueprintclient.Components.SpriteBundle,
    )
    if err != nil {
        return err
    }

    return platformArchetype.Generate(1,
        blueprintspatial.NewPosition(x, y),
        blueprintspatial.NewRectangle(width, 16),
        blueprintclient.NewSpriteBundle().
            AddSprite("terrain/platform.png", true).
            WithOffset(vector.Two{X: -width/2, Y: -8}),
    )
}
```

These functions can be shared across different scene plans, promoting code reuse.

### Save Common Compositions for Reuse

When creating common archetypes often it's helpful to save the component composition for direct reuse (or as a building block).

First you create the composition:

```go{title="scenes/compositions.go"}
package scenes

import (
 "github.com/TheBitDrifter/bappacreate/templates/topdown/components"
 blueprintclient "github.com/TheBitDrifter/blueprint/client"
 blueprintinput "github.com/TheBitDrifter/blueprint/input"
 blueprintmotion "github.com/TheBitDrifter/blueprint/motion"
 blueprintspatial "github.com/TheBitDrifter/blueprint/spatial"
 "github.com/TheBitDrifter/warehouse"
)

// These are slices of common component compositions for various archetypes.
// Components can still be added or removed dynamically at runtime

var PlayerComposition = []warehouse.Component{
 blueprintspatial.Components.Position,
 blueprintmotion.Components.Dynamics,
 blueprintclient.Components.SpriteBundle,
 blueprintinput.Components.InputBuffer,
 blueprintclient.Components.CameraIndex,
 blueprintspatial.Components.Shape,
 blueprintclient.Components.SoundBundle,
 blueprintspatial.Components.Direction,
 components.DirectionEightComponent,
}
// ...
```

Then you use them:

```go{title="helpers.go"}
func NewPlayer(sto warehouse.Storage) error {
 playerArchetype, err := sto.NewOrExistingArchetype(
  PlayerComposition...,   // Use the composition slice directly
 )
}

func (sto warehouse.Storage) error {
 playerArchetype, err := sto.NewOrExistingArchetype(
  PlayerComposition...,   // Use the composition slice directly
 )
  // ... rest
}
func NewRamp(sto warehouse.Storage, x, y float64) error {
 // Augment the composition as needed
 composition := []warehouse.Component{
  blueprintclient.Components.SpriteBundle,
 }

 // Then use the augmented version
 composition = append(composition, BlockTerrainComposition...)
 rampArche, err := sto.NewOrExistingArchetype(composition...)
 if err != nil {
  return err
 }
  // ... rest
}
```

### Using Tags for Entity Categories

```go
// Define tag components
var TerrainTag = warehouse.FactoryNewComponent[struct{}]()
var PlatformTag = warehouse.FactoryNewComponent[struct{}]()
var EnemyTag = warehouse.FactoryNewComponent[struct{}]()

// Use tags when creating archetypes
terrainArchetype, err := sto.NewOrExistingArchetype(
    TerrainTag,  // Identify this as terrain
    // Other components...
)
```

Tags are special components that contain no data but serve to categorize entities:
Tags are useful for:

- Categorizing entities for easier querying
- Creating special behavior for specific entity types
- Implementing game mechanics (e.g., DestroyableTag, InteractableTag)

### Organization

1. **Logical Grouping**: Organize entity creation by type or function (players, terrain, enemies, etc.)
2. **Helper Functions**: Break complex plans into smaller, focused helper functions
3. **Error Handling**: Check and return errors at each step to ensure proper initialization
4. **Clear Naming**: Use descriptive names for helper functions and variables

### Maintainability

1. **Separate Files**: Place complex helper functions in separate files to keep your code organized
2. **Standardized Patterns**: Develop consistent patterns for entity creation across your codebase
3. **Config Values**: Consider extracting magic numbers into named constants for easier tweaking
4. **Comments**: Document the purpose and behavior of complex entity setups

## Conclusion

Blueprint Plans are the foundation of scene creation in Bappa. By mastering the techniques and patterns presented in this guide, you'll be able to create well-organized, efficient, and maintainable game scenes.

In the next documentation section, we'll explore Systems in detail - the logic that brings your game entities to life.
