import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, apikey",
};

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  if (req.method !== "GET") {
    return jsonResponse({ error: "Method not allowed" }, 405);
  }

  const url = new URL(req.url);
  const params = url.searchParams;

  // Parse query params
  const section = params.get("section")?.split(",").filter(Boolean) ?? [];
  const search = params.get("search")?.trim() ?? "";
  const tag = params.get("tag")?.trim() ?? "";
  const hasTypes = params.get("hasTypes");
  const license = params.get("license")?.trim() ?? "";
  const author = params.get("author")?.trim() ?? "";
  const minDownloads = parseInt(params.get("minDownloads") ?? "0", 10) || 0;
  const sort = params.get("sort") ?? "downloads";
  const page = Math.max(1, parseInt(params.get("page") ?? "1", 10) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(params.get("limit") ?? "25", 10) || 25));
  const all = params.get("all") === "true";

  // Validate sort
  const sortOptions: Record<string, { column: string; ascending: boolean }> = {
    downloads: { column: "weekly_downloads", ascending: false },
    loved: { column: "favorite_count", ascending: false },
    recent: { column: "last_published_at", ascending: false },
    name: { column: "name", ascending: true },
  };

  if (!sortOptions[sort]) {
    return jsonResponse({ error: `Invalid sort. Use: ${Object.keys(sortOptions).join(", ")}` }, 400);
  }

  // Create Supabase client
  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const supabase = createClient(supabaseUrl, supabaseKey);

  try {
    // Build query
    let query = supabase
      .from("packages")
      .select("*, categories(*), author:authors(*)", { count: "exact" })
      .order(sortOptions[sort].column, { ascending: sortOptions[sort].ascending });

    // Apply filters
    if (search) {
      query = query.or(`name.ilike.%${search}%,description.ilike.%${search}%`);
    }
    if (tag) {
      query = query.contains("tags", [tag]);
    }
    if (hasTypes === "true") {
      query = query.eq("has_types", true);
    } else if (hasTypes === "false") {
      query = query.eq("has_types", false);
    }
    if (license) {
      query = query.ilike("license", license);
    }
    if (author) {
      query = query.eq("author.github_username", author);
    }
    if (minDownloads > 0) {
      query = query.gte("weekly_downloads", minDownloads);
    }

    // Pagination (skip if requesting all)
    if (!all) {
      const offset = (page - 1) * limit;
      query = query.range(offset, offset + limit - 1);
    }

    const { data, error, count } = await query;

    if (error) {
      return jsonResponse({ error: error.message }, 500);
    }

    // Client-side section filter (many-to-many requires post-filter)
    let results = data ?? [];
    if (section.length > 0) {
      results = results.filter((pkg: any) =>
        pkg.categories?.some((cat: any) => section.includes(cat.slug))
      );
    }

    // Get section counts
    const sectionCounts = buildSectionCounts(results);

    const total = section.length > 0 ? results.length : (count ?? results.length);
    const totalPages = all ? 1 : Math.ceil(total / limit);

    // Build active filters object
    const filters: Record<string, any> = {};
    if (section.length) filters.section = section;
    if (search) filters.search = search;
    if (tag) filters.tag = tag;
    if (hasTypes) filters.hasTypes = hasTypes === "true";
    if (license) filters.license = license;
    if (author) filters.author = author;
    if (minDownloads > 0) filters.minDownloads = minDownloads;

    const response = {
      meta: {
        total,
        page: all ? 1 : page,
        limit: all ? total : limit,
        totalPages,
        sort,
        ...(Object.keys(filters).length > 0 && { filters }),
      },
      sections: sectionCounts,
      data: results,
    };

    return jsonResponse(response, 200, {
      "Cache-Control": "public, max-age=300",
    });
  } catch (err) {
    return jsonResponse({ error: "Internal server error" }, 500);
  }
});

function buildSectionCounts(packages: any[]): { slug: string; name: string; count: number }[] {
  const map = new Map<string, { name: string; count: number }>();

  for (const pkg of packages) {
    for (const cat of pkg.categories ?? []) {
      const existing = map.get(cat.slug);
      if (existing) {
        existing.count++;
      } else {
        map.set(cat.slug, { name: cat.name, count: 1 });
      }
    }
  }

  return Array.from(map.entries())
    .map(([slug, { name, count }]) => ({ slug, name, count }))
    .sort((a, b) => b.count - a.count);
}

function jsonResponse(body: any, status: number, extraHeaders: Record<string, string> = {}) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "Content-Type": "application/json",
      ...corsHeaders,
      ...extraHeaders,
    },
  });
}
