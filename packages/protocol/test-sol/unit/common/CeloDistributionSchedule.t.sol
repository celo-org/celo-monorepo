// SPDX-License-Identifier: UNLICENSED
pragma solidity >=0.8.7 <0.8.20;
pragma experimental ABIEncoderV2;

import "celo-foundry-8/Test.sol";
import "@celo-contracts/common/FixidityLib.sol";
import "@celo-contracts/common/interfaces/IRegistry.sol";
import "@celo-contracts-8/common/interfaces/IGoldToken.sol";
import "@celo-contracts/governance/interfaces/IGovernance.sol";
import "@celo-contracts-8/common/CeloDistributionSchedule.sol";
import "@celo-contracts-8/common/IsL2Check.sol";
import { Constants } from "@test-sol/constants.sol";

import "@test-sol/unit/governance/mock/MockGovernance.sol";

contract CeloDistributionScheduleTest is Test, Constants, IsL2Check {
  using FixidityLib for FixidityLib.Fraction;

  IRegistry registry;
  IGoldToken celoToken;
  MockGovernance governance;

  CeloDistributionSchedule mintCeloSchedule;

  address owner = address(this);

  address registryAddress;
  address celoTokenAddress = actor("celoTokenAddress");

  address mintCeloOwner = actor("mintCeloOwner");
  address communityRewardFund = actor("communityRewardFund");
  address carbonOffsettingPartner = actor("carbonOffsettingPartner");

  address newPartner = actor("newPartner");
  address randomAddress = actor("randomAddress");

  address constant l1RegistryAddress = 0x000000000000000000000000000000000000ce10;

  uint256 constant DAILY_DISTRIBUTION_AMOUNT = 6748256563599655349558; // 6,748 Celo
  uint256 constant L1_MINTED_CELO_SUPPLY = 692702432463315819704447326; // as of May 15 2024

  uint256 constant CELO_SUPPLY_CAP = 1000000000 ether; // 1 billion Celo
  uint256 constant GENESIS_CELO_SUPPLY = 600000000 ether; // 600 million Celo

  uint256 constant FIFTEEN_YEAR_LINEAR_REWARD = (CELO_SUPPLY_CAP - GENESIS_CELO_SUPPLY) / 2; // 200 million Celo

  uint256 constant FIFTEEN_YEAR_CELO_SUPPLY = GENESIS_CELO_SUPPLY + FIFTEEN_YEAR_LINEAR_REWARD; // 800 million Celo (includes GENESIS_CELO_SUPPLY)

  uint256 constant MAX_L2_DISTRIBUTION = FIFTEEN_YEAR_CELO_SUPPLY - L1_MINTED_CELO_SUPPLY; // 107.2 million Celo

  uint256 constant L2_INITIAL_STASH_BALANCE = FIFTEEN_YEAR_LINEAR_REWARD + MAX_L2_DISTRIBUTION; // leftover from L1 target supply plus the 2nd 15 year term.

  uint256 constant MAX_L2_COMMUNITY_DISTRIBUTION = MAX_L2_DISTRIBUTION / 4; // 26.8 million Celo
  uint256 constant MAX_L2_CARBON_FUND_DISTRIBUTION = MAX_L2_DISTRIBUTION / 1000; // 107,297 Celo

  uint256 constant L2_FIFTEEN_YEAR_CELO_SUPPLY =
    L1_MINTED_CELO_SUPPLY + MAX_L2_COMMUNITY_DISTRIBUTION + MAX_L2_CARBON_FUND_DISTRIBUTION;

  uint256 constant l2StartTime = 1715808537; // Arbitary later date (May 15 2024)
  uint256 constant communityRewardFraction = FIXED1 / 4; // 25%
  uint256 constant carbonOffsettingFraction = FIXED1 / 1000; // 0.1%
  uint256 constant newCommunityRewardFraction = FIXED1 / 2; // 50%
  uint256 constant newCarbonOffsettingFraction = FIXED1 / 500; // 0.2%

  event CommunityRewardFractionSet(uint256 fraction);
  event CarbonOffsettingFundSet(address indexed partner, uint256 fraction);

  function setUp() public virtual {
    setUpL1();

    // Setup L2 after minting L1 supply.
    registryAddress = proxyAdminAddress;
    deployCodeTo("Registry.sol", abi.encode(false), registryAddress);
    registry = IRegistry(registryAddress);

    registry.setAddressFor("GoldToken", address(celoToken));
    registry.setAddressFor("Governance", address(governance));

    celoToken.setRegistry(registryAddress);
  }

  function setUpL1() public {
    registryAddress = l1RegistryAddress;

    deployCodeTo("Registry.sol", abi.encode(false), registryAddress);
    registry = IRegistry(registryAddress);

    deployCodeTo("GoldToken.sol", abi.encode(false), celoTokenAddress);
    celoToken = IGoldToken(celoTokenAddress);

    // Using a mock contract, as foundry does not allow for library linking when using deployCodeTo
    governance = new MockGovernance();

    registry.setAddressFor("GoldToken", address(celoToken));

    registry.setAddressFor("Governance", address(governance));

    vm.deal(address(0), CELO_SUPPLY_CAP);
    assertEq(celoToken.totalSupply(), 0, "starting total supply not zero.");
    // Mint L1 supply
    vm.prank(address(0));
    celoToken.mint(randomAddress, L1_MINTED_CELO_SUPPLY);
    assertEq(celoToken.totalSupply(), L1_MINTED_CELO_SUPPLY, "total supply incorrect.");
  }

  function newMintCelo() internal returns (CeloDistributionSchedule) {
    vm.warp(block.timestamp + l2StartTime);
    vm.prank(mintCeloOwner);
    mintCeloSchedule = new CeloDistributionSchedule(true);

    vm.deal(address(mintCeloSchedule), L2_INITIAL_STASH_BALANCE);

    celoToken.setCeloTokenDistributionScheduleAddress(address(mintCeloSchedule));

    vm.prank(mintCeloOwner);
    mintCeloSchedule.initialize();

    vm.prank(mintCeloOwner);

    mintCeloSchedule.activate(
      l2StartTime,
      communityRewardFraction,
      carbonOffsettingPartner,
      carbonOffsettingFraction,
      registryAddress
    );
  }
}

