---
title: "Troubleshooting"
description: "Common issues and solutions when using the Table package"
lead: "Diagnose and fix common problems"
date: 2024-11-18T10:00:00+00:00
lastmod: 2024-11-18T10:00:00+00:00
draft: false
images: []
menu:
  docs:
    parent: "table"
    identifier: "table-troubleshooting"
weight: 160
toc: true
---

### Entity Transfer Problems

#### Entry Index Mismatch

**Symptom**: Getting `TransferEntryIndexMismatchError` when transferring entities between tables.

**Cause**: Tables have different entry indices. Entity transfer requires shared entity management.

**Solution**: Ensure both tables are created with the same `EntryIndex`:

#### Component Data Loss

When transferring entities between tables with different component types, only the components present in both tables will be transferred. This is the designed behavior for handling transfers between tables with different compositions.

### Schema-Related Issues

#### Component Registration

**Symptom**: Components not accessible after table creation.

Solution depends on build configuration:

##### With Schema Disabled

```go
//go:build !schema_enabled

type limitMonitor struct {
    table.DefaultTableEvents
}

func (e *limitMonitor) OnBeforeEntriesCreated(count int) error {
    currentComponents := table.Stats.TotalElementTypes()
    maxComponents := table.Config.MaxElementCount()

    if currentComponents >= maxComponents {
        return fmt.Errorf("component limit reached: %d/%d",
            currentComponents, maxComponents)
    }
    log.Printf("Component usage: %d/%d", currentComponents, maxComponents)
    return nil
}

schema := table.Factory.NewSchema()
tbl, err := table.NewTableBuilder().
    WithSchema(schema).
    WithEntryIndex(entryIndex).
    WithElementTypes(posType, velType).
    WithEvents(&limitMonitor{}).
    Build()
```

##### With Schema Enabled

```go
//go:build schema_enabled

type schemaMonitor struct {
    table.DefaultTableEvents
}

func (e *schemaMonitor) OnBeforeEntriesCreated(count int) error {
    if !table.Config.AutoElementTypeRegistrationTableCreation {
        log.Printf("Auto-registration disabled - ensure components are registered before table creation")
    }
    return nil
}

schema := table.Factory.NewSchema()
if !table.Config.AutoElementTypeRegistrationTableCreation {
    // Must manually register if auto-registration disabled
    schema.Register(posType, velType)
}

tbl, err := table.NewTableBuilder().
    WithSchema(schema).
    WithEntryIndex(entryIndex).
    WithElementTypes(posType, velType).
    WithEvents(&schemaMonitor{}).
    Build()
```

Key points:

1. Schema-less mode: Monitor component count vs mask size
2. Schema enabled: Register components before table creation if auto-registration disabled

### Logging Examples

#### Basic Events

```go
type memoryEvents struct {
    table.DefaultTableEvents
}

func (e *memoryEvents) OnBeforeEntriesCreated(count int) error {
    log.Printf("Creating %d entries", count)
    return nil
}

func (e *memoryEvents) OnAfterEntriesCreated(entries []table.Entry) {
    log.Printf("Created %d entries", len(entries))
}

func (e *memoryEvents) OnBeforeEntriesDeleted(indices []int) error {
    log.Printf("Deleting entries at indices: %v", indices)
    return nil
}

func (e *memoryEvents) OnAfterEntriesDeleted(ids []table.EntryID) {
    log.Printf("Deleted entries with IDs: %v", ids)
}

schema := table.Factory.NewSchema()
entryIndex := table.Factory.NewEntryIndex()

tbl, err := table.NewTableBuilder().
    WithSchema(schema).
    WithEntryIndex(entryIndex).
    WithElementTypes(components...).
    WithEvents(&memoryEvents{}).
    Build()
```

#### Performance Monitoring

```go
type perfEvents struct {
    table.DefaultTableEvents
    startTime time.Time
}

func (e *perfEvents) OnBeforeEntriesCreated(count int) error {
    e.startTime = time.Now()
    log.Printf("Operation start: %v", e.startTime)
    return nil
}

func (e *perfEvents) OnAfterEntriesCreated(entries []table.Entry) {
    duration := time.Since(e.startTime)
    log.Printf("Created %d entries in %v", len(entries), duration)
    log.Printf("Average time per entry: %v", duration/time.Duration(len(entries)))
}

schema := table.Factory.NewSchema()
entryIndex := table.Factory.NewEntryIndex()

tbl, err := table.NewTableBuilder().
    WithSchema(schema).
    WithEntryIndex(entryIndex).
    WithElementTypes(components...).
    WithEvents(&perfEvents{}).
    Build()
```
