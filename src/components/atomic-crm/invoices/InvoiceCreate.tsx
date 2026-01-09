import { Create } from "@/components/admin/create";
import { SimpleForm } from "@/components/admin/simple-form";

import { InvoiceInputs } from "./InvoiceInputs";

export const InvoiceCreate = () => {
    return (
        <Create redirect="show">
            <SimpleForm className="max-w-full">
                <InvoiceInputs />
            </SimpleForm>
        </Create>
    );
};
