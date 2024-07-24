// SPDX-License-Identifier: LGPL-3.0-only
pragma solidity >=0.8.7 <0.8.20;

import "@openzeppelin/contracts8/access/Ownable.sol";
import "@openzeppelin/contracts8/utils/math/SafeMath.sol";
import "@openzeppelin/contracts8/interfaces/IERC20.sol";

import "./interfaces/IExchange.sol";
import "./interfaces/IStableTokenMento.sol";

import "../../contracts-0.8/common/UsingRegistry.sol";
import "../stability/interfaces/ISortedOracles.sol";
import "../common/FixidityLib.sol";
import "../common/Initializable.sol";
import "./FeeHandlerSeller.sol";

// An implementation of FeeHandlerSeller supporting interfaces compatible with
// Mento
// See https://github.com/celo-org/celo-proposals/blob/master/CIPs/cip-0052.md
contract MentoFeeHandlerSeller is FeeHandlerSeller {
  using SafeMath for uint256;
  using FixidityLib for FixidityLib.Fraction;

  /**
   * @notice Sets initialized == true on implementation contracts.
   * @param test Set to true to skip implementation initialisation.
   */
  constructor(bool test) public Initializable(test) {}

  // without this line the contract can't receive native Celo transfers
  receive() external payable {}

  function sell(
    address sellTokenAddress,
    address buyTokenAddress,
    uint256 amount,
    uint256 maxSlippage // as fraction,
  ) external returns (uint256) {
    require(
      buyTokenAddress == registry.getAddressForOrDie(CELO_TOKEN_REGISTRY_ID),
      "Buy token can only be gold token"
    );

    IStableTokenMento stableToken = IStableTokenMento(sellTokenAddress);
    require(amount <= stableToken.balanceOf(address(this)), "Balance of token to burn not enough");

    address exchangeAddress = registry.getAddressForOrDie(stableToken.getExchangeRegistryId());

    IExchange exchange = IExchange(exchangeAddress);

    uint256 minAmount = 0;

    ISortedOracles sortedOracles = getSortedOracles();

    require(
      sortedOracles.numRates(sellTokenAddress) >= minimumReports[sellTokenAddress],
      "Number of reports for token not enough"
    );

    (uint256 rateNumerator, uint256 rateDenominator) = sortedOracles.medianRate(sellTokenAddress);
    minAmount = calculateMinAmount(rateNumerator, rateDenominator, amount, maxSlippage);

    // TODO an upgrade would be to compare using routers as well
    stableToken.approve(exchangeAddress, amount);
    exchange.sell(amount, minAmount, false);

    IERC20 goldToken = getCeloToken();
    uint256 celoAmount = goldToken.balanceOf(address(this));
    goldToken.transfer(msg.sender, celoAmount);

    emit TokenSold(sellTokenAddress, buyTokenAddress, amount);
    return celoAmount;
  }

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
}
