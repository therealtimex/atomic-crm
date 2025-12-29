#!/usr/bin/env node

/**
 * Extract the latest migration timestamp from supabase/migrations/
 *
 * Migration files follow the pattern: YYYYMMDDHHMMSS_description.sql
 * This script finds the newest timestamp and outputs it for Vite injection.
 */

import { readdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const MIGRATIONS_DIR = join(__dirname, '..', 'supabase', 'migrations');

try {
  // Read all files in migrations directory
  const files = readdirSync(MIGRATIONS_DIR);

  // Extract timestamps from filenames (format: YYYYMMDDHHMMSS_*.sql)
  const timestamps = files
    .filter((file) => file.endsWith('.sql'))
    .map((file) => {
      const match = file.match(/^(\d{14})_/);
      return match ? match[1] : null;
    })
    .filter(Boolean)
    .sort()
    .reverse(); // Sort descending to get latest first

  if (timestamps.length === 0) {
    console.error('No migration files found');
    process.exit(1);
  }

  const latestTimestamp = timestamps[0];

  // Output just the timestamp (for Vite to capture)
  console.log(latestTimestamp);
} catch (error) {
  console.error('Error reading migrations:', error.message);
  process.exit(1);
}
