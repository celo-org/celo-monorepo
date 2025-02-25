// SPDX-License-Identifier: UNLICENSED
pragma solidity >=0.8.7 <0.8.20;

import { TestWithUtils08 } from "@test-sol/TestWithUtils08.sol";
import { WhenL2, WhenL2NoInitialization } from "@test-sol/utils/WhenL2-08.sol";

import "@celo-contracts/common/interfaces/IRegistry.sol";
import "@celo-contracts/common/interfaces/IScoreManagerGovernance.sol";
import "@celo-contracts/common/interfaces/IScoreManager.sol";
import { ScoreManager } from "@celo-contracts-8/common/ScoreManager.sol";
import { MockCeloUnreleasedTreasury } from "@celo-contracts-8/common/test/MockCeloUnreleasedTreasury.sol";
import "@celo-contracts-8/common/test/MockCeloToken.sol";

// merging interfaces here because in 0.5 it can't be done
// TODO remove this from here after moving everything to 0.8
interface IScoreManagerTemp is IScoreManagerGovernance, IScoreManager {}

contract ScoreManagerTest is TestWithUtils08 {
  IScoreManagerTemp public scoreManager;

  address owner;
  address nonOwner;
  address scoreManagerSetter;

  event GroupScoreSet(address indexed group, uint256 score);
  event ValidatorScoreSet(address indexed validator, uint256 score);
  event ScoreManagerSetterSet(address indexed scoreManagerSetter);

  uint256 constant ZERO_SCORE = 1e24 + 1;

  function setUp() public virtual override {
    super.setUp();

    owner = address(this);
    nonOwner = actor("nonOwner");
    scoreManagerSetter = actor("scoreManager");

    ScoreManager scoreManagerImpl = new ScoreManager(true);
    scoreManager = IScoreManagerTemp(address(scoreManagerImpl));

    registry.setAddressFor("ScoreManager", address(scoreManager));

    scoreManagerImpl.initialize();
  }
}

contract ScoreManagerTest_L2 is ScoreManagerTest, WhenL2 {
  function setUp() public virtual override(ScoreManagerTest, WhenL2) {
    super.setUp();
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

  function test_Reverts_WhenSetToMoreThan1e24Plus1() public {
    vm.expectRevert("Score must be less than or equal to 1e24.");
    scoreManager.setGroupScore(owner, 1e24 + 1);
  }

  function test_Returns1FixidityWhenGroupScoreDoesNotExist() public {
    assertEq(scoreManager.getGroupScore(owner), 1e24);
  }

  function test_Returns0WhenGroupScoreIsZERO_SCORE() public {
    scoreManager.setGroupScore(owner, 0);
    assert(scoreManager.getGroupScore(owner) == 0);
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
contract ScoreManagerTest_setGroupScore_L2 is ScoreManagerTest_L2, ScoreManagerTest_setGroupScore {
  function setUp() public override(ScoreManagerTest, ScoreManagerTest_L2) {
    super.setUp();
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

  function test_Returns0WhenValidatorScoreIsZero() public {
    scoreManager.setValidatorScore(owner, 0);
    assert(scoreManager.getValidatorScore(owner) == 0);
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
contract ScoreManagerTest_setValidatorScore_L2 is
  ScoreManagerTest_L2,
  ScoreManagerTest_setValidatorScore
{
  function setUp() public override(ScoreManagerTest, ScoreManagerTest_L2) {
    super.setUp();
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

  function test_emits_ScoreManagerSetterSet() public {
    vm.expectEmit(false, false, false, true);
    emit ScoreManagerSetterSet(nonOwner);
    scoreManager.setScoreManagerSetter(nonOwner);
  }
}
contract ScoreManagerTest_setScoreManagerSetter_L2 is
  ScoreManagerTest_L2,
  ScoreManagerTest_setScoreManagerSetter
{
  function setUp() public override(ScoreManagerTest, ScoreManagerTest_L2) {
    super.setUp();
  }
}
