type Signer = {
  id: string;
  address: string;
  role: string;
};

type WithdrawalRequest = {
  id: string;
  amountEth: number;
  recipient: string;
  reason: string;
  approvals: string[];
  threshold: number;
  status: "Pending" | "Executable" | "Executed";
  createdAt: string;
};

type TimeLockedReserve = {
  id: string;
  label: string;
  amountEth: number;
  unlockDate: string;
  status: "Locked" | "Available" | "Released";
};

type SecurityPanelProps = {
  signers: Signer[];
  threshold: number;
  walletAddress: string | null;
  requests: WithdrawalRequest[];
  reserves: TimeLockedReserve[];
  onAddSigner: (signer: Omit<Signer, "id">) => void;
  onRemoveSigner: (id: string) => void;
  onThresholdChange: (value: number) => void;
  onAddRequest: (request: Omit<WithdrawalRequest, "id" | "approvals" | "status" | "createdAt">) => void;
  onApproveRequest: (id: string, signer: string) => void;
  onExecuteRequest: (id: string) => void;
  onAddReserve: (reserve: Omit<TimeLockedReserve, "id" | "status">) => void;
  onReleaseReserve: (id: string) => void;
  onExportAuditCsv: () => void;
  onExportAuditPdf: () => void;
};

export default function SecurityPanel({
  signers,
  threshold,
  walletAddress,
  requests,
  reserves,
  onAddSigner,
  onRemoveSigner,
  onThresholdChange,
  onAddRequest,
  onApproveRequest,
  onExecuteRequest,
  onAddReserve,
  onReleaseReserve,
  onExportAuditCsv,
  onExportAuditPdf,
}: SecurityPanelProps) {
  return (
    <div className="glass-panel animate-fade flex flex-col gap-6 p-6">
      <div className="flex flex-col gap-2">
        <p className="text-xs uppercase tracking-[0.35em] text-[#6b5b45]">
          Security & Institutional Grade
        </p>
        <p className="text-sm text-[#5e5242]">
          Configure multi-sig controls, time-locked reserves, and compliance
          exports for institutional oversight.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2 items-start">
        <div className="grid h-fit gap-4 rounded-2xl border border-[#eadfcf] bg-[#fffdf8] p-4 text-xs text-[#6b5b45]">
          <div className="flex items-center justify-between">
            <p className="uppercase tracking-[0.35em]">Multi-sig Withdrawals</p>
            <span className="text-[10px] text-[#6b5b45]">
              Threshold: {threshold}
            </span>
          </div>
          <form
            className="grid gap-2"
            onSubmit={(event) => {
              event.preventDefault();
              const form = event.currentTarget as HTMLFormElement;
              const data = new FormData(form);
              const address = String(data.get("signer-address") || "").trim();
              const role = String(data.get("signer-role") || "").trim();
              if (!address || !role) return;
              onAddSigner({ address, role });
              form.reset();
            }}
          >
            <input
              name="signer-address"
              placeholder="Signer address"
              className="w-full rounded-xl border border-[#d3c2a6] bg-[#fffdf8] px-3 py-2 text-sm focus:border-[#000000] focus:outline-none focus:ring-1 focus:ring-[#000000]/20"
            />
            <div className="grid gap-2 sm:grid-cols-2">
              <input
                name="signer-role"
                placeholder="Role (e.g., Research lead)"
                className="w-full rounded-xl border border-[#d3c2a6] bg-[#fffdf8] px-3 py-2 text-sm focus:border-[#000000] focus:outline-none focus:ring-1 focus:ring-[#000000]/20"
              />
              <input
                name="signer-threshold"
                type="number"
                min="1"
                value={threshold}
                onChange={(event) =>
                  onThresholdChange(Number(event.target.value) || 1)
                }
                className="w-full rounded-xl border border-[#d3c2a6] bg-[#fffdf8] px-3 py-2 text-sm focus:border-[#000000] focus:outline-none focus:ring-1 focus:ring-[#000000]/20"
              />
            </div>
            <button className="rounded-full border border-[#1c1914] px-3 py-2 text-[10px] uppercase tracking-[0.2em] transition hover:bg-[#1c1914] hover:text-[#fff7ea]">
              Add Signer
            </button>
          </form>
          <div className="grid gap-2">
            {signers.length === 0 ? (
              <p className="text-[11px] text-[#5e5242]">
                Add signers to enable approvals.
              </p>
            ) : (
              signers.map((signer) => (
                <div
                  key={signer.id}
                  className="flex items-center justify-between rounded-xl border border-[#eadfcf] bg-white/70 p-3 text-[11px] text-[#5e5242]"
                >
                  <div>
                    <div className="text-xs text-[#1c1914]">
                      {signer.address}
                    </div>
                    <div>{signer.role}</div>
                  </div>
                  <button
                    type="button"
                    onClick={() => onRemoveSigner(signer.id)}
                    className="text-[10px] uppercase tracking-[0.2em] text-[#9a2c20]"
                  >
                    Remove
                  </button>
                </div>
              ))
            )}
          </div>

          <div className="mt-2 grid gap-3 rounded-2xl border border-[#eadfcf] bg-[#fff7ea] p-3 text-[11px] text-[#5e5242]">
            <span className="text-[10px] uppercase tracking-[0.3em] text-[#6b5b45]">
              Withdrawal Requests
            </span>
            <form
              className="grid gap-2"
              onSubmit={(event) => {
                event.preventDefault();
                const form = event.currentTarget as HTMLFormElement;
                const data = new FormData(form);
                const amountEth = Number(data.get("request-amount"));
                const recipient = String(
                  data.get("request-recipient") || ""
                ).trim();
                const reason = String(data.get("request-reason") || "").trim();
                if (!recipient || !reason || !Number.isFinite(amountEth)) return;
                onAddRequest({ amountEth, recipient, reason, threshold });
                form.reset();
              }}
            >
              <input
                name="request-amount"
                type="number"
                min="0"
                step="0.001"
                placeholder="Amount (ETH)"
                className="w-full rounded-xl border border-[#d3c2a6] bg-[#fffdf8] px-3 py-2 text-sm focus:border-[#000000] focus:outline-none focus:ring-1 focus:ring-[#000000]/20"
              />
              <input
                name="request-recipient"
                placeholder="Recipient"
                className="w-full rounded-xl border border-[#d3c2a6] bg-[#fffdf8] px-3 py-2 text-sm focus:border-[#000000] focus:outline-none focus:ring-1 focus:ring-[#000000]/20"
              />
              <input
                name="request-reason"
                placeholder="Reason / budget line"
                className="w-full rounded-xl border border-[#d3c2a6] bg-[#fffdf8] px-3 py-2 text-sm focus:border-[#000000] focus:outline-none focus:ring-1 focus:ring-[#000000]/20"
              />
              <button className="rounded-full border border-[#1c1914] px-3 py-2 text-[10px] uppercase tracking-[0.2em] transition hover:bg-[#1c1914] hover:text-[#fff7ea]">
                Submit Request
              </button>
            </form>
            <div className="grid gap-2">
              {requests.length === 0 ? (
                <p className="text-[11px] text-[#5e5242]">
                  No withdrawal requests yet.
                </p>
              ) : (
                requests.map((request) => (
                  <div
                    key={request.id}
                    className="grid gap-1 rounded-xl border border-[#eadfcf] bg-white/70 p-3 text-[11px] text-[#5e5242]"
                  >
                    <span className="text-xs text-[#1c1914]">
                      {request.amountEth} ETH → {request.recipient}
                    </span>
                    <span>Reason: {request.reason}</span>
                    <span>Status: {request.status}</span>
                    <span>
                      Approvals: {request.approvals.length}/{request.threshold}
                    </span>
                    <span>Created: {request.createdAt}</span>
                    <div className="flex flex-wrap gap-2">
                      {walletAddress && (
                        <button
                          type="button"
                          onClick={() => onApproveRequest(request.id, walletAddress)}
                          className="rounded-full border border-[#1c1914] px-3 py-1 text-[10px] uppercase tracking-[0.2em] transition hover:bg-[#1c1914] hover:text-[#fff7ea]"
                        >
                          Approve as Wallet
                        </button>
                      )}
                      {request.status !== "Executed" &&
                        request.approvals.length >= request.threshold && (
                          <button
                            type="button"
                            onClick={() => onExecuteRequest(request.id)}
                            className="rounded-full border border-[#1c1914] bg-[#1c1914] px-3 py-1 text-[10px] uppercase tracking-[0.2em] text-[#fff7ea] transition hover:bg-[#3a2e1d]"
                          >
                            Mark Executed
                          </button>
                        )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        <div className="grid h-fit gap-4 rounded-2xl border border-[#eadfcf] bg-[#fffdf8] p-4 text-xs text-[#6b5b45]">
          <p className="uppercase tracking-[0.35em]">Time-locked Reserves</p>
          <form
            className="grid gap-2"
            onSubmit={(event) => {
              event.preventDefault();
              const form = event.currentTarget as HTMLFormElement;
              const data = new FormData(form);
              const label = String(data.get("reserve-label") || "").trim();
              const amountEth = Number(data.get("reserve-amount"));
              const unlockDate = String(
                data.get("reserve-date") || ""
              ).trim();
              if (!label || !Number.isFinite(amountEth)) return;
              onAddReserve({ label, amountEth, unlockDate });
              form.reset();
            }}
          >
            <input
              name="reserve-label"
              placeholder="Reserve label"
              className="w-full rounded-xl border border-[#d3c2a6] bg-[#fffdf8] px-3 py-2 text-sm focus:border-[#000000] focus:outline-none focus:ring-1 focus:ring-[#000000]/20"
            />
            <div className="grid gap-2 sm:grid-cols-2">
              <input
                name="reserve-amount"
                type="number"
                min="0"
                step="0.001"
                placeholder="Amount (ETH)"
                className="w-full rounded-xl border border-[#d3c2a6] bg-[#fffdf8] px-3 py-2 text-sm focus:border-[#000000] focus:outline-none focus:ring-1 focus:ring-[#000000]/20"
              />
              <input
                name="reserve-date"
                type="date"
                className="w-full rounded-xl border border-[#d3c2a6] bg-[#fffdf8] px-3 py-2 text-sm focus:border-[#000000] focus:outline-none focus:ring-1 focus:ring-[#000000]/20"
              />
            </div>
            <button className="rounded-full border border-[#1c1914] px-3 py-2 text-[10px] uppercase tracking-[0.2em] transition hover:bg-[#1c1914] hover:text-[#fff7ea]">
              Add Reserve
            </button>
          </form>
          <div className="grid gap-2">
            {reserves.length === 0 ? (
              <p className="text-[11px] text-[#5e5242]">
                No reserves configured yet.
              </p>
            ) : (
              reserves.map((reserve) => (
                <div
                  key={reserve.id}
                  className="grid gap-1 rounded-xl border border-[#eadfcf] bg-white/70 p-3 text-[11px] text-[#5e5242]"
                >
                  <span className="text-xs text-[#1c1914]">
                    {reserve.label}
                  </span>
                  <span>Amount: {reserve.amountEth} ETH</span>
                  <span>Unlock: {reserve.unlockDate || "—"}</span>
                  <span>Status: {reserve.status}</span>
                  {reserve.status !== "Released" && (
                    <button
                      type="button"
                      onClick={() => onReleaseReserve(reserve.id)}
                      className="mt-1 text-[10px] uppercase tracking-[0.2em] text-[#1c1914]"
                    >
                      Mark Released
                    </button>
                  )}
                </div>
              ))
            )}
          </div>
        </div>

        <div className="col-span-full grid h-fit gap-4 rounded-2xl border border-[#eadfcf] bg-[#fff7ea] p-4 text-xs text-[#6b5b45]">
          <p className="uppercase tracking-[0.35em]">Audit & Compliance Exports</p>
          <p className="text-[11px] text-[#5e5242]">
            Generate investor-ready reporting with current governance, security,
            and treasury metadata.
          </p>
          <div className="grid gap-2 sm:grid-cols-2">
            <button
              type="button"
              onClick={onExportAuditCsv}
              className="w-full rounded-full border border-[#1c1914] px-3 py-2 text-[10px] uppercase tracking-[0.2em] transition hover:bg-[#1c1914] hover:text-[#fff7ea]"
            >
              Audit CSV
            </button>
            <button
              type="button"
              onClick={onExportAuditPdf}
              className="w-full rounded-full border border-[#1c1914] bg-[#1c1914] px-3 py-2 text-[10px] uppercase tracking-[0.2em] text-[#fff7ea] transition hover:bg-[#3a2e1d]"
            >
              Audit PDF
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
