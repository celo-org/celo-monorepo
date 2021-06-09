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

  // Emitted when the spread is set.
  event SpreadSet(uint256 spread);

  // Emitted when the exchange limits for a stable token are set.
  event StableTokenExchangeLimitsSet(
    address indexed stableToken,
    uint256 minExchangeAmount,
    uint256 maxExchangeAmount
  );

  enum ExchangeState { None, Proposed, Approved, Executed, Cancelled }

  struct ExchangeLimits {
    // The minimum amount of an asset that can be exchanged in a single proposal.
    uint256 minExchangeAmount;
    // The maximum amount of an asset that can be exchanged in a single proposal.
    uint256 maxExchangeAmount;
  }

  struct ExchangeProposal {
    // The exchanger/proposer of the exchange proposal.
    address exchanger;
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
    // The timestamp (`block.timestamp`) at which the exchange proposal was approved.
    // If the exchange proposal has not ever been approved, is 0.
    uint256 approvalTimestamp;
    // The state of the exchange proposal.
    ExchangeState state;
    // Whether CELO is being sold and stableToken is being bought.
    bool sellCelo;
  }

  // The percent fee imposed upon an exchange execution.
  FixidityLib.Fraction public spread;

  // The minimum and maximum amount of the stable token that can be minted or
  // burned in a single exchange. Indexed by stable token address.
  mapping(address => ExchangeLimits) public stableTokenExchangeLimits;

  // State for all exchange proposals. Indexed by the exchange proposal ID.
  mapping(uint256 => ExchangeProposal) public exchangeProposals;

  // Number of exchange proposals that exist. Used for assigning an exchange
  // proposal ID to a new proposal.
  uint256 public exchangeProposalCount;

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
  function initialize(address _registry, uint256 _spread) external initializer {
    _transferOwnership(msg.sender);
    setRegistry(_registry);
    setSpread(_spread);
  }

  /**
   * @notice Creates a new exchange proposal and deposits the tokens being sold.
   * @dev Stable token value amounts are used for the sellAmount, not unit amounts.
   * @param stableToken The stableToken involved in the exchange.
   * @param sellAmount The amount of the sell token being sold.
   * @param sellCelo Whether CELO is being sold.
   * @return The proposal identifier for the newly created exchange proposal.
   */
  function createExchangeProposal(address stableToken, uint256 sellAmount, bool sellCelo)
    external
    nonReentrant
    returns (uint256)
  {
    // Require the configurable stableToken max exchange amount to be > 0.
    // This covers the case where a stableToken has never been explicitly permitted.
    ExchangeLimits memory exchangeLimits = stableTokenExchangeLimits[stableToken];
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
      "Transfer of sell token failed"
    );

    // Record the proposal.
    uint256 proposalId = exchangeProposalCount;
    exchangeProposals[proposalId] = ExchangeProposal({
      exchanger: msg.sender,
      stableToken: stableToken, // for stable tokens, is saved in units to deal with demurrage.
      sellAmount: sellCelo ? sellAmount : IStableToken(stableToken).valueToUnits(sellAmount),
      buyAmount: buyAmount,
      approvalTimestamp: 0, // initial value when not approved yet
      state: ExchangeState.Proposed,
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
   * @notice Sets the spread.
   * @dev Sender must be owner.
   * @param newSpread The new value for the spread.
   */
  function setSpread(uint256 newSpread) public onlyOwner {
    spread = FixidityLib.wrap(newSpread);
    emit SpreadSet(newSpread);
  }

  /**
   * @notice Sets the minimum and maximum amount of the stable token an exchange can involve.
   * @dev Sender must be owner. Setting the maxExchangeAmount to 0 effectively disables new
   * exchange proposals for the token.
   * @param stableToken The stable token to set the limits for.
   * @param minExchangeAmount The new minimum exchange amount for the stable token.
   * @param maxExchangeAmount The new maximum exchange amount for the stable token.
   */
  function setStableTokenExchangeLimits(
    address stableToken,
    uint256 minExchangeAmount,
    uint256 maxExchangeAmount
  ) external onlyOwner {
    require(
      minExchangeAmount <= maxExchangeAmount,
      "Min exchange amount must not be greater than max"
    );
    stableTokenExchangeLimits[stableToken] = ExchangeLimits({
      minExchangeAmount: minExchangeAmount,
      maxExchangeAmount: maxExchangeAmount
    });
    emit StableTokenExchangeLimitsSet(stableToken, minExchangeAmount, maxExchangeAmount);
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
}
