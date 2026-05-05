-- Drop the overly permissive delete policy that allows any authenticated user to delete any package.
-- The owner-only policy from 20250105 ("Users can delete own packages") is the correct one.
drop policy if exists "authenticated delete packages" on packages;

-- Also tighten update: only the user who added the package (or the package has no owner yet) can update it.
drop policy if exists "authenticated update packages" on packages;
create policy "owner update packages" on packages for update to authenticated
  using (added_by = auth.uid() or added_by is null)
  with check (added_by = auth.uid() or added_by is null);
