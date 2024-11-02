---
title: "Best Practices"
description: "Best practices and performance tips for the Table package"
lead: "Performance optimization, error handling, and interface usage patterns"
date: 2024-11-18T10:00:00+00:00
lastmod: 2024-11-18T10:00:00+00:00
draft: false
images: []
menu:
  docs:
    parent: "table"
    identifier: "table-best-practices"
weight: 140
toc: true
---

## Avoid Shadowing Package Name (table)

```go
// bad — table variable overwrites package name
for _, table := range tables {
}

// good — tbl variable does not overwrite package name
for _, tbl := range tables {
}
```

## Table Creation and Management

Create tables using the builder pattern for clear dependency management:

```go
tbl, err := table.NewTableBuilder().
    WithSchema(schema).
    WithEntryIndex(entryIndex).
    WithElementTypes(posType, velType).
    WithEvents(eventHandler).
    Build()
```

Keep related components together in the same table to maximize cache efficiency during system processing.

## Component Access

Use locked accessors for repeated component access in systems:

```go
// Create once
posAccessor := table.FactoryNewAccessor[Position](posType)
lockedAccessor := posAccessor.NewLockedAccessor(schema)

// Use in hot path
for i := 0; i < tbl.Length(); i++ {
    pos := lockedAccessor.Get(i, table)
    updatePosition(pos)
}
```

## Batch Operations

Process entities in batches to improve performance:

```go
// Create entities in batches
entries, _ := tbl.NewEntries(batchSize)

// Delete multiple entities at once
tbl.DeleteEntries(indices...)
```

## Mask Comparisons

Cache masks for frequent component queries:

```go
// Create once
var renderMask mask.Mask
renderMask.Mark(meshType.ID() - 1)
renderMask.Mark(materialType.ID() - 1)

// Use in queries
func IsRenderable(tbl table.Table) bool {
    tableMask := tbl.(mask.Maskable).Mask()
    return tableMask.ContainsAll(renderMask)
}
```

## Entity Transfer

Share `EntryIndex` between related tables to enable entity transfer:

```go
// Create tables with shared entryIndex
table1, _ := table.Factory.NewTable(schema, entryIndex, typeA, typeB)
table2, _ := table.Factory.NewTable(schema, entryIndex, typeB, typeC)

// Transfer is now possible
table1.TransferEntries(table2, indices...)
```

## Build Configuration

The table package uses build tags to configure its behavior. Understanding these configurations is crucial for development, testing, and production deployment.

### Development Configuration

```go
// Development - Default
//go:build !unsafe && schema_enabled && m256
```

This is the default configuration when no build tags are specified. It provides:

- Full type safety and bounds checking
- Interface-based component access
- Detailed error messages
- Easy debugging with standard Go tools
- Flexible component organization
- Room for moderate component growth (256 max)

### Production Configuration

```go
// Production - High Performance
//go:build unsafe && !schema_enabled && m64
```

This configuration is recommended for production deployments where maximum performance is critical. It enables:

- Maximum runtime performance
- Minimal memory overhead
- Direct memory access
- Fixed component layout
- Smallest possible mask size (64)

### Use Case Specific Configurations

```go
// Game Development
//go:build unsafe && schema_enabled && m256

// Data Processing
//go:build unsafe && !schema_enabled && m64

// Service Development
//go:build !unsafe && schema_enabled && m512
```

The game development configuration balances performance and flexibility, which is well-suited for games and simulations. The data processing configuration prioritizes maximum throughput for fixed schemas, making it ideal for batch processing and data-intensive workloads. The service development configuration focuses on safety and flexibility, which is beneficial for evolving systems and services.

## Error Handling

Always check errors from table operations:

```go
entries, err := tbl.NewEntries(count)
if err != nil {
    switch err.(type) {
    case table.BatchOperationError:
        // Handle invalid count
    case table.AccessError:
        // Handle bounds error
    default:
        // Handle unexpected error
    }
}
```

## Performance Tips

1. Minimize component lookups:

   ```go
   // Check once outside loop
   hasHealth := tbl.Contains(healthType)
   for i := 0; i < tbl.Length(); i++ {
       if hasHealth {
           // Process health
       }
   }
   ```

2. Use mask comparisons for archetype matching:

   ```go
   templateMask := template.(mask.Maskable).Mask()
   for _, tbl := range tables {
       if tbl.(mask.Maskable).Mask().ContainsAll(templateMask) {
           // Tables match
       }
   }
   ```

## System Design

Organize systems by component dependencies:

```go
type PhysicsSystem struct {
    posAccessor    table.Accessor[Position]
    velAccessor    table.Accessor[Velocity]
    lockedPos      table.LockedAccessor[Position]
    lockedVel      table.LockedAccessor[Velocity]
    requiredMask   mask.Mask
}
```

## Conclusion

Following these practices helps create efficient and maintainable ECS systems while leveraging the table package's performance features.
