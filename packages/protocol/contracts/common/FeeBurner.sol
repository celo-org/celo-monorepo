pragma solidity ^0.5.13;

import "openzeppelin-solidity/contracts/math/SafeMath.sol";
import "openzeppelin-solidity/contracts/ownership/Ownable.sol";
import "openzeppelin-solidity/contracts/token/ERC20/IERC20.sol";

import "./UsingRegistryV2.sol";

import "../common/interfaces/ICeloVersionedContract.sol";

import "../common/interfaces/ICeloToken.sol";
import "../common/Initializable.sol";

import "../stability/StableToken.sol";
import "../stability/interfaces/IExchange.sol";

// import "openzeppelin-solidity/contracts/token/ERC20/IERC20.sol";

// TODO maybe add an upperbound so that you can't trade more
// multisig that owns this and have a killswitch
// Non-Mento assets do it permisionless.
// TODO make it not fail for everything if one exchange is burst

interface IUniswapV2Router {
  function getAmountsOut(uint256 amountIn, address[] calldata path)
    external
    view
    returns (uint256[] memory amounts);

  function swapExactTokensForTokens(
    //amount of tokens we are sending in
    uint256 amountIn,
    //the minimum amount of tokens we want out of the trade
    uint256 amountOutMin,
    //list of token addresses we are going to trade in.  this is necessary to calculate amounts
    address[] calldata path,
    //this is the address we are going to send the output tokens to
    address to,
    //the last time that the trade is valid for
    uint256 deadline
  ) external returns (uint256[] memory amounts);
}

/**
 * @title TODO

 */
contract FeeBurner is Ownable, Initializable, UsingRegistryV2, ICeloVersionedContract {
  using SafeMath for uint256;

  uint256 public constant MIN_BURN = 200;
  mapping(address => uint256) public pastBurn;
  mapping(address => uint256) public dailyBurnLimit;
  mapping(address => uint256) public currentDayLimit;
  mapping(address => address[]) public poolAddresses;

  uint256 public lastLimitDay;

  // event CeloBalance(uint256 celoBalance);
  event SoldAndBurnedToken(address token, uint256 value);
  event DailyLimitSet(address tokenAddress, uint256 newLimit);
  event DailyLimitHit(address token, uint256 burning);

  event DailyLimitUpdatedDeleteMe(uint256 amount);

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
  }

  function getVersionNumber() external pure returns (uint256, uint256, uint256, uint256) {
    return (1, 0, 0, 0);
  }

  // TODO chose the best price from options

  function burnAllCelo() private {
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

  // this function is permionless
  function burnMentoAssets() private {
    // here we could also check that the tokens is whitelisted, but we assume everything that has already been sent here is
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
      // TODO calculate a max of slipagge

      stableToken.approve(exchangeAddress, balanceToBurn);
      exchange.sell(balanceToBurn, 0, false);
      pastBurn[tokenAddress] += balanceToBurn;

      updateLimits(tokenAddress, balanceToBurn);

      emit SoldAndBurnedToken(tokenAddress, balanceToBurn);

      // uint256 celoBalance = celo.balanceOf(address(this));
      // emit CeloBalance(celoBalance);
      // require(celoBalance > 0, "Celo Balance not bigger than zero"); // TODO remove me

    }

  }

  function burnNonMentoTokens() private {}

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

  function transfer(address poolAddress, address recipient, uint256 value) external onlyOwner {
    // meant for governance to trigger use cases not contemplated in this contract
    IERC20 token = IERC20(poolAddress);
    token.transfer(recipient, value);
  }

  function setExchange(address poolAddress, address token) external onlyOwner {
    _setExchange(poolAddress, token);
  }

  function _setExchange(address poolAddress, address token) private {}

  // TODO FUCTIONS HERE

}

// TODO onlyOwner transfer out

