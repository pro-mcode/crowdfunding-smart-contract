import Sparkline from "@/components/Sparkline";

type ExperimentRow = {
  usd: number;
  exactEth: string;
  safeEth: string;
};

type ResearchPanelProps = {
  usdPerEth: string;
  minEthExact: string;
  minEthSafe: string;
  feedUpdatedAgo: string;
  simulateEnabled: boolean;
  simulatedPrice: string;
  onToggleSimulate: () => void;
  onSimulatedPriceChange: (value: string) => void;
  experiments: ExperimentRow[];
  onSelectExperiment: (value: string) => void;
  velocityPoints: number[];
  onExportCsv: () => void;
  onExportSummaryCsv: () => void;
  onSaveSnapshot: () => void;
  onClearSnapshots: () => void;
  snapshots: { savedAt: string; chainId: number; totalFundedEth: string }[];
  researchNotes: string;
  onResearchNotesChange: (value: string) => void;
  experimentLog: { label: string; timestamp: string }[];
  blockInfo: {
    chainId: number | null;
    latestBlock: string;
    gasPriceGwei: string;
    rpcLatencyMs: string;
  };
  analytics: {
    totalFundedEth: string;
    uniqueFunders: number;
    totalFundingCount: number;
    lastFundedAt: string;
    lastWithdrawnAt: string;
  };
};

