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
import "@test-sol/unit/governance/validators/mocks/ValidatorsMockTunnel.sol";

import "@celo-contracts/governance/test/ValidatorsMock.sol";
import "@test-sol/constants.sol";
import "@test-sol/utils/ECDSAHelper.sol";
import { Utils } from "@test-sol/utils.sol";
import { Test as ForgeTest } from "forge-std/Test.sol";

contract ValidatorsTest is Test, Constants, Utils, ECDSAHelper {
  using FixidityLib for FixidityLib.Fraction;
  using SafeMath for uint256;

  address constant proxyAdminAddress = 0x4200000000000000000000000000000000000018;

  Registry registry;
  Accounts accounts;
  MockStableToken stableToken;
  MockElection election;
  ValidatorsMockTunnel public validatorsMockTunnel;
  ValidatorsMock public validators;
  MockLockedGold lockedGold;

  address owner;
  address nonValidator;
  address validator;
  uint256 validatorPk;
  address signer;
  uint256 signerPk;
  address nonOwner;
  address paymentDelegatee;

  address otherValidator;
  uint256 otherValidatorPk;
  address group;
  uint256 validatorRegistrationEpochNumber;

  uint256 groupLength = 8;

  bytes public constant blsPublicKey =
    abi.encodePacked(
      bytes32(0x0101010101010101010101010101010101010101010101010101010101010101),
      bytes32(0x0202020202020202020202020202020202020202020202020202020202020202),
      bytes32(0x0303030303030303030303030303030303030303030303030303030303030303)
    );
  bytes public constant blsPop =
    abi.encodePacked(
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

  event MaxGroupSizeSet(uint256 size);
  event CommissionUpdateDelaySet(uint256 delay);
  event ValidatorScoreParametersSet(uint256 exponent, uint256 adjustmentSpeed);
  event GroupLockedGoldRequirementsSet(uint256 value, uint256 duration);
  event ValidatorLockedGoldRequirementsSet(uint256 value, uint256 duration);
  event MembershipHistoryLengthSet(uint256 length);
  event ValidatorRegistered(address indexed validator);
  event ValidatorDeregistered(address indexed validator);
  event ValidatorAffiliated(address indexed validator, address indexed group);
  event ValidatorDeaffiliated(address indexed validator, address indexed group);
  event ValidatorEcdsaPublicKeyUpdated(address indexed validator, bytes ecdsaPublicKey);
  event ValidatorBlsPublicKeyUpdated(address indexed validator, bytes blsPublicKey);
  event ValidatorScoreUpdated(address indexed validator, uint256 score, uint256 epochScore);
  event ValidatorGroupRegistered(address indexed group, uint256 commission);
  event ValidatorGroupDeregistered(address indexed group);
  event ValidatorGroupMemberAdded(address indexed group, address indexed validator);
  event ValidatorGroupMemberRemoved(address indexed group, address indexed validator);
  event ValidatorGroupMemberReordered(address indexed group, address indexed validator);
  event ValidatorGroupCommissionUpdateQueued(
    address indexed group,
    uint256 commission,
    uint256 activationBlock
  );
  event ValidatorGroupCommissionUpdated(address indexed group, uint256 commission);
  event ValidatorEpochPaymentDistributed(
    address indexed validator,
    uint256 validatorPayment,
    address indexed group,
    uint256 groupPayment
  );

  function setUp() public {
    owner = address(this);
    group = actor("group");
    nonValidator = actor("nonValidator");
    nonOwner = actor("nonOwner");
    paymentDelegatee = actor("paymentDelegatee");

    (validator, validatorPk) = actorWithPK("validator");
    (signer, signerPk) = actorWithPK("signer");
    (otherValidator, otherValidatorPk) = actorWithPK("otherValidator");

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

    vm.prank(otherValidator);
    accounts.createAccount();

    vm.prank(group);
    accounts.createAccount();

    vm.prank(nonValidator);
    accounts.createAccount();
  }

  function getParsedSignatureOfAddress(
    address _address,
    uint256 privateKey
  ) public pure returns (uint8, bytes32, bytes32) {
    bytes32 addressHash = keccak256(abi.encodePacked(_address));
    bytes32 prefixedHash = ECDSA.toEthSignedMessageHash(addressHash);
    return vm.sign(privateKey, prefixedHash);
  }

  function _generateEcdsaPubKeyWithSigner(
    address _validator,
    uint256 _signerPk
  ) internal returns (bytes memory ecdsaPubKey, uint8 v, bytes32 r, bytes32 s) {
    (v, r, s) = getParsedSignatureOfAddress(_validator, _signerPk);

    bytes32 addressHash = keccak256(abi.encodePacked(_validator));

    ecdsaPubKey = addressToPublicKey(addressHash, v, r, s);
  }

  function _registerValidatorWithSignerHelper() internal returns (bytes memory) {
    lockedGold.setAccountTotalLockedGold(validator, originalValidatorLockedGoldRequirements.value);

    (bytes memory _ecdsaPubKey, uint8 v, bytes32 r, bytes32 s) = _generateEcdsaPubKeyWithSigner(
      validator,
      signerPk
    );

    ph.mockSuccess(ph.PROOF_OF_POSSESSION(), abi.encodePacked(validator, blsPublicKey, blsPop));

    vm.prank(validator);
    accounts.authorizeValidatorSigner(signer, v, r, s);

    vm.prank(validator);
    validators.registerValidator(_ecdsaPubKey, blsPublicKey, blsPop);
    validatorRegistrationEpochNumber = validators.getEpochNumber();
    return _ecdsaPubKey;
  }

  function _generateEcdsaPubKey(
    address _account,
    uint256 _accountPk
  ) internal returns (bytes memory ecdsaPubKey) {
    (uint8 v, bytes32 r, bytes32 s) = getParsedSignatureOfAddress(_account, _accountPk);
    bytes32 addressHash = keccak256(abi.encodePacked(_account));

    ecdsaPubKey = addressToPublicKey(addressHash, v, r, s);
  }

  function _registerValidatorHelper(
    address _validator,
    uint256 _validatorPk
  ) internal returns (bytes memory) {
    if (!accounts.isAccount(_validator)) {
      vm.prank(_validator);
      accounts.createAccount();
    }

    lockedGold.setAccountTotalLockedGold(_validator, originalValidatorLockedGoldRequirements.value);
    bytes memory _ecdsaPubKey = _generateEcdsaPubKey(_validator, _validatorPk);

    ph.mockSuccess(ph.PROOF_OF_POSSESSION(), abi.encodePacked(_validator, blsPublicKey, blsPop));

    vm.prank(_validator);
    validators.registerValidator(_ecdsaPubKey, blsPublicKey, blsPop);
    validatorRegistrationEpochNumber = validators.getEpochNumber();
    return _ecdsaPubKey;
  }

  function _registerValidatorGroupHelper(address _group, uint256 numMembers) internal {
    if (!accounts.isAccount(_group)) {
      vm.prank(_group);
      accounts.createAccount();
    }

    lockedGold.setAccountTotalLockedGold(
      _group,
      originalGroupLockedGoldRequirements.value.mul(numMembers)
    );

    vm.prank(_group);
    validators.registerValidatorGroup(commission.unwrap());
  }

  function _registerValidatorGroupWithMembers(address _group, uint256 _numMembers) public {
    _registerValidatorGroupHelper(_group, _numMembers);

    for (uint256 i = 0; i < _numMembers; i++) {
      if (i == 0) {
        _registerValidatorHelper(validator, validatorPk);

        vm.prank(validator);
        validators.affiliate(group);

        vm.prank(group);
        validators.addFirstMember(validator, address(0), address(0));
      } else {
        uint256 _validator1Pk = i;
        address _validator1 = vm.addr(_validator1Pk);

        vm.prank(_validator1);
        accounts.createAccount();
        _registerValidatorHelper(_validator1, _validator1Pk);
        vm.prank(_validator1);
        validators.affiliate(group);

        vm.prank(group);
        validators.addMember(_validator1);
      }
    }
  }

  function _removeMemberAndTimeTravel(
    address _group,
    address _validator,
    uint256 _duration
  ) internal {
    vm.prank(_group);
    validators.removeMember(_validator);
    timeTravel(_duration);
  }

  function _max1(uint256 num) internal pure returns (FixidityLib.Fraction memory) {
    return num > FixidityLib.fixed1().unwrap() ? FixidityLib.fixed1() : FixidityLib.wrap(num);
  }

  function _safeExponent(
    FixidityLib.Fraction memory base,
    FixidityLib.Fraction memory exponent
  ) internal pure returns (uint256) {
    if (FixidityLib.equals(base, FixidityLib.newFixed(0))) return 0;
    if (FixidityLib.equals(exponent, FixidityLib.newFixed(0))) return FixidityLib.fixed1().unwrap();

    FixidityLib.Fraction memory result = FixidityLib.fixed1();

    for (uint256 i = 0; i < exponent.unwrap(); i++) {
      if (FixidityLib.multiply(result, base).value < 1) revert("SafeExponent: Overflow");

      result = FixidityLib.multiply(result, base);
    }
    return result.unwrap();
  }

  function _calculateScore(uint256 _uptime, uint256 _gracePeriod) internal view returns (uint256) {
    return
      _safeExponent(
        _max1(_uptime.add(_gracePeriod)),
        FixidityLib.wrap(originalValidatorScoreParameters.exponent)
      );
  }

  function _whenL2() public {
    deployCodeTo("Registry.sol", abi.encode(false), proxyAdminAddress);
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

  function test_Reverts_setCommissionUpdateDelay_WhenL2() public {
    _whenL2();
    vm.expectRevert("This method is no longer supported in L2.");
    validators.setCommissionUpdateDelay(commissionUpdateDelay);
  }

  function test_shouldHaveSetDowntimeGracePeriod() public {
    uint256 actual = validators.downtimeGracePeriod();
    assertEq(actual, downtimeGracePeriod, "Wrong downtimeGracePeriod.");
  }

  function test_Reverts_SetDowntimeGracePeriod_WhenL2() public {
    _whenL2();
    vm.expectRevert("This method is no longer supported in L2.");
    validators.setDowntimeGracePeriod(downtimeGracePeriod);
  }
}

contract ValidatorsTest_SetMembershipHistoryLength is ValidatorsTest {
  uint256 newLength = membershipHistoryLength + 1;

  function test_Reverts_WhenLengthIsSame() public {
    vm.expectRevert("Membership history length not changed");
    validators.setMembershipHistoryLength(membershipHistoryLength);
  }

  function test_shouldSetTheMembershipHistoryLength() public {
    validators.setMembershipHistoryLength(newLength);
    assertEq(validators.membershipHistoryLength(), newLength);
  }

  function test_Reverts_SetTheMembershipHistoryLength_WhenL2() public {
    _whenL2();
    vm.expectRevert("This method is no longer supported in L2.");
    validators.setMembershipHistoryLength(newLength);
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

  function test_Reverts_SetMaxGroupSize_WhenL2() public {
    _whenL2();
    vm.expectRevert("This method is no longer supported in L2.");
    validators.setMaxGroupSize(newSize);
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
  GroupLockedGoldRequirements private newRequirements =
    GroupLockedGoldRequirements({
      value: originalGroupLockedGoldRequirements.value + 1,
      duration: originalGroupLockedGoldRequirements.duration + 1
    });

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
  ValidatorLockedGoldRequirements private newRequirements =
    ValidatorLockedGoldRequirements({
      value: originalValidatorLockedGoldRequirements.value + 1,
      duration: originalValidatorLockedGoldRequirements.duration + 1
    });

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
  ValidatorScoreParameters newParams =
    ValidatorScoreParameters({
      exponent: originalValidatorScoreParameters.exponent + 1,
      adjustmentSpeed: FixidityLib.newFixedFraction(6, 20)
    });

  event ValidatorScoreParametersSet(uint256 exponent, uint256 adjustmentSpeed);

  function test_ShouldSetExponentAndAdjustmentSpeed() public {
    validators.setValidatorScoreParameters(newParams.exponent, newParams.adjustmentSpeed.unwrap());
    (uint256 _exponent, uint256 _adjustmentSpeed) = validators.getValidatorScoreParameters();
    assertEq(_exponent, newParams.exponent, "Incorrect Exponent");
    assertEq(_adjustmentSpeed, newParams.adjustmentSpeed.unwrap(), "Incorrect AdjustmentSpeed");
  }

  function test_Reverts_SetExponentAndAdjustmentSpeed_WhenL2() public {
    _whenL2();
    vm.expectRevert("This method is no longer supported in L2.");
    validators.setValidatorScoreParameters(newParams.exponent, newParams.adjustmentSpeed.unwrap());
  }

  function test_Emits_ValidatorScoreParametersSet() public {
    vm.expectEmit(true, true, true, true);
    emit ValidatorScoreParametersSet(newParams.exponent, newParams.adjustmentSpeed.unwrap());
    validators.setValidatorScoreParameters(newParams.exponent, newParams.adjustmentSpeed.unwrap());
  }

  function test_Reverts_WhenCalledByNonOwner() public {
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

  function test_ShouldRevert_WhenInL2_WhenAccountHasAuthorizedValidatorSigner() public {
    lockedGold.setAccountTotalLockedGold(validator, originalValidatorLockedGoldRequirements.value);

    (bytes memory _ecdsaPubKey, uint8 v, bytes32 r, bytes32 s) = _generateEcdsaPubKeyWithSigner(
      validator,
      signerPk
    );

    ph.mockSuccess(ph.PROOF_OF_POSSESSION(), abi.encodePacked(validator, blsPublicKey, blsPop));

    vm.prank(validator);
    accounts.authorizeValidatorSigner(signer, v, r, s);

    _whenL2();

    vm.expectRevert("This method is no longer supported in L2.");
    vm.prank(validator);
    validators.registerValidator(_ecdsaPubKey, blsPublicKey, blsPop);
    validatorRegistrationEpochNumber = validators.getEpochNumber();
  }

  function test_ShouldAddAccountToValidatorList_WhenAccountHasAuthorizedValidatorSigner() public {
    address[] memory ExpectedRegisteredValidators = new address[](1);
    ExpectedRegisteredValidators[0] = validator;
    _registerValidatorWithSignerHelper();
    assertEq(validators.getRegisteredValidators().length, ExpectedRegisteredValidators.length);
    assertEq(validators.getRegisteredValidators()[0], ExpectedRegisteredValidators[0]);
  }

  function test_ShouldSetValidatorEcdsaPublicKey_WhenAccountHasAuthorizedValidatorSigner() public {
    bytes memory _registeredEcdsaPubKey = _registerValidatorWithSignerHelper();
    (bytes memory actualEcdsaPubKey, , , , ) = validators.getValidator(validator);

    assertEq(actualEcdsaPubKey, _registeredEcdsaPubKey);
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
    address[] memory expectedMembershipGroups = new address[](1);
    expectedMembershipGroups[0] = address(0);

    assertEq(_epoch, validatorRegistrationEpochNumberList);
    assertEq(_membershipGroups, expectedMembershipGroups);
  }

  function test_Emits_ValidatorBlsPublicKeyUpdatedEvent() public {
    (bytes memory _ecdsaPubKey, uint8 v, bytes32 r, bytes32 s) = _generateEcdsaPubKeyWithSigner(
      validator,
      signerPk
    );

    vm.prank(validator);
    accounts.authorizeValidatorSigner(signer, v, r, s);

    ph.mockSuccess(ph.PROOF_OF_POSSESSION(), abi.encodePacked(validator, blsPublicKey, blsPop));

    vm.expectEmit(true, true, true, true);
    emit ValidatorBlsPublicKeyUpdated(validator, blsPublicKey);

    vm.prank(validator);
    validators.registerValidator(_ecdsaPubKey, blsPublicKey, blsPop);
  }

  function test_Emits_ValidatorRegisteredEvent() public {
    (bytes memory _ecdsaPubKey, uint8 v, bytes32 r, bytes32 s) = _generateEcdsaPubKeyWithSigner(
      validator,
      signerPk
    );

    vm.prank(validator);
    accounts.authorizeValidatorSigner(signer, v, r, s);

    ph.mockSuccess(ph.PROOF_OF_POSSESSION(), abi.encodePacked(validator, blsPublicKey, blsPop));

    vm.expectEmit(true, true, true, true);
    emit ValidatorRegistered(validator);

    vm.prank(validator);
    validators.registerValidator(_ecdsaPubKey, blsPublicKey, blsPop);
  }

  function test_Reverts_WhenAccountAlreadyRegisteredAsValidator() public {
    bytes memory _registeredEcdsaPubKey = _registerValidatorWithSignerHelper();
    vm.expectRevert("Already registered");
    vm.prank(validator);
    validators.registerValidator(_registeredEcdsaPubKey, blsPublicKey, blsPop);
  }

  function test_Reverts_WhenAccountAlreadyRegisteredAsValidatorGroup() public {
    _registerValidatorGroupHelper(validator, 1);
    vm.expectRevert("Already registered");
    vm.prank(validator);
    validators.registerValidator(
      abi.encodePacked(bytes32(0x0101010101010101010101010101010101010101010101010101010101010101)),
      blsPublicKey,
      blsPop
    );
  }

  function test_Reverts_WhenAccountDoesNotMeetLockedGoldRequirements() public {
    lockedGold.setAccountTotalLockedGold(
      validator,
      originalValidatorLockedGoldRequirements.value.sub(11)
    );
    vm.expectRevert("Deposit too small");
    vm.prank(validator);
    validators.registerValidator(
      abi.encodePacked(bytes32(0x0101010101010101010101010101010101010101010101010101010101010101)),
      blsPublicKey,
      blsPop
    );
  }
}

contract ValidatorsTest_DeregisterValidator_WhenAccountHasNeverBeenMemberOfValidatorGroup is
  ValidatorsTest
{
  uint256 public constant INDEX = 0;

  function setUp() public {
    super.setUp();

    _registerValidatorHelper(validator, validatorPk);

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

contract ValidatorsTest_DeregisterValidator_WhenAccountHasBeenMemberOfValidatorGroup is
  ValidatorsTest
{
  uint256 public constant INDEX = 0;

  function setUp() public {
    super.setUp();

    _registerValidatorHelper(validator, validatorPk);

    _registerValidatorGroupHelper(group, 1);

    vm.prank(validator);
    validators.affiliate(group);

    vm.prank(group);
    validators.addFirstMember(validator, address(0), address(0));
  }

  function _deregisterValidator(address _validator) internal {
    vm.prank(_validator);
    validators.deregisterValidator(INDEX);
  }

  function test_ShouldMarkAccountAsNotValidator_WhenValidatorNoLongerMemberOfValidatorGroup()
    public
  {
    _removeMemberAndTimeTravel(
      group,
      validator,
      originalValidatorLockedGoldRequirements.duration.add(1)
    );
    assertTrue(validators.isValidator(validator));
    _deregisterValidator(validator);
    assertFalse(validators.isValidator(validator));
  }

  function test_ShouldRemoveAccountFromValidatorList_WhenValidatorNoLongerMemberOfValidatorGroup()
    public
  {
    address[] memory ExpectedRegisteredValidators = new address[](0);

    _removeMemberAndTimeTravel(
      group,
      validator,
      originalValidatorLockedGoldRequirements.duration.add(1)
    );
    assertTrue(validators.isValidator(validator));
    _deregisterValidator(validator);
    assertEq(validators.getRegisteredValidators().length, ExpectedRegisteredValidators.length);
  }

  function test_ShouldResetAccountBalanceRequirements_WhenValidatorNoLongerMemberOfValidatorGroup()
    public
  {
    _removeMemberAndTimeTravel(
      group,
      validator,
      originalValidatorLockedGoldRequirements.duration.add(1)
    );
    _deregisterValidator(validator);
    assertEq(validators.getAccountLockedGoldRequirement(validator), 0);
  }

  function test_Emits_ValidatorDeregisteredEvent_WhenValidatorNoLongerMemberOfValidatorGroup()
    public
  {
    _removeMemberAndTimeTravel(
      group,
      validator,
      originalValidatorLockedGoldRequirements.duration.add(1)
    );
    vm.expectEmit(true, true, true, true);
    emit ValidatorDeregistered(validator);
    _deregisterValidator(validator);
  }

  function test_Reverts_WhenItHasBeenLessThanValidatorLockedGoldRequirementsDurationSinceValidatorWasRemovedromGroup()
    public
  {
    _removeMemberAndTimeTravel(
      group,
      validator,
      originalValidatorLockedGoldRequirements.duration.sub(1)
    );
    vm.expectRevert("Not yet requirement end time");
    _deregisterValidator(validator);
  }

  function test_Rverts_WhenValidatorStillMemberOfValidatorGroup() public {
    vm.expectRevert("Has been group member recently");
    _deregisterValidator(validator);
  }
}

contract ValidatorsTest_Affiliate_WhenGroupAndValidatorMeetLockedGoldRequirements is
  ValidatorsTest
{
  address nonRegisteredGroup;

  function setUp() public {
    super.setUp();
    nonRegisteredGroup = actor("nonRegisteredGroup");

    _registerValidatorHelper(validator, validatorPk);
    _registerValidatorGroupHelper(group, 1);
  }

  function test_ShouldSetAffiliate_WhenAffiliatingWithRegisteredValidatorGroup() public {
    vm.prank(validator);
    validators.affiliate(group);

    (, , address affiliation, , ) = validators.getValidator(validator);

    assertEq(affiliation, group);
  }

  function test_Reverts_WhenL2_WhenAffiliatingWithRegisteredValidatorGroup() public {
    _whenL2();
    vm.prank(validator);
    vm.expectRevert("This method is no longer supported in L2.");
    validators.affiliate(group);
  }

  function test_Emits_ValidatorAffiliatedEvent() public {
    vm.expectEmit(true, true, true, true);
    emit ValidatorAffiliated(validator, group);
    vm.prank(validator);
    validators.affiliate(group);
  }

  function test_Reverts_WhenGroupDoesNotMeetLockedGoldrequirements() public {
    lockedGold.setAccountTotalLockedGold(group, originalGroupLockedGoldRequirements.value.sub(11));

    vm.expectRevert("Group doesn't meet requirements");

    vm.prank(validator);
    validators.affiliate(group);
  }

  function test_Reverts_WhenValidatorDoesNotMeetLockedGoldrequirements() public {
    lockedGold.setAccountTotalLockedGold(
      validator,
      originalValidatorLockedGoldRequirements.value.sub(11)
    );

    vm.expectRevert("Validator doesn't meet requirements");

    vm.prank(validator);
    validators.affiliate(group);
  }

  function test_Reverts_WhenAffiliatingWithNonRegisteredValidatorGroup() public {
    vm.expectRevert("Not a validator group");
    vm.prank(validator);
    validators.affiliate(nonRegisteredGroup);
  }

  function test_Reverts_WhenAccountNotRegisteredValidator() public {
    vm.expectRevert("Not a validator");
    vm.prank(nonValidator);
    validators.affiliate(group);
  }
}

contract ValidatorsTest_Affiliate_WhenValidatorIsAlreadyAffiliatedWithValidatorGroup is
  ValidatorsTest
{
  address otherGroup;

  uint256 validatorAffiliationEpochNumber;
  uint256 validatorAdditionEpochNumber;

  function setUp() public {
    super.setUp();

    otherGroup = actor("otherGroup");
    vm.prank(otherGroup);
    accounts.createAccount();

    _registerValidatorHelper(validator, validatorPk);

    _registerValidatorGroupHelper(group, 1);
    _registerValidatorGroupHelper(otherGroup, 1);

    vm.prank(validator);
    validators.affiliate(group);
  }

  function test_ShouldSetAffiliate_WhenValidatorNotMemberOfThatValidatorGroup() public {
    vm.prank(validator);
    validators.affiliate(otherGroup);
    (, , address affiliation, , ) = validators.getValidator(validator);
    assertEq(affiliation, otherGroup);
  }

  function test_ShouldRevert_WhenL2_WhenValidatorNotMemberOfThatValidatorGroup() public {
    _whenL2();
    vm.prank(validator);
    vm.expectRevert("This method is no longer supported in L2.");
    validators.affiliate(otherGroup);
  }

  function test_Emits_ValidatorDeaffiliatedEvent_WhenValidatorNotMemberOfThatValidatorGroup()
    public
  {
    vm.expectEmit(true, true, true, true);
    emit ValidatorDeaffiliated(validator, group);
    vm.prank(validator);
    validators.affiliate(otherGroup);
  }

  function test_Emits_ValidatorAffiliatedEvent_WhenValidatorNotMemberOfThatValidatorGroup() public {
    vm.expectEmit(true, true, true, true);
    emit ValidatorAffiliated(validator, otherGroup);
    vm.prank(validator);
    validators.affiliate(otherGroup);
  }

  function test_ShouldRemoveValidatorFromGroupMembershipList_WhenValidatorIsMemberOfThatValidatorGroup()
    public
  {
    address[] memory expectedMembersList = new address[](0);
    vm.prank(group);
    validators.addFirstMember(validator, address(0), address(0));
    vm.prank(validator);
    validators.affiliate(otherGroup);

    (address[] memory members, , , , , , ) = validators.getValidatorGroup(group);
    assertEq(members, expectedMembersList);
  }

  function test_ShouldUpdateValidatorsMembershipHistory_WhenValidatorIsMemberOfThatValidatorGroup()
    public
  {
    vm.prank(group);
    validators.addFirstMember(validator, address(0), address(0));

    validatorAdditionEpochNumber = validators.getEpochNumber();

    timeTravel(10);

    vm.prank(validator);
    validators.affiliate(otherGroup);
    validatorAffiliationEpochNumber = validators.getEpochNumber();

    (
      uint256[] memory epochs,
      address[] memory groups,
      uint256 lastRemovedFromGroupTimestamp,

    ) = validators.getMembershipHistory(validator);

    uint256 expectedEntries = 1;

    if (
      validatorAdditionEpochNumber != validatorRegistrationEpochNumber ||
      validatorAdditionEpochNumber != validatorAffiliationEpochNumber
    ) {
      expectedEntries = 2;
    }

    assertEq(epochs.length, expectedEntries);
    assertEq(epochs[expectedEntries - 1], validatorAffiliationEpochNumber);
    assertEq(groups.length, expectedEntries);
    assertEq(groups[expectedEntries - 1], address(0));
    assertEq(lastRemovedFromGroupTimestamp, uint256(block.timestamp));
  }

  function test_Emits_ValidatorGroupMemberRemovedEvent_WhenValidatorIsMemberOfThatValidatorGroup()
    public
  {
    vm.prank(group);
    validators.addFirstMember(validator, address(0), address(0));

    vm.expectEmit(true, true, true, true);
    emit ValidatorGroupMemberRemoved(group, validator);
    vm.prank(validator);
    validators.affiliate(otherGroup);
  }

  function test_ShouldMarkGroupIneligibleForElection() public {
    vm.prank(group);
    validators.addFirstMember(validator, address(0), address(0));
    vm.prank(validator);
    validators.affiliate(otherGroup);

    assertTrue(election.isIneligible(group));
  }
}

contract ValidatorsTest_Deaffiliate is ValidatorsTest {
  uint256 additionEpoch;
  uint256 deaffiliationEpoch;

  function setUp() public {
    super.setUp();

    _registerValidatorHelper(validator, validatorPk);

    _registerValidatorGroupHelper(group, 1);
    vm.prank(validator);
    validators.affiliate(group);
    (, , address _affiliation, , ) = validators.getValidator(validator);

    require(_affiliation == group, "Affiliation failed.");
  }

  function test_ShouldClearAffiliate() public {
    vm.prank(validator);
    validators.deaffiliate();
    (, , address _affiliation, , ) = validators.getValidator(validator);

    assertEq(_affiliation, address(0));
  }

  function test_Emits_ValidatorDeaffiliatedEvent() public {
    vm.expectEmit(true, true, true, true);
    emit ValidatorDeaffiliated(validator, group);
    vm.prank(validator);
    validators.deaffiliate();
  }

  function test_Reverts_WhenAccountNotRegisteredValidator() public {
    vm.expectRevert("Not a validator");
    vm.prank(nonValidator);
    validators.deaffiliate();
  }

  function test_Reverts_WhenValidatorNotAffiliatedWithValidatorGroup() public {
    vm.prank(validator);
    validators.deaffiliate();
    vm.expectRevert("deaffiliate: not affiliated");

    vm.prank(validator);
    validators.deaffiliate();
  }

  function test_ShouldRemoveValidatorFromGroupMembershipList_WhenValidatorIsMemberOfAffiliatedGroup()
    public
  {
    address[] memory expectedMembersList = new address[](0);

    vm.prank(group);
    validators.addFirstMember(validator, address(0), address(0));
    additionEpoch = validators.getEpochNumber();

    vm.prank(validator);
    validators.deaffiliate();
    deaffiliationEpoch = validators.getEpochNumber();

    (address[] memory members, , , , , , ) = validators.getValidatorGroup(group);
    assertEq(members, expectedMembersList);
  }

  function test_ShouldUpdateMembershipHisoryOfMember_WhenValidatorIsMemberOfAffiliatedGroup()
    public
  {
    vm.prank(group);
    validators.addFirstMember(validator, address(0), address(0));

    additionEpoch = validators.getEpochNumber();

    timeTravel(10);

    vm.prank(validator);
    validators.deaffiliate();
    deaffiliationEpoch = validators.getEpochNumber();

    (
      uint256[] memory epochs,
      address[] memory groups,
      uint256 lastRemovedFromGroupTimestamp,

    ) = validators.getMembershipHistory(validator);

    uint256 expectedEntries = 1;

    if (additionEpoch != validatorRegistrationEpochNumber || additionEpoch != deaffiliationEpoch) {
      expectedEntries = 2;
    }

    assertEq(epochs.length, expectedEntries);
    assertEq(epochs[expectedEntries - 1], deaffiliationEpoch);
    assertEq(groups.length, expectedEntries);
    assertEq(groups[expectedEntries - 1], address(0));
    assertEq(lastRemovedFromGroupTimestamp, uint256(block.timestamp));
  }

  function test_Emits_ValidatorGroupMemberRemovedEvent_WhenValidatorIsMemberOfAffiliatedGroup()
    public
  {
    vm.prank(group);
    validators.addFirstMember(validator, address(0), address(0));

    additionEpoch = validators.getEpochNumber();

    timeTravel(10);

    vm.expectEmit(true, true, true, true);
    emit ValidatorGroupMemberRemoved(group, validator);

    vm.prank(validator);
    validators.deaffiliate();
  }

  function test_ShouldMarkGroupAsIneligibleForElecion_WhenValidatorIsTheOnlyMemberOfGroup() public {
    vm.prank(group);
    validators.addFirstMember(validator, address(0), address(0));

    vm.prank(validator);
    validators.deaffiliate();
    assertTrue(election.isIneligible(group));
  }
}

contract ValidatorsTest_UpdateEcdsaPublicKey is ValidatorsTest {
  bytes validatorEcdsaPubKey;

  function setUp() public {
    super.setUp();

    vm.prank(address(accounts));
    accounts.createAccount();

    validatorEcdsaPubKey = _registerValidatorHelper(validator, validatorPk);
  }

  function test_ShouldSetValidatorEcdsaPubKey_WhenCalledByRegisteredAccountsContract() public {
    (bytes memory _newEcdsaPubKey, , , ) = _generateEcdsaPubKeyWithSigner(
      address(accounts),
      signerPk
    );
    vm.prank(address(accounts));
    validators.updateEcdsaPublicKey(validator, signer, _newEcdsaPubKey);

    (bytes memory actualEcdsaPubKey, , , , ) = validators.getValidator(validator);

    assertEq(actualEcdsaPubKey, _newEcdsaPubKey);
  }

  function test_Reverts_SetValidatorEcdsaPubKey_WhenCalledByRegisteredAccountsContract_WhenL2()
    public
  {
    _whenL2();
    (bytes memory _newEcdsaPubKey, , , ) = _generateEcdsaPubKeyWithSigner(
      address(accounts),
      signerPk
    );
    vm.prank(address(accounts));
    vm.expectRevert("This method is no longer supported in L2.");
    validators.updateEcdsaPublicKey(validator, signer, _newEcdsaPubKey);
  }

  function test_Emits_ValidatorEcdsaPublicKeyUpdatedEvent_WhenCalledByRegisteredAccountsContract()
    public
  {
    (bytes memory _newEcdsaPubKey, , , ) = _generateEcdsaPubKeyWithSigner(
      address(accounts),
      signerPk
    );

    vm.expectEmit(true, true, true, true);
    emit ValidatorEcdsaPublicKeyUpdated(validator, _newEcdsaPubKey);

    vm.prank(address(accounts));
    validators.updateEcdsaPublicKey(validator, signer, _newEcdsaPubKey);
  }

  function test_Reverts_WhenPublicKeyDoesNotMatchSigner_WhenCalledByRegisteredAccountsContract()
    public
  {
    (bytes memory _newEcdsaPubKey, , , ) = _generateEcdsaPubKeyWithSigner(
      address(accounts),
      otherValidatorPk
    );

    vm.expectRevert("ECDSA key does not match signer");
    vm.prank(address(accounts));
    validators.updateEcdsaPublicKey(validator, signer, _newEcdsaPubKey);
  }

  function test_Reverts_WhenNotCalledByRegisteredAccountsContract() public {
    (bytes memory _newEcdsaPubKey, , , ) = _generateEcdsaPubKeyWithSigner(validator, signerPk);

    vm.expectRevert("only registered contract");
    vm.prank(validator);
    validators.updateEcdsaPublicKey(validator, signer, _newEcdsaPubKey);
  }
}

contract ValidatorsTest_UpdatePublicKeys is ValidatorsTest {
  bytes validatorEcdsaPubKey;

  bytes public constant newBlsPublicKey =
    abi.encodePacked(
      bytes32(0x0101010101010101010101010101010101010101010101010101010101010102),
      bytes32(0x0202020202020202020202020202020202020202020202020202020202020203),
      bytes32(0x0303030303030303030303030303030303030303030303030303030303030304)
    );
  bytes public constant newBlsPop =
    abi.encodePacked(
      bytes16(0x04040404040404040404040404040405),
      bytes16(0x05050505050505050505050505050506),
      bytes16(0x06060606060606060606060606060607)
    );

  function setUp() public {
    super.setUp();

    vm.prank(address(accounts));
    accounts.createAccount();

    validatorEcdsaPubKey = _registerValidatorHelper(validator, validatorPk);
  }

  function test_ShouldSetValidatorNewBlsPubKeyAndEcdsaPubKey_WhenCalledByRegisteredAccountsContract()
    public
  {
    (bytes memory _newEcdsaPubKey, , , ) = _generateEcdsaPubKeyWithSigner(
      address(accounts),
      signerPk
    );

    ph.mockSuccess(
      ph.PROOF_OF_POSSESSION(),
      abi.encodePacked(validator, newBlsPublicKey, newBlsPop)
    );

    vm.prank(address(accounts));
    validators.updatePublicKeys(validator, signer, _newEcdsaPubKey, newBlsPublicKey, newBlsPop);

    (bytes memory actualEcdsaPubKey, bytes memory actualBlsPublicKey, , , ) = validators
      .getValidator(validator);

    assertEq(actualEcdsaPubKey, _newEcdsaPubKey);
    assertEq(actualBlsPublicKey, newBlsPublicKey);
  }

  function test_Reverts_SetValidatorNewBlsPubKeyAndEcdsaPubKey_WhenCalledByRegisteredAccountsContract_WhenL2()
    public
  {
    _whenL2();
    (bytes memory _newEcdsaPubKey, , , ) = _generateEcdsaPubKeyWithSigner(
      address(accounts),
      signerPk
    );

    ph.mockSuccess(
      ph.PROOF_OF_POSSESSION(),
      abi.encodePacked(validator, newBlsPublicKey, newBlsPop)
    );

    vm.prank(address(accounts));
    vm.expectRevert("This method is no longer supported in L2.");
    validators.updatePublicKeys(validator, signer, _newEcdsaPubKey, newBlsPublicKey, newBlsPop);
  }

  function test_Emits_ValidatorEcdsaPublicKeyUpdatedAndValidatorBlsPublicKeyUpdatedEvent_WhenCalledByRegisteredAccountsContract()
    public
  {
    (bytes memory _newEcdsaPubKey, , , ) = _generateEcdsaPubKeyWithSigner(
      address(accounts),
      signerPk
    );

    ph.mockSuccess(
      ph.PROOF_OF_POSSESSION(),
      abi.encodePacked(validator, newBlsPublicKey, newBlsPop)
    );

    vm.expectEmit(true, true, true, true);
    emit ValidatorEcdsaPublicKeyUpdated(validator, _newEcdsaPubKey);

    vm.expectEmit(true, true, true, true);
    emit ValidatorBlsPublicKeyUpdated(validator, newBlsPublicKey);

    vm.prank(address(accounts));
    validators.updatePublicKeys(validator, signer, _newEcdsaPubKey, newBlsPublicKey, newBlsPop);
  }

  function test_Reverts_WhenPublicKeyDoesNotMatchSigner_WhenCalledByRegisteredAccountsContract()
    public
  {
    (bytes memory _newEcdsaPubKey, , , ) = _generateEcdsaPubKeyWithSigner(
      address(accounts),
      otherValidatorPk
    );

    ph.mockSuccess(
      ph.PROOF_OF_POSSESSION(),
      abi.encodePacked(validator, newBlsPublicKey, newBlsPop)
    );

    vm.expectRevert("ECDSA key does not match signer");
    vm.prank(address(accounts));
    validators.updatePublicKeys(validator, signer, _newEcdsaPubKey, newBlsPublicKey, newBlsPop);
  }

  function test_Reverts_WhenPublicKeyMatchesSigner_WhenNotCalledByRegisteredAccountsContract()
    public
  {
    (bytes memory _newEcdsaPubKey, , , ) = _generateEcdsaPubKeyWithSigner(validator, signerPk);

    vm.expectRevert("only registered contract");
    vm.prank(validator);
    validators.updatePublicKeys(validator, signer, _newEcdsaPubKey, newBlsPublicKey, newBlsPop);
  }
}

contract ValidatorsTest_UpdateBlsPublicKey is ValidatorsTest {
  bytes validatorEcdsaPubKey;

  bytes public constant newBlsPublicKey =
    abi.encodePacked(
      bytes32(0x0101010101010101010101010101010101010101010101010101010101010102),
      bytes32(0x0202020202020202020202020202020202020202020202020202020202020203),
      bytes32(0x0303030303030303030303030303030303030303030303030303030303030304)
    );

  bytes public constant newBlsPop =
    abi.encodePacked(
      bytes16(0x04040404040404040404040404040405),
      bytes16(0x05050505050505050505050505050506),
      bytes16(0x06060606060606060606060606060607)
    );

  bytes public constant wrongBlsPublicKey =
    abi.encodePacked(
      bytes32(0x0101010101010101010101010101010101010101010101010101010101010102),
      bytes32(0x0202020202020202020202020202020202020202020202020202020202020203),
      bytes16(0x06060606060606060606060606060607)
    );

  bytes public constant wrongBlsPop =
    abi.encodePacked(
      bytes32(0x0101010101010101010101010101010101010101010101010101010101010102),
      bytes16(0x05050505050505050505050505050506),
      bytes16(0x06060606060606060606060606060607)
    );

  function setUp() public {
    super.setUp();

    validatorEcdsaPubKey = _registerValidatorHelper(validator, validatorPk);
  }

  function test_ShouldSetNewValidatorBlsPubKey() public {
    ph.mockSuccess(
      ph.PROOF_OF_POSSESSION(),
      abi.encodePacked(validator, newBlsPublicKey, newBlsPop)
    );

    vm.prank(validator);
    validators.updateBlsPublicKey(newBlsPublicKey, newBlsPop);

    (, bytes memory actualBlsPublicKey, , , ) = validators.getValidator(validator);

    assertEq(actualBlsPublicKey, newBlsPublicKey);
  }

  function test_Reverts_SetNewValidatorBlsPubKey_WhenL2() public {
    _whenL2();
    ph.mockSuccess(
      ph.PROOF_OF_POSSESSION(),
      abi.encodePacked(validator, newBlsPublicKey, newBlsPop)
    );

    vm.prank(validator);
    vm.expectRevert("This method is no longer supported in L2.");
    validators.updateBlsPublicKey(newBlsPublicKey, newBlsPop);
  }

  function test_Emits_ValidatorValidatorBlsPublicKeyUpdatedEvent() public {
    ph.mockSuccess(
      ph.PROOF_OF_POSSESSION(),
      abi.encodePacked(validator, newBlsPublicKey, newBlsPop)
    );

    vm.expectEmit(true, true, true, true);
    emit ValidatorBlsPublicKeyUpdated(validator, newBlsPublicKey);

    vm.prank(validator);
    validators.updateBlsPublicKey(newBlsPublicKey, newBlsPop);
  }

  function test_Reverts_WhenPublicKeyIsNot96Bytes() public {
    ph.mockSuccess(
      ph.PROOF_OF_POSSESSION(),
      abi.encodePacked(validator, wrongBlsPublicKey, newBlsPop)
    );

    vm.expectRevert("Wrong BLS public key length");
    vm.prank(validator);
    validators.updateBlsPublicKey(wrongBlsPublicKey, newBlsPop);
  }

  function test_Reverts_WhenProofOfPossessionIsNot48Bytes() public {
    ph.mockSuccess(
      ph.PROOF_OF_POSSESSION(),
      abi.encodePacked(validator, newBlsPublicKey, wrongBlsPop)
    );

    vm.expectRevert("Wrong BLS PoP length");
    vm.prank(validator);
    validators.updateBlsPublicKey(newBlsPublicKey, wrongBlsPop);
  }
}

contract ValidatorsTest_RegisterValidatorGroup is ValidatorsTest {
  function setUp() public {
    super.setUp();
  }

  function test_Reverts_WhenVoteOverMaxNumberGroupsSetTrue() public {
    vm.prank(group);
    election.setAllowedToVoteOverMaxNumberOfGroups(group, true);
    lockedGold.setAccountTotalLockedGold(group, originalGroupLockedGoldRequirements.value);
    vm.expectRevert("Cannot vote for more than max number of groups");
    vm.prank(group);
    validators.registerValidatorGroup(commission.unwrap());
  }

  function test_Reverts_WhenDelegatingCELO() public {
    lockedGold.setAccountTotalDelegatedAmountInPercents(group, 10);
    lockedGold.setAccountTotalLockedGold(group, originalGroupLockedGoldRequirements.value);
    vm.expectRevert("Cannot delegate governance power");
    vm.prank(group);
    validators.registerValidatorGroup(commission.unwrap());
  }

  function test_ShouldMarkAccountAsValidatorGroup() public {
    _registerValidatorGroupHelper(group, 1);
    assertTrue(validators.isValidatorGroup(group));
  }

  function test_ShouldAddAccountToListOfValidatorGroup() public {
    address[] memory ExpectedRegisteredValidatorGroups = new address[](1);
    ExpectedRegisteredValidatorGroups[0] = group;
    _registerValidatorGroupHelper(group, 1);
    validators.getRegisteredValidatorGroups();
    assertEq(
      validators.getRegisteredValidatorGroups().length,
      ExpectedRegisteredValidatorGroups.length
    );
    assertEq(validators.getRegisteredValidatorGroups()[0], ExpectedRegisteredValidatorGroups[0]);
  }

  function test_ShoulSetValidatorGroupCommission() public {
    _registerValidatorGroupHelper(group, 1);
    (, uint256 _commission, , , , , ) = validators.getValidatorGroup(group);

    assertEq(_commission, commission.unwrap());
  }

  function test_ShouldSetAccountLockedGoldRequirements() public {
    _registerValidatorGroupHelper(group, 1);
    assertEq(
      validators.getAccountLockedGoldRequirement(group),
      originalGroupLockedGoldRequirements.value
    );
  }

  function test_Emits_ValidatorGroupRegisteredEvent() public {
    lockedGold.setAccountTotalLockedGold(group, originalGroupLockedGoldRequirements.value);

    vm.expectEmit(true, true, true, true);
    emit ValidatorGroupRegistered(group, commission.unwrap());
    vm.prank(group);
    validators.registerValidatorGroup(commission.unwrap());
  }

  function test_Reverts_WhenAccountDoesNotMeetLockedGoldRequirements() public {
    lockedGold.setAccountTotalLockedGold(group, originalGroupLockedGoldRequirements.value.sub(11));
    vm.expectRevert("Not enough locked gold");
    vm.prank(group);
    validators.registerValidatorGroup(commission.unwrap());
  }

  function test_Reverts_WhenTheAccountIsAlreadyRegisteredValidator() public {
    _registerValidatorHelper(validator, validatorPk);

    lockedGold.setAccountTotalLockedGold(
      validator,
      originalGroupLockedGoldRequirements.value.sub(11)
    );
    vm.expectRevert("Already registered as validator");
    vm.prank(validator);
    validators.registerValidatorGroup(commission.unwrap());
  }

  function test_Reverts_WhenTheAccountIsAlreadyRegisteredValidatorGroup() public {
    _registerValidatorGroupHelper(group, 1);

    lockedGold.setAccountTotalLockedGold(group, originalGroupLockedGoldRequirements.value.sub(11));
    vm.expectRevert("Already registered as group");
    vm.prank(group);
    validators.registerValidatorGroup(commission.unwrap());
  }
}

contract ValidatorsTest_DeregisterValidatorGroup_WhenGroupHasNeverHadMembers is ValidatorsTest {
  uint256 public constant INDEX = 0;

  function setUp() public {
    super.setUp();

    _registerValidatorGroupHelper(group, 1);
  }

  function test_AccountShouldNoLongerBeValidatorGroup_WhenGroupNeverHadMembers() public {
    vm.prank(group);
    validators.deregisterValidatorGroup(INDEX);
    assertFalse(validators.isValidatorGroup(group));
  }

  function test_ShouldRemoveAccountFromListOfValidatorGroups() public {
    address[] memory ExpectedRegisteredValidatorGroups = new address[](0);

    vm.prank(group);
    validators.deregisterValidatorGroup(INDEX);
    assertEq(validators.getRegisteredValidatorGroups(), ExpectedRegisteredValidatorGroups);
  }

  function test_ShouldResetAccountBalanceRequirements() public {
    vm.prank(group);
    validators.deregisterValidatorGroup(INDEX);

    assertEq(validators.getAccountLockedGoldRequirement(group), 0);
  }

  function test_Emits_ValidatorGroupDeregisteredEvent() public {
    vm.expectEmit(true, true, true, true);
    emit ValidatorGroupDeregistered(group);

    vm.prank(group);
    validators.deregisterValidatorGroup(INDEX);
  }

  function test_Reverts_WhenWrongIndexProvided() public {
    vm.expectRevert("deleteElement: index out of range");
    vm.prank(group);
    validators.deregisterValidatorGroup(INDEX.add(1));
  }

  function test_Reverts_WhenAccountDoesNotHaveRegisteredValidatorGroup() public {
    vm.expectRevert("Not a validator group");

    vm.prank(nonValidator);
    validators.deregisterValidatorGroup(INDEX);
  }
}

contract ValidatorsTest_DeregisterValidatorGroup_WhenGroupHasHadMembers is ValidatorsTest {
  uint256 public constant INDEX = 0;

  function setUp() public {
    super.setUp();

    _registerValidatorGroupHelper(group, 1);
    _registerValidatorHelper(validator, validatorPk);

    vm.prank(validator);
    validators.affiliate(group);

    vm.prank(group);
    validators.addFirstMember(validator, address(0), address(0));
  }

  function test_ShouldMarkAccountAsNotValidatorGroup_WhenItHasBeenMoreThanGrouplockedGoldRequirementDuration()
    public
  {
    _removeMemberAndTimeTravel(
      group,
      validator,
      originalGroupLockedGoldRequirements.duration.add(1)
    );

    vm.prank(group);
    validators.deregisterValidatorGroup(INDEX);

    assertFalse(validators.isValidatorGroup(group));
  }

  function test_ShouldRemoveAccountFromValidatorGroupList_WhenItHasBeenMoreThanGrouplockedGoldRequirementDuration()
    public
  {
    address[] memory ExpectedRegisteredValidatorGroups = new address[](0);

    _removeMemberAndTimeTravel(
      group,
      validator,
      originalGroupLockedGoldRequirements.duration.add(1)
    );
    vm.prank(group);
    validators.deregisterValidatorGroup(INDEX);
    assertEq(validators.getRegisteredValidatorGroups(), ExpectedRegisteredValidatorGroups);
  }

  function test_ShouldResetAccountBalanceRequirements_WhenItHasBeenMoreThanGrouplockedGoldRequirementDuration()
    public
  {
    _removeMemberAndTimeTravel(
      group,
      validator,
      originalGroupLockedGoldRequirements.duration.add(1)
    );

    vm.prank(group);
    validators.deregisterValidatorGroup(INDEX);
    assertEq(validators.getAccountLockedGoldRequirement(group), 0);
  }

  function test_Emits_ValidatorGroupDeregistered_WhenItHasBeenMoreThanGrouplockedGoldRequirementDuration()
    public
  {
    _removeMemberAndTimeTravel(
      group,
      validator,
      originalGroupLockedGoldRequirements.duration.add(1)
    );

    vm.expectEmit(true, true, true, true);
    emit ValidatorGroupDeregistered(group);
    vm.prank(group);
    validators.deregisterValidatorGroup(INDEX);
  }

  function test_Reverts_WhenItHasBeenLessThanGroupLockedGoldRequirementsDuration() public {
    _removeMemberAndTimeTravel(
      group,
      validator,
      originalGroupLockedGoldRequirements.duration.sub(1)
    );

    vm.expectRevert("Hasn't been empty for long enough");
    vm.prank(group);
    validators.deregisterValidatorGroup(INDEX);
  }

  function test_Reverts_WhenGroupStillHasMembers() public {
    vm.expectRevert("Validator group not empty");
    vm.prank(group);
    validators.deregisterValidatorGroup(INDEX);
  }
}

contract ValidatorsTest_AddMember is ValidatorsTest {
  uint256 _registrationEpoch;
  uint256 _additionEpoch;

  function setUp() public {
    super.setUp();

    _registerValidatorGroupHelper(group, 1);

    _registerValidatorHelper(validator, validatorPk);
    _registrationEpoch = validators.getEpochNumber();

    vm.prank(validator);
    validators.affiliate(group);

    timeTravel(10);
  }

  function test_ShouldAddMemberToTheList() public {
    address[] memory expectedMembersList = new address[](1);
    expectedMembersList[0] = validator;

    vm.prank(group);
    validators.addFirstMember(validator, address(0), address(0));
    _additionEpoch = validators.getEpochNumber();

    (address[] memory members, , , , , , ) = validators.getValidatorGroup(group);

    assertEq(members, expectedMembersList);
  }

  function test_Reverts_AddFirstMemberToTheList_WhenL2() public {
    _whenL2();
    address[] memory expectedMembersList = new address[](1);
    expectedMembersList[0] = validator;

    vm.prank(group);
    vm.expectRevert("This method is no longer supported in L2.");
    validators.addFirstMember(validator, address(0), address(0));
  }

  function test_Reverts_AddMemberToTheList_WhenL2() public {
    _whenL2();
    address[] memory expectedMembersList = new address[](1);
    expectedMembersList[0] = validator;

    vm.prank(group);
    vm.expectRevert("This method is no longer supported in L2.");
    validators.addMember(validator);
  }

  function test_ShouldUpdateGroupSizeHistory() public {
    vm.prank(group);
    validators.addFirstMember(validator, address(0), address(0));
    _additionEpoch = validators.getEpochNumber();
    (, , , , uint256[] memory _sizeHistory, , ) = validators.getValidatorGroup(group);

    assertEq(_sizeHistory.length, 1);
    assertEq(_sizeHistory[0], uint256(block.timestamp));
  }

  function test_ShouldUpdateMembershipHistoryOfMember() public {
    vm.prank(group);
    validators.addFirstMember(validator, address(0), address(0));
    _additionEpoch = validators.getEpochNumber();

    uint256 expectedEntries = 1;

    if (_additionEpoch != _registrationEpoch) {
      expectedEntries = 2;
    }

    (uint256[] memory _epochs, address[] memory _membershipGroups, , ) = validators
      .getMembershipHistory(validator);

    assertEq(_epochs.length, expectedEntries);
    assertEq(_epochs[expectedEntries.sub(1)], _additionEpoch);
    assertEq(_membershipGroups.length, expectedEntries);
    assertEq(_membershipGroups[expectedEntries.sub(1)], group);
  }

  function test_ShouldMarkGroupAsEligible() public {
    vm.prank(group);
    validators.addFirstMember(validator, address(0), address(0));
    _additionEpoch = validators.getEpochNumber();
    assertTrue(election.isEligible(group));
  }

  function test_Emits_ValidatorGroupMemberAddedEvent() public {
    vm.expectEmit(true, true, true, true);
    emit ValidatorGroupMemberAdded(group, validator);

    vm.prank(group);
    validators.addFirstMember(validator, address(0), address(0));
  }

  function test_Reverts_WhenGroupHasNoRoomToAddMembers() public {
    vm.prank(group);
    validators.addFirstMember(validator, address(0), address(0));

    validators.setMaxGroupSize(1);
    _registerValidatorHelper(otherValidator, otherValidatorPk);

    vm.prank(otherValidator);
    validators.affiliate(group);

    vm.expectRevert("group would exceed maximum size");
    vm.prank(group);
    validators.addMember(otherValidator);
  }

  uint256[] expectedSizeHistory;

  function test_ShouldUpdateGroupsSizeHistoryAndBalanceRequirements_WhenAddingManyValidatorsAffiliatedWithGroup()
    public
  {
    vm.prank(group);
    validators.addFirstMember(validator, address(0), address(0));
    (, , , , expectedSizeHistory, , ) = validators.getValidatorGroup(group);

    assertEq(expectedSizeHistory.length, 1);

    for (uint256 i = 2; i < maxGroupSize.add(1); i++) {
      uint256 _numMembers = i;
      uint256 _validator1Pk = i;
      address _validator1 = vm.addr(_validator1Pk);

      vm.prank(_validator1);
      accounts.createAccount();

      _registerValidatorHelper(_validator1, _validator1Pk);

      vm.prank(_validator1);
      validators.affiliate(group);
      lockedGold.setAccountTotalLockedGold(
        group,
        originalGroupLockedGoldRequirements.value.mul(_numMembers)
      );

      vm.prank(group);
      validators.addMember(_validator1);

      expectedSizeHistory.push(uint256(block.timestamp));

      (, , , , uint256[] memory _actualSizeHistory, , ) = validators.getValidatorGroup(group);

      assertEq(expectedSizeHistory, _actualSizeHistory);
      assertEq(expectedSizeHistory.length, _actualSizeHistory.length);

      uint256 requirement = validators.getAccountLockedGoldRequirement(group);

      assertEq(requirement, originalGroupLockedGoldRequirements.value.mul(_numMembers));
    }
  }

  function test_Reverts_WhenValidatorDoesNotMeetLockedGoldRequirements() public {
    lockedGold.setAccountTotalLockedGold(
      validator,
      originalValidatorLockedGoldRequirements.value.sub(11)
    );
    vm.expectRevert("Validator requirements not met");
    vm.prank(group);
    validators.addFirstMember(validator, address(0), address(0));
  }

  function test_Reverts_WhenGroupDoesNotHaveMember_WhenGroupDoesNotMeetLockedGoldRequirements()
    public
  {
    lockedGold.setAccountTotalLockedGold(group, originalGroupLockedGoldRequirements.value.sub(11));
    vm.expectRevert("Group requirements not met");
    vm.prank(group);
    validators.addFirstMember(validator, address(0), address(0));
  }

  function test_Reverts_WhenGroupAlreadyHasMember_WhenGroupDosNotMeetLockedGoldRequirements()
    public
  {
    lockedGold.setAccountTotalLockedGold(
      group,
      originalGroupLockedGoldRequirements.value.mul(2).sub(11)
    );
    vm.prank(group);
    validators.addFirstMember(validator, address(0), address(0));

    _registerValidatorHelper(otherValidator, otherValidatorPk);

    vm.prank(otherValidator);
    validators.affiliate(group);

    vm.expectRevert("Group requirements not met");
    vm.prank(group);
    validators.addMember(otherValidator);
  }

  function test_Reverts_WhenAddingValidatorNotAffiliatedWithGroup() public {
    _registerValidatorHelper(otherValidator, otherValidatorPk);

    vm.expectRevert("Not affiliated to group");

    vm.prank(group);
    validators.addFirstMember(otherValidator, address(0), address(0));
  }

  function test_Reverts_WhenTheAccountDoesNotHaveARegisteredValidatorGroup() public {
    vm.expectRevert("Not validator and group");
    vm.prank(group);
    validators.addFirstMember(otherValidator, address(0), address(0));
  }

  function test_Reverts_WhenValidatorIsAlreadyMemberOfTheGroup() public {
    vm.expectRevert("Validator group empty");
    vm.prank(group);
    validators.addMember(validator);
  }
}

contract ValidatorsTest_RemoveMember is ValidatorsTest {
  function setUp() public {
    super.setUp();
    _registerValidatorGroupWithMembers(group, 1);
  }

  function test_ShouldRemoveMemberFromListOfMembers() public {
    address[] memory expectedMembersList = new address[](0);

    vm.prank(group);
    validators.removeMember(validator);

    (address[] memory members, , , , , , ) = validators.getValidatorGroup(group);

    assertEq(members, expectedMembersList);
    assertEq(members.length, expectedMembersList.length);
  }

  uint256 _registrationEpoch;
  uint256 _additionEpoch;

  function test_ShouldUpdateMemberMembershipHistory() public {
    vm.prank(group);
    validators.removeMember(validator);
    uint256 _expectedEpoch = validators.getEpochNumber();

    (
      uint256[] memory _epochs,
      address[] memory _membershipGroups,
      uint256 _historyLastRemovedTimestamp,

    ) = validators.getMembershipHistory(validator);

    assertEq(_epochs.length, 1);
    assertEq(_membershipGroups.length, 1);

    assertEq(_epochs[0], _expectedEpoch);

    assertEq(_membershipGroups[0], address(0));
    assertEq(_historyLastRemovedTimestamp, uint256(block.timestamp));
  }

  function test_ShouldUpdateGroupSizeHistory() public {
    vm.prank(group);
    validators.removeMember(validator);

    (, , , , uint256[] memory _sizeHistory, , ) = validators.getValidatorGroup(group);

    assertEq(_sizeHistory.length, 2);
    assertEq(_sizeHistory[1], uint256(block.timestamp));
  }

  function test_Emits_ValidatorGroupMemberRemovedEvent() public {
    vm.expectEmit(true, true, true, true);
    emit ValidatorGroupMemberRemoved(group, validator);

    vm.prank(group);
    validators.removeMember(validator);
  }

  function test_ShouldMarkGroupIneligible_WhenValidatorIsOnlyMemberOfTheGroup() public {
    vm.prank(group);
    validators.removeMember(validator);

    assertTrue(election.isIneligible(group));
  }

  function test_Reverts_WhenAccountIsNotRegisteredValidatorGroup() public {
    vm.expectRevert("is not group and validator");
    vm.prank(nonValidator);
    validators.removeMember(validator);
  }

  function test_Reverts_WhenMemberNotRegisteredValidatorGroup() public {
    vm.expectRevert("is not group and validator");
    vm.prank(group);
    validators.removeMember(nonValidator);
  }

  function test_Reverts_WhenValidatorNotMemberOfValidatorGroup() public {
    vm.prank(validator);
    validators.deaffiliate();

    vm.expectRevert("Not affiliated to group");
    vm.prank(group);
    validators.removeMember(validator);
  }
}

contract ValidatorsTest_ReorderMember is ValidatorsTest {
  function setUp() public {
    super.setUp();
    _registerValidatorGroupWithMembers(group, 2);
  }

  function test_ShouldReorderGroupMemberList() public {
    address[] memory expectedMembersList = new address[](2);
    expectedMembersList[0] = vm.addr(1);
    expectedMembersList[1] = validator;

    vm.prank(group);
    validators.reorderMember(vm.addr(1), validator, address(0));
    (address[] memory members, , , , , , ) = validators.getValidatorGroup(group);

    assertEq(expectedMembersList, members);
    assertEq(expectedMembersList.length, members.length);
  }

  function test_Reverts_ReorderGroupMemberList_WhenL2() public {
    _whenL2();
    address[] memory expectedMembersList = new address[](2);
    expectedMembersList[0] = vm.addr(1);
    expectedMembersList[1] = validator;

    vm.prank(group);
    vm.expectRevert("This method is no longer supported in L2.");
    validators.reorderMember(vm.addr(1), validator, address(0));
  }

  function test_Emits_ValidatorGroupMemberReorderedEvent() public {
    vm.expectEmit(true, true, true, true);
    emit ValidatorGroupMemberReordered(group, vm.addr(1));

    vm.prank(group);
    validators.reorderMember(vm.addr(1), validator, address(0));
  }

  function test_Reverts_WhenAccountIsNotRegisteredValidatorGroup() public {
    vm.expectRevert("Not a group");
    vm.prank(vm.addr(1));
    validators.reorderMember(vm.addr(1), validator, address(0));
  }

  function test_Reverts_WhenMemberNotRegisteredValidator() public {
    vm.expectRevert("Not a validator");
    vm.prank(group);
    validators.reorderMember(nonValidator, validator, address(0));
  }

  function test_Reverts_WhenValidatorNotMemberOfValidatorGroup() public {
    vm.prank(vm.addr(1));
    validators.deaffiliate();

    vm.expectRevert("Not a member of the group");
    vm.prank(group);
    validators.reorderMember(vm.addr(1), validator, address(0));
  }
}

contract ValidatorsTest_SetNextCommissionUpdate is ValidatorsTest {
  uint256 newCommission = commission.unwrap().add(1);

  function setUp() public {
    super.setUp();
    _registerValidatorGroupHelper(group, 1);
  }

  function test_ShouldNotSetValidatorGroupCommision() public {
    vm.prank(group);
    validators.setNextCommissionUpdate(newCommission);

    (, uint256 _commission, , , , , ) = validators.getValidatorGroup(group);

    assertEq(_commission, commission.unwrap());
  }

  function test_Reverts_SetValidatorGroupCommission_WhenL2() public {
    _whenL2();
    vm.prank(group);
    vm.expectRevert("This method is no longer supported in L2.");
    validators.setNextCommissionUpdate(newCommission);
  }

  function test_ShouldSetValidatorGroupNextCommission() public {
    vm.prank(group);
    validators.setNextCommissionUpdate(newCommission);
    (, , uint256 _nextCommission, , , , ) = validators.getValidatorGroup(group);

    assertEq(_nextCommission, newCommission);
  }

  function test_Emits_ValidatorGroupCommissionUpdateQueuedEvent() public {
    vm.expectEmit(true, true, true, true);
    emit ValidatorGroupCommissionUpdateQueued(
      group,
      newCommission,
      commissionUpdateDelay.add(uint256(block.number))
    );
    vm.prank(group);
    validators.setNextCommissionUpdate(newCommission);
  }

  function test_Reverts_WhenCommissionIsUnchanged() public {
    vm.expectRevert("Commission must be different");

    vm.prank(group);
    validators.setNextCommissionUpdate(commission.unwrap());
  }

  function test_Reverts_WhenCommissionGreaterThan1() public {
    vm.expectRevert("Commission can't be greater than 100%");

    vm.prank(group);
    validators.setNextCommissionUpdate(FixidityLib.fixed1().unwrap().add(1));
  }
}

contract ValidatorsTest_UpdateCommission is ValidatorsTest {
  uint256 newCommission = commission.unwrap().add(1);

  function setUp() public {
    super.setUp();

    _registerValidatorGroupHelper(group, 1);
  }

  function test_ShouldSetValidatorGroupCommission() public {
    vm.prank(group);
    validators.setNextCommissionUpdate(newCommission);

    blockTravel(commissionUpdateDelay);

    vm.prank(group);
    validators.updateCommission();

    (, uint256 _commission, , , , , ) = validators.getValidatorGroup(group);

    assertEq(_commission, newCommission);
  }

  function test_Reverts_SetValidatorGroupCommission_WhenL2() public {
    _whenL2();
    vm.prank(group);
    vm.expectRevert("This method is no longer supported in L2.");
    validators.setNextCommissionUpdate(newCommission);
  }

  function test_Emits_ValidatorGroupCommissionUpdated() public {
    vm.prank(group);
    validators.setNextCommissionUpdate(newCommission);

    blockTravel(commissionUpdateDelay);

    vm.expectEmit(true, true, true, true);
    emit ValidatorGroupCommissionUpdated(group, newCommission);

    vm.prank(group);
    validators.updateCommission();
  }

  function test_Reverts_WhenActivationBlockHasNotPassed() public {
    vm.prank(group);
    validators.setNextCommissionUpdate(newCommission);

    vm.expectRevert("Can't apply commission update yet");
    vm.prank(group);
    validators.updateCommission();
  }

  function test_Reverts_WhennoCommissionHasBeenQueued() public {
    vm.expectRevert("No commission update queued");

    vm.prank(group);
    validators.updateCommission();
  }

  function test_Reverts_WhenApplyingAlreadyAppliedCommission() public {
    vm.prank(group);
    validators.setNextCommissionUpdate(newCommission);
    blockTravel(commissionUpdateDelay);

    vm.prank(group);
    validators.updateCommission();

    vm.expectRevert("No commission update queued");

    vm.prank(group);
    validators.updateCommission();
  }
}

contract ValidatorsTest_CalculateEpochScore is ValidatorsTest {
  function setUp() public {
    super.setUp();

    _registerValidatorGroupHelper(group, 1);
  }

  function test_ShouldCalculateScoreCorrectly_WhenUptimeInInterval0AND1() public {
    FixidityLib.Fraction memory uptime = FixidityLib.newFixedFraction(99, 100);
    FixidityLib.Fraction memory gracePeriod = FixidityLib.newFixedFraction(
      validators.downtimeGracePeriod(),
      1
    );

    uint256 _expectedScore0 = _calculateScore(uptime.unwrap(), gracePeriod.unwrap());

    ph.mockReturn(
      ph.FRACTION_MUL(),
      abi.encodePacked(
        FixidityLib.fixed1().unwrap(),
        FixidityLib.fixed1().unwrap(),
        uptime.unwrap(),
        FixidityLib.fixed1().unwrap(),
        originalValidatorScoreParameters.exponent,
        uint256(18)
      ),
      abi.encodePacked(uint256(950990049900000000000000), FixidityLib.fixed1().unwrap())
    );
    uint256 _score0 = validators.calculateEpochScore(uptime.unwrap());

    uint256 _expectedScore1 = _calculateScore(0, gracePeriod.unwrap());
    uint256 _expectedScore2 = 1;

    ph.mockReturn(
      ph.FRACTION_MUL(),
      abi.encodePacked(
        FixidityLib.fixed1().unwrap(),
        FixidityLib.fixed1().unwrap(),
        uint256(0),
        FixidityLib.fixed1().unwrap(),
        originalValidatorScoreParameters.exponent,
        uint256(18)
      ),
      abi.encodePacked(uint256(0), FixidityLib.fixed1().unwrap())
    );

    uint256 _score1 = validators.calculateEpochScore(0);

    ph.mockReturn(
      ph.FRACTION_MUL(),
      abi.encodePacked(
        FixidityLib.fixed1().unwrap(),
        FixidityLib.fixed1().unwrap(),
        FixidityLib.fixed1().unwrap(),
        FixidityLib.fixed1().unwrap(),
        originalValidatorScoreParameters.exponent,
        uint256(18)
      ),
      abi.encodePacked(uint256(1), FixidityLib.fixed1().unwrap())
    );

    uint256 _score2 = validators.calculateEpochScore(FixidityLib.fixed1().unwrap());

    assertEq(_score0, _expectedScore0);
    assertEq(_score1, _expectedScore1);
    assertEq(_score2, _expectedScore2);
  }

  function test_Reverts_WhenUptimeGreaterThan1() public {
    FixidityLib.Fraction memory uptime = FixidityLib.add(
      FixidityLib.fixed1(),
      FixidityLib.newFixedFraction(1, 10)
    );

    ph.mockRevert(
      ph.FRACTION_MUL(),
      abi.encodePacked(
        FixidityLib.fixed1().unwrap(),
        FixidityLib.fixed1().unwrap(),
        uptime.unwrap(),
        FixidityLib.fixed1().unwrap(),
        originalValidatorScoreParameters.exponent,
        uint256(18)
      )
    );

    vm.expectRevert("Uptime cannot be larger than one");
    validators.calculateEpochScore(uptime.unwrap());
  }
}

contract ValidatorsTest_CalculateGroupEpochScore is ValidatorsTest {
  function setUp() public {
    super.setUp();

    _registerValidatorGroupHelper(group, 1);
  }

  function _computeGroupUptimeCalculation(
    FixidityLib.Fraction[] memory _uptimes
  ) public returns (uint256[] memory, uint256) {
    FixidityLib.Fraction memory gracePeriod = FixidityLib.newFixedFraction(
      validators.downtimeGracePeriod(),
      1
    );
    uint256 expectedScore;
    uint256[] memory unwrapedUptimes = new uint256[](_uptimes.length);

    uint256 sum = 0;
    for (uint256 i = 0; i < _uptimes.length; i++) {
      uint256 _currentscore = _calculateScore(_uptimes[i].unwrap(), gracePeriod.unwrap());

      sum = sum.add(_calculateScore(_uptimes[i].unwrap(), gracePeriod.unwrap()));

      ph.mockReturn(
        ph.FRACTION_MUL(),
        abi.encodePacked(
          FixidityLib.fixed1().unwrap(),
          FixidityLib.fixed1().unwrap(),
          _uptimes[i].unwrap(),
          FixidityLib.fixed1().unwrap(),
          originalValidatorScoreParameters.exponent,
          uint256(18)
        ),
        abi.encodePacked(_currentscore, FixidityLib.fixed1().unwrap())
      );
      unwrapedUptimes[i] = _uptimes[i].unwrap();
    }

    expectedScore = sum.div(_uptimes.length);

    return (unwrapedUptimes, expectedScore);
  }

  function test_ShouldCalculateGroupScoreCorrectly_WhenThereIs1ValidatorGroup() public {
    FixidityLib.Fraction[] memory uptimes = new FixidityLib.Fraction[](1);
    uptimes[0] = FixidityLib.newFixedFraction(969, 1000);

    (uint256[] memory unwrapedUptimes, uint256 expectedScore) = _computeGroupUptimeCalculation(
      uptimes
    );
    uint256 _actualScore = validators.calculateGroupEpochScore(unwrapedUptimes);
    assertEq(_actualScore, expectedScore);
  }

  function test_ShouldCalculateGroupScoreCorrectly_WhenThereAre3ValidatorGroup() public {
    FixidityLib.Fraction[] memory uptimes = new FixidityLib.Fraction[](3);
    uptimes[0] = FixidityLib.newFixedFraction(969, 1000);
    uptimes[1] = FixidityLib.newFixedFraction(485, 1000);
    uptimes[2] = FixidityLib.newFixedFraction(456, 1000);

    (uint256[] memory unwrapedUptimes, uint256 expectedScore) = _computeGroupUptimeCalculation(
      uptimes
    );
    uint256 _actualScore = validators.calculateGroupEpochScore(unwrapedUptimes);
    assertEq(_actualScore, expectedScore);
  }

  function test_ShouldCalculateGroupScoreCorrectly_WhenThereAre5ValidatorGroup() public {
    FixidityLib.Fraction[] memory uptimes = new FixidityLib.Fraction[](5);
    uptimes[0] = FixidityLib.newFixedFraction(969, 1000);
    uptimes[1] = FixidityLib.newFixedFraction(485, 1000);
    uptimes[2] = FixidityLib.newFixedFraction(456, 1000);
    uptimes[3] = FixidityLib.newFixedFraction(744, 1000);
    uptimes[4] = FixidityLib.newFixedFraction(257, 1000);

    (uint256[] memory unwrapedUptimes, uint256 expectedScore) = _computeGroupUptimeCalculation(
      uptimes
    );
    uint256 _actualScore = validators.calculateGroupEpochScore(unwrapedUptimes);
    assertEq(_actualScore, expectedScore);
  }

  function test_ShouldCalculateGroupScoreCorrectly_WhenOnlyZerosAreProvided() public {
    FixidityLib.Fraction[] memory uptimes = new FixidityLib.Fraction[](5);
    uptimes[0] = FixidityLib.newFixed(0);
    uptimes[1] = FixidityLib.newFixed(0);
    uptimes[2] = FixidityLib.newFixed(0);
    uptimes[3] = FixidityLib.newFixed(0);
    uptimes[4] = FixidityLib.newFixed(0);

    (uint256[] memory unwrapedUptimes, uint256 expectedScore) = _computeGroupUptimeCalculation(
      uptimes
    );
    uint256 _actualScore = validators.calculateGroupEpochScore(unwrapedUptimes);
    assertEq(_actualScore, expectedScore);
  }

  function test_ShouldCalculateGroupScoreCorrectly_WhenThereAreZerosInUptimes() public {
    FixidityLib.Fraction[] memory uptimes = new FixidityLib.Fraction[](3);
    uptimes[0] = FixidityLib.newFixedFraction(75, 100);
    uptimes[1] = FixidityLib.newFixed(0);
    uptimes[2] = FixidityLib.newFixedFraction(95, 100);

    (uint256[] memory unwrapedUptimes, uint256 expectedScore) = _computeGroupUptimeCalculation(
      uptimes
    );
    uint256 _actualScore = validators.calculateGroupEpochScore(unwrapedUptimes);
    assertEq(_actualScore, expectedScore);
  }

  function test_Reverts_WhenMoreUptimesThanMaxGroupSize() public {
    FixidityLib.Fraction[] memory uptimes = new FixidityLib.Fraction[](6);
    uptimes[0] = FixidityLib.newFixedFraction(9, 10);
    uptimes[1] = FixidityLib.newFixedFraction(9, 10);
    uptimes[2] = FixidityLib.newFixedFraction(9, 10);
    uptimes[3] = FixidityLib.newFixedFraction(9, 10);
    uptimes[4] = FixidityLib.newFixedFraction(9, 10);
    uptimes[5] = FixidityLib.newFixedFraction(9, 10);

    (uint256[] memory unwrapedUptimes, ) = _computeGroupUptimeCalculation(uptimes);
    vm.expectRevert("Uptime array larger than maximum group size");
    validators.calculateGroupEpochScore(unwrapedUptimes);
  }

  function test_Reverts_WhenNoUptimesProvided() public {
    uint256[] memory uptimes = new uint256[](0);

    vm.expectRevert("Uptime array empty");
    validators.calculateGroupEpochScore(uptimes);
  }

  function test_Reverts_WhenUptimesGreaterThan1() public {
    FixidityLib.Fraction[] memory uptimes = new FixidityLib.Fraction[](5);
    uptimes[0] = FixidityLib.newFixedFraction(9, 10);
    uptimes[1] = FixidityLib.newFixedFraction(9, 10);
    uptimes[2] = FixidityLib.add(FixidityLib.fixed1(), FixidityLib.newFixedFraction(1, 10));
    uptimes[3] = FixidityLib.newFixedFraction(9, 10);
    uptimes[4] = FixidityLib.newFixedFraction(9, 10);

    (uint256[] memory unwrapedUptimes, ) = _computeGroupUptimeCalculation(uptimes);
    vm.expectRevert("Uptime cannot be larger than one");
    validators.calculateGroupEpochScore(unwrapedUptimes);
  }
}

contract ValidatorsTest_UpdateValidatorScoreFromSigner is ValidatorsTest {
  FixidityLib.Fraction public gracePeriod;
  FixidityLib.Fraction public uptime;
  uint256 public _epochScore;

  function setUp() public {
    super.setUp();

    _registerValidatorHelper(validator, validatorPk);
    gracePeriod = FixidityLib.newFixedFraction(validators.downtimeGracePeriod(), 1);

    uptime = FixidityLib.newFixedFraction(99, 100);

    _epochScore = _calculateScore(uptime.unwrap(), gracePeriod.unwrap());

    ph.mockReturn(
      ph.FRACTION_MUL(),
      abi.encodePacked(
        FixidityLib.fixed1().unwrap(),
        FixidityLib.fixed1().unwrap(),
        uptime.unwrap(),
        FixidityLib.fixed1().unwrap(),
        originalValidatorScoreParameters.exponent,
        uint256(18)
      ),
      abi.encodePacked(_epochScore, FixidityLib.fixed1().unwrap())
    );
  }

  function test_ShouldUpdateValidatorScore_WhenUptimeInRange0And1() public {
    uint256 _expectedScore = FixidityLib
      .multiply(
        originalValidatorScoreParameters.adjustmentSpeed,
        FixidityLib.newFixedFraction(_epochScore, FixidityLib.fixed1().unwrap())
      )
      .unwrap();

    validators.updateValidatorScoreFromSigner(validator, uptime.unwrap());

    (, , , uint256 _actualScore, ) = validators.getValidator(validator);

    assertEq(_actualScore, _expectedScore);
  }

  function test_ShouldUpdateValidatorScore_WhenValidatorHasNonZeroScore() public {
    validators.updateValidatorScoreFromSigner(validator, uptime.unwrap());

    uint256 _expectedScore = FixidityLib
      .multiply(
        originalValidatorScoreParameters.adjustmentSpeed,
        FixidityLib.newFixedFraction(_epochScore, FixidityLib.fixed1().unwrap())
      )
      .unwrap();

    _expectedScore = FixidityLib
      .add(
        FixidityLib.multiply(
          FixidityLib.subtract(
            FixidityLib.fixed1(),
            originalValidatorScoreParameters.adjustmentSpeed
          ),
          FixidityLib.newFixedFraction(_expectedScore, FixidityLib.fixed1().unwrap())
        ),
        FixidityLib.newFixedFraction(_expectedScore, FixidityLib.fixed1().unwrap())
      )
      .unwrap();

    validators.updateValidatorScoreFromSigner(validator, uptime.unwrap());
    (, , , uint256 _actualScore, ) = validators.getValidator(validator);

    assertEq(_actualScore, _expectedScore);
  }

  function test_Reverts_WhenUptimeGreaterThan1() public {
    uptime = FixidityLib.add(FixidityLib.fixed1(), FixidityLib.newFixedFraction(1, 10));
    vm.expectRevert("Uptime cannot be larger than one");
    validators.updateValidatorScoreFromSigner(validator, uptime.unwrap());
  }
}

contract ValidatorsTest_UpdateMembershipHistory is ValidatorsTest {
  function setUp() public {
    super.setUp();
    _registerValidatorHelper(validator, validatorPk);

    _registerValidatorGroupHelper(group, 1);
    for (uint256 i = 1; i < groupLength; i++) {
      _registerValidatorGroupHelper(vm.addr(i), 1);
    }
  }

  address[] public expectedMembershipHistoryGroups;
  uint256[] public expectedMembershipHistoryEpochs;

  address[] public actualMembershipHistoryGroups;
  uint256[] public actualMembershipHistoryEpochs;

  function test_ShouldOverwritePreviousEntry_WhenChangingGroupsInSameEpoch() public {
    uint256 numTest = 10;

    expectedMembershipHistoryGroups.push(address(0));
    expectedMembershipHistoryEpochs.push(validatorRegistrationEpochNumber);

    for (uint256 i = 0; i < numTest; i++) {
      blockTravel(ph.epochSize());
      uint256 epochNumber = validators.getEpochNumber();

      vm.prank(validator);
      validators.affiliate(group);
      vm.prank(group);
      validators.addFirstMember(validator, address(0), address(0));

      (actualMembershipHistoryEpochs, actualMembershipHistoryGroups, , ) = validators
        .getMembershipHistory(validator);

      expectedMembershipHistoryGroups.push(group);

      expectedMembershipHistoryEpochs.push(epochNumber);

      if (expectedMembershipHistoryGroups.length > membershipHistoryLength) {
        for (uint256 j = 0; j < expectedMembershipHistoryGroups.length - 1; j++) {
          expectedMembershipHistoryGroups[j] = expectedMembershipHistoryGroups[j + 1];
          expectedMembershipHistoryEpochs[j] = expectedMembershipHistoryEpochs[j + 1];
        }

        expectedMembershipHistoryGroups.pop();
        expectedMembershipHistoryEpochs.pop();
      }

      assertEq(actualMembershipHistoryEpochs, expectedMembershipHistoryEpochs);
      assertEq(actualMembershipHistoryGroups, expectedMembershipHistoryGroups);

      vm.prank(validator);
      validators.affiliate(vm.addr(1));

      vm.prank(vm.addr(1));
      validators.addFirstMember(validator, address(0), address(0));

      (actualMembershipHistoryEpochs, actualMembershipHistoryGroups, , ) = validators
        .getMembershipHistory(validator);
      expectedMembershipHistoryGroups[expectedMembershipHistoryGroups.length - 1] = vm.addr(1);

      assertEq(actualMembershipHistoryEpochs, expectedMembershipHistoryEpochs);
      assertEq(actualMembershipHistoryGroups, expectedMembershipHistoryGroups);
    }
  }

  function test_ShouldAlwaysStoreMostRecentMemberships_WhenChangingGroupsMoreThanMembershipHistoryLength()
    public
  {
    expectedMembershipHistoryGroups.push(address(0));
    expectedMembershipHistoryEpochs.push(validatorRegistrationEpochNumber);

    for (uint256 i = 0; i < membershipHistoryLength.add(1); i++) {
      blockTravel(ph.epochSize());
      uint256 epochNumber = validators.getEpochNumber();

      vm.prank(validator);
      validators.affiliate(vm.addr(i + 1));
      vm.prank(vm.addr(i + 1));
      validators.addFirstMember(validator, address(0), address(0));

      expectedMembershipHistoryGroups.push(vm.addr(i + 1));

      expectedMembershipHistoryEpochs.push(epochNumber);

      if (expectedMembershipHistoryGroups.length > membershipHistoryLength) {
        for (uint256 j = 0; j < expectedMembershipHistoryGroups.length - 1; j++) {
          expectedMembershipHistoryGroups[j] = expectedMembershipHistoryGroups[j + 1];
          expectedMembershipHistoryEpochs[j] = expectedMembershipHistoryEpochs[j + 1];
        }

        expectedMembershipHistoryGroups.pop();
        expectedMembershipHistoryEpochs.pop();
      }

      (actualMembershipHistoryEpochs, actualMembershipHistoryGroups, , ) = validators
        .getMembershipHistory(validator);

      assertEq(actualMembershipHistoryEpochs, expectedMembershipHistoryEpochs);
      assertEq(actualMembershipHistoryGroups, expectedMembershipHistoryGroups);
    }
  }
}

contract ValidatorsTest_GetMembershipInLastEpoch is ValidatorsTest {
  function setUp() public {
    super.setUp();

    _registerValidatorHelper(validator, validatorPk);

    _registerValidatorGroupHelper(group, 1);
    for (uint256 i = 1; i < groupLength; i++) {
      _registerValidatorGroupHelper(vm.addr(i), 1);
    }
  }

  function test_ShouldAlwaysReturnCorrectMembershipForLastEpoch_WhenChangingMoreTimesThanMembershipHistoryLength()
    public
  {
    for (uint256 i = 0; i < membershipHistoryLength.add(1); i++) {
      blockTravel(ph.epochSize());

      vm.prank(validator);
      validators.affiliate(vm.addr(i + 1));
      vm.prank(vm.addr(i + 1));
      validators.addFirstMember(validator, address(0), address(0));

      if (i == 0) {
        assertEq(validators.getMembershipInLastEpoch(validator), address(0));
      } else {
        assertEq(validators.getMembershipInLastEpoch(validator), vm.addr(i));
      }
    }
  }

  function test_Reverts_getMembershipInLastEpoch_WhenL2() public {
    blockTravel(ph.epochSize());

    vm.prank(validator);
    validators.affiliate(vm.addr(1));
    vm.prank(vm.addr(1));
    validators.addFirstMember(validator, address(0), address(0));

    _whenL2();
    vm.expectRevert("This method is no longer supported in L2.");
    validators.getMembershipInLastEpoch(validator);
  }
}

contract ValidatorsTest_GetEpochSize is ValidatorsTest {
  function test_ShouldReturn17280() public {
    assertEq(validators.getEpochSize(), 17280);
  }
}

contract ValidatorsTest_GetAccountLockedGoldRequirement is ValidatorsTest {
  uint256 public numMembers = 5;
  uint256[] public actualRequirements;
  uint256[] removalTimestamps;

  function setUp() public {
    super.setUp();

    _registerValidatorGroupHelper(group, 1);

    for (uint256 i = 1; i < numMembers + 1; i++) {
      _registerValidatorHelper(vm.addr(i), i);
      vm.prank(vm.addr(i));
      validators.affiliate(group);

      lockedGold.setAccountTotalLockedGold(group, originalGroupLockedGoldRequirements.value.mul(i));

      if (i == 1) {
        vm.prank(group);
        validators.addFirstMember(vm.addr(i), address(0), address(0));
      } else {
        vm.prank(group);
        validators.addMember(vm.addr(i));
      }

      actualRequirements.push(validators.getAccountLockedGoldRequirement(group));
    }
  }

  function test_ShouldIncreaseRequirementsWithEachAddedMember() public {
    for (uint256 i = 0; i < numMembers; i++) {
      assertEq(actualRequirements[i], originalGroupLockedGoldRequirements.value.mul(i.add(1)));
    }
  }

  function test_ShouldDecreaseRequirementDuration1SecondAfterRemoval_WhenRemovingMembers() public {
    for (uint256 i = 1; i < numMembers + 1; i++) {
      vm.prank(group);
      validators.removeMember(vm.addr(i));
      removalTimestamps.push(uint256(block.timestamp));
      timeTravel(47);
    }

    for (uint256 i = 0; i < numMembers; i++) {
      assertEq(
        validators.getAccountLockedGoldRequirement(group),
        originalGroupLockedGoldRequirements.value.mul(numMembers.sub(i))
      );

      uint256 removalTimestamp = removalTimestamps[i];
      uint256 requirementExpiry = originalGroupLockedGoldRequirements.duration.add(
        removalTimestamp
      );

      uint256 currentTimestamp = uint256(block.timestamp);

      timeTravel(requirementExpiry.sub(currentTimestamp).add(1));
    }
  }
}

contract ValidatorsTest_DistributeEpochPaymentsFromSigner is ValidatorsTest {
  uint256 public numMembers = 5;
  uint256 public maxPayment = 20122394876;
  uint256 public expectedTotalPayment;
  uint256 public expectedGroupPayment;
  uint256 public expectedDelegatedPayment;
  uint256 public expectedValidatorPayment;
  uint256 public halfExpectedTotalPayment;
  uint256 public halfExpectedGroupPayment;
  uint256 public halfExpectedValidatorPayment;
  uint256 public halfExpectedDelegatedPayment;

  uint256[] public actualRequirements;
  uint256[] public removalTimestamps;

  FixidityLib.Fraction public expectedScore;
  FixidityLib.Fraction public gracePeriod;
  FixidityLib.Fraction public uptime;
  FixidityLib.Fraction public delegatedFraction;

  function setUp() public {
    super.setUp();

    delegatedFraction = FixidityLib.newFixedFraction(10, 100);
    _registerValidatorGroupWithMembers(group, 1);
    blockTravel(ph.epochSize());

    lockedGold.addSlasherTest(paymentDelegatee);

    vm.prank(validator);
    accounts.setPaymentDelegation(paymentDelegatee, delegatedFraction.unwrap());

    uptime = FixidityLib.newFixedFraction(99, 100);

    expectedScore = FixidityLib.multiply(
      originalValidatorScoreParameters.adjustmentSpeed,
      FixidityLib.newFixed(_calculateScore(uptime.unwrap(), validators.downtimeGracePeriod()))
    );

    expectedTotalPayment = FixidityLib.fromFixed(
      FixidityLib.multiply(
        expectedScore,
        FixidityLib.newFixedFraction(maxPayment, FixidityLib.fixed1().unwrap())
      )
    );

    expectedGroupPayment = FixidityLib.fromFixed(
      FixidityLib.multiply(commission, FixidityLib.newFixed(expectedTotalPayment))
    );

    uint256 remainingPayment = expectedTotalPayment.sub(expectedGroupPayment);

    expectedDelegatedPayment = FixidityLib.fromFixed(
      FixidityLib.multiply(FixidityLib.newFixed(remainingPayment), delegatedFraction)
    );

    expectedValidatorPayment = remainingPayment.sub(expectedDelegatedPayment);

    halfExpectedTotalPayment = FixidityLib
      .fromFixed(
        FixidityLib.multiply(
          expectedScore,
          FixidityLib.newFixedFraction(maxPayment, FixidityLib.fixed1().unwrap())
        )
      )
      .div(2);

    halfExpectedGroupPayment = FixidityLib.fromFixed(
      FixidityLib.multiply(commission, FixidityLib.newFixed(halfExpectedTotalPayment))
    );

    remainingPayment = halfExpectedTotalPayment.sub(halfExpectedGroupPayment);

    halfExpectedDelegatedPayment = FixidityLib.fromFixed(
      FixidityLib.multiply(FixidityLib.newFixed(remainingPayment), delegatedFraction)
    );

    halfExpectedValidatorPayment = remainingPayment.sub(halfExpectedDelegatedPayment);

    ph.mockReturn(
      ph.FRACTION_MUL(),
      abi.encodePacked(
        FixidityLib.fixed1().unwrap(),
        FixidityLib.fixed1().unwrap(),
        uptime.unwrap(),
        FixidityLib.fixed1().unwrap(),
        originalValidatorScoreParameters.exponent,
        uint256(18)
      ),
      abi.encodePacked(
        _calculateScore(uptime.unwrap(), validators.downtimeGracePeriod()),
        FixidityLib.fixed1().unwrap()
      )
    );

    validators.updateValidatorScoreFromSigner(validator, uptime.unwrap());
  }

  function test_Reverts_WhenL2_WhenValidatorAndGroupMeetBalanceRequirements() public {
    _whenL2();
    vm.expectRevert("This method is no longer supported in L2.");
    validators.distributeEpochPaymentsFromSigner(validator, maxPayment);
  }

  function test_ShouldPayValidator_WhenValidatorAndGroupMeetBalanceRequirements() public {
    validators.distributeEpochPaymentsFromSigner(validator, maxPayment);
    assertEq(stableToken.balanceOf(validator), expectedValidatorPayment);
  }

  function test_ShouldPayGroup_WhenValidatorAndGroupMeetBalanceRequirements() public {
    validators.distributeEpochPaymentsFromSigner(validator, maxPayment);
    assertEq(stableToken.balanceOf(group), expectedGroupPayment);
  }

  function test_ShouldPayDelegatee_WhenValidatorAndGroupMeetBalanceRequirements() public {
    validators.distributeEpochPaymentsFromSigner(validator, maxPayment);
    assertEq(stableToken.balanceOf(paymentDelegatee), expectedDelegatedPayment);
  }

  function test_ShouldReturnTheExpectedTotalPayment_WhenValidatorAndGroupMeetBalanceRequirements()
    public
  {
    validators.distributeEpochPaymentsFromSigner(validator, maxPayment);
    assertEq(
      validators.distributeEpochPaymentsFromSigner(validator, maxPayment),
      expectedTotalPayment
    );
  }

  function test_ShouldPayValidator_WhenValidatorAndGroupMeetBalanceRequirementsAndNoPaymentDelegated()
    public
  {
    expectedDelegatedPayment = 0;
    expectedValidatorPayment = expectedTotalPayment.sub(expectedGroupPayment);

    vm.prank(validator);
    accounts.deletePaymentDelegation();

    validators.distributeEpochPaymentsFromSigner(validator, maxPayment);
    assertEq(stableToken.balanceOf(validator), expectedValidatorPayment);
  }

  function test_ShouldPayGroup_WhenValidatorAndGroupMeetBalanceRequirementsAndNoPaymentDelegated()
    public
  {
    expectedDelegatedPayment = 0;
    expectedValidatorPayment = expectedTotalPayment.sub(expectedGroupPayment);

    vm.prank(validator);
    accounts.deletePaymentDelegation();

    validators.distributeEpochPaymentsFromSigner(validator, maxPayment);
    assertEq(
      validators.distributeEpochPaymentsFromSigner(validator, maxPayment),
      expectedTotalPayment
    );
  }

  function test_ShouldReturnTheExpectedTotalPayment_WhenValidatorAndGroupMeetBalanceRequirementsAndNoPaymentDelegated()
    public
  {
    expectedDelegatedPayment = 0;
    expectedValidatorPayment = expectedTotalPayment.sub(expectedGroupPayment);

    vm.prank(validator);
    accounts.deletePaymentDelegation();

    validators.distributeEpochPaymentsFromSigner(validator, maxPayment);
    assertEq(stableToken.balanceOf(group), expectedGroupPayment);
  }

  function test_shouldPayValidatorOnlyHalf_WhenSlashingMultiplierIsHalved() public {
    vm.prank(paymentDelegatee);
    validators.halveSlashingMultiplier(group);
    validators.distributeEpochPaymentsFromSigner(validator, maxPayment);

    assertEq(stableToken.balanceOf(validator), halfExpectedValidatorPayment);
  }

  function test_shouldPayGroupOnlyHalf_WhenSlashingMultiplierIsHalved() public {
    vm.prank(paymentDelegatee);
    validators.halveSlashingMultiplier(group);
    validators.distributeEpochPaymentsFromSigner(validator, maxPayment);

    assertEq(stableToken.balanceOf(group), halfExpectedGroupPayment);
  }

  function test_shouldPayDelegateeOnlyHalf_WhenSlashingMultiplierIsHalved() public {
    vm.prank(paymentDelegatee);
    validators.halveSlashingMultiplier(group);
    validators.distributeEpochPaymentsFromSigner(validator, maxPayment);

    assertEq(stableToken.balanceOf(paymentDelegatee), halfExpectedDelegatedPayment);
  }

  function test_shouldReturnHalfExpectedTotalPayment_WhenSlashingMultiplierIsHalved() public {
    vm.prank(paymentDelegatee);
    validators.halveSlashingMultiplier(group);
    validators.distributeEpochPaymentsFromSigner(validator, maxPayment);

    assertEq(
      validators.distributeEpochPaymentsFromSigner(validator, maxPayment),
      halfExpectedTotalPayment
    );
  }

  function test_ShouldNotPayValidator_WhenValidatorDoesNotMeetBalanceRequirement() public {
    lockedGold.setAccountTotalLockedGold(
      validator,
      originalValidatorLockedGoldRequirements.value.sub(11)
    );

    validators.distributeEpochPaymentsFromSigner(validator, maxPayment);
    assertEq(stableToken.balanceOf(validator), 0);
  }

  function test_ShouldNotPayGroup_WhenValidatorDoesNotMeetBalanceRequirement() public {
    lockedGold.setAccountTotalLockedGold(
      validator,
      originalValidatorLockedGoldRequirements.value.sub(11)
    );

    validators.distributeEpochPaymentsFromSigner(validator, maxPayment);
    assertEq(stableToken.balanceOf(group), 0);
  }

  function test_ShouldNotPayDelegatee_WhenValidatorDoesNotMeetBalanceRequirement() public {
    lockedGold.setAccountTotalLockedGold(
      validator,
      originalValidatorLockedGoldRequirements.value.sub(11)
    );

    validators.distributeEpochPaymentsFromSigner(validator, maxPayment);
    assertEq(stableToken.balanceOf(paymentDelegatee), 0);
  }

  function test_ShouldReturnZero_WhenValidatorDoesNotMeetBalanceRequirement() public {
    lockedGold.setAccountTotalLockedGold(
      validator,
      originalValidatorLockedGoldRequirements.value.sub(11)
    );

    assertEq(validators.distributeEpochPaymentsFromSigner(validator, maxPayment), 0);
  }

  function test_ShouldNotPayValidator_WhenGroupDoesNotMeetBalanceRequirement() public {
    lockedGold.setAccountTotalLockedGold(
      validator,
      originalGroupLockedGoldRequirements.value.sub(11)
    );

    validators.distributeEpochPaymentsFromSigner(validator, maxPayment);
    assertEq(stableToken.balanceOf(validator), 0);
  }

  function test_ShouldNotPayGroup_WhenGroupDoesNotMeetBalanceRequirement() public {
    lockedGold.setAccountTotalLockedGold(
      validator,
      originalGroupLockedGoldRequirements.value.sub(11)
    );

    validators.distributeEpochPaymentsFromSigner(validator, maxPayment);
    assertEq(stableToken.balanceOf(group), 0);
  }

  function test_ShouldNotPayDelegatee_WhenGroupDoesNotMeetBalanceRequirement() public {
    lockedGold.setAccountTotalLockedGold(
      validator,
      originalGroupLockedGoldRequirements.value.sub(11)
    );

    validators.distributeEpochPaymentsFromSigner(validator, maxPayment);
    assertEq(stableToken.balanceOf(paymentDelegatee), 0);
  }

  function test_ShouldReturnZero_WhenGroupDoesNotMeetBalanceRequirement() public {
    lockedGold.setAccountTotalLockedGold(
      validator,
      originalGroupLockedGoldRequirements.value.sub(11)
    );

    assertEq(validators.distributeEpochPaymentsFromSigner(validator, maxPayment), 0);
  }
}

contract ValidatorsTest_ForceDeaffiliateIfValidator is ValidatorsTest {
  function setUp() public {
    super.setUp();

    _registerValidatorHelper(validator, validatorPk);
    _registerValidatorGroupHelper(group, 1);

    vm.prank(validator);
    validators.affiliate(group);

    lockedGold.addSlasherTest(paymentDelegatee);
  }

  function test_ShouldSucceed_WhenSenderIsWhitelistedSlashingAddress() public {
    vm.prank(paymentDelegatee);
    validators.forceDeaffiliateIfValidator(validator);
    (, , address affiliation, , ) = validators.getValidator(validator);
    assertEq(affiliation, address(0));
  }

  function test_Reverts_WhenSenderIsWhitelistedSlashingAddress_WhenL2() public {
    _whenL2();
    vm.prank(paymentDelegatee);
    vm.expectRevert("This method is no longer supported in L2.");
    validators.forceDeaffiliateIfValidator(validator);
  }

  function test_Reverts_WhenSenderNotApprovedAddress() public {
    vm.expectRevert("Only registered slasher can call");
    validators.forceDeaffiliateIfValidator(validator);
  }
}

contract ValidatorsTest_GroupMembershipInEpoch is ValidatorsTest {
  uint256 totalEpochs = 24;
  uint256 gapSize = 3;
  uint256 contractIndex;

  EpochInfo[] public epochInfoList;

  struct EpochInfo {
    uint256 epochNumber;
    address groupy;
  }

  function setUp() public {
    super.setUp();

    _registerValidatorHelper(validator, validatorPk);
    contractIndex = 1;
    for (uint256 i = 1; i < groupLength; i++) {
      _registerValidatorGroupHelper(vm.addr(i), 1);
    }

    // Start at 1 since we can't start with deaffiliate
    for (uint256 i = 1; i < totalEpochs; i++) {
      blockTravel(ph.epochSize());

      uint256 epochNumber = validators.getEpochNumber();

      if (i % gapSize == 0) {
        address _group = (i % gapSize.mul(gapSize)) != 0
          ? vm.addr(i.div(gapSize) % groupLength)
          : address(0);

        contractIndex += 1;

        epochInfoList.push(EpochInfo(epochNumber, _group));

        if (i % (gapSize.mul(gapSize)) != 0) {
          vm.prank(validator);
          validators.affiliate(_group);

          vm.prank(_group);
          validators.addFirstMember(validator, address(0), address(0));
        } else {
          vm.prank(validator);
          validators.deaffiliate();
        }
      }
    }
  }

  function test_ShouldCorrectlyGetGroupAddressForExactEpochNumbers() public {
    for (uint256 i = 0; i < epochInfoList.length; i++) {
      address _group = epochInfoList[i].groupy;

      if (epochInfoList.length.sub(i) <= membershipHistoryLength) {
        assertEq(
          validators.groupMembershipInEpoch(
            validator,
            epochInfoList[i].epochNumber,
            uint256(1).add(i)
          ),
          _group
        );
      } else {
        vm.expectRevert("index out of bounds");
        validators.groupMembershipInEpoch(
          validator,
          epochInfoList[i].epochNumber,
          uint256(1).add(i)
        );
      }
    }
  }

  function test_Reverts_GroupMembershipInEpoch_WhenL2() public {
    _whenL2();
    for (uint256 i = 0; i < epochInfoList.length; i++) {
      address _group = epochInfoList[i].groupy;

      if (epochInfoList.length.sub(i) <= membershipHistoryLength) {
        vm.expectRevert("This method is no longer supported in L2.");
        validators.groupMembershipInEpoch(
          validator,
          epochInfoList[i].epochNumber,
          uint256(1).add(i)
        );
      } else {
        vm.expectRevert("This method is no longer supported in L2.");
        validators.groupMembershipInEpoch(
          validator,
          epochInfoList[i].epochNumber,
          uint256(1).add(i)
        );
      }
    }
  }

  function test_Reverts_WhenEpochNumberAtGivenIndexIsGreaterThanProvidedEpochNumber() public {
    vm.expectRevert("index out of bounds");
    validators.groupMembershipInEpoch(
      validator,
      epochInfoList[epochInfoList.length.sub(2)].epochNumber,
      contractIndex
    );
  }

  function test_Reverts_WhenEpochNumberFitsIntoDifferentIndexBucket() public {
    vm.expectRevert("provided index does not match provided epochNumber at index in history.");
    validators.groupMembershipInEpoch(
      validator,
      epochInfoList[epochInfoList.length.sub(1)].epochNumber,
      contractIndex.sub(2)
    );
  }

  function test_Reverts_WhenProvidedEpochNumberGreaterThanCurrentEpochNumber() public {
    uint256 _epochNumber = validators.getEpochNumber();
    vm.expectRevert("Epoch cannot be larger than current");
    validators.groupMembershipInEpoch(validator, _epochNumber.add(1), contractIndex);
  }

  function test_Reverts_WhenProvidedIndexGreaterThanIndexOnChain() public {
    uint256 _epochNumber = validators.getEpochNumber();
    vm.expectRevert("index out of bounds");
    validators.groupMembershipInEpoch(validator, _epochNumber, contractIndex.add(1));
  }

  function test_Reverts_WhenProvidedIndexIsLessThanTailIndexOnChain() public {
    vm.expectRevert("provided index does not match provided epochNumber at index in history.");
    validators.groupMembershipInEpoch(
      validator,
      epochInfoList[epochInfoList.length.sub(membershipHistoryLength).sub(1)].epochNumber,
      contractIndex.sub(membershipHistoryLength)
    );
  }
}

contract ValidatorsTest_HalveSlashingMultiplier is ValidatorsTest {
  function setUp() public {
    super.setUp();

    _registerValidatorGroupHelper(group, 1);
    lockedGold.addSlasherTest(paymentDelegatee);
  }

  function test_ShouldHalveslashingMultiplier() public {
    FixidityLib.Fraction memory expectedMultiplier = FixidityLib.fixed1();
    for (uint256 i = 0; i < 10; i++) {
      vm.prank(paymentDelegatee);
      validators.halveSlashingMultiplier(group);

      expectedMultiplier = FixidityLib.divide(expectedMultiplier, FixidityLib.newFixed(2));
      (, , , , , uint256 actualMultiplier, ) = validators.getValidatorGroup(group);

      assertEq(actualMultiplier, expectedMultiplier.unwrap());
    }
  }

  function test_Reverts_HalveSlashingMultiplier_WhenL2() public {
    _whenL2();
    FixidityLib.Fraction memory expectedMultiplier = FixidityLib.fixed1();
    vm.prank(paymentDelegatee);
    vm.expectRevert("This method is no longer supported in L2.");
    validators.halveSlashingMultiplier(group);
  }

  function test_ShouldUpdateLastSlashedTimestamp() public {
    (, , , , , , uint256 initialLastSlashed) = validators.getValidatorGroup(group);

    vm.prank(paymentDelegatee);
    validators.halveSlashingMultiplier(group);
    (, , , , , , uint256 updatedLastSlashed) = validators.getValidatorGroup(group);

    assertGt(updatedLastSlashed, initialLastSlashed);
  }

  function test_Reverts_WhenCalledByNonSlasher() public {
    vm.expectRevert("Only registered slasher can call");
    validators.halveSlashingMultiplier(group);
  }
}

contract ValidatorsTest_ResetSlashingMultiplier is ValidatorsTest {
  function setUp() public {
    super.setUp();

    _registerValidatorHelper(validator, validatorPk);
    _registerValidatorGroupHelper(group, 1);

    vm.prank(validator);
    validators.affiliate(group);

    lockedGold.addSlasherTest(paymentDelegatee);

    vm.prank(paymentDelegatee);
    validators.halveSlashingMultiplier(group);
    (, , , , , uint256 initialMultiplier, ) = validators.getValidatorGroup(group);

    require(
      initialMultiplier == FixidityLib.newFixedFraction(5, 10).unwrap(),
      "initialMultiplier is incorrect"
    );
  }

  function test_ShouldReturnToDefault_WhenSlashingMultiplierIsResetAfterResetPeriod() public {
    timeTravel(slashingMultiplierResetPeriod);

    vm.prank(group);
    validators.resetSlashingMultiplier();
    (, , , , , uint256 actualMultiplier, ) = validators.getValidatorGroup(group);
    assertEq(actualMultiplier, FixidityLib.fixed1().unwrap());
  }

  function test_Reverts_WhenSlashingMultiplierIsResetAfterResetPeriod_WhenL2() public {
    _whenL2();
    timeTravel(slashingMultiplierResetPeriod);

    vm.prank(group);
    vm.expectRevert("This method is no longer supported in L2.");
    validators.resetSlashingMultiplier();
  }

  function test_Reverts_WhenSlashingMultiplierIsResetBeforeResetPeriod() public {
    vm.expectRevert("`resetSlashingMultiplier` called before resetPeriod expired");
    vm.prank(group);
    validators.resetSlashingMultiplier();
  }

  function test_ShouldReadProperly_WhenSlashingResetPeriosIsUpdated() public {
    uint256 newResetPeriod = 10 * DAY;
    validators.setSlashingMultiplierResetPeriod(newResetPeriod);
    timeTravel(newResetPeriod);
    vm.prank(group);
    validators.resetSlashingMultiplier();
    (, , , , , uint256 actualMultiplier, ) = validators.getValidatorGroup(group);
    assertEq(actualMultiplier, FixidityLib.fixed1().unwrap());
  }

  function test_Reverts_SetSlashingMultiplierResetPeriod_WhenL2() public {
    _whenL2();
    uint256 newResetPeriod = 10 * DAY;
    vm.expectRevert("This method is no longer supported in L2.");
    validators.setSlashingMultiplierResetPeriod(newResetPeriod);
  }
}
