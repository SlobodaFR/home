import { chromium } from 'playwright';
import * as esbuild from 'esbuild';
import type { ExcalidrawScene } from './excalidraw-scene';

const EXCALIDRAW_FONTS = {
  Virgil: 'https://excalidraw.com/Virgil.woff2',
  Cascadia: 'https://excalidraw.com/Cascadia.woff2',
} as const;

let bundledExcalidrawUtils: Promise<string> | undefined;

/**
 * @excalidraw/utils ships a browser-only UMD bundle (relies on `window`,
 * `document`, canvas text metrics, …). jsdom polyfilling cascades
 * indefinitely; a real headless Chromium page is the only environment that
 * renders bound text and bound arrows exactly like excalidraw.com.
 */
function bundledUtils(): Promise<string> {
  bundledExcalidrawUtils ??= esbuild
    .build({
      stdin: {
        contents: `export * as ExcalidrawUtils from '@excalidraw/utils';`,
        resolveDir: import.meta.dirname,
        loader: 'ts',
      },
      bundle: true,
      format: 'iife',
      globalName: 'ExcalidrawExport',
      platform: 'browser',
      write: false,
    })
    .then(
      (result) =>
        `${result.outputFiles[0]?.text}\nwindow.ExcalidrawUtils = ExcalidrawExport.ExcalidrawUtils;`,
    );

  return bundledExcalidrawUtils;
}

export async function renderSceneToPng(scene: ExcalidrawScene): Promise<Buffer> {
  const bundle = await bundledUtils();
  const browser = await chromium.launch();

  try {
    const page = await browser.newPage();
    await page.setContent('<!DOCTYPE html><html><body></body></html>');
    await page.addScriptTag({ content: bundle });

    const dataUrl = await page.evaluate(exportSceneToPngDataUrl, {
      scene,
      fonts: EXCALIDRAW_FONTS,
    });

    return Buffer.from(dataUrl.split(',')[1] ?? '', 'base64');
  } finally {
    await browser.close();
  }
}

/** Runs inside the headless page — every reference here must be browser-native. */
async function exportSceneToPngDataUrl(input: {
  scene: ExcalidrawScene;
  fonts: Record<string, string>;
}): Promise<string> {
  for (const [family, url] of Object.entries(input.fonts)) {
    const font = new FontFace(family, `url(${url})`);
    await font.load();
    document.fonts.add(font);
  }
  await document.fonts.ready;

  const utils = (window as unknown as { ExcalidrawUtils: typeof import('@excalidraw/utils') })
    .ExcalidrawUtils;
  const blob = await utils.exportToBlob({
    elements: input.scene.elements,
    appState: {
      ...input.scene.appState,
      exportBackground: true,
      viewBackgroundColor:
        (input.scene.appState?.['viewBackgroundColor'] as string | undefined) ?? '#ffffff',
    },
    files: input.scene.files ?? null,
    mimeType: 'image/png',
  });

  return await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(blob);
  });
}
