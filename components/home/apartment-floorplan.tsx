"use client";

import Link from "next/link";
import { useState } from "react";

import { homeRoomPath } from "@/config/routes";
import {
  apartmentBounds,
  type Apartment,
} from "@/modules/home/apartment-model";

const PADDING_CM = 30;

/**
 * Deterministic top-down overview of the apartment. Rooms are drawn to scale
 * from the fixed geometry and are clickable. Coordinates are in centimeters
 * (1 unit = 1 cm) inside the SVG viewBox.
 */
export function ApartmentFloorplan({ apartment }: { apartment: Apartment }) {
  const bounds = apartmentBounds(apartment);
  const vbWidth = bounds.width + PADDING_CM * 2;
  const vbHeight = bounds.height + PADDING_CM * 2;
  const [hovered, setHovered] = useState<string | null>(null);

  return (
    <svg
      viewBox={`0 0 ${vbWidth} ${vbHeight}`}
      className="h-auto w-full"
      role="group"
      aria-label={`Floorplan of ${apartment.label}`}
    >
      {apartment.rooms.map((room) => {
        const x = room.origin.x - bounds.minX + PADDING_CM;
        const y = room.origin.y - bounds.minY + PADDING_CM;
        const cx = x + room.widthCm / 2;
        const cy = y + room.depthCm / 2;
        const isHovered = hovered === room.id;
        return (
          <Link key={room.id} href={homeRoomPath(room.id)}>
            <g
              className="cursor-pointer"
              onMouseEnter={() => setHovered(room.id)}
              onMouseLeave={() => setHovered((h) => (h === room.id ? null : h))}
            >
              <rect
                x={x}
                y={y}
                width={room.widthCm}
                height={room.depthCm}
                rx={6}
                style={{
                  fill: isHovered ? "var(--accent)" : "var(--card)",
                  stroke: isHovered ? "var(--ring)" : "var(--border)",
                  strokeWidth: 4,
                  transition: "fill 120ms, stroke 120ms",
                }}
              />
              <text
                x={cx}
                y={cy - 6}
                textAnchor="middle"
                style={{
                  fill: "var(--foreground)",
                  fontSize: 34,
                  fontWeight: 600,
                }}
              >
                {room.name}
              </text>
              <text
                x={cx}
                y={cy + 34}
                textAnchor="middle"
                style={{ fill: "var(--muted-foreground)", fontSize: 26 }}
              >
                {room.officialAreaM2.toFixed(1)} m²
              </text>
            </g>
          </Link>
        );
      })}
    </svg>
  );
}
