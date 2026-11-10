#!/usr/bin/env node
/**
 * tools/keywords/cli.mjs
 * Entry point. Parses command and flags, dispatches to command modules.
 *
 * Usage:
 *   node tools/keywords/cli.mjs audit
 *   node tools/keywords/cli.mjs rename-links [--write]
 *   node tools/keywords/cli.mjs stubs [--write]
 *   node tools/keywords/cli.mjs autolink [--write] [--file <id>] [--density <n>]
 *                                         [--all-occurrences] [--include-generic]
 *                                         [--link-in-emphasis]
 */

import { readFileSync, existsSync } from 'fs';
import { join, dirname, resolve } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

// ── Load config ──────────────────────────────────────────────────────────────
const configPath = join(__dirname, 'config.json');
let config = {};
if (existsSync(configPath)) {
  config = JSON.parse(readFileSync(configPath, 'utf8'));
}

// Resolve relative paths in config relative to project root
// (two levels up from tools/keywords/)
const projectRoot = resolve(__dirname, '..', '..');
function resolvePath(p) {
  if (!p) return p;
  return resolve(projectRoot, p);
}

config.notesDir    = resolvePath(config.notesDir    || 'md_archive/03.tag');
config.articlesDir = resolvePath(config.articlesDir || 'md_archive/01.RAW MD');

// ── Parse args ───────────────────────────────────────────────────────────────
const args = process.argv.slice(2);
const command = args[0];

function hasFlag(flag) {
  return args.includes(flag);
}
function flagValue(flag) {
  const idx = args.indexOf(flag);
  if (idx === -1 || idx + 1 >= args.length) return null;
  return args[idx + 1];
}

const flags = {
  write:          hasFlag('--write'),
  file:           flagValue('--file'),
  density:        flagValue('--density') !== null ? parseInt(flagValue('--density'), 10) : config.density ?? 1500,
  allOccurrences: hasFlag('--all-occurrences'),
  includeGeneric: hasFlag('--include-generic'),
  linkInEmphasis: hasFlag('--link-in-emphasis'),
};

// ── Dispatch ─────────────────────────────────────────────────────────────────
switch (command) {
  case 'audit':
    await (await import('./commands/audit.mjs')).default(config, flags);
    break;
  case 'rename-links':
    await (await import('./commands/rename-links.mjs')).default(config, flags);
    break;
  case 'stubs':
    await (await import('./commands/stubs.mjs')).default(config, flags);
    break;
  case 'autolink':
    await (await import('./commands/autolink.mjs')).default(config, flags);
    break;
  default:
    console.error(`Unknown command: ${command || '(none)'}`);
    console.error('Available: audit, rename-links, stubs, autolink');
    process.exit(1);
}
