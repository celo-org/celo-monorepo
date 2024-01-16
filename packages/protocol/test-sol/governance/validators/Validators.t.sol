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
import "@celo-contracts/governance/Validators.sol";

import "@celo-contracts/stability/test/MockStableToken.sol";
import "@celo-contracts/governance/test/MockElection.sol";

/**
 * @title A wrapper around Validators that exposes onlyVm functions for testing.
 */
contract ValidatorsMock is Validators(true) {
  function updateValidatorScoreFromSigner(address signer, uint256 uptime) external {
    return _updateValidatorScoreFromSigner(signer, uptime);
  }

  function distributeEpochPaymentsFromSigner(address signer, uint256 maxPayment)
    external
    returns (uint256)
  {
    return _distributeEpochPaymentsFromSigner(signer, maxPayment);
  }
}

contract ValidatorsTest is Test {
  using FixidityLib for FixidityLib.Fraction;

  Registry registry;
  Accounts accounts;
  MockStableToken stableToken;
  MockElection election;
  ValidatorsMock validators;
  LockedGold lockedGold;

  uint256 HOUR = 60 * 60;
  uint256 DAY = 24 * HOUR;

  address nonOwner;
  address owner;

  bytes public constant blsPublicKey = "0x4fa3f67fc913878b068d1fa1cdddc54913d3bf988dbe5a36a20fa888f20d4894c408a6773f3d7bde11154f2a3076b700d345a42fd25a0e5e83f4db5586ac7979ac2053cd95d8f2efd3e959571ceccaa743e02cf4be3f5d7aaddb0b06fc9aff00";
  bytes public constant blsPoP = "0xcdb77255037eb68897cd487fdd85388cbda448f617f874449d4b11588b0b7ad8ddc20d9bb450b513bb35664ea3923900";

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

    lockedGold = new LockedGold(true);
    election = new MockElection();
    validators = new ValidatorsMock();

    stableToken = new MockStableToken();

    registry.setAddressFor("Accounts", address(accounts));
    registry.setAddressFor("Election", address(election));
    registry.setAddressFor("LockedGold", address(lockedGold));
    registry.setAddressFor("Validators", address(validators));
    registry.setAddressFor("StableToken", address(stableToken));

    accounts.createAccount(); // do this for 10 accounts?

    validators.initialize(
      registryAddress,
      groupLockedGoldRequirements.value,
      groupLockedGoldRequirements.duration,
      validatorLockedGoldRequirements.value,
      validatorLockedGoldRequirements.duration,
      validatorScoreParameters.exponent,
      validatorScoreParameters.adjustmentSpeed.unwrap(),
      membershipHistoryLength,
      slashingMultiplierResetPeriod,
      maxGroupSize,
      commissionUpdateDelay,
      downtimeGracePeriod
    );
    //TODO: use struct as input param for testing
  }

  function test_Name_ShouldDoSomething_WhenSomethingHappens() public {
    //setUp
    //execution
    //assert

    console.log("### val score param");
    console.log(validatorScoreParameters.adjustmentSpeed.unwrap());
  }
}
