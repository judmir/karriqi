"use client";

import { Canvas } from "@react-three/fiber";
import { OrbitControls, Text } from "@react-three/drei";
import { DoubleSide, FrontSide } from "three";

import {
  CM,
  WALL_HEIGHT_M,
  furnitureColor,
  furnitureFootprintM,
  furnitureHeightM,
  wallSegments,
  wallTransform,
} from "@/components/home/three/scene-utils";
import type { Room, WallSide } from "@/modules/home/apartment-model";
import type { RoomLayout } from "@/types/home";

const WALL_COLOR = "#b8c4b0";
const WALL_COLOR_ALT = "#c9d2c2";
const FLOOR_COLOR = "#b58f68";
const DOOR_COLOR = "#8a6844";
const WINDOW_COLOR = "#aecfe0";

const WALLS: WallSide[] = ["north", "east", "south", "west"];

function Wall({ room, wall }: { room: Room; wall: WallSide }) {
  const { solids, openings } = wallSegments(room, wall);
  const color = wall === "north" || wall === "south" ? WALL_COLOR : WALL_COLOR_ALT;

  return (
    <group>
      {solids.map((seg, i) => {
        const t = wallTransform(room, wall, seg);
        return (
          <mesh
            key={`s-${i}`}
            position={t.position}
            rotation={[0, t.rotationY, 0]}
          >
            <planeGeometry args={[t.width, t.height]} />
            {/* FrontSide only: walls facing away from the camera cull out, so
                the room reads as an open dollhouse from every angle. */}
            <meshStandardMaterial color={color} side={FrontSide} />
          </mesh>
        );
      })}
      {openings.map((o, i) => {
        const t = wallTransform(room, wall, o);
        return (
          <mesh
            key={`o-${i}`}
            position={t.position}
            rotation={[0, t.rotationY, 0]}
          >
            <planeGeometry args={[t.width, t.height]} />
            <meshStandardMaterial
              color={o.kind === "door" ? DOOR_COLOR : WINDOW_COLOR}
              transparent={o.kind === "window"}
              opacity={o.kind === "window" ? 0.55 : 1}
              side={FrontSide}
            />
          </mesh>
        );
      })}
    </group>
  );
}

function Furniture({ layout }: { layout: RoomLayout }) {
  return (
    <group>
      {layout.furniture.map((item, i) => {
        const f = furnitureFootprintM(item);
        const h = furnitureHeightM(item);
        return (
          <group key={`${item.label}-${i}`}>
            <mesh
              position={[f.x + f.w / 2, h / 2, f.z + f.d / 2]}
              castShadow
              receiveShadow
            >
              <boxGeometry args={[f.w, h, f.d]} />
              <meshStandardMaterial color={furnitureColor(item, i)} />
            </mesh>
            <Text
              position={[f.x + f.w / 2, h + 0.16, f.z + f.d / 2]}
              fontSize={0.13}
              color="#f4f2ec"
              outlineWidth={0.008}
              outlineColor="#3a3a35"
              anchorX="center"
              anchorY="bottom"
            >
              {item.label}
            </Text>
          </group>
        );
      })}
    </group>
  );
}

/**
 * Interactive 3D view of a single room: exact floor + walls from the plan
 * geometry (dollhouse-style, near walls auto-hide), furniture from the
 * validated AI layout, orbit/zoom controls.
 */
export function RoomScene({
  room,
  layout,
}: {
  room: Room;
  layout?: RoomLayout | null;
}) {
  const W = room.widthCm * CM;
  const D = room.depthCm * CM;
  const radius = Math.max(W, D);

  return (
    <Canvas
      shadows
      camera={{
        position: [W * 1.05, radius * 1.15 + 1.2, D * 1.55],
        fov: 42,
      }}
      style={{ touchAction: "none" }}
    >
      <color attach="background" args={["#2a2a28"]} />
      <ambientLight intensity={0.75} />
      <directionalLight
        position={[W * 1.5, 6, D * 1.8]}
        intensity={1.4}
        castShadow
        shadow-mapSize-width={1024}
        shadow-mapSize-height={1024}
      />
      <pointLight position={[W / 2, WALL_HEIGHT_M - 0.3, D / 2]} intensity={8} />

      <group position={[-W / 2, 0, -D / 2]}>
        {/* Floor */}
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[W / 2, 0, D / 2]} receiveShadow>
          <planeGeometry args={[W, D]} />
          <meshStandardMaterial color={FLOOR_COLOR} side={DoubleSide} />
        </mesh>

        {WALLS.map((wall) => (
          <Wall key={wall} room={room} wall={wall} />
        ))}

        {layout ? <Furniture layout={layout} /> : null}

        {/* Width label along the front edge, like the reference. */}
        <Text
          position={[W / 2, 0.02, D + 0.35]}
          rotation={[-Math.PI / 2, 0, 0]}
          fontSize={0.22}
          color="#e8e6df"
          anchorX="center"
        >
          {(room.widthCm / 100).toFixed(1)} m
        </Text>
        <Text
          position={[-0.35, 0.02, D / 2]}
          rotation={[-Math.PI / 2, 0, Math.PI / 2]}
          fontSize={0.22}
          color="#e8e6df"
          anchorX="center"
        >
          {(room.depthCm / 100).toFixed(1)} m
        </Text>
      </group>

      <OrbitControls
        makeDefault
        enableDamping
        target={[0, 0.8, 0]}
        maxPolarAngle={Math.PI / 2.05}
        minDistance={2}
        maxDistance={radius * 4}
      />
    </Canvas>
  );
}
