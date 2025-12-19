import { useMutation } from "@tanstack/react-query";
import { KeyRound, MoreHorizontal, RefreshCw } from "lucide-react";
import * as React from "react";
import {
  useDataProvider,
  useGetIdentity,
  useListContext,
  useNotify,
  useRecordContext,
  useRefresh,
} from "ra-core";
import { CreateButton } from "@/components/admin/create-button";
import { DataTable } from "@/components/admin/data-table";
import { EditButton } from "@/components/admin/edit-button";
import { ExportButton } from "@/components/admin/export-button";
import { List } from "@/components/admin/list";
import { SearchInput } from "@/components/admin/search-input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Skeleton } from "@/components/ui/skeleton";

import { TopToolbar } from "../layout/TopToolbar";
import useAppBarHeight from "../misc/useAppBarHeight";
import type { CrmDataProvider } from "../providers/types";

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

const RowActions = () => {
  const record = useRecordContext();
  const dataProvider = useDataProvider<CrmDataProvider>();
  const notify = useNotify();
  const refresh = useRefresh();
  const [inviteDialogOpen, setInviteDialogOpen] = React.useState(false);
  const [resetDialogOpen, setResetDialogOpen] = React.useState(false);

  const { mutate: resendInvite, isPending: isInvitePending } = useMutation({
    mutationFn: async () => {
      return dataProvider.resendInvite(record.id);
    },
    onSuccess: () => {
      notify("Invitation email resent successfully");
      setInviteDialogOpen(false);
      refresh();
    },
    onError: () => {
      notify("Failed to resend invitation email", { type: "error" });
      setInviteDialogOpen(false);
    },
  });

  const { mutate: resetPassword, isPending: isResetPending } = useMutation({
    mutationFn: async () => {
      return dataProvider.resetPassword(record.id);
    },
    onSuccess: () => {
      notify("Password reset email sent successfully");
      setResetDialogOpen(false);
      refresh();
    },
    onError: () => {
      notify("Failed to send password reset email", { type: "error" });
      setResetDialogOpen(false);
    },
  });

  if (!record) return null;

  // Determine which action to show based on confirmation status
  const isConfirmed = record.email_confirmed_at !== null;
  const isDisabled = record.disabled === true;

  console.log("[RowActions] Record:", {
    email: record.email,
    email_confirmed_at: record.email_confirmed_at,
    isConfirmed,
    isDisabled,
    inviteDialogOpen,
    resetDialogOpen,
  });

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="h-8 w-8 p-0">
            <span className="sr-only">Open menu</span>
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuLabel>Email Actions</DropdownMenuLabel>
          <DropdownMenuSeparator />
          {!isConfirmed && (
            <DropdownMenuItem
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                console.log("[Menu] Clicked Resend Invite");
                setInviteDialogOpen(true);
              }}
            >
              <RefreshCw className="mr-2 h-4 w-4" />
              Resend Invite
            </DropdownMenuItem>
          )}
          {isConfirmed && !isDisabled && (
            <DropdownMenuItem onClick={() => setResetDialogOpen(true)}>
              <KeyRound className="mr-2 h-4 w-4" />
              Send Password Reset
            </DropdownMenuItem>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Resend Invite Dialog */}
      <Dialog open={inviteDialogOpen} onOpenChange={setInviteDialogOpen}>
        <DialogContent
          onClick={(e) => e.stopPropagation()}
          onPointerDown={(e) => e.stopPropagation()}
        >
          <DialogHeader>
            <DialogTitle>Resend Invitation</DialogTitle>
            <DialogDescription>
              Send a new invitation email to <strong>{record.email}</strong>?
              <br />
              <br />
              This will send them a fresh invitation link to set up their account.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={(e) => {
                e.stopPropagation();
                setInviteDialogOpen(false);
              }}
              disabled={isInvitePending}
            >
              Cancel
            </Button>
            <Button
              onClick={(e) => {
                e.stopPropagation();
                resendInvite();
              }}
              disabled={isInvitePending}
            >
              {isInvitePending ? "Sending..." : "Send Invitation"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Password Reset Dialog */}
      <Dialog open={resetDialogOpen} onOpenChange={setResetDialogOpen}>
        <DialogContent
          onClick={(e) => e.stopPropagation()}
          onPointerDown={(e) => e.stopPropagation()}
        >
          <DialogHeader>
            <DialogTitle>Send Password Reset</DialogTitle>
            <DialogDescription>
              Send a password reset email to <strong>{record.email}</strong>?
              <br />
              <br />
              This will send them a link to reset their password.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={(e) => {
                e.stopPropagation();
                setResetDialogOpen(false);
              }}
              disabled={isResetPending}
            >
              Cancel
            </Button>
            <Button
              onClick={(e) => {
                e.stopPropagation();
                resetPassword();
              }}
              disabled={isResetPending}
            >
              {isResetPending ? "Sending..." : "Send Reset Link"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
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
      <DataTable.Col label={false}>
        <RowActions />
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
