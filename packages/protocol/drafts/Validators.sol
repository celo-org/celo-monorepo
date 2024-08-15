pragma solidity ^0.5.13;

import "openzeppelin-solidity/contracts/math/Math.sol";
import "openzeppelin-solidity/contracts/math/SafeMath.sol";
import "openzeppelin-solidity/contracts/ownership/Ownable.sol";
import "solidity-bytes-utils/contracts/BytesLib.sol";

import "./interfaces/IValidators.sol";

import "../common/CalledByVm.sol";
import "../common/Initializable.sol";
import "../common/FixidityLib.sol";
import "../common/linkedlists/AddressLinkedList.sol";
import "../common/UsingRegistry.sol";
import "../common/UsingPrecompiles.sol";
import "../common/interfaces/ICeloVersionedContract.sol";
import "../common/libraries/ReentrancyGuard.sol";

/**
 * @title A contract for registering and electing Validator Groups and Validators.
 */
contract Validators is
  IValidators,
  ICeloVersionedContract,
  Ownable,
  ReentrancyGuard,
  Initializable,
  UsingRegistry,
  UsingPrecompiles,
  CalledByVm
{
  using FixidityLib for FixidityLib.Fraction;
  using AddressLinkedList for LinkedList.List;
  using SafeMath for uint256;
  using BytesLib for bytes;

  // For Validators, these requirements must be met in order to:
  //   1. Register a validator
  //   2. Affiliate with and be added to a group
  //   3. Receive epoch payments (note that the group must meet the group requirements as well)
  // Accounts may de-register their Validator `duration` seconds after they were last a member of a
  // group, after which no restrictions on Locked Gold will apply to the account.
  //
  // For Validator Groups, these requirements must be met in order to:
  //   1. Register a group
  //   2. Add a member to a group
  //   3. Receive epoch payments
  // Note that for groups, the requirement value is multiplied by the number of members, and is
  // enforced for `duration` seconds after the group last had that number of members.
  // Accounts may de-register their Group `duration` seconds after they were last non-empty, after
  // which no restrictions on Locked Gold will apply to the account.
  struct LockedGoldRequirements {
    uint256 value;
    // In seconds.
    uint256 duration;
  }

  struct ValidatorGroup {
    bool exists;
    LinkedList.List members;
    FixidityLib.Fraction commission;
    FixidityLib.Fraction nextCommission;
    uint256 nextCommissionBlock;
    // sizeHistory[i] contains the last time the group contained i members.
    uint256[] sizeHistory;
    SlashingInfo slashInfo;
  }

  // Stores the epoch number at which a validator joined a particular group.
  struct MembershipHistoryEntry {
    uint256 epochNumber;
    address group;
  }

  // Stores the per-epoch membership history of a validator, used to determine which group
  // commission should be paid to at the end of an epoch.
  // Stores a timestamp of the last time the validator was removed from a group, used to determine
  // whether or not a group can de-register.
  struct MembershipHistory {
    // The key to the most recent entry in the entries mapping.
    uint256 tail;
    // The number of entries in this validators membership history.
    uint256 numEntries;
    mapping(uint256 => MembershipHistoryEntry) entries;
    uint256 lastRemovedFromGroupTimestamp;
  }

  struct SlashingInfo {
    FixidityLib.Fraction multiplier;
    uint256 lastSlashed;
  }

  struct PublicKeys {
    bytes ecdsa;
    bytes bls;
  }

  struct Validator {
    PublicKeys publicKeys;
    address affiliation;
    FixidityLib.Fraction score;
    MembershipHistory membershipHistory;
  }

  // Parameters that govern the calculation of validator's score.
  struct ValidatorScoreParameters {
    uint256 exponent;
    FixidityLib.Fraction adjustmentSpeed;
  }

  mapping(address => ValidatorGroup) private groups;
  mapping(address => Validator) private validators;
  address[] private registeredGroups;
  address[] private registeredValidators;
  LockedGoldRequirements public validatorLockedGoldRequirements;
  LockedGoldRequirements public groupLockedGoldRequirements;
  ValidatorScoreParameters private validatorScoreParameters;
  uint256 public membershipHistoryLength;
  uint256 public maxGroupSize;
  // The number of blocks to delay a ValidatorGroup's commission update
  uint256 public commissionUpdateDelay;
  uint256 public slashingMultiplierResetPeriod;
  uint256 public downtimeGracePeriod;

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

  /**
   * @notice Computes epoch payments to the account
   * @param account The validator signer of the validator to distribute the epoch payment to.
   * @param maxPayment The maximum payment to the validator. Actual payment is based on score and
   *   group commission.
   * @return The total payment paid to the validator and their group.
   */
  function computeEpochPayments(
    address account,
    uint256 score,
    uint256 maxPayment
  ) external view returns (uint256) {
    require(isValidator(account), "Not a validator");
    require(score <= FixidityLib.fixed1().fromFixed(), "Score must be <= 1");

    // The group that should be paid is the group that the validator was a member of at the
    // time it was elected.
    address group = getMembershipInLastEpoch(account);
    require(group != address(0), "Validator not registered with a group");
    // Both the validator and the group must maintain the minimum locked gold balance in order to
    // receive epoch payments.
    if (meetsAccountLockedGoldRequirements(account) && meetsAccountLockedGoldRequirements(group)) {
      FixidityLib.Fraction memory totalPayment = FixidityLib
        .newFixed(maxPayment)
        .multiply(score)
        .multiply(groups[group].slashInfo.multiplier);
      return totalPayment.fromFixed();
    } else {
      return 0;
    }
  }
}
