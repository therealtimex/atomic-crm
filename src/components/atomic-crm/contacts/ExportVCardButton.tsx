import { Download } from "lucide-react";
import { useGetOne, useRecordContext, useTranslate } from "ra-core";
import { Button } from "@/components/ui/button";
import type { Contact, Company } from "../types";
import { exportToVCard } from "./exportToVCard";

export const ExportVCardButton = () => {
  const contact = useRecordContext<Contact>();
  const translate = useTranslate();

  // Fetch the company data on mount
  const { data: company } = useGetOne<Company>(
    "companies",
    { id: contact?.company_id },
    { enabled: !!contact?.company_id },
  );
// ...
  if (!contact) return null;

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleExport}
      className="h-6 cursor-pointer"
    >
      <Download className="w-4 h-4" />
      {translate("crm.contact.action.export_vcard")}
    </Button>
  );
};
