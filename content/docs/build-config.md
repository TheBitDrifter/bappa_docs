---
title: "Build Tags and Configuration"
description: "Customizing performance and behavior in your Bappa game"
lead: "Control memory usage, performance, and behavior using Bappa's build tags and runtime configuration options."
date: 2024-11-18T10:00:00+00:00
lastmod: 2024-11-18T10:00:00+00:00
draft: false
images: []
weight: 930
toc: true
---

### 1. `unsafe` vs. Safe Mode

The `unsafe` build tag has significant effects across the Bappa ecosystem:

**In Warehouse:**

- Directly affects how entities and components are accessed
- Uses direct memory access for component data retrieval via `table.Accessor`
- `GetFromCursor` operations become more efficient
- Critical for high-performance games with many entities

**In Coldbrew Client Systems:**

- Systems processing many entities (like physics or collision) gain significant performance
- Input systems and rendering pipelines can handle more entities per frame
- More suitable for games with large numbers of active entities

```go
// Performance differences are most noticeable in tight loops:
cursor := scene.NewCursor(query)
for cursor.Next() {
    // Component access is faster in unsafe mode
    position := blueprintspatial.Components.Position.GetFromCursor(cursor)
    // ...
}
```

## Mask Size and Component Limits

The mask size build tags (`m256`, `m512`, `m1024`) determine the maximum number of unique component types you can use per storage:

```
Default (no tag): 64 component types
m256: 256 component types
m512: 512 component types
m1024: 1024 component types
```

**Impact on Warehouse:**

- Directly limits how many component types can exist in a single Storage
- Affects archetype creation and entity queries
- Larger games with many component types require larger masks

**Practical Considerations:**

- Most small to medium games work fine with 64 component types
- Complex simulations or RPGs might need 256+ component types
- Using larger masks than necessary adds a small performance overhead

## Coldbrew Asset Loading Configuration

Coldbrew has special configuration for asset loading that changes between development and production:

### Development Mode

- Assets are loaded directly from the filesystem at `assets/`
- Changes to assets can be seen immediately without recompilation
- Set by default when `BAPPA_ENV` environment variable is not "production"

### Production Mode

- Assets are loaded from embedded filesystem (using Go's embed feature)
- More efficient and ensures assets are included in the binary
- Set when `BAPPA_ENV="production"`

```go
// To enable production mode:
export BAPPA_ENV=production
go build
```

## Cross-Package Configuration Considerations

When setting up a Bappa-based game, there are important cross-package considerations:

1. **Consistent Build Tags**: Build tags should be consistent across all packages in the ecosystem

   ```
   go build -tags="unsafe m256"
   ```

2. **Performance vs. Safety**:

   - `unsafe` mode provides the best performance but with fewer safety checks
   - Safe mode is recommended during development for better error messages

3. **Memory Footprint**:

   - Larger mask sizes increase memory usage slightly
   - WASM targets may benefit from smaller mask sizes

4. **Hot Reloading**:
   - Development mode in Coldbrew enables asset hot reloading
   - Production mode embeds assets for distribution

## WASM

At its core, a Bappa game is a ebiten game. For WASM please see:
<https://ebitengine.org/en/documents/webassembly.html>

## Conclusion

Understanding these configuration options allows you to optimize the Bappa ecosystem for your specific game requirements, whether you're building a simple platformer or a complex simulation with thousands of entities.
