import { furnitureFootprint } from "@/lib/home/layout-validation";
import type { Room, RoomOpening } from "@/modules/home/apartment-model";
import type { RoomLayout } from "@/types/home";

const PAD_CM = 90;

/**
 * Exact top-down plan of a single room. Walls, doors, windows, and dimensions
 * come straight from the fixed geometry; furniture (if a layout is provided) is
 * drawn to scale on top. 1 SVG unit = 1 cm.
 */
export function RoomPlanSvg({
  room,
  layout,
}: {
  room: Room;
  layout?: RoomLayout | null;
}) {
  const vbWidth = room.widthCm + PAD_CM * 2;
  const vbHeight = room.depthCm + PAD_CM * 2;
  const ox = PAD_CM;
  const oy = PAD_CM;

  return (
    <svg
      viewBox={`0 0 ${vbWidth} ${vbHeight}`}
      className="h-auto w-full"
      role="img"
      aria-label={`${room.name} plan, ${room.widthCm} by ${room.depthCm} centimeters`}
    >
      {/* Room floor + walls */}
      <rect
        x={ox}
        y={oy}
        width={room.widthCm}
        height={room.depthCm}
        style={{
          fill: "var(--muted)",
          stroke: "var(--foreground)",
          strokeWidth: 8,
        }}
      />

      {/* Openings */}
      {room.openings.map((o) => (
        <Opening key={o.id} room={room} opening={o} ox={ox} oy={oy} />
      ))}

      {/* Furniture */}
      {layout?.furniture.map((item, i) => {
        const rect = furnitureFootprint(item);
        const w = rect.maxX - rect.minX;
        const h = rect.maxY - rect.minY;
        return (
          <g key={`${item.label}-${i}`}>
            <rect
              x={ox + rect.minX}
              y={oy + rect.minY}
              width={w}
              height={h}
              rx={4}
              style={{
                fill: "var(--accent)",
                stroke: "var(--ring)",
                strokeWidth: 3,
                opacity: 0.9,
              }}
            />
            <text
              x={ox + rect.minX + w / 2}
              y={oy + rect.minY + h / 2}
              textAnchor="middle"
              dominantBaseline="middle"
              style={{ fill: "var(--foreground)", fontSize: 20 }}
            >
              {item.label}
            </text>
          </g>
        );
      })}

      {/* Width dimension (top) */}
      <text
        x={ox + room.widthCm / 2}
        y={oy - 30}
        textAnchor="middle"
        style={{ fill: "var(--muted-foreground)", fontSize: 30 }}
      >
        {room.widthCm} cm ({(room.widthCm / 100).toFixed(2)} m)
      </text>

      {/* Depth dimension (left, rotated) */}
      <text
        x={ox - 34}
        y={oy + room.depthCm / 2}
        textAnchor="middle"
        transform={`rotate(-90 ${ox - 34} ${oy + room.depthCm / 2})`}
        style={{ fill: "var(--muted-foreground)", fontSize: 30 }}
      >
        {room.depthCm} cm ({(room.depthCm / 100).toFixed(2)} m)
      </text>
    </svg>
  );
}

function Opening({
  room,
  opening,
  ox,
  oy,
}: {
  room: Room;
  opening: RoomOpening;
  ox: number;
  oy: number;
}) {
  const isDoor = opening.kind === "door";
  const stroke = isDoor ? "var(--ring)" : "var(--primary)";
  const start = opening.offsetCm;
  const w = opening.widthCm;

  // Endpoints of the opening along its wall, in SVG coords.
  let x1 = ox;
  let y1 = oy;
  let x2 = ox;
  let y2 = oy;
  switch (opening.wall) {
    case "north":
      x1 = ox + start;
      y1 = oy;
      x2 = ox + start + w;
      y2 = oy;
      break;
    case "south":
      x1 = ox + start;
      y1 = oy + room.depthCm;
      x2 = ox + start + w;
      y2 = oy + room.depthCm;
      break;
    case "west":
      x1 = ox;
      y1 = oy + start;
      x2 = ox;
      y2 = oy + start + w;
      break;
    case "east":
    default:
      x1 = ox + room.widthCm;
      y1 = oy + start;
      x2 = ox + room.widthCm;
      y2 = oy + start + w;
      break;
  }

  return (
    <g>
      {/* Clear the wall segment so the opening reads as a gap */}
      <line
        x1={x1}
        y1={y1}
        x2={x2}
        y2={y2}
        style={{ stroke: "var(--muted)", strokeWidth: 12 }}
      />
      <line
        x1={x1}
        y1={y1}
        x2={x2}
        y2={y2}
        style={{
          stroke,
          strokeWidth: isDoor ? 6 : 10,
          strokeDasharray: isDoor ? undefined : "2 0",
        }}
      />
    </g>
  );
}
