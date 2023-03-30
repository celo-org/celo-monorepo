pragma solidity ^0.5.13;

import "../common/interfaces/IFeeHandlerSeller.sol";

import "../stability/interfaces/IExchange.sol";
import "../stability/interfaces/ISortedOracles.sol";

contract MentoFeeHandlerSeller is IFeeHandlerSeller {
  function sell(
    address sellTokenAddress,
    address buyTokenAddress,
    uint256 amount,
    uint256 maxSlippage
  ) external {
    address exchangeAddress = registry.getAddressForOrDie(stableToken.getExchangeRegistryId());

    IExchange exchange = IExchange(exchangeAddress);

    uint256 minAmount = 0;
    if (FixidityLib.unwrap(maxSlippage[tokenAddress]) != 0) {
      // max slippage is set
      // use sorted oracles as reference
      ISortedOracles sortedOracles = getSortedOracles();
      (uint256 rateNumerator, uint256 rateDenominator) = sortedOracles.medianRate(tokenAddress);
      minAmount = calculateMinAmount(rateNumerator, rateDenominator, tokenAddress, amount);
    }

    // TODO an upgrade would be to compare using routers as well
    stableToken.approve(exchangeAddress, amount);
    exchange.sell(amount, minAmount, false);
    pastBurn[tokenAddress] = pastBurn[tokenAddress].add(amount);
  }

  function bestQuote(address token, uint256 balance) external {}

  // in case some funds need to be returned or moved to another contract
  function transfer(address token, uint256 amount, address to) external {}
}
