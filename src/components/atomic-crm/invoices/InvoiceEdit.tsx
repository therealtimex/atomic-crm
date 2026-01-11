import { Edit } from "@/components/admin/edit";
import { SimpleForm } from "@/components/admin/simple-form";

import { InvoiceInputs } from "./InvoiceInputs";

export const InvoiceEdit = () => {
  return (
    <Edit redirect="show" mutationMode="pessimistic">
      <SimpleForm className="max-w-full">
        <InvoiceInputs />
      </SimpleForm>
    </Edit>
  );
};
