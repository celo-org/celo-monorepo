pragma solidity >=0.8.7 <0.8.20;

import { Script } from "forge-std-8/Script.sol";
import { MigrationsConstants } from "@migrations-sol/constants.sol";

import "@celo-contracts/common/FixidityLib.sol";
import "@celo-contracts-8/common/UsingRegistry.sol";

contract MigrationL2 is Script, MigrationsConstants, UsingRegistry {
  using FixidityLib for FixidityLib.Fraction;

  /**
   * Entry point of the script
   */
  function run() external {
    vm.startBroadcast(DEPLOYER_ACCOUNT);

    setupUsingRegistry();
    activateCeloUnreleasedTreasure();

    vm.stopBroadcast();
  }

  function setupUsingRegistry() public {
    _transferOwnership(DEPLOYER_ACCOUNT);
    setRegistry(REGISTRY_ADDRESS);
  }

  function activateCeloUnreleasedTreasure() public {
    uint256 l2StartTime = 1721909903 - 5; // Arbitrarily 5 seconds before last black
    uint256 communityRewardFraction = getEpochRewards().getCommunityRewardFraction();
    address carbonOffsettingPartner = 0x22579CA45eE22E2E16dDF72D955D6cf4c767B0eF;
    uint256 carbonOffsettingFraction = getEpochRewards().getCarbonOffsettingFraction();

    getCeloUnreleasedTreasure().activate(
      l2StartTime,
      communityRewardFraction,
      carbonOffsettingPartner,
      carbonOffsettingFraction
    );
  }
}
