// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.5.13;
pragma experimental ABIEncoderV2;

// This test file is in 0.5 although the contract is in 0.8

import "openzeppelin-solidity/contracts/ownership/Ownable.sol";

import "openzeppelin-solidity/contracts/math/SafeMath.sol";
import "@celo-contracts/common/FixidityLib.sol";
import "@celo-contracts/common/Accounts.sol";
import "@celo-contracts-8/common/interfaces/IPrecompiles.sol";

import "@celo-contracts/governance/interfaces/IValidators.sol";

import "@celo-contracts/stability/test/MockStableToken.sol";
import "@celo-contracts/governance/test/MockElection.sol";
import "@celo-contracts/governance/test/MockLockedGold.sol";
import "@test-sol/unit/governance/validators/mocks/ValidatorsMockTunnel.sol";

import "@test-sol/utils/ECDSAHelper.sol";
import { TestWithUtils } from "@test-sol/TestWithUtils.sol";

contract ValidatorsTest is TestWithUtils, ECDSAHelper {
  using FixidityLib for FixidityLib.Fraction;
  using SafeMath for uint256;

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

  Accounts accounts;
  MockStableToken stableToken;
  MockElection election;
  ValidatorsMockTunnel public validatorsMockTunnel;
  IValidators public validators;
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

  ValidatorLockedGoldRequirements public originalValidatorLockedGoldRequirements;
  GroupLockedGoldRequirements public originalGroupLockedGoldRequirements;
  ValidatorScoreParameters public originalValidatorScoreParameters;

  uint256 public slashingMultiplierResetPeriod = 30 * DAY;
  uint256 public membershipHistoryLength = 5;
  uint256 public maxGroupSize = 5;
  uint256 public commissionUpdateDelay = 3;

  ValidatorsMockTunnel.InitParams public initParams;
  ValidatorsMockTunnel.InitParams2 public initParams2;

  event AccountSlashed(
    address indexed slashed,
    uint256 penalty,
    address indexed reporter,
    uint256 reward
  );
  event MaxGroupSizeSet(uint256 size);
  event CommissionUpdateDelaySet(uint256 delay);
  event GroupLockedGoldRequirementsSet(uint256 value, uint256 duration);
  event ValidatorLockedGoldRequirementsSet(uint256 value, uint256 duration);
  event MembershipHistoryLengthSet(uint256 length);
  event ValidatorRegistered(address indexed validator);
  event ValidatorDeregistered(address indexed validator);
  event ValidatorAffiliated(address indexed validator, address indexed group);
  event ValidatorDeaffiliated(address indexed validator, address indexed group);
  event ValidatorEcdsaPublicKeyUpdated(address indexed validator, bytes ecdsaPublicKey);
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

  event SendValidatorPaymentCalled(address validator);

  function setUp() public {
    super.setUp();
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

    accounts = new Accounts(true);
    accounts.initialize(REGISTRY_ADDRESS);

    lockedGold = new MockLockedGold();
    election = new MockElection();

    stableToken = new MockStableToken();

    registry.setAddressFor(AccountsContract, address(accounts));
    registry.setAddressFor(ElectionContract, address(election));
    registry.setAddressFor(LockedGoldContract, address(lockedGold));
    registry.setAddressFor(StableTokenContract, address(stableToken));

    address validatorsAddress = actor("Validators");
    deployAndInitValidatorsContract(validatorsAddress);

    vm.prank(validator);
    accounts.createAccount();

    vm.prank(otherValidator);
    accounts.createAccount();

    vm.prank(group);
    accounts.createAccount();

    vm.prank(nonValidator);
    accounts.createAccount();

    whenL2WithEpochManagerInitialization();
  }

  function deployAndInitValidatorsContract(address _validatorsContractAddress) public {
    deployCodeTo("ValidatorsMock.sol", _validatorsContractAddress);
    validators = IValidators(_validatorsContractAddress);
    validatorsMockTunnel = new ValidatorsMockTunnel(address(validators));
    registry.setAddressFor(ValidatorsContract, address(validators));

    initParams = ValidatorsMockTunnel.InitParams({
      registryAddress: REGISTRY_ADDRESS,
      groupRequirementValue: originalGroupLockedGoldRequirements.value,
      groupRequirementDuration: originalGroupLockedGoldRequirements.duration,
      validatorRequirementValue: originalValidatorLockedGoldRequirements.value,
      validatorRequirementDuration: originalValidatorLockedGoldRequirements.duration
    });
    initParams2 = ValidatorsMockTunnel.InitParams2({
      _membershipHistoryLength: membershipHistoryLength,
      _slashingMultiplierResetPeriod: slashingMultiplierResetPeriod,
      _maxGroupSize: maxGroupSize,
      _commissionUpdateDelay: commissionUpdateDelay
    });

    validatorsMockTunnel.MockInitialize(owner, initParams, initParams2);
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

  function _registerValidatorGroupWithMembersHavingSigners(
    address _group,
    uint256 _numMembers
  ) public {
    _registerValidatorGroupHelper(_group, _numMembers);

    for (uint256 i = 0; i < _numMembers; i++) {
      if (i == 0) {
        _registerValidatorWithSignerHelper(validator, signer, signerPk);

        vm.prank(validator);
        validators.affiliate(_group);

        vm.prank(_group);
        validators.addFirstMember(validator, address(0), address(0));
      } else {
        uint256 _validator1Pk = i;
        address _validator1 = vm.addr(_validator1Pk);
        uint256 _signer1Pk = i + _numMembers;
        address _signer1 = vm.addr(_signer1Pk);

        vm.prank(_validator1);
        accounts.createAccount();
        _registerValidatorWithSignerHelper(_validator1, _signer1, _signer1Pk);
        vm.prank(_validator1);
        validators.affiliate(_group);

        vm.prank(_group);
        validators.addMember(_validator1);
      }
    }
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

  function _registerValidatorWithSignerHelper(
    address _validator,
    address _signer,
    uint256 _signerPk
  ) internal returns (bytes memory) {
    lockedGold.setAccountTotalLockedGold(_validator, originalValidatorLockedGoldRequirements.value);

    (bytes memory _ecdsaPubKey, uint8 v, bytes32 r, bytes32 s) = _generateEcdsaPubKeyWithSigner(
      _validator,
      _signerPk
    );

    vm.prank(_validator);
    accounts.authorizeValidatorSigner(_signer, v, r, s);

    vm.prank(_validator);
    validators.registerValidatorNoBls(_ecdsaPubKey);

    validatorRegistrationEpochNumber = getEpochNumber();
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

    vm.prank(_validator);
    validators.registerValidatorNoBls(_ecdsaPubKey);

    validatorRegistrationEpochNumber = getEpochNumber();
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

  function _removeMemberAndTimeTravel(
    address _group,
    address _validator,
    uint256 _duration
  ) internal {
    vm.prank(_group);
    validators.removeMember(_validator);
    timeTravel(_duration);
  }

  function _calculateScore(uint256 _uptime, uint256 _gracePeriod) internal view returns (uint256) {
    return
      _safeExponent(
        _max1(_uptime.add(_gracePeriod)),
        FixidityLib.wrap(originalValidatorScoreParameters.exponent)
      );
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
}

contract ValidatorsTest_Initialize is ValidatorsTest {
  function setUp() public {
    super.setUp();
    address newValidatorsContractAddress = actor("ValidatorsContract");
    deployAndInitValidatorsContract(newValidatorsContractAddress);
  }
  function test_ShouldhaveSetTheOwner() public {
    assertEq(Ownable(address(validators)).owner(), owner, "Incorrect Owner.");
  }

  function test_Reverts_WhenCalledMoreThanOnce() public {
    vm.expectRevert("contract already initialized");
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

  function test_shouldHaveSetMembershipHistory() public {
    uint256 actual = validators.getMembershipHistoryLength();
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
}

contract ValidatorsTest_setCommissionUpdateDelay is ValidatorsTest {
  function test_shouldSetCommissionUpdateDelay() public {
    validators.setCommissionUpdateDelay(5);

    uint256 actual = validators.getCommissionUpdateDelay();
    assertEq(actual, 5, "Wrong commissionUpdateDelay.");
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
    assertEq(validators.getMembershipHistoryLength(), newLength);
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

contract ValidatorsTest_RegisterValidatorNoBls is ValidatorsTest {
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
    validators.registerValidatorNoBls(pubKey);
  }

  function test_Reverts_WhenDelagatingCELO() public {
    lockedGold.setAccountTotalDelegatedAmountInPercents(validator, 10);
    (uint8 v, bytes32 r, bytes32 s) = getParsedSignatureOfAddress(validator, signerPk);
    vm.prank(validator);
    accounts.authorizeValidatorSigner(signer, v, r, s);
    bytes memory pubKey = addressToPublicKey("random msg", v, r, s);

    vm.expectRevert("Cannot delegate governance power");
    vm.prank(validator);
    validators.registerValidatorNoBls(pubKey);
  }

  function test_ShouldMarkAccountAsValidator_WhenAccountHasAuthorizedValidatorSigner() public {
    _registerValidatorWithSignerHelper(validator, signer, signerPk);

    assertTrue(validators.isValidator(validator));
  }

  function test_ShouldAddAccountToValidatorList_WhenAccountHasAuthorizedValidatorSigner() public {
    address[] memory ExpectedRegisteredValidators = new address[](1);
    ExpectedRegisteredValidators[0] = validator;
    _registerValidatorWithSignerHelper(validator, signer, signerPk);
    assertEq(validators.getRegisteredValidators().length, ExpectedRegisteredValidators.length);
    assertEq(validators.getRegisteredValidators()[0], ExpectedRegisteredValidators[0]);
  }

  function test_ShouldSetValidatorEcdsaPublicKey_WhenAccountHasAuthorizedValidatorSigner() public {
    bytes memory _registeredEcdsaPubKey = _registerValidatorWithSignerHelper(
      validator,
      signer,
      signerPk
    );
    (bytes memory actualEcdsaPubKey, , , , ) = validators.getValidator(validator);

    assertEq(actualEcdsaPubKey, _registeredEcdsaPubKey);
  }

  function test_ShouldNotSetValidatorBlsPublicKey_WhenAccountHasAuthorizedValidatorSigner() public {
    _registerValidatorWithSignerHelper(validator, signer, signerPk);
    (, bytes memory actualBlsPubKey, , , ) = validators.getValidator(validator);

    assertEq(actualBlsPubKey, "");
  }

  function test_ShouldSetValidatorSigner_WhenAccountHasAuthorizedValidatorSigner() public {
    _registerValidatorWithSignerHelper(validator, signer, signerPk);
    (, , , , address ActualSigner) = validators.getValidator(validator);

    assertEq(ActualSigner, signer);
  }

  function test_ShouldSetLockGoldRequirements_WhenAccountHasAuthorizedValidatorSigner() public {
    _registerValidatorWithSignerHelper(validator, signer, signerPk);
    uint256 _lockedGoldReq = validators.getAccountLockedGoldRequirement(validator);

    assertEq(_lockedGoldReq, originalValidatorLockedGoldRequirements.value);
  }

  function test_ShouldSetValidatorMembershipHistory_WhenAccountHasAuthorizedValidatorSigner()
    public
  {
    _registerValidatorWithSignerHelper(validator, signer, signerPk);
    (uint256[] memory _epoch, address[] memory _membershipGroups, , ) = validators
      .getMembershipHistory(validator);

    uint256[] memory validatorRegistrationEpochNumberList = new uint256[](1);
    validatorRegistrationEpochNumberList[0] = validatorRegistrationEpochNumber;
    address[] memory expectedMembershipGroups = new address[](1);
    expectedMembershipGroups[0] = address(0);

    assertEq(_epoch, validatorRegistrationEpochNumberList);
    assertEq(_membershipGroups, expectedMembershipGroups);
  }

  function _performRegistrationNoBls() internal {
    (bytes memory _ecdsaPubKey, uint8 v, bytes32 r, bytes32 s) = _generateEcdsaPubKeyWithSigner(
      validator,
      signerPk
    );

    vm.prank(validator);
    accounts.authorizeValidatorSigner(signer, v, r, s);
    vm.prank(validator);
    validators.registerValidatorNoBls(_ecdsaPubKey);
  }

  function test_DoesNotEmit_ValidatorBlsPublicKeyUpdatedEvent() public {
    assertDoesNotEmit(_performRegistrationNoBls, "ValidatorBlsPublicKeyUpdated(address,bytes)");
  }

  function test_Emits_ValidatorRegisteredEvent() public {
    (bytes memory _ecdsaPubKey, uint8 v, bytes32 r, bytes32 s) = _generateEcdsaPubKeyWithSigner(
      validator,
      signerPk
    );

    vm.prank(validator);
    accounts.authorizeValidatorSigner(signer, v, r, s);

    vm.expectEmit(true, true, true, true);
    emit ValidatorRegistered(validator);

    vm.prank(validator);
    validators.registerValidatorNoBls(_ecdsaPubKey);
  }

  function test_Reverts_WhenAccountAlreadyRegisteredAsValidator() public {
    bytes memory _registeredEcdsaPubKey = _registerValidatorWithSignerHelper(
      validator,
      signer,
      signerPk
    );
    vm.prank(validator);
    vm.expectRevert("Already registered");
    validators.registerValidatorNoBls(_registeredEcdsaPubKey);
  }

  function test_Reverts_WhenAccountAlreadyRegisteredAsValidatorGroup() public {
    _registerValidatorGroupHelper(validator, 1);
    vm.prank(validator);
    vm.expectRevert("Already registered");
    validators.registerValidatorNoBls(
      abi.encodePacked(bytes32(0x0101010101010101010101010101010101010101010101010101010101010101))
    );
  }

  function test_Reverts_WhenAccountDoesNotMeetLockedGoldRequirements() public {
    lockedGold.setAccountTotalLockedGold(
      validator,
      originalValidatorLockedGoldRequirements.value.sub(11)
    );
    vm.expectRevert("Deposit too small");
    vm.prank(validator);
    validators.registerValidatorNoBls(
      abi.encodePacked(bytes32(0x0101010101010101010101010101010101010101010101010101010101010101))
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

  function _deregisterValidator(address _validator) internal {
    vm.prank(_validator);
    validators.deregisterValidator(INDEX);
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

  function _deregisterValidator(address _validator) internal {
    vm.prank(_validator);
    validators.deregisterValidator(INDEX);
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

    validatorAdditionEpochNumber = getEpochNumber();
    timeTravel(10);

    vm.prank(validator);
    validators.affiliate(otherGroup);
    validatorAffiliationEpochNumber = getEpochNumber();

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

  function test_ShouldSendValidatorPayment() public {
    vm.expectEmit(true, true, true, true);
    emit SendValidatorPaymentCalled(validator);
    vm.prank(validator);
    validators.affiliate(group);
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
    additionEpoch = getEpochNumber();

    vm.prank(validator);
    validators.deaffiliate();
    deaffiliationEpoch = getEpochNumber();

    (address[] memory members, , , , , , ) = validators.getValidatorGroup(group);
    assertEq(members, expectedMembersList);
  }

  function test_ShouldUpdateMembershipHisoryOfMember_WhenValidatorIsMemberOfAffiliatedGroup()
    public
  {
    vm.prank(group);
    validators.addFirstMember(validator, address(0), address(0));

    additionEpoch = getEpochNumber();

    timeTravel(10);

    vm.prank(validator);
    validators.deaffiliate();
    deaffiliationEpoch = getEpochNumber();

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

    additionEpoch = getEpochNumber();

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

  function test_ShouldSendValidatorPayment() public {
    vm.expectEmit(true, true, true, true);
    emit SendValidatorPaymentCalled(validator);
    vm.prank(validator);
    validators.deaffiliate();
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

  uint256[] expectedSizeHistory;

  function setUp() public {
    super.setUp();

    _registerValidatorGroupHelper(group, 1);

    _registerValidatorHelper(validator, validatorPk);
    _registrationEpoch = getEpochNumber();

    vm.prank(validator);
    validators.affiliate(group);

    timeTravel(10);
  }

  function test_ShouldAddMemberToTheList() public {
    address[] memory expectedMembersList = new address[](1);
    expectedMembersList[0] = validator;

    vm.prank(group);
    validators.addFirstMember(validator, address(0), address(0));
    _additionEpoch = getEpochNumber();

    (address[] memory members, , , , , , ) = validators.getValidatorGroup(group);

    assertEq(members, expectedMembersList);
  }

  function test_ShouldUpdateGroupSizeHistory() public {
    vm.prank(group);
    validators.addFirstMember(validator, address(0), address(0));
    _additionEpoch = getEpochNumber();

    (, , , , uint256[] memory _sizeHistory, , ) = validators.getValidatorGroup(group);

    assertEq(_sizeHistory.length, 1);
    assertEq(_sizeHistory[0], uint256(block.timestamp));
  }

  function test_ShouldUpdateMembershipHistoryOfMember() public {
    vm.prank(group);
    validators.addFirstMember(validator, address(0), address(0));
    _additionEpoch = getEpochNumber();

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
    _additionEpoch = getEpochNumber();
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
  uint256 _registrationEpoch;
  uint256 _additionEpoch;

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

  function test_ShouldUpdateMemberMembershipHistory() public {
    vm.prank(group);
    validators.removeMember(validator);
    uint256 _expectedEpoch = getEpochNumber();
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

contract ValidatorsTest_UpdateCommission_Setup is ValidatorsTest {}

contract ValidatorsTest_UpdateCommission is ValidatorsTest {
  uint256 newCommission = commission.unwrap().add(1);

  function setUp() public {
    super.setUp();

    _registerValidatorGroupHelper(group, 2);

    _registerValidatorHelper(validator, validatorPk);
    _registerValidatorHelper(otherValidator, otherValidatorPk);

    vm.prank(validator);
    validators.affiliate(group);
    (, , address _affiliation1, , ) = validators.getValidator(validator);

    vm.prank(otherValidator);
    validators.affiliate(group);
    (, , address _affiliation2, , ) = validators.getValidator(otherValidator);

    require(_affiliation1 == group, "Affiliation failed.");
    require(_affiliation2 == group, "Affiliation failed.");
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

  function test_Reverts_WhenNoCommissionHasBeenQueued() public {
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

  function test_ShouldSendMultipleValidatorPayments() public {
    vm.prank(group);
    validators.addFirstMember(validator, address(0), address(0));
    vm.prank(group);
    validators.addMember(otherValidator);
    vm.prank(group);
    validators.setNextCommissionUpdate(newCommission);
    blockTravel(commissionUpdateDelay);

    vm.expectEmit(true, true, true, true);
    emit SendValidatorPaymentCalled(validator);
    vm.expectEmit(true, true, true, true);
    emit SendValidatorPaymentCalled(otherValidator);
    vm.prank(group);
    validators.updateCommission();
  }
}

contract ValidatorsTest_UpdateMembershipHistory is ValidatorsTest {
  address[] public expectedMembershipHistoryGroups;
  uint256[] public expectedMembershipHistoryEpochs;

  address[] public actualMembershipHistoryGroups;
  uint256[] public actualMembershipHistoryEpochs;

  function setUp() public {
    super.setUp();
    _registerValidatorHelper(validator, validatorPk);

    _registerValidatorGroupHelper(group, 1);
    for (uint256 i = 1; i < groupLength; i++) {
      _registerValidatorGroupHelper(vm.addr(i), 1);
    }
  }

  function test_ShouldOverwritePreviousEntry_WhenChangingGroupsInSameEpoch() public {
    uint256 numTest = 10;

    expectedMembershipHistoryGroups.push(address(0));
    expectedMembershipHistoryEpochs.push(validatorRegistrationEpochNumber);

    for (uint256 i = 0; i < numTest; i++) {
      travelNEpoch(1);
      uint256 epochNumber = getEpochNumber();

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
      travelNEpoch(1);
      uint256 epochNumber = getEpochNumber();
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

contract ValidatorsTest_GetMembershipInLastEpoch_Setup is ValidatorsTest {
  function setUp() public {
    super.setUp();

    _registerValidatorHelper(validator, validatorPk);

    _registerValidatorGroupHelper(group, 1);
    for (uint256 i = 1; i < groupLength; i++) {
      _registerValidatorGroupHelper(vm.addr(i), 1);
    }
  }
}

contract ValidatorsTest_GetMembershipInLastEpoch is ValidatorsTest_GetMembershipInLastEpoch_Setup {
  function test_ShouldAlwaysReturnCorrectMembershipForLastEpoch_WhenChangingMoreTimesThanMembershipHistoryLength()
    public
  {
    for (uint256 i = 0; i < membershipHistoryLength.add(1); i++) {
      travelNEpoch(1);

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
}

contract ValidatorsTest_GetTopGroupValidators is ValidatorsTest {
  function setUp() public {
    super.setUp();

    _registerValidatorGroupWithMembersHavingSigners(group, 5);
  }

  function test_ShouldReturnTheSigner() public {
    address[] memory _validatorSigner = validators.getTopGroupValidators(group, 3);
    assertEq(_validatorSigner[0], accounts.getValidatorSigner(validator));
    assertEq(_validatorSigner[1], accounts.getValidatorSigner(vm.addr(1)));
    assertFalse(_validatorSigner[0] == validator);
  }
}

contract ValidatorsTest_GetTopGroupValidatorsAccounts is ValidatorsTest {
  function setUp() public {
    super.setUp();

    _registerValidatorGroupWithMembersHavingSigners(group, 5);
  }

  function test_ShouldReturnTheAccount() public {
    address[] memory validatorAccount = validators.getTopGroupValidatorsAccounts(group, 3);
    assertEq(validatorAccount[0], validator);
    assertEq(validatorAccount[1], vm.addr(1));
    assertFalse(validatorAccount[0] == accounts.getValidatorSigner(validator));
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

contract ValidatorsTest_MintStableToEpochManager is ValidatorsTest {
  function test_Reverts_WhenCalledByOtherThanEpochManager() public {
    vm.expectRevert("only registered contract");
    validators.mintStableToEpochManager(5);
  }

  function test_WhenMintAmountIsZero() public {
    vm.prank(address(epochManager));
    validators.mintStableToEpochManager(0);
  }

  function test_ShouldMintStableToEpochManager() public {
    vm.prank(address(epochManager));
    validators.mintStableToEpochManager(5);
    assertEq(stableToken.balanceOf(address(epochManager)), 5);
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

  function test_Reverts_WhenSenderNotApprovedAddress() public {
    vm.expectRevert("Only registered slasher can call");
    validators.forceDeaffiliateIfValidator(validator);
  }

  function test_ShouldSendValidatorPayment() public {
    vm.expectEmit(true, true, true, true);
    emit SendValidatorPaymentCalled(validator);
    vm.prank(paymentDelegatee);
    validators.forceDeaffiliateIfValidator(validator);
  }
}

contract ValidatorsTest_GroupMembershipInEpoch is ValidatorsTest {
  struct EpochInfo {
    uint256 epochNumber;
    address groupy;
  }

  uint256 totalEpochs = 24;
  uint256 gapSize = 3;
  uint256 contractIndex;

  EpochInfo[] public epochInfoList;

  function setUp() public {
    super.setUp();

    _registerValidatorHelper(validator, validatorPk);
    contractIndex = 1;
    for (uint256 i = 1; i < groupLength; i++) {
      _registerValidatorGroupHelper(vm.addr(i), 1);
    }

    // Start at 1 since we can't start with deaffiliate
    for (uint256 i = 1; i < totalEpochs; i++) {
      travelNL2Epoch(1);
      uint256 epochNumber = getEpochNumber();

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
    uint256 _epochNumber = getEpochNumber();
    vm.expectRevert("Epoch cannot be larger than current");
    validators.groupMembershipInEpoch(validator, _epochNumber.add(1), contractIndex);
  }

  function test_Reverts_WhenProvidedIndexGreaterThanIndexOnChain() public {
    uint256 _epochNumber = getEpochNumber();
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
}
