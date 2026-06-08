# @home/excalidraw-export

Convertit des fichiers `.excalidraw` (JSON) en PNG fidèles — texte lié (`containerId`/`boundElements`) et flèches bindées (`startBinding`/`endBinding`) inclus.

## Pourquoi pas un renderer "headless" classique ?

- [`@tommywalkie/excalidraw-cli`](https://github.com/tommywalkie/excalidraw-cli) utilise un renderer maison (Rough.js + node-canvas) qui ne supporte ni le texte lié ni les flèches bindées → PNG vides.
- [`@excalidraw/utils`](https://www.npmjs.com/package/@excalidraw/utils) (le vrai renderer Excalidraw) est un bundle **navigateur** : `window`, `document`, mesure de texte via `canvas`, polices via `FontFace`. Le faire tourner via des polyfills `jsdom` se transforme en chasse aux globals sans fin (`navigator` → `self` → `requestAnimationFrame` → `matchMedia` → `DOMMatrix` → … → blocage silencieux).

Ce package pilote donc un vrai **Chromium headless** (Playwright) — exactement l'environnement dans lequel excalidraw.com s'exécute — et y exécute `@excalidraw/utils.exportToBlob`.

## Le correctif clé : `baseline`

`@excalidraw/utils@0.1.2` lit `baseline` directement sur les éléments texte et l'utilise dans des calculs (`height - baseline`). Les fichiers `.excalidraw` actuels ne persistent plus ce champ (l'éditeur le calcule à la volée) → `undefined` → `NaN` → le texte ne se dessine pas, silencieusement. `normalizeScene` (dans `excalidraw-scene.ts`) le recalcule depuis `fontSize` avant le rendu.

## Usage

```bash
# Fichier unique
npm run export-diagram -- docs/sessions/diagrams/auth-flow.excalidraw docs/sessions/diagrams/auth-flow.png

# Sortie déduite (même nom, extension .png)
npm run export-diagram -- docs/sessions/diagrams/auth-flow.excalidraw

# Batch : tous les *.excalidraw d'un dossier (récursif), PNG à côté de chaque source
npm run export-diagram -- docs/sessions/diagrams
```

## Pré-requis

Chromium doit être installé pour Playwright (une fois par machine) :

```bash
npx playwright install chromium
```
