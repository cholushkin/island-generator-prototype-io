# Procedural Island Generator (WIP)

👉 **Live Demo:**  
https://cholushkin.github.io/island-generator-prototype-io/

Interactive procedural terrain generator exploring Noise → Mask → SynTex → Marching Cubes pipeline directly in the browser.

## Overview

This project is a modular, browser-based procedural generation pipeline
for creating stylized islands and planetary surfaces.

The system is built around **independent modules**, each producing and
transforming data (fields/textures), forming a clear pipeline:

Noise → Mask → (future modules) → 3D Visualization

------------------------------------------------------------------------

## Current Features

### 1. Noise Module

-   Generates base noise using FBM
-   Adjustable parameters:
    -   Scale
    -   Octaves
    -   Persistence
    -   Seed

### 2. Mask Module

-   Applies circular island mask
-   Parameters:
    -   Radius
    -   Threshold
    -   Softness (SDF-style smooth edge)

### 3. 3D Visualization Module

-   Converts heightmap to mesh
-   Real-time rendering using Three.js
-   Parameters:
    -   Height scale
    -   Water level

### Rendering

-   Pixel-perfect (no filtering)
-   Vertex coloring:
    -   Water → blue
    -   Land → gray → white

------------------------------------------------------------------------

## Architecture

The system is split into:

-   `/modules` → pure logic (no DOM)
-   `/ui` → UI + rendering
-   `/core` → shared abstractions (Field, utils)

Key principle: \> Modules pass **Field data**, not UI state.

------------------------------------------------------------------------

## Data Flow

Each module exposes:

-   `getOutput()` → returns Field
-   `setInput(fn)` → receives previous module output

Pipeline example:

``` js
mask.setInput(() => noise.getOutput());
terrain.setInput(() => mask.getOutput());
```

------------------------------------------------------------------------

## Goals

-   Modular pipeline (Houdini-like)
-   Real-time experimentation
-   Clear separation of logic and UI
-   Easy to extend / replace modules

------------------------------------------------------------------------

## Next Steps (Planned)

### 1. Structure Generation (SynTex)

-   Local similarity / patch-based synthesis
-   Used for:
    -   alien structures
    -   surface patterns
    -   procedural "intelligence" layer

### 2. Volumetric Terrain

-   Marching cubes
-   Floating islands
-   Caves / overhangs

### 3. Advanced Rendering

-   Biomes (sand, grass, rock)
-   Triplanar mapping
-   Lighting improvements

### 4. Field-Based Systems

-   Vector fields (growth / veins)
-   Curvature-driven generation
-   Flow maps

------------------------------------------------------------------------

## Notes for Future Development

-   Keep modules **stateless**
-   Avoid coupling between modules
-   Always operate on **Field data**
-   UI should only control parameters

------------------------------------------------------------------------

## Running the Project

You must use a local server (ES modules won't run via file://)

Example:

``` bash
python -m http.server 8000
```

Then open:

    http://localhost:8000

------------------------------------------------------------------------

## Philosophy

This is not just a terrain generator.

It is a system for exploring: \> "What if a planet could generate its
own structures?"

------------------------------------------------------------------------

## Status

Early prototype --- architecture-first approach.
