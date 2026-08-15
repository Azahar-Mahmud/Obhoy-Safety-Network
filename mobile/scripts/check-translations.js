// Run from mobile/: node scripts/check-translations.js
const fs = require('fs');
const path = require('path');

const src = fs.readFileSync(path.join(__dirname, '../src/i18n/strings.ts'), 'utf8');

function keysIn(tableName) {
  const start = src.indexOf(`export const ${tableName}`);
  if (start === -1) return [];
  const slice = src.slice(start);
  const end = slice.indexOf('\n};');
  return [...slice.slice(0, end).matchAll(/^\s*'([^']+)':/gm)].map((m) => m[1]);
}

const enKeys = keysIn('en');
const bnKeys = new Set(keysIn('bn'));
const missing = enKeys.filter((k) => !bnKeys.has(k));

console.log(`en keys: ${enKeys.length}`);
console.log(`bn keys: ${bnKeys.size}`);
if (missing.length === 0) {
  console.log('All strings translated.');
} else {
  console.log(`\nMissing Bangla (${missing.length}):`);
  missing.forEach((k) => console.log('  ' + k));
}