import deployments from "@/lib/deployments.json";

export const DEFAULT_CHAIN_ID = Number(
  process.env.NEXT_PUBLIC_CHAIN_ID ?? "31337"
);

export const getFundMeAddress = (chainId: number) => {
  const envAddress = process.env.NEXT_PUBLIC_FUNDME_ADDRESS;
  if (envAddress && envAddress.length > 0) return envAddress;
  const entry = (deployments as Record<string, { address: string }>)[
    String(chainId)
  ];
  return entry?.address ?? "";
};

export const FUNDME_ADDRESS = getFundMeAddress(DEFAULT_CHAIN_ID);

const CHAIN_LABELS: Record<number, string> = {
  1: "Ethereum Mainnet",
  11155111: "Sepolia",
  31337: "Anvil Local",
  300: "zkSync Sepolia",
};

export const chainLabel = (chainId: number) =>
  CHAIN_LABELS[chainId] ?? `Chain ${chainId}`;
