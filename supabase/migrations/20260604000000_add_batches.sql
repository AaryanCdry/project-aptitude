-- Batch / Academic Year system
-- Run this in the Supabase SQL editor or via: supabase db push

-- 1. Batches table (college-scoped)
CREATE TABLE IF NOT EXISTS batches (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  college_id  UUID NOT NULL REFERENCES colleges(id) ON DELETE CASCADE,
  name        TEXT NOT NULL,
  start_date  DATE,
  end_date    DATE,
  status      TEXT NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'ARCHIVED')),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS batches_college_id_idx ON batches(college_id);

-- 2. Link classes to a batch (nullable; one class → one batch)
ALTER TABLE classes ADD COLUMN IF NOT EXISTS batch_id UUID REFERENCES batches(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS classes_batch_id_idx ON classes(batch_id);

-- 3. Track which batch a cohort assessment was created for (for analytics)
ALTER TABLE cohort_assessments ADD COLUMN IF NOT EXISTS batch_id UUID REFERENCES batches(id) ON DELETE SET NULL;
