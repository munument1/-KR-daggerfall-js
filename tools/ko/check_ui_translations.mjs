#!/usr/bin/env node
// Validates Korean display-string drafts without changing runtime code.
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(fileURLToPath(new URL('../../', import.meta.url)));
const FILES = [
  'chargen-part1.ko.json',
  'chargen-part2.ko.json',
  'inventory.ko.json',
  'social.ko.json',
  'settings-labels.ko.json',
];
const read = path => readFileSync(resolve(ROOT, path), 'utf8');
const errors = [];
const ids = new Set();
const metrics = [];
const seenSettings = new Set();
for (const filename of FILES) {
  const parsed = JSON.parse(read('locales/ko/ui/' + filename));
  const source = read(parsed.source_file).split('\n');
  if (parsed.status !== 'draft_not_loaded_by_game') errors.push(filename + ': must declare unwired draft status');
  for (const entry of parsed.entries) {
    const id = entry.id;
    if (ids.has(id)) errors.push(id + ': duplicate ID');
    ids.add(id);
    if (!entry.en || !/[가-힣]/.test(entry.ko ?? '')) errors.push(id + ': untranslated');
    const raw = source[(entry.line || 0) - 1];
    if (!raw) { errors.push(id + ': original line disappeared'); continue; }
    // Preserve the JavaScript escape cases represented as text in the source.
    const decoded = raw.replace(/\\'/g, "'").replace(/\\u2019/g, '\u2019');
    if (!decoded.includes(entry.en)) errors.push(id + ': English source does not match the indicated line');
    const tok = s => [...String(s).matchAll(/\{[A-Za-z][A-Za-z0-9_]*\}/g)].map(m => m[0]).sort().join('|');
    if (tok(entry.en) !== tok(entry.ko)) errors.push(id + ': placeholder mismatch');
    if (filename === 'settings-labels.ko.json') {
      if (!entry.key) errors.push(id + ': missing immutable settings key');
      if (seenSettings.has(entry.key)) errors.push(id + ': duplicate settings key');
      seenSettings.add(entry.key);
      if (!raw.includes('"' + entry.key + '": "' + entry.en + '"')) errors.push(id + ': settings key/value drift');
    }
  }
  metrics.push({file: filename, count: parsed.entries.length});
}
const labels = read('src/ui/settingsCopy.js').split('\n');
const begin = labels.findIndex(l => l.includes('export const LABELS = Object.freeze({'));
const end = labels.findIndex((l,i) => i > begin && l.trim() === '});');
const expected = [...labels.slice(begin, end).join('\n').matchAll(/^\s*"([^"]+)": "([^"]+)",?$/gm)].map(x => x[1]);
if (expected.length !== seenSettings.size) errors.push('settings catalog missing/extra keys');
for(const key of expected) if (!seenSettings.has(key)) errors.push('untranslated settings key: ' + key);
console.log(JSON.stringify({entries:metrics.reduce((n,x)=>n+x.count,0),files:metrics,settingsKeys:seenSettings.size,errors},null,2));
if (errors.length) process.exit(1);
