type HeroHeaderProps = {
  networkLabel: string;
  contractAddress: string;
  balanceEth: string;
  minimumUsdDisplay: string;
  priceFeed: string | null;
  version: string | null;
};

export default function HeroHeader({
  networkLabel,
  contractAddress,
  balanceEth,
  minimumUsdDisplay,
  priceFeed,
  version,
}: HeroHeaderProps) {
  return (
    <header className="glass-panel animate-rise flex flex-col gap-6 p-6 sm:p-8">
      <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-col gap-3">
          <p className="text-xs uppercase tracking-[0.4em] text-[#6b5b45]">
            Crowdfunding Control Room
          </p>
          <h1 className="heading-serif text-3xl font-semibold tracking-tight sm:text-4xl md:text-5xl">
            FundMe is built for verifiable, price-protected ETH campaigns.
          </h1>
          <p className="max-w-2xl text-sm text-[#5e5242]">
            A tactile dashboard to connect wallets, fund campaigns, and manage
            owner withdrawals on-chain. Every action is recorded and backed by
            Chainlink pricing logic.
          </p>
        </div>
        <div className="flex flex-col items-start gap-3 text-xs">
          <span className="rounded-full border border-[#d3c2a6] bg-[#fff7ea] px-4 py-2">
            Network: {networkLabel}
          </span>
          <span className="max-w-full break-all rounded-2xl border border-[#d3c2a6] bg-[#fff7ea] px-4 py-2">
            Contract: {contractAddress || "Missing address"}
          </span>
        </div>
      </div>
      <div className="grid gap-4 border-t border-[#eadfcf] pt-6 sm:grid-cols-2 lg:grid-cols-3">
        <div className="flex flex-col gap-2">
          <span className="text-xs uppercase tracking-[0.3em] text-[#6b5b45]">
            Contract Balance
          </span>
          <span className="text-xl font-semibold sm:text-2xl">
            {balanceEth} ETH
          </span>
          <span className="text-xs text-[#5e5242]">
            Live from on-chain storage
          </span>
        </div>
        <div className="flex flex-col gap-2">
          <span className="text-xs uppercase tracking-[0.3em] text-[#6b5b45]">
            Minimum USD
          </span>
          <span className="text-xl font-semibold sm:text-2xl">
            ${minimumUsdDisplay}
          </span>
          <span className="text-xs text-[#5e5242]">
            Enforced at funding time
          </span>
        </div>
        <div className="flex flex-col gap-2">
          <span className="text-xs uppercase tracking-[0.3em] text-[#6b5b45]">
            Price Feed
          </span>
          <span className="break-all text-sm font-semibold">
            {priceFeed ?? "Unavailable"}
          </span>
          <span className="text-xs text-[#5e5242]">
            Version {version ?? "—"}
          </span>
        </div>
      </div>
    </header>
  );
}
