/**
 * Build all packages and applications
 * Run from root: npx tsx scripts/build-all.ts
 */

import { execSync } from 'child_process';

const packages = ['@archivo/shared', '@archivo/ui', '@archivo/file-operations'];
const apps = ['@archivo/web', '@archivo/electron'];

console.log('🔨 Building all packages and apps...\n');

// Build packages first (in order)
for (const pkg of packages) {
  console.log(`📦 Building ${pkg}...`);
  execSync(`pnpm --filter ${pkg} build`, { stdio: 'inherit' });
}

// Then build apps
for (const app of apps) {
  console.log(`🚀 Building ${app}...`);
  execSync(`pnpm --filter ${app} build`, { stdio: 'inherit' });
}

console.log('\n✅ All packages and apps built successfully!');
