---
title: "Touch"
description: ""
date: 2023-09-07T16:33:54+02:00
lastmod: 2023-09-07T16:33:54+02:00
draft: false
weight: 320
toc: false
---

{{< callout context="note" title="Instructions" icon="outline/info-circle" >}}

- Tap to move sprite
  {{< /callout >}}

{{< wasm-demo src="input/touch.html" width="640px" height="360" autoplay="true" >}}

```go{title="touch.go" linenos=true}
package main

import (
	"embed"
	"log"
	"math"

	"github.com/TheBitDrifter/bappa/blueprint"
	"github.com/TheBitDrifter/bappa/blueprint/client"
	"github.com/TheBitDrifter/bappa/blueprint/input"
	"github.com/TheBitDrifter/bappa/coldbrew"
	"github.com/TheBitDrifter/bappa/coldbrew/coldbrew_clientsystems"
	"github.com/TheBitDrifter/bappa/coldbrew/coldbrew_rendersystems"
	"github.com/TheBitDrifter/bappa/tteokbokki/spatial"

	"github.com/TheBitDrifter/bappa/warehouse"
)

//go:embed assets/*
var assets embed.FS

var actions = struct {
	Movement input.Input
}{
	Movement: input.NewAction(),
}

func lerp(start, end, t float64) float64 {
	return start + t*(end-start)
}

func main() {
	client := coldbrew.NewClient(
		640,
		360,
		10,
		10,
		10,
		assets,
	)
	client.SetTitle("Capturing Touch Inputs")
	err := client.RegisterScene(
		"Example Scene",
		640,
		360,
		exampleScenePlan,
		[]coldbrew.RenderSystem{},
		[]coldbrew.ClientSystem{},
		[]blueprint.CoreSystem{
			&inputSystem{},
		},
	)
	if err != nil {
		log.Fatal(err)
	}
	client.RegisterGlobalRenderSystem(coldbrew_rendersystems.GlobalRenderer{})
	client.RegisterGlobalClientSystem(coldbrew_clientsystems.ActionBufferSystem{})

	client.ActivateCamera()

	receiver, _ := client.ActivateReceiver()
	receiver.RegisterTouch(actions.Movement)
	if err := client.Start(); err != nil {
		log.Fatal(err)
	}
}

func exampleScenePlan(width, height int, sto warehouse.Storage) error {
	spriteArchetype, err := sto.NewOrExistingArchetype(
		input.Components.ActionBuffer,
		spatial.Components.Position,
		client.Components.SpriteBundle,
	)
	if err != nil {
		return err
	}
	err = spriteArchetype.Generate(1,
		input.Components.ActionBuffer,
		spatial.NewPosition(255, 20),
		client.NewSpriteBundle().
			AddSprite("sprite.png", true),
	)
	if err != nil {
		return err
	}
	return nil
}

type inputSystem struct {
	LastMovementX float64
	LastMovementY float64
	HasTarget     bool
}

func (sys *inputSystem) Run(scene blueprint.Scene, dt float64) error {
	query := warehouse.Factory.NewQuery().
		And(input.Components.ActionBuffer, spatial.Components.Position)
	cursor := scene.NewCursor(query)

	for range cursor.Next() {
		pos := spatial.Components.Position.GetFromCursor(cursor)
		actionBuffer := input.Components.ActionBuffer.GetFromCursor(cursor)

		if stampedMovement, ok := actionBuffer.ConsumeInput(actions.Movement); ok {
			sys.LastMovementX = float64(stampedMovement.X)
			sys.LastMovementY = float64(stampedMovement.Y)
			sys.HasTarget = true
		}

		if sys.HasTarget {
			dx := sys.LastMovementX - pos.X
			dy := sys.LastMovementY - pos.Y
			distance := math.Sqrt(dx*dx + dy*dy)

			if distance < 5 {
				sys.HasTarget = false
			} else {
				lerpFactor := 0.05
				pos.X = lerp(pos.X, sys.LastMovementX, lerpFactor)
				pos.Y = lerp(pos.Y, sys.LastMovementY, lerpFactor)
			}
		}
	}

	return nil
}
```
