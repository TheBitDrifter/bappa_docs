---
title: "Understanding Systems"
description: "Learn about the different system types and how they drive your game's behavior"
lead: ""
date: 2024-11-18T10:00:00+00:00
lastmod: 2024-11-18T10:00:00+00:00
draft: false
images: []
weight: 400
toc: true
---

After setting up your scenes with Blueprint Plans, you need systems to make your game come alive. Systems in Bappa are responsible for all the logic and behavior that drive your game. They process input, handle physics, manage game state, and render your scenes to the screen.

Bappa divides systems into several distinct types, each with specific responsibilities and execution timings. Understanding these system types and their roles is crucial for building well-structured and performant games.

## System Types Overview

Bappa organizes systems into four main categories:

1. **Global Render Systems**: Handle rendering across all scenes
2. **Global Client Systems**: Process input and state that span multiple scenes
3. **Core Systems**: Handle game simulation (physics, AI, collision, etc.)
4. **Scene Client Systems**: Process logic specific to a scene
5. **Scene Render Systems**: Handle rendering specific to a scene

These system types run in a specific order during each game tick:

1. Input capture happens (keyboard, mouse, gamepad, touch)
2. Global Client Systems run
3. Core Systems run for each active scene
4. Scene Client Systems run for each active scene
5. Global Client Secondary Systems run
6. Rendering occurs: Global Render Systems → Scene Render Systems

This orchestrated execution ensures proper sequencing of game logic and rendering.

## System Types in Detail

### Global Render Systems

Global Render Systems handle rendering across all scenes and are typically responsible for:

- Drawing sprites and backgrounds
- Rendering UI elements that persist across scenes
- Managing camera views
- Applying visual effects that affect the entire game

These systems receive the client and screen as parameters and have access to all scenes.

```go
// GlobalRenderSystem handles rendering at the global/client level
type GlobalRenderSystem interface {
    Render(Client, Screen)
}
```

The most common Global Render System is the built-in `GlobalRenderer`, which automatically handles sprites, animations, and parallax backgrounds. For most games, you can use this system without writing a custom renderer.

```go
// Register the global renderer
client.RegisterGlobalRenderSystem(rendersystems.GlobalRenderer{})
```

### Global Client Systems

Global Client Systems process game logic that spans across all scenes, such as:

- Input processing
- Sound management
- Multi-scene game state tracking
- Camera management
- UI state management

```go
// GlobalClientSystem runs with access to all scenes
type GlobalClientSystem interface {
    Run(Client) error
}
```

These systems can be registered to run either before or after Core Systems:

```go
// Run before core simulation
client.RegisterGlobalClientSystem(clientsystems.ActionBufferSystem{})

```

Common built-in Global Client Systems include:

- **ActionBufferSystem**: Processes raw inputs and forwards them to entities
- **CameraSceneAssignerSystem**: Manages camera assignments across scenes

### Core Systems

Core Systems are the heart of your game simulation. They handle:

- Physics and movement
- Collision detection and response
- Game mechanics
- Character and AI behavior
- Game rules and logic

These systems operate at the scene level and are executed for each active scene:

```go
// CoreSystem runs the core simulation logic for a scene
type CoreSystem interface {
    Run(Scene, float64) error
}
```

The second parameter is the delta time (in seconds) for framerate independence.

Core Systems are defined in the Blueprint package and registered when creating scenes:

```go
coreSystems := []blueprint.CoreSystem{
    &physics.MovementSystem{},
    &collision.DetectionSystem{},
    &gameplay.PowerupSystem{},
    // ...
}

client.RegisterScene(
    "GameLevel",
    640, 360,
    levelPlan,
    renderSystems,
    clientSystems,
    coreSystems,  // Register core systems here
)
```

Common built-in Core Systems include:

- **Integration System**: Integrates forces for games using Bappa's physics packages
- **Transform System**: Updates shapes based on position, rotation, and scale for games using Bappa's spatial packages

### Scene Client Systems

Scene Client Systems process logic specific to a single scene:

- Scene-specific input handling
- Local sound effects
- Scene state management
- UI specific to a scene

