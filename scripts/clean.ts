/**
 * Clean all build artifacts
 * Run from root: npx tsx scripts/clean.ts
 */

import { execSync } from 'child_process';
import { rmSync, existsSync } from 'fs';
import { join } from 'path';

const dirsToClean = [
  'node_modules/.cache',
  'packages/shared/dist',
  'packages/ui/dist',
  'packages/file-operations/dist',
  'apps/web/dist',
  'apps/electron/dist',
  'apps/electron/out',
];

console.log('🧹 Cleaning build artifacts...\n');

for (const dir of dirsToClean) {
  const fullPath = join(process.cwd(), dir);
  if (existsSync(fullPath)) {
    console.log(`  Removing ${dir}...`);
    rmSync(fullPath, { recursive: true, force: true });
  }
}

console.log('\n✅ Clean complete!');
