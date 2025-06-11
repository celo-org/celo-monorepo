// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.5.13;
pragma experimental ABIEncoderV2;

import "openzeppelin-solidity/contracts/math/SafeMath.sol";
import "@celo-contracts/common/FixidityLib.sol";
import "@celo-contracts/common/Registry.sol";
import "@celo-contracts/common/Accounts.sol";
import "@celo-contracts/common/GoldToken.sol";
import "@celo-contracts-8/common/interfaces/IPrecompiles.sol";
import "@celo-contracts/governance/interfaces/IValidators.sol";

import "@celo-contracts/governance/Election.sol";
import "@celo-contracts/governance/LockedGold.sol";
import "@celo-contracts/governance/ReleaseGold.sol";

import "@celo-contracts/stability/test/MockStableToken.sol";
import "@celo-contracts/governance/Election.sol";
import "@celo-contracts/governance/Governance.sol";

import "@test-sol/utils/ECDSAHelper.sol";
import { TestWithUtils } from "@test-sol/TestWithUtils.sol";
import "@test-sol/unit/governance/validators/mocks/ValidatorsMockTunnel.sol";
import "@test-sol/unit/governance/voting/mocks/ReleaseGoldMockTunnel.sol";
import "@test-sol/unit/common/mocks/MockEpochManager.sol";

contract RevokeCeloAfterL2Transition is TestWithUtils, ECDSAHelper {
  using FixidityLib for FixidityLib.Fraction;

  uint256 constant TOTAL_AMOUNT = 1 ether * 1_000_000;

  Accounts accounts;
  MockStableToken stableToken;
  Election election;
  ValidatorsMockTunnel public validatorsMockTunnel;
  IValidators public validators;
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

    setupRegistry();
    setupEpochManager();

    accounts = new Accounts(true);
    stableToken = new MockStableToken();
    election = new Election(true);
    lockedGold = new LockedGold(true);
    address validatorsAddress = actor("Validators");
    deployCodeTo("ValidatorsMock.sol", validatorsAddress);
    validators = IValidators(validatorsAddress);
    // TODO move to create2
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
    registry.setAddressFor(EpochManagerContract, address(epochManager));

    goldToken.initialize(address(registry));

    accounts.initialize(REGISTRY_ADDRESS);

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
      registryAddress: REGISTRY_ADDRESS
    });

    ReleaseGoldMockTunnel tunnel = new ReleaseGoldMockTunnel(address(releaseGold));
    tunnel.MockInitialize(owner, releaseGoldInitParams, releaseGoldInitParams2);

    election.initialize(
      REGISTRY_ADDRESS,
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

    deployCodeTo("Registry.sol", abi.encode(false), PROXY_ADMIN_ADDRESS);

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

    vm.prank(_validator);
    validators.registerValidatorNoBls(_ecdsaPubKey);
    validatorRegistrationEpochNumber = IPrecompiles(address(validators)).getEpochNumber();
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
