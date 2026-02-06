type StatusPanelProps = {
  status: string | null;
  error: string | null;
};

export default function StatusPanel({ status, error }: StatusPanelProps) {
  return (
    <div className="glass-panel animate-fade flex h-full min-w-0 flex-col gap-4 p-6">
      <p className="text-xs uppercase tracking-[0.35em] text-[#6b5b45]">
        Status Feed
      </p>
      {status && (
        <p className="text-sm text-[#1c1914] break-all">{status}</p>
      )}
      {error && <p className="text-sm text-[#9a2c20] break-all">{error}</p>}
      {!status && !error && (
        <p className="text-sm text-[#5e5242]">
          Ready. Connect a wallet to begin.
        </p>
      )}
      <div className="rounded-2xl border border-[#eadfcf] bg-[#fffdf8] p-4 text-xs text-[#6b5b45]">
        Keep this panel open to monitor transaction updates.
      </div>
    </div>
  );
}
