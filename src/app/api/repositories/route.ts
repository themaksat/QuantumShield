import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { ensureDefaultProject } from "@/lib/seed";
import fs from "fs";

export async function GET() {
  try {
    await ensureDefaultProject();
    const repos = await db.repository.findMany({
      include: {
        scans: {
          orderBy: { createdAt: "desc" },
          take: 1,
        },
        _count: {
          select: {
            findings: true,
            cryptoAssets: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ repositories: repos });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "Repository ID is required" }, { status: 400 });
    }

    const repo = await db.repository.findUnique({
      where: { id },
      include: { scans: true },
    });

    if (!repo) {
      return NextResponse.json({ error: "Repository not found" }, { status: 404 });
    }

    // Clean up cloned folder if exists
    if (repo.localPath && repo.localPath.includes("cloned-repositories")) {
      try {
        if (fs.existsSync(repo.localPath)) {
          fs.rmSync(repo.localPath, { recursive: true, force: true });
        }
      } catch (e) {
        console.warn("Could not delete directory:", e);
      }
    }

    // Delete associated data in cascade
    await db.auditEvent.deleteMany({ where: { objectId: id } });
    await db.finding.deleteMany({ where: { repositoryId: id } });
    await db.cryptoAsset.deleteMany({ where: { repositoryId: id } });
    await db.dependencyNode.deleteMany({ where: { scan: { repositoryId: id } } });
    await db.dependencyEdge.deleteMany({ where: { scan: { repositoryId: id } } });
    await db.scan.deleteMany({ where: { repositoryId: id } });
    await db.repository.delete({ where: { id } });

    return NextResponse.json({ success: true, message: `Repository ${repo.name} deleted` });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
