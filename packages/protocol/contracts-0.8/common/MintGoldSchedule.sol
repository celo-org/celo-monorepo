// SPDX-License-Identifier: UNLICENSED
pragma solidity >=0.8.7 <0.8.20;

import "@openzeppelin/contracts8/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts8/utils/math/Math.sol";

import "./UsingRegistry.sol";
import "../common/IsL2Check.sol";

import "../../contracts/common/FixidityLib.sol";
import "../../contracts/common/Initializable.sol";
import "../../contracts-0.8/common/interfaces/IGoldToken.sol";

/**
 * @title Contract for minting new CELO token based on a schedule.
 */
contract MintGoldSchedule is UsingRegistry, ReentrancyGuard, Initializable, IsL2Check {
  using FixidityLib for FixidityLib.Fraction;

  uint256 constant GENESIS_GOLD_SUPPLY = 600000000 ether; // 600 million Gold
  uint256 constant GOLD_SUPPLY_CAP = 1000000000 ether; // 1 billion Gold
  uint256 constant YEARS_LINEAR = 15;
  uint256 constant SECONDS_LINEAR = YEARS_LINEAR * 365 * 1 days;

  bool public areDependenciesSet;
  uint256 constant GENESIS_START_TIME = 1587587214; // Copied over from `EpochRewards().startTime()`.
  uint256 public l2StartTime;
  uint256 public totalSupplyAtL2Start;

  uint256 public totalMintedBySchedule;
  address public communityRewardFund;
  address public carbonOffsettingPartner;

  FixidityLib.Fraction private communityRewardFraction;
  FixidityLib.Fraction private carbonOffsettingFraction;

  event CommunityRewardFractionSet(uint256 fraction);
  event CarbonOffsettingFundSet(address indexed partner, uint256 fraction);

  modifier whenActivated() {
    require(areDependenciesSet, "Minting schedule has not been activated.");
    _;
  }

  /**
   * @notice Sets initialized == true on implementation contracts
   * @param test Set to true to skip implementation initialization
   */
  constructor(bool test) public Initializable(test) {}

  /**
   * @notice A constructor for initialising a new instance of a MintGoldSchedule contract.
   */
  function initialize() external initializer {
    _transferOwnership(msg.sender);
  }

  /**
   * @notice Sets the minting schedule dependencies during L2 transition.
   * @param _l2StartTime The timestamp of L1 to L2 transition.
   * @param _communityRewardFraction The percentage of rewards that go the community funds.
   * @param _carbonOffsettingPartner The address of the carbon offsetting partner.
   * @param _carbonOffsettingFraction The percentage of rewards going to carbon offsetting partner.
   * @param registryAddress Address of the deployed contracts registry.
   */
  function activate(
    uint256 _l2StartTime,
    uint256 _communityRewardFraction,
    address _carbonOffsettingPartner,
    uint256 _carbonOffsettingFraction,
    address registryAddress
  ) external onlyOwner onlyL2 {
    require(!areDependenciesSet, "Contract has already been activated.");
    require(registryAddress != address(0), "The registry address cannot be the zero address");
    require(block.timestamp > _l2StartTime, "L2 start time cannot be set to a future date.");
    areDependenciesSet = true;
    l2StartTime = _l2StartTime;
    setRegistry(registryAddress);
    communityRewardFund = address(getGovernance());
    totalSupplyAtL2Start = getGoldToken().totalSupply();
    setCommunityRewardFraction(_communityRewardFraction);
    setCarbonOffsettingFund(_carbonOffsettingPartner, _carbonOffsettingFraction);
  }

  /**
   * @notice Mints CELO to the community and carbon offsetting funds according to the predefined schedule.
   */
  function mintAccordingToSchedule() external nonReentrant onlyL2 returns (bool) {
    (
      uint256 targetGoldTotalSupply,
      uint256 communityRewardFundMintAmount,
      uint256 carbonOffsettingPartnerMintAmount
    ) = getTargetGoldTotalSupply();

    uint256 mintableAmount = Math.min(
      getRemainingBalanceToMint(),
      targetGoldTotalSupply - getGoldToken().totalSupply()
    );

    require(mintableAmount > 0, "Mintable amount must be greater than zero");
    totalMintedBySchedule += mintableAmount;

    IGoldToken goldToken = IGoldToken(address(getGoldToken()));
    require(
      goldToken.mint(communityRewardFund, communityRewardFundMintAmount),
      "Failed to mint to community partner."
    );

    require(
      goldToken.mint(carbonOffsettingPartner, carbonOffsettingPartnerMintAmount),
      "Failed to mint to carbon offsetting partner."
    );
    return true;
  }

  /**
   * @notice Returns the community reward fraction.
   * @return The percentage of total reward which goes to the community funds.
   */
  function getCommunityRewardFraction() external view returns (uint256) {
    return communityRewardFraction.unwrap();
  }

  /**
   * @notice Returns the carbon offsetting partner reward fraction.
   * @return The percentage of total reward which goes to the carbon offsetting partner.
   */
  function getCarbonOffsettingFraction() external view returns (uint256) {
    return carbonOffsettingFraction.unwrap();
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
   * @notice Sets the community reward percentage
   * @param value The percentage of the total reward to be sent to the community funds as Fixidity fraction.
   * @return True upon success.
   */
  function setCommunityRewardFraction(uint256 value) public onlyOwner whenActivated returns (bool) {
    uint256 timeSinceL2Start = block.timestamp - l2StartTime;
    uint256 totalL2LinearSecondsAvailable = SECONDS_LINEAR - (l2StartTime - GENESIS_START_TIME);
    FixidityLib.Fraction memory wrappedValue = FixidityLib.wrap(value);
    require(
      timeSinceL2Start < totalL2LinearSecondsAvailable,
      "Can only update fraction once block reward calculation for years 15-30 has been implemented."
    );
    require(
      !wrappedValue.equals(communityRewardFraction) && wrappedValue.lt(FixidityLib.fixed1()),
      "Value must be different from existing community reward fraction and less than 1."
    );
    communityRewardFraction = wrappedValue;
    require(
      FixidityLib.fixed1().gte(communityRewardFraction.add(carbonOffsettingFraction)),
      "Sum of partner fractions must be less than or equal to 1."
    );
    emit CommunityRewardFractionSet(value);
    return true;
  }

  /**
   * @notice Sets the carbon offsetting fund.
   * @param partner The address of the carbon offsetting partner.
   * @param value The percentage of the total reward to be sent to the carbon offsetting partner as Fixidity fraction.
   * @return True upon success.
   */
  function setCarbonOffsettingFund(
    address partner,
    uint256 value
  ) public onlyOwner whenActivated returns (bool) {
    require(partner != address(0), "Partner cannot be the zero address.");
    uint256 timeSinceL2Start = block.timestamp - l2StartTime;
    uint256 totalL2LinearSecondsAvailable = SECONDS_LINEAR - (l2StartTime - GENESIS_START_TIME);
    require(
      timeSinceL2Start < totalL2LinearSecondsAvailable,
      "Can only update fraction once block reward calculation for years 15-30 has been implemented."
    );
    FixidityLib.Fraction memory wrappedValue = FixidityLib.wrap(value);
    require(
      partner != carbonOffsettingPartner || !wrappedValue.equals(carbonOffsettingFraction),
      "Partner and value must be different from existing carbon offsetting fund."
    );
    require(wrappedValue.lt(FixidityLib.fixed1()), "Value must be less than 1.");
    carbonOffsettingPartner = partner;
    carbonOffsettingFraction = wrappedValue;
    require(
      FixidityLib.fixed1().gte(communityRewardFraction.add(carbonOffsettingFraction)),
      "Sum of partner fractions must be less than or equal to 1."
    );
    emit CarbonOffsettingFundSet(partner, value);
    return true;
  }

  /**
   * @notice Calculates remaining CELO balance to mint.
   * @return The remaining CELO balance to mint.
   */
  function getRemainingBalanceToMint() public view returns (uint256) {
    return GOLD_SUPPLY_CAP - getGoldToken().totalSupply();
  }

  /**
   * @return The total balance minted by the MintGoldSchedule contract.
   */
  function getTotalMintedBySchedule() public view returns (uint256) {
    return totalMintedBySchedule;
  }

  /**
   * @return The currently mintable amount.
   */
  function getMintableAmount() public view returns (uint256) {
    (uint256 targetGoldTotalSupply, , ) = getTargetGoldTotalSupply();
    return targetGoldTotalSupply - getGoldToken().totalSupply();
  }

  /**
   * @notice Returns the target CELO supply according to the target schedule.
   * @return targetGoldTotalSupply The target total CELO supply according to the target schedule.
   * @return communityTargetRewards The community reward that can be minted according to the target schedule.
   * @return carbonFundTargetRewards The carbon offsetting reward that can be minted according to the target schedule.
   */
  function getTargetGoldTotalSupply()
    public
    view
    whenActivated
    returns (
      uint256 targetGoldTotalSupply,
      uint256 communityTargetRewards,
      uint256 carbonFundTargetRewards
    )
  {
    require(block.timestamp > GENESIS_START_TIME, "GENESIS_START_TIME has not yet been reached.");
    require(block.timestamp > l2StartTime, "l2StartTime has not yet been reached.");

    uint256 timeSinceL2Start = block.timestamp - l2StartTime;
    uint256 totalL2LinearSecondsAvailable = SECONDS_LINEAR - (l2StartTime - GENESIS_START_TIME);
    uint256 mintedOnL1 = totalSupplyAtL2Start - GENESIS_GOLD_SUPPLY;

    bool isLinearDistribution = timeSinceL2Start < totalL2LinearSecondsAvailable;
    if (isLinearDistribution) {
      (
        targetGoldTotalSupply,
        communityTargetRewards,
        carbonFundTargetRewards
      ) = _calculateTargetReward(timeSinceL2Start, totalL2LinearSecondsAvailable, mintedOnL1);

      return (targetGoldTotalSupply, communityTargetRewards, carbonFundTargetRewards);
    } else {
      (
        targetGoldTotalSupply,
        communityTargetRewards,
        carbonFundTargetRewards
      ) = _calculateTargetReward(
        totalL2LinearSecondsAvailable - 1,
        totalL2LinearSecondsAvailable,
        mintedOnL1
      );

      bool hasNotYetMintedAllLinearRewards = totalMintedBySchedule +
        GENESIS_GOLD_SUPPLY +
        mintedOnL1 <
        targetGoldTotalSupply;

      if (hasNotYetMintedAllLinearRewards) {
        return (targetGoldTotalSupply, communityTargetRewards, carbonFundTargetRewards);
      }
      revert("Block reward calculation for years 15-30 unimplemented");
      return (0, 0, 0);
    }
  }

  function _calculateTargetReward(
    uint256 elapsedTime,
    uint256 _totalL2LinearSecondsAvailable,
    uint256 _mintedOnL1
  )
    internal
    view
    returns (
      uint256 targetGoldTotalSupply,
      uint256 communityTargetRewards,
      uint256 carbonFundTargetRewards
    )
  {
    FixidityLib.Fraction memory elapsedTimeFraction = FixidityLib.wrap(elapsedTime);
    FixidityLib.Fraction memory totalL2LinearSecondsAvailableFraction = FixidityLib.wrap(
      _totalL2LinearSecondsAvailable
    );
    // Pay out half of all block rewards linearly.
    uint256 totalLinearRewards = (GOLD_SUPPLY_CAP - GENESIS_GOLD_SUPPLY) / 2; //(200 million) includes validator rewards.

    FixidityLib.Fraction memory l2LinearRewards = FixidityLib.newFixed(
      totalLinearRewards - _mintedOnL1
    );

    FixidityLib.Fraction memory linearRewardsToCommunity = l2LinearRewards.multiply(
      communityRewardFraction
    );

    FixidityLib.Fraction memory linearRewardsToCarbon = l2LinearRewards.multiply(
      carbonOffsettingFraction
    );

    communityTargetRewards = (
      linearRewardsToCommunity.multiply(elapsedTimeFraction).divide(
        totalL2LinearSecondsAvailableFraction
      )
    ).fromFixed();

    carbonFundTargetRewards = linearRewardsToCarbon
      .multiply(elapsedTimeFraction)
      .divide(totalL2LinearSecondsAvailableFraction)
      .fromFixed();

    targetGoldTotalSupply =
      communityTargetRewards +
      carbonFundTargetRewards +
      GENESIS_GOLD_SUPPLY +
      _mintedOnL1;
  }
}
