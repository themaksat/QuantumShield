import path from "path";
import { db } from "./db";

export async function ensureDefaultProject() {
  let org = await db.organization.findFirst();
  if (!org) {
    org = await db.organization.create({
      data: {
        name: "Acme Payments Global",
        slug: "acme-payments",
      },
    });
  }

  let project = await db.project.findFirst({
    include: { repositories: true },
  });

  if (!project) {
    project = await db.project.create({
      data: {
        name: "Core Payments Settlement System",
        description: "High-throughput financial ledger, transaction signer, and token authority",
        orgId: org.id,
      },
      include: { repositories: true },
    });
  }

  // Check if demo repository is registered
  let demoRepo = await db.repository.findFirst({
    where: { name: "enterprise-payments-core" },
  });

  if (!demoRepo) {
    const defaultLocalPath = path.resolve(process.cwd(), "demo-vulnerable-repo");
    demoRepo = await db.repository.create({
      data: {
        projectId: project.id,
        name: "enterprise-payments-core",
        url: "https://github.com/acme-payments/enterprise-payments-core",
        defaultBranch: "main",
        localPath: defaultLocalPath,
        isCloned: true,
      },
    });
  }

  return { org, project, demoRepo };
}
