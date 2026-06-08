import { stat } from 'node:fs/promises';
import { extname } from 'node:path';
import { exportDiagramsInDirectory, exportDiagramToPng, type ExportResult } from './export-diagram';

async function run(argv: ReadonlyArray<string>): Promise<ReadonlyArray<ExportResult>> {
  const [input, output] = argv;
  if (!input) {
    throw new Error('Usage: export-diagram <input.excalidraw|directory> [output.png]');
  }

  const inputStat = await stat(input);
  if (inputStat.isDirectory()) {
    return exportDiagramsInDirectory(input);
  }

  const outputPath = output ?? `${input.slice(0, -extname(input).length)}.png`;
  return [await exportDiagramToPng(input, outputPath)];
}

const results = await run(process.argv.slice(2));
for (const result of results) {
  console.log(`${result.inputPath} → ${result.outputPath}`);
}
