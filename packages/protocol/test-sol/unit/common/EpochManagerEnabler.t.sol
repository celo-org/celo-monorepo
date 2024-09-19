// SPDX-License-Identifier: UNLICENSED
pragma solidity >=0.8.7 <0.8.20;

import "celo-foundry-8/Test.sol";

import "@celo-contracts-8/common/EpochManagerEnabler.sol";

import "@celo-contracts/stability/test/MockSortedOracles.sol";

import "@celo-contracts/common/interfaces/IRegistry.sol";

import { EPOCH_SIZEPRE_COMPILE_ADDRESS, EpochSizePrecompile } from "@test-sol/precompiles/EpochSizePrecompile.sol";

contract EpochManagerEnablerMock is EpochManagerEnabler {
  constructor(bool test) public EpochManagerEnabler(test) {}

  function setFirstBlockOfEpoch() external {
    return _setFirstBlockOfEpoch();
  }
}

contract EpochManagerEnablerTest is Test {
  EpochManagerEnablerMock epochManagerEnabler;
  uint256 EPOCH_SIZE_NEW = 17280;

  function setUp() public virtual {
    deployCodeTo("EpochSizePrecompile", EPOCH_SIZEPRE_COMPILE_ADDRESS);
    address payable payableAddress = payable(EPOCH_SIZEPRE_COMPILE_ADDRESS);

    EpochSizePrecompile(payableAddress).setEpochSize(EPOCH_SIZE_NEW);

    epochManagerEnabler = new EpochManagerEnablerMock(true);
  }

  function test_precompilerWorks() public {
    // Make sure epoch size is correct
    assertEq(epochManagerEnabler.getEpochSize(), EPOCH_SIZE_NEW);
  }
}

contract EpochManagerEnablerTest_getFirstBlockOfEpoch is EpochManagerEnablerTest {
  function test_blockIsEpockBlock() public {
    vm.roll(27803520);
    epochManagerEnabler.setFirstBlockOfEpoch();
    assertEq(epochManagerEnabler.lastKnownFirstBlockOfEpoch(), 27803520);
  }

  function test_blockIsNotEpochBlock() public {
    vm.roll(27817229);
    epochManagerEnabler.setFirstBlockOfEpoch();
    assertEq(epochManagerEnabler.lastKnownFirstBlockOfEpoch(), 27803520);
  }
}
