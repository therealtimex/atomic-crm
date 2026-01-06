import { input, password } from "@inquirer/prompts";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function main() {
  console.log("🚀 RealTimeX CRM - Project Configuration Automation");
  console.log("This script configures your Supabase project settings via the Management API.");
  console.log("It will update: Auth Settings (Email Confirm, OTP) and Email Templates.");
  console.log("");

  // 1. Get Project Ref
  let defaultProjectRef = "";
  try {
    const envFile = await fs.readFile(path.join(process.cwd(), ".env.production.local"), "utf-8");
    const match = envFile.match(/VITE_SUPABASE_URL=https:\/\/([a-z0-9]+)\.supabase\.co/);
    if (match) defaultProjectRef = match[1];
  } catch (e) {
    // ignore
  }

  const projectRef = await input({
    message: "Enter your Supabase Project Reference ID:",
    default: defaultProjectRef,
    validate: (value) => value.length > 0 || "Project ID is required",
  });

  // 2. Get Access Token
  const accessToken = await password({
    message: "Enter your Supabase Personal Access Token (from https://supabase.com/dashboard/account/tokens):",
    validate: (value) => value.length > 0 || "Token is required",
  });

  console.log("\n🔄 Reading templates...");

  let inviteTemplate, recoveryTemplate, magicLinkTemplate, confirmationTemplate, emailChangeTemplate;
  try {
    inviteTemplate = await fs.readFile(path.join(__dirname, "../supabase/templates/invite.html"), "utf-8");
    recoveryTemplate = await fs.readFile(path.join(__dirname, "../supabase/templates/recovery.html"), "utf-8");
    magicLinkTemplate = await fs.readFile(path.join(__dirname, "../supabase/templates/magic-link.html"), "utf-8");
    confirmationTemplate = await fs.readFile(path.join(__dirname, "../supabase/templates/confirmation.html"), "utf-8");
    emailChangeTemplate = await fs.readFile(path.join(__dirname, "../supabase/templates/email-change.html"), "utf-8");
  } catch (e) {
    console.error("❌ Failed to read template files from supabase/templates/");
    console.error(e);
    return;
  }

  console.log("🔄 Updating Auth Configuration...");

  const configBody = {
    // General Auth
    disable_signup: false,
    external_email_enabled: true,

    // Email Auth
    mailer_autoconfirm: true, // "Confirm email" OFF means autoconfirm is ON
    mailer_otp_length: 6,

    // Templates
    mailer_templates_invite_content: inviteTemplate,
    mailer_templates_recovery_content: recoveryTemplate,
    mailer_templates_magic_link_content: magicLinkTemplate,
    mailer_templates_confirmation_content: confirmationTemplate,
    mailer_templates_email_change_content: emailChangeTemplate,

    // Subjects
    mailer_subjects_invite: "You have been invited to RealTimeX CRM",
    mailer_subjects_confirmation: "Confirm your RealTimeX CRM account",
    mailer_subjects_recovery: "Reset your RealTimeX CRM password",
    mailer_subjects_magic_link: "Login to RealTimeX CRM",
    mailer_subjects_email_change: "Confirm your new email for RealTimeX CRM",
  };

  try {
    const response = await fetch(`https://api.supabase.com/v1/projects/${projectRef}/config/auth`, {
      method: "PATCH",
      headers: {
        "Authorization": `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(configBody),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`API Error: ${response.status} - ${JSON.stringify(errorData)}`);
    }

    const data = await response.json();
    console.log("✅ Successfully updated Auth Configuration!");
    console.log("   - Email Confirmations: Disabled (Autoconfirm Enabled)");
    console.log("   - OTP Length: 6");
    console.log("   - Email Templates & Subjects: Updated");

  } catch (e) {
    console.error("❌ Failed to update configuration:");
    console.error(e.message);
  }
}

main();
