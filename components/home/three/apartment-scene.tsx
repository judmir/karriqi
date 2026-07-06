"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls, Text } from "@react-three/drei";

import { CM } from "@/components/home/three/scene-utils";
import { homeRoomPath } from "@/config/routes";
import {
  apartmentBounds,
  type Apartment,
  type Room,
} from "@/modules/home/apartment-model";

const LOW_WALL_M = 0.4;
const WALL_THICKNESS_M = 0.08;

const FLOOR_COLOR = "#b58f68";
const FLOOR_HOVER_COLOR = "#d3a97a";
const BALCONY_COLOR = "#9aa39a";
const WALL_COLOR = "#e4e0d6";

function RoomBlock({
  room,
  onOpen,
  onHover,
  hovered,
}: {
  room: Room;
  onOpen: (roomId: string) => void;
  onHover: (roomId: string | null) => void;
  hovered: boolean;
}) {
  const W = room.widthCm * CM;
  const D = room.depthCm * CM;
  const x = room.origin.x * CM;
  const z = room.origin.y * CM;
  const isBalcony = room.id === "balkon";

  const baseColor = isBalcony ? BALCONY_COLOR : FLOOR_COLOR;

  return (
    <group position={[x, 0, z]}>
      {/* Clickable floor */}
      <mesh
        rotation={[-Math.PI / 2, 0, 0]}
        position={[W / 2, 0.01, D / 2]}
        onClick={(e) => {
          e.stopPropagation();
          onOpen(room.id);
        }}
        onPointerOver={(e) => {
          e.stopPropagation();
          onHover(room.id);
          document.body.style.cursor = "pointer";
        }}
        onPointerOut={() => {
          onHover(null);
          document.body.style.cursor = "default";
        }}
        receiveShadow
      >
        <planeGeometry args={[W, D]} />
        <meshStandardMaterial color={hovered ? FLOOR_HOVER_COLOR : baseColor} />
      </mesh>

      {/* Low perimeter walls (dollhouse look) */}
      <mesh position={[W / 2, LOW_WALL_M / 2, 0]} castShadow>
        <boxGeometry args={[W, LOW_WALL_M, WALL_THICKNESS_M]} />
        <meshStandardMaterial color={WALL_COLOR} />
      </mesh>
      <mesh position={[W / 2, LOW_WALL_M / 2, D]} castShadow>
        <boxGeometry args={[W, LOW_WALL_M, WALL_THICKNESS_M]} />
        <meshStandardMaterial color={WALL_COLOR} />
      </mesh>
      <mesh position={[0, LOW_WALL_M / 2, D / 2]} castShadow>
        <boxGeometry args={[WALL_THICKNESS_M, LOW_WALL_M, D]} />
        <meshStandardMaterial color={WALL_COLOR} />
      </mesh>
      <mesh position={[W, LOW_WALL_M / 2, D / 2]} castShadow>
        <boxGeometry args={[WALL_THICKNESS_M, LOW_WALL_M, D]} />
        <meshStandardMaterial color={WALL_COLOR} />
      </mesh>

      {/* Labels flat on the floor */}
      <Text
        position={[W / 2, 0.03, D / 2 - 0.14]}
        rotation={[-Math.PI / 2, 0, 0]}
        fontSize={Math.min(0.34, W * 0.14)}
        color="#2f2b26"
        anchorX="center"
        anchorY="middle"
      >
        {room.name}
      </Text>
      <Text
        position={[W / 2, 0.03, D / 2 + 0.24]}
        rotation={[-Math.PI / 2, 0, 0]}
        fontSize={Math.min(0.22, W * 0.09)}
        color="#5b544b"
        anchorX="center"
        anchorY="middle"
      >
        {room.officialAreaM2.toFixed(1)} m²
      </Text>
    </group>
  );
}

/**
 * Interactive 3D dollhouse of the whole apartment, positioned exactly like the
 * original 2D plan. Click a room to open its planner.
 */
export function ApartmentScene({ apartment }: { apartment: Apartment }) {
  const router = useRouter();
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const bounds = apartmentBounds(apartment);
  const W = bounds.width * CM;
  const D = bounds.height * CM;

  return (
    <Canvas
      shadows
      camera={{ position: [0, Math.max(W, D) * 0.95, D * 1.05], fov: 40 }}
      style={{ touchAction: "none" }}
    >
      <color attach="background" args={["#2a2a28"]} />
      <ambientLight intensity={0.85} />
      <directionalLight
        position={[6, 10, 8]}
        intensity={1.5}
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
      />

      <group position={[-W / 2 - bounds.minX * CM, 0, -D / 2 - bounds.minY * CM]}>
        {apartment.rooms.map((room) => (
          <RoomBlock
            key={room.id}
            room={room}
            hovered={hoveredId === room.id}
            onOpen={(roomId) => router.push(homeRoomPath(roomId))}
            onHover={setHoveredId}
          />
        ))}
      </group>

      <OrbitControls
        makeDefault
        enableDamping
        target={[0, 0, 0]}
        maxPolarAngle={Math.PI / 2.2}
        minDistance={3}
        maxDistance={Math.max(W, D) * 3}
      />
    </Canvas>
  );
}