contract CeloDistributionScheduleTest_initialize is CeloDistributionScheduleTest {
  function setUp() public override {
    super.setUp();
    vm.warp(block.timestamp + l2StartTime);

    vm.prank(mintCeloOwner);
    mintCeloSchedule = new CeloDistributionSchedule(true);

    celoToken.setCeloTokenDistributionScheduleAddress(address(mintCeloSchedule));

    vm.prank(mintCeloOwner);
    mintCeloSchedule.initialize();
  }

  function test_ShouldSetAOwnerToMintCeloScheduleInstance() public {
    assertEq(mintCeloSchedule.owner(), mintCeloOwner);
  }

  function test_ShouldNotSetBeneficiariesToMintCeloScheduleInstance() public {
    assertEq(mintCeloSchedule.communityRewardFund(), address(0));
    assertEq(mintCeloSchedule.carbonOffsettingPartner(), address(0));
  }

  function test_ShouldHaveZeroTotalDistributedByScheduleOnInit() public {
    assertEq(mintCeloSchedule.totalDistributedBySchedule(), 0);
  }

  function test_ShouldNotSetTheL2StartTime() public {
    assertEq(mintCeloSchedule.l2StartTime(), 0);
  }
}

contract CeloDistributionScheduleTest_activate_L1 is CeloDistributionScheduleTest {
  function setUp() public override {
    super.setUpL1();

    mintCeloSchedule = new CeloDistributionSchedule(true);
    mintCeloSchedule.initialize();
  }

  function test_Reverts_WhenCalledOnL1() public {
    vm.warp(block.timestamp + l2StartTime);
    vm.expectRevert("This method is not supported in L1.");
    mintCeloSchedule.activate(
      l2StartTime,
      communityRewardFraction,
      carbonOffsettingPartner,
      carbonOffsettingFraction,
      registryAddress
    );
  }
}

contract CeloDistributionScheduleTest_activate is CeloDistributionScheduleTest {
  function test_ShouldHaveZeroTotalDistributedByScheduleOnInit() public {
    newMintCelo();
    assertEq(mintCeloSchedule.totalDistributedBySchedule(), 0);
  }
  function test_ShouldUpdateDependencies() public {
    newMintCelo();
    assertEq(mintCeloSchedule.l2StartTime(), l2StartTime);
    assertEq(mintCeloSchedule.totalSupplyAtL2Start(), L1_MINTED_CELO_SUPPLY);
    assertEq(mintCeloSchedule.communityRewardFund(), address(governance));
    assertEq(mintCeloSchedule.carbonOffsettingPartner(), carbonOffsettingPartner);
    assertEq(mintCeloSchedule.getCarbonOffsettingFraction(), carbonOffsettingFraction);
    assertEq(mintCeloSchedule.getCommunityRewardFraction(), communityRewardFraction);
  }

  function test_Reverts_WhenRegistryIsTheNullAddress() public {
    vm.warp(block.timestamp + l2StartTime);
    mintCeloSchedule = new CeloDistributionSchedule(true);
    mintCeloSchedule.initialize();
    vm.deal(address(mintCeloSchedule), L2_INITIAL_STASH_BALANCE);
    vm.expectRevert("The registry address cannot be the zero address");
    mintCeloSchedule.activate(
      l2StartTime,
      communityRewardFraction,
      carbonOffsettingPartner,
      carbonOffsettingFraction,
      address(0)
    );
  }

  function test_Reverts_WhenCommunityFractionIsZero() public {
    vm.warp(block.timestamp + l2StartTime);
    mintCeloSchedule = new CeloDistributionSchedule(true);
    mintCeloSchedule.initialize();
    vm.deal(address(mintCeloSchedule), L2_INITIAL_STASH_BALANCE);
    vm.expectRevert(
      "Value must be different from existing community reward fraction and less than 1."
    );
    mintCeloSchedule.activate(
      l2StartTime,
      0,
      carbonOffsettingPartner,
      carbonOffsettingFraction,
      registryAddress
    );
  }

  function test_Reverts_WhenCarbonOffsettingPartnerIsNullAddress() public {
    vm.warp(block.timestamp + l2StartTime);
    mintCeloSchedule = new CeloDistributionSchedule(true);
    mintCeloSchedule.initialize();
    vm.deal(address(mintCeloSchedule), L2_INITIAL_STASH_BALANCE);

    vm.expectRevert("Partner cannot be the zero address.");
    mintCeloSchedule.activate(
      l2StartTime,
      communityRewardFraction,
      address(0),
      carbonOffsettingFraction,
      registryAddress
    );
  }

  function test_Reverts_WhenRegistryNotUpdated() public {
    vm.warp(block.timestamp + l2StartTime);
    registry.setAddressFor("Governance", address(0));
    mintCeloSchedule = new CeloDistributionSchedule(true);
    vm.deal(address(mintCeloSchedule), L2_INITIAL_STASH_BALANCE);
    mintCeloSchedule.initialize();

    vm.expectRevert("identifier has no registry entry");
    mintCeloSchedule.activate(
      l2StartTime,
      communityRewardFraction,
      carbonOffsettingPartner,
      carbonOffsettingFraction,
      registryAddress
    );
  }

  function test_Reverts_WhenCalledTwice() public {
    newMintCelo();
    vm.expectRevert("Contract has already been activated.");

    vm.prank(mintCeloOwner);

    mintCeloSchedule.activate(
      l2StartTime,
      communityRewardFraction,
      carbonOffsettingPartner,
      carbonOffsettingFraction,
      registryAddress
    );
  }

  function test_Reverts_WhenTheContractDoesNotHaveBalance() public {
    vm.warp(block.timestamp + l2StartTime);
    vm.prank(mintCeloOwner);
    mintCeloSchedule = new CeloDistributionSchedule(true);

    vm.deal(address(mintCeloSchedule), L2_INITIAL_STASH_BALANCE);

    celoToken.setCeloTokenDistributionScheduleAddress(address(mintCeloSchedule));

    vm.prank(mintCeloOwner);
    mintCeloSchedule.initialize();

    vm.deal(address(mintCeloSchedule), 0);

    vm.expectRevert("Contract does not have CELO balance.");
    vm.prank(mintCeloOwner);
    mintCeloSchedule.activate(
      l2StartTime,
      communityRewardFraction,
      carbonOffsettingPartner,
      carbonOffsettingFraction,
      registryAddress
    );
  }
}

