# Edge Functions for RealTimeX CRM

This directory contains Edge Functions that can be deployed directly from Supabase Dashboard.

## Required Functions (Deploy via Dashboard)

These are critical for team management and can be easily deployed through the GUI:

### 1. users.ts ⭐ **REQUIRED**
**Purpose:** Create and update CRM team members
**Required for:** Inviting new users, updating user profiles, managing permissions
**Deploy:** Copy entire `users.ts` file → Supabase Dashboard → Edge Functions → New Function → Name: `users` → Paste → Deploy

### 2. updatePassword.ts ⭐ **REQUIRED**
**Purpose:** Reset user passwords
**Required for:** Password reset functionality
**Deploy:** Copy entire `updatePassword.ts` file → Supabase Dashboard → Edge Functions → New Function → Name: `updatePassword` → Paste → Deploy

## Optional Functions (Deploy via CLI)

These functions have complex dependencies and are easier to deploy using Supabase CLI:

### 3. mergeContacts
**Purpose:** Merge duplicate contact records
**Required for:** Contact deduplication feature
**Deploy via CLI:**
```bash
cd /path/to/realtimex-crm
npx supabase functions deploy mergeContacts
```

### 4. postmark
**Purpose:** Inbound email integration (capture emails as notes)
**Required for:** Email forwarding feature (optional)
**Deploy via CLI:**
```bash
npx supabase functions deploy postmark
```

**Additional Setup for postmark:**
- Requires Postmark account and API key
- Configure webhook URL in Postmark dashboard
- Set environment variable `POSTMARK_API_KEY` in Supabase

## Deployment Instructions

### Method 1: Supabase Dashboard (Recommended for users, updatePassword)

1. **Go to Supabase Dashboard**
   - Open your project
   - Click "Edge Functions" in the left sidebar

2. **Create New Function**
   - Click "Deploy a new function"
   - Or click "+ New Edge Function"

3. **Configure Function**
   - **Function name:** Enter exactly as shown (e.g., `users`)
   - **Code:** Copy entire content from `.ts` file
   - Paste into the code editor

4. **Deploy**
   - Click "Deploy" button
   - Wait for deployment to complete (usually 10-20 seconds)
   - Status should show "Active"

5. **Verify**
   - Function should appear in the list
   - Status: Active (green)
   - Click function name to view logs

### Method 2: Supabase CLI (Required for mergeContacts, postmark)

If you have the repository cloned:

```bash
# Deploy all functions at once
npx supabase functions deploy

# Or deploy specific function
npx supabase functions deploy mergeContacts
npx supabase functions deploy postmark
```

## Verification

After deploying, verify functions are active:

1. Go to Supabase Dashboard → Edge Functions
2. You should see:
   - ✅ users (Active)
   - ✅ updatePassword (Active)
   - ✅ mergeContacts (Active) - if deployed
   - ✅ postmark (Active) - if deployed

## What if Functions Fail?

### Common Issues:

**1. "Function not found" errors in CRM**
- Solution: Ensure function name matches exactly (case-sensitive)
- users, updatePassword, mergeContacts, postmark (not Users or update_password)

**2. "Unauthorized" errors**
- Solution: Functions automatically use `SUPABASE_SERVICE_ROLE_KEY`
- This is set automatically by Supabase - no action needed

**3. Deploy button grayed out**
- Solution: Ensure you're the project Owner
- Only project Owners can deploy Edge Functions

**4. Function shows "Inactive"**
- Solution: Click on the function → Click "Deploy" again
- Check logs for errors

## Testing Edge Functions

### Test users function:
From your CRM app, try to:
1. Go to Settings → Team
2. Click "Invite User"
3. Fill in details and submit
4. If successful, function is working!

### Test updatePassword function:
1. Go to user profile
2. Click "Reset Password"
3. Check if you receive password reset email

## CRM Features Without Edge Functions

If you skip Edge Function deployment:

**✅ Works:**
- Login/Signup (first user)
- Contacts, Companies, Deals
- Tasks & Notes
- Dashboard & Reports
- Tags & Filters

**❌ Doesn't Work:**
- Inviting additional team members
- User password reset
- Contact merging
- Email capture

## Support

- [View full documentation](https://github.com/therealtimex/realtimex-crm/blob/main/SETUP_GUIDE.md)
- [Report issues](https://github.com/therealtimex/realtimex-crm/issues)
- [Supabase Edge Functions docs](https://supabase.com/docs/guides/functions)
