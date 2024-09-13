// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.5.13;
pragma experimental ABIEncoderV2;

import "celo-foundry/Test.sol";

import "openzeppelin-solidity/contracts/math/SafeMath.sol";
import "@celo-contracts/common/FixidityLib.sol";
import "@celo-contracts/common/Registry.sol";
import "@celo-contracts/common/Accounts.sol";
import "@celo-contracts/common/GoldToken.sol";

import "@celo-contracts/governance/Election.sol";
import "@celo-contracts/governance/LockedGold.sol";
import "@celo-contracts/governance/ReleaseGold.sol";

import "@celo-contracts/stability/test/MockStableToken.sol";
import "@celo-contracts/governance/Election.sol";
import "@celo-contracts/governance/Governance.sol";

import "@celo-contracts/governance/test/ValidatorsMock.sol";
import "@test-sol/constants.sol";
import "@test-sol/utils/ECDSAHelper.sol";
import { Utils } from "@test-sol/utils.sol";
import { Test as ForgeTest } from "forge-std/Test.sol";
import "@test-sol/unit/governance/validators/mocks/ValidatorsMockTunnel.sol";
import "@test-sol/unit/governance/voting/mocks/ReleaseGoldMockTunnel.sol";

contract RevokeCeloAfterL2Transition is Test, Constants, ECDSAHelper, Utils {
  using FixidityLib for FixidityLib.Fraction;

  address constant proxyAdminAddress = 0x4200000000000000000000000000000000000018;
  uint256 constant TOTAL_AMOUNT = 1 ether * 1_000_000;

  Registry registry;
  Accounts accounts;
  MockStableToken stableToken;
  Election election;
  ValidatorsMockTunnel public validatorsMockTunnel;
  Validators public validators;
  LockedGold lockedGold;
  Governance governance;
  GoldToken goldToken;
  ReleaseGold releaseGold;

  address owner;
  address accApprover;

  address group;
  address member;
  address validator;
  uint256 validatorPk;
  address beneficiary;
  address refundAddress;
  address releaseOwner;

  address authorizedValidatorSigner;
  uint256 authorizedValidatorSignerPK;
  address authorizedVoteSigner;
  uint256 authorizedVoteSignerPK;
  address authorizedValidatorSigner2;
  uint256 authorizedValidatorSignerPK2;
  address authorizedVoteSigner2;
  uint256 authorizedVoteSignerPK2;

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

  uint256 constant DEPOSIT = 5;
  uint256 constant VOTER_GOLD = 100;
  uint256 constant REFERENDUM_STAGE_DURATION = 5 * 60;
  uint256 constant CONCURRENT_PROPOSALS = 1;
  uint256 constant DEQUEUE_FREQUENCY = 10 * 60;
  uint256 constant QUERY_EXPIRY = 60 * 60;
  uint256 constant EXECUTION_STAGE_DURATION = 1 * 60;

  uint256 unlockingPeriod;

  FixidityLib.Fraction public commission = FixidityLib.newFixedFraction(1, 100);

  ValidatorLockedGoldRequirements public originalValidatorLockedGoldRequirements;
  GroupLockedGoldRequirements public originalGroupLockedGoldRequirements;
  ValidatorScoreParameters public originalValidatorScoreParameters;

  uint256 expectedParticipationBaseline;
  FixidityLib.Fraction baselineUpdateFactor;
  FixidityLib.Fraction participationBaseline;
  FixidityLib.Fraction participationFloor;
  FixidityLib.Fraction baselineQuorumFactor;

  ValidatorsMockTunnel.InitParams public initParams;
  ValidatorsMockTunnel.InitParams2 public initParams2;

  ReleaseGoldMockTunnel.InitParams releaseGoldInitParams;
  ReleaseGoldMockTunnel.InitParams2 releaseGoldInitParams2;

  uint256 validatorRegistrationEpochNumber;

  function setUp() public {
    ph.setEpochSize(DAY / 5);
    owner = address(this);
    accApprover = actor("approver");
    group = actor("group");
    member = actor("member");
    beneficiary = actor("beneficiary");
    refundAddress = actor("refundAddress");
    releaseOwner = actor("releaseOwner");

    (validator, validatorPk) = actorWithPK("validator");
    (authorizedValidatorSigner, authorizedValidatorSignerPK) = actorWithPK(
      "authorizedValidatorSigner"
    );
    (authorizedVoteSigner, authorizedVoteSignerPK) = actorWithPK("authorizedVoteSigner");
    (authorizedValidatorSigner2, authorizedValidatorSignerPK2) = actorWithPK(
      "authorizedValidatorSigner2"
    );
    (authorizedVoteSigner2, authorizedVoteSignerPK2) = actorWithPK("authorizedVoteSigner2");

    uint256 electableValidatorsMin = 4;
    uint256 electableValidatorsMax = 6;
    uint256 maxNumGroupsVotedFor = 3;
    uint256 electabilityThreshold = FixidityLib.newFixedFraction(1, 100).unwrap();

    unlockingPeriod = 3 * DAY;

    uint256 slashingMultiplierResetPeriod = 30 * DAY;
    uint256 membershipHistoryLength = 5;
    uint256 maxGroupSize = 5;
    uint256 commissionUpdateDelay = 3;
    uint256 downtimeGracePeriod = 0;

    baselineUpdateFactor = FixidityLib.newFixedFraction(1, 5);
    participationBaseline = FixidityLib.newFixedFraction(5, 10);
    participationFloor = FixidityLib.newFixedFraction(5, 100);
    baselineQuorumFactor = FixidityLib.fixed1();
    expectedParticipationBaseline = FixidityLib
      .multiply(baselineUpdateFactor, FixidityLib.fixed1())
      .add(
        FixidityLib.multiply(
          FixidityLib.fixed1().subtract(baselineUpdateFactor),
          participationBaseline
        )
      )
      .unwrap();

    address registryAddress = 0x000000000000000000000000000000000000ce10;
    deployCodeTo("Registry.sol", abi.encode(false), registryAddress);
    registry = Registry(registryAddress);

    accounts = new Accounts(true);
    stableToken = new MockStableToken();
    election = new Election(true);
    lockedGold = new LockedGold(true);
    validators = new Validators(true);
    validatorsMockTunnel = new ValidatorsMockTunnel(address(validators));
    governance = new Governance(true);
    goldToken = new GoldToken(true);
    releaseGold = new ReleaseGold(true);

    registry.setAddressFor(AccountsContract, address(accounts));
    registry.setAddressFor(ElectionContract, address(election));
    registry.setAddressFor(StableTokenContract, address(stableToken));
    registry.setAddressFor(LockedGoldContract, address(lockedGold));
    registry.setAddressFor(ValidatorsContract, address(validators));
    registry.setAddressFor(GovernanceContract, address(governance));
    registry.setAddressFor(GoldTokenContract, address(goldToken));

    goldToken.initialize(address(registry));

    accounts.initialize(registryAddress);

    releaseGold = new ReleaseGold(true);

    releaseGoldInitParams = ReleaseGoldMockTunnel.InitParams({
      releaseStartTime: block.timestamp + 5 * MINUTE,
      releaseCliffTime: HOUR,
      numReleasePeriods: 4,
      releasePeriod: 3 * MONTH,
      amountReleasedPerPeriod: TOTAL_AMOUNT / 4,
      revocable: false,
      _beneficiary: address(uint160(beneficiary))
    });

    releaseGoldInitParams2 = ReleaseGoldMockTunnel.InitParams2({
      _releaseOwner: releaseOwner,
      _refundAddress: address(0),
      subjectToLiquidityProvision: false,
      initialDistributionRatio: 1000,
      _canValidate: true,
      _canVote: true,
      registryAddress: registryAddress
    });

    ReleaseGoldMockTunnel tunnel = new ReleaseGoldMockTunnel(address(releaseGold));
    tunnel.MockInitialize(owner, releaseGoldInitParams, releaseGoldInitParams2);

    election.initialize(
      registryAddress,
      electableValidatorsMin,
      electableValidatorsMax,
      maxNumGroupsVotedFor,
      electabilityThreshold
    );

    lockedGold.initialize(address(registry), unlockingPeriod);

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

    governance.initialize(
      address(registry),
      accApprover,
      CONCURRENT_PROPOSALS,
      DEPOSIT,
      QUERY_EXPIRY,
      DEQUEUE_FREQUENCY,
      REFERENDUM_STAGE_DURATION,
      EXECUTION_STAGE_DURATION,
      participationBaseline.unwrap(),
      participationFloor.unwrap(),
      baselineUpdateFactor.unwrap(),
      baselineQuorumFactor.unwrap()
    );

    accounts.createAccount();

    vm.deal(address(releaseGold), TOTAL_AMOUNT);
  }

  function _whenL2() public {
    deployCodeTo("Registry.sol", abi.encode(false), proxyAdminAddress);
  }

  function _registerValidatorGroupHelper(address _group, uint256 numMembers) internal {
    vm.startPrank(_group);
    if (!accounts.isAccount(_group)) {
      accounts.createAccount();
    }
    vm.deal(_group, 10000e18);
    lockedGold.lock.value(10000e18)();
    validators.registerValidatorGroup(commission.unwrap());
    vm.stopPrank();
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

  function _registerValidatorHelper(
    address _validator,
    uint256 _validatorPk
  ) internal returns (bytes memory) {
    if (!accounts.isAccount(_validator)) {
      vm.prank(_validator);
      accounts.createAccount();
    }

    vm.deal(_validator, 10000e18);
    vm.prank(_validator);
    lockedGold.lock.value(10000e18)();

    bytes memory _ecdsaPubKey = _generateEcdsaPubKey(_validator, _validatorPk);

    ph.mockSuccess(ph.PROOF_OF_POSSESSION(), abi.encodePacked(_validator, blsPublicKey, blsPop));

    vm.prank(_validator);
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

  function getParsedSignatureOfAddress(
    address _address,
    uint256 privateKey
  ) public pure returns (uint8, bytes32, bytes32) {
    bytes32 addressHash = keccak256(abi.encodePacked(_address));
    bytes32 prefixedHash = ECDSA.toEthSignedMessageHash(addressHash);
    return vm.sign(privateKey, prefixedHash);
  }

  function() external payable {}
}

contract RevokeCeloAfterL2TransitionTest is RevokeCeloAfterL2Transition {
  function test_revoke_celo_after_l2_transition() public {
    uint256 lockedGoldValue = 1e18;
    uint256 active = 12;
    uint256 pending = 11;

    deal(address(this), lockedGoldValue);
    lockedGold.lock.value(lockedGoldValue)();
    _registerValidatorGroupWithMembers(group, 1);

    election.vote(group, active, address(0), address(0));
    blockTravel(ph.epochSize() + 1);
    election.activate(group);
    election.vote(group, pending, address(0), address(0));

    assertEq(
      lockedGold.getAccountNonvotingLockedGold(address(this)),
      lockedGoldValue - active - pending
    );
    assertEq(lockedGold.getAccountTotalLockedGold(address(this)), lockedGoldValue);
    assertEq(election.getPendingVotesForGroupByAccount(group, address(this)), pending);
    assertEq(election.getActiveVotesForGroupByAccount(group, address(this)), active);

    _whenL2();

    election.revokeActive(group, active, address(0), address(0), 0);
    election.revokePending(group, pending, address(0), address(0), 0);

    assertEq(lockedGoldValue, lockedGold.getAccountNonvotingLockedGold(address(this)));

    lockedGold.unlock(lockedGoldValue);
    timeTravel(unlockingPeriod + 1);
    lockedGold.withdraw(0);
    assertEq(address(this).balance, lockedGoldValue);
  }

  function test_validatorCanRemoveCelo_WhenTransitionedToL2() public {
    _registerValidatorGroupWithMembers(group, 1);

    _whenL2();

    vm.startPrank(validator);
    validators.deaffiliate();
    timeTravel(originalValidatorLockedGoldRequirements.duration + 1);
    validators.deregisterValidator(0);

    uint256 totalLockedCelo = lockedGold.getAccountTotalLockedGold(validator);

    lockedGold.unlock(totalLockedCelo);

    timeTravel(unlockingPeriod + 1);
    lockedGold.withdraw(0);

    assertEq(validator.balance, 10000e18);

    vm.stopPrank();
  }

  function test_validatorGroupCanRemoveCelo_WhenTransitionedToL2() public {
    _registerValidatorGroupWithMembers(group, 1);

    _whenL2();

    vm.prank(validator);
    validators.deaffiliate();
    timeTravel(originalValidatorLockedGoldRequirements.duration + 1);
    vm.prank(validator);
    validators.deregisterValidator(0);

    vm.startPrank(group);
    timeTravel(originalGroupLockedGoldRequirements.duration + 1);
    validators.deregisterValidatorGroup(0);

    uint256 totalLockedCelo = lockedGold.getAccountTotalLockedGold(group);
    lockedGold.unlock(totalLockedCelo);

    timeTravel(unlockingPeriod + 1);
    lockedGold.withdraw(0);

    assertEq(group.balance, 10000e18);

    vm.stopPrank();
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
    uint256 signerPk
  ) internal returns (bytes memory) {
    (bytes memory _ecdsaPubKey, uint8 v, bytes32 r, bytes32 s) = _generateEcdsaPubKeyWithSigner(
      _validator,
      signerPk
    );

    ph.mockSuccess(ph.PROOF_OF_POSSESSION(), abi.encodePacked(_validator, blsPublicKey, blsPop));

    vm.prank(_validator);
    validators.registerValidator(_ecdsaPubKey, blsPublicKey, blsPop);
    validatorRegistrationEpochNumber = validators.getEpochNumber();
    return _ecdsaPubKey;
  }

  function test_releaseGoldOwnerHasValidator_CanRemoveCelo_WhenTransitionedToL2() public {
    _registerValidatorGroupWithMembers(group, 1);

    (uint8 vValidator, bytes32 rValidator, bytes32 sValidator) = getParsedSignatureOfAddress(
      address(releaseGold),
      authorizedValidatorSignerPK
    );
    (uint8 vVote, bytes32 rVote, bytes32 sVote) = getParsedSignatureOfAddress(
      address(releaseGold),
      authorizedVoteSignerPK
    );

    vm.startPrank(beneficiary);
    releaseGold.createAccount();
    releaseGold.authorizeValidatorSigner(
      address(uint160(authorizedValidatorSigner)),
      vValidator,
      rValidator,
      sValidator
    );
    releaseGold.authorizeVoteSigner(address(uint160(authorizedVoteSigner)), vVote, rVote, sVote);
    releaseGold.lockGold(TOTAL_AMOUNT - 10 ether);
    vm.stopPrank();

    _registerValidatorWithSignerHelper(address(releaseGold), authorizedValidatorSignerPK);
    vm.prank(authorizedValidatorSigner);
    validators.affiliate(group);

    uint256 active = 12;
    uint256 pending = 11;

    vm.startPrank(authorizedVoteSigner);
    election.vote(group, active, address(0), address(0));
    blockTravel(ph.epochSize() + 1);
    election.activate(group);
    election.vote(group, pending, address(0), address(0));
    vm.stopPrank();

    assertEq(
      lockedGold.getAccountNonvotingLockedGold(address(releaseGold)),
      TOTAL_AMOUNT - 10 ether - active - pending
    );
    assertEq(lockedGold.getAccountTotalLockedGold(address(releaseGold)), TOTAL_AMOUNT - 10 ether);
    assertEq(election.getPendingVotesForGroupByAccount(group, address(releaseGold)), pending);
    assertEq(election.getActiveVotesForGroupByAccount(group, address(releaseGold)), active);

    _whenL2();

    (uint8 vVote2, bytes32 rVote2, bytes32 sVote2) = getParsedSignatureOfAddress(
      address(releaseGold),
      authorizedVoteSignerPK2
    );

    vm.startPrank(beneficiary);
    releaseGold.authorizeVoteSigner(
      address(uint160(authorizedVoteSigner2)),
      vVote2,
      rVote2,
      sVote2
    );

    vm.startPrank(authorizedVoteSigner2);

    election.revokeActive(group, active, address(0), address(0), 0);
    election.revokePending(group, pending, address(0), address(0), 0);

    assertEq(
      lockedGold.getAccountNonvotingLockedGold(address(releaseGold)),
      TOTAL_AMOUNT - 10 ether
    );
    vm.stopPrank();

    vm.startPrank(authorizedValidatorSigner);
    validators.deaffiliate();
    timeTravel(originalValidatorLockedGoldRequirements.duration + 1);
    validators.deregisterValidator(1);
    vm.stopPrank();

    uint256 totalLockedCelo = lockedGold.getAccountTotalLockedGold(address(releaseGold));
    vm.startPrank(beneficiary);
    releaseGold.unlockGold(totalLockedCelo);

    timeTravel(unlockingPeriod + 1);
    releaseGold.withdrawLockedGold(0);
    assertEq(address(releaseGold).balance, TOTAL_AMOUNT - 2 ether);
  }
}
