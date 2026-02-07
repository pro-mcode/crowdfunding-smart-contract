"use client";

import { useEffect, useMemo, useState } from "react";
import { BrowserProvider, Contract, formatEther } from "ethers";
import SiteShell from "@/components/SiteShell";
import VaultOpsPanel from "@/components/VaultOpsPanel";
import SecurityPanel from "@/components/SecurityPanel";
import AdvancedPanel from "@/components/AdvancedPanel";
import BadgeTrackingPanel from "@/components/BadgeTrackingPanel";
import ArticleTrackingPanel from "@/components/ArticleTrackingPanel";
import PublicationTrackingPanel from "@/components/PublicationTrackingPanel";
import BadgeAutomationPanel from "@/components/BadgeAutomationPanel";
import ResearchArticlesPanel, {
  ResearchArticle,
} from "@/components/ResearchArticlesPanel";
import VaultRegistryPanel from "@/components/VaultRegistryPanel";
import LearnRegistryPanel from "@/components/LearnRegistryPanel";
import { FUNDME_ABI } from "@/lib/fundmeAbi";
import { FUNDME_ADDRESS, DEFAULT_CHAIN_ID, getFundMeAddress } from "@/lib/network";
import type { VaultCatalogEntry } from "@/lib/vaultCatalog";
import type { LearnEntry } from "@/lib/learnCatalog";

