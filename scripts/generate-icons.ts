/**
 * Script to generate application icons from SVG
 * Converts the SVG icon to PNG format for electron-builder
 */

import sharp from 'sharp';
import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

const svgPath = resolve(__dirname, '../apps/electron/resources/icon.svg');
const pngPath = resolve(__dirname, '../apps/electron/resources/icon.png');

async function generateIcon() {
  console.log('Generating application icon...');

  const svgBuffer = readFileSync(svgPath);

  await sharp(svgBuffer)
    .resize(512, 512)
    .png()
    .toFile(pngPath);

  console.log(`✓ Generated ${pngPath}`);
}

generateIcon().catch((err) => {
  console.error('Failed to generate icon:', err);
  process.exit(1);
});
