// SPDX-License-Identifier: UNLICENSED
pragma solidity >=0.8.7 <0.8.20;

import "celo-foundry-8/Test.sol";
import { TestConstants } from "@test-sol/constants.sol";

import "@celo-contracts/common/interfaces/IRegistry.sol";
import "@celo-contracts/common/interfaces/IScoreManagerGovernance.sol";
import "@celo-contracts/common/interfaces/IScoreManager.sol";
import { ScoreManager } from "@celo-contracts-8/common/ScoreManager.sol";

// merging interfaces here because in 0.5 it can't be done
// TODO remove this from here after moving everything to 0.8
interface IScoreManagerTemp is IScoreManagerGovernance, IScoreManager {}

contract ScoreManagerTest is Test, TestConstants {
  IRegistry registry;
  IScoreManagerTemp public scoreManager;
  address owner;
  address nonOwner;
  address scoreManagerSetter;

  event GroupScoreSet(address indexed group, uint256 score);
  event ValidatorScoreSet(address indexed validator, uint256 score);

  function setUp() public virtual {
    owner = address(this);
    nonOwner = actor("nonOwner");
    scoreManagerSetter = actor("scoreManager");

    deployCodeTo("Registry.sol", abi.encode(false), REGISTRY_ADDRESS);

    ScoreManager scoreManagerImpl = new ScoreManager(true);
    scoreManager = IScoreManagerTemp(address(scoreManagerImpl));

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
    assertEq(scoreManager.getGroupScore(owner), 42);
  }

  function test_Reverts_WhenNotCalledByOwner() public {
    vm.prank(nonOwner);
    vm.expectRevert("Sender not authorized to update score");
    scoreManager.setGroupScore(owner, 42);
  }

  function test_Reverts_WhenSetToMoreThan1e24() public {
    vm.expectRevert("Score must be less than or equal to 1e24.");
    scoreManager.setGroupScore(owner, 1e24 + 1);
  }

  function test_Returns1FixidityWhenGroupScoreDoesNotExist() public {
    assertEq(scoreManager.getGroupScore(owner), 1e24);
  }

  function test_EmitsGroupScoreSet() public {
    vm.expectEmit(false, false, false, true);
    emit GroupScoreSet(owner, 42);
    scoreManager.setGroupScore(owner, 42);
  }

  function test_WhenCalledByScoreManager() public {
    scoreManager.setScoreManagerSetter(scoreManagerSetter);

    vm.prank(scoreManagerSetter);
    scoreManager.setGroupScore(owner, 42);
    assertEq(scoreManager.getGroupScore(owner), 42);
  }
}

contract ScoreManagerTest_setValidatorScore is ScoreManagerTest {
  function test_setValidatorScore() public {
    scoreManager.setValidatorScore(owner, 42);
    assertEq(scoreManager.getValidatorScore(owner), 42);
  }

  function test_Reverts_WhenNotCalledByOwner() public {
    vm.prank(nonOwner);
    vm.expectRevert("Sender not authorized to update score");
    scoreManager.setValidatorScore(owner, 42);
  }

  function test_Reverts_WhenSetToMoreThan1e24() public {
    vm.expectRevert("Score must be less than or equal to 1e24.");
    scoreManager.setValidatorScore(owner, 1e24 + 1);
  }

  function test_EmitsValidatorScoreSet() public {
    vm.expectEmit(false, false, false, true);
    emit ValidatorScoreSet(owner, 42);
    scoreManager.setValidatorScore(owner, 42);
  }

  function test_Returns1FixidityWhenValidatorScoreDoesNotExist() public {
    assertEq(scoreManager.getValidatorScore(owner), 1e24);
  }

  function test_setScoreManager_WhenCalledByScoreManager() public {
    scoreManager.setScoreManagerSetter(scoreManagerSetter);

    vm.prank(scoreManagerSetter);
    scoreManager.setValidatorScore(owner, 42);
    assertEq(scoreManager.getValidatorScore(owner), 42);
  }
}

contract ScoreManagerTest_setScoreManagerSetter is ScoreManagerTest {
  function test_onlyOwnwerCanSetScoreManager() public {
    vm.prank(nonOwner);
    vm.expectRevert("Ownable: caller is not the owner");
    scoreManager.setScoreManagerSetter(owner);
  }

  function test_setScoreManager() public {
    scoreManager.setScoreManagerSetter(nonOwner);
    assertEq(scoreManager.getScoreManagerSetter(), nonOwner, "Score Manager not set");
  }
}
