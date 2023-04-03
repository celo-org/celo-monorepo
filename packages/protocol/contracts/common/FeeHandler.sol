pragma solidity ^0.5.13;

import "openzeppelin-solidity/contracts/math/SafeMath.sol";
import "openzeppelin-solidity/contracts/ownership/Ownable.sol";
import "openzeppelin-solidity/contracts/token/ERC20/IERC20.sol";

import "./UsingRegistry.sol";
import "../common/Freezable.sol";
import "../common/FixidityLib.sol";
import "../common/Initializable.sol";

import "../common/interfaces/IFeeHandler.sol";
import "../common/interfaces/IFeeHandlerSeller.sol";

// TODO move to IStableToken when it adds method getExchangeRegistryId
import "../stability/StableToken.sol";
import "../common/interfaces/ICeloVersionedContract.sol";
import "../common/interfaces/ICeloToken.sol";
import "../stability/interfaces/IExchange.sol";
import "../stability/interfaces/ISortedOracles.sol";

// Using the minimal required signatures in the interfaces so more contracts could be compatible
import "../uniswap/interfaces/IUniswapV2RouterMin.sol";
import "../uniswap/interfaces/IUniswapV2FactoryMin.sol";

contract FeeHandler is
  Ownable,
  Initializable,
  UsingRegistry,
  ICeloVersionedContract,
  Freezable,
  IFeeHandler
{
  using SafeMath for uint256;
  using FixidityLib for FixidityLib.Fraction;

  uint256 constant MAX_TIMESTAMP_BLOCK_EXCHANGE = 20;
  uint256 public constant FIXED1_UINT = 1000000000000000000000000;

  // Min units that can be burned
  uint256 public constant MIN_BURN = 200;
  // Historical amounts burned by this contract
  mapping(address => uint256) public pastBurn;
  // Max amounts that can be burned in a day for a token
  mapping(address => uint256) public dailyBurnLimit;
  // Max amounts that can be burned today for a token
  mapping(address => uint256) public currentDayLimit;
  // last day the daily limits were updated
  uint256 public lastLimitDay;
  // router addresses that can be set for a token
  mapping(address => address[]) public routerAddresses;

  // Max slippage that can be accepted when burning a token
  mapping(address => FixidityLib.Fraction) public maxSlippage;

  FixidityLib.Fraction public burnFraction; // 80%

  address feeBeneficiary;

  mapping(address => TokenState) public tokenStates;

  struct TokenState {
    address handler;
    bool active;
    uint256 maxSlippage;
    uint256 dailyBurnLimit;
    uint256 currentDateLimit;
    uint256 toDistribute;
  }

  event SoldAndBurnedToken(address token, uint256 value);
  event DailyLimitSet(address tokenAddress, uint256 newLimit);
  event DailyLimitHit(address token, uint256 burning);
  event MaxSlippageSet(address token, uint256 maxSlippage);
  event DailyLimitUpdated(uint256 amount);
  event RouterAddressSet(address token, address router);
  event RouterAddressRemoved(address token, address router);
  event RouterUsed(address router);
  event ReceivedQuote(address router, uint256 quote);

  /**
   * @notice Sets initialized == true on implementation contracts.
   * @param test Set to true to skip implementation initialisation.
   */
  constructor(bool test) public Initializable(test) {}

  /**
   * @notice Used in place of the constructor to allow the contract to be upgradable via proxy.
   * @param _registryAddress The address of the registry core smart contract.
   * @param tokens A list of tokens whose parameters should be set.
   * @param newLimits A list of daily burn limits, corresponding with the same order as in the 
      argument tokens.
   * @param newMaxSlippages A list of max acceptable slippage, corresponding with the same order as 
      in the argument tokens.
   * @param newRouters A list of routers, corresponding with the same order as in the argument 
      tokens.
   */
  function initialize(
    address _registryAddress,
    address[] calldata tokens,
    uint256[] calldata newLimits,
    uint256[] calldata newMaxSlippages,
    address[] calldata newRouters
  ) external initializer {
    require(tokens.length == newLimits.length, "limits length should match tokens'");
    require(tokens.length == newMaxSlippages.length, "maxSlippage length should match tokens'");
    require(tokens.length == newRouters.length, "maxSlippage length should match tokens'");

    _transferOwnership(msg.sender);
    setRegistry(_registryAddress);

    for (uint256 i = 0; i < tokens.length; i++) {
      _setDailyBurnLimit(tokens[i], newLimits[i]);
      _setMaxSplippage(tokens[i], newMaxSlippages[i]);
      // Mento tokens don't need to set a router
      if (newRouters[i] != address(0)) {
        _setRouter(tokens[i], newRouters[i]);
      }
    }
  }

  function _setBurnFraction(uint256 newFraction) private {
    FixidityLib.Fraction memory fraction = FixidityLib.wrap(newFraction);
    require(
      FixidityLib.lte(fraction, FixidityLib.fixed1()),
      "Burn fraction must be less than or equal to 1"
    );
    burnFraction = fraction;
    // emit TODO
  }

  function setBurnFraction(uint256 fraction) external onlyOwner {
    return _setBurnFraction(fraction);
  }

  function sell(address tokenAddress) external {
    return _sell(tokenAddress);
  }

  function addToken(address tokenAddress, address handlerAddress) external {
    IFeeHandlerSeller(handlerAddress);

    // Check that the contract implements the interface
    TokenState storage tokenState = tokenStates[tokenAddress];
    tokenState.active = true;
    tokenState.handler = handlerAddress;
  }

  function removeToken(address tokenAddress) external {}

  // TODO no reentrant
  function _sell(address tokenAddress) private onlyWhenNotFrozen {
    IERC20 token = IERC20(tokenAddress);

    TokenState storage tokenState = tokenStates[tokenAddress];
    FixidityLib.Fraction memory balanceOfTokenToBurn = FixidityLib.newFixed(
      token.balanceOf(address(this))
    );

    uint256 balanceToBurn = (burnFraction.multiply(balanceOfTokenToBurn).fromFixed()).sub(
      tokenState.toDistribute
    );

    tokenState.toDistribute += (token.balanceOf(address(this)).sub(balanceToBurn));

    // small numbers cause rounding errors and zero case should be skipped
    if (balanceToBurn <= MIN_BURN) {
      return;
    }

    if (dailyBurnLimitHit(tokenAddress, balanceToBurn)) {
      // in case the limit is hit, burn the max possible
      // TODO move to state
      balanceToBurn = currentDayLimit[tokenAddress];
      emit DailyLimitHit(tokenAddress, balanceToBurn);
    }

    token.transfer(address(tokenState.handler), balanceToBurn);
    IFeeHandlerSeller handler = IFeeHandlerSeller(tokenState.handler);
    handler.sell(
      tokenAddress,
      registry.getAddressForOrDie(GOLD_TOKEN_REGISTRY_ID),
      balanceToBurn,
      FixidityLib.unwrap(maxSlippage[tokenAddress])
    );

    pastBurn[tokenAddress] = pastBurn[tokenAddress].add(balanceToBurn);
    updateLimits(tokenAddress, balanceToBurn);

    emit SoldAndBurnedToken(tokenAddress, balanceToBurn);

    // TODO UpdateBurn amount

  }

  function distribute(address tokenAddress) external {
    return _distribute(tokenAddress);
  }

  function _distribute(address tokenAddress) private {
    TokenState storage tokenState = tokenStates[tokenAddress];
    IERC20 token = IERC20(tokenAddress);
    token.transfer(feeBeneficiary, tokenState.toDistribute);
    tokenState.toDistribute = 0;
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

  /**
    * @notice Allows owner to set max slippage for a token.
    * @param token Address of the token to set.
    * @param newMax New sllipage to set, as Fixidity fraction.
    */
  function setMaxSplippage(address token, uint256 newMax) external onlyOwner {
    _setMaxSplippage(token, newMax);
  }

  function _setMaxSplippage(address token, uint256 newMax) private {
    maxSlippage[token] = FixidityLib.wrap(newMax);
    emit MaxSlippageSet(token, newMax);
  }

  /**
    * @notice Allows owner to set the daily burn limit for a token.
    * @param token Address of the token to set.
    * @param newLimit The new limit to set, in the token units.
    */
  function setDailyBurnLimit(address token, uint256 newLimit) external onlyOwner {
    _setDailyBurnLimit(token, newLimit);
  }

  function _setDailyBurnLimit(address token, uint256 newLimit) private {
    dailyBurnLimit[token] = newLimit;
    emit DailyLimitSet(token, newLimit);
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

  /**
    * @notice Burns all the Celo balance of this contract.
    */
  function burnAllCelo() public {
    ICeloToken celo = ICeloToken(registry.getAddressForOrDie(GOLD_TOKEN_REGISTRY_ID));
    celo.burn(celo.balanceOf(address(this)));
  }

  /**
    * @param token The address of the token to query.
    * @return The amount burned for a token.
    */
  function getPastBurnForToken(address token) external view returns (uint256) {
    return pastBurn[token];
  }

  /**
    * @param token The address of the token to query.
    * @param amountToBurn The amount of the token to burn.
    * @return Returns true if burning amountToBurn would exceed the daily limit.
    */
  function dailyBurnLimitHit(address token, uint256 amountToBurn) public returns (bool) {
    if (dailyBurnLimit[token] == 0) {
      // if no limit set, assume uncapped
      return false;
    }

    uint256 currentDay = now / 1 days;
    // Pattern borrowed from Reserve.sol
    if (currentDay > lastLimitDay) {
      lastLimitDay = currentDay;
      currentDayLimit[token] = dailyBurnLimit[token];
    }

    return amountToBurn >= currentDayLimit[token];
  }

  /**
    * @notice Updates the current day limit for a token.
    * @param token The address of the token to query.
    * @param amountBurned the amount of the token that was burned.
    */
  function updateLimits(address token, uint256 amountBurned) private {
    if (dailyBurnLimit[token] == 0) {
      // if no limit set, assume uncapped
      return;
    }
    currentDayLimit[token] = currentDayLimit[token].sub(amountBurned);
    emit DailyLimitUpdated(amountBurned);
    return;
  }

  /**
    * @notice Burns the max possible of a Mento token.
    * @dev Should be used in case the loop fails because a swap is reverting or Out of Gas (OOG).
    * @param tokenAddress The address of the token to burn.
    */
  function burnSingleMentoToken(address tokenAddress) public onlyWhenNotFrozen {
    StableToken stableToken = StableToken(tokenAddress);
    uint256 balanceToBurn = stableToken.balanceOf(address(this));

    if (dailyBurnLimitHit(tokenAddress, balanceToBurn)) {
      // in case the limit is hit, burn the max possible
      balanceToBurn = currentDayLimit[tokenAddress];
      emit DailyLimitHit(tokenAddress, balanceToBurn);
    }

    // small numbers cause rounding errors and zero case should be skipped
    if (balanceToBurn <= MIN_BURN) {
      return;
    }

    address exchangeAddress = registry.getAddressForOrDie(stableToken.getExchangeRegistryId());

    IExchange exchange = IExchange(exchangeAddress);

    uint256 minAmount = 0;
    if (FixidityLib.unwrap(maxSlippage[tokenAddress]) != 0) {
      // max slippage is set
      // use sorted oracles as reference
      ISortedOracles sortedOracles = getSortedOracles();
      (uint256 rateNumerator, uint256 rateDenominator) = sortedOracles.medianRate(tokenAddress);
      minAmount = calculateMinAmount(rateNumerator, rateDenominator, tokenAddress, balanceToBurn);
    }

    // TODO an upgrade would be to compare using routers as well
    stableToken.approve(exchangeAddress, balanceToBurn);
    exchange.sell(balanceToBurn, minAmount, false);
    pastBurn[tokenAddress] = pastBurn[tokenAddress].add(balanceToBurn);

    updateLimits(tokenAddress, balanceToBurn);

    emit SoldAndBurnedToken(tokenAddress, balanceToBurn);
  }

  /**
    * @notice Burns the max possible amount of a token.
    * @dev Should be used in case the loop fails because one token is reverting or 
    Out of Gas (OOG).
    * @param tokenAddress The address of the token to burn.
    */
  function burnSingleNonMentoToken(address tokenAddress) public onlyWhenNotFrozen {
    // An improvement to this function would be to allow the user to pass a path as argument
    // and if it generates a better outcome that the ones enabled that gets used
    // and the user gets a reward

    address celoAddress = address(getGoldToken());

    uint256 bestRouterIndex = 0;
    uint256 bestRouterQuote = 0;

    address[] memory path = new address[](2);
    address[] memory thisTokenRouterAddresses = routerAddresses[tokenAddress];

    require(thisTokenRouterAddresses.length > 0, "routerAddresses should be non empty");

    IERC20 token = IERC20(tokenAddress);
    uint256 balanceToBurn = token.balanceOf(address(this));

    if (dailyBurnLimitHit(tokenAddress, balanceToBurn)) {
      // in case the limit is hit, burn the max possible
      balanceToBurn = currentDayLimit[tokenAddress];
      emit DailyLimitHit(tokenAddress, balanceToBurn);
    }

    // small numbers cause rounding errors and zero case should be skipped
    if (balanceToBurn <= MIN_BURN) {
      return;
    }

    for (uint256 i = 0; i < thisTokenRouterAddresses.length; i++) {
      address poolAddress = thisTokenRouterAddresses[i];
      IUniswapV2RouterMin router = IUniswapV2RouterMin(poolAddress);

      path[0] = tokenAddress;
      path[1] = celoAddress;

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

    address bestRouterAddress = thisTokenRouterAddresses[bestRouterIndex];
    IUniswapV2RouterMin bestRouter = IUniswapV2RouterMin(bestRouterAddress);

    uint256 minAmount = 0;
    if (FixidityLib.unwrap(maxSlippage[tokenAddress]) != 0) {
      address pair = IUniswapV2FactoryMin(bestRouter.factory()).getPair(tokenAddress, celoAddress);
      minAmount = calculateMinAmount(
        token.balanceOf(pair),
        getGoldToken().balanceOf(pair),
        tokenAddress,
        balanceToBurn
      );
    }

    token.approve(bestRouterAddress, balanceToBurn);
    bestRouter.swapExactTokensForTokens(
      balanceToBurn,
      minAmount,
      path,
      address(this),
      block.timestamp + MAX_TIMESTAMP_BLOCK_EXCHANGE
    );

    pastBurn[tokenAddress] = pastBurn[tokenAddress].add(balanceToBurn);
    updateLimits(tokenAddress, balanceToBurn);

    emit SoldAndBurnedToken(tokenAddress, balanceToBurn);
    emit RouterUsed(bestRouterAddress);
  }

  /**
    * @notice Burns the max possible of all the Mento tokens in this contract.
    * @dev If one token burn fails, burnSingleMentoToken should be used instead
    */
  function burnMentoTokens() public {
    // here it could also be checked that the tokens is whitelisted, but we assume everything
    // that has already been sent here is due for burning
    address[] memory mentoTokens = getReserve().getTokens();

    for (uint256 i = 0; i < mentoTokens.length; i++) {
      burnSingleMentoToken(mentoTokens[i]);

    }

  }

  /**
    * @param midPriceNumerator The numerator of the price.
    * @param midPriceDenominator The denominator of the price.
    * @param tokenAddress The address of the token to query.
    * @param amount The amount to swap.
    * @return The minimal amount of tokens expected for a swap.
    */
  function calculateMinAmount(
    uint256 midPriceNumerator,
    uint256 midPriceDenominator,
    address tokenAddress,
    uint256 amount
  ) public view returns (uint256) {
    FixidityLib.Fraction memory price = FixidityLib.newFixedFraction(
      midPriceNumerator,
      midPriceDenominator
    );
    FixidityLib.Fraction memory amountFraction = FixidityLib.newFixed(amount);
    FixidityLib.Fraction memory totalAmount = price.multiply(amountFraction);

    return
      totalAmount
        .subtract((price.multiply(maxSlippage[tokenAddress])).multiply(amountFraction))
        .fromFixed();
  }

  /**
    * @notice Burns the max possible of all the whitelisted non-Mento tokens in this contract.
    * @dev If one token burn fails, burnSingleNonMentoToken should be used instead
    */
  function burnNonMentoTokens() public {
    address[] memory tokens = getFeeCurrencyWhitelistRegistry().getWhitelistNonMento();

    // i is token index
    for (uint256 i = 0; i < tokens.length; i++) {
      burnSingleNonMentoToken(tokens[i]);
    }

  }

  /**
    * @notice Burns all the possible tokens this contract holds.
    */
  function burn() external {
    burnMentoTokens();
    burnNonMentoTokens();
    burnAllCelo();
  }

  /**
    * @notice Allows owner to transfer tokens of this contract. It's meant for governance to 
      trigger use cases not contemplated in this contract
    */
  function transfer(address token, address recipient, uint256 value)
    external
    onlyOwner
    returns (bool)
  {
    return IERC20(token).transfer(recipient, value);
  }
}
