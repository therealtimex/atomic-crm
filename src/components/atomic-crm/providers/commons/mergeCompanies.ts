import type { Identifier, DataProvider } from "ra-core";

import type { Company, Contact, Deal } from "../../types";

/**
 * Merge one company (loser) into another company (winner).
 *
 * This function copies properties from the loser to the winner company,
 * transfers all associated data (contacts, deals) from the loser to the winner,
 * and deletes the loser company.
 */
export const mergeCompanies = async (
  loserId: Identifier,
  winnerId: Identifier,
  dataProvider: DataProvider,
) => {
  // Fetch both companies using dataProvider to get fresh data
  const { data: winnerCompany } = await dataProvider.getOne<Company>(
    "companies",
    { id: winnerId },
  );
  const { data: loserCompany } = await dataProvider.getOne<Company>(
    "companies",
    { id: loserId },
  );

  if (!winnerCompany || !loserCompany) {
    throw new Error("Could not fetch companies");
  }

  // 1. Reassign all contacts from loser to winner
  const { data: loserContacts } = await dataProvider.getManyReference<Contact>(
    "contacts",
    {
      target: "company_id",
      id: loserId,
      pagination: { page: 1, perPage: 1000 },
      sort: { field: "id", order: "ASC" },
      filter: {},
    },
  );

  const contactUpdates =
    loserContacts?.map((contact) =>
      dataProvider.update("contacts", {
        id: contact.id,
        data: { company_id: winnerId },
        previousData: contact,
      }),
    ) || [];

  // 2. Reassign all deals from loser to winner
  const { data: loserDeals } = await dataProvider.getManyReference<Deal>(
    "deals",
    {
      target: "company_id",
      id: loserId,
      pagination: { page: 1, perPage: 1000 },
      sort: { field: "id", order: "ASC" },
      filter: {},
    },
  );

  const dealUpdates =
    loserDeals?.map((deal) =>
      dataProvider.update<Deal>("deals", {
        id: deal.id,
        data: { company_id: winnerId },
        previousData: deal,
      }),
    ) || [];

  // 3. Update winner company with loser data
  const mergedContextLinks = mergeArraysUnique(
    winnerCompany.context_links || [],
    loserCompany.context_links || [],
  );

  // Merge social profiles from both companies
  const mergedSocialProfiles = {
    ...(loserCompany.social_profiles || {}),
    ...(winnerCompany.social_profiles || {}),
  };

  const winnerUpdate = dataProvider.update<Company>("companies", {
    id: winnerId,
    data: {
      logo:
        winnerCompany.logo && winnerCompany.logo.src
          ? winnerCompany.logo
          : loserCompany.logo,
      sector: winnerCompany.sector ?? loserCompany.sector,
      size: winnerCompany.size ?? loserCompany.size,
      linkedin_url: winnerCompany.linkedin_url || loserCompany.linkedin_url,
      website: winnerCompany.website || loserCompany.website,
      phone_number: winnerCompany.phone_number ?? loserCompany.phone_number,
      address: winnerCompany.address ?? loserCompany.address,
      zipcode: winnerCompany.zipcode ?? loserCompany.zipcode,
      city: winnerCompany.city ?? loserCompany.city,
      stateAbbr: winnerCompany.stateAbbr ?? loserCompany.stateAbbr,
      country: winnerCompany.country ?? loserCompany.country,
      description: winnerCompany.description ?? loserCompany.description,
      revenue: winnerCompany.revenue ?? loserCompany.revenue,
      tax_identifier:
        winnerCompany.tax_identifier ?? loserCompany.tax_identifier,
      sales_id: winnerCompany.sales_id ?? loserCompany.sales_id,
      context_links: mergedContextLinks,

      // Phase 1: Lifecycle & Classification (prefer winner's values)
      lifecycle_stage: winnerCompany.lifecycle_stage ?? loserCompany.lifecycle_stage,
      company_type: winnerCompany.company_type ?? loserCompany.company_type,
      qualification_status: winnerCompany.qualification_status ?? loserCompany.qualification_status,

      // Phase 1: External Integration (prefer winner's values)
      external_id: winnerCompany.external_id ?? loserCompany.external_id,
      external_system: winnerCompany.external_system ?? loserCompany.external_system,

      // Phase 1: Contact Information (prefer winner's email)
      email: winnerCompany.email ?? loserCompany.email,

      // Phase 1: Firmographics (prefer winner's values)
      industry: winnerCompany.industry ?? loserCompany.industry,
      revenue_range: winnerCompany.revenue_range ?? loserCompany.revenue_range,
      employee_count: winnerCompany.employee_count ?? loserCompany.employee_count,
      founded_year: winnerCompany.founded_year ?? loserCompany.founded_year,

      // Phase 1: Social & Enrichment (merge social profiles, prefer winner's logo_url)
      social_profiles: mergedSocialProfiles,
      logo_url: winnerCompany.logo_url ?? loserCompany.logo_url,

      // Phase 2: Heartbeat (take the better/higher heartbeat score)
      external_heartbeat_status: winnerCompany.external_heartbeat_status ?? loserCompany.external_heartbeat_status,
      external_heartbeat_checked_at:
        winnerCompany.external_heartbeat_checked_at ?? loserCompany.external_heartbeat_checked_at,

      // For internal heartbeat, take the higher score (better engagement)
      internal_heartbeat_score: Math.max(
        winnerCompany.internal_heartbeat_score ?? 0,
        loserCompany.internal_heartbeat_score ?? 0
      ) || undefined,
      internal_heartbeat_status:
        (winnerCompany.internal_heartbeat_score ?? 0) >= (loserCompany.internal_heartbeat_score ?? 0)
          ? winnerCompany.internal_heartbeat_status
          : loserCompany.internal_heartbeat_status,
      internal_heartbeat_updated_at:
        winnerCompany.internal_heartbeat_updated_at ?? loserCompany.internal_heartbeat_updated_at,
    },
    previousData: winnerCompany,
  });

  // Execute all updates
  await Promise.all([...contactUpdates, ...dealUpdates, winnerUpdate]);

  // 4. Delete the loser company
  await dataProvider.delete<Company>("companies", {
    id: loserId,
    previousData: loserCompany,
  });
};

// Helper function to merge arrays and remove duplicates
const mergeArraysUnique = <T>(arr1: T[], arr2: T[]): T[] => [
  ...new Set([...arr1, ...arr2]),
];
