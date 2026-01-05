import { useState } from "react";
import { Form, required, useNotify, useTranslate } from "ra-core";
import { Layout } from "@/components/supabase/layout";
import type { FieldValues, SubmitHandler } from "react-hook-form";
import { TextInput } from "@/components/admin/text-input";
import { Button } from "@/components/ui/button";
import { supabase } from "@/components/atomic-crm/providers/supabase/supabase";
import { useNavigate, Link } from "react-router";

interface FormData {
  password: string;
  confirm: string;
}

export const ChangePasswordPage = () => {
  const [loading, setLoading] = useState(false);

  const notify = useNotify();
  const translate = useTranslate();
  const navigate = useNavigate();

  const validate = (values: FormData) => {
    const errors: Record<string, string> = {};

    if (!values.password) {
      errors.password = translate("ra.validation.required");
    } else if (values.password.length < 6) {
      errors.password = translate("crm.auth.password_min_length");
    }

    if (!values.confirm) {
      errors.confirm = translate("ra.validation.required");
    } else if (values.password !== values.confirm) {
      errors.confirm = translate("crm.auth.passwords_do_not_match");
    }

    return errors;
  };

  const submit = async (values: FormData) => {
    try {
      setLoading(true);

      const { error } = await supabase.auth.updateUser({
        password: values.password,
      });

      if (error) {
        throw error;
      }

      notify(translate("crm.auth.password_updated"), { type: "success" });
      navigate("/");
    } catch (error: any) {
      notify(
        typeof error === "string"
          ? error
          : typeof error === "undefined" || !error.message
            ? translate("crm.auth.failed_to_update_password")
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

  return (
    <Layout>
      <div className="flex flex-col space-y-2 text-center">
        <h1 className="text-2xl font-semibold tracking-tight">
          {translate("crm.auth.set_new_password")}
        </h1>
        <p className="text-sm text-muted-foreground">
          {translate("crm.auth.choose_password_details")}
        </p>
      </div>
      <Form<FormData>
        className="space-y-6"
        onSubmit={submit as SubmitHandler<FieldValues>}
        validate={validate}
      >
        <TextInput
          source="password"
          type="password"
          label={translate("ra.auth.password")}
          autoComplete="new-password"
          validate={required()}
        />
        <TextInput
          source="confirm"
          type="password"
          label={translate("ra.auth.confirm_password")}
          autoComplete="new-password"
          validate={required()}
        />
        <Button type="submit" className="cursor-pointer w-full" disabled={loading}>
          {loading ? translate("crm.auth.updating_password") : translate("crm.auth.update_password")}
        </Button>
      </Form>
      <div className="text-center">
        <Link
          to="/"
          className="text-sm text-muted-foreground hover:text-primary underline-offset-4 hover:underline"
        >
          {translate("crm.auth.back_to_login")}
        </Link>
      </div>
    </Layout>
  );
};

ChangePasswordPage.path = "change-password";