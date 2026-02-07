import { NextResponse } from "next/server";
import { verifyMessage } from "ethers";
import {
  createContribution,
  findContributionByEvidence,
} from "@/lib/governanceDb";
import { computeContributionPoints } from "@/lib/contributionRubric";

export const runtime = "nodejs";

const ALLOWED_TYPES = new Set([
  "publication.doi",
  "research.dataset",
  "research.audit",
  "research.report",
]);

const buildContributionMessage = (payload: {
  address: string;
  type: string;
  evidence: string;
  occurredAt: string;
  quantity: number | null;
  timestamp: number;
}) => {
  return `PherconsVault Contribution Submission\nAddress: ${payload.address}\nType: ${payload.type}\nEvidence: ${payload.evidence}\nOccurredAt: ${payload.occurredAt}\nQuantity: ${payload.quantity ?? 1}\nTimestamp: ${payload.timestamp}`;
};

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  const payload = body?.payload ?? {};

  const address = String(payload.address ?? "").toLowerCase();
  const type = String(payload.type ?? "").trim();
  const evidence = String(payload.evidence ?? "").trim();
  const occurredAtRaw = String(payload.occurredAt ?? "").trim();
  const quantity =
    payload.quantity === null || payload.quantity === undefined
      ? null
      : Number(payload.quantity);
  const signature = String(payload.signature ?? "");
  const timestamp = Number(payload.timestamp);

  if (!address || !type || !evidence) {
    return NextResponse.json(
      { ok: false, error: "Missing address, type, or evidence." },
      { status: 400 }
    );
  }
  if (!ALLOWED_TYPES.has(type)) {
    return NextResponse.json(
      { ok: false, error: "Unsupported contribution type." },
      { status: 400 }
    );
  }
  if (!signature || !Number.isFinite(timestamp)) {
    return NextResponse.json(
      { ok: false, error: "Missing signature payload." },
      { status: 400 }
    );
  }
  const now = Date.now();
  if (Math.abs(now - timestamp) > 10 * 60 * 1000) {
    return NextResponse.json(
      { ok: false, error: "Signature expired." },
      { status: 400 }
    );
  }

  const occurredAt = occurredAtRaw
    ? new Date(occurredAtRaw).toISOString()
    : new Date().toISOString();
  if (Number.isNaN(new Date(occurredAt).getTime())) {
    return NextResponse.json(
      { ok: false, error: "Invalid occurred date." },
      { status: 400 }
    );
  }

  const message = buildContributionMessage({
    address,
    type,
    evidence,
    occurredAt,
    quantity: Number.isFinite(quantity) ? Number(quantity) : null,
    timestamp,
  });
  try {
    const recovered = verifyMessage(message, signature).toLowerCase();
    if (recovered !== address) {
      return NextResponse.json(
        { ok: false, error: "Signature does not match wallet." },
        { status: 400 }
      );
    }
  } catch {
    return NextResponse.json(
      { ok: false, error: "Invalid signature." },
      { status: 400 }
    );
  }

  if (findContributionByEvidence(evidence)) {
    return NextResponse.json({ ok: true, alreadyLogged: true });
  }

  const points = computeContributionPoints(type, quantity ?? undefined);
  createContribution({
    id: crypto.randomUUID(),
    walletAddress: address,
    source: "public",
    type,
    quantity: Number.isFinite(quantity) ? Number(quantity) : null,
    points,
    evidence,
    occurredAt,
    createdAt: new Date().toISOString(),
    metadata: JSON.stringify({
      submittedBy: "contributor",
      signatureTimestamp: timestamp,
    }),
    status: "pending",
    verifiedAt: null,
  });

  return NextResponse.json({ ok: true });
}
