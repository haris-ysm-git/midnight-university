/**
 * lib/report.mjs
 * Write reports to tools/keywords/reports/
 */

import { writeFileSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPORTS_DIR = join(__dirname, '..', 'reports');

export function ensureReportsDir() {
  mkdirSync(REPORTS_DIR, { recursive: true });
}

export function writeReport(filename, content) {
  ensureReportsDir();
  const fullPath = join(REPORTS_DIR, filename);
  writeFileSync(fullPath, content, 'utf8');
  return fullPath;
}

export function timestamp() {
  return new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
}

export function reportsDir() {
  return REPORTS_DIR;
}
