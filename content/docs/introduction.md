---
title: "Introduction to Bappa"
description: "A comprehensive 2D game framework with powerful ECS architecture"
lead: "Build flexible, modular games with a decoupled design that supports both single-player and multiplayer modes"
date: 2024-11-18T10:00:00+00:00
lastmod: 2025-04-21T10:00:00+00:00
draft: false
images: []
weight: 100
toc: true
---

Bappa is a comprehensive 2D game framework written in Go that provides a structured approach for developing games with
a modern [ECS](https://github.com/SanderMertens/ecs-faq) based architecture. The framework separates game objects
(entities) from their data (components) and behavior (systems). This design pattern promotes code reusability and helps
manage complexity in your games.

Bappa follows a code-first approach that focuses on providing solid foundations and clear abstractions while
giving you control over your game's implementation. Unlike visual game editors, Bappa is designed for developers who
especially enjoy programming and want a well-organized approach to building their games.

## Core Features

- Intuitive Component API: Build games using a friendly, composable component system
- Camera Management: Flexible camera system with support for multiple viewports
- Multi-platform Input: Support for keyboard, mouse, gamepad, and touch inputs
- Collision Detection: Collision detection options for different game needs
- Scene System: Organize game content and logic into discrete, manageable scenes
- Asset Pipeline: Streamlined handling of sprites, sounds, and other game assets
- Split-Screen Capability: Built-in functionality for local multiplayer
- Networking: Server-authoritative multiplayer support through the Drip package

## Decoupled Architecture

The cornerstone of Bappa's design is its strictly decoupled architecture, which provides numerous benefits:

### Component-System Separation

Bappa strictly separates:

- **Components**: Pure data containers with no behavior
- **Systems**: Pure behavior with no state
- **Entities**: Simple IDs that tie components together

This separation enables:

1. Better code organization
2. Easier testing and debugging
3. More efficient performance through data-oriented design
4. Flexible deployment options

### Deployment Flexibility

A key advantage of Bappa's architecture is the ability to easily support both single-player and networked multiplayer modes with minimal code changes:

```
                  ┌─────────────────┐
                  │     Shared      │
                  │    Components   │
                  └─────────────────┘
                           │
                           ▼
┌─────────────────┐   ┌─────────────────┐   ┌─────────────────┐
│  Single-Player  │   │     Shared      │   │    Networked    │
│     Systems     │◄──┤     Systems     ├──►│     Systems     │
└─────────────────┘   └─────────────────┘   └─────────────────┘
        │                                           │
        ▼                                           ▼
┌─────────────────┐                       ┌─────────────────┐
│    Standalone   │                       │ Client / Server │
│      Client     │                       │   Architecture  │
└─────────────────┘                       └─────────────────┘
```

The same core systems can run either locally in a standalone client or on a server in a networked setup, while the same components and entities are used in both scenarios. This means you can:

1. Develop and test your game in single-player mode for rapid iteration
2. Switch to multiplayer mode with minimal code changes
3. Share the vast majority of your codebase between both modes
4. Focus on gameplay logic without worrying about the deployment context

### System Distribution

In Bappa, systems can be categorized by their execution context:

- **Core Systems**: Game logic, physics, collision, AI, etc.
  - Can run either on the client (single-player) or server (multiplayer)
- **Client Systems**: Input handling, camera following, animation, etc.
  - Always run on the client
- **Render Systems**: Visual presentation only
  - Always run on the client

This categorization allows systems to be distributed appropriately based on the game's deployment mode:

```go
// Single-player registration
client.RegisterScene(
    "GameScene",
    width, height,
    scenePlan,
    renderSystems,
    clientSystems,
    coreSystems,  // Core systems run locally
)

// Multiplayer client registration
client.RegisterScene(
    "GameScene",
    width, height,
    scenePlan,
    renderSystems,
    clientSystems,
    [],  // No core systems (run on server)
)
```

## Technical Foundation

Bappa is built on the excellent [Ebiten](https://github.com/hajimehoshi/ebiten) game engine for Go, which provides
hardware-accelerated rendering and cross-platform support. The framework extends Ebiten's capabilities with a
comprehensive set of tools including:

- [Coldbrew](https://github.com/TheBitDrifter/bappa/tree/main/coldbrew): Main package handling client-side game operations
- [Table](https://github.com/TheBitDrifter/bappa/tree/main/table): Efficient data storage optimized for game objects
- [Warehouse](https://github.com/TheBitDrifter/bappa/tree/main/warehouse): Entity management and querying system
- [Tteokbokki](https://github.com/TheBitDrifter/bappa/tree/main/tteokbokki): Physics and collision detection systems
- [Blueprint](https://github.com/TheBitDrifter/bappa/tree/main/blueprint): Shared component definitions
- [Mask](https://github.com/TheBitDrifter/mask): Bitmasking utilities for component filtering
- [Drip](https://github.com/TheBitDrifter/bappa/tree/main/drip): Networking capabilities for multiplayer games

## Real-World Benefits

The decoupled architecture provides tangible benefits in real-world development scenarios:

1. **Prototype Rapidly**: Develop in single-player mode for quick iteration cycles
2. **Add Multiplayer Later**: Start with a single-player game and add networking when ready
3. **Test Efficiently**: Core game logic can be tested without networking complexity
4. **Scale Appropriately**: Choose the right deployment model for your game's needs

For example, the same player movement system can:

- Process local input directly in single-player mode
- Process server-relayed input in multiplayer mode
- Use the same collision and physics implementation in both contexts

## Who is Bappa For?

Bappa is ideal for developers who:

- Enjoy writing clean, organized code for their games
- Want a structured approach to organizing game logic and assets
- Prefer working in Go with a focus on readability and maintainability
- Need flexibility to support both offline and online gameplay modes
- Need a framework that makes common game development tasks straightforward

If you're looking for a Go-based game framework with a developer-friendly API, solid architecture, and flexible deployment options, Bappa provides the structure and tools to help you build your game with confidence.
