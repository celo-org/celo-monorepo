// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.5.13;
pragma experimental ABIEncoderV2;

import "celo-foundry/Test.sol";

import "forge-std/console.sol";

import "@celo-contracts/common/FixidityLib.sol";
import "@celo-contracts/common/Registry.sol";
import "@celo-contracts/common/Accounts.sol";

import "@celo-contracts/governance/Election.sol";
import "@celo-contracts/governance/LockedGold.sol";

import "@celo-contracts/stability/test/MockStableToken.sol";
import "@celo-contracts/governance/test/MockElection.sol";
import "@celo-contracts/governance/test/MockLockedGold.sol";

import "@celo-contracts/governance/test/ValidatorsMock.sol";

contract ValidatorsMockTunnel is Test {
  ValidatorsMock private tunnelValidators;
  address validatorContractAddress;

  constructor(address _validatorContractAddress) public {
    validatorContractAddress = _validatorContractAddress;
    tunnelValidators = ValidatorsMock(validatorContractAddress);
  }

  struct InitParams {
    address registryAddress;
    uint256 groupRequirementValue;
    uint256 groupRequirementDuration;
    uint256 validatorRequirementValue;
    uint256 validatorRequirementDuration;
    uint256 validatorScoreExponent;
    uint256 validatorScoreAdjustmentSpeed;
  }
  struct InitParams2 {
    uint256 _membershipHistoryLength;
    uint256 _slashingMultiplierResetPeriod;
    uint256 _maxGroupSize;
    uint256 _commissionUpdateDelay;
    uint256 _downtimeGracePeriod;
  }

  function MockInitialize(address sender, InitParams calldata params, InitParams2 calldata params2)
    external
    returns (bool, bytes memory)
  {
    bytes memory data = abi.encodeWithSignature(
      "initialize(address,uint256,uint256,uint256,uint256,uint256,uint256,uint256,uint256,uint256,uint256,uint256)",
      params.registryAddress,
      params.groupRequirementValue,
      params.groupRequirementDuration,
      params.validatorRequirementValue,
      params.validatorRequirementDuration,
      params.validatorScoreExponent,
      params.validatorScoreAdjustmentSpeed,
      params2._membershipHistoryLength,
      params2._slashingMultiplierResetPeriod,
      params2._maxGroupSize,
      params2._commissionUpdateDelay,
      params2._downtimeGracePeriod
    );
    vm.prank(sender);
    (bool success, bytes memory result) = address(tunnelValidators).call(data);
    require(success, "unsuccessful tunnel call");
  }
}

contract ValidatorsTest is Test {
  using FixidityLib for FixidityLib.Fraction;

  Registry registry;
  Accounts accounts;
  MockStableToken stableToken;
  MockElection election;
  ValidatorsMockTunnel public validatorsMockTunnel;
  ValidatorsMock public validators;
  MockLockedGold lockedGold;

  uint256 HOUR = 60 * 60;
  uint256 DAY = 24 * HOUR;

  address nonOwner;
  address owner;

  bytes public constant blsPublicKey = "0x4fa3f67fc913878b068d1fa1cdddc54913d3bf988dbe5a36a20fa888f20d4894c408a6773f3d7bde11154f2a3076b700d345a42fd25a0e5e83f4db5586ac7979ac2053cd95d8f2efd3e959571ceccaa743e02cf4be3f5d7aaddb0b06fc9aff00";
  bytes public constant blsPop = "0xcdb77255037eb68897cd487fdd85388cbda448f617f874449d4b11588b0b7ad8ddc20d9bb450b513bb35664ea3923900";

  event AccountSlashed(
    address indexed slashed,
    uint256 penalty,
    address indexed reporter,
    uint256 reward
  );
  struct ValidatorLockedGoldRequirements {
    uint256 value;
    uint256 duration;
  }
  struct GroupLockedGoldRequirements {
    uint256 value;
    uint256 duration;
  }
  struct ValidatorScoreParameters {
    uint256 exponent;
    FixidityLib.Fraction adjustmentSpeed;
  }

  ValidatorLockedGoldRequirements public validatorLockedGoldRequirements;
  GroupLockedGoldRequirements public groupLockedGoldRequirements;
  ValidatorScoreParameters public validatorScoreParameters;

  uint256 public slashingMultiplierResetPeriod = 30 * DAY;
  uint256 public membershipHistoryLength = 5;
  uint256 public maxGroupSize = 5;
  uint256 public commissionUpdateDelay = 3;
  uint256 public downtimeGracePeriod = 0;

  ValidatorsMockTunnel.InitParams public initParams;
  ValidatorsMockTunnel.InitParams2 public initParams2;

  function setUp() public {
    owner = address(this);
    nonOwner = actor("nonOwner");

    validatorLockedGoldRequirements = ValidatorLockedGoldRequirements({
      value: 1000,
      duration: 60 * DAY
    });

    groupLockedGoldRequirements = GroupLockedGoldRequirements({ value: 1000, duration: 100 * DAY });

    validatorScoreParameters = ValidatorScoreParameters({
      exponent: 5,
      adjustmentSpeed: FixidityLib.newFixedFraction(5, 20)
    });

    address registryAddress = 0x000000000000000000000000000000000000ce10;
    deployCodeTo("Registry.sol", abi.encode(false), registryAddress);
    registry = Registry(registryAddress);

    accounts = new Accounts(true);
    accounts.initialize(registryAddress);

    lockedGold = new MockLockedGold();
    election = new MockElection();
    validators = new ValidatorsMock();
    validatorsMockTunnel = new ValidatorsMockTunnel(address(validators));

    stableToken = new MockStableToken();

    registry.setAddressFor("Accounts", address(accounts));
    registry.setAddressFor("Election", address(election));
    registry.setAddressFor("LockedGold", address(lockedGold));
    registry.setAddressFor("Validators", address(validators));
    registry.setAddressFor("StableToken", address(stableToken));

    accounts.createAccount(); // do this for 10 accounts?

    initParams = ValidatorsMockTunnel.InitParams({
      registryAddress: registryAddress,
      groupRequirementValue: groupLockedGoldRequirements.value,
      groupRequirementDuration: groupLockedGoldRequirements.duration,
      validatorRequirementValue: validatorLockedGoldRequirements.value,
      validatorRequirementDuration: validatorLockedGoldRequirements.duration,
      validatorScoreExponent: validatorScoreParameters.exponent,
      validatorScoreAdjustmentSpeed: validatorScoreParameters.adjustmentSpeed.unwrap()
    });
    initParams2 = ValidatorsMockTunnel.InitParams2({
      _membershipHistoryLength: membershipHistoryLength,
      _slashingMultiplierResetPeriod: slashingMultiplierResetPeriod,
      _maxGroupSize: maxGroupSize,
      _commissionUpdateDelay: commissionUpdateDelay,
      _downtimeGracePeriod: downtimeGracePeriod
    });

    validatorsMockTunnel.MockInitialize(owner, initParams, initParams2);
  }

  // function registerValidator(address validator) public {
  //   lockedGold.setAccountTotalLockedGold(validator, validatorLockedGoldRequirements.value);
  //   bytes memory ecdsaPublicKey = validators.registerValidator(
  //     ecdsaPublicKey,
  //     blsPublicKey,
  //     blsPop
  //   );
  // }

}

