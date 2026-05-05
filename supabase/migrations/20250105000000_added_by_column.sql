-- Add added_by column to track which user added each package
alter table packages add column added_by uuid references auth.users(id);

-- Policy: users can only delete packages they added
create policy "Users can delete own packages"
  on packages for delete
  to authenticated
  using (added_by = auth.uid());
