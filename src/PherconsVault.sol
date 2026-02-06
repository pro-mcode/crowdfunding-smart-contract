// SPDX-License-Identifier: MIT
// Solidity version
pragma solidity 0.8.19;

// Dependencies
import {AggregatorV3Interface} from "@chainlink/contracts/src/v0.8/shared/interfaces/AggregatorV3Interface.sol";
import {PriceConverter} from "./PriceConverter.sol";

// Custom errors
error PherconsVault__NotOwner();
error PherconsVault__InsufficientEth(uint256 usdAmount, uint256 minimumUsd);
error PherconsVault__WithdrawFailed();

/**
 * @title Simple crowdfunding contract
 * @author Adedamola Maxwell
 * @notice Accepts ETH contributions and lets the owner withdraw
 * @dev Uses Chainlink price feeds via a library for USD conversions
 */
contract PherconsVault {
    // Library usage
    using PriceConverter for uint256;

    // Storage
    uint256 public constant MINIMUM_USD = 5 * 10 ** 18;
    address private immutable i_owner;
    AggregatorV3Interface private immutable i_priceFeed;
    address[] private s_funders;
    mapping(address => uint256) private s_addressToAmountFunded;
    mapping(address => bool) private s_isFunder;

    // Events
    event Funded(address indexed funder, uint256 amount);
    event Withdrawn(address indexed owner, uint256 amount);

    // Access control
    modifier onlyOwner() {
        if (msg.sender != i_owner) revert PherconsVault__NotOwner();
        _;
    }

    // Function order (style guide):
    //// constructor (init)
    //// receive (ETH)
    //// fallback (ETH)
    //// external
    //// public
    //// internal
    //// private
    //// view / pure

    constructor(address priceFeed) {
        i_priceFeed = AggregatorV3Interface(priceFeed);
        i_owner = msg.sender;
    }

    receive() external payable {
        fund();
    }

    fallback() external payable {
        fund();
    }

    /// @notice Funds our contract based on the ETH/USD price
    function fund() public payable {
        uint256 usdAmount = msg.value.getConversionRate(i_priceFeed);
        if (usdAmount < MINIMUM_USD) revert PherconsVault__InsufficientEth(usdAmount, MINIMUM_USD);

        s_addressToAmountFunded[msg.sender] += msg.value;
        if (!s_isFunder[msg.sender]) {
            s_isFunder[msg.sender] = true;
            s_funders.push(msg.sender);
        }
        emit Funded(msg.sender, msg.value);
    }

    // aderyn-ignore-next-line(centralization-risk,unused-public-function,state-change-without-event))
    function withdraw() public onlyOwner {
        // aderyn-ignore-next-line(storage-array-length-not-cached,costly-loop)
        for (uint256 funderIndex = 0; funderIndex < s_funders.length; funderIndex++) {
            address funder = s_funders[funderIndex];
            s_addressToAmountFunded[funder] = 0;
            s_isFunder[funder] = false;
        }
        s_funders = new address[](0);
        // Use call to forward all gas and handle return status.
        uint256 payout = address(this).balance;
        (bool success,) = i_owner.call{value: payout}("");
        if (!success) revert PherconsVault__WithdrawFailed();
        emit Withdrawn(i_owner, payout);
    }

    function cheaperWithdraw() public onlyOwner {
        address[] memory funders = s_funders;
        // Mappings can't exist in memory, so we only copy the array.
        for (uint256 funderIndex = 0; funderIndex < funders.length; funderIndex++) {
            address funder = funders[funderIndex];
            s_addressToAmountFunded[funder] = 0;
            s_isFunder[funder] = false;
        }
        s_funders = new address[](0);
        // Use call to forward all gas and handle return status.
        uint256 payout = address(this).balance;
        (bool success,) = i_owner.call{value: payout}("");
        if (!success) revert PherconsVault__WithdrawFailed();
        emit Withdrawn(i_owner, payout);
    }

    /**
     * Read-only helpers
     */

    /**
     * @notice Gets the amount that an address has funded
     * @param fundingAddress the address of the funder
     * @return the amount funded
     */
    function getAddressToAmountFunded(address fundingAddress) public view returns (uint256) {
        return s_addressToAmountFunded[fundingAddress];
    }

    function getVersion() public view returns (uint256) {
        return i_priceFeed.version();
    }

    function getFunder(uint256 index) public view returns (address) {
        return s_funders[index];
    }

    function getOwner() public view returns (address) {
        return i_owner;
    }

    function getPriceFeed() public view returns (AggregatorV3Interface) {
        return i_priceFeed;
    }
}
