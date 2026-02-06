// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.19;

import {Script, console} from "forge-std/Script.sol";
import {PherconsVault} from "../src/PherconsVault.sol";
import {DevOpsTools} from "foundry-devops/src/DevOpsTools.sol";

contract FundPherconsVault is Script {
    uint256 internal constant SEND_VALUE = 0.1 ether;

    function fundPherconsVault(address mostRecentlyDeployed) public {
        vm.startBroadcast();
        PherconsVault(payable(mostRecentlyDeployed)).fund{value: SEND_VALUE}();
        vm.stopBroadcast();
        console.log("Funded PherconsVault with %s", SEND_VALUE);
    }

    function run() external {
        address mostRecentlyDeployed =
            DevOpsTools.get_most_recent_deployment("PherconsVault", block.chainid);
        fundPherconsVault(mostRecentlyDeployed);
    }
}

contract WithdrawPherconsVault is Script {
    function withdrawPherconsVault(address mostRecentlyDeployed) public {
        vm.startBroadcast();
        PherconsVault(payable(mostRecentlyDeployed)).withdraw();
        vm.stopBroadcast();
        console.log("Withdrew PherconsVault balance.");
    }

    function run() external {
        address mostRecentlyDeployed =
            DevOpsTools.get_most_recent_deployment("PherconsVault", block.chainid);
        withdrawPherconsVault(mostRecentlyDeployed);
    }
}
