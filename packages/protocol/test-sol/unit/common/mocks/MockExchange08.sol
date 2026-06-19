// SPDX-License-Identifier: LGPL-3.0-only
pragma solidity >=0.8.7 <0.8.20;

import "@celo-contracts/common/FixidityLib.sol";
import "@openzeppelin/contracts8/utils/math/SafeMath.sol";

interface IMockExchangeToken {
  function mint(address to, uint256 value) external returns (bool);
  function burn(uint256 value) external returns (bool);
  function transfer(address to, uint256 value) external returns (bool);
  function transferFrom(address from, address to, uint256 value) external returns (bool);
  function approve(address spender, uint256 value) external returns (bool);
  function balanceOf(address account) external view returns (uint256);
}

interface IMockExchangeReserve {
  function getUnfrozenReserveGoldBalance() external view returns (uint256);
  function transferExchangeGold(address to, uint256 value) external returns (bool);
}

interface IMockExchangeSortedOracles {
  function medianRate(address token) external view returns (uint256 numerator, uint256 denominator);
}

interface IMockExchangeRegistry {
  function getAddressForOrDie(bytes32 id) external view returns (address);
}

/**
 * @title A minimal 0.8 mock of the Mento Exchange for testing.
 * Implements the same CSAMM formula as the real Exchange.sol (from lib/mento-core)
 * so that exact CELO output amounts produced by the bonding curve are preserved.
 * The real Mento Exchange is a strict-0.5 contract that cannot be imported into,
 * nor deployed via deployCodeTo from, a 0.8 test, so this faithful reimplementation
 * stands in for it.
 */
contract MockExchange08 {
  using FixidityLib for FixidityLib.Fraction;
  using SafeMath for uint256;

  IMockExchangeRegistry public registry;

  FixidityLib.Fraction public spread;
  FixidityLib.Fraction public reserveFraction;

  uint256 public goldBucket;
  uint256 public stableBucket;

  address public stable;
  string public stableTokenRegistryId;

  uint256 public updateFrequency;
  uint256 public minimumReports;
  uint256 public lastBucketUpdate;

  bool private _initialized;
  address public owner;

  bytes32 private constant RESERVE_ID = keccak256(abi.encodePacked("Reserve"));
  bytes32 private constant SORTED_ORACLES_ID = keccak256(abi.encodePacked("SortedOracles"));
  bytes32 private constant GOLD_TOKEN_ID = keccak256(abi.encodePacked("GoldToken"));

  event Exchanged(address indexed exchanger, uint256 sellAmount, uint256 buyAmount, bool soldGold);

  constructor(bool) {}

  modifier onlyOwner() {
    require(msg.sender == owner, "Ownable: caller is not the owner");
    _;
  }

  function initialize(
    address registryAddress,
    string calldata _stableTokenRegistryId,
    uint256 _spread,
    uint256 _reserveFraction,
    uint256 _updateFrequency,
    uint256 _minimumReports
  ) external {
    require(!_initialized, "contract already initialized");
    _initialized = true;
    owner = msg.sender;
    registry = IMockExchangeRegistry(registryAddress);
    stableTokenRegistryId = _stableTokenRegistryId;
    spread = FixidityLib.wrap(_spread);
    reserveFraction = FixidityLib.wrap(_reserveFraction);
    updateFrequency = _updateFrequency;
    minimumReports = _minimumReports;
  }

  function activateStable() external onlyOwner {
    require(stable == address(0), "StableToken address already activated");
    stable = registry.getAddressForOrDie(keccak256(abi.encodePacked(stableTokenRegistryId)));
    _updateBuckets();
  }

  function sell(
    uint256 sellAmount,
    uint256 minBuyAmount,
    bool sellGold
  ) external returns (uint256) {
    (uint256 buyTokenBucket, uint256 sellTokenBucket) = _getBuyAndSellBuckets(sellGold);
    uint256 buyAmount = _getBuyTokenAmount(buyTokenBucket, sellTokenBucket, sellAmount);
    require(buyAmount >= minBuyAmount, "Insufficient buy amount");
    _exchange(sellAmount, buyAmount, sellGold);
    emit Exchanged(msg.sender, sellAmount, buyAmount, sellGold);
    return buyAmount;
  }

  function getBuyTokenAmount(uint256 sellAmount, bool sellGold) external view returns (uint256) {
    (uint256 buyTokenBucket, uint256 sellTokenBucket) = _getBuyAndSellBuckets(sellGold);
    return _getBuyTokenAmount(buyTokenBucket, sellTokenBucket, sellAmount);
  }

  function getBuyAndSellBuckets(bool sellGold) external view returns (uint256, uint256) {
    return _getBuyAndSellBuckets(sellGold);
  }

  function _getBuyAndSellBuckets(bool sellGold) private view returns (uint256, uint256) {
    if (sellGold) {
      return (stableBucket, goldBucket);
    } else {
      return (goldBucket, stableBucket);
    }
  }

  function _getBuyTokenAmount(
    uint256 buyTokenBucket,
    uint256 sellTokenBucket,
    uint256 sellAmount
  ) private view returns (uint256) {
    if (sellAmount == 0) return 0;
    FixidityLib.Fraction memory reducedSellAmount = _getReducedSellAmount(sellAmount);
    FixidityLib.Fraction memory numerator = reducedSellAmount.multiply(
      FixidityLib.newFixed(buyTokenBucket)
    );
    FixidityLib.Fraction memory denominator = FixidityLib.newFixed(sellTokenBucket).add(
      reducedSellAmount
    );
    // Integer division mirrors the original Exchange.sol implementation.
    return numerator.unwrap().div(denominator.unwrap());
  }

  function _getReducedSellAmount(
    uint256 sellAmount
  ) private view returns (FixidityLib.Fraction memory) {
    return FixidityLib.fixed1().subtract(spread).multiply(FixidityLib.newFixed(sellAmount));
  }

  function _exchange(uint256 sellAmount, uint256 buyAmount, bool sellGold) private {
    IMockExchangeToken stableToken = IMockExchangeToken(stable);
    IMockExchangeReserve reserve = IMockExchangeReserve(registry.getAddressForOrDie(RESERVE_ID));

    if (sellGold) {
      goldBucket = goldBucket.add(sellAmount);
      stableBucket = stableBucket.sub(buyAmount);
      // Pull CELO (gold) from caller into reserve
      IMockExchangeToken goldToken = IMockExchangeToken(registry.getAddressForOrDie(GOLD_TOKEN_ID));
      require(
        goldToken.transferFrom(msg.sender, address(reserve), sellAmount),
        "Transfer of sell token failed"
      );
      // Mint stable to caller
      require(stableToken.mint(msg.sender, buyAmount), "Mint of stable token failed");
    } else {
      stableBucket = stableBucket.add(sellAmount);
      goldBucket = goldBucket.sub(buyAmount);
      // Pull stable from caller; burn it
      require(
        stableToken.transferFrom(msg.sender, address(this), sellAmount),
        "Transfer of sell token failed"
      );
      stableToken.burn(sellAmount);
      // Pay out CELO from reserve
      require(reserve.transferExchangeGold(msg.sender, buyAmount), "Transfer of buyToken failed");
    }
  }

  function _updateBuckets() private {
    (uint256 newGoldBucket, uint256 newStableBucket) = _getUpdatedBuckets();
    goldBucket = newGoldBucket;
    stableBucket = newStableBucket;
    lastBucketUpdate = block.timestamp;
  }

  function _getUpdatedBuckets() private view returns (uint256, uint256) {
    uint256 updatedGoldBucket = _getUpdatedGoldBucket();
    (uint256 rateNumerator, uint256 rateDenominator) = _getOracleExchangeRate();
    uint256 updatedStableBucket = rateNumerator.mul(updatedGoldBucket).div(rateDenominator);
    return (updatedGoldBucket, updatedStableBucket);
  }

  function _getUpdatedGoldBucket() private view returns (uint256) {
    IMockExchangeReserve reserve = IMockExchangeReserve(registry.getAddressForOrDie(RESERVE_ID));
    uint256 reserveGoldBalance = reserve.getUnfrozenReserveGoldBalance();
    return reserveFraction.multiply(FixidityLib.newFixed(reserveGoldBalance)).fromFixed();
  }

  function _getOracleExchangeRate() private view returns (uint256, uint256) {
    IMockExchangeSortedOracles sortedOracles = IMockExchangeSortedOracles(
      registry.getAddressForOrDie(SORTED_ORACLES_ID)
    );
    (uint256 numerator, uint256 denominator) = sortedOracles.medianRate(stable);
    return (numerator, denominator);
  }
}
