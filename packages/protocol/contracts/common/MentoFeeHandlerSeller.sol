pragma solidity ^0.5.13;

import "../common/interfaces/IFeeHandlerSeller.sol";

import "../stability/interfaces/IExchange.sol";
import "../stability/interfaces/ISortedOracles.sol";
import "./UsingRegistry.sol";
import "../stability/StableToken.sol";
import "../common/FixidityLib.sol";
import "openzeppelin-solidity/contracts/token/ERC20/IERC20.sol";
import "../common/Initializable.sol";

contract MentoFeeHandlerSeller is IFeeHandlerSeller, UsingRegistry, Initializable {
  using FixidityLib for FixidityLib.Fraction;

  /**
   * @notice Sets initialized == true on implementation contracts.
   * @param test Set to true to skip implementation initialisation.
   */
  constructor(bool test) public Initializable(test) {}

  function initialize(address _registryAddress) external initializer {
    _transferOwnership(msg.sender);
    setRegistry(_registryAddress);
  }

  function sell(
    address sellTokenAddress,
    address buyToken,
    uint256 amount,
    uint256 maxSlippage // as fraction,
  ) external {
    require(
      buyToken == registry.getAddressForOrDie(GOLD_TOKEN_REGISTRY_ID),
      "Buy token can only be gold token"
    );

    StableToken stableToken = StableToken(sellTokenAddress);

    address exchangeAddress = registry.getAddressForOrDie(stableToken.getExchangeRegistryId());

    IExchange exchange = IExchange(exchangeAddress);

    uint256 minAmount = 0;
    if (maxSlippage != 0) {
      // max slippage is set
      // use sorted oracles as reference
      ISortedOracles sortedOracles = getSortedOracles();
      (uint256 rateNumerator, uint256 rateDenominator) = sortedOracles.medianRate(sellTokenAddress);
      minAmount = calculateMinAmount(rateNumerator, rateDenominator, amount, maxSlippage);
    }

    // TODO an upgrade would be to compare using routers as well
    stableToken.approve(exchangeAddress, amount);
    exchange.sell(amount, minAmount, false);

    IERC20 goldToken = getGoldToken();
    // IERC20 stableAsERC20 = IERC20(sellTokenAddress);
    goldToken.transfer(msg.sender, goldToken.balanceOf(address(this)));

  }

  function calculateMinAmount(
    uint256 midPriceNumerator,
    uint256 midPriceDenominator,
    uint256 amount,
    uint256 maxSlippage // as fraction
  )
    public
    pure
    returns (
      // FixidityLib.Fraction memory maxSlippage
      uint256
    )
  {
    FixidityLib.Fraction memory maxSlippageFraction = FixidityLib.wrap(maxSlippage);

    FixidityLib.Fraction memory price = FixidityLib.newFixedFraction(
      midPriceNumerator,
      midPriceDenominator
    );
    FixidityLib.Fraction memory amountFraction = FixidityLib.newFixed(amount);
    FixidityLib.Fraction memory totalAmount = price.multiply(amountFraction);

    return
      totalAmount
        .subtract((price.multiply(maxSlippageFraction)).multiply(amountFraction))
        .fromFixed();
  }

  function bestQuote(address token, uint256 balance) external {}

  // in case some funds need to be returned or moved to another contract
  function transfer(address token, uint256 amount, address to) external {}
}
