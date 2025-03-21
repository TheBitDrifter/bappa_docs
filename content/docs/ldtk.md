---
title: "LDTK Integration"
description: "How to use the LDTK level editor with your Bappa games"
lead: "Integrate the Level Designer Toolkit (LDTK) into your Bappa games for powerful level design capabilities."
date: 2025-03-21T10:00:00+00:00
lastmod: 2025-03-21T10:00:00+00:00
draft: false
images: []
weight: 910
toc: true
---

## Introduction to LDTK

[Level Designer Toolkit (LDTK)](https://ldtk.io/) is a modern, open-source level editor that makes creating game levels fast and intuitive. LDTK provides a powerful visual interface for designing levels, with support for:

- Tile layers
- Entity placement
- Int grid layers (for collision and other metadata)
- Auto-tiling rules
- Multi-layered level design

Bappa's LDTK integration allows you to harness these capabilities while maintaining the component-based architecture that makes Bappa powerful.

## Getting Started

### Prerequisites

- The standard Bappa game engine setup
- [LDTK editor](https://ldtk.io/) installed on your development machine

### Project Structure

When using LDTK with Bappa, your project will typically include:

```
your-game/
├── ldtk/
│   ├── data.ldtk         # Your LDTK project file
├── scenes/
│   ├── scene.go          # Scene definitions
│   ├── scene_one.go      # Individual scene plans
│   └── scene_two.go
└── assets/
    └── images/
        └── tilesets/     # Tilesets referenced by LDTK
```

Ideally all asset files that your LDTK project references will be in the local asset folder.

## Creating the LDTK Project

### Basic Setup

1. Design your levels using the LDTK editor
2. Save your LDTK project file as `ldtk/data.ldtk`
3. Reference your tilesets from the `assets/images/tilesets` directory

### Embedding the LDTK Data

In your `ldtk/ldtk.go` file:

```go
package ldtk

import (
 "embed"
 "log"

 blueprintldtk "github.com/TheBitDrifter/blueprint/ldtk"
)

//go:embed data.ldtk
var data embed.FS

var DATA = func() *blueprintldtk.LDtkProject {
 project, err := blueprintldtk.Parse(data, "./ldtk/data.ldtk")
 if err != nil {
  log.Fatal(err)
 }
 return project
}()
```

This loads your LDTK project file and makes it available to your game code.

## Loading LDTK Levels in Bappa

### Creating Scene Plans

Create a scene plan that loads your LDTK level:

```go
package scenes

import (
 "github.com/TheBitDrifter/yourgame/ldtk"
 "github.com/TheBitDrifter/warehouse"
)

const SCENE_ONE_NAME = "Scene1"

var SceneOne = Scene{
 Name:   SCENE_ONE_NAME,
 Plan:   sceneOnePlan,
 Width:  ldtk.DATA.WidthFor(SCENE_ONE_NAME),
 Height: ldtk.DATA.HeightFor(SCENE_ONE_NAME),
}

func sceneOnePlan(height, width int, sto warehouse.Storage) error {
 // Load the image tiles
 err := ldtk.DATA.LoadTiles(SCENE_ONE_NAME, sto)
 if err != nil {
  return err
 }

 // Load the terrain collision
 blockArchetype, _ := sto.NewOrExistingArchetype(BlockTerrainComposition...)
 platArchetype, _ := sto.NewOrExistingArchetype(PlatformComposition...)
 transferArchetype, _ := sto.NewOrExistingArchetype(CollisionPlayerTransferComposition...)

 err = ldtk.DATA.LoadIntGrid(SCENE_ONE_NAME, sto, blockArchetype, platArchetype, transferArchetype)
 if err != nil {
  return err
 }

 // Load custom LDTK entities
 err = ldtk.DATA.LoadEntities(SCENE_ONE_NAME, sto, entityRegistry)
 if err != nil {
  return err
 }

 // Add other scene elements (music, background, etc.)
 err = NewJazzMusic(sto)
 if err != nil {
  return err
 }
 return NewCityBackground(sto)
}
```

## LDTK Layer Types

Bappa's LDTK integration supports all major LDTK layer types:

### Tile Layers

Tile layers are loaded as visual elements. Each tile layer becomes a single entity with a sprite bundle containing all tiles:

```go
// In your scene plan:
err := ldtk.DATA.LoadTiles(SCENE_NAME, sto)
if err != nil {
 return err
}
```

### Int Grid Layers

Int grid layers are typically used for collision or metadata. Each value in the int grid corresponds to a different type of collider or behavior:

```go
// In your scene plan:
// First prepare archetypes for each int grid value
blockArchetype, _ := sto.NewOrExistingArchetype(BlockTerrainComposition...)
platformArchetype, _ := sto.NewOrExistingArchetype(PlatformComposition...)
// ... other archetypes

// Then load the int grid, passing archetypes in order of int grid values (1, 2, 3, etc.)
err = ldtk.DATA.LoadIntGrid(SCENE_NAME, sto, blockArchetype, platformArchetype)
```

### Entity Layers

Entity layers are loaded using the entity handlers you registered with the `entityRegistry`:

```go
// In your scene plan:
err = ldtk.DATA.LoadEntities(SCENE_NAME, sto, entityRegistry)
```

### Working Custom LDTK Entities

First, you need to register handlers for each LDTK entity type. In your `scenes/scene.go`:

```go
package scenes

import (
 "github.com/TheBitDrifter/blueprint"
 "github.com/TheBitDrifter/warehouse"

 blueprintldtk "github.com/TheBitDrifter/blueprint/ldtk"
)

var entityRegistry = blueprintldtk.NewLDtkEntityRegistry()

// Registering custom LDTK entities
func init() {
 // Player start position handler
 entityRegistry.Register("PlayerStart", func(entity *blueprintldtk.LDtkEntityInstance, sto warehouse.Storage) error {
  // Create player at the position defined in LDtk
  return NewPlayer(float64(entity.Position[0]), float64(entity.Position[1]), sto)
 })

 // Scene transition trigger handler
 entityRegistry.Register("SceneTransfer", func(entity *blueprintldtk.LDtkEntityInstance, sto warehouse.Storage) error {
  // Extract properties from LDtk entity
  targetScene := entity.StringFieldOr("targetScene", "Scene2") // Default if not specified
  targetX := entity.FloatFieldOr("targetX", 20.0)
  targetY := entity.FloatFieldOr("targetY", 400.0)
  width := entity.FloatFieldOr("width", 100)
  height := entity.FloatFieldOr("height", 100)

  // Create the transfer trigger
  return NewCollisionPlayerTransfer(
   sto,
   float64(entity.Position[0]),
   float64(entity.Position[1]),
   width,
   height,
   targetX,
   targetY,
   targetScene,
  )
 })

 // Register other entity types...
}
```

LDTK allows you to define custom properties for your entities. Access these properties in your entity handlers:

```go
entityRegistry.Register("Enemy", func(entity *blueprintldtk.LDtkEntityInstance, sto warehouse.Storage) error {
 // Get entity properties
 enemyType := entity.StringFieldOr("type", "basic")
 health := entity.IntFieldOr("health", 100)
 patrolSpeed := entity.FloatFieldOr("patrolSpeed", 2.0)

 // Create the enemy with these properties
 return NewEnemy(
  float64(entity.Position[0]),
  float64(entity.Position[1]),
  enemyType,
  health,
  patrolSpeed,
  sto,
 )
})
```

## Conclusion

LDTK integration brings powerful level design capabilities to your Bappa games. By separating level design from code, you can iterate faster and create more complex game worlds. The integration preserves Bappa's component-based architecture while adding the visual editing capabilities of LDTK.

For advanced use cases, you can extend the integration with custom entity handlers, specialized collision systems, or even runtime level generation. The foundation provided here gives you a solid starting point for creating engaging, visually rich game levels in Bappa.
