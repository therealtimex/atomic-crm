# Changelog

All notable changes to Atomic CRM will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [0.33.0] - 2025-12-30

## [0.32.1] - 2025-12-30

## [0.32.0] - 2025-12-30

## [0.31.5] - 2025-12-30

## [0.31.4] - 2025-12-30

### Added

- **Migration UX**: Progressive migration detection system with non-blocking top banner notification when database updates are needed.
- **Migration UX**: Interactive migration modal with step-by-step instructions for running database migrations via CLI.
- **Migration UX**: New `npx realtimex-crm migrate` command that automates the migration process (downloads code, links to Supabase, pushes migrations, deploys functions).
- **Migration UX**: Smart reminder system that dismisses for 24 hours if user defers migration.
- **Database**: New `schema_migrations` table to track database version and applied migrations.
- **Migration Detection**: Automatic schema version comparison on app startup to detect when migrations are needed.
- **Developer Tools**: Version check utility with semantic versioning support for detecting migration requirements.
- **Developer Tools**: Automatic version injection from package.json into app code via Vite (no manual version updates needed).
- **Developer Tools**: New `npm run migration:create` command to create migrations with auto-injected version tracking.

## [0.31.0] - 2025-12-29

### Added

- **Email Validation**: Self-adaptive email validation system with smart looping that validates all contacts regardless of database size.
- **Email Validation**: Priority-based validation that processes active contacts (recently seen) first for maximum value.
- **Email Validation**: Dual-tier validation strategy using free email-validator-js library with optional ZeroBounce API fallback for highest accuracy.
- **Email Validation**: Three-level rate limiting (email-to-email, batch-to-batch, max iterations) to prevent API throttling and SMTP blacklisting.
- **Email Validation**: Automatic ContactNotes creation when validation status changes, providing full audit trail of validation events.
- **Email Validation**: Session-based distributed locking using validation_sessions table to prevent concurrent validation loops.
- **Email Validation**: Self-adaptive scheduling that auto-restarts validation cycles when new contacts are added, minimizing validation lag.
- **LinkedIn Validation**: Edge function for validating LinkedIn profile URLs with heartbeat tracking.
- **Database**: New `validation_sessions` table for tracking validation progress with exclusion constraints to prevent overlapping loops.
- **Database**: Added `btree_gist` extension to support exclusion constraints on validation sessions.
- **Cron Jobs**: Daily automated email validation scheduled via pg_cron with configurable batch sizes and rate limits.
- **Documentation**: Comprehensive guides for email validation system, concurrency control, scheduling modes, and audit trails.

### Changed

- **Email Validation**: Consolidated v1 and v2 validation functions into single canonical implementation without version suffixes.
- **Email Validation**: Configuration moved from query parameters to JSON request body for better flexibility.
- **Contacts Schema**: Added `external_heartbeat_status`, `external_heartbeat_checked_at`, and `external_heartbeat_details` for validation tracking.

### Fixed

- **Email Validation**: Fixed critical distributed lock bug where advisory locks were session-scoped and didn't persist across HTTP requests.
- **Email Validation**: Removed invalid finally block that attempted to release advisory locks in edge functions.
- **Email Validation**: Fixed session tracking to properly complete sessions in all exit paths (success, failure, max iterations).

### Removed

- **Migrations**: Removed obsolete advisory_locks migration that caused SQLSTATE 42725 errors due to function name conflicts.

## [0.29.0] - 2025-12-29

### Added

- **Infrastructure**: Migrated activities table to standard distributed task queue schema with support for atomic task claiming, stale lock recovery, and retry tracking.
- **Database**: Added new RPC functions for distributed task processing: `claim_task_compatible`, `claim_next_task_standard`, `complete_task_standard`, and `fail_task_standard`.
- **Database**: Added fields to activities table: `old_data`, `completed_at`, `error_message`, `attempted_by`, `retry_count`, `result`, and `machine_id` for distributed worker coordination.

### Fixed

- **Deployment**: Fixed ingest-activity edge function deployment configuration to enable file upload functionality.

## [0.28.0] - 2025-12-28

### Changed

- **Attachments**: Made attachment filenames directly clickable to open the document viewer for improved UX.

## [0.27.0] - 2025-12-28

### Added

- **Attachments**: Added support for viewing .eml (email) files with full email preview including headers, HTML/plain text body, and embedded attachments.
- **Email Viewer**: Professional email client-like interface with toggle between HTML and plain text views.
- **Email Attachments**: Support for viewing and downloading embedded attachments within email files.

### Fixed

- **CI/CD**: Fixed pre-commit hook to automatically stage registry.json changes, preventing publish workflow failures.

## [0.26.0] - 2025-12-28

### Added

- **Attachments**: Built-in document viewer modal with support for multiple file formats including PDF, DOCX, XLSX, PPTX, Markdown, images, video, and audio files.
- **Security**: Added XSS protection for Excel file previews using DOMPurify sanitization.
- **Performance**: Added 50MB file size limit validation to prevent browser crashes from large files.

### Fixed

- **Attachments**: Fixed Company notes and Task notes to properly upload attachments to Supabase Storage instead of storing temporary blob URLs.
- **Security**: Fixed XSS vulnerability in XLSX HTML rendering that could allow malicious formulas to execute scripts.
- **Performance**: Fixed memory leak in DOCX file rendering where large ArrayBuffers persisted in memory after rendering.
- **Performance**: Fixed race condition when rapidly switching between different attachments.
- **Attachments**: Improved blob URL handling for file previews with proper fallback mechanisms.

## [0.24.0] - 2025-12-26

### Added

