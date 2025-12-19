# Email OTP Authentication - Quick Reference

## What Changed?

Atomic CRM now supports **Email OTP (One-Time Password)** authentication instead of magic links. Users receive a 6-digit code via email instead of clicking links.

## Why OTP Instead of Links?

- **No localhost dependency** - Works in CLI/desktop apps where `localhost` redirects may fail
- **Better UX** - Users stay in the app, no browser switching needed
- **Network independent** - Code can be entered manually if needed

## Setup Checklist

### 1. Update Supabase Email Template (Required)

Go to **Supabase Dashboard** → **Authentication** → **Email Templates** → **Magic Link**

Replace the template with:

```html
<h2>Login to Atomic CRM</h2>

<p>Here is your login code:</p>

<h1 style="font-size: 32px; font-weight: bold; text-align: center; letter-spacing: 8px; padding: 20px; background-color: #f0f0f0; border-radius: 8px;">{{ .Token }}</h1>

<p>Enter this code in the application window to continue.</p>

<p style="color: #666; font-size: 12px;">This code will expire in 60 minutes.</p>
```

**Important:** Make sure `{{ .Token }}` is in the template!

### 2. Deploy Code (Already Done)

The following components have been implemented:
- ✅ OTP input component
- ✅ Forgot password with OTP
- ✅ OTP login page
- ✅ Change password page
- ✅ Login page with OTP option

### 3. Test the Flows

**Password Reset:**
1. Click "Forgot Password?" on login page
2. Enter email → Receive 6-digit code
3. Enter code → Redirected to change password
4. Set new password

**OTP Login:**
1. Click "Login with email code (OTP)" on login page
2. Enter email → Receive 6-digit code
3. Enter code → Logged in

**New User Invite:**
1. Admin creates user in CRM
2. New user uses "Login with email code (OTP)"
3. Receives code, logs in
4. Sets password on first login

## User Flows

### Password Reset Flow
```
User clicks "Forgot Password?"
  → Enters email
  → Gets 6-digit code via email
  → Enters code in app
  → Logged in
  → Redirected to change password
  → Sets new password
```

### New User First Login
```
Admin creates user account
  → User opens app
  → Clicks "Login with email code (OTP)"
  → Enters email
  → Gets 6-digit code via email
  → Enters code in app
  → Logged in
  → Redirected to set password
  → Sets password
```

### Regular OTP Login
```
User opens app
  → Clicks "Login with email code (OTP)"
  → Enters email
  → Gets 6-digit code via email
  → Enters code in app
  → Logged in → Dashboard
```

## Routes

| Route | Purpose |
|-------|---------|
| `/otp-login` | OTP-based login |
| `/forgot-password` | Password reset via OTP |
| `/change-password` | Set new password (after OTP verification) |
| `/` | Regular email/password login |

## Email Template Variables

When customizing email templates, you can use:

- `{{ .Token }}` - The 6-digit OTP code
- `{{ .Email }}` - User's email address
- `{{ .SiteURL }}` - Your application URL

## Security Features

✅ **Codes expire after 60 minutes**
✅ **Single-use codes** (can't be reused)
✅ **Rate limiting** (prevents abuse)
✅ **Access control** (users must be in `sales` table)
✅ **First login detection** (prompts password change)

## Troubleshooting

**Code not received?**
- Check spam folder
- Verify SMTP settings in Supabase
- Check Supabase logs

**Invalid code?**
- Code may have expired (60 min)
- Code already used
- Request a new code

**Access denied?**
- User must be created by admin first
- Check user's `disabled` status

## For Admins

When creating new users:
1. Use the CRM's user management interface
2. User will receive account (optional welcome email)
3. Instruct user to:
   - Open app
   - Click "Login with email code (OTP)"
   - Enter their email
   - Check email for 6-digit code
   - Enter code to log in
   - Set password on first login

## Migration Notes

If you have existing users:
- They can continue using email/password login
- OR they can switch to OTP login
- No data migration needed
- Update email template as shown above

## Support

For detailed documentation, see [OTP_AUTHENTICATION_SETUP.md](./OTP_AUTHENTICATION_SETUP.md)

For Supabase OTP documentation: https://supabase.com/docs/guides/auth/auth-email-otp
