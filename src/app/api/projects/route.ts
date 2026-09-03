import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { ensureDefaultProject } from "@/lib/seed";

export async function GET() {
  try {
    await ensureDefaultProject();
    const projects = await db.project.findMany({
      include: {
        repositories: {
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
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ projects });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { name, description, repoName, repoUrl, localPath } = body;

    let org = await db.organization.findFirst();
    if (!org) {
      org = await db.organization.create({
        data: { name: "Default Organization", slug: "default-org" },
      });
    }

    const project = await db.project.create({
      data: {
        name: name || "New Crypto Security Project",
        description,
        orgId: org.id,
      },
    });

    if (repoName || repoUrl || localPath) {
      await db.repository.create({
        data: {
          projectId: project.id,
          name: repoName || "main-repo",
          url: repoUrl || null,
          localPath: localPath || null,
          isCloned: !!localPath,
        },
      });
    }

    return NextResponse.json({ project }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
