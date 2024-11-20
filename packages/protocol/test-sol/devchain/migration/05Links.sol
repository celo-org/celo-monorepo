// This file exists only to force migration tests also compile below imported contracts.
pragma solidity ^0.5.13;

import "@celo-contracts/governance/BlockchainParameters.sol";
import "@celo-contracts/governance/DoubleSigningSlasher.sol";
import "@celo-contracts/governance/DowntimeSlasher.sol";
import "@celo-contracts/governance/EpochRewards.sol";
import "@celo-contracts/governance/GovernanceSlasher.sol";
import "@celo-contracts/governance/LockedGold.sol";
import "@celo-contracts/common/FeeCurrencyWhitelist.sol";
import "@celo-contracts/common/Freezer.sol";
import "@celo-contracts/common/FeeHandler.sol";
import "@celo-contracts/identity/OdisPayments.sol";
import "@celo-contracts/identity/Random.sol";
import "@celo-contracts/common/Registry.sol";
import "@celo-contracts/common/UniswapFeeHandlerSeller.sol";
import "@celo-contracts/common/MentoFeeHandlerSeller.sol";

import { TestWithUtils } from "@test-sol/TestWithUtils.sol";

contract BlockchainParametersTest is TestWithUtils {
  function test_dummy_test() public {}
}
