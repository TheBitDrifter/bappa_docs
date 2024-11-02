---
title: "Core Concepts"
description: "Understanding the fundamental concepts of the Table package"
lead: "Learn about Tables, Components, Entities, and the Schema System"
date: 2024-11-18T10:00:00+00:00
lastmod: 2024-11-18T10:00:00+00:00
draft: false
images: []
menu:
  docs:
    parent: "table"
    identifier: "table-core-concepts"
weight: 115
toc: true
---

## Components

Components are strongly-typed data containers:

```go
type Position struct { X, Y float64 }
type Health struct { Current, Max int }

// Register as ElementTypes
posType := table.FactoryNewElementType[Position]()
healthType := table.FactoryNewElementType[Health]()
```

## Entries

Unique identifiers that index component collections:

```go
type Entry interface {
    ID() EntryID        // Unique identifier
    Recycled() int      // Recycling count
    Index() int         // Current table index
}
```

## Tables

Container for component data organized by entries:

```go
tbl, _ := table.Factory.NewTable(schema, entryIndex,
    posType, healthType)

// Add entries
tbl.NewEntries(100)

// Access components
posAccessor := FactoryNewAccessor[Position](posType)
pos := posAccessor.Get(0, tbl)
```

## Schemas

Maps components to storage locations:

```go
type Schema interface {
    Register(...ElementType)
    Contains(ElementType) bool
    RowIndexFor(ElementType) uint32
}
```

- Schema-less mode: Direct mapping
- Quick schema mode: Flexible component organization

## Memory Access

Two modes controlled by build tags:

### Safe Mode

```go
type safeCache []any
```

- Type safety through interfaces
- Standard GC behavior
- Debug friendly

### Unsafe Mode

```go
type unsafeCache []unsafe.Pointer
```

- Direct memory access
- Higher performance
- Manual memory management

## Entity Transfer

Movement between tables:

```go
// Tables must share entryIndex
table1.TransferEntries(table2, indices...)
```

## Component Access

Type-safe accessors:

```go
type Accessor[T any] struct {
    elementTypeID ElementTypeID
}

accessor := table.FactoryNewAccessor[Position](posType)
pos := accessor.Get(idx, table)
```

## Event System

Hooks for table operations:

```go
type TableEvents interface {
    OnBeforeEntriesCreated(count int) error
    OnAfterEntriesCreated(entries []Entry)
    OnBeforeEntriesDeleted(indices []int) error
    OnAfterEntriesDeleted(ids []EntryID)
}
```