contract CeloDistributionScheduleTest_setCommunityRewardFraction is CeloDistributionScheduleTest {
  function setUp() public override {
    super.setUp();
    newMintCelo();
  }
  function test_ShouldSetNewFraction() public {
    vm.prank(mintCeloOwner);
    mintCeloSchedule.setCommunityRewardFraction(newCommunityRewardFraction);
    assertEq(mintCeloSchedule.getCommunityRewardFraction(), newCommunityRewardFraction);
  }
  function test_Emits_CommunityRewardFractionSetEvent() public {
    vm.expectEmit(true, true, true, true);
    emit CommunityRewardFractionSet(newCommunityRewardFraction);
    vm.prank(mintCeloOwner);
    mintCeloSchedule.setCommunityRewardFraction(newCommunityRewardFraction);
  }
  function test_Reverts_WhenCalledByOtherThanOwner() public {
    vm.expectRevert("Ownable: caller is not the owner");
    vm.prank(randomAddress);
    mintCeloSchedule.setCommunityRewardFraction(newCommunityRewardFraction);
  }
  function test_Reverts_WhenFractionIsTheSame() public {
    vm.expectRevert(
      "Value must be different from existing community reward fraction and less than 1."
    );
    vm.prank(mintCeloOwner);
    mintCeloSchedule.setCommunityRewardFraction(communityRewardFraction);
  }
  function test_Reverts_WhenSumOfFractionsGtOne() public {
    vm.expectRevert("Sum of partner fractions must be less than or equal to 1.");
    vm.prank(mintCeloOwner);
    mintCeloSchedule.setCommunityRewardFraction((FIXED1 - 1));
  }
  function test_Reverts_WhenDependenciesNotSet() public {
    mintCeloSchedule = new CeloDistributionSchedule(true);

    celoToken.setCeloTokenDistributionScheduleAddress(address(mintCeloSchedule));

    vm.prank(mintCeloOwner);
    mintCeloSchedule.initialize();

    vm.expectRevert("Distribution schedule has not been activated.");
    vm.prank(mintCeloOwner);
    mintCeloSchedule.setCommunityRewardFraction(communityRewardFraction);
  }
  function test_Reverts_WhenFractionChangesAfter15Years() public {
    vm.warp(block.timestamp + (15 * YEAR + 4 * DAY));

    assertEq(mintCeloSchedule.totalDistributedBySchedule(), 0, "Incorrect mintableAmount");

    vm.prank(randomAddress);
    mintCeloSchedule.distributeAccordingToSchedule();

    vm.warp(block.timestamp + (15 * YEAR) + (4 * DAY));

    vm.expectRevert(
      "Can only update fraction once block reward calculation for years 15-30 has been implemented."
    );

    vm.prank(mintCeloOwner);
    mintCeloSchedule.setCommunityRewardFraction(((FIXED1 / 4) * 3));
  }
}

