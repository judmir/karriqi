import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import { HomeStoreGate } from "@/components/home/home-store-gate";
import { RoomPlanner } from "@/components/home/room-planner";
import { PageContainer } from "@/components/layout/page-container";
import { ROUTES } from "@/config/routes";
import { isSupabaseConfigured } from "@/lib/env";
import { getSessionUser } from "@/lib/supabase/server";
import { getRoom } from "@/modules/home/cicerostrasse-we28";

export default async function HomeRoomPage({
  params,
}: {
  params: Promise<{ roomId: string }>;
}) {
  const { roomId } = await params;

  if (isSupabaseConfigured()) {
    const user = await getSessionUser();
    if (!user) {
      redirect(
        `${ROUTES.signIn}?next=${encodeURIComponent(`${ROUTES.homePlanner}/rooms/${roomId}`)}`,
      );
    }
  }

  const room = getRoom(roomId);
  if (!room) {
    notFound();
  }

  return (
    <PageContainer width="wide">
      <div className="mb-4">
        <Link
          href={ROUTES.homePlanner}
          className="text-muted-foreground hover:text-foreground text-sm"
        >
          ← Back to floorplan
        </Link>
      </div>
      <HomeStoreGate>
        <RoomPlanner roomId={roomId} />
      </HomeStoreGate>
    </PageContainer>
  );
}
