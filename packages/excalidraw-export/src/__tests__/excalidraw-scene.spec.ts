import { describe, expect, it } from 'vitest';
import { normalizeScene, type ExcalidrawElement } from '../excalidraw-scene';

function textElement(overrides: Partial<ExcalidrawElement> = {}): ExcalidrawElement {
  return { type: 'text', fontSize: 20, ...overrides };
}

describe('normalizeScene', () => {
  it('should backfill baseline when text element omits it', () => {
    const scene = normalizeScene({ elements: [textElement({ fontSize: 28 })] });

    expect(scene.elements[0]?.['baseline']).toBe(34);
  });

  it('should keep existing baseline when text element already has one', () => {
    const scene = normalizeScene({ elements: [textElement({ fontSize: 28, baseline: 25 })] });

    expect(scene.elements[0]?.['baseline']).toBe(25);
  });

  it('should leave non-text elements untouched', () => {
    const rectangle: ExcalidrawElement = { type: 'rectangle', width: 100, height: 50 };

    const scene = normalizeScene({ elements: [rectangle] });

    expect(scene.elements[0]).toEqual(rectangle);
  });

  it('should fall back to a default font size when text element has none', () => {
    const scene = normalizeScene({ elements: [{ type: 'text' }] });

    expect(scene.elements[0]?.['baseline']).toBe(24);
  });
});
