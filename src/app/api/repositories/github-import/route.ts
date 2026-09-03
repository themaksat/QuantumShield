import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { ensureDefaultProject } from "@/lib/seed";
import { GitHubIngestionService } from "@/lib/git/github-service";
import { ScannerEngine } from "@/lib/scanner/engine";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { repoUrl, branch, name } = body;

    if (!repoUrl) {
      return NextResponse.json(
        { error: "GitHub Repository URL or owner/repo is required" },
        { status: 400 }
      );
    }

    const { project } = await ensureDefaultProject();

    // 1. Clone or fetch public remote repository from GitHub (No PAT needed)
    const cloneResult = await GitHubIngestionService.cloneOrFetchRepository({
      repoUrl,
      branch: branch && branch.trim() !== "" ? branch.trim() : undefined,
    });

    const repoDisplayName = name || cloneResult.repoName;

    // 2. Register or update Repository in database
    let repo = await db.repository.findFirst({
      where: {
        OR: [
          { url: repoUrl },
          { name: repoDisplayName },
          { localPath: cloneResult.localPath },
        ],
      },
    });

    if (repo) {
      repo = await db.repository.update({
        where: { id: repo.id },
        data: {
          name: repoDisplayName,
          url: repoUrl,
          localPath: cloneResult.localPath,
          defaultBranch: cloneResult.defaultBranch,
          isCloned: true,
        },
      });
    } else {
      repo = await db.repository.create({
        data: {
          projectId: project.id,
          name: repoDisplayName,
          url: repoUrl,
          localPath: cloneResult.localPath,
          defaultBranch: cloneResult.defaultBranch,
          isCloned: true,
        },
      });
    }

    // 3. Trigger initial AST cryptographic scan on cloned files
    const scanResults = await ScannerEngine.scanDirectory(
      cloneResult.localPath,
      repo.name
    );

    // 4. Persist scan, CBOM, findings, and dependency graph
    const savedScan = await ScannerEngine.persistScan(repo.id, scanResults);

    // 5. Record Audit Event
    await db.auditEvent.create({
      data: {
        actor: "GitHub App Ingestion",
        action: "GITHUB_REPOSITORY_CLONED_AND_SCANNED",
        objectType: "Repository",
        objectId: repo.id,
        metadata: JSON.stringify({
          repoUrl,
          branch: cloneResult.defaultBranch,
          commitSha: cloneResult.commitSha,
          totalAssets: scanResults.metrics.totalAssets,
          postureScore: savedScan.postureScore,
        }),
      },
    });

    return NextResponse.json({
      success: true,
      repository: {
        id: repo.id,
        name: repo.name,
        url: repo.url,
        defaultBranch: repo.defaultBranch,
        localPath: repo.localPath,
        commitSha: cloneResult.commitSha,
      },
      scanId: savedScan.id,
      postureScore: savedScan.postureScore,
      metrics: scanResults.metrics,
      totalFindings: scanResults.findings.length,
    });
  } catch (error: any) {
    console.error("GitHub import error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
