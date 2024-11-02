---
title: "Getting Started"
description: "Quick start guide for the Table package"
lead: "Learn how to use the Table package in your ECS architecture"
date: 2024-11-18T10:00:00+00:00
lastmod: 2024-11-18T10:00:00+00:00
draft: false
images: []
menu:
  docs:
    parent: "table"
    identifier: "table-getting-started"
weight: 110
toc: true
---

## Installation

```bash
go get github.com/TheBitDrifter/table
```

## Basic Setup

```go
import "github.com/TheBitDrifter/table"

// Define component types
type Position struct { X, Y float64 }
type Velocity struct { X, Y float64 }

// Create types
posType := table.FactoryNewElementType[Position]()
velType := table.FactoryNewElementType[Velocity]()

// Initialize table
schema := table.Factory.NewSchema()
entryIndex := table.Factory.NewEntryIndex()
table1, err := table.Factory.NewTable(schema, entryIndex, posType, velType)
```

## Basic Operations

### Adding Entities

```go
entries, err := table1.NewEntries(5)
if err != nil {
    log.Fatal(err)
}
```

### Accessing Components

```go
posAccessor := table.FactoryNewAccessor[Position](posType)
velAccessor := table.FactoryNewAccessor[Velocity](velType)

// Get component data
pos := posAccessor.Get(0, table1)
pos.X = 100
pos.Y = 200
```

### Removing Entities

```go
ids, err := table1.DeleteEntries(0, 1)
if err != nil {
    log.Fatal(err)
}
```

## Build Configuration

```go
// Enable direct memory access:
// go:build unsafe

// Enable schema support:
// go:build schema_enabled
```
