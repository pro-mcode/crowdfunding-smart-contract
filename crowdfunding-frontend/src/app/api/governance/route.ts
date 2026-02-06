import { NextResponse } from "next/server";

export const runtime = "nodejs";
import {
  listAll,
  createProposal,
  deleteProposal,
  createVote,
  deleteVote,
  createUnlock,
  releaseUnlock,
  deleteUnlock,
  updateProposal,
  getProposalById,
  listBadges,
  listBadgeRegistry,
  logAudit,
} from "@/lib/governanceDb";
import { verifyMessage } from "ethers";
import { makeHandle } from "@/lib/handle";

export async function GET() {
  const data = listAll();
  return NextResponse.json({ ok: true, data });
}

const adminAddress =
  process.env.GOVERNANCE_ADMIN?.toLowerCase() ??
  process.env.NEXT_PUBLIC_GOVERNANCE_ADMIN?.toLowerCase() ??
  "";

const isRecentTimestamp = (value: string) => {
  const parsed = Date.parse(value);
  if (Number.isNaN(parsed)) return false;
  const delta = Math.abs(Date.now() - parsed);
  return delta <= 5 * 60 * 1000;
};

const verifyActor = (payload: {
  actor?: string;
  signature?: string;
  message?: string;
  timestamp?: string;
  action?: string;
  targetId?: string;
}) => {
  const actor = payload.actor?.toLowerCase();
  if (!actor || !payload.signature || !payload.message || !payload.timestamp) {
    return { ok: false, error: "Missing signer payload." };
  }
  if (!isRecentTimestamp(payload.timestamp)) {
    return { ok: false, error: "Stale signature." };
  }
  if (payload.action && !payload.message.includes(payload.action)) {
    return { ok: false, error: "Invalid message action." };
  }
  if (payload.targetId && !payload.message.includes(payload.targetId)) {
    return { ok: false, error: "Invalid message target." };
  }
  const recovered = verifyMessage(payload.message, payload.signature).toLowerCase();
  if (recovered !== actor) {
    return { ok: false, error: "Signature mismatch." };
  }
  return { ok: true, actor };
};

const capitalizeFirst = (value: string) => {
  if (!value) return value;
  return value.charAt(0).toUpperCase() + value.slice(1);
};

const weightForBadge = (
  badgeLabel: string,
  registryMap: Map<string, number>
) => {
  const label = badgeLabel.trim().toLowerCase();
  const registryWeight = registryMap.get(label);
  if (registryWeight !== undefined) return Number(registryWeight || 0);
  if (label.includes("core")) return 5;
  if (label.includes("lead")) return 4;
  if (label.includes("reviewer")) return 3;
  if (label.includes("advisor")) return 2;
  if (label.includes("contributor")) return 1;
  if (label.includes("supporter")) return 1;
  return 1;
};

const isBadgeActive = (expiresAt: string | null | undefined) => {
  if (!expiresAt) return true;
  const parsed = Date.parse(expiresAt);
  if (Number.isNaN(parsed)) return true;
  return parsed > Date.now();
};

const badgeWeightForActor = (actor: string) => {
  const badges = listBadges().filter(
    (badge) =>
      badge.recipient.toLowerCase() === actor.toLowerCase() &&
      isBadgeActive(badge.expiresAt)
  );
  const registry = listBadgeRegistry();
  const registryMap = new Map(
    registry.map((entry) => [entry.title.toLowerCase(), entry.weight])
  );
  const weight = badges.reduce(
    (sum, badge) => sum + weightForBadge(badge.badge, registryMap),
    0
  );
  return { badges, weight };
};