- **Activity Log**: Replaced 'Load more' button with proper pagination for better performance and usability.

## [0.23.0] - 2025-12-26

### Added

- **UI**: Extended markdown rendering support to dashboard components and activity logs.

## [0.22.0] - 2025-12-26

### Added

- **Notes**: Added markdown rendering support for notes across the application.

## [0.21.0] - 2025-12-26

### Changed

- **Database**: Standardized timestamp columns across all database tables for consistency.

## [0.20.1] - 2025-12-26

### Fixed

- **Release**: Internal version bump for deployment synchronization.

## [0.20.0] - 2025-12-26

### Added

- **Integrations**: Added task-related scopes to the API key creation dialog.

### Fixed

- **Attachments**: Fixed attachment upload functionality and made attachments clickable in the UI.

## [0.19.0] - 2025-12-26

### Added

- **API**: New dedicated `/api-v1-tasks` endpoint for full CRUD operations on tasks.

## [0.18.0] - 2025-12-26

### Added

- **API**: Added support for `company_note` and `task_note` in the activities API.

## [0.17.1] - 2025-12-26

### Fixed

- **Contact**: Restored missing `email_fts` and `phone_fts` columns in the `contacts_summary` view.

## [0.17.0] - 2025-12-26

### Added

- **Contact**: Enabled avatar editing for contacts.

## [0.16.0] - 2025-12-26

### Changed

- **Contact**: Made the contact `last_name` field optional.

## [0.15.0] - 2025-12-26

### Added

- **Company**: Exposed more company configuration fields and reorganized the qualification status location.

## [0.14.3] - 2025-12-26

### Fixed

- **Code Quality**: Resolved linting errors in `ApiKeysTab.tsx`.

## [0.14.2] - 2025-12-26

### Added

- **Integrations**: Enhanced integration tools with unmasked API key copying and webhook editing.

## [0.14.1] - 2025-12-26

### Fixed

- **Tasks**: Ensured dashboard tasks behave consistently with the tasks table view.

## [0.14.0] - 2025-12-26

### Added

- **Tasks**: Major enhancement of the tasks module including full CRUD, notes, activity log, and a dedicated summary view.

## [0.13.8] - 2025-12-25

### Fixed

- **Database**: Resolved ambiguous column reference in the heartbeat function migration.

### Changed

- **CI/CD**: Improved publish workflow reliability and added a release guide.


## [0.13.7] - 2025-12-25

### Fixed

- **Database**: Resolved "ambiguous column reference" error in company heartbeat computation function.

## [0.13.6] - 2025-12-25

### Fixed

- **Setup**: Fixed validation issue where `sb_publishable_` keys were incorrectly rejected during connection setup.

## [0.13.4] - 2025-12-25

### Added

- **Contact**: Added Contact Heartbeats (Engagement & Validation) to contact sidebar and list filters.

## [0.13.2] - 2025-12-25

### Added

- **Company**: Added Company Health card for company show page.

## [0.9.7] - 2025-12-24

### Fixed

- **Release**: Version bump to retry npm publishing with refreshed token.

## [0.9.5] - 2025-12-24

### Fixed

- **Release**: Version bump to resolve npm publishing mismatch.

## [0.9.3] - 2025-12-24

### Fixed

- **Webhook System**: Fixed "function enqueue_webhook_event does not exist" error by explicitly defining the function in the public schema and updating triggers to use the fully qualified name.

## [0.9.0] - 2025-12-19

### Added

- **API Endpoints**: REST API for programmatic access to CRM data
  - `GET/POST/PATCH/DELETE /v1/contacts/{id}` - Contact management
  - `GET/POST/PATCH/DELETE /v1/companies/{id}` - Company management
  - `GET/POST/PATCH/DELETE /v1/deals/{id}` - Deal management
  - `POST /v1/activities` - Create notes and tasks
- **API Key Management**: UI for creating and managing API keys with scopes
  - Secure API key generation with SHA-256 hashing
  - Scope-based authorization (contacts:read, contacts:write, etc.)
  - API key expiration and usage tracking
- **Webhook System**: Event notifications for external integrations
  - CRUD events: contact.created, company.updated, deal.deleted, etc.
  - Business events: deal.won, deal.lost, task.completed, etc.
  - Webhook management UI with event selection
  - Async webhook delivery with retry logic and exponential backoff
  - HMAC-SHA256 signature verification
- **Integrations Page**: New `/integrations` route with tabs for API Keys and Webhooks
- **Rate Limiting**: 100 requests per minute per API key with standard rate limit headers
- **API Logging**: Request logs with endpoint, method, status code, response time, and errors
- **Documentation**:
  - `docs/API.md` - Complete API reference with examples
  - `docs/DEPLOYMENT.md` - Deployment guide for new database instances

### Technical Details

- **Database Migrations**:
  - `20251219120000_api_integrations.sql` - Tables for API keys, webhooks, logs, and queue
  - `20251219120100_webhook_triggers.sql` - Database triggers for webhook events
  - `20251219120200_webhook_cron.sql` - Cron job for webhook dispatcher
- **Edge Functions**: 5 new Supabase Edge Functions for API endpoints and webhook delivery
- **Frontend Components**: IntegrationsPage, ApiKeysTab, WebhooksTab, CreateApiKeyDialog
- **Shared Utilities**: API key authentication, rate limiting, webhook signatures

## [0.8.0] - 2025-12-19

### Changed

- Improved navigation in authentication pages

## [0.7.14] - 2025-12-XX

### Added

- Navigate directly to change password page from settings

## [0.7.12] - 2025-12-XX

### Fixed

- Use fixed position for header and adjust main content padding
