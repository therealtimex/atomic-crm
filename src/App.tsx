import { useState } from "react";
import { CRM } from "@/components/atomic-crm/root/CRM";
import { SupabaseSetupWizard } from "@/components/atomic-crm/setup/SupabaseSetupWizard";
import { isSupabaseConfigured } from "@/lib/supabase-config";

/**
 * Application entry point
 *
 * Customize Atomic CRM by passing props to the CRM component:
 *  - contactGender
 *  - companySectors
 *  - companyLifecycleStages (NEW)
 *  - companyTypes (NEW)
 *  - companyQualificationStatuses (NEW)
 *  - companyRevenueRanges (NEW)
 *  - externalHeartbeatStatuses (NEW)
 *  - internalHeartbeatStatuses (NEW)
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

// Company lifecycle stages configuration
const companyLifecycleStages = [
  { id: 'prospect', name: 'Prospect' },
  { id: 'customer', name: 'Customer' },
  { id: 'churned', name: 'Churned' },
  { id: 'lost', name: 'Lost' },
  { id: 'archived', name: 'Archived' },
];

// Company type configuration
const companyTypes = [
  { id: 'customer', name: 'Customer' },
  { id: 'prospect', name: 'Prospect' },
  { id: 'partner', name: 'Partner' },
  { id: 'vendor', name: 'Vendor' },
  { id: 'competitor', name: 'Competitor' },
  { id: 'internal', name: 'Internal' },
];

// Company qualification status configuration
const companyQualificationStatuses = [
  { id: 'qualified', name: 'Qualified' },
  { id: 'unqualified', name: 'Unqualified' },
  { id: 'duplicate', name: 'Duplicate' },
  { id: 'spam', name: 'Spam' },
  { id: 'test', name: 'Test' },
];

// Company revenue ranges configuration
const companyRevenueRanges = [
  { id: '0-1M', name: 'Under $1M' },
  { id: '1M-10M', name: '$1M - $10M' },
  { id: '10M-50M', name: '$10M - $50M' },
  { id: '50M-100M', name: '$50M - $100M' },
  { id: '100M+', name: 'Over $100M' },
  { id: 'unknown', name: 'Unknown' },
];

// External heartbeat status configuration
const externalHeartbeatStatuses = [
  { id: 'healthy', name: 'Healthy', color: '#10b981' },
  { id: 'risky', name: 'Risky', color: '#f59e0b' },
  { id: 'dead', name: 'Dead', color: '#ef4444' },
  { id: 'unknown', name: 'Not Checked', color: '#6b7280' },
];

// Internal heartbeat status configuration
const internalHeartbeatStatuses = [
  { id: 'engaged', name: 'Engaged', color: '#10b981' },
  { id: 'quiet', name: 'Quiet', color: '#3b82f6' },
  { id: 'at_risk', name: 'At Risk', color: '#f59e0b' },
  { id: 'unresponsive', name: 'Unresponsive', color: '#ef4444' },
  { id: 'unknown', name: 'Unknown', color: '#6b7280' },
];

const App = () => {
  const [needsSetup, setNeedsSetup] = useState<boolean>(() => {
    // Check immediately on mount
    const configured = isSupabaseConfigured();
    return !configured;
  });

  // If Supabase is not configured, only show the setup wizard
  if (needsSetup) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <SupabaseSetupWizard
          open={true}
          onComplete={() => {
            setNeedsSetup(false);
            // Will reload anyway, but update state for clarity
          }}
          canClose={false}
        />
      </div>
    );
  }

  return (
    <CRM
      companyLifecycleStages={companyLifecycleStages}
      companyTypes={companyTypes}
      companyQualificationStatuses={companyQualificationStatuses}
      companyRevenueRanges={companyRevenueRanges}
      externalHeartbeatStatuses={externalHeartbeatStatuses}
      internalHeartbeatStatuses={internalHeartbeatStatuses}
    />
  );
};

export default App;
