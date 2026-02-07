import { NextResponse } from "next/server";
import { listContributionsByPeriod } from "@/lib/governanceDb";
import { getContributionCategory } from "@/lib/contributionRubric";

export const runtime = "nodejs";

const PERIODS = {
  weekly: 7,
  monthly: 30,
  quarterly: 90,
};

const buildLeaderboard = (days: number, role: string | null) => {
  const end = new Date();
  const start = new Date();
  start.setDate(start.getDate() - days);
  const contributions = listContributionsByPeriod(
    start.toISOString(),
    end.toISOString()
  );
  const totals = new Map<
    string,
    { total: number; supporter: number; developer: number; researcher: number }
  >();
  contributions.forEach((entry) => {
    const wallet = entry.walletAddress.toLowerCase();
    const current =
      totals.get(wallet) ?? {
        total: 0,
        supporter: 0,
        developer: 0,
        researcher: 0,
      };
    const points = Number(entry.points) || 0;
    current.total += points;
    const category = getContributionCategory(entry.type);
    if (category === "supporter") current.supporter += points;
    if (category === "developer") current.developer += points;
    if (category === "researcher") current.researcher += points;
    totals.set(wallet, current);
  });
  const scoreForRole = (
    data: { total: number; supporter: number; developer: number; researcher: number },
    roleKey: string | null
  ) => {
    if (!roleKey || roleKey === "overall") return data.total;
    if (roleKey === "supporter") return data.supporter;
    if (roleKey === "developer") return data.developer;
    if (roleKey === "researcher") return data.researcher;
    return data.total;
  };

  const ranked = Array.from(totals.entries())
    .sort((a, b) => scoreForRole(b[1], role) - scoreForRole(a[1], role))
    .slice(0, 3)
    .map(([wallet, data], index) => ({
      rank: index + 1,
      wallet,
      totalPoints: data.total,
      categoryPoints: {
        supporter: data.supporter,
        developer: data.developer,
        researcher: data.researcher,
      },
    }));
  return {
    periodStart: start.toISOString(),
    periodEnd: end.toISOString(),
    totalContributors: totals.size,
    top: ranked,
  };
};

export async function GET(request: Request) {
  const url = new URL(request.url);
  const periodParam = String(url.searchParams.get("period") ?? "").toLowerCase();
  const roleParam = String(url.searchParams.get("role") ?? "").toLowerCase() || "overall";
  if (periodParam) {
    const days = PERIODS[periodParam as keyof typeof PERIODS];
    if (!days) {
      return NextResponse.json(
        { ok: false, error: "Invalid period." },
        { status: 400 }
      );
    }
    return NextResponse.json({ ok: true, data: buildLeaderboard(days, roleParam) });
  }

  const data = Object.fromEntries(
    Object.entries(PERIODS).map(([label, days]) => [
      label,
      buildLeaderboard(days, roleParam),
    ])
  );
  return NextResponse.json({ ok: true, data });
}
