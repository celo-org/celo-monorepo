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

interface IUniswapV2Pair {
  event Approval(address indexed owner, address indexed spender, uint256 value);
  event Transfer(address indexed from, address indexed to, uint256 value);

  function name() external pure returns (string memory);
  function symbol() external pure returns (string memory);
  function decimals() external pure returns (uint8);
  function totalSupply() external view returns (uint256);
  function balanceOf(address owner) external view returns (uint256);
  function allowance(address owner, address spender) external view returns (uint256);

  function approve(address spender, uint256 value) external returns (bool);
  function transfer(address to, uint256 value) external returns (bool);
  function transferFrom(address from, address to, uint256 value) external returns (bool);

  function DOMAIN_SEPARATOR() external view returns (bytes32);
  function PERMIT_TYPEHASH() external pure returns (bytes32);
  function nonces(address owner) external view returns (uint256);

  function permit(
    address owner,
    address spender,
    uint256 value,
    uint256 deadline,
    uint8 v,
    bytes32 r,
    bytes32 s
  ) external;

  event Mint(address indexed sender, uint256 amount0, uint256 amount1);
  event Burn(address indexed sender, uint256 amount0, uint256 amount1, address indexed to);
  event Swap(
    address indexed sender,
    uint256 amount0In,
    uint256 amount1In,
    uint256 amount0Out,
    uint256 amount1Out,
    address indexed to
  );
  event Sync(uint112 reserve0, uint112 reserve1);

  function MINIMUM_LIQUIDITY() external pure returns (uint256);
  function factory() external view returns (address);
  function token0() external view returns (address);
  function token1() external view returns (address);
  function getReserves()
    external
    view
    returns (uint112 reserve0, uint112 reserve1, uint32 blockTimestampLast);
  function price0CumulativeLast() external view returns (uint256);
  function price1CumulativeLast() external view returns (uint256);
  function kLast() external view returns (uint256);

  function mint(address to) external returns (uint256 liquidity);
  function burn(address to) external returns (uint256 amount0, uint256 amount1);
  function swap(uint256 amount0Out, uint256 amount1Out, address to, bytes calldata data) external;
  function skim(address to) external;
  function sync() external;

  function initialize(address, address) external;
}

/**
 * @title TODO

 */
contract FeeBurner is Ownable, Initializable, UsingRegistryV2, ICeloVersionedContract {
  using SafeMath for uint256;
  using FixidityLib for FixidityLib.Fraction;

  uint256 public constant MIN_BURN = 200;
  mapping(address => uint256) public pastBurn;
  mapping(address => uint256) public dailyBurnLimit;
  mapping(address => uint256) public currentDayLimit;
  mapping(address => address[]) public poolAddresses; // TODO remove me
  mapping(address => address) public routers;
  uint256 public lastLimitDay;

  mapping(address => FixidityLib.Fraction) public maxSlippage;

  // event CeloBalance(uint256 celoBalance);
  event SoldAndBurnedToken(address token, uint256 value);
  event DailyLimitSet(address tokenAddress, uint256 newLimit);
  event DailyLimitHit(address token, uint256 burning);
  event MAxSlippageSet(address token, uint256 maxSlippage);

  event DailyLimitUpdatedDeleteMe(uint256 amount);
  event PoolSet(address token, address pool);
  event PoolRemoved(address token, address pool);

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

      // TODO calculate a max of slipagge

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
      // address tokenAddress = tokens[i];
      // address[] memory pollAddresses = poolAddresses[tokens[i]];
      // // TODO check all these addresses should be different than zero
      // IUniswapV2Pair router = IUniswapV2Router(pollAddresses[tokens]);
      // IERC20 token = IERC20(tokenAddress);
      // uint256 balanceToBurn = token.balanceOf(address(this));
      // address[] memory path = [tokenAddress, celoAddress];
      // uint256 wouldGet = router.getAmountsOut(balanceToBurn, path);
      // // TODO test this
      // TODO approve
      // tokens.swapExactTokensForTokens(balanceToBurn, 0, path, block.number + 10);
      // // TODO use more than one
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
    IERC20 token = IERC20(token);
    token.transfer(recipient, value);
  }

  function setExchange(address poolAddress, address token, address router) external onlyOwner {
    _setExchange(poolAddress, token, router);
  }

  function _setExchange(address token, address poolAddress, address router) private {
    poolAddresses[poolAddress].push(token);
    routers[token] = router;
    // TODO check the address is a valid pool
    emit PoolSet(token, poolAddress);
  }

  function removetExchange(address token, address poolAddress, uint256 index) external onlyOwner {
    // TODO test me
    require(poolAddresses[poolAddress][index] == poolAddress, "Index does not match");

    uint256 lenght = poolAddresses[poolAddress].length;
    poolAddresses[poolAddress][lenght - 1] = poolAddresses[poolAddress][index];
    poolAddresses[poolAddress].pop;
    emit PoolRemoved(token, poolAddress);
  }

  // TODO FUCTIONS HERE

}

// TODO onlyOwner transfer out

