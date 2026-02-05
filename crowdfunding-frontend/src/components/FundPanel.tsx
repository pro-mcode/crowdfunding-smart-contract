type FundPanelProps = {
  fundAmount: string;
  onFundAmountChange: (value: string) => void;
  canInteract: boolean;
  isOwner: boolean;
  onFund: () => void;
  onWithdraw: () => void;
  exactEth: string;
  safeEth: string;
  usdPerEth: string;
  isCloseToMinimum: boolean;
  onAutofillExact: () => void;
  onAutofillSafe: () => void;
};

export default function FundPanel({
  fundAmount,
  onFundAmountChange,
  canInteract,
  isOwner,
  onFund,
  onWithdraw,
  exactEth,
  safeEth,
  usdPerEth,
  isCloseToMinimum,
  onAutofillExact,
  onAutofillSafe,
}: FundPanelProps) {
  return (
    <div className="glass-panel animate-rise flex flex-col gap-6 p-6">
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
          value={fundAmount}
          onChange={(event) => onFundAmountChange(event.target.value)}
          className="w-full rounded-xl border border-[#d3c2a6] bg-[#f8f2e9] px-4 py-3 text-sm"
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
        <p className="text-xs uppercase tracking-[0.35em] text-[#6b5b45]">
          Owner Console
        </p>
        <p className="text-sm text-[#5e5242]">
          Withdraw the total balance in a single transaction.
        </p>
        <button
          onClick={onWithdraw}
          disabled={!canInteract || !isOwner}
          className="mt-3 w-full rounded-full border border-[#1c1914] px-4 py-3 text-xs uppercase tracking-[0.2em] transition hover:bg-[#1c1914] hover:text-[#fff7ea] disabled:cursor-not-allowed disabled:opacity-50"
        >
          Withdraw
        </button>
      </div>
    </div>
  );
}
