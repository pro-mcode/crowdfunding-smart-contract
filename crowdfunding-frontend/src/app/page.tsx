/* eslint-disable @typescript-eslint/no-unused-vars */
"use client";

import { useEffect, useMemo, useState } from "react";
import { BrowserProvider, Contract, formatEther, parseEther } from "ethers";
import { FUNDME_ABI } from "@/lib/fundmeAbi";
import {
  FUNDME_ADDRESS,
  DEFAULT_CHAIN_ID,
  chainLabel,
  getFundMeAddress,
} from "@/lib/network";
import HeroHeader from "@/components/HeroHeader";
import WalletPanel from "@/components/WalletPanel";
import FundPanel from "@/components/FundPanel";
import StatusPanel from "@/components/StatusPanel";
import ActivityPanel from "@/components/ActivityPanel";

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
  const [priceState, setPriceState] = useState<PriceState>({
    minEthForUsd: "0",
    safeMinEthForUsd: "0",
    usdPerEth: "0",
  });

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
      const priceFeed = new Contract(
        contractState.priceFeed,
        [
          "function latestRoundData() view returns (uint80,int256,uint256,uint256,uint80)",
          "function decimals() view returns (uint8)",
        ],
        provider
      );
      const [roundData, decimals] = await Promise.all([
        priceFeed.latestRoundData(),
        priceFeed.decimals(),
      ]);
      const priceRaw = roundData[1];
      if (priceRaw <= 0) return;
      const priceScaled = BigInt(priceRaw) * 10n ** (18n - BigInt(decimals));
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
      });
    } catch {
      setPriceState({
        minEthForUsd: "0",
        safeMinEthForUsd: "0",
        usdPerEth: "0",
      });
    }
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
      const tx = await writeContract.fund({ value: parseEther(fundAmount) });
      setStatus(`Transaction submitted: ${tx.hash}`);
      await tx.wait();
      setStatus("Funding confirmed.");
      await readContractState();
    } catch (err) {
      setError("Funding failed. Check your amount and network.");
    }
  };

  const withdraw = async () => {
    resetMessages();
    if (!provider || !contract) return;
    try {
      const signer = await provider.getSigner();
      const writeContract = contract.connect(signer);
      setStatus("Submitting withdraw transaction...");
      const tx = await writeContract.withdraw();
      setStatus(`Transaction submitted: ${tx.hash}`);
      await tx.wait();
      setStatus("Withdraw confirmed.");
      await readContractState();
    } catch (err) {
      setError("Withdraw failed. Check owner permissions and network.");
    }
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
  }, [contractState.priceFeed, contractState.minimumUsd, wallet.chainId]);

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

  return (
    <div className="grid-dots min-h-screen bg-[#f5f0e6] text-[#1c1914]">
      <div className="mx-auto flex min-h-screen w-full max-w-6xl flex-col gap-8 px-4 py-10 sm:gap-10 sm:px-6 sm:py-16">
        <HeroHeader
          networkLabel={chainLabel(currentChainId)}
          contractAddress={contractAddress}
          balanceEth={contractState.balanceEth}
          minimumUsdDisplay={minimumUsdDisplay}
          priceFeed={contractState.priceFeed}
          version={contractState.version}
        />

        <section className="grid gap-6 md:grid-cols-[1.2fr_0.8fr]">
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
            onFundAmountChange={setFundAmount}
            canInteract={canInteract}
            isOwner={isOwner}
            onFund={fund}
            onWithdraw={withdraw}
            exactEth={priceState.minEthForUsd}
            safeEth={priceState.safeMinEthForUsd}
            usdPerEth={priceState.usdPerEth}
            isCloseToMinimum={isCloseToMinimum}
            onAutofillExact={() => setFundAmount(priceState.minEthForUsd)}
            onAutofillSafe={() => setFundAmount(priceState.safeMinEthForUsd)}
          />
        </section>

        <section className="grid gap-6 md:grid-cols-[0.8fr_1.2fr]">
          <StatusPanel status={status} error={error} />
          <ActivityPanel />
        </section>
      </div>
    </div>
  );
}
