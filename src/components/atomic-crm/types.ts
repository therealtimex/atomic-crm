import type { Identifier, RaRecord } from "ra-core";
import type { ComponentType } from "react";

import type {
  COMPANY_CREATED,
  COMPANY_NOTE_CREATED,
  CONTACT_CREATED,
  CONTACT_NOTE_CREATED,
  DEAL_CREATED,
  DEAL_NOTE_CREATED,
} from "./consts";

export type SignUpData = {
  email: string;
  locale?: string;
  password: string;
  first_name: string;
  last_name: string;
};

export type SalesFormData = {
  avatar: string;
  email: string;
  password: string;
  first_name: string;
  last_name: string;
  administrator: boolean;
  disabled: boolean;
};

export type Sale = {
  first_name: string;
  last_name: string;
  administrator: boolean;
  avatar?: RAFile;
  disabled?: boolean;
  user_id: string;

  /**
   * This is a copy of the user's email, to make it easier to handle by react admin
   * DO NOT UPDATE this field directly, it should be updated by the backend
   */
  email: string;

  /**
   * This is used by the fake rest provider to store the password
   * DO NOT USE this field in your code besides the fake rest provider
   * @deprecated
   */
  password?: string;
} & Pick<RaRecord, "id">;

export type Company = {
  name: string;
  logo: RAFile;
  sector: string;
  size: 1 | 10 | 50 | 250 | 500;
  linkedin_url: string;
  website: string;
  phone_number: string;
  address: string;
  zipcode: string;
  city: string;
  stateAbbr: string;
  sales_id: Identifier;
  created_at: string;
  description: string;
  revenue: string;
  tax_identifier: string;
  country: string;
  context_links?: string[];
  nb_contacts?: number;
  nb_deals?: number;
  nb_notes?: number;
  nb_tasks?: number;
  nb_invoices?: number;
  last_seen?: string;

  // Phase 1: Lifecycle & Classification
  updated_at?: string;
  lifecycle_stage?: string;
  company_type?: string;
  qualification_status?: string;

  // Phase 1: External Integration
  external_id?: string;
  external_system?: string;

  // Phase 1: Contact Information
  email?: string;

  // Phase 1: Firmographics
  industry?: string;
  revenue_range?: string;
  employee_count?: number;
  founded_year?: number;

  // Phase 1: Social & Enrichment
  social_profiles?: Record<string, string>;
  logo_url?: string;

  // Phase 2: External Heartbeat
  external_heartbeat_status?: string;
  external_heartbeat_checked_at?: string;

  // Phase 2: Internal Heartbeat
  internal_heartbeat_status?: string;
  internal_heartbeat_score?: number;
  internal_heartbeat_updated_at?: string;

  // View-computed fields
  last_note_date?: string;
  last_deal_activity?: string;
  last_task_activity?: string;
  days_since_last_activity?: number;
  total_deal_amount?: number;
} & Pick<RaRecord, "id">;

export type EmailAndType = {
  email: string;
  type: "Work" | "Home" | "Other";
};

export type PhoneNumberAndType = {
  number: string;
  type: "Work" | "Home" | "Other";
};

export type Contact = {
  first_name: string;
  last_name: string;
  title: string;
  company_id: Identifier;
  email_jsonb: EmailAndType[];
  avatar?: Partial<RAFile>;
  linkedin_url?: string | null;
  first_seen: string;
  last_seen: string;
  has_newsletter: boolean;
  tags: Identifier[];
  gender: string;
  sales_id: Identifier;
  status: string;
  background: string;
  phone_jsonb: PhoneNumberAndType[];
  nb_tasks?: number;
  nb_invoices?: number;
  company_name?: string;

  // Internal Heartbeat
  internal_heartbeat_score?: number;
  internal_heartbeat_status?: string; // 'strong' | 'active' | 'cooling' | 'cold' | 'dormant'
  internal_heartbeat_updated_at?: string;

  // External Heartbeat
  external_heartbeat_status?: string; // 'valid' | 'warning' | 'invalid' | 'unknown'
  external_heartbeat_checked_at?: string;
  email_validation_status?: string; // 'valid' | 'risky' | 'invalid' | 'unknown'
  email_last_bounced_at?: string;
  linkedin_profile_status?: string; // 'active' | 'inactive' | 'not_found' | 'unknown'
  employment_verified_at?: string;

  // View-computed fields
  nb_completed_tasks?: number;
  task_completion_rate?: number;
  last_note_date?: string;
  last_task_activity?: string;
  days_since_last_activity?: number;
} & Pick<RaRecord, "id">;

export type ContactNote = {
  contact_id: Identifier;
  text: string;
  date: string;
  sales_id: Identifier;
  status: string;
  attachments?: AttachmentNote[];
} & Pick<RaRecord, "id">;

export type Deal = {
  name: string;
  company_id: Identifier;
  contact_ids: Identifier[];
  category: string;
  stage: string;
  description: string;
  amount: number;
  created_at: string;
  updated_at: string;
  archived_at?: string;
  expected_closing_date: string;
  sales_id: Identifier;
  index: number;
  nb_invoices?: number;
} & Pick<RaRecord, "id">;

export type DealNote = {
  deal_id: Identifier;
  text: string;
  date: string;
  sales_id: Identifier;
  attachments?: AttachmentNote[];

  // This is defined for compatibility with `ContactNote`
  status?: undefined;
} & Pick<RaRecord, "id">;

export type CompanyNote = {
  company_id: Identifier;
  text: string;
  date: string;
  sales_id: Identifier;
  attachments?: AttachmentNote[];

  // This is defined for compatibility with `ContactNote`
  status?: undefined;
} & Pick<RaRecord, "id">;