export async function POST(request: Request) {
  const body = await request.json();
  const type = body?.type;
  const payload = body?.payload ?? {};
  const now = new Date().toLocaleString();

  if (type === "proposal") {
    const title = capitalizeFirst(String(payload.title ?? "")).slice(0, 260);
    const proposerAddress = String(payload.proposerAddress ?? payload.proposer ?? "");
    const proposerHandle = proposerAddress ? makeHandle(proposerAddress) : null;
    createProposal({
      id: crypto.randomUUID(),
      title,
      track: payload.track,
      summary: payload.summary,
      proposer: proposerAddress ?? null,
      proposerAddress: proposerAddress || null,
      proposerHandle,
      requestedEth: Number(payload.requestedEth || 0),
      status: payload.status ?? "Draft",
      submittedAt: now,
    });
    logAudit("proposal_create", proposerAddress ?? null, null, {
      title,
      track: payload.track,
    });
    return NextResponse.json({ ok: true });
  }

  if (type === "vote") {
    if (!payload.proposalId) {
      return NextResponse.json(
        { ok: false, error: "Missing proposal id." },
        { status: 400 }
      );
    }
    const verify = verifyActor({
      actor: body.actor,
      signature: body.signature,
      message: body.message,
      timestamp: body.timestamp,
      action: "vote-cast",
      targetId: payload.proposalId,
    });
    if (!verify.ok) {
      return NextResponse.json(
        { ok: false, error: verify.error },
        { status: 401 }
      );
    }
    const proposal = getProposalById(payload.proposalId);
    if (!proposal) {
      return NextResponse.json(
        { ok: false, error: "Proposal not found." },
        { status: 404 }
      );
    }
    const { badges, weight } = badgeWeightForActor(verify.actor);
    if (!badges.length || weight <= 0) {
      return NextResponse.json(
        { ok: false, error: "Badge required to vote." },
        { status: 403 }
      );
    }
    createVote({
      id: crypto.randomUUID(),
      proposalId: payload.proposalId,
      voter: verify.actor,
      choice: payload.choice ?? "For",
      weight,
      timestamp: now,
    });
    logAudit("vote_cast", verify.actor ?? null, payload.proposalId ?? null, {
      choice: payload.choice ?? "For",
      weight,
      badges: badges.map((badge) => badge.badge),
    });
    return NextResponse.json({ ok: true });
  }

  if (type === "unlock") {
    const verify = verifyActor({
      actor: body.actor,
      signature: body.signature,
      message: body.message,
      timestamp: body.timestamp,
      action: "unlock-create",
      targetId: payload.proposalId ?? "",
    });
    if (!verify.ok) {
      return NextResponse.json({ ok: false, error: verify.error }, { status: 401 });
    }
    const isAdmin = adminAddress && verify.actor === adminAddress;
    if (!payload.proposalId) {
      if (!isAdmin) {
        return NextResponse.json({ ok: false, error: "Unauthorized." }, { status: 403 });
      }
    } else {
      const proposal = getProposalById(payload.proposalId);
      if (!proposal) {
        return NextResponse.json({ ok: false, error: "Proposal not found." }, { status: 404 });
      }
      const actorHandle = makeHandle(verify.actor);
      const proposerHandle = (proposal.proposerHandle ?? "").toLowerCase();
      const proposerAddress = (proposal.proposerAddress ?? proposal.proposer ?? "").toLowerCase();
      if (!isAdmin && actorHandle !== proposerHandle && verify.actor !== proposerAddress) {
        return NextResponse.json({ ok: false, error: "Unauthorized." }, { status: 403 });
      }
    }
    const milestoneTitle = capitalizeFirst(String(payload.milestoneTitle ?? ""));
    createUnlock({
      id: crypto.randomUUID(),
      milestoneTitle,
      amountEth: Number(payload.amountEth || 0),
      proposalId: payload.proposalId ?? null,
      proofHash: payload.proofHash ?? null,
      dueDate: payload.dueDate ?? null,
      status: "Pending",
      releasedAt: null,
    });
    logAudit("unlock_create", verify.actor ?? null, payload.proposalId ?? null, {
      milestoneTitle,
    });
    return NextResponse.json({ ok: true });
  }

  return NextResponse.json(
    { ok: false, error: "Unsupported payload" },
    { status: 400 }
  );
}

