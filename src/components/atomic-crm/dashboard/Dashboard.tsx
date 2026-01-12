import { useGetList, useTranslate } from "ra-core";

import type { Contact, ContactNote } from "../types";
import { DashboardActivityLog } from "./DashboardActivityLog";
import { DashboardStepper } from "./DashboardStepper";
import { DealsChart } from "./DealsChart";
import { HotContacts } from "./HotContacts";
import { InvoicesChart } from "./InvoicesChart";
import { OutstandingInvoices } from "./OutstandingInvoices";
import { TasksList } from "./TasksList";
import { Welcome } from "./Welcome";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TrendingUp, DollarSign } from "lucide-react";

export const Dashboard = () => {
  const translate = useTranslate();
  const {
    data: dataContact,
    total: totalContact,
    isPending: isPendingContact,
  } = useGetList<Contact>("contacts", {
    pagination: { page: 1, perPage: 1 },
  });

  const { total: totalContactNotes, isPending: isPendingContactNotes } =
    useGetList<ContactNote>("contactNotes", {
      pagination: { page: 1, perPage: 1 },
    });

  const { total: totalDeal, isPending: isPendingDeal } = useGetList<Contact>(
    "deals",
    {
      pagination: { page: 1, perPage: 1 },
    },
  );

  const isPending = isPendingContact || isPendingContactNotes || isPendingDeal;

  if (isPending) {
    return null;
  }

  if (!totalContact) {
    return <DashboardStepper step={1} />;
  }

  if (!totalContactNotes) {
    return <DashboardStepper step={2} contactId={dataContact?.[0]?.id} />;
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-12 gap-6 mt-1">
      <div className="md:col-span-3">
        <div className="flex flex-col gap-4">
          {import.meta.env.VITE_IS_DEMO === "true" ? <Welcome /> : null}
          <HotContacts />
          <OutstandingInvoices />
        </div>
      </div>
      <div className="md:col-span-6">
        <div className="flex flex-col gap-6">
          <Tabs defaultValue="invoices" className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-4">
              <TabsTrigger value="invoices" className="flex items-center gap-2">
                <DollarSign className="h-4 w-4" />
                {translate("crm.dashboard.invoice_revenue")}
              </TabsTrigger>
              {totalDeal ? (
                <TabsTrigger value="deals" className="flex items-center gap-2">
                  <TrendingUp className="h-4 w-4" />
                  {translate("crm.dashboard.deal_pipeline")}
                </TabsTrigger>
              ) : null}
            </TabsList>
            <TabsContent value="invoices" className="mt-0">
              <InvoicesChart />
            </TabsContent>
            {totalDeal ? (
              <TabsContent value="deals" className="mt-0">
                <DealsChart />
              </TabsContent>
            ) : null}
          </Tabs>
          <DashboardActivityLog />
        </div>
      </div>

      <div className="md:col-span-3">
        <TasksList />
      </div>
    </div>
  );
};
