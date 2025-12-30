import type { Task } from "../types";

export type EntityType = "none" | "contact" | "company" | "deal";

/**
 * Determines the entity type from a task record
 */
export const getEntityType = (record: Task | undefined): EntityType => {
  if (!record) return "none";
  if (record.contact_id) return "contact";
  if (record.company_id) return "company";
  if (record.deal_id) return "deal";
  return "none";
};

/**
 * Transforms form data to properly set entity relationships
 * Ensures only one entity ID is set and others are nullified
 */
export const transformTaskEntityData = (data: any) => {
  const { entity_type, contact_id, company_id, deal_id, ...rest } = data;

  // Always start with all entity fields set to null
  const entityData: any = {
    contact_id: null,
    company_id: null,
    deal_id: null,
  };

  // Only set the selected entity ID based on entity_type
  if (entity_type === "contact" && contact_id) {
    entityData.contact_id = contact_id;
  } else if (entity_type === "company" && company_id) {
    entityData.company_id = company_id;
  } else if (entity_type === "deal" && deal_id) {
    entityData.deal_id = deal_id;
  }

  return {
    ...rest,
    ...entityData,
  };
};
