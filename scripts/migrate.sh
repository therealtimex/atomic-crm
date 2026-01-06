#!/bin/bash

# ==============================================================================
# REALTIMEX-CRM MIGRATION & UPDATE UTILITY
# ==============================================================================
#
# DESCRIPTION:
#   This script automates the backend update process for RealtimeX CRM.
#   It performs the following actions without requiring the user to clone git:
#   1. Creates a temporary, invisible workspace on your system.
#   2. Downloads the latest code/migrations from the official GitHub repository.
#   3. Links your local environment to your remote Supabase project.
#   4. Applies the latest Database Schema changes (Tables, Columns, etc).
#   5. Deploys the latest Edge Functions (API Logic).
#   6. Cleans up all temporary files automatically.
#
# PREREQUISITES:
#   1. Supabase CLI installed (brew install supabase/tap/supabase).
#   2. You must be logged in (run: 'supabase login').
#   3. You need your Supabase Project Reference ID (e.g., 'abcdefghijklm').
#   4. You need your Database Password (to type when prompted).
#
# HOW TO USE:
#   1. Download this file to your computer.
#   2. Open your terminal and navigate to the folder where you saved it.
#   3. Make the script executable:
#      chmod +x migrate.sh
#   4. Run the script:
#      ./migrate.sh
#
# ==============================================================================

# Exit immediately if any command fails
set -e

# --- CONFIGURATION ---
GITHUB_ORG="therealtimex"
REPO_NAME="realtimex-crm"
BRANCH="main"

echo "🚀 Starting RealtimeX CRM Migration Tool..."

# ------------------------------------------------------------------------------
# 1. PRE-FLIGHT CHECKS
# ------------------------------------------------------------------------------

# Check if Supabase CLI is installed
if ! command -v supabase &> /dev/null; then
    echo "❌ Error: 'supabase' CLI is not installed."
    echo "   Please install it via: brew install supabase/tap/supabase"
    echo "   Or visit: https://supabase.com/docs/guides/cli"
    exit 1
fi

# ------------------------------------------------------------------------------
# 2. GATHER CREDENTIALS
# ------------------------------------------------------------------------------

# If the Project ID wasn't set as an env var, ask the user for it now.
if [ -z "$SUPABASE_PROJECT_ID" ]; then
    echo "---------------------------------------------------------"
    echo "👉 Enter your Supabase Project Reference ID:"
    echo "   (Found in Supabase Dashboard > Project Settings > General)"
    read -p "   Project ID: " SUPABASE_PROJECT_ID
fi

if [ -z "$SUPABASE_PROJECT_ID" ]; then
    echo "❌ Error: Project ID is required to proceed."
    exit 1
fi

# ------------------------------------------------------------------------------
# 3. PREPARE TEMPORARY WORKSPACE
# ------------------------------------------------------------------------------

# Create a safe, random directory in the system temp folder (e.g., /tmp/tmp.XyZ123)
# This ensures we don't mess with existing files on the user's desktop.
WORK_DIR=$(mktemp -d)
echo "🧹 Working in temporary system directory..."

# Define a cleanup function that runs automatically when the script exits
# (Whether it finishes successfully or crashes)
cleanup() {
    rm -rf "$WORK_DIR"
    echo "🧹 Temporary files cleaned up."
}
trap cleanup EXIT

# ------------------------------------------------------------------------------
# 4. DOWNLOAD & EXTRACT LATEST CODE
# ------------------------------------------------------------------------------

echo "📥 Downloading latest source from GitHub ($BRANCH)..."
# Download the repository archive as a compressed file
curl -L -s "https://github.com/$GITHUB_ORG/$REPO_NAME/archive/refs/heads/$BRANCH.tar.gz" -o "$WORK_DIR/repo.tar.gz"

echo "📦 Extracting configuration files..."
# Extract the files, stripping the root folder so they sit directly in WORK_DIR
tar -xzf "$WORK_DIR/repo.tar.gz" -C "$WORK_DIR" --strip-components=1

# ------------------------------------------------------------------------------
# 5. EXECUTE MIGRATION
# ------------------------------------------------------------------------------

# Move into the temp directory to run Supabase commands
cd "$WORK_DIR"

echo "---------------------------------------------------------"
echo "🔗 Linking to Supabase Project: $SUPABASE_PROJECT_ID"
echo "🔑 NOTE: If asked, please enter your DATABASE PASSWORD."
# This connects the CLI to the remote project. 
# It will pause and ask for the password if not found in env vars.
supabase link --project-ref "$SUPABASE_PROJECT_ID"

echo "---------------------------------------------------------"
echo "📂 Pushing Database Schema Changes..."
# This compares local SQL migrations with the remote DB and applies differences.
supabase db push

echo "---------------------------------------------------------"
echo "⚙️  Pushing Project Configuration..."
# Pushes Auth, Storage, and other project settings from config.toml
supabase config push

echo "---------------------------------------------------------"
echo "⚡ Deploying Edge Functions..."
# Deploys API logic (contacts, deals, etc).
# verify_jwt is configured in supabase/config.toml
supabase functions deploy


# ------------------------------------------------------------------------------
# 6. COMPLETION
# ------------------------------------------------------------------------------

echo "---------------------------------------------------------"
echo "✅ SUCCESS: Backend updated successfully!"
echo "   You can now run the application with:"
echo "   npx realtimex-crm@latest"
echo "---------------------------------------------------------"