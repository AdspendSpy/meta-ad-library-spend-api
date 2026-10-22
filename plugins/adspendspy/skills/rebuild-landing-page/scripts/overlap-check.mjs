#!/usr/bin/env node
// Overlap check: finds runs of N or more identical consecutive words shared by two files.
// Usage: node overlap-check.mjs <original-text-or-html> <built-file> [more built files...] [--min=8]
// HTML is stripped (script/style/noscript/template/svg contents, comments, tags), entities decoded,
// text lowercased and split into words. Prints every shared run; exit 1 on any hit, 0 otherwise.
// No dependencies.
import { readFileSync } from 'node:fs';

const args = process.argv.slice(2);
let min = 8;
const files = [];
for (const a of args) {
  const m = a.match(/^--min=(\d+)$/);
  if (m) min = Math.max(2, Number(m[1]));
  else files.push(a);
}
if (files.length < 2) {
  console.error('Usage: node overlap-check.mjs <original> <built> [more built...] [--min=8]');
  process.exit(2);
}

const ENTITIES = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ', rsquo: "'", lsquo: "'", rdquo: '"', ldquo: '"', ndash: '-', mdash: '-', hellip: '...' };

function toWords(raw) {
  const text = raw
    .replace(/<!--[\s\S]*?-->/g, ' ')
    .replace(/<(script|style|noscript|template|svg)\b[\s\S]*?<\/\1\s*>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(Number(n)))
    .replace(/&#x([0-9a-f]+);/gi, (_, n) => String.fromCodePoint(parseInt(n, 16)))
    .replace(/&([a-z]+);/gi, (m, n) => ENTITIES[n.toLowerCase()] ?? ' ')
    .replace(/[‘’]/g, "'")
    .toLowerCase();
  return text.match(/[\p{L}\p{N}]+(?:'[\p{L}\p{N}]+)*/gu) || [];
}

function read(path) {
  try {
    return readFileSync(path, 'utf8');
  } catch (e) {
    console.error(`Cannot read ${path}: ${e.message}`);
    process.exit(2);
  }
}

const original = toWords(read(files[0]));
const shingles = new Set();
for (let i = 0; i + min <= original.length; i++) shingles.add(original.slice(i, i + min).join(' '));

let total = 0;
for (const file of files.slice(1)) {
  const words = toWords(read(file));
  const runs = [];
  let start = -1;
  let end = -1;
  for (let i = 0; i + min <= words.length; i++) {
    if (shingles.has(words.slice(i, i + min).join(' '))) {
      if (start !== -1 && i <= end) end = i + min;
      else {
        if (start !== -1) runs.push([start, end]);
        start = i;
        end = i + min;
      }
    }
  }
  if (start !== -1) runs.push([start, end]);

  for (const [s, e] of runs) {
    console.log(`${file}: shared run of ${e - s} words: "${words.slice(s, e).join(' ')}"`);
  }
  total += runs.length;
}

if (total > 0) {
  console.log(`FAIL: ${total} shared run(s) of ${min}+ words with ${files[0]}`);
  process.exit(1);
}
console.log(`OK: no shared run of ${min}+ words with ${files[0]}`);
process.exit(0);
