import { NextResponse } from "next/server";
import { verifyMessage } from "ethers";
import {
  createContribution,
  findContributionByEvidence,
  listIdentityLinks,
} from "@/lib/governanceDb";
import {
  computeContributionPoints,
  CONTRIBUTION_RUBRIC,
} from "@/lib/contributionRubric";

export const runtime = "nodejs";

const requireAdmin = async (request: Request) => {
  const adminAddress =
    process.env.GOVERNANCE_ADMIN ?? process.env.NEXT_PUBLIC_GOVERNANCE_ADMIN;
  if (!adminAddress) {
    return { ok: false, error: "Admin address not configured." };
  }
  const body = await request.json().catch(() => ({}));
  const address = String(body?.address || "").toLowerCase();
  const signature = String(body?.signature || "");
  const timestamp = Number(body?.timestamp);
  if (!address || !signature || !Number.isFinite(timestamp)) {
    return { ok: false, error: "Missing admin signature payload." };
  }
  const now = Date.now();
  if (Math.abs(now - timestamp) > 10 * 60 * 1000) {
    return { ok: false, error: "Signature expired." };
  }
  const message = `PherconsVault Admin Access ${timestamp}`;
  try {
    const recovered = verifyMessage(message, signature).toLowerCase();
    if (recovered !== address || recovered !== adminAddress.toLowerCase()) {
      return { ok: false, error: "Unauthorized admin signature." };
    }
    return { ok: true, body };
  } catch {
    return { ok: false, error: "Invalid admin signature." };
  }
};

