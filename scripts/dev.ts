/**
 * Start development mode
 * Run from root: npx tsx scripts/dev.ts [web|electron|all]
 */

import { spawn } from 'child_process';

const target = process.argv[2] || 'all';

console.log(`🚀 Starting development mode for: ${target}\n`);

if (target === 'web' || target === 'all') {
  console.log('🌐 Starting web app...');
  spawn('pnpm', ['--filter', '@archivo/web', 'dev'], {
    stdio: 'inherit',
    shell: true,
  });
}

if (target === 'electron' || target === 'all') {
  console.log('🖥️ Starting Electron app...');
  spawn('pnpm', ['--filter', '@archivo/electron', 'dev'], {
    stdio: 'inherit',
    shell: true,
  });
}
