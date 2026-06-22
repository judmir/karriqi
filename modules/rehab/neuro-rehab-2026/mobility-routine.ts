import {
  serializeEventDescription,
  type EventSubtask,
} from "@/lib/calendar/event-subtasks";

/** Source: https://www.youtube.com/watch?v=WL6VSc5XQ-8 */
const MOBILITY_VIDEO_ID = "WL6VSc5XQ-8";

function youtubeAt(seconds: number): string {
  return `https://youtu.be/${MOBILITY_VIDEO_ID}?t=${seconds}`;
}

function linkSubtask(id: string, label: string, url: string): EventSubtask {
  return {
    id,
    label,
    done: false,
    referenceLabel: "Link",
    referenceUrl: url,
  };
}

/** Five daily mobility exercises with YouTube timestamp links. */
export const MOBILITY_SUBTASKS: EventSubtask[] = [
  linkSubtask(
    "mobility-hamstrings",
    "Hamstrings",
    youtubeAt(78),
  ),
  linkSubtask(
    "mobility-deep-squat",
    "Deep squat",
    youtubeAt(134),
  ),
  linkSubtask(
    "mobility-couch-stretch",
    "Couch stretch",
    youtubeAt(186),
  ),
  linkSubtask(
    "mobility-stick-overhead-rotation",
    "Stick overhead rotation",
    youtubeAt(236),
  ),
  linkSubtask(
    "mobility-cossack-squat",
    "Cossack squat",
    youtubeAt(279),
  ),
];

export function appendMobilitySubtasks(subtasks: EventSubtask[]): EventSubtask[] {
  return [...subtasks, ...MOBILITY_SUBTASKS];
}

export const MOBILITY_DESCRIPTION =
  serializeEventDescription(
    "## Daily mobility — 5 exercises\n\nFollow each video timestamp. Hold with control; no bouncing. ~10–15 min total.",
    MOBILITY_SUBTASKS,
  ) ?? "";
