pragma solidity ^0.5.13;

import "openzeppelin-solidity/contracts/math/Math.sol";
import "openzeppelin-solidity/contracts/math/SafeMath.sol";
import "openzeppelin-solidity/contracts/ownership/Ownable.sol";
import "openzeppelin-solidity/contracts/utils/Address.sol";
import "openzeppelin-solidity/contracts/utils/EnumerableSet.sol";

import "./interfaces/ILockedGold.sol";

import "../common/FixidityLib.sol";
import "../common/Initializable.sol";
import "../common/Signatures.sol";
import "../common/UsingRegistry.sol";
import "../common/interfaces/ICeloVersionedContract.sol";
import "../common/libraries/ReentrancyGuard.sol";

contract LockedGold is
  ILockedGold,
  ICeloVersionedContract,
  ReentrancyGuard,
  Initializable,
  UsingRegistry
{
  // TODO add initializer
  using SafeMath for uint256;
  using Address for address payable; // prettier-ignore
  using FixidityLib for FixidityLib.Fraction;
  using EnumerableSet for EnumerableSet.AddressSet;

  struct PendingWithdrawal {
    // The value of the pending withdrawal.
    uint256 value;
    // The timestamp at which the pending withdrawal becomes available.
    uint256 timestamp;
  }

  // NOTE: This contract does not store an account's locked gold that is being used in electing
  // validators.
  struct Balances {
    // The amount of locked gold that this account has that is not currently participating in
    // validator elections.
    uint256 nonvoting;
    // Gold that has been unlocked and will become available for withdrawal.
    PendingWithdrawal[] pendingWithdrawals;
  }

  struct DelegatedInfo {
    FixidityLib.Fraction percentage;
    uint256 currentAmount;
  }

  struct Delegated {
    EnumerableSet.AddressSet delegatees;
    // delegatees with how much percent delegatees are getting
    // Celo at the time of delegation/latest update
    mapping(address => DelegatedInfo) delegateesWithPercentagesAndAmount;
    FixidityLib.Fraction totalDelegatedCeloFraction;
  }

  mapping(address => Balances) internal balances;

  // Iterable map to store whitelisted identifiers.
  // Necessary to allow iterating over whitelisted IDs to check ID's address at runtime.
  mapping(bytes32 => bool) internal slashingMap;
  bytes32[] public slashingWhitelist;

  uint256 public totalNonvoting;
  uint256 public unlockingPeriod;

  // Info about delegator
  mapping(address => Delegated) delegatorInfo;
  // Celo that was delegated to this particular address
  mapping(address => uint256) public totalDelegatedCelo;

  // maximum amount of allowed delegatees
  uint256 maxDelegateesCount;

  event UnlockingPeriodSet(uint256 period);
  event GoldLocked(address indexed account, uint256 value);
  event GoldUnlocked(address indexed account, uint256 value, uint256 available);
  event GoldRelocked(address indexed account, uint256 value);
  event GoldWithdrawn(address indexed account, uint256 value);
  event SlasherWhitelistAdded(string indexed slasherIdentifier);
  event SlasherWhitelistRemoved(string indexed slasherIdentifier);
  event AccountSlashed(
    address indexed slashed,
    uint256 penalty,
    address indexed reporter,
    uint256 reward
  );
  event CeloDelegated(
    address indexed delegator,
    address indexed delegatee,
    uint256 percent,
    uint256 amount
  );
  event DelegatedCeloRevoked(
    address indexed delegator,
    address indexed delegatee,
    uint256 percent,
    uint256 amount
  );
  event MaxDelegateesCountSet(uint256 value);

  modifier onlySlasher() {
    require(
      registry.isOneOf(slashingWhitelist, msg.sender),
      "Caller is not a whitelisted slasher."
    );
    _;
  }

  /**
   * @notice Sets initialized == true on implementation contracts
   * @param test Set to true to skip implementation initialization
   */
  constructor(bool test) public Initializable(test) {}

  /**
   * @notice Used in place of the constructor to allow the contract to be upgradable via proxy.
   * @param registryAddress The address of the registry core smart contract.
   * @param _unlockingPeriod The unlocking period in seconds.
   */
  function initialize(address registryAddress, uint256 _unlockingPeriod) external initializer {
    _transferOwnership(msg.sender);
    setRegistry(registryAddress);
    setUnlockingPeriod(_unlockingPeriod);
    maxDelegateesCount = 10;
  }

  /**
   * @notice Locks gold to be used for voting.
   */
  function lock() external payable nonReentrant {
    require(
      getAccounts().isAccount(msg.sender),
      "Must first register address with Account.createAccount"
    );
    _incrementNonvotingAccountBalance(msg.sender, msg.value);
    _updateDelegatedAmount(msg.sender);
    emit GoldLocked(msg.sender, msg.value);
  }

  /**
   * @notice Increments the non-voting balance for an account.
   * @param account The account whose non-voting balance should be incremented.
   * @param value The amount by which to increment.
   * @dev Can only be called by the registered Election smart contract.
   */
  function incrementNonvotingAccountBalance(
    address account,
    uint256 value
  ) external onlyRegisteredContract(ELECTION_REGISTRY_ID) {
    _incrementNonvotingAccountBalance(account, value);
  }

  /**
   * @notice Decrements the non-voting balance for an account.
   * @param account The account whose non-voting balance should be decremented.
   * @param value The amount by which to decrement.
   * @dev Can only be called by the registered "Election" smart contract.
   */
  function decrementNonvotingAccountBalance(
    address account,
    uint256 value
  ) external onlyRegisteredContract(ELECTION_REGISTRY_ID) {
    _decrementNonvotingAccountBalance(account, value);
  }

  /**
   * @notice Unlocks gold that becomes withdrawable after the unlocking period.
   * @param value The amount of gold to unlock.
   */
  function unlock(uint256 value) external nonReentrant {
    require(
      getAccounts().isAccount(msg.sender),
      "Sender must be registered with Account.createAccount to lock or unlock"
    );
    Balances storage account = balances[msg.sender];

    uint256 totalLockedGold = getAccountTotalLockedGold(msg.sender);
    // Prevent unlocking gold when voting on governance proposals so that the gold cannot be
    // used to vote more than once.
    uint256 remainingLockedGold = totalLockedGold.sub(value);

    uint256 totalReferendumVotes = getGovernance().getAmountOfGoldUsedForVoting(msg.sender);
    require(
      remainingLockedGold >= totalReferendumVotes,
      "Not enough unlockable celo. Celo is locked in voting."
    );

    FixidityLib.Fraction memory delegatedPercentage = delegatorInfo[msg.sender]
      .totalDelegatedCeloFraction;

    if (FixidityLib.gt(delegatedPercentage, FixidityLib.newFixed(0))) {
      revokeFromDelegatedWhenUnlocking(msg.sender, value);
    }

    uint256 balanceRequirement = getValidators().getAccountLockedGoldRequirement(msg.sender);
    require(
      balanceRequirement == 0 || balanceRequirement <= remainingLockedGold,
      "Either account doesn't have enough locked Celo or locked Celo is being used for voting."
    );
    _decrementNonvotingAccountBalance(msg.sender, value);
    uint256 available = now.add(unlockingPeriod);
    // CERTORA: the slot containing the length could be MAX_UINT
    account.pendingWithdrawals.push(PendingWithdrawal(value, available));
    emit GoldUnlocked(msg.sender, value, available);
  }

  /**
   * @notice Relocks gold that has been unlocked but not withdrawn.
   * @param index The index of the pending withdrawal to relock from.
   * @param value The value to relock from the specified pending withdrawal.
   */
  function relock(uint256 index, uint256 value) external nonReentrant {
    require(
      getAccounts().isAccount(msg.sender),
      "Sender must be registered with Account.createAccount to lock or relock"
    );
    Balances storage account = balances[msg.sender];
    require(index < account.pendingWithdrawals.length, "Bad pending withdrawal index");
    PendingWithdrawal storage pendingWithdrawal = account.pendingWithdrawals[index];
    require(value <= pendingWithdrawal.value, "Requested value larger than pending value");
    if (value == pendingWithdrawal.value) {
      deletePendingWithdrawal(account.pendingWithdrawals, index);
    } else {
      pendingWithdrawal.value = pendingWithdrawal.value.sub(value);
    }
    _incrementNonvotingAccountBalance(msg.sender, value);
    _updateDelegatedAmount(msg.sender);
    emit GoldRelocked(msg.sender, value);
  }

  /**
   * @notice Withdraws gold that has been unlocked after the unlocking period has passed.
   * @param index The index of the pending withdrawal to withdraw.
   */
  function withdraw(uint256 index) external nonReentrant {
    require(
      getAccounts().isAccount(msg.sender),
      "Sender must be registered with Account.createAccount to withdraw"
    );
    Balances storage account = balances[msg.sender];
    require(index < account.pendingWithdrawals.length, "Bad pending withdrawal index");
    PendingWithdrawal storage pendingWithdrawal = account.pendingWithdrawals[index];
    require(now >= pendingWithdrawal.timestamp, "Pending withdrawal not available");
    uint256 value = pendingWithdrawal.value;
    deletePendingWithdrawal(account.pendingWithdrawals, index);
    require(value <= address(this).balance, "Inconsistent balance");
    msg.sender.sendValue(value);
    emit GoldWithdrawn(msg.sender, value);
  }

  /**
   * Delegates CELO to delegatee.
   * @param delegatee The delegatee account.
   * @param delegateFraction Fraction of total CELO that will be delegated from delegatee. Fixidity fraction
   */
  function delegateGovernanceVotes(address delegatee, uint256 delegateFraction) external {
    FixidityLib.Fraction memory percentageToDelegate = FixidityLib.wrap(delegateFraction);
    require(
      FixidityLib.lte(percentageToDelegate, FixidityLib.fixed1()),
      "Delegate fraction must be less than or equal to 1"
    );
    address delegatorAccount = getAccounts().voteSignerToAccount(msg.sender);
    address delegateeAccount = getAccounts().voteSignerToAccount(delegatee);

    IValidators validators = getValidators();
    require(!validators.isValidator(delegatorAccount), "Validators cannot delegate votes.");
    require(
      !validators.isValidatorGroup(delegatorAccount),
      "Validator groups cannot delegate votes."
    );

    Delegated storage delegated = delegatorInfo[delegatorAccount];
    delegated.delegatees.add(delegateeAccount);
    require(delegated.delegatees.length() <= maxDelegateesCount, "Too many delegatees");

    DelegatedInfo storage currentDelegateeInfo = delegated.delegateesWithPercentagesAndAmount[
      delegateeAccount
    ];

    require(
      FixidityLib.gte(percentageToDelegate, currentDelegateeInfo.percentage),
      "Cannot decrease delegated amount - use revokeDelegatedGovernanceVotes."
    );

    FixidityLib.Fraction memory requestedToDelegate = delegated
      .totalDelegatedCeloFraction
      .subtract(currentDelegateeInfo.percentage)
      .add(percentageToDelegate);

    require(
      FixidityLib.lte(requestedToDelegate, FixidityLib.fixed1()),
      "Cannot delegate more than 100%"
    );

    uint256 totalLockedGold = getAccountTotalLockedGold(delegatorAccount);
    if (totalLockedGold == 0) {
      delegated.totalDelegatedCeloFraction = delegated
        .totalDelegatedCeloFraction
        .subtract(currentDelegateeInfo.percentage)
        .add(percentageToDelegate);
      currentDelegateeInfo.percentage = percentageToDelegate;

      emit CeloDelegated(
        delegatorAccount,
        delegateeAccount,
        FixidityLib.unwrap(percentageToDelegate),
        currentDelegateeInfo.currentAmount
      );
      return;
    }

    uint256 totalReferendumVotes = getGovernance().getAmountOfGoldUsedForVoting(delegatorAccount);

    if (totalReferendumVotes != 0) {
      FixidityLib.Fraction memory referendumVotesInPercents = FixidityLib.newFixedFraction(
        totalReferendumVotes,
        totalLockedGold
      );
      require(
        FixidityLib.lte(referendumVotesInPercents.add(requestedToDelegate), FixidityLib.fixed1()),
        "Cannot delegate votes that are voting in referendum"
      );
    }

    // amount that will really be delegated - whatever is already
    // delegated to this particular delagatee is already subracted from this
    uint256 amountToDelegate = FixidityLib
      .newFixed(totalLockedGold)
      .multiply(percentageToDelegate)
      .subtract(FixidityLib.newFixed(currentDelegateeInfo.currentAmount))
      .fromFixed();

    delegated.totalDelegatedCeloFraction = delegated
      .totalDelegatedCeloFraction
      .subtract(currentDelegateeInfo.percentage)
      .add(percentageToDelegate);
    currentDelegateeInfo.percentage = percentageToDelegate;

    currentDelegateeInfo.currentAmount = currentDelegateeInfo.currentAmount.add(amountToDelegate);
    totalDelegatedCelo[delegateeAccount] = totalDelegatedCelo[delegateeAccount].add(
      amountToDelegate
    );

    emit CeloDelegated(
      delegatorAccount,
      delegateeAccount,
      FixidityLib.unwrap(percentageToDelegate),
      currentDelegateeInfo.currentAmount
    );
  }

  /**
   * Revokes delegated CELO.
   * @param delegatee The delegatee acount.
   * @param revokeFraction Fraction of total CELO that will be revoked from delegatee. Fixidity fraction
   */
  function revokeDelegatedGovernanceVotes(address delegatee, uint256 revokeFraction) external {
    FixidityLib.Fraction memory percentageToRevoke = FixidityLib.wrap(revokeFraction);

    require(
      FixidityLib.lte(percentageToRevoke, FixidityLib.fixed1()),
      "Revoke fraction must be less than or equal to 1"
    );

    address delegatorAccount = getAccounts().voteSignerToAccount(msg.sender);
    Delegated storage delegated = delegatorInfo[delegatorAccount];
    require(
      FixidityLib.gte(delegated.totalDelegatedCeloFraction, percentageToRevoke),
      "Not enough total delegated percents"
    );

    address delegateeAccount = getAccounts().voteSignerToAccount(delegatee);
    _updateDelegatedAmount(delegatorAccount, delegateeAccount);

    DelegatedInfo storage currentDelegateeInfo = delegated.delegateesWithPercentagesAndAmount[
      delegateeAccount
    ];

    require(
      FixidityLib.gte(currentDelegateeInfo.percentage, percentageToRevoke),
      "Not enough delegated percents"
    );

    currentDelegateeInfo.percentage = currentDelegateeInfo.percentage.subtract(percentageToRevoke);

    uint256 totalLockedGold = getAccountTotalLockedGold(delegatorAccount);

    uint256 amountToRevoke = FixidityLib.unwrap(currentDelegateeInfo.percentage) == 0
      ? currentDelegateeInfo.currentAmount
      : Math.min(
        FixidityLib.newFixed(totalLockedGold).multiply(percentageToRevoke).fromFixed(),
        currentDelegateeInfo.currentAmount
      );

    _decreaseDelegateeVotingPower(delegateeAccount, amountToRevoke, currentDelegateeInfo);

    delegated.totalDelegatedCeloFraction = delegated.totalDelegatedCeloFraction.subtract(
      percentageToRevoke
    );

    if (FixidityLib.unwrap(currentDelegateeInfo.percentage) == 0) {
      delegated.delegatees.remove(delegateeAccount);
    }

    emit DelegatedCeloRevoked(
      delegatorAccount,
      delegateeAccount,
      FixidityLib.unwrap(percentageToRevoke),
      amountToRevoke
    );
  }

  /**
   * @notice Adds `slasher` to whitelist of approved slashing addresses.
   * @param slasherIdentifier Identifier to whitelist.
   */
  function addSlasher(string calldata slasherIdentifier) external onlyOwner {
    bytes32 keyBytes = keccak256(abi.encodePacked(slasherIdentifier));
    require(registry.getAddressFor(keyBytes) != address(0), "Identifier is not registered");
    require(!slashingMap[keyBytes], "Cannot add slasher ID twice.");
    slashingWhitelist.push(keyBytes);
    slashingMap[keyBytes] = true;
    emit SlasherWhitelistAdded(slasherIdentifier);
  }

  /**
   * @notice Removes `slasher` from whitelist of approved slashing addresses.
   * @param slasherIdentifier Identifier to remove from whitelist.
   * @param index Index of the provided identifier in slashingWhiteList array.
   */
  function removeSlasher(string calldata slasherIdentifier, uint256 index) external onlyOwner {
    bytes32 keyBytes = keccak256(abi.encodePacked(slasherIdentifier));
    require(slashingMap[keyBytes], "Cannot remove slasher ID not yet added.");
    require(index < slashingWhitelist.length, "Provided index exceeds whitelist bounds.");
    require(slashingWhitelist[index] == keyBytes, "Index doesn't match identifier");
    slashingWhitelist[index] = slashingWhitelist[slashingWhitelist.length - 1];
    slashingWhitelist.pop();
    slashingMap[keyBytes] = false;
    emit SlasherWhitelistRemoved(slasherIdentifier);
  }

  /**
   * @notice Slashes `account` by reducing its nonvoting locked gold by `penalty`.
   *         If there is not enough nonvoting locked gold to slash, calls into
   *         `Election.slashVotes` to slash the remaining gold. If `account` does not have
   *         `penalty` worth of locked gold, slashes `account`'s total locked gold.
   *         Also sends `reward` gold to the reporter, and penalty-reward to the Community Fund.
   * @param account Address of account being slashed.
   * @param penalty Amount to slash account.
   * @param reporter Address of account reporting the slasher.
   * @param reward Reward to give reporter.
   * @param lessers The groups receiving fewer votes than i'th group, or 0 if the i'th group has
   *                the fewest votes of any validator group.
   * @param greaters The groups receiving more votes than the i'th group, or 0 if the i'th group
   *                 has the most votes of any validator group.
   * @param indices The indices of the i'th group in `account`'s voting list.
   * @dev Fails if `reward` is greater than `account`'s total locked gold.
   */
  function slash(
    address account,
    uint256 penalty,
    address reporter,
    uint256 reward,
    address[] calldata lessers,
    address[] calldata greaters,
    uint256[] calldata indices
  ) external onlySlasher {
    uint256 maxSlash = Math.min(penalty, getAccountTotalLockedGold(account));
    require(maxSlash >= reward, "reward cannot exceed penalty.");
    // `reporter` receives the reward in locked CELO, so it must be given to an account
    // There is no reward for slashing via the GovernanceSlasher, and `reporter`
    // is set to 0x0.
    if (reporter != address(0)) {
      reporter = getAccounts().signerToAccount(reporter);
    }
    // Local scoping is required to avoid Solc "stack too deep" error from too many locals.
    {
      uint256 nonvotingBalance = balances[account].nonvoting;
      uint256 difference = 0;
      // If not enough nonvoting, revoke the difference
      if (nonvotingBalance < maxSlash) {
        difference = maxSlash.sub(nonvotingBalance);
        require(
          getElection().forceDecrementVotes(account, difference, lessers, greaters, indices) ==
            difference,
          "Cannot revoke enough voting gold."
        );
      }
      // forceDecrementVotes does not increment nonvoting account balance, so we can't double count
      _decrementNonvotingAccountBalance(account, maxSlash.sub(difference));
      _incrementNonvotingAccountBalance(reporter, reward);
    }
    address communityFund = registry.getAddressForOrDie(GOVERNANCE_REGISTRY_ID);
    address payable communityFundPayable = address(uint160(communityFund));
    require(maxSlash.sub(reward) <= address(this).balance, "Inconsistent balance");
    communityFundPayable.sendValue(maxSlash.sub(reward));
    emit AccountSlashed(account, maxSlash, reporter, reward);
  }

  /**
   * @notice Returns the total amount of locked gold in the system. Note that this does not include
   *   gold that has been unlocked but not yet withdrawn.
   * @return The total amount of locked gold in the system.
   */
  function getTotalLockedGold() external view returns (uint256) {
    return totalNonvoting.add(getElection().getTotalVotes());
  }

  /**
   * @notice Returns the total amount of locked gold not being used to vote in elections.
   * @return The total amount of locked gold not being used to vote in elections.
   */
  function getNonvotingLockedGold() external view returns (uint256) {
    return totalNonvoting;
  }

  function isSlasher(address slasher) external view returns (bool) {
    return (registry.isOneOf(slashingWhitelist, slasher));
  }

  /**
   * Return percentage and amount that delegator assigned to delegateee.
   * Please note that amount doesn't have to be up to date.
   * In such case please use `updateDelegatedBalance`.
   * @param delegator The delegator address.
   * @param delegatee The delegatee address.
   * @return fraction The fraction that is delegator asigning to delegatee.
   * @return currentAmount The current actual Celo amount that is assigned to delegatee.
   */
  function getDelegatorDelegateeInfo(
    address delegator,
    address delegatee
  ) external view returns (uint256 fraction, uint256 currentAmount) {
    DelegatedInfo storage currentDelegateeInfo = delegatorInfo[delegator]
      .delegateesWithPercentagesAndAmount[delegatee];

    fraction = FixidityLib.unwrap(currentDelegateeInfo.percentage);
    currentAmount = currentDelegateeInfo.currentAmount;
  }

  /**
   * @notice Returns the total amount of non-voting locked gold for an account.
   * @param account The account.
   * @return The total amount of non-voting locked gold for an account.
   */
  function getAccountNonvotingLockedGold(address account) external view returns (uint256) {
    return balances[account].nonvoting;
  }

  /**
   * @notice Returns the total amount to withdraw from unlocked gold for an account.
   * @param account The address of the account.
   * @return Total amount to withdraw.
   */
  function getTotalPendingWithdrawals(address account) external view returns (uint256) {
    uint256 pendingWithdrawalSum = 0;
    PendingWithdrawal[] memory withdrawals = balances[account].pendingWithdrawals;
    for (uint256 i = 0; i < withdrawals.length; i = i.add(1)) {
      pendingWithdrawalSum = pendingWithdrawalSum.add(withdrawals[i].value);
    }
    return pendingWithdrawalSum;
  }

  function getSlashingWhitelist() external view returns (bytes32[] memory) {
    return slashingWhitelist;
  }

  /**
   * @notice Returns the pending withdrawals from unlocked CELO for an account.
   * @param account The address of the account.
   * @return The value for each pending withdrawal.
   * @return The timestamp for each pending withdrawal.
   */
  function getPendingWithdrawals(
    address account
  ) external view returns (uint256[] memory, uint256[] memory) {
    return
      getPendingWithdrawalsInBatch(account, 0, balances[account].pendingWithdrawals.length - 1);
  }

  /**
   * @notice Returns the pending withdrawal at a given index for a given account.
   * @param account The address of the account.
   * @param index The index of the pending withdrawal.
   * @return The value of the pending withdrawal.
   * @return The timestamp of the pending withdrawal.
   */
  function getPendingWithdrawal(
    address account,
    uint256 index
  ) external view returns (uint256, uint256) {
    require(
      getAccounts().isAccount(account),
      "Unknown account: only registered accounts have pending withdrawals"
    );
    require(index < balances[account].pendingWithdrawals.length, "Bad pending withdrawal index");
    PendingWithdrawal memory pendingWithdrawal = (balances[account].pendingWithdrawals[index]);

    return (pendingWithdrawal.value, pendingWithdrawal.timestamp);
  }

  /**
   * @notice Returns the storage, major, minor, and patch version of the contract.
   * @return Storage version of the contract.
   * @return Major version of the contract.
   * @return Minor version of the contract.
   * @return Patch version of the contract.
   */
  function getVersionNumber() external pure returns (uint256, uint256, uint256, uint256) {
    return (1, 1, 5, 0);
  }

  /**
   * @notice Sets the duration in seconds users must wait before withdrawing gold after unlocking.
   * @param value The unlocking period in seconds.
   */
  function setUnlockingPeriod(uint256 value) public onlyOwner {
    require(value != unlockingPeriod, "Unlocking period not changed");
    unlockingPeriod = value;
    emit UnlockingPeriodSet(value);
  }

  /**
   * @notice Sets max delegatees count.
   * @param value The max delegatees count.
   */
  function setMaxDelegateesCount(uint256 value) public onlyOwner {
    maxDelegateesCount = value;
    emit MaxDelegateesCountSet(value);
  }

  /**
   * Updates real delegated amount to delegatee.
   * There might be discrepancy because of validator rewards or extra locked gold.
   * Voting power will always be smaller or equal to what it is supposed to be.
   * @param delegator The delegator address.
   * @param delegatee The delegatee address.
   */
  function updateDelegatedAmount(address delegator, address delegatee) public returns (uint256) {
    address delegatorAccount = getAccounts().voteSignerToAccount(delegator);
    address delegateeAccount = getAccounts().voteSignerToAccount(delegatee);

    return _updateDelegatedAmount(delegatorAccount, delegateeAccount);
  }

  /**
   * Updates real delegated amount to all delegator's delegatees.
   * There might be discrepancy because of validator rewards or extra locked gold.
   * @param delegator The delegator address.
   */
  function updateDelegatedAmount(address delegator) public {
    address delegatorAccount = getAccounts().voteSignerToAccount(delegator);
    _updateDelegatedAmount(delegatorAccount);
  }

  /**
   * @notice Returns the number of pending withdrawals for the specified account.
   * @param account The address of the account.
   * @return The count of pending withdrawals.
   */
  function getTotalPendingWithdrawalsCount(address account) public view returns (uint256) {
    return balances[account].pendingWithdrawals.length;
  }

  /**
   * Retuns all delegatees of delegator
   * @param delegator The delegator address.
   */
  function getDelegateesOfDelegator(address delegator) public view returns (address[] memory) {
    address[] memory values = delegatorInfo[delegator].delegatees.enumerate();
    return values;
  }

  /**
   * @notice Returns the pending withdrawals from unlocked CELO for an account in a given range.
   * @param account The address of the account.
   * @param from The start index of the pending withdrawals.
   * @param to The end index of the pending withdrawals.
   * @return The value for each pending withdrawal.
   * @return The timestamp for each pending withdrawal.
   */
  function getPendingWithdrawalsInBatch(
    address account,
    uint256 from,
    uint256 to
  ) public view returns (uint256[] memory, uint256[] memory) {
    uint256 pendingWithdrawalsLength = getTotalPendingWithdrawalsCount(account);

    if (pendingWithdrawalsLength == 0) {
      return (new uint256[](0), new uint256[](0));
    }
    require(from <= to, "Invalid range");
    uint256 _to = Math.min(to, pendingWithdrawalsLength - 1);
    uint256 length = _to - from + 1;
    uint256[] memory values = new uint256[](length);
    uint256[] memory timestamps = new uint256[](length);
    for (uint256 i = from; i <= _to; i = i.add(1)) {
      PendingWithdrawal memory pendingWithdrawal = balances[account].pendingWithdrawals[i];
      values[i - from] = pendingWithdrawal.value;
      timestamps[i - from] = pendingWithdrawal.timestamp;
    }
    return (values, timestamps);
  }

  /**
   * Returns how many percents of CELO is account delegating.
   * @param account The account address.
   */
  function getAccountTotalDelegatedFraction(address account) public view returns (uint256) {
    Delegated storage delegated = delegatorInfo[account];
    return FixidityLib.unwrap(delegated.totalDelegatedCeloFraction);
  }

  /**
   * @notice Returns the total amount of locked gold for an account.
   * @param account The account.
   * @return The total amount of locked gold for an account.
   */
  function getAccountTotalLockedGold(address account) public view returns (uint256) {
    uint256 total = balances[account].nonvoting;
    return total.add(getElection().getTotalVotesByAccount(account));
  }

  /**
   * @notice Returns the total amount of locked gold + delegated gold for an account.
   * @param account The account.
   * @return The total amount of locked gold + delegated gold for an account.
   */
  function getAccountTotalGovernanceVotingPower(address account) public view returns (uint256) {
    FixidityLib.Fraction memory availableUndelegatedPercents = FixidityLib.fixed1().subtract(
      FixidityLib.wrap(getAccountTotalDelegatedFraction(account))
    );
    uint256 totalLockedGold = getAccountTotalLockedGold(account);

    uint256 availableForVoting = FixidityLib
      .newFixed(totalLockedGold)
      .multiply(availableUndelegatedPercents)
      .fromFixed();

    return availableForVoting.add(totalDelegatedCelo[account]);
  }

  /**
   * Returns expected vs real delegated amount.
   * If there is a discrepancy it can be fixed by calling `updateDelegatedAmount` function.
   * @param delegator The delegator address.
   * @param delegatee The delegatee address.
   * @return expected The expected amount.
   * @return real The real amount.
   */
  function getDelegatorDelegateeExpectedAndRealAmount(
    address delegator,
    address delegatee
  ) public view returns (uint256 expected, uint256 real) {
    address delegatorAccount = getAccounts().voteSignerToAccount(delegator);
    address delegateeAccount = getAccounts().voteSignerToAccount(delegatee);

    (expected, real) = _getDelegatorDelegateeExpectedAndRealAmount(
      delegatorAccount,
      delegateeAccount
    );
  }

  /**
   * Updates real delegated amount to delegatee.
   * There might be discrepancy because of validator rewards or extra locked gold.
   * Voting power will always be smaller or equal to what it is supposed to be.
   * @param delegator The delegator address.
   * @param delegatee The delegatee address.
   */
  function _updateDelegatedAmount(address delegator, address delegatee) internal returns (uint256) {
    Delegated storage delegated = delegatorInfo[delegator];
    require(
      FixidityLib.unwrap(delegated.totalDelegatedCeloFraction) != 0,
      "delegator is not delegating"
    );
    DelegatedInfo storage currentDelegateeInfo = delegated.delegateesWithPercentagesAndAmount[
      delegatee
    ];
    require(
      FixidityLib.unwrap(currentDelegateeInfo.percentage) != 0,
      "delegator is not delegating for delegatee"
    );

    (uint256 expected, uint256 real) = getDelegatorDelegateeExpectedAndRealAmount(
      delegator,
      delegatee
    );

    currentDelegateeInfo.currentAmount = expected;
    totalDelegatedCelo[delegatee] = totalDelegatedCelo[delegatee].sub(real).add(expected);

    return expected;
  }

  /**
   * @notice Increments the non-voting balance for an account.
   * @param account The account whose non-voting balance should be incremented.
   * @param value The amount by which to increment.
   */
  function _incrementNonvotingAccountBalance(address account, uint256 value) private {
    balances[account].nonvoting = balances[account].nonvoting.add(value);
    totalNonvoting = totalNonvoting.add(value);
  }

  /**
   * @notice Decrements the non-voting balance for an account.
   * @param account The account whose non-voting balance should be decremented.
   * @param value The amount by which to decrement.
   */
  function _decrementNonvotingAccountBalance(address account, uint256 value) private {
    balances[account].nonvoting = balances[account].nonvoting.sub(value);
    totalNonvoting = totalNonvoting.sub(value);
  }

  /**
   * Revokes amount during unlocking. It will revoke votes from voted proposals if necessary.
   * @param delegator The delegator account.
   * @param amountToRevoke The amount to revoke.
   */
  function revokeFromDelegatedWhenUnlocking(address delegator, uint256 amountToRevoke) private {
    address[] memory delegatees = getDelegateesOfDelegator(delegator);

    Delegated storage delegated = delegatorInfo[delegator];

    for (uint256 i = 0; i < delegatees.length; i = i.add(1)) {
      DelegatedInfo storage currentDelegateeInfo = delegated.delegateesWithPercentagesAndAmount[
        delegatees[i]
      ];
      (uint256 expected, uint256 real) = _getDelegatorDelegateeExpectedAndRealAmount(
        delegator,
        delegatees[i]
      );
      uint256 delegateeAmountToRevoke = FixidityLib
        .newFixed(amountToRevoke)
        .multiply(currentDelegateeInfo.percentage)
        .fromFixed();
      delegateeAmountToRevoke = delegateeAmountToRevoke.sub(expected.sub(real));
      _decreaseDelegateeVotingPower(delegatees[i], delegateeAmountToRevoke, currentDelegateeInfo);
      emit DelegatedCeloRevoked(delegator, delegatees[i], 0, delegateeAmountToRevoke);
    }
  }

  /**
   * Decreases delegatee voting power when removing or unlocking delegated votes.
   * @param delegatee The delegatee.
   * @param amountToRevoke Amount to revoke.
   * @param delegateeInfo Delegatee info.
   */
  function _decreaseDelegateeVotingPower(
    address delegatee,
    uint256 amountToRevoke,
    DelegatedInfo storage delegateeInfo
  ) private {
    uint256 delegateeTotalVotingPower = getAccountTotalGovernanceVotingPower(delegatee);
    uint256 totalReferendumVotes = getGovernance().getAmountOfGoldUsedForVoting(delegatee);
    uint256 unusedReferendumVotes = delegateeTotalVotingPower.sub(totalReferendumVotes);
    if (unusedReferendumVotes < amountToRevoke) {
      getGovernance().removeVotesWhenRevokingDelegatedVotes(
        delegatee,
        delegateeTotalVotingPower.sub(amountToRevoke)
      );
    }
    delegateeInfo.currentAmount = delegateeInfo.currentAmount.sub(amountToRevoke);
    totalDelegatedCelo[delegatee] = totalDelegatedCelo[delegatee].sub(amountToRevoke);
  }

  function _updateDelegatedAmount(address delegator) private {
    address delegatorAccount = getAccounts().voteSignerToAccount(delegator);
    EnumerableSet.AddressSet storage delegatees = delegatorInfo[delegatorAccount].delegatees;
    for (uint256 i = 0; i < delegatees.length(); i = i.add(1)) {
      _updateDelegatedAmount(delegatorAccount, delegatees.get(i));
    }
  }

  /**
   * @notice Deletes a pending withdrawal.
   * @param list The list of pending withdrawals from which to delete.
   * @param index The index of the pending withdrawal to delete.
   */
  function deletePendingWithdrawal(PendingWithdrawal[] storage list, uint256 index) private {
    uint256 lastIndex = list.length.sub(1);
    list[index] = list[lastIndex];
    list.length = lastIndex;
  }

  /**
   * Returns expected vs real delegated amount.
   * If there is a discrepancy it can be fixed by calling `updateDelegatedAmount` function.
   * @param delegator The delegator address.
   * @param delegatee The delegatee address.
   * @return expected The expected amount.
   * @return real The real amount.
   */
  function _getDelegatorDelegateeExpectedAndRealAmount(
    address delegator,
    address delegatee
  ) private view returns (uint256 expected, uint256 real) {
    DelegatedInfo storage currentDelegateeInfo = delegatorInfo[delegator]
      .delegateesWithPercentagesAndAmount[delegatee];

    uint256 amountToDelegate = FixidityLib
      .newFixed(getAccountTotalLockedGold(delegator))
      .multiply(currentDelegateeInfo.percentage)
      .fromFixed();

    expected = amountToDelegate;
    real = currentDelegateeInfo.currentAmount;
  }
}
