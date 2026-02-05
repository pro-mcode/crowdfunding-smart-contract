import { useState } from "react";

type WalletPanelProps = {
  isConnected: boolean;
  address: string | null;
  chainId: number | null;
  owner: string | null;
  userFundedEth: string;
  isOwner: boolean;
  onConnect: () => void;
};

export default function WalletPanel({
  isConnected,
  address,
  chainId,
  owner,
  userFundedEth,
  isOwner,
  onConnect,
}: WalletPanelProps) {
  const [copiedOwner, setCopiedOwner] = useState(false);
  const [copiedWallet, setCopiedWallet] = useState(false);

  const handleCopyOwner = async () => {
    if (!owner) return;
    try {
      await navigator.clipboard.writeText(owner);
      setCopiedOwner(true);
      window.setTimeout(() => setCopiedOwner(false), 1600);
    } catch {
      setCopiedOwner(false);
    }
  };

  const handleCopyWallet = async () => {
    if (!address) return;
    try {
      await navigator.clipboard.writeText(address);
      setCopiedWallet(true);
      window.setTimeout(() => setCopiedWallet(false), 1600);
    } catch {
      setCopiedWallet(false);
    }
  };

  const formatAddress = (value: string | null) => {
    if (!value) return "Not connected";
    return `${value.slice(0, 6)}...${value.slice(-4)}`;
  };

  return (
    <div className="glass-panel animate-rise flex flex-col gap-6 p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.35em] text-[#6b5b45]">
            Wallet Access
          </p>
          <div className="flex flex-wrap items-center gap-2 text-sm">
            <span>
              {isConnected ? `Connected: ${formatAddress(address)}` : "Not connected"}
            </span>
            {address && (
              <button
                type="button"
                onClick={handleCopyWallet}
                className="flex items-center justify-center rounded-full border border-[#d3c2a6] bg-[#fff7ea] p-1 text-[#6b5b45] transition hover:border-[#1c1914] hover:text-[#1c1914]"
                aria-label="Copy wallet address"
                title={copiedWallet ? "Copied" : "Copy wallet address"}
              >
                {copiedWallet ? (
                  <svg
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M20 6L9 17l-5-5" />
                  </svg>
                ) : (
                  <svg
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <rect x="9" y="9" width="13" height="13" rx="2" />
                    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                  </svg>
                )}
              </button>
            )}
          </div>
          <p className="text-xs text-[#6b5b45]">
            Chain ID: {chainId ?? "Unknown"}
          </p>
        </div>
        <button
          onClick={onConnect}
          className="w-full rounded-full border border-[#1c1914] px-4 py-2 text-xs uppercase tracking-[0.2em] transition hover:bg-[#1c1914] hover:text-[#fff7ea] sm:w-auto"
        >
          {isConnected ? "Connected" : "Connect"}
        </button>
      </div>

      <div className="grid gap-4 border-t border-[#efe5d5] pt-4 text-sm">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <span>Owner</span>
          <span className="flex flex-wrap items-center gap-2 font-semibold">
            <span className="break-all">
              {owner ? formatAddress(owner) : "Unavailable"}
            </span>
            {owner && (
              <button
                type="button"
                onClick={handleCopyOwner}
                className="flex items-center justify-center rounded-full border border-[#d3c2a6] bg-[#fff7ea] p-1 text-[#6b5b45] transition hover:border-[#1c1914] hover:text-[#1c1914]"
                aria-label="Copy owner address"
                title={copiedOwner ? "Copied" : "Copy owner address"}
              >
                {copiedOwner ? (
                  <svg
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M20 6L9 17l-5-5" />
                  </svg>
                ) : (
                  <svg
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <rect x="9" y="9" width="13" height="13" rx="2" />
                    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                  </svg>
                )}
              </button>
            )}
          </span>
        </div>
        <div className="flex items-center justify-between">
          <span>Your funding</span>
          <span className="font-semibold">{userFundedEth} ETH</span>
        </div>
        <div className="flex items-center justify-between">
          <span>Permissions</span>
          <span className="font-semibold">
            {isOwner ? "Owner" : "Contributor"}
          </span>
        </div>
      </div>

      <div className="grid gap-3 rounded-2xl border border-dashed border-[#d8c7b0] bg-[#fff7ea] p-4 text-xs text-[#6b5b45]">
        <p className="uppercase tracking-[0.35em]">Protocol Notes</p>
        <p>
          Funding is automatically rejected below the USD floor. Withdraws
          remain owner-gated and verified by the contract.
        </p>
      </div>

      <div className="grid gap-3 rounded-2xl border border-[#eadfcf] bg-[#fffdf8] p-4 text-xs text-[#6b5b45]">
        <p className="uppercase tracking-[0.35em]">Wallet Checklist</p>
        <ul className="grid gap-2 text-[11px] text-[#5e5242] sm:text-xs">
          <li>Confirm you are on the intended network.</li>
          <li>Keep enough ETH for gas.</li>
          <li>Funding totals are tracked per address.</li>
        </ul>
      </div>

      <div className="grid gap-2 rounded-2xl border border-[#eadfcf] bg-[#fff7ea] p-4 text-xs text-[#6b5b45]">
        <p className="uppercase tracking-[0.35em]">Identity Snapshot</p>
        <div className="flex flex-col gap-2 text-xs text-[#5e5242]">
          <span className="break-all">Wallet: {address ?? "Not connected"}</span>
          <span>Role: {isOwner ? "Owner" : "Contributor"}</span>
        </div>
      </div>
    </div>
  );
}
