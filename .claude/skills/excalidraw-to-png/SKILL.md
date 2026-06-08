---
name: excalidraw-to-png
description: Use this skill whenever the user wants to convert one or more Excalidraw files (*.excalidraw) into PNG images. Triggers include: any mention of ".excalidraw", "convert excalidraw", "export excalidraw to PNG", or tasks involving batch conversion of Excalidraw diagrams. Do NOT use for SVG export, PDF export, or editing Excalidraw files.
license: MIT
---

# Excalidraw → PNG Conversion Guide

## Overview

This skill converts Excalidraw JSON schemas (`*.excalidraw`) into PNG images using the [`@tommywalkie/excalidraw-cli`](https://github.com/tommywalkie/excalidraw-cli) npm package.

The CLI accepts a single file or a directory as input and outputs one PNG per `.excalidraw` file found.

---

## Installation

Install the CLI globally with npm (required before any conversion):

```bash
npm install -g @tommywalkie/excalidraw-cli
```

> **Note:** The package depends on `node-canvas` which requires native build tools. On Ubuntu/Debian these are usually already available. On Alpine, see the Alpine section below.

### Alpine / Docker

If running in an Alpine-based environment, install the native dependencies first:

```bash
apk update
apk add --no-cache python g++ build-base cairo-dev jpeg-dev pango-dev \
    musl-dev giflib-dev pixman-dev pangomm-dev libjpeg-turbo-dev freetype-dev
```

---

## CLI Usage

```
$ excalidraw-cli --help
Parses Excalidraw JSON schemas into PNGs

USAGE
  $ excalidraw-cli [INPUT] [OUTPUT]

ARGUMENTS
  INPUT   [default: {cwd}] Excalidraw file path OR directory path
  OUTPUT  [default: {cwd}] Output PNG file path OR directory path

OPTIONS
  -h, --help     show CLI help
  -q, --quiet    disable console outputs
  -v, --version  show CLI version
```

---

## Common Patterns

### Convert a single file

```bash
excalidraw-cli drawing.excalidraw output.png
```

### Convert a single file, output in same directory

```bash
excalidraw-cli drawing.excalidraw .
# Produces: drawing.png (next to the input file)
```

### Batch convert an entire directory

```bash
excalidraw-cli ./diagrams ./output
# Converts every *.excalidraw found in ./diagrams into ./output/*.png
```

### Quiet mode (no console output, good for scripts)

```bash
excalidraw-cli --quiet drawing.excalidraw output.png
```

---

## Workflow for Claude

### Step 1 — Locate the input file(s)

Uploaded files land under `/mnt/user-data/uploads/`. List them:

```bash
ls /mnt/user-data/uploads/
```

### Step 2 — Install the CLI (once per session)

```bash
npm install -g @tommywalkie/excalidraw-cli
```

### Step 3 — Run the conversion

```bash
# Single file
excalidraw-cli /mnt/user-data/uploads/drawing.excalidraw /mnt/user-data/outputs/drawing.png

# Or use a working directory to avoid long paths
cp /mnt/user-data/uploads/*.excalidraw /home/claude/
excalidraw-cli /home/claude/ /home/claude/output/
cp /home/claude/output/*.png /mnt/user-data/outputs/
```

### Step 4 — Present the result

Use `present_files` to expose the PNG(s) to the user.

---

## Troubleshooting

| Symptom | Likely cause | Fix |
|---|---|---|
| `command not found: excalidraw-cli` | Not installed or PATH issue | Re-run `npm install -g …` ; try `npx @tommywalkie/excalidraw-cli` |
| Build error during install (canvas) | Missing native libs | Install `cairo-dev`, `pango-dev`, etc. (see Alpine section) |
| Output PNG is blank / empty | Unsupported element types | Known limitation — the renderer mimics Excalidraw but does not support 100 % of elements |
| `ENOENT` on input path | Wrong path | Double-check the path; uploads live in `/mnt/user-data/uploads/` |

---

## Limitations

- The CLI uses a **home-made renderer** based on Rough.js and node-canvas — it is not the official Excalidraw renderer. Some visual differences may appear.
- **SVG export is not supported** by this CLI. For SVG output, a different approach (e.g. browser automation) would be needed.
- The project is **experimental** and no longer actively maintained; it targets the Excalidraw schema as of its last release.

---

## Full Example (bash script)

```bash
#!/usr/bin/env bash
set -e

INPUT_DIR="/mnt/user-data/uploads"
OUTPUT_DIR="/mnt/user-data/outputs"

# Install CLI if not already present
if ! command -v excalidraw-cli &>/dev/null; then
  npm install -g @tommywalkie/excalidraw-cli
fi

mkdir -p "$OUTPUT_DIR"

# Convert every .excalidraw file found in the uploads dir
for f in "$INPUT_DIR"/*.excalidraw; do
  [ -f "$f" ] || continue
  base=$(basename "$f" .excalidraw)
  excalidraw-cli "$f" "$OUTPUT_DIR/${base}.png"
  echo "✔ $f => $OUTPUT_DIR/${base}.png"
done
```