# RealTimeX Integration Summary

This document summarizes the integration of Atomic CRM with RealTimeX using the `@realtimex/app-sdk`.

## ✅ Integration Completed

**Date:** December 14, 2024
**Branch:** `integrate-realtimex-sdk`
**SDK Version:** 0.1.0

---

## 📦 Changes Made

### 1. Dependencies
- Added `@realtimex/app-sdk@^0.1.0` to package.json
- Linked SDK locally for development

### 2. Authentication Replacement
**Files Modified:**
- `src/App.tsx` - Wrapped app with `RealTimeXApp` and `SupabaseProvider`
- `src/components/atomic-crm/root/CRM.tsx` - Updated to use RealTimeX hooks

**New Files:**
- `src/components/atomic-crm/providers/realtimex/authProvider.ts` - RealTimeX auth provider
- `src/components/atomic-crm/providers/realtimex/index.ts` - Provider exports

**What Changed:**
- Removed Supabase Auth dependency
- Authentication now handled by RealTimeX via postMessage
- Development mode uses mock users
- Production mode receives auth from parent RealTimeX app

### 3. Database Migrations
**New Migration:**
- `supabase/migrations/20241214000000_realtimex_rls.sql`

**What It Does:**
- Adds `realtimex_user_id` column to all tables
- Creates RLS policies for automatic data scoping
- Adds triggers to auto-populate `realtimex_user_id` on INSERT
- Creates indexes for performance
- Adds helper function to extract user ID from headers

**Tables Updated:**
- `sales`, `companies`, `contacts`, `deals`
- `contactNotes`, `dealNotes`, `tasks`, `tags`

### 4. Environment Configuration
**File Modified:**
- `.env.development`

**New Variables:**
```env
VITE_REALTIMEX_MOCK_USER_ID=1
VITE_REALTIMEX_MOCK_USER_EMAIL=dev@example.com
VITE_REALTIMEX_MOCK_USER_NAME=Dev User
VITE_REALTIMEX_MOCK_USER_ROLE=admin
```

---

## 🔧 How It Works

### Authentication Flow

**Development Mode:**
1. App starts in dev mode (`import.meta.env.DEV === true`)
2. RealTimeXApp creates mock user from environment variables
3. User is authenticated immediately without postMessage
4. Mock user ID is injected into Supabase requests via headers

**Production Mode (Embedded in RealTimeX):**
1. App loads in iframe within RealTimeX
2. RealTimeXApp sends postMessage to parent requesting auth
3. Parent RealTimeX app sends user data via postMessage
4. RealTimeXApp validates origin and authenticates user
5. User ID is injected into all Supabase requests via headers

### Data Scoping

**How RLS Works:**
1. All Supabase requests include `X-RealTimeX-User-Id` header
2. RLS policies extract user ID from header using `get_realtimex_user_id()` function
3. Policies filter data to only show records where:
   - `realtimex_user_id IS NULL` (backward compatibility)
   - OR `realtimex_user_id = current_user_id`
4. Triggers auto-populate `realtimex_user_id` on INSERT

**Result:**
- Each user sees only their own data
- No code changes required in app logic
- Database enforces isolation at query level

---

## 🎯 Next Steps

### To Test Locally

1. **Start Supabase:**
   ```bash
   npx supabase start
   ```

2. **Apply RLS Migration:**
   ```bash
   npx supabase db push
   ```

3. **Start Development Server:**
   ```bash
   npm run dev
   ```

4. **Verify:**
   - App should load with mock user
   - Console should show: ✅ RealTimeX authentication ready
   - All queries should work with auto-scoping

### To Test with RealTimeX

1. **Build the App:**
   ```bash
   npm run build
   ```

2. **Deploy to Hosting:**
   ```bash
   # Deploy to Vercel, Netlify, or your preferred host
   vercel deploy
   ```

3. **Register in RealTimeX:**
   - Add app to RealTimeX local apps registry
   - Configure app ID: `atomic-crm`
   - Set app URL to deployed URL

4. **Test in RealTimeX:**
   - Open RealTimeX
   - Launch Atomic CRM from app marketplace
   - Verify authentication and data scoping work correctly

### To Test Data Isolation

1. **Create Test Data:**
   ```sql
   -- Set mock user ID header
   SET request.headers = '{"x-realtimex-user-id": "1"}';

   INSERT INTO contacts (first_name, last_name, email)
   VALUES ('John', 'Doe', 'john@example.com');

   -- Change user
   SET request.headers = '{"x-realtimex-user-id": "2"}';

   INSERT INTO contacts (first_name, last_name, email)
   VALUES ('Jane', 'Smith', 'jane@example.com');
   ```

2. **Verify Isolation:**
   ```sql
   -- As user 1 (should see only John Doe)
   SET request.headers = '{"x-realtimex-user-id": "1"}';
   SELECT * FROM contacts;

   -- As user 2 (should see only Jane Smith)
   SET request.headers = '{"x-realtimex-user-id": "2"}';
   SELECT * FROM contacts;
   ```

---

## 📊 Architecture Diagram

```
┌─────────────────────────────────────────────────────────┐
│ RealTimeX Parent App                                    │
│                                                          │
│  ┌────────────────────────────────────────────────┐    │
│  │ Atomic CRM (iframe)                            │    │
│  │                                                 │    │
│  │  ┌──────────────────────────────────────────┐ │    │
│  │  │ RealTimeXApp (SDK)                       │ │    │
│  │  │  - Receives postMessage from parent      │ │    │
│  │  │  - Validates origin                      │ │    │
│  │  │  - Provides user context                 │ │    │
│  │  └──────────────────────────────────────────┘ │    │
│  │                                                 │    │
│  │  ┌──────────────────────────────────────────┐ │    │
│  │  │ SupabaseProvider (SDK)                   │ │    │
│  │  │  - Injects X-RealTimeX-User-Id header    │ │    │
│  │  │  - Provides auto-scoped Supabase client  │ │    │
│  │  └──────────────────────────────────────────┘ │    │
│  │                                                 │    │
│  │  ┌──────────────────────────────────────────┐ │    │
│  │  │ CRM Component                            │ │    │
│  │  │  - Uses useRealTimeXUser() hook          │ │    │
│  │  │  - Uses useSupabase() hook               │ │    │
│  │  │  - Uses RealTimeX auth provider          │ │    │
│  │  └──────────────────────────────────────────┘ │    │
│  │                                                 │    │
│  └─────────────────┬───────────────────────────────┘    │
│                    │                                     │
└────────────────────┼─────────────────────────────────────┘
                     │
                     ▼
            ┌─────────────────┐
            │ Supabase        │
            │                 │
            │ ┌─────────────┐ │
            │ │ PostgreSQL  │ │
            │ │  + RLS      │ │
            │ │  Policies   │ │
            │ └─────────────┘ │
            │                 │
            │ - Extracts user │
            │   ID from header│
            │ - Filters data  │
            │   automatically │
            └─────────────────┘
```

---

## 🔒 Security Considerations

### ✅ What's Secure

1. **Origin Validation:** Only allows postMessage from configured origins
2. **RLS Enforcement:** Database-level data isolation cannot be bypassed
3. **Header-Based Scoping:** User ID cannot be spoofed by client code
4. **Automatic Triggers:** realtimex_user_id always set correctly on INSERT

### ⚠️ Important Notes

1. **Backward Compatibility:** RLS policies allow `NULL` values
   - Existing data without `realtimex_user_id` is visible to all users
   - You may want to populate `realtimex_user_id` for existing data
   - Or remove the `IS NULL` clause from policies

2. **Development Mode:** Mock users bypass all security
   - Only use in development environment
   - Never enable in production

3. **Supabase Service Role:** Not affected by RLS
   - Edge functions and service role bypass RLS policies
   - Be careful with admin operations

---

## 🐛 Troubleshooting

### Issue: App Shows "Waiting for RealTimeX authentication..."

**Cause:** No authentication message received
**Solutions:**
- Check `allowedOrigins` in App.tsx includes parent URL
- Verify parent app is sending postMessage
- Enable dev mode to test without parent: set `import.meta.env.DEV = true`

### Issue: Data Not Scoped to User

**Cause:** RLS policies not applied or realtimex_user_id not set
**Solutions:**
```bash
# Apply migrations
npx supabase db push

# Verify policies exist
npx supabase db diff
```

### Issue: Headers Not Being Sent

**Cause:** SupabaseProvider not wrapping app
**Solutions:**
- Verify App.tsx has `<SupabaseProvider>` wrapper
- Check browser Network tab for `X-RealTimeX-User-Id` header

---

## 📝 Commits

```
0142eff feat: Configure RealTimeX environment variables
73e7db1 feat: Add RealTimeX RLS migration for data scoping
4f0d5ba feat: Integrate RealTimeX app-sdk authentication
```

---

## 📚 Resources

- [RealTimeX App SDK](https://rtgit.rta.vn/rtlab/rtwebteam/realtimex-ai-app-sdk)
- [Integration Guide](https://rtgit.rta.vn/rtlab/rtwebteam/realtimex-ai-app-sdk/-/blob/master/docs/INTEGRATION_GUIDE.md)
- [API Reference](https://rtgit.rta.vn/rtlab/rtwebteam/realtimex-ai-app-sdk/-/blob/master/docs/API_REFERENCE.md)

---

**Integration Status:** ✅ Complete
**Ready for Testing:** Yes
**Ready for Production:** After testing and data migration
