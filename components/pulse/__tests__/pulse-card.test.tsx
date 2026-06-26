import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { PulseCard } from "@/components/pulse/pulse-card";
import type { PulseItem } from "@/types/pulse";

const item: PulseItem = {
  id: "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa",
  userId: "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb",
  title: "BVG U5 weekend replacement buses",
  summary: "Shuttle buses between Alexanderplatz and Hönow on Sat–Sun.",
  whyItMatters: "Affects your commute to Kita drop-off.",
  suggestedAction: "Plan an earlier departure or alternate route.",
  category: "berlin_life",
  impact: "medium",
  urgency: "this_week",
  status: "new",
  sourceType: "cron",
  sourceUrl: "https://example.com/bvg",
  sourceTitle: "BVG service updates",
  startsAt: null,
  dueAt: null,
  expiresAt: null,
  dedupeKey: "bvg-u5",
  confidence: 0.82,
  payload: {},
  createdAt: "2026-06-26T10:00:00.000Z",
  updatedAt: "2026-06-26T10:00:00.000Z",
};

describe("PulseCard", () => {
  it("renders core pulse fields and actions", () => {
    render(
      <PulseCard
        item={item}
        onSave={vi.fn()}
        onDismiss={vi.fn()}
        onMarkActed={vi.fn()}
        onCreateTask={vi.fn()}
      />,
    );

    expect(screen.getByText(item.title)).toBeInTheDocument();
    expect(screen.getByText(item.summary)).toBeInTheDocument();
    expect(screen.getByText(/Why it matters/i)).toBeInTheDocument();
    expect(screen.getByText(/Suggested action/i)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /BVG service updates/i })).toHaveAttribute(
      "href",
      item.sourceUrl,
    );
    expect(screen.getByRole("button", { name: /Save/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Create task/i })).toBeInTheDocument();
  });
});
