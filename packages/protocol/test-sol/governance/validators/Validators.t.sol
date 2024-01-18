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

contract ValidatorsMockTunnel {
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

  function MockInitialize(InitParams calldata params, InitParams2 calldata params2)
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

    // Use delegatecall to call the function in ContractB
    (bool success, bytes memory result) = address(tunnelValidators).delegatecall(data);
    require(success, "failed to delegateCall");
  }
}

contract ValidatorsTest is Test {
  using FixidityLib for FixidityLib.Fraction;

  Registry registry;
  Accounts accounts;
  MockStableToken stableToken;
  MockElection election;
  ValidatorsMockTunnel validatorsMockTunnel;
  ValidatorsMock public _validators;
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

    validatorLockedGoldRequirements = ValidatorLockedGoldRequirements(1000, 60 * DAY);
    groupLockedGoldRequirements = GroupLockedGoldRequirements(1000, 100 * DAY);
    validatorScoreParameters = ValidatorScoreParameters(5, FixidityLib.newFixedFraction(5, 20));

    address registryAddress = 0x000000000000000000000000000000000000ce10;
    deployCodeTo("Registry.sol", abi.encode(false), registryAddress);
    registry = Registry(registryAddress);

    accounts = new Accounts(true);
    accounts.initialize(registryAddress);

    lockedGold = new MockLockedGold();
    election = new MockElection();
    _validators = new ValidatorsMock();
    validatorsMockTunnel = new ValidatorsMockTunnel(address(_validators));

    stableToken = new MockStableToken();

    registry.setAddressFor("Accounts", address(accounts));
    registry.setAddressFor("Election", address(election));
    registry.setAddressFor("LockedGold", address(lockedGold));
    registry.setAddressFor("Validators", address(_validators));
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

    validatorsMockTunnel.MockInitialize(initParams, initParams2);
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
    assertEq(_validators.owner(), owner);
  }
}
