---
title: "API Reference"
description: "Complete API documentation for the Bappa Framework components"
summary: "Links to GoDoc documentation for all Bappa Framework packages and repositories"
date: 2023-09-07T16:21:44+02:00
lastmod: 2025-03-15T10:00:00+02:00
draft: false
weight: 950
toc: true
---

## Core Packages

Below you'll find links to the complete API documentation for all components of the Bappa Framework. All documentation is generated using Go's standard documentation tool and hosted on pkg.go.dev.

### Coldbrew

[Coldbrew](https://pkg.go.dev/github.com/TheBitDrifter/bappa/coldbrew) is the main client-side engine package, handling rendering, input, scene management, and camera control.

#### Sub-packages

- [coldbrew/clientsystems](https://pkg.go.dev/github.com/TheBitDrifter/bappa/coldbrew/coldbrew_clientsystems) - Common client-side systems
- [coldbrew/rendersystems](https://pkg.go.dev/github.com/TheBitDrifter/bappa/coldbrew/coldbrew_rendersystems) - Rendering systems

### Warehouse

[Warehouse](https://pkg.go.dev/github.com/TheBitDrifter/bappa/warehouse) provides entity storage, archetype management, and query functionality for the ECS architecture.

### Tteokbokki

[Tteokbokki](https://pkg.go.dev/github.com/TheBitDrifter/bappa/tteokbokki) implements physics and collision detection systems.

#### Sub-packages

- [tteokbokki/motion](https://pkg.go.dev/github.com/TheBitDrifter/bappa/tteokbokki/motion) - Physics simulation
- [tteokbokki/spatial](https://pkg.go.dev/github.com/TheBitDrifter/bappa/tteokbokki/spatial) - Collision detection
- [tteokbokki/coresystems](https://pkg.go.dev/github.com/TheBitDrifter/bappa/tteokbokki/tteo_coresystems) - Integration systems for physics

### Blueprint

[Blueprint](https://pkg.go.dev/github.com/TheBitDrifter/bappa/blueprint) is the container for common/shared component definitions for the Bappa Framework.

#### Sub-packages

- [blueprint/client](https://pkg.go.dev/github.com/TheBitDrifter/bappa/blueprint/client) - Client-side rendering and asset management
- [blueprint/input](https://pkg.go.dev/github.com/TheBitDrifter/bappa/blueprint/input) - Input handling and management
- [blueprint/vector](https://pkg.go.dev/github.com/TheBitDrifter/bappa/blueprint/vector) - Vector mathematics utilities

### Infrastructure Packages

These packages provide low-level functionality used by the core Bappa packages:

- [Table](https://pkg.go.dev/github.com/TheBitDrifter/bappa/table) - Efficient data storage optimized for game objects
- [Mask](https://pkg.go.dev/github.com/TheBitDrifter/mask) - Bitmasking utilities for component filtering

## Tools

### BappaCreate

[BappaCreate](https://github.com/TheBitDrifter/bappacreate) is a template generator tool for quickly bootstrapping new Bappa game projects. For installation and usage instructions, see the [Getting Started Guide](/docs/getting-started/).

## API Usage Examples

For practical examples of how to use these APIs in different contexts, visit the [Examples section](/examples/) of this documentation.

## Version Compatibility

The Bappa Framework maintains compatibility between all its core packages within the same version range. When updating one package, it's recommended to update all Bappa packages to the same version to ensure compatibility.
