import {
  addDays,
  addHours,
  addMinutes,
  startOfDay,
} from "date-fns";

import type { CalendarEvent } from "@/types/calendar";

const MOCK_USER_ID = "mock-user";

function at(dayOffset: number, hours: number, minutes = 0): Date {
  const base = startOfDay(new Date());
  return addMinutes(addHours(addDays(base, dayOffset), hours), minutes);
}

function mockEvent(
  id: string,
  title: string,
  start: Date,
  end: Date,
  options: {
    description?: string | null;
    allDay?: boolean;
    color?: CalendarEvent["color"];
  } = {},
): CalendarEvent {
  const now = new Date().toISOString();
  return {
    id,
    userId: MOCK_USER_ID,
    title,
    description: options.description ?? null,
    startAt: start.toISOString(),
    endAt: end.toISOString(),
    allDay: options.allDay ?? false,
    color: options.color ?? "blue",
    createdAt: now,
    updatedAt: now,
  };
}

/** Demo events aligned with the shadcn UI Kit calendar sample. */
export function getMockCalendarEvents(): CalendarEvent[] {
  return [
    mockEvent(
      "mock-001",
      "Annual Planning",
      at(-2, 0),
      at(-2, 23, 59),
      { allDay: true, color: "purple", description: "Q2 goals and team capacity." },
    ),
    mockEvent(
      "mock-002",
      "Quarterly Budget Review",
      at(0, 14),
      at(0, 15, 30),
      { color: "orange", description: "Finance team — bring last quarter numbers." },
    ),
    mockEvent(
      "mock-003",
      "Team Meeting",
      at(1, 10),
      at(1, 11),
      { color: "blue", description: "Weekly sync with product and design." },
    ),
    mockEvent(
      "mock-004",
      "Lunch with Client",
      at(1, 12),
      at(1, 13, 15),
      { color: "green", description: "Downtown bistro — confirm reservation." },
    ),
    mockEvent(
      "mock-005",
      "Project Deadline",
      at(2, 13),
      at(2, 14),
      { color: "red", description: "Final deliverables due to stakeholders." },
    ),
    mockEvent(
      "mock-006",
      "Product Launch",
      at(3, 0),
      at(5, 23, 59),
      { allDay: true, color: "purple", description: "Marketing go-live window." },
    ),
    mockEvent(
      "mock-007",
      "Sales Conference",
      at(4, 14, 30),
      at(4, 16),
      { color: "blue", description: "Keynote at 3pm — arrive early for setup." },
    ),
    mockEvent(
      "mock-008",
      "Marketing Strategy Session",
      at(6, 10),
      at(6, 11, 30),
      { color: "orange" },
    ),
    mockEvent(
      "mock-009",
      "Pay rent",
      at(-1, 9),
      at(-1, 9, 30),
      { color: "red" },
    ),
    mockEvent(
      "mock-010",
      "Dentist appointment",
      at(8, 10),
      at(8, 11),
      { color: "blue", description: "Annual check-up." },
    ),
  ];
}
