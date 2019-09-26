pragma solidity ^0.5.3;

import "openzeppelin-solidity/contracts/utils/ReentrancyGuard.sol";
import "openzeppelin-solidity/contracts/math/SafeMath.sol";
import "openzeppelin-solidity/contracts/ownership/Ownable.sol";

import "./interfaces/ILockedGold.sol";
import "./interfaces/IGovernance.sol";
import "./interfaces/IValidators.sol";

import "../common/Initializable.sol";
import "../common/UsingRegistry.sol";
import "../common/FixidityLib.sol";
import "../common/interfaces/IERC20Token.sol";
import "../common/Signatures.sol";
import "../common/FractionUtil.sol";

contract LockedGold is ILockedGold, ReentrancyGuard, Initializable, UsingRegistry {

  using FixidityLib for FixidityLib.Fraction;
  using FractionUtil for FractionUtil.Fraction;
  using SafeMath for uint256;

  // TODO(asa): Remove index for gas efficiency if two updates to the same slot costs extra gas.
  struct Commitment {
    uint128 value;
    uint128 index;
  }

  struct Commitments {
    // Maps a notice period in seconds to a Locked Gold commitment.
    mapping(uint256 => Commitment) locked;
    // Maps an availability time in seconds since epoch to a notified commitment.
    mapping(uint256 => Commitment) notified;
    uint256[] noticePeriods;
    uint256[] availabilityTimes;
  }

  struct Account {
    bool exists;
    // The weight of the account in validator elections, governance, and block rewards.
    uint256 weight;
    // Each account may delegate their right to receive rewards, vote, and register a Validator or
    // Validator group to exactly one address each, respectively. This address must not hold an
    // account and must not be delegated to by any other account or by the same account for any
    // other purpose.
    address[3] delegates;
    // Frozen accounts may not vote, but may redact votes.
    bool votingFrozen;
    // The timestamp of the last time that rewards were redeemed.
    uint96 rewardsLastRedeemed;
    Commitments commitments;
  }

  // TODO(asa): Add minNoticePeriod
  uint256 public maxNoticePeriod;
  uint256 public totalWeight;
  mapping(address => Account) private accounts;
  // Maps voting, rewards, and validating delegates to the account that delegated these rights.
  mapping(address => address) public delegations;
  // Maps a block number to the cumulative reward for an account with weight 1 since genesis.
  mapping(uint256 => FixidityLib.Fraction) public cumulativeRewardWeights;

  event MaxNoticePeriodSet(
    uint256 maxNoticePeriod
  );

  event RoleDelegated(
    DelegateRole role,
    address indexed account,
    address delegate
  );

  event VotingFrozen(
    address indexed account
  );

  event VotingUnfrozen(
    address indexed account
  );

  event NewCommitment(
    address indexed account,
    uint256 value,
    uint256 noticePeriod
  );

  event CommitmentNotified(
    address indexed account,
    uint256 value,
    uint256 noticePeriod,
    uint256 availabilityTime
  );

  event CommitmentExtended(
    address indexed account,
    uint256 value,
    uint256 noticePeriod,
    uint256 availabilityTime
  );

  event Withdrawal(
    address indexed account,
    uint256 value
  );

  event NoticePeriodIncreased(
    address indexed account,
    uint256 value,
    uint256 noticePeriod,
    uint256 increase
  );

  function initialize(address registryAddress, uint256 _maxNoticePeriod) external initializer {
    _transferOwnership(msg.sender);
    setRegistry(registryAddress);
    maxNoticePeriod = _maxNoticePeriod;
  }

  /**
   * @notice Sets the cumulative block reward for 1 unit of account weight.
   * @param blockReward The total reward allocated to bonders for this block.
   * @dev Called by the EVM at the end of the block.
   */
  function setCumulativeRewardWeight(uint256 blockReward) external {
    require(blockReward > 0, "placeholder to suppress warning");
    return;
    // TODO(asa): Modify ganache to set cumulativeRewardWeights.
    // TODO(asa): Make inheritable `onlyVm` modifier.
    // Only callable by the EVM.
    // require(msg.sender == address(0), "sender was not vm (reserved addr 0x0)");
    // FractionUtil.Fraction storage previousCumulativeRewardWeight = cumulativeRewardWeights[
    //   block.number.sub(1)
    // ];

    // // This will be true the first time this is called by the EVM.
    // if (!previousCumulativeRewardWeight.exists()) {
    //   previousCumulativeRewardWeight.denominator = 1;
    // }

    // if (totalWeight > 0) {
    //   FractionUtil.Fraction memory currentRewardWeight = FractionUtil.Fraction(
    //     blockReward,
    //     totalWeight
    //   ).reduce();
    //   cumulativeRewardWeights[block.number] = previousCumulativeRewardWeight.add(
    //     currentRewardWeight
    //   );
    // } else {
    //   cumulativeRewardWeights[block.number] = previousCumulativeRewardWeight;
    // }
  }

  /**
   * @notice Sets the maximum notice period for an account.
   * @param _maxNoticePeriod The new maximum notice period.
   */
  function setMaxNoticePeriod(uint256 _maxNoticePeriod) external onlyOwner {
    maxNoticePeriod = _maxNoticePeriod;
    emit MaxNoticePeriodSet(maxNoticePeriod);
  }

  /**
   * @notice Creates an account.
   * @return True if account creation succeeded.
   */
  function createAccount()
    external
    returns (bool)
  {
    require(isNotAccount(msg.sender) && isNotDelegate(msg.sender));
    Account storage account = accounts[msg.sender];
    account.exists = true;
    account.rewardsLastRedeemed = uint96(block.number);
    return true;
  }

  /**
   * @notice Redeems rewards accrued since the last redemption for the specified account.
   * @return The amount of accrued rewards.
   * @dev Fails if `msg.sender` is not the owner or rewards recipient of the account.
   */
  function redeemRewards() external nonReentrant returns (uint256) {
    require(false, "Disabled");
    address account = getAccountFromDelegateAndRole(msg.sender, DelegateRole.Rewards);
    return _redeemRewards(account);
  }

  /**
   * @notice Freezes the voting power of `msg.sender`'s account.
   */
  function freezeVoting() external {
    require(isAccount(msg.sender));
    Account storage account = accounts[msg.sender];
    require(account.votingFrozen == false);
    account.votingFrozen = true;
    emit VotingFrozen(msg.sender);
  }

  /**
   * @notice Unfreezes the voting power of `msg.sender`'s account.
   */
  function unfreezeVoting() external {
    require(isAccount(msg.sender));
    Account storage account = accounts[msg.sender];
    require(account.votingFrozen == true);
    account.votingFrozen = false;
    emit VotingUnfrozen(msg.sender);
  }

  /**
   * @notice Delegates the validating power of `msg.sender`'s account to another address.
   * @param delegate The address to delegate to.
   * @param v The recovery id of the incoming ECDSA signature.
   * @param r Output value r of the ECDSA signature.
   * @param s Output value s of the ECDSA signature.
   * @dev Fails if the address is already a delegate or has an account .
   * @dev Fails if the current account is already participating in validation.
   * @dev v, r, s constitute `delegate`'s signature on `msg.sender`.
   */
  function delegateRole(
    DelegateRole role,
    address delegate,
    uint8 v,
    bytes32 r,
    bytes32 s
  )
    external
    nonReentrant
  {
    // TODO: split and add error messages for better dev feedback
    require(isAccount(msg.sender) && isNotAccount(delegate) && isNotDelegate(delegate));

    address signer = Signatures.getSignerOfAddress(msg.sender, v, r, s);
    require(signer == delegate);

    if (role == DelegateRole.Validating) {
      require(isNotValidating(msg.sender));
    } else if (role == DelegateRole.Voting) {
      require(!isVoting(msg.sender));
    } else if (role == DelegateRole.Rewards) {
      _redeemRewards(msg.sender);
    }

    Account storage account = accounts[msg.sender];
    delegations[account.delegates[uint256(role)]] = address(0);
    account.delegates[uint256(role)] = delegate;
    delegations[delegate] = msg.sender;
    emit RoleDelegated(role, msg.sender, delegate);
  }

  /**
   * @notice Adds a Locked Gold commitment to `msg.sender`'s account.
   * @param noticePeriod The notice period for the commitment.
   * @return The account's new weight.
   */
  function newCommitment(
    uint256 noticePeriod
  )
    external
    nonReentrant
    payable
    returns (uint256)
  {
    require(isAccount(msg.sender) && !isVoting(msg.sender));

    // _redeemRewards(msg.sender);
    require(msg.value > 0 && noticePeriod <= maxNoticePeriod);
    Account storage account = accounts[msg.sender];
    Commitment storage locked = account.commitments.locked[noticePeriod];
    updateLockedCommitment(account, uint256(locked.value).add(msg.value), noticePeriod);
    emit NewCommitment(msg.sender, msg.value, noticePeriod);
    return account.weight;
  }

  /**
   * @notice Notifies a Locked Gold commitment, allowing funds to be withdrawn after the notice
   *   period.
   * @param value The amount of the commitment to eventually withdraw.
   * @param noticePeriod The notice period of the Locked Gold commitment.
   * @return The account's new weight.
   */
  function notifyCommitment(
    uint256 value,
    uint256 noticePeriod
  )
    external
    nonReentrant
    returns (uint256)
  {
    require(isAccount(msg.sender) && isNotValidating(msg.sender) && !isVoting(msg.sender));
    // _redeemRewards(msg.sender);
    Account storage account = accounts[msg.sender];
    Commitment storage locked = account.commitments.locked[noticePeriod];
    require(locked.value >= value && value > 0);
    updateLockedCommitment(account, uint256(locked.value).sub(value), noticePeriod);

    // solhint-disable-next-line not-rely-on-time
    uint256 availabilityTime = now.add(noticePeriod);
    Commitment storage notified = account.commitments.notified[availabilityTime];
    updateNotifiedDeposit(account, uint256(notified.value).add(value), availabilityTime);

    emit CommitmentNotified(msg.sender, value, noticePeriod, availabilityTime);
    return account.weight;
  }

  /**
   * @notice Rebonds a notified commitment, with notice period >= the remaining time to
  *    availability.
   * @param value The amount of the commitment to rebond.
   * @param availabilityTime The availability time of the notified commitment.
   * @return The account's new weight.
   */
  function extendCommitment(
    uint256 value,
    uint256 availabilityTime
  )
    external
    nonReentrant
    returns (uint256)
  {
    require(isAccount(msg.sender) && !isVoting(msg.sender));
    // solhint-disable-next-line not-rely-on-time
    require(availabilityTime > now);
    // _redeemRewards(msg.sender);
    Account storage account = accounts[msg.sender];
    Commitment storage notified = account.commitments.notified[availabilityTime];
    require(notified.value >= value && value > 0);
    updateNotifiedDeposit(account, uint256(notified.value).sub(value), availabilityTime);
    // solhint-disable-next-line not-rely-on-time
    uint256 noticePeriod = availabilityTime.sub(now);
    Commitment storage locked = account.commitments.locked[noticePeriod];
    updateLockedCommitment(account, uint256(locked.value).add(value), noticePeriod);
    emit CommitmentExtended(msg.sender, value, noticePeriod, availabilityTime);
    return account.weight;
  }

  /**
   * @notice Withdraws a notified commitment after the duration of the notice period.
   * @param availabilityTime The availability time of the notified commitment.
   * @return The account's new weight.
   */
  function withdrawCommitment(
    uint256 availabilityTime
  )
    external
    nonReentrant
    returns (uint256)
  {
    require(isAccount(msg.sender) && !isVoting(msg.sender));
    // _redeemRewards(msg.sender);
    // solhint-disable-next-line not-rely-on-time
    require(now >= availabilityTime);
    _redeemRewards(msg.sender);
    Account storage account = accounts[msg.sender];
    Commitment storage notified = account.commitments.notified[availabilityTime];
    uint256 value = notified.value;
    require(value > 0);
    updateNotifiedDeposit(account, 0, availabilityTime);

    IERC20Token goldToken = IERC20Token(registry.getAddressFor(GOLD_TOKEN_REGISTRY_ID));
    require(goldToken.transfer(msg.sender, value));
    emit Withdrawal(msg.sender, value);
    return account.weight;
  }

  /**
   * @notice Increases the notice period for all or part of a Locked Gold commitment.
   * @param value The amount of the Locked Gold commitment to increase the notice period for.
   * @param noticePeriod The notice period of the Locked Gold commitment.
   * @param increase The amount to increase the notice period by.
   * @return The account's new weight.
   */
  function increaseNoticePeriod(
    uint256 value,
    uint256 noticePeriod,
    uint256 increase
  )
    external
    nonReentrant
    returns (uint256)
  {
    require(isAccount(msg.sender) && !isVoting(msg.sender));
    // _redeemRewards(msg.sender);
    require(value > 0 && increase > 0);
    Account storage account = accounts[msg.sender];
    Commitment storage locked = account.commitments.locked[noticePeriod];
    require(locked.value >= value);
    updateLockedCommitment(account, uint256(locked.value).sub(value), noticePeriod);
    uint256 increasedNoticePeriod = noticePeriod.add(increase);
    uint256 increasedValue = account.commitments.locked[increasedNoticePeriod].value;
    updateLockedCommitment(account, increasedValue.add(value), increasedNoticePeriod);
    emit NoticePeriodIncreased(msg.sender, value, noticePeriod, increase);
    return account.weight;
  }

  /**
   * @notice Returns whether or not an account's voting power is frozen.
   * @param account The address of the account.
   * @return Whether or not the account's voting power is frozen.
   * @dev Frozen accounts can retract existing votes but not make future votes.
   */
  function isVotingFrozen(address account) external view returns (bool) {
    return accounts[account].votingFrozen;
  }

  /**
   * @notice Returns the timestamp of the last time the account redeemed block rewards.
   * @param _account The address of the account.
   * @return The timestamp of the last time `_account` redeemed block rewards.
   */
  function getRewardsLastRedeemed(address _account) external view returns (uint96) {
    Account storage account = accounts[_account];
    return account.rewardsLastRedeemed;
  }

  function isValidating(address validator) external view returns (bool) {
    IValidators validators = IValidators(registry.getAddressFor(VALIDATORS_REGISTRY_ID));
    return validators.isValidating(validator);
  }

  /**
   * @notice Returns the notice periods of all Locked Gold for an account.
   * @param _account The address of the account.
   * @return The notice periods of all Locked Gold for `_account`.
   */
  function getNoticePeriods(address _account) external view returns (uint256[] memory) {
    Account storage account = accounts[_account];
    return account.commitments.noticePeriods;
  }

  /**
   * @notice Returns the availability times of all notified commitments for an account.
   * @param _account The address of the account.
   * @return The availability times of all notified commitments for `_account`.
   */
  function getAvailabilityTimes(address _account) external view returns (uint256[] memory) {
    Account storage account = accounts[_account];
    return account.commitments.availabilityTimes;
  }

  /**
   * @notice Returns the value and index of a specified Locked Gold commitment.
   * @param _account The address of the account.
   * @param noticePeriod The notice period of the Locked Gold commitment.
   * @return The value and index of the specified Locked Gold commitment.
   */
  function getLockedCommitment(
    address _account,
    uint256 noticePeriod
  )
    external
    view
    returns (uint256, uint256)
  {
    Account storage account = accounts[_account];
    Commitment storage locked = account.commitments.locked[noticePeriod];
    return (locked.value, locked.index);
  }

  /**
   * @notice Returns the value and index of a specified notified commitment.
   * @param _account The address of the account.
   * @param availabilityTime The availability time of the notified commitment.
   * @return The value and index of the specified notified commitment.
   */
  function getNotifiedCommitment(
    address _account,
    uint256 availabilityTime
  )
    external
    view
    returns (uint256, uint256)
  {
    Account storage account = accounts[_account];
    Commitment storage notified = account.commitments.notified[availabilityTime];
    return (notified.value, notified.index);
  }

  /**
   * @notice Returns the account associated with the provided delegate and role.
   * @param accountOrDelegate The address of the account or voting delegate.
   * @param role The delegate role to query for.
   * @dev Fails if the `accountOrDelegate` is a non-voting delegate.
   * @return The associated account.
   */
  function getAccountFromDelegateAndRole(
    address accountOrDelegate,
    DelegateRole role
  )
    public
    view
    returns (address)
  {
    address delegatingAccount = delegations[accountOrDelegate];
    if (delegatingAccount != address(0)) {
      require(accounts[delegatingAccount].delegates[uint256(role)] == accountOrDelegate);
      return delegatingAccount;
    } else {
      return accountOrDelegate;
    }
  }

  /**
   * @notice Returns the weight of a specified account.
   * @param _account The address of the account.
   * @return The weight of the specified account.
   */
  function getAccountWeight(address _account) external view returns (uint256) {
    Account storage account = accounts[_account];
    return account.weight;
  }

  /**
   * @notice Returns whether or not a specified account is voting.
   * @param account The address of the account.
   * @return Whether or not the account is voting.
   */
  function isVoting(address account) public view returns (bool) {
    address voter = getDelegateFromAccountAndRole(account, DelegateRole.Voting);
    IGovernance governance = IGovernance(registry.getAddressFor(GOVERNANCE_REGISTRY_ID));
    IValidators validators = IValidators(registry.getAddressFor(VALIDATORS_REGISTRY_ID));
    return (governance.isVoting(voter) || validators.isVoting(voter));
  }

  /**
   * @notice Returns the weight of a commitment for a given notice period.
   * @param value The value of the commitment.
   * @param noticePeriod The notice period of the commitment.
   * @return The weight of the commitment.
   * @dev A commitment's weight is (1 + sqrt(noticePeriodDays) / 30) * value.
   */
  function getCommitmentWeight(uint256 value, uint256 noticePeriod) public pure returns (uint256) {
    uint256 precision = 10000;
    uint256 noticeDays = noticePeriod.div(1 days);
    uint256 preciseMultiplier = sqrt(noticeDays).mul(precision).div(30).add(precision);
    return preciseMultiplier.mul(value).div(precision);
  }

  /**
   * @notice Returns the delegate for a specified account and role.
   * @param account The address of the account.
   * @param role The role to query for.
   * @return The rewards recipient for the account.
   */
  function getDelegateFromAccountAndRole(
    address account,
    DelegateRole role
  )
    public
    view
    returns (address)
  {
    address delegate = accounts[account].delegates[uint256(role)];
    if (delegate == address(0)) {
      return account;
    } else {
      return delegate;
    }
  }

  // TODO(asa): Factor in governance, validator election participation.
  /**
   * @notice Redeems rewards accrued since the last redemption for a specified account.
   * @param _account The address of the account to redeem rewards for.
   * @return The amount of accrued rewards.
   */
  function _redeemRewards(address _account) private returns (uint256) {
    Account storage account = accounts[_account];
    uint256 rewardBlockNumber = block.number.sub(1);
    FixidityLib.Fraction memory previousCumulativeRewardWeight = cumulativeRewardWeights[
      account.rewardsLastRedeemed
    ];
    FixidityLib.Fraction memory cumulativeRewardWeight = cumulativeRewardWeights[
      rewardBlockNumber
    ];
    // We should never get here except in testing, where cumulativeRewardWeight will not be set.
    if (previousCumulativeRewardWeight.unwrap() == 0 || cumulativeRewardWeight.unwrap() == 0) {
      return 0;
    }

    FixidityLib.Fraction memory rewardWeight = cumulativeRewardWeight.subtract(
      previousCumulativeRewardWeight
    );
    require(rewardWeight.unwrap() != 0, "Rewards weight does not exist");
    uint256 value = rewardWeight.multiply(FixidityLib.wrap(account.weight)).fromFixed();
    account.rewardsLastRedeemed = uint96(rewardBlockNumber);
    if (value > 0) {
      address recipient = getDelegateFromAccountAndRole(_account, DelegateRole.Rewards);
      IERC20Token goldToken = IERC20Token(registry.getAddressFor(GOLD_TOKEN_REGISTRY_ID));
      require(goldToken.transfer(recipient, value));
      emit Withdrawal(recipient, value);
    }
    return value;
  }

  /**
   * @notice Updates the Locked Gold commitment for a given notice period to a new value.
   * @param account The account to update the Locked Gold commitment for.
   * @param value The new value of the Locked Gold commitment.
   * @param noticePeriod The notice period of the Locked Gold commitment.
   */
  function updateLockedCommitment(
    Account storage account,
    uint256 value,
    uint256 noticePeriod
  )
    private
  {
    Commitment storage locked = account.commitments.locked[noticePeriod];
    require(value != locked.value);
    uint256 weight;
    if (locked.value == 0) {
      locked.index = uint128(account.commitments.noticePeriods.length);
      locked.value = uint128(value);
      account.commitments.noticePeriods.push(noticePeriod);
      weight = getCommitmentWeight(value, noticePeriod);
      account.weight = account.weight.add(weight);
      totalWeight = totalWeight.add(weight);
    } else if (value == 0) {
      weight = getCommitmentWeight(locked.value, noticePeriod);
      account.weight = account.weight.sub(weight);
      totalWeight = totalWeight.sub(weight);
      deleteCommitment(locked, account.commitments, CommitmentType.Locked);
    } else {
      uint256 originalWeight = getCommitmentWeight(locked.value, noticePeriod);
      weight = getCommitmentWeight(value, noticePeriod);

      uint256 difference;
      if (weight >= originalWeight) {
        difference = weight.sub(originalWeight);
        account.weight = account.weight.add(difference);
        totalWeight = totalWeight.add(difference);
      } else {
        difference = originalWeight.sub(weight);
        account.weight = account.weight.sub(difference);
        totalWeight = totalWeight.sub(difference);
      }

      locked.value = uint128(value);
    }
  }

  /**
   * @notice Updates the notified commitment for a given availability time to a new value.
   * @param account The account to update the notified commitment for.
   * @param value The new value of the notified commitment.
   * @param availabilityTime The availability time of the notified commitment.
   */
  function updateNotifiedDeposit(
    Account storage account,
    uint256 value,
    uint256 availabilityTime
  )
    private
  {
    Commitment storage notified = account.commitments.notified[availabilityTime];
    require(value != notified.value);
    if (notified.value == 0) {
      notified.index = uint128(account.commitments.availabilityTimes.length);
      notified.value = uint128(value);
      account.commitments.availabilityTimes.push(availabilityTime);
      account.weight = account.weight.add(notified.value);
      totalWeight = totalWeight.add(notified.value);
    } else if (value == 0) {
      account.weight = account.weight.sub(notified.value);
      totalWeight = totalWeight.sub(notified.value);
      deleteCommitment(notified, account.commitments, CommitmentType.Notified);
    } else {
      uint256 difference;
      if (value >= notified.value) {
        difference = value.sub(notified.value);
        account.weight = account.weight.add(difference);
        totalWeight = totalWeight.add(difference);
      } else {
        difference = uint256(notified.value).sub(value);
        account.weight = account.weight.sub(difference);
        totalWeight = totalWeight.sub(difference);
      }

      notified.value = uint128(value);
    }
  }

  /**
   * @notice Deletes a commitment from an account.
   * @param _commitment The commitment to delete.
   * @param commitments The struct containing the account's commitments.
   * @param commitmentType Whether the deleted commitment is locked or notified.
   */
  function deleteCommitment(
    Commitment storage _commitment,
    Commitments storage commitments,
    CommitmentType commitmentType
  )
    private
  {
    uint256 lastIndex;
    if (commitmentType == CommitmentType.Locked) {
      lastIndex = commitments.noticePeriods.length.sub(1);
      commitments.locked[commitments.noticePeriods[lastIndex]].index = _commitment.index;
      deleteElement(commitments.noticePeriods, _commitment.index, lastIndex);
    } else {
      lastIndex = commitments.availabilityTimes.length.sub(1);
      commitments.notified[commitments.availabilityTimes[lastIndex]].index = _commitment.index;
      deleteElement(commitments.availabilityTimes, _commitment.index, lastIndex);
    }

    // Delete commitment info.
    _commitment.index = 0;
    _commitment.value = 0;
  }

  /**
   * @notice Deletes an element from a list of uint256s.
   * @param list The list of uint256s.
   * @param index The index of the element to delete.
   * @param lastIndex The index of the last element in the list.
   */
  function deleteElement(uint256[] storage list, uint256 index, uint256 lastIndex) private {
    list[index] = list[lastIndex];
    list[lastIndex] = 0;
    list.length = lastIndex;
  }

  /**
   * @notice Check if an account already exists.
   * @param account The address of the account
   * @return Returns `true` if account exists. Returns `false` otherwise.
   *         In particular it will return `false` if a delegate with given address exists.
   */
  function isAccount(address account) public view returns (bool) {
    return (accounts[account].exists);
  }

  /**
   * @notice Check if a delegate already exists.
   * @param account The address of the delegate
   * @return Returns `true` if delegate exists. Returns `false` otherwise.
   */
  function isDelegate(address account) external view returns (bool) {
    return (delegations[account] != address(0));
  }


  function isNotAccount(address account) internal view returns (bool) {
    return (!accounts[account].exists);
  }

  // Reverts if rewards, voting, or validating rights have been delegated to `account`.
  function isNotDelegate(address account) internal view returns (bool) {
    return (delegations[account] == address(0));
  }

  // TODO(asa): Allow users to notify if they would continue to meet the registration
  // requirements.
  function isNotValidating(address account) internal view returns (bool) {
    address validator = getDelegateFromAccountAndRole(account, DelegateRole.Validating);
    IValidators validators = IValidators(registry.getAddressFor(VALIDATORS_REGISTRY_ID));
    return (!validators.isValidating(validator));
  }

  // TODO: consider using Fixidity's roots
  /**
   * @notice Approxmiates the square root of x using the Bablyonian method.
   * @param x The number to take the square root of.
   * @return An approximation of the square root of x.
   * @dev The error can be large for smaller numbers, so we multiply by the square of `precision`.
   */
  function sqrt(uint256 x) private pure returns (FractionUtil.Fraction memory) {
    uint256 precision = 100;
    uint256 px = x.mul(precision.mul(precision));
    uint256 z = px.add(1).div(2);
    uint256 y = px;
    while (z < y) {
      y = z;
      z = px.div(z).add(z).div(2);
    }
    return FractionUtil.Fraction(y, precision);
  }
}