export default function ResearchPanel({
  usdPerEth,
  minEthExact,
  minEthSafe,
  feedUpdatedAgo,
  simulateEnabled,
  simulatedPrice,
  onToggleSimulate,
  onSimulatedPriceChange,
  experiments,
  onSelectExperiment,
  velocityPoints,
  onExportCsv,
  onExportSummaryCsv,
  onSaveSnapshot,
  onClearSnapshots,
  snapshots,
  researchNotes,
  onResearchNotesChange,
  experimentLog,
  blockInfo,
  analytics,
}: ResearchPanelProps) {
  return (
    <div className="glass-panel animate-fade flex flex-col gap-5 p-6">
      <div className="flex flex-col gap-2">
        <p className="text-xs uppercase tracking-[0.35em] text-[#6b5b45]">
          Research Console
        </p>
        <p className="text-sm text-[#5e5242]">
          Experiment with thresholds, simulate price conditions, and review feed
          freshness before funding.
        </p>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="grid gap-4 rounded-2xl border border-[#eadfcf] bg-[#fffdf8] p-4 text-xs text-[#6b5b45]">
          <p className="uppercase tracking-[0.35em]">Risk Profile</p>
          <div className="grid gap-2 text-sm text-[#1c1914]">
            <span>Price feed age: {feedUpdatedAgo}</span>
            <span>Current price: 1 ETH ≈ ${usdPerEth}</span>
            <span>Minimum (exact): {minEthExact} ETH</span>
            <span>Minimum (safe): {minEthSafe} ETH</span>
            <span>
              Simulation mode: {simulateEnabled ? "Enabled" : "Disabled"}
            </span>
          </div>
        </div>

        <div className="grid gap-4 rounded-2xl border border-[#eadfcf] bg-[#fff7ea] p-4 text-xs text-[#6b5b45]">
          <p className="uppercase tracking-[0.35em]">Research Metrics</p>
          <div className="grid gap-3 text-sm text-[#1c1914] grid-cols-1">
            <div className="flex items-center justify-between">
              <span>Total funded</span>
              <span className="font-semibold">
                {analytics.totalFundedEth} ETH
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span>Unique funders</span>
              <span className="font-semibold">{analytics.uniqueFunders}</span>
            </div>
            <div className="flex items-center justify-between">
              <span>Funding events</span>
              <span className="font-semibold">
                {analytics.totalFundingCount}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span>Last funded</span>
              <span className="font-semibold">{analytics.lastFundedAt}</span>
            </div>
            <div className="flex items-center justify-between">
              <span>Last withdrawn</span>
              <span className="font-semibold">{analytics.lastWithdrawnAt}</span>
            </div>
          </div>
        </div>

        <div className="grid gap-3 rounded-2xl border border-[#eadfcf] bg-[#fffdf8] p-4 text-xs text-[#6b5b45]">
          <div className="flex items-center justify-between">
            <p className="uppercase tracking-[0.35em]">Funding Velocity</p>
            <span className="text-[10px] text-[#6b5b45]">Last 8 hours</span>
          </div>
          <div className="rounded-xl border border-[#eadfcf] bg-white/70 p-3">
            <div className="flex items-center justify-between text-[11px] text-[#5e5242]">
              <span>Fund events / hour</span>
              <span className="text-[10px] text-[#6b5b45]">Hover dots</span>
            </div>
            <div className="mt-2">
              <Sparkline points={velocityPoints} />
            </div>
          </div>
        </div>

        <div className="grid gap-4 rounded-2xl border border-[#eadfcf] bg-[#fff7ea] p-4 text-xs text-[#6b5b45]">
          <div className="flex items-center justify-between gap-3">
            <p className="uppercase tracking-[0.35em]">Simulation Mode</p>
            <button
              type="button"
              onClick={onToggleSimulate}
              className="rounded-full border border-[#1c1914] px-3 py-1 text-[10px] uppercase tracking-[0.2em] transition hover:bg-[#1c1914] hover:text-[#fff7ea]"
            >
              {simulateEnabled ? "Disable" : "Enable"}
            </button>
          </div>
          <div className="grid gap-2">
            <label className="text-[10px] uppercase tracking-[0.2em] text-[#6b5b45]">
              Simulated ETH Price (USD)
            </label>
            <input
              value={simulatedPrice}
              onChange={(event) => onSimulatedPriceChange(event.target.value)}
              className="w-full rounded-xl border border-[#d3c2a6] bg-[#fffdf8] px-3 py-2 text-sm"
              placeholder="2000"
            />
            <p className="text-[11px] text-[#5e5242]">
              Toggle to preview how funding thresholds behave under different
              market prices.
            </p>
          </div>
        </div>

        <div className="grid gap-3 rounded-2xl border border-[#eadfcf] bg-[#fffdf8] p-4 text-xs text-[#6b5b45]">
          <p className="uppercase tracking-[0.35em]">Research Notes</p>
          <textarea
            value={researchNotes}
            onChange={(event) => onResearchNotesChange(event.target.value)}
            className="min-h-30 w-full rounded-xl border border-[#d3c2a6] bg-[#fffdf8] px-3 py-2 text-sm text-[#1c1914] focus:border-[#000000] focus:outline-none focus:ring-1 focus:ring-[#000000]/20"
            placeholder="Hypothesis, observation, next test..."
          />
        </div>

        <div className="grid gap-3 rounded-2xl border border-[#eadfcf] bg-[#fff7ea] p-4 text-xs text-[#6b5b45]">
          <p className="uppercase tracking-[0.35em]">Exports</p>
          <div className="grid gap-2 sm:grid-cols-2">
            <button
              type="button"
              onClick={onExportCsv}
              className="w-full rounded-full border border-[#1c1914] px-3 py-2 text-[10px] uppercase tracking-[0.2em] transition hover:bg-[#1c1914] hover:text-[#fff7ea]"
            >
              Download CSV
            </button>
            <button
              type="button"
              onClick={onExportSummaryCsv}
              className="w-full rounded-full border border-[#1c1914] px-3 py-2 text-[10px] uppercase tracking-[0.2em] transition hover:bg-[#1c1914] hover:text-[#fff7ea]"
            >
              Summary CSV
            </button>
            <button
              type="button"
              onClick={onSaveSnapshot}
              className="w-full rounded-full border border-[#1c1914] bg-[#1c1914] px-3 py-2 text-[10px] uppercase tracking-[0.2em] text-[#fff7ea] transition hover:bg-[#3a2e1d]"
            >
              Save Snapshot
            </button>
            <button
              type="button"
              onClick={onClearSnapshots}
              className="w-full rounded-full border border-[#9a2c20] px-3 py-2 text-[10px] uppercase tracking-[0.2em] text-[#9a2c20] transition hover:bg-[#9a2c20] hover:text-white"
            >
              Clear Snapshots
            </button>
          </div>
          <p className="text-[11px] text-[#5e5242]">
            CSV exports include recent on-chain events. Snapshots persist
            locally.
          </p>
        </div>

        <div className="col-span-full grid gap-3 rounded-2xl border border-[#eadfcf] bg-[#fffdf8] p-4 text-xs text-[#6b5b45]">
          <p className="uppercase tracking-[0.35em]">Threshold Experiments</p>
          <div className="grid gap-2 text-xs">
            {experiments.map((experiment) => (
              <div
                key={experiment.usd}
                className="flex flex-col gap-2 rounded-xl border border-[#eadfcf] bg-white/70 p-3 text-[#5e5242] sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="text-sm font-semibold text-[#1c1914]">
                  ${experiment.usd} minimum
                </div>
                <div className="text-[11px]">
                  Exact {experiment.exactEth} ETH · Safe {experiment.safeEth}{" "}
                  ETH
                </div>
                <button
                  type="button"
                  onClick={() => onSelectExperiment(experiment.safeEth)}
                  className="rounded-full border border-[#1c1914] px-3 py-1 text-[10px] uppercase tracking-[0.2em] transition hover:bg-[#1c1914] hover:text-[#fff7ea]"
                >
                  Use Safe
                </button>
              </div>
            ))}
          </div>
        </div>

        <div className="col-span-full grid gap-3 rounded-2xl border border-[#eadfcf] bg-[#fffdf8] p-4 text-xs text-[#6b5b45]">
          <p className="uppercase tracking-[0.35em]">Snapshot History</p>
          {snapshots.length === 0 ? (
            <p className="text-[11px] text-[#5e5242]">
              No snapshots saved yet.
            </p>
          ) : (
            <div className="grid gap-2">
              {snapshots.slice(0, 5).map((snapshot) => (
                <div
                  key={snapshot.savedAt}
                  className="flex flex-col gap-1 rounded-xl border border-[#eadfcf] bg-white/70 p-3 text-[11px] text-[#5e5242]"
                >
                  <span className="text-xs text-[#1c1914]">
                    {new Date(snapshot.savedAt).toLocaleString()}
                  </span>
                  <span>Chain: {snapshot.chainId}</span>
                  <span>Total funded: {snapshot.totalFundedEth} ETH</span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="col-span-full grid gap-3 rounded-2xl border border-[#eadfcf] bg-[#fff7ea] p-4 text-xs text-[#6b5b45]">
          <p className="uppercase tracking-[0.35em]">Experiment Log</p>
          {experimentLog.length === 0 ? (
            <p className="text-[11px] text-[#5e5242]">
              No experiments run yet.
            </p>
          ) : (
            <div className="grid gap-2">
              {experimentLog.slice(0, 3).map((entry) => (
                <div
                  key={`${entry.label}-${entry.timestamp}`}
                  className="rounded-xl border border-[#eadfcf] bg-white/70 p-3 text-[11px] text-[#5e5242]"
                >
                  <span className="text-xs text-[#1c1914]">{entry.label}</span>
                  <div>{entry.timestamp}</div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="grid gap-3 rounded-2xl border border-[#eadfcf] bg-[#fffdf8] p-4 text-xs text-[#6b5b45]">
          <p className="uppercase tracking-[0.35em]">Network Health</p>
          <div className="grid gap-2 text-sm text-[#1c1914]">
            <span>Chain ID: {blockInfo.chainId ?? "Unknown"}</span>
            <span>Latest block: {blockInfo.latestBlock}</span>
            <span>Gas price: {blockInfo.gasPriceGwei} gwei</span>
            <span>RPC latency: {blockInfo.rpcLatencyMs} ms</span>
          </div>
        </div>

        <div className="grid gap-3 rounded-2xl border border-[#eadfcf] bg-[#fffdf8] p-4 text-xs text-[#6b5b45]">
          <p className="uppercase tracking-[0.35em]">Protocol Settings</p>
          <div className="grid gap-2 text-sm text-[#1c1914]">
            <span>Safety buffer: 1%</span>
            <span>Simulated price: ${simulatedPrice || "—"}</span>
            <span>Threshold basis: USD minimum</span>
          </div>
        </div>
      </div>
    </div>
  );
}
