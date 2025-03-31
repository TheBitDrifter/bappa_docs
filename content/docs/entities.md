---
title: "Entity Manipulation and Operation Queueing"
description: "Learn how to safely modify entities during gameplay, handle locked storage, and use the operation queue system"
lead: ""
date: 2024-11-18T10:00:00+00:00
lastmod: 2024-11-18T10:00:00+00:00
draft: false
images: []
weight: 520
toc: true
---

When building games with Bappa, you'll frequently need to modify entities during gameplay - adding or removing components, transferring entities between scenes, or even destroying entities entirely. However, these operations aren't always straightforward due to a critical constraint: **you cannot modify the entity storage while systems are iterating over it**.

This document explains how Bappa's operation queueing system works to solve this problem and provides best practices for safely manipulating entities during gameplay.

## Understanding Locked Storage

Bappa uses a "locked storage" mechanism to prevent unsafe modifications during iteration. When a system is iterating over entities (using a cursor), the entity storage becomes "locked" until iteration completes or yields.
During this locked state:

- Direct modifications to entities are prohibited
- Attempting direct modifications will result in panics
- Operations must instead be queued for later execution

### When Storage Gets Locked

Storage becomes locked when:

1. A cursor begins iterating through entities (specifically when the `Next()` method is called)
2. Systems are actively processing entities in a scene

The storage remains locked until:

1. The cursor completes its full iteration naturally
2. The cursor is explicitly reset using the `Reset()` method
3. All active systems finish processing

### Detecting Locked Storage

You can check if storage is locked before attempting modifications:

```go
if scene.Storage().Locked() {
    // Storage is locked, use enqueue methods instead
} else {
    // Storage is unlocked, direct modifications are safe
}
```

## The Operation Queue System

Bappa's solution to the locked storage problem is an operation queue system. Instead of modifying entities immediately, you can enqueue operations that will be executed safely once all iteration is complete.

The operation queue handles several types of operations:

1. **Component Operations**: Adding or removing components
2. **Entity Operations**: Creating or destroying entities
3. **Transfer Operations**: Moving entities between scenes

### Enqueuing vs Direct Operations

For every direct entity modification method, there's a corresponding "Enqueue" version:

| Direct Method           | Enqueued Method                |
| ----------------------- | ------------------------------ |
| `AddComponent`          | `EnqueueAddComponent`          |
| `AddComponentWithValue` | `EnqueueAddComponentWithValue` |
| `RemoveComponent`       | `EnqueueRemoveComponent`       |
| `DestroyEntities`       | `EnqueueDestroyEntities`       |

The enqueued methods will automatically:

1. Perform the operation directly if storage isn't locked
2. Queue the operation for later execution if storage is locked

## Adding and Removing Components

Adding and removing components are common operations that often need to be queued.

### Adding Components

To add a component to an entity:

```go
// Get the entity you want to modify
entity, err := cursor.CurrentEntity()
if err != nil {
    return err
}

// Add a component with a specific value
err = entity.EnqueueAddComponentWithValue(
    components.HealthComponent,
    components.Health{Current: 100, Max: 100}
)
if err != nil {
    return err
}

// Or add a component with default values
err = entity.EnqueueAddComponent(components.InvulnerableTag)
if err != nil {
    return err
}
```

### Removing Components

To remove a component from an entity:

```go
// Get the entity you want to modify
entity, err := cursor.CurrentEntity()
if err != nil {
    return err
}

// Remove a component
err = entity.EnqueueRemoveComponent(components.StunnedTag)
if err != nil {
    return err
}
```

## Example: Adding "OnGround" Component

Here's an example from some 'platformer' code.

```go
// From player_block_collision_system.go
currentTick := scene.CurrentTick()
playerAlreadyGrounded, onGround := components.OnGroundComponent.GetFromCursorSafe(playerCursor)
if !playerAlreadyGrounded {
    playerEntity, err := playerCursor.CurrentEntity()
    if err != nil {
        return err
    }
    err = playerEntity.EnqueueAddComponentWithValue(
        components.OnGroundComponent,
        components.OnGround{LastTouch: currentTick, Landed: currentTick, SlopeNormal: collisionResult.Normal},
    )
    if err != nil {
        return err
    }
} else {
    onGround.LastTouch = scene.CurrentTick()
    onGround.SlopeNormal = collisionResult.Normal
}
```

