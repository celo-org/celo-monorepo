pragma solidity ^0.5.13;

import "../common/interfaces/IFeeHandlerSeller.sol";

import "../stability/interfaces/IExchange.sol";
import "../stability/interfaces/ISortedOracles.sol";
import "./UsingRegistry.sol";
import "../stability/StableToken.sol";
import "../common/FixidityLib.sol";
import "openzeppelin-solidity/contracts/token/ERC20/IERC20.sol";
import "../common/Initializable.sol";
import "openzeppelin-solidity/contracts/ownership/Ownable.sol";
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

    require(routerAddresses[sellTokenAddress].length > 0, "routerAddresses should be non empty");

    // An improvement to this function would be to allow the user to pass a path as argument
    // and if it generates a better outcome that the ones enabled that gets used
    // and the user gets a reward

    IERC20 goldToken = getGoldToken();
    // address celoAddress = address(getGoldToken());

    uint256 bestRouterIndex = 0;
    uint256 bestRouterQuote = 0;

    address[] memory path = new address[](2);
    // address[] memory thisTokenRouterAddresses = routerAddresses[sellTokenAddress];

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
  }

  function bestQuote(address token, uint256 balance) external {
    return;
  }

}
