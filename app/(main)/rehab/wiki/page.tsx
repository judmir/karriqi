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

export default async function RehabWikiOverviewPage() {
  if (!isSupabaseConfigured()) {
    const page = REHAB_WIKI_PAGES.find((p) => p.slug === "overview")!;
    return (
      <RehabWikiLayout pages={REHAB_WIKI_PAGES} activeSlug="overview">
        <RehabWikiPageView page={page} />
      </RehabWikiLayout>
    );
  }

  await ensureRehabWikiPagesSeeded();
  const [pages, page] = await Promise.all([
    fetchRehabWikiPages(),
    fetchRehabWikiPageBySlug("overview"),
  ]);

  if (!page) {
    redirect(`${ROUTES.rehabWiki}/${REHAB_WIKI_PAGES[0]?.slug ?? "overview"}`);
  }

  return (
    <RehabWikiLayout pages={pages} activeSlug="overview">
      <RehabWikiPageView page={page} />
    </RehabWikiLayout>
  );
}