contract ValidatorsTest_Initialize is ValidatorsTest {
  function test_ShouldhaveSetTheOwner() public {
    assertEq(validators.owner(), owner, "Incorrect Owner.");
  }

  function test_Reverts_WhenCalledMoreThanOnce() public {
    vm.expectRevert();
    validatorsMockTunnel.MockInitialize(owner, initParams, initParams2);
  }

  function test_shouldHaveSetGroupLockedGoldRequirements() public {
    (uint256 value, uint256 duration) = validators.getGroupLockedGoldRequirements();
    assertEq(value, groupLockedGoldRequirements.value, "Wrong groupLockedGoldRequirements value.");
    assertEq(
      duration,
      groupLockedGoldRequirements.duration,
      "Wrong groupLockedGoldRequirements duration."
    );
  }

  function test_shouldHaveSetValidatorLockedGoldRequirements() public {
    (uint256 value, uint256 duration) = validators.getValidatorLockedGoldRequirements();
    assertEq(
      value,
      validatorLockedGoldRequirements.value,
      "Wrong validatorLockedGoldRequirements value."
    );
    assertEq(
      duration,
      validatorLockedGoldRequirements.duration,
      "Wrong validatorLockedGoldRequirements duration."
    );
  }

  function test_shouldHaveSetValidatorScoreParameters() public {
    (uint256 exponent, uint256 adjustmentSpeed) = validators.getValidatorScoreParameters();
    assertEq(
      exponent,
      validatorScoreParameters.exponent,
      "Wrong validatorScoreParameters exponent."
    );
    assertEq(
      adjustmentSpeed,
      validatorScoreParameters.adjustmentSpeed.unwrap(),
      "Wrong validatorScoreParameters adjustmentSpeed."
    );
  }

  function test_shouldHaveSetMembershipHistory() public {
    uint256 actual = validators.membershipHistoryLength();
    assertEq(actual, membershipHistoryLength, "Wrong membershipHistoryLength.");
  }

  function test_shouldHaveSetMaxGroupSize() public {
    uint256 actual = validators.maxGroupSize();
    assertEq(actual, maxGroupSize, "Wrong maxGroupSize.");
  }

  function test_shouldHaveSetCommissionUpdateDelay() public {
    uint256 actual = validators.getCommissionUpdateDelay();
    assertEq(actual, commissionUpdateDelay, "Wrong commissionUpdateDelay.");
  }

  function test_shouldHaveSetDowntimeGracePeriod() public {
    uint256 actual = validators.downtimeGracePeriod();
    assertEq(actual, downtimeGracePeriod, "Wrong downtimeGracePeriod.");
  }
}

contract ValidatorsTest_SetMembershipHistoryLength is ValidatorsTest {
  uint256 newLength = membershipHistoryLength + 1;
  event MembershipHistoryLengthSet(uint256 length);

  function test_Reverts_WhenLengthIsSame() public {
    vm.expectRevert("Membership history length not changed");
    validators.setMembershipHistoryLength(membershipHistoryLength);
  }

  function test_shouldSetTheMembershipHistoryLength() public {
    validators.setMembershipHistoryLength(newLength);
    assertEq(validators.membershipHistoryLength(), newLength);
  }

  function test_Emits_MembershipHistoryLengthSet() public {
    vm.expectEmit(true, true, true, true);
    emit MembershipHistoryLengthSet(newLength);
    validators.setMembershipHistoryLength(newLength);
  }

  function test_Reverts_WhenCalledByNonOwner() public {
    vm.prank(nonOwner);
    vm.expectRevert("Ownable: caller is not the owner");
    validators.setMembershipHistoryLength(newLength);
  }
}
