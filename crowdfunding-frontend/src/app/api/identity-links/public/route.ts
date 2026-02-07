import { NextResponse } from "next/server";
import { verifyMessage } from "ethers";
import {
  createIdentityLink,
  findIdentityLink,
  findIdentityLinkByGist,
} from "@/lib/governanceDb";

export const runtime = "nodejs";

const buildGithubLinkMessage = (
  handle: string,
  address: string,
  timestamp: number
) => {
  return `PherconsVault GitHub Link\nHandle: ${handle}\nAddress: ${address}\nTimestamp: ${timestamp}`;
};

const extractGistId = (url: string) => {
  const match =
    url.match(/gist\.github\.com\/[^/]+\/([a-f0-9]+)/i) ??
    url.match(/\/([a-f0-9]{20,})$/i);
  return match?.[1] ?? null;
};

const readGistPayload = async (gistUrl: string) => {
  const id = extractGistId(gistUrl);
  if (!id) {
    throw new Error("Invalid Gist URL.");
  }
  const apiRes = await fetch(`https://api.github.com/gists/${id}`);
  if (!apiRes.ok) {
    throw new Error("Unable to load Gist.");
  }
  const gist = await apiRes.json();
  const files = gist?.files ? Object.values(gist.files) : [];
  const firstFile = files[0] as {
    content?: string;
    truncated?: boolean;
    raw_url?: string;
  } | undefined;
  if (!firstFile) {
    throw new Error("Gist has no files.");
  }
  let content = firstFile.content ?? "";
  if (firstFile.truncated && firstFile.raw_url) {
    const rawRes = await fetch(firstFile.raw_url);
    if (!rawRes.ok) {
      throw new Error("Unable to read Gist content.");
    }
    content = await rawRes.text();
  }
  try {
    return JSON.parse(content);
  } catch {
    throw new Error("Gist content must be JSON.");
  }
};

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  const payload = body?.payload ?? {};
  const handle = String(payload.handle ?? "").trim();
  const gistUrl = String(payload.gistUrl ?? "").trim();
  if (!handle || !gistUrl) {
    return NextResponse.json(
      { ok: false, error: "Handle and Gist URL are required." },
      { status: 400 }
    );
  }

  let gistPayload: {
    handle?: string;
    address?: string;
    signature?: string;
    timestamp?: number;
  };
  try {
    gistPayload = await readGistPayload(gistUrl);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unable to read Gist.";
    const knownErrors = new Set([
      "Invalid Gist URL.",
      "Unable to load Gist.",
      "Gist has no files.",
      "Unable to read Gist content.",
      "Gist content must be JSON.",
    ]);
    if (knownErrors.has(message)) {
      return NextResponse.json({ ok: false, error: message }, { status: 400 });
    }
    return NextResponse.json(
      { ok: false, error: "Unable to verify Gist payload." },
      { status: 500 }
    );
  }
  const gistHandle = String(gistPayload?.handle ?? "").trim();
  const address = String(gistPayload?.address ?? "").toLowerCase();
  const signature = String(gistPayload?.signature ?? "");
  const timestamp = Number(gistPayload?.timestamp);
  if (!gistHandle || !address || !signature || !Number.isFinite(timestamp)) {
    return NextResponse.json(
      { ok: false, error: "Gist payload is missing required fields." },
      { status: 400 }
    );
  }
  if (gistHandle.toLowerCase() !== handle.toLowerCase()) {
    return NextResponse.json(
      { ok: false, error: "Gist handle does not match the submitted handle." },
      { status: 400 }
    );
  }
  const message = buildGithubLinkMessage(gistHandle, address, timestamp);
  try {
    const recovered = verifyMessage(message, signature).toLowerCase();
    if (recovered !== address) {
      return NextResponse.json(
        { ok: false, error: "Signature does not match wallet address." },
        { status: 400 }
      );
    }
  } catch {
    return NextResponse.json(
      { ok: false, error: "Invalid signature in Gist." },
      { status: 400 }
    );
  }

  if (findIdentityLinkByGist(gistUrl) || findIdentityLink(address, gistHandle)) {
    return NextResponse.json({ ok: true, alreadyLinked: true });
  }

  const now = new Date().toISOString();
  createIdentityLink({
    id: crypto.randomUUID(),
    walletAddress: address,
    githubHandle: gistHandle,
    gistUrl,
    signature,
    message,
    createdAt: now,
    verifiedAt: now,
  });
  return NextResponse.json({ ok: true });
}