export async function PATCH(request: Request) {
  const body = await request.json();
  if (body?.type === "proposal-update") {
    const payload = body.payload ?? {};
    const updates: Record<string, unknown> = {
      title:
        typeof payload.title === "string"
          ? capitalizeFirst(payload.title)
          : payload.title,
      track: payload.track,
      summary: payload.summary,
      requestedEth: payload.requestedEth,
      status: payload.status,
    };
    if (typeof updates.title === "string") {
      updates.title = updates.title.slice(0, 260);
    }
    const verify = verifyActor({
      actor: body.actor,
      signature: body.signature,
      message: body.message,
      timestamp: body.timestamp,
      action: "proposal-update",
      targetId: body.id,
    });
    if (!verify.ok) {
      return NextResponse.json({ ok: false, error: verify.error }, { status: 401 });
    }
    const proposal = getProposalById(body.id);
    if (!proposal) {
      return NextResponse.json({ ok: false, error: "Proposal not found." }, { status: 404 });
    }
    const actorHandle = makeHandle(verify.actor);
    const proposerHandle = (proposal.proposerHandle ?? "").toLowerCase();
    const proposerAddress = (proposal.proposerAddress ?? proposal.proposer ?? "").toLowerCase();
    const isAdmin = adminAddress && verify.actor === adminAddress;
    if (!isAdmin && actorHandle !== proposerHandle && verify.actor !== proposerAddress) {
      return NextResponse.json({ ok: false, error: "Unauthorized." }, { status: 403 });
    }
    updateProposal(body.id, updates);
    logAudit("proposal_update", verify.actor, body.id, updates);
    return NextResponse.json({ ok: true });
  }
  if (body?.type === "unlock-release") {
    const verify = verifyActor({
      actor: body.actor,
      signature: body.signature,
      message: body.message,
      timestamp: body.timestamp,
      action: "unlock-release",
      targetId: body.id,
    });
    if (!verify.ok) {
      return NextResponse.json({ ok: false, error: verify.error }, { status: 401 });
    }
    const isAdmin = adminAddress && verify.actor === adminAddress;
    if (!isAdmin) {
      return NextResponse.json({ ok: false, error: "Unauthorized." }, { status: 403 });
    }
    releaseUnlock(body.id, new Date().toLocaleString());
    logAudit("unlock_release", verify.actor ?? null, body.id ?? null);
    return NextResponse.json({ ok: true });
  }
  return NextResponse.json(
    { ok: false, error: "Unsupported payload" },
    { status: 400 }
  );
}

export async function DELETE(request: Request) {
  const body = await request.json();
  if (body?.type === "proposal") {
    const verify = verifyActor({
      actor: body.actor,
      signature: body.signature,
      message: body.message,
      timestamp: body.timestamp,
      action: "proposal-delete",
      targetId: body.id,
    });
    if (!verify.ok) {
      return NextResponse.json({ ok: false, error: verify.error }, { status: 401 });
    }
    const proposal = getProposalById(body.id);
    if (!proposal) {
      return NextResponse.json({ ok: false, error: "Proposal not found." }, { status: 404 });
    }
    const actorHandle = makeHandle(verify.actor);
    const proposerHandle = (proposal.proposerHandle ?? "").toLowerCase();
    const proposerAddress = (proposal.proposerAddress ?? proposal.proposer ?? "").toLowerCase();
    const isAdmin = adminAddress && verify.actor === adminAddress;
    if (!isAdmin && actorHandle !== proposerHandle && verify.actor !== proposerAddress) {
      return NextResponse.json({ ok: false, error: "Unauthorized." }, { status: 403 });
    }
    deleteProposal(body.id);
    logAudit("proposal_delete", verify.actor, body.id);
    return NextResponse.json({ ok: true });
  }
  if (body?.type === "vote") {
    deleteVote(body.id);
    return NextResponse.json({ ok: true });
  }
  if (body?.type === "unlock") {
    deleteUnlock(body.id);
    return NextResponse.json({ ok: true });
  }
  return NextResponse.json(
    { ok: false, error: "Unsupported payload" },
    { status: 400 }
  );
}
