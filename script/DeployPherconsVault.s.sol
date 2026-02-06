// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.19;

import {Script} from "../lib/forge-std/src/Script.sol";
import {HelperConfig} from "./HelperConfig.s.sol";
import {PherconsVault} from "../src/PherconsVault.sol";

contract DeployPherconsVault is Script {
    function deployPherconsVault() public returns (PherconsVault, HelperConfig) {
        HelperConfig helperConfig = new HelperConfig(); // Provides network config and local mocks.
        address priceFeed = helperConfig.getConfigByChainId(block.chainid).priceFeed;

        vm.startBroadcast();
        PherconsVault vault = new PherconsVault(priceFeed);
        vm.stopBroadcast();
        return (vault, helperConfig);
    }

    function run() external returns (PherconsVault, HelperConfig) {
        return deployPherconsVault();
    }
}
