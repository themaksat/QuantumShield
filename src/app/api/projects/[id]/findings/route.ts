import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { searchParams } = new URL(req.url);
    const severity = searchParams.get("severity");
    const status = searchParams.get("status");
    const algorithm = searchParams.get("algorithm");
    const search = searchParams.get("search");

    const projectId = params.id;
    const repo = await db.repository.findFirst({
      where: { projectId },
      include: {
        scans: {
          orderBy: { createdAt: "desc" },
          take: 1,
        },
      },
    });

    if (!repo || repo.scans.length === 0) {
      return NextResponse.json({ findings: [], total: 0 });
    }

    const latestScan = repo.scans[0];

    const whereClause: any = {
      scanId: latestScan.id,
    };

    if (severity) whereClause.severity = severity;
    if (status) whereClause.status = status;
    if (algorithm) whereClause.algorithm = { contains: algorithm };
    if (search) {
      whereClause.OR = [
        { title: { contains: search } },
        { file: { contains: search } },
        { algorithm: { contains: search } },
      ];
    }

    const findings = await db.finding.findMany({
      where: whereClause,
      include: {
        cryptoAsset: true,
        migrationPlans: true,
        patches: true,
      },
      orderBy: { riskScore: "desc" },
    });

    return NextResponse.json({
      findings,
      total: findings.length,
      scanId: latestScan.id,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
