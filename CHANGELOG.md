# Changelog

All notable changes to Atomic CRM will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [0.44.1] - 2026-01-04

## [0.44.0] - 2026-01-04

## [0.43.3] - 2026-01-04

## [0.43.2] - 2026-01-04

## [0.43.1] - 2026-01-04

## [0.43.0] - 2026-01-04

## [0.42.1] - 2026-01-04

## [0.42.0] - 2026-01-04

### Changed

- **Branding**: Updated the default light/dark logos to the new 24px bracket-and-stack mark.

## [0.41.0] - 2026-01-03

### Added

- **Tasks**: Added persisted Kanban ordering with drag-and-drop across columns, plus an "Other" column for unknown statuses.
- **Tasks**: Added infinite scroll for the Tasks Kanban view and removed pagination controls for that view.

### Changed

- **Tasks Kanban**: Made column headers sticky, added collapsible columns with per-user persistence, and removed the bottom loading bar to free up vertical space.
- **Layout**: Adjusted global side padding (responsive) and removed the max-width container for more horizontal real estate.
- **Tasks**: Persisted Tasks view toggle (Table/Kanban) per user and improved toggle alignment/visual contrast.
- **Tasks Table**: Added a stacked sticky header for title/actions, filters, and column labels.
- **Branding**: Updated the default light/dark logos to the new 24px bracket-and-stack mark.

## [0.40.7] - 2026-01-01

### Changed

- **Database**: Changed task `due_date` and `done_date` columns from `timestamp with time zone` to `date` type.
  - **ROOT CAUSE FIX**: Prevents timezone conversion issues for date-only values
  - User selects "Dec 31, 2025" → saves as "2025-12-31" (not "2026-01-01T08:00:00Z")
  - No time or timezone components stored, just the calendar date
  - Migration automatically drops and recreates dependent views (tasks_summary, contacts_summary, companies_summary)
  - Migration extracts date part from existing timestamps (safe conversion)
  - **BREAKING**: If you have custom code relying on time/timezone in these fields, it will need updating
- **Tasks**: Updated completed tasks filter logic to work with date-only values.
  - Changed from "completed in last 5 minutes" to "completed today"
  - Shows tasks completed today in the task list (previously tried to compare date with timestamp)

### Fixed

- **Tasks**: Fixed task edit dialog triggering unwanted navigation to detail page when clicking date picker in task list table.
  - Moved TaskEdit dialog rendering outside of table row context to prevent event bubbling
  - Edit dialog now renders at TaskListTable component level instead of inside TaskActions
  - Clicking on date picker or other form elements no longer triggers row click navigation
  - Issue only affected task list table; sidebar edit was unaffected
- **Tasks**: Fixed timezone bug causing due dates to display 1 day earlier than saved value.
  - Date-only strings (YYYY-MM-DD) now parsed as local dates instead of UTC to prevent timezone shift
  - Example: Setting "Jan 15, 2027" now correctly displays as "Jan 15, 2027" instead of "Jan 14, 2027"
  - Fixed in both task list table and task detail page for consistent date display
  - Affects all date parsing including relative dates, formatted dates, and date calculations
- **Tasks**: Improved due date labels for future tasks - all future dates now show "Due in X days" format.
  - Changed from showing formatted date (e.g., "Jan 15, 2027") for dates beyond 7 days
  - Consistent "Due in X days" format makes it easier to scan and prioritize tasks
  - Completed tasks still show formatted dates

## [0.40.6] - 2025-12-31

### Changed

- **Deals**: Converted deal detail view from dialog to full-page layout with sidebar.
  - Consistent UX pattern matching Contacts and Tasks detail pages
  - More horizontal space for content (no longer constrained by dialog max-width)
  - Sidebar displays metadata, actions, and relationships (company, contacts, assignment)
  - Action buttons (Edit, Archive/Unarchive, Delete) moved to sidebar
  - Improved readability with Card-based layout
  - Natural scrolling without modal overlay
  - Browser back button navigation support
  - Note: Create and Edit remain as dialogs on Kanban board for quick interactions

## [0.40.5] - 2025-12-31

### Fixed

