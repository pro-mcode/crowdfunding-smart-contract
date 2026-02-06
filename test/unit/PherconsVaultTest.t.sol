// SPDX-License-Identifier: MIT

pragma solidity 0.8.19;

import {PherconsVault, PherconsVault__InsufficientEth, PherconsVault__WithdrawFailed} from "../../src/PherconsVault.sol";
import {MockV3Aggregator} from "../mock/MockV3Aggregator.sol";
import {Test} from "forge-std/Test.sol";

contract PherconsVaultTest is Test {
    uint8 private constant DECIMALS = 8;
    int256 private constant INITIAL_PRICE = 2000e8;
    uint256 private constant SEND_VALUE = 0.1 ether;

    PherconsVault public fundMe;
    MockV3Aggregator public mockPriceFeed;
    address public constant USER = address(1);

    event Funded(address indexed funder, uint256 amount);
    event Withdrawn(address indexed owner, uint256 amount);

    function setUp() public {
        mockPriceFeed = new MockV3Aggregator(DECIMALS, INITIAL_PRICE);
        fundMe = new PherconsVault(address(mockPriceFeed));
        vm.deal(USER, 10 ether);
    }

    receive() external payable {}

    function testDeployUsesMockFeed() public view {
        assertEq(address(fundMe.getPriceFeed()), address(mockPriceFeed));
    }

    function testFundRevertsWhenValueIsTooLow() public {
        vm.prank(USER);
        vm.expectRevert(
            abi.encodeWithSelector(
                PherconsVault__InsufficientEth.selector,
                uint256(2000),
                fundMe.MINIMUM_USD()
            )
        );
        fundMe.fund{value: 1 wei}();
    }

    function testFundEmitsEvent() public {
        vm.expectEmit(true, false, false, true);
        emit Funded(USER, SEND_VALUE);

        vm.prank(USER);
        fundMe.fund{value: SEND_VALUE}();
    }

    function testWithdrawEmitsEvent() public {
        vm.prank(USER);
        fundMe.fund{value: SEND_VALUE}();

        vm.expectEmit(true, false, false, true, address(fundMe));
        emit Withdrawn(address(this), SEND_VALUE);
        fundMe.withdraw();
    }

    function testWithdrawRevertsWhenOwnerCannotReceive() public {
        RevertingOwner owner = new RevertingOwner(address(mockPriceFeed));
        vm.deal(address(owner), 1 ether);
        owner.fund{value: SEND_VALUE}();

        vm.expectRevert(PherconsVault__WithdrawFailed.selector);
        owner.withdraw();
    }
}

contract RevertingOwner {
    PherconsVault public fundMe;

    constructor(address priceFeed) {
        fundMe = new PherconsVault(priceFeed);
    }

    function fund() external payable {
        fundMe.fund{value: msg.value}();
    }

    function withdraw() external {
        fundMe.withdraw();
    }

    receive() external payable {
        revert();
    }
}
