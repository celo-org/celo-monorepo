// SPDX-License-Identifier: UNLICENSED
pragma solidity >=0.8.7 <0.8.20;

import "celo-foundry-8/Test.sol";
import { TestConstants } from "@test-sol/constants.sol";

import "@celo-contracts/common/interfaces/IRegistry.sol";
import "@celo-contracts/common/interfaces/IScoreManager.sol";
import "@celo-contracts-8/common/ScoreManager.sol";

contract ScoreManagerTest is Test, TestConstants {
  IRegistry registry;
  IScoreManager public scoreManager;
  address owner;
  address nonOwner;

  function setUp() public virtual {
    owner = address(this);
    nonOwner = actor("nonOwner");

    deployCodeTo("Registry.sol", abi.encode(false), REGISTRY_ADDRESS);

    ScoreManager scoreManagerImpl = new ScoreManager(true);
    scoreManager = IScoreManager(address(scoreManagerImpl));

    registry = IRegistry(REGISTRY_ADDRESS);

    registry.setAddressFor("ScoreManager", address(scoreManager));

    scoreManagerImpl.initialize();
  }

  function _whenL2() public {
    deployCodeTo("Registry.sol", abi.encode(false), PROXY_ADMIN_ADDRESS);
  }
}

contract ScoreManagerTest_setGroupScore is ScoreManagerTest {
  function test_setGroupScore() public {
    scoreManager.setGroupScore(owner, 42);
    assert(scoreManager.getGroupScore(owner) == 42);
  }

  function test_Returns1FixidityWhenGroupScoreDoesNotExist() public {
    assert(scoreManager.getGroupScore(owner) == 1e24);
  }
}

contract ScoreManagerTest_setValidatorScore is ScoreManagerTest {
  function test_setValidatorScore() public {
    scoreManager.setValidatorScore(owner, 42);
    assert(scoreManager.getValidatorScore(owner) == 42);
  }

  function test_Returns1FixidityWhenValidatorScoreDoesNotExist() public {
    assert(scoreManager.getValidatorScore(owner) == 1e24);
  }
}
