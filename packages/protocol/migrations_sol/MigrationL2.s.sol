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

    dealToCeloUnreleasedTreasury(json);
    console.log(
      "### balance of reserve1:",
      registry.getAddressForOrDie(RESERVE_REGISTRY_ID).balance
    );
    vm.stopBroadcast();

    // activateValidators();

    vm.startBroadcast(DEPLOYER_ACCOUNT);
    // activateL2();
    initializeEpochManagerSystem();

    vm.stopBroadcast();
  }

  function setupUsingRegistry() public {
    _transferOwnership(DEPLOYER_ACCOUNT);
    setRegistry(REGISTRY_ADDRESS);
  }

  function dealToCeloUnreleasedTreasury(string memory json) public {
    vm.deal(address(getCeloUnreleasedTreasury()), L2_INITIAL_STASH_BALANCE);
    uint256 initialBalance = abi.decode(json.parseRaw(".reserve.initialBalance"), (uint256));
    vm.deal(registry.getAddressForOrDie(RESERVE_REGISTRY_ID), initialBalance);
  }

  // function activateL2() public {
  //   console.log("### activating L2");
  //   vm.etch(0x4200000000000000000000000000000000000018, abi.encodePacked(bytes1(0x01)));
  // }
  function initializeEpochManagerSystem() public {
    console.log("Initializing EpochManager system");
    address epochManagerEnablerAddress = registry.getAddressForOrDie(
      EPOCH_MANAGER_ENABLER_REGISTRY_ID
    );

    IEpochManagerEnabler epochManagerEnabler = IEpochManagerEnabler(epochManagerEnablerAddress);
    epochManagerEnabler.initEpochManager();
    console.log("### current BN:", block.number);
    console.log("### active votes L2", getElection().getActiveVotes());
  }

  function activateValidators() public {
    console.log("### activating validators");

    address[] memory registeredValidators = getValidators().getRegisteredValidators();

    travelNEpochL1(4);

    for (uint256 i = 0; i < registeredValidators.length; i++) {
      console.log("### registered val", registeredValidators[i]);
      (, , address validatorGroup, , ) = getValidators().getValidator(registeredValidators[i]);
      if (getElection().getPendingVotesForGroup(validatorGroup) == 0) {
        continue;
      }
      vm.startPrank(validatorGroup);
      getElection().activate(validatorGroup);
      vm.stopPrank();
      console.log("### current BN:", block.number);
    }
    vm.roll(block.number + 2);
    console.log("### active votes", getElection().getActiveVotes());
  }

  function travelNEpochL1(uint256 n) internal {
    uint256 blocksInEpoch = L1_BLOCK_IN_EPOCH;
    uint256 timeDelta = blocksInEpoch * 5;
    uint256 forwardBlocks = n * blocksInEpoch;
    uint256 forwardTime = n * timeDelta;
    vm.roll(block.number + forwardBlocks);
    vm.warp(block.timestamp + forwardTime);
  }
}
