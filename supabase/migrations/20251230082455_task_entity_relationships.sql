-- Allow tasks to be linked to contacts, companies, or deals (all optional)
-- Make contact_id nullable to allow tasks without a contact
ALTER TABLE tasks ALTER COLUMN contact_id DROP NOT NULL;

-- Add optional relationships to companies and deals
ALTER TABLE tasks ADD COLUMN company_id bigint REFERENCES companies(id) ON DELETE SET NULL;
ALTER TABLE tasks ADD COLUMN deal_id bigint REFERENCES deals(id) ON DELETE SET NULL;

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_tasks_company_id ON tasks(company_id);
CREATE INDEX IF NOT EXISTS idx_tasks_deal_id ON tasks(deal_id);

-- Add constraint to ensure a task links to at most one entity (mutually exclusive)
ALTER TABLE tasks ADD CONSTRAINT chk_single_entity
  CHECK (
    (contact_id IS NOT NULL)::int +
    (company_id IS NOT NULL)::int +
    (deal_id IS NOT NULL)::int <= 1
  );

-- Add comment for documentation
COMMENT ON CONSTRAINT chk_single_entity ON tasks IS
  'Ensures a task can be linked to at most one entity (contact, company, or deal)';
