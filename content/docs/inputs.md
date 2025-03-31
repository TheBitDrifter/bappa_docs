---
title: "Input Handling"
description: "Learn how to implement responsive and flexible input handling for keyboard, mouse, gamepad, and touch"
lead: "Bappa provides a robust input system that separates device inputs from game actions for cleaner code and better player experience."
date: 2024-11-18T10:00:00+00:00
lastmod: 2024-11-18T10:00:00+00:00
draft: false
images: []
weight: 700
toc: true
---

Bappa provides a robust and flexible input system that abstracts device-specific inputs (keyboard, mouse, gamepad, touch) into game-specific actions. This abstraction makes your game logic cleaner and enables easy support for multiple input methods and control remapping.

## Input System Architecture

Bappa's input system consists of several key components:

1. **Input Capturers**: Detect and gather raw inputs from different devices
2. **Receivers**: Map physical inputs to game-specific actions
3. **Input Buffers**: Store and process input events for entities
4. **Input Systems**: Process those inputs to drive game behavior

This layered approach separates the concerns of input detection, mapping, and processing, maintaining a clear boundary between client-side systems and core simulation systems.

## The Basics

In Bappa, inputs are captured by the client and transformed into game actions in two main stages:

1. **Input Capture**: The client detects raw inputs (keyboard presses, mouse clicks, gamepad buttons)
2. **Input Processing**: These raw inputs are transformed into game actions via an input buffer system

## Setting Up Input Receivers

The first step in handling input is to create and configure one or more input receivers. Each receiver represents a separate input source, typically corresponding to a player.

```go
// Get an input receiver for a player
receiver, err := client.ActivateReceiver()
if err != nil {
    log.Fatal("Failed to activate receiver:", err)
}

// Define your game-specific input actions (usually in a separate file)
var actions = struct {
    Jump, MoveLeft, MoveRight, Attack, Interact input.Input
}{
    Jump:      input.NewInput("jump"),
    MoveLeft:  input.NewInput("move_left"),
    MoveRight: input.NewInput("move_right"),
    Attack:    input.NewInput("attack"),
    Interact:  input.NewInput("interact"),
}

// Map keyboard keys to game actions
receiver.RegisterKey(ebiten.KeyW, actions.Jump)
receiver.RegisterKey(ebiten.KeyUp, actions.Jump)        // Alternative key
receiver.RegisterKey(ebiten.KeyA, actions.MoveLeft)
receiver.RegisterKey(ebiten.KeyLeft, actions.MoveLeft)  // Alternative key
receiver.RegisterKey(ebiten.KeyD, actions.MoveRight)
receiver.RegisterKey(ebiten.KeyRight, actions.MoveRight) // Alternative key
receiver.RegisterKey(ebiten.KeySpace, actions.Attack)
receiver.RegisterKey(ebiten.KeyE, actions.Interact)
```

This setup registers various keyboard keys to game-specific actions, allowing the same action to be triggered by different keys (e.g., both W and Up for jumping).

## Supporting Multiple Input Devices

Bappa makes it easy to support multiple input methods for the same actions:

### Mouse Input

```go
// Map mouse buttons to game actions
receiver.RegisterMouseButton(ebiten.MouseButtonLeft, actions.Attack)
receiver.RegisterMouseButton(ebiten.MouseButtonRight, actions.Interact)
```

### Gamepad Input

```go
// Map gamepad buttons to game actions
receiver.RegisterPad(0) // Use gamepad ID 0
receiver.RegisterGamepadButton(ebiten.GamepadButton0, actions.Jump)    // A button
receiver.RegisterGamepadButton(ebiten.GamepadButton1, actions.Attack)  // B button
receiver.RegisterGamepadButton(ebiten.GamepadButton2, actions.Interact) // X button

// Map analog sticks
receiver.RegisterGamepadAxes(true, GameInputs.Movement)  // Action will have x/y values of analog stick movement
```

### Touch Input

```go
// Enable touch input
receiver.RegisterTouch(actions.Movement) // Action will have x/y values of tap
```

## Core Systems vs Client Systems

**Important principle**: Core systems should never directly access input devices. Instead:

- **Client systems** capture raw inputs and populate InputBuffers
- **Core systems** read from InputBuffers to determine game actions

This separation has significant benefits:

- Your game will work on any platform without changing core logic
- You can easily support different input methods
- Your game can be network-enabled more easily
- Replay systems become much simpler to implement

## The Input Buffer

