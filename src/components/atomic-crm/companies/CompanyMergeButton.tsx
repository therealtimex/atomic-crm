import { useState, useEffect } from "react";
import { Merge, CircleX, AlertTriangle, ArrowDown } from "lucide-react";
import {
  useDataProvider,
  useRecordContext,
  useGetList,
  useGetManyReference,
  required,
  Form,
  useNotify,
  useRedirect,
} from "ra-core";
import type { Identifier } from "ra-core";
import { useMutation } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ReferenceInput } from "@/components/admin/reference-input";
import { AutocompleteInput } from "@/components/admin/autocomplete-input";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import type { Company } from "../types";

export const CompanyMergeButton = () => {
  const [mergeDialogOpen, setMergeDialogOpen] = useState(false);
  return (
    <>
      <Button
        variant="outline"
        className="h-6 cursor-pointer"
        size="sm"
        onClick={() => setMergeDialogOpen(true)}
      >
        <Merge className="w-4 h-4" />
        Merge with another company
      </Button>
      <CompanyMergeDialog
        open={mergeDialogOpen}
        onClose={() => setMergeDialogOpen(false)}
      />
    </>
  );
};

interface CompanyMergeDialogProps {
  open: boolean;
  onClose: () => void;
}

const CompanyMergeDialog = ({ open, onClose }: CompanyMergeDialogProps) => {
  const loserCompany = useRecordContext<Company>();
  const notify = useNotify();
  const redirect = useRedirect();
  const dataProvider = useDataProvider();
  const [winnerId, setWinnerId] = useState<Identifier | null>(null);
  const [suggestedWinnerId, setSuggestedWinnerId] = useState<Identifier | null>(
    null,
  );
  const [isMerging, setIsMerging] = useState(false);
  const { mutateAsync } = useMutation({
    mutationKey: ["companies", "merge", { loserId: loserCompany?.id, winnerId }],
    mutationFn: async () => {
      return dataProvider.mergeCompanies(loserCompany?.id, winnerId);
    },
  });

  // Find potential companies with matching name
  const { data: matchingCompanies } = useGetList(
    "companies",
    {
      filter: {
        name: loserCompany?.name,
        "id@neq": `${loserCompany?.id}`, // Exclude current company
      },
      pagination: { page: 1, perPage: 10 },
    },
    { enabled: open && !!loserCompany },
  );

  // Get counts of items to be merged
  const canFetchCounts = open && !!loserCompany && !!winnerId;
  const { total: contactsCount } = useGetManyReference(
    "contacts",
    {
      target: "company_id",
      id: loserCompany?.id,
      pagination: { page: 1, perPage: 1 },
    },
    { enabled: canFetchCounts },
  );

  const { total: dealsCount } = useGetManyReference(
    "deals",
    {
      target: "company_id",
      id: loserCompany?.id,
      pagination: { page: 1, perPage: 1 },
    },
    { enabled: canFetchCounts },
  );

  useEffect(() => {
    if (matchingCompanies && matchingCompanies.length > 0) {
      const suggestedWinnerId = matchingCompanies[0].id;
      setSuggestedWinnerId(suggestedWinnerId);
      setWinnerId(suggestedWinnerId);
    }
  }, [matchingCompanies]);

  const handleMerge = async () => {
    if (!winnerId || !loserCompany) {
      notify("Please select a company to merge with", { type: "warning" });
      return;
    }

    try {
      setIsMerging(true);
      await mutateAsync();
      setIsMerging(false);
      notify("Companies merged successfully", { type: "success" });
      redirect(`/companies/${winnerId}/show`);
      onClose();
    } catch (error) {
      setIsMerging(false);
      notify("Failed to merge companies", { type: "error" });
      console.error("Merge failed:", error);
    }
  };

  if (!loserCompany) return null;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="md:min-w-lg max-w-2xl">
        <DialogHeader>
          <DialogTitle>Merge Company</DialogTitle>
          <DialogDescription>
            Merge this company with another one.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="p-4 bg-primary/5 rounded-lg border border-primary/20">
            <p className="font-medium text-sm">
              Current Company (will be deleted)
            </p>
            <div className="font-medium text-sm mt-4">{loserCompany.name}</div>

            <div className="flex justify-center my-4">
              <ArrowDown className="h-5 w-5 text-muted-foreground" />
            </div>

            <p className="font-medium text-sm mb-2">
              Target Company (will be kept)
            </p>
            <Form>
              <ReferenceInput
                source="winner_id"
                reference="companies"
                filter={{ "id@neq": loserCompany.id }}
              >
                <AutocompleteInput
                  label=""
                  optionText="name"
                  validate={required()}
                  onChange={setWinnerId}
                  defaultValue={suggestedWinnerId}
                  helperText={false}
                />
              </ReferenceInput>
            </Form>
          </div>

          {winnerId && (
            <>
              <div className="space-y-2">
                <p className="font-medium text-sm">What will be merged:</p>
                <ul className="text-sm text-muted-foreground space-y-1 ml-4">
                  {contactsCount != null && contactsCount > 0 && (
                    <li>
                      • {contactsCount} contact
                      {contactsCount !== 1 ? "s" : ""} will be reassigned
                    </li>
                  )}
                  {dealsCount != null && dealsCount > 0 && (
                    <li>
                      • {dealsCount} deal
                      {dealsCount !== 1 ? "s" : ""} will be reassigned
                    </li>
                  )}
                  {loserCompany.context_links?.length > 0 && (
                    <li>
                      • {loserCompany.context_links.length} context link
                      {loserCompany.context_links.length !== 1 ? "s" : ""} will
                      be added
                    </li>
                  )}
                  {!contactsCount &&
                    !dealsCount &&
                    !loserCompany.context_links?.length && (
                      <li className="text-muted-foreground/60">
                        No additional data to merge
                      </li>
                    )}
                </ul>
              </div>
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>Warning: Destructive Operation</AlertTitle>
                <AlertDescription>
                  All data will be transferred to the second company. This
                  action cannot be undone.
                </AlertDescription>
              </Alert>
            </>
          )}
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={onClose} disabled={isMerging}>
            <CircleX />
            Cancel
          </Button>
          <Button onClick={handleMerge} disabled={!winnerId || isMerging}>
            <Merge />
            {isMerging ? "Merging..." : "Merge Companies"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
