-- Switch from single-category (FK) to multi-category (join table, max 3 per package)

-- 1. Create junction table
create table package_categories (
  package_id uuid references packages(id) on delete cascade,
  category_id uuid references categories(id) on delete cascade,
  primary key (package_id, category_id)
);

create index idx_package_categories_package on package_categories(package_id);
create index idx_package_categories_category on package_categories(category_id);

-- 2. RLS
alter table package_categories enable row level security;
create policy "public read package_categories" on package_categories for select using (true);

-- 3. Enforce max 3 categories per package via trigger
create or replace function check_max_categories()
returns trigger as $$
begin
  if (select count(*) from package_categories where package_id = NEW.package_id) >= 3 then
    raise exception 'A package can have at most 3 categories';
  end if;
  return NEW;
end;
$$ language plpgsql;

create trigger enforce_max_categories
  before insert on package_categories
  for each row execute function check_max_categories();

-- 4. Migrate existing single-category assignments to the join table
insert into package_categories (package_id, category_id)
select id, category_id from packages where category_id is not null;

-- 5. Drop the old single-category FK column
drop index if exists idx_packages_category;
alter table packages drop column category_id;

-- 6. Remove CLI Control category
delete from categories where slug = 'cli-control';

-- 7. Add new categories
insert into categories (name, slug, description) values
  ('Data & Analytics', 'data-analytics', 'Visualize data, generate charts, and build dashboard analytics'),
  ('Collaboration', 'collaboration', 'Real-time co-editing, presence indicators, and shared workspaces'),
  ('Asset Management', 'asset-management', 'Manage images, icons, fonts, and other media assets'),
  ('Integration', 'integration', 'Connect to external APIs, services, and third-party tools'),
  ('User Testing', 'user-testing', 'Run usability tests, A/B experiments, heatmaps, and session recordings with real users');
