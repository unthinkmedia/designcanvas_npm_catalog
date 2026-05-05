-- Add favorite_count column to packages
alter table public.packages
  add column if not exists favorite_count integer not null default 0;

-- Backfill existing counts
update public.packages p
set favorite_count = (
  select count(*) from public.user_favorites uf where uf.package_id = p.id
);

-- Trigger function to keep favorite_count in sync
create or replace function public.update_favorite_count()
returns trigger as $$
begin
  if tg_op = 'INSERT' then
    update public.packages set favorite_count = favorite_count + 1
    where id = new.package_id;
    return new;
  elsif tg_op = 'DELETE' then
    update public.packages set favorite_count = favorite_count - 1
    where id = old.package_id;
    return old;
  end if;
  return null;
end;
$$ language plpgsql security definer;

-- Create trigger on user_favorites
drop trigger if exists trg_update_favorite_count on public.user_favorites;
create trigger trg_update_favorite_count
  after insert or delete on public.user_favorites
  for each row execute function public.update_favorite_count();
