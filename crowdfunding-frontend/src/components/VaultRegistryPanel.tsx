import { useState } from "react";
import type { VaultActivity, VaultCatalogEntry } from "@/lib/vaultCatalog";

type VaultRegistryPanelProps = {
  vaults: VaultCatalogEntry[];
  onCreate: (payload: VaultCatalogEntry) => Promise<void>;
  onUpdate: (id: string, payload: Partial<VaultCatalogEntry>) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
};

type VaultFormState = {
  id: string;
  name: string;
  focus: string;
  tvl: string;
  activeProposals: string;
  riskRating: string;
  participation: string;
  horizon: string;
  overview: string;
  thesis: string;
  expectedOutcomes: string;
  fundingStructure: string;
  withdrawalConditions: string;
  governanceModel: string;
  deliverables: string;
  reports: string;
  datasets: string;
  ipRights: string;
  activity: string;
};

const emptyForm: VaultFormState = {
  id: "",
  name: "",
  focus: "",
  tvl: "",
  activeProposals: "0",
  riskRating: "Moderate",
  participation: "",
  horizon: "",
  overview: "",
  thesis: "",
  expectedOutcomes: "",
  fundingStructure: "",
  withdrawalConditions: "",
  governanceModel: "",
  deliverables: "",
  reports: "",
  datasets: "",
  ipRights: "",
  activity: "",
};

const linesToArray = (value: string) =>
  value
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);

const activityFromLines = (value: string): VaultActivity[] =>
  linesToArray(value).map((line) => {
    const [label, detail, timestamp] = line.split("|").map((part) => part.trim());
    return {
      label: label || "Update",
      detail: detail || "",
      timestamp: timestamp || "Recently",
    };
  });

const activityToLines = (items: VaultActivity[]) =>
  items
    .map((item) => `${item.label} | ${item.detail} | ${item.timestamp}`)
    .join("\n");

