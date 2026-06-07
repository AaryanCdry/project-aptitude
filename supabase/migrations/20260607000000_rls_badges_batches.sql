-- RLS policies for badges and batches tables
-- All writes go through createAdminClient() (service role, bypasses RLS).
-- These policies gate direct JWT-authenticated reads as defense-in-depth.

-- ─── badges ──────────────────────────────────────────────────────────────────

ALTER TABLE badges ENABLE ROW LEVEL SECURITY;

-- Students can read their own badges
CREATE POLICY "badges_own_read"
  ON badges FOR SELECT
  TO authenticated
  USING (auth.uid() = student_id);

-- Staff (ADMIN / SUB_ADMIN / MENTOR / SUPER_ADMIN) can read badges
-- for students who belong to the same college; SUPER_ADMIN sees all
CREATE POLICY "badges_staff_read"
  ON badges FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM users AS caller
      JOIN users AS student ON student.id = badges.student_id
      WHERE caller.id = auth.uid()
        AND caller.role IN ('ADMIN', 'SUB_ADMIN', 'MENTOR', 'SUPER_ADMIN')
        AND (
          caller.role = 'SUPER_ADMIN'
          OR caller.college_id = student.college_id
        )
    )
  );

-- No INSERT / UPDATE / DELETE policies: only the service role (admin client)
-- can write to badges. JWT-authenticated users are blocked.

-- ─── batches ─────────────────────────────────────────────────────────────────

ALTER TABLE batches ENABLE ROW LEVEL SECURITY;

-- ADMIN / SUB_ADMIN / MENTOR can read batches scoped to their college.
-- SUPER_ADMIN can read all batches.
CREATE POLICY "batches_staff_read"
  ON batches FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM users
      WHERE users.id = auth.uid()
        AND users.role IN ('ADMIN', 'SUB_ADMIN', 'MENTOR', 'SUPER_ADMIN')
        AND (
          users.role = 'SUPER_ADMIN'
          OR users.college_id = batches.college_id
        )
    )
  );

-- No INSERT / UPDATE / DELETE policies: only the service role can write.
