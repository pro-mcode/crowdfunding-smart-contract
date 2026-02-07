/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable react-hooks/exhaustive-deps */
"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { BrowserProvider, Contract, formatEther, parseEther } from "ethers";
import { FUNDME_ABI } from "@/lib/fundmeAbi";
import {
  FUNDME_ADDRESS,
  DEFAULT_CHAIN_ID,
  getFundMeAddress,
} from "@/lib/network";
import HeroHeader from "@/components/HeroHeader";
import WalletPanel from "@/components/WalletPanel";
import FundPanel from "@/components/FundPanel";
import ActivityPanel from "@/components/ActivityPanel";
import ResearchPanel from "@/components/ResearchPanel";
import SiteShell from "@/components/SiteShell";
import Link from "next/link";
import { VAULT_CATALOG, type VaultCatalogEntry } from "@/lib/vaultCatalog";
import { LEARN_CATALOG, type LearnEntry } from "@/lib/learnCatalog";
// import VaultOpsPanel from "@/components/VaultOpsPanel";
// import GovernancePanel from "@/components/GovernancePanel";
// import SecurityPanel from "@/components/SecurityPanel";
// import AdvancedPanel from "@/components/AdvancedPanel";

type WalletState = {
  address: string | null;
  chainId: number | null;
};

type ContractState = {
  owner: string | null;
  balanceEth: string;
  minimumUsd: string;
  priceFeed: string | null;
  version: string | null;
  userFundedEth: string;
};

type PriceState = {
  minEthForUsd: string;
  safeMinEthForUsd: string;
  usdPerEth: string;
  feedUpdatedAgo: string;
};

type ActivityItem = {
  type: "Funded" | "Withdrawn";
  amountEth: string;
  from: string;
  timestamp: string;
  txHash: string;
};

type AnalyticsState = {
  totalFundedEth: string;
  uniqueFunders: number;
  totalFundingCount: number;
  lastFundedAt: string;
  lastWithdrawnAt: string;
};

type BudgetBucket = {
  id: string;
  label: string;
  percent: number;
};

type Milestone = {
  id: string;
  title: string;
  status: "Planned" | "In Progress" | "Complete";
  targetDate: string;
};

type Publication = {
  id: string;
  title: string;
  url: string;
  summary: string;
};

type Proposal = {
  id: string;
  title: string;
  track: string;
  summary: string;
  requestedEth: number;
  status: "Draft" | "In Review" | "Approved" | "Rejected";
  submittedAt: string;
};

type Vote = {
  id: string;
  proposalId: string;
  voter: string;
  choice: "For" | "Against" | "Abstain";
  weight: number;
  timestamp: string;
};

type MilestoneUnlock = {
  id: string;
  milestoneTitle: string;
  amountEth: number;
  proofHash: string;
  dueDate: string;
  status: "Pending" | "Unlocked" | "Released";
  releasedAt: string | null;
};

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

type ExperimentEntry = {
  id: string;
  title: string;
  summary: string;
  datasetUrl: string;
  hash: string;
  createdAt: string;
};

type ReputationBadge = {
  id: string;
  recipient: string;
  badge: string;
  tokenId: string;
  issuedAt: string;
};

type TokenomicsScenario = {
  id: string;
  label: string;
  rewardRate: number;
  lockupDays: number;
  inflationRate: number;
  notes: string;
  projectedAnnualEmissions: number;
};

type StatusEntry = {
  message: string;
  type: "status" | "error";
  timestamp: string;
};

