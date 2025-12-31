import { Archive, ArchiveRestore, Building2, Calendar, UserCheck, DollarSign, Tag, TrendingUp } from "lucide-react";
import { useRecordContext, useDataProvider, useNotify, useRedirect, useRefresh, useUpdate } from "ra-core";
import { useMutation } from "@tanstack/react-query";
import { format, isValid } from "date-fns";
import type { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { DeleteButton } from "@/components/admin/delete-button";
import { EditButton } from "@/components/admin/edit-button";
import { ReferenceField } from "@/components/admin/reference-field";
import { ReferenceArrayField } from "@/components/admin/reference-array-field";
import { TextField } from "@/components/admin/text-field";

import { AsideSection } from "../misc/AsideSection";
import { useConfigurationContext } from "../root/ConfigurationContext";
import type { Deal } from "../types";
import { findDealLabel } from "./deal";
import { ContactList } from "./ContactList";
import { CompanyAvatar } from "../companies/CompanyAvatar";

export const DealAside = () => {
  const record = useRecordContext<Deal>();

  if (!record) return null;

  return (
    <div className="hidden sm:block w-64 min-w-64 text-sm">
      <div className="mb-4 -ml-1 flex flex-col gap-2">
        {record.archived_at ? (
          <>
            <UnarchiveButton record={record} />
            <DeleteButton />
          </>
        ) : (
          <>
            <EditButton label="Edit Deal" />
            <ArchiveButton record={record} />
          </>
        )}
      </div>

      {record.archived_at && <ArchivedBadge />}

      <DealInfoSection />

      <CompanySection />

      {!!record.contact_ids?.length && <ContactsSection />}

      <AssignmentSection />

      {!record.archived_at && (
        <div className="mt-6 pt-6 border-t hidden sm:flex flex-col gap-2 items-start">
          <DeleteButton
            className="h-6 cursor-pointer hover:bg-destructive/10! text-destructive! border-destructive! focus-visible:ring-destructive/20 dark:focus-visible:ring-destructive/40"
            size="sm"
          />
        </div>
      )}
    </div>
  );
};

const ArchivedBadge = () => (
  <div className="mb-4 bg-orange-500 px-4 py-3 rounded-md">
    <p className="text-xs font-bold text-white">ARCHIVED</p>
  </div>
);

const DealInfoSection = () => {
  const record = useRecordContext<Deal>();
  const { dealStages } = useConfigurationContext();

  if (!record) return null;

  return (
    <AsideSection title="Deal Info">
      <InfoRow
        icon={<Calendar className="w-4 h-4 text-muted-foreground" />}
        label="Expected Closing"
        value={
          <div className="flex items-center gap-2">
            <span className="text-sm">
              {isValid(new Date(record.expected_closing_date))
                ? format(new Date(record.expected_closing_date), "PP")
                : "Invalid date"}
            </span>
            {new Date(record.expected_closing_date) < new Date() && (
              <Badge variant="destructive" className="text-xs">Past</Badge>
            )}
          </div>
        }
      />
      <InfoRow
        icon={<DollarSign className="w-4 h-4 text-muted-foreground" />}
        label="Budget"
        value={
          <span className="text-sm">
            {record.amount.toLocaleString("en-US", {
              notation: "compact",
              style: "currency",
              currency: "USD",
              currencyDisplay: "narrowSymbol",
              minimumSignificantDigits: 3,
            })}
          </span>
        }
      />
      {record.category && (
        <InfoRow
          icon={<Tag className="w-4 h-4 text-muted-foreground" />}
          label="Category"
          value={<span className="text-sm">{record.category}</span>}
        />
      )}
      <InfoRow
        icon={<TrendingUp className="w-4 h-4 text-muted-foreground" />}
        label="Stage"
        value={
          <span className="text-sm">
            {findDealLabel(dealStages, record.stage)}
          </span>
        }
      />
    </AsideSection>
  );
};

const CompanySection = () => {
  const record = useRecordContext<Deal>();

  if (!record?.company_id) return null;

  return (
    <AsideSection title="Company">
      <ReferenceField
        source="company_id"
        reference="companies"
        link="show"
      >
        <div className="flex items-center gap-3">
          <CompanyAvatar width={32} height={32} />
          <TextField source="name" className="text-sm font-medium" />
        </div>
      </ReferenceField>
    </AsideSection>
  );
};

const ContactsSection = () => {
  const record = useRecordContext<Deal>();

  if (!record?.contact_ids?.length) return null;

  return (
    <AsideSection title="Contacts">
      <ReferenceArrayField
        source="contact_ids"
        reference="contacts_summary"
      >
        <ContactList />
      </ReferenceArrayField>
    </AsideSection>
  );
};

const AssignmentSection = () => {
  const record = useRecordContext<Deal>();

  if (!record) return null;

  return (
    <AsideSection title="Assignment">
      <InfoRow
        icon={<UserCheck className="w-4 h-4 text-muted-foreground" />}
        label="Owner"
        value={
          <ReferenceField source="sales_id" reference="sales" link={false} />
        }
      />
    </AsideSection>
  );
};

const ArchiveButton = ({ record }: { record: Deal }) => {
  const [update] = useUpdate();
  const notify = useNotify();
  const refresh = useRefresh();

  const handleClick = () => {
    update(
      "deals",
      {
        id: record.id,
        data: { archived_at: new Date().toISOString() },
        previousData: record,
      },
      {
        onSuccess: () => {
          notify("Deal archived", { type: "info", undoable: false });
          refresh();
        },
        onError: () => {
          notify("Error: deal not archived", { type: "error" });
        },
      },
    );
  };

  return (
    <Button
      onClick={handleClick}
      size="sm"
      variant="outline"
      className="flex items-center gap-2 h-9"
    >
      <Archive className="w-4 h-4" />
      Archive
    </Button>
  );
};

const UnarchiveButton = ({ record }: { record: Deal }) => {
  const dataProvider = useDataProvider();
  const redirect = useRedirect();
  const notify = useNotify();
  const refresh = useRefresh();

  const { mutate } = useMutation({
    mutationFn: () => dataProvider.unarchiveDeal(record),
    onSuccess: () => {
      notify("Deal unarchived", {
        type: "info",
        undoable: false,
      });
      refresh();
    },
    onError: () => {
      notify("Error: deal not unarchived", { type: "error" });
    },
  });

  const handleClick = () => {
    mutate();
  };

  return (
    <Button
      onClick={handleClick}
      size="sm"
      variant="outline"
      className="flex items-center gap-2 h-9"
    >
      <ArchiveRestore className="w-4 h-4" />
      Unarchive
    </Button>
  );
};

const InfoRow = ({
  icon,
  label,
  value,
}: {
  icon: ReactNode;
  label: string;
  value: ReactNode;
}) => (
  <div className="flex flex-col gap-1 mb-3">
    <div className="flex items-center gap-2">
      {icon}
      <span className="text-xs text-muted-foreground">{label}</span>
    </div>
    <div className="pl-6 text-sm">{value}</div>
  </div>
);
