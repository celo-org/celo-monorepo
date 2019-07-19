pragma solidity ^0.5.8;

import "openzeppelin-solidity/contracts/utils/ReentrancyGuard.sol";
import "openzeppelin-solidity/contracts/math/SafeMath.sol";
import "openzeppelin-solidity/contracts/ownership/Ownable.sol";

import "./interfaces/IBondedDeposits.sol";
import "./interfaces/IGovernance.sol";
import "./interfaces/IValidators.sol";

import "../common/Initializable.sol";
import "../common/UsingRegistry.sol";
import "../common/interfaces/IERC20Token.sol";
import "../common/Signatures.sol";
import "../stability/FractionUtil.sol";

contract BondedDeposits is IBondedDeposits, ReentrancyGuard, Initializable, UsingRegistry {

  using FractionUtil for FractionUtil.Fraction;
  using SafeMath for uint256;

  // TODO(asa): Remove index for gas efficiency if two updates to the same slot costs extra gas.
  struct Deposit {
    uint128 value;
    uint128 index;
  }

  struct Deposits {
    // Maps a notice period in seconds to a bonded deposit.
    mapping(uint256 => Deposit) bonded;
    // Maps an availability time in seconds since epoch to a notified deposit.
    mapping(uint256 => Deposit) notified;
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
    Deposits deposits;
  }

  // TODO(asa): Add minNoticePeriod
  uint256 public maxNoticePeriod;
  uint256 public totalWeight;
  mapping(address => Account) private accounts;
  // Maps voting, rewards, and validating delegates to the account that delegated these rights.
  mapping(address => address) public delegations;
  // Maps a block number to the cumulative reward for an account with weight 1 since genesis.
  mapping(uint256 => FractionUtil.Fraction) public cumulativeRewardWeights;

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

  event DepositBonded(
    address indexed account,
    uint256 value,
    uint256 noticePeriod
  );

  event DepositNotified(
    address indexed account,
    uint256 value,
    uint256 noticePeriod,
    uint256 availabilityTime
  );

  event DepositRebonded(
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
    // TODO(asa): Modify ganache to set cumulativeRewardWeights.
    // TODO(asa): Make inheritable `onlyVm` modifier.
    // Only callable by the EVM.
    require(msg.sender == address(0), "sender was not vm (reserved addr 0x0)");
    FractionUtil.Fraction storage previousCumulativeRewardWeight = cumulativeRewardWeights[
      block.number.sub(1)
    ];

    // This will be true the first time this is called by the EVM.
    if (!previousCumulativeRewardWeight.exists()) {
      previousCumulativeRewardWeight.denominator = 1;
    }

    if (totalWeight > 0) {
      FractionUtil.Fraction memory currentRewardWeight = FractionUtil.Fraction(
        blockReward,
        totalWeight
      ).reduce();
      cumulativeRewardWeights[block.number] = previousCumulativeRewardWeight.add(
        currentRewardWeight
      ).reduce();
    } else {
      cumulativeRewardWeights[block.number] = previousCumulativeRewardWeight;
    }
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
   * @notice Adds a bonded deposit to `msg.sender`'s account.
   * @param noticePeriod The notice period for the deposit.
   * @return The account's new weight.
   */
  function deposit(
    uint256 noticePeriod
  )
    external
    nonReentrant
    payable
    returns (uint256)
  {
    require(isAccount(msg.sender) && !isVoting(msg.sender));

    _redeemRewards(msg.sender);
    require(msg.value > 0 && noticePeriod <= maxNoticePeriod);
    Account storage account = accounts[msg.sender];
    Deposit storage bonded = account.deposits.bonded[noticePeriod];
    updateBondedDeposit(account, uint256(bonded.value).add(msg.value), noticePeriod);
    emit DepositBonded(msg.sender, msg.value, noticePeriod);
    return account.weight;
  }

  /**
   * @notice Notifies a bonded deposit, allowing funds to be withdrawn after the notice period.
   * @param value The amount of the deposit to eventually withdraw.
   * @param noticePeriod The notice period of the bonded deposit.
   * @return The account's new weight.
   */
  function notify(
    uint256 value,
    uint256 noticePeriod
  )
    external
    nonReentrant
    returns (uint256)
  {
    require(isAccount(msg.sender) && isNotValidating(msg.sender) && !isVoting(msg.sender));
    _redeemRewards(msg.sender);
    Account storage account = accounts[msg.sender];
    Deposit storage bonded = account.deposits.bonded[noticePeriod];
    require(bonded.value >= value && value > 0);
    updateBondedDeposit(account, uint256(bonded.value).sub(value), noticePeriod);

    // solhint-disable-next-line not-rely-on-time
    uint256 availabilityTime = now.add(noticePeriod);
    Deposit storage notified = account.deposits.notified[availabilityTime];
    updateNotifiedDeposit(account, uint256(notified.value).add(value), availabilityTime);

    emit DepositNotified(msg.sender, value, noticePeriod, availabilityTime);
    return account.weight;
  }

  /**
   * @notice Rebonds a notified deposit, with notice period >= the remaining time to availability.
   * @param value The amount of the deposit to rebond.
   * @param availabilityTime The availability time of the notified deposit.
   * @return The account's new weight.
   */
  function rebond(
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
    _redeemRewards(msg.sender);
    Account storage account = accounts[msg.sender];
    Deposit storage notified = account.deposits.notified[availabilityTime];
    require(notified.value >= value && value > 0);
    updateNotifiedDeposit(account, uint256(notified.value).sub(value), availabilityTime);
    // solhint-disable-next-line not-rely-on-time
    uint256 noticePeriod = availabilityTime.sub(now);
    Deposit storage bonded = account.deposits.bonded[noticePeriod];
    updateBondedDeposit(account, uint256(bonded.value).add(value), noticePeriod);
    emit DepositRebonded(msg.sender, value, noticePeriod, availabilityTime);
    return account.weight;
  }

  /**
   * @notice Withdraws a notified deposit after the duration of the notice period.
   * @param availabilityTime The availability time of the notified deposit.
   * @return The account's new weight.
   */
  function withdraw(
    uint256 availabilityTime
  )
    external
    nonReentrant
    returns (uint256)
  {
    require(isAccount(msg.sender) && !isVoting(msg.sender));
    // solhint-disable-next-line not-rely-on-time
    require(now >= availabilityTime);
    _redeemRewards(msg.sender);
    Account storage account = accounts[msg.sender];
    Deposit storage notified = account.deposits.notified[availabilityTime];
    uint256 value = notified.value;
    require(value > 0);
    updateNotifiedDeposit(account, 0, availabilityTime);

    IERC20Token goldToken = IERC20Token(registry.getAddressFor(GOLD_TOKEN_REGISTRY_ID));
    require(goldToken.transfer(msg.sender, value));
    emit Withdrawal(msg.sender, value);
    return account.weight;
  }

  /**
   * @notice Increases the notice period for all or part of a bonded deposit.
   * @param value The amount of the bonded deposit to increase the notice period for.
   * @param noticePeriod The notice period of the bonded deposit.
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
    _redeemRewards(msg.sender);
    require(value > 0 && increase > 0);
    Account storage account = accounts[msg.sender];
    Deposit storage bonded = account.deposits.bonded[noticePeriod];
    require(bonded.value >= value);
    updateBondedDeposit(account, uint256(bonded.value).sub(value), noticePeriod);
    uint256 increasedNoticePeriod = noticePeriod.add(increase);
    uint256 increasedValue = account.deposits.bonded[increasedNoticePeriod].value;
    updateBondedDeposit(account, increasedValue.add(value), increasedNoticePeriod);
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

  function isValidating(address validator) public view returns (bool) {
    IValidators validators = IValidators(registry.getAddressFor(VALIDATORS_REGISTRY_ID));
    return validators.isValidating(validator);
  }

  /**
   * @notice Returns the notice periods of all bonded deposits for an account.
   * @param _account The address of the account.
   * @return The notice periods of all bonded deposits for `_account`.
   */
  function getNoticePeriods(address _account) external view returns (uint256[] memory) {
    Account storage account = accounts[_account];
    return account.deposits.noticePeriods;
  }

  /**
   * @notice Returns the availability times of all notified deposits for an account.
   * @param _account The address of the account.
   * @return The availability times of all notified deposits for `_account`.
   */
  function getAvailabilityTimes(address _account) external view returns (uint256[] memory) {
    Account storage account = accounts[_account];
    return account.deposits.availabilityTimes;
  }

  /**
   * @notice Returns the value and index of a specified bonded deposit.
   * @param _account The address of the account.
   * @param noticePeriod The notice period of the bonded deposit.
   * @return The value and index of the specified bonded deposit.
   */
  function getBondedDeposit(
    address _account,
    uint256 noticePeriod
  )
    external
    view
    returns (uint256, uint256)
  {
    Account storage account = accounts[_account];
    Deposit storage bonded = account.deposits.bonded[noticePeriod];
    return (bonded.value, bonded.index);
  }

  /**
   * @notice Returns the value and index of a specified notified deposit.
   * @param _account The address of the account.
   * @param availabilityTime The availability time of the notified deposit.
   * @return The value and index of the specified notified deposit.
   */
  function getNotifiedDeposit(
    address _account,
    uint256 availabilityTime
  )
    external
    view
    returns (uint256, uint256)
  {
    Account storage account = accounts[_account];
    Deposit storage notified = account.deposits.notified[availabilityTime];
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

  // TODO(asa): Update this when decision made.
  /**
   * @notice Returns the weight of a deposit for a given notice period.
   * @param value The value of the deposit.
   * @param noticePeriod The notice period of the deposit.
   * @return The weight of the deposit.
   */
  function getDepositWeight(uint256 value, uint256 noticePeriod) public pure returns (uint256) {
    return value.mul(noticePeriod);
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
    FractionUtil.Fraction storage previousCumulativeRewardWeight = cumulativeRewardWeights[
      account.rewardsLastRedeemed
    ];
    FractionUtil.Fraction storage cumulativeRewardWeight = cumulativeRewardWeights[
      rewardBlockNumber
    ];
    // We should never get here except in testing, where cumulativeRewardWeight will not be set.
    if (!previousCumulativeRewardWeight.exists() || !cumulativeRewardWeight.exists()) {
      return 0;
    }

    FractionUtil.Fraction memory rewardWeight = cumulativeRewardWeight.sub(
      previousCumulativeRewardWeight
    );
    require(rewardWeight.exists(), "Rewards weight does not exist");
    uint256 value = rewardWeight.mul(account.weight);
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
   * @notice Updates the bonded deposit for a given notice period to a new value.
   * @param account The account to update the bonded deposit for.
   * @param value The new value of the bonded deposit.
   * @param noticePeriod The notice period of the bonded deposit.
   */
  function updateBondedDeposit(
    Account storage account,
    uint256 value,
    uint256 noticePeriod
  )
    private
  {
    Deposit storage bonded = account.deposits.bonded[noticePeriod];
    require(value != bonded.value);
    uint256 weight;
    if (bonded.value == 0) {
      bonded.index = uint128(account.deposits.noticePeriods.length);
      bonded.value = uint128(value);
      account.deposits.noticePeriods.push(noticePeriod);
      weight = getDepositWeight(value, noticePeriod);
      account.weight = account.weight.add(weight);
      totalWeight = totalWeight.add(weight);
    } else if (value == 0) {
      weight = getDepositWeight(bonded.value, noticePeriod);
      account.weight = account.weight.sub(weight);
      totalWeight = totalWeight.sub(weight);
      deleteDeposit(bonded, account.deposits, DepositType.Bonded);
    } else {
      uint256 originalWeight = getDepositWeight(bonded.value, noticePeriod);
      weight = getDepositWeight(value, noticePeriod);

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

      bonded.value = uint128(value);
    }
  }

  /**
   * @notice Updates the notified deposit for a given availability time to a new value.
   * @param account The account to update the notified deposit for.
   * @param value The new value of the notified deposit.
   * @param availabilityTime The availability time of the notified deposit.
   */
  function updateNotifiedDeposit(
    Account storage account,
    uint256 value,
    uint256 availabilityTime
  )
    private
  {
    Deposit storage notified = account.deposits.notified[availabilityTime];
    require(value != notified.value);
    if (notified.value == 0) {
      notified.index = uint128(account.deposits.availabilityTimes.length);
      notified.value = uint128(value);
      account.deposits.availabilityTimes.push(availabilityTime);
      account.weight = account.weight.add(notified.value);
      totalWeight = totalWeight.add(notified.value);
    } else if (value == 0) {
      account.weight = account.weight.sub(notified.value);
      totalWeight = totalWeight.sub(notified.value);
      deleteDeposit(notified, account.deposits, DepositType.Notified);
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
   * @notice Deletes a deposit from an account.
   * @param _deposit The deposit to delete.
   * @param deposits The struct containing the account's deposits.
   * @param depositType Whether the deleted deposit is bonded or notified.
   */
  function deleteDeposit(
    Deposit storage _deposit,
    Deposits storage deposits,
    DepositType depositType
  )
    private
  {
    uint256 lastIndex;
    if (depositType == DepositType.Bonded) {
      lastIndex = deposits.noticePeriods.length.sub(1);
      deposits.bonded[deposits.noticePeriods[lastIndex]].index = _deposit.index;
      deleteElement(deposits.noticePeriods, _deposit.index, lastIndex);
    } else {
      lastIndex = deposits.availabilityTimes.length.sub(1);
      deposits.notified[deposits.availabilityTimes[lastIndex]].index = _deposit.index;
      deleteElement(deposits.availabilityTimes, _deposit.index, lastIndex);
    }

    // Delete deposit info.
    _deposit.index = 0;
    _deposit.value = 0;
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

  function isAccount(address account) internal view returns (bool) {
    return (accounts[account].exists);
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
}
