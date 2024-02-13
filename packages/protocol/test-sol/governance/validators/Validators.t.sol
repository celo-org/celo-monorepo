// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.5.13;
pragma experimental ABIEncoderV2;

import "celo-foundry/Test.sol";

import "openzeppelin-solidity/contracts/math/SafeMath.sol";
import "@celo-contracts/common/FixidityLib.sol";
import "@celo-contracts/common/Registry.sol";
import "@celo-contracts/common/Accounts.sol";

import "@celo-contracts/governance/Election.sol";
import "@celo-contracts/governance/LockedGold.sol";

import "@celo-contracts/stability/test/MockStableToken.sol";
import "@celo-contracts/governance/test/MockElection.sol";
import "@celo-contracts/governance/test/MockLockedGold.sol";

import "@celo-contracts/governance/test/ValidatorsMock.sol";
import "@test-sol/constants.sol";
import "@test-sol/utils/ECDSAHelper.sol";
import { Utils } from "@test-sol/utils.sol";
import { Test as ForgeTest } from "forge-std/Test.sol";

contract ValidatorsMockTunnel is ForgeTest {
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

contract ValidatorsTest is Test, Constants, Utils, ECDSAHelper {
  using FixidityLib for FixidityLib.Fraction;
  using SafeMath for uint256;

  Registry registry;
  Accounts accounts;
  MockStableToken stableToken;
  MockElection election;
  ValidatorsMockTunnel public validatorsMockTunnel;
  ValidatorsMock public validators;
  MockLockedGold lockedGold;

  address nonOwner;
  address owner;
  address nonValidator;
  address validator;
  uint256 validatorPk;
  address signer;
  uint256 signerPk;
  address group;
  bytes ecdsaPubKey;
  uint256 validatorRegistrationEpochNumber;

  bytes public constant blsPublicKey = abi.encodePacked(
    bytes32(0x0101010101010101010101010101010101010101010101010101010101010101),
    bytes32(0x0202020202020202020202020202020202020202020202020202020202020202),
    bytes32(0x0303030303030303030303030303030303030303030303030303030303030303)
  );
  bytes public constant blsPop = abi.encodePacked(
    bytes16(0x04040404040404040404040404040404),
    bytes16(0x05050505050505050505050505050505),
    bytes16(0x06060606060606060606060606060606)
  );

  FixidityLib.Fraction public commission = FixidityLib.newFixedFraction(1, 100);

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

  ValidatorLockedGoldRequirements public originalValidatorLockedGoldRequirements;
  GroupLockedGoldRequirements public originalGroupLockedGoldRequirements;
  ValidatorScoreParameters public originalValidatorScoreParameters;

  uint256 public slashingMultiplierResetPeriod = 30 * DAY;
  uint256 public membershipHistoryLength = 5;
  uint256 public maxGroupSize = 5;
  uint256 public commissionUpdateDelay = 3;
  uint256 public downtimeGracePeriod = 0;

  ValidatorsMockTunnel.InitParams public initParams;
  ValidatorsMockTunnel.InitParams2 public initParams2;

  event ValidatorRegistered(address indexed validator);
  event ValidatorEcdsaPublicKeyUpdated(address indexed validator, bytes ecdsaPublicKey);
  event ValidatorBlsPublicKeyUpdated(address indexed validator, bytes blsPublicKey);
  event ValidatorDeregistered(address indexed validator);

  function setUp() public {
    owner = address(this);
    nonOwner = actor("nonOwner");
    group = actor("group");
    nonValidator = actor("nonValidator");
    (validator, validatorPk) = actorWithPK("validator");
    (signer, signerPk) = actorWithPK("signer");

    originalValidatorLockedGoldRequirements = ValidatorLockedGoldRequirements({
      value: 1000,
      duration: 60 * DAY
    });

    originalGroupLockedGoldRequirements = GroupLockedGoldRequirements({
      value: 1000,
      duration: 100 * DAY
    });

    originalValidatorScoreParameters = ValidatorScoreParameters({
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

    registry.setAddressFor(AccountsContract, address(accounts));
    registry.setAddressFor(ElectionContract, address(election));
    registry.setAddressFor(LockedGoldContract, address(lockedGold));
    registry.setAddressFor(ValidatorsContract, address(validators));
    registry.setAddressFor(StableTokenContract, address(stableToken));

    accounts.createAccount(); // TODO: do this for 10 accounts?

    initParams = ValidatorsMockTunnel.InitParams({
      registryAddress: registryAddress,
      groupRequirementValue: originalGroupLockedGoldRequirements.value,
      groupRequirementDuration: originalGroupLockedGoldRequirements.duration,
      validatorRequirementValue: originalValidatorLockedGoldRequirements.value,
      validatorRequirementDuration: originalValidatorLockedGoldRequirements.duration,
      validatorScoreExponent: originalValidatorScoreParameters.exponent,
      validatorScoreAdjustmentSpeed: originalValidatorScoreParameters.adjustmentSpeed.unwrap()
    });
    initParams2 = ValidatorsMockTunnel.InitParams2({
      _membershipHistoryLength: membershipHistoryLength,
      _slashingMultiplierResetPeriod: slashingMultiplierResetPeriod,
      _maxGroupSize: maxGroupSize,
      _commissionUpdateDelay: commissionUpdateDelay,
      _downtimeGracePeriod: downtimeGracePeriod
    });

    validatorsMockTunnel.MockInitialize(owner, initParams, initParams2);

    vm.prank(validator);
    accounts.createAccount();
    vm.prank(group);
    accounts.createAccount();
    vm.prank(nonValidator);
    accounts.createAccount();
  }

  function getParsedSignatureOfAddress(address _address, uint256 privateKey)
    public
    pure
    returns (uint8, bytes32, bytes32)
  {
    bytes32 addressHash = keccak256(abi.encodePacked(_address));
    bytes32 prefixedHash = ECDSA.toEthSignedMessageHash(addressHash);
    return vm.sign(privateKey, prefixedHash);
  }

  function _generateEcdsaPubKeyWithSigner() internal {
    (uint8 v, bytes32 r, bytes32 s) = getParsedSignatureOfAddress(validator, signerPk);

    vm.prank(validator);
    accounts.authorizeValidatorSigner(signer, v, r, s);

    bytes32 addressHash = keccak256(abi.encodePacked(validator));

    ecdsaPubKey = addressToPublicKey(addressHash, v, r, s);
  }

  function _registerValidatorWithSignerHelper() internal {
    lockedGold.setAccountTotalLockedGold(validator, originalValidatorLockedGoldRequirements.value);

    _generateEcdsaPubKeyWithSigner();
    ph.setDebug(true);

    ph.mockSuccess(ph.PROOF_OF_POSSESSION(), abi.encodePacked(validator, blsPublicKey, blsPop));

    vm.prank(validator);
    validators.registerValidator(ecdsaPubKey, blsPublicKey, blsPop);
    validatorRegistrationEpochNumber = validators.getEpochNumber();
  }

  function _generateEcdsaPubKey() internal {
    (uint8 v, bytes32 r, bytes32 s) = getParsedSignatureOfAddress(validator, validatorPk);
    bytes32 addressHash = keccak256(abi.encodePacked(validator));

    ecdsaPubKey = addressToPublicKey(addressHash, v, r, s);
  }

  function _registerValidatorHelper() internal {
    lockedGold.setAccountTotalLockedGold(validator, originalValidatorLockedGoldRequirements.value);
    _generateEcdsaPubKey();
    ph.setDebug(true);

    ph.mockSuccess(ph.PROOF_OF_POSSESSION(), abi.encodePacked(validator, blsPublicKey, blsPop));

    vm.prank(validator);
    validators.registerValidator(ecdsaPubKey, blsPublicKey, blsPop);
    validatorRegistrationEpochNumber = validators.getEpochNumber();
  }

  function _registerValidatorGroupHelper(address _group, uint256 numMembers) internal {
    lockedGold.setAccountTotalLockedGold(
      _group,
      originalGroupLockedGoldRequirements.value.mul(numMembers)
    );

    vm.prank(_group);
    validators.registerValidatorGroup(commission.unwrap());

  }

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
    assertEq(
      value,
      originalGroupLockedGoldRequirements.value,
      "Wrong groupLockedGoldRequirements value."
    );
    assertEq(
      duration,
      originalGroupLockedGoldRequirements.duration,
      "Wrong groupLockedGoldRequirements duration."
    );
  }

  function test_shouldHaveSetValidatorLockedGoldRequirements() public {
    (uint256 value, uint256 duration) = validators.getValidatorLockedGoldRequirements();
    assertEq(
      value,
      originalValidatorLockedGoldRequirements.value,
      "Wrong validatorLockedGoldRequirements value."
    );
    assertEq(
      duration,
      originalValidatorLockedGoldRequirements.duration,
      "Wrong validatorLockedGoldRequirements duration."
    );
  }

  function test_shouldHaveSetValidatorScoreParameters() public {
    (uint256 exponent, uint256 adjustmentSpeed) = validators.getValidatorScoreParameters();
    assertEq(
      exponent,
      originalValidatorScoreParameters.exponent,
      "Wrong validatorScoreParameters exponent."
    );
    assertEq(
      adjustmentSpeed,
      originalValidatorScoreParameters.adjustmentSpeed.unwrap(),
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

contract ValidatorsTest_SetMaxGroupSize is ValidatorsTest {
  uint256 newSize = maxGroupSize + 1;
  event MaxGroupSizeSet(uint256 size);

  function test_ShouldSetMaxGroupSize() public {
    validators.setMaxGroupSize(newSize);
    assertEq(validators.getMaxGroupSize(), newSize, "MaxGroupSize not properly set");
  }

  function test_Emits_MaxGroupSizeSet() public {
    vm.expectEmit(true, true, true, true);
    emit MaxGroupSizeSet(newSize);
    validators.setMaxGroupSize(newSize);
  }

  function test_Revert_WhenCalledByNonOwner() public {
    vm.prank(nonOwner);
    vm.expectRevert("Ownable: caller is not the owner");
    validators.setMaxGroupSize(newSize);
  }

  function test_Reverts_WhenSizeIsSame() public {
    vm.expectRevert("Max group size not changed");
    validators.setMaxGroupSize(maxGroupSize);
  }
}

contract ValidatorsTest_SetGroupLockedGoldRequirements is ValidatorsTest {
  GroupLockedGoldRequirements private newRequirements = GroupLockedGoldRequirements({
    value: originalGroupLockedGoldRequirements.value + 1,
    duration: originalGroupLockedGoldRequirements.duration + 1
  });

  event GroupLockedGoldRequirementsSet(uint256 value, uint256 duration);

  function test_ShouldHaveSetGroupLockedGoldRequirements() public {
    validators.setGroupLockedGoldRequirements(newRequirements.value, newRequirements.duration);
    (uint256 _value, uint256 _duration) = validators.getGroupLockedGoldRequirements();
    assertEq(_value, newRequirements.value);
    assertEq(_duration, newRequirements.duration);
  }

  function test_Emits_GroupLockedGoldRequirementsSet() public {
    vm.expectEmit(true, true, true, true);
    emit GroupLockedGoldRequirementsSet(newRequirements.value, newRequirements.duration);
    validators.setGroupLockedGoldRequirements(newRequirements.value, newRequirements.duration);
  }

  function test_Reverts_WhenCalledByNonOwner() public {
    vm.prank(nonOwner);
    vm.expectRevert("Ownable: caller is not the owner");
    validators.setGroupLockedGoldRequirements(newRequirements.value, newRequirements.duration);
  }

  function test_Reverts_WhenRequirementsAreUnchanged() public {
    vm.expectRevert("Group requirements not changed");
    validators.setGroupLockedGoldRequirements(
      originalGroupLockedGoldRequirements.value,
      originalGroupLockedGoldRequirements.duration
    );
  }
}

contract ValidatorsTest_SetValidatorLockedGoldRequirements is ValidatorsTest {
  ValidatorLockedGoldRequirements private newRequirements = ValidatorLockedGoldRequirements({
    value: originalValidatorLockedGoldRequirements.value + 1,
    duration: originalValidatorLockedGoldRequirements.duration + 1
  });

  event ValidatorLockedGoldRequirementsSet(uint256 value, uint256 duration);

  function test_ShouldHaveSetValidatorLockedGoldRequirements() public {
    validators.setValidatorLockedGoldRequirements(newRequirements.value, newRequirements.duration);
    (uint256 _value, uint256 _duration) = validators.getValidatorLockedGoldRequirements();
    assertEq(_value, newRequirements.value);
    assertEq(_duration, newRequirements.duration);
  }

  function test_Emits_ValidatorLockedGoldRequirementsSet() public {
    vm.expectEmit(true, true, true, true);
    emit ValidatorLockedGoldRequirementsSet(newRequirements.value, newRequirements.duration);
    validators.setValidatorLockedGoldRequirements(newRequirements.value, newRequirements.duration);
  }

  function test_Reverts_WhenCalledByNonOwner() public {
    vm.prank(nonOwner);
    vm.expectRevert("Ownable: caller is not the owner");
    validators.setValidatorLockedGoldRequirements(newRequirements.value, newRequirements.duration);
  }

  function test_Reverts_WhenRequirementsAreUnchanged() public {
    vm.expectRevert("Validator requirements not changed");
    validators.setValidatorLockedGoldRequirements(
      originalValidatorLockedGoldRequirements.value,
      originalValidatorLockedGoldRequirements.duration
    );
  }
}

contract ValidatorsTest_SetValidatorScoreParameters is ValidatorsTest {
  ValidatorScoreParameters newParams = ValidatorScoreParameters({
    exponent: originalValidatorScoreParameters.exponent + 1,
    adjustmentSpeed: FixidityLib.newFixedFraction(6, 20)
  });

  event ValidatorScoreParametersSet(uint256 exponent, uint256 adjustmentSpeed);

  function test_ShouldsetExponentAndAdjustmentSpeed() public {
    validators.setValidatorScoreParameters(newParams.exponent, newParams.adjustmentSpeed.unwrap());
    (uint256 _exponent, uint256 _adjustmentSpeed) = validators.getValidatorScoreParameters();
    assertEq(_exponent, newParams.exponent, "Incorrect Exponent");
    assertEq(_adjustmentSpeed, newParams.adjustmentSpeed.unwrap(), "Incorrect AdjustmentSpeed");
  }

  function test_Emits_ValidatorScoreParametersSet() public {
    vm.expectEmit(true, true, true, true);
    emit ValidatorScoreParametersSet(newParams.exponent, newParams.adjustmentSpeed.unwrap());
    validators.setValidatorScoreParameters(newParams.exponent, newParams.adjustmentSpeed.unwrap());
  }

  function test_Reverts_whenCalledByNonOwner() public {
    vm.prank(nonOwner);
    vm.expectRevert("Ownable: caller is not the owner");
    validators.setValidatorScoreParameters(newParams.exponent, newParams.adjustmentSpeed.unwrap());
  }

  function test_Reverts_WhenLockupsAreUnchanged() public {
    vm.expectRevert("Adjustment speed and exponent not changed");
    validators.setValidatorScoreParameters(
      originalValidatorScoreParameters.exponent,
      originalValidatorScoreParameters.adjustmentSpeed.unwrap()
    );
  }
}

contract ValidatorsTest_RegisterValidator is ValidatorsTest {
  function setUp() public {
    super.setUp();

    lockedGold.setAccountTotalLockedGold(validator, originalValidatorLockedGoldRequirements.value);
  }

  function test_Reverts_WhenVoteOverMaxNumberOfGroupsSetToTrue() public {
    vm.prank(validator);
    election.setAllowedToVoteOverMaxNumberOfGroups(validator, true);

    (uint8 v, bytes32 r, bytes32 s) = getParsedSignatureOfAddress(validator, signerPk);

    vm.prank(validator);
    accounts.authorizeValidatorSigner(signer, v, r, s);
    bytes memory pubKey = addressToPublicKey("random msg", v, r, s);

    vm.expectRevert("Cannot vote for more than max number of groups");
    vm.prank(validator);
    validators.registerValidator(pubKey, blsPublicKey, blsPop);
  }

  function test_Reverts_WhenDelagatingCELO() public {
    lockedGold.setAccountTotalDelegatedAmountInPercents(validator, 10);
    (uint8 v, bytes32 r, bytes32 s) = getParsedSignatureOfAddress(validator, signerPk);
    vm.prank(validator);
    accounts.authorizeValidatorSigner(signer, v, r, s);
    bytes memory pubKey = addressToPublicKey("random msg", v, r, s);

    vm.expectRevert("Cannot delegate governance power");
    vm.prank(validator);
    validators.registerValidator(pubKey, blsPublicKey, blsPop);
  }

  function test_ShouldMarkAccountAsValidator_WhenAccountHasAuthorizedValidatorSigner() public {
    _registerValidatorWithSignerHelper();

    assertTrue(validators.isValidator(validator));
  }

  function test_ShouldAddAccountToValidatorList_WhenAccountHasAuthorizedValidatorSigner() public {
    address[] memory ExpectedRegisteredValidators = new address[](1);
    ExpectedRegisteredValidators[0] = validator;
    _registerValidatorWithSignerHelper();
    assertEq(validators.getRegisteredValidators().length, ExpectedRegisteredValidators.length);
    assertEq(validators.getRegisteredValidators()[0], ExpectedRegisteredValidators[0]);
  }

  function test_ShouldSetValidatorEcdsaPublicKey_WhenAccountHasAuthorizedValidatorSigner() public {
    _registerValidatorWithSignerHelper();
    (bytes memory actualEcdsaPubKey, , , , ) = validators.getValidator(validator);

    assertEq(actualEcdsaPubKey, ecdsaPubKey);
  }

  function test_ShouldSetValidatorBlsPublicKey_WhenAccountHasAuthorizedValidatorSigner() public {
    _registerValidatorWithSignerHelper();
    (, bytes memory actualBlsPubKey, , , ) = validators.getValidator(validator);

    assertEq(actualBlsPubKey, blsPublicKey);
  }

  function test_ShouldSetValidatorSigner_WhenAccountHasAuthorizedValidatorSigner() public {
    _registerValidatorWithSignerHelper();
    (, , , , address ActualSigner) = validators.getValidator(validator);

    assertEq(ActualSigner, signer);
  }

  function test_ShouldSetLockGoldRequirements_WhenAccountHasAuthorizedValidatorSigner() public {
    _registerValidatorWithSignerHelper();
    uint256 _lockedGoldReq = validators.getAccountLockedGoldRequirement(validator);

    assertEq(_lockedGoldReq, originalValidatorLockedGoldRequirements.value);
  }

  function test_ShouldSetValidatorMembershipHistory_WhenAccountHasAuthorizedValidatorSigner()
    public
  {
    _registerValidatorWithSignerHelper();
    (uint256[] memory _epoch, address[] memory _membershipGroups, , ) = validators
      .getMembershipHistory(validator);

    uint256[] memory validatorRegistrationEpochNumberList = new uint256[](1);
    validatorRegistrationEpochNumberList[0] = validatorRegistrationEpochNumber;
    address[] memory ExpectedMembershipGroups = new address[](1);
    ExpectedMembershipGroups[0] = address(0);

    assertEq(_epoch, validatorRegistrationEpochNumberList);
    assertEq(_membershipGroups, ExpectedMembershipGroups);
  }

  function test_Emits_ValidatorEcdsaPublicKeyUpdatedEvent() public {
    _generateEcdsaPubKeyWithSigner();

    ph.setDebug(true);
    ph.mockSuccess(ph.PROOF_OF_POSSESSION(), abi.encodePacked(validator, blsPublicKey, blsPop));

    vm.expectEmit(true, true, true, true);
    emit ValidatorEcdsaPublicKeyUpdated(validator, ecdsaPubKey);

    vm.prank(validator);
    validators.registerValidator(ecdsaPubKey, blsPublicKey, blsPop);
  }

  function test_Emits_ValidatorBlsPublicKeyUpdatedEvent() public {
    _generateEcdsaPubKeyWithSigner();

    ph.setDebug(true);
    ph.mockSuccess(ph.PROOF_OF_POSSESSION(), abi.encodePacked(validator, blsPublicKey, blsPop));

    vm.expectEmit(true, true, true, true);
    emit ValidatorBlsPublicKeyUpdated(validator, blsPublicKey);

    vm.prank(validator);
    validators.registerValidator(ecdsaPubKey, blsPublicKey, blsPop);
  }

  function test_Emits_ValidatorRegisteredEvent() public {
    _generateEcdsaPubKeyWithSigner();

    ph.setDebug(true);
    ph.mockSuccess(ph.PROOF_OF_POSSESSION(), abi.encodePacked(validator, blsPublicKey, blsPop));

    vm.expectEmit(true, true, true, true);
    emit ValidatorRegistered(validator);

    vm.prank(validator);
    validators.registerValidator(ecdsaPubKey, blsPublicKey, blsPop);
  }

  function test_Reverts_WhenAccountAlreadyRegisteredAsValidator() public {
    _registerValidatorWithSignerHelper();
    vm.expectRevert("Already registered");
    vm.prank(validator);
    validators.registerValidator(ecdsaPubKey, blsPublicKey, blsPop);
  }
  function test_Reverts_WhenAccountAlreadyRegisteredAsValidatorGroup() public {
    _registerValidatorGroupHelper(validator, 1);
    vm.expectRevert("Already registered");
    vm.prank(validator);
    validators.registerValidator(ecdsaPubKey, blsPublicKey, blsPop);
  }
  function test_Reverts_WhenAccountDoesNotMeetLockedGoldRequirements() public {
    lockedGold.setAccountTotalLockedGold(
      validator,
      originalValidatorLockedGoldRequirements.value.sub(11)
    );
    vm.expectRevert("Deposit too small");
    vm.prank(validator);
    validators.registerValidator(ecdsaPubKey, blsPublicKey, blsPop);
  }
}

contract ValidatorsTest_DeregisterValidator_WhenAccountHasNeverBeenMemberOfValidatorGroup is
  ValidatorsTest
{
  uint256 public constant INDEX = 0;
  function setUp() public {
    super.setUp();

    _registerValidatorHelper();

    timeTravel(originalValidatorLockedGoldRequirements.duration);
  }

  function _deregisterValidator(address _validator) internal {
    vm.prank(_validator);
    validators.deregisterValidator(INDEX);
  }

  function test_ShouldMarkAccountAsNotValidator_WhenAccountHasNeverBeenMemberOfValidatorGroup()
    public
  {
    assertTrue(validators.isValidator(validator));

    _deregisterValidator(validator);

    assertFalse(validators.isValidator(validator));
  }

  function test_ShouldRemoveAccountFromValidatorList_WhenAccountHasNeverBeenMemberOfValidatorGroup()
    public
  {
    address[] memory ExpectedRegisteredValidators = new address[](0);

    assertTrue(validators.isValidator(validator));
    _deregisterValidator(validator);
    assertEq(validators.getRegisteredValidators().length, ExpectedRegisteredValidators.length);
  }

  function test_ShouldResetAccountBalanceRequirements_WhenAccountHasNeverBeenMemberOfValidatorGroup()
    public
  {
    assertTrue(validators.isValidator(validator));
    _deregisterValidator(validator);
    assertEq(validators.getAccountLockedGoldRequirement(validator), 0);
  }

  function test_Emits_ValidatorDeregisteredEvent_WhenAccountHasNeverBeenMemberOfValidatorGroup()
    public
  {
    vm.expectEmit(true, true, true, true);
    emit ValidatorDeregistered(validator);
    _deregisterValidator(validator);
  }

}

contract ValidatorsTest_DeregisterValidator_WhenAccountHasBeenMemberOfValidatorGroup is
  ValidatorsTest
{
  uint256 public constant INDEX = 0;
  function setUp() public {
    super.setUp();
    _registerValidatorHelper();

    _registerValidatorGroupHelper(group, 1);
  }

  function _affiliateAndAddMember(address _validator, address _group) public {
    vm.prank(_validator);
    validators.affiliate(_group);

    vm.prank(_group);
    validators.addFirstMember(_validator, address(0), address(0));
  }

  function _deregisterValidator(address _validator) internal {
    vm.prank(_validator);
    validators.deregisterValidator(INDEX);
  }

  function test_ShouldMarkAccountAsNotValidator_WhenValidatorNoLongerMemberOfValidatorGroup()
    public
  {
    _affiliateAndAddMember(validator, group);
    vm.prank(group);
    validators.removeMember(validator);
    timeTravel(originalValidatorLockedGoldRequirements.duration.add(1));
    assertTrue(validators.isValidator(validator));
    _deregisterValidator(validator);
    assertFalse(validators.isValidator(validator));
  }

  function test_ShouldRemoveAccountFromValidatorList_WhenValidatorNoLongerMemberOfValidatorGroup()
    public
  {
    address[] memory ExpectedRegisteredValidators = new address[](0);

    _affiliateAndAddMember(validator, group);
    vm.prank(group);
    validators.removeMember(validator);
    timeTravel(originalValidatorLockedGoldRequirements.duration.add(1));

    assertTrue(validators.isValidator(validator));
    _deregisterValidator(validator);
    assertEq(validators.getRegisteredValidators().length, ExpectedRegisteredValidators.length);
  }

  function test_ShouldResetAccountBalanceRequirements_WhenValidatorNoLongerMemberOfValidatorGroup()
    public
  {
    _affiliateAndAddMember(validator, group);

    vm.prank(group);
    validators.removeMember(validator);
    timeTravel(originalValidatorLockedGoldRequirements.duration.add(1));

    _deregisterValidator(validator);
    assertEq(validators.getAccountLockedGoldRequirement(validator), 0);
  }

  function test_Emits_ValidatorDeregisteredEvent_WhenValidatorNoLongerMemberOfValidatorGroup()
    public
  {
    _affiliateAndAddMember(validator, group);
    vm.prank(group);
    validators.removeMember(validator);
    timeTravel(originalValidatorLockedGoldRequirements.duration.add(1));
    vm.expectEmit(true, true, true, true);
    emit ValidatorDeregistered(validator);
    _deregisterValidator(validator);
  }

  function test_Reverts_WhenItHasBeenLessThanValidatorLockedGoldRequirementsDurationSinceValidatorWasRemovedromGroup()
    public
  {
    _affiliateAndAddMember(validator, group);

    vm.prank(group);
    validators.removeMember(validator);
    timeTravel(originalValidatorLockedGoldRequirements.duration.sub(1));

    vm.expectRevert("Not yet requirement end time");
    _deregisterValidator(validator);
  }

  function test_Rverts_WhenValidatorStillMemberOfValidatorGroup() public {
    _affiliateAndAddMember(validator, group);
    vm.expectRevert("Has been group member recently");
    _deregisterValidator(validator);
  }

  function test_Reverts_WhenAccountNotRegisteredValidator() public {
    vm.expectRevert("Not a validator");
    vm.prank(nonValidator);
    validators.deregisterValidator(INDEX);
  }

  function test_Reverts_WhenWrongIndexProvided() public {
    timeTravel(originalValidatorLockedGoldRequirements.duration);
    vm.expectRevert("deleteElement: index out of range");
    vm.prank(validator);
    validators.deregisterValidator(INDEX + 1);

  }
}
