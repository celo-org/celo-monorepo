pragma solidity ^0.5.13;

import "openzeppelin-solidity/contracts/math/SafeMath.sol";
import "openzeppelin-solidity/contracts/ownership/Ownable.sol";
import "openzeppelin-solidity/contracts/token/ERC20/IERC20.sol";
import "../common/FixidityLib.sol";

import "./UsingRegistryV2.sol";

import "../common/interfaces/ICeloVersionedContract.sol";

import "../common/interfaces/ICeloToken.sol";
import "../common/Initializable.sol";

import "../stability/StableToken.sol"; // TODO check if this can be interface
import "../stability/interfaces/IExchange.sol";
import "../stability/interfaces/ISortedOracles.sol";

// Using the minimal required signatures in the interfaces so more contracts could be compatible
import "../uniswap/interfaces/IUniswapV2RouterMin.sol"; // TODO change for a more minimalist interface
import "../uniswap/interfaces/IUniswapV2Factory.sol";
import "../uniswap/interfaces/IUniswapV2PairMin.sol";

contract FeeBurner is Ownable, Initializable, UsingRegistryV2, ICeloVersionedContract {
  using SafeMath for uint256;
  using FixidityLib for FixidityLib.Fraction;

  uint256 public constant MIN_BURN = 200;
  mapping(address => uint256) public pastBurn;
  mapping(address => uint256) public dailyBurnLimit;
  mapping(address => uint256) public currentDayLimit;
  mapping(address => address[]) public routerAddresses;
  uint256 public lastLimitDay;

  mapping(address => FixidityLib.Fraction) public maxSlippage;

  // event CeloBalance(uint256 celoBalance);
  event SoldAndBurnedToken(address token, uint256 value);
  event DailyLimitSet(address tokenAddress, uint256 newLimit);
  event DailyLimitHit(address token, uint256 burning);
  event MAxSlippageSet(address token, uint256 maxSlippage);

  event DailyLimitUpdatedDeleteMe(uint256 amount);
  event RouterAddressSet(address token, address router);
  event RouterAddressRemoved(address token, address router);
  event RouterUsed(address router);
  event ReceivedQuote(address router, uint256 quote);

  /**
   * @notice Sets initialized == true on implementation contracts
   * @param test Set to true to skip implementation initialization
   */
  constructor(bool test) public Initializable(test) {}

  /**
   * @notice Used in place of the constructor to allow the contract to be upgradable via proxy.
   */
  function initialize(
    address _registryAddress,
    address[] calldata tokens,
    uint256[] calldata newLimits,
    uint256[] calldata newMaxSlippages,
    address[] calldata newRouters
  ) external initializer {
    require(tokens.length == newLimits.length, "limits lenght should match tokens'");
    require(tokens.length == newMaxSlippages.length, "maxSlippage lenght should match tokens'");
    require(tokens.length == newRouters.length, "maxSlippage lenght should match tokens'");

    _transferOwnership(msg.sender);
    setRegistry(_registryAddress);

    for (uint256 i = 0; i < tokens.length; i++) {
      _setDailyBurnLimit(tokens[i], newLimits[i]);
      _setMaxSplipagge(tokens[i], newMaxSlippages[i]);
      // Mento tokens don't need to set a router
      if (newRouters[i] != address(0)) {
        _setRouter(tokens[i], newRouters[i]);
      }
    }
  }

  function getVersionNumber() external pure returns (uint256, uint256, uint256, uint256) {
    return (1, 0, 0, 0);
  }

  function setMaxSplipagge(address tokenAddress, uint256 newMax) external onlyOwner {
    _setMaxSplipagge(tokenAddress, newMax);
  }

  function _setMaxSplipagge(address tokenAddress, uint256 newMax) private {
    maxSlippage[tokenAddress] = FixidityLib.wrap(newMax);
    emit MAxSlippageSet(tokenAddress, newMax);
  }

  function setDailyBurnLimit(address tokenAddress, uint256 newLimit) external onlyOwner {
    _setDailyBurnLimit(tokenAddress, newLimit);
  }

  function _setDailyBurnLimit(address tokenAddress, uint256 newLimit) private {
    dailyBurnLimit[tokenAddress] = newLimit;
    emit DailyLimitSet(tokenAddress, newLimit);
  }

  function setRouter(address token, address router) external onlyOwner {
    _setRouter(token, router);
  }

  function _setRouter(address token, address router) private {
    routerAddresses[token].push(router);
    emit RouterAddressSet(token, router);
  }

  function getRouterForToken(address token) external view returns (address[] memory) {
    return routerAddresses[token];
  }

  function burnAllCelo() public {
    ICeloToken celo = ICeloToken(getCeloTokenAddress());
    celo.burn(celo.balanceOf(address(this)));
  }

  function getPastBurnForToken(address tokenAddress) external view returns (uint256) {
    return pastBurn[tokenAddress];
  }

  function limitHit(address tokenAddress, uint256 amountToBurn) public returns (bool) {
    if (dailyBurnLimit[tokenAddress] == 0) {
      // if no limit set, assume uncapped
      return false;
    }

    uint256 currentDay = now / 1 days;
    // Pattern borrowed from Reserve.sol
    if (currentDay > lastLimitDay) {
      lastLimitDay = currentDay;
      currentDayLimit[tokenAddress] = dailyBurnLimit[tokenAddress];
    }

    return amountToBurn >= currentDayLimit[tokenAddress];
  }

  function updateLimits(address tokenAddress, uint256 amountBurned) private returns (bool) {
    if (dailyBurnLimit[tokenAddress] == 0) {
      // if no limit set, assume uncapped
      return false;
    }
    currentDayLimit[tokenAddress] = currentDayLimit[tokenAddress].sub(amountBurned);
    emit DailyLimitUpdatedDeleteMe(amountBurned);
    return true;
  }

  // should be used in case the loop fails because one token is reverting or OOG
  function burnSingleMentoToken(address tokenAddress) public {
    StableToken stableToken = StableToken(tokenAddress);
    uint256 balanceToBurn = stableToken.balanceOf(address(this));

    if (limitHit(tokenAddress, balanceToBurn)) {
      // in case the limit is hit, burn the max possible
      balanceToBurn = currentDayLimit[tokenAddress];
      emit DailyLimitHit(tokenAddress, balanceToBurn);
    }

    address exchangeAddress = registryContract.getAddressForOrDie(
      stableToken.getExchangeRegistryId()
    );

    IExchange exchange = IExchange(exchangeAddress);

    uint256 minAmount = 0;
    if (FixidityLib.unwrap(maxSlippage[tokenAddress]) != 0) {
      // max slippage is set
      // use sorted oracles as reference
      ISortedOracles sortedOracles = getSortedOracles();
      (uint256 priceWithoutSlippage, ) = sortedOracles.medianRate(tokenAddress);
      minAmount = calculateMinAmount(priceWithoutSlippage, tokenAddress, balanceToBurn);
    }

    // small numbers cause rounding errors and zero case should be skiped
    if (balanceToBurn <= MIN_BURN) {
      return;
    }

    // TODO maybe we could compare with uniswap as well
    stableToken.approve(exchangeAddress, balanceToBurn);
    exchange.sell(balanceToBurn, minAmount, false);
    pastBurn[tokenAddress] += balanceToBurn;

    updateLimits(tokenAddress, balanceToBurn);

    emit SoldAndBurnedToken(tokenAddress, balanceToBurn);
  }

  function burnSingleNonMentoToken(address tokenAddress) public {
    // an improvement to this function would be to allow the user to pass a path as argument
    // and if it generates a better outcome that the ones enabled that gets used
    // and the user gets a reward

    address celoAddress = getCeloTokenAddress();

    uint256 bestRouterIndex = 0;
    uint256 bestRouterQuote = 0;

    address[] memory path = new address[](2);
    address[] memory thisTokenRouterAddresses = routerAddresses[tokenAddress];

    IERC20 token = IERC20(tokenAddress);
    uint256 balanceToBurn = token.balanceOf(address(this));

    if (limitHit(tokenAddress, balanceToBurn)) {
      // in case the limit is hit, burn the max possible
      balanceToBurn = currentDayLimit[tokenAddress];
      emit DailyLimitHit(tokenAddress, balanceToBurn);
    }

    // small numbers cause rounding errors and zero case should be skiped
    if (balanceToBurn <= MIN_BURN) {
      return;
    }

    require(thisTokenRouterAddresses.length > 0, "routerAddresses should be non empty");

    for (uint256 j = 0; j < thisTokenRouterAddresses.length; j++) {
      address poolAddress = thisTokenRouterAddresses[j];

      require(poolAddress != address(0), "poolAddress should be nonZero");
      IUniswapV2RouterMin router = IUniswapV2RouterMin(poolAddress);

      path[0] = tokenAddress;
      path[1] = celoAddress;

      uint256 wouldGet = router.getAmountsOut(balanceToBurn, path)[1];
      emit ReceivedQuote(poolAddress, wouldGet);
      if (wouldGet > bestRouterQuote) {
        bestRouterQuote = wouldGet;
        bestRouterIndex = j;
      }
    }

    // don't try to exchange on zero quotes
    if (bestRouterQuote > 0) {
      address bestRouterAddress = thisTokenRouterAddresses[bestRouterIndex];
      IUniswapV2RouterMin bestRouter = IUniswapV2RouterMin(bestRouterAddress);

      uint256 minAmount = 0;
      if (FixidityLib.unwrap(maxSlippage[tokenAddress]) != 0) {
        // checking slippage before trading
        IUniswapV2PairMin pair = IUniswapV2PairMin(
          IUniswapV2Factory(bestRouter.factory()).getPair(tokenAddress, celoAddress)
        );
        (uint256 tokenAmount, uint256 celoAmount, ) = pair.getReserves();
        minAmount = calculateMinAmount(tokenAmount / celoAmount, tokenAddress, balanceToBurn);
      }

      token.approve(bestRouterAddress, balanceToBurn);
      bestRouter.swapExactTokensForTokens(
        balanceToBurn,
        minAmount,
        path,
        address(this),
        block.timestamp + 10
      );

      updateLimits(tokenAddress, balanceToBurn);

      emit SoldAndBurnedToken(tokenAddress, balanceToBurn);
      emit RouterUsed(bestRouterAddress);

    }
  }

  // this function is permionless
  function burnMentoAssets() public {
    // here it could also be checked that the tokens is whitelisted, but we assume everything that has already been sent here is
    // due for burning
    address[] memory mentoTokens = getReserve().getTokens();

    for (uint256 i = 0; i < mentoTokens.length; i++) {
      burnSingleMentoToken(mentoTokens[i]);

    }

  }

  function calculateMinAmount(uint256 midPrice, address tokenAddress, uint256 amount)
    public
    view
    returns (uint256)
  {
    return
      (midPrice * amount) -
      (FixidityLib.newFixed(midPrice).multiply(maxSlippage[tokenAddress]).fromFixed()) *
      amount;
  }

  function burnNonMentoTokens() public {
    address[] memory tokens = getFeeCurrencyWhitelistRegistry().getWhitelistNonMento();

    // i is token index
    for (uint256 i = 0; i < tokens.length; i++) {
      burnSingleNonMentoToken(tokens[i]);
    }

  }

  // this function is permionless
  function burn() external {
    burnMentoAssets();
    burnNonMentoTokens();
    burnAllCelo();
  }

  function transfer(address token, address recipient, uint256 value) external onlyOwner {
    // meant for governance to trigger use cases not contemplated in this contract
    IERC20(token).transfer(recipient, value);
  }

  function removetExchange(address token, address routerAddress, uint256 index) external onlyOwner {
    // TODO test me
    require(routerAddresses[token][index] == routerAddress, "Index does not match");

    uint256 lenght = routerAddresses[token].length;
    routerAddresses[token][lenght - 1] = routerAddresses[token][index];
    routerAddresses[token].pop();
    emit RouterAddressRemoved(token, routerAddress);
  }

}
