pragma solidity ^0.5.13;

import "../common/interfaces/IFeeHandlerSeller.sol";
import "openzeppelin-solidity/contracts/math/SafeMath.sol";
import "../stability/interfaces/IExchange.sol";
import "../stability/interfaces/ISortedOracles.sol";
import "./UsingRegistry.sol";
import "../stability/StableToken.sol";
import "../common/FixidityLib.sol";
import "openzeppelin-solidity/contracts/token/ERC20/IERC20.sol";
import "../common/Initializable.sol";
import "openzeppelin-solidity/contracts/ownership/Ownable.sol";
import "openzeppelin-solidity/contracts/math/Math.sol";
import "./FeeHandlerSeller.sol";

import "../uniswap/interfaces/IUniswapV2RouterMin.sol";
import "../uniswap/interfaces/IUniswapV2FactoryMin.sol";

contract UniswapFeeHandlerSeller is
  IFeeHandlerSeller,
  Ownable,
  UsingRegistry,
  Initializable,
  FeeHandlerSeller
{
  using SafeMath for uint256;
  using FixidityLib for FixidityLib.Fraction;

  mapping(address => address[]) public routerAddresses;
  uint256 constant MAX_TIMESTAMP_BLOCK_EXCHANGE = 20;

  event ReceivedQuote(address router, uint256 quote);
  event RouterUsed(address router);
  event RouterAddressSet(address token, address router);
  event RouterAddressRemoved(address token, address router);

  /**
   * @notice Sets initialized == true on implementation contracts.
   * @param test Set to true to skip implementation initialisation.
   */
  constructor(bool test) public Initializable(test) {}

  // without this line the contract can't receive native Celo transfers
  function() external payable {}

  function initialize(address _registryAddress, uint256 newMininumReports) external initializer {
    _transferOwnership(msg.sender);
    setRegistry(_registryAddress);
    setMinimumReports(newMininumReports);
  }

  /**
    * @notice Allows owner to set the router for a token.
    * @param token Address of the token to set.
    * @param router The new router.
    */
  function setRouter(address token, address router) external onlyOwner {
    _setRouter(token, router);
  }

  function _setRouter(address token, address router) private {
    require(router != address(0), "Router can't be address zero");
    routerAddresses[token].push(router);
    emit RouterAddressSet(token, router);
  }

  /**
    * @notice Allows owner to remove a router for a token.
    * @param token Address of the token.
    * @param router Address of the router to remove.
    * @param index The index of the router to remove.
    */
  function removeRouter(address token, address router, uint256 index) external onlyOwner {
    require(routerAddresses[token][index] == router, "Index does not match");

    uint256 length = routerAddresses[token].length;
    routerAddresses[token][index] = routerAddresses[token][length - 1];
    routerAddresses[token].pop();
    emit RouterAddressRemoved(token, router);
  }

  /**
    * @notice Get the list of routers for a token.
    * @param token The address of the token to query.
    * @return An array of all the allowed router.
    */
  function getRoutersForToken(address token) external view returns (address[] memory) {
    return routerAddresses[token];
  }

  function calculateAllMinAmount(
    address sellTokenAddress,
    uint256 maxSlippage,
    uint256 amount,
    IUniswapV2RouterMin bestRouter
  ) private returns (uint256) {
    ISortedOracles sortedOracles = getSortedOracles();
    require(
      sortedOracles.numRates(sellTokenAddress) >= minimumReports,
      "Number of reports for token not enough"
    );

    (uint256 rateNumerator, uint256 rateDenominator) = sortedOracles.medianRate(sellTokenAddress);

    uint256 minimalSortedOracles = calculateMinAmount(
      rateNumerator,
      rateDenominator,
      amount,
      maxSlippage
    );

    IERC20 celoToken = getGoldToken();
    address pair = IUniswapV2FactoryMin(bestRouter.factory()).getPair(
      sellTokenAddress,
      address(celoToken)
    );
    uint256 minAmountPair = calculateMinAmount(
      IERC20(sellTokenAddress).balanceOf(pair),
      celoToken.balanceOf(pair),
      amount,
      maxSlippage
    );

    return Math.max(minAmountPair, minimalSortedOracles);
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

    require(routerAddresses[sellTokenAddress].length > 0, "routerAddresses should be non empty");

    // An improvement to this function would be to allow the user to pass a path as argument
    // and if it generates a better outcome that the ones enabled that gets used
    // and the user gets a reward

    IERC20 celoToken = getGoldToken();

    uint256 bestRouterIndex = 0;
    uint256 bestRouterQuote = 0;

    address[] memory path = new address[](2);

    for (uint256 i = 0; i < routerAddresses[sellTokenAddress].length; i++) {
      address poolAddress = routerAddresses[sellTokenAddress][i];
      IUniswapV2RouterMin router = IUniswapV2RouterMin(poolAddress);

      path[0] = sellTokenAddress;
      path[1] = address(celoToken);

      // using the second return value becuase it's the last argument
      // the previous values show how many tokens are exchanged in each path
      // so the first value would be equivalent to balanceToBurn
      uint256 wouldGet = router.getAmountsOut(amount, path)[1];

      // require(false, "fail");
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
      minAmount = calculateAllMinAmount(sellTokenAddress, maxSlippage, amount, bestRouter);
    }

    IERC20(sellTokenAddress).approve(bestRouterAddress, amount);
    bestRouter.swapExactTokensForTokens(
      amount, // balanceToBurn, // amount
      minAmount,
      path,
      address(this),
      block.timestamp + MAX_TIMESTAMP_BLOCK_EXCHANGE
    );

    celoToken.transfer(msg.sender, celoToken.balanceOf(address(this)));
    emit RouterUsed(bestRouterAddress);
  }

  function bestQuote(address token, uint256 balance) external {
    return;
  }

}
