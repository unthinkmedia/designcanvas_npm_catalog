-- Add write policies for authenticated users

-- Packages: authenticated users can insert, update, delete
create policy "authenticated insert packages" on packages for insert to authenticated with check (true);
create policy "authenticated update packages" on packages for update to authenticated using (true) with check (true);
create policy "authenticated delete packages" on packages for delete to authenticated using (true);

-- Package categories: authenticated users can insert and delete
create policy "authenticated insert package_categories" on package_categories for insert to authenticated with check (true);
create policy "authenticated delete package_categories" on package_categories for delete to authenticated using (true);

-- Authors: authenticated users can insert and update
create policy "authenticated insert authors" on authors for insert to authenticated with check (true);
create policy "authenticated update authors" on authors for update to authenticated using (true) with check (true);

-- User favorites: users can manage their own favorites
create policy "users insert own favorites" on user_favorites for insert to authenticated with check (auth.uid() = user_id);
create policy "users delete own favorites" on user_favorites for delete to authenticated using (auth.uid() = user_id);
create policy "users read own favorites" on user_favorites for select to authenticated using (auth.uid() = user_id);

-- Collections: users can manage their own collections
create policy "users insert own collections" on collections for insert to authenticated with check (auth.uid() = user_id);
create policy "users update own collections" on collections for update to authenticated using (auth.uid() = user_id);
create policy "users delete own collections" on collections for delete to authenticated using (auth.uid() = user_id);

-- Collection packages: users can manage packages in their own collections
create policy "users insert own collection packages" on collection_packages for insert to authenticated
  with check (exists (select 1 from collections c where c.id = collection_id and c.user_id = auth.uid()));
create policy "users delete own collection packages" on collection_packages for delete to authenticated
  using (exists (select 1 from collections c where c.id = collection_id and c.user_id = auth.uid()));
