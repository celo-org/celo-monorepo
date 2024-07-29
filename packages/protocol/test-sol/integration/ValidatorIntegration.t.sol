// THIS TEST IS RUN IN A FORKED ENVIRONMENT FROM DEVCHAIN

// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.5.13;
pragma experimental ABIEncoderV2;

import "celo-foundry/Test.sol";

import "openzeppelin-solidity/contracts/math/SafeMath.sol";
import "@celo-contracts/common/FixidityLib.sol";
import "@celo-contracts/common/Registry.sol";
import "@celo-contracts/common/interfaces/IAccounts.sol";

import "@celo-contracts/governance/Election.sol";
import "@celo-contracts/governance/interfaces/IValidators.sol";
import "@celo-contracts/governance/LockedGold.sol";
import "@celo-contracts/common/interfaces/IAccounts.sol";

import "@celo-contracts/stability/test/MockStableToken.sol";
// import "@celo-contracts/governance/test/MockElection.sol";
import "@celo-contracts/governance/test/MockLockedGold.sol";
import "@test-sol/unit/governance/validators/mocks/ValidatorsMockTunnel.sol";

import "@celo-contracts/governance/test/ValidatorsMock.sol";
import { TestConstants } from "@test-sol/constants.sol";
import "@test-sol/utils/ECDSAHelper.sol";
import { Utils } from "@test-sol/utils.sol";
import { Test as ForgeTest } from "forge-std/Test.sol";

import "@celo-contracts/common/interfaces/IProxy.sol";
import "@celo-contracts/governance/EpochRewards.sol";
import "@celo-contracts/common/interfaces/ICeloToken.sol"; // TODO right order for this

import "./POSEntryPointContract.sol";

import "@celo-contracts/common/UsingRegistry.sol";

