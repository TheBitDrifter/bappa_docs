---
title: "Building a Basic Platformer old"
description: "A tutorial detailing how to create a basic platformer with the Bappa Framework"
date: 2025-03-17T16:27:22+02:00
lastmod: 2025-03-17T16:27:22+02:00
draft: false
weight: 80
contributors: ["TheBitDrifter"]
pinned: false
homepage: false
toc: true
---

While the Bappa Framework comes with templates, documentation, and examples, nothing beats a good old-fashioned tutorial. In this guide, we'll explore building the foundation for a simple platformer using the Bappa Framework.

## Project Setup

Although [bappacreate](https://github.com/TheBitDrifter/bappacreate) is typically recommended for new projects, we'll start from the most basic setup to better understand the framework's fundamentals.

### Initial Project Structure

- Download the base project from [github](https://github.com/TheBitDrifter/bappa_platformer_tut/releases/tag/base-project)
- The template includes only the essential assets and an initialized Go module named `platformer`

### Creating the Main File

First, create a new file named `main.go` with the following content:

```go{title="main.go"}
package main

import (
    "embed"
    "log"
    "github.com/TheBitDrifter/coldbrew"
)

//go:embed assets/*
var assets embed.FS

const (
    RESOLUTION_X       = 640
    RESOLUTION_Y       = 360
    MAX_SPRITES_CACHED = 100
    MAX_SOUNDS_CACHED  = 100
    MAX_SCENES_CACHED  = 12
)

func main() {
    // Create the client
    client := coldbrew.NewClient(
        RESOLUTION_X,
        RESOLUTION_Y,
        MAX_SPRITES_CACHED,
        MAX_SOUNDS_CACHED,
        MAX_SCENES_CACHED,
        assets,
    )

    // Configure client settings
    client.SetTitle("Platformer")
    client.SetResizable(true)
    client.SetMinimumLoadTime(30)

    // Run the client
    if err := client.Start(); err != nil {
        log.Fatal(err)
    }
}
```

### Installing Dependencies

Now that we have our `main.go` file, with the required imports, to install dependencies execute the following
from your project directory:

```bash
go get github.com/TheBitDrifter/coldbrew@latest
go mod tidy
```

### Running the Game

To run your game, execute the following command from your project directory:

```bash
go run .
```

At this point, you'll see a blank window with the specified resolution. While not very exciting yet, this provides the foundation for our platformer. In the next section, we'll start adding game elements and bringing our world to life.

## Creating Your First Scene

Let's create our first scene. Start by creating a `scenes/` directory in your project root. We'll need two files to set up our scene structure:

### Scene Structure Definition

First, let's create the base scene structure that we'll use throughout our game:

```go{title="scenes/scene.go"}
package scenes

import "github.com/TheBitDrifter/blueprint"

type Scene struct {
    Name          string
    Plan          blueprint.Plan
    Width, Height int
}
```

### Implementing Scene One

Next, let's create our first scene with a parallax background:

```go{title="scenes/scene_one.go"}
package scenes

import (
    "github.com/TheBitDrifter/blueprint"
    "github.com/TheBitDrifter/warehouse"
)

const SCENE_ONE_NAME = "scene one"

var SceneOne = Scene{
    Name:   SCENE_ONE_NAME,
    Plan:   sceneOnePlan,
    Width:  1600,
    Height: 500,
}

func sceneOnePlan(height, width int, sto warehouse.Storage) error {
    err := blueprint.NewParallaxBackgroundBuilder(sto).
        AddLayer("backgrounds/city/sky.png", 0.025, 0.025).
        AddLayer("backgrounds/city/far.png", 0.025, 0.05).
        AddLayer("backgrounds/city/mid.png", 0.1, 0.1).
        AddLayer("backgrounds/city/near.png", 0.2, 0.2).
        Build()
    if err != nil {
        return err
    }
    return nil
}
```

### Understanding the Scene Structure

Let's break down what's happening in these files:

1. The `Scene` structure in `scene.go` defines our basic scene template with:

   - A name identifier
   - A plan function (type `blueprint.Plan`)
   - Width and height dimensions

2. In `scene_one.go`, we create our first scene implementation:
   - We define a constant for the scene name
   - Create an instance of our Scene structure called `SceneOne`
   - Implement the scene's plan function

The `sceneOnePlan` function is particularly interesting - it's what Bappa calls a `blueprint.Plan`. This special function signature is expected by the client and gets called automatically when scenes become active. The plan function is where we define what should exist in our scene when it loads.

In this case, we're using the Blueprint API's `ParallaxBackgroundBuilder` to quickly create a multi-layered scrolling background. Each `AddLayer` call defines:

- The image path relative to our assets directory
- X and Y scroll speeds (smaller numbers = slower scrolling)

While there are more manual ways to create entities (which we'll explore later), the builder pattern used here provides a convenient shortcut for common setups.

## Registering the Scene

Now that we have our scene defined, let's wire it up in our main file. We'll need to import our scenes package and the render systems from coldbrew:

```go{title="main.go"}
package main

import (
    "embed"
    "log"
    "github.com/TheBitDrifter/coldbrew"
    coldbrew_rendersystems "github.com/TheBitDrifter/coldbrew/rendersystems"
    "platformer/scenes"  // Import our scenes package
)

//go:embed assets/*
var assets embed.FS

const (
    RESOLUTION_X       = 640
    RESOLUTION_Y       = 360
    MAX_SPRITES_CACHED = 100
    MAX_SOUNDS_CACHED  = 100
    MAX_SCENES_CACHED  = 12
)

func main() {
    // Create the client
    client := coldbrew.NewClient(
        RESOLUTION_X,
        RESOLUTION_Y,
        MAX_SPRITES_CACHED,
        MAX_SOUNDS_CACHED,
        MAX_SCENES_CACHED,
        assets,
    )

    // Configure client settings
    client.SetTitle("Platformer")
    client.SetResizable(true)
    client.SetMinimumLoadTime(30)

    // Register scene One
    err := client.RegisterScene(
        scenes.SceneOne.Name,
        scenes.SceneOne.Width,
        scenes.SceneOne.Height,
        scenes.SceneOne.Plan,
        []coldbrew.RenderSystem{},
        []coldbrew.ClientSystem{},
        []blueprint.CoreSystem{},
    )
    if err != nil {
        log.Fatal(err)
    }

    // Register global systems
    client.RegisterGlobalRenderSystem(
        coldbrew_rendersystems.GlobalRenderer{},
    )

    // Activate the camera
    client.ActivateCamera()

    // Run the client
    if err := client.Start(); err != nil {
        log.Fatal(err)
    }
}
```

{{< callout context="note" title="Note" icon="outline/info-circle" >}}

For the `coldbrew_rendersystems` import you will likely need to run (again):

```bash
go mod tidy
```

{{< /callout >}}

When you run the game now, you should see your first scene with its beautiful parallax background:

![First Scene Background](images/platformer_tut/background_loaded.png)

### What's Happening Here?

We've made three crucial additions to get our scene running:

1. **Scene Registration**: Using `client.RegisterScene()`, we register SceneOne with all its properties. For now, we're passing empty slices for our systems - we'll add those later as we build out game functionality.

2. **Global Renderer**: The `GlobalRenderer` is a default rendering system provided by coldbrew that handles basic scene rendering. We register it using `RegisterGlobalRenderSystem()`.

3. **Camera Activation**: `ActivateCamera()` sets up our view into the game world. This is essential for seeing our parallax background in action.

With these pieces in place, our game now has its first visual elements!

## Adding the Player

Now that we have a basic scene, let's add a playable character. First, we'll set up animations for our character's different states.

### Setting Up Animations

Create an `/animations` directory in the project root and add the following file:

```go{title="animations/animations.go"}
package animations

import (
    blueprintclient "github.com/TheBitDrifter/blueprint/client"
    "github.com/TheBitDrifter/blueprint/vector"
)

var IdleAnimation = blueprintclient.AnimationData{
    Name:        "idle",
    RowIndex:    0,
    FrameCount:  6,
    FrameWidth:  144,
    FrameHeight: 116,
    Speed:       8,
}

var RunAnimation = blueprintclient.AnimationData{
    Name:        "run",
    RowIndex:    1,
    FrameCount:  8,
    FrameWidth:  144,
    FrameHeight: 116,
    Speed:       5,
}

var JumpAnimation = blueprintclient.AnimationData{
    Name:           "jump",
    RowIndex:       2,
    FrameCount:     3,
    FrameWidth:     144,
    FrameHeight:    116,
    Speed:          5,
    Freeze:         true,
    PositionOffset: vector.Two{X: 0, Y: 10},
}

var FallAnimation = blueprintclient.AnimationData{
    Name:           "fall",
    RowIndex:       3,
    FrameCount:     3,
    FrameWidth:     144,
    FrameHeight:    116,
    Speed:          5,
    Freeze:         true,
    PositionOffset: vector.Two{X: 0, Y: 10},
}
```

Each animation is defined by several key properties:

- `Name`: Identifier for easier animation management
- `RowIndex`: The row in the sprite sheet containing the animation frames
- `FrameCount`: Number of frames in the animation
- `FrameWidth/Height`: Dimensions of each frame
- `Speed`: Ticks per animation frame
- `Freeze`: When true, holds the last frame instead of looping
- `PositionOffset`: Allows fine-tuning of the animation position

### Creating the Player Entity

Now let's add a helper function to create our player. Add this to your scenes file:

```go{title="scenes/scenes.go"}

import (
 "platformer/animations"

 "github.com/TheBitDrifter/blueprint"
 "github.com/TheBitDrifter/blueprint/vector"
 "github.com/TheBitDrifter/warehouse"

 // New Imports:
 blueprintclient "github.com/TheBitDrifter/blueprint/client"
 blueprintinput "github.com/TheBitDrifter/blueprint/input"
 blueprintmotion "github.com/TheBitDrifter/blueprint/motion"
 blueprintspatial "github.com/TheBitDrifter/blueprint/spatial"
)
func NewPlayer(sto warehouse.Storage, x, y float64) error {
    // Get or create the archetype
    playerArchetype, err := sto.NewOrExistingArchetype(
        blueprintspatial.Components.Position,
        blueprintspatial.Components.Position,
        blueprintspatial.Components.Shape,
        blueprintspatial.Components.Direction,
        blueprintmotion.Components.Dynamics,
        blueprintinput.Components.InputBuffer,
        blueprintclient.Components.CameraIndex,
        blueprintclient.Components.SpriteBundle,
        blueprintclient.Components.SoundBundle,
    )

    // Position state
    playerPos := blueprintspatial.NewPosition(x, y)
    // Hitbox state
    playerHitbox := blueprintspatial.NewRectangle(18, 58)
    // Physics state
    playerDynamics := blueprintmotion.NewDynamics(10)
    // Basic Direction State
    playerDirection := blueprintspatial.NewDirectionRight()
    // Input state
    playerInputBuffer := blueprintinput.InputBuffer{ReceiverIndex: 0}
    // Camera Reference
    playerCameraIndex := blueprintclient.CameraIndex(0)
    // Sprite Reference
    playerSprites := blueprintclient.NewSpriteBundle().
        AddSprite("characters/box_man_sheet.png", true).
        WithAnimations(animations.IdleAnimation, animations.RunAnimation, animations.FallAnimation, animations.JumpAnimation).
        SetActiveAnimation(animations.IdleAnimation).
        WithOffset(vector.Two{X: -72, Y: -59}).
        WithPriority(20)

    // Generate the player
    err = playerArchetype.Generate(1,
        playerPos,
        playerHitbox,
        playerDynamics,
        playerDirection,
        playerInputBuffer,
        playerCameraIndex,
        playerSprites,
    )
    if err != nil {
        return err
    }
    return nil
}
```

{{< callout context="caution" title="Compiler Warning: Atomic Field Copy" icon="outline/alert-triangle" >}}
You may see a compiler warning about copying the atomic playerSprites field. This warning can be safely ignored as the copy only occurs during entity template instantiation. The template object is temporary and only used to initialize the entity's components. Once created, all runtime access to the entity's state is done through pointers, maintaining proper atomic field semantics.
{{< /callout >}}

### Understanding the Player Components

Bappa uses an [Archetypal ECS](https://github.com/SanderMertens/ecs-faq) approach, where entities are created from archetypes (groups of components). Let's examine some key components:

1. **Input Buffer**: The `playerInputBuffer` with `ReceiverIndex: 0` connects to Coldbrew's first input receiver. For our single-player game, we'll use the first receiver.

2. **Camera Index**: Similar to receivers, Coldbrew supports up to eight cameras. We use index 0 for our single camera setup.

3. **Sprite Bundle**: The Blueprint API helps set up player sprites and animations. We:
   - Add the sprite sheet
   - Configure animations
   - Set the initial animation
   - Position the sprite relative to its hitbox
   - Set render priority (20 means it renders above lower-priority elements)

### Adding the Player to Scene One

Finally, let's add the player to our scene:

```go{title="scenes/scene_one.go"}
func sceneOnePlan(height, width int, sto warehouse.Storage) error {
    // ...Existing background code...

    err = NewPlayer(sto, 100, 100)
    if err != nil {
        return err
    }
    return nil
}
```

Now when you run the game, you'll see our character idling in the corner:

![Static Player](images/platformer_tut/static_player.png)

## Adding Basic Movement

Before implementing our full platformer physics, let's start with some basic movement functionality. We'll need to set up input actions and create some systems to handle movement and physics.

### Setting Up Input Actions

First, let's create our action definitions:

```go{title="actions/actions.go"}
package actions

import (
    blueprintinput "github.com/TheBitDrifter/blueprint/input"
)

var (
    Left  = blueprintinput.NewInput()
    Right = blueprintinput.NewInput()
    Jump  = blueprintinput.NewInput()
    Down  = blueprintinput.NewInput()
)
```

### Mapping Keys to Actions

Now we'll update our main file to map keyboard keys to our actions:

```go{title="main.go"}
package main

import (

    // New Import:
    coldbrew_clientsystems "github.com/TheBitDrifter/coldbrew/clientsystems"
)

func main() {
    // ... Existing code

    // Register receiver/actions
    receiver1, _ := client.ActivateReceiver()
    receiver1.RegisterKey(ebiten.KeySpace, actions.Jump)
    receiver1.RegisterKey(ebiten.KeyW, actions.Jump)
    receiver1.RegisterKey(ebiten.KeyA, actions.Left)
    receiver1.RegisterKey(ebiten.KeyD, actions.Right)
    receiver1.RegisterKey(ebiten.KeyS, actions.Down)

    // Default client systems for camera mapping and receiver mapping
    client.RegisterGlobalClientSystem(
        coldbrew_clientsystems.InputBufferSystem{},
        &coldbrew_clientsystems.CameraSceneAssignerSystem{},
    )

    // Run the client
    if err := client.Start(); err != nil {
        log.Fatal(err)
    }
}
```

### Creating Core Systems

Let's create our first core systems. Create a `coresystems/` directory with these files:

```go{title="coresystems/player_movement_system.go"}
package coresystems

import (
    "platformer/actions"
    "github.com/TheBitDrifter/blueprint"
    blueprintinput "github.com/TheBitDrifter/blueprint/input"
    blueprintmotion "github.com/TheBitDrifter/blueprint/motion"
    blueprintspatial "github.com/TheBitDrifter/blueprint/spatial"
)

const (
    speed = 120.0
)

type PlayerMovementSystem struct{}

func (sys PlayerMovementSystem) Run(scene blueprint.Scene, dt float64) error {
    // Query all entities with input buffers (players)
    cursor := scene.NewCursor(blueprint.Queries.InputBuffer)

    for range cursor.Next() {
        dyn := blueprintmotion.Components.Dynamics.GetFromCursor(cursor)
        incomingInputs := blueprintinput.Components.InputBuffer.GetFromCursor(cursor)
        direction := blueprintspatial.Components.Direction.GetFromCursor(cursor)

        _, pressedLeft := incomingInputs.ConsumeInput(actions.Left)
        if pressedLeft {
            direction.SetLeft()
            dyn.Vel.X = -speed
        }

        _, pressedRight := incomingInputs.ConsumeInput(actions.Right)
        if pressedRight {
            direction.SetRight()
            dyn.Vel.X = speed
        }

        _, pressedUp := incomingInputs.ConsumeInput(actions.Jump)
        if pressedUp {
            dyn.Vel.Y = -speed
        }

        _, pressedDown := incomingInputs.ConsumeInput(actions.Down)
        if pressedDown {
            dyn.Vel.Y = speed
        }
    }
    return nil
}
```

```go{title="coresystems/friction_system.go"}
package coresystems

import (
    "github.com/TheBitDrifter/blueprint"
    blueprintmotion "github.com/TheBitDrifter/blueprint/motion"
    "github.com/TheBitDrifter/tteokbokki/motion"
)

const (
    DEFAULT_FRICTION = 0.5
    DEFAULT_DAMP     = 0.9
)

type FrictionSystem struct{}

func (FrictionSystem) Run(scene blueprint.Scene, dt float64) error {
    // Iterate through entities with dynamics components(physics)
    cursor := scene.NewCursor(blueprint.Queries.Dynamics)
    for range cursor.Next() {
        // Get the dynamics
        dyn := blueprintmotion.Components.Dynamics.GetFromCursor(cursor)
        friction := motion.Forces.Generator.NewHorizontalFrictionForce(dyn.Vel, DEFAULT_FRICTION)
        motion.Forces.AddForce(dyn, friction)

        motion.Forces.Generator.ApplyHorizontalDamping(dyn, DEFAULT_DAMP)
    }
    return nil
}
```

```go{title="coresystems/common.go"}
package coresystems

import (
    "github.com/TheBitDrifter/blueprint"
    tteo_coresystems "github.com/TheBitDrifter/tteokbokki/coresystems"
)

var DefaultCoreSystems = []blueprint.CoreSystem{
    FrictionSystem{},
    PlayerMovementSystem{},
    tteo_coresystems.IntegrationSystem{}, // Update velocities and positions
    tteo_coresystems.TransformSystem{},   // Update collision shapes
}
```

The systems work together to handle player movement:

1. `PlayerMovementSystem` uses `ConsumeInput()` to check for our basic actions and updates player velocity and direction accordingly.

2. `FrictionSystem` applies friction and damping forces so the player stops naturally. We're only applying horizontal friction for now, as gravity will handle vertical movement later.

3. `common.go` bundles our systems with the default physics systems from Bappa for easy scene assignment.

### Registering the Systems

Finally, let's update our scene registration to use these systems:

```go{title="main.go"}
import (
    "platformer/coresystems"
)

func main() {
    err := client.RegisterScene(
        scenes.SceneOne.Name,
        scenes.SceneOne.Width,
        scenes.SceneOne.Height,
        scenes.SceneOne.Plan,
        []coldbrew.RenderSystem{},
        []coldbrew.ClientSystem{},
        coresystems.DefaultCoreSystems,  // Register our core systems
    )
}
```

With these systems in place, you can now move the player using WASD keys! The player should move smoothly and come to a stop when you release the keys thanks to our friction system.

## Make the Camera Follow the Player

To make the camera follow our player we need to create our first client system! Lets create a directory `/clientsystems`.
Inside goes `camera_follower_system.go` and another `common.go`:

```go{title="/clientsystems/camera_follower_system.go"}

package clientsystems

import (
 "math"

 blueprintclient "github.com/TheBitDrifter/blueprint/client"
 blueprintinput "github.com/TheBitDrifter/blueprint/input"
 blueprintspatial "github.com/TheBitDrifter/blueprint/spatial"
 "github.com/TheBitDrifter/blueprint/vector"
 "github.com/TheBitDrifter/coldbrew"
 "github.com/TheBitDrifter/warehouse"
)

type CameraFollowerSystem struct{}

func (CameraFollowerSystem) Run(cli coldbrew.LocalClient, scene coldbrew.Scene) error {
 // Query players who have a camera (camera index component)
 playersWithCamera := warehouse.Factory.NewQuery()
 playersWithCamera.And(
  blueprintspatial.Components.Position,
  blueprintinput.Components.InputBuffer,
  blueprintclient.Components.CameraIndex,
 )
 playerCursor := scene.NewCursor(playersWithCamera)
 for range playerCursor.Next() {
  // Get the players position
  playerPos := blueprintspatial.Components.Position.GetFromCursor(playerCursor)
  // Get the players camera
  camIndex := int(*blueprintclient.Components.CameraIndex.GetFromCursor(playerCursor))
  cam := cli.Cameras()[camIndex]
  // Get the cameras local scene position
  _, cameraScenePosition := cam.Positions()

  // Center camera directly on player (offset by half camera size)
  cameraScenePosition.X = math.Round(playerPos.X - float64(cam.Surface().Bounds().Dx())/2)
  cameraScenePosition.Y = math.Round(playerPos.Y - float64(cam.Surface().Bounds().Dy())/2)

  // Lock the camera to the scene boundaries
  lockCameraToSceneBoundaries(cam, scene, cameraScenePosition)
 }
 return nil
}

// lockCameraToSceneBoundaries constrains camera position within scene boundaries
func lockCameraToSceneBoundaries(cam coldbrew.Camera, scene coldbrew.Scene, cameraPos *vector.Two) {
 sceneWidth := scene.Width()
 sceneHeight := scene.Height()
 camWidth, camHeight := cam.Dimensions()
 // Calculate maximum positions to keep camera within scene bounds
 maxX := sceneWidth - camWidth
 maxY := sceneHeight - camHeight
 // Constrain camera X position
 if cameraPos.X > float64(maxX) {
  cameraPos.X = float64(maxX)
 }
 if cameraPos.X < 0 {
  cameraPos.X = 0
 }
 // Constrain camera Y position
 if cameraPos.Y > float64(maxY) {
  cameraPos.Y = float64(maxY)
 }
 if cameraPos.Y < 0 {
  cameraPos.Y = 0
 }
}

```

```go{title="/clientsystems/common.go"}

package clientsystems

import (
 "github.com/TheBitDrifter/coldbrew"
 coldbrew_clientsystems "github.com/TheBitDrifter/coldbrew/clientsystems"
)

var DefaultClientSystems = []coldbrew.ClientSystem{
 &CameraFollowerSystem{},
 &coldbrew_clientsystems.BackgroundScrollSystem{},
}
```

The camera follower system queries the player and uses their `cameraIndex` to get the Camera. Then it sets the centers and sets the Camera Position
on the player. `lockCameraToSceneBoundaries` keeps the camera within the level boundaries (even if the player is not!).

In `common.go` we once again define a slice of common systems for ease of use. Notice that we add the default
`BackgroundScrollSystem`. In conjunction with the `GlobalRenderer` and the speeds we defined when creating the background, this system
will slide the background layers for us!

Now lets head to `main.go` and update our scene to use the `DefaultClientSystems`:

```go{title="main.go"}
func main() {

  // ...Existing code

 err := client.RegisterScene(
  scenes.SceneOne.Name,
  scenes.SceneOne.Width,
  scenes.SceneOne.Height,
  scenes.SceneOne.Plan,
  []coldbrew.RenderSystem{},
    // Replace the []colbrew.ClientSystems{} slice with DefaultClientSystems
  clientsystems.DefaultClientSystems,
  coresystems.DefaultCoreSystems,
 )
}


```

Now we have a camera that follows our player!

## Adding basic collisions

Now that we can move the player around lets make it so we can crash into things! We need to create a new archetype for terrain.
Eventually we will have two types, one way platforms and standard block terrain. Since one way platforms are a lot more involved
its better to isolate the collision logic for these two types. To set this up were going to create a special kind of `tag` component
to differentiate terrains types.

To create a custom tag start by creating a `/components` directory. Inside `/components`:

```go{title="/components/tags.go"}

package components

import "github.com/TheBitDrifter/warehouse"

var (
 BlockTerrainTag = warehouse.FactoryNewComponent[struct{}]()
 PlatformTag     = warehouse.FactoryNewComponent[struct{}]()
)
```

Now we can write some helper functions in `scene.go` to create the terrain:

```go{title="/scenes/scene.go"}

// ...Existing code

func NewFloor(sto warehouse.Storage, y float64) error {
 terrainArchetype, err := sto.NewOrExistingArchetype(
  blueprintclient.Components.SpriteBundle,
  components.BlockTerrainTag,
  blueprintspatial.Components.Shape,
  blueprintspatial.Components.Position,
  blueprintmotion.Components.Dynamics,
 )
 if err != nil {
  return err
 }
 return terrainArchetype.Generate(1,
  blueprintspatial.NewPosition(1500, y),
  blueprintspatial.NewRectangle(4000, 50),
  blueprintclient.NewSpriteBundle().
   AddSprite("terrain/floor.png", true).
   WithOffset(vector.Two{X: -1500, Y: -25}),
 )
}

func NewInvisibleWalls(sto warehouse.Storage, width, height int) error {
 terrainArchetype, err := sto.NewOrExistingArchetype(
  blueprintclient.Components.SpriteBundle,
  components.BlockTerrainTag,
  blueprintspatial.Components.Shape,
  blueprintspatial.Components.Position,
  blueprintmotion.Components.Dynamics,
 )
 if err != nil {
  return err
 }
 // Wall left (invisible)
 err = terrainArchetype.Generate(1,
  blueprintspatial.NewRectangle(10, float64(height+300)),
  blueprintspatial.NewPosition(0, 0),
 )
 if err != nil {
  return err
 }
 // Wall right (invisible)
 return terrainArchetype.Generate(1,
  blueprintspatial.NewRectangle(10, float64(height+300)),
  blueprintspatial.NewPosition(float64(width), 0),
 )
}

func NewBlock(sto warehouse.Storage, x, y float64) error {
 terrainArchetype, err := sto.NewOrExistingArchetype(
  blueprintclient.Components.SpriteBundle,
  components.BlockTerrainTag,
  blueprintspatial.Components.Shape,
  blueprintspatial.Components.Position,
  blueprintmotion.Components.Dynamics,
 )
 if err != nil {
  return err
 }
 return terrainArchetype.Generate(1,
  blueprintspatial.NewPosition(x, y),
  blueprintspatial.NewRectangle(64, 75),
  blueprintclient.NewSpriteBundle().
   AddSprite("terrain/block.png", true).
   WithOffset(vector.Two{X: -33, Y: -38}),
 )
}
```

And now in our scene we can invoke the functions populate game state:

```go{title="/scenes/scene_one.go"}

// ...Existing code
func sceneOnePlan(height, width int, sto warehouse.Storage) error {
 err := blueprint.NewParallaxBackgroundBuilder(sto).
  AddLayer("backgrounds/city/sky.png", 0.025, 0.025).
  AddLayer("backgrounds/city/far.png", 0.025, 0.05).
  AddLayer("backgrounds/city/mid.png", 0.1, 0.1).
  AddLayer("backgrounds/city/near.png", 0.2, 0.2).
  Build()
 if err != nil {
  return err
 }

 err = NewPlayer(sto, 100, 100)
 if err != nil {
  return err
 }
 err = NewInvisibleWalls(sto, width, height)
 if err != nil {
  return err
 }
 err = NewBlock(sto, 285, 390)
 if err != nil {
  return err
 }

 err = NewFloor(sto, 460)
 if err != nil {
  return err
 }
 return nil
}
```

Now we can create the new collision system:

```go{title="/coresystems/player_block_collision_system.go"}

package coresystems

import (
 "platformer/components"

 "github.com/TheBitDrifter/blueprint"
 blueprintmotion "github.com/TheBitDrifter/blueprint/motion"
 blueprintspatial "github.com/TheBitDrifter/blueprint/spatial"
 "github.com/TheBitDrifter/tteokbokki/motion"
 "github.com/TheBitDrifter/tteokbokki/spatial"
 "github.com/TheBitDrifter/warehouse"
)

type PlayerBlockCollisionSystem struct{}

func (s PlayerBlockCollisionSystem) Run(scene blueprint.Scene, dt float64) error {
 // Create cursors
 blockTerrainQuery := warehouse.Factory.NewQuery().And(components.BlockTerrainTag)
 blockTerrainCursor := scene.NewCursor(blockTerrainQuery)
 playerCursor := scene.NewCursor(blueprint.Queries.InputBuffer)

 // Outer loop is blocks
 for range blockTerrainCursor.Next() {
  // Inner is players
  for range playerCursor.Next() {
   // Delegate to helper
   err := s.resolve(scene, blockTerrainCursor, playerCursor) // Now pass in the scene
   if err != nil {
    return err
   }
  }
 }
 return nil
}

// Main collision logic
func (PlayerBlockCollisionSystem) resolve(scene blueprint.Scene, blockCursor, playerCursor *warehouse.Cursor) error {
 // Get the player pos, shape, and dynamics
 playerPosition := blueprintspatial.Components.Position.GetFromCursor(playerCursor)
 playerShape := blueprintspatial.Components.Shape.GetFromCursor(playerCursor)
 playerDynamics := blueprintmotion.Components.Dynamics.GetFromCursor(playerCursor)

 // Get the block pos, shape, and dynamics
 blockPosition := blueprintspatial.Components.Position.GetFromCursor(blockCursor)
 blockShape := blueprintspatial.Components.Shape.GetFromCursor(blockCursor)
 blockDynamics := blueprintmotion.Components.Dynamics.GetFromCursor(blockCursor)

 // Check for a collision
 if ok, collisionResult := spatial.Detector.Check(
  *playerShape, *blockShape, playerPosition.Two, blockPosition.Two,
 ); ok {
  // Otherwise resolve as normal
  motion.Resolver.Resolve(
   &playerPosition.Two,
   &blockPosition.Two,
   playerDynamics,
   blockDynamics,
   collisionResult,
  )
 }
 return nil
}
```

```go{title="coresystems/common.go"}
package coresystems

import (
 "github.com/TheBitDrifter/blueprint"
 tteo_coresystems "github.com/TheBitDrifter/tteokbokki/coresystems"
)

var DefaultCoreSystems = []blueprint.CoreSystem{
 FrictionSystem{},
 PlayerMovementSystem{},
 tteo_coresystems.IntegrationSystem{}, // Update velocities and positions
 tteo_coresystems.TransformSystem{},   // Update collision shapes

 // Add the collision system at the bottom
 PlayerBlockCollisionSystem{},
}
```

Inside `main.go` I also recommend registering the default debug viewer:

```go{title="main.go"}

func main() {

  // ...Existing code

 client.RegisterGlobalRenderSystem(
  coldbrew_rendersystems.GlobalRenderer{},

  // Add the debug system:
  &coldbrew_rendersystems.DebugRenderer{},
 )
}
```

This system allows the toggling of hit-box previews by pressing the 0 key!

## Proper Movement and Gravity

Now that we have working collisions its time to add gravity and create a 'proper' platforming movement system. Lets begin
by adding a new core gravity system:

```go{title="/coresystems/gravitysystem.go"}

package coresystems

import (
 "github.com/TheBitDrifter/blueprint"
 blueprintmotion "github.com/TheBitDrifter/blueprint/motion"
 "github.com/TheBitDrifter/tteokbokki/motion"
)

const (
 DEFAULT_GRAVITY  = 9.8
 PIXELS_PER_METER = 50.0
)

type GravitySystem struct{}

func (GravitySystem) Run(scene blueprint.Scene, dt float64) error {
 // Iterate through entities with dynamics components(physics)
 cursor := scene.NewCursor(blueprint.Queries.Dynamics)
 for range cursor.Next() {
  // Get the dynamics
  dyn := blueprintmotion.Components.Dynamics.GetFromCursor(cursor)

  // Get the mass
  mass := 1 / dyn.InverseMass

  // Use the motion package to calc the gravity force
  gravity := motion.Forces.Generator.NewGravityForce(mass, DEFAULT_GRAVITY, PIXELS_PER_METER)

  // Apply the force
  motion.Forces.AddForce(dyn, gravity)
 }
 return nil
}
```

```go{title="/coresystems/common.go"}
var DefaultCoreSystems = []blueprint.CoreSystem{
  GravitySystem{}, // Add me

  FrictionSystem{},
  PlayerMovementSystem{},
  tteo_coresystems.IntegrationSystem{},
  tteo_coresystems.TransformSystem{},
  PlayerBlockCollisionSystem{},
}
```

Now that we have gravity enabled it's time to redo the movement system. While the horizontal movement is fine,
we need to introduce he concept of jumping. People can't jump when they're not on top on things right? So in order to
add jumping mechanics we need to start tracking if the player is grounded or not. Lets begin by introducing a custom
`OnGround` component:

```go{title="/components/component.go"}
package components

import "github.com/TheBitDrifter/warehouse"

type OnGround struct {
 Landed, LastTouch int
}

var OnGroundComponent = warehouse.FactoryNewComponent[OnGround]()
```

Now we need to update the `PlayerBlockCollisionSystem` to use this component:

```go{title="/coresystems/player_block_collision_system.go"}
// ...Existing code

func (PlayerBlockCollisionSystem) resolve(scene blueprint.Scene, blockCursor, playerCursor *warehouse.Cursor) error {
 // Get the player pos, shape, and dynamics
 playerPosition := blueprintspatial.Components.Position.GetFromCursor(playerCursor)
 playerShape := blueprintspatial.Components.Shape.GetFromCursor(playerCursor)
 playerDynamics := blueprintmotion.Components.Dynamics.GetFromCursor(playerCursor)

 // Get the block pos, shape, and dynamics
 blockPosition := blueprintspatial.Components.Position.GetFromCursor(blockCursor)
 blockShape := blueprintspatial.Components.Shape.GetFromCursor(blockCursor)
 blockDynamics := blueprintmotion.Components.Dynamics.GetFromCursor(blockCursor)

 // Check for a collision
 if ok, collisionResult := spatial.Detector.Check(
  *playerShape, *blockShape, playerPosition.Two, blockPosition.Two,
 ); ok {
  // Otherwise resolve as normal
  motion.Resolver.Resolve(
   &playerPosition.Two,
   &blockPosition.Two,
   playerDynamics,
   blockDynamics,
   collisionResult,
  )

  // Add ground handling  here:
  currentTick := scene.CurrentTick()
  playerAlreadyGrounded, onGround := components.OnGroundComponent.GetFromCursorSafe(playerCursor)

  // Update onGround accordingly (create or update)
  if !playerAlreadyGrounded {
   playerEntity, err := playerCursor.CurrentEntity()
   if err != nil {
    return err
   }
   // We cannot mutate during a cursor iteration, so we use the enqueue API
   err = playerEntity.EnqueueAddComponentWithValue(
    components.OnGroundComponent,
    components.OnGround{LastTouch: currentTick, Landed: currentTick},
   )
   if err != nil {
    return err
   }
  } else {
   onGround.LastTouch = scene.CurrentTick()
  }
 }
 return nil
}
```

Some things to note here:

1. We use the `GetFromCursorSafe` API to check and safely access the `OnGround` component.
2. We cannot mutate a entities composition while iterating so we leverage the `Enqueue` API.

Next up we need a clearing system to remove the `OnGround` component. We could do it inside the collision system,
but I prefer a dedicated approach:

```go{title="/coresystems/onground_clearing_system.go"}

package coresystems

import (
 "platformer/components"

 "github.com/TheBitDrifter/blueprint"
 "github.com/TheBitDrifter/warehouse"
)

type OnGroundClearingSystem struct{}

func (OnGroundClearingSystem) Run(scene blueprint.Scene, dt float64) error {
 const expirationTicks = 15

 onGroundQuery := warehouse.Factory.NewQuery().And(components.OnGroundComponent)
 onGroundCursor := scene.NewCursor(onGroundQuery)

 // Iterate through matched entities
 for range onGroundCursor.Next() {
  onGround := components.OnGroundComponent.GetFromCursor(onGroundCursor)

  // If it's expired, remove it
  if scene.CurrentTick()-onGround.LastTouch > expirationTicks {
   groundedEntity, _ := onGroundCursor.CurrentEntity()

   // We can't mutate while iterating so we enqueue the changes instead
   err := groundedEntity.EnqueueRemoveComponent(components.OnGroundComponent)
   if err != nil {
    return err
   }
  }
 }
 return nil
}
```

```go{title="/coresystems/common.go"}

// ...Existing code
var DefaultCoreSystems = []blueprint.CoreSystem{
 GravitySystem{},
 FrictionSystem{},
 PlayerMovementSystem{},
 tteo_coresystems.IntegrationSystem{},
 tteo_coresystems.TransformSystem{},
 PlayerBlockCollisionSystem{},

 // Add me
 OnGroundClearingSystem{},
}
```

We query entities that have the `OnGround` component and if they haven't touched ground within the expiry limit, we enqueue
the removal.

Now we can finally update the `PlayerMovementSystem` with ground tracking accordingly:

```go{title="/coresystems/player_movement_system.go"}
 package coresystems

import (
 "components"
 "github.com/TheBitDrifter/blueprint"
 "github.com/TheBitDrifter/warehouse"
)

type OnGroundClearingSystem struct{}

func (OnGroundClearingSystem) Run(scene blueprint.Scene, dt float64) error {
 // Define the expiration time in ticks
 // 15 is a bit of a magic number— what matters is that the value is greater than coyote timer
 // Systems should also check lastTouch alongside presence to avoid odd behavior
 const expirationTicks = 15

 // Query any entity that has onGround
 onGroundQuery := warehouse.Factory.NewQuery().And(components.OnGroundComponent)
 onGroundCursor := scene.NewCursor(onGroundQuery)

 // Iterate through matched entities
 for range onGroundCursor.Next() {
  // Get the onGround component state
  onGround := components.OnGroundComponent.GetFromCursor(onGroundCursor)

  // If it's expired, remove it
  if scene.CurrentTick()-onGround.LastTouch > expirationTicks {
   groundedEntity, _ := onGroundCursor.CurrentEntity()

   // We can't mutate while iterating so we enqueue the changes instead
   err := groundedEntity.EnqueueRemoveComponent(components.OnGroundComponent)
   if err != nil {
    return err
   }
  }
 }
 return nil
}
```

## Fixing Bugs — Corner Snapping and Side Wall Jumping

While our new movement system might seem solid at first glance there's some issues that need to be worked out.
If we take a look at the video below we can see two issues:

1. Corner Snapping — When hugging the corner and jumping the player can trigger a collision with their bottom face, and
   the top face of terrain despite having upwards velocity. This confuses the resolver and creates a sticky or snapping effect.

2. Side Jumping — Currently the collision systems marks the player as grounded for ANY collision not just the top. While
   some games do provide wall jumping with the way it is now, the player can accumulate massive amounts of y velocity
   using the sides of terrain.

On the bright side these are super quick and easy to fix:

```go{title="/coresystems/player_block_collision_system.go"}

 // ...Existing code

 func (PlayerBlockCollisionSystem) resolve(scene blueprint.Scene, blockCursor, playerCursor *warehouse.Cursor) error {
 // Get the player pos, shape, and dynamics
 playerPosition := blueprintspatial.Components.Position.GetFromCursor(playerCursor)
 playerShape := blueprintspatial.Components.Shape.GetFromCursor(playerCursor)
 playerDynamics := blueprintmotion.Components.Dynamics.GetFromCursor(playerCursor)

 // Get the block pos, shape, and dynamics
 blockPosition := blueprintspatial.Components.Position.GetFromCursor(blockCursor)
 blockShape := blueprintspatial.Components.Shape.GetFromCursor(blockCursor)
 blockDynamics := blueprintmotion.Components.Dynamics.GetFromCursor(blockCursor)

 // Check for a collision
 if ok, collisionResult := spatial.Detector.Check(
  *playerShape, *blockShape, playerPosition.Two, blockPosition.Two,
 ); ok {

  // KEY CHANGE----------- :
  playerOnTopOfBlock := collisionResult.IsTopB()
  blockOnTopOfPlayer := collisionResult.IsTop()

  // Prevents snapping on AAB corner transitions/collisions
  if playerOnTopOfBlock && playerDynamics.Vel.Y < 0 {
   return nil
  }
  if blockOnTopOfPlayer && playerDynamics.Vel.Y > 0 {
   return nil
  }

  // ----------

  // Otherwise resolve as normal
  motion.Resolver.Resolve(
   &playerPosition.Two,
   &blockPosition.Two,
   playerDynamics,
   blockDynamics,
   collisionResult,
  )



  // KEY CHANGE----------- :
  if !playerOnTopOfBlock {
   return nil
  }
  // ----------

  currentTick := scene.CurrentTick()
  playerAlreadyGrounded, onGround := components.OnGroundComponent.GetFromCursorSafe(playerCursor)
  // Update onGround accordingly (create or update)
  if !playerAlreadyGrounded {
   playerEntity, err := playerCursor.CurrentEntity()
   if err != nil {
    return err
   }
   // We cannot mutate during a cursor iteration, so we use the enqueue API
   err = playerEntity.EnqueueAddComponentWithValue(
    components.OnGroundComponent,
    components.OnGround{LastTouch: currentTick, Landed: currentTick},
   )
   if err != nil {
    return err
   }
  } else {
   onGround.LastTouch = scene.CurrentTick()
  }
 }
 return nil
}
```

By checking the collision data and the players velocity we fix the two issues. The two key changes that do this, are
highlighted in the snippet above!

## Adding One Way Platforms

With block style terrain working, the next challenge is one way platforms. What makes it especially tricky is that
we're working in a discrete system, but the solution to the platform problem is inherently continuous. The crux of the
issue is that you can actually enter a top-bottom/player-platform collision from a previous position of the side, bottom,
or top. It's only a valid collision if were coming from the top, but if you only have the current frame data you're left
unable to determine this.

So our solution is to introduce a tiny bit of state to the `PlayerPlatformCollisionSystem`, to
track the players last n positions. We can then check if they cleared the platform recently enough for it to be considered
valid. Some would argue that the system should not contain state in a proper ECS. I don't disagree, but sometimes when
it's simple and easy enough, I don't mind breaking the rules to solve the problem is a more straightforward way.

To get started lets define a helper function to create the platforms:

```go{title="/scenes/scene.go"}

// ...Existing code

func NewPlatform(sto warehouse.Storage, x, y float64) error {
 platformArche, err := sto.NewOrExistingArchetype(
  components.PlatformTag,
  blueprintclient.Components.SpriteBundle,
  blueprintspatial.Components.Shape,
  blueprintspatial.Components.Position,
  blueprintmotion.Components.Dynamics,
 )
 if err != nil {
  return err
 }
 return platformArche.Generate(1,
  blueprintspatial.NewPosition(x, y),
  blueprintspatial.NewTriangularPlatform(144, 16),
  blueprintclient.NewSpriteBundle().
   AddSprite("terrain/platform.png", true).
   WithOffset(vector.Two{X: -72, Y: -8}),
 )
}
```

And now we can place a some:

```go{title="scenes/scene_one.go"}

 func sceneOnePlan(height, width int, sto warehouse.Storage) error {

 // ...Existing code

 err = NewPlatform(sto, 130, 350)
 if err != nil {
  return err
 }
 err = NewPlatform(sto, 220, 270)
 if err != nil {
  return err
 }
 err = NewPlatform(sto, 320, 170)
 if err != nil {
  return err
 }
 err = NewPlatform(sto, 420, 300)
 if err != nil {
  return err
 }
 return nil
}
```

Finally lets write the system and append to the `DefaultCoreSystems`!

```go{title="/coresystems/player_platform_collision_system.go"}

package coresystems

import (
 "platformer/components"

 "github.com/TheBitDrifter/blueprint"

 blueprintmotion "github.com/TheBitDrifter/blueprint/motion"
 blueprintspatial "github.com/TheBitDrifter/blueprint/spatial"
 "github.com/TheBitDrifter/blueprint/vector"
 "github.com/TheBitDrifter/tteokbokki/motion"
 "github.com/TheBitDrifter/tteokbokki/spatial"
 "github.com/TheBitDrifter/warehouse"
)

type PlayerPlatformCollisionSystem struct {
 playerLastPositions []vector.Two
 maxPositionsToTrack int
}

func NewPlayerPlatformCollisionSystem() *PlayerPlatformCollisionSystem {
 trackCount := 15 // higher count == more tunneling protection == higher cost
 return &PlayerPlatformCollisionSystem{
  playerLastPositions: make([]vector.Two, 0, trackCount),
  maxPositionsToTrack: trackCount,
 }
}

func (s *PlayerPlatformCollisionSystem) Run(scene blueprint.Scene, dt float64) error {
 platformTerrainQuery := warehouse.Factory.NewQuery().And(components.PlatformTag)
 platformCursor := scene.NewCursor(platformTerrainQuery)
 playerCursor := scene.NewCursor(blueprint.Queries.InputBuffer)

 for range platformCursor.Next() {
  for range playerCursor.Next() {
   err := s.resolve(scene, platformCursor, playerCursor)
   if err != nil {
    return err
   }
   playerPos := blueprintspatial.Components.Position.GetFromCursor(playerCursor)
   s.trackPosition(playerPos.Two)
  }
 }
 return nil
}

func (s *PlayerPlatformCollisionSystem) resolve(scene blueprint.Scene, platformCursor, playerCursor *warehouse.Cursor) error {
 // Get the player state
 playerShape := blueprintspatial.Components.Shape.GetFromCursor(playerCursor)
 playerPosition := blueprintspatial.Components.Position.GetFromCursor(playerCursor)
 playerDynamics := blueprintmotion.Components.Dynamics.GetFromCursor(playerCursor)

 // Get the platform state
 platformShape := blueprintspatial.Components.Shape.GetFromCursor(platformCursor)
 platformPosition := blueprintspatial.Components.Position.GetFromCursor(platformCursor)
 platformDynamics := blueprintmotion.Components.Dynamics.GetFromCursor(platformCursor)

 // Check for collision
 if ok, collisionResult := spatial.Detector.Check(
  *playerShape, *platformShape, playerPosition.Two, platformPosition.Two,
 ); ok {

  // Check if any of the past player positions indicate the player was above the platform
  platformTop := platformShape.Polygon.WorldVertices[0].Y

  playerWasAbove := s.checkAnyPlayerPositionWasAbove(platformTop, playerShape.LocalAAB.Height)

  // We only want to resolve collisions when:
  // 1. The player is falling (vel.Y > 0)
  // 2. The collision is with the top of the platform
  // 3. The player was above the platform at some point (within n ticks)
  if playerDynamics.Vel.Y > 0 && collisionResult.IsTopB() && playerWasAbove {

   motion.Resolver.Resolve(
    &playerPosition.Two,
    &platformPosition.Two,
    playerDynamics,
    platformDynamics,
    collisionResult,
   )

   // Standard onGround handling
   currentTick := scene.CurrentTick()

   // If not grounded, enqueue onGround with values
   playerAlreadyGrounded, onGround := components.OnGroundComponent.GetFromCursorSafe(playerCursor)

   if !playerAlreadyGrounded {
    playerEntity, _ := playerCursor.CurrentEntity()
    err := playerEntity.EnqueueAddComponentWithValue(
     components.OnGroundComponent,
     components.OnGround{LastTouch: currentTick, Landed: currentTick},
    )
    if err != nil {
     return err
    }
   } else {
    onGround.LastTouch = scene.CurrentTick()
   }

  }
 }
 return nil
}

// trackPosition adds a position to the history and ensures only the last N are kept
func (s *PlayerPlatformCollisionSystem) trackPosition(pos vector.Two) {
 // Add the new position
 s.playerLastPositions = append(s.playerLastPositions, pos)

 // If we've exceeded our max, remove the oldest position
 if len(s.playerLastPositions) > s.maxPositionsToTrack {
  s.playerLastPositions = s.playerLastPositions[1:]
 }
}

// checkAnyPlayerPositionWasAbove checks if the player was above a non-rotated platform in any historical position
func (s *PlayerPlatformCollisionSystem) checkAnyPlayerPositionWasAbove(platformTop float64, playerHeight float64) bool {
 if len(s.playerLastPositions) == 0 {
  return false
 }

 // Check all stored positions to see if the player was above in any of them
 for _, pos := range s.playerLastPositions {
  playerBottom := pos.Y + playerHeight/2
  if playerBottom <= platformTop {
   return true // Found at least one position where player was above
  }
 }

 return false
}
```

```go{title="/coresystems/common.go"}

// ...Existing code

var DefaultCoreSystems = []blueprint.CoreSystem{
 GravitySystem{},
 FrictionSystem{},
 PlayerMovementSystem{},
 tteo_coresystems.IntegrationSystem{},
 tteo_coresystems.TransformSystem{},
 PlayerBlockCollisionSystem{},

 // Added with function here:
 NewPlayerPlatformCollisionSystem(),
 OnGroundClearingSystem{},
}
```

If we take a look at the `PlayerPlatformCollision` system, its basically the same as the `PlayerBlockCollisionSystem`
except it uses the helper function (`checkAnyPlayerPositionWasAbove()`) to determine valid collisions. Furthermore, we define then use the `NewPlayerPlatformCollisionSystem()` in `/coresystems/common.go`. This is significant because this method returns a pointer
system. This system must be passed by reference because it now has internal state for historical player positions.

## Descend Platforms

Okay for our last movement based feature lets add the functionality to descend platforms. First we need to introduce
a `IgnorePlatform` component:

```go{title="/components/components.go"}

 // ... Existing code

type IgnorePlatform struct {
 Items [5]struct {
  LastActive int
  EntityID   int
  Recycled   int
 }
}

var IgnorePlatformComponent = warehouse.FactoryNewComponent[IgnorePlatform]()
```

Now we can update the `PlayerMovementSystem`:

```go{title="/coresystems/player_movement_system.go"}

 // ...Existing code

 func (sys PlayerMovementSystem) Run(scene blueprint.Scene, dt float64) error {
 // Query all entities with input buffers (players)
 cursor := scene.NewCursor(blueprint.Queries.InputBuffer)

 for range cursor.Next() {
  dyn := blueprintmotion.Components.Dynamics.GetFromCursor(cursor)
  incomingInputs := blueprintinput.Components.InputBuffer.GetFromCursor(cursor)
  direction := blueprintspatial.Components.Direction.GetFromCursor(cursor)
  isGrounded := components.OnGroundComponent.CheckCursor(cursor)

  _, pressedLeft := incomingInputs.ConsumeInput(actions.Left)
  if pressedLeft {
   direction.SetLeft()
   dyn.Vel.X = -speed
  }

  _, pressedRight := incomingInputs.ConsumeInput(actions.Right)
  if pressedRight {
   direction.SetRight()

   dyn.Vel.X = speed
  }
  _, pressedUp := incomingInputs.ConsumeInput(actions.Jump)
  if pressedUp && isGrounded {
   dyn.Vel.Y = -jumpforce
  }

  // Add down handling here:
  _, pressedDown := incomingInputs.ConsumeInput(actions.Down)
  if pressedDown && !pressedUp { // <- you cant drop and jump same tick
   playerEntity, _ := cursor.CurrentEntity()
   err := playerEntity.EnqueueAddComponent(components.IgnorePlatformComponent)
   if err != nil {
    return err
   }
  }

 }
 return nil
}
```

And were gonna need another clearing system for this new component:

```go{title="/coresystems/ignore_platform_clearing_system.go"}

package coresystems

import (
 "platformer/components"

 "github.com/TheBitDrifter/blueprint"
 "github.com/TheBitDrifter/warehouse"
)

type IgnorePlatformClearingSystem struct{}

func (IgnorePlatformClearingSystem) Run(scene blueprint.Scene, dt float64) error {
 ignorePlatformQuery := warehouse.Factory.NewQuery().And(components.IgnorePlatformComponent)
 ignorePlatformCursor := scene.NewCursor(ignorePlatformQuery)

 const expirationTicks = 15

 for range ignorePlatformCursor.Next() {

  ignorePlatform := components.IgnorePlatformComponent.GetFromCursor(ignorePlatformCursor)
  currentTick := scene.CurrentTick()

  // Track if we have any active ignores left
  anyActive := false

  // Check each ignore entry
  for i := range ignorePlatform.Items {
   // Skip already cleared entries
   if ignorePlatform.Items[i].EntityID == 0 {
    continue
   }

   // Check if this entry has expired
   if currentTick-ignorePlatform.Items[i].LastActive > expirationTicks {
    // Clear this specific entry by setting its EntityID to 0
    ignorePlatform.Items[i].EntityID = 0
    ignorePlatform.Items[i].Recycled = 0
    ignorePlatform.Items[i].LastActive = 0

   } else {
    anyActive = true
   }
  }

  // If we don't have any active ignores left, remove the entire component
  if !anyActive {
   ignoringEntity, _ := ignorePlatformCursor.CurrentEntity()
   err := ignoringEntity.EnqueueRemoveComponent(components.IgnorePlatformComponent)
   if err != nil {
    return err
   }
  }
 }
 return nil
}

```

```go{title="/coresystems/common.go"}

// ...Existing code
var DefaultCoreSystems = []blueprint.CoreSystem{
 GravitySystem{},
 FrictionSystem{},
 PlayerMovementSystem{},
 tteo_coresystems.IntegrationSystem{},
 tteo_coresystems.TransformSystem{},
 PlayerBlockCollisionSystem{},
 NewPlayerPlatformCollisionSystem(),
 OnGroundClearingSystem{},

 // Added:
 IgnorePlatformClearingSystem{},
}
```

Finally we can update the `PlayerPlatformCollisionSystem`:

```go{title="player_platform_collision_system.go"}

// ...Existing code

func (s *PlayerPlatformCollisionSystem) resolve(scene blueprint.Scene, platformCursor, playerCursor *warehouse.Cursor) error {
 // Get the player state
 playerShape := blueprintspatial.Components.Shape.GetFromCursor(playerCursor)
 playerPosition := blueprintspatial.Components.Position.GetFromCursor(playerCursor)
 playerDynamics := blueprintmotion.Components.Dynamics.GetFromCursor(playerCursor)

 // Get the platform state
 platformShape := blueprintspatial.Components.Shape.GetFromCursor(platformCursor)
 platformPosition := blueprintspatial.Components.Position.GetFromCursor(platformCursor)
 platformDynamics := blueprintmotion.Components.Dynamics.GetFromCursor(platformCursor)

 // Check for collision
 if ok, collisionResult := spatial.Detector.Check(
  *playerShape, *platformShape, playerPosition.Two, platformPosition.Two,
 ); ok {

  // Adding IgnorePlatform Logic Part One --------------------
  ignoringPlatforms, ignorePlatform := components.IgnorePlatformComponent.GetFromCursorSafe(playerCursor)

  platformEntity, err := platformCursor.CurrentEntity()
  if err != nil {
   return err
  }
  if ignoringPlatforms {
   for _, ignored := range ignorePlatform.Items {
    if ignored.EntityID == int(platformEntity.ID()) && ignored.Recycled == platformEntity.Recycled() {
     return nil
    }
   }
  }

  //  ---------------------------------

  // Check if any of the past player positions indicate the player was above the platform
  platformTop := platformShape.Polygon.WorldVertices[0].Y

  playerWasAbove := s.checkAnyPlayerPositionWasAbove(platformTop, playerShape.LocalAAB.Height)

  // We only want to resolve collisions when:
  // 1. The player is falling (vel.Y > 0)
  // 2. The collision is with the top of the platform
  // 3. The player was above the platform at some point (within n ticks)
  if playerDynamics.Vel.Y > 0 && collisionResult.IsTopB() && playerWasAbove {

   motion.Resolver.Resolve(
    &playerPosition.Two,
    &platformPosition.Two,
    playerDynamics,
    platformDynamics,
    collisionResult,
   )

   // Standard onGround handling
   currentTick := scene.CurrentTick()

   // If not grounded, enqueue onGround with values
   playerAlreadyGrounded, onGround := components.OnGroundComponent.GetFromCursorSafe(playerCursor)

   if !playerAlreadyGrounded {
    playerEntity, _ := playerCursor.CurrentEntity()
    err := playerEntity.EnqueueAddComponentWithValue(
     components.OnGroundComponent,
     components.OnGround{LastTouch: currentTick, Landed: currentTick},
    )
    if err != nil {
     return err
    }
   } else {
    onGround.LastTouch = scene.CurrentTick()
   }

   // Adding IgnorePlatform Logic Part One --------------------
   // Here is where we do the actual ignore platform tracking!
   if ignoringPlatforms {
    // Use the maximum possible int64 value as initial comparison point
    var oldestTick int64 = math.MaxInt64
    oldestIndex := -1

    // Iterate through all ignored platforms
    for i, ignored := range ignorePlatform.Items {
     // Check if this platform entity is already in the ignore list
     // by comparing both entity ID and recycled status
     if ignored.EntityID == int(platformEntity.ID()) && ignored.Recycled == platformEntity.Recycled() {
      // Platform is already being ignored, no need to add it again
      return nil
     }

     // Track the item with the oldest "LastActive" timestamp
     // This helps us identify which item to replace if the ignore list is full
     if int64(ignored.LastActive) < oldestTick {
      oldestTick = int64(ignored.LastActive)
      oldestIndex = i
     }
    }

    // If we found an item to replace (oldestIndex != -1),
    // update that slot with the current platform entity's information
    if oldestIndex != -1 {
     // Replace the oldest ignored platform with the current one
     ignorePlatform.Items[oldestIndex].EntityID = int(platformEntity.ID())
     ignorePlatform.Items[oldestIndex].Recycled = platformEntity.Recycled()
     ignorePlatform.Items[oldestIndex].LastActive = currentTick
     return nil
    }
   }
   // ---------------------------------------

  }
 }
 return nil
}
```

In these snippets we introduce a new `IgnorePlatformComponent`. The choice to use an array over a slice isn't a huge deal
but it's worth talking about briefly. Bappa is an archetypal ECS that likes to store components of a given archetype
contiguously in memory via a table like structure. So if you can get away with pre-allocating the memory and use value semantics,
avoiding types like slices/maps which introduce indirection due to their dynamic sizing, the result should be a more optimal
cache friendly memory layout.

Inside the `PlayerMovementSystem` we enqueue the creation of the component when the player is pressing the down key.

We create a new `IgnorePlatformClearingSystem` and add it to the `DefaultCoreSystems` slice. This systems queries the
`IgnorePlatformComponent` entities and checks each array entry. If they're passed expiration they get cleared out. If
they're all expired we enqueue the removal of the component. Lastly, we update the `PlayerPlatformCollisionSystem`
in the highlighted sections. First we add a guard clause that returns early if were ignoring the current platform. At the
end we add the `IgnorePlatform` tracking logic.

## The Animation System

With the base movement covered it's time to show more than just an idle animation! Now we're going to create our second client system:

```go{title="/clientsystems/player_animation_system.go"}
package clientsystems

import (
 "math"
 "platformer/animations"
 "platformer/components"

 "github.com/TheBitDrifter/blueprint"
 blueprintclient "github.com/TheBitDrifter/blueprint/client"
 blueprintmotion "github.com/TheBitDrifter/blueprint/motion"
 "github.com/TheBitDrifter/coldbrew"
)

type PlayerAnimationSystem struct{}

func (PlayerAnimationSystem) Run(cli coldbrew.LocalClient, scene coldbrew.Scene) error {
 cursor := scene.NewCursor(blueprint.Queries.InputBuffer)

 for range cursor.Next() {
  // Get state
  bundle := blueprintclient.Components.SpriteBundle.GetFromCursor(cursor)
  spriteBlueprint := &bundle.Blueprints[0]
  dyn := blueprintmotion.Components.Dynamics.GetFromCursor(cursor)
  grounded, onGround := components.OnGroundComponent.GetFromCursorSafe(cursor)
  if grounded {
   grounded = scene.CurrentTick() == onGround.LastTouch
  }

  // Player is moving horizontal and grounded (running)
  if math.Abs(dyn.Vel.X) > 20 && grounded {
   spriteBlueprint.TryAnimation(animations.RunAnimation)

   // Player is moving down and not grounded (falling)
  } else if dyn.Vel.Y > 0 && !grounded {
   spriteBlueprint.TryAnimation(animations.FallAnimation)

   // Player is moving up and not grounded (jumping)
  } else if dyn.Vel.Y <= 0 && !grounded {
   spriteBlueprint.TryAnimation(animations.JumpAnimation)

   // Default: player is idle
  } else {
   spriteBlueprint.TryAnimation(animations.IdleAnimation)
  }
 }
 return nil
}
```

```go{title="/clientsystems/common.go"}

 // ...Existing code
 var DefaultClientSystems = []coldbrew.ClientSystem{
 &CameraFollowerSystem{},
 &coldbrew_clientsystems.BackgroundScrollSystem{},

 // Added:
 PlayerAnimationSystem{},
}
```

This system is pretty straightforward. We query the player entities and change their animation state based off various
component states. Primarily we check the grounded and velocity state to determine whether to play the falling, running,
jumping, or idle animation.

## Next Steps

Alright, at this point we're going to conclude the tutorial! There is still a lot more functionality that could be added
and if you're interested in things such as sounds, multiple scenes, multiple cameras, multiple players, LDTK, slopes, etc,
there are resources for you!

You can find [examples](bappa.net/examples), and [docs](bappa.net/docs) that go over Bappa functionality in depth. Furthermore, [Bappa-Create](https://github.com/TheBitDrifter/bappacreate)
includes multiple platformer templates that build directly upon this tutorial with the aformentioned functionality.

Thanks for following along, Happy coding!

Best, TBD

## CL

- FRICTION ON DYN CALLOUT
- WARNING ON ATOMIC SYNC CALLOUT
- LDTK CALLOUT
