---
title: "Advanced Usage"
description: "Advanced features and patterns of the Table package"
lead: "Explore build tags, entity transfer, and interface patterns"
date: 2024-11-18T10:00:00+00:00
lastmod: 2024-11-18T10:00:00+00:00
draft: false
images: []
menu:
  docs:
    parent: "table"
    identifier: "table-advanced-usage"
weight: 130
toc: true
---

## Entity Transfer

Tables can safely transfer entities between each other, even when they have different component compositions. This enables dynamic entity transformation and efficient system organization.

```go
// Table with Position and Velocity
srcTable, _ := table.Factory.NewTable(schema, entryIndex, posType, velType)
srcTable.NewEntries(10)

// Table with Position and Health
destTable, _ := table.Factory.NewTable(schema, entryIndex, posType, healthType)

// Transfer entities - Position data moves, Velocity is dropped, Health is zeroed
srcTable.TransferEntries(destTable, 0, 1, 2)
```

Key considerations:

- Tables must share the same EntryIndex for transfers
- Only matching components are transferred
- Non-matching components are either dropped or zero-initialized
- Indices are automatically managed and updated

## Schema Strategies

### Schema-less Mode (default)

Best for performance-critical applications with fixed component sets:

```go
// Components map directly to storage indices
// Maximum components = mask size (64/256/512/1024)
pos := accessor.Get(entityIndex, table)  // Direct lookup, no mapping
```

### Quick Schema Mode

Enables flexible component organization and unlimited global components:

```go
//go:build schema_enabled

// Register components dynamically
schema.Register(newComponent)
// Components can be reordered and optimized
```

## Unsafe Mode Performance

Enable unsafe mode for maximum performance:

```go
//go:build unsafe

// Direct memory access
type vec3 struct{ X, Y, Z float32 }
accessor := table.FactoryNewAccessor[vec3](vec3Type)
pos := accessor.Get(idx, table)  // Uses pointer arithmetic
```

## Event Processing

Implement custom processing hooks into table operations:

```go
type CustomEvents struct {
    TableEvents
    logger *log.Logger
}

func (e *CustomEvents) OnAfterEntriesCreated(entries []table.Entry) {
    for _, entry := range entries {
        e.logger.Printf("Created entity %d", entry.ID())
    }
}

// Attach events through builder
tbl, _ := tbl.NewTableBuilder().
    WithEvents(&CustomEvents{}).
    Build()
```

## Custom Accessors

Create specialized accessors for optimized component access:

```go
type TransformAccessor struct {
    pos table.Accessor[Position]
    rot table.Accessor[Rotation]
    scale table.Accessor[Scale]
}

func (a *TransformAccessor) Get(idx int, tbl table.Table) *Transform {
    return &Transform{
        Position: *a.pos.Get(idx, tbl),
        Rotation: *a.rot.Get(idx, tbl),
        Scale:    *a.scale.Get(idx, tbl),
    }
}
```

## Component Querying Patterns

Efficiently filter and process entities based on component composition:

```go
// Find tables with required components
func FindPhysicsTables(tables []table.Table) []table.Table {
    matches := make([]Table, 0)
    for _, table := range tables {
        if table.ContainsAll(posType, velType, massType) {
            matches = append(matches, table)
        }
    }
    return matches
}

```

or with `mask.Maskable`

```go
// Compare two tables directly via their masks
func TablesMatch(table1, table2 table.Table) bool {
    mask1 := table1.(mask.Maskable).Mask()
    mask2 := table2.(mask.Maskable).Mask()
    return mask1.ContainsAll(mask2)
}

// Find matching tables using mask comparison
func FindMatchingTables(template table.Table, tables []table.Table) []table.Table {
    templateMask := template.(mask.Maskable).Mask()
    matches := make([]table.Table, 0)
    for _, table := range tables {
        tableMask := table.(mask.Maskable).Mask()
        if tableMask.ContainsAll(templateMask) {
            matches = append(matches, table)
        }
    }
    return matches
}
```

## Locked Accessors and Performance

Locked accessors provide schema-aware component access that caches row resolution for maximum performance With
`schema_enabled` (on par with nil schema).

### Creating Locked Accessors

Standard accessors can create locked variants:

```go
// Standard accessor creation
posAccessor := table.FactoryNewAccessor[Position](posType)
velAccessor := table.FactoryNewAccessor[Velocity](velType)

// Create locked versions (schema lookup is cached)
lockedPos := posAccessor.NewLockedAccessor(schema)
lockedVel := velAccessor.NewLockedAccessor(schema)
```

Locked accessors are particularly valuable with complex schemas:

```go
//go:build schema_enabled

// Without locked accessor - schema lookup per access
for i := 0; i < table.Length(); i++ {
    pos := accessor.Get(i, table)  // Schema lookup each time
    update(pos)
}

// With locked accessor - schema lookup once
locked := accessor.NewLockedAccessor(schema)
for i := 0; i < table.Length(); i++ {
    pos := locked.Get(i, table)    // Direct access
    update(pos)
}
```

### Locked Access Patterns

Best practices for locked accessor usage:

```go
type RenderSystem struct {
    transforms table.LockedAccessor[Transform]
    meshes     table.LockedAccessor[Mesh]
    materials  table.LockedAccessor[Material]
}

func NewRenderSystem(schema table.Schema) *RenderSystem {
    return &RenderSystem{
        transforms: table.FactoryNewAccessor[Transform](transformType).NewLockedAccessor(schema),
        meshes: table.FactoryNewAccessor[Mesh](meshType).NewLockedAccessor(schema),
        materials: table.FactoryNewAccessor[Material](materialType).NewLockedAccessor(schema),
    }
}

func (r *RenderSystem) Render(table table.Table) {
    // All accesses use cached schema resolution
    for i := 0; i < table.Length(); i++ {
        transform := r.transforms.Get(i, table)
        mesh := r.meshes.Get(i, table)
        material := r.materials.Get(i, table)
        renderEntity(transform, mesh, material)
    }
}
```
