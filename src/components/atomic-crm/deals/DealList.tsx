import { useGetIdentity, useListContext } from "ra-core";
import { matchPath, useLocation } from "react-router";
import { AutocompleteInput } from "@/components/admin/autocomplete-input";
import { CreateButton } from "@/components/admin/create-button";
import { ExportButton } from "@/components/admin/export-button";
import { List } from "@/components/admin/list";
import { ReferenceInput } from "@/components/admin/reference-input";
import { FilterButton } from "@/components/admin/filter-form";
import { SearchInput } from "@/components/admin/search-input";
import { SelectInput } from "@/components/admin/select-input";
import { Skeleton } from "@/components/ui/skeleton";
import { Card } from "@/components/ui/card";

import { useConfigurationContext } from "../root/ConfigurationContext";
import { TopToolbar } from "../layout/TopToolbar";
import { DealArchivedList } from "./DealArchivedList";
import { DealCreate } from "./DealCreate";
import { DealEdit } from "./DealEdit";
import { DealEmpty } from "./DealEmpty";
import { DealListContent } from "./DealListContent";
import { OnlyMineInput } from "./OnlyMineInput";

const DealList = () => {
  const { dealCategories } = useConfigurationContext();

  const dealFilters = [
    <SearchInput source="q" alwaysOn />,
    <ReferenceInput source="company_id" reference="companies">
      <AutocompleteInput label={false} placeholder="Company" />
    </ReferenceInput>,
    <SelectInput
      source="category"
      emptyText="Category"
      choices={dealCategories.map((type) => ({ id: type, name: type }))}
    />,
    <OnlyMineInput source="sales_id" alwaysOn />,
  ];

  return (
    <List
      perPage={100}
      filter={{ "archived_at@is": null }}
      title={false}
      sort={{ field: "index", order: "DESC" }}
      filters={dealFilters}
      actions={<DealActions />}
      pagination={null}
    >
      <DealLayout />
    </List>
  );
};

const DealLayout = () => {
  const location = useLocation();
  const matchCreate = matchPath("/deals/create", location.pathname);
  const matchEdit = matchPath("/deals/:id", location.pathname);

  const { data, isPending, filterValues } = useListContext();
  const { identity } = useGetIdentity();
  const hasFilters = filterValues && Object.keys(filterValues).length > 0;

  // Show loading skeleton while identity or data is loading
  if (!identity || isPending) {
    return (
      <div className="w-full">
        <Card className="p-4">
          <div className="flex gap-4">
            <Skeleton className="h-96 w-1/4" />
            <Skeleton className="h-96 w-1/4" />
            <Skeleton className="h-96 w-1/4" />
            <Skeleton className="h-96 w-1/4" />
          </div>
        </Card>
      </div>
    );
  }

  if (!data?.length && !hasFilters) {
    return (
      <>
        <DealEmpty>
          <DealArchivedList />
        </DealEmpty>
      </>
    );
  }

  return (
    <div className="w-full">
      <DealListContent />
      <DealArchivedList />
      <DealCreate open={!!matchCreate} />
      <DealEdit open={!!matchEdit && !matchCreate} id={matchEdit?.params.id} />
    </div>
  );
};

const DealActions = () => (
  <TopToolbar>
    <FilterButton />
    <ExportButton />
    <CreateButton label="New Deal" />
  </TopToolbar>
);

export default DealList;
