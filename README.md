# Crowdfunding Research Stack

This repository combines a crowdfunding smart contract with a research-oriented
frontend. The goal is to test price-protected funding mechanics, observe on-chain
behavior, and prototype R&D workflows directly in the UI.

## What This Project Does

- Enforces a USD-denominated minimum on funding.
- Uses Chainlink price feeds for real-time ETH/USD conversion.
- Exposes owner-only withdrawals.
- Collects on-chain activity to surface research metrics in the frontend.
- Provides simulation and threshold experiments without changing contracts.

## Smart Contract Highlights

- `PherconsVault` enforces a minimum USD threshold and emits `Funded`/`Withdrawn`.
- `PriceConverter` normalizes feed decimals and blocks stale prices.
- Scripts deploy to local Anvil, Sepolia, and zkSync environments.

## Research-Oriented Features (Frontend)

- **Risk profile:** feed freshness, min funding threshold, price reference.
- **Experiment dashboard:** compares $5, $10, $20 thresholds.
- **Simulation mode:** override price feed with a simulated ETH price.
- **Event analytics:** total funded, unique funders, last fund/withdraw event.

## Quickstart

### Build contracts
```shell
forge build
```

### Run tests
```shell
forge test
```

### Deploy locally (Anvil)
```shell
anvil
make deploy
```

### Deploy to Sepolia
```shell
make deploy-sepolia
```

### Sync frontend addresses
```shell
make sync-frontend
```

### Frontend (Next.js)
```shell
cd crowdfunding-frontend
npm install
npm run dev
```

## Frontend Configuration

`crowdfunding-frontend/.env.local`
```bash
NEXT_PUBLIC_CHAIN_ID=31337
NEXT_PUBLIC_FUNDME_ADDRESS=0x...
```

If no address is provided, the UI reads from
`crowdfunding-frontend/src/lib/deployments.json`, which is generated from
Foundry broadcasts via `make sync-frontend`.

## Research Workflow Ideas

- Track success rate of contributions at different price regimes.
- Simulate price drops and observe minimum funding resilience.
- Compare thresholds without redeploying contracts.

## Tooling Notes

Foundry is used for compilation, testing, and deployment. See:
https://book.getfoundry.sh/