export default function AdminPage() {
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [chainId, setChainId] = useState<number | null>(null);
  const [owner, setOwner] = useState<string | null>(null);
  const [balanceEth, setBalanceEth] = useState("0");
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [buckets, setBuckets] = useState<
    { id: string; label: string; percent: number }[]
  >([]);
  const [milestones, setMilestones] = useState<
    { id: string; title: string; status: "Planned" | "In Progress" | "Complete"; targetDate: string }[]
  >([]);
  const [publications, setPublications] = useState<
    { id: string; title: string; url: string; summary: string; createdAt: string }[]
  >([]);
  const [signers, setSigners] = useState<
    { id: string; address: string; role: string }[]
  >([]);
  const [withdrawRequests, setWithdrawRequests] = useState<
    {
      id: string;
      amountEth: number;
      recipient: string;
      reason: string;
      approvals: string[];
      threshold: number;
      status: "Pending" | "Executable" | "Executed";
      createdAt: string;
    }[]
  >([]);
  const [reserves, setReserves] = useState<
    { id: string; label: string; amountEth: number; unlockDate: string; status: "Locked" | "Available" | "Released" }[]
  >([]);
  const [experimentsLedger, setExperimentsLedger] = useState<
    { id: string; title: string; summary: string; datasetUrl: string; hash: string; createdAt: string }[]
  >([]);
  const [badges, setBadges] = useState<
    {
      id: string;
      recipient: string;
      badge: string;
      tokenId: string;
      issuedAt: string;
      expiresAt?: string | null;
    }[]
  >([]);
  const [expiredBadges, setExpiredBadges] = useState<
    {
      id: string;
      recipient: string;
      badge: string;
      tokenId: string;
      issuedAt: string;
      expiresAt?: string | null;
      archivedAt?: string | null;
    }[]
  >([]);
  const [badgeCleanupStatus, setBadgeCleanupStatus] = useState<string | null>(
    null
  );
  const [badgeRegistry, setBadgeRegistry] = useState<
    {
      id: string;
      title: string;
      code: string;
      weight: number;
      renewDays?: number | null;
      createdAt: string;
    }[]
  >([]);
  const [tokenomics, setTokenomics] = useState<
    { id: string; label: string; rewardRate: number; lockupDays: number; inflationRate: number; notes: string; projectedAnnualEmissions: number }[]
  >([]);
  const [multisigThreshold, setMultisigThreshold] = useState(2);
  const [articles, setArticles] = useState<ResearchArticle[]>([]);
  const [editingArticleId, setEditingArticleId] = useState<string | null>(null);
  const [vaultRegistry, setVaultRegistry] = useState<VaultCatalogEntry[]>([]);
  const [learnRegistry, setLearnRegistry] = useState<LearnEntry[]>([]);

  const adminAddress = process.env.NEXT_PUBLIC_GOVERNANCE_ADMIN?.toLowerCase();
  const isAdmin =
    Boolean(walletAddress) &&
    Boolean(adminAddress) &&
    walletAddress?.toLowerCase() === adminAddress;

  const currentChainId = chainId ?? DEFAULT_CHAIN_ID;
  const contractAddress =
    chainId === null ? FUNDME_ADDRESS : getFundMeAddress(currentChainId);

  const provider = useMemo(() => {
    if (typeof window === "undefined" || !window.ethereum) return null;
    return new BrowserProvider(window.ethereum);
  }, []);

  const contract = useMemo(() => {
    if (!provider || !contractAddress) return null;
    return new Contract(contractAddress, FUNDME_ABI, provider);
  }, [provider, contractAddress]);

  const connectWallet = async () => {
    setError(null);
    setStatus(null);
    if (!provider) {
      setError("No wallet found. Install MetaMask or another provider.");
      return;
    }
    try {
      const accounts = await provider.send("eth_requestAccounts", []);
      const network = await provider.getNetwork();
      setWalletAddress(accounts?.[0] ?? null);
      setChainId(Number(network.chainId));
    } catch {
      setError("Wallet connection rejected.");
    }
  };

  const readAdminState = async () => {
    if (!provider || !contract || !contractAddress) return;
    try {
      const [ownerAddress, balance] = await Promise.all([
        contract.getOwner(),
        provider.getBalance(contractAddress),
      ]);
      setOwner(ownerAddress);
      setBalanceEth(formatEther(balance));
    } catch {
      setError("Unable to read contract state.");
    }
  };

  const withdraw = async () => {
    setError(null);
    setStatus(null);
    if (!provider || !contract) return;
    try {
      const signer = await provider.getSigner();
      const writeContract = contract.connect(signer);
      setStatus("Submitting withdraw transaction...");
      const tx = await writeContract.withdraw();
      setStatus(`Transaction submitted: ${tx.hash}`);
      await tx.wait();
      setStatus("Withdraw confirmed.");
      await readAdminState();
    } catch {
      setError("Withdraw failed. Check owner permissions and network.");
    }
  };

  const loadVaultOps = () => {
    if (typeof window === "undefined") return;
    const storedBuckets = window.localStorage.getItem("vaultops:buckets");
    const storedMilestones = window.localStorage.getItem("vaultops:milestones");
    try {
      if (storedBuckets) setBuckets(JSON.parse(storedBuckets));
      if (storedMilestones) setMilestones(JSON.parse(storedMilestones));
    } catch {
      // ignore
    }
  };

  const loadAdvancedOps = async () => {
    if (typeof window === "undefined") return;
    const storedExperiments = window.localStorage.getItem("advanced:experiments");
    const storedTokenomics = window.localStorage.getItem("advanced:tokenomics");
    try {
      if (storedExperiments) setExperimentsLedger(JSON.parse(storedExperiments));
      if (storedTokenomics) setTokenomics(JSON.parse(storedTokenomics));
    } catch {
      // ignore
    }
    try {
      await fetch("/api/badges/archive", { method: "POST" }).catch(() => null);
      const response = await fetch("/api/badges");
      const result = await response.json();
      setBadges(Array.isArray(result?.data) ? result.data : []);
    } catch {
      setBadges([]);
    }
  };

  const loadExpiredBadges = async () => {
    try {
      const response = await fetch("/api/badges/archive");
      const result = await response.json();
      setExpiredBadges(Array.isArray(result?.data) ? result.data : []);
    } catch {
      setExpiredBadges([]);
    }
  };

  const loadBadgeRegistry = async () => {
    try {
      const response = await fetch("/api/badge-registry");
      const result = await response.json();
      setBadgeRegistry(Array.isArray(result?.data) ? result.data : []);
    } catch {
      setBadgeRegistry([]);
    }
  };

  const runBadgeCleanup = async () => {
    try {
      const response = await fetch("/api/badges/archive", { method: "POST" });
      const result = await response.json().catch(() => null);
      if (!response.ok) {
        throw new Error(result?.error ?? "Cleanup failed.");
      }
      const archived = result?.archived ?? 0;
      const renewed = result?.renewed ?? 0;
      setBadgeCleanupStatus(
        `Archived ${archived} badge(s), renewed ${renewed}.`
      );
      await loadAdvancedOps();
      await loadExpiredBadges();
      window.setTimeout(() => setBadgeCleanupStatus(null), 4000);
    } catch (err) {
      setBadgeCleanupStatus(
        err instanceof Error ? err.message : "Cleanup failed."
      );
    }
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

  const loadArticles = async () => {
    try {
      const response = await fetch("/api/articles");
      const result = await response.json();
      const data = Array.isArray(result?.data) ? result.data : [];
      const mapped = data
        .map((item: ResearchArticle) => ({
          ...item,
          tags: parseJsonArray(item.tags),
          galleryUrls: parseJsonArray(item.galleryUrls),
        }))
        .filter((item) => !item.tags.includes("publication"));
      setArticles(mapped);
    } catch {
      setArticles([]);
    }
  };

  const loadPublications = async () => {
    try {
      const response = await fetch("/api/articles");
      const result = await response.json();
      const data = Array.isArray(result?.data) ? result.data : [];
      const publicationsData = data
        .map((item: ResearchArticle) => ({
          ...item,
          tags: parseJsonArray(item.tags),
        }))
        .filter((item) => item.tags.includes("publication"))
        .map((item) => ({
          id: item.id,
          title: item.title,
          url: item.fileUrl ?? "",
          summary: item.summary ?? "",
          createdAt: item.createdAt,
        }));
      setPublications(publicationsData);
    } catch {
      setPublications([]);
    }
  };

  const loadVaultRegistry = async () => {
    try {
      const response = await fetch("/api/vaults");
      const result = await response.json();
      const data = Array.isArray(result?.data) ? result.data : [];
      setVaultRegistry(data);
    } catch {
      setVaultRegistry([]);
    }
  };

  const loadLearnRegistry = async () => {
    try {
      const response = await fetch("/api/learn");
      const result = await response.json();
      const data = Array.isArray(result?.data) ? result.data : [];
      setLearnRegistry(data);
    } catch {
      setLearnRegistry([]);
    }
  };

  useEffect(() => {
    loadVaultOps();
    loadAdvancedOps();
    loadBadgeRegistry();
    loadArticles();
    loadPublications();
    loadVaultRegistry();
    loadLearnRegistry();
    loadExpiredBadges();
  }, []);

  useEffect(() => {
    const interval = window.setInterval(() => {
      loadAdvancedOps();
      loadExpiredBadges();
    }, 1000 * 60 * 30);
    return () => window.clearInterval(interval);
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem("vaultops:buckets", JSON.stringify(buckets));
  }, [buckets]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem("vaultops:milestones", JSON.stringify(milestones));
  }, [milestones]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(
      "advanced:experiments",
      JSON.stringify(experimentsLedger)
    );
  }, [experimentsLedger]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(
      "advanced:tokenomics",
      JSON.stringify(tokenomics)
    );
  }, [tokenomics]);

  const addBucket = (bucket: { label: string; percent: number }) => {
    setBuckets((prev) => [{ id: crypto.randomUUID(), ...bucket }, ...prev]);
  };

  const removeBucket = (id: string) => {
    setBuckets((prev) => prev.filter((item) => item.id !== id));
  };

  const addMilestone = (milestone: {
    title: string;
    status: "Planned" | "In Progress" | "Complete";
    targetDate: string;
  }) => {
    setMilestones((prev) => [{ id: crypto.randomUUID(), ...milestone }, ...prev]);
  };

  const removeMilestone = (id: string) => {
    setMilestones((prev) => prev.filter((item) => item.id !== id));
  };

  const addPublication = async (publication: {
    title: string;
    url: string;
    summary: string;
  }) => {
    try {
      const summary =
        publication.summary?.trim() || "Publication registry entry.";
      const payload = {
        title: publication.title,
        summary,
        contentHtml: `<p><a href=\"${publication.url}\" target=\"_blank\" rel=\"noreferrer\">Open publication</a></p>`,
        tags: ["publication", "registry"],
        coverUrl: null,
        galleryUrls: [],
        fileUrl: publication.url,
      };
      const auth = await getAdminAuth();
      const response = await fetch("/api/articles", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ payload, ...auth }),
      });
      if (!response.ok) {
        const result = await response.json().catch(() => null);
        throw new Error(result?.error ?? "Unable to add publication.");
      }
      await loadPublications();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Unable to add publication."
      );
    }
  };

  const removePublication = async (id: string) => {
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
      await loadPublications();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Unable to remove publication."
      );
    }
  };

  const updatePublication = async (id: string, publication: {
    title: string;
    url: string;
    summary: string;
  }) => {
    const title = publication.title.trim();
    const url = publication.url.trim();
    const summary =
      publication.summary?.trim() || "Publication registry entry.";
    const payload = {
      title,
      summary,
      contentHtml: `<p><a href=\"${url}\" target=\"_blank\" rel=\"noreferrer\">Open publication</a></p>`,
      tags: ["publication", "registry"],
      coverUrl: null,
      galleryUrls: [],
      fileUrl: url,
    };
    const auth = await getAdminAuth();
    const response = await fetch("/api/articles", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, payload, ...auth }),
    });
    if (!response.ok) {
      const result = await response.json().catch(() => null);
      throw new Error(result?.error ?? "Unable to update publication.");
    }
    await loadPublications();
  };

  const createVaultEntry = async (payload: VaultCatalogEntry) => {
    const auth = await getAdminAuth();
    const response = await fetch("/api/vaults", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ payload, ...auth }),
    });
    if (!response.ok) {
      const result = await response.json().catch(() => null);
      throw new Error(result?.error ?? "Unable to add vault.");
    }
    await loadVaultRegistry();
  };

  const updateVaultEntry = async (
    id: string,
    payload: Partial<VaultCatalogEntry>
  ) => {
    const auth = await getAdminAuth();
    const response = await fetch("/api/vaults", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, payload, ...auth }),
    });
    if (!response.ok) {
      const result = await response.json().catch(() => null);
      throw new Error(result?.error ?? "Unable to update vault.");
    }
    await loadVaultRegistry();
  };

  const deleteVaultEntry = async (id: string) => {
    const auth = await getAdminAuth();
    const response = await fetch("/api/vaults", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, ...auth }),
    });
    if (!response.ok) {
      const result = await response.json().catch(() => null);
      throw new Error(result?.error ?? "Unable to delete vault.");
    }
    await loadVaultRegistry();
  };

  const createLearnEntry = async (payload: LearnEntry) => {
    const auth = await getAdminAuth();
    const response = await fetch("/api/learn", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ payload, ...auth }),
    });
    if (!response.ok) {
      const result = await response.json().catch(() => null);
      throw new Error(result?.error ?? "Unable to add learn entry.");
    }
    await loadLearnRegistry();
  };

  const updateLearnEntry = async (
    id: string,
    payload: Partial<LearnEntry>
  ) => {
    const auth = await getAdminAuth();
    const response = await fetch("/api/learn", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, payload, ...auth }),
    });
    if (!response.ok) {
      const result = await response.json().catch(() => null);
      throw new Error(result?.error ?? "Unable to update learn entry.");
    }
    await loadLearnRegistry();
  };

  const deleteLearnEntry = async (id: string) => {
    const auth = await getAdminAuth();
    const response = await fetch("/api/learn", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, ...auth }),
    });
    if (!response.ok) {
      const result = await response.json().catch(() => null);
      throw new Error(result?.error ?? "Unable to delete learn entry.");
    }
    await loadLearnRegistry();
  };

  const addSigner = (signer: { address: string; role: string }) => {
    setSigners((prev) => [{ id: crypto.randomUUID(), ...signer }, ...prev]);
  };

  const removeSigner = (id: string) => {
    setSigners((prev) => prev.filter((item) => item.id !== id));
  };

  const addWithdrawRequest = (request: {
    amountEth: number;
    recipient: string;
    reason: string;
    threshold: number;
  }) => {
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

  const addReserve = (reserve: {
    label: string;
    amountEth: number;
    unlockDate: string;
  }) => {
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

  const addExperiment = async (entry: {
    title: string;
    summary: string;
    datasetUrl: string;
    hash: string;
  }) => {
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

  const addBadge = async (badge: {
    recipient: string;
    badge: string;
    tokenId: string;
    expiresAt?: string | null;
  }) => {
    try {
      const auth = await getAdminAuth();
      const response = await fetch("/api/badges", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ payload: badge, ...auth }),
      });
      if (!response.ok) {
        const result = await response.json().catch(() => null);
        throw new Error(result?.error ?? "Unable to issue badge.");
      }
      await loadAdvancedOps();
      await loadExpiredBadges();
      await loadBadgeRegistry();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to issue badge.");
    }
  };

  const removeBadge = async (id: string) => {
    try {
      const auth = await getAdminAuth();
      const response = await fetch("/api/badges", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, ...auth }),
      });
      if (!response.ok) {
        const result = await response.json().catch(() => null);
        throw new Error(result?.error ?? "Unable to remove badge.");
      }
      await loadAdvancedOps();
      await loadExpiredBadges();
      await loadBadgeRegistry();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to remove badge.");
    }
  };

  const addBadgeRegistry = async (entry: {
    title: string;
    code: string;
    weight: number;
    renewDays?: number | null;
  }) => {
    try {
      const auth = await getAdminAuth();
      const response = await fetch("/api/badge-registry", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ payload: entry, ...auth }),
      });
      if (!response.ok) {
        const result = await response.json().catch(() => null);
        throw new Error(result?.error ?? "Unable to add badge type.");
      }
      await loadBadgeRegistry();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Unable to add badge type."
      );
    }
  };

  const removeBadgeRegistry = async (id: string) => {
    try {
      const auth = await getAdminAuth();
      const response = await fetch("/api/badge-registry", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, ...auth }),
      });
      if (!response.ok) {
        const result = await response.json().catch(() => null);
        throw new Error(result?.error ?? "Unable to remove badge type.");
      }
      await loadBadgeRegistry();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Unable to remove badge type."
      );
    }
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

  const createArticle = async (payload: {
    title: string;
    summary: string;
    contentHtml: string;
    tags: string[];
    coverUrl: string | null;
    galleryUrls: string[];
    fileUrl: string | null;
  }) => {
    const auth = await getAdminAuth();
    const response = await fetch("/api/articles", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ payload, ...auth }),
    });
    if (!response.ok) {
      const result = await response.json().catch(() => null);
      throw new Error(result?.error ?? "Unable to create article.");
    }
    await loadArticles();
  };

  const updateArticle = async (
    id: string,
    payload: {
      title: string;
      summary: string;
      contentHtml: string;
      tags: string[];
      coverUrl: string | null;
      galleryUrls: string[];
      fileUrl: string | null;
    }
  ) => {
    const auth = await getAdminAuth();
    const response = await fetch("/api/articles", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, payload, ...auth }),
    });
    if (!response.ok) {
      const result = await response.json().catch(() => null);
      throw new Error(result?.error ?? "Unable to update article.");
    }
    await loadArticles();
  };

  const deleteArticle = async (id: string) => {
    const auth = await getAdminAuth();
    const response = await fetch("/api/articles", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, ...auth }),
    });
    if (!response.ok) {
      const result = await response.json().catch(() => null);
      throw new Error(result?.error ?? "Unable to delete article.");
    }
    await loadArticles();
  };

  const uploadToCloudinary = async (file: File, folder: string) => {
    const signatureRes = await fetch("/api/cloudinary-signature", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ folder }),
    });
    const signaturePayload = await signatureRes.json();
    if (!signatureRes.ok || !signaturePayload?.ok) {
      throw new Error(signaturePayload?.error ?? "Cloudinary not configured.");
    }

    const formData = new FormData();
    formData.append("file", file);
    formData.append("api_key", signaturePayload.apiKey);
    formData.append("timestamp", String(signaturePayload.timestamp));
    formData.append("signature", signaturePayload.signature);
    formData.append("folder", signaturePayload.folder);

    const uploadRes = await fetch(
      `https://api.cloudinary.com/v1_1/${signaturePayload.cloudName}/auto/upload`,
      { method: "POST", body: formData }
    );
    const uploadPayload = await uploadRes.json();
    if (!uploadRes.ok) {
      throw new Error(uploadPayload?.error?.message ?? "Upload failed.");
    }
    return String(uploadPayload.secure_url ?? "");
  };

  const addTokenomics = (scenario: {
    label: string;
    rewardRate: number;
    lockupDays: number;
    inflationRate: number;
    notes: string;
  }) => {
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

  const exportAuditCsv = async () => {
    const [govRes, badgeRes] = await Promise.all([
      fetch("/api/governance").then((res) => res.json()).catch(() => null),
      fetch("/api/badges").then((res) => res.json()).catch(() => null),
    ]);
    const proposals = govRes?.data?.proposals ?? [];
    const votes = govRes?.data?.votes ?? [];
    const unlocks = govRes?.data?.unlocks ?? [];
    const badgesData = Array.isArray(badgeRes?.data) ? badgeRes.data : [];
    const header = [
      "chainId",
      "contractAddress",
      "totalFundedEth",
      "proposalCount",
      "voteCount",
      "unlockCount",
      "signerCount",
      "withdrawRequestCount",
      "reserveCount",
      "experimentCount",
      "badgeCount",
      "tokenomicsCount",
    ];
    const row = [
      currentChainId,
      contractAddress,
      balanceEth,
      proposals.length,
      votes.length,
      unlocks.length,
      signers.length,
      withdrawRequests.length,
      reserves.length,
      experimentsLedger.length,
      badgesData.length,
      tokenomics.length,
    ]
      .map((value) => `"${String(value).replace(/"/g, '""')}"`)
      .join(",");
    const csv = [header.join(","), row].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `phercons-admin-audit-${Date.now()}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const exportAuditPdf = async () => {
    const govRes = await fetch("/api/governance").then((res) => res.json()).catch(() => null);
    const proposals = govRes?.data?.proposals ?? [];
    const votes = govRes?.data?.votes ?? [];
    const unlocks = govRes?.data?.unlocks ?? [];
    const html = `<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <title>Phercons Vault Audit Report</title>
    <style>
      body { font-family: Arial, sans-serif; color: #1c1914; padding: 32px; }
      h1 { font-size: 22px; margin-bottom: 8px; }
      h2 { font-size: 14px; letter-spacing: 0.2em; text-transform: uppercase; color: #6b5b45; margin-top: 24px; }
      table { width: 100%; border-collapse: collapse; margin-top: 12px; }
      th, td { text-align: left; padding: 6px 8px; border-bottom: 1px solid #eadfcf; font-size: 12px; }
      .muted { color: #5e5242; font-size: 12px; }
    </style>
  </head>
  <body>
    <h1>Phercons Vault Audit Report</h1>
    <div class="muted">Generated ${new Date().toLocaleString()}</div>
    <h2>Governance</h2>
    <table>
      <tr><th>Proposals</th><td>${proposals.length}</td></tr>
      <tr><th>Votes</th><td>${votes.length}</td></tr>
      <tr><th>Unlocks</th><td>${unlocks.length}</td></tr>
    </table>
    <h2>Security Controls</h2>
    <table>
      <tr><th>Signers</th><td>${signers.length}</td></tr>
      <tr><th>Withdrawal Requests</th><td>${withdrawRequests.length}</td></tr>
      <tr><th>Reserves</th><td>${reserves.length}</td></tr>
    </table>
    <h2>Advanced R&D</h2>
    <table>
      <tr><th>Experiments</th><td>${experimentsLedger.length}</td></tr>
      <tr><th>Badges</th><td>${badges.length}</td></tr>
      <tr><th>Tokenomics Scenarios</th><td>${tokenomics.length}</td></tr>
    </table>
  </body>
</html>`;
    const reportWindow = window.open("", "_blank");
    if (!reportWindow) {
      setError("Popup blocked. Allow popups to generate the PDF report.");
      return;
    }
    reportWindow.document.write(html);
    reportWindow.document.close();
    reportWindow.focus();
    reportWindow.print();
  };

  const handleEditArticle = (id: string) => {
    setEditingArticleId(id);
    if (typeof document !== "undefined") {
      const target = document.getElementById("article-editor");
      if (target) {
        target.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    }
  };

  useEffect(() => {
    if (!provider) return;
    const sync = async () => {
      const accounts = await provider.send("eth_accounts", []);
      const network = await provider.getNetwork();
      setWalletAddress(accounts?.[0] ?? null);
      setChainId(Number(network.chainId));
    };
    sync();
  }, [provider]);

  useEffect(() => {
    readAdminState();
  }, [contractAddress, walletAddress, chainId]);

  return (
    <SiteShell showAdmin={isAdmin}>
      <div className="flex flex-col gap-8">
        <header className="glass-panel animate-fade flex flex-col gap-4 p-6">
          <p className="text-xs uppercase tracking-[0.35em] text-[#6b5b45]">
            Council Layer
          </p>
          <h1 className="heading-serif text-3xl text-[#1c1914]">
            Proposal Studio & Treasury Ops
          </h1>
          <p className="text-sm text-[#5e5242]">
            Administrative controls for fund allocation, compliance, and
            institutional reporting.
          </p>
          <div className="grid gap-3 text-xs text-[#5e5242] sm:grid-cols-2 lg:grid-cols-5">
            {[
              "Proposal Studio",
              "Fund Allocation",
              "Treasury Ops",
              "Compliance & Risk",
              "Analytics",
            ].map((item) => (
              <div
                key={item}
                className="rounded-2xl border border-[#eadfcf] bg-[#fffdf8] p-3 text-[11px] uppercase tracking-[0.2em] text-[#6b5b45]"
              >
                {item}
              </div>
            ))}
          </div>
          {!walletAddress && (
            <button
              onClick={connectWallet}
              className="w-full rounded-full border border-[#1c1914] px-4 py-2 text-xs uppercase tracking-[0.2em] transition hover:bg-[#1c1914] hover:text-[#fff7ea] sm:w-auto"
            >
              Connect Wallet
            </button>
          )}
          {walletAddress && !isAdmin && (
            <div className="rounded-2xl border border-[#eadfcf] bg-[#fff7ea] p-4 text-sm text-[#5e5242]">
              This page is restricted to the admin address.
            </div>
          )}
        </header>

        {isAdmin && (
          <>
            <section className="stagger grid gap-6 lg:grid-cols-2">
              <div className="glass-panel animate-fade grid gap-3 p-6 text-sm text-[#5e5242]">
                <p className="text-xs uppercase tracking-[0.35em] text-[#6b5b45]">
                  Vault Status
                </p>
                <span>Contract: {contractAddress}</span>
                <span>Owner: {owner ?? "Unknown"}</span>
                <span>Balance: {balanceEth} ETH</span>
              </div>
              <div className="glass-panel animate-fade grid gap-3 p-6 text-sm text-[#5e5242]">
                <p className="text-xs uppercase tracking-[0.35em] text-[#6b5b45]">
                  Withdrawals
                </p>
                <button
                  onClick={withdraw}
                  className="w-full rounded-full border border-[#1c1914] px-4 py-2 text-xs uppercase tracking-[0.2em] transition hover:bg-[#1c1914] hover:text-[#fff7ea]"
                >
                  Withdraw
                </button>
                {status && (
                  <p className="break-all text-xs text-[#1c1914]">{status}</p>
                )}
                {error && (
                  <p className="break-all text-xs text-[#9a2c20]">{error}</p>
                )}
              </div>
            </section>

            <section className="stagger grid gap-6">
              <VaultOpsPanel
                buckets={buckets}
                milestones={milestones}
                publications={publications}
                canEditPublications
                onAddBucket={addBucket}
                onRemoveBucket={removeBucket}
                onAddMilestone={addMilestone}
                onRemoveMilestone={removeMilestone}
                onAddPublication={addPublication}
                onRemovePublication={removePublication}
              />
            </section>

            <section className="stagger grid gap-6">
              <VaultRegistryPanel
                vaults={vaultRegistry}
                onCreate={createVaultEntry}
                onUpdate={updateVaultEntry}
                onDelete={deleteVaultEntry}
              />
            </section>

            <section className="stagger grid gap-6">
              <LearnRegistryPanel
                entries={learnRegistry}
                onCreate={createLearnEntry}
                onUpdate={updateLearnEntry}
                onDelete={deleteLearnEntry}
              />
            </section>

            <section className="stagger grid gap-6">
              <PublicationTrackingPanel
                publications={publications}
                onUpdate={updatePublication}
                onDelete={removePublication}
              />
            </section>

            <section className="stagger grid gap-6">
              <ResearchArticlesPanel
                articles={articles}
                onCreate={createArticle}
                onUpdate={updateArticle}
                onDelete={deleteArticle}
                onUpload={uploadToCloudinary}
                externalEditId={editingArticleId}
                onExternalEditHandled={() => setEditingArticleId(null)}
              />
            </section>

            <section className="stagger grid gap-6">
              <ArticleTrackingPanel
                articles={articles}
                onEdit={handleEditArticle}
                onDelete={deleteArticle}
              />
            </section>

            <section className="stagger grid gap-6">
              <SecurityPanel
                signers={signers}
                threshold={multisigThreshold}
                walletAddress={walletAddress}
                requests={withdrawRequests}
                reserves={reserves}
                onAddSigner={addSigner}
                onRemoveSigner={removeSigner}
                onThresholdChange={setMultisigThreshold}
                onAddRequest={addWithdrawRequest}
                onApproveRequest={approveWithdrawRequest}
                onExecuteRequest={executeWithdrawRequest}
                onAddReserve={addReserve}
                onReleaseReserve={releaseReserve}
                onExportAuditCsv={exportAuditCsv}
                onExportAuditPdf={exportAuditPdf}
              />
            </section>

            <section className="stagger grid gap-6">
              <AdvancedPanel
                experiments={experimentsLedger}
                badges={badges}
                expiredBadges={expiredBadges}
                badgeRegistry={badgeRegistry}
                tokenomics={tokenomics}
                onAddExperiment={addExperiment}
                onRemoveExperiment={removeExperiment}
                onAddBadge={addBadge}
                onRemoveBadge={removeBadge}
                onAddBadgeRegistry={addBadgeRegistry}
                onRemoveBadgeRegistry={removeBadgeRegistry}
                onRunBadgeCleanup={runBadgeCleanup}
                badgeCleanupStatus={badgeCleanupStatus}
                onAddTokenomics={addTokenomics}
                onRemoveTokenomics={removeTokenomics}
                canIssueBadges={isAdmin}
              />
            </section>

            <section className="stagger grid gap-6">
              <BadgeTrackingPanel
                badges={badges}
                expiredBadges={expiredBadges}
                badgeRegistry={badgeRegistry}
                onRemoveBadge={removeBadge}
              />
            </section>

            <section className="stagger grid gap-6">
              <BadgeAutomationPanel getAdminAuth={getAdminAuth} />
            </section>
          </>
        )}

      </div>
    </SiteShell>
  );
}
