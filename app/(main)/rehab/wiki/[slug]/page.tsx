import { redirect } from "next/navigation";

import {
  RehabWikiLayout,
  RehabWikiPageView,
} from "@/components/rehab/rehab-wiki-layout";
import { ROUTES } from "@/config/routes";
import {
  ensureRehabWikiPagesSeeded,
  fetchRehabWikiPageBySlug,
  fetchRehabWikiPages,
} from "@/lib/rehab/fetch-rehab-wiki";
import { isSupabaseConfigured } from "@/lib/env";
import { REHAB_WIKI_PAGES } from "@/modules/rehab/neuro-rehab-2026/wiki-content";

type RehabWikiSlugPageProps = {
  params: Promise<{ slug: string }>;
};

export default async function RehabWikiSlugPage({ params }: RehabWikiSlugPageProps) {
  const { slug } = await params;

  if (!isSupabaseConfigured()) {
    const page = REHAB_WIKI_PAGES.find((p) => p.slug === slug);
    if (!page) {
      redirect(ROUTES.rehabWikiOverview);
    }
    return (
      <RehabWikiLayout pages={REHAB_WIKI_PAGES} activeSlug={slug}>
        <RehabWikiPageView page={page} />
      </RehabWikiLayout>
    );
  }

  await ensureRehabWikiPagesSeeded();
  const [pages, page] = await Promise.all([
    fetchRehabWikiPages(),
    fetchRehabWikiPageBySlug(slug),
  ]);

  if (!page) {
    redirect(ROUTES.rehabWikiOverview);
  }

  return (
    <RehabWikiLayout pages={pages} activeSlug={slug}>
      <RehabWikiPageView page={page} />
    </RehabWikiLayout>
  );
}