export type Tag = {
  name: string;
  color: string;
} & Pick<RaRecord, "id">;

export type TaskPriority = "low" | "medium" | "high" | "urgent";

export type TaskStatus =
  | "todo"
  | "in_progress"
  | "blocked"
  | "done"
  | "cancelled";

export type Task = {
  contact_id?: Identifier | null;
  company_id?: Identifier | null;
  deal_id?: Identifier | null;
  type: string;
  text: string;
  due_date: string;
  done_date?: string | null;
  sales_id?: Identifier;
  priority?: TaskPriority;
  assigned_to?: Identifier;
  status?: TaskStatus;
  index?: number;
  created_at?: string;
  updated_at?: string;
  archived?: boolean;
  archived_at?: string;
} & Pick<RaRecord, "id">;

export type TaskSummary = Task & {
  contact_first_name?: string;
  contact_last_name?: string;
  contact_email?: string;
  company_id?: Identifier;
  company_name?: string;
  deal_name?: string;
  assigned_first_name?: string;
  assigned_last_name?: string;
  creator_first_name?: string;
  creator_last_name?: string;
  nb_notes?: number;
  last_note_date?: string;
};

export type TaskNote = {
  task_id: Identifier;
  text: string;
  date: string;
  sales_id: Identifier;
  status?: string;
  created_at?: string;
  updated_at?: string;
} & Pick<RaRecord, "id">;

export type TaskActivity = {
  task_id: Identifier;
  sales_id: Identifier;
  action: string;
  field_name?: string;
  old_value?: string;
  new_value?: string;
  created_at: string;
} & Pick<RaRecord, "id">;

export type ActivityCompanyCreated = {
  type: typeof COMPANY_CREATED;
  company_id: Identifier;
  company: Company;
  sales_id: Identifier;
  date: string;
} & Pick<RaRecord, "id">;

export type ActivityContactCreated = {
  type: typeof CONTACT_CREATED;
  company_id: Identifier;
  sales_id?: Identifier;
  contact: Contact;
  date: string;
} & Pick<RaRecord, "id">;

export type ActivityContactNoteCreated = {
  type: typeof CONTACT_NOTE_CREATED;
  sales_id?: Identifier;
  contactNote: ContactNote;
  date: string;
} & Pick<RaRecord, "id">;

export type ActivityDealCreated = {
  type: typeof DEAL_CREATED;
  company_id: Identifier;
  sales_id?: Identifier;
  deal: Deal;
  date: string;
};

export type ActivityDealNoteCreated = {
  type: typeof DEAL_NOTE_CREATED;
  sales_id?: Identifier;
  dealNote: DealNote;
  date: string;
};

export type ActivityCompanyNoteCreated = {
  type: typeof COMPANY_NOTE_CREATED;
  sales_id?: Identifier;
  companyNote: CompanyNote;
  date: string;
};

export type Activity = RaRecord &
  (
    | ActivityCompanyCreated
    | ActivityContactCreated
    | ActivityContactNoteCreated
    | ActivityDealCreated
    | ActivityDealNoteCreated
    | ActivityCompanyNoteCreated
  );

export interface RAFile {
  src: string;
  title: string;
  path?: string;
  rawFile: File;
  type?: string;
}

export type AttachmentNote = RAFile;
export interface DealStage {
  value: string;
  label: string;
}

export interface NoteStatus {
  value: string;
  label: string;
  color: string;
}

export interface ContactGender {
  value: string;
  label: string;
  icon: ComponentType<{ className?: string }>;
}

// ============================================================================
// INVOICE TYPES
// ============================================================================

export type InvoiceStatus = 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled';

export type InvoiceItemType = 'service' | 'product' | 'hour' | 'day' | 'deposit';

export type Invoice = {
  invoice_number: string;
  reference?: string;
  company_id?: Identifier;
  contact_id?: Identifier;
  deal_id?: Identifier;
  sales_id?: Identifier;
  status: InvoiceStatus;
  issue_date: string;
  due_date: string;
  paid_at?: string;
  currency: string; // ISO 4217 currency code
  subtotal: number;
  discount: number; // Global discount amount
  discount_type: 'fixed' | 'percentage';
  tax_total: number;
  total: number;
  amount_paid: number;
  notes?: string;
  payment_terms?: string;
  terms_and_conditions?: string;
  sent_at?: string;
  viewed_at?: string;
  created_at: string;
  updated_at: string;

  // View-computed fields (from invoices_summary)
  company_name?: string;
  contact_name?: string;
  contact_email?: EmailAndType[];
  deal_name?: string;
  sales_name?: string;
  nb_items?: number;
  nb_notes?: number;
  computed_status?: string;
  days_overdue?: number;
  balance_due?: number;
} & Pick<RaRecord, 'id'>;

export type InvoiceItem = {
  invoice_id: Identifier;
  description: string;
  item_description?: string; // Extended detailed description
  quantity: number;
  unit_price: number;
  tax_rate: number;
  tax_name?: string;
  tax_amount: number;
  item_type: InvoiceItemType;
  line_total: number;
  line_total_with_tax: number;
  sort_order: number;
} & Pick<RaRecord, 'id'>;

export type InvoiceNote = {
  invoice_id: Identifier;
  text: string;
  date: string;
  sales_id?: Identifier;
  attachments?: AttachmentNote[];
} & Pick<RaRecord, 'id'>;

export type TaxPreset = {
  name: string;
  region: string;
  tax_rate: number;
  description?: string;
  is_active: boolean;
  created_at: string;
} & Pick<RaRecord, 'id'>;

