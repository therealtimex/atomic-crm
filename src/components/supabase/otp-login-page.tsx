import { useState } from "react";
import { Form, required, useNotify, useTranslate } from "ra-core";
import { Layout } from "@/components/supabase/layout";
import type { FieldValues, SubmitHandler } from "react-hook-form";
import { TextInput } from "@/components/admin/text-input";
import { Button } from "@/components/ui/button";
import { OtpInput } from "@/components/supabase/otp-input";
import { supabase } from "@/components/atomic-crm/providers/supabase/supabase";

interface EmailFormData {
  email: string;
}

type Step = 'email' | 'otp';

export const OtpLoginPage = () => {
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<Step>('email');
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [otpError, setOtpError] = useState(false);

  const notify = useNotify();
  const translate = useTranslate();

  const submitEmail = async (values: EmailFormData) => {
    try {
      setLoading(true);
      // Normalize email to lowercase
      const normalizedEmail = values.email.trim().toLowerCase();
      setEmail(normalizedEmail);

      const { error } = await supabase.auth.signInWithOtp({
        email: normalizedEmail,
        options: {
          shouldCreateUser: false, // Only allow existing users
        },
      });

      if (error) {
        throw error;
      }

      notify(translate("crm.auth.code_sent"), { type: 'success' });
      setStep('otp');
    } catch (error: any) {
      notify(
        typeof error === "string"
          ? error
          : typeof error === "undefined" || !error.message
            ? "ra.auth.sign_in_error"
            : error.message,
        {
          type: "warning",
          messageArgs: {
            _:
              typeof error === "string"
                ? error
                : error && error.message
                  ? error.message
                  : undefined,
          },
        },
      );
    } finally {
      setLoading(false);
    }
  };

  const verifyOtp = async (otpCode: string) => {
    try {
      setLoading(true);
      setOtpError(false);

      // Trim whitespace from OTP code
      const cleanOtp = otpCode.trim();

      const { data, error } = await supabase.auth.verifyOtp({
        email: email.trim().toLowerCase(), // Normalize email
        token: cleanOtp,
        type: 'magiclink', // Changed from 'email' - some Supabase versions treat OTP as magiclink
      });

      if (error) {
        throw error;
      }

      if (!data.session) {
        throw new Error('Failed to create session');
      }

      // Check if user exists in sales table (access control)
      const { data: saleData, error: saleError } = await supabase
        .from('sales')
        .select('id, email_confirmed_at')
        .eq('user_id', data.user.id)
        .single();

      if (saleError || !saleData) {
        // User authenticated but not in sales table - deny access
        await supabase.auth.signOut();
        throw new Error(translate("crm.auth.no_access"));
      }

      // User is logged in and authorized
      notify(translate("crm.auth.login_successful"), { type: 'success' });

      // Check if this is their first login (email not confirmed yet)
      if (!saleData.email_confirmed_at) {
        // Navigate to change password
        window.location.href = '#/change-password';
        window.location.reload();
      } else {
        // Navigate to dashboard
        window.location.href = '#/';
        window.location.reload();
      }
    } catch (error: any) {
      setOtpError(true);
      notify(
        typeof error === "string"
          ? error
          : typeof error === "undefined" || !error.message
            ? translate("crm.auth.invalid_code")
            : error.message,
        {
          type: "warning",
          messageArgs: {
            _:
              typeof error === "string"
                ? error
                : error && error.message
                  ? error.message
                  : undefined,
          },
        },
      );
    } finally {
      setLoading(false);
    }
  };

  const handleOtpComplete = (otpCode: string) => {
    verifyOtp(otpCode);
  };

  const handleResendCode = async () => {
    setOtp('');
    setOtpError(false);
    await submitEmail({ email });
  };

  return (
    <Layout>
      {step === 'email' ? (
        <>
          <div className="flex flex-col space-y-2 text-center">
            <h1 className="text-2xl font-semibold tracking-tight">
              {translate("crm.auth.login_with_code")}
            </h1>
            <p className="text-sm text-muted-foreground">
              {translate("crm.auth.enter_email_for_code")}
            </p>
          </div>
          <Form<EmailFormData>
            className="space-y-8"
            onSubmit={submitEmail as SubmitHandler<FieldValues>}
          >
            <TextInput
              source="email"
              label={translate("ra.auth.email")}
              autoComplete="email"
              validate={required()}
            />
            <Button type="submit" className="cursor-pointer w-full" disabled={loading}>
              {translate("crm.auth.send_code")}
            </Button>
          </Form>
        </>
      ) : (
        <>
          <div className="flex flex-col space-y-2 text-center">
            <h1 className="text-2xl font-semibold tracking-tight">
              {translate("crm.auth.enter_verification_code")}
            </h1>
            <p className="text-sm text-muted-foreground">
              {translate("crm.auth.code_sent_to", { email })}
            </p>
          </div>
          <div className="space-y-6">
            <div className="space-y-4">
              <OtpInput
                length={6}
                value={otp}
                onChange={setOtp}
                onComplete={handleOtpComplete}
                disabled={loading}
                error={otpError}
              />
              {otpError && (
                <p className="text-sm text-destructive text-center">
                  {translate("crm.auth.invalid_code")}
                </p>
              )}
            </div>
            <div className="flex flex-col gap-2">
              <Button
                type="button"
                className="cursor-pointer w-full"
                disabled={loading || otp.length !== 6}
                onClick={() => verifyOtp(otp)}
              >
                {loading ? translate("crm.auth.verifying") : translate("crm.auth.verify_code")}
              </Button>
              <Button
                type="button"
                variant="outline"
                className="cursor-pointer w-full"
                disabled={loading}
                onClick={handleResendCode}
              >
                {translate("crm.auth.resend_code")}
              </Button>
            </div>
          </div>
        </>
      )}
    </Layout>
  );
};

OtpLoginPage.path = "otp-login";