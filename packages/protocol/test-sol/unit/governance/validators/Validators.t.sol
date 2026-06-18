// SPDX-License-Identifier: UNLICENSED
pragma solidity >=0.8.7 <0.8.20;
pragma experimental ABIEncoderV2;

import "@celo-contracts/common/FixidityLib.sol";
import "@celo-contracts/common/interfaces/IOwnable.sol";
import { Vm } from "forge-std-8/Vm.sol";
import "@celo-contracts/common/interfaces/IAccountsTest.sol";
import "@celo-contracts-8/governance/Validators.sol";
import "@celo-contracts-8/stability/test/MockStableToken.sol";
import "@celo-contracts/governance/test/MockElection.sol";
import "@test-sol/unit/governance/validators/mocks/MockLockedGold08.sol";
import "@test-sol/utils/ECDSAHelper08.sol";
import { TestWithUtils08 } from "@test-sol/TestWithUtils08.sol";
import "@test-sol/unit/governance/validators/mocks/MockEpochManagerForMembershipHistory.sol";
import "@test-sol/unit/common/mocks/MockEpochManager.sol";

contract ValidatorsTest is ECDSAHelper08 {
  using FixidityLib for FixidityLib.Fraction;

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

  IAccountsTest accounts;
  MockStableToken08 stableToken;
  MockElection election;
  Validators public validators;
  MockLockedGold08 lockedGold;
  MockEpochManager public mockEpochManager;

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
  event ValidatorGroupVoterRewardCommissionUpdateQueued(
    address indexed group,
    uint256 commission,
    uint256 activationBlock
  );
  event ValidatorGroupVoterRewardCommissionUpdated(address indexed group, uint256 commission);
  event MaxVoterRewardCommissionSet(uint256 maxCommission);
  event ValidatorEpochPaymentDistributed(
    address indexed validator,
    uint256 validatorPayment,
    address indexed group,
    uint256 groupPayment
  );

  event SendValidatorPaymentCalled(address validator);

  function setUp() public virtual override {
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

    address accountsAddress = actor("Accounts");
    deployCodeTo("Accounts.sol", abi.encode(true), accountsAddress);
    accounts = IAccountsTest(accountsAddress);
    accounts.initialize(REGISTRY_ADDRESS);

    lockedGold = new MockLockedGold08();
    election = new MockElection();

    stableToken = new MockStableToken08();

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

    // Limit elected validators to 2 so _registerAndElectValidatorsForL2 only registers
    // actor("validator") and actor("otherValidator"), both of which are also registered above.
    // This avoids vm.addr(i) addresses being registered in accountsContract (TestWithUtils08's
    // Accounts) but not in ours, which would cause captureEpochAndValidators to fail.
    numberValidators = 2;
    whenL2WithEpochManagerInitialization();

    // Replace the real EpochManager_WithMocks with MockEpochManager so that
    // sendValidatorPayment emits SendValidatorPaymentCalled (test-observable) rather
    // than attempting real token transfers, and so epoch tracking remains controllable.
    // Initialize with epoch 3 / firstBlock 34560, matching what whenL2WithEpochManagerInitialization sets.
    address[] memory emptyElected = new address[](0);
    mockEpochManager = new MockEpochManager();
    mockEpochManager.initializeSystem(3, 34560, emptyElected);
    registry.setAddressFor(EpochManagerContract, address(mockEpochManager));
  }

  function deployAndInitValidatorsContract(address) public {
    validators = new Validators(true);
    registry.setAddressFor(ValidatorsContract, address(validators));

    Validators.InitParams memory vInitParams = Validators.InitParams({
      commissionUpdateDelay: commissionUpdateDelay
    });

    vm.prank(owner);
    validators.initialize(
      REGISTRY_ADDRESS,
      originalGroupLockedGoldRequirements.value,
      originalGroupLockedGoldRequirements.duration,
      originalValidatorLockedGoldRequirements.value,
      originalValidatorLockedGoldRequirements.duration,
      membershipHistoryLength,
      slashingMultiplierResetPeriod,
      maxGroupSize,
      vInitParams
    );
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
    bytes32 prefixedHash = toEthSignedMessageHash(addressHash);
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
      originalGroupLockedGoldRequirements.value * numMembers
    );

    vm.prank(_group);
    validators.registerValidatorGroup(commission.value);
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
        _max1(_uptime + _gracePeriod),
        FixidityLib.wrap(originalValidatorScoreParameters.exponent)
      );
  }

  function _max1(uint256 num) internal pure returns (FixidityLib.Fraction memory) {
    return num > FixidityLib.fixed1().value ? FixidityLib.fixed1() : FixidityLib.wrap(num);
  }

  function _safeExponent(
    FixidityLib.Fraction memory base,
    FixidityLib.Fraction memory exponent
  ) internal pure returns (uint256) {
    if (FixidityLib.equals(base, FixidityLib.newFixed(0))) return 0;
    if (FixidityLib.equals(exponent, FixidityLib.newFixed(0))) return FixidityLib.fixed1().value;

    FixidityLib.Fraction memory result = FixidityLib.fixed1();

    for (uint256 i = 0; i < exponent.value; i++) {
      if (FixidityLib.multiply(result, base).value < 1) revert("SafeExponent: Overflow");

      result = FixidityLib.multiply(result, base);
    }

    return result.value;
  }
  function containsLog(
    Vm.Log[] memory logs,
    string memory signatureString
  ) private pure returns (bool) {
    bytes32 signature = keccak256(abi.encodePacked(signatureString));
    for (uint256 i = 0; i < logs.length; i++) {
      if (logs[i].topics[0] == signature) {
        return true;
      }
    }
    return false;
  }

  function emitsLog(function() action, string memory signatureString) private returns (bool) {
    vm.recordLogs();
    action();
    Vm.Log[] memory entries = vm.getRecordedLogs();
    return containsLog(entries, signatureString);
  }

  function assertDoesNotEmit(function() action, string memory signatureString) internal {
    assertFalse(emitsLog(action, signatureString));
  }
}