The `InputBuffer` component is the bridge between client inputs and core game logic. It:

- Stores inputs that are relevant to an entity
- Automatically deduplicates inputs
- Can be read by core systems without them needing to know about input devices

## Processing Inputs

Bappa's built-in `InputBufferSystem` automatically collects inputs from all receivers and distributes them to the appropriate entity input buffers. While convenient, this system is entirely optional - you can register it with your client like this:

```go
// Register the input buffer system
client.RegisterGlobalClientSystem(&clientsystems.InputBufferSystem{})
```

## Connecting Inputs to Entities

To make entities respond to inputs, you need to add the `InputBuffer` component to them:

```go
// Create a player entity with an input buffer component
playerArchetype, err := sto.NewOrExistingArchetype(
    spatial.Components.Position,
    client.Components.SpriteBundle,
    input.Components.InputBuffer,  // Input buffer component
    // Other components...
)

// Generate a player entity with the input buffer
err = playerArchetype.Generate(1,
    spatial.NewPosition(180, 180),
    // Other component values...
    input.InputBuffer{ReceiverIndex: 0},  // Connect to receiver 0
)
```

The `ReceiverIndex` value links the entity to a specific input receiver, allowing different entities to respond to different input sources.

## Reading Inputs in Core Systems

Core systems should read from `InputBuffer` components rather than directly accessing input devices. Here's a simple example:

```go
// MovementSystem processes movement inputs
type MovementSystem struct{}

func (sys MovementSystem) Run(scene blueprint.Scene, dt float64) error {
    // Query for entities with both InputBuffer and Position components
    cursor := scene.NewCursor(blueprint.Queries.InputBuffer)

    for range cursor.Next() {
        // Get the input buffer component
        inputBuffer := input.Components.InputBuffer.GetFromCursor(cursor)
        position := spatial.Components.Position.GetFromCursor(cursor)

        // Check for "Move Right" input
        if _, hasMoveRight := inputBuffer.ConsumeInput(actions.MoveRight); hasMoveRight {
            // Do something with the input
            position.X += 5 // Move the entity right
        }

        // Check for "Move Left" input
        if _, hasMoveLeft := inputBuffer.ConsumeInput(actions.MoveLeft); hasMoveLeft {
            // Do something with the input
            position.X -= 5 // Move the entity left
        }
    }

    return nil
}
```

This system simply checks for movement inputs and updates entity positions accordingly, without knowing anything about the actual input devices.

## Freedom in Client Systems

While core systems should only read from InputBuffers, client systems have no such restriction! When writing client systems, you're free to:

- Read inputs directly from receivers
- Check keyboard, mouse, or gamepad state directly with Ebiten functions
- Process raw input events for UI and other client-side features

```go
// In a client system - this is perfectly fine!
func (YourClientSystem) Run(cli coldbrew.Client, scene coldbrew.Scene) error {
    // Direct access to input state
    if ebiten.IsKeyPressed(ebiten.KeyEscape) {
        // Open pause menu
    }
    // Access to raw mouse position
    x, y := ebiten.CursorPosition()
    // Do something with inputs...
    return nil
}
```

### Custom Input Processing

Developers can choose to implement their own input handling approach if they prefer. You can create custom client systems that directly access the receivers and handle inputs without using the `InputBuffer` component:

```go
// Custom input system that bypasses the standard InputBuffer
type DirectInputSystem struct{}

func (sys DirectInputSystem) Run(cli coldbrew.Client) error {
    // Get inputs directly from receiver
    receiver := cli.Receiver(0)
    inputs := receiver.PopInputs()

    // Process inputs however you want
    for _, input := range inputs {
        // Handle each input directly
        // ...
    }

    return nil
}

// Register your custom system
client.RegisterGlobalClientSystem(&DirectInputSystem{})
```

This approach gives you complete control over input processing, which can be useful for specialized input requirements or custom input architectures.

## Input Coordinates

For position-based inputs (mouse, touch, or analog sticks), Bappa provides both global and local coordinates:

- **Global Coordinates**: `X` and `Y` fields contain raw screen coordinates or analog movement vector
- **Local Coordinates**: `LocalX` and `LocalY` fields contain coordinates relative to the entity's camera (does not apply to analog)

The `InputBufferSystem` automatically translates global coordinates to local ones if the entity has a `CameraIndex` component, making it easier to work with screen-relative positions.

### Balancing Separation of Concerns

