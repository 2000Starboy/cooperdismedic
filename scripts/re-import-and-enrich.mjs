#!/usr/bin/env node
/**
 * Re-import and enrich all products:
 * 1. Re-extract from external URLs using enrich-imported-products.mjs
 * 2. Fill missing fields from similar products
 * 3. Batch extract from cure.ma if URLs available
 */

import { spawn } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, '..');

function runScript(scriptPath, description) {
  return new Promise((resolve, reject) => {
    console.log(`\n${'='.repeat(60)}`);
    console.log(`Step: ${description}`);
    console.log(`${'='.repeat(60)}`);

    const proc = spawn('node', [scriptPath], {
      cwd: projectRoot,
      stdio: 'inherit',
      shell: true,
    });

    proc.on('close', (code) => {
      if (code === 0) {
        console.log(`✓ ${description} completed successfully`);
        resolve();
      } else {
        console.error(`✗ ${description} failed with code ${code}`);
        reject(new Error(`${description} failed`));
      }
    });

    proc.on('error', (err) => {
      console.error(`✗ Error running ${description}:`, err);
      reject(err);
    });
  });
}

async function main() {
  try {
    console.log('Starting comprehensive product import and enrichment...\n');

    // Step 1: Enhanced enrichment - fetch all URLs and extract with multiple methods
    await runScript(
      path.join(__dirname, 'enrich-all-products-enhanced.mjs'),
      'Step 1: Enhanced enrichment from all external URLs'
    );

    // Step 2: Fill any remaining missing fields from similar products (same DCI)
    await runScript(
      path.join(__dirname, 'fill-missing-fields.mjs'),
      'Step 2: Fill remaining missing fields from similar products'
    );

    console.log(`\n${'='.repeat(60)}`);
    console.log('✓ All enrichment steps completed successfully!');
    console.log('✓ Products seed file has been updated.');
    console.log(`${'='.repeat(60)}\n`);

  } catch (error) {
    console.error('\n✗ Re-import and enrichment failed:', error.message);
    process.exit(1);
  }
}

main().catch((err) => {
  console.error('Unexpected error:', err);
  process.exit(1);
});
