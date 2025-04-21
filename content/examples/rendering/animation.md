---
title: "Sprite Sheet Animation"
description: ""
date: 2023-09-07T16:33:54+02:00
lastmod: 2023-09-07T16:33:54+02:00
draft: false
weight: 210
---

{{< wasm-demo src="rendering/animation.html" width="640px" height="360" autoplay="true" >}}

```go{title="animation.go" linenos=true}
package main

import (
 "embed"
 "log"

 "github.com/TheBitDrifter/bappa/blueprint"
 "github.com/TheBitDrifter/bappa/blueprint/client"
 "github.com/TheBitDrifter/bappa/coldbrew"
 "github.com/TheBitDrifter/bappa/coldbrew/coldbrew_rendersystems"
 "github.com/TheBitDrifter/bappa/tteokbokki/spatial"
 "github.com/TheBitDrifter/bappa/warehouse"
)

//go:embed assets/*
var assets embed.FS

var idleAnimation = client.AnimationData{
 Name:        "idle",
 RowIndex:    0,
 FrameCount:  6,
 FrameWidth:  144,
 FrameHeight: 116,
 Speed:       8,
}

func main() {
 client := coldbrew.NewClient(
  320,
  180,
  10,
  10,
  10,
  assets,
 )

 client.SetTitle("Animating a Sprite Sheet")

 err := client.RegisterScene(
  "Example Scene",
  320,
  180,
  exampleScenePlan,
  []coldbrew.RenderSystem{},
  []coldbrew.ClientSystem{},
  []blueprint.CoreSystem{},
 )
 if err != nil {
  log.Fatal(err)
 }

 client.RegisterGlobalRenderSystem(coldbrew_rendersystems.GlobalRenderer{})

 client.ActivateCamera()

 if err := client.Start(); err != nil {
  log.Fatal(err)
 }
}

func exampleScenePlan(width, height int, sto warehouse.Storage) error {
 spriteArchetype, err := sto.NewOrExistingArchetype(
  spatial.Components.Position,
  client.Components.SpriteBundle,
 )
 if err != nil {
  return err
 }
 err = spriteArchetype.Generate(1,
  spatial.NewPosition(90, 20),
  client.NewSpriteBundle().
   AddSprite("images/sprite_sheet.png", true).
   WithAnimations(idleAnimation),
 )
 if err != nil {
  return err
 }
 return nil
}
```
