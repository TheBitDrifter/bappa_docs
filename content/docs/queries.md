---
title: "Effective Entity Queries"
description: "Learn how to filter and locate entities efficiently using the warehouse query system"
lead: ""
date: 2024-11-18T10:00:00+00:00
lastmod: 2024-11-18T10:00:00+00:00
draft: false
images: []
weight: 500
toc: true
---

Queries are a fundamental tool in Bappa for finding entities that match specific criteria. They allow your systems to efficiently process only the entities they need, rather than iterating through all entities in a scene.

## Query Basics

A query is a filter that selects entities based on their components. Queries use logical operations (AND, OR, NOT) to combine component requirements:

```go
// Create a query for entities with both Position and Sprite components
query := warehouse.Factory.NewQuery().And(
    blueprintspatial.Components.Position,
    blueprintclient.Components.SpriteBundle,
)
```

This creates a query that matches only entities that have both the Position and SpriteBundle components.

## Using Cursors

To use a query, you create a cursor that iterates through matching entities:

```go
// Create a cursor from the query
cursor := scene.NewCursor(query)

// Iterate through matching entities
for range cursor.Next() {
    // Access components from the current entity
    position := blueprintspatial.Components.Position.GetFromCursor(cursor)
    spriteBundle := blueprintclient.Components.SpriteBundle.GetFromCursor(cursor)

    // Process the entity...
}
```

The cursor efficiently navigates through all entities that match your query, letting you access their components directly.

## Query Operators

Bappa supports three logical operators for building complex queries:

### AND Operator

Matches entities that have ALL specified components:

```go
// Entities with Position, SpriteBundle, AND InputBuffer
query := warehouse.Factory.NewQuery().And(
    blueprintspatial.Components.Position,
    blueprintclient.Components.SpriteBundle,
    blueprintinput.Components.InputBuffer,
)
```

### OR Operator

Matches entities that have ANY of the specified components:

```go
// Entities with EITHER EnemyTag OR BossTag
query := warehouse.Factory.NewQuery().Or(
    components.EnemyTag,
    components.BossTag,
)
```

### NOT Operator

Matches entities that DO NOT have the specified components:

```go
// Entities with Position but NOT InvisibleTag
query := warehouse.Factory.NewQuery().And(
    blueprintspatial.Components.Position,
    warehouse.Factory.NewQuery().Not(components.InvisibleTag),
)
```

## Combining Operators

You can create powerful filters by nesting query operators:

```go
// Find player-controlled entities (have InputBuffer)
// that are EITHER on the ground OR jumping
// but NOT disabled
query := warehouse.Factory.NewQuery().And(
    blueprintinput.Components.InputBuffer,
    warehouse.Factory.NewQuery().Or(
        components.GroundedTag,
        components.JumpingTag,
    ),
    warehouse.Factory.NewQuery().Not(components.DisabledTag),
)
```

## Common Query Patterns

### Predefined Queries

For frequently used queries, define them once and reuse them:

```go
var Queries = struct {
    MovableEntities warehouse.QueryNode
    Enemies         warehouse.QueryNode
    Interactables   warehouse.QueryNode
}{
    MovableEntities: warehouse.Factory.NewQuery().And(
        blueprintspatial.Components.Position,
        blueprintmotion.Components.Dynamics,
    ),
    Enemies: warehouse.Factory.NewQuery().And(
        components.EnemyTag,
        blueprintspatial.Components.Position,
    ),
    Interactables: warehouse.Factory.NewQuery().And(
        components.InteractableTag,
        blueprintspatial.Components.Position,
        blueprintspatial.Components.Shape,
    ),
}
```

These can then be used directly:

```go
cursor := scene.NewCursor(Queries.Enemies)
```

## Performance Tips

1. **Be Specific**: Include only the components your system actually needs
2. **Order Matters**: Put the most restrictive components first in AND queries
3. **Avoid Nested Loops**: Create a single, specific query rather than filtering within a loop
4. **Reuse Cursors**: If appropriate, reuse cursor objects rather than creating new ones

## Conclusion

Effective use of queries is essential for building performant systems in Bappa. By precisely specifying which entities your systems need to process, you can significantly improve performance and make your code more maintainable.

Remember that the ECS architecture works best when systems are focused and specific - queries are your primary tool for achieving this focus.
