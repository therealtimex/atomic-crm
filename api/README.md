# RealTimeX CRM Server

This Express server serves both the production build static files AND the migration API endpoint on the same port. It's designed to support the in-browser automatic migration feature while providing a unified server for the entire application.

## Security Considerations

### ⚠️ CRITICAL: Production Deployment

This API server should **ONLY** be used in trusted, controlled environments:

- ✅ **Local development** (localhost)
- ✅ **Private networks** (internal tools)
- ❌ **NOT for public internet deployment**

### Why This Should Not Be Public

1. **Credential Exposure Risk**: The API accepts database passwords and access tokens
2. **Administrative Access**: Can execute arbitrary migrations on your database
3. **Resource Intensive**: Migration operations can be resource-heavy
4. **No Rate Limiting**: Not designed for high-traffic scenarios

### Security Best Practices

If you must deploy this in production:

1. **Use HTTPS Only**: Never send credentials over plain HTTP
   ```nginx
   # Example Nginx config
   location /api/migrate {
       proxy_pass http://localhost:3001;
       # Force HTTPS
       if ($scheme != "https") {
           return 301 https://$host$request_uri;
       }
   }
   ```

2. **Add Authentication**: Implement authentication before the migration endpoint
   ```javascript
   // Example: Add API key middleware
   app.use('/api/migrate', (req, res, next) => {
       const apiKey = req.headers['x-api-key'];
       if (apiKey !== process.env.MIGRATION_API_KEY) {
           return res.status(401).json({ error: 'Unauthorized' });
       }
       next();
   });
   ```

3. **IP Whitelisting**: Restrict access to known IP addresses
   ```javascript
   const allowedIPs = ['127.0.0.1', '::1', '10.0.0.0/8'];
   ```

4. **Rate Limiting**: Add rate limiting to prevent abuse
   ```javascript
   import rateLimit from 'express-rate-limit';

   const limiter = rateLimit({
       windowMs: 15 * 60 * 1000, // 15 minutes
       max: 5 // limit each IP to 5 requests per windowMs
   });

   app.use('/api/migrate', limiter);
   ```

5. **Request Logging**: Log all migration attempts
   ```javascript
   app.use('/api/migrate', (req, res, next) => {
       console.log(`[${new Date().toISOString()}] Migration request from ${req.ip}`);
       next();
   });
   ```

## Usage

### Development Mode (Recommended)

When running `npm run dev`, the Vite dev server includes a built-in migration endpoint at `/api/migrate`. This is the recommended approach for development.

```bash
npm run dev
# Frontend and migration endpoint available at http://localhost:5173
# Migration API: http://localhost:5173/api/migrate
```

### Production Mode

The Express server serves both static files (production build) and the migration API on the same port:

```bash
# Build the application
npm run build

# Serve with migration API
npm run serve
# Default: http://localhost:3002 (avoids conflict with RealTimeX desktop app on 3001)
```

### Custom Port Configuration

Use the `PORT` environment variable to run on a specific port (useful for RealTimeX desktop app integration):

```bash
# Run on port 5000
PORT=5000 npm run serve

# Frontend: http://localhost:5000
# Migration API: http://localhost:5000/api/migrate
# Health check: http://localhost:5000/api/health
```

**Note:** The server uses `PORT` environment variable (same as many frameworks), making it easy to integrate with RealTimeX desktop app or other environments.

## API Endpoint

### POST /api/migrate

Execute database migrations for a Supabase project.

**Request Body:**
```json
{
  "projectRef": "xxxxx",           // Required: Supabase project ID
  "accessToken": "sbp_...",        // Recommended: Supabase access token
  "dbPassword": "password"         // Optional: Database password (if token not provided)
}
```

**Response:**

Server-Sent Events (text/plain) stream with migration logs.

**Example:**
```bash
curl -X POST http://localhost:3002/api/migrate \
  -H "Content-Type: application/json" \
  -d '{
    "projectRef": "abcdefghijklmnop",
    "accessToken": "sbp_xxxxx"
  }'
```

## Environment Variables

- `PORT`: Server port (default: 3002, avoiding conflict with RealTimeX desktop app on 3001)
- `NODE_ENV`: Environment mode (development/production)

## How It Works

1. **Request Validation**: Validates required fields (projectRef)
2. **Credential Setup**: Configures environment with access token or password
3. **Script Execution**: Runs `scripts/migrate.sh` with proper environment
4. **Stream Output**: Streams stdout/stderr back to client in real-time
5. **Error Handling**: Captures and reports errors with helpful troubleshooting tips

## Troubleshooting

### "Migration failed with exit code 1"

Common causes:
- Invalid Supabase credentials
- Supabase CLI not installed: `npm install -g supabase`
- Not logged in: `npx supabase login`
- Network connectivity issues

### "Failed to start migration process"

Common causes:
- Bash shell not available on your system
- Migration script not found or not executable
- Permission issues

Try running manually:
```bash
chmod +x scripts/migrate.sh
bash scripts/migrate.sh
```

### "Connection refused"

Ensure the server is running:
```bash
# For production
npm run serve

# For development
npm run dev
```

## Production Deployment Checklist

- [ ] Enable HTTPS only
- [ ] Add authentication (API keys, JWT, etc.)
- [ ] Implement IP whitelisting
- [ ] Add rate limiting
- [ ] Set up request logging
- [ ] Monitor for suspicious activity
- [ ] Use environment variables for secrets
- [ ] Never expose publicly without security measures

## Alternative: Manual Migration

For maximum security, use the manual migration approach:

```bash
# Option 1: CLI tool
npx realtimex-crm-migrate

# Option 2: Direct script execution
bash scripts/migrate.sh

# Option 3: Supabase CLI
npx supabase db push
```

## Support

- **Issues**: https://github.com/therealtimex/realtimex-crm/issues
- **Documentation**: See project README and AGENTS.md
