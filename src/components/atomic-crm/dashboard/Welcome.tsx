import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const Welcome = () => (
  <Card>
    <CardHeader className="px-4">
      <CardTitle>Your CRM Starter Kit</CardTitle>
    </CardHeader>
    <CardContent className="px-4">
      <p className="text-sm mb-4">
        <a
          href="https://github.com/therealtimex/realtimex-crm"
          className="underline hover:no-underline"
        >
          RealTimeX CRM
        </a>{" "}
        is a full-featured CRM designed to help you manage contacts, deals, and tasks.
      </p>
      <p className="text-sm mb-4">
        This demo runs on a mock API, so you can explore and modify the data. It
        resets on reload. The full version uses Supabase for the backend.
      </p>
      <p className="text-sm">
        Powered by{" "}
        <a
          href="https://marmelab.com/shadcn-admin-kit"
          className="underline hover:no-underline"
        >
          shadcn-admin-kit
        </a>
        . Fork of{" "}
        <a
          href="https://github.com/marmelab/atomic-crm"
          className="underline hover:no-underline"
        >
          Atomic CRM
        </a>{" "}
        by Marmelab.
      </p>
    </CardContent>
  </Card>
);
