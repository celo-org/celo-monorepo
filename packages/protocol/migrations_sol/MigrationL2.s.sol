pragma solidity >=0.8.7 <0.8.20;

import { Script } from "forge-std-8/Script.sol";
import { MigrationsConstants } from "@migrations-sol/constants.sol";
import "forge-std/console.sol";

import "@celo-contracts/common/FixidityLib.sol";
import "@celo-contracts-8/common/UsingRegistry.sol";

contract MigrationL2 is Script, MigrationsConstants, UsingRegistry {
  using FixidityLib for FixidityLib.Fraction;

  // This is Anvil's default account
  address constant deployerAccount = 0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266; // TODO: Move this to MigrationsConstants

  /**
   * Entry point of the script
   */
  function run() external {
    vm.startBroadcast(deployerAccount);

    setupUsingRegistry();
    activateCeloDistributionSchedule();

    vm.stopBroadcast();
  }

  function setupUsingRegistry() public {
    _transferOwnership(deployerAccount);
    setRegistry(REGISTRY_ADDRESS);
  }

  function activateCeloDistributionSchedule() public {
    // TODO: Move this to MigrationsConstants
    uint256 l2StartTime = 1721909903 - 5; // Arbitrarily 5 seconds before last black
    FixidityLib.Fraction memory communityRewardFraction = FixidityLib.newFixedFraction(1, 100); // 0.01
    FixidityLib.Fraction memory carbonOffsettingFraction = FixidityLib.newFixedFraction(1, 1000); // 0.001
    address carbonOffsettingPartner = 0x22579CA45eE22E2E16dDF72D955D6cf4c767B0eF;

    getCeloDistributionSchedule().activate(
      l2StartTime,
      FixidityLib.unwrap(communityRewardFraction),
      carbonOffsettingPartner,
      FixidityLib.unwrap(carbonOffsettingFraction)
    );
  }
}
