pragma solidity ^0.5.13;

import "../common/FixidityLib.sol";
// import "openzeppelin-solidity/contracts/ownership/Ownable.sol";
import "openzeppelin-solidity/contracts/token/ERC20/IERC20.sol";

contract FeeHandlerSeller {
  // is Ownable
  using FixidityLib for FixidityLib.Fraction;

  // constructor(bool test) public {}

  function calculateMinAmount(
    uint256 midPriceNumerator,
    uint256 midPriceDenominator,
    uint256 amount,
    uint256 maxSlippage // as fraction
  ) public pure returns (uint256) {
    FixidityLib.Fraction memory maxSlippageFraction = FixidityLib.wrap(maxSlippage);

    FixidityLib.Fraction memory price = FixidityLib.newFixedFraction(
      midPriceNumerator,
      midPriceDenominator
    );
    FixidityLib.Fraction memory amountFraction = FixidityLib.newFixed(amount);
    FixidityLib.Fraction memory totalAmount = price.multiply(amountFraction);

    return
      totalAmount
        .subtract(price.multiply(maxSlippageFraction).multiply(amountFraction))
        .fromFixed();
  }

  // in case some funds need to be returned or moved to another contract
  function transfer(address token, uint256 amount, address to) external returns (bool) {
    return IERC20(token).transfer(to, amount);
  }
}
