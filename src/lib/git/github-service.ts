import fs from "fs";
import path from "path";
import { execSync } from "child_process";

export interface CloneRepoOptions {
  repoUrl: string;
  branch?: string;
}

export interface ClonedRepoResult {
  repoName: string;
  localPath: string;
  defaultBranch: string;
  commitSha: string;
  commitMessage: string;
}

export class GitHubIngestionService {
  private static baseCloneDir = path.resolve(process.cwd(), "cloned-repositories");

  /**
   * Normalizes any user-entered GitHub string to a valid HTTPS clone URL
   * Examples:
   *   "owner/repo" -> "https://github.com/owner/repo"
   *   "github.com/owner/repo" -> "https://github.com/owner/repo"
   *   "https://github.com/owner/repo.git" -> "https://github.com/owner/repo"
   */
  public static normalizeGitHubUrl(input: string): { url: string; owner: string; repo: string } {
    let raw = input.trim();
    if (!raw) throw new Error("Please enter a GitHub repository URL or owner/repo");

    // Remove trailing slashes and .git
    raw = raw.replace(/\/+$/, "");
    if (raw.endsWith(".git")) {
      raw = raw.slice(0, -4);
    }

    // Strip leading https:// or http:// or git@
    raw = raw.replace(/^https?:\/\//i, "");
    raw = raw.replace(/^git@github\.com:/i, "");
    raw = raw.replace(/^github\.com\//i, "");

    const parts = raw.split("/").filter(Boolean);
    if (parts.length < 2) {
      throw new Error(`Invalid GitHub repository format: "${input}". Use format: owner/repo (e.g. expressjs/express)`);
    }

    const owner = parts[0];
    const repo = parts[1];
    const url = `https://github.com/${owner}/${repo}`;

    return { url, owner, repo };
  }

  /**
   * Clones or updates a public remote GitHub repository (No PAT needed)
   */
  public static async cloneOrFetchRepository(
    options: CloneRepoOptions
  ): Promise<ClonedRepoResult> {
    const { repoUrl, branch } = options;
    const { url: cloneUrl, owner, repo } = this.normalizeGitHubUrl(repoUrl);

    // Ensure base directory exists
    if (!fs.existsSync(this.baseCloneDir)) {
      fs.mkdirSync(this.baseCloneDir, { recursive: true });
    }

    const safeFolderName = `${owner}_${repo}`.replace(/[^a-zA-Z0-9_-]/g, "_");
    const targetDir = path.join(this.baseCloneDir, safeFolderName);

    // If directory already exists
    if (fs.existsSync(targetDir)) {
      const isGit = fs.existsSync(path.join(targetDir, ".git"));
      if (isGit) {
        try {
          execSync("git fetch --depth 1 origin", {
            cwd: targetDir,
            stdio: "pipe",
            timeout: 60000,
          });
          execSync("git reset --hard origin/HEAD", {
            cwd: targetDir,
            stdio: "pipe",
            timeout: 30000,
          });
        } catch {
          // If pull fails, cleanly remove and re-clone
          this.removeDirectorySafely(targetDir);
          this.executeClone(cloneUrl, targetDir, branch);
        }
      } else {
        this.removeDirectorySafely(targetDir);
        this.executeClone(cloneUrl, targetDir, branch);
      }
    } else {
      this.executeClone(cloneUrl, targetDir, branch);
    }

    // Extract repository metadata
    let defaultBranch = "main";
    let commitSha = "HEAD";
    let commitMessage = "Initial ingest";

    try {
      defaultBranch = execSync("git rev-parse --abbrev-ref HEAD", {
        cwd: targetDir,
        encoding: "utf-8",
      }).trim();
      commitSha = execSync("git rev-parse HEAD", {
        cwd: targetDir,
        encoding: "utf-8",
      }).trim();
      commitMessage = execSync("git log -1 --pretty=%B", {
        cwd: targetDir,
        encoding: "utf-8",
      }).trim().split("\n")[0] || "Latest commit";
    } catch (metaErr) {
      console.warn("Could not read git metadata from cloned repo:", metaErr);
    }

    return {
      repoName: repo,
      localPath: targetDir,
      defaultBranch,
      commitSha,
      commitMessage,
    };
  }

  private static executeClone(cloneUrl: string, targetDir: string, branch?: string) {
    // If a branch was specified, try cloning that branch; if it fails, fall back to default branch
    if (branch && branch.trim() !== "") {
      const commandWithBranch = `git clone --depth 1 -b "${branch.trim()}" "${cloneUrl}" "${targetDir}"`;
      try {
        execSync(commandWithBranch, {
          stdio: "pipe",
          timeout: 120000,
        });
        return;
      } catch (errBranch) {
        console.warn(`Branch "${branch}" not found, falling back to repository default branch...`);
        this.removeDirectorySafely(targetDir);
      }
    }

    // Default clone without branch flag (Git will automatically clone the repository's default branch: main, master, etc.)
    const defaultCommand = `git clone --depth 1 "${cloneUrl}" "${targetDir}"`;
    try {
      execSync(defaultCommand, {
        stdio: "pipe",
        timeout: 120000,
      });
    } catch (e: any) {
      throw new Error(`Git clone failed for ${cloneUrl}: ${e.stderr?.toString() || e.message}`);
    }
  }

  private static removeDirectorySafely(dir: string) {
    try {
      if (fs.existsSync(dir)) {
        fs.rmSync(dir, { recursive: true, force: true, maxRetries: 3, retryDelay: 500 });
      }
    } catch (e) {
      console.error(`Error deleting ${dir}:`, e);
    }
  }
}
