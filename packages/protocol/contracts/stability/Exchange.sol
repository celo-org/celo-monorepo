pragma solidity ^0.5.3;

import "openzeppelin-solidity/contracts/math/SafeMath.sol";
import "openzeppelin-solidity/contracts/ownership/Ownable.sol";
import "./interfaces/IExchange.sol";
import "./interfaces/ISortedOracles.sol";
import "./interfaces/IReserve.sol";
import "./interfaces/IStableToken.sol";
import "../common/Initializable.sol";
import "../common/FixidityLib.sol";
import "../common/Freezable.sol";
import "../common/UsingRegistry.sol";
import "../common/libraries/ReentrancyGuard.sol";

/**
 * @title Contract that allows to exchange StableToken for GoldToken and vice versa
 * using a Constant Product Market Maker Model
 */
contract Exchange is IExchange, Initializable, Ownable, UsingRegistry, ReentrancyGuard, Freezable {
  using SafeMath for uint256;
  using FixidityLib for FixidityLib.Fraction;

  event Exchanged(address indexed exchanger, uint256 sellAmount, uint256 buyAmount, bool soldGold);
  event UpdateFrequencySet(uint256 updateFrequency);
  event MinimumReportsSet(uint256 minimumReports);
  event StableTokenSet(address indexed stable);
  event SpreadSet(uint256 spread);
  event ReserveFractionSet(uint256 reserveFraction);
  event BucketsUpdated(uint256 goldBucket, uint256 stableBucket);

  FixidityLib.Fraction public spread;

  // Fraction of the Reserve that is committed to the gold bucket when updating
  // buckets.
  FixidityLib.Fraction public reserveFraction;

  address public stable;

  // Size of the Uniswap gold bucket
  uint256 public goldBucket;
  // Size of the Uniswap stable token bucket
  uint256 public stableBucket;

  uint256 public lastBucketUpdate = 0;
  uint256 public updateFrequency;
  uint256 public minimumReports;

  modifier updateBucketsIfNecessary() {
    _updateBucketsIfNecessary();
    _;
  }

  /**
   * @notice Used in place of the constructor to allow the contract to be upgradable via proxy.
   * @param registryAddress The address of the registry core smart contract.
   * @param stableToken Address of the stable token
   * @param _spread Spread charged on exchanges
   * @param _reserveFraction Fraction to commit to the gold bucket
   * @param _updateFrequency The time period that needs to elapse between bucket
   * updates
   * @param _minimumReports The minimum number of fresh reports that need to be
   * present in the oracle to update buckets
   * commit to the gold bucket
   */
  function initialize(
    address registryAddress,
    address stableToken,
    uint256 _spread,
    uint256 _reserveFraction,
    uint256 _updateFrequency,
    uint256 _minimumReports
  ) external initializer {
    _transferOwnership(msg.sender);
    setRegistry(registryAddress);
    setStableToken(stableToken);
    setSpread(_spread);
    setReserveFraction(_reserveFraction);
    setUpdateFrequency(_updateFrequency);
    setMinimumReports(_minimumReports);
    _updateBucketsIfNecessary();
  }

  /**
   * @dev Exchanges sellAmount of sellToken in exchange for at least minBuyAmount of buyToken
   * Requires the sellAmount to have been approved to the exchange
   * @param sellAmount The amount of sellToken the user is selling to the exchange
   * @param minBuyAmount The minimum amount of buyToken the user has to receive for this
   * transaction to succeed
   * @param sellGold `true` if gold is the sell token
   * @return The amount of buyToken that was transfered
   * @dev This function can be frozen using the Freezable interface.
   */
  function exchange(uint256 sellAmount, uint256 minBuyAmount, bool sellGold)
    external
    onlyWhenNotFrozen
    updateBucketsIfNecessary
    nonReentrant
    returns (uint256)
  {
    uint256 buyAmount = _getBuyTokenAmount(sellAmount, sellGold);

    require(buyAmount >= minBuyAmount, "Calculated buyAmount was less than specified minBuyAmount");

    IReserve reserve = IReserve(registry.getAddressForOrDie(RESERVE_REGISTRY_ID));

    if (sellGold) {
      goldBucket = goldBucket.add(sellAmount);
      stableBucket = stableBucket.sub(buyAmount);
      require(
        getGoldToken().transferFrom(msg.sender, address(reserve), sellAmount),
        "Transfer of sell token failed"
      );
      require(IStableToken(stable).mint(msg.sender, buyAmount), "Mint of stable token failed");
    } else {
      stableBucket = stableBucket.add(sellAmount);
      goldBucket = goldBucket.sub(buyAmount);
      require(
        IERC20(stable).transferFrom(msg.sender, address(this), sellAmount),
        "Transfer of sell token failed"
      );
      IStableToken(stable).burn(sellAmount);

      require(reserve.transferExchangeGold(msg.sender, buyAmount), "Transfer of buyToken failed");
    }

    emit Exchanged(msg.sender, sellAmount, buyAmount, sellGold);
    return buyAmount;
  }

  /**
   * @dev Returns the amount of buyToken a user would get for sellAmount of sellToken
   * @param sellAmount The amount of sellToken the user is selling to the exchange
   * @param sellGold `true` if gold is the sell token
   * @return The corresponding buyToken amount.
   */
  function getBuyTokenAmount(uint256 sellAmount, bool sellGold) external view returns (uint256) {
    if (sellAmount == 0) return 0;
    uint256 sellTokenBucket;
    uint256 buyTokenBucket;
    (buyTokenBucket, sellTokenBucket) = getBuyAndSellBuckets(sellGold);

    FixidityLib.Fraction memory reducedSellAmount = getReducedSellAmount(sellAmount);
    FixidityLib.Fraction memory numerator = reducedSellAmount.multiply(
      FixidityLib.newFixed(buyTokenBucket)
    );
    FixidityLib.Fraction memory denominator = FixidityLib.newFixed(sellTokenBucket).add(
      reducedSellAmount
    );

    // Can't use FixidityLib.divide because denominator can easily be greater
    // than maxFixedDivisor.
    // Fortunately, we expect an integer result, so integer division gives us as
    // much precision as we could hope for.
    return numerator.unwrap().div(denominator.unwrap());
  }

  /**
   * @dev Returns the amount of sellToken a user would need to exchange to receive buyAmount of
   * buyToken.
   * @param buyAmount The amount of buyToken the user would like to purchase.
   * @param sellGold `true` if gold is the sell token
   * @return The corresponding sellToken amount.
   */
  function getSellTokenAmount(uint256 buyAmount, bool sellGold) external view returns (uint256) {
    if (buyAmount == 0) return 0;
    uint256 sellTokenBucket;
    uint256 buyTokenBucket;
    (buyTokenBucket, sellTokenBucket) = getBuyAndSellBuckets(sellGold);

    FixidityLib.Fraction memory numerator = FixidityLib.newFixed(buyAmount.mul(sellTokenBucket));
    FixidityLib.Fraction memory denominator = FixidityLib
      .newFixed(buyTokenBucket.sub(buyAmount))
      .multiply(FixidityLib.fixed1().subtract(spread));

    // See comment in getBuyTokenAmount
    return numerator.unwrap().div(denominator.unwrap());
  }

  /**
   * @notice Returns the buy token and sell token bucket sizes, in order. The ratio of
   * the two also represents the exchange rate between the two.
   * @param sellGold `true` if gold is the sell token
   * @return (buyTokenBucket, sellTokenBucket)
   */
  function getBuyAndSellBuckets(bool sellGold) public view returns (uint256, uint256) {
    uint256 currentGoldBucket = goldBucket;
    uint256 currentStableBucket = stableBucket;

    if (shouldUpdateBuckets()) {
      (currentGoldBucket, currentStableBucket) = getUpdatedBuckets();
    }

    if (sellGold) {
      return (currentStableBucket, currentGoldBucket);
    } else {
      return (currentGoldBucket, currentStableBucket);
    }
  }

  /**
    * @notice Allows owner to set the update frequency
    * @param newUpdateFrequency The new update frequency
    */
  function setUpdateFrequency(uint256 newUpdateFrequency) public onlyOwner {
    updateFrequency = newUpdateFrequency;
    emit UpdateFrequencySet(newUpdateFrequency);
  }

  /**
    * @notice Allows owner to set the minimum number of reports required
    * @param newMininumReports The new update minimum number of reports required
    */
  function setMinimumReports(uint256 newMininumReports) public onlyOwner {
    minimumReports = newMininumReports;
    emit MinimumReportsSet(newMininumReports);
  }

  /**
    * @notice Allows owner to set the Stable Token address
    * @param newStableToken The new address for Stable Token
    */
  function setStableToken(address newStableToken) public onlyOwner {
    stable = newStableToken;
    emit StableTokenSet(newStableToken);
  }

  /**
    * @notice Allows owner to set the spread
    * @param newSpread The new value for the spread
    */
  function setSpread(uint256 newSpread) public onlyOwner {
    spread = FixidityLib.wrap(newSpread);
    emit SpreadSet(newSpread);
  }

  /**
    * @notice Allows owner to set the Reserve Fraction
    * @param newReserveFraction The new value for the reserve fraction
    */
  function setReserveFraction(uint256 newReserveFraction) public onlyOwner {
    reserveFraction = FixidityLib.wrap(newReserveFraction);
    require(reserveFraction.lt(FixidityLib.fixed1()), "reserve fraction must be smaller than 1");
    emit ReserveFractionSet(newReserveFraction);
  }

  /**
   * @notice Returns the sell token and buy token bucket sizes, in order. The ratio of
   * the two also represents the exchange rate between the two.
   * @param sellGold `true` if gold is the sell token
   * @return (sellTokenBucket, buyTokenBucket)
   */
  function _getBuyAndSellBuckets(bool sellGold) private view returns (uint256, uint256) {
    if (sellGold) {
      return (stableBucket, goldBucket);
    } else {
      return (goldBucket, stableBucket);
    }
  }

  /**
   * @dev Returns the amount of buyToken a user would get for sellAmount of sellToken
   * @param sellAmount The amount of sellToken the user is selling to the exchange
   * @param sellGold `true` if gold is the sell token
   * @return The corresponding buyToken amount.
   */
  function _getBuyTokenAmount(uint256 sellAmount, bool sellGold) private view returns (uint256) {
    uint256 sellTokenBucket;
    uint256 buyTokenBucket;
    (buyTokenBucket, sellTokenBucket) = _getBuyAndSellBuckets(sellGold);

    FixidityLib.Fraction memory reducedSellAmount = getReducedSellAmount(sellAmount);
    FixidityLib.Fraction memory numerator = reducedSellAmount.multiply(
      FixidityLib.newFixed(buyTokenBucket)
    );
    FixidityLib.Fraction memory denominator = FixidityLib.newFixed(sellTokenBucket).add(
      reducedSellAmount
    );

    // See comment in getBuyTokenAmount
    return numerator.unwrap().div(denominator.unwrap());
  }

  function getUpdatedBuckets() private view returns (uint256, uint256) {
    uint256 updatedGoldBucket = getUpdatedGoldBucket();
    uint256 exchangeRateNumerator;
    uint256 exchangeRateDenominator;
    (exchangeRateNumerator, exchangeRateDenominator) = getOracleExchangeRate();
    uint256 updatedStableBucket = exchangeRateNumerator.mul(updatedGoldBucket).div(
      exchangeRateDenominator
    );
    return (updatedGoldBucket, updatedStableBucket);
  }

  function getUpdatedGoldBucket() private view returns (uint256) {
    uint256 reserveGoldBalance = getReserve().getUnfrozenReserveGoldBalance();
    return reserveFraction.multiply(FixidityLib.newFixed(reserveGoldBalance)).fromFixed();
  }

  /**
   * @notice If conditions are met, updates the Uniswap bucket sizes to track
   * the price reported by the Oracle.
   */
  function _updateBucketsIfNecessary() private {
    if (shouldUpdateBuckets()) {
      // solhint-disable-next-line not-rely-on-time
      lastBucketUpdate = now;

      (goldBucket, stableBucket) = getUpdatedBuckets();
      emit BucketsUpdated(goldBucket, stableBucket);
    }
  }

  /**
   * @dev Calculates the sell amount reduced by the spread.
   * @param sellAmount The original sell amount.
   * @return The reduced sell amount, computed as (1 - spread) * sellAmount
   */
  function getReducedSellAmount(uint256 sellAmount)
    private
    view
    returns (FixidityLib.Fraction memory)
  {
    return FixidityLib.fixed1().subtract(spread).multiply(FixidityLib.newFixed(sellAmount));
  }

  /*
   * Checks conditions required for bucket updates.
   * @return Whether or not buckets should be updated.
   */
  function shouldUpdateBuckets() private view returns (bool) {
    ISortedOracles sortedOracles = ISortedOracles(
      registry.getAddressForOrDie(SORTED_ORACLES_REGISTRY_ID)
    );
    (bool isReportExpired, ) = sortedOracles.isOldestReportExpired(stable);
    // solhint-disable-next-line not-rely-on-time
    bool timePassed = now >= lastBucketUpdate.add(updateFrequency);
    bool enoughReports = sortedOracles.numRates(stable) >= minimumReports;
    // solhint-disable-next-line not-rely-on-time
    bool medianReportRecent = sortedOracles.medianTimestamp(stable) > now.sub(updateFrequency);
    return timePassed && enoughReports && medianReportRecent && !isReportExpired;
  }

  function getOracleExchangeRate() private view returns (uint256, uint256) {
    uint256 rateNumerator;
    uint256 rateDenominator;
    (rateNumerator, rateDenominator) = ISortedOracles(
      registry.getAddressForOrDie(SORTED_ORACLES_REGISTRY_ID)
    )
      .medianRate(stable);
    require(rateDenominator > 0, "exchange rate denominator must be greater than 0");
    return (rateNumerator, rateDenominator);
  }
}
