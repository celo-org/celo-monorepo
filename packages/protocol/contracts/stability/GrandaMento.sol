pragma solidity ^0.5.13;

import "openzeppelin-solidity/contracts/math/SafeMath.sol";
import "openzeppelin-solidity/contracts/ownership/Ownable.sol";

import "../common/FixidityLib.sol";
import "../common/InitializableV2.sol";
import "../common/UsingRegistry.sol";
import "../common/interfaces/ICeloVersionedContract.sol";
import "../common/libraries/ReentrancyGuard.sol";

/**
 * @title Facilitates large exchanges between CELO and a stable token.
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

  event ProposedExchange(
    uint256 indexed proposalId,
    address indexed exchanger,
    address stableToken,
    uint256 sellAmount,
    uint256 buyAmount,
    bool sellCelo
  );

  enum ExchangeState { Empty, Proposed, Approved, Executed, Cancelled }

  struct ExchangeLimits {
    uint256 minExchangeAmount;
    uint256 maxExchangeAmount;
  }

  struct ExchangeProposal {
    address exchanger;
    address stableToken;
    uint256 sellAmount;
    uint256 buyAmount;
    ExchangeState state;
    bool sellCelo;
  }

  /**
   * @notice Has the authority to approve a proposed exchange.
   */
  address public approver;

  /**
   * @notice The minimum amount of time in seconds that must elapse between a
   * proposed exchange being approved and when the exchange can be executed.
   * Should give sufficient time for Governance to veto an approved exchange.
   */
  uint256 public exchangeWaitPeriodSeconds;

  /**
   * @notice The percent fee imposed upon an exchange execution.
   */
  FixidityLib.Fraction public spread;

  /**
   * @notice Indexed by stable token address. The minimum and maximum amount of
   * the stable token that can be minted or burned in a single exchange.
   */
  mapping(address => ExchangeLimits) public stableTokenExchangeLimits;

  /**
   * @notice Indexed by the exchange proposal ID. State for all exchange proposals.
   * @dev A mapping is used instead of an array for slightly less gas consumption.
   */
  mapping(uint256 => ExchangeProposal) public exchangeProposals;

  /**
   * @notice Number of exchange proposals that exist.
   * @dev Used for assigning an exchange proposal ID to a new proposal.
   */
  uint256 public exchangeProposalCount;

  /**
   * @notice Requires msg.sender to be the approver.
   */
  modifier onlyApprover() {
    require(msg.sender == approver, "Sender must be the approver");
    _;
  }

  /**
   * @notice Sets initialized == true on implementation contracts
   * @param test Set to true to skip implementation initialization
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
   */
  function initialize(address _registry) external initializer {
    _transferOwnership(msg.sender);
    setRegistry(_registry);
  }

  function proposeExchange(address stableToken, uint256 sellAmount, bool sellCelo)
    external
    nonReentrant
    returns (uint256)
  {
    // Require the configurable stableToken max exchange amount to be > 0.
    ExchangeLimits memory exchangeLimits = stableTokenExchangeLimits[stableToken];
    require(exchangeLimits.maxExchangeAmount > 0, "Max stable token exchange amount must be > 0");

    // Using the current oracle exchange rate, calculate what the buy amount is.
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
      stableToken: stableToken,
      sellAmount: sellAmount,
      buyAmount: buyAmount,
      state: ExchangeState.Proposed,
      sellCelo: sellCelo
    });
    emit ProposedExchange(proposalId, msg.sender, stableToken, sellAmount, buyAmount, sellCelo);
    exchangeProposalCount = exchangeProposalCount.add(1);

    return proposalId;
  }

  function getBuyAmount(address stableToken, uint256 sellAmount, bool sellCelo)
    public
    view
    returns (uint256)
  {
    // Gets the price of CELO quoted in stableToken.
    FixidityLib.Fraction memory exchangeRate = getOracleExchangeRate(stableToken);
    // If stableToken is being sold, we instead want the price of stableToken
    // quoted in CELO.
    if (!sellCelo) {
      exchangeRate = exchangeRate.reciprocal();
    }
    // The sell amount taking the spread into account, ie:
    // (1 - spread) * sellAmount
    FixidityLib.Fraction memory adjustedSellAmount = FixidityLib.fixed1().subtract(spread).multiply(
      FixidityLib.newFixed(sellAmount)
    );
    return exchangeRate.multiply(adjustedSellAmount).fromFixed();
  }

  function getOracleExchangeRate(address stableToken)
    private
    view
    returns (FixidityLib.Fraction memory)
  {
    uint256 rateNumerator;
    uint256 rateDenominator;
    (rateNumerator, rateDenominator) = getSortedOracles().medianRate(stableToken);
    require(rateDenominator > 0, "Exchange rate denominator must be greater than 0");
    return FixidityLib.wrap(rateNumerator).divide(FixidityLib.wrap(rateDenominator));
  }

  function setStableTokenExchangeLimits(
    address stableToken,
    uint256 minExchangeAmount,
    uint256 maxExchangeAmount
  ) external onlyOwner {
    stableTokenExchangeLimits[stableToken] = ExchangeLimits({
      minExchangeAmount: minExchangeAmount,
      maxExchangeAmount: maxExchangeAmount
    });
  }
}
