import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const finding = await db.finding.findUnique({
      where: { id: params.id },
      include: {
        repository: true,
        cryptoAsset: true,
        migrationPlans: {
          include: {
            patches: {
              include: {
                validationRuns: { orderBy: { createdAt: "desc" } },
                benchmarkRuns: { orderBy: { createdAt: "desc" } },
                pullRequests: true,
              },
            },
          },
        },
      },
    });

    if (!finding) {
      return NextResponse.json({ error: "Finding not found" }, { status: 404 });
    }

    return NextResponse.json({ finding });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
