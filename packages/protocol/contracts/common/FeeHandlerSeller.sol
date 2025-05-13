pragma solidity ^0.5.13;

import "openzeppelin-solidity/contracts/math/SafeMath.sol";
import "../common/FixidityLib.sol";
import "openzeppelin-solidity/contracts/ownership/Ownable.sol";
import "openzeppelin-solidity/contracts/token/ERC20/IERC20.sol";
import "./UsingRegistry.sol";
import "../common/Initializable.sol";

// Abstract class for a FeeHandlerSeller, as defined in CIP-52
// https://github.com/celo-org/celo-proposals/blob/master/CIPs/cip-0052.md
contract FeeHandlerSeller is Ownable, Initializable, UsingRegistry {
  using SafeMath for uint256;
  using FixidityLib for FixidityLib.Fraction;

  // Address of the token
  // Minimal number of reports in SortedOracles contract
  mapping(address => uint256) public minimumReports;

  event MinimumReportsSet(address tokenAddress, uint256 minimumReports);
  event TokenSold(address soldTokenAddress, address boughtTokenAddress, uint256 amount);

  function initialize(
    address _registryAddress,
    address[] calldata tokenAddresses,
    uint256[] calldata newMininumReports
  ) external initializer {
    _transferOwnership(msg.sender);
    setRegistry(_registryAddress);

    for (uint256 i = 0; i < tokenAddresses.length; i++) {
      _setMinimumReports(tokenAddresses[i], newMininumReports[i]);
    }
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

  /**
   * @notice Allows owner to set the minimum number of reports required.
   * @param newMininumReports The new update minimum number of reports required.
   */
  function setMinimumReports(address tokenAddress, uint256 newMininumReports) public onlyOwner {
    _setMinimumReports(tokenAddress, newMininumReports);
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

  function _setMinimumReports(address tokenAddress, uint256 newMininumReports) internal {
    minimumReports[tokenAddress] = newMininumReports;
    emit MinimumReportsSet(tokenAddress, newMininumReports);
  }
}
