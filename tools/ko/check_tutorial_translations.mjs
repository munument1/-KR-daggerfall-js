#!/usr/bin/env node
// Data-only QA for the DFO Korean tutorial catalogue.
// Does not modify the runtime or change trigger/quest/save behavior.
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(fileURLToPath(new URL('../../', import.meta.url)));
const src = readFileSync(resolve(root, 'src/systems/tutorialCatalogue.js'), 'utf8');
const ko = JSON.parse(readFileSync(resolve(root, 'locales/ko/tutorials.ko.json'), 'utf8'));
const errors = [];
const extractStrings = (raw) => [...raw.matchAll(/'((?:\\.|[^'\\])*)'/g)]
  .map(m => m[1].replace(/\\'/g, "'").replace(/\\\\/g, '\\'));
const placeholders = (text) => [...String(text).matchAll(/\{[A-Za-z][A-Za-z0-9]*\}/g)]
  .map(x => x[0]).sort().join('|');
const begin = src.indexOf('export const TUTORIALS = Object.freeze([');
const end = src.indexOf('\n]);', begin);
if (begin < 0 || end < 0) throw Error('Cannot find tutorial catalogue');
const contents = src.slice(begin, end);
const starts = [...contents.matchAll(/\bpage\(\{/g)].map(x => x.index);
const original = [];
for (let i = 0; i < starts.length; i++) {
  const block = contents.slice(starts[i], starts[i + 1] ?? contents.length);
  const id = block.match(/\bid:\s*'([^']+)'/)?.[1];
  const group = block.match(/\bgroup:\s*'([^']+)'/)?.[1];
  if (!id || !group) throw Error('Malformed source page at ' + i);
  original.push({
    id, group,
    body: extractStrings(block.match(/\bbody:\s*\[([\s\S]*?)\]\s*,/)?.[1] ?? ''),
    points: extractStrings(block.match(/\bpoints:\s*\[([\s\S]*?)\]\s*,/)?.[1] ?? ''),
  });
}
const originalMap = new Map(original.map(p => [p.id, p]));
const seen = new Set();
for (const p of ko.pages ?? []) {
  if (seen.has(p.id)) errors.push(p.id + ': duplicate');
  seen.add(p.id);
  const e = originalMap.get(p.id);
  if (!e) { errors.push(p.id + ': not in original'); continue; }
  if (!(ko.groups?.[e.group])) errors.push(p.id + ': missing group translation ' + e.group);
  if (!p.title || !p.trigger) errors.push(p.id + ': missing title or trigger');
  for (const field of ['body', 'points']) {
    const before = e[field], after = p[field] ?? [];
    if (before.length !== after.length) {
      errors.push(p.id + ' ' + field + ': count ' + before.length + ' vs ' + after.length);
      continue;
    }
    for (let j = 0; j < before.length; j++) {
      if (placeholders(before[j]) !== placeholders(after[j]))
        errors.push(p.id + ' ' + field + '[' + j + ']: changed key-binding token');
      if (!/[가-힣]/.test(after[j]))
        errors.push(p.id + ' ' + field + '[' + j + ']: untranslated');
    }
  }
}
for (const p of original) if (!seen.has(p.id)) errors.push(p.id + ': missing translation');
if (original.length !== (ko.pages ?? []).length)
  errors.push('page count mismatch: ' + original.length + ' vs ' + ko.pages?.length);
if (errors.length) {
  console.error('Korean tutorial QA FAILED:\n' + errors.join('\n'));
  process.exit(1);
}
console.log('Korean tutorial QA OK:', original.length, 'pages;',
  Object.keys(ko.groups).length, 'groups;', Object.keys(ko.ui ?? {}).length, 'UI labels');
