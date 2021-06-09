pragma solidity ^0.5.13;

import "openzeppelin-solidity/contracts/math/SafeMath.sol";
import "openzeppelin-solidity/contracts/ownership/Ownable.sol";

import "../common/FixidityLib.sol";
import "../common/InitializableV2.sol";
import "../common/UsingRegistry.sol";
import "../common/interfaces/ICeloVersionedContract.sol";
import "../common/libraries/ReentrancyGuard.sol";
import "./interfaces/IStableToken.sol";

/**
 * @title Facilitates large exchanges between CELO stable tokens.
 */
contract GrandaMento is
  ICeloVersionedContract,
  Ownable,
  InitializableV2,
  UsingRegistry,
  ReentrancyGuard
{
  using FixidityLib for FixidityLib.Fraction;
  using SafeMath for uint256;

  // Emitted when a new exchange proposal is created.
  event ExchangeProposalCreated(
    uint256 indexed proposalId,
    address indexed exchanger,
    address indexed stableToken,
    uint256 sellAmount,
    uint256 buyAmount,
    bool sellCelo
  );

  // Emitted when an exchange proposal is approved by the approver.
  event ExchangeProposalApproved(uint256 indexed proposalId);

  // Emitted when an exchange proposal is cancelled.
  event ExchangeProposalCancelled(uint256 indexed proposalId, address sender);

  // Emitted when an exchange proposal is executed.
  event ExchangeProposalExecuted(uint256 indexed proposalId);

  // Emitted when the approver is set.
  event ApproverSet(address approver);

  // Emitted when the spread is set.
  event SpreadSet(uint256 spread);

  // Emitted when the veto period in seconds is set.
  event VetoPeriodSecondsSet(uint256 vetoPeriodSeconds);

  // Emitted when the exchange limits for a stable token are set.
  event StableTokenExchangeLimitsSet(
    string stableTokenRegistryId,
    bytes32 indexed stableTokenRegistryIdHash,
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
    // The stable token involved in this proposal.
    address stableToken;
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
    // The timestamp (`block.timestamp`) at which the exchange proposal was approved
    // in seconds. If the exchange proposal has not ever been approved, is 0.
    uint256 approvalTimestamp;
    // The state of the exchange proposal.
    ExchangeProposalState state;
    // Whether CELO is being sold and stableToken is being bought.
    bool sellCelo;
  }

  // The address with the authority to approve exchange proposals.
  address public approver;

  // The percent fee imposed upon an exchange execution.
  FixidityLib.Fraction public spread;

  // The period in seconds after an approval during which an exchange proposal can be vetoed.
  uint256 public vetoPeriodSeconds;

  // The minimum and maximum amount of the stable token that can be minted or
  // burned in a single exchange. Indexed by the keccak'd stable token registry identifier.
  mapping(bytes32 => ExchangeLimits) public stableTokenExchangeLimits;

  // State for all exchange proposals. Indexed by the exchange proposal ID.
  mapping(uint256 => ExchangeProposal) public exchangeProposals;

  // Number of exchange proposals that exist. Used for assigning an exchange
  // proposal ID to a new proposal.
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
  constructor(bool test) public InitializableV2(test) {}

  /**
   * @notice Returns the storage, major, minor, and patch version of the contract.
   * @return The storage, major, minor, and patch version of the contract.
   */
  function getVersionNumber() external pure returns (uint256, uint256, uint256, uint256) {
    return (1, 1, 0, 0);
  }

  /**
   * @notice Used in place of the constructor to allow the contract to be upgradable via proxy.
   * @param _registry The address of the registry.
   * @param _spread The spread charged on exchanges.
   */
  function initialize(
    address _registry,
    address _approver,
    uint256 _spread,
    uint256 _vetoPeriodSeconds
  ) external initializer {
    _transferOwnership(msg.sender);
    setRegistry(_registry);
    setApprover(_approver);
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
    bytes32 stableTokenRegistryIdHash = keccak256(abi.encodePacked(stableTokenRegistryId));
    address stableToken = registry.getAddressForOrDie(stableTokenRegistryIdHash);
    // Require the configurable stableToken max exchange amount to be > 0.
    // This covers the case where a stableToken has never been explicitly permitted.
    ExchangeLimits memory exchangeLimits = stableTokenExchangeLimits[stableTokenRegistryIdHash];
    require(exchangeLimits.maxExchangeAmount > 0, "Max stable token exchange amount must be > 0");

    // Using the current oracle exchange rate, calculate what the buy amount is.
    // This takes the spread into consideration.
    uint256 buyAmount = getBuyAmount(stableToken, sellAmount, sellCelo);

    // Ensure that the amount of stableToken being bought or sold is within
    // the configurable exchange limits.
    uint256 stableTokenExchangeAmount = sellCelo ? buyAmount : sellAmount;
    require(
      stableTokenExchangeAmount <= exchangeLimits.maxExchangeAmount &&
        stableTokenExchangeAmount >= exchangeLimits.minExchangeAmount,
      "Stable token exchange amount not within limits"
    );

    // Deposit the assets being sold.
    IERC20 sellToken = sellCelo ? getGoldToken() : IERC20(stableToken);
    require(
      sellToken.transferFrom(msg.sender, address(this), sellAmount),
      "Transfer in of sell token failed"
    );

    // Record the proposal.
    uint256 proposalId = exchangeProposalCount;
    exchangeProposals[proposalId] = ExchangeProposal({
      exchanger: msg.sender,
      stableToken: stableToken, // for stable tokens, is saved in units to deal with demurrage.
      sellAmount: sellCelo ? sellAmount : IStableToken(stableToken).valueToUnits(sellAmount),
      buyAmount: buyAmount,
      approvalTimestamp: 0, // initial value when not approved yet
      state: ExchangeProposalState.Proposed,
      sellCelo: sellCelo
    });
    exchangeProposalCount = exchangeProposalCount.add(1);
    // Even if stable tokens are being sold, the sellAmount emitted is the "value."
    emit ExchangeProposalCreated(
      proposalId,
      msg.sender,
      stableToken,
      sellAmount,
      buyAmount,
      sellCelo
    );

    return proposalId;
  }

  /**
   * @notice Approves an existing exchange proposal.
   * @dev Sender must be the approver. Exchange proposal must be in the Proposed state.
   * @param proposalId The identifier of the proposal to approve.
   */
  function approveExchangeProposal(uint256 proposalId) external onlyApprover {
    ExchangeProposal storage proposal = exchangeProposals[proposalId];
    // Ensure the proposal is in the Proposed state.
    require(proposal.state == ExchangeProposalState.Proposed, "Proposal must be in Proposed state");
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
    require(
      (proposal.state == ExchangeProposalState.Proposed && proposal.exchanger == msg.sender) ||
        (proposal.state == ExchangeProposalState.Approved && isOwner()),
      "Sender cannot cancel the exchange proposal"
    );
    // Mark the proposal as cancelled.
    proposal.state = ExchangeProposalState.Cancelled;
    // Get the token and amount that will be refunded to the proposer.
    (IERC20 refundToken, uint256 refundAmount) = getSellTokenAndSellAmount(proposal);
    // Finally, transfer out the deposited funds.
    require(
      refundToken.transfer(proposal.exchanger, refundAmount),
      "Transfer out of refund token failed"
    );
    emit ExchangeProposalCancelled(proposalId, msg.sender);
  }

  /**
   * @notice Executes an exchange proposal that's been approved and not vetoed.
   * @dev Callable by anyone. Reverts if the proposal is not in the Approved state
   * or vetoPeriodSeconds has not elapsed since approval.
   * @param proposalId The identifier of the proposal to execute.
   */
  function executeExchangeProposal(uint256 proposalId) external nonReentrant {
    ExchangeProposal storage proposal = exchangeProposals[proposalId];
    // Require that the proposal is in the Approved state.
    require(proposal.state == ExchangeProposalState.Approved, "Proposal must be in Approved state");
    // Require that the veto period has elapsed since the approval time.
    require(
      proposal.approvalTimestamp.add(vetoPeriodSeconds) <= block.timestamp,
      "Veto period not elapsed"
    );
    // Mark the proposal as executed.
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
   * @param stableToken The stableToken involved in the exchange.
   * @param sellAmount The amount of the sell token being sold.
   * @param sellCelo Whether CELO is being sold.
   * @return The amount of the asset being bought.
   */
  function getBuyAmount(address stableToken, uint256 sellAmount, bool sellCelo)
    public
    view
    returns (uint256)
  {
    // Gets the price of CELO quoted in stableToken.
    FixidityLib.Fraction memory exchangeRate = getOracleExchangeRate(stableToken);
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
   * @notice Sets the approver.
   * @dev Sender must be owner.
   * @param newApprover The new value for the spread.
   */
  function setApprover(address newApprover) public onlyOwner {
    approver = newApprover;
    emit ApproverSet(newApprover);
  }

  /**
   * @notice Sets the spread.
   * @dev Sender must be owner.
   * @param newSpread The new value for the spread.
   */
  function setSpread(uint256 newSpread) public onlyOwner {
    spread = FixidityLib.wrap(newSpread);
    emit SpreadSet(newSpread);
  }

  /**
   * @notice Sets the veto period in seconds.
   * @dev Sender must be owner.
   * @param newVetoPeriodSeconds The new value for the veto period in seconds.
   */
  function setVetoPeriodSeconds(uint256 newVetoPeriodSeconds) public onlyOwner {
    vetoPeriodSeconds = newVetoPeriodSeconds;
    emit VetoPeriodSecondsSet(newVetoPeriodSeconds);
  }

  /**
   * @notice Sets the minimum and maximum amount of the stable token an exchange can involve.
   * @dev Sender must be owner. Setting the maxExchangeAmount to 0 effectively disables new
   * exchange proposals for the token.
   * @param stableTokenRegistryId The string registry ID for the stable token to set limits for.
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
    bytes32 stableTokenRegistryIdHash = keccak256(abi.encodePacked(stableTokenRegistryId));
    stableTokenExchangeLimits[stableTokenRegistryIdHash] = ExchangeLimits({
      minExchangeAmount: minExchangeAmount,
      maxExchangeAmount: maxExchangeAmount
    });
    emit StableTokenExchangeLimitsSet(
      stableTokenRegistryId,
      stableTokenRegistryIdHash,
      minExchangeAmount,
      maxExchangeAmount
    );
  }
}
