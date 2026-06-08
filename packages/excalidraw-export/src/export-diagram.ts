import { readFile, writeFile } from 'node:fs/promises';
import { extname, join } from 'node:path';
import { glob } from 'node:fs/promises';
import { normalizeScene, type ExcalidrawScene } from './excalidraw-scene';
import { renderSceneToPng } from './render-scene';

export type ExportResult = {
  readonly inputPath: string;
  readonly outputPath: string;
};

export async function exportDiagramToPng(
  inputPath: string,
  outputPath: string,
): Promise<ExportResult> {
  const scene = JSON.parse(await readFile(inputPath, 'utf8')) as ExcalidrawScene;
  const png = await renderSceneToPng(normalizeScene(scene));
  await writeFile(outputPath, png);

  return { inputPath, outputPath };
}

export async function exportDiagramsInDirectory(
  directoryPath: string,
): Promise<ReadonlyArray<ExportResult>> {
  const results: ExportResult[] = [];

  for await (const entry of glob('**/*.excalidraw', { cwd: directoryPath })) {
    const inputPath = join(directoryPath, entry);
    const outputPath = `${inputPath.slice(0, -extname(inputPath).length)}.png`;
    results.push(await exportDiagramToPng(inputPath, outputPath));
  }

  return results;
}