export default function VaultRegistryPanel({
  vaults,
  onCreate,
  onUpdate,
  onDelete,
}: VaultRegistryPanelProps) {
  const [formState, setFormState] = useState(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const resetForm = () => {
    setFormState(emptyForm);
    setEditingId(null);
    setStatus(null);
    setError(null);
  };

  const applyEdit = (vault: VaultCatalogEntry) => {
    setEditingId(vault.id);
    setFormState({
      id: vault.id,
      name: vault.name,
      focus: vault.focus,
      tvl: vault.tvl,
      activeProposals: String(vault.activeProposals ?? 0),
      riskRating: vault.riskRating ?? "Moderate",
      participation: vault.participation,
      horizon: vault.horizon,
      overview: vault.overview,
      thesis: vault.thesis,
      expectedOutcomes: (vault.expectedOutcomes ?? []).join("\n"),
      fundingStructure: (vault.fundingStructure ?? []).join("\n"),
      withdrawalConditions: (vault.withdrawalConditions ?? []).join("\n"),
      governanceModel: (vault.governanceModel ?? []).join("\n"),
      deliverables: (vault.deliverables ?? []).join("\n"),
      reports: (vault.reports ?? []).join("\n"),
      datasets: (vault.datasets ?? []).join("\n"),
      ipRights: vault.ipRights,
      activity: activityToLines(vault.activity ?? []),
    });
  };

  const handleSubmit = async () => {
    setStatus(null);
    setError(null);
    const payload: VaultCatalogEntry = {
      id: formState.id.trim(),
      name: formState.name.trim(),
      focus: formState.focus.trim(),
      tvl: formState.tvl.trim(),
      activeProposals: Number(formState.activeProposals) || 0,
      riskRating: formState.riskRating || "Moderate",
      participation: formState.participation.trim(),
      horizon: formState.horizon.trim(),
      overview: formState.overview.trim(),
      thesis: formState.thesis.trim(),
      expectedOutcomes: linesToArray(formState.expectedOutcomes),
      fundingStructure: linesToArray(formState.fundingStructure),
      withdrawalConditions: linesToArray(formState.withdrawalConditions),
      governanceModel: linesToArray(formState.governanceModel),
      deliverables: linesToArray(formState.deliverables),
      reports: linesToArray(formState.reports),
      datasets: linesToArray(formState.datasets),
      ipRights: formState.ipRights.trim(),
      activity: activityFromLines(formState.activity),
    };
    if (!payload.name || !payload.focus) {
      setError("Vault name and focus are required.");
      return;
    }
    setSaving(true);
    try {
      if (editingId) {
        await onUpdate(editingId, payload);
        setStatus("Vault updated.");
      } else {
        await onCreate(payload);
        setStatus("Vault added.");
      }
      resetForm();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Unable to save vault entry."
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="glass-panel animate-fade flex flex-col gap-6 p-6">
      <div className="flex flex-col gap-2">
        <p className="text-xs uppercase tracking-[0.35em] text-[#6b5b45]">
          Vault Registry
        </p>
        <p className="text-sm text-[#5e5242]">
          Manage dynamic vault entries with the same structure as the public
          vault catalog.
        </p>
      </div>

      <div className="grid gap-4 rounded-2xl border border-[#eadfcf] bg-[#fffdf8] p-4 text-xs text-[#5e5242]">
        <div className="grid gap-3 lg:grid-cols-2">
          <input
            value={formState.id}
            onChange={(event) =>
              setFormState((prev) => ({ ...prev, id: event.target.value }))
            }
            placeholder="Vault ID (optional slug)"
            className="w-full rounded-xl border border-[#d3c2a6] bg-white px-3 py-2 text-sm focus:border-[#000000] focus:outline-none focus:ring-1 focus:ring-[#000000]/20"
          />
          <input
            value={formState.name}
            onChange={(event) =>
              setFormState((prev) => ({ ...prev, name: event.target.value }))
            }
            placeholder="Vault name"
            className="w-full rounded-xl border border-[#d3c2a6] bg-white px-3 py-2 text-sm focus:border-[#000000] focus:outline-none focus:ring-1 focus:ring-[#000000]/20"
          />
          <input
            value={formState.focus}
            onChange={(event) =>
              setFormState((prev) => ({ ...prev, focus: event.target.value }))
            }
            placeholder="Research focus"
            className="w-full rounded-xl border border-[#d3c2a6] bg-white px-3 py-2 text-sm focus:border-[#000000] focus:outline-none focus:ring-1 focus:ring-[#000000]/20 lg:col-span-2"
          />
          <input
            value={formState.tvl}
            onChange={(event) =>
              setFormState((prev) => ({ ...prev, tvl: event.target.value }))
            }
            placeholder="TVL (e.g., 3200 ETH)"
            className="w-full rounded-xl border border-[#d3c2a6] bg-white px-3 py-2 text-sm focus:border-[#000000] focus:outline-none focus:ring-1 focus:ring-[#000000]/20"
          />
          <input
            value={formState.participation}
            onChange={(event) =>
              setFormState((prev) => ({
                ...prev,
                participation: event.target.value,
              }))
            }
            placeholder="Participation (e.g., 68%)"
            className="w-full rounded-xl border border-[#d3c2a6] bg-white px-3 py-2 text-sm focus:border-[#000000] focus:outline-none focus:ring-1 focus:ring-[#000000]/20"
          />
          <input
            value={formState.horizon}
            onChange={(event) =>
              setFormState((prev) => ({ ...prev, horizon: event.target.value }))
            }
            placeholder="Time horizon (e.g., 12-18 mo)"
            className="w-full rounded-xl border border-[#d3c2a6] bg-white px-3 py-2 text-sm focus:border-[#000000] focus:outline-none focus:ring-1 focus:ring-[#000000]/20"
          />
          <input
            value={formState.activeProposals}
            onChange={(event) =>
              setFormState((prev) => ({
                ...prev,
                activeProposals: event.target.value,
              }))
            }
            placeholder="Active proposals"
            type="number"
            min="0"
            className="w-full rounded-xl border border-[#d3c2a6] bg-white px-3 py-2 text-sm focus:border-[#000000] focus:outline-none focus:ring-1 focus:ring-[#000000]/20"
          />
          <select
            value={formState.riskRating}
            onChange={(event) =>
              setFormState((prev) => ({
                ...prev,
                riskRating: event.target.value,
              }))
            }
            className="w-full rounded-xl border border-[#d3c2a6] bg-white px-3 py-2 text-sm focus:border-[#000000] focus:outline-none focus:ring-1 focus:ring-[#000000]/20"
          >
            <option value="Low">Low</option>
            <option value="Moderate">Moderate</option>
            <option value="High">High</option>
          </select>
          <textarea
            value={formState.overview}
            onChange={(event) =>
              setFormState((prev) => ({ ...prev, overview: event.target.value }))
            }
            placeholder="Overview"
            className="min-h-20 w-full rounded-xl border border-[#d3c2a6] bg-white px-3 py-2 text-sm focus:border-[#000000] focus:outline-none focus:ring-1 focus:ring-[#000000]/20 lg:col-span-2"
          />
          <textarea
            value={formState.thesis}
            onChange={(event) =>
              setFormState((prev) => ({ ...prev, thesis: event.target.value }))
            }
            placeholder="Thesis"
            className="min-h-20 w-full rounded-xl border border-[#d3c2a6] bg-white px-3 py-2 text-sm focus:border-[#000000] focus:outline-none focus:ring-1 focus:ring-[#000000]/20 lg:col-span-2"
          />
        </div>

        <div className="grid gap-3 lg:grid-cols-2">
          <textarea
            value={formState.expectedOutcomes}
            onChange={(event) =>
              setFormState((prev) => ({
                ...prev,
                expectedOutcomes: event.target.value,
              }))
            }
            placeholder="Expected Outcomes (one per line)"
            className="min-h-24 w-full rounded-xl border border-[#d3c2a6] bg-white px-3 py-2 text-sm focus:border-[#000000] focus:outline-none focus:ring-1 focus:ring-[#000000]/20"
          />
          <textarea
            value={formState.fundingStructure}
            onChange={(event) =>
              setFormState((prev) => ({
                ...prev,
                fundingStructure: event.target.value,
              }))
            }
            placeholder="Funding Structure (one per line)"
            className="min-h-24 w-full rounded-xl border border-[#d3c2a6] bg-white px-3 py-2 text-sm focus:border-[#000000] focus:outline-none focus:ring-1 focus:ring-[#000000]/20"
          />
          <textarea
            value={formState.withdrawalConditions}
            onChange={(event) =>
              setFormState((prev) => ({
                ...prev,
                withdrawalConditions: event.target.value,
              }))
            }
            placeholder="Withdrawal Conditions (one per line)"
            className="min-h-24 w-full rounded-xl border border-[#d3c2a6] bg-white px-3 py-2 text-sm focus:border-[#000000] focus:outline-none focus:ring-1 focus:ring-[#000000]/20"
          />
          <textarea
            value={formState.governanceModel}
            onChange={(event) =>
              setFormState((prev) => ({
                ...prev,
                governanceModel: event.target.value,
              }))
            }
            placeholder="Governance Model (one per line)"
            className="min-h-24 w-full rounded-xl border border-[#d3c2a6] bg-white px-3 py-2 text-sm focus:border-[#000000] focus:outline-none focus:ring-1 focus:ring-[#000000]/20"
          />
          <textarea
            value={formState.deliverables}
            onChange={(event) =>
              setFormState((prev) => ({
                ...prev,
                deliverables: event.target.value,
              }))
            }
            placeholder="Deliverables (one per line)"
            className="min-h-24 w-full rounded-xl border border-[#d3c2a6] bg-white px-3 py-2 text-sm focus:border-[#000000] focus:outline-none focus:ring-1 focus:ring-[#000000]/20"
          />
          <textarea
            value={formState.reports}
            onChange={(event) =>
              setFormState((prev) => ({
                ...prev,
                reports: event.target.value,
              }))
            }
            placeholder="Reports (one per line)"
            className="min-h-24 w-full rounded-xl border border-[#d3c2a6] bg-white px-3 py-2 text-sm focus:border-[#000000] focus:outline-none focus:ring-1 focus:ring-[#000000]/20"
          />
          <textarea
            value={formState.datasets}
            onChange={(event) =>
              setFormState((prev) => ({
                ...prev,
                datasets: event.target.value,
              }))
            }
            placeholder="Datasets (one per line)"
            className="min-h-24 w-full rounded-xl border border-[#d3c2a6] bg-white px-3 py-2 text-sm focus:border-[#000000] focus:outline-none focus:ring-1 focus:ring-[#000000]/20"
          />
        </div>

        <textarea
          value={formState.ipRights}
          onChange={(event) =>
            setFormState((prev) => ({ ...prev, ipRights: event.target.value }))
          }
          placeholder="IP rights statement"
          className="min-h-20 w-full rounded-xl border border-[#d3c2a6] bg-white px-3 py-2 text-sm focus:border-[#000000] focus:outline-none focus:ring-1 focus:ring-[#000000]/20"
        />

        <textarea
          value={formState.activity}
          onChange={(event) =>
            setFormState((prev) => ({
              ...prev,
              activity: event.target.value,
            }))
          }
          placeholder="Activity entries (label | detail | timestamp per line)"
          className="min-h-24 w-full rounded-xl border border-[#d3c2a6] bg-white px-3 py-2 text-sm focus:border-[#000000] focus:outline-none focus:ring-1 focus:ring-[#000000]/20"
        />

        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={handleSubmit}
            disabled={saving}
            className="rounded-full border border-[#1c1914] px-4 py-2 text-[10px] uppercase tracking-[0.2em] text-[#1c1914] transition hover:bg-[#1c1914] hover:text-[#fff7ea] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {saving ? "Saving" : editingId ? "Update Vault" : "Add Vault"}
          </button>
          <button
            type="button"
            onClick={resetForm}
            className="rounded-full border border-[#1c1914] px-4 py-2 text-[10px] uppercase tracking-[0.2em] text-[#1c1914] transition hover:bg-[#1c1914] hover:text-[#fff7ea]"
          >
            Clear Form
          </button>
          {status && <span className="text-xs text-[#1c1914]">{status}</span>}
          {error && <span className="text-xs text-[#9a2c20]">{error}</span>}
        </div>
      </div>

      <div className="grid gap-3">
        <div className="flex items-center justify-between text-xs uppercase tracking-[0.3em] text-[#6b5b45]">
          <span>Vault Ledger</span>
          <span className="text-[10px] text-[#6b5b45]">
            {vaults.length} entries
          </span>
        </div>
        {vaults.length === 0 ? (
          <p className="text-sm text-[#5e5242]">No vaults registered yet.</p>
        ) : (
          <div className="grid gap-3">
            {vaults.map((vault) => (
              <div
                key={vault.id}
                className="flex flex-col gap-2 rounded-2xl border border-[#eadfcf] bg-white/70 p-4 text-sm text-[#5e5242]"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="text-base font-semibold text-[#1c1914]">
                    {vault.name}
                  </span>
                  <span className="chip">{vault.riskRating}</span>
                </div>
                <span className="text-xs">{vault.focus}</span>
                <div className="flex flex-wrap items-center gap-2 text-[10px] uppercase tracking-[0.2em] text-[#6b5b45]">
                  <span className="chip">TVL {vault.tvl}</span>
                  <span className="chip">
                    Proposals {vault.activeProposals}
                  </span>
                  <span className="chip">{vault.participation}</span>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() => applyEdit(vault)}
                    className="rounded-full border border-[#1c1914] px-3 py-1 text-[10px] uppercase tracking-[0.2em] text-[#1c1914] transition hover:bg-[#1c1914] hover:text-[#fff7ea]"
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    onClick={() => onDelete(vault.id)}
                    className="rounded-full border border-[#9a2c20] px-3 py-1 text-[10px] uppercase tracking-[0.2em] text-[#9a2c20] transition hover:bg-[#9a2c20] hover:text-[#fff7ea]"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
