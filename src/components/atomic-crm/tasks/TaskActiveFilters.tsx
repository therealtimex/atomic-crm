import { Filter, X } from "lucide-react";
import { useGetIdentity, useGetOne, useListFilterContext } from "ra-core";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

import { useConfigurationContext } from "../root/ConfigurationContext";
import type { Company, Contact, Deal, Sale } from "../types";

const hasValue = (value: unknown) => {
  if (value === undefined || value === null) return false;
  if (typeof value === "string") return value.trim().length > 0;
  if (typeof value === "boolean") return value;
  return true;
};

const getContactLabel = (contact?: Contact, id?: number | string) => {
  if (contact) {
    return `${contact.first_name ?? ""} ${contact.last_name ?? ""}`.trim();
  }
  return `#${id}`;
};

const getSalesLabel = (sale?: Sale, id?: number | string) => {
  if (sale) {
    return `${sale.first_name ?? ""} ${sale.last_name ?? ""}`.trim();
  }
  return `#${id}`;
};

export const TaskActiveFilters = () => {
  const { filterValues, displayedFilters, setFilters } = useListFilterContext();
  const { identity } = useGetIdentity();
  const { taskStatuses, taskPriorities } = useConfigurationContext();

  const contactId = filterValues.contact_id as number | undefined;
  const companyId = filterValues.company_id as number | undefined;
  const dealId = filterValues.deal_id as number | undefined;
  const assignedTo = filterValues.assigned_to as number | undefined;

  const { data: contact } = useGetOne<Contact>(
    "contacts",
    { id: contactId },
    { enabled: hasValue(contactId) },
  );
  const { data: company } = useGetOne<Company>(
    "companies",
    { id: companyId },
    { enabled: hasValue(companyId) },
  );
  const { data: deal } = useGetOne<Deal>(
    "deals",
    { id: dealId },
    { enabled: hasValue(dealId) },
  );
  const { data: sale } = useGetOne<Sale>(
    "sales",
    { id: assignedTo },
    { enabled: hasValue(assignedTo) && assignedTo !== identity?.id },
  );

  const statusLabel = taskStatuses.find(
    (status) => status.id === filterValues.status,
  )?.name;
  const priorityLabel = taskPriorities.find(
    (priority) => priority.id === filterValues.priority,
  )?.name;

  const chips = [
    hasValue(filterValues.q) && {
      key: "q",
      label: `Search: ${filterValues.q}`,
    },
    hasValue(filterValues.status) && {
      key: "status",
      label: `Status: ${statusLabel ?? filterValues.status}`,
    },
    hasValue(contactId) && {
      key: "contact_id",
      label: `Contact: ${getContactLabel(contact, contactId)}`,
    },
    hasValue(companyId) && {
      key: "company_id",
      label: `Company: ${company?.name ?? `#${companyId}`}`,
    },
    hasValue(dealId) && {
      key: "deal_id",
      label: `Deal: ${deal?.name ?? `#${dealId}`}`,
    },
    hasValue(filterValues.priority) && {
      key: "priority",
      label: `Priority: ${priorityLabel ?? filterValues.priority}`,
    },
    hasValue(assignedTo) && {
      key: "assigned_to",
      label:
        assignedTo === identity?.id
          ? "My Tasks"
          : `Assigned to: ${getSalesLabel(sale, assignedTo)}`,
    },
    filterValues.archived === true && {
      key: "archived",
      label: "Archived",
    },
  ].filter(Boolean) as { key: string; label: string }[];

  if (chips.length === 0) return null;

  const handleRemove = (key: string) => {
    const nextFilters = { ...filterValues };
    delete nextFilters[key];
    setFilters(nextFilters, displayedFilters);
  };

  const handleClearAll = () => {
    setFilters({}, displayedFilters);
  };

  return (
    <div className="flex flex-wrap items-center gap-2 rounded-md border border-muted/60 bg-muted/40 px-3 py-2">
      <span className="inline-flex items-center gap-1 text-xs font-semibold text-muted-foreground">
        <Filter className="h-3 w-3" />
        Active filters
      </span>
      {chips.map((chip) => (
        <Badge key={chip.key} variant="secondary" className="gap-1 pr-1">
          <span>{chip.label}</span>
          <button
            type="button"
            onClick={() => handleRemove(chip.key)}
            className="rounded-sm p-0.5 text-muted-foreground transition hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
            aria-label={`Remove ${chip.label} filter`}
          >
            <X className="h-3 w-3" />
          </button>
        </Badge>
      ))}
      <Button
        type="button"
        variant="ghost"
        size="sm"
        className="h-7 px-2 text-xs text-muted-foreground"
        onClick={handleClearAll}
      >
        Clear all
      </Button>
    </div>
  );
};
