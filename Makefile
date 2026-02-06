SHELL := /bin/bash

# Load environment variables from .env when present.
ifneq (,$(wildcard .env))
include .env
export
endif


.PHONY: all test clean deploy fund help install snapshot format anvil zktest sync-frontend

help:
	@echo "Makefile commands:"
	@echo "  make all            - Clean, remove, install, update, and build the project"
	@echo "  make clean          - Clean the project"
	@echo "  make remove         - Remove existing modules"
	@echo "  make install        - Install required dependencies"
	@echo "  make update         - Update dependencies"
	@echo "  make build          - Build the project"
	@echo "  make zkbuild        - Build the project for zkSync"
	@echo "  make test           - Run tests"
	@echo "  make zktest         - Run tests on zkSync"
	@echo "  make snapshot       - Create a snapshot of the build artifacts"
	@echo "  make format         - Format the codebase"
	@echo "  make anvil         - Start Anvil local Ethereum node"
	@echo "  make zk-anvil      - Start zkSync local development node"
	@echo "  make deploy        - Deploy FundMe contract"
	@echo "  make deploy-sepolia - Deploy FundMe contract to Sepolia testnet"
	@echo "  make deploy-zk     - Deploy FundMe contract to zkSync local node"
	@echo "  make deploy-zk-sepolia - Deploy FundMe contract to zkSync Sepolia testnet"
	@echo "  make fund          - Fund the FundMe contract"
	@echo "  make withdraw      - Withdraw from the FundMe contract"
	
all: clean remove install update build

# Clean build artifacts and cache
clean  :; forge clean

# Remove submodule metadata and vendored libs (no git commit)
remove :; rm -rf .gitmodules && rm -rf .git/modules/* && rm -rf lib && touch .gitmodules

install :; forge install cyfrin/foundry-devops@0.2.2 && forge install smartcontractkit/chainlink-brownie-contracts@1.1.1 && forge install foundry-rs/forge-std@v1.8.2

# Refresh dependencies
update:; forge update

build:; forge build

zkbuild :; forge build --zksync

test :; forge test

zktest :; foundryup-zksync && forge test --zksync && foundryup

snapshot :; forge snapshot

format :; forge fmt

anvil :; anvil -m 'test test test test test test test test test test test junk' --steps-tracing --block-time 1

zk-anvil :; npx zksync-cli dev start

deploy:
	@forge script script/DeployPherconsVault.s.sol:DeployPherconsVault $(NETWORK_ARGS)

NETWORK ?= anvil
NETWORK_ARGS := --rpc-url $(ANVIL_RPC_URL) --private-key $(ANVIL_PRIVATE_KEY) --broadcast

ifeq ($(NETWORK),sepolia)
	NETWORK_ARGS := --rpc-url $(SEPOLIA_RPC_URL) --account $(ACCOUNT) --broadcast --verify --etherscan-api-key $(ETHERSCAN_API_KEY) -vvvv
endif

deploy-sepolia: NETWORK=sepolia
deploy-sepolia: deploy

# Note: Alchemy zkSync RPC can be flaky at times
deploy-zk:
	forge create src/PherconsVault.sol:PherconsVault --rpc-url $(ZKSYNC_RPC_URL) --private-key $(ZKSYNC_LOCAL_KEY) --constructor-args $(shell forge create test/mock/MockV3Aggregator.sol:MockV3Aggregator --rpc-url http://127.0.0.1:8011 --private-key $(ZKSYNC_LOCAL_KEY) --constructor-args 8 200000000000 --legacy --zksync --json | python -c "import json,sys; print(json.load(sys.stdin)['deployedTo'])") --legacy --zksync

deploy-zk-sepolia:
	forge create src/FundMe.sol:FundMe --rpc-url ${ZKSYNC_SEPOLIA_RPC_URL} --account default --constructor-args 0xfEefF7c3fB57d18C5C6Cdd71e45D2D0b4F9377bF --legacy --zksync


# Funding/withdraw scripts require an explicit sender address (`--sender <ADDRESS>`).
SENDER_ADDRESS := <sender's address>
 
fund:
	@forge script script/Interactions.s.sol:FundPherconsVault --sender $(SENDER_ADDRESS) $(NETWORK_ARGS)

withdraw:
	@forge script script/Interactions.s.sol:WithdrawPherconsVault --sender $(SENDER_ADDRESS) $(NETWORK_ARGS)

sync-frontend:
	@node scripts/sync-frontend-address.mjs
