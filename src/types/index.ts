export interface Category {
  id: string;
  name: string;
  slug: string;
  description: string | null;
}

export interface Author {
  id: string;
  github_username: string;
  display_name: string | null;
  avatar_url: string | null;
  github_url: string | null;
  is_org: boolean;
}

export interface Package {
  id: string;
  name: string;
  scope: string | null;
  description: string | null;
  category_id: string | null;
  author_id: string | null;
  tags: string[];
  npm_url: string | null;
  repo_url: string | null;
  docs_url: string | null;
  issues_url: string | null;
  // Social proof metrics
  weekly_downloads: number;
  github_stars: number;
  bundle_size_gzip: number | null;
  license: string | null;
  has_types: boolean;
  open_issues_count: number;
  latest_version: string | null;
  last_published_at: string | null;
  metrics_updated_at: string | null;
  created_at: string;
  updated_at: string;
  // Joined relations (optional)
  category?: Category;
  author?: Author;
}

export interface UserFavorite {
  user_id: string;
  package_id: string;
  created_at: string;
}

export interface Collection {
  id: string;
  user_id: string;
  name: string;
  description: string | null;
  is_public: boolean;
  created_at: string;
}

export interface CollectionPackage {
  collection_id: string;
  package_id: string;
  added_at: string;
}

export type SortOption = 'downloads' | 'stars' | 'recent' | 'name';