contract CeloDistributionScheduleTest_setCarbonOffsettingFund is CeloDistributionScheduleTest {
  function setUp() public override {
    super.setUp();
    newMintCelo();
  }

  function test_ShouldSetNewPartner() public {
    vm.prank(mintCeloOwner);
    mintCeloSchedule.setCarbonOffsettingFund(newPartner, carbonOffsettingFraction);
    assertEq(mintCeloSchedule.carbonOffsettingPartner(), newPartner);
  }
  function test_ShouldSetNewFraction() public {
    vm.prank(mintCeloOwner);
    mintCeloSchedule.setCarbonOffsettingFund(carbonOffsettingPartner, newCarbonOffsettingFraction);
    assertEq(mintCeloSchedule.getCarbonOffsettingFraction(), newCarbonOffsettingFraction);
  }

  function test_Emits_CarbonOffsettingFundSetEvent() public {
    vm.expectEmit(true, true, true, true);
    emit CarbonOffsettingFundSet(newPartner, carbonOffsettingFraction);
    vm.prank(mintCeloOwner);
    mintCeloSchedule.setCarbonOffsettingFund(newPartner, carbonOffsettingFraction);
  }

  function test_Reverts_WhenCalledByOtherThanOwner() public {
    vm.expectRevert("Ownable: caller is not the owner");
    vm.prank(randomAddress);
    mintCeloSchedule.setCarbonOffsettingFund(newPartner, carbonOffsettingFraction);
  }

  function test_Reverts_WhenPartnerAndFractionAreTheSame() public {
    vm.expectRevert("Partner and value must be different from existing carbon offsetting fund.");
    vm.prank(mintCeloOwner);
    mintCeloSchedule.setCarbonOffsettingFund(carbonOffsettingPartner, carbonOffsettingFraction);
  }

  function test_Reverts_WhenSumOfFractionsGtOne() public {
    vm.expectRevert("Sum of partner fractions must be less than or equal to 1.");
    vm.prank(mintCeloOwner);
    mintCeloSchedule.setCarbonOffsettingFund(carbonOffsettingPartner, (FIXED1 - 1));
  }

  function test_Reverts_WhenDependenciesNotSet() public {
    mintCeloSchedule = new CeloDistributionSchedule(true);

    celoToken.setCeloTokenDistributionScheduleAddress(address(mintCeloSchedule));

    vm.prank(mintCeloOwner);
    mintCeloSchedule.initialize();

    vm.expectRevert("Distribution schedule has not been activated.");
    vm.prank(mintCeloOwner);
    mintCeloSchedule.setCarbonOffsettingFund(carbonOffsettingPartner, carbonOffsettingFraction);
  }

  function test_Reverts_WhenFractionChangesAfter15Years() public {
    vm.warp(block.timestamp + (15 * YEAR + 4 * DAY));

    assertEq(mintCeloSchedule.totalDistributedBySchedule(), 0, "Incorrect mintableAmount");

    vm.prank(randomAddress);
    mintCeloSchedule.distributeAccordingToSchedule();

    vm.warp(block.timestamp + (15 * YEAR) + (4 * DAY));

    vm.expectRevert(
      "Can only update fraction once block reward calculation for years 15-30 has been implemented."
    );

    vm.prank(mintCeloOwner);
    mintCeloSchedule.setCarbonOffsettingFund(carbonOffsettingPartner, ((FIXED1 / 4) * 3));
  }
}

contract CeloDistributionScheduleTest_distributeAccordingToSchedule_L1 is
  CeloDistributionScheduleTest
{
  uint256 initialMintCeloAmount;

  function setUp() public override {
    super.setUpL1();

    mintCeloSchedule = new CeloDistributionSchedule(true);
    mintCeloSchedule.initialize();
  }

  function test_Reverts_WhenMintingOnL1() public {
    vm.warp(block.timestamp + 3 * MONTH + 1 * DAY);

    vm.expectRevert("This method is not supported in L1.");
    vm.prank(randomAddress);
    mintCeloSchedule.distributeAccordingToSchedule();
  }
}