contract ValidatorIntegrationTest is Test, TestConstants, Utils, ECDSAHelper, UsingRegistry {
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

  Registry registry;
  IAccounts accounts;
  MockStableToken stableToken;
  Election election;
  ValidatorsMockTunnel public validatorsMockTunnel;
  IValidators public validators;
  MockLockedGold lockedGold;

  address _owner;
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
  uint256 public downtimeGracePeriod = 0;

  ValidatorsMockTunnel.InitParams public initParams;
  ValidatorsMockTunnel.InitParams2 public initParams2;
  address constant registryAddress = address(0x000000000000000000000000000000000000ce10);

  function setUp() public {
    // owner = address(this);
    // group = actor("group");
    // nonValidator = actor("nonValidator");
    // nonOwner = actor("nonOwner");
    // paymentDelegatee = actor("paymentDelegatee");

    // (validator, validatorPk) = actorWithPK("validator");
    // (signer, signerPk) = actorWithPK("signer");
    // (otherValidator, otherValidatorPk) = actorWithPK("otherValidator");

    // originalValidatorLockedGoldRequirements = ValidatorLockedGoldRequirements({
    //   value: 1000,
    //   duration: 60 * DAY
    // });

    // originalGroupLockedGoldRequirements = GroupLockedGoldRequirements({
    //   value: 1000,
    //   duration: 100 * DAY
    // });

    // originalValidatorScoreParameters = ValidatorScoreParameters({
    //   exponent: 5,
    //   adjustmentSpeed: FixidityLib.newFixedFraction(5, 20)
    // });

    // address registryAddress = 0x000000000000000000000000000000000000ce10;
    // deployCodeTo("Registry.sol", abi.encode(false), registryAddress);
    // registry = Registry(registryAddress);

    // Foloowing  lines required by parent UsingRegistry
    vm.prank(owner());
    setRegistry(registryAddress);
    accounts = UsingRegistry.getAccounts();
    // accounts.initialize(registryAddress);

    validators = getValidators();
    // registry.setAddressFor(ValidatorsContract, address(validators));
    // validators.initialize(registryAddress, groupRequirementValue, groupRequirementDuration, validatorRequirementValue, validatorRequirementDuration, validatorScoreExponent, validatorScoreAdjustmentSpeed, _membershipHistoryLength, _slashingMultiplierResetPeriod, _maxGroupSize, _commissionUpdateDelay, _downtimeGracePeriod);

    // lockedGold = new MockLockedGold();
    // election = new Election(true);
    // registry.setAddressFor(ElectionContract, address(election));
    // uint256 minElectableValidators = 22;
    // uint256 maxElectableValidators = 110;
    // uint256 _maxNumGroupsVotedFor = 5 ;
    // uint256 _electabilityThreshold = 1000000000000000000000;
    // election.initialize(registryAddress, minElectableValidators, maxElectableValidators, _maxNumGroupsVotedFor, _electabilityThreshold);

    // validatorsMockTunnel = new ValidatorsMockTunnel(address(validators));

    // stableToken = new MockStableToken();

    // registry.setAddressFor(AccountsContract, address(accounts));
    // registry.setAddressFor(LockedGoldContract, address(lockedGold));
    // registry.setAddressFor(StableTokenContract, address(stableToken));

    // initParams = ValidatorsMockTunnel.InitParams({
    //   registryAddress: registryAddress,
    //   groupRequirementValue: originalGroupLockedGoldRequirements.value,
    //   groupRequirementDuration: originalGroupLockedGoldRequirements.duration,
    //   validatorRequirementValue: originalValidatorLockedGoldRequirements.value,
    //   validatorRequirementDuration: originalValidatorLockedGoldRequirements.duration,
    //   validatorScoreExponent: originalValidatorScoreParameters.exponent,
    //   validatorScoreAdjustmentSpeed: originalValidatorScoreParameters.adjustmentSpeed.unwrap()
    // });
    // initParams2 = ValidatorsMockTunnel.InitParams2({
    //   _membershipHistoryLength: membershipHistoryLength,
    //   _slashingMultiplierResetPeriod: slashingMultiplierResetPeriod,
    //   _maxGroupSize: maxGroupSize,
    //   _commissionUpdateDelay: commissionUpdateDelay,
    //   _downtimeGracePeriod: downtimeGracePeriod
    // });

    // validatorsMockTunnel.MockInitialize(owner, initParams, initParams2);

    // vm.prank(validator);
    // accounts.createAccount();

    // vm.prank(otherValidator);
    // accounts.createAccount();

    // vm.prank(group);
    // accounts.createAccount();

    // vm.prank(nonValidator);
    // accounts.createAccount();
  }

  function _registerValidatorGroupHelper(address _group, uint256 numMembers) internal {
    if (!accounts.isAccount(_group)) {
      vm.prank(_group);
      accounts.createAccount();
    }

    (uint256 requirements, uint256 _) = getValidators().getGroupLockedGoldRequirements();
    requirements = requirements * numMembers;
    // console.log("requirements:", requirements);

    vm.deal(_group, requirements); // TODO add this balance to the supply as well
    vm.startPrank(address(0));
    ICeloToken(address(getGoldToken())).increaseSupply(requirements);
    vm.stopPrank();

    vm.startPrank(_group);
    getLockedGold().lock.value(requirements)();
    vm.stopPrank(); // for some reason vm.prank doesn't work

    // console.log("locked:", getLockedGold().getAccountTotalLockedGold(_group));

    // lockedGold.setAccountTotalLockedGold(
    //   _group,
    //   originalGroupLockedGoldRequirements.value.mul(numMembers)
    // );

    vm.prank(_group);
    validators.registerValidatorGroup(commission.unwrap());
  }

  function _registerValidatorGroupWithMembers(
    address _group,
    uint256 _numMembers,
    address leaser,
    address greater
  ) public {
    _registerValidatorGroupHelper(_group, _numMembers);

    for (uint256 i = 0; i < _numMembers; i++) {
      // assumes this voting doesn't change the order
      if (i == 0) {
        _registerValidatorHelper(validator, validatorPk);

        vm.prank(validator);
        validators.affiliate(group);

        vm.prank(group);
        validators.addFirstMember(validator, leaser, greater);
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

    vm.startPrank(_group);
    // TODO add vote activation
    getElection().vote(
      group,
      getLockedGold().getAccountNonvotingLockedGold(group),
      leaser,
      greater
    );

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

  function _registerValidatorHelper(
    address _validator,
    uint256 _validatorPk
  ) internal returns (bytes memory) {
    if (!accounts.isAccount(_validator)) {
      vm.prank(_validator);
      accounts.createAccount();
    }

    // lockedGold.setAccountTotalLockedGold(_validator, originalValidatorLockedGoldRequirements.value);
    (uint256 requirements, uint256 _) = getValidators().getValidatorLockedGoldRequirements();
    requirements = requirements;
    vm.deal(_validator, requirements); // TODO add this balance to the supply as well
    vm.startPrank(address(0));
    ICeloToken(address(getGoldToken())).increaseSupply(requirements);
    vm.stopPrank();

    vm.startPrank(_validator);
    getLockedGold().lock.value(requirements)();
    vm.stopPrank(); // for some reason vm.prank doesn't work

    bytes memory _ecdsaPubKey = _generateEcdsaPubKey(_validator, _validatorPk);

    ph.mockSuccess(ph.PROOF_OF_POSSESSION(), abi.encodePacked(_validator, blsPublicKey, blsPop));

    vm.prank(_validator);
    validators.registerValidator(_ecdsaPubKey, blsPublicKey, blsPop);
    // validatorRegistrationEpochNumber = validators.getEpochNumber();
    return _ecdsaPubKey;
  }

  function getParsedSignatureOfAddress(
    address _address,
    uint256 privateKey
  ) public pure returns (uint8, bytes32, bytes32) {
    bytes32 addressHash = keccak256(abi.encodePacked(_address));
    bytes32 prefixedHash = ECDSA.toEthSignedMessageHash(addressHash);
    return vm.sign(privateKey, prefixedHash);
  }

  function _generateEcdsaPubKey(
    address _account,
    uint256 _accountPk
  ) internal returns (bytes memory ecdsaPubKey) {
    (uint8 v, bytes32 r, bytes32 s) = getParsedSignatureOfAddress(_account, _accountPk);
    bytes32 addressHash = keccak256(abi.encodePacked(_account));

    ecdsaPubKey = addressToPublicKey(addressHash, v, r, s);
  }

  // function _expensiveCall() private {
  //   validators.entryPointElectAndDistribute(); // FIXME gasSnapshot doesn't how this as it's in the already deployed contact
  // }

  function test_hello() public {
    address[] memory registeredGroups = validators.getRegisteredValidatorGroups();
    // console.log("Validators already registered:", registeredGroups.length);
    POSEntryPointContract entryPoint = new POSEntryPointContract(registryAddress);

    // election.electValidatorSigners(); // TODO this needs to be possible to be called form a fresh migration

    // register 110 validator groups (one is already added)
    address greater = registeredGroups[0];
    uint8 numMembers = 109;
    address leaser = address(0);

    for (uint8 i = 0; i < numMembers; i++) {
      group = actor(string(abi.encodePacked("group", string(abi.encode(i)))));
      // TODO make group vote for themselves
      (validator, validatorPk) = actorWithPK(
        string(abi.encodePacked("validator", string(abi.encode(i))))
      );
      _registerValidatorGroupWithMembers(group, 1, leaser, greater);
      // the loop is made such that new group always has the less votes
      greater = group;
    }

    // upgrade epoch rewards to avoid recreate the chain after each change
    address implementation = address(new EpochRewards(false));
    vm.startPrank(IProxy(address(getEpochRewards()))._getOwner());
    IProxy(address(getEpochRewards()))._setImplementation(implementation);
    vm.stopPrank();

    console.log(
      "elections.getRequiredVotes()",
      Election(address(getElection())).getRequiredVotes()
    );

    // try to change for Eelection instead of IElection to get a trace.
    // IElection(address(getElection())).electValidatorSigners(); // This call reverts, figure out why
    // Election(address(getElection())).electValidatorSigners(); // This call reverts, figure out why

    // TODO when I do getElection().electValidatorSigners() for some reason this doesn't work. maybe gas limit?
    address[] memory electedFew = Election(address(getElection())).electValidatorSigners();
    for (uint256 i = 0; i < electedFew.length; i++) {
      console.log("electedFew[i]", electedFew[i]);
    }

    entryPoint._expensiveCall();
  }
}