const githubHeaders = () => {
  const token = process.env.GITHUB_TOKEN;
  return {
    Accept: "application/vnd.github+json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
};

const fetchJson = async (url: string) => {
  const res = await fetch(url, { headers: githubHeaders() });
  if (!res.ok) {
    throw new Error(`GitHub API error: ${res.status}`);
  }
  return res.json();
};

const parseDate = (value?: string | null) => {
  if (!value) return null;
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return null;
  return parsed;
};

const withinRange = (value: string, start: Date, end: Date) => {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return false;
  return parsed >= start && parsed <= end;
};

const normalizeRepo = (repo: string) => repo.trim().replace(/^https?:\/\//, "");

export async function POST(request: Request) {
  const auth = await requireAdmin(request);
  if (!auth.ok) {
    return NextResponse.json({ ok: false, error: auth.error }, { status: 401 });
  }
  const body = auth.body ?? {};
  const payload = body?.payload ?? {};
  const repos = Array.isArray(payload.repos)
    ? payload.repos
    : String(payload.repos ?? "")
        .split(",")
        .map((repo: string) => repo.trim())
        .filter(Boolean);
  if (repos.length === 0) {
    return NextResponse.json(
      { ok: false, error: "At least one repo is required." },
      { status: 400 }
    );
  }

  const start = parseDate(payload.start) ?? new Date(Date.now() - 30 * 86400000);
  const end = parseDate(payload.end) ?? new Date();
  if (start > end) {
    return NextResponse.json(
      { ok: false, error: "Start date must be before end date." },
      { status: 400 }
    );
  }

  const handlesFilter = Array.isArray(payload.handles)
    ? payload.handles.map((handle: string) => handle.toLowerCase())
    : String(payload.handles ?? "")
        .split(",")
        .map((handle: string) => handle.trim().toLowerCase())
        .filter(Boolean);

  const links = listIdentityLinks();
  const activeLinks = links.filter((link) =>
    handlesFilter.length === 0
      ? true
      : handlesFilter.includes(link.githubHandle.toLowerCase())
  );
  if (activeLinks.length === 0) {
    return NextResponse.json(
      { ok: false, error: "No verified GitHub identities found." },
      { status: 400 }
    );
  }

  const maxPages = Number(payload.maxPages ?? 5);
  let created = 0;
  let skipped = 0;
  const errors: string[] = [];

  const createEntry = async (entry: {
    walletAddress: string;
    type: string;
    occurredAt: string;
    evidence: string;
    metadata: Record<string, unknown>;
  }) => {
    if (!CONTRIBUTION_RUBRIC[entry.type]) return;
    const existing = findContributionByEvidence(entry.evidence);
    if (existing) {
      skipped += 1;
      return;
    }
    createContribution({
      id: crypto.randomUUID(),
      walletAddress: entry.walletAddress.toLowerCase(),
      source: "github",
      type: entry.type,
      quantity: 1,
      points: computeContributionPoints(entry.type, 1),
      evidence: entry.evidence,
      occurredAt: new Date(entry.occurredAt).toISOString(),
      createdAt: new Date().toISOString(),
      metadata: JSON.stringify(entry.metadata),
    });
    created += 1;
  };

  for (const repoInput of repos) {
    const repo = normalizeRepo(repoInput).replace(/^github\.com\//i, "");
    const [owner, name] = repo.split("/");
    if (!owner || !name) {
      errors.push(`Invalid repo: ${repoInput}`);
      continue;
    }
    for (const link of activeLinks) {
      const handle = link.githubHandle;

      try {
        for (let page = 1; page <= maxPages; page += 1) {
          const pullsUrl = `https://api.github.com/repos/${owner}/${name}/pulls?state=closed&sort=updated&direction=desc&per_page=100&page=${page}`;
          const pulls = (await fetchJson(pullsUrl)) as Array<{
            merged_at: string | null;
            user?: { login?: string };
            html_url: string;
          }>;
          if (!Array.isArray(pulls) || pulls.length === 0) break;
          for (const pr of pulls) {
            if (!pr.merged_at) continue;
            if (!withinRange(pr.merged_at, start, end)) continue;
            if ((pr.user?.login ?? "").toLowerCase() !== handle.toLowerCase()) {
              continue;
            }
            await createEntry({
              walletAddress: link.walletAddress,
              type: "github.merged_pr",
              occurredAt: pr.merged_at,
              evidence: pr.html_url,
              metadata: { repo, handle, kind: "pull_request" },
            });
          }
          if (pulls.length < 100) break;
        }
      } catch (err) {
        errors.push(
          `PR sync failed for ${handle} (${repo}): ${
            err instanceof Error ? err.message : "unknown error"
          }`
        );
      }

      try {
        for (let page = 1; page <= maxPages; page += 1) {
          const commitsUrl = `https://api.github.com/repos/${owner}/${name}/commits?author=${handle}&since=${start.toISOString()}&until=${end.toISOString()}&per_page=100&page=${page}`;
          const commits = (await fetchJson(commitsUrl)) as Array<{
            sha: string;
            html_url: string;
            commit?: { author?: { date?: string } };
          }>;
          if (!Array.isArray(commits) || commits.length === 0) break;
          for (const commit of commits) {
            const occurredAt = commit.commit?.author?.date;
            if (!occurredAt || !withinRange(occurredAt, start, end)) continue;
            await createEntry({
              walletAddress: link.walletAddress,
              type: "github.commit",
              occurredAt,
              evidence: commit.html_url ?? commit.sha,
              metadata: { repo, handle, kind: "commit", sha: commit.sha },
            });
          }
          if (commits.length < 100) break;
        }
      } catch (err) {
        errors.push(
          `Commit sync failed for ${handle} (${repo}): ${
            err instanceof Error ? err.message : "unknown error"
          }`
        );
      }

      try {
        for (let page = 1; page <= maxPages; page += 1) {
          const searchQuery = `repo:${owner}/${name}+type:issue+author:${handle}+created:${start.toISOString().slice(0, 10)}..${end.toISOString().slice(0, 10)}`;
          const issuesUrl = `https://api.github.com/search/issues?q=${encodeURIComponent(
            searchQuery
          )}&per_page=100&page=${page}`;
          const issuePayload = (await fetchJson(issuesUrl)) as {
            items?: Array<{ html_url: string; created_at: string }>;
          };
          const items = issuePayload?.items ?? [];
          if (items.length === 0) break;
          for (const issue of items) {
            if (!withinRange(issue.created_at, start, end)) continue;
            await createEntry({
              walletAddress: link.walletAddress,
              type: "github.issue",
              occurredAt: issue.created_at,
              evidence: issue.html_url,
              metadata: { repo, handle, kind: "issue" },
            });
          }
          if (items.length < 100) break;
        }
      } catch (err) {
        errors.push(
          `Issue sync failed for ${handle} (${repo}): ${
            err instanceof Error ? err.message : "unknown error"
          }`
        );
      }
    }
  }

  return NextResponse.json({
    ok: true,
    created,
    skipped,
    errors,
    range: { start: start.toISOString(), end: end.toISOString() },
  });
}
