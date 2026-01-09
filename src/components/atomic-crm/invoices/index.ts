import { Receipt } from "lucide-react";

import { InvoiceList } from "./InvoiceList";
import { InvoiceShow } from "./InvoiceShow";
import { InvoiceCreate } from "./InvoiceCreate";
import { InvoiceEdit } from "./InvoiceEdit";
import { InvoiceCard } from "./InvoiceCard";

export default {
    list: InvoiceList,
    show: InvoiceShow,
    create: InvoiceCreate,
    edit: InvoiceEdit,
    icon: Receipt,
    recordRepresentation: "invoice_number",
};

export { InvoiceList, InvoiceShow, InvoiceCreate, InvoiceEdit, InvoiceCard };
