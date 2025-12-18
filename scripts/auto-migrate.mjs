#!/usr/bin/env node

/**
 * Automatic Database Migration Script
 *
 * This script automatically applies database migrations to a Supabase project.
 * It requires the Supabase CLI to be installed.
 *
 * Usage:
 *   node scripts/auto-migrate.mjs
 *
 * Or as npm script:
 *   npm run db:migrate
 */

import { execSync } from 'child_process';
import { existsSync } from 'fs';
import { input, confirm } from '@inquirer/prompts';

async function main() {
  console.log(`
╔═══════════════════════════════════════╗
║                                       ║
║   Automatic Database Migration        ║
║                                       ║
╘═══════════════════════════════════════╝
`);

  // Check if Supabase CLI is installed
  try {
    execSync('npx supabase --version', { stdio: 'pipe' });
    console.log('✓ Supabase CLI detected');
  } catch (err) {
    console.log('✗ Supabase CLI not found');
    console.log('\nInstalling Supabase CLI...');
    execSync('npm install -g supabase', { stdio: 'inherit' });
  }

  // Check if already linked
  const isLinked = existsSync('./.supabase/config.toml');

  if (isLinked) {
    console.log('✓ Project already linked to Supabase');

    const relink = await confirm({
      message: 'Re-link to a different project?',
      default: false,
    });

    if (relink) {
      await linkProject();
    }
  } else {
    await linkProject();
  }

  // Push migrations
  console.log('\n✓ Pushing migrations to database...');

  try {
    execSync('npx supabase db push', { stdio: 'inherit' });
    console.log('\n✨ Migration complete! Your database is ready.');
  } catch (err) {
    console.error('\n✗ Migration failed');
    console.log('\nTroubleshooting:');
    console.log('1. Ensure your Supabase project is active');
    console.log('2. Check your network connection');
    console.log('3. Verify you have Owner permissions on the project');
    console.log('4. Try running manually: npx supabase db push');
    process.exit(1);
  }
}

async function linkProject() {
  console.log('\nTo link your Supabase project, you need:');
  console.log('1. Project Reference ID (from your Supabase dashboard URL)');
  console.log('2. Database password (set during project creation)');

  const projectRef = await input({
    message: 'Supabase Project Reference ID:',
    validate: (value) => {
      if (!value || value.length < 10) {
        return 'Please enter a valid project reference ID';
      }
      return true;
    },
  });

  const password = await input({
    message: 'Database Password:',
    validate: (value) => {
      if (!value) {
        return 'Password is required';
      }
      return true;
    },
  });

  console.log('\n✓ Linking to Supabase project...');

  try {
    execSync(
      `npx supabase link --project-ref ${projectRef} --password ${password}`,
      { stdio: 'inherit' }
    );
    console.log('✓ Project linked successfully');
  } catch (err) {
    console.error('✗ Failed to link project');
    console.log('\nPlease check:');
    console.log('- Project Reference ID is correct');
    console.log('- Database password is correct');
    console.log('- You have network access to Supabase');
    process.exit(1);
  }
}

main().catch((err) => {
  console.error('\n✗ Unexpected error:', err.message);
  process.exit(1);
});
