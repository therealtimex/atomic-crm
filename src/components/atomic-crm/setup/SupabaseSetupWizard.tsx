import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, Database, CheckCircle, AlertCircle, ExternalLink, Check } from "lucide-react";
import {
  saveSupabaseConfig,
  validateSupabaseConnection,
} from "@/lib/supabase-config";

type WizardStep = "welcome" | "credentials" | "validating" | "success";

interface SupabaseSetupWizardProps {
  open: boolean;
  onComplete: () => void;
  canClose?: boolean;
}

/**
 * Normalizes Supabase URL input - accepts either full URL or just project ID
 */
function normalizeSupabaseUrl(input: string): string {
  const trimmed = input.trim();
  if (!trimmed) return "";

  // If it starts with http:// or https://, treat as full URL
  if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) {
    return trimmed;
  }

  // Otherwise, treat as project ID and construct full URL
  return `https://${trimmed}.supabase.co`;
}

/**
 * Validates if input looks like a valid Supabase URL or project ID
 */
function validateUrlFormat(input: string): { valid: boolean; message?: string } {
  const trimmed = input.trim();
  if (!trimmed) return { valid: false };

  // Check if it's a full URL
  if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) {
    try {
      const url = new URL(trimmed);
      if (url.hostname.endsWith(".supabase.co")) {
        return { valid: true, message: "Valid Supabase URL" };
      }
      return { valid: false, message: "URL must be a Supabase domain" };
    } catch {
      return { valid: false, message: "Invalid URL format" };
    }
  }

  // Check if it's a project ID (alphanumeric, typically 20 chars)
  if (/^[a-z0-9]+$/.test(trimmed)) {
    return { valid: true, message: "Valid project ID (will expand to full URL)" };
  }

  return { valid: false, message: "Enter full URL or project ID" };
}

/**
 * Validates if input looks like a valid Supabase API key
 */
function validateKeyFormat(input: string): { valid: boolean; message?: string } {
  const trimmed = input.trim();
  if (!trimmed) return { valid: false };

  // New publishable keys start with "sb_publishable_" followed by key content
  if (trimmed.startsWith("sb_publishable_")) {
    // Check that there's actual key content after the prefix (at least 20 chars)
    if (trimmed.length > "sb_publishable_".length + 20) {
      return { valid: true, message: "Valid publishable key format" };
    }
    return { valid: false, message: "Publishable key seems incomplete" };
  }

  // Legacy anon keys are JWT tokens starting with "eyJ"
  if (trimmed.startsWith("eyJ")) {
    if (trimmed.length > 100) {
      return { valid: true, message: "Valid anon key format" };
    }
    return { valid: false, message: "Anon key seems incomplete" };
  }

  return { valid: false, message: "Must be a valid Supabase API key (anon or publishable)" };
}