contract ValidatorsTest_Initialize is ValidatorsTest {
  function setUp() public override {
    super.setUp();
    address newValidatorsContractAddress = actor("ValidatorsContract");
    deployAndInitValidatorsContract(newValidatorsContractAddress);
  }
  function test_ShouldhaveSetTheOwner() public {
    assertEq(IOwnable(address(validators)).owner(), owner, "Incorrect Owner.");
  }

  function test_Reverts_WhenCalledMoreThanOnce() public {
    Validators.InitParams memory vInitParams = Validators.InitParams({
      commissionUpdateDelay: commissionUpdateDelay
    });
    vm.expectRevert("contract already initialized");
    vm.prank(owner);
    validators.initialize(
      REGISTRY_ADDRESS,
      originalGroupLockedGoldRequirements.value,
      originalGroupLockedGoldRequirements.duration,
      originalValidatorLockedGoldRequirements.value,
      originalValidatorLockedGoldRequirements.duration,
      membershipHistoryLength,
      slashingMultiplierResetPeriod,
      maxGroupSize,
      vInitParams
    );
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

contract ValidatorsTest_ComputeEpochReward is ValidatorsTest {
  function test_returnsZero_WhenNotAValidator() public {
    assertEq(
      validators.computeEpochReward(nonValidator, 1e24, 150e18),
      0,
      "Should return zero reward for non-validator"
    );
  }
}

contract ValidatorsTest_SetMaxGroupSize is ValidatorsTest {
  uint256 newSize = maxGroupSize + 1;

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
  function setUp() public override {
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
      originalValidatorLockedGoldRequirements.value - 11
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

  function setUp() public override {
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

  function setUp() public override {
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
      originalValidatorLockedGoldRequirements.duration + 1
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
      originalValidatorLockedGoldRequirements.duration + 1
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
      originalValidatorLockedGoldRequirements.duration + 1
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
      originalValidatorLockedGoldRequirements.duration + 1
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
      originalValidatorLockedGoldRequirements.duration - 1
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

  function setUp() public override {
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
    lockedGold.setAccountTotalLockedGold(group, originalGroupLockedGoldRequirements.value - 11);

    vm.expectRevert("Group doesn't meet requirements");

    vm.prank(validator);
    validators.affiliate(group);
  }

  function test_Reverts_WhenValidatorDoesNotMeetLockedGoldrequirements() public {
    lockedGold.setAccountTotalLockedGold(
      validator,
      originalValidatorLockedGoldRequirements.value - 11
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

  function setUp() public override {
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

  function setUp() public override {
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

  function setUp() public override {
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
  function setUp() public override {
    super.setUp();
  }

  function test_Reverts_WhenVoteOverMaxNumberGroupsSetTrue() public {
    vm.prank(group);
    election.setAllowedToVoteOverMaxNumberOfGroups(group, true);
    lockedGold.setAccountTotalLockedGold(group, originalGroupLockedGoldRequirements.value);
    vm.expectRevert("Cannot vote for more than max number of groups");
    vm.prank(group);
    validators.registerValidatorGroup(commission.value);
  }

  function test_Reverts_WhenDelegatingCELO() public {
    lockedGold.setAccountTotalDelegatedAmountInPercents(group, 10);
    lockedGold.setAccountTotalLockedGold(group, originalGroupLockedGoldRequirements.value);
    vm.expectRevert("Cannot delegate governance power");
    vm.prank(group);
    validators.registerValidatorGroup(commission.value);
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

    assertEq(_commission, commission.value);
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
    emit ValidatorGroupRegistered(group, commission.value);
    vm.prank(group);
    validators.registerValidatorGroup(commission.value);
  }

  function test_Reverts_WhenAccountDoesNotMeetLockedGoldRequirements() public {
    lockedGold.setAccountTotalLockedGold(group, originalGroupLockedGoldRequirements.value - 11);
    vm.expectRevert("Not enough locked gold");
    vm.prank(group);
    validators.registerValidatorGroup(commission.value);
  }

  function test_Reverts_WhenTheAccountIsAlreadyRegisteredValidator() public {
    _registerValidatorHelper(validator, validatorPk);

    lockedGold.setAccountTotalLockedGold(validator, originalGroupLockedGoldRequirements.value - 11);
    vm.expectRevert("Already registered as validator");
    vm.prank(validator);
    validators.registerValidatorGroup(commission.value);
  }

  function test_Reverts_WhenTheAccountIsAlreadyRegisteredValidatorGroup() public {
    _registerValidatorGroupHelper(group, 1);

    lockedGold.setAccountTotalLockedGold(group, originalGroupLockedGoldRequirements.value - 11);
    vm.expectRevert("Already registered as group");
    vm.prank(group);
    validators.registerValidatorGroup(commission.value);
  }
}

contract ValidatorsTest_DeregisterValidatorGroup_WhenGroupHasNeverHadMembers is ValidatorsTest {
  uint256 public constant INDEX = 0;

  function setUp() public override {
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
    validators.deregisterValidatorGroup(INDEX + 1);
  }

  function test_Reverts_WhenAccountDoesNotHaveRegisteredValidatorGroup() public {
    vm.expectRevert("Not a validator group");

    vm.prank(nonValidator);
    validators.deregisterValidatorGroup(INDEX);
  }
}

contract ValidatorsTest_DeregisterValidatorGroup_WhenGroupHasHadMembers is ValidatorsTest {
  uint256 public constant INDEX = 0;

  function setUp() public override {
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
    _removeMemberAndTimeTravel(group, validator, originalGroupLockedGoldRequirements.duration + 1);

    vm.prank(group);
    validators.deregisterValidatorGroup(INDEX);

    assertFalse(validators.isValidatorGroup(group));
  }

  function test_ShouldRemoveAccountFromValidatorGroupList_WhenItHasBeenMoreThanGrouplockedGoldRequirementDuration()
    public
  {
    address[] memory ExpectedRegisteredValidatorGroups = new address[](0);

    _removeMemberAndTimeTravel(group, validator, originalGroupLockedGoldRequirements.duration + 1);
    vm.prank(group);
    validators.deregisterValidatorGroup(INDEX);
    assertEq(validators.getRegisteredValidatorGroups(), ExpectedRegisteredValidatorGroups);
  }

  function test_ShouldResetAccountBalanceRequirements_WhenItHasBeenMoreThanGrouplockedGoldRequirementDuration()
    public
  {
    _removeMemberAndTimeTravel(group, validator, originalGroupLockedGoldRequirements.duration + 1);

    vm.prank(group);
    validators.deregisterValidatorGroup(INDEX);
    assertEq(validators.getAccountLockedGoldRequirement(group), 0);
  }

  function test_Emits_ValidatorGroupDeregistered_WhenItHasBeenMoreThanGrouplockedGoldRequirementDuration()
    public
  {
    _removeMemberAndTimeTravel(group, validator, originalGroupLockedGoldRequirements.duration + 1);

    vm.expectEmit(true, true, true, true);
    emit ValidatorGroupDeregistered(group);
    vm.prank(group);
    validators.deregisterValidatorGroup(INDEX);
  }

  function test_Reverts_WhenItHasBeenLessThanGroupLockedGoldRequirementsDuration() public {
    _removeMemberAndTimeTravel(group, validator, originalGroupLockedGoldRequirements.duration - 1);

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

  function setUp() public override {
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
    assertEq(_epochs[expectedEntries - 1], _additionEpoch);
    assertEq(_membershipGroups.length, expectedEntries);
    assertEq(_membershipGroups[expectedEntries - 1], group);
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

    for (uint256 i = 2; i < maxGroupSize + 1; i++) {
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
        originalGroupLockedGoldRequirements.value * _numMembers
      );

      vm.prank(group);
      validators.addMember(_validator1);

      expectedSizeHistory.push(uint256(block.timestamp));

      (, , , , uint256[] memory _actualSizeHistory, , ) = validators.getValidatorGroup(group);

      assertEq(expectedSizeHistory, _actualSizeHistory);
      assertEq(expectedSizeHistory.length, _actualSizeHistory.length);

      uint256 requirement = validators.getAccountLockedGoldRequirement(group);

      assertEq(requirement, originalGroupLockedGoldRequirements.value * _numMembers);
    }
  }

  function test_Reverts_WhenValidatorDoesNotMeetLockedGoldRequirements() public {
    lockedGold.setAccountTotalLockedGold(
      validator,
      originalValidatorLockedGoldRequirements.value - 11
    );
    vm.expectRevert("Validator requirements not met");
    vm.prank(group);
    validators.addFirstMember(validator, address(0), address(0));
  }

  function test_Reverts_WhenGroupDoesNotHaveMember_WhenGroupDoesNotMeetLockedGoldRequirements()
    public
  {
    lockedGold.setAccountTotalLockedGold(group, originalGroupLockedGoldRequirements.value - 11);
    vm.expectRevert("Group requirements not met");
    vm.prank(group);
    validators.addFirstMember(validator, address(0), address(0));
  }

  function test_Reverts_WhenGroupAlreadyHasMember_WhenGroupDosNotMeetLockedGoldRequirements()
    public
  {
    lockedGold.setAccountTotalLockedGold(group, originalGroupLockedGoldRequirements.value * 2 - 11);
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

  function setUp() public override {
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
  function setUp() public override {
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
  uint256 newCommission = commission.value + 1;

  function setUp() public override {
    super.setUp();
    _registerValidatorGroupHelper(group, 1);
  }

  function test_ShouldNotSetValidatorGroupCommision() public {
    vm.prank(group);
    validators.setNextCommissionUpdate(newCommission);

    (, uint256 _commission, , , , , ) = validators.getValidatorGroup(group);

    assertEq(_commission, commission.value);
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
      commissionUpdateDelay + block.number
    );
    vm.prank(group);
    validators.setNextCommissionUpdate(newCommission);
  }

  function test_Reverts_WhenCommissionIsUnchanged() public {
    vm.expectRevert("Commission must be different");

    vm.prank(group);
    validators.setNextCommissionUpdate(commission.value);
  }

  function test_Reverts_WhenCommissionGreaterThan1() public {
    vm.expectRevert("Commission can't be greater than 100%");

    vm.prank(group);
    validators.setNextCommissionUpdate(FixidityLib.fixed1().value + 1);
  }
}

contract ValidatorsTest_UpdateCommission_Setup is ValidatorsTest {}

contract ValidatorsTest_UpdateCommission is ValidatorsTest {
  uint256 newCommission = commission.value + 1;

  function setUp() public override {
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

  function setUp() public override {
    super.setUp();

    // Replace EpochManager with a lightweight mock that computes epoch numbers
    // using the L1-precompile formula.  The real EpochManager_WithMocks never
    // advances currentEpochNumber without full epoch processing, so all blocks
    // would map to the same epoch and membership-history assertions would fail.
    MockEpochManagerForMembershipHistory mockEM = new MockEpochManagerForMembershipHistory();
    registry.setAddressFor(EpochManagerContract, address(mockEM));

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

    for (uint256 i = 0; i < membershipHistoryLength + 1; i++) {
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
  function setUp() public override {
    super.setUp();

    // Replace EpochManager with the L1-formula mock so that travelNEpoch(1) advances
    // the epoch visible to Validators, allowing getMembershipInLastEpoch to distinguish
    // the previous epoch from the current one.
    MockEpochManagerForMembershipHistory mockEM = new MockEpochManagerForMembershipHistory();
    registry.setAddressFor(EpochManagerContract, address(mockEM));

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
    for (uint256 i = 0; i < membershipHistoryLength + 1; i++) {
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
  function setUp() public override {
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
  function setUp() public override {
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

  function setUp() public override {
    super.setUp();

    _registerValidatorGroupHelper(group, 1);

    for (uint256 i = 1; i < numMembers + 1; i++) {
      _registerValidatorHelper(vm.addr(i), i);
      vm.prank(vm.addr(i));
      validators.affiliate(group);

      lockedGold.setAccountTotalLockedGold(group, originalGroupLockedGoldRequirements.value * i);

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
      assertEq(actualRequirements[i], originalGroupLockedGoldRequirements.value * (i + 1));
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
        originalGroupLockedGoldRequirements.value * (numMembers - i)
      );

      uint256 removalTimestamp = removalTimestamps[i];
      uint256 requirementExpiry = originalGroupLockedGoldRequirements.duration + removalTimestamp;

      uint256 currentTimestamp = uint256(block.timestamp);

      timeTravel(requirementExpiry - currentTimestamp + 1);
    }
  }
}

contract ValidatorsTest_MintStableToEpochManager is ValidatorsTest {
  function test_Reverts_WhenCalledByOtherThanEpochManager() public {
    vm.expectRevert("only registered contract");
    validators.mintStableToEpochManager(5);
  }

  function test_WhenMintAmountIsZero() public {
    vm.prank(address(mockEpochManager));
    validators.mintStableToEpochManager(0);
  }

  function test_ShouldMintStableToEpochManager() public {
    vm.prank(address(mockEpochManager));
    validators.mintStableToEpochManager(5);
    assertEq(stableToken.balanceOf(address(mockEpochManager)), 5);
  }
}

contract ValidatorsTest_ForceDeaffiliateIfValidator is ValidatorsTest {
  function setUp() public override {
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

  function setUp() public override {
    super.setUp();

    // Replace EpochManager with a lightweight mock that computes epoch numbers
    // using the L1-precompile formula so that each travelNL2Epoch(1) call yields
    // a distinct epoch number in both the Validators membership history and the
    // test assertions.
    MockEpochManagerForMembershipHistory mockEM = new MockEpochManagerForMembershipHistory();
    registry.setAddressFor(EpochManagerContract, address(mockEM));

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
        address _group = (i % (gapSize * gapSize)) != 0
          ? vm.addr((i / gapSize) % groupLength)
          : address(0);

        contractIndex += 1;

        epochInfoList.push(EpochInfo(epochNumber, _group));

        if (i % (gapSize * gapSize) != 0) {
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

      if (epochInfoList.length - i <= membershipHistoryLength) {
        assertEq(
          validators.groupMembershipInEpoch(
            validator,
            epochInfoList[i].epochNumber,
            uint256(1) + i
          ),
          _group
        );
      } else {
        vm.expectRevert("index out of bounds");
        validators.groupMembershipInEpoch(validator, epochInfoList[i].epochNumber, uint256(1) + i);
      }
    }
  }

  function test_Reverts_WhenEpochNumberAtGivenIndexIsGreaterThanProvidedEpochNumber() public {
    vm.expectRevert("index out of bounds");
    validators.groupMembershipInEpoch(
      validator,
      epochInfoList[epochInfoList.length - 2].epochNumber,
      contractIndex
    );
  }

  function test_Reverts_WhenEpochNumberFitsIntoDifferentIndexBucket() public {
    vm.expectRevert("provided index does not match provided epochNumber at index in history.");
    validators.groupMembershipInEpoch(
      validator,
      epochInfoList[epochInfoList.length - 1].epochNumber,
      contractIndex - 2
    );
  }

  function test_Reverts_WhenProvidedEpochNumberGreaterThanCurrentEpochNumber() public {
    uint256 _epochNumber = getEpochNumber();
    vm.expectRevert("Epoch cannot be larger than current");
    validators.groupMembershipInEpoch(validator, _epochNumber + 1, contractIndex);
  }

  function test_Reverts_WhenProvidedIndexGreaterThanIndexOnChain() public {
    uint256 _epochNumber = getEpochNumber();
    vm.expectRevert("index out of bounds");
    validators.groupMembershipInEpoch(validator, _epochNumber, contractIndex + 1);
  }

  function test_Reverts_WhenProvidedIndexIsLessThanTailIndexOnChain() public {
    vm.expectRevert("provided index does not match provided epochNumber at index in history.");
    validators.groupMembershipInEpoch(
      validator,
      epochInfoList[epochInfoList.length - membershipHistoryLength - 1].epochNumber,
      contractIndex - membershipHistoryLength
    );
  }
}

contract ValidatorsTest_HalveSlashingMultiplier is ValidatorsTest {
  function setUp() public override {
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

      assertEq(actualMultiplier, expectedMultiplier.value);
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
  function setUp() public override {
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
      initialMultiplier == FixidityLib.newFixedFraction(5, 10).value,
      "initialMultiplier is incorrect"
    );
  }

  function test_ShouldReturnToDefault_WhenSlashingMultiplierIsResetAfterResetPeriod() public {
    timeTravel(slashingMultiplierResetPeriod);

    vm.prank(group);
    validators.resetSlashingMultiplier();
    (, , , , , uint256 actualMultiplier, ) = validators.getValidatorGroup(group);
    assertEq(actualMultiplier, FixidityLib.fixed1().value);
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
    assertEq(actualMultiplier, FixidityLib.fixed1().value);
  }
}

contract ValidatorsTest_SetNextVoterRewardCommissionUpdate is ValidatorsTest {
  uint256 newVoterRewardCommission = FixidityLib.newFixedFraction(5, 100).value; // 5%

  function setUp() public override {
    super.setUp();
    _registerValidatorGroupHelper(group, 1);
    validators.setMaxVoterRewardCommission(FixidityLib.fixed1().value);
  }

  function test_ShouldNotSetVoterRewardCommissionImmediately() public {
    vm.prank(group);
    validators.setNextVoterRewardCommissionUpdate(newVoterRewardCommission);

    (uint256 _commission, , ) = validators.getVoterRewardCommission(group);
    assertEq(_commission, 0, "Voter reward commission should not be set immediately");
  }

  function test_ShouldSetNextVoterRewardCommission() public {
    vm.prank(group);
    validators.setNextVoterRewardCommissionUpdate(newVoterRewardCommission);

    (, uint256 _nextCommission, ) = validators.getVoterRewardCommission(group);
    assertEq(_nextCommission, newVoterRewardCommission);
  }

  function test_ShouldSetNextVoterRewardCommissionBlock() public {
    vm.prank(group);
    validators.setNextVoterRewardCommissionUpdate(newVoterRewardCommission);

    (, , uint256 _nextBlock) = validators.getVoterRewardCommission(group);
    assertEq(_nextBlock, commissionUpdateDelay + block.number);
  }

  function test_Emits_VoterRewardCommissionUpdateQueuedEvent() public {
    vm.expectEmit(true, true, true, true);
    emit ValidatorGroupVoterRewardCommissionUpdateQueued(
      group,
      newVoterRewardCommission,
      commissionUpdateDelay + block.number
    );
    vm.prank(group);
    validators.setNextVoterRewardCommissionUpdate(newVoterRewardCommission);
  }

  function test_Reverts_WhenCommissionIsUnchanged() public {
    vm.expectRevert("Voter reward commission must be different");
    vm.prank(group);
    validators.setNextVoterRewardCommissionUpdate(0); // default is 0
  }

  function test_Reverts_WhenCommissionGreaterThan100Percent() public {
    vm.expectRevert("Voter reward commission can't be greater than 100%");
    vm.prank(group);
    validators.setNextVoterRewardCommissionUpdate(FixidityLib.fixed1().value + 1);
  }

  function test_Reverts_WhenNotValidatorGroup() public {
    vm.expectRevert("Not a validator group");
    vm.prank(validator);
    validators.setNextVoterRewardCommissionUpdate(newVoterRewardCommission);
  }

  function test_Reverts_WhenCommissionExceedsMax() public {
    uint256 maxCommission = FixidityLib.newFixedFraction(2, 100).value; // 2%
    validators.setMaxVoterRewardCommission(maxCommission);

    vm.expectRevert("Voter reward commission exceeds max allowed");
    vm.prank(group);
    validators.setNextVoterRewardCommissionUpdate(newVoterRewardCommission); // 5% > 2%
  }

  function test_ShouldAllowCommissionAtMax() public {
    uint256 maxCommission = FixidityLib.newFixedFraction(5, 100).value; // 5%
    validators.setMaxVoterRewardCommission(maxCommission);

    vm.prank(group);
    validators.setNextVoterRewardCommissionUpdate(newVoterRewardCommission); // 5% == 5%

    (, uint256 _nextCommission, ) = validators.getVoterRewardCommission(group);
    assertEq(_nextCommission, newVoterRewardCommission);
  }

  function test_ShouldAllowExactly100PercentCommission() public {
    uint256 fullCommission = FixidityLib.fixed1().value; // 100%
    vm.prank(group);
    validators.setNextVoterRewardCommissionUpdate(fullCommission);

    (, uint256 _nextCommission, ) = validators.getVoterRewardCommission(group);
    assertEq(_nextCommission, fullCommission);
  }

  function test_ShouldOverwritePreviouslyQueuedUpdate() public {
    uint256 firstCommission = FixidityLib.newFixedFraction(5, 100).value; // 5%
    uint256 secondCommission = FixidityLib.newFixedFraction(10, 100).value; // 10%

    vm.prank(group);
    validators.setNextVoterRewardCommissionUpdate(firstCommission);

    vm.prank(group);
    validators.setNextVoterRewardCommissionUpdate(secondCommission);

    (, uint256 _nextCommission, ) = validators.getVoterRewardCommission(group);
    assertEq(_nextCommission, secondCommission, "Should overwrite with second value");
  }

  function test_Reverts_WhenRequeuingSameQueuedValue() public {
    uint256 commission = FixidityLib.newFixedFraction(5, 100).value; // 5%
    vm.prank(group);
    validators.setNextVoterRewardCommissionUpdate(commission);

    // Re-queuing the same pending value is a no-op and must revert.
    vm.expectRevert("Voter reward commission must be different");
    vm.prank(group);
    validators.setNextVoterRewardCommissionUpdate(commission);
  }

  // A stale non-zero queued value must be clearable to 0 even when the active commission
  // is already 0 and the cap has been lowered to 0.
  function test_ShouldClearStaleQueuedValueToZero_WhenActiveAndCapAreZero() public {
    uint256 maxCap = FixidityLib.newFixedFraction(20, 100).value; // 20%
    validators.setMaxVoterRewardCommission(maxCap);

    // Queue 5% while active commission is still 0.
    uint256 commission = FixidityLib.newFixedFraction(5, 100).value;
    vm.prank(group);
    validators.setNextVoterRewardCommissionUpdate(commission);

    // Governance disables commissions entirely.
    validators.setMaxVoterRewardCommission(0);

    // Group clears its stale queued 5% back to 0 (only 0 is allowed under a 0 cap).
    vm.prank(group);
    validators.setNextVoterRewardCommissionUpdate(0);

    (, uint256 _nextCommission, ) = validators.getVoterRewardCommission(group);
    assertEq(_nextCommission, 0, "Stale queued value should be cleared to 0");
  }
}

contract ValidatorsTest_UpdateVoterRewardCommission is ValidatorsTest {
  uint256 newVoterRewardCommission = FixidityLib.newFixedFraction(5, 100).value; // 5%

  function setUp() public override {
    super.setUp();
    _registerValidatorGroupHelper(group, 1);
    validators.setMaxVoterRewardCommission(FixidityLib.fixed1().value);
  }

  function test_ShouldSetVoterRewardCommission() public {
    vm.prank(group);
    validators.setNextVoterRewardCommissionUpdate(newVoterRewardCommission);

    blockTravel(commissionUpdateDelay);

    vm.prank(group);
    validators.updateVoterRewardCommission();

    (uint256 _commission, , ) = validators.getVoterRewardCommission(group);
    assertEq(_commission, newVoterRewardCommission);
  }

  function test_Emits_VoterRewardCommissionUpdatedEvent() public {
    vm.prank(group);
    validators.setNextVoterRewardCommissionUpdate(newVoterRewardCommission);

    blockTravel(commissionUpdateDelay);

    vm.expectEmit(true, true, true, true);
    emit ValidatorGroupVoterRewardCommissionUpdated(group, newVoterRewardCommission);

    vm.prank(group);
    validators.updateVoterRewardCommission();
  }

  function test_Reverts_WhenDelayNotPassed() public {
    vm.prank(group);
    validators.setNextVoterRewardCommissionUpdate(newVoterRewardCommission);

    vm.expectRevert("Can't apply voter reward commission update yet");
    vm.prank(group);
    validators.updateVoterRewardCommission();
  }

  function test_Reverts_WhenNoUpdateQueued() public {
    vm.expectRevert("No voter reward commission update queued");
    vm.prank(group);
    validators.updateVoterRewardCommission();
  }

  function test_Reverts_WhenApplyingAlreadyAppliedUpdate() public {
    vm.prank(group);
    validators.setNextVoterRewardCommissionUpdate(newVoterRewardCommission);
    blockTravel(commissionUpdateDelay);

    vm.prank(group);
    validators.updateVoterRewardCommission();

    vm.expectRevert("No voter reward commission update queued");
    vm.prank(group);
    validators.updateVoterRewardCommission();
  }

  function test_ClearsPendingValuesAfterUpdate() public {
    vm.prank(group);
    validators.setNextVoterRewardCommissionUpdate(newVoterRewardCommission);

    blockTravel(commissionUpdateDelay);

    vm.prank(group);
    validators.updateVoterRewardCommission();

    (, uint256 _next, uint256 _block) = validators.getVoterRewardCommission(group);
    assertEq(_next, 0, "Next commission should be cleared");
    assertEq(_block, 0, "Next block should be cleared");
  }

  function test_Reverts_WhenNotValidatorGroup() public {
    vm.expectRevert("Not a validator group");
    vm.prank(validator);
    validators.updateVoterRewardCommission();
  }

  function test_Reverts_WhenMaxCapLoweredAfterQueue() public {
    uint256 maxCap = FixidityLib.newFixedFraction(20, 100).value; // 20%
    validators.setMaxVoterRewardCommission(maxCap);

    // Queue 15% — valid at queue time (below 20% cap)
    uint256 commission = FixidityLib.newFixedFraction(15, 100).value;
    vm.prank(group);
    validators.setNextVoterRewardCommissionUpdate(commission);

    // Governance lowers cap to 10%
    uint256 newMaxCap = FixidityLib.newFixedFraction(10, 100).value;
    validators.setMaxVoterRewardCommission(newMaxCap);

    blockTravel(commissionUpdateDelay);

    // Activation should revert because queued 15% exceeds new 10% cap
    vm.expectRevert("Voter reward commission exceeds max allowed");
    vm.prank(group);
    validators.updateVoterRewardCommission();
  }

  function test_ShouldActivate_WhenQueuedValueStillBelowLoweredCap() public {
    uint256 maxCap = FixidityLib.newFixedFraction(20, 100).value; // 20%
    validators.setMaxVoterRewardCommission(maxCap);

    // Queue 5% — valid at queue time
    uint256 commission = FixidityLib.newFixedFraction(5, 100).value;
    vm.prank(group);
    validators.setNextVoterRewardCommissionUpdate(commission);

    // Governance lowers cap to 10%
    uint256 newMaxCap = FixidityLib.newFixedFraction(10, 100).value;
    validators.setMaxVoterRewardCommission(newMaxCap);

    blockTravel(commissionUpdateDelay);

    // Activation should succeed because queued 5% is still below new 10% cap
    vm.prank(group);
    validators.updateVoterRewardCommission();

    (uint256 _commission, , ) = validators.getVoterRewardCommission(group);
    assertEq(_commission, commission);
  }

  // A matured-but-unactivated queued update must not revive after governance lowers the
  // cap (e.g. to 0) and later restores it. It must be re-queued.
  function test_Reverts_WhenCapReducedAfterMaturityThenRestored() public {
    uint256 commission = FixidityLib.newFixedFraction(5, 100).value; // 5%
    vm.prank(group);
    validators.setNextVoterRewardCommissionUpdate(commission);

    // The update matures.
    blockTravel(commissionUpdateDelay);

    // Governance disables commissions, then restores the cap.
    validators.setMaxVoterRewardCommission(0);
    validators.setMaxVoterRewardCommission(FixidityLib.fixed1().value);

    // The stale matured update must not auto-activate; it requires re-queueing.
    vm.expectRevert("Voter reward commission cap reduced since queued; re-queue required");
    vm.prank(group);
    validators.updateVoterRewardCommission();
  }

  function test_ShouldActivate_WhenRequeuedAfterCapReduction() public {
    uint256 commission = FixidityLib.newFixedFraction(5, 100).value; // 5%
    vm.prank(group);
    validators.setNextVoterRewardCommissionUpdate(commission);
    blockTravel(commissionUpdateDelay);

    // Cap reduced then restored, invalidating the matured queue.
    validators.setMaxVoterRewardCommission(0);
    validators.setMaxVoterRewardCommission(FixidityLib.fixed1().value);

    // Re-queue with a fresh delay after the last reduction. The no-op guard in
    // setNextVoterRewardCommissionUpdate compares against the (now invalidated) queued
    // value, so the re-queue must differ from it; re-queuing the identical 5% in one step
    // is not currently supported. See known limitation tracked in follow-up.
    uint256 requeuedCommission = FixidityLib.newFixedFraction(6, 100).value; // 6%
    vm.prank(group);
    validators.setNextVoterRewardCommissionUpdate(requeuedCommission);
    blockTravel(commissionUpdateDelay);

    vm.prank(group);
    validators.updateVoterRewardCommission();

    (uint256 _commission, , ) = validators.getVoterRewardCommission(group);
    assertEq(_commission, requeuedCommission, "Re-queued update should activate");
  }

  function test_Reverts_WhenEpochProcessingStarted() public {
    vm.prank(group);
    validators.setNextVoterRewardCommissionUpdate(newVoterRewardCommission);
    blockTravel(commissionUpdateDelay);

    vm.mockCall(
      address(mockEpochManager),
      abi.encodeWithSignature("isEpochProcessingStarted()"),
      abi.encode(true)
    );

    vm.expectRevert("Cannot update voter reward commission during epoch processing");
    vm.prank(group);
    validators.updateVoterRewardCommission();
  }
}

contract ValidatorsTest_SetMaxVoterRewardCommission is ValidatorsTest {
  function setUp() public override {
    super.setUp();
  }

  function test_ShouldSetMaxVoterRewardCommission() public {
    uint256 maxCommission = FixidityLib.newFixedFraction(20, 100).value; // 20%
    validators.setMaxVoterRewardCommission(maxCommission);
    assertEq(validators.maxVoterRewardCommission(), maxCommission);
  }

  function test_Emits_MaxVoterRewardCommissionSetEvent() public {
    uint256 maxCommission = FixidityLib.newFixedFraction(20, 100).value;
    vm.expectEmit(true, true, true, true);
    emit MaxVoterRewardCommissionSet(maxCommission);
    validators.setMaxVoterRewardCommission(maxCommission);
  }

  function test_Reverts_WhenNotOwner() public {
    uint256 maxCommission = FixidityLib.newFixedFraction(20, 100).value;
    vm.expectRevert("Ownable: caller is not the owner");
    vm.prank(group);
    validators.setMaxVoterRewardCommission(maxCommission);
  }

  function test_Reverts_WhenGreaterThan100Percent() public {
    vm.expectRevert("Max voter reward commission can't be greater than 100%");
    validators.setMaxVoterRewardCommission(FixidityLib.fixed1().value + 1);
  }

  function test_Reverts_WhenUnchanged() public {
    vm.expectRevert("Max voter reward commission not changed");
    validators.setMaxVoterRewardCommission(0); // default is 0
  }

  function test_ShouldAllow100PercentMax() public {
    uint256 fullMax = FixidityLib.fixed1().value; // 100%
    validators.setMaxVoterRewardCommission(fullMax);
    assertEq(validators.maxVoterRewardCommission(), fullMax);
  }

  function test_Reverts_WhenEpochProcessingStarted() public {
    vm.mockCall(
      address(mockEpochManager),
      abi.encodeWithSignature("isEpochProcessingStarted()"),
      abi.encode(true)
    );
    uint256 maxCommission = FixidityLib.newFixedFraction(20, 100).value;
    vm.expectRevert("Cannot update max voter reward commission during epoch processing");
    validators.setMaxVoterRewardCommission(maxCommission);
  }

  function test_ShouldRecordReductionBlock_OnlyOnReduction() public {
    // Raising from 0 to 20% is not a reduction.
    validators.setMaxVoterRewardCommission(FixidityLib.newFixedFraction(20, 100).value);
    assertEq(validators.maxVoterRewardCommissionLastReducedBlock(), 0, "Raise must not record");

    // Lowering to 10% records the current block.
    blockTravel(5);
    validators.setMaxVoterRewardCommission(FixidityLib.newFixedFraction(10, 100).value);
    assertEq(
      validators.maxVoterRewardCommissionLastReducedBlock(),
      block.number,
      "Reduction must record block"
    );

    // Raising again leaves the recorded reduction block unchanged.
    uint256 recorded = validators.maxVoterRewardCommissionLastReducedBlock();
    blockTravel(5);
    validators.setMaxVoterRewardCommission(FixidityLib.newFixedFraction(30, 100).value);
    assertEq(
      validators.maxVoterRewardCommissionLastReducedBlock(),
      recorded,
      "Raise must not overwrite reduction block"
    );
  }
}

contract ValidatorsTest_GetVoterRewardCommission is ValidatorsTest {
  function setUp() public override {
    super.setUp();
    _registerValidatorGroupHelper(group, 1);
    validators.setMaxVoterRewardCommission(FixidityLib.fixed1().value);
  }

  function test_ShouldReturnZeroByDefault() public {
    (uint256 _commission, uint256 _next, uint256 _block) = validators.getVoterRewardCommission(
      group
    );
    assertEq(_commission, 0);
    assertEq(_next, 0);
    assertEq(_block, 0);
  }

  function test_ShouldReturnCorrectValues() public {
    uint256 newCommission = FixidityLib.newFixedFraction(10, 100).value; // 10%

    vm.prank(group);
    validators.setNextVoterRewardCommissionUpdate(newCommission);
    blockTravel(commissionUpdateDelay);
    vm.prank(group);
    validators.updateVoterRewardCommission();

    (uint256 _commission, , ) = validators.getVoterRewardCommission(group);
    assertEq(_commission, newCommission);
  }

  function test_Reverts_WhenNotValidatorGroup() public {
    vm.expectRevert("Not a validator group");
    validators.getVoterRewardCommission(validator);
  }

  function test_ShouldReturnPendingValuesBeforeActivation() public {
    uint256 newCommission = FixidityLib.newFixedFraction(10, 100).value; // 10%

    vm.prank(group);
    validators.setNextVoterRewardCommissionUpdate(newCommission);

    (uint256 _commission, uint256 _next, uint256 _block) = validators.getVoterRewardCommission(
      group
    );
    assertEq(_commission, 0, "Current commission should still be 0");
    assertEq(_next, newCommission, "Next commission should be set");
    assertGt(_block, block.number, "Activation block should be in the future");
  }
}

contract ValidatorsTest_VoterRewardCommission_Fuzz is ValidatorsTest {
  using FixidityLib for FixidityLib.Fraction;

  function setUp() public override {
    super.setUp();
    _registerValidatorGroupHelper(group, 1);
    validators.setMaxVoterRewardCommission(FixidityLib.fixed1().value);
  }

  /// @notice Any commission in (0, fixed1()] should be queueable.
  function test_ShouldQueueAnyValidCommission(uint256 commission) public {
    commission = bound(commission, 1, FixidityLib.fixed1().value);

    vm.prank(group);
    validators.setNextVoterRewardCommissionUpdate(commission);

    (, uint256 _nextCommission, uint256 _nextBlock) = validators.getVoterRewardCommission(group);
    assertEq(_nextCommission, commission, "Queued commission should match input");
    assertEq(
      _nextBlock,
      commissionUpdateDelay + block.number,
      "Activation block should be block.number + delay"
    );
  }

  /// @notice Any commission in (0, fixed1()] should survive the full queue + activate cycle.
  function test_ShouldQueueAndActivateAnyValidCommission(uint256 commission) public {
    commission = bound(commission, 1, FixidityLib.fixed1().value);

    vm.prank(group);
    validators.setNextVoterRewardCommissionUpdate(commission);

    blockTravel(commissionUpdateDelay);

    vm.prank(group);
    validators.updateVoterRewardCommission();

    (uint256 _commission, uint256 _next, uint256 _block) = validators.getVoterRewardCommission(
      group
    );
    assertEq(_commission, commission, "Active commission should match queued value");
    assertEq(_next, 0, "Pending commission should be cleared");
    assertEq(_block, 0, "Pending block should be cleared");
  }

  /// @notice Any commission above maxVoterRewardCommission should revert at queue time.
  function test_ShouldRevertForAnyCommissionAboveMax(uint256 commission, uint256 maxCap) public {
    maxCap = bound(maxCap, 1, FixidityLib.fixed1().value - 1);
    commission = bound(commission, maxCap + 1, FixidityLib.fixed1().value);

    validators.setMaxVoterRewardCommission(maxCap);

    vm.expectRevert("Voter reward commission exceeds max allowed");
    vm.prank(group);
    validators.setNextVoterRewardCommissionUpdate(commission);
  }

  /// @notice Any commission at or below maxVoterRewardCommission should succeed.
  function test_ShouldAcceptAnyCommissionAtOrBelowMax(uint256 commission, uint256 maxCap) public {
    maxCap = bound(maxCap, 1, FixidityLib.fixed1().value);
    commission = bound(commission, 1, maxCap);
    vm.assume(maxCap != validators.maxVoterRewardCommission());

    validators.setMaxVoterRewardCommission(maxCap);

    vm.prank(group);
    validators.setNextVoterRewardCommissionUpdate(commission);

    (, uint256 _nextCommission, ) = validators.getVoterRewardCommission(group);
    assertEq(_nextCommission, commission, "Commission at or below max should be queued");
  }

  /// @notice When governance lowers the cap after queuing, activation should revert
  /// if the queued value exceeds the new cap.
  function test_ShouldRevertActivationWhenCapLoweredBelowQueued(
    uint256 commission,
    uint256 initialCap,
    uint256 newCap
  ) public {
    // Set up: initialCap >= commission > newCap > 0
    initialCap = bound(initialCap, 3, FixidityLib.fixed1().value);
    commission = bound(commission, 2, initialCap);
    newCap = bound(newCap, 1, commission - 1);
    // Skip when initialCap matches the current value; the contract rejects no-op changes.
    vm.assume(initialCap != validators.maxVoterRewardCommission());

    validators.setMaxVoterRewardCommission(initialCap);

    vm.prank(group);
    validators.setNextVoterRewardCommissionUpdate(commission);

    // Governance lowers cap
    validators.setMaxVoterRewardCommission(newCap);

    blockTravel(commissionUpdateDelay);

    vm.expectRevert("Voter reward commission exceeds max allowed");
    vm.prank(group);
    validators.updateVoterRewardCommission();
  }

  /// @notice Any commission above fixed1() should always revert (regardless of max cap).
  function test_ShouldRevertForAnyCommissionAbove100Percent(uint256 commission) public {
    commission = bound(commission, FixidityLib.fixed1().value + 1, type(uint256).max);

    vm.expectRevert("Voter reward commission can't be greater than 100%");
    vm.prank(group);
    validators.setNextVoterRewardCommissionUpdate(commission);
  }

  /// @notice Max voter reward commission can be set to any value in [1, fixed1()] that
  /// differs from the current value (the contract rejects no-op changes).
  function test_ShouldSetAnyValidMaxVoterRewardCommission(uint256 maxCommission) public {
    maxCommission = bound(maxCommission, 1, FixidityLib.fixed1().value);
    // Skip the degenerate case where the fuzz input equals the current value;
    // the contract explicitly rejects no-op changes.
    vm.assume(maxCommission != validators.maxVoterRewardCommission());

    validators.setMaxVoterRewardCommission(maxCommission);
    assertEq(
      validators.maxVoterRewardCommission(),
      maxCommission,
      "Max commission should match input"
    );
  }
}