- **Tasks**: Fixed task type icon alignment in task list - icons now vertically center with task titles even when text wraps to multiple lines.
- **UI**: Fixed checkbox vertical alignment in all data tables - checkboxes now properly center within table rows by matching cell padding and using flex container with full height.

## [0.40.4] - 2025-12-31

### Fixed

- **Notes**: Fixed error when adding notes to tasks by only updating `last_seen` column for resources that have it (contacts, companies), not for tasks or deals.
- **Notes**: Unified timestamp system - all notes (UI-created and automated) now use simple server-based UTC timestamps (`new Date().toISOString()`) instead of complex client-side timezone conversions, ensuring single source of truth and avoiding issues with incorrect client machine time.

## [0.40.3] - 2025-12-31

### Fixed

- **Tasks**: Synchronized task note timestamps by relying on server-side generation instead of client-side dates, ensuring consistency between UI and API actions.

## [0.40.2] - 2025-12-31

### Fixed

- **Tasks**: Robust parsing of `due_date` to handle both date-only strings and full ISO 8601 timestamps, preventing "Invalid Date" errors and timezone shifts during snooze/postpone actions.

## [0.40.0] - 2025-12-31

### Added

- **Tasks**: Automatic audit trail for quick actions with taskNotes integration.
  - Mark complete action creates note: "Task marked as complete via quick action"
  - Edit action creates note: "Task updated via quick edit action"
  - Snooze action creates note: "Due date postponed to [date]" with formatted date
  - All notes include acting user (sales_id) and ISO 8601 timestamp
  - Notes created automatically after successful task updates
  - Non-blocking implementation with silent error handling
  - Provides complete change history for task accountability

## [0.39.0] - 2025-12-31

### Added

- **Tasks**: Smart snooze/postpone button with context-aware behavior.
  - Single action button with adaptive label based on task due date
  - Shows "Snooze to Tomorrow" for overdue or today's tasks (sets due date to tomorrow)
  - Shows "Postpone by 1 Day" for future tasks (adds 1 day to current due date)
  - Intelligent logic prevents confusing UX (e.g., "snoozing" a task already due next week)
  - Available in both task list table and detail page sidebar
  - Audit trail notes reflect actual action taken ("snoozed" vs "postponed")
  - Tooltip labels update dynamically based on task due date context

## [0.38.0] - 2025-12-31

### Added

- **Tasks**: Active filter bar with removable chips for clear filter visibility.
  - Displays all active filters as badge chips above the task list
  - User-friendly labels (e.g., "My Tasks", "Contact: John Doe", "Status: Done")
  - One-click removal via X button on each chip
  - Automatically fetches and displays names for Contact, Company, and Deal filters
  - Hides when no filters are active (no visual clutter)
  - Excludes default filters (e.g., archived: false) from display
  - Supports all filter types: search, select, reference, boolean, custom
  - Updates list immediately when filters are removed

## [0.37.0] - 2025-12-31

### Added

- **Tasks**: Visual task type icons for improved scannability.
  - Each task type displays a distinctive icon (Email ✉️, Call 📞, Meeting 👥, Demo 📊, etc.)
  - Icons appear in 24px circular badges with muted background
  - Tooltips show task type name on hover for accessibility
  - Gracefully handles "None" and unknown task types (no icon shown or generic fallback)
  - Replaces bold "Type:" text prefix with clean icon representation
  - Supports all default task types: Email, Call, Meeting, Demo, Lunch, Follow-up, Thank you, Ship
  - Extensible icon mapping for custom task types

## [0.36.0] - 2025-12-31

### Added

- **Tasks**: Quick actions on row hover for efficient task management.
  - Mark complete button (✓) - Sets task status to "done" immediately
  - Edit button (✎) - Opens task edit dialog without navigating to detail page
  - Snooze button (⏰) - Postpones due date to tomorrow (+1 day)
  - Actions appear with smooth fade-in on row hover
  - Context-aware: Complete and Snooze buttons hidden for completed tasks
  - Each action includes tooltips and success notifications
  - All actions prevent row click propagation for smooth UX

## [0.35.0] - 2025-12-31

### Added

