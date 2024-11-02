---
title: "Core Architecture"
description: "Technical architecture and design decisions of the Table package"
lead: "Understand the internal structure and key design patterns"
date: 2024-11-18T10:00:00+00:00
lastmod: 2024-11-18T10:00:00+00:00
draft: false
images: []
menu:
  docs:
    parent: "table"
    identifier: "table-architecture"
weight: 120
toc: true
---

The table package implements an Entity Component System (ECS) architecture that balances performance with maintainable design. Through careful interface design and memory management, it provides a robust foundation for building scalable ECS systems. The architecture divides responsibilities into clear, focused interfaces while maintaining efficient data organization and access patterns.

## Table Structure

The core design breaks table operations into focused interfaces based on their usage:

```go
type Table interface {
    TableReader    // Component and entity reading
    TableWriter    // Component and entity modification
    TableQuerier   // Component presence queries
    TableIterator  // Efficient iteration patterns
}
```

This separation enables systems to rely only on their required functionality. Tables are constructed through a clear, fluent API:

```go
tbl, err := table.NewTableBuilder().
    WithSchema(schema).
    WithEntryIndex(entryIndex).
    WithElementTypes(posType, velType).
    WithEvents(eventHandler).
    Build()
```

## Schema System

The schema design enables multiple implementations through a clear interface contract:

```go
type Schema interface {
    Register(...ElementType)
    Contains(ElementType) bool
    RowIndexForID(ElementTypeID) uint32
    // ...
}
```

Two primary implementations - `nil-schema` and `quick schema` - showcase how different strategies can fulfill this contract while maintaining consistent behavior. This abstraction enables specialized implementations for different use cases without affecting table operations.

## Cache System

The caching system abstracts memory access patterns through an `rowCache` interface layer. This allows tables to operate efficiently without knowledge of the underlying memory management strategy. Build tags configure the implementation, enabling either safe or unsafe modes without runtime overhead or changes to table logic.

## Entity Management

Entity lifecycle management encapsulates creation, recycling, and indexing into focused components with clear responsibilities. The entry system defines clean contracts for these operations:

```go
type EntryIndex interface {
    Entries() []Entry
    NewEntries(int, Table) ([]Entry, error)
    RecycleEntries(...EntryID) error
    // ...
}
```

## Component Queries

The query system provides focused interfaces for component presence checking and comparison. These clean APIs enable efficient filtering and system matching while keeping implementation details separate from the interface. Under the hood, bit manipulation provides fast operations while the API remains straightforward.

## Memory Access Patterns

The architecture supports different memory access strategies through build-time configuration. New patterns can be added by implementing the core interfaces, while build tags enable optimization without runtime cost. This provides flexibility in balancing safety and performance needs.

## Event System

The event system enables behavior customization through clear hooks into table operations:

```go
type TableEvents interface {
    OnBeforeEntriesCreated(count int) error
    OnAfterEntriesCreated(entries []Entry)
    OnBeforeEntriesDeleted(indices []int) error
    OnAfterEntriesDeleted(ids []EntryID)
}
```

Custom behaviors can be injected without modifying table internals, keeping core functionality separate from specialized behavior.

## Extension Points

The architecture defines clean interfaces for its core abstractions:

- Schema implementations for component organization
- Entry management for entity lifecycles
- Event handlers for behavior customization
- Memory access patterns for performance tuning

## Build System

Build configuration isolates feature selection without affecting the public API:

- Memory safety mode selection
- Schema complexity configuration
- Component limit definition
- Mask size optimization

## Design Tradeoffs

The architecture carefully considers competing concerns:

- Interface abstraction vs. performance optimization
- Type safety vs. direct memory access
- Flexibility vs. complexity
- Memory efficiency vs. access speed

## Performance Considerations

Performance optimization exists throughout the architecture:

- Cache-coherent memory layout
- Efficient component access patterns
- Minimal allocation strategies
- Build-time optimization

The resulting architecture provides a foundation for efficient ECS systems while maintaining clean abstractions and type safety. Through careful interface design and strategic optimization, it achieves high performance without sacrificing maintainability.
