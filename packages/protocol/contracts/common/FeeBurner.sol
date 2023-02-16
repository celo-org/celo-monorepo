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

import "../uniswap/interfaces/IUniswapV2Router02.sol"; // TODO change for a more minimalist function

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

  /**
   * @notice Sets initialized == true on implementation contracts
   * @param test Set to true to skip implementation initialization
   */
  constructor(bool test) public Initializable(test) {}

  /**
   * @notice Used in place of the constructor to allow the contract to be upgradable via proxy.
   */
  function initialize(address _registryAddress) external initializer {
    _transferOwnership(msg.sender);
    setRegistry(_registryAddress);
    // lastLimitDay = now / 1 days;
    // TODO add limits
    // TODO maxSlippage
    // TODO add pool
  }

  function getVersionNumber() external pure returns (uint256, uint256, uint256, uint256) {
    return (1, 0, 0, 0);
  }

  // TODO chose the best price from options

  function burnAllCelo() public {
    ICeloToken celo = ICeloToken(getCeloTokenAddress());
    celo.burn(celo.balanceOf(address(this)));
  }

  function getPastBurnForToken(address tokenAddress) external view returns (uint256) {
    return pastBurn[tokenAddress];
  }

  function setDailyBurnLimit(address tokenAddress, uint256 newLimit) external onlyOwner {
    dailyBurnLimit[tokenAddress] = newLimit;
    emit DailyLimitSet(tokenAddress, newLimit);
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

  function burnSingleMentoToken() public {}
  function burnSingleNonMentoToken() public {}

  function setMaxSplipagge(address tokenAddress, uint256 newMax) external onlyOwner {
    maxSlippage[tokenAddress] = FixidityLib.wrap(newMax);
    emit MAxSlippageSet(tokenAddress, newMax);
  }

  // this function is permionless
  function burnMentoAssets() private {
    // here it could also be checked that the tokens is whitelisted, but we assume everything that has already been sent here is
    // due for burning
    address[] memory mentoTokens = getReserve().getTokens();

    // require(false, "start"); // TODO remove me

    for (uint256 i = 0; i < mentoTokens.length; i++) {
      address tokenAddress = mentoTokens[i];

      StableToken stableToken = StableToken(tokenAddress);
      uint256 balanceToBurn = stableToken.balanceOf(address(this));

      if (limitHit(tokenAddress, balanceToBurn)) {
        // in case the limit is hit, burn the max possible
        balanceToBurn = currentDayLimit[tokenAddress];
        emit DailyLimitHit(tokenAddress, balanceToBurn);
      }

      // small numbers cause rounding errors and zero case should be skiped
      if (balanceToBurn <= MIN_BURN) {
        continue;
      }

      address exchangeAddress = registryContract.getAddressForOrDie(
        stableToken.getExchangeRegistryId()
      );

      IExchange exchange = IExchange(exchangeAddress);

      // minBuyAmount is zero because this functions is meant to be called reguarly with small amounts

      stableToken.approve(exchangeAddress, balanceToBurn);

      uint256 minAmount = 0;
      if (FixidityLib.unwrap(maxSlippage[tokenAddress]) != 0) {
        // max slippage is set
        // use sorted oracles as reference
        ISortedOracles sortedOracles = getSortedOracles();
        (uint256 amountWithoutSlippage, uint256 _) = sortedOracles.medianRate(tokenAddress);
        minAmount = FixidityLib
          .newFixed(amountWithoutSlippage)
          .multiply(maxSlippage[tokenAddress])
          .fromFixed();
      }

      exchange.sell(balanceToBurn, minAmount, false);
      pastBurn[tokenAddress] += balanceToBurn;

      updateLimits(tokenAddress, balanceToBurn);

      emit SoldAndBurnedToken(tokenAddress, balanceToBurn);

      // uint256 celoBalance = celo.balanceOf(address(this));
      // emit CeloBalance(celoBalance);
      // require(celoBalance > 0, "Celo Balance not bigger than zero"); // TODO remove me

    }

  }

  function burnNonMentoTokens() public {
    address[] memory tokens = getFeeCurrencyWhitelistRegistry().getWhitelistNonMento();
    address celoAddress = getCeloTokenAddress();

    for (uint256 i = 0; i < tokens.length; i++) {
      address tokenAddress = tokens[i];
      address[] memory pollAddresses = routerAddresses[tokenAddress];

      require(pollAddresses.length > 0, "pollAddresses should be non empty");

      address poolAddress = routerAddresses[tokenAddress][0]; // TODO check the zero // TODO get right iteration

      require(poolAddress != address(0), "pollAddresses should be nonZero");
      IUniswapV2Router02 router = IUniswapV2Router02(poolAddress);
      IERC20 token = IERC20(tokenAddress);

      uint256 balanceToBurn = token.balanceOf(address(this));

      if (limitHit(tokenAddress, balanceToBurn)) {
        // in case the limit is hit, burn the max possible
        balanceToBurn = currentDayLimit[tokenAddress];
        emit DailyLimitHit(tokenAddress, balanceToBurn);
      }
      // require(false, "made it here");

      // small numbers cause rounding errors and zero case should be skiped
      if (balanceToBurn <= MIN_BURN) {
        continue;
      }

      address[] memory path = new address[](2);
      path[0] = tokenAddress;
      path[1] = celoAddress;

      // TODO test this
      uint256 wouldGet = router.getAmountsOut(balanceToBurn, path)[0];

      token.approve(poolAddress, balanceToBurn);
      router.swapExactTokensForTokens(balanceToBurn, 0, path, address(this), block.timestamp + 10);
      // TODO use more than one

      updateLimits(tokenAddress, balanceToBurn);

      emit SoldAndBurnedToken(tokenAddress, balanceToBurn);

    }

  }

  // this function is permionless
  function burn() external {
    burnMentoAssets();
    burnAllCelo();
    burnNonMentoTokens();
    // burn other assets
    // TODO:
    // 1. Make swap (Meto for stables, for other Uniswap)
    // 2. burn
  }

  function transfer(address token, address recipient, uint256 value) external onlyOwner {
    // meant for governance to trigger use cases not contemplated in this contract
    // TODO test me
    IERC20(token).transfer(recipient, value);
  }

  function setExchange(address token, address router) external onlyOwner {
    _setExchange(token, router);
  }

  function _setExchange(address token, address router) private {
    routerAddresses[token].push(router);
    // TODO check the address is a valid pool
    emit RouterAddressSet(token, router);
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
