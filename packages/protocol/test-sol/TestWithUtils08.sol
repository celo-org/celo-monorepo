pragma solidity >=0.5.13 <0.9.0;

import { Test as ForgeTest } from "@lib/celo-foundry-8/lib/forge-std/src/Test.sol";
import { TestConstants } from "@test-sol/constants.sol";
import { PrecompileHandler } from "@test-sol/utils/PrecompileHandler.sol";
import { IEpochManagerEnablerMock } from "@test-sol/unit/common/interfaces/IEpochManagerEnablerMock.sol";
import { EpochManagerEnablerMock } from "@test-sol/mocks/EpochManagerEnablerMock.sol";

import "@celo-contracts/common/interfaces/IRegistry.sol";
import { IAccounts } from "@celo-contracts/common/interfaces/IAccounts.sol";

import "@celo-contracts-8/common/mocks/EpochManager_WithMocks.sol";
import { MockAccounts } from "@celo-contracts-8/common/mocks/MockAccounts.sol";
import "@celo-contracts-8/common/IsL2Check.sol";
import "@celo-contracts-8/common/PrecompilesOverrideV2.sol";
import { console } from "forge-std-8/console.sol";

contract TestWithUtils08 is ForgeTest, TestConstants, IsL2Check, PrecompilesOverrideV2 {
  IRegistry registry;
  PrecompileHandler ph;
  EpochManager_WithMocks public epochManager;
  EpochManagerEnablerMock epochManagerEnabler;
  MockAccounts accountss;

  IAccounts accountsContract;
  IEpochManagerEnablerMock epochManagerEnablerMockInterface;

  address accountsAddress;
  address mockOracleAddress;

  uint256 public constant secondsInOneBlock = 5;
  uint256 numberValidators = 100;
  uint256 l2EpochDuration = DAY;

  function setUp() public virtual {
    ph = new PrecompileHandler();
    ph.setEpochSize(L1_BLOCK_IN_EPOCH);
    setupRegistry();
    setupAccounts();
    setupEpochManagerEnabler();
    setupEpochManager();
  }

  function setupRegistry() public {
    deployCodeTo("Registry.sol", abi.encode(false), REGISTRY_ADDRESS);
    registry = IRegistry(REGISTRY_ADDRESS);
  }

  function setupAccounts() public {
    accountsAddress = actor("accountsAddress");
    deployCodeTo("Accounts.sol", abi.encode(false), accountsAddress);
    accountsContract = IAccounts(accountsAddress);

    // accountss = new MockAccounts();

    // registry.setAddressFor(AccountsContract, address(accountss));
    // console.log("### Accounts address: ", address(accountss));
    registry.setAddressFor(AccountsContract, accountsAddress);
    console.log("### Accounts address: ", accountsAddress);
  }

  function setupEpochManager() public {
    epochManager = new EpochManager_WithMocks();
    mockOracleAddress = actor("oracle");
    registry.setAddressFor(SortedOraclesContract, mockOracleAddress);
    epochManager.initialize(REGISTRY_ADDRESS, l2EpochDuration);
    registry.setAddressFor(EpochManagerContract, address(epochManager));
  }

  function setupEpochManagerEnabler() public {
    epochManagerEnabler = new EpochManagerEnablerMock();
    epochManagerEnabler.initialize(REGISTRY_ADDRESS);
    registry.setAddressFor(EpochManagerEnablerContract, address(epochManagerEnabler));
  }

  function timeTravel(uint256 timeDelta) public {
    vm.warp(block.timestamp + timeDelta);
  }

  function blockTravel(uint256 blockDelta) public {
    vm.roll(block.number + blockDelta);
  }

  function travelNEpochL1(uint256 n) public {
    uint256 blocksInEpoch = L1_BLOCK_IN_EPOCH;
    uint256 timeDelta = blocksInEpoch * 5;
    blockTravel(n * blocksInEpoch);
    timeTravel(n * timeDelta);
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
      travelNEpochL1(n);
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

  function _registerAndElectValidatorsForL2() internal {
    address enablerAddr = registry.getAddressFor(EPOCH_MANAGER_ENABLER_REGISTRY_ID);
    epochManagerEnablerMockInterface = IEpochManagerEnablerMock(enablerAddr);

    address[] memory _elected = new address[](2);
    _elected[0] = actor("validator");
    _elected[1] = actor("otherValidator");

    vm.prank(_elected[0]);
    accountsContract.createAccount();
    // accountss.setValidatorSigner(_elected[0], _elected[0]);
    epochManagerEnablerMockInterface.addValidator(_elected[0]);

    vm.prank(_elected[1]);
    accountsContract.createAccount();
    // accountss.setValidatorSigner(_elected[1], _elected[1]);
    epochManagerEnablerMockInterface.addValidator(_elected[1]);

    for (uint256 i = 2; i < numberValidators; i++) {
      address _currentValidator = vm.addr(i + 1);
      vm.prank(_currentValidator);
      accountsContract.createAccount();
      // accountss.setValidatorSigner(_currentValidator, _currentValidator);

      epochManagerEnablerMockInterface.addValidator(_currentValidator);
    }
    travelNEpochL1(2);
  }

  function whenL2WithEpochManagerInitialization() internal {
    _registerAndElectValidatorsForL2();

    epochManagerEnabler.captureEpochAndValidators();

    whenL2();

    epochManagerEnabler.initEpochManager();
    console.log("### Done initEpochManager");
  }

  function whenL2WithoutEpochManagerInitialization() internal {
    _registerAndElectValidatorsForL2();

    epochManagerEnablerMockInterface.captureEpochAndValidators();

    whenL2();
  }
  function whenL2WithoutEpochCapture() internal {
    _registerAndElectValidatorsForL2();

    whenL2();
  }
}
