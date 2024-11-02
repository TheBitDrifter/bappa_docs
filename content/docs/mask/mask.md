---
title: "Overview"
description: ""
lead: ""
date: 2024-11-18T10:00:00+00:00
lastmod: 2024-11-18T10:00:00+00:00
draft: false
images: []
weight: 100
toc: true
---

The mask package provides utilities for managing bitmasks in Go, including functionality to mark bits, check if bits are set, and compare bitmasks for various conditions. The package supports multiple build configurations (e.g., 64-bit, 256-bit, 512-bit) to accommodate different mask sizes.

## Features

- `Mark`: Set specific bits in the mask.
- `Contains`: Check if a specific bit is set.
- `ContainsAll`: Check if all bits in one mask are contained in another.
- `ContainsAny`: Check if any bits in one mask are contained in another.
- `ContainsNone`: Check if none of the bits in one mask are set in another.

## Build Configurations

The package supports different configurations using Go build tags:

- Default (64-bits)
- m256 (256-bits)
- m512 (512 bits)
- m1024 (1024 bits)

```zsh
go test -tags m256
```

## Installation

```go
import "github.com/TheBitDrifter/mask"
```

## Usage

### Mark a Bit

To set a specific bit in the mask:

```go
var m mask.Mask
m.Mark(3) // Sets the 3rd bit
```

To check if a specific bit is set:

```go
if m.Contains(3) {
    fmt.Println("Bit 3 is set!")
}
```

### Compare Bitmasks

You can compare two Mask instances to see if they share certain bits.

Check if all bits in one mask are contained in another:

```go
var other mask.Mask
other.Mark(5)

if m.ContainsAll(other) {
    fmt.Println("All bits in `other` are set in `m`.")
}
```

Check if any bits in one mask are contained in another:

```go
if m.ContainsAny(other) {
    fmt.Println("At least one bit in `other` is set in `m`.")
}
```

Check if no bits in one mask are set in another:

```go
if m.ContainsNone(other) {
    fmt.Println("No bits in `other` are set in `m`.")
}
```

Check for an Empty Mask
To check if a mask is empty (i.e., no bits are set):

```go
if mask.isEmpty(m) {
    fmt.Println("Mask is empty.")
}
```