```go
// ClientSystem runs at the scene level
type ClientSystem interface {
    Run(LocalClient, Scene) error
}
```

These systems are registered when creating a scene:

```go
clientSystems := []coldbrew.ClientSystem{
    &systems.LevelUISystem{},
    &systems.ScoreSystem{},
    // ...
}

client.RegisterScene(
    "GameLevel",
    640, 360,
    levelPlan,
    renderSystems,
    clientSystems,  // Register client systems here
    coreSystems,
)
```

### Scene Render Systems

Scene Render Systems handle rendering specific to a scene:

- Scene-specific UI elements
- Special visual effects
- Custom rendering techniques

```go
// RenderSystem handles rendering at the scene level
type RenderSystem interface {
    Render(Scene, Screen, CameraUtility)
}
```

Like Client Systems, Render Systems are registered with scenes:

```go
renderSystems := []coldbrew.RenderSystem{
    &rendersystems.HUDRenderer{},
    &rendersystems.EffectsRenderer{},
    // ...
}

client.RegisterScene(
    "GameLevel",
    640, 360,
    levelPlan,
    renderSystems,  // Register render systems here
    clientSystems,
    coreSystems,
)
```

## Creating Custom Systems

Let's explore how to create custom systems for different purposes.

### Custom Core System Example

Here's an example of a simple movement system that applies velocity to position:

```go
package physics

import (
    "github.com/TheBitDrifter/bappa/blueprint"
    "github.com/TheBitDrifter/bappa/tteokbokki/motion"
    "github.com/TheBitDrifter/bappa/tteokbokki/spatial"
    "github.com/TheBitDrifter/bappa/warehouse"
)

// MovementSystem applies velocity to position for all entities with both components
type MovementSystem struct{}

// Run executes the movement simulation
func (sys MovementSystem) Run(scene blueprint.Scene, dt float64) error {

    // Create a query that queries for entities with both Position and Dynamics components
    query := warehouse.Factory.NewQuery().And(
      spatial.Components.Position,
      motion.Components.Dynamics,
    )
    cursor := scene.NewCursor(query)

    // Process each matching entity
    for range cursor.Next() {
        // Get the components we need
        position := spatial.Components.Position.GetFromCursor(cursor)
        dynamics := motion.Components.Dynamics.GetFromCursor(cursor)

        // Apply velocity to position
        position.X += dynamics.Vel.X
        position.Y += dynamics.Vel.Y
    }

    return nil
}
```

### Custom Client System Example

Here's an example of a system that plays a jump sound when the jump input is detected:

```go
package systems

import (
    "github.com/TheBitDrifter/bappa/blueprint"
    "github.com/TheBitDrifter/bappa/blueprint/client"
    "github.com/TheBitDrifter/bappa/blueprint/input"
    "github.com/TheBitDrifter/bappa/coldbrew"
)

// JumpSoundSystem plays sound effects when a jump input is detected
type JumpSoundSystem struct{}

// Run processes the system logic
func (sys JumpSoundSystem) Run(cli coldbrew.LocalClient, scene coldbrew.Scene) error {
    // Create a cursor that queries for entities with both ActionBuffer and SoundBundle
    cursor := scene.NewCursor(blueprint.Queries.InputSoundBundle)

    // Process each matching entity
    for range cursor.Next() {
        // Get the components we need
        actionBuffer := input.Components.ActionBuffer.GetFromCursor(cursor)
        soundBundle := client.Components.SoundBundle.GetFromCursor(cursor)

        // Process all inputs in the buffer
        for _, input := range actionBuffer.Inputs {
            // Check if this is a jump input
            if input.Val == MyGameInputs.Jump {
                // Find the jump sound in the bundle
                jumpSound, err := coldbrew.MaterializeSound(*soundBundle, sounds.Jump)
                if err != nil {
                    continue
                }

                // Play the sound
                player := jumpSound.GetAnyAvailable()
                player.Rewind()
                player.Play()
            }
        }
    }

    return nil
}
```

### Custom Render System Example

Here's an pseudo example of a system that renders a health bar above entities:

