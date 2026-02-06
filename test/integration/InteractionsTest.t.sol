// SPDX-License-Identifier: MIT

pragma solidity 0.8.19;

import {DeployPherconsVault} from "../../script/DeployPherconsVault.s.sol";
import {FundPherconsVault, WithdrawPherconsVault} from "../../script/Interactions.s.sol";
import {PherconsVault} from "../../src/PherconsVault.sol";
import {HelperConfig} from "../../script/HelperConfig.s.sol";
import {Test, console} from "forge-std/Test.sol";
import {StdCheats} from "forge-std/StdCheats.sol";
import {ZkSyncChainChecker} from "lib/foundry-devops/src/ZkSyncChainChecker.sol";

contract InteractionsTest is ZkSyncChainChecker, StdCheats, Test {
    PherconsVault public fundMe;
    HelperConfig public helperConfig;

    uint256 public constant SEND_VALUE = 0.1 ether; // Value picked to clear the minimum threshold.
    uint256 public constant STARTING_USER_BALANCE = 10 ether;
    uint256 public constant GAS_PRICE = 1;

    address public constant USER = address(1);

    // Alternate representations for readability:
    // 1e18
    // 1_000_000_000_000_000_000
    // 1000000000000000000

    function setUp() external skipZkSync {
        if (!isZkSyncChain()) {
            DeployPherconsVault deployer = new DeployPherconsVault();
            (fundMe, helperConfig) = deployer.deployPherconsVault();
        } else {
            helperConfig = new HelperConfig();
            fundMe = new PherconsVault(helperConfig.getConfigByChainId(block.chainid).priceFeed);
        }
        vm.deal(USER, STARTING_USER_BALANCE);
    }

    function testUserCanFundAndOwnerWithdraw() public skipZkSync {
        uint256 preUserBalance = address(USER).balance;
        uint256 preOwnerBalance = address(fundMe.getOwner()).balance;
        uint256 originalVaultBalance = address(fundMe).balance;

        // Fund from USER using a prank sender.
        vm.prank(USER);
        fundMe.fund{value: SEND_VALUE}();

        WithdrawPherconsVault withdrawPherconsVault = new WithdrawPherconsVault();
        withdrawPherconsVault.withdrawPherconsVault(address(fundMe));

        uint256 afterUserBalance = address(USER).balance;
        uint256 afterOwnerBalance = address(fundMe.getOwner()).balance;

        assert(address(fundMe).balance == 0);
        assertEq(afterUserBalance + SEND_VALUE, preUserBalance);
        assertEq(preOwnerBalance + SEND_VALUE + originalVaultBalance, afterOwnerBalance);
    }
}
