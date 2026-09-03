import { NextResponse } from "next/server";
import { GitService } from "@/lib/git/service";

export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const body = await req.json().catch(() => ({}));
    const { title, customBranch } = body;

    const pr = await GitService.createPullRequest({
      patchId: params.id,
      findingId: body.findingId,
      repositoryId: body.repositoryId,
      title,
      customBranch,
    });

    return NextResponse.json({
      success: true,
      pullRequest: pr,
    });
  } catch (error: any) {
    console.error("Create PR error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