When designing your input system, be mindful about how coordinate data flows through your architecture. In general, core systems work best with abstract game concepts rather than raw device inputs like cursor positions or touch coordinates.

However, this doesn't mean coordinates should never appear in core systems. The key is ensuring those coordinates represent meaningful game concepts rather than device-specific details. For example:

- **Raw device input (avoid in core systems)**: "Mouse moved to screen position (432, 217)"
- **Meaningful game concept (fine for core systems)**: "Player is aiming at world position (25, 12)" or "Character wants to move toward target point (10, -5)"

When coordinates represent a player's intention or a gameplay concept rather than a specific device state, they become appropriate for core systems to process.

For a cleaner separation, consider using client systems as translators that convert raw input coordinates into game-relevant actions or values:

```go
// A client system that transforms cursor/vector inputs into game-appropriate values
type ExampleInputSystem struct{}

func (ExampleInputSystem) Run(cli coldbrew.LocalClient, scene coldbrew.Scene) error {
 cursor := scene.NewCursor(blueprint.Queries.InputBuffer)

 for range cursor.Next() {
  buffer := input.Components.InputBuffer.GetFromCursor(cursor)

  // Extract the input that knows too much (while in a client system)
  if stickMovement, ok := buffer.ConsumeInput(actions.StickMovement); ok {
   // Create a input that knows just enough!
   if stickMovement.X > 20 {
    buffer.Add(input.StampedInput{
     Tick: scene.CurrentTick(),
     Val: actions.Right,
    })
   }
  }

 }
 return nil
}
```

This approach keeps your core systems pure and focused on game logic, while client systems handle the transformation of raw inputs into game-appropriate values. It is not mandatory by any means. Sometimes it's just better to work directly with coordinates.

## Local Multiplayer Input

Bappa's input system is designed to support local multiplayer out of the box:

```go
// Set up first player
receiver1, _ := client.ActivateReceiver()
receiver1.RegisterKey(ebiten.KeyW, actions.Jump)
receiver1.RegisterKey(ebiten.KeyA, actions.MoveLeft)
receiver1.RegisterKey(ebiten.KeyD, actions.MoveRight)

// Set up second player
receiver2, _ := client.ActivateReceiver()
receiver2.RegisterKey(ebiten.KeyUp, actions.Jump)
receiver2.RegisterKey(ebiten.KeyLeft, actions.MoveLeft)
receiver2.RegisterKey(ebiten.KeyRight, actions.MoveRight)

// OR use gamepads for each player
receiver2.RegisterPad(1) // Use second gamepad
receiver2.RegisterGamepadButton(ebiten.GamepadButton0, actions.Jump)
// etc.

// Create player entities with different receiver indexes
// Player 1
player1Arch.Generate(1,
    // Other components...
    input.InputBuffer{ReceiverIndex: 0},
)

// Player 2
player2Arch.Generate(1,
    // Other components...
    input.InputBuffer{ReceiverIndex: 1},
)
```

This setup gives each player their own set of controls and connects each player entity to its corresponding input receiver.

## Dynamic Input Remapping

Bappa makes it easy to implement input remapping for player preferences:

```go
// Function to update keyboard mappings
func RemapKey(receiver coldbrew.Receiver, oldKey, newKey ebiten.Key, action input.Input) {
    // Unregister by registering a no-op action
    receiver.RegisterKey(oldKey, input.NewInput("none"))

    // Register the new key
    receiver.RegisterKey(newKey, action)
}

// Similar functions can be created for other input types
```

## Best Practices

1. **Separation of Concerns**: Keep input detection (in receivers) separate from input processing (in systems)
2. **Clear Input Names**: Use descriptive names for your game inputs (e.g., "jump" instead of "action1")
3. **Multiple Input Methods**: Support keyboard, gamepad, and touch when appropriate for better accessibility
4. **Consider Custom Solutions**: Remember that the InputBuffer system is optional - don't hesitate to build your own input processing approach if it better suits your game's needs

## Conclusion

Bappa's input system provides a robust foundation for handling various input devices in a clean, abstract way. By separating the concerns of input detection, mapping, and processing, it enables you to focus on your game's behavior while supporting a wide range of input methods and configurations.

The key benefits of this approach include:

- Easy support for multiple input devices
- Simple implementation of local multiplayer
- Clean separation between physical inputs and game actions
- Automatic coordinate translation for camera-relative inputs
- Scalable design for complex input requirements

With these tools, you can create responsive, accessible controls for your Bappa games across different platforms and input devices.
