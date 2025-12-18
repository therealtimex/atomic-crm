import { useGetIdentity, useListContext, useRecordContext } from "ra-core";
import { CreateButton } from "@/components/admin/create-button";
import { DataTable } from "@/components/admin/data-table";
import { ExportButton } from "@/components/admin/export-button";
import { List } from "@/components/admin/list";
import { SearchInput } from "@/components/admin/search-input";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

import { TopToolbar } from "../layout/TopToolbar";
import useAppBarHeight from "../misc/useAppBarHeight";

const SalesListActions = () => (
  <TopToolbar>
    <ExportButton />
    <CreateButton label="New user" />
  </TopToolbar>
);

const filters = [<SearchInput source="q" alwaysOn />];

const OptionsField = (_props: { label?: string | boolean }) => {
  const record = useRecordContext();
  if (!record) return null;
  return (
    <div className="flex flex-row gap-1">
      {record.administrator && (
        <Badge
          variant="outline"
          className="border-blue-300 dark:border-blue-700"
        >
          Admin
        </Badge>
      )}
      {record.disabled && (
        <Badge
          variant="outline"
          className="border-orange-300 dark:border-orange-700"
        >
          Disabled
        </Badge>
      )}
    </div>
  );
};

export function SalesList() {
  return (
    <List
      filters={filters}
      actions={<SalesListActions />}
      sort={{ field: "first_name", order: "ASC" }}
    >
      <SalesListLayout />
    </List>
  );
}

const SalesListLayout = () => {
  const { data, isPending, filterValues } = useListContext();
  const { identity } = useGetIdentity();

  const hasFilters = filterValues && Object.keys(filterValues).length > 0;

  // Show loading skeleton while identity or data is loading
  if (!identity || isPending) {
    return (
      <Card className="p-4">
        <div className="space-y-3">
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
        </div>
      </Card>
    );
  }

  // Show empty state when no data
  if (!data?.length && !hasFilters) {
    return <SalesEmpty />;
  }

  return (
    <DataTable>
      <DataTable.Col source="first_name" />
      <DataTable.Col source="last_name" />
      <DataTable.Col source="email" />
      <DataTable.Col label={false}>
        <OptionsField />
      </DataTable.Col>
    </DataTable>
  );
};

const SalesEmpty = () => {
  const appbarHeight = useAppBarHeight();
  return (
    <div
      className="flex flex-col justify-center items-center gap-3"
      style={{
        height: `calc(100dvh - ${appbarHeight}px)`,
      }}
    >
      <img src="./img/empty.svg" alt="No users found" />
      <div className="flex flex-col gap-0 items-center">
        <h6 className="text-lg font-bold">No users found</h6>
        <p className="text-sm text-muted-foreground text-center mb-4">
          It seems your user list is empty.
        </p>
      </div>
      <div className="flex flex-row gap-2">
        <CreateButton label="New user" />
      </div>
    </div>
  );
};
