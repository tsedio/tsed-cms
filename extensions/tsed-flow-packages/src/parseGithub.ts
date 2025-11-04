export type GitHubRepo = { owner: string; repo: string };

/**
 * Parse a GitHub repository URL or SSH spec and return { owner, repo }.
 * Supports:
 * - https://github.com/owner/repo
 * - http://github.com/owner/repo
 * - git+https://github.com/owner/repo.git
 * - git://github.com/owner/repo.git
 * - ssh: git@github.com:owner/repo.git
 * - git@github.com:owner/repo
 */
export function parseGitHubRepo(input: string | null | undefined): GitHubRepo | null {
  if (!input || typeof input !== "string") return null;

  let s = input.trim();
  if (!s) return null;

  // If input is like "github:user/repo" convert to standard
  if (/^github:/i.test(s)) {
    s = s.replace(/^github:/i, "https://github.com/");
  }

  // ssh form: git@github.com:owner/repo(.git)?
  const sshMatch = s.match(/^git@github\.com:(?<owner>[^\/\s]+)\/(?<repo>[^\s#]+)(?:#.*)?$/i);
  if (sshMatch && sshMatch.groups) {
    const owner = sshMatch.groups.owner;
    const repo = cleanupRepoName(sshMatch.groups.repo);
    return owner && repo ? { owner, repo } : null;
  }

  // Remove git+ prefix if present
  s = s.replace(/^git\+/, "");

  // Normalize protocol and host
  try {
    // Some inputs may miss protocol but start with github.com/
    if (/^github\.com\//i.test(s)) {
      s = `https://${s}`;
    }

    const url = new URL(s);
    if (!/github\.com$/i.test(url.hostname)) return null;

    // pathname may contain leading '/'
    const parts = url.pathname.replace(/^\//, "").split("/");
    const owner = parts[0];
    let repo = parts[1] || "";

    repo = cleanupRepoName(repo);

    return owner && repo ? { owner, repo } : null;
  } catch {
    return null;
  }
}

function cleanupRepoName(repo: string): string {
  // strip .git and trailing slashes
  return repo.replace(/\.git$/i, "").replace(/\/$/, "");
}
