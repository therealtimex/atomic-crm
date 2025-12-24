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