This code:

1. Checks if the player entity already has the `OnGroundComponent`
2. If not, it enqueues an operation to add the component with initial values
3. If it does, it updates the existing component's values directly (which is safe)

## Creating and Destroying Entities

Creating and destroying entities also need to be handled through the queue when storage is locked.

### Creating Entities

To create new entities during gameplay:

```go
// Create 5 new entities with the specified components
err := scene.Storage().EnqueueNewEntities(5,
    spatial.Components.Position,
    client.Components.SpriteBundle,
    components.ParticleTag,
)
if err != nil {
    return err
}
```

### Destroying Entities

To destroy entities:

```go
entity, err := cursor.CurrentEntity()
if err != nil {
    return err
}

err = scene.Storage().EnqueueDestroyEntities(entity)
if err != nil {
    return err
}
```

## Transferring Entities Between Scenes

When changing scenes, you often want to bring certain entities with you (like the player). This is done through scene transition methods that handle entity transfers:

```go
// Transition to a new scene, bringing the player entity with you
playerEntity, err := cursor.CurrentEntity()
if err != nil {
    return err
}

err = client.ChangeScene(targetScene, playerEntity)
if err != nil {
    return err
}
```

Or to activate an additional scene while keeping the current one active:

```go
err = client.ActivateScene(targetScene, playerEntity)
if err != nil {
    return err
}
```

## Entity Recycling

When entities are destroyed in Bappa, their IDs don't immediately disappear - they're recycled to minimize memory fragmentation and improve performance. This recycling mechanism is key to efficient entity management.

### How Entity Recycling Works

- ID Reuse: When an entity is destroyed, its ID is marked for reuse rather than being immediately discarded
- Recycled Counter: Each entity has a Recycled() count that increments when an ID is reused
- Validation: Operations check both the entity ID and recycled count to ensure they're operating on the intended entity

### Benefits of Recycling

- Reduced Memory Fragmentation: Reusing IDs keeps the entity storage dense
- Efficient Allocation: New entities can be created quickly without frequent memory reallocations
- Safe Operations: The recycled counter prevents accidental operations on deleted entities that share an ID

## Common Patterns and Best Practices

### 1. Always Use Enqueue Methods in Systems

Systems that process entities should always use the `Enqueue` methods rather than direct modification methods, as the storage is almost certainly locked during system execution.

### 2. Check Component Existence First

Before adding or removing components, check if they already exist:

```go
hasComponent, component := components.SomeComponent.GetFromCursorSafe(cursor)
if !hasComponent {
    // Only add if it doesn't exist
    entity.EnqueueAddComponent(components.SomeComponent)
}
```

### 3. Use Components for State Changes

For simple state changes, use tag components:

```go
// Instead of a boolean flag, use components
entity.EnqueueAddComponent(components.Jumping)
// Later, remove it
entity.EnqueueRemoveComponent(components.Jumping)
```

## Debugging Entity Operations

When dealing with operation queueing, these issues might arise:

### 1. Missed Operations

If operations seem to be ignored, check:

- That the entity is still valid when the operation is processed
- That you're not setting the same component multiple times in a single frame

### 2. Component Cycling

If components seem to be repeatedly added and removed, check:

- That you're not adding and removing the same component in the same frame
- That your condition for adding/removing isn't triggered every frame

### 3. Entity "Disappearing"

If an entity disappears unexpectedly:

- Check if it was accidentally destroyed
- Verify its parent-child relationships
- Check if scene transitions are properly handling the entity

## Conclusion

Bappa's operation queueing system allows for safe modification of entities even during system iteration. By understanding when to use enqueued operations versus direct manipulation, you can build robust game systems that properly handle complex entity modifications.

Key takeaways:

1. Always use `Enqueue*` methods when modifying entities during system execution
2. Check if components exist before adding or removing them
3. Understand when storage becomes locked and when it's released
4. Group related entity changes to maintain game state consistency

By following these patterns, you'll avoid common pitfalls and create more stable, predictable game behavior in your Bappa projects.
