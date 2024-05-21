// SPDX-License-Identifier: UNLICENSED
pragma solidity >=0.8.7 <0.8.20;

import "@openzeppelin/contracts8/security/ReentrancyGuard.sol";

import "./UsingRegistry.sol";
import "../common/IsL2Check.sol";

import "../../contracts/common/FixidityLib.sol";
import "../../contracts/common/Initializable.sol";
import "../../contracts/common/interfaces/IGoldToken.sol";

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
  uint256 constant genesisStartTime = 1587587214; // Copied over from `EpochRewards().startTime()`.
  uint256 public l2StartTime;
  uint256 public totalSupplyAtL2Start;

  uint256 public totalMintedBySchedule;
  address public communityRewardFund;
  address public carbonOffsettingPartner;

  FixidityLib.Fraction private communityRewardFraction;
  FixidityLib.Fraction private carbonOffsettingFraction;

  event CommunityRewardFractionSet(uint256 fraction);
  event CarbonOffsettingFundSet(address indexed partner, uint256 fraction);

  modifier whenDependenciesSet() {
    require(areDependenciesSet, "Minting schedule has not been configured.");
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
  function setDependecies(
    uint256 _l2StartTime,
    uint256 _communityRewardFraction,
    address _carbonOffsettingPartner,
    uint256 _carbonOffsettingFraction,
    address registryAddress
  ) external onlyOwner onlyL2 {
    require(!areDependenciesSet, "Dependencies have already been set.");
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

    uint256 mintableAmount = targetGoldTotalSupply - getGoldToken().totalSupply();

    require(mintableAmount > 0, "Mintable amount must be greater than zero");
    require(
      getRemainingBalanceToMint() >= mintableAmount,
      "Insufficient unlocked balance to mint amount"
    );
    totalMintedBySchedule = totalMintedBySchedule + (mintableAmount);

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
   * @param value The percentage of the total reward to be sent to the community funds.
   * @return True upon success.
   */
  function setCommunityRewardFraction(
    uint256 value
  ) public onlyOwner whenDependenciesSet returns (bool) {
    uint256 timeSinceL2 = block.timestamp - l2StartTime;
    uint256 linearSecondsLeft = SECONDS_LINEAR - (l2StartTime - genesisStartTime);

    require(
      timeSinceL2 < linearSecondsLeft,
      "Can only update fraction once block reward calculation for years 15-30 has been implemented."
    );
    require(
      value != communityRewardFraction.unwrap() && value < FixidityLib.fixed1().unwrap(),
      "Value must be different from existing community reward fraction and less than 1."
    );
    communityRewardFraction = FixidityLib.wrap(value);
    require(
      FixidityLib.newFixed(1).gte(communityRewardFraction.add(carbonOffsettingFraction)),
      "Sum of partner fractions must be less than or equal to 1."
    );
    emit CommunityRewardFractionSet(value);
    return true;
  }

  /**
   * @notice Sets the carbon offsetting fund.
   * @param partner The address of the carbon offsetting partner.
   * @param value The percentage of the total reward to be sent to the carbon offsetting partner.
   * @return True upon success.
   */
  function setCarbonOffsettingFund(
    address partner,
    uint256 value
  ) public onlyOwner whenDependenciesSet returns (bool) {
    uint256 timeSinceL2 = block.timestamp - l2StartTime;
    uint256 linearSecondsLeft = SECONDS_LINEAR - (l2StartTime - genesisStartTime);
    require(
      timeSinceL2 < linearSecondsLeft,
      "Can only update fraction once block reward calculation for years 15-30 has been implemented."
    );
    require(partner != address(0), "Partner cannot be the zero address.");
    require(
      partner != carbonOffsettingPartner || value != carbonOffsettingFraction.unwrap(),
      "Partner and value must be different from existing carbon offsetting fund."
    );
    require(value < FixidityLib.fixed1().unwrap(), "Value must be less than 1.");
    carbonOffsettingPartner = partner;
    carbonOffsettingFraction = FixidityLib.wrap(value);
    require(
      FixidityLib.newFixed(1).gte(communityRewardFraction.add(carbonOffsettingFraction)),
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
    whenDependenciesSet
    returns (
      uint256 targetGoldTotalSupply,
      uint256 communityTargetRewards,
      uint256 carbonFundTargetRewards
    )
  {
    require(block.timestamp > genesisStartTime, "genesisStartTime has not yet been reached.");
    require(block.timestamp > l2StartTime, "l2StartTime has not yet been reached.");

    uint256 timeSinceL2 = block.timestamp - l2StartTime;
    uint256 linearSecondsLeft = SECONDS_LINEAR - (l2StartTime - genesisStartTime);
    uint256 mintedOnL1 = totalSupplyAtL2Start - GENESIS_GOLD_SUPPLY;

    // Pay out half of all block rewards linearly.
    uint256 l1LinearRewards = (GOLD_SUPPLY_CAP - GENESIS_GOLD_SUPPLY) / 2; //(200 million) includes validator rewards.
    uint256 l2LinearRewards = l1LinearRewards - mintedOnL1;

    uint256 linearRewardsToCommunity = FixidityLib
      .newFixed(l2LinearRewards)
      .multiply(communityRewardFraction)
      .fromFixed();

    uint256 linearRewardsToCarbon = FixidityLib
      .newFixed(l2LinearRewards)
      .multiply(carbonOffsettingFraction)
      .fromFixed();

    if (timeSinceL2 < linearSecondsLeft) {
      communityTargetRewards = (linearRewardsToCommunity * (timeSinceL2)) / linearSecondsLeft;
      carbonFundTargetRewards = (linearRewardsToCarbon * (timeSinceL2)) / linearSecondsLeft;

      targetGoldTotalSupply =
        communityTargetRewards +
        (carbonFundTargetRewards) +
        (GENESIS_GOLD_SUPPLY) +
        (mintedOnL1);

      return (targetGoldTotalSupply, communityTargetRewards, carbonFundTargetRewards);
    } else {
      communityTargetRewards =
        (linearRewardsToCommunity * (linearSecondsLeft - 1)) /
        linearSecondsLeft;
      carbonFundTargetRewards =
        (linearRewardsToCarbon * (linearSecondsLeft - 1)) /
        linearSecondsLeft;
      targetGoldTotalSupply =
        communityTargetRewards +
        (carbonFundTargetRewards) +
        (GENESIS_GOLD_SUPPLY) +
        (mintedOnL1);

      if (
        totalMintedBySchedule + (GENESIS_GOLD_SUPPLY) + (mintedOnL1) <
        communityTargetRewards + (carbonFundTargetRewards) + (GENESIS_GOLD_SUPPLY) + (mintedOnL1)
      ) {
        return (targetGoldTotalSupply, communityTargetRewards, carbonFundTargetRewards);
      }
      require(false, "Block reward calculation for years 15-30 unimplemented");
      return (0, 0, 0);
    }
  }
}