contract CeloDistributionScheduleTest_distributeAccordingToSchedule is
  CeloDistributionScheduleTest
{
  uint256 initialMintCeloAmount;
  uint256 mintPerPeriod;

  function setUp() public override {
    super.setUp();

    newMintCelo();
  }

  function test_Reverts_WhenDependenciesAreNotSet() public {
    mintCeloSchedule = new CeloDistributionSchedule(true);

    vm.prank(mintCeloOwner);
    mintCeloSchedule.initialize();

    vm.expectRevert("Distribution schedule has not been activated.");
    vm.prank(randomAddress);
    mintCeloSchedule.distributeAccordingToSchedule();
  }

  function test_ShouldAllowMintingAsSoon1SecondAfterSettingDependencies() public {
    uint256 communityFundBalanceBefore = celoToken.balanceOf(address(governance));
    vm.prank(randomAddress);
    mintCeloSchedule.distributeAccordingToSchedule();
    uint256 communityFundBalanceAfter = celoToken.balanceOf(address(governance));
    assertGt(communityFundBalanceAfter, communityFundBalanceBefore);
  }

  function test_Reverts_WhenMintableAmountIsZero() public {
    vm.prank(randomAddress);
    mintCeloSchedule.distributeAccordingToSchedule();

    vm.expectRevert("Distributable amount must be greater than zero.");
    vm.prank(randomAddress);
    mintCeloSchedule.distributeAccordingToSchedule();
  }

  function test_ShouldAllowToMint25Percent2years9MonthsPostL2Launch() public {
    vm.warp(block.timestamp + 2 * YEAR + 267 * DAY + 63868); // 25% time since L2

    uint256 expectedDistributedAmount = (L2_FIFTEEN_YEAR_CELO_SUPPLY - L1_MINTED_CELO_SUPPLY) / 4;

    vm.prank(randomAddress);
    mintCeloSchedule.distributeAccordingToSchedule();

    assertApproxEqRel(
      mintCeloSchedule.totalDistributedBySchedule(),
      expectedDistributedAmount,
      1e10
    );
  }

  function test_ShouldAllowToMint50Percent5AndHalfYearsPostL2Launch() public {
    vm.warp(block.timestamp + (5 * YEAR) + (170 * DAY) + 41338);

    uint256 expectedDistributedAmount = (L2_FIFTEEN_YEAR_CELO_SUPPLY - L1_MINTED_CELO_SUPPLY) / 2;
    vm.prank(randomAddress);
    mintCeloSchedule.distributeAccordingToSchedule();

    assertApproxEqRel(
      mintCeloSchedule.totalDistributedBySchedule(),
      expectedDistributedAmount,
      1e10
    );
  }

  function test_ShouldAllowToMint75Percent11YearsAnd3MonthsPostL2Launch() public {
    vm.warp(block.timestamp + 8 * YEAR + 73 * DAY + 18807);

    uint256 expectedDistributedAmount = ((L2_FIFTEEN_YEAR_CELO_SUPPLY - L1_MINTED_CELO_SUPPLY) /
      4) * 3;

    vm.prank(randomAddress);
    mintCeloSchedule.distributeAccordingToSchedule();

    assertApproxEqRel(
      mintCeloSchedule.totalDistributedBySchedule(),
      expectedDistributedAmount,
      1e10
    );
  }

  function test_ShouldAllowToMint100Percent11YearsPostL2Launch() public {
    uint256 communityFundBalanceBefore = celoToken.balanceOf(address(governance));
    uint256 carbonOffsettingPartnerBalanceBefore = celoToken.balanceOf(carbonOffsettingPartner);
    vm.warp(block.timestamp + (11 * YEAR));

    vm.prank(randomAddress);
    mintCeloSchedule.distributeAccordingToSchedule();

    assertApproxEqRel(
      mintCeloSchedule.totalDistributedBySchedule(),
      MAX_L2_COMMUNITY_DISTRIBUTION + MAX_L2_CARBON_FUND_DISTRIBUTION,
      1e10
    );

    uint256 communityFundBalanceAfter = celoToken.balanceOf(address(governance));
    uint256 carbonOffsettingPartnerBalanceAfter = celoToken.balanceOf(carbonOffsettingPartner);

    assertApproxEqRel(
      communityFundBalanceAfter - communityFundBalanceBefore,
      MAX_L2_COMMUNITY_DISTRIBUTION,
      1e10
    );

    assertApproxEqRel(
      carbonOffsettingPartnerBalanceAfter - carbonOffsettingPartnerBalanceBefore,
      MAX_L2_CARBON_FUND_DISTRIBUTION,
      1e10
    );
  }

  function test_ShouldMintUpToLinearSuppplyAfter15Years() public {
    vm.warp(block.timestamp + (15 * YEAR) + (4 * DAY));

    assertEq(mintCeloSchedule.totalDistributedBySchedule(), 0, "Incorrect mintableAmount");

    vm.prank(randomAddress);
    mintCeloSchedule.distributeAccordingToSchedule();

    assertApproxEqRel(
      mintCeloSchedule.totalDistributedBySchedule(),
      MAX_L2_COMMUNITY_DISTRIBUTION + MAX_L2_CARBON_FUND_DISTRIBUTION,
      1e10
    );
  }

  function test_Reverts_WhenMintingSecondTimeAfter15Years() public {
    vm.warp(block.timestamp + (15 * YEAR) + (1 * DAY));

    vm.prank(randomAddress);
    mintCeloSchedule.distributeAccordingToSchedule();

    assertApproxEqRel(
      mintCeloSchedule.totalDistributedBySchedule(),
      MAX_L2_COMMUNITY_DISTRIBUTION + MAX_L2_CARBON_FUND_DISTRIBUTION,
      1e10
    );

    vm.expectRevert("Block reward calculation for years 15-30 unimplemented");
    vm.prank(randomAddress);
    mintCeloSchedule.distributeAccordingToSchedule();
  }

  function test_Reverts_WhenTheContractBalanceIsLowerExpected() public {
    vm.deal(address(mintCeloSchedule), 0);
    vm.prank(address(mintCeloSchedule));

    vm.expectRevert("Contract balance is insufficient.");
    mintCeloSchedule.distributeAccordingToSchedule();
  }

  function test_ShouldTransferbalanceFromThisContract() public {
    uint256 initialStashBalance = celoToken.balanceOf(address(mintCeloSchedule));

    vm.warp(block.timestamp + (15 * YEAR));

    mintCeloSchedule.distributeAccordingToSchedule();

    uint256 finalStashBalance = celoToken.balanceOf(address(mintCeloSchedule));

    assertLt(finalStashBalance, initialStashBalance);

    assertApproxEqRel(
      celoToken.balanceOf(address(mintCeloSchedule)),
      L2_INITIAL_STASH_BALANCE - (MAX_L2_COMMUNITY_DISTRIBUTION + MAX_L2_CARBON_FUND_DISTRIBUTION),
      1e10
    );
  }
}

