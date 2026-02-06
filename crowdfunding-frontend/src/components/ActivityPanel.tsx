/* eslint-disable react-hooks/set-state-in-effect */
import { useEffect, useState } from "react";

type ActivityItem = {
  type: "Funded" | "Withdrawn";
  amountEth: string;
  from: string;
  timestamp: string;
  txHash: string;
};

type ActivityPanelProps = {
  items: ActivityItem[];
};

export default function ActivityPanel({ items }: ActivityPanelProps) {
  const [page, setPage] = useState(1);
  const pageSize = 10;
  const pageCount = Math.max(1, Math.ceil(items.length / pageSize));
  const pageItems = items.slice((page - 1) * pageSize, page * pageSize);

  useEffect(() => {
    if (page > pageCount) setPage(1);
  }, [pageCount, page]);

  return (
    <div className="glass-panel animate-fade flex h-full flex-col gap-4 p-6">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-xs uppercase tracking-[0.35em] text-[#6b5b45]">
          Activity Preview
        </p>
        <span className="text-xs text-[#6b5b45]">
          {items.length > 0 ? "Recent events" : "No events yet"}
        </span>
      </div>
      <div className="grid gap-3 text-sm">
        {items.length === 0 ? (
          <>
            <div className="rounded-2xl border border-[#eadfcf] bg-[#fff7ea] p-4">
              <p className="font-semibold">Funded</p>
              <p className="text-xs text-[#6b5b45]">
                Events will appear once on-chain activity is detected.
              </p>
            </div>
            <div className="rounded-2xl border border-[#eadfcf] bg-[#fffdf8] p-4">
              <p className="font-semibold">Withdrawn</p>
              <p className="text-xs text-[#6b5b45]">
                Owner withdrawals will surface here automatically.
              </p>
            </div>
          </>
        ) : (
          pageItems.map((item) => (
            <div
              key={`${item.txHash}-${item.type}`}
              className="min-w-0 rounded-2xl border border-[#eadfcf] bg-[#fffdf8] p-4"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="font-semibold">{item.type}</p>
                <span className="text-xs text-[#6b5b45]">{item.timestamp}</span>
              </div>
              <p className="mt-2 text-sm text-[#1c1914]">
                {item.amountEth} ETH
              </p>
              <p className="text-xs text-[#6b5b45] break-all">{item.from}</p>
            </div>
          ))
        )}
      </div>
      {items.length > pageSize && (
        <div className="mt-2 flex flex-wrap items-center justify-between gap-2 text-[11px] text-[#6b5b45]">
          <button
            type="button"
            onClick={() => setPage((prev) => Math.max(1, prev - 1))}
            className="w-full rounded-full border border-[#1c1914] px-3 py-1 uppercase tracking-[0.2em] text-[#1c1914] transition hover:bg-[#1c1914] hover:text-[#fff7ea] sm:w-auto"
            disabled={page === 1}
          >
            Prev
          </button>
          <span className="w-full text-center sm:w-auto">
            Page {page} of {pageCount}
          </span>
          <button
            type="button"
            onClick={() => setPage((prev) => Math.min(pageCount, prev + 1))}
            className="w-full rounded-full border border-[#1c1914] px-3 py-1 uppercase tracking-[0.2em] text-[#1c1914] transition hover:bg-[#1c1914] hover:text-[#fff7ea] sm:w-auto"
            disabled={page === pageCount}
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}
