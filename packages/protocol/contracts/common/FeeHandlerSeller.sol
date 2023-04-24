pragma solidity ^0.5.13;

import "openzeppelin-solidity/contracts/math/SafeMath.sol";
import "../common/FixidityLib.sol";
import "openzeppelin-solidity/contracts/ownership/Ownable.sol";
import "openzeppelin-solidity/contracts/token/ERC20/IERC20.sol";

contract FeeHandlerSeller is Ownable {
  using FixidityLib for FixidityLib.Fraction;
  uint256 public minimumReports; // TODO change for token
  using SafeMath for uint256;

  event MinimumReportsSet(uint256 minimumReports);

  /**
    * @notice Allows owner to set the minimum number of reports required
    * @param newMininumReports The new update minimum number of reports required
    */
  function setMinimumReports(uint256 newMininumReports) public onlyOwner {
    minimumReports = newMininumReports;
    emit MinimumReportsSet(newMininumReports);
  }

  /**
    @dev Calculates the minimum amount of tokens that should be received for the specified 
    amount with the given mid-price and maximum slippage.
    @param midPriceNumerator The numerator of the mid-price for the token pair.
    @param midPriceDenominator The denominator of the mid-price for the token pair.
    @param amount The amount of tokens to be exchanged.
    @param maxSlippage The maximum slippage percentage as a fraction of the mid-price.
    @return The minimum amount of tokens that should be received as a uint256 value.
  */
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

  /**
  * @notice Allows owner to transfer tokens of this contract. It's meant for governance to 
    trigger use cases not contemplated in this contract.
    @param token The address of the token to transfer.
    @param amount The amount of tokens to transfer.
    @param to The address of the recipient to transfer the tokens to.
    @return A boolean indicating whether the transfer was successful or not.
  */
  function transfer(address token, uint256 amount, address to) external onlyOwner returns (bool) {
    return IERC20(token).transfer(to, amount);
  }
}
