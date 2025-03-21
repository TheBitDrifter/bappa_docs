---
title: "Getting Started"
description: "A guide to getting started with Bappa game engine using the bappacreate tool"
lead: "Create your first game with Bappa in minutes using our template generator"
date: 2024-11-18T10:00:00+00:00
lastmod: 2024-11-18T10:00:00+00:00
draft: false
images: []
weight: 120
toc: true
---

The fastest way to get started with Bappa is to use our template generator tool called [bappacreate](https://github.com/TheBitDrifter/bappacreate). This tool sets up a complete project structure with all necessary files and dependencies based on predefined templates.

## Prerequisites

- [Go](https://golang.org/dl/) (version 1.18 or higher)
- Basic familiarity with terminal/command line

## Installation Options

### Option 1: Install with Go (Recommended)

```bash
go install github.com/TheBitDrifter/bappacreate@latest
```

### Option 2: Install from source

```bash
# Clone the repository
git clone https://github.com/TheBitDrifter/bappacreate.git
cd bappacreate

# Build and install the binary
go install
```

### Verifying Installation

After installing with `go install`, make sure the Go bin directory is in your PATH:

1. Find your Go binary path:

   ```bash
   go env GOPATH
   ```

2. Add the Go bin directory to your PATH:

   For bash (add to ~/.bashrc):

   ```bash
   export PATH="$PATH:$(go env GOPATH)/bin"
   ```

   For zsh (add to ~/.zshrc):

   ```bash
   export PATH="$PATH:$(go env GOPATH)/bin"
   ```

   Then reload your shell configuration:

   ```bash
   source ~/.bashrc   # For bash
   source ~/.zshrc    # For zsh
   ```

3. Verify the installation:

   ```bash
   bappacreate --help
   ```

   You should see the usage information and available templates.

## Creating Your First Bappa Game

Now that you have `bappacreate` installed, you can create your first game project in seconds.

### Basic Usage

The basic syntax for creating a new game is:

```bash
bappacreate username/project-name [--template <template-name>]
```

The `username/` prefix is important as it will be used to create the proper Go module path (`github.com/username/project-name`).

### Available Templates

Bappa offers several pre-built templates to jumpstart your game development:

| Template                | Description                                         |
| ----------------------- | --------------------------------------------------- |
| `topdown`               | A top-down perspective game (default)               |
| `topdown-split`         | A top-down game with split-screen co-op support     |
| `platformer`            | A simple platformer game                            |
| `platformer-split`      | A platformer game with split-screen co-op support   |
| `platformer-ldtk`       | A platformer using LDtk level editor integration    |
| `platformer-split-ldtk` | A platformer with split-screen and LDtk integration |
| `sandbox`               | An open sandbox game environment                    |

### Template Features

Each template comes with different features and setups:

- **Topdown Template**: Includes a player character, 8-directional movement, camera following, physics, collision resolution, and vertical sort rendering
- **Platformer Template**: Includes player movement, physics, collision detection, one-way platforms, and slope support
- **LDtk Platformer Templates**: Include integration with the [LDtk level editor](https://ldtk.io/) for easy level design and importing
- **Split-Screen Templates**: Add multiplayer functionality with split-screen support for two or more players
- **Sandbox Template**: Provides an minimal environment for maximum creative freedom

All templates come with well-commented code to help you understand how the Bappa game engine works!

### Example: Creating a Top-down Game

Let's create a simple top-down game:

```bash
bappacreate johndoe/my-adventure-game
```

This will create a new folder called `my-adventure-game` in your current directory, with all the files and dependencies you need to start developing.

### Example: Creating a Platformer with Split-screen

If you want to create a platformer game with split-screen co-op support:

```bash
bappacreate johndoe/my-platformer --template platformer-split
```

### Example: Creating a Platformer with LDtk Integration

To create a platformer that uses the LDtk level editor:

```bash
bappacreate johndoe/my-ldtk-game --template platformer-ldtk
```

## Project Structure

When you create a new project with `bappacreate`, you'll get a directory structure like this:

```
my-adventure-game/
├── assets/
│   ├── images/      # Store your game graphics here
│   └── sounds/      # Store your game audio here
├── actions/         # Input action definitions
├── animations/      # Sprite animation configurations
├── clientsystems/   # Systems that run on the client side
├── components/      # Custom ECS component definitions
├── coresystems/     # Core game logic systems
├── rendersystems/   # Systems for rendering game elements
├── scenes/          # Scene definitions and layouts
├── sounds/          # Sound effect configurations
├── go.mod           # Go module file with dependencies
├── go.sum           # Lock file for dependencies
├── main.go          # Main game entry point
└── README.md        # Documentation for your project
```

## Running Your Game

After creating your project, you can run it right away:

```bash
cd my-adventure-game
go mod tidy         # Ensures all dependencies are properly resolved
go run .            # Runs the game
```

Your game window should open, and you can start playing with the default controls (described in project readme).

## Example Templates in Action

You can see each template in action in our examples:

- [Topdown Demo](/examples/templates/topdown) - Try out the basic top-down template
- [Platformer Demo](/examples/templates/platformer) - Experience the platformer physics and controls
- [Split-screen Topdown](/examples/templates/topdown-split-screen) - Topdown with local co op
- [Split-screen Platformer](/examples/templates/platformer-split-screen) - Platformer with local co op

These demos give you a good idea of what you can create with Bappa right out of the box.

## Next Steps

Now that you have your game project set up, here are some next steps to consider:

1. **Explore the code**: Take some time to understand the structure and components of the game template - the code is extensively commented to help you learn
2. **Modify the assets**: Replace the default images and sounds with your own
3. **Customize game mechanics**: Adjust player movement, physics, or add new features
4. **Add game objects**: Create enemies, collectibles, or interactive elements
5. **Design levels**: Create new maps or scenes for your game
   - For LDtk templates, download the [LDtk level editor](https://ldtk.io/) to create and edit your game levels
6. Learn from [examples](/examples) — Study our example projects repository for common implementations and patterns
