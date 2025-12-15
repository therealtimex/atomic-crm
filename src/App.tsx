import { RealTimeXApp } from "@realtimex/app-sdk";
import { SupabaseProvider } from "@realtimex/app-sdk/providers/supabase";
import { CRM } from "@/components/atomic-crm/root/CRM";

/**
 * Application entry point - Integrated with RealTimeX
 *
 * This app is now integrated with RealTimeX for authentication and data scoping.
 * In development mode, it will use mock users.
 * When embedded in RealTimeX, it will use the authenticated user from the parent app.
 *
 * Customize Atomic CRM by passing props to the CRM component:
 *  - contactGender
 *  - companySectors
 *  - darkTheme
 *  - dealCategories
 *  - dealPipelineStatuses
 *  - dealStages
 *  - lightTheme
 *  - logo
 *  - noteStatuses
 *  - taskTypes
 *  - title
 * ... as well as all the props accepted by shadcn-admin-kit's <Admin> component.
 *
 * @example
 * const App = () => (
 *    <CRM
 *       logo="./img/logo.png"
 *       title="Acme CRM"
 *    />
 * );
 */
const App = () => {
  const isDevelopment = import.meta.env.DEV;

  return (
    <RealTimeXApp
      appId="atomic-crm"
      appName="Atomic CRM"
      version="0.1.0"
      allowedOrigins={[
        "http://localhost:3000",
        "https://app.realtimex.ai",
      ]}
      devMode={{
        enabled: isDevelopment,
        mockUser: {
          id: Number(import.meta.env.VITE_REALTIMEX_MOCK_USER_ID) || 1,
          email: import.meta.env.VITE_REALTIMEX_MOCK_USER_EMAIL || "dev@example.com",
          name: import.meta.env.VITE_REALTIMEX_MOCK_USER_NAME || "Dev User",
          role: "admin",
        },
      }}
      onAuthReady={(user) => {
        console.log("✅ RealTimeX authentication ready:", user);
      }}
      onError={(error) => {
        console.error("❌ RealTimeX authentication error:", error);
      }}
    >
      <SupabaseProvider
        url={import.meta.env.VITE_SUPABASE_URL}
        anonKey={import.meta.env.VITE_SUPABASE_ANON_KEY}
        autoScope={{
          enabled: true,
          userIdField: "realtimex_user_id",
          mode: "header",
        }}
      >
        <CRM />
      </SupabaseProvider>
    </RealTimeXApp>
  );
};

export default App;
