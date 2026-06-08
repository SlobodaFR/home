export type ExcalidrawElement = {
  readonly type: string;
  readonly fontSize?: number;
  readonly baseline?: number;
} & Record<string, unknown>;

export type ExcalidrawScene = {
  readonly elements: ReadonlyArray<ExcalidrawElement>;
  readonly appState?: Record<string, unknown>;
  readonly files?: Record<string, unknown> | null;
} & Record<string, unknown>;

const BASELINE_TO_FONT_SIZE_RATIO = 1.2;

/**
 * @excalidraw/utils@0.1.2 reads `baseline` straight off text elements and uses
 * it in arithmetic (`height - baseline`); current Excalidraw scene files no
 * longer persist it (computed at runtime by the editor), so a missing value
 * becomes `NaN` and the renderer silently draws nothing. Backfill it.
 */
export function normalizeScene(scene: ExcalidrawScene): ExcalidrawScene {
  return {
    ...scene,
    elements: scene.elements.map(normalizeElement),
  };
}

function normalizeElement(element: ExcalidrawElement): ExcalidrawElement {
  if (element.type !== 'text' || typeof element.baseline === 'number') {
    return element;
  }

  const fontSize = element.fontSize ?? 20;
  return { ...element, baseline: Math.round(fontSize * BASELINE_TO_FONT_SIZE_RATIO) };
}
