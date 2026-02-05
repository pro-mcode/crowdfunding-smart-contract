export default function ActivityPanel() {
  return (
    <div className="glass-panel animate-fade flex flex-col gap-4 p-6">
      <div className="flex items-center justify-between">
        <p className="text-xs uppercase tracking-[0.35em] text-[#6b5b45]">
          Activity Preview
        </p>
        <span className="text-xs text-[#6b5b45]">Events (coming soon)</span>
      </div>
      <div className="grid gap-3 text-sm">
        <div className="rounded-2xl border border-[#eadfcf] bg-[#fff7ea] p-4">
          <p className="font-semibold">Funded</p>
          <p className="text-xs text-[#6b5b45]">
            Connect an indexer to surface on-chain events here.
          </p>
        </div>
        <div className="rounded-2xl border border-[#eadfcf] bg-[#fffdf8] p-4">
          <p className="font-semibold">Withdrawn</p>
          <p className="text-xs text-[#6b5b45]">
            Owner withdrawals will appear as soon as you attach logs.
          </p>
        </div>
      </div>
    </div>
  );
}