contract CeloDistributionScheduleTest_getDistributableAmount is CeloDistributionScheduleTest {
  uint256 initialMintCeloAmount;

  function setUp() public override {
    super.setUp();

    newMintCelo();
  }

  function test_ShouldReturnFullAmountAvailableForThisReleasePeriod() public {
    vm.warp(block.timestamp + 1 * DAY);
    assertApproxEqRel(mintCeloSchedule.getDistributableAmount(), DAILY_DISTRIBUTION_AMOUNT, 1e10);
  }

  function test_ShouldReturnOnlyAmountNotYetDistributed() public {
    vm.warp(block.timestamp + 1 * DAY);
    vm.prank(randomAddress);
    mintCeloSchedule.distributeAccordingToSchedule();

    vm.warp(block.timestamp + 1 * DAY + 1);
    assertApproxEqRel(mintCeloSchedule.getDistributableAmount(), DAILY_DISTRIBUTION_AMOUNT, 1e10);
  }

  function test_ShouldReturnOnlyUpToMaxL2DistributionBeforeItIsDistributed() public {
    vm.warp(block.timestamp + 16 * YEAR);
    assertApproxEqRel(
      mintCeloSchedule.getDistributableAmount(),
      MAX_L2_COMMUNITY_DISTRIBUTION + MAX_L2_CARBON_FUND_DISTRIBUTION,
      1e10
    );
  }

  function test_Reverts_When15YearsHavePassedAndAllLinearScheduleHaseBeenReleased() public {
    vm.warp(block.timestamp + 15 * YEAR);

    vm.prank(randomAddress);
    mintCeloSchedule.distributeAccordingToSchedule();
    vm.expectRevert("Block reward calculation for years 15-30 unimplemented");
    mintCeloSchedule.getDistributableAmount();
  }

  function test_Reverts_WhenDependenciesNotSet() public {
    mintCeloSchedule = new CeloDistributionSchedule(true);

    vm.prank(mintCeloOwner);
    mintCeloSchedule.initialize();

    vm.expectRevert("Distribution schedule has not been activated.");

    mintCeloSchedule.getDistributableAmount();
  }
}