pragma solidity ^0.5.3;

import "openzeppelin-solidity/contracts/utils/ReentrancyGuard.sol";
import "openzeppelin-solidity/contracts/math/SafeMath.sol";
import "openzeppelin-solidity/contracts/ownership/Ownable.sol";

import "./interfaces/IReserve.sol";
import "./interfaces/ISortedOracles.sol";
import "./interfaces/IStableToken.sol";

import "../common/Initializable.sol";
import "../common/UsingRegistry.sol";
import "../common/interfaces/IERC20Token.sol";


/**
 * @title Ensures price stability of StableTokens with respect to their pegs
 */
contract Reserve is IReserve, Ownable, Initializable, UsingRegistry, ReentrancyGuard {

  using SafeMath for uint256;

  struct TobinTaxCache {
    uint128 numerator;
    uint128 timestamp;
  }

  mapping(address => bool) public isToken;
  address[] private _tokens;
  TobinTaxCache public tobinTaxCache;
  uint256 public tobinTaxStalenessThreshold;
  uint256 public constant TOBIN_TAX_DENOMINATOR = 1000;
  mapping(address => bool) public isSpender;

  event TobinTaxStalenessThresholdSet(uint256 value);
  event TokenAdded(address token);
  event TokenRemoved(address token, uint256 index);
  event SpenderAdded(address spender);
  event SpenderRemoved(address spender);

  modifier isStableToken(address token) {
    require(isToken[token], "token addr was never registered");
    _;
  }

  function() external payable {} // solhint-disable no-empty-blocks

  function initialize(
    address registryAddress,
    uint256 _tobinTaxStalenessThreshold
  )
    external
    initializer
  {
    _transferOwnership(msg.sender);
    setRegistry(registryAddress);
    tobinTaxStalenessThreshold = _tobinTaxStalenessThreshold;
  }

  /**
   * @notice Sets the number of seconds to cache the tobin tax value for.
   * @param value The number of seconds to cache the tobin tax value for.
   */
  function setTobinTaxStalenessThreshold(uint256 value) external onlyOwner {
    require(value > 0, "value was zero");
    tobinTaxStalenessThreshold = value;
    emit TobinTaxStalenessThresholdSet(value);
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
  function removeToken(
    address token,
    uint256 index
  )
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
    address lastItem = _tokens[_tokens.length-1];
    _tokens[index] = lastItem;
    _tokens.length--;
    emit TokenRemoved(token, index);
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
  function transferGold(
    address to,
    uint256 value
  )
    external
    returns (bool)
  {
    require(isSpender[msg.sender], "sender not allowed to transfer Reserve funds");
    IERC20Token goldToken = IERC20Token(registry.getAddressForOrDie(GOLD_TOKEN_REGISTRY_ID));
    require(goldToken.transfer(to, value), "transfer of gold token failed");
    return true;
  }

  /**
   * @notice Returns the tobin tax, recomputing it if it's stale.
   * @return The tobin tax amount as a fraction.
   */
  function getOrComputeTobinTax() external nonReentrant returns (uint256, uint256) {
    // solhint-disable-next-line not-rely-on-time
    if (now.sub(tobinTaxCache.timestamp) > tobinTaxStalenessThreshold) {
      tobinTaxCache.numerator = uint128(computeTobinTax());
      tobinTaxCache.timestamp = uint128(now); // solhint-disable-line not-rely-on-time
    }
    return (uint256(tobinTaxCache.numerator), TOBIN_TAX_DENOMINATOR);
  }

  function getTokens() external view returns (address[] memory) {
    return _tokens;
  }

  /*
   * Internal functions
   */
  /**
   * @notice Computes a tobin tax based on the reserve ratio.
   * @return The numerator of the tobin tax amount, where the denominator is 1000.
   */
  function computeTobinTax() private view returns (uint256) {
    address sortedOraclesAddress = registry.getAddressForOrDie(SORTED_ORACLES_REGISTRY_ID);
    ISortedOracles sortedOracles = ISortedOracles(sortedOraclesAddress);
    uint256 reserveGoldBalance = address(this).balance;
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
      return 0;
    } else {
      return 5;
    }
  }

  /**
   * @notice Mint tokens.
   * @param to The address that will receive the minted tokens.
   * @param token The address of the token to mint.
   * @param value The amount of tokens to mint.
   */
  function mintToken(
    address to,
    address token,
    uint256 value
  )
    private
    isStableToken(token)
    returns (bool)
  {
    IStableToken stableToken = IStableToken(token);
    stableToken.mint(to, value);
    return true;
  }
}
