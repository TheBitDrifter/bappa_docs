---
title: "Sprites Animations and Sounds"
description: "Learn how to work with sprites, sounds, and other game assets in Bappa"
lead: ""
date: 2024-11-18T10:00:00+00:00
lastmod: 2024-11-18T10:00:00+00:00
draft: false
images: []
weight: 600
toc: true
---

Effective asset management is crucial for building games with rich visuals and audio. Bappa provides a streamlined approach to handling sprites, animations, sounds, and other game assets. This guide will show you how to work with these assets in your Bappa games.

## Asset Organization

Bappa uses a structured approach to asset loading and management. Assets are typically organized like this:

```
assets/
├── images/
│   ├── characters/
│   ├── backgrounds/
│   └── terrain/
└── sounds/
    ├── sfx/
    └── music/
```

Bappa handles assets differently in development versus production:

- **In Development**: Assets are loaded directly from the filesystem for faster iteration
- **In Production**: Assets are embedded in your game binary using Go's embed feature

Set up asset embedding in your main file:

```go
package main

import (
    "embed"
    "log"

    "github.com/TheBitDrifter/coldbrew"
)

//go:embed assets/*
var embeddedFS embed.FS

func main() {
    // Pass the embedded filesystem to the client, along with cache sizes
    // Parameters: baseResX, baseResY, maxSpritesCached, maxSoundsCached, maxScenesCached, embeddedFS
    client := coldbrew.NewClient(640, 360, 100, 50, 10, embeddedFS)

    // In development mode, assets are loaded from disk
    // In production mode, assets are loaded from the embedded filesystem
    // ...
}
```

### Automatic Asset Loading and Caching

Bappa automatically loads and caches assets as they are needed. When you create the client, you specify the maximum number of sprites and sounds that can be cached at once:

```go
// Create client with cache sizes
// - Up to 100 sprites can be cached
// - Up to 50 sounds can be cached
// - Up to 10 scenes can be cached
client := coldbrew.NewClient(640, 360, 100, 50, 10, embeddedFS)
```

The framework handles all the loading, caching, and memory management for you:

1. When a scene is loaded, Bappa scans all entities for SpriteBundle and SoundBundle components
2. It automatically loads and caches any referenced sprites and sounds
3. Assets remain cached across scene transitions for smoother gameplay

As long as the active scene(s) doesn't exceed the maximum cache sizes specified, Bappa will handle everything automatically. For larger games with many assets, you may want to increase these cache sizes accordingly.

Ideally, your cache sizing should exceed several times the average volume of assets required for all concurrently running scenes.

## Working with Sprites

### Sprite Bundles

In Bappa, sprites are managed using `SpriteBundle` components. A sprite bundle can contain multiple sprites, animations, and rendering configurations for an entity.

#### Creating a Basic Sprite

```go
// Create a sprite bundle with a single sprite
spriteBundle := blueprintclient.NewSpriteBundle().
    AddSprite("characters/player.png", true)
```

The second parameter (`true`) indicates that the sprite should be active by default.

#### Offset

```go
// Create a sprite with offset and scale
spriteBundle := blueprintclient.NewSpriteBundle().
    AddSprite("terrain/platform.png", true).
    WithOffset(vector.Two{X: -64, Y: -16})
```

The offset is used to position the sprite relative to the entity's position. This is particularly useful for centering sprites on entities.

#### Static

Static sprites don't move with the camera - they remain fixed on the screen. This is useful for UI elements, HUD components, or certain visual effects:

```go
// Create a static sprite for UI/HUD elements
spriteBundle := blueprintclient.NewSpriteBundle().
    AddSprite("ui/health_bar.png", true).
    WithOffset(vector.Two{X: 10, Y: 10}).
    WithStatic(true)
```

#### Sprite Priority

Control render order:

```go
spriteBundle := blueprintclient.NewSpriteBundle().
    AddSprite("effects/particle.png", true).
    WithPriority(10)              // Higher priority = rendered on top
```

