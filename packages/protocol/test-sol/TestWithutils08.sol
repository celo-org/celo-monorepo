pragma solidity >=0.5.13 <0.9.0;

import { Test as ForgeTest } from "@lib/celo-foundry-8/lib/forge-std/src/Test.sol";
import { TestConstants } from "@test-sol/constants.sol";
import { PrecompileHandler } from "@test-sol/utils/PrecompileHandler.sol";

import "@celo-contracts/common/interfaces/IRegistry.sol";

import "@celo-contracts-8/common/mocks/EpochManager_WithMocks.sol";
import "@celo-contracts-8/common/IsL2Check.sol";
import "@celo-contracts-8/common/PrecompilesOverrideV2.sol";

contract TestWithUtils08 is ForgeTest, TestConstants, IsL2Check, PrecompilesOverrideV2 {
  IRegistry registry;
  PrecompileHandler ph;
  EpochManager_WithMocks public epochManager;

  address public epochManagerEnabler;
  uint256 public constant secondsInOneBlock = 5;

  function setUp() public virtual {
    ph = new PrecompileHandler();
    setupRegistry();
    epochManagerEnabler = actor("EpochManagerEnabler");
    registry.setAddressFor(EpochManagerEnablerContract, epochManagerEnabler);
    setupEpochManager();
  }

  function setupRegistry() public {
    deployCodeTo("Registry.sol", abi.encode(false), REGISTRY_ADDRESS);
    registry = IRegistry(REGISTRY_ADDRESS);
  }

  function setupEpochManager() public {
    epochManager = new EpochManager_WithMocks();

    registry.setAddressFor(EpochManagerContract, address(epochManager));
  }

  function timeTravel(uint256 timeDelta) public {
    vm.warp(block.timestamp + timeDelta);
  }

  function blockTravel(uint256 blockDelta) public {
    vm.roll(block.number + blockDelta);
  }

  function travelEpochL1() public {
    uint256 blocksInEpoch = 17280;
    uint256 timeDelta = blocksInEpoch * 5;
    blockTravel(blocksInEpoch);
    timeTravel(timeDelta);
  }

  // XXX: this function only increases the block number and timestamp, but does not actually change epoch.
  // XXX: you must start and finish epoch processing to change epochs.
  function travelNL2Epoch(uint256 n) public {
    uint256 blocksInEpoch = L2_BLOCK_IN_EPOCH;
    blockTravel(n * blocksInEpoch);
    timeTravel(n * DAY);
  }

  function travelNEpoch(uint256 n) public {
    if (isL2()) {
      travelNL2Epoch(n);
    } else {
      travelEpochL1();
    }
  }

  function whenL2() public {
    vm.etch(0x4200000000000000000000000000000000000018, abi.encodePacked(bytes1(0x01)));
  }

  function actor(string memory name) public returns (address) {
    uint256 pk = uint256(keccak256(bytes(name)));
    address addr = vm.addr(pk);
    vm.label(addr, name);
    return addr;
  }

  function actorWithPK(string memory name) public returns (address, uint256) {
    uint256 pk = uint256(keccak256(bytes(name)));
    address addr = vm.addr(pk);
    vm.label(addr, name);
    return (addr, pk);
  }

  // This function can be also found in OpenZeppelin's library, but in a newer version than the one we use.
  function compareStrings(string memory a, string memory b) public pure returns (bool) {
    return (keccak256(abi.encodePacked((a))) == keccak256(abi.encodePacked((b))));
  }

  function whenL2WithEpochManagerInitialization() internal {
    uint256 l1EpochNumber = getEpochNumber();

    address[] memory _elected = new address[](2);
    _elected[0] = actor("validator");
    _elected[1] = actor("otherValidator");

    whenL2();
    vm.prank(epochManagerEnabler);
    epochManager.initializeSystem(l1EpochNumber, block.number, _elected);
  }
}
