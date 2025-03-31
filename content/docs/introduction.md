---
title: "Introduction to Bappa"
description: ""
lead: ""
date: 2024-11-18T10:00:00+00:00
lastmod: 2024-11-18T10:00:00+00:00
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

## Technical Foundation

Bappa is built on the excellent [Ebiten](https://github.com/hajimehoshi/ebiten) game engine for Go, which provides
hardware-accelerated rendering and cross-platform support. The framework extends Ebiten's capabilities with a
comprehensive set of tools including:

- [Coldbrew:](https://github.com/TheBitDrifter/bappa/tree/main/coldbrew) Main package handling client-side game operations
- [Table:](https://github.com/TheBitDrifter/bappa/tree/main/table) Efficient data storage optimized for game objects
- [Warehouse:](https://github.com/TheBitDrifter/bappa/tree/main/warehouse) Entity management and querying system
- [Tteokbokki:](https://github.com/TheBitDrifter/bappa/tree/main/tteokbokki) Physics and collision detection systems
- [Blueprint:](https://github.com/TheBitDrifter/bappa/tree/main/blueprint) shared component definitions
- [Mask:](https://github.com/TheBitDrifter/mask) Bitmasking utilities for component filtering

## Who is Bappa For?

Bappa is ideal for developers who:

- Enjoy writing clean, organized code for their games
- Want a structured approach to organizing game logic and assets
- Prefer working in Go with a focus on readability and maintainability
- Need a framework that makes common game development tasks straightforward

If you're looking for a Go-based game framework with a developer-friendly API and solid architecture, Bappa provides
the structure and tools to help you build your game with confidence.
