---
title: "Teokbokki (Physics and Collisions)"
description: "Understanding and implementing physics with Bappa's tteokbokki physics system"
lead: ""
date: 2025-03-06T10:00:00+00:00
lastmod: 2025-03-06T10:00:00+00:00
draft: false
images: []
weight: 800
toc: true
---

Bappa includes a practical physics system named `tteokbokki` that provides fundamental physics capabilities for 2D games. While not as feature-rich as dedicated physics engines, it offers functionality that works well within Bappa's ECS architecture for most common 2D game scenarios.

## Physics Architecture Overview

The tteokbokki physics system is organized into several key modules:

1. **Spatial System**: Handles collision detection between different shape types
2. **Motion System**: Manages physical properties and movement
3. **Integration with ECS**: Leverages component-based architecture for efficient physics categorization

This modular approach allows you to use only the parts you need for your specific game requirements.

## Core Physics Components

### Dynamics Component

The `Dynamics` component represents the physical properties of an entity:

```go
type Dynamics struct {
    InverseMass        float64   // 1/mass (0 for immovable objects)
    InverseAngularMass float64   // 1/moment of inertia
    Vel                vector.Two // Linear velocity
    Accel              vector.Two // Linear acceleration
    AngularVel         float64   // Angular velocity
    AngularAccel       float64   // Angular acceleration
    SumForces          vector.Two // Accumulated forces
    SumTorque          float64   // Accumulated torque
    Elasticity         float64   // Bounciness (0-1)
    Friction           float64   // Friction coefficient
}
```

Create dynamic objects with the `NewDynamics` function:

```go
// Create a dynamic object with mass 10
dynamics := motion.NewDynamics(10)

// Create an immovable (static) object
dynamicsStatic := motion.NewDynamics(0) // 0 for static
```

### Shape Component

The `Shape` component defines the physical shape of an entity for collision detection:

```go
// Create a rectangular shape for collision
rectangle := spatial.NewRectangle(64, 32)

// Create a triangular platform (one-way collision)
platform := spatial.NewTriangularPlatform(120, 16)

// Create a ramp with specified dimensions and slope
ramp := spatial.NewDoubleRamp(200, 40, 0.2)

// Create a custom polygon
 vertices := []vector.Two{
  // vetices for some custom convex shape
}
spatial.NewPolygon(vertices)
```

The system supports:

- **Polygons**: Custom shapes with arbitrary vertices
- **Rectangles**: Standard box collision
- **Circles**: Circular collision (useful for characters)
- **Compound Shapes**: Specialized shapes like ramps and platforms

## The Spatial System

The spatial system handles collision detection using a multi-phase approach:

### Broad-phase

Uses simple bounding volumes (AABBs and circles) for initial collision filtering.

### Detection

Implements more precise polygon-based collision detection for shapes that pass the broad-phase check:

```go
// Check for collision between two shapes
if ok, collisionResult := spatial.Detector.Check(
    *playerShape, *blockShape, playerPosition.Two, blockPosition.Two,
); ok {
    // Handle collision...
}
```

The collision result contains:

- **Normal**: Direction of the collision
- **Depth**: How much objects are overlapping
- **Start/End Points**: The collision contact points
- **Collision Edges**: The specific edges involved in the collision (index and vertices)

### Integration

For proper integration in Bappa, update both position and rotation in a single step each tick:

```go
// Apply forces to dynamics components
motion.Forces.AddForce(dynamics, force)

// Integrate dynamics to get new position and rotation
newPos, newRot := motion.Integrate(dynamics, position, rotation, deltaTime)

// Update entity components with new values
position.X = newPos.X
position.Y = newPos.Y
rotation = spatial.Rotation(newRot)

// Update world vertices for collision detection
shape.Polygon.WorldVertices = spatial.UpdateWorldVertices(
    shape.Polygon.LocalVertices,
    position.Two,
    scale.Two,
    float64(rotation)
)
```

### Forces

Applies and accumulates forces like gravity, friction, and custom forces:

```go
// Apply gravity
gravity := motion.Forces.Generator.NewGravityForce(mass, 9.8, 50.0)
motion.Forces.AddForce(dynamics, gravity)

// Apply friction
friction := motion.Forces.Generator.NewFrictionForce(velocity, 0.3)
motion.Forces.AddForce(dynamics, friction)
```

### Impulses

Handles instantaneous changes in momentum for collisions:

```go
// Apply an impulse (instantaneous force)
impulse := vector.Two{X: 0, Y: -500}
motion.ApplyImpulse(dynamics, impulse, vector.Two{})
```

## Collision Resolution

The system includes several collision resolvers for different gameplay needs:

### Standard Resolver

Resolves collisions with proper physical responses, including elasticity and friction:

```go
// Full physics-based collision resolution
motion.Resolver.Resolve(
    &objectAPosition.Two,
    &objectBPosition.Two,
    objectADynamics,
    objectBDynamics,
    collisionResult,
)
```

### Vertical Resolver

