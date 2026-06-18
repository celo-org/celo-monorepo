// SPDX-License-Identifier: UNLICENSED
pragma solidity >=0.8.7 <0.8.20;
pragma experimental ABIEncoderV2;

import "@openzeppelin/contracts8/utils/math/SafeMath.sol";
import "@openzeppelin/contracts8/utils/cryptography/ECDSA.sol";
import "@celo-contracts/common/FixidityLib.sol";
import "@celo-contracts/common/interfaces/IAccountsTest.sol";
import { IGoldTokenTest } from "@test-sol/unit/common/interfaces/IGoldTokenTest.sol";
import "@celo-contracts/governance/interfaces/IValidators.sol";

import { IElectionTest } from "@test-sol/unit/governance/voting/interfaces/IElectionTest.sol";
import { ILockedGoldTest } from "@test-sol/unit/governance/voting/interfaces/ILockedGoldTest.sol";
import "@celo-contracts/governance/interfaces/IReleaseGold.sol";
import { ReleaseGold } from "@celo-contracts-8/governance/ReleaseGold.sol";

import "@celo-contracts-8/stability/test/MockStableToken.sol";

import { ECDSAHelper08 } from "@test-sol/utils/ECDSAHelper08.sol";
import { Validators } from "@celo-contracts-8/governance/Validators.sol";

// Force compilation of artifacts resolved by deployCodeTo calls in setUp.
import "@test-sol/unit/governance/voting/mocks/ElectionCompile.sol";
import "@test-sol/unit/governance/voting/mocks/LockedGoldCompile.sol";
import "@test-sol/unit/governance/voting/mocks/ReleaseGoldCompile.sol";
import "@test-sol/unit/governance/validators/mocks/ValidatorsCompile.sol";
import "@celo-contracts-8/governance/test/GovernanceMock08.sol";

// Minimal interface extension to expose initialize on a deployCodeTo-deployed ReleaseGold.
interface IReleaseGoldInit is IReleaseGold {
  function initialize(
    ReleaseGold.InitParams calldata params,
    ReleaseGold.InitParams2 calldata params2
  ) external;
}

