pragma solidity ^0.5.13;

import "openzeppelin-solidity/contracts/math/SafeMath.sol";
import "openzeppelin-solidity/contracts/ownership/Ownable.sol";

import "../common/FixidityLib.sol";
import "../common/Initializable.sol";
import "../common/UsingRegistry.sol";
import "../common/interfaces/ICeloVersionedContract.sol";
import "../common/libraries/ReentrancyGuard.sol";
import "../stability/interfaces/IStableToken.sol";

/**
 * @title Facilitates large exchanges between CELO stable tokens.
 */
contract GrandaMento is
  ICeloVersionedContract,
  Ownable,
  Initializable,
  UsingRegistry,
  ReentrancyGuard
{
  using FixidityLib for FixidityLib.Fraction;
  using SafeMath for uint256;

  // Emitted when a new exchange proposal is created.
  event ExchangeProposalCreated(
    uint256 indexed proposalId,
    address indexed exchanger,
    string stableTokenRegistryId,
    uint256 sellAmount,
    uint256 buyAmount,
    bool sellCelo
  );

  // Emitted when an exchange proposal is approved by the approver.
  event ExchangeProposalApproved(uint256 indexed proposalId);

  // Emitted when an exchange proposal is cancelled.
  event ExchangeProposalCancelled(uint256 indexed proposalId);

  // Emitted when an exchange proposal is executed.
  event ExchangeProposalExecuted(uint256 indexed proposalId);

  // Emitted when the approver is set.
  event ApproverSet(address approver);

  // Emitted when maxApprovalExchangeRateChange is set.
  event MaxApprovalExchangeRateChangeSet(uint256 maxApprovalExchangeRateChange);

  // Emitted when the spread is set.
  event SpreadSet(uint256 spread);

  // Emitted when the veto period in seconds is set.
  event VetoPeriodSecondsSet(uint256 vetoPeriodSeconds);

  // Emitted when the exchange limits for a stable token are set.
  event StableTokenExchangeLimitsSet(
    string stableTokenRegistryId,
    uint256 minExchangeAmount,
    uint256 maxExchangeAmount
  );

  enum ExchangeProposalState { None, Proposed, Approved, Executed, Cancelled }

  struct ExchangeLimits {
    // The minimum amount of an asset that can be exchanged in a single proposal.
    uint256 minExchangeAmount;
    // The maximum amount of an asset that can be exchanged in a single proposal.
    uint256 maxExchangeAmount;
  }

  struct ExchangeProposal {
    // The exchanger/proposer of the exchange proposal.
    address payable exchanger;
    // The stable token involved in this proposal. This is stored rather than
    // the stable token's registry ID in case the contract address is changed
    // after a proposal is created, which could affect refunding or burning the
    // stable token.
    address stableToken;
    // The state of the exchange proposal.
    ExchangeProposalState state;
    // Whether the exchanger is selling CELO and buying stableToken.
    bool sellCelo;
    // The amount of the sell token being sold. If a stable token is being sold,
    // the amount of stable token in "units" is stored rather than the "value."
    // This is because stable tokens may experience demurrage/inflation, where
    // the amount of stable token "units" doesn't change with time, but the "value"
    // does. This is important to ensure the correct inflation-adjusted amount
    // of the stable token is transferred out of this contract when a deposit is
    // refunded or an exchange selling the stable token is executed.
    // See StableToken.sol for more details on what "units" vs "values" are.
    uint256 sellAmount;
    // The amount of the buy token being bought. For stable tokens, this is
    // kept track of as the value, not units.
    uint256 buyAmount;
    // The price of CELO quoted in stableToken at the time of the exchange proposal
    // creation. This is the price used to calculate the buyAmount. Used for a
    // safety check when an approval is being made that the price isn't wildly
    // different. Recalculating buyAmount is not sufficient because if a stable token
    // is being sold that has demurrage enabled, the original value when the stable
    // tokens were deposited cannot be calculated.
    uint256 celoStableTokenExchangeRate;
    // The veto period in seconds at the time the proposal was created. This is kept
    // track of on a per-proposal basis to lock-in the veto period for a proposal so
    // that changes to the contract's vetoPeriodSeconds do not affect existing
    // proposals.
    uint256 vetoPeriodSeconds;
    // The timestamp (`block.timestamp`) at which the exchange proposal was approved
    // in seconds. If the exchange proposal has not ever been approved, is 0.
    uint256 approvalTimestamp;
  }

  // The address with the authority to approve exchange proposals.
  address public approver;

  // The maximum allowed change in the CELO/stable token price when an exchange proposal
  // is being approved relative to the rate when the exchange proposal was created.
  FixidityLib.Fraction public maxApprovalExchangeRateChange;

  // The percent fee imposed upon an exchange execution.
  FixidityLib.Fraction public spread;

  // The period in seconds after an approval during which an exchange proposal can be vetoed.
  uint256 public vetoPeriodSeconds;

  // The minimum and maximum amount of the stable token that can be minted or
  // burned in a single exchange. Indexed by the stable token registry identifier string.
  mapping(string => ExchangeLimits) public stableTokenExchangeLimits;

  // State for all exchange proposals. Indexed by the exchange proposal ID.
  mapping(uint256 => ExchangeProposal) public exchangeProposals;

  // An array containing a superset of the IDs of exchange proposals that are currently
  // in the Proposed or Approved state. Intended to allow easy viewing of all active
  // exchange proposals. It's possible for a proposal ID in this array to no longer be
  // active, so filtering is required to find the true set of active proposal IDs.
  // A superset is kept because exchange proposal vetoes, intended to be done
  // by Governance, effectively go through a multi-day timelock. If the veto
  // call was required to provide the index in an array of activeProposalIds to
  // remove corresponding to the vetoed exchange proposal, the timelock could result
  // in the provided index being stale by the time the veto would be executed.
  // Alternative approaches exist, like maintaining a linkedlist of active proposal
  // IDs, but this approach was chosen for its low implementation complexity.
  uint256[] public activeProposalIdsSuperset;

  // Number of exchange proposals that have ever been created. Used for assigning
  // an exchange proposal ID to a new proposal.
  uint256 public exchangeProposalCount;

  /**
   * @notice Reverts if the sender is not the approver.
   */
  modifier onlyApprover() {
    require(msg.sender == approver, "Sender must be approver");
    _;
  }

  /**
   * @notice Sets initialized == true on implementation contracts.
   * @param test Set to true to skip implementation initialization.
   */
  constructor(bool test) public Initializable(test) {}

  /**
   * @notice Returns the storage, major, minor, and patch version of the contract.
   * @return Storage version of the contract.
   * @return Major version of the contract.
   * @return Minor version of the contract.
   * @return Patch version of the contract.
   */
  function getVersionNumber() external pure returns (uint256, uint256, uint256, uint256) {
    return (1, 1, 0, 1);
  }

  /**
   * @notice Used in place of the constructor to allow the contract to be upgradable via proxy.
   * @param _registry The address of the registry.
   * @param _approver The approver that has the ability to approve exchange proposals.
   * @param _maxApprovalExchangeRateChange The maximum allowed change in CELO price
   * between an exchange proposal's creation and approval.
   * @param _spread The spread charged on exchanges.
   * @param _vetoPeriodSeconds The length of the veto period in seconds.
   */
  function initialize(
    address _registry,
    address _approver,
    uint256 _maxApprovalExchangeRateChange,
    uint256 _spread,
    uint256 _vetoPeriodSeconds
  ) external initializer {
    _transferOwnership(msg.sender);
    setRegistry(_registry);
    setApprover(_approver);
    setMaxApprovalExchangeRateChange(_maxApprovalExchangeRateChange);
    setSpread(_spread);
    setVetoPeriodSeconds(_vetoPeriodSeconds);
  }

  /**
   * @notice Creates a new exchange proposal and deposits the tokens being sold.
   * @dev Stable token value amounts are used for the sellAmount, not unit amounts.
   * @param stableTokenRegistryId The string registry ID for the stable token
   * involved in the exchange.
   * @param sellAmount The amount of the sell token being sold.
   * @param sellCelo Whether CELO is being sold.
   * @return The proposal identifier for the newly created exchange proposal.
   */
  function createExchangeProposal(
    string calldata stableTokenRegistryId,
    uint256 sellAmount,
    bool sellCelo
  ) external nonReentrant returns (uint256) {
    address stableToken = registry.getAddressForStringOrDie(stableTokenRegistryId);

    // Gets the price of CELO quoted in stableToken.
    uint256 celoStableTokenExchangeRate = getOracleExchangeRate(stableToken).unwrap();

    // Using the current oracle exchange rate, calculate what the buy amount is.
    // This takes the spread into consideration.
    uint256 buyAmount = getBuyAmount(celoStableTokenExchangeRate, sellAmount, sellCelo);

    // Create new scope to prevent a stack too deep error.
    {
      // Get the minimum and maximum amount of stable token than can be involved
      // in the exchange. This reverts if exchange limits for the stable token have
      // not been set.
      (uint256 minExchangeAmount, uint256 maxExchangeAmount) = getStableTokenExchangeLimits(
        stableTokenRegistryId
      );
      // Ensure that the amount of stableToken being bought or sold is within
      // the configurable exchange limits.
      uint256 stableTokenExchangeAmount = sellCelo ? buyAmount : sellAmount;
      require(
        stableTokenExchangeAmount <= maxExchangeAmount &&
          stableTokenExchangeAmount >= minExchangeAmount,
        "Stable token exchange amount not within limits"
      );
    }

    // Deposit the assets being sold.
    IERC20 sellToken = sellCelo ? getGoldToken() : IERC20(stableToken);
    require(
      sellToken.transferFrom(msg.sender, address(this), sellAmount),
      "Transfer in of sell token failed"
    );

    // Record the proposal.
    // Add 1 to the running proposal count, and use the updated proposal count as
    // the proposal ID. Proposal IDs intentionally start at 1.
    exchangeProposalCount = exchangeProposalCount.add(1);
    // For stable tokens, the amount is stored in units to deal with demurrage.
    uint256 storedSellAmount = sellCelo
      ? sellAmount
      : IStableToken(stableToken).valueToUnits(sellAmount);
    exchangeProposals[exchangeProposalCount] = ExchangeProposal({
      exchanger: msg.sender,
      stableToken: stableToken,
      state: ExchangeProposalState.Proposed,
      sellCelo: sellCelo,
      sellAmount: storedSellAmount,
      buyAmount: buyAmount,
      celoStableTokenExchangeRate: celoStableTokenExchangeRate,
      vetoPeriodSeconds: vetoPeriodSeconds,
      approvalTimestamp: 0 // initial value when not approved yet
    });
    // StableToken.unitsToValue (called within getSellTokenAndSellAmount) can
    // overflow for very large StableToken amounts. Call it here as a sanity
    // check, so that the overflow happens here, blocking proposal creation
    // rather than when attempting to execute the proposal, which would lock
    // funds in this contract.
    getSellTokenAndSellAmount(exchangeProposals[exchangeProposalCount]);
    // Push it into the array of active proposals.
    activeProposalIdsSuperset.push(exchangeProposalCount);
    // Even if stable tokens are being sold, the sellAmount emitted is the "value."
    emit ExchangeProposalCreated(
      exchangeProposalCount,
      msg.sender,
      stableTokenRegistryId,
      sellAmount,
      buyAmount,
      sellCelo
    );
    return exchangeProposalCount;
  }

  /**
   * @notice Approves an existing exchange proposal.
   * @dev Sender must be the approver. Exchange proposal must be in the Proposed state.
   * @param proposalId The identifier of the proposal to approve.
   */
  function approveExchangeProposal(uint256 proposalId) external nonReentrant onlyApprover {
    ExchangeProposal storage proposal = exchangeProposals[proposalId];
    // Ensure the proposal is in the Proposed state.
    require(proposal.state == ExchangeProposalState.Proposed, "Proposal must be in Proposed state");
    // Ensure the change in the current price of CELO quoted in the stable token
    // relative to the value when the proposal was created is within the allowed limit.
    FixidityLib.Fraction memory currentRate = getOracleExchangeRate(proposal.stableToken);
    FixidityLib.Fraction memory proposalRate = FixidityLib.wrap(
      proposal.celoStableTokenExchangeRate
    );
    (FixidityLib.Fraction memory lesserRate, FixidityLib.Fraction memory greaterRate) = currentRate
      .lt(proposalRate)
      ? (currentRate, proposalRate)
      : (proposalRate, currentRate);
    FixidityLib.Fraction memory rateChange = greaterRate.subtract(lesserRate).divide(proposalRate);
    require(
      rateChange.lte(maxApprovalExchangeRateChange),
      "CELO exchange rate is too different from the proposed price"
    );

    // Set the time the approval occurred and change the state.
    proposal.approvalTimestamp = block.timestamp;
    proposal.state = ExchangeProposalState.Approved;
    emit ExchangeProposalApproved(proposalId);
  }

  /**
   * @notice Cancels an exchange proposal.
   * @dev Only callable by the exchanger if the proposal is in the Proposed state
   * or the owner if the proposal is in the Approved state.
   * @param proposalId The identifier of the proposal to cancel.
   */
  function cancelExchangeProposal(uint256 proposalId) external nonReentrant {
    ExchangeProposal storage proposal = exchangeProposals[proposalId];
    // Require the appropriate state and sender.
    // This will also revert if a proposalId is given that does not correspond
    // to a previously created exchange proposal.
    if (proposal.state == ExchangeProposalState.Proposed) {
      require(proposal.exchanger == msg.sender, "Sender must be exchanger");
    } else if (proposal.state == ExchangeProposalState.Approved) {
      require(isOwner(), "Sender must be owner");
    } else {
      revert("Proposal must be in Proposed or Approved state");
    }
    // Mark the proposal as cancelled. Do so prior to refunding as a measure against reentrancy.
    proposal.state = ExchangeProposalState.Cancelled;
    // Get the token and amount that will be refunded to the proposer.
    (IERC20 refundToken, uint256 refundAmount) = getSellTokenAndSellAmount(proposal);
    // Finally, transfer out the deposited funds.
    require(
      refundToken.transfer(proposal.exchanger, refundAmount),
      "Transfer out of refund token failed"
    );
    emit ExchangeProposalCancelled(proposalId);
  }

  /**
   * @notice Executes an exchange proposal that's been approved and not vetoed.
   * @dev Callable by anyone. Reverts if the proposal is not in the Approved state
   * or proposal.vetoPeriodSeconds has not elapsed since approval.
   * @param proposalId The identifier of the proposal to execute.
   */
  function executeExchangeProposal(uint256 proposalId) external nonReentrant {
    ExchangeProposal storage proposal = exchangeProposals[proposalId];
    // Require that the proposal is in the Approved state.
    require(proposal.state == ExchangeProposalState.Approved, "Proposal must be in Approved state");
    // Require that the veto period has elapsed since the approval time.
    require(
      proposal.approvalTimestamp.add(proposal.vetoPeriodSeconds) <= block.timestamp,
      "Veto period not elapsed"
    );
    // Mark the proposal as executed. Do so prior to exchanging as a measure against reentrancy.
    proposal.state = ExchangeProposalState.Executed;
    // Perform the exchange.
    (IERC20 sellToken, uint256 sellAmount) = getSellTokenAndSellAmount(proposal);
    // If the exchange sells CELO, the CELO is sent to the Reserve from this contract
    // and stable token is minted to the exchanger.
    if (proposal.sellCelo) {
      // Send the CELO from this contract to the reserve.
      require(
        sellToken.transfer(address(getReserve()), sellAmount),
        "Transfer out of CELO to Reserve failed"
      );
      // Mint stable token to the exchanger.
      require(
        IStableToken(proposal.stableToken).mint(proposal.exchanger, proposal.buyAmount),
        "Stable token mint failed"
      );
    } else {
      // If the exchange is selling stable token, the stable token is burned from
      // this contract and CELO is transferred from the Reserve to the exchanger.

      // Burn the stable token from this contract.
      require(IStableToken(proposal.stableToken).burn(sellAmount), "Stable token burn failed");
      // Transfer the CELO from the Reserve to the exchanger.
      require(
        getReserve().transferExchangeGold(proposal.exchanger, proposal.buyAmount),
        "Transfer out of CELO from Reserve failed"
      );
    }
    emit ExchangeProposalExecuted(proposalId);
  }

  /**
   * @notice Gets the sell token and the sell amount for a proposal.
   * @dev For stable token sell amounts that are stored as units, the value
   * is returned. Ensures sell amount is not greater than this contract's balance.
   * @param proposal The proposal to get the sell token and sell amount for.
   * @return The IERC20 sell token.
   * @return The value sell amount.
   */
  function getSellTokenAndSellAmount(ExchangeProposal memory proposal)
    private
    view
    returns (IERC20, uint256)
  {
    IERC20 sellToken;
    uint256 sellAmount;
    if (proposal.sellCelo) {
      sellToken = getGoldToken();
      sellAmount = proposal.sellAmount;
    } else {
      address stableToken = proposal.stableToken;
      sellToken = IERC20(stableToken);
      // When selling stableToken, the sell amount is stored in units.
      // Units must be converted to value when refunding.
      sellAmount = IStableToken(stableToken).unitsToValue(proposal.sellAmount);
    }
    // In the event a precision issue from the unit <-> value calculations results
    // in sellAmount being greater than this contract's balance, set the sellAmount
    // to the entire balance.
    // This check should not be necessary for CELO, but is done so regardless
    // for extra certainty that cancelling an exchange proposal can never fail
    // if for some reason the CELO balance of this contract is less than the
    // recorded sell amount.
    uint256 totalBalance = sellToken.balanceOf(address(this));
    if (totalBalance < sellAmount) {
      sellAmount = totalBalance;
    }
    return (sellToken, sellAmount);
  }

  /**
   * @notice Using the oracle price, charges the spread and calculates the amount of
   * the asset being bought.
   * @dev Stable token value amounts are used for the sellAmount, not unit amounts.
   * Assumes both CELO and the stable token have 18 decimals.
   * @param celoStableTokenExchangeRate The unwrapped fraction exchange rate of CELO
   * quoted in the stable token.
   * @param sellAmount The amount of the sell token being sold.
   * @param sellCelo Whether CELO is being sold.
   * @return The amount of the asset being bought.
   */
  function getBuyAmount(uint256 celoStableTokenExchangeRate, uint256 sellAmount, bool sellCelo)
    public
    view
    returns (uint256)
  {
    FixidityLib.Fraction memory exchangeRate = FixidityLib.wrap(celoStableTokenExchangeRate);
    // If stableToken is being sold, instead use the price of stableToken
    // quoted in CELO.
    if (!sellCelo) {
      exchangeRate = exchangeRate.reciprocal();
    }
    // The sell amount taking the spread into account, ie:
    // (1 - spread) * sellAmount
    FixidityLib.Fraction memory adjustedSellAmount = FixidityLib.fixed1().subtract(spread).multiply(
      FixidityLib.newFixed(sellAmount)
    );
    // Calculate the buy amount:
    // exchangeRate * adjustedSellAmount
    return exchangeRate.multiply(adjustedSellAmount).fromFixed();
  }

  /**
   * @notice Removes the proposal ID found at the provided index of activeProposalIdsSuperset
   * if the exchange proposal is not active.
   * @dev Anyone can call. Reverts if the exchange proposal is active.
   * @param index The index of the proposal ID to remove from activeProposalIdsSuperset.
   */
  function removeFromActiveProposalIdsSuperset(uint256 index) external {
    require(index < activeProposalIdsSuperset.length, "Index out of bounds");
    uint256 proposalId = activeProposalIdsSuperset[index];
    // Require the exchange proposal to be inactive.
    require(
      exchangeProposals[proposalId].state != ExchangeProposalState.Proposed &&
        exchangeProposals[proposalId].state != ExchangeProposalState.Approved,
      "Exchange proposal not inactive"
    );
    // If not removing the last element, overwrite the index with the value of
    // the last element.
    uint256 lastIndex = activeProposalIdsSuperset.length.sub(1);
    if (index < lastIndex) {
      activeProposalIdsSuperset[index] = activeProposalIdsSuperset[lastIndex];
    }
    // Delete the last element.
    activeProposalIdsSuperset.length--;
  }

  /**
   * @notice Gets the proposal identifiers of exchange proposals in the
   * Proposed or Approved state. Returns a version of activeProposalIdsSuperset
   * with inactive proposal IDs set as 0.
   * @dev Elements with a proposal ID of 0 should be filtered out by the consumer.
   * @return An array of active exchange proposals IDs.
   */
  function getActiveProposalIds() external view returns (uint256[] memory) {
    // Solidity doesn't play well with dynamically sized memory arrays.
    // Instead, this array is created with the same length as activeProposalIdsSuperset,
    // and will replace elements that are inactive proposal IDs with the value 0.
    uint256[] memory activeProposalIds = new uint256[](activeProposalIdsSuperset.length);

    for (uint256 i = 0; i < activeProposalIdsSuperset.length; i = i.add(1)) {
      uint256 proposalId = activeProposalIdsSuperset[i];
      if (
        exchangeProposals[proposalId].state == ExchangeProposalState.Proposed ||
        exchangeProposals[proposalId].state == ExchangeProposalState.Approved
      ) {
        activeProposalIds[i] = proposalId;
      }
    }
    return activeProposalIds;
  }

  /**
   * @notice Gets the oracle CELO price quoted in the stable token.
   * @dev Reverts if there is not a rate for the provided stable token.
   * @param stableToken The stable token to get the oracle price for.
   * @return The oracle CELO price quoted in the stable token.
   */
  function getOracleExchangeRate(address stableToken)
    private
    view
    returns (FixidityLib.Fraction memory)
  {
    uint256 rateNumerator;
    uint256 rateDenominator;
    (rateNumerator, rateDenominator) = getSortedOracles().medianRate(stableToken);
    // When rateDenominator is 0, it means there are no rates known to SortedOracles.
    require(rateDenominator > 0, "No oracle rates present for token");
    return FixidityLib.wrap(rateNumerator).divide(FixidityLib.wrap(rateDenominator));
  }

  /**
   * @notice Gets the minimum and maximum amount of a stable token that can be
   * involved in a single exchange.
   * @dev Reverts if there is no explicit exchange limit for the stable token.
   * @param stableTokenRegistryId The string registry ID for the stable token.
   * @return Minimum exchange amount.
   * @return Maximum exchange amount.
   */
  function getStableTokenExchangeLimits(string memory stableTokenRegistryId)
    public
    view
    returns (uint256, uint256)
  {
    ExchangeLimits memory exchangeLimits = stableTokenExchangeLimits[stableTokenRegistryId];
    // Require the configurable stableToken max exchange amount to be > 0.
    // This covers the case where a stableToken has never been explicitly permitted.
    require(
      exchangeLimits.maxExchangeAmount > 0,
      "Max stable token exchange amount must be defined"
    );
    return (exchangeLimits.minExchangeAmount, exchangeLimits.maxExchangeAmount);
  }

  /**
   * @notice Sets the approver.
   * @dev Sender must be owner. New approver is allowed to be address(0).
   * @param newApprover The new value for the approver.
   */
  function setApprover(address newApprover) public onlyOwner {
    approver = newApprover;
    emit ApproverSet(newApprover);
  }

  /**
   * @notice Sets the maximum allowed change in the CELO/stable token price when
   * an exchange proposal is being approved relative to the price when the proposal
   * was created.
   * @dev Sender must be owner.
   * @param newMaxApprovalExchangeRateChange The new value for maxApprovalExchangeRateChange
   * to be wrapped.
   */
  function setMaxApprovalExchangeRateChange(uint256 newMaxApprovalExchangeRateChange)
    public
    onlyOwner
  {
    maxApprovalExchangeRateChange = FixidityLib.wrap(newMaxApprovalExchangeRateChange);
    emit MaxApprovalExchangeRateChangeSet(newMaxApprovalExchangeRateChange);
  }

  /**
   * @notice Sets the spread.
   * @dev Sender must be owner.
   * @param newSpread The new value for the spread to be wrapped. Must be <= fixed 1.
   */
  function setSpread(uint256 newSpread) public onlyOwner {
    spread = FixidityLib.wrap(newSpread);
    require(
      FixidityLib.lte(spread, FixidityLib.fixed1()),
      "Spread must be less than or equal to 1"
    );
    emit SpreadSet(newSpread);
  }

  /**
   * @notice Sets the minimum and maximum amount of the stable token an exchange can involve.
   * @dev Sender must be owner. Setting the maxExchangeAmount to 0 effectively disables new
   * exchange proposals for the token.
   * @param stableTokenRegistryId The registry ID string for the stable token to set limits for.
   * @param minExchangeAmount The new minimum exchange amount for the stable token.
   * @param maxExchangeAmount The new maximum exchange amount for the stable token.
   */
  function setStableTokenExchangeLimits(
    string calldata stableTokenRegistryId,
    uint256 minExchangeAmount,
    uint256 maxExchangeAmount
  ) external onlyOwner {
    require(
      minExchangeAmount <= maxExchangeAmount,
      "Min exchange amount must not be greater than max"
    );
    stableTokenExchangeLimits[stableTokenRegistryId] = ExchangeLimits({
      minExchangeAmount: minExchangeAmount,
      maxExchangeAmount: maxExchangeAmount
    });
    emit StableTokenExchangeLimitsSet(stableTokenRegistryId, minExchangeAmount, maxExchangeAmount);
  }

  /**
   * @notice Sets the veto period in seconds.
   * @dev Sender must be owner.
   * @param newVetoPeriodSeconds The new value for the veto period in seconds.
   */
  function setVetoPeriodSeconds(uint256 newVetoPeriodSeconds) public onlyOwner {
    // Hardcode a max of 4 weeks.
    // A minimum is not enforced for flexibility. A case of interest is if
    // Governance were to be set as the `approver`, it would be desirable to
    // set the veto period to 0 seconds.
    require(newVetoPeriodSeconds <= 4 weeks, "Veto period cannot exceed 4 weeks");
    vetoPeriodSeconds = newVetoPeriodSeconds;
    emit VetoPeriodSecondsSet(newVetoPeriodSeconds);
  }
}
