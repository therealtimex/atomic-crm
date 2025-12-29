#!/usr/bin/env node

/**
 * Create a new Supabase migration with auto-injected version
 *
 * Usage:
 *   npm run migration:create "Description of migration"
 *   node scripts/create-migration.mjs "Add new feature"
 */

import { execSync } from 'child_process';
import { readFileSync, writeFileSync, appendFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Get the migration description from command line
const description = process.argv[2];

if (!description) {
  console.error('❌ Error: Migration description is required');
  console.error('Usage: npm run migration:create "Description of migration"');
  process.exit(1);
}

// Read current version from package.json
const packageJsonPath = join(__dirname, '..', 'package.json');
const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf8'));
const version = packageJson.version;

console.log(`📦 Creating migration for version ${version}...`);

// Create migration using Supabase CLI
const migrationName = description
  .toLowerCase()
  .replace(/[^a-z0-9]+/g, '_')
  .replace(/^_|_$/g, '');

try {
  const output = execSync(`npx supabase migration new ${migrationName}`, {
    encoding: 'utf8',
  });

  // Extract the migration file path from output
  // Example: "Created new migration at supabase/migrations/20251229213735_my_migration.sql"
  const match = output.match(/supabase\/migrations\/(\d+_\w+\.sql)/);

  if (!match) {
    console.error('❌ Could not parse migration file path from output');
    console.error(output);
    process.exit(1);
  }

  const migrationFile = join(__dirname, '..', 'supabase', 'migrations', match[1]);

  console.log(`✅ Migration file created: ${migrationFile}`);

  // Extract timestamp from migration filename
  const timestamp = match[1].match(/^(\d{14})/)[0];

  // Append version tracking to the migration file
  const versionTracking = `
-- Track this migration in schema_migrations table
INSERT INTO schema_migrations (version, description, latest_migration_timestamp)
VALUES ('${version}', '${description}', '${timestamp}')
ON CONFLICT (version) DO UPDATE
SET latest_migration_timestamp = EXCLUDED.latest_migration_timestamp;
`;

  appendFileSync(migrationFile, versionTracking);

  console.log(`✅ Version tracking added (v${version}, timestamp: ${timestamp})`);
  console.log(`📝 Edit the migration file to add your SQL:`);
  console.log(`   ${migrationFile}`);
} catch (error) {
  console.error('❌ Failed to create migration:', error.message);
  process.exit(1);
}