Specialized resolver focusing on vertical-only movement (useful for platformers):

```go
// Platform-style vertical-only resolution
motion.VerticalResolver.Resolve(
    &playerPosition.Two,
    &platformPosition.Two,
    playerDynamics,
    platformDynamics,
    collisionResult,
)
```

### Static Resolvers

Simple position correction without physics simulation, useful for immovable objects:

```go
// Only move object A, treating B as immovable
spatial.Resolver.ResolveBStatic(shapeA, shapeB, &posA, &posB, collisionResult)
```

## Standard Physics Systems

These are key systems that should be added to the bottom of a scene's local core systems to
ensure automatic physics integration/transformation.

### Integration System

The `IntegrationSystem` updates entity positions and rotations based on their dynamic properties:

```go
// Add the integration system to your core systems
coreSystems := []blueprint.CoreSystem{
    // Other systems...
    &coresystems.IntegrationSystem{},
}
```

### Transform System

The `TransformSystem` updates collision shapes' world coordinates based on entity position, rotation, and scale:

```go
// Add the transform system to your core systems
coreSystems := []blueprint.CoreSystem{
    // Other systems...
    &coresystems.TransformSystem{},
}
```

## Performance Considerations

Several factors affect the physics system's performance:

- **Collision Checks Scaling**: Without spatial partitioning, the number of potential collision checks grows quadratically with the number of physics objects, which is the main performance bottleneck.

- **Interface Usage**: The vector system uses interfaces (`TwoReader`, `TwoFace`, etc.) which introduces some overhead due to dynamic dispatch, though modern Go compilers optimize this fairly well.

- **Concrete Type Conversions**: In several places, interface types are converted to concrete types (e.g., `vector.Two`), adding some overhead but improving computation speed for subsequent operations.

For most 2D games, these performance considerations won't be an issue. The system is designed to balance clean API design with reasonable performance for typical game scenarios.

## Optimizing Physics Implementation

To get the most out of the physics system:

### 1. Limit Dynamic Objects

Keep entities with both collision and dynamics components to a reasonable number. Only give full physics properties to objects that truly need them.

### 2. Implement Custom Collision Filtering (Tags)

Create custom filtering to only check relevant collision pairs:

```go
// Only check player vs. environment collisions
playerVsEnvironmentQuery := warehouse.Factory.NewQuery().And(
    PlayerTag,
    warehouse.Factory.NewQuery().Or(
        TerrainTag,
        PlatformTag
    )
)

// Only check enemy vs. environment collisions
enemyVsEnvironmentQuery := warehouse.Factory.NewQuery().And(
    EnemyTag,
    warehouse.Factory.NewQuery().Or(
        TerrainTag,
        PlatformTag
    )
)

// Don't check environment vs. environment
```

### 3. Choose the Right Resolvers

Use specialized resolvers where appropriate:

- **Standard Resolver**: For objects that need realistic physical interactions
- **Vertical Resolver**: For platformers to improve and gameplay feel
- **Static Resolvers**: When you know one object should never move

## Systems Execution Order

The order of physics systems is crucial. Here's a typical order for a platformer:

```go
coreSystems := []blueprint.CoreSystem{
    &coresystems.GravitySystem{},              // Apply gravity forces
    &coresystems.PlayerMovementSystem{},       // Apply player input forces
    &coresystems.IntegrationSystem{},          // Update positions based on forces
    &coresystems.TransformSystem{},            // Update collision shapes
    &coresystems.PlayerBlockCollisionSystem{}, // Handle solid block collisions
    &coresystems.PlayerPlatformCollisionSystem{}, // Handle one-way platforms
    &coresystems.OnGroundClearingSystem{},
}
```

## When to Use tteokbokki

The tteokbokki physics system is well-suited for:

- **Typical 2D Games**: Platformers, action games, simple simulations
- **Limited Dynamic Objects**: Games where only a subset of objects (player, enemies, projectiles) need physics
- **Simple Collision Needs**: Basic overlap detection and response
- **Medium-scale Projects**: Where physics isn't the primary bottleneck

## Current Limitations

Be aware of these limitations when planning your game's physics:

- **Limited Optimization**: Not designed for large numbers of dynamic interacting objects
- **Missing Advanced Features**: No joints, constraints, or complex physical materials
- **Simple Collision Resolution**: May have issues with high-speed collisions or stacked objects
- **Limited Continuous Detection**: Fast-moving objects might occasionally tunnel through thin obstacles

## Conclusion

The tteokbokki physics system offers a pragmatic approach to 2D physics that integrates well with Bappa's ECS architecture. While it doesn't have all the bells and whistles of a specialized physics engine, it provides a solid foundation for most 2D game physics needs. The system shines in typical game scenarios where the number of dynamic, interacting objects remains moderate, and its limitations only become apparent in more extreme use cases.

By understanding both the capabilities and limitations of the system, you can make informed decisions about how to implement physics in your Bappa games, creating responsive and engaging gameplay while maintaining good performance.