### Custom Rendering

For special rendering effects, you can use the `WithCustomRenderer` method:

```go
spriteBundle := blueprintclient.NewSpriteBundle().
    AddSprite("effects/glow.png", true).
    WithCustomRenderer()

```

This tells Bappa that the sprite will be rendered by a custom render system, not the default renderer.

### Animations

For animated sprites, Bappa uses sprite sheets and animation data to control frame timing and display.

#### Creating an Animation

First, define your animations:

```go
package animations

import (
    "github.com/TheBitDrifter/blueprint/vector"
    blueprintclient "github.com/TheBitDrifter/blueprint/client"
)

// IdleAnimation defines the player's idle animation
var IdleAnimation = blueprintclient.AnimationData{
    FrameWidth:  144,   // Width of each frame in pixels
    FrameHeight: 128,   // Height of each frame
    FrameCount:  8,     // Number of frames in the animation
    Speed:       6,     // Number of game ticks per frame
    RowIndex:    0,     // Row index in the sprite sheet (0-based)
    PositionOffset: vector.Two{X: 0, Y: 0}, // Optional offset for this animation
}

// RunAnimation defines the player's run animation
var RunAnimation = blueprintclient.AnimationData{
    FrameWidth:  144,
    FrameHeight: 128,
    FrameCount:  8,
    Speed:       4,     // Faster than idle animation
    RowIndex:    1,     // Second row in the sprite sheet
}

// JumpAnimation defines the player's jump animation
var JumpAnimation = blueprintclient.AnimationData{
    FrameWidth:  144,
    FrameHeight: 128,
    FrameCount:  4,
    Speed:       5,
    RowIndex:    2,
    Freeze:      true,  // Animation will stop on last frame
}
```

Then use these animations with your sprite bundle:

```go
// Create a sprite bundle with animations
spriteBundle := blueprintclient.NewSpriteBundle().
    AddSprite("characters/player_sheet.png", true).
    WithAnimations(
        animations.IdleAnimation,
        animations.RunAnimation,
        animations.JumpAnimation,
    ).
    SetActiveAnimation(animations.IdleAnimation).
    WithOffset(vector.Two{X: -72, Y: -64})
```

#### Changing Animations at Runtime

To change animations during gameplay, you can access the sprite bundle and use the `TryAnimation` method on the sprite blueprint:

```go
package clientsystems

import (
    "math"

    "github.com/TheBitDrifter/bappa-platformer-example/animations"
    "github.com/TheBitDrifter/bappa-platformer-example/components"
    "github.com/TheBitDrifter/blueprint"
    blueprintclient "github.com/TheBitDrifter/blueprint/client"
    blueprintmotion "github.com/TheBitDrifter/blueprint/motion"
    "github.com/TheBitDrifter/coldbrew"
)

// PlayerAnimationSystem handles animation state changes based on player movement
type PlayerAnimationSystem struct{}

func (PlayerAnimationSystem) Run(cli coldbrew.LocalClient, scene coldbrew.Scene) error {
    cursor := scene.NewCursor(blueprint.Queries.InputBuffer)

    for range cursor.Next() {
        // Get sprite bundle and first blueprint (main character sprite)
        bundle := blueprintclient.Components.SpriteBundle.GetFromCursor(cursor)
        spriteBlueprint := &bundle.Blueprints[0]

        // Get dynamics for movement state
        dyn := blueprintmotion.Components.Dynamics.GetFromCursor(cursor)

        // Check if player is on the ground
        grounded, onGround := components.OnGroundComponent.GetFromCursorSafe(cursor)
        if grounded {
            grounded = scene.CurrentTick() == onGround.LastTouch
        }

        // Normal animation state transitions
        if math.Abs(dyn.Vel.X) > 0 && grounded {
            // Moving horizontally while on ground
            spriteBlueprint.TryAnimation(animations.RunAnimation)
        } else if dyn.Vel.Y > 0 && !grounded {
            // Falling
            spriteBlueprint.TryAnimation(animations.FallAnimation)
        } else if dyn.Vel.Y <= 0 && !grounded {
            // Jumping or at apex
            spriteBlueprint.TryAnimation(animations.JumpAnimation)
        } else {
            // Idle state
            spriteBlueprint.TryAnimation(animations.IdleAnimation)
        }
    }

    return nil
}
```

