pragma solidity ^0.5.3;

import "openzeppelin-solidity/contracts/utils/ReentrancyGuard.sol";
import "openzeppelin-solidity/contracts/math/SafeMath.sol";
import "openzeppelin-solidity/contracts/ownership/Ownable.sol";

import "./interfaces/IReserve.sol";
import "./interfaces/ISortedOracles.sol";
import "./interfaces/IStableToken.sol";

import "../common/FixidityLib.sol";
import "../common/Initializable.sol";
import "../common/UsingRegistry.sol";

/**
 * @title Ensures price stability of StableTokens with respect to their pegs
 */
contract Reserve is IReserve, Ownable, Initializable, UsingRegistry, ReentrancyGuard {
  using SafeMath for uint256;
  using FixidityLib for FixidityLib.Fraction;

  struct TobinTaxCache {
    uint128 numerator;
    uint128 timestamp;
  }

  mapping(address => bool) public isToken;
  address[] private _tokens;
  TobinTaxCache public tobinTaxCache;
  uint256 public tobinTaxStalenessThreshold;
  uint256 public constant TOBIN_TAX_NUMERATOR = 5000000000000000000000; // 0.005
  mapping(address => bool) public isSpender;

  mapping(address => bool) public isOtherReserveAddress;
  address[] public otherReserveAddresses;

  bytes32[] public assetAllocationSymbols;
  uint256[] public assetAllocationWeights;

  uint256 public lastSpendingDay;
  uint256 public spendingLimit;
  FixidityLib.Fraction private spendingRatio;

  event TobinTaxStalenessThresholdSet(uint256 value);
  event DailySpendingRatioSet(uint256 ratio);
  event TokenAdded(address token);
  event TokenRemoved(address token, uint256 index);
  event SpenderAdded(address spender);
  event SpenderRemoved(address spender);
  event OtherReserveAddressAdded(address otherReserveAddress);
  event OtherReserveAddressRemoved(address otherReserveAddress, uint256 index);
  event AssetAllocationSet(bytes32[] symbols, uint256[] weights);

  modifier isStableToken(address token) {
    require(isToken[token], "token addr was never registered");
    _;
  }

  function() external payable {} // solhint-disable no-empty-blocks

  /**
   * @notice Initializes critical variables.
   * @param registryAddress The address of the registry contract.
   * @param _tobinTaxStalenessThreshold The initial number of seconds to cache tobin tax value for.
   */
  function initialize(
    address registryAddress,
    uint256 _tobinTaxStalenessThreshold,
    uint256 _spendingRatio
  ) external initializer {
    _transferOwnership(msg.sender);
    setRegistry(registryAddress);
    setTobinTaxStalenessThreshold(_tobinTaxStalenessThreshold);
    setDailySpendingRatio(_spendingRatio);
  }

  /**
   * @notice Sets the number of seconds to cache the tobin tax value for.
   * @param value The number of seconds to cache the tobin tax value for.
   */
  function setTobinTaxStalenessThreshold(uint256 value) public onlyOwner {
    require(value > 0, "value was zero");
    tobinTaxStalenessThreshold = value;
    emit TobinTaxStalenessThresholdSet(value);
  }

  /**
   * @notice Set the ratio of reserve that is spendable per day.
   * @param ratio Spending ratio as unwrapped Fraction.
   */
  function setDailySpendingRatio(uint256 ratio) public onlyOwner {
    spendingRatio = FixidityLib.wrap(ratio);
    require(spendingRatio.lte(FixidityLib.fixed1()), "spending ratio cannot be larger than 1");
    emit DailySpendingRatioSet(ratio);
  }

  /**
   * @notice Get daily spending ratio.
   * @return Spending ratio as unwrapped Fraction.
   */
  function getDailySpendingRatio() public view onlyOwner returns (uint256) {
    return spendingRatio.unwrap();
  }

  /**
   * @notice Sets target allocations for Celo Gold and a diversified basket of non-Celo assets.
   * @param symbols The symbol of each asset in the Reserve portfolio.
   * @param weights The weight for the corresponding asset as unwrapped Fixidity.Fraction.
   */
  function setAssetAllocations(bytes32[] calldata symbols, uint256[] calldata weights)
    external
    onlyOwner
  {
    require(symbols.length == weights.length, "Array length mismatch");
    FixidityLib.Fraction memory sum = FixidityLib.wrap(0);
    for (uint256 i = 0; i < weights.length; i++) {
      sum = sum.add(FixidityLib.wrap(weights[i]));
    }
    require(sum.equals(FixidityLib.fixed1()), "Sum of asset allocation must be 1");
    assetAllocationSymbols = symbols;
    assetAllocationWeights = weights;
    emit AssetAllocationSet(symbols, weights);
  }

  /**
   * @notice Add a token that the reserve will stablize.
   * @param token The address of the token being stabilized.
   */
  function addToken(address token) external onlyOwner nonReentrant returns (bool) {
    require(!isToken[token], "token addr already registered");
    // Require an exchange rate between the new token and Gold exists.
    address sortedOraclesAddress = registry.getAddressForOrDie(SORTED_ORACLES_REGISTRY_ID);
    ISortedOracles sortedOracles = ISortedOracles(sortedOraclesAddress);
    uint256 tokenAmount;
    uint256 goldAmount;
    (tokenAmount, goldAmount) = sortedOracles.medianRate(token);
    require(goldAmount > 0, "median rate returned 0 gold");
    isToken[token] = true;
    _tokens.push(token);
    emit TokenAdded(token);
    return true;
  }

  /**
   * @notice Remove a token that the reserve will no longer stabilize.
   * @param token The address of the token no longer being stabilized.
   * @param index The index of the token in _tokens.
   */
  function removeToken(address token, uint256 index)
    external
    onlyOwner
    isStableToken(token)
    returns (bool)
  {
    require(
      index < _tokens.length && _tokens[index] == token,
      "index into tokens list not mapped to token"
    );
    isToken[token] = false;
    address lastItem = _tokens[_tokens.length - 1];
    _tokens[index] = lastItem;
    _tokens.length--;
    emit TokenRemoved(token, index);
    return true;
  }

  /**
   * @notice Add a reserve address whose balance shall be included in the reserve ratio.
   * @param reserveAddress The reserve address to add.
   */
  function addOtherReserveAddress(address reserveAddress)
    external
    onlyOwner
    nonReentrant
    returns (bool)
  {
    require(!isOtherReserveAddress[reserveAddress], "reserve addr already added");
    isOtherReserveAddress[reserveAddress] = true;
    otherReserveAddresses.push(reserveAddress);
    emit OtherReserveAddressAdded(reserveAddress);
    return true;
  }

  /**
   * @notice Remove reserve address whose balance shall no longer be included in the reserve ratio.
   * @param reserveAddress The reserve address to remove.
   * @param index The index of the reserve address in otherReserveAddresses.
   */
  function removeOtherReserveAddress(address reserveAddress, uint256 index)
    external
    onlyOwner
    returns (bool)
  {
    require(isOtherReserveAddress[reserveAddress], "reserve addr was never added");
    require(
      index < otherReserveAddresses.length && otherReserveAddresses[index] == reserveAddress,
      "index into reserve list not mapped to address"
    );
    isOtherReserveAddress[reserveAddress] = false;
    address lastItem = otherReserveAddresses[otherReserveAddresses.length - 1];
    otherReserveAddresses[index] = lastItem;
    otherReserveAddresses.length--;
    emit OtherReserveAddressRemoved(reserveAddress, index);
    return true;
  }

  /**
   * @notice Gives an address permission to spend Reserve funds.
   * @param spender The address that is allowed to spend Reserve funds.
   */
  function addSpender(address spender) external onlyOwner {
    isSpender[spender] = true;
    emit SpenderAdded(spender);
  }

  /**
   * @notice Takes away an address's permission to spend Reserve funds.
   * @param spender The address that is to be no longer allowed to spend Reserve funds.
   */
  function removeSpender(address spender) external onlyOwner {
    isSpender[spender] = false;
    emit SpenderRemoved(spender);
  }

  /**
   * @notice Transfer gold.
   * @param to The address that will receive the gold.
   * @param value The amount of gold to transfer.
   */
  function transferGold(address to, uint256 value) external returns (bool) {
    require(isSpender[msg.sender], "sender not allowed to transfer Reserve funds");
    uint256 currentDay = now / 1 days;
    if (currentDay > lastSpendingDay) {
      uint256 balance = getReserveGoldBalance();
      lastSpendingDay = currentDay;
      spendingLimit = spendingRatio.multiply(FixidityLib.newFixed(balance)).fromFixed();
    }
    require(spendingLimit >= value, "Exceeding spending limit");
    spendingLimit = spendingLimit.sub(value);
    require(getGoldToken().transfer(to, value), "transfer of gold token failed");
    return true;
  }

  /**
   * @notice Returns the tobin tax, recomputing it if it's stale.
   * @return The tobin tax amount as a fraction.
   */
  function getOrComputeTobinTax() external nonReentrant returns (uint256, uint256) {
    // solhint-disable-next-line not-rely-on-time
    if (now.sub(tobinTaxCache.timestamp) > tobinTaxStalenessThreshold) {
      tobinTaxCache.numerator = uint128(computeTobinTax().unwrap());
      tobinTaxCache.timestamp = uint128(now); // solhint-disable-line not-rely-on-time
    }
    return (uint256(tobinTaxCache.numerator), FixidityLib.fixed1().unwrap());
  }

  function getTokens() external view returns (address[] memory) {
    return _tokens;
  }

  function getOtherReserveAddresses() external view returns (address[] memory) {
    return otherReserveAddresses;
  }

  function getAssetAllocationSymbols() external view returns (bytes32[] memory) {
    return assetAllocationSymbols;
  }

  function getAssetAllocationWeights() external view returns (uint256[] memory) {
    return assetAllocationWeights;
  }

  function getReserveGoldBalance() public view returns (uint256) {
    uint256 reserveGoldBalance = address(this).balance;
    for (uint256 i = 0; i < otherReserveAddresses.length; i++) {
      reserveGoldBalance = reserveGoldBalance.add(otherReserveAddresses[i].balance);
    }
    return reserveGoldBalance;
  }

  /*
   * Internal functions
   */
  /**
   * @notice Computes a tobin tax based on the reserve ratio.
   * @return The numerator of the tobin tax amount, where the denominator is 1000.
   */
  function computeTobinTax() private view returns (FixidityLib.Fraction memory) {
    address sortedOraclesAddress = registry.getAddressForOrDie(SORTED_ORACLES_REGISTRY_ID);
    ISortedOracles sortedOracles = ISortedOracles(sortedOraclesAddress);
    uint256 reserveGoldBalance = getReserveGoldBalance();
    uint256 stableTokensValueInGold = 0;

    for (uint256 i = 0; i < _tokens.length; i++) {
      uint256 stableAmount;
      uint256 goldAmount;
      (stableAmount, goldAmount) = sortedOracles.medianRate(_tokens[i]);
      uint256 stableTokenSupply = IERC20Token(_tokens[i]).totalSupply();
      uint256 aStableTokenValueInGold = stableTokenSupply.mul(goldAmount).div(stableAmount);
      stableTokensValueInGold = stableTokensValueInGold.add(aStableTokenValueInGold);
    }

    // The protocol calls for a 0.5% transfer tax on Celo Gold when the reserve ratio < 2.
    // The protocol aims to keep half of the reserve value in gold, thus the reserve ratio
    // is two when the value of gold in the reserve is equal to the total supply of stable tokens.
    if (reserveGoldBalance >= stableTokensValueInGold) {
      return FixidityLib.wrap(0);
    } else {
      return FixidityLib.wrap(TOBIN_TAX_NUMERATOR);
    }
  }

  /**
   * @notice Mint tokens.
   * @param to The address that will receive the minted tokens.
   * @param token The address of the token to mint.
   * @param value The amount of tokens to mint.
   */
  function mintToken(address to, address token, uint256 value)
    private
    isStableToken(token)
    returns (bool)
  {
    IStableToken stableToken = IStableToken(token);
    stableToken.mint(to, value);
    return true;
  }
}
