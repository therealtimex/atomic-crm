# OTP Verification Error: Debugging Guide

## Symptom
You receive the 6-digit OTP code via email, but when entering it, you get:
```
Invalid or expired code. Please try again.
```

## Common Causes & Solutions

### 1. **Token Type Mismatch**

The `type` parameter in `verifyOtp()` must match how Supabase sent the OTP.

**Current code uses:** `type: 'email'`

**Try these alternatives:**

#### Option A: Use 'magiclink' type

Some Supabase configurations treat email OTP as a magic link variant:

```typescript
const { data, error } = await supabase.auth.verifyOtp({
  email: email.trim(),
  token: cleanOtp,
  type: 'magiclink', // Changed from 'email'
});
```

#### Option B: Use 'signup' type

If the user hasn't confirmed their email yet:

```typescript
const { data, error } = await supabase.auth.verifyOtp({
  email: email.trim(),
  token: cleanOtp,
  type: 'signup', // For unconfirmed users
});
```

### 2. **Email Confirmation Required**

Check if Supabase requires email confirmation:

1. Go to **Supabase Dashboard** → **Authentication** → **Settings**
2. Find **"Confirm email"** setting
3. If enabled, users must confirm email before they can use OTP login

**Solutions:**
- Disable email confirmation temporarily for testing
- Or ensure users confirm their email first (via the invite flow)

### 3. **User Doesn't Exist**

OTP verification fails if the user doesn't exist in `auth.users`:

**Check:**
1. Go to **Supabase Dashboard** → **Authentication** → **Users**
2. Search for the email address you're testing with
3. Verify the user exists

**Solution:**
- Create the user first (via admin panel or signup page)
- Or set `shouldCreateUser: true` in the `signInWithOtp()` call

### 4. **Email Case Sensitivity**

Email case might not match between OTP request and verification:

**Example:**
```typescript
// OTP requested with: "User@Example.Com"
// But verified with: "user@example.com"
// These might be treated as different!
```

**Solution:** Always normalize email to lowercase:
```typescript
const normalizedEmail = email.trim().toLowerCase();

// Request OTP
await supabase.auth.signInWithOtp({
  email: normalizedEmail,
  // ...
});

// Verify OTP
await supabase.auth.verifyOtp({
  email: normalizedEmail,
  // ...
});
```

### 5. **OTP Code Format Issues**

**Check for:**
- Leading/trailing whitespace: `" 123456 "` vs `"123456"`
- Letter O vs number 0: `O` vs `0`
- Letter I/l vs number 1: `I`/`l` vs `1`

**Solution:** Already implemented - code trims whitespace:
```typescript
const cleanOtp = otpCode.trim();
```

### 6. **Code Expired**

OTP codes expire after 60 minutes by default.

**Check timing:**
1. Request OTP
2. Wait for email
3. Enter code within 60 minutes

**If testing:**
- Request a fresh code each time
- Don't reuse old codes from previous test emails

### 7. **Rate Limiting**

Too many failed attempts may trigger rate limiting.

**Solution:**
- Wait 5-10 minutes before retrying
- Use a different email address for testing
- Check Supabase logs for rate limit errors

## Debugging Steps

### Step 1: Check Browser Console

I've added logging to the code. Open your browser's DevTools Console and look for:

```
Verifying OTP: { email: "user@example.com", token: "123456", type: "email" }
OTP Verification result: { data: {...}, error: {...} }
```

**Check:**
- Is the email correct?
- Is the token correct (6 digits)?
- What does the error object say?

### Step 2: Check Supabase Auth Logs

1. Go to **Supabase Dashboard** → **Logs** → **Auth**
2. Filter for recent logs
3. Look for `verifyOtp` requests
4. Check error messages

**Common error messages:**
- `"Invalid token"` - Wrong code or expired
- `"User not found"` - Email doesn't match any user
- `"Token expired"` - Code is too old
- `"Too many requests"` - Rate limited

### Step 3: Test with Different Type Values

Try each type value and see which works:

1. Edit `src/components/supabase/otp-login-page.tsx`
2. Change line 85:

```typescript
// Try each of these:
type: 'email',      // Current
type: 'magiclink',  // Alternative 1
type: 'signup',     // Alternative 2
```

3. Save and test each one

### Step 4: Verify Supabase Settings

Check these settings in Supabase Dashboard:

**Authentication → Providers → Email:**
- ✅ Enable Email Signup
- ✅ Enable Email OTP
- ⚠️ Confirm email (can cause issues if enabled)

**Authentication → Settings:**
- Note the "OTP Expiration" value (default 3600 seconds = 60 minutes)
- Note if "Email Confirmation" is required

### Step 5: Test with a New User

Create a fresh test user:

1. Use a different email address
2. As admin, create user in CRM
3. Try OTP login with new email
4. Check if it works

This helps isolate if the issue is user-specific.

## Quick Fix: Try Alternative Verification Method

If the above doesn't work, we can try using the session-based approach:

Edit `src/components/supabase/otp-login-page.tsx`, replace the `verifyOtp` function:

```typescript
const verifyOtp = async (otpCode: string) => {
  try {
    setLoading(true);
    setOtpError(false);

    const cleanOtp = otpCode.trim();
    const cleanEmail = email.trim().toLowerCase();

    console.log('Verifying OTP:', { email: cleanEmail, token: cleanOtp });

    // Try with type 'magiclink' instead of 'email'
    const { data, error } = await supabase.auth.verifyOtp({
      email: cleanEmail,
      token: cleanOtp,
      type: 'magiclink', // <-- Changed this
    });

    console.log('OTP Verification result:', { data, error });

    if (error) {
      throw error;
    }

    if (!data.session) {
      throw new Error('Failed to create session');
    }

    // Rest of the code...
```

## Still Not Working?

If none of the above work, please check:

1. **Supabase version:** Some older Supabase projects have different OTP behavior
2. **Custom SMTP:** If using custom SMTP, ensure it's configured correctly
3. **Browser issues:** Try in incognito mode or different browser
4. **Network issues:** Check if requests are reaching Supabase

### Collect Debug Info

Share this information for further help:

1. Browser console logs (from Step 1)
2. Supabase auth logs (from Step 2)
3. Supabase project settings:
   - Email OTP enabled?
   - Email confirmation required?
   - OTP expiration time?
4. Which `type` value you tried ('email', 'magiclink', 'signup')

## Expected vs Actual Behavior

**Expected:**
1. Request OTP → Receive 6-digit code
2. Enter code → Logged in successfully

**Actual:**
1. Request OTP → Receive 6-digit code ✅
2. Enter code → "Invalid or expired code" ❌

This suggests the code is being sent correctly, but verification parameters are wrong.

## Reference

- [Supabase verifyOtp docs](https://supabase.com/docs/reference/javascript/auth-verifyotp)
- [Supabase Email OTP guide](https://supabase.com/docs/guides/auth/auth-email-otp)
