---
title: "The Client"
description: ""
lead: ""
date: 2024-11-18T10:00:00+00:00
lastmod: 2024-11-18T10:00:00+00:00
draft: false
images: []
weight: 200
toc: true
---

At the heart of every Bappa game is the `Client` object, which serves as the central coordination point for your game. The client manages the game loop, handles input, organizes scenes, controls cameras, and coordinates rendering.

## Creating a Client

To start a new Bappa project, you'll first need to create a client instance:

```go
package main

import (
 "embed"
 "log"

 "github.com/TheBitDrifter/bappa/coldbrew"
)

//go:embed assets/*
var embeddedFS embed.FS

func main() {
 // Create a new client with base resolution 640x360 and cache for 10 scenes
 client := coldbrew.NewClient(640, 360, 10, embeddedFS)

 // Configure your client
 client.SetTitle("My Awesome Game")
 client.SetWindowSize(1280, 720)
 client.SetResizable(true)

 // Start the game
 if err := client.Start(); err != nil {
  log.Fatal(err)
 }
}
```

This minimal setup creates a working window, but a game needs scenes and systems to do anything interesting.

## Understanding the Client

The client in Bappa serves several key purposes:

1. **Game Loop Management**: Handles the update-render cycle that powers your game
2. **Scene Coordination**: Manages scene transitions, loading, and activation
3. **Input Processing**: Captures and processes user input from various devices
4. **Camera Management**: Controls viewport positioning and rendering
5. **Configuration**: Provides settings for window size, resolution, etc.

## Client Configuration

You can customize your game's appearance and behavior through the client's configuration methods:

```go
// Window title
client.SetTitle("My Awesome Game")

// Window dimensions
client.SetWindowSize(1280, 720)

// Internal resolution (affects rendering quality and performance)
client.SetResolution(640, 360)

// Allow window resizing
client.SetResizable(true)

// Toggle fullscreen mode
client.SetFullScreen(false)

// Set game speed (ticks per second)
client.SetTPS(60)

// Set debug visualization key
client.BindDebugKey(ebiten.KeyF1)

// Configure scene transition times
client.SetMinimumLoadTime(30) // frames to show loading screen
```

## Client Systems

The client orchestrates different types of systems that power your game:

1. **Global Render Systems**: Handle rendering across all scenes
2. **Global Client Systems**: Process input and state that spans multiple scenes
3. **Scene Render Systems**: Handle rendering specific to a scene
4. **Scene Client Systems**: Process logic specific to a scene
5. **Core Systems**: Handle game simulation (physics, AI, etc.)

You register these systems with the client to create your game's behavior:

```go
// Register global rendering system
client.RegisterGlobalRenderSystem(&rendersystems.GlobalRenderer{})

// Register systems that run before core simulation
client.RegisterGlobalClientSystem(&clientsystems.InputBufferSystem{})
```

## Cameras and Viewports

Cameras in Bappa define what part of your game world is visible to the player. The client manages these cameras:

```go
// Activate a camera
camera, err := client.ActivateCamera()
if err != nil {
    // Handle error
}

// Set camera dimensions and position
camera.SetDimensions(640, 360)
screenPos, worldPos := camera.Positions()
screenPos.X = 0
screenPos.Y = 0
worldPos.X = 100
worldPos.Y = 50
```

Multiple active cameras enable split-screen gameplay, mini-maps, or UI overlays, all managed through the client.

## Input Management

Bappa uses a receiver-based input system where physical inputs (keys, buttons) are mapped to game-specific actions:

```go
// Get an input receiver for a player
receiver, err := client.ActivateReceiver()
if err != nil {
    // Handle error
}

// Map keys to game actions
receiver.RegisterKey(ebiten.KeyW, myGameInputs.Jump)
receiver.RegisterKey(ebiten.KeyUp, myGameInputs.Jump)
receiver.RegisterKey(ebiten.KeySpace, myGameInputs.Attack)

// Map mouse buttons
receiver.RegisterMouseButton(ebiten.MouseButtonLeft, myGameInputs.Shoot)

// Map gamepad buttons
receiver.RegisterPad(0) // Use gamepad ID 0
receiver.RegisterGamepadButton(ebiten.GamepadButton0, myGameInputs.Jump)
```

This abstraction layer allows your core game logic to work with meaningful game actions rather than device-specific inputs.

In the next section, we'll explore how to create scenes, entities, and components to build the actual content and behavior of your game.
