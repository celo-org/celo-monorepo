pragma solidity ^0.5.13;

import "../common/interfaces/IFeeHandlerSeller.sol";

import "../stability/interfaces/IExchange.sol";
import "../stability/interfaces/ISortedOracles.sol";
import "./UsingRegistry.sol";
import "../stability/StableToken.sol";
import "../common/FixidityLib.sol";
import "openzeppelin-solidity/contracts/token/ERC20/IERC20.sol";
import "../common/Initializable.sol";

import "../uniswap/interfaces/IUniswapV2RouterMin.sol";
import "../uniswap/interfaces/IUniswapV2FactoryMin.sol";

contract UniswapFeeHandlerSeller is IFeeHandlerSeller, UsingRegistry, Initializable {
  using FixidityLib for FixidityLib.Fraction;
  mapping(address => address[]) public routerAddresses;

  uint256 constant MAX_TIMESTAMP_BLOCK_EXCHANGE = 20;

  event ReceivedQuote(address router, uint256 quote);
  event RouterUsed(address router);

  /**
   * @notice Sets initialized == true on implementation contracts.
   * @param test Set to true to skip implementation initialisation.
   */
  constructor(bool test) public Initializable(test) {}

  function initialize(address _registryAddress) external initializer {
    _transferOwnership(msg.sender);
    setRegistry(_registryAddress);
  }

  // This function explicitly defines few variables because it was getting error "stack too deep"
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

    // An improvement to this function would be to allow the user to pass a path as argument
    // and if it generates a better outcome that the ones enabled that gets used
    // and the user gets a reward

    IERC20 goldToken = getGoldToken();
    // address celoAddress = address(getGoldToken());

    uint256 bestRouterIndex = 0;
    uint256 bestRouterQuote = 0;

    address[] memory path = new address[](2);
    // address[] memory thisTokenRouterAddresses = routerAddresses[sellTokenAddress];

    require(routerAddresses[sellTokenAddress].length > 0, "routerAddresses should be non empty");

    // IERC20 token = IERC20(sellTokenAddress);
    uint256 balanceToBurn = IERC20(sellTokenAddress).balanceOf(address(this));

    for (uint256 i = 0; i < routerAddresses[sellTokenAddress].length; i++) {
      address poolAddress = routerAddresses[sellTokenAddress][i];
      IUniswapV2RouterMin router = IUniswapV2RouterMin(poolAddress);

      path[0] = sellTokenAddress;
      path[1] = address(goldToken);

      // using the second return value becuase it's the last argument
      // the previous values show how many tokens are exchanged in each path
      // so the first value would be equivalent to balanceToBurn
      uint256 wouldGet = router.getAmountsOut(balanceToBurn, path)[1];
      emit ReceivedQuote(poolAddress, wouldGet);
      if (wouldGet > bestRouterQuote) {
        bestRouterQuote = wouldGet;
        bestRouterIndex = i;
      }
    }

    // don't try to exchange on zero quotes
    if (bestRouterQuote == 0) {
      return;
    }

    address bestRouterAddress = routerAddresses[sellTokenAddress][bestRouterIndex];
    IUniswapV2RouterMin bestRouter = IUniswapV2RouterMin(bestRouterAddress);

    uint256 minAmount = 0;
    if (maxSlippage != 0) {
      address pair = IUniswapV2FactoryMin(bestRouter.factory()).getPair(
        sellTokenAddress,
        address(goldToken)
      );
      minAmount = calculateMinAmount(
        IERC20(sellTokenAddress).balanceOf(pair),
        goldToken.balanceOf(pair),
        amount,
        maxSlippage
      );
    }

    IERC20(sellTokenAddress).approve(bestRouterAddress, balanceToBurn);
    bestRouter.swapExactTokensForTokens(
      balanceToBurn,
      minAmount,
      path,
      address(this),
      block.timestamp + MAX_TIMESTAMP_BLOCK_EXCHANGE
    );

    goldToken.transfer(msg.sender, goldToken.balanceOf(address(this)));
    emit RouterUsed(bestRouterAddress);
    // _sendBackCeloBalance();
  }

  // function _sendBackCeloBalance() private {
  //   IERC20 goldToken = getGoldToken();
  //   // IERC20 stableAsERC20 = IERC20(sellTokenAddress);
  // }

  // TODO move this to abstract class
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