```go
package rendersystems

import (
    "image/color"

    "github.com/TheBitDrifter/bappa/blueprint"
    "github.com/TheBitDrifter/bappa/tteokbokki/spatial"
    "github.com/TheBitDrifter/bappa/blueprint/vector"
    "github.com/TheBitDrifter/bappa/coldbrew"
    "github.com/TheBitDrifter/mygame/components"
    "github.com/hajimehoshi/ebiten/v2"
)

// HealthBarRenderer displays health bars above entities with Health components
type HealthBarRenderer struct{}

// Render draws health bars
func (sys HealthBarRenderer) Render(scene coldbrew.Scene, screen coldbrew.Screen, camUtil coldbrew.CameraUtility) {
    // Create a query for entities with Position and Health components
    query := blueprint.Factory.NewQuery().And(
        spatial.Components.Position,
        components.Health,
    )

    // Create cursor from query
    cursor := scene.NewCursor(query)

    // Get active cameras for this scene
    cameras := camUtil.ActiveCamerasFor(scene)

    // Create images for health bars (really should be cached for performance)
    barBg := ebiten.NewImage(50, 6) // <- Calling this every frame will really hurt performance, but it's okay for this pseudo example
    >
    barBg.Fill(color.RGBA{20, 20, 20, 200})

    barFg := ebiten.NewImage(48, 4)
    barFg.Fill(color.RGBA{220, 40, 40, 255})

    // Process each entity
    for range cursor.Next() {
        position := spatial.Components.Position.GetFromCursor(cursor)
        health := components.Health.GetFromCursor(cursor)

        // Calculate health percentage
        healthPercent := float64(health.Current) / float64(health.Max)

        // For each camera viewing this entity
        for _, cam := range cameras {
            // Draw background
            bgOpts := &ebiten.DrawImageOptions{}
            bgPos := vector.Two{X: position.X - 25, Y: position.Y - 40}
            cam.DrawImage(barBg, bgOpts, bgPos)

            // Draw foreground (health portion)
            fgOpts := &ebiten.DrawImageOptions{}
            fgOpts.GeoM.Scale(healthPercent, 1.0)
            fgPos := vector.Two{X: position.X - 24, Y: position.Y - 39}
            cam.DrawImage(barFg, fgOpts, fgPos)
        }
    }
}
```

## Best Practices

### Performance Considerations

1. **Query Optimization**: Create specific queries that match only the entities your system needs to process.
2. **Component Access**: Use `GetFromCursor` for direct component access and avoid unnecessary lookups.
3. **System Splitting**: Break complex systems into smaller, focused ones that run at the appropriate time.

### System Organization

1. **Single Responsibility**: Each system should focus on a single aspect of game behavior.
2. **Logical Grouping**: Group related systems in meaningful packages (physics, input, rendering, etc.).
3. **Dependencies**: Minimize dependencies between systems to keep them modular and maintainable.
4. **Execution Order**: Be mindful of system execution order, especially for interdependent behaviors.

## Built-in Systems

Bappa provides several built-in systems that handle common game functionality:

### Global Systems

- **GlobalRenderer**: Renders sprites, animations, and backgrounds
- **ActionBufferSystem**: Processes raw inputs and forwards them to entities
- **CameraSceneAssignerSystem**: Manages camera assignments across scenes
- **SplitScreenLayoutSystem**: Arranges cameras for split-screen gameplay
- **IntegrationSystem**: Applies forces to entities with physics/dynamics
- **TransformSystem**: Updates entity shapes based on their position, scale and rotation

Using these built-in systems can save you significant development time and ensure your game follows best practices.

## Conclusion

Systems are the beating heart of your Bappa game, driving all the behaviors and interactions that make your game world come alive. By understanding the different system types and their responsibilities, you can create well-structured, performant games with clear separation of concerns.

The modular nature of Bappa's systems encourages good software design practices and makes your code more maintainable and reusable. As your game grows in complexity, this architecture will help you manage that complexity and keep your codebase organized.

In the next section, we'll explore how to use queries effectively to filter entities and optimize your systems' performance.
