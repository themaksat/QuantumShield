import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const events = await db.auditEvent.findMany({
      orderBy: { timestamp: "desc" },
      take: 100,
    });

    return NextResponse.json({
      events: events.map((e) => ({
        id: e.id,
        actor: e.actor,
        action: e.action,
        objectType: e.objectType,
        objectId: e.objectId,
        timestamp: e.timestamp.toISOString(),
        metadata: e.metadata ? JSON.parse(e.metadata) : {},
      })),
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
