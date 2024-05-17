pragma solidity ^0.5.13;

import "openzeppelin-solidity/contracts/math/Math.sol";
import "openzeppelin-solidity/contracts/math/SafeMath.sol";
import "openzeppelin-solidity/contracts/token/ERC20/SafeERC20.sol";
import "openzeppelin-solidity/contracts/utils/Address.sol";

import "../common/FixidityLib.sol";
import "../common/libraries/ReentrancyGuard.sol";
import "../common/Initializable.sol";
import "../common/UsingRegistry.sol";
import "../common/interfaces/IGoldToken.sol";
import "../../contracts-0.8/common/IsL2Check.sol";

/**
 * @title Contract for minting new CELO token based on a schedule.
 */
contract MintGoldSchedule is UsingRegistry, ReentrancyGuard, Initializable, IsL2Check {
  using SafeMath for uint256;
  using FixidityLib for FixidityLib.Fraction;
  using Address for address payable; // prettier-ignore

  uint256 constant GENESIS_GOLD_SUPPLY = 600000000 ether; // 600 million Gold
  uint256 constant GOLD_SUPPLY_CAP = 1000000000 ether; // 1 billion Gold
  uint256 constant YEARS_LINEAR = 15;
  uint256 constant SECONDS_LINEAR = YEARS_LINEAR * 365 * 1 days;
  uint256 constant SECONDS_LINEAR2 = YEARS_LINEAR * 365 * 1 days;

  uint256 public genesisStartTime = 1587587214; // Copied over from `EpochRewards().startTime()`.
  uint256 public l2StartTime;
  uint256 public totalSupplyAtL2Start;

  // Indicates how much of the CELO has been minted so far.
  uint256 public totalMinted;
  address public communityRewardFund;
  address public carbonOffsettingPartner;

  FixidityLib.Fraction private communityRewardFraction;
  FixidityLib.Fraction private carbonOffsettingFraction;

  event CommunityRewardFractionSet(uint256 fraction);
  event CarbonOffsettingFundSet(address indexed partner, uint256 fraction);

  /**
   * @notice Sets initialized == true on implementation contracts
   * @param test Set to true to skip implementation initialization
   */
  constructor(bool test) public Initializable(test) {}

  /**
   * @notice A constructor for initialising a new instance of a MintGold contract.
   * @param _communityRewardFraction The percentage of rewards that go the community funds.
   * @param _carbonOffsettingPartner The address of the carbon offsetting partner.
   * @param _carbonOffsettingFraction The percentage of rewards going to carbon offsetting partner.
   * @param registryAddress Address of the deployed contracts registry.
   */
  function initialize(
    uint256 _communityRewardFraction,
    address _carbonOffsettingPartner,
    uint256 _carbonOffsettingFraction,
    address registryAddress
  ) external initializer onlyL2 {
    _transferOwnership(msg.sender);
    require(registryAddress != address(0), "The registry address cannot be the zero address");
    setRegistry(registryAddress);
    communityRewardFund = address(getGovernance());
    setCommunityRewardFraction(_communityRewardFraction);
    setCarbonOffsettingFund(_carbonOffsettingPartner, _carbonOffsettingFraction);
    totalSupplyAtL2Start = getGoldToken().totalSupply();
    l2StartTime = now;
  }

  /**
   * @notice Mints CELO to the beneficiaries according to the predefined schedule.
   */
  function mintAccordingToSchedule() external nonReentrant onlyL2 returns (bool) {
    (
      uint256 targetGoldTotalSupply,
      uint256 communityRewardFundMintAmount,
      uint256 carbonOffsettingPartnerMintAmount
    ) = getTargetGoldTotalSupply();

    uint256 mintableAmount = targetGoldTotalSupply.sub(getGoldToken().totalSupply());

    require(mintableAmount > 0, "Mintable amount must be greater than zero");
    require(
      getRemainingBalanceToMint() >= mintableAmount,
      "Insufficient unlocked balance to mint amount"
    );
    totalMinted = totalMinted.add(mintableAmount);

    require(
      FixidityLib.newFixed(1).gt(communityRewardFraction.add(carbonOffsettingFraction)),
      "Sum of partner fractions must be less than 1."
    );

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
  function setCommunityRewardFraction(uint256 value) public onlyOwner returns (bool) {
    require(
      value != communityRewardFraction.unwrap() && value < FixidityLib.fixed1().unwrap(),
      "Value must be different from existing community reward fraction and less than 1."
    );
    communityRewardFraction = FixidityLib.wrap(value);
    emit CommunityRewardFractionSet(value);
    return true;
  }

  /**
   * @notice Sets the carbon offsetting fund.
   * @param partner The address of the carbon offsetting partner.
   * @param value The percentage of the total reward to be sent to the carbon offsetting partner.
   * @return True upon success.
   */
  function setCarbonOffsettingFund(address partner, uint256 value) public onlyOwner returns (bool) {
    require(partner != address(0), "Partner cannot be the zero address.");
    require(
      partner != carbonOffsettingPartner || value != carbonOffsettingFraction.unwrap(),
      "Partner and value must be different from existing carbon offsetting fund."
    );
    require(value < FixidityLib.fixed1().unwrap(), "Value must be less than 1.");
    carbonOffsettingPartner = partner;
    carbonOffsettingFraction = FixidityLib.wrap(value);
    emit CarbonOffsettingFundSet(partner, value);
    return true;
  }

  /**
   * @notice Calculates remaining CELO balance to mint.
   * @return The remaining CELO balance to mint.
   */
  function getRemainingBalanceToMint() public view returns (uint256) {
    return GOLD_SUPPLY_CAP.sub(getGoldToken().totalSupply());
  }

  function getTotalMintedBySchedule() public view returns (uint256) {
    return totalMinted;
  }

  /**
   * @return The currently mintable amount.
   */
  function getMintableAmount() public view returns (uint256) {
    (uint256 targetGoldTotalSupply, , ) = getTargetGoldTotalSupply();
    return targetGoldTotalSupply.sub(getGoldToken().totalSupply());
  }

  /**
   * @notice Returns the target Gold supply according to the target schedule.
   * @return The target Gold supply according to the target schedule.
   */
  function getTargetGoldTotalSupply()
    public
    view
    returns (
      uint256 targetGoldTotalSupply,
      uint256 communityTargetRewards,
      uint256 carbonFundTargetRewards
    )
  {
    require(now > genesisStartTime, "genesisStartTime has now yet been reached.");
    require(now > l2StartTime, "l2StartTime has now yet been reached.");

    uint256 timeSinceL2 = now.sub(l2StartTime);
    uint256 mintedOnL1 = totalSupplyAtL2Start.sub(GENESIS_GOLD_SUPPLY);
    uint256 linearSecondsLeft = SECONDS_LINEAR.sub((l2StartTime.sub(genesisStartTime)));

    // Pay out half of all block rewards linearly.
    uint256 l1LinearRewards = GOLD_SUPPLY_CAP.sub(GENESIS_GOLD_SUPPLY).div(2); //(200 million) includes validator rewards.
    uint256 l2LinearRewards = l1LinearRewards.sub(mintedOnL1);

    uint256 linearRewardsToCommunity = FixidityLib
      .newFixed(l2LinearRewards)
      .multiply(communityRewardFraction)
      .fromFixed();

    uint256 linearRewardsToCarbon = FixidityLib
      .newFixed(l2LinearRewards)
      .multiply(carbonOffsettingFraction)
      .fromFixed();

    if (timeSinceL2 < linearSecondsLeft) {
      communityTargetRewards = linearRewardsToCommunity.mul(timeSinceL2).div(linearSecondsLeft);
      carbonFundTargetRewards = linearRewardsToCarbon.mul(timeSinceL2).div(linearSecondsLeft);

      targetGoldTotalSupply = communityTargetRewards
        .add(carbonFundTargetRewards)
        .add(GENESIS_GOLD_SUPPLY)
        .add(mintedOnL1);

      return (targetGoldTotalSupply, communityTargetRewards, carbonFundTargetRewards);
    } else {
      communityTargetRewards = linearRewardsToCommunity.mul(linearSecondsLeft.sub(1)).div(
        linearSecondsLeft
      );
      carbonFundTargetRewards = linearRewardsToCarbon.mul(linearSecondsLeft.sub(1)).div(
        linearSecondsLeft
      );
      targetGoldTotalSupply = communityTargetRewards
        .add(carbonFundTargetRewards)
        .add(GENESIS_GOLD_SUPPLY)
        .add(mintedOnL1);

      if (
        totalMinted.add(GENESIS_GOLD_SUPPLY).add(mintedOnL1) <
        communityTargetRewards.add(carbonFundTargetRewards).add(GENESIS_GOLD_SUPPLY).add(mintedOnL1)
      ) {
        return (targetGoldTotalSupply, communityTargetRewards, carbonFundTargetRewards);
      }
      require(false, "Block reward calculation for years 15-30 unimplemented");
      return (0, 0, 0);
    }
  }
}
