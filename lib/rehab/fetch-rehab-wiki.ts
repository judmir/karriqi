import { REHAB_WIKI_PAGES } from "@/modules/rehab/neuro-rehab-2026/wiki-content";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

export async function ensureRehabWikiPagesSeeded(): Promise<void> {
  const admin = createAdminClient();
  if (!admin) {
    return;
  }

  const { count, error: countError } = await admin
    .from("rehab_wiki_pages")
    .select("slug", { count: "exact", head: true });

  if (countError) {
    throw new Error(countError.message);
  }

  if (count && count > 0) {
    return;
  }

  const rows = REHAB_WIKI_PAGES.map((page) => ({
    slug: page.slug,
    title: page.title,
    body: page.body,
    parent_slug: page.parentSlug,
    sort_order: page.sortOrder,
  }));

  const { error } = await admin.from("rehab_wiki_pages").insert(rows);

  if (error) {
    throw new Error(error.message);
  }
}

export async function fetchRehabWikiPages() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("rehab_wiki_pages")
    .select("slug, title, body, parent_slug, sort_order")
    .order("sort_order", { ascending: true });

  if (error) {
    throw new Error(error.message);
  }

  if (!data?.length) {
    return REHAB_WIKI_PAGES;
  }

  return data.map((row) => ({
    slug: row.slug,
    title: row.title,
    body: row.body,
    parentSlug: row.parent_slug,
    sortOrder: row.sort_order,
  }));
}

export async function fetchRehabWikiPageBySlug(slug: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("rehab_wiki_pages")
    .select("slug, title, body, parent_slug, sort_order")
    .eq("slug", slug)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  if (!data) {
    return REHAB_WIKI_PAGES.find((page) => page.slug === slug) ?? null;
  }

  return {
    slug: data.slug,
    title: data.title,
    body: data.body,
    parentSlug: data.parent_slug,
    sortOrder: data.sort_order,
  };
}
