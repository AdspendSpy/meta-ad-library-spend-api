#!/usr/bin/env node
// Packages the rebuild-landing-page skill as dist/rebuild-landing-page.zip for upload to claude.ai.
// The skill folder is the top level inside the ZIP. No dependencies; uses the system zip binary.
import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, rmSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const skillName = 'rebuild-landing-page';
const skillsDir = join(root, 'plugins', 'adspendspy', 'skills');
const distDir = join(root, 'dist');
const zipPath = join(distDir, `${skillName}.zip`);

if (!existsSync(join(skillsDir, skillName, 'SKILL.md'))) {
  console.error(`Missing ${join(skillsDir, skillName, 'SKILL.md')}`);
  process.exit(1);
}

mkdirSync(distDir, { recursive: true });
rmSync(zipPath, { force: true });

execFileSync('/usr/bin/zip', ['-r', '-X', zipPath, skillName, '-x', '*.DS_Store'], {
  cwd: skillsDir,
  stdio: 'inherit',
});

console.log(`Wrote ${zipPath}`);
