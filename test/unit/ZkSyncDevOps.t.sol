// SPDX-License-Identifier: MIT

pragma solidity 0.8.19;

import {Test, console} from "forge-std/Test.sol";
import {ZkSyncChainChecker} from "lib/foundry-devops/src/ZkSyncChainChecker.sol";
import {FoundryZkSyncChecker} from "lib/foundry-devops/src/FoundryZkSyncChecker.sol";

contract ZkSyncDevOps is Test, ZkSyncChainChecker, FoundryZkSyncChecker {
    // Remove `skipZkSync`, then run `forge test --mt testZkSyncChainFails --zksync` to confirm the failure.
    function testZkSyncChainFails() public skipZkSync {
        address ripemd = address(uint160(3));

        bool success;
        // Low-level call used to demonstrate zkSync-specific behavior.
        assembly {
            success := call(gas(), ripemd, 0, 0, 0, 0, 0)
        }
        assert(success);
    }

    // `ffi=true` in foundry.toml is required to run this test.

    
    // Remove `onlyVanillaFoundry`, then run `foundryup-zksync` and then
    // `forge test --mt testZkSyncFoundryFails --zksync`
    // to verify the expected failure.


    // Example test (disabled):
    // function testZkSyncFoundryFails() public onlyVanillaFoundry {
    //     bool exists = vm.keyExistsJson('{"hi":"true"}', ".hi");
    //     assert(exists);
    // }
}
