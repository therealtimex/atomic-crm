import {
  address,
  company,
  datatype,
  internet,
  lorem,
  phone,
  random,
} from "faker/locale/en_US";

import { randomDate } from "./utils";
import { defaultCompanySectors } from "../../../root/defaultConfiguration";
import type { Company, RAFile } from "../../../types";
import type { Db } from "./types";

const sizes = [1, 10, 50, 250, 500];

const regex = /\W+/;

// New field options
const lifecycleStages = ['prospect', 'customer', 'churned', 'lost', 'archived'];
const companyTypes = ['customer', 'prospect', 'partner', 'vendor', 'competitor'];
const qualificationStatuses = ['qualified', 'unqualified', 'duplicate', 'spam'];
const revenueRanges = ['0-1M', '1M-10M', '10M-50M', '50M-100M', '100M+', 'unknown'];
const industries = ['SaaS', 'E-commerce', 'Healthcare', 'Fintech', 'Manufacturing', 'Consulting', 'Real Estate', 'Education'];
const externalHeartbeats = ['healthy', 'risky', 'dead', 'unknown'];
const internalHeartbeats = ['engaged', 'quiet', 'at_risk', 'unresponsive'];

export const generateCompanies = (db: Db, size = 55): Required<Company>[] => {
  return Array.from(Array(size).keys()).map((id) => {
    const name = company.companyName();
    const createdAt = randomDate();
    const hasLifecycle = datatype.boolean();
    const hasHeartbeat = datatype.number(100) > 40; // 60% have heartbeat computed

    return {
      id,
      name: name,
      logo: {
        title: lorem.text(1),
        src: `./logos/${id}.png`,
      } as RAFile,
      sector: random.arrayElement(defaultCompanySectors),
      size: random.arrayElement(sizes) as 1 | 10 | 50 | 250 | 500,
      linkedin_url: `https://www.linkedin.com/company/${name
        .toLowerCase()
        .replace(regex, "_")}`,
      website: internet.url(),
      phone_number: phone.phoneNumber(),
      address: address.streetAddress(),
      zipcode: address.zipCode(),
      city: address.city(),
      stateAbbr: address.stateAbbr(),
      nb_contacts: 0,
      nb_deals: 0,
      nb_notes: 0,
      nb_tasks: 0,
      // at least 1/3rd of companies for Jane Doe
      sales_id: datatype.number(2) === 0 ? 0 : random.arrayElement(db.sales).id,
      created_at: createdAt.toISOString(),
      description: lorem.paragraph(),
      revenue: random.arrayElement(["$1M", "$10M", "$100M", "$1B"]),
      tax_identifier: random.alphaNumeric(10),
      country: random.arrayElement(["USA", "France", "UK"]),
      context_links: [],

      // Phase 1: Lifecycle & Classification (70% populated)
      updated_at: randomDate(createdAt).toISOString(),
      lifecycle_stage: hasLifecycle ? random.arrayElement(lifecycleStages) : undefined,
      company_type: datatype.number(100) > 30 ? random.arrayElement(companyTypes) : undefined,
      qualification_status: datatype.number(100) > 60 ? random.arrayElement(qualificationStatuses) : undefined,

      // Phase 1: External Integration (20% populated)
      external_id: datatype.number(100) > 80 ? random.alphaNumeric(12) : undefined,
      external_system: datatype.number(100) > 80 ? random.arrayElement(['salesforce', 'hubspot', 'clearbit']) : undefined,

      // Phase 1: Contact Information (70% have email)
      email: datatype.number(100) > 30 ? `info@${internet.domainName()}` : undefined,

      // Phase 1: Firmographics (varies by field)
      industry: datatype.number(100) > 40 ? random.arrayElement(industries) : undefined,
      revenue_range: datatype.number(100) > 50 ? random.arrayElement(revenueRanges) : undefined,
      employee_count: datatype.number(100) > 50 ? datatype.number({ min: 1, max: 10000 }) : undefined,
      founded_year: datatype.number(100) > 60 ? datatype.number({ min: 1990, max: 2023 }) : undefined,

      // Phase 1: Social & Enrichment (30% have social profiles)
      social_profiles: datatype.number(100) > 70 ? {
        linkedin: `https://www.linkedin.com/company/${name.toLowerCase().replace(regex, "_")}`,
        ...(datatype.number(100) > 90 && { x: `https://x.com/${name.toLowerCase().replace(regex, "")}` }),
        ...(datatype.number(100) > 95 && { facebook: `https://facebook.com/${name.toLowerCase().replace(regex, "")}` }),
      } : {},
      logo_url: datatype.number(100) > 60 ? `https://logo.clearbit.com/${internet.domainName()}` : undefined,

      // Phase 2: External Heartbeat (50% computed)
      external_heartbeat_status: datatype.number(100) > 50 ? random.arrayElement(externalHeartbeats) : undefined,
      external_heartbeat_checked_at: datatype.number(100) > 50 ? randomDate(createdAt).toISOString() : undefined,

      // Phase 2: Internal Heartbeat (60% computed)
      internal_heartbeat_status: hasHeartbeat ? random.arrayElement(internalHeartbeats) : undefined,
      internal_heartbeat_score: hasHeartbeat ? datatype.number({ min: 0, max: 100 }) : undefined,
      internal_heartbeat_updated_at: hasHeartbeat ? randomDate(createdAt).toISOString() : undefined,

      // View-computed fields (will be set by view in real DB, defaulted here)
      last_note_date: undefined,
      last_deal_activity: undefined,
      last_task_activity: undefined,
      days_since_last_activity: undefined,
      total_deal_amount: 0,
    };
  });
};
