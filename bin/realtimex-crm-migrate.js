#!/usr/bin/env node

/**
 * RealTimeX CRM Migration CLI
 *
 * This script wraps the migrate.sh shell script to provide a user-friendly
 * migration experience for users running the CRM via npx.
 */

import { execSync } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// ANSI color codes for pretty output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logHeader() {
  log('\n╔════════════════════════════════════════════════════════════╗', 'cyan');
  log('║                                                            ║', 'cyan');
  log('║         🚀 RealTimeX CRM Migration Tool v0.31.1           ║', 'cyan');
  log('║                                                            ║', 'cyan');
  log('╚════════════════════════════════════════════════════════════╝', 'cyan');
  log('');
}

function checkSupabaseCLI() {
  log('🔍 Checking for Supabase CLI...', 'blue');

  try {
    execSync('supabase --version', { stdio: 'pipe' });
    log('✅ Supabase CLI found\n', 'green');
    return true;
  } catch (error) {
    log('❌ Supabase CLI not found\n', 'red');
    log('The Supabase CLI is required to run migrations.', 'yellow');
    log('\nInstallation instructions:', 'bright');
    log('  • macOS:   brew install supabase/tap/supabase');
    log('  • Windows: scoop bucket add supabase https://github.com/supabase/scoop-bucket.git');
    log('             scoop install supabase');
    log('  • Linux:   See https://supabase.com/docs/guides/cli/getting-started\n');
    return false;
  }
}

function checkSupabaseLogin() {
  log('🔍 Checking Supabase authentication...', 'blue');

  try {
    execSync('supabase projects list', { stdio: 'pipe' });
    log('✅ Supabase authentication verified\n', 'green');
    return true;
  } catch (error) {
    log('❌ Not logged in to Supabase\n', 'red');
    log('Please log in to Supabase before running migrations:', 'yellow');
    log('  supabase login\n', 'bright');
    return false;
  }
}

function runMigration() {
  // Path to the migrate.sh script
  const scriptPath = join(__dirname, '..', 'scripts', 'migrate.sh');

  log('═══════════════════════════════════════════════════════════', 'cyan');
  log('  Starting migration process...', 'bright');
  log('═══════════════════════════════════════════════════════════\n', 'cyan');

  try {
    // Run the migrate.sh script with inherited stdio so user sees all output
    execSync(`bash "${scriptPath}"`, {
      stdio: 'inherit',
      cwd: process.cwd()
    });

    log('\n═══════════════════════════════════════════════════════════', 'cyan');
    log('  ✅ Migration completed successfully!', 'green');
    log('═══════════════════════════════════════════════════════════\n', 'cyan');

    return true;
  } catch (error) {
    log('\n═══════════════════════════════════════════════════════════', 'cyan');
    log('  ❌ Migration failed', 'red');
    log('═══════════════════════════════════════════════════════════\n', 'cyan');
    log('If the error persists, please:', 'yellow');
    log('  1. Check your Supabase project settings');
    log('  2. Verify your database password');
    log('  3. Report the issue at: https://github.com/therealtimex/realtimex-crm/issues\n');

    return false;
  }
}

// Main execution
async function main() {
  logHeader();

  // Pre-flight checks
  if (!checkSupabaseCLI()) {
    process.exit(1);
  }

  if (!checkSupabaseLogin()) {
    process.exit(1);
  }

  // Run the migration
  const success = runMigration();

  process.exit(success ? 0 : 1);
}

main();