export default function Home() {
  const [wallet, setWallet] = useState<WalletState>({
    address: null,
    chainId: null,
  });
  const [contractState, setContractState] = useState<ContractState>({
    owner: null,
    balanceEth: "0",
    minimumUsd: "0",
    priceFeed: null,
    version: null,
    userFundedEth: "0",
  });
  const [fundAmount, setFundAmount] = useState("0.1");
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [statusHistory, setStatusHistory] = useState<StatusEntry[]>([]);
  const [priceState, setPriceState] = useState<PriceState>({
    minEthForUsd: "0",
    safeMinEthForUsd: "0",
    usdPerEth: "0",
    feedUpdatedAgo: "Unknown",
  });
  const [simulateEnabled, setSimulateEnabled] = useState(false);
  const [simulatedPrice, setSimulatedPrice] = useState("2000");
  const [activityItems, setActivityItems] = useState<ActivityItem[]>([]);
  const [analytics, setAnalytics] = useState<AnalyticsState>({
    totalFundedEth: "0",
    uniqueFunders: 0,
    totalFundingCount: 0,
    lastFundedAt: "—",
    lastWithdrawnAt: "—",
  });
  const [snapshots, setSnapshots] = useState<
    { savedAt: string; chainId: number; totalFundedEth: string }[]
  >([]);
  const [researchNotes, setResearchNotes] = useState("");
  const [experimentLog, setExperimentLog] = useState<
    { label: string; timestamp: string }[]
  >([]);
  const [buckets, setBuckets] = useState<BudgetBucket[]>([]);
  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [publications, setPublications] = useState<Publication[]>([]);
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [votes, setVotes] = useState<Vote[]>([]);
  const [unlocks, setUnlocks] = useState<MilestoneUnlock[]>([]);
  const [signers, setSigners] = useState<Signer[]>([]);
  const [withdrawRequests, setWithdrawRequests] = useState<WithdrawalRequest[]>(
    []
  );
  const [reserves, setReserves] = useState<TimeLockedReserve[]>([]);
  const [experimentsLedger, setExperimentsLedger] = useState<ExperimentEntry[]>(
    []
  );
  const [badges, setBadges] = useState<ReputationBadge[]>([]);
  const [tokenomics, setTokenomics] = useState<TokenomicsScenario[]>([]);
  const [vaultCatalog, setVaultCatalog] =
    useState<VaultCatalogEntry[]>(VAULT_CATALOG);
  const [learnCatalog, setLearnCatalog] = useState<LearnEntry[]>(LEARN_CATALOG);
  const [multisigThreshold, setMultisigThreshold] = useState(2);
  const [blockInfo, setBlockInfo] = useState({
    chainId: null as number | null,
    latestBlock: "—",
    gasPriceGwei: "—",
    rpcLatencyMs: "—",
  });
  const inputLogTimer = useRef<number | null>(null);
  const statusLogRef = useRef<{ status: string | null; error: string | null }>({
    status: null,
    error: null,
  });
  const fundInputId = "fund-amount-input";

  const currentChainId = wallet.chainId ?? DEFAULT_CHAIN_ID;
  const contractAddress =
    wallet.chainId === null ? FUNDME_ADDRESS : getFundMeAddress(currentChainId);

  const provider = useMemo(() => {
    if (typeof window === "undefined" || !window.ethereum) return null;
    return new BrowserProvider(window.ethereum);
  }, []);

  const contract = useMemo(() => {
    if (!provider || !contractAddress) return null;
    return new Contract(contractAddress, FUNDME_ABI, provider);
  }, [provider, contractAddress]);

  const isConnected = Boolean(wallet.address);
  const isOwner =
    wallet.address && contractState.owner
      ? wallet.address.toLowerCase() === contractState.owner.toLowerCase()
      : false;
  const adminAddress = process.env.NEXT_PUBLIC_GOVERNANCE_ADMIN?.toLowerCase();
  const showAdmin =
    Boolean(wallet.address) &&
    Boolean(adminAddress) &&
    wallet.address?.toLowerCase() === adminAddress;
  const canInteract = isConnected && Boolean(contractAddress);
  const minimumUsdDisplay = (() => {
    const raw = contractState.minimumUsd;
    if (!raw) return "0.00";
    try {
      const asEth = formatEther(BigInt(raw));
      const asNumber = Number(asEth);
      if (Number.isNaN(asNumber)) return "0.00";
      return asNumber.toFixed(2);
    } catch {
      return "0.00";
    }
  })();

  const resetMessages = () => {
    setStatus(null);
    setError(null);
  };

  const parseJsonArray = (value: unknown) => {
    if (Array.isArray(value)) return value as string[];
    try {
      const parsed = JSON.parse(String(value || "[]"));
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  };

  const pushStatusHistory = (message: string, type: "status" | "error") => {
    setStatusHistory((prev) => [
      { message, type, timestamp: new Date().toLocaleString() },
      ...prev,
    ]);
  };

  const addExperimentLog = (label: string) => {
    setExperimentLog((prev) => [
      { label, timestamp: new Date().toLocaleString() },
      ...prev,
    ]);
  };

  const getAdminAuth = async () => {
    if (!provider) throw new Error("Wallet provider unavailable.");
    const signer = await provider.getSigner();
    const address = await signer.getAddress();
    if (!adminAddress || address.toLowerCase() !== adminAddress) {
      throw new Error("Admin signature required.");
    }
    const timestamp = Date.now();
    const message = `PherconsVault Admin Access ${timestamp}`;
    const signature = await signer.signMessage(message);
    return { address, signature, timestamp };
  };

  const readContractState = async () => {
    if (!provider || !contract || !contractAddress) return;
    try {
      const [owner, balance, minimumUsd, priceFeed, version] =
        await Promise.all([
          contract.getOwner(),
          provider.getBalance(contractAddress),
          contract.MINIMUM_USD(),
          contract.getPriceFeed(),
          contract.getVersion(),
        ]);

      let userFunded = 0n;
      if (wallet.address) {
        userFunded = await contract.getAddressToAmountFunded(wallet.address);
      }

      setContractState({
        owner,
        balanceEth: formatEther(balance),
        minimumUsd: minimumUsd.toString(),
        priceFeed,
        version: version.toString(),
        userFundedEth: formatEther(userFunded),
      });
    } catch (err) {
      setError("Unable to read contract state. Check the address and network.");
    }
  };

  const readPriceEstimate = async () => {
    if (!provider || !contractState.priceFeed || !contractState.minimumUsd)
      return;
    try {
      let priceScaled: bigint;
      let feedUpdatedAgo = "Unknown";

      if (simulateEnabled) {
        const simulated = Number(simulatedPrice);
        if (!Number.isFinite(simulated) || simulated <= 0) return;
        priceScaled = BigInt(Math.round(simulated * 100)) * 10n ** 16n;
        feedUpdatedAgo = "Simulated";
      } else {
        const priceFeed = new Contract(
          contractState.priceFeed,
          [
            "function latestRoundData() view returns (uint80,int256,uint256,uint256,uint80)",
            "function decimals() view returns (uint8)",
          ],
          provider
        );
        const [roundData, decimals, latestBlock] = await Promise.all([
          priceFeed.latestRoundData(),
          priceFeed.decimals(),
          provider.getBlock("latest"),
        ]);
        const priceRaw = roundData[1];
        const updatedAt = Number(roundData[3]);
        if (priceRaw <= 0) return;
        priceScaled = BigInt(priceRaw) * 10n ** (18n - BigInt(decimals));
        if (latestBlock?.timestamp) {
          const ageSeconds = Math.max(latestBlock.timestamp - updatedAt, 0);
          const minutes = Math.floor(ageSeconds / 60);
          feedUpdatedAgo =
            minutes < 60
              ? `${minutes}m ago`
              : `${Math.floor(minutes / 60)}h ago`;
        }
      }
      const minUsd = BigInt(contractState.minimumUsd);
      const minEth = (minUsd * 10n ** 18n) / priceScaled;

      const ethDisplay = Number(formatEther(minEth));
      const safeEthDisplay = ethDisplay * 1.01;
      const usdDisplay = Number(formatEther(priceScaled));
      setPriceState({
        minEthForUsd: Number.isFinite(ethDisplay) ? ethDisplay.toFixed(6) : "0",
        safeMinEthForUsd: Number.isFinite(safeEthDisplay)
          ? safeEthDisplay.toFixed(6)
          : "0",
        usdPerEth: Number.isFinite(usdDisplay) ? usdDisplay.toFixed(2) : "0",
        feedUpdatedAgo,
      });
    } catch {
      setPriceState({
        minEthForUsd: "0",
        safeMinEthForUsd: "0",
        usdPerEth: "0",
        feedUpdatedAgo: "Unknown",
      });
    }
  };

  const readActivity = async () => {
    if (!provider || !contractAddress || !contract) return;
    try {
      const latestBlock = await provider.getBlockNumber();
      const fromBlock = Math.max(latestBlock - 10000, 0);
      const fundedTopic = contract.interface.getEvent("Funded").topicHash;
      const withdrawnTopic = contract.interface.getEvent("Withdrawn").topicHash;

      const logs = await provider.getLogs({
        address: contractAddress,
        fromBlock,
        toBlock: latestBlock,
        topics: [[fundedTopic, withdrawnTopic]],
      });

      const parsed = logs
        .map((log) => {
          const event = contract.interface.parseLog(log);
          if (!event) return null;
          const amount = formatEther(event.args.amount);
          const from = event.args.funder ?? event.args.owner ?? "Unknown";
          return {
            type: event.name as "Funded" | "Withdrawn",
            amountEth: amount,
            from: String(from),
            blockNumber: log.blockNumber,
            txHash: log.transactionHash,
          };
        })
        .filter((item): item is NonNullable<typeof item> => Boolean(item))
        .slice(-20);

      const uniqueBlocks = Array.from(
        new Set(parsed.map((item) => item.blockNumber))
      );
      const blockMap = new Map<number, number>();
      await Promise.all(
        uniqueBlocks.map(async (blockNumber) => {
          const block = await provider.getBlock(blockNumber);
          if (block?.timestamp) {
            blockMap.set(blockNumber, block.timestamp);
          }
        })
      );

      const activity = parsed
        .map((item) => ({
          type: item.type,
          amountEth: item.amountEth,
          from: item.from,
          txHash: item.txHash,
          timestamp: blockMap.get(item.blockNumber)
            ? new Date(blockMap.get(item.blockNumber)! * 1000).toLocaleString()
            : "Unknown",
        }))
        .reverse();

      const funded = parsed.filter((item) => item.type === "Funded");
      const withdrawn = parsed.filter((item) => item.type === "Withdrawn");
      const totalFunded = funded.reduce(
        (acc, item) => acc + Number(item.amountEth),
        0
      );
      const uniqueFunders = new Set(funded.map((item) => item.from)).size;
      const lastFundedBlock = funded.at(-1)?.blockNumber;
      const lastWithdrawBlock = withdrawn.at(-1)?.blockNumber;

      setActivityItems(activity);
      setAnalytics({
        totalFundedEth: totalFunded.toFixed(4),
        uniqueFunders,
        totalFundingCount: funded.length,
        lastFundedAt: lastFundedBlock
          ? new Date(blockMap.get(lastFundedBlock)! * 1000).toLocaleString()
          : "—",
        lastWithdrawnAt: lastWithdrawBlock
          ? new Date(blockMap.get(lastWithdrawBlock)! * 1000).toLocaleString()
          : "—",
      });
    } catch {
      setActivityItems([]);
    }
  };

  const exportCsv = () => {
    if (activityItems.length === 0) return;
    const header = [
      "type",
      "amountEth",
      "from",
      "timestamp",
      "txHash",
      "totalFundedEth",
      "uniqueFunders",
      "totalFundingCount",
      "lastFundedAt",
      "lastWithdrawnAt",
    ];
    const rows = activityItems.map((item) =>
      [
        item.type,
        item.amountEth,
        item.from,
        item.timestamp,
        item.txHash,
        analytics.totalFundedEth,
        analytics.uniqueFunders,
        analytics.totalFundingCount,
        analytics.lastFundedAt,
        analytics.lastWithdrawnAt,
      ]
        .map((value) => `"${String(value).replace(/"/g, '""')}"`)
        .join(",")
    );
    const csv = [header.join(","), ...rows].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `pherconsvault-metrics-${Date.now()}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const exportSummaryCsv = () => {
    const header = [
      "chainId",
      "contractAddress",
      "totalFundedEth",
      "uniqueFunders",
      "totalFundingCount",
      "lastFundedAt",
      "lastWithdrawnAt",
      "usdPerEth",
      "minEthExact",
      "minEthSafe",
      "feedUpdatedAgo",
      "simulateEnabled",
      "simulatedPrice",
    ];
    const row = [
      currentChainId,
      contractAddress,
      analytics.totalFundedEth,
      analytics.uniqueFunders,
      analytics.totalFundingCount,
      analytics.lastFundedAt,
      analytics.lastWithdrawnAt,
      priceState.usdPerEth,
      priceState.minEthForUsd,
      priceState.safeMinEthForUsd,
      priceState.feedUpdatedAgo,
      simulateEnabled,
      simulatedPrice,
    ]
      .map((value) => `"${String(value).replace(/"/g, '""')}"`)
      .join(",");
    const csv = [header.join(","), row].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `pherconsvault-summary-${Date.now()}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const saveSnapshot = async () => {
    try {
      const payload = {
        chainId: currentChainId,
        contractAddress,
        analytics,
        priceState,
        simulateEnabled,
        simulatedPrice,
      };
      await fetch("/api/snapshots", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      setStatus("Snapshot saved.");
      await loadSnapshots();
    } catch {
      setError("Failed to save snapshot.");
    }
  };

  const loadSnapshots = async () => {
    try {
      const response = await fetch("/api/snapshots");
      const result = await response.json();
      const data = Array.isArray(result?.data) ? result.data : [];
      setSnapshots(
        data
          .map((item) => ({
            savedAt: item.savedAt,
            chainId: item.chainId,
            totalFundedEth: item.analytics?.totalFundedEth ?? "0",
          }))
          .reverse()
      );
    } catch {
      setSnapshots([]);
    }
  };

  const loadVaultOps = () => {
    if (typeof window === "undefined") return;
    const storedBuckets = window.localStorage.getItem("vaultops:buckets");
    const storedMilestones = window.localStorage.getItem("vaultops:milestones");
    try {
      if (storedBuckets) {
        setBuckets(JSON.parse(storedBuckets));
      }
      if (storedMilestones) {
        setMilestones(JSON.parse(storedMilestones));
      }
    } catch {
      // ignore
    }
  };

  const loadPublications = async () => {
    try {
      const response = await fetch("/api/articles");
      const result = await response.json();
      const data = Array.isArray(result?.data) ? result.data : [];
      const publicationsData = data
        .map((item) => ({
          ...item,
          tags: parseJsonArray(item.tags),
        }))
        .filter((item) => item.tags.includes("publication"))
        .map((item) => ({
          id: item.id,
          title: item.title,
          summary: item.summary ?? "",
          url: item.fileUrl ?? "",
        }));
      setPublications(publicationsData);
    } catch {
      setPublications([]);
    }
  };

  const clearSnapshots = async () => {
    try {
      await fetch("/api/snapshots", { method: "DELETE" });
      setSnapshots([]);
      setStatus("Snapshots cleared.");
    } catch {
      setError("Failed to clear snapshots.");
    }
  };

  const readNetworkHealth = async () => {
    if (!provider) return;
    try {
      const start = performance.now();
      const [network, block, feeData] = await Promise.all([
        provider.getNetwork(),
        provider.getBlock("latest"),
        provider.getFeeData(),
      ]);
      const latency = Math.round(performance.now() - start);
      const gas =
        feeData.gasPrice && feeData.gasPrice > 0n
          ? (Number(formatEther(feeData.gasPrice)) * 1e9).toFixed(1)
          : "—";
      setBlockInfo({
        chainId: Number(network.chainId),
        latestBlock: block?.number?.toString() ?? "—",
        gasPriceGwei: gas,
        rpcLatencyMs: latency.toString(),
      });
    } catch {
      setBlockInfo({
        chainId: null,
        latestBlock: "—",
        gasPriceGwei: "—",
        rpcLatencyMs: "—",
      });
    }
  };

  const scrollToFundInput = () => {
    const element = document.getElementById(fundInputId);
    if (!element) return;
    window.requestAnimationFrame(() => {
      element.scrollIntoView({ behavior: "smooth", block: "center" });
      window.setTimeout(() => element.focus(), 300);
    });
  };

  const connectWallet = async () => {
    resetMessages();
    if (!provider) {
      setError("No wallet found. Install MetaMask or another provider.");
      return;
    }
    try {
      const accounts = await provider.send("eth_requestAccounts", []);
      const network = await provider.getNetwork();
      setWallet({
        address: accounts?.[0] ?? null,
        chainId: Number(network.chainId),
      });
    } catch (err) {
      setError("Wallet connection rejected.");
    }
  };

  const fund = async () => {
    resetMessages();
    if (!provider || !contract || !fundAmount) return;
    try {
      const signer = await provider.getSigner();
      const writeContract = contract.connect(signer);
      setStatus("Submitting funding transaction...");
      addExperimentLog(`Funding submitted: ${fundAmount} ETH`);
      const tx = await writeContract.fund({ value: parseEther(fundAmount) });
      setStatus(`Transaction submitted: ${tx.hash}`);
      await tx.wait();
      setStatus("Funding confirmed.");
      addExperimentLog(`Funding confirmed: ${fundAmount} ETH`);
      await readContractState();
    } catch (err) {
      setError("Funding failed. Check your amount and network.");
      addExperimentLog(`Funding failed for ${fundAmount} ETH`);
    }
  };

  const withdraw = async () => {
    resetMessages();
    if (!provider || !contract) return;
    try {
      const signer = await provider.getSigner();
      const writeContract = contract.connect(signer);
      setStatus("Submitting withdraw transaction...");
      addExperimentLog("Withdraw submitted");
      const tx = await writeContract.withdraw();
      setStatus(`Transaction submitted: ${tx.hash}`);
      await tx.wait();
      setStatus("Withdraw confirmed.");
      addExperimentLog("Withdraw confirmed");
      await readContractState();
    } catch (err) {
      setError("Withdraw failed. Check owner permissions and network.");
      addExperimentLog("Withdraw failed");
    }
  };

  const handleFundAmountChange = (value: string) => {
    setFundAmount(value);
    if (inputLogTimer.current) {
      window.clearTimeout(inputLogTimer.current);
    }
    inputLogTimer.current = window.setTimeout(() => {
      addExperimentLog(`Manual input: ${value} ETH`);
    }, 500);
  };

  useEffect(() => {
    if (!provider) return;

    const syncWallet = async () => {
      const accounts = await provider.send("eth_accounts", []);
      const network = await provider.getNetwork();
      setWallet({
        address: accounts?.[0] ?? null,
        chainId: Number(network.chainId),
      });
    };

    syncWallet();

    if (!window.ethereum?.on) return;
    const handleAccountsChanged = (accounts: string[]) => {
      setWallet((prev) => ({
        ...prev,
        address: accounts?.[0] ?? null,
      }));
    };
    const handleChainChanged = (chainIdHex: string) => {
      setWallet((prev) => ({
        ...prev,
        chainId: Number(chainIdHex),
      }));
    };

    window.ethereum.on("accountsChanged", handleAccountsChanged);
    window.ethereum.on("chainChanged", handleChainChanged);

    return () => {
      window.ethereum?.removeListener("accountsChanged", handleAccountsChanged);
      window.ethereum?.removeListener("chainChanged", handleChainChanged);
    };
  }, [provider]);

  useEffect(() => {
    readContractState();
  }, [wallet.address, wallet.chainId, contractAddress]);

  useEffect(() => {
    readPriceEstimate();
  }, [
    contractState.priceFeed,
    contractState.minimumUsd,
    wallet.chainId,
    simulateEnabled,
    simulatedPrice,
  ]);

  useEffect(() => {
    readActivity();
  }, [contractAddress, wallet.chainId, status]);

  useEffect(() => {
    loadSnapshots();
  }, []);

  useEffect(() => {
    loadVaultOps();
  }, []);

  useEffect(() => {
    loadPublications();
  }, []);

  useEffect(() => {
    const loadVaults = async () => {
      try {
        const response = await fetch("/api/vaults");
        const result = await response.json();
        const data = Array.isArray(result?.data) ? result.data : [];
        if (data.length > 0) {
          setVaultCatalog(data);
        }
      } catch {
        // keep fallback catalog
      }
    };
    loadVaults();
  }, []);

  useEffect(() => {
    const loadLearn = async () => {
      try {
        const response = await fetch("/api/learn");
        const result = await response.json();
        const data = Array.isArray(result?.data) ? result.data : [];
        if (data.length > 0) {
          setLearnCatalog(data);
        }
      } catch {
        // keep fallback catalog
      }
    };
    loadLearn();
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem("vaultops:buckets", JSON.stringify(buckets));
  }, [buckets]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(
      "vaultops:milestones",
      JSON.stringify(milestones)
    );
  }, [milestones]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const stored = window.localStorage.getItem("fundme:experimentLog");
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          setExperimentLog(parsed);
        }
      } catch {
        // ignore
      }
    }
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(
      "fundme:experimentLog",
      JSON.stringify(experimentLog.slice(0, 50))
    );
  }, [experimentLog]);

  useEffect(() => {
    readNetworkHealth();
  }, [wallet.chainId, status]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const stored = window.localStorage.getItem("vault:statusHistory");
    if (!stored) return;
    try {
      const parsed = JSON.parse(stored);
      if (Array.isArray(parsed)) {
        setStatusHistory(parsed);
      }
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    if (!status) return;
    if (statusLogRef.current.status === status) return;
    statusLogRef.current.status = status;
    pushStatusHistory(status, "status");
  }, [status]);

  useEffect(() => {
    if (!error) return;
    if (statusLogRef.current.error === error) return;
    statusLogRef.current.error = error;
    pushStatusHistory(error, "error");
  }, [error]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(
      "vault:statusHistory",
      JSON.stringify(statusHistory.slice(0, 20))
    );
  }, [statusHistory]);

  const addBucket = (bucket: Omit<BudgetBucket, "id">) => {
    setBuckets((prev) => [{ id: crypto.randomUUID(), ...bucket }, ...prev]);
  };

  const removeBucket = (id: string) => {
    setBuckets((prev) => prev.filter((item) => item.id !== id));
  };

  const addMilestone = (milestone: Omit<Milestone, "id">) => {
    setMilestones((prev) => [
      { id: crypto.randomUUID(), ...milestone },
      ...prev,
    ]);
  };

  const removeMilestone = (id: string) => {
    setMilestones((prev) => prev.filter((item) => item.id !== id));
  };

  const addPublication = async (publication: Omit<Publication, "id">) => {
    resetMessages();
    try {
      const auth = await getAdminAuth();
      const summary =
        publication.summary?.trim() || "Publication registry entry.";
      const safeUrl = (() => {
        try {
          const parsed = new URL(publication.url.trim());
          if (!["http:", "https:"].includes(parsed.protocol)) return null;
          return parsed.toString();
        } catch {
          return null;
        }
      })();
      if (!safeUrl) {
        throw new Error("Publication URL must be a valid http(s) link.");
      }
      const payload = {
        title: publication.title,
        summary,
        contentHtml: `<p><a href=\"${safeUrl}\" target=\"_blank\" rel=\"noreferrer\">Open publication</a></p>`,
        tags: ["publication", "registry"],
        coverUrl: null,
        galleryUrls: [],
        fileUrl: safeUrl,
      };
      const response = await fetch("/api/articles", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ payload, ...auth }),
      });
      if (!response.ok) {
        const result = await response.json().catch(() => null);
        throw new Error(result?.error ?? "Unable to add publication.");
      }
      setStatus("Publication added.");
      await loadPublications();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Unable to add publication."
      );
    }
  };

  const removePublication = async (id: string) => {
    resetMessages();
    try {
      const auth = await getAdminAuth();
      const response = await fetch("/api/articles", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, ...auth }),
      });
      if (!response.ok) {
        const result = await response.json().catch(() => null);
        throw new Error(result?.error ?? "Unable to remove publication.");
      }
      setStatus("Publication removed.");
      await loadPublications();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Unable to remove publication."
      );
    }
  };

  const addProposal = (proposal: Omit<Proposal, "id" | "submittedAt">) => {
    setProposals((prev) => [
      {
        id: crypto.randomUUID(),
        submittedAt: new Date().toLocaleString(),
        ...proposal,
      },
      ...prev,
    ]);
  };

  const removeProposal = (id: string) => {
    setProposals((prev) => prev.filter((item) => item.id !== id));
    setVotes((prev) => prev.filter((vote) => vote.proposalId !== id));
  };

  const addVote = (vote: Omit<Vote, "id" | "timestamp">) => {
    setVotes((prev) => [
      {
        id: crypto.randomUUID(),
        timestamp: new Date().toLocaleString(),
        ...vote,
      },
      ...prev,
    ]);
  };

  const addUnlock = (
    unlock: Omit<MilestoneUnlock, "id" | "status" | "releasedAt">
  ) => {
    setUnlocks((prev) => [
      {
        id: crypto.randomUUID(),
        status: "Pending",
        releasedAt: null,
        ...unlock,
      },
      ...prev,
    ]);
  };

  const releaseUnlock = (id: string) => {
    setUnlocks((prev) =>
      prev.map((item) =>
        item.id === id
          ? {
              ...item,
              status: "Released",
              releasedAt: new Date().toLocaleString(),
            }
          : item
      )
    );
  };

  const addSigner = (signer: Omit<Signer, "id">) => {
    setSigners((prev) => [{ id: crypto.randomUUID(), ...signer }, ...prev]);
  };

  const removeSigner = (id: string) => {
    setSigners((prev) => prev.filter((item) => item.id !== id));
  };

  const addWithdrawRequest = (
    request: Omit<
      WithdrawalRequest,
      "id" | "approvals" | "status" | "createdAt"
    >
  ) => {
    setWithdrawRequests((prev) => [
      {
        id: crypto.randomUUID(),
        approvals: [],
        status: "Pending",
        createdAt: new Date().toLocaleString(),
        ...request,
      },
      ...prev,
    ]);
  };

  const approveWithdrawRequest = (id: string, signer: string) => {
    if (!signer) return;
    setWithdrawRequests((prev) =>
      prev.map((request) => {
        if (request.id !== id) return request;
        if (request.approvals.includes(signer)) return request;
        const approvals = [...request.approvals, signer];
        const status =
          approvals.length >= request.threshold ? "Executable" : request.status;
        return { ...request, approvals, status };
      })
    );
  };

  const executeWithdrawRequest = (id: string) => {
    setWithdrawRequests((prev) =>
      prev.map((request) =>
        request.id === id ? { ...request, status: "Executed" } : request
      )
    );
  };

  const addReserve = (reserve: Omit<TimeLockedReserve, "id" | "status">) => {
    const isAvailable =
      reserve.unlockDate &&
      new Date(reserve.unlockDate).getTime() <= Date.now();
    setReserves((prev) => [
      {
        id: crypto.randomUUID(),
        status: isAvailable ? "Available" : "Locked",
        ...reserve,
      },
      ...prev,
    ]);
  };

  const releaseReserve = (id: string) => {
    setReserves((prev) =>
      prev.map((reserve) =>
        reserve.id === id ? { ...reserve, status: "Released" } : reserve
      )
    );
  };

  const addExperiment = async (
    entry: Omit<ExperimentEntry, "id" | "createdAt">
  ) => {
    let hash = entry.hash;
    if (!hash) {
      try {
        const digest = await crypto.subtle.digest(
          "SHA-256",
          new TextEncoder().encode(entry.summary)
        );
        hash = Array.from(new Uint8Array(digest))
          .map((b) => b.toString(16).padStart(2, "0"))
          .join("");
      } catch {
        hash = "hash-unavailable";
      }
    }
    setExperimentsLedger((prev) => [
      {
        id: crypto.randomUUID(),
        createdAt: new Date().toLocaleString(),
        ...entry,
        hash,
      },
      ...prev,
    ]);
  };

  const removeExperiment = (id: string) => {
    setExperimentsLedger((prev) => prev.filter((item) => item.id !== id));
  };

  const addBadge = (badge: Omit<ReputationBadge, "id" | "issuedAt">) => {
    setBadges((prev) => [
      {
        id: crypto.randomUUID(),
        issuedAt: new Date().toLocaleString(),
        ...badge,
      },
      ...prev,
    ]);
  };

  const removeBadge = (id: string) => {
    setBadges((prev) => prev.filter((item) => item.id !== id));
  };

  const addTokenomics = (
    scenario: Omit<TokenomicsScenario, "id" | "projectedAnnualEmissions">
  ) => {
    const projectedAnnualEmissions =
      scenario.rewardRate * 365 * (1 + scenario.inflationRate / 100);
    setTokenomics((prev) => [
      {
        id: crypto.randomUUID(),
        projectedAnnualEmissions,
        ...scenario,
      },
      ...prev,
    ]);
  };

  const removeTokenomics = (id: string) => {
    setTokenomics((prev) => prev.filter((item) => item.id !== id));
  };

  const exactEth = Number(priceState.minEthForUsd);
  const safeEth = Number(priceState.safeMinEthForUsd);
  const enteredEth = Number(fundAmount);
  const isCloseToMinimum =
    Number.isFinite(enteredEth) &&
    enteredEth > 0 &&
    Number.isFinite(exactEth) &&
    Number.isFinite(safeEth) &&
    enteredEth >= exactEth &&
    enteredEth < safeEth;

  const velocityPoints = (() => {
    if (activityItems.length === 0) return [];
    const now = Date.now();
    const hours = 8;
    const buckets = Array.from({ length: hours }, () => 0);
    activityItems.forEach((item) => {
      if (item.type !== "Funded") return;
      const parsedDate = new Date(item.timestamp).getTime();
      if (Number.isNaN(parsedDate)) return;
      const diffHours = Math.floor((now - parsedDate) / (1000 * 60 * 60));
      if (diffHours >= 0 && diffHours < hours) {
        buckets[hours - 1 - diffHours] += 1;
      }
    });
    return buckets;
  })();

  const totalFundsLocked = useMemo(() => {
    const numeric = Number(contractState.balanceEth);
    if (!Number.isFinite(numeric)) return "0.00";
    return numeric.toFixed(2);
  }, [contractState.balanceEth]);
  const contributorCount =
    analytics.uniqueFunders > 0 ? String(analytics.uniqueFunders) : "128";
  const heroStats = [
    {
      label: "Total Funds Locked",
      value: `${totalFundsLocked} ETH`,
      note: "Live treasury balance",
    },
    {
      label: "Active Research Vaults",
      value: String(vaultCatalog.length),
      note: "Multi-domain strategy",
    },
    {
      label: "Proposals Passed",
      value: "24",
      note: "Last 90 days",
    },
    {
      label: "Contributors",
      value: contributorCount,
      note: "Verified wallets",
    },
  ];
  const vaultPreview = vaultCatalog.slice(0, 3);
  const learnPreview = learnCatalog.slice(0, 3);

  return (
    <SiteShell showAdmin={showAdmin}>
      <div className="home-neon stagger flex flex-col gap-8">
        <HeroHeader stats={heroStats} />

        <section className="grid gap-6 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)] lg:items-stretch">
          <div className="glass-panel animate-fade flex flex-col gap-4 p-6">
            <p className="text-xs uppercase tracking-[0.35em] text-[#6b5b45]">
              How It Works
            </p>
            <p className="text-sm text-[#5e5242]">
              A research-first capital loop designed for transparent, repeatable
              governance outcomes.
            </p>
            <div className="grid gap-3">
              {[
                "Deposit into research vaults aligned to a thesis.",
                "Earn governance power and reputation over time.",
                "Vote on proposals, milestones, and fund releases.",
                "Track impact, returns, and published deliverables.",
              ].map((step, index) => (
                <div
                  key={step}
                  className="rounded-2xl border border-[#eadfcf] bg-[#fffdf8] p-4 text-sm text-[#5e5242]"
                >
                  <span className="text-[10px] uppercase tracking-[0.3em] text-[#6b5b45]">
                    Step {index + 1}
                  </span>
                  <p className="mt-2 text-sm text-[#1c1914]">{step}</p>
                </div>
              ))}
            </div>
          </div>
          <div className="glass-panel animate-fade flex flex-col gap-4 p-6">
            <p className="text-xs uppercase tracking-[0.35em] text-[#6b5b45]">
              Governance Lifecycle
            </p>
            <p className="text-sm text-[#5e5242]">
              Draft {"->"} Discussion {"->"} Voting {"->"} Timelock {"->"}{" "}
              Execution
            </p>
            <div className="grid gap-3 rounded-2xl border border-[#eadfcf] bg-[#fff7ea] p-4 text-sm text-[#5e5242]">
              <div className="flex items-center justify-between">
                <span>Participation Rate</span>
                <span className="font-mono text-[#1c1914]">62%</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Avg Vote Duration</span>
                <span className="font-mono text-[#1c1914]">5.2 days</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Treasury Controlled</span>
                <span className="font-mono text-[#1c1914]">
                  {totalFundsLocked} ETH
                </span>
              </div>
            </div>
            <Link
              href="/governance"
              className="mt-auto w-fit rounded-full border border-[#1c1914] px-4 py-2 text-[10px] uppercase tracking-[0.2em] text-[#1c1914] transition hover:bg-[#1c1914] hover:text-[#fff7ea]"
            >
              Review Governance Hub
            </Link>
          </div>
        </section>

        <section className="grid gap-6">
          <div className="glass-panel animate-fade flex flex-col gap-4 p-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-xs uppercase tracking-[0.35em] text-[#6b5b45]">
                  Research Vaults
                </p>
                <p className="text-sm text-[#5e5242]">
                  Thematic vaults with clear mandates, risk bands, and live
                  governance participation metrics.
                </p>
              </div>
              <Link
                href="/vaults"
                className="rounded-full border border-[#1c1914] px-4 py-2 text-[10px] uppercase tracking-[0.2em] text-[#1c1914] transition hover:bg-[#1c1914] hover:text-[#fff7ea]"
              >
                View All Vaults
              </Link>
            </div>
            <div className="grid gap-4 md:grid-cols-3">
              {vaultPreview.map((vault) => (
                <div
                  key={vault.id}
                  className="flex h-full flex-col gap-3 rounded-2xl border border-[#eadfcf] bg-[#fffdf8] p-4 text-sm text-[#5e5242]"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs uppercase tracking-[0.3em] text-[#6b5b45]">
                      {vault.name}
                    </span>
                    <span className="chip">{vault.riskRating}</span>
                  </div>
                  <p className="text-sm text-[#1c1914]">{vault.focus}</p>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <span className="text-[10px] uppercase tracking-[0.2em] text-[#6b5b45]">
                        TVL
                      </span>
                      <p className="font-mono text-[#1c1914]">{vault.tvl}</p>
                    </div>
                    <div>
                      <span className="text-[10px] uppercase tracking-[0.2em] text-[#6b5b45]">
                        Proposals
                      </span>
                      <p className="font-mono text-[#1c1914]">
                        {vault.activeProposals}
                      </p>
                    </div>
                    <div>
                      <span className="text-[10px] uppercase tracking-[0.2em] text-[#6b5b45]">
                        Participation
                      </span>
                      <p className="font-mono text-[#1c1914]">
                        {vault.participation}
                      </p>
                    </div>
                    <div>
                      <span className="text-[10px] uppercase tracking-[0.2em] text-[#6b5b45]">
                        Horizon
                      </span>
                      <p className="font-mono text-[#1c1914]">
                        {vault.horizon}
                      </p>
                    </div>
                  </div>
                  <Link
                    href={`/vaults/${vault.id}`}
                    className="mt-auto w-fit rounded-full border border-[#1c1914] px-3 py-1 text-[10px] uppercase tracking-[0.2em] text-[#1c1914] transition hover:bg-[#1c1914] hover:text-[#fff7ea]"
                  >
                    View Vault
                  </Link>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="grid gap-6">
          <div className="glass-panel animate-fade flex flex-col gap-4 p-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-xs uppercase tracking-[0.35em] text-[#6b5b45]">
                  Learn
                </p>
                <p className="text-sm text-[#5e5242]">
                  Research-first education for contributors and institutional
                  partners.
                </p>
              </div>
              <Link
                href="/learn"
                className="rounded-full border border-[#1c1914] px-4 py-2 text-[10px] uppercase tracking-[0.2em] text-[#1c1914] transition hover:bg-[#1c1914] hover:text-[#fff7ea]"
              >
                Explore Learning Hub
              </Link>
            </div>
            <div className="grid gap-4 md:grid-cols-3">
              {learnPreview.map((entry) => (
                <div
                  key={entry.id}
                  className="flex h-full flex-col gap-3 rounded-2xl border border-[#eadfcf] bg-[#fffdf8] p-4 text-sm text-[#5e5242]"
                >
                  <span className="text-xs uppercase tracking-[0.3em] text-[#6b5b45]">
                    {entry.title}
                  </span>
                  <p className="text-sm text-[#1c1914]">{entry.description}</p>
                  <span className="mt-auto text-[10px] uppercase tracking-[0.2em] text-[#6b5b45]">
                    Read guide
                  </span>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section id="contribute" className="grid gap-6 lg:grid-cols-2">
          <WalletPanel
            isConnected={isConnected}
            address={wallet.address}
            chainId={wallet.chainId}
            owner={contractState.owner}
            userFundedEth={contractState.userFundedEth}
            isOwner={isOwner}
            onConnect={connectWallet}
          />
          <FundPanel
            fundAmount={fundAmount}
            onFundAmountChange={handleFundAmountChange}
            canInteract={canInteract}
            isOwner={isOwner}
            onFund={fund}
            onWithdraw={withdraw}
            status={status}
            error={error}
            statusHistory={statusHistory}
            exactEth={priceState.minEthForUsd}
            safeEth={priceState.safeMinEthForUsd}
            usdPerEth={priceState.usdPerEth}
            isCloseToMinimum={isCloseToMinimum}
            onAutofillExact={() => setFundAmount(priceState.minEthForUsd)}
            onAutofillSafe={() => setFundAmount(priceState.safeMinEthForUsd)}
            fundInputId={fundInputId}
            chainId={null}
            expectedChainId={0}
          />
        </section>

        <section className="grid gap-6 lg:items-stretch">
          <ActivityPanel items={activityItems} />
        </section>

        <section className="grid gap-6">
          <ResearchPanel
            usdPerEth={priceState.usdPerEth}
            minEthExact={priceState.minEthForUsd}
            minEthSafe={priceState.safeMinEthForUsd}
            feedUpdatedAgo={priceState.feedUpdatedAgo}
            simulateEnabled={simulateEnabled}
            simulatedPrice={simulatedPrice}
            onToggleSimulate={() => setSimulateEnabled((prev) => !prev)}
            onSimulatedPriceChange={setSimulatedPrice}
            velocityPoints={velocityPoints}
            experiments={[
              {
                usd: 5,
                exactEth: priceState.minEthForUsd,
                safeEth: priceState.safeMinEthForUsd,
              },
              {
                usd: 10,
                exactEth: (Number(priceState.minEthForUsd) * 2).toFixed(6),
                safeEth: (Number(priceState.safeMinEthForUsd) * 2).toFixed(6),
              },
              {
                usd: 20,
                exactEth: (Number(priceState.minEthForUsd) * 4).toFixed(6),
                safeEth: (Number(priceState.safeMinEthForUsd) * 4).toFixed(6),
              },
            ]}
            onSelectExperiment={(value) => {
              setFundAmount(value);
              addExperimentLog(`Threshold selected: ${value} ETH (safe)`);
              window.setTimeout(scrollToFundInput, 0);
            }}
            onExportCsv={exportCsv}
            onExportSummaryCsv={exportSummaryCsv}
            onSaveSnapshot={saveSnapshot}
            onClearSnapshots={clearSnapshots}
            snapshots={snapshots}
            researchNotes={researchNotes}
            onResearchNotesChange={setResearchNotes}
            experimentLog={experimentLog}
            blockInfo={blockInfo}
            analytics={analytics}
          />
        </section>
      </div>
    </SiteShell>
  );
}