This approach uses the `TryAnimation` method, which is a cleaner API for changing animations. It handles animation state tracking internally and only changes the animation if needed.

## Working with Sounds

{{< callout context="caution" title="Caution" icon="outline/alert-triangle" >}}
Bappa currently only supports audio in the .wav format
{{< /callout >}}

### Sound Bundles

Similar to sprites, sounds are managed using `SoundBundle` components.

#### Creating a Sound Bundle

```go
// Create a sound bundle with a single sound
soundBundle := blueprintclient.NewSoundBundle().
    AddSoundFromPath("sounds/jump.wav")
```

#### Using Sound Configurations

For more control over sounds, you can define sound configurations:

```go
package sounds

import blueprintclient "github.com/TheBitDrifter/blueprint/client"

// Sound configurations
var (
    // Jump sound with 3 concurrent players
    Jump = blueprintclient.SoundConfig{
        Path:             "sfx/jump.wav",
        AudioPlayerCount: 3,
    }

    // Footstep sound with 5 concurrent players (for frequent sounds)
    Footstep = blueprintclient.SoundConfig{
        Path:             "sfx/footstep.wav",
        AudioPlayerCount: 5,
    }

    // Background music with 1 player (only needs to play once)
    Music = blueprintclient.SoundConfig{
        Path:             "music/level1.wav",
        AudioPlayerCount: 1,
    }
)
```

Then use these configurations with your sound bundle:

```go
// Create a sound bundle with configured sounds
soundBundle := blueprintclient.NewSoundBundle().
    AddSoundFromConfig(sounds.Jump).
    AddSoundFromConfig(sounds.Footstep)
```

The `AudioPlayerCount` sets how many instances of the sound can play simultaneously. This is important for sounds that might overlap, like footsteps or impacts.

### Playing Sounds

To play sounds, you need to retrieve the sound from the bundle and play it:

```go
// In a system that handles player actions:
func (sys PlayerSoundSystem) Run(client coldbrew.LocalClient, scene coldbrew.Scene) error {
    cursor := scene.NewCursor(blueprint.Queries.PlayerEntity)

    for range cursor.Next() {
        soundBundle := blueprintclient.Components.SoundBundle.GetFromCursor(cursor)
        inputBuffer := blueprintinput.Components.InputBuffer.GetFromCursor(cursor)

        // Check for jump input
        for _, input := range inputBuffer.Inputs {
            if input.Val == MyGameInputs.Jump {
                // Find and play the jump sound
                jumpSound, err := coldbrew.MaterializeSound(*soundBundle, sounds.Jump)
                if err != nil {
                    continue
                }

                // Get an available player and play the sound
                player := jumpSound.GetAnyAvailable()
                player.Rewind()
                player.Play()
            }
        }
    }

    return nil
}
```

## Tips and Best Practices

1. **Asset Organization**: Keep a consistent folder structure for assets
2. **Asset Sizes**: Maintain consistent dimensions for similar objects
3. **Sprite Sheets**: Use sprite sheets for animations and similar sprites
4. **Sound Pooling**: Use appropriate `AudioPlayerCount` for frequently played sounds

## Conclusion

Bappa's asset management system provides a flexible and powerful way to work with sprites, animations, and sounds in your games. By understanding the sprite and sound bundle components, you can create rich visual and audio experiences with minimal boilerplate code.

The next section will explore how to create robust input handling in your Bappa games.
