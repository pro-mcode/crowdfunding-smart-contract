type FundPanelProps = {
  fundAmount: string;
  onFundAmountChange: (value: string) => void;
  canInteract: boolean;
  isOwner: boolean;
  onFund: () => void;
  onWithdraw: () => void;
  status: string | null;
  error: string | null;
  statusHistory?: {
    message: string;
    type: "status" | "error";
    timestamp: string;
  }[];
  chainId: number | null;
  expectedChainId: number;
  exactEth: string;
  safeEth: string;
  usdPerEth: string;
  isCloseToMinimum: boolean;
  onAutofillExact: () => void;
  onAutofillSafe: () => void;
  fundInputId: string;
};

export default function FundPanel({
  fundAmount,
  onFundAmountChange,
  canInteract,
  // isOwner,
  onFund,
  // onWithdraw,
  status,
  error,
  statusHistory = [],
  chainId,
  expectedChainId,
  exactEth,
  safeEth,
  usdPerEth,
  isCloseToMinimum,
  onAutofillExact,
  onAutofillSafe,
  fundInputId,
}: FundPanelProps) {
  const failureStage = (() => {
    if (!error) return null;
    const lower = (status || "").toLowerCase();
    if (lower.includes("submitting")) return "Submitted";
    if (lower.includes("transaction submitted")) return "Broadcast";
    if (lower.includes("confirmed")) return "Confirmed";
    return "Unknown";
  })();

  return (
    <div className="glass-panel animate-rise flex h-full flex-col gap-6 p-6">
      <div>
        <p className="text-xs uppercase tracking-[0.35em] text-[#6b5b45]">
          Fund The Vault
        </p>
        <p className="text-sm text-[#5e5242]">
          Pick an ETH amount and submit your contribution.
        </p>
      </div>
      <div className="flex flex-col gap-3">
        <label className="text-xs uppercase tracking-[0.35em] text-[#6b5b45]">
          Amount (ETH)
        </label>
        <input
          id={fundInputId}
          value={fundAmount}
          onChange={(event) => onFundAmountChange(event.target.value)}
          className="w-full rounded-xl border border-[#d3c2a6] bg-[#f8f2e9] px-4 py-3 text-sm focus:border-[#000000] focus:outline-none focus:ring-1 focus:ring-[#000000]/20"
          placeholder="0.1"
        />
      </div>
      <button
        onClick={onFund}
        disabled={!canInteract}
        className="w-full rounded-full border border-[#1c1914] bg-[#1c1914] px-4 py-3 text-xs uppercase tracking-[0.2em] text-[#fff7ea] transition hover:-translate-y-0.5 hover:bg-[#3a2e1d] disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
      >
        Fund Contract
      </button>

      <div className="rounded-2xl border border-[#eadfcf] bg-[#fffdf8] p-4 text-xs text-[#6b5b45]">
        <p className="uppercase tracking-[0.35em]">Minimum To Fund</p>
        <p className="mt-2 text-sm text-[#1c1914]">
          Estimated minimum: {exactEth} ETH
          <br />
          Recommended (safe): {safeEth} ETH
          <br />
          Price ref: 1 ETH ≈ ${usdPerEth}
        </p>
        <div className="mt-3 flex flex-col gap-2 sm:flex-row">
          <button
            onClick={onAutofillExact}
            disabled={!canInteract || exactEth === "0"}
            className="w-full rounded-full border border-[#1c1914] px-3 py-2 text-[10px] uppercase tracking-[0.2em] transition hover:bg-[#1c1914] hover:text-[#fff7ea] disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
          >
            Auto-fill estimate
          </button>
          <button
            onClick={onAutofillSafe}
            disabled={!canInteract || safeEth === "0"}
            className="w-full rounded-full border border-[#1c1914] bg-[#1c1914] px-3 py-2 text-[10px] uppercase tracking-[0.2em] text-[#fff7ea] transition hover:bg-[#3a2e1d] disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
          >
            Auto-fill safe
          </button>
        </div>
        {isCloseToMinimum && (
          <p className="mt-3 text-xs text-[#9a2c20]">
            Warning: this amount is close to the minimum and may revert.
            Consider using the safe value.
          </p>
        )}
      </div>

      <div className="border-t border-[#efe5d5] pt-4">
        {chainId && chainId !== expectedChainId && (
          <div className="mt-3 rounded-2xl border border-[#9a2c20] bg-white px-4 py-3 text-xs text-[#9a2c20]">
            Network mismatch detected. Switch to the expected network to fund.
          </div>
        )}
        <div className="mt-4 grid gap-3">
          <div className="grid gap-2 text-[11px] text-[#6b5b45]">
            <p className="uppercase tracking-[0.2em]">Transaction Timeline</p>
            <div className="grid grid-cols-3 gap-2 text-center text-[10px] uppercase tracking-[0.2em]">
              {["Submitted", "Broadcast", "Confirmed"].map((label, index) => {
                const lower = (status || "").toLowerCase();
                const active =
                  (index === 0 && lower.includes("submitting")) ||
                  (index === 1 && lower.includes("transaction submitted")) ||
                  (index === 2 && lower.includes("confirmed"));
                return (
                  <span
                    key={label}
                    className={`rounded-full border px-2 py-1 ${
                      active
                        ? "border-[#1c1914] bg-[#1c1914] text-[#fff7ea]"
                        : "border-[#d3c2a6] text-[#6b5b45]"
                    }`}
                  >
                    {label}
                  </span>
                );
              })}
            </div>
          </div>
          <p className="text-[11px] uppercase tracking-[0.35em] text-[#6b5b45]">
            Status History
          </p>
          <div className="grid gap-2 text-xs text-[#5e5242]">
            {error && (
              <div className="rounded-xl border border-[#9a2c20] bg-white px-3 py-2 text-[11px] text-[#9a2c20]">
                <div className="flex items-center justify-between gap-2 uppercase tracking-[0.2em]">
                  <span>Failed Step</span>
                  <span>{failureStage}</span>
                </div>
                <p className="mt-1 normal-case text-[#9a2c20]">{error}</p>
              </div>
            )}
            {statusHistory.length === 0 ? (
              <p className="text-[11px]">No status updates yet.</p>
            ) : (
              <div className="grid gap-2">
                {statusHistory.slice(0, 4).map((entry, index) => (
                  <div
                    key={`${entry.timestamp}-${index}`}
                    className="rounded-xl border border-[#eadfcf] bg-[#fffdf8] px-3 py-2 text-[11px]"
                  >
                    <div className="flex items-center justify-between text-[#6b5b45]">
                      <span>{entry.timestamp}</span>
                      <span className="uppercase tracking-[0.2em]">
                        {entry.type === "error" ? "Alert" : "Info"}
                      </span>
                    </div>
                    <p
                      className={entry.type === "error" ? "text-[#9a2c20]" : ""}
                    >
                      {entry.message}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
