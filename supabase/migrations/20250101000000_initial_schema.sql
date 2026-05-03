-- Supabase migration: initial schema for npm-catalog

-- Categories
create table categories (
  id uuid primary key default gen_random_uuid(),
  name text unique not null,
  slug text unique not null,
  description text,
  created_at timestamptz default now()
);

-- Authors (npm maintainers / GitHub users)
create table authors (
  id uuid primary key default gen_random_uuid(),
  github_username text unique not null,
  display_name text,
  avatar_url text,
  github_url text,
  is_org boolean default false,
  created_at timestamptz default now()
);

-- Packages
create table packages (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  scope text,
  description text,
  category_id uuid references categories(id),
  author_id uuid references authors(id),
  tags text[] default '{}',
  npm_url text,
  repo_url text,
  docs_url text,
  issues_url text,
  -- Social proof metrics
  weekly_downloads int default 0,
  github_stars int default 0,
  bundle_size_gzip int,
  license text,
  has_types boolean default false,
  open_issues_count int default 0,
  latest_version text,
  last_published_at timestamptz,
  metrics_updated_at timestamptz,
  -- Timestamps
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- User favorites
create table user_favorites (
  user_id uuid references auth.users(id) on delete cascade,
  package_id uuid references packages(id) on delete cascade,
  created_at timestamptz default now(),
  primary key (user_id, package_id)
);

-- User collections
create table collections (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  name text not null,
  description text,
  is_public boolean default false,
  created_at timestamptz default now()
);

create table collection_packages (
  collection_id uuid references collections(id) on delete cascade,
  package_id uuid references packages(id) on delete cascade,
  added_at timestamptz default now(),
  primary key (collection_id, package_id)
);

-- Indexes for common queries
create index idx_packages_category on packages(category_id);
create index idx_packages_author on packages(author_id);
create index idx_packages_weekly_downloads on packages(weekly_downloads desc);
create index idx_packages_github_stars on packages(github_stars desc);
create index idx_packages_tags on packages using gin(tags);
create index idx_user_favorites_user on user_favorites(user_id);
create index idx_collections_user on collections(user_id);

-- Row Level Security
alter table categories enable row level security;
alter table authors enable row level security;
alter table packages enable row level security;
alter table user_favorites enable row level security;
alter table collections enable row level security;
alter table collection_packages enable row level security;

-- Everyone can read
create policy "public read categories" on categories for select using (true);
create policy "public read authors" on authors for select using (true);
create policy "public read packages" on packages for select using (true);
create policy "public read public collections" on collections for select using (is_public = true or auth.uid() = user_id);
create policy "public read collection packages" on collection_packages for select using (
  exists (select 1 from collections c where c.id = collection_id and (c.is_public or c.user_id = auth.uid()))
);

-- Users manage own favorites
create policy "users manage favorites" on user_favorites for all using (auth.uid() = user_id);

-- Users manage own collections
create policy "users manage collections" on collections for all using (auth.uid() = user_id);
create policy "users manage collection packages" on collection_packages for all using (
  exists (select 1 from collections c where c.id = collection_id and c.user_id = auth.uid())
);

-- Seed categories
insert into categories (name, slug, description) values
  ('AI Feedback', 'ai-feedback', 'Get LLM-powered design reviews, layout suggestions, and automated critiques'),
  ('Visual Editing', 'visual-editing', 'Tweak styles, tokens, and layout directly on the canvas'),
  ('Inspection', 'inspection', 'Inspect elements, spacing, box model, and computed styles'),
  ('Annotation', 'annotation', 'Mark up designs, leave comments, and sync feedback to issues'),
  ('Testing & QA', 'testing-qa', 'Run accessibility audits, visual regression checks, and project validations'),
  ('Theming', 'theming', 'Switch themes, compare token sets, and manage design tokens'),
  ('Spec & Handoff', 'spec-handoff', 'Extract specs, generate docs, and bridge designs to code'),
  ('Deploy', 'deploy', 'Ship prototypes and apps to staging and production'),
  ('CLI Control', 'cli-control', 'Scaffold, build, and manage plugins from the command line');
