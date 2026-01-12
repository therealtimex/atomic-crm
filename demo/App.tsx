import { CRM } from "@/components/atomic-crm/root/CRM";
import {
  authProvider as fakerestAuth,
  dataProvider as fakerestData,
} from "@/components/atomic-crm/providers/fakerest";
import {
  authProvider as supabaseAuth,
  dataProvider as supabaseData,
} from "@/components/atomic-crm/providers/supabase";

const isSupabaseDemo =
  import.meta.env.VITE_SUPABASE_URL &&
  import.meta.env.VITE_SUPABASE_URL !== "https://demo.example.org" &&
  import.meta.env.VITE_SUPABASE_URL !== "";

const App = () => (
  <CRM
    dataProvider={isSupabaseDemo ? supabaseData : fakerestData}
    authProvider={isSupabaseDemo ? supabaseAuth : fakerestAuth}
  />
);

export default App;
