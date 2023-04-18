pragma solidity ^0.5.13;

import "openzeppelin-solidity/contracts/math/SafeMath.sol";
import "openzeppelin-solidity/contracts/math/Math.sol";
import "openzeppelin-solidity/contracts/ownership/Ownable.sol";
import "openzeppelin-solidity/contracts/token/ERC20/IERC20.sol";
import "openzeppelin-solidity/contracts/utils/EnumerableSet.sol";

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
import "../common/libraries/ReentrancyGuard.sol";

contract FeeHandler is
  Ownable,
  Initializable,
  UsingRegistry,
  ICeloVersionedContract,
  Freezable,
  IFeeHandler,
  ReentrancyGuard
{
  using SafeMath for uint256;
  using FixidityLib for FixidityLib.Fraction;
  using EnumerableSet for EnumerableSet.AddressSet;

  uint256 constant MAX_TIMESTAMP_BLOCK_EXCHANGE = 20;
  uint256 public constant FIXED1_UINT = 1000000000000000000000000;

  // Min units that can be burned
  uint256 public constant MIN_BURN = 200;

  // last day the daily limits were updated
  uint256 public lastLimitDay;

  FixidityLib.Fraction public burnFraction; // 80%

  address public feeBeneficiary;

  // This mapping can not be public because it contains  a FixidityLib.Fraction
  // and that'd be only supported with experimental features in this
  // compiler version
  mapping(address => TokenState) private tokenStates;

  struct TokenState {
    address handler;
    bool active;
    FixidityLib.Fraction maxSlippage;
    // Max amounts that can be burned in a day for a token
    uint256 dailyBurnLimit;
    // Max amounts that can be burned today for a token
    uint256 currentDayLimit;
    uint256 toDistribute;
    // Historical amounts burned by this contract
    uint256 pastBurn;
  }

  EnumerableSet.AddressSet private activeTokens;

  event SoldAndBurnedToken(address token, uint256 value);
  event DailyLimitSet(address tokenAddress, uint256 newLimit);
  event DailyLimitHit(address token, uint256 burning);
  event MaxSlippageSet(address token, uint256 maxSlippage);
  event DailyLimitUpdated(uint256 amount);
  event RouterAddressSet(address token, address router);
  event RouterAddressRemoved(address token, address router);
  event RouterUsed(address router);
  event ReceivedQuote(address router, uint256 quote);
  event FeeBeneficiarySet(address newBeneficiary);
  event BurnFractionSet(uint256 fraction);

  /**
   * @notice Sets initialized == true on implementation contracts.
   * @param test Set to true to skip implementation initialisation.
   */
  constructor(bool test) public Initializable(test) {}

  /**
   * @notice Used in place of the constructor to allow the contract to be upgradable via proxy.
   */
  function initialize(
    address _registryAddress,
    address newFeeBeneficiary,
    uint256 newBurnFraction,
    address[] calldata tokens,
    address[] calldata handlers,
    uint256[] calldata newLimits,
    uint256[] calldata newMaxSlippages
  ) external initializer {
    require(tokens.length == handlers.length, "limits length should match tokens");
    require(tokens.length == newLimits.length, "maxSlippage length should match tokens");
    require(tokens.length == newMaxSlippages.length, "maxSlippage length should match tokens");

    _transferOwnership(msg.sender);
    setRegistry(_registryAddress);
    _setFeeBeneficiary(newFeeBeneficiary);
    _setBurnFraction(newBurnFraction);

    for (uint256 i = 0; i < tokens.length; i++) {
      _addToken(tokens[i], handlers[i]);
      _setDailyBurnLimit(tokens[i], newLimits[i]);
      _setMaxSplippage(tokens[i], newMaxSlippages[i]);
    }
    TokenState storage tokenState = tokenStates[registry.getAddressForOrDie(
      GOLD_TOKEN_REGISTRY_ID
    )];
    tokenState.active = true;
  }

  function() external payable {}

  function getTokenHandler(address tokenAddress) external view returns (address) {
    return tokenStates[tokenAddress].handler;
  }

  function getTokenActive(address tokenAddress) external view returns (bool) {
    return tokenStates[tokenAddress].active;
  }

  function getTokenMaxSlippage(address tokenAddress) external view returns (uint256) {
    return FixidityLib.unwrap(tokenStates[tokenAddress].maxSlippage);
  }

  function getTokenDailyBurnLimit(address tokenAddress) external view returns (uint256) {
    return tokenStates[tokenAddress].dailyBurnLimit;
  }

  function getTokenCurrentDayLimit(address tokenAddress) external view returns (uint256) {
    return tokenStates[tokenAddress].currentDayLimit;
  }

  function getTokenToDistribute(address tokenAddress) external view returns (uint256) {
    return tokenStates[tokenAddress].toDistribute;
  }

  function setFeeBeneficiary(address beneficiary) external onlyOwner {
    return _setFeeBeneficiary(beneficiary);
  }

  function _setFeeBeneficiary(address beneficiary) private {
    feeBeneficiary = beneficiary;
    emit FeeBeneficiarySet(beneficiary);
  }

  function _setBurnFraction(uint256 newFraction) private {
    FixidityLib.Fraction memory fraction = FixidityLib.wrap(newFraction);
    require(
      FixidityLib.lte(fraction, FixidityLib.fixed1()),
      "Burn fraction must be less than or equal to 1"
    );
    burnFraction = fraction;
    emit BurnFractionSet(newFraction);
  }

  function setBurnFraction(uint256 fraction) external onlyOwner {
    return _setBurnFraction(fraction);
  }

  function sell(address tokenAddress) external {
    return _sell(tokenAddress);
  }

  function _addToken(address tokenAddress, address handlerAddress) private {
    // Check that the contract implements the interface
    IFeeHandlerSeller(handlerAddress);

    TokenState storage tokenState = tokenStates[tokenAddress];
    tokenState.active = true;
    tokenState.handler = handlerAddress;

    activeTokens.add(tokenAddress);
  }

  function deactivateToken(address tokenAddress) external onlyOwner {
    _deactivateToken(tokenAddress);
  }

  function _deactivateToken(address tokenAddress) private {
    activeTokens.remove(tokenAddress);
    TokenState storage tokenState = tokenStates[tokenAddress];
    tokenState.active = false;
  }

  function addToken(address tokenAddress, address handlerAddress) external onlyOwner {
    _addToken(tokenAddress, handlerAddress);
  }

  function getActiveTokens() public view returns (address[] memory) {
    return activeTokens.values;
  }

  function removeToken(address tokenAddress) external onlyOwner {
    _removeToken(tokenAddress);
  }

  function _removeToken(address tokenAddress) private {
    _deactivateToken(tokenAddress);
    TokenState storage tokenState = tokenStates[tokenAddress];
    tokenState.handler = address(0);
  }

  function _sell(address tokenAddress) private onlyWhenNotFrozen nonReentrant {
    IERC20 token = IERC20(tokenAddress);

    TokenState storage tokenState = tokenStates[tokenAddress];
    FixidityLib.Fraction memory balanceOfTokenToBurn = FixidityLib.newFixed(
      token.balanceOf(address(this)).sub(tokenState.toDistribute)
    );

    uint256 balanceToBurn = (burnFraction.multiply(balanceOfTokenToBurn).fromFixed());
    uint256 contractBalance = token.balanceOf(address(this));

    // safety check, try to burn more than what it has
    balanceToBurn = Math.min(balanceToBurn, contractBalance);

    tokenState.toDistribute += (contractBalance.sub(balanceToBurn));

    // small numbers cause rounding errors and zero case should be skipped
    if (balanceToBurn <= MIN_BURN) {
      return;
    }

    if (dailyBurnLimitHit(tokenAddress, balanceToBurn)) {
      // in case the limit is hit, burn the max possible
      // TODO move to state
      balanceToBurn = tokenState.currentDayLimit;
      emit DailyLimitHit(tokenAddress, balanceToBurn);
    }

    // TODO check handler tokenState.handler
    token.transfer(tokenState.handler, balanceToBurn);
    IFeeHandlerSeller handler = IFeeHandlerSeller(tokenState.handler);

    handler.sell(
      tokenAddress,
      registry.getAddressForOrDie(GOLD_TOKEN_REGISTRY_ID),
      balanceToBurn,
      FixidityLib.unwrap(tokenState.maxSlippage)
    );

    tokenState.pastBurn = tokenState.pastBurn.add(balanceToBurn);
    updateLimits(tokenAddress, balanceToBurn);

    emit SoldAndBurnedToken(tokenAddress, balanceToBurn);
  }

  function distribute(address tokenAddress) external {
    return _distribute(tokenAddress);
  }

  function _distribute(address tokenAddress) private {
    require(feeBeneficiary != address(0), "Can't distribute to the zero address");
    IERC20 token = IERC20(tokenAddress);
    uint256 tokenBalance = token.balanceOf(address(this));

    TokenState storage tokenState = tokenStates[tokenAddress];

    // safty check to avoid a revert due balance
    uint256 balanceToDistribute = Math.min(tokenBalance, tokenState.toDistribute);

    if (balanceToDistribute == 0) {
      // don't distribute with zero balance
      return;
    }

    token.transfer(feeBeneficiary, balanceToDistribute);
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
    TokenState storage tokenState = tokenStates[token];
    tokenState.maxSlippage = FixidityLib.wrap(newMax);
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
    TokenState storage tokenState = tokenStates[token];
    tokenState.dailyBurnLimit = newLimit;
    emit DailyLimitSet(token, newLimit);
  }

  function burnCelo() external {
    return _burnCelo();
  }

  function handleAll() external {
    return _handleAll();
  }

  function _handleAll() private {
    for (uint256 i = 0; i < EnumerableSet.length(activeTokens); i++) {
      // calling _handle will trigger a lot of burn Celo that can be just batched at the end
      // _handle(activeTokens[i]);
      address token = activeTokens.get(i);
      _sell(token);
      // TODO move to _distributeAll(), this should thisitrbute celo as well
      _distribute(token);
    }
    _burnCelo();
  }

  function handle(address tokenAddress) external {
    return _handle(tokenAddress);
  }

  function _handle(address tokenAddress) private {
    // Celo doesn't have to be exchanged for anything
    if (tokenAddress != registry.getAddressForOrDie(GOLD_TOKEN_REGISTRY_ID)) {
      _sell(tokenAddress);
    }
    _burnCelo();
    _distribute(tokenAddress);
  }

  /**
    * @notice Burns all the Celo balance of this contract.
    */
  function _burnCelo() private {
    TokenState storage tokenState = tokenStates[registry.getAddressForOrDie(
      GOLD_TOKEN_REGISTRY_ID
    )];
    ICeloToken celo = ICeloToken(registry.getAddressForOrDie(GOLD_TOKEN_REGISTRY_ID));

    uint256 balanceOfCelo = celo.balanceOf(address(this));
    uint256 balanceToProcess = balanceOfCelo.sub(tokenState.toDistribute);
    uint256 balanceToBurn = FixidityLib
      .newFixed(balanceToProcess)
      .multiply(burnFraction)
      .fromFixed();
    celo.burn(balanceToBurn);

    tokenState.toDistribute += balanceToProcess - balanceToBurn;

    // emit?

  }

  /**
    * @param token The address of the token to query.
    * @return The amount burned for a token.
    */
  function getPastBurnForToken(address token) external view returns (uint256) {
    return tokenStates[token].pastBurn;
  }

  /**
    * @param token The address of the token to query.
    * @param amountToBurn The amount of the token to burn.
    * @return Returns true if burning amountToBurn would exceed the daily limit.
    */
  function dailyBurnLimitHit(address token, uint256 amountToBurn) public returns (bool) {
    TokenState storage tokenState = tokenStates[token];

    if (tokenState.dailyBurnLimit == 0) {
      // if no limit set, assume uncapped
      return false;
    }

    uint256 currentDay = now / 1 days;
    // Pattern borrowed from Reserve.sol
    if (currentDay > lastLimitDay) {
      lastLimitDay = currentDay;
      tokenState.currentDayLimit = tokenState.dailyBurnLimit;
    }

    return amountToBurn >= tokenState.currentDayLimit;
  }

  /**
    * @notice Updates the current day limit for a token.
    * @param token The address of the token to query.
    * @param amountBurned the amount of the token that was burned.
    */
  function updateLimits(address token, uint256 amountBurned) private {
    TokenState storage tokenState = tokenStates[token];

    if (tokenState.dailyBurnLimit == 0) {
      // if no limit set, assume uncapped
      return;
    }
    tokenState.currentDayLimit = tokenState.currentDayLimit.sub(amountBurned);
    emit DailyLimitUpdated(amountBurned);
    return;
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
