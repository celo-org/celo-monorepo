pragma solidity ^0.5.13;

import "../common/interfaces/IFeeHandlerSeller.sol";
import "openzeppelin-solidity/contracts/ownership/Ownable.sol";
import "../stability/interfaces/IExchange.sol";
import "../stability/interfaces/ISortedOracles.sol";
import "./UsingRegistry.sol";
import "../stability/StableToken.sol";
import "../common/FixidityLib.sol";
import "openzeppelin-solidity/contracts/token/ERC20/IERC20.sol";
import "../common/Initializable.sol";
import "./FeeHandlerSeller.sol";

contract MentoFeeHandlerSeller is
  IFeeHandlerSeller,
  Ownable,
  UsingRegistry,
  Initializable,
  FeeHandlerSeller
{
  using FixidityLib for FixidityLib.Fraction;

  /**
   * @notice Sets initialized == true on implementation contracts.
   * @param test Set to true to skip implementation initialisation.
   */
  constructor(bool test) public Initializable(test) {}

  // without this line the contract can't receive native Celo transfers
  function() external payable {}

  function initialize(address _registryAddress) external initializer {
    _transferOwnership(msg.sender);
    setRegistry(_registryAddress);
  }

  /**
   * @notice Returns the storage, major, minor, and patch version of the contract.
   * @return Storage version of the contract.
   * @return Major version of the contract.
   * @return Minor version of the contract.
   * @return Patch version of the contract.
   */
  function getVersionNumber() external pure returns (uint256, uint256, uint256, uint256) {
    return (1, 1, 0, 0);
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
    require(amount <= stableToken.balanceOf(address(this)), "Balance of token to burn not enough");

    address exchangeAddress = registry.getAddressForOrDie(stableToken.getExchangeRegistryId());

    IExchange exchange = IExchange(exchangeAddress);

    uint256 minAmount = 0;
    if (maxSlippage != 0) {
      // max slippage is set
      // use sorted oracles as reference

      // TODO check amount of reports or that the bucket hasn't been updated in 5 minutes
      // safetyCheck() or modifier
      ISortedOracles sortedOracles = getSortedOracles();
      (uint256 rateNumerator, uint256 rateDenominator) = sortedOracles.medianRate(sellTokenAddress);
      minAmount = calculateMinAmount(rateNumerator, rateDenominator, amount, maxSlippage);
    }

    // TODO an upgrade would be to compare using routers as well
    stableToken.approve(exchangeAddress, amount);
    exchange.sell(amount, minAmount, false);

    IERC20 goldToken = getGoldToken();
    goldToken.transfer(msg.sender, goldToken.balanceOf(address(this)));
  }

  // function bestQuote(address token, uint256 balance) external {
  function bestQuote(address token, uint256 balance) external {
    return;
  }

  // in case some funds need to be returned or moved to another contract
  // function transfer(address token, uint256 amount, address to) external onlyOwner returns (bool){}

  // function calculateMinAmount(
  //   uint256 midPriceNumerator,
  //   uint256 midPriceDenominator,
  //   uint256 amount,
  //   uint256 maxSlippage // as fraction
  // )
  //   public
  //   pure
  //   returns (
  //     uint256
  //   )
  // {
  //   FixidityLib.Fraction memory maxSlippageFraction = FixidityLib.wrap(maxSlippage);

  //   FixidityLib.Fraction memory price = FixidityLib.newFixedFraction(
  //     midPriceNumerator,
  //     midPriceDenominator
  //   );
  //   FixidityLib.Fraction memory amountFraction = FixidityLib.newFixed(amount);
  //   FixidityLib.Fraction memory totalAmount = price.multiply(amountFraction);

  //   return
  //     totalAmount
  //       .subtract(price.multiply(maxSlippageFraction).multiply(amountFraction))
  //       .fromFixed();
  // }

}
