/**
 * Light theory polish — one clarifying line when base is thin, hard cap at 4 sentences.
 * Original wording — general Stoic themes, not copied from any book.
 */

/** @typedef {"morning"|"midday"|"evening"} StoicSlot */
/** @typedef {"wisdom"|"courage"|"justice"|"temperance"} StoicVirtue */

const VIRTUE_HINT = {
  wisdom: "Wisdom means clear seeing: notice fact vs story, then pick the next useful step.",
  courage: "Courage is useful action while afraid — keep the step safe and scaled.",
  justice: "Justice includes fair treatment of yourself: firm effort without contempt.",
  temperance: "Temperance is the right amount of effort and rest, not maximum force.",
};

const SLOT_HINT = {
  morning: "Set one clear frame before your first rehab activity.",
  midday: "Apply it during one real task — score process, not symptoms.",
  evening: "Review to calibrate; score how you showed up, not whether symptoms changed.",
};

/** @param {string} text */
function countSentences(text) {
  const trimmed = text.trim();
  if (!trimmed) return 0;
  const matches = trimmed.match(/[.!?](\s|$)/g);
  return matches?.length ?? 1;
}

/** @param {string} text @param {number} max */
function truncateToSentences(text, max) {
  const trimmed = text.trim();
  if (!trimmed) return "";
  const parts = trimmed.match(/[^.!?]+[.!?]+(\s|$)?|[^.!?]+$/g) ?? [trimmed];
  return parts.slice(0, max).join("").trim();
}

/** @param {string} text */
function isThinBase(text) {
  return countSentences(text) < 2;
}

/**
 * @param {{ slot: StoicSlot, virtue: StoicVirtue, dayTheme: string, base: string }} input
 */
export function enrichStoicTheory({ slot, virtue, dayTheme, base }) {
  void dayTheme;
  let text = base.trim();

  if (isThinBase(text)) {
    text = `${text} ${VIRTUE_HINT[virtue]}`.trim();
  }

  if (countSentences(text) < 3) {
    text = `${text} ${SLOT_HINT[slot]}`.trim();
  }

  if (slot === "morning" && countSentences(text) < 4) {
    text =
      `${text} This supports attention alongside physical rehab; it is not medical treatment.`.trim();
  }

  return truncateToSentences(text, 4);
}

/**
 * @param {object} row
 */
export function enrichDayDefinition(row) {
  const enrichSlot = (slot, content) => ({
    ...content,
    theory: enrichStoicTheory({
      slot,
      virtue: row.virtue,
      dayTheme: row.dayTheme,
      base: content.theory,
    }),
  });

  return {
    ...row,
    morning: enrichSlot("morning", row.morning),
    midday: enrichSlot("midday", row.midday),
    evening: enrichSlot("evening", row.evening),
  };
}
