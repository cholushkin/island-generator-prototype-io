# Procedural Island Generator (WIP)

👉 **Live Demo:**  
https://cholushkin.github.io/island-generator-prototype-io/

Interactive procedural terrain generator exploring Noise → Mask → SynTex → Marching Cubes pipeline directly in the browser.

## Overview

This project is a modular, browser-based demo for creating stylized islands on an alien ocean planet (part of a larger project).

The system is built around **independent modules**, each producing and transforming data (fields/textures), forming a clear pipeline:

1. Noise → Mask → Landscape Visualization  
2. Syntex (texture generation algorithm based on sample + local similarity) → Mask → Marching Cubes City Visualization  
3. Landscape Visualization + City Visualization → Final Model  

---

## Architecture

The system is split into three main parts:

- `/modules` → Pure logic (no DOM)
- `/ui` → UI + rendering
- `/core` → Shared abstractions (e.g., `Field`, utilities)

**Key principle:**  
> Modules pass **Field data**, not UI state.

---

## Data Flow

Each module exposes:

- `getOutput()` → Returns a `Field`
- `setInput(fn)` → Receives the previous module’s output

### Example Pipeline

```js
mask.setInput(() => noise.getOutput());
terrain.setInput(() => mask.getOutput());
````

---

## What We Are Exploring — Directions & Ideas

- First approximation of how island generation should work for an ocean planet
- Build a base algorithm that can later be ported to Unity and expanded with more detail
- Node-based composition is already proving to be convenient and scalable:
  - A node that generates layered noise with independent parameters
  - Nodes for distributing cities across the island (plateau masks on the landscape where cities can be placed)
  - A node for generating cities based on the Syntex algorithm

---

## Running locally

You must use a local server (ES modules won't run via `file://`).

Example:

```bash
python -m http.server 8000
```

Then open:

```
http://localhost:8000
```

Or simply run `start_local_server.cmd`

---

