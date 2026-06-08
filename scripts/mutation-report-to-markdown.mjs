import { readFile } from 'node:fs/promises';

const [, , reportPath] = process.argv;
if (!reportPath) {
  throw new Error('Usage: mutation-report-to-markdown <mutation.json>');
}

const report = JSON.parse(await readFile(reportPath, 'utf8'));

const counts = {
  Killed: 0,
  Survived: 0,
  Timeout: 0,
  NoCoverage: 0,
  Ignored: 0,
  RuntimeError: 0,
  CompileError: 0,
};
const survivors = [];

for (const [file, data] of Object.entries(report.files)) {
  for (const mutant of data.mutants) {
    counts[mutant.status] = (counts[mutant.status] ?? 0) + 1;
    if (mutant.status === 'Survived') {
      survivors.push({ file, mutant });
    }
  }
}

const detected = counts.Killed + counts.Timeout;
const valid =
  detected + counts.Survived + counts.NoCoverage + counts.RuntimeError + counts.CompileError;
const score = valid > 0 ? (detected / valid) * 100 : 100;

const lines = [
  '### 🧬 Mutation testing (Stryker) — `@home/auth` domain + application',
  '',
  `**Score: ${score.toFixed(2)}%** (${detected}/${valid} mutants detected)`,
  '',
  '| Killed | Timeout | Survived | No coverage | Errors |',
  '| ------ | ------- | -------- | ----------- | ------ |',
  `| ${counts.Killed} | ${counts.Timeout} | ${counts.Survived} | ${counts.NoCoverage} | ${counts.RuntimeError + counts.CompileError} |`,
];

if (survivors.length > 0) {
  lines.push(
    '',
    '<details>',
    `<summary>${survivors.length} surviving mutant(s) — tests didn't notice these changes</summary>`,
    '',
  );
  for (const { file, mutant } of survivors) {
    const { start } = mutant.location;
    lines.push(
      `- \`${file}:${start.line}:${start.column}\` — **${mutant.mutatorName}**: \`${mutant.replacement ?? mutant.mutatorName}\``,
    );
  }
  lines.push('', '</details>');
}

process.stdout.write(`${lines.join('\n')}\n`);