- **Tasks**: Relative due date display with smart time indicators (e.g., "Overdue by 2 days", "Due today", "Due in 3 days").
  - Shows relative time as primary text with actual date as secondary detail
  - Overdue tasks highlighted with red text and subtle warning background
  - Completed tasks (done/cancelled) show simple date format without overdue styling
  - Maintains sortability by due_date column
- **Tables**: Zebra striping for improved row tracking in all data tables.
  - Even rows have subtle background color (30% opacity)
  - Enhanced hover state (70% opacity) for better visual feedback
  - Works seamlessly in both light and dark themes

### Changed

- **Tasks**: Optimized column widths to eliminate horizontal scrolling.
  - Task column expanded to 40% (from 35%) for better readability
  - Added smart truncation to "Related To" column with max-width and tooltips
  - Reduced Priority, Status, and Assigned To columns to 9% each
  - Added overflow protection to all cells

### Fixed

- **Tables**: Eliminated horizontal scrolling by adding proper text truncation and optimized column widths.

## [0.34.1] - 2025-12-31

### Added

- **Email Validation**: Smart email validation edge function with adaptive looping and two-tier validation strategy.
  - Tier 1 (Premium): External API support (ZeroBounce, Hunter.io) for full SMTP validation
  - Tier 2 (Free): Edge-optimized validation using DNS MX records, disposable domain detection, and typo checking
  - Batch processing with automatic retry and session management
  - Self-triggering loops to validate all contacts without manual intervention
  - Configurable batch size (default: 20 emails) to prevent timeouts
  - Priority-based validation (recent contacts first)
  - Contact notes automatically created when validation status changes
  - Works with `email_jsonb` schema (validates primary email from array)
  - Port 25 aware: No SMTP checks in Edge Functions (blocked by Deno Deploy), uses DNS MX records instead

## [0.34.0] - 2025-12-31

### Added

- **Navigation**: Smart back button in header that appears on settings/admin pages and detail views.
  - Shows on /settings, /database, /integrations, /sales pages and routes ending with /show
  - Automatically hides when dialogs/modals are open
  - Responsive design (text on desktop, icon-only on mobile)
  - No-flash implementation using synchronous dialog detection

### Fixed

- **Deals**: Fixed "column deals.type does not exist" error when navigating to Deals page. Changed full-text search to use correct `category` column instead of non-existent `type` column.

### Changed

- **Documentation**: Added pre-commit linting instructions to AGENTS.md with common ESLint rules and best practices.

## [0.33.12] - 2025-12-31

## [0.33.11] - 2025-12-31

- **Fix**: Import `useWatch` and `useFormContext` from `react-hook-form` instead of `ra-core`.

## [0.33.10] - 2025-12-31

-  **Feat**: filter deal contacts by selected company for better UX

## [0.33.9] - 2025-12-31

## [0.33.8] - 2025-12-30

## [0.33.7] - 2025-12-30

## [0.33.6] - 2025-12-30

## [0.33.5] - 2025-12-30

## [0.33.4] - 2025-12-30

### Added

- **Migration**: Added `get_latest_migration_timestamp()` function to query Supabase's internal migration tracking.

### Changed

- **Migration**: Refactored migration detection to use Supabase's built-in tracking instead of custom table.

## [0.33.3] - 2025-12-30

## [0.33.2] - 2025-12-30

### Added

- **Tasks**: Tasks can now be linked to Contacts, Companies, or Deals (all optional).
- **Tasks**: Pill-based entity type selector with one-click selection (None, Contact, Company, Deal).
- **Tasks**: "Related To" column in task list displays the linked entity (Contact, Company, or Deal).
- **Tasks**: Filter tasks by Contact, Company, or Deal in the task list.
- **Database**: Database migration to add `company_id` and `deal_id` columns to tasks table with mutually exclusive constraint.
- **Database**: Updated `tasks_summary` view to include company and deal information with proper joins.

### Changed

- **Tasks**: `contact_id` field is now optional instead of required - tasks can exist without being linked to any entity.
- **Tasks**: Task creation form no longer requires selecting a contact.
- **Tasks**: Improved task form layout - pills inline with "Related To" label, entity autocomplete on separate full-width row for long names.
- **Tasks**: Removed duplicate "Create Task" header for cleaner UI and better space utilization.

## [0.33.1] - 2025-12-30

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
