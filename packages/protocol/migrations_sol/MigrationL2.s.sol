pragma solidity >=0.8.7 <0.8.20;

import { Script } from "forge-std-8/Script.sol";
import { MigrationsConstants } from "@migrations-sol/constants.sol";

// Foundry imports
import "forge-std/console.sol";

import "@celo-contracts/common/FixidityLib.sol";
import "@celo-contracts-8/common/UsingRegistry.sol";
import "../../contracts/common/interfaces/IEpochManagerEnabler.sol";

contract MigrationL2 is Script, MigrationsConstants, UsingRegistry {
  using FixidityLib for FixidityLib.Fraction;

  /**
   * Entry point of the script
   */
  function run() external {
    vm.startBroadcast(DEPLOYER_ACCOUNT);

    setupUsingRegistry();
    dealToCeloUnreleasedTreasury();

    initializeEpochManagerSystem();

    vm.stopBroadcast();
  }

  function setupUsingRegistry() public {
    _transferOwnership(DEPLOYER_ACCOUNT);
    setRegistry(REGISTRY_ADDRESS);
  }

  function dealToCeloUnreleasedTreasury() public {
    // TODO(soloseng) update number.
    vm.deal(address(getCeloUnreleasedTreasury()), 1_000_000 ether);
  }

  function initializeEpochManagerSystem() public {
    console.log("Initializing EpochManager system");
    address[] memory firstElected = getValidators().getRegisteredValidators();
    IEpochManager epochManager = getEpochManager();
    address epochManagerEnablerAddress = registry.getAddressForOrDie(
      EPOCH_MANAGER_ENABLER_REGISTRY_ID
    );

    IEpochManagerEnabler epochManagerEnabler = IEpochManagerEnabler(epochManagerEnablerAddress);
    epochManagerEnabler.initEpochManager();
  }
}
