import { ShowBase, useShowContext, useTranslate } from "ra-core";
import { ReferenceField } from "@/components/admin/reference-field";
import { ReferenceManyField } from "@/components/admin/reference-many-field";
import { Card, CardContent } from "@/components/ui/card";

import { CompanyAvatar } from "../companies/CompanyAvatar";
import { NoteCreate } from "../notes/NoteCreate";
import { NotesIterator } from "../notes/NotesIterator";
import type { Deal } from "../types";
import { DealAside } from "./DealAside";

export const DealShow = () => (
  <ShowBase>
    <DealShowContent />
  </ShowBase>
);

const DealShowContent = () => {
  const { record, isPending } = useShowContext<Deal>();
  const translate = useTranslate();

  if (isPending || !record) return null;

  return (
    <div className="mt-2 mb-2 flex gap-8">
      <div className="flex-1">
        <Card>
          <CardContent>
            {/* Deal Header */}
            <div className="flex items-center gap-4 mb-6">
              <ReferenceField
                source="company_id"
                reference="companies"
                link="show"
              >
                <CompanyAvatar />
              </ReferenceField>
              <h5 className="text-xl font-semibold">{record.name}</h5>
            </div>

            {/* Description */}
            {record.description && (
              <div className="mb-6 whitespace-pre-line">
                <h3 className="text-lg font-semibold mb-2">
                  {translate("crm.deal.field.description")}
                </h3>
                <p className="text-sm leading-6 text-muted-foreground">
                  {record.description}
                </p>
              </div>
            )}

            {/* Notes Section */}
            <div className="mt-8">
              <h3 className="text-lg font-semibold mb-4">
                {translate("crm.deal.section.notes")}
              </h3>
              <p className="text-sm text-muted-foreground mb-3">
                {translate("crm.deal.section.notes_description")}
              </p>
              <ReferenceManyField
                target="deal_id"
                reference="dealNotes"
                sort={{ field: "date", order: "DESC" }}
                empty={<NoteCreate reference="deals" className="mt-4" />}
              >
                <NotesIterator reference="deals" />
              </ReferenceManyField>
            </div>
          </CardContent>
        </Card>
      </div>
      <DealAside />
    </div>
  );
};