export function SupabaseSetupWizard({
  open,
  onComplete,
  canClose = false,
}: SupabaseSetupWizardProps) {
  const [step, setStep] = useState<WizardStep>("welcome");
  const [url, setUrl] = useState("");
  const [anonKey, setAnonKey] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [urlTouched, setUrlTouched] = useState(false);
  const [keyTouched, setKeyTouched] = useState(false);

  const handleValidateAndSave = async () => {
    setError(null);
    setStep("validating");

    // Normalize the URL before validation
    const normalizedUrl = normalizeSupabaseUrl(url);
    const trimmedKey = anonKey.trim();

    const result = await validateSupabaseConnection(normalizedUrl, trimmedKey);

    if (result.valid) {
      saveSupabaseConfig({ url: normalizedUrl, anonKey: trimmedKey });
      setStep("success");

      // Reload after short delay to apply new config
      setTimeout(() => {
        // Force reload to ensure new config is loaded
        window.location.href = window.location.origin;
      }, 1500);
    } else {
      setError(result.error || "Connection failed");
      setStep("credentials");
    }
  };

  // Get validation states
  const urlValidation = url ? validateUrlFormat(url) : { valid: false };
  const keyValidation = anonKey ? validateKeyFormat(anonKey) : { valid: false };
  const normalizedUrl = url ? normalizeSupabaseUrl(url) : "";
  const showUrlExpansion = url && !url.startsWith("http") && urlValidation.valid;

  const handleClose = () => {
    if (canClose) {
      onComplete();
    }
  };

  return (
    <Dialog open={open} onOpenChange={canClose ? handleClose : undefined} modal={false}>
      <DialogContent
        className="sm:max-w-md"
        onPointerDownOutside={(e) => !canClose && e.preventDefault()}
        onEscapeKeyDown={(e) => !canClose && e.preventDefault()}
      >
        {step === "welcome" && (
          <>
            <DialogHeader>
              <div className="flex items-center gap-2 mb-2">
                <Database className="h-6 w-6 text-primary" />
                <DialogTitle>Welcome to CRM</DialogTitle>
              </div>
              <DialogDescription>
                To get started, you'll need to connect to a Supabase database.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <Alert>
                <AlertDescription>
                  <strong>Don't have a Supabase project?</strong>
                  <br />
                  Create one for free at{" "}
                  <a
                    href="https://supabase.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="underline text-primary inline-flex items-center gap-1"
                  >
                    supabase.com
                    <ExternalLink className="h-3 w-3" />
                  </a>
                </AlertDescription>
              </Alert>

              <div className="space-y-2">
                <h4 className="font-medium text-sm">What you'll need:</h4>
                <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
                  <li>Your Supabase project URL or project ID</li>
                  <li>Your API key (anon or publishable key)</li>
                </ul>
              </div>

              <div className="space-y-2">
                <a
                  href="https://supabase.com/docs/guides/api#api-url-and-keys"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-primary hover:underline inline-flex items-center gap-1"
                >
                  Where do I find these?
                  <ExternalLink className="h-3 w-3" />
                </a>
              </div>

              <Button onClick={() => setStep("credentials")} className="w-full">
                Continue
              </Button>
            </div>
          </>
        )}

        {step === "credentials" && (
          <>
            <DialogHeader>
              <DialogTitle>Connect to Supabase</DialogTitle>
              <DialogDescription>
                Enter your Supabase project credentials
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              {error && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <div className="space-y-2">
                <Label htmlFor="supabase-url">Project URL or ID</Label>
                <div className="relative">
                  <Input
                    id="supabase-url"
                    placeholder="xxxxx or https://xxxxx.supabase.co"
                    value={url}
                    onChange={(e) => {
                      setUrl(e.target.value);
                      setUrlTouched(true);
                    }}
                    onBlur={() => setUrlTouched(true)}
                    className={
                      urlTouched && url
                        ? urlValidation.valid
                          ? "pr-8 border-green-500"
                          : "pr-8 border-destructive"
                        : ""
                    }
                  />
                  {urlTouched && url && urlValidation.valid && (
                    <Check className="absolute right-2 top-1/2 -translate-y-1/2 h-4 w-4 text-green-500" />
                  )}
                </div>
                {showUrlExpansion && (
                  <div className="flex items-start gap-1.5 text-xs text-green-600 dark:text-green-400">
                    <Check className="h-3 w-3 mt-0.5 flex-shrink-0" />
                    <span>Will expand to: {normalizedUrl}</span>
                  </div>
                )}
                {urlTouched && url && urlValidation.message && !urlValidation.valid && (
                  <p className="text-xs text-destructive">{urlValidation.message}</p>
                )}
                {(!urlTouched || !url) && (
                  <p className="text-xs text-muted-foreground">
                    Enter full URL or just the project ID (from Project Settings → API)
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="anon-key">API Key</Label>
                <div className="relative">
                  <Input
                    id="anon-key"
                    type="password"
                    placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                    value={anonKey}
                    onChange={(e) => {
                      setAnonKey(e.target.value);
                      setKeyTouched(true);
                    }}
                    onBlur={() => setKeyTouched(true)}
                    className={
                      keyTouched && anonKey
                        ? keyValidation.valid
                          ? "pr-8 border-green-500"
                          : "pr-8 border-destructive"
                        : ""
                    }
                  />
                  {keyTouched && anonKey && keyValidation.valid && (
                    <Check className="absolute right-2 top-1/2 -translate-y-1/2 h-4 w-4 text-green-500" />
                  )}
                </div>
                {keyTouched && anonKey && keyValidation.message && (
                  <p className={`text-xs ${keyValidation.valid ? "text-green-600 dark:text-green-400" : "text-destructive"}`}>
                    {keyValidation.message}
                  </p>
                )}
                {(!keyTouched || !anonKey) && (
                  <p className="text-xs text-muted-foreground">
                    Anon or publishable key (from Project Settings → API)
                  </p>
                )}
              </div>

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => setStep("welcome")}
                  className="flex-1"
                >
                  Back
                </Button>
                <Button
                  onClick={handleValidateAndSave}
                  disabled={!urlValidation.valid || !keyValidation.valid}
                  className="flex-1"
                >
                  Connect
                </Button>
              </div>
            </div>
          </>
        )}

        {step === "validating" && (
          <>
            <DialogHeader>
              <DialogTitle>Validating Connection</DialogTitle>
              <DialogDescription>
                Testing your Supabase credentials...
              </DialogDescription>
            </DialogHeader>

            <div className="flex flex-col items-center justify-center py-8">
              <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
              <p className="text-sm text-muted-foreground">Please wait...</p>
            </div>
          </>
        )}

        {step === "success" && (
          <>
            <DialogHeader>
              <DialogTitle>Connection Successful!</DialogTitle>
              <DialogDescription>
                Your Supabase database is now connected
              </DialogDescription>
            </DialogHeader>

            <div className="flex flex-col items-center justify-center py-8">
              <CheckCircle className="h-12 w-12 text-green-500 mb-4" />
              <p className="text-sm text-muted-foreground">
                Reloading application...
              </p>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
