import { NextResponse } from "next/server";
import { Contract, JsonRpcProvider, formatEther } from "ethers";
import { verifyMessage } from "ethers";
import { FUNDME_ABI } from "@/lib/fundmeAbi";
import {
  DEFAULT_CHAIN_ID,
  getFundMeAddress,
} from "@/lib/network";
import {
  createContribution,
  findContributionByEvidence,
} from "@/lib/governanceDb";
import { computeContributionPoints } from "@/lib/contributionRubric";

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

export async function POST(request: Request) {
  const auth = await requireAdmin(request);
  if (!auth.ok) {
    return NextResponse.json({ ok: false, error: auth.error }, { status: 401 });
  }
  const body = auth.body ?? {};
  const payload = body?.payload ?? {};
  const rpcUrl =
    process.env.RPC_URL ??
    process.env.NEXT_PUBLIC_RPC_URL ??
    "";
  if (!rpcUrl) {
    return NextResponse.json(
      { ok: false, error: "RPC_URL is not configured." },
      { status: 400 }
    );
  }

  const chainId = Number(payload.chainId ?? DEFAULT_CHAIN_ID);
  const contractAddress = getFundMeAddress(chainId);
  if (!contractAddress) {
    return NextResponse.json(
      { ok: false, error: "FundMe address not configured." },
      { status: 400 }
    );
  }

  const provider = new JsonRpcProvider(rpcUrl);
  const contract = new Contract(contractAddress, FUNDME_ABI, provider);

  const latestBlock = await provider.getBlockNumber();
  const toBlock = Number(payload.toBlock ?? latestBlock);
  const fromBlockRaw = payload.fromBlock;
  const fromBlock =
    fromBlockRaw === null || fromBlockRaw === undefined
      ? Math.max(0, toBlock - 50_000)
      : Math.max(0, Number(fromBlockRaw));

  const filter = contract.filters.Funded();
  const events = await contract.queryFilter(filter, fromBlock, toBlock);
  if (events.length === 0) {
    return NextResponse.json({
      ok: true,
      created: 0,
      skipped: 0,
      fromBlock,
      toBlock,
    });
  }

  const blockCache = new Map<number, string>();
  const loadBlockDate = async (blockNumber: number) => {
    if (blockCache.has(blockNumber)) return blockCache.get(blockNumber) as string;
    const block = await provider.getBlock(blockNumber);
    const iso = block?.timestamp
      ? new Date(block.timestamp * 1000).toISOString()
      : new Date().toISOString();
    blockCache.set(blockNumber, iso);
    return iso;
  };

  let created = 0;
  let skipped = 0;

  for (const event of events) {
    const args = event.args as { funder?: string; amount?: bigint } | undefined;
    const funder = args?.funder?.toLowerCase();
    const amountWei = args?.amount ?? 0n;
    if (!funder) continue;
    const evidence = `${event.transactionHash}#${event.logIndex}`;
    if (findContributionByEvidence(evidence)) {
      skipped += 1;
      continue;
    }
    const amountEth = Number(formatEther(amountWei));
    const occurredAt = await loadBlockDate(event.blockNumber);
    createContribution({
      id: crypto.randomUUID(),
      walletAddress: funder,
      source: "onchain",
      type: "onchain.donation",
      quantity: amountEth,
      points: computeContributionPoints("onchain.donation", amountEth),
      evidence,
      occurredAt,
      createdAt: new Date().toISOString(),
      metadata: JSON.stringify({
        chainId,
        blockNumber: event.blockNumber,
        txHash: event.transactionHash,
        amountWei: amountWei.toString(),
        contractAddress,
      }),
    });
    created += 1;
  }

  return NextResponse.json({
    ok: true,
    created,
    skipped,
    fromBlock,
    toBlock,
  });
}
