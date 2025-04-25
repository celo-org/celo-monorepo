pragma solidity >=0.8.7 <0.8.20;

import { Script } from "forge-std-8/Script.sol";
import { MigrationsConstants } from "@migrations-sol/constants.sol";

// Foundry imports
import "forge-std/console.sol";
import "forge-std/StdJson.sol";

import "@celo-contracts/common/FixidityLib.sol";
import "@celo-contracts-8/common/UsingRegistry.sol";
import "@celo-contracts/common/interfaces/IEpochManagerEnabler.sol";

contract MigrationL2 is Script, MigrationsConstants, UsingRegistry {
  using FixidityLib for FixidityLib.Fraction;
  using stdJson for string;

  /**
   * Entry point of the script
   */
  function run() external {
    string memory json = vm.readFile("./migrations_sol/migrationsConfig.json");
    vm.startBroadcast(DEPLOYER_ACCOUNT);

    setupUsingRegistry();

    dealToCeloUnreleasedTreasuryAndReserve(json);

    vm.stopBroadcast();

    vm.startBroadcast(DEPLOYER_ACCOUNT);

    initializeEpochManagerSystem();

    vm.stopBroadcast();
  }

  function setupUsingRegistry() public {
    _transferOwnership(DEPLOYER_ACCOUNT);
    setRegistry(REGISTRY_ADDRESS);
  }

  function dealToCeloUnreleasedTreasuryAndReserve(string memory json) public {
    vm.deal(address(getCeloUnreleasedTreasury()), L2_INITIAL_STASH_BALANCE);
    uint256 initialBalance = abi.decode(json.parseRaw(".reserve.initialBalance"), (uint256));
    vm.deal(registry.getAddressForOrDie(RESERVE_REGISTRY_ID), initialBalance);
  }

  function initializeEpochManagerSystem() public {
    console.log("Initializing EpochManager system");
    address epochManagerEnablerAddress = registry.getAddressForOrDie(
      EPOCH_MANAGER_ENABLER_REGISTRY_ID
    );

    IEpochManagerEnabler epochManagerEnabler = IEpochManagerEnabler(epochManagerEnablerAddress);
    epochManagerEnabler.initEpochManager();
  }
}
