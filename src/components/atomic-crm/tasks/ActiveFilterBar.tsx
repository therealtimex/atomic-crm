import { useListFilterContext, useGetIdentity, useGetOne } from "ra-core";
import { X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useConfigurationContext } from "../root/ConfigurationContext";

/**
 * ActiveFilterBar component
 * Displays active filters as removable chips/badges
 * Integrates with react-admin's filter system
 */
export const ActiveFilterBar = () => {
  const { filterValues, displayedFilters, setFilters } =
    useListFilterContext();
  const { identity } = useGetIdentity();
  const { taskStatuses, taskPriorities } = useConfigurationContext();

  // Default filter values that shouldn't show as active
  const defaultFilters = { archived: false };

  // Get contact, company, deal names for reference filters
  const { data: contact } = useGetOne(
    "contacts",
    { id: filterValues.contact_id },
    { enabled: !!filterValues.contact_id }
  );

  const { data: company } = useGetOne(
    "companies",
    { id: filterValues.company_id },
    { enabled: !!filterValues.company_id }
  );

  const { data: deal } = useGetOne(
    "deals",
    { id: filterValues.deal_id },
    { enabled: !!filterValues.deal_id }
  );

  // Remove a filter
  const handleRemoveFilter = (filterKey: string) => {
    const newFilters = { ...filterValues };
    delete newFilters[filterKey];

    // If removing archived filter, reset to default
    if (filterKey === "archived") {
      newFilters.archived = false;
    }

    setFilters(newFilters, displayedFilters);
  };

  // Get user-friendly label for a filter
  const getFilterLabel = (key: string, value: unknown): string => {
    switch (key) {
      case "q":
        return `Search: "${value}"`;
      case "status": {
        const status = taskStatuses.find((s) => s.id === value);
        return `Status: ${status?.name || value}`;
      }
      case "priority": {
        const priority = taskPriorities.find((p) => p.id === value);
        return `Priority: ${priority?.name || value}`;
      }
      case "assigned_to":
        if (identity && value === identity.id) {
          return "My Tasks";
        }
        return `Assigned to: ${value}`;
      case "contact_id":
        if (contact) {
          return `Contact: ${contact.first_name} ${contact.last_name}`;
        }
        return "Contact: Loading...";
      case "company_id":
        if (company) {
          return `Company: ${company.name}`;
        }
        return "Company: Loading...";
      case "deal_id":
        if (deal) {
          return `Deal: ${deal.name}`;
        }
        return "Deal: Loading...";
      case "archived":
        return value ? "Archived" : "Active";
      default:
        return `${key}: ${value}`;
    }
  };

  // Check if a filter is active (not default)
  const isActiveFilter = (key: string, value: unknown): boolean => {
    // Skip if it's a default filter with default value
    if (key in defaultFilters && defaultFilters[key as keyof typeof defaultFilters] === value) {
      return false;
    }
    // Skip if value is undefined, null, or empty string
    if (value === undefined || value === null || value === "") {
      return false;
    }
    return true;
  };

  // Get list of active filters
  const activeFilters = Object.entries(filterValues).filter(([key, value]) =>
    isActiveFilter(key, value)
  );

  // Don't render if no active filters
  if (activeFilters.length === 0) {
    return null;
  }

  return (
    <div className="flex flex-wrap items-center gap-2 p-4 bg-muted/30 border-b">
      <span className="text-sm font-medium text-muted-foreground">
        Active filters:
      </span>
      {activeFilters.map(([key, value]) => (
        <Badge
          key={key}
          variant="secondary"
          className="flex items-center gap-1.5 pl-3 pr-2 py-1"
        >
          <span className="text-sm">{getFilterLabel(key, value)}</span>
          <Button
            variant="ghost"
            size="icon"
            className="h-4 w-4 p-0 hover:bg-transparent"
            onClick={() => handleRemoveFilter(key)}
            aria-label={`Remove ${key} filter`}
          >
            <X className="h-3 w-3" />
          </Button>
        </Badge>
      ))}
    </div>
  );
};
