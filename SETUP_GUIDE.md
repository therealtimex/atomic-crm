# RealTimeX CRM - Database Setup Guide

This guide walks you through preparing your Supabase database before connecting the CRM application.

## Prerequisites

- A Supabase account (free tier works fine)
- 5-10 minutes for setup

## Step 1: Create Supabase Project

1. Go to [supabase.com](https://supabase.com) and sign in
2. Click "New Project"
3. Fill in:
   - **Project name**: Choose any name (e.g., "my-crm")
   - **Database password**: Create a strong password (save this!)
   - **Region**: Choose closest to your users
4. Click "Create new project"
5. Wait 1-2 minutes for project to initialize

## Step 2: Run Database Setup

### Option A: Automatic Setup (Recommended if you're technical)

If you have Node.js installed and are comfortable with terminal:

```bash
# Clone the repository
git clone https://github.com/therealtimex/realtimex-crm.git
cd realtimex-crm

# Install dependencies
npm install

# Run automatic migration
npm run db:migrate
```

The script will ask for:
- **Project Reference ID**: Found in your Supabase project settings
- **Database Password**: The password you set when creating the project

### Option B: Manual Setup (Recommended for non-technical users)

1. **Download the setup file**
   - Go to: https://raw.githubusercontent.com/therealtimex/realtimex-crm/main/public/setup.sql
   - Right-click → "Save As" → save as `setup.sql`

2. **Open Supabase SQL Editor**
   - In your Supabase project dashboard
   - Click "SQL Editor" in the left sidebar
   - Click "New Query"

3. **Run the setup**
   - Open `setup.sql` in a text editor (Notepad, TextEdit, etc.)
   - Select all (Ctrl+A / Cmd+A)
   - Copy (Ctrl+C / Cmd+C)
   - Paste into the Supabase SQL Editor
   - Click the green "Run" button (bottom right)
   - Wait 5-10 seconds for completion
   - You should see "Success. No rows returned"

## Step 3: Deploy Edge Functions (Optional but Recommended)

Edge Functions are required for team management features.

### Option A: Using Supabase CLI (Included in auto-migrate)

If you ran `npm run db:migrate`, it prompts you to deploy Edge Functions automatically.

### Option B: Manual Deployment

If you only ran the SQL setup, deploy Edge Functions manually:

```bash
# In the cloned repository folder
npx supabase functions deploy
```

**What Edge Functions do:**
- **users** - Create and update team members (**required for multi-user setup**)
- **updatePassword** - Reset user passwords
- **mergeContacts** - Merge duplicate contact records
- **postmark** - Inbound email integration (optional)

⚠️ **Note:** Basic CRM features (contacts, deals, tasks, notes) work without Edge Functions, but you won't be able to invite new team members.

## Step 4: Verify Setup

After running the setup, verify it worked:

1. In Supabase dashboard, go to "Table Editor"
2. You should see these tables:
   - `companies`
   - `contacts`
   - `contactNotes`
   - `deals`
   - `dealNotes`
   - `sales`
   - `tags`
   - `tasks`

3. Go to "Edge Functions" (left sidebar)
4. You should see (if deployed):
   - `users`
   - `updatePassword`
   - `mergeContacts`
   - `postmark`

## Step 5: Get Connection Credentials

1. In Supabase dashboard, go to "Settings" → "API"
2. Copy these two values:
   - **Project URL** (looks like `https://xxxxx.supabase.co`)
   - **anon public key** (long string starting with `eyJ...`)

## Step 6: Connect CRM Application

Now you're ready to connect the CRM:

1. Open your RealTimeX CRM application
2. On the setup screen, enter:
   - Supabase URL (from Step 5)
   - Supabase Anon Key (from Step 5)
3. Click "Connect"
4. You should see the login/signup page

## What Gets Created

The setup script creates:

### Tables
- **companies** - Organization records
- **contacts** - Individual contacts with email/phone in JSONB format
- **deals** - Sales pipeline with stages
- **contactNotes** - Notes attached to contacts
- **dealNotes** - Notes attached to deals
- **tasks** - Task management
- **sales** - CRM users (auto-synced with Supabase auth)
- **tags** - Tagging system

### Views
- **contacts_summary** - Contact data with aggregated task counts
- **companies_summary** - Company data with aggregations
- **init_state** - Tracks if CRM has been initialized

### Functions & Triggers
- **handle_new_user()** - Auto-creates sales record when user signs up
- **handle_update_user()** - Syncs user metadata updates
- Edge functions for user management and contact merging

### Row Level Security (RLS)
- All tables have RLS enabled
- Currently uses permissive policies (all authenticated users can access all data)
- You can customize policies in the future for data isolation

## Troubleshooting

### "Success. No rows returned" - Is this correct?
✅ Yes! This means the setup completed successfully. The message indicates all SQL statements executed without errors.

### Some statements failed during setup
- Most common cause: Running setup twice (tables already exist)
- Solution: Either ignore if most succeeded, or reset your database:
  1. Go to Settings → Database
  2. Click "Reset project" (⚠️ This deletes all data!)
  3. Re-run the setup

### Tables not appearing
- Refresh your browser
- Check you're looking at the "public" schema (not "auth" or other schemas)
- Verify the SQL ran without errors

### Can't connect after setup
- Double-check you copied the **anon public** key (not service_role key)
- Verify the URL ends with `.supabase.co`
- Check there are no extra spaces in the credentials

### Need to start over?
In Supabase dashboard:
1. Settings → Database → Database settings
2. Scroll to "Danger Zone"
3. Click "Reset project"
4. Confirm and wait for reset
5. Start from Step 2 again

## Support

- [View full documentation](https://github.com/therealtimex/realtimex-crm#readme)
- [Report an issue](https://github.com/therealtimex/realtimex-crm/issues)
- [Supabase documentation](https://supabase.com/docs)

## Security Notes

- Never share your **service_role** key (use **anon public** key instead)
- The anon key is safe to use in frontend applications
- Keep your database password secure
- Row Level Security (RLS) is enabled on all tables
- Consider implementing restrictive RLS policies for production use
