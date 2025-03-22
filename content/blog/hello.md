---
title: "Drifting Through Code: My Journey to Building Bappa"
description: "My personal journey to building a modular game development framework in Go"
date: 2025-03-17T16:27:22+02:00
lastmod: 2025-03-17T16:27:22+02:00
draft: false
weight: 50
contributors: ["TheBitDrifter"]
pinned: false
homepage: false
---

Hello, I'm TheBitDrifter! After spending some time wandering between different technologies and roles, I've found myself creating something I'm excited to share with the Go programming community: Bappa, a modular game development framework.

## Getting Lost

Initially, I worked for a few years as a web developer, building applications and chasing deadlines. Writing JavaScript and maintaining/occasionally refactoring legacy Ruby code.

The work was intellectually stimulating and financially rewarding, but I eventually found myself struggling with burnout – a challenge many of us in tech face at some point. In hindsight, I recognize that I hadn't yet developed the boundaries and self-care habits needed to sustain a healthy relationship with intense work.

Taking a step back from the industry became necessary for my well-being. In what might seem like an unlikely career pivot, I found myself working on the line in my family's restaurant. The structured chaos of a kitchen offered a different kind of problem-solving – immediate, tangible, and refreshingly disconnected from the digital world.

But code has a way of calling you back.

## Building Bappa

During those months away from professional development, I started tinkering with a project that combined my love for programming with my interest in game development and Golang. What began as a simple experiment gradually evolved into Bappa.

The journey of building this project has been one of continuous learning and growth. What started as experimental code gradually transformed into a structured system with clear boundaries and thoughtful organization. The framework's current form reflects many iterations, pragmatic decisions, and careful consideration of how everything fits together. Bappa represents both my technical development and my vision for a code-first game approach in Go.

Bappa's design is intentionally decoupled. The core packages have zero external dependencies, focusing purely on game simulation logic. The client layer (**coldbrew**) integrates with [Ebiten](https://github.com/hajimehoshi/ebiten) for rendering, input handling, and audio.

This separation emerged from thinking carefully about how different parts of a game engine should interact and what responsibilities each component should have.

## About Bappa

Bappa isn't trying to compete with established engines and frameworks. Instead, it's designed for developers who want to:

- Leverage Go's strengths for building games
- Work with a lightweight, code-first approach to game development
- Build games that are easy to reason about and maintain
- Understand what's happening under the hood

## Why I'm Sharing This

I'm sharing this project as both a technical framework and a creative journey. While the code is structured and thoughtfully designed, it also represents something more personal – my path back to programming with renewed perspective.

This project rekindled my passion for solving complex technical challenges and building systems from the ground up. It reminded me of the satisfaction that comes from seeing solutions emerge and watching a system come to life.

Maybe you'll find Bappa useful for your own projects. Maybe the code will spark ideas for your work. Perhaps you'll connect with the story of finding your way back to something meaningful. Or maybe none of that will resonate at all.

And that's completely okay.

Happy Coding!