contract RevokeCeloAfterL2Transition is ECDSAHelper08 {
  using FixidityLib for FixidityLib.Fraction;

  uint256 constant TOTAL_AMOUNT = 1 ether * 1_000_000;

  IAccountsTest accounts;
  MockStableToken08 stableToken;
  IElectionTest election;
  Validators public validators;
  ILockedGoldTest lockedGold;
  GovernanceMock08 governance;
  IGoldTokenTest goldToken;
  IReleaseGoldInit releaseGold;

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

  struct ValidatorLockedGoldRequirements {
    uint256 value;
    uint256 duration;
  }

  struct GroupLockedGoldRequirements {
    uint256 value;
    uint256 duration;
  }

  uint256 constant DEPOSIT = 5;
  uint256 constant VOTER_GOLD = 100;
  uint256 constant REFERENDUM_STAGE_DURATION = 5 * 60;
  uint256 constant CONCURRENT_PROPOSALS = 1;
  uint256 constant DEQUEUE_FREQUENCY = 10 * 60;
  uint256 constant QUERY_EXPIRY = 60 * 60;
  uint256 constant EXECUTION_STAGE_DURATION = 1 * 60;

  uint256 unlockingPeriod;

  FixidityLib.Fraction public commission;

  ValidatorLockedGoldRequirements public originalValidatorLockedGoldRequirements;
  GroupLockedGoldRequirements public originalGroupLockedGoldRequirements;

  uint256 expectedParticipationBaseline;
  FixidityLib.Fraction baselineUpdateFactor;
  FixidityLib.Fraction participationBaseline;
  FixidityLib.Fraction participationFloor;
  FixidityLib.Fraction baselineQuorumFactor;

  uint256 validatorRegistrationEpochNumber;

  function setUp() public override {
    super.setUp();

    commission = FixidityLib.newFixedFraction(1, 100);

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

    unlockingPeriod = 3 * DAY;

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

    originalValidatorLockedGoldRequirements = ValidatorLockedGoldRequirements({
      value: 1000,
      duration: 60 * DAY
    });
    originalGroupLockedGoldRequirements = GroupLockedGoldRequirements({
      value: 1000,
      duration: 100 * DAY
    });

    _deployContracts();
    _initializeContracts();
  }

  function _deployContracts() private {
    address accountsAddress = actor("Accounts");
    deployCodeTo("Accounts.sol", abi.encode(true), accountsAddress);
    accounts = IAccountsTest(accountsAddress);

    stableToken = new MockStableToken08();

    address _ea = actor("election");
    deployCodeTo("ElectionCompile", _ea);
    election = IElectionTest(_ea);

    address _lg = actor("LockedGold");
    deployCodeTo("LockedGoldCompile", _lg);
    lockedGold = ILockedGoldTest(_lg);

    // Deploy Validators directly (no tunnel needed in 0.8).
    validators = new Validators(true);

    address _g = actor("Governance");
    deployCodeTo("GovernanceMock08", _g);
    governance = GovernanceMock08(payable(_g));

    address goldTokenAddress = actor("goldToken");
    deployCodeTo("GoldToken.sol", abi.encode(true), goldTokenAddress);
    goldToken = IGoldTokenTest(goldTokenAddress);

    registry.setAddressFor(AccountsContract, address(accounts));
    registry.setAddressFor(ElectionContract, address(election));
    registry.setAddressFor(StableTokenContract, address(stableToken));
    registry.setAddressFor(LockedGoldContract, address(lockedGold));
    registry.setAddressFor(ValidatorsContract, address(validators));
    registry.setAddressFor(GovernanceContract, address(governance));
    registry.setAddressFor(GoldTokenContract, address(goldToken));
    registry.setAddressFor(EpochManagerContract, address(epochManager));

    goldToken.initialize(address(registry));
    accounts.initialize(REGISTRY_ADDRESS);

    address releaseGoldAddress = actor("releaseGoldInstance");
    deployCodeTo("ReleaseGoldCompile", releaseGoldAddress);
    releaseGold = IReleaseGoldInit(releaseGoldAddress);
  }

  function _initializeContracts() private {
    // Initialize ReleaseGold directly using the 0.8 struct types (no tunnel required).
    ReleaseGold.InitParams memory rgParams = ReleaseGold.InitParams({
      releaseStartTime: block.timestamp + 5 * MINUTE,
      releaseCliffTime: HOUR,
      numReleasePeriods: 4,
      releasePeriod: 3 * MONTH,
      amountReleasedPerPeriod: TOTAL_AMOUNT / 4,
      revocable: false,
      beneficiary: payable(beneficiary)
    });
    ReleaseGold.InitParams2 memory rgParams2 = ReleaseGold.InitParams2({
      releaseOwner: releaseOwner,
      refundAddress: payable(address(0)),
      subjectToLiquidityProvision: false,
      initialDistributionRatio: 1000,
      canValidate: true,
      canVote: true,
      registryAddress: REGISTRY_ADDRESS
    });
    vm.prank(owner);
    releaseGold.initialize(rgParams, rgParams2);

    election.initialize(
      REGISTRY_ADDRESS,
      4, // electableValidatorsMin
      6, // electableValidatorsMax
      3, // maxNumGroupsVotedFor
      FixidityLib.newFixedFraction(1, 100).unwrap() // electabilityThreshold
    );

    lockedGold.initialize(address(registry), unlockingPeriod);

    Validators.InitParams memory vInitParams = Validators.InitParams({
      commissionUpdateDelay: 3
    });
    vm.prank(owner);
    validators.initialize(
      REGISTRY_ADDRESS,
      originalGroupLockedGoldRequirements.value,
      originalGroupLockedGoldRequirements.duration,
      originalValidatorLockedGoldRequirements.value,
      originalValidatorLockedGoldRequirements.duration,
      5, // membershipHistoryLength
      30 * DAY, // slashingMultiplierResetPeriod
      5, // maxGroupSize
      vInitParams
    );

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
    uint256 l1EpochNumber = 100;

    // Fund the CeloUnreleasedTreasury so initializeSystem passes its balance check.
    setCeloUnreleasedTreasuryBalance();
    // Mark L2 by etching the sentinel address.
    whenL2();

    address[] memory _elected = new address[](2);
    _elected[0] = actor("firstElected");
    _elected[1] = actor("secondElected");
    epochManager.initializeSystem(l1EpochNumber, block.number, _elected);
  }

  function _registerValidatorGroupHelper(address _group, uint256) internal {
    vm.startPrank(_group);
    if (!accounts.isAccount(_group)) {
      accounts.createAccount();
    }
    vm.deal(_group, 10000e18);
    lockedGold.lock{value: 10000e18}();
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
    lockedGold.lock{value: 10000e18}();

    bytes memory _ecdsaPubKey = _generateEcdsaPubKey(_validator, _validatorPk);

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

  function getParsedSignatureOfAddress(
    address _address,
    uint256 privateKey
  ) public pure returns (uint8, bytes32, bytes32) {
    bytes32 addressHash = keccak256(abi.encodePacked(_address));
    bytes32 prefixedHash = ECDSA.toEthSignedMessageHash(addressHash);
    return vm.sign(privateKey, prefixedHash);
  }

  receive() external payable {}
}

contract RevokeCeloAfterL2TransitionTest is RevokeCeloAfterL2Transition {
  function test_revoke_celo_after_l2_transition() public {
    uint256 lockedGoldValue = 1e18;
    uint256 active = 12;
    uint256 pending = 11;

    deal(address(this), lockedGoldValue);
    lockedGold.lock{value: lockedGoldValue}();
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
    (bytes memory _ecdsaPubKey, , , ) = _generateEcdsaPubKeyWithSigner(_validator, signerPk);

    vm.prank(_validator);
    validators.registerValidatorNoBls(_ecdsaPubKey);
    validatorRegistrationEpochNumber = getEpochNumber();
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
      payable(authorizedValidatorSigner),
      vValidator,
      rValidator,
      sValidator
    );
    releaseGold.authorizeVoteSigner(payable(authorizedVoteSigner), vVote, rVote, sVote);
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
    releaseGold.authorizeVoteSigner(payable(authorizedVoteSigner2), vVote2, rVote2, sVote2);

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
