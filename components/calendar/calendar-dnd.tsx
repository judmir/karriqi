"use client";

import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import {
  createContext,
  useContext,
  useEffect,
  useState,
  type CSSProperties,
  type ReactNode,
} from "react";

import { EventChip } from "@/components/calendar/event-chip";
import {
  moveEventToDay,
  moveEventToTimeSlot,
} from "@/lib/calendar/move-event";
import { cn } from "@/lib/utils";
import type { CalendarEvent } from "@/types/calendar";

const CALENDAR_DND_ID = "karriqi-calendar-dnd";

const CalendarDndEnabledContext = createContext(false);

export function CalendarDndProvider({
  events,
  onEventMoved,
  enabled = true,
  children,
}: {
  events: CalendarEvent[];
  onEventMoved: (event: CalendarEvent) => void;
  /** When false, events cannot be dragged to reschedule. */
  enabled?: boolean;
  children: ReactNode;
}) {
  const [mounted, setMounted] = useState(false);
  const [activeId, setActiveId] = useState<string | null>(null);
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 },
    }),
  );

  useEffect(() => {
    setMounted(true);
  }, []);

  const activeEvent = activeId
    ? events.find((item) => item.id === activeId) ?? null
    : null;

  function handleDragStart(event: DragStartEvent) {
    setActiveId(String(event.active.id));
  }

  function handleDragEnd(event: DragEndEvent) {
    setActiveId(null);

    const { active, over } = event;
    if (!over) {
      return;
    }

    const dragged = events.find((item) => item.id === active.id);
    if (!dragged) {
      return;
    }

    const overData = over.data.current as
      | { type: "day"; day: Date }
      | { type: "slot"; day: Date; hour: number; allDay?: boolean }
      | undefined;

    if (!overData) {
      return;
    }

    if (overData.type === "day") {
      onEventMoved(moveEventToDay(dragged, overData.day));
      return;
    }

    if (overData.type === "slot") {
      onEventMoved(
        moveEventToTimeSlot(
          dragged,
          overData.day,
          overData.hour,
          overData.allDay,
        ),
      );
    }
  }

  if (!enabled || !mounted) {
    return (
      <CalendarDndEnabledContext.Provider value={false}>
        {children}
      </CalendarDndEnabledContext.Provider>
    );
  }

  return (
    <CalendarDndEnabledContext.Provider value={enabled}>
      <DndContext
        id={CALENDAR_DND_ID}
        sensors={sensors}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        {children}
        <DragOverlay dropAnimation={null}>
          {activeEvent ? (
            <EventChip
              event={activeEvent}
              compact
              className="cursor-grabbing shadow-md ring-2 ring-ring"
            />
          ) : null}
        </DragOverlay>
      </DndContext>
    </CalendarDndEnabledContext.Provider>
  );
}

type DraggableEventChipProps = {
  event: CalendarEvent;
  compact?: boolean;
  className?: string;
  style?: CSSProperties;
  onClick?: () => void;
  children?: ReactNode;
};

function DraggableEventChipStatic({
  event,
  compact,
  className,
  style,
  onClick,
  children,
}: DraggableEventChipProps) {
  return (
    <div className={cn("touch-none cursor-pointer", className)} style={style}>
      {children ?? (
        <EventChip event={event} compact={compact} onClick={onClick} />
      )}
    </div>
  );
}

function DraggableEventChipActive(props: DraggableEventChipProps) {
  const { event, compact, className, style, onClick, children } = props;
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: event.id,
    data: { type: "event", event },
  });

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      className={cn(
        "touch-none cursor-pointer",
        isDragging && "opacity-40",
        className,
      )}
    >
      {children ?? (
        <EventChip event={event} compact={compact} onClick={onClick} />
      )}
    </div>
  );
}

export function DraggableEventChip(props: DraggableEventChipProps) {
  const dndEnabled = useContext(CalendarDndEnabledContext);
  if (!dndEnabled) {
    return <DraggableEventChipStatic {...props} />;
  }
  return <DraggableEventChipActive {...props} />;
}

type DroppableDayCellProps = {
  day: Date;
  className?: string;
  onClick?: () => void;
  children: ReactNode;
};

function DroppableDayCellStatic({
  className,
  onClick,
  children,
}: DroppableDayCellProps) {
  return (
    <div onClick={onClick} className={className}>
      {children}
    </div>
  );
}

function DroppableDayCellActive({
  day,
  className,
  onClick,
  children,
}: DroppableDayCellProps) {
  const { setNodeRef, isOver } = useDroppable({
    id: `day-${day.toISOString()}`,
    data: { type: "day", day },
  });

  return (
    <div
      ref={setNodeRef}
      onClick={onClick}
      className={cn(
        className,
        isOver && "bg-primary/5 ring-1 ring-inset ring-primary/25",
      )}
    >
      {children}
    </div>
  );
}

export function DroppableDayCell(props: DroppableDayCellProps) {
  const dndEnabled = useContext(CalendarDndEnabledContext);
  if (!dndEnabled) {
    return <DroppableDayCellStatic {...props} />;
  }
  return <DroppableDayCellActive {...props} />;
}

type DroppableTimeSlotProps = {
  day: Date;
  hour: number;
  allDay?: boolean;
  className?: string;
  style?: CSSProperties;
  onClick?: () => void;
  children?: ReactNode;
  "aria-label"?: string;
};

function DroppableTimeSlotStatic({
  className,
  style,
  onClick,
  children,
  "aria-label": ariaLabel,
}: DroppableTimeSlotProps) {
  return (
    <button
      type="button"
      aria-label={ariaLabel}
      onClick={onClick}
      style={style}
      className={className}
    >
      {children}
    </button>
  );
}

function DroppableTimeSlotActive(props: DroppableTimeSlotProps) {
  const {
    day,
    hour,
    allDay = false,
    className,
    style,
    onClick,
    children,
    "aria-label": ariaLabel,
  } = props;
  const { setNodeRef, isOver } = useDroppable({
    id: `slot-${day.toISOString()}-${hour}-${allDay ? "allday" : "timed"}`,
    data: { type: "slot", day, hour, allDay },
  });

  return (
    <button
      ref={setNodeRef}
      type="button"
      aria-label={ariaLabel}
      onClick={onClick}
      style={style}
      className={cn(className, isOver && "bg-primary/10")}
    >
      {children}
    </button>
  );
}

export function DroppableTimeSlot(props: DroppableTimeSlotProps) {
  const dndEnabled = useContext(CalendarDndEnabledContext);
  if (!dndEnabled) {
    return <DroppableTimeSlotStatic {...props} />;
  }
  return <DroppableTimeSlotActive {...props} />;
}

type DroppableAllDayRowProps = {
  day: Date;
  className?: string;
  children: ReactNode;
};

function DroppableAllDayRowStatic({
  className,
  children,
}: DroppableAllDayRowProps) {
  return <div className={className}>{children}</div>;
}

function DroppableAllDayRowActive({
  day,
  className,
  children,
}: DroppableAllDayRowProps) {
  const { setNodeRef, isOver } = useDroppable({
    id: `allday-${day.toISOString()}`,
    data: { type: "slot", day, hour: 0, allDay: true },
  });

  return (
    <div
      ref={setNodeRef}
      className={cn(className, isOver && "bg-primary/5")}
    >
      {children}
    </div>
  );
}

export function DroppableAllDayRow(props: DroppableAllDayRowProps) {
  const dndEnabled = useContext(CalendarDndEnabledContext);
  if (!dndEnabled) {
    return <DroppableAllDayRowStatic {...props} />;
  }
  return <DroppableAllDayRowActive {...props} />;
}
