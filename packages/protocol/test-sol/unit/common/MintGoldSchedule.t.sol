// SPDX-License-Identifier: UNLICENSED
pragma solidity >=0.8.7 <0.8.20;
pragma experimental ABIEncoderV2;

import "celo-foundry-8/Test.sol";
import "@celo-contracts/common/FixidityLib.sol";
import "@celo-contracts/common/interfaces/IRegistry.sol";
import "@celo-contracts-8/common/interfaces/IGoldToken.sol";
import "@celo-contracts/governance/interfaces/IGovernance.sol";
import "@celo-contracts-8/common/MintGoldSchedule.sol";
import "@celo-contracts-8/common/IsL2Check.sol";
import { Constants } from "@test-sol/constants.sol";

import "@test-sol/unit/governance/mock/MockGovernance.sol";

contract MintGoldScheduleTest is Test, Constants, IsL2Check {
  using FixidityLib for FixidityLib.Fraction;

  IRegistry registry;
  IGoldToken goldToken;
  MockGovernance governance;

  MintGoldSchedule mintGoldSchedule;

  address owner = address(this);

  address registryAddress;
  address goldTokenAddress = actor("goldTokenAddress");

  address mintGoldOwner = actor("mintGoldOwner");
  address communityRewardFund = actor("communityRewardFund");
  address carbonOffsettingPartner = actor("carbonOffsettingPartner");

  address newPartner = actor("newPartner");
  address randomAddress = actor("randomAddress");

  address constant l1RegistryAddress = 0x000000000000000000000000000000000000ce10;

  // uint256 constant DAILY_MINT_AMOUNT_UPPER = 6749 ether; // 6,749 Gold
  uint256 constant DAILY_MINT_AMOUNT_LOWER = 6748256563599655349558; // 6,748 Gold
  uint256 constant L1_MINTED_GOLD_SUPPLY = 692702432463315819704447326; // as of May 15 2024

  uint256 constant GOLD_SUPPLY_CAP = 1000000000 ether; // 1 billion Gold
  uint256 constant GENESIS_GOLD_SUPPLY = 600000000 ether; // 600 million Gold

  uint256 constant FIFTEEN_YEAR_LINEAR_REWARD = (GOLD_SUPPLY_CAP - GENESIS_GOLD_SUPPLY) / 2; // 200 million Gold
  uint256 constant FIFTEEN_YEAR_GOLD_SUPPLY = GENESIS_GOLD_SUPPLY + FIFTEEN_YEAR_LINEAR_REWARD; // 800 million Gold (includes GENESIS_GOLD_SUPPLY)

  uint256 constant MAX_L2_DISTRIBUTION = FIFTEEN_YEAR_GOLD_SUPPLY - L1_MINTED_GOLD_SUPPLY; // 107.2 million Gold
  uint256 constant MAX_L2_COMMUNITY_DISTRIBUTION = MAX_L2_DISTRIBUTION / 4; // 26.8 million Gold
  uint256 constant MAX_L2_CARBON_FUND_DISTRIBUTION = MAX_L2_DISTRIBUTION / 1000; // 107,297 Gold

  uint256 constant L2_FIFTEEN_YEAR_GOLD_SUPPLY =
    L1_MINTED_GOLD_SUPPLY + MAX_L2_COMMUNITY_DISTRIBUTION + MAX_L2_CARBON_FUND_DISTRIBUTION;

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

    registry.setAddressFor("GoldToken", address(goldToken));
    registry.setAddressFor("Governance", address(governance));

    goldToken.setRegistry(registryAddress);
  }

  function setUpL1() public {
    registryAddress = l1RegistryAddress;

    deployCodeTo("Registry.sol", abi.encode(false), registryAddress);
    registry = IRegistry(registryAddress);

    deployCodeTo("GoldToken.sol", abi.encode(false), goldTokenAddress);
    goldToken = IGoldToken(goldTokenAddress);

    // Using a mock contract, as foundry does not allow for library linking when using deployCodeTo
    governance = new MockGovernance();

    registry.setAddressFor("GoldToken", address(goldToken));

    registry.setAddressFor("Governance", address(governance));

    vm.deal(address(0), GOLD_SUPPLY_CAP);
    assertEq(goldToken.totalSupply(), 0, "starting total supply not zero.");
    // Mint L1 supply
    vm.prank(address(0));
    goldToken.mint(randomAddress, L1_MINTED_GOLD_SUPPLY);
    assertEq(goldToken.totalSupply(), L1_MINTED_GOLD_SUPPLY, "total supply incorrect.");
  }

  function newMintGold() internal returns (MintGoldSchedule) {
    vm.warp(block.timestamp + l2StartTime);
    vm.prank(mintGoldOwner);
    mintGoldSchedule = new MintGoldSchedule(true);

    goldToken.setGoldTokenMintingScheduleAddress(address(mintGoldSchedule));

    vm.prank(mintGoldOwner);
    mintGoldSchedule.initialize();

    vm.prank(mintGoldOwner);

    mintGoldSchedule.activate(
      l2StartTime,
      communityRewardFraction,
      carbonOffsettingPartner,
      carbonOffsettingFraction,
      registryAddress
    );
  }
}

contract MintGoldScheduleTest_initialize is MintGoldScheduleTest {
  function setUp() public override {
    super.setUp();
    vm.warp(block.timestamp + l2StartTime);

    vm.prank(mintGoldOwner);
    mintGoldSchedule = new MintGoldSchedule(true);
    goldToken.setGoldTokenMintingScheduleAddress(address(mintGoldSchedule));

    vm.prank(mintGoldOwner);
    mintGoldSchedule.initialize();
  }

  function test_ShouldSetAOwnerToMintGoldScheduleInstance() public {
    assertEq(mintGoldSchedule.owner(), mintGoldOwner);
  }

  function test_ShouldNotSetBeneficiariesToMintGoldScheduleInstance() public {
    assertEq(mintGoldSchedule.communityRewardFund(), address(0));
    assertEq(mintGoldSchedule.carbonOffsettingPartner(), address(0));
  }

  function test_ShouldHaveZeroTotalMintedByScheduleOnInit() public {
    assertEq(mintGoldSchedule.totalMintedBySchedule(), 0);
  }

  function test_ShouldNotSetTheL2StartTime() public {
    assertEq(mintGoldSchedule.l2StartTime(), 0);
  }
}

contract MintGoldScheduleTest_setDependencies_L1 is MintGoldScheduleTest {
  function setUp() public override {
    super.setUpL1();

    mintGoldSchedule = new MintGoldSchedule(true);
    mintGoldSchedule.initialize();
  }

  function test_Reverts_WhenCalledOnL1() public {
    vm.warp(block.timestamp + l2StartTime);
    vm.expectRevert("This method is not supported in L1.");
    mintGoldSchedule.activate(
      l2StartTime,
      communityRewardFraction,
      carbonOffsettingPartner,
      carbonOffsettingFraction,
      registryAddress
    );
  }
}
contract MintGoldScheduleTest_setDependencies is MintGoldScheduleTest {
  function test_ShouldHaveZeroTotalMintedByScheduleOnInit() public {
    newMintGold();
    assertEq(mintGoldSchedule.totalMintedBySchedule(), 0);
  }
  function test_ShouldUpdateDependencies() public {
    newMintGold();
    assertEq(mintGoldSchedule.l2StartTime(), l2StartTime);
    assertEq(mintGoldSchedule.totalSupplyAtL2Start(), L1_MINTED_GOLD_SUPPLY);
    assertEq(mintGoldSchedule.communityRewardFund(), address(governance));
    assertEq(mintGoldSchedule.carbonOffsettingPartner(), carbonOffsettingPartner);
    assertEq(mintGoldSchedule.getCarbonOffsettingFraction(), carbonOffsettingFraction);
    assertEq(mintGoldSchedule.getCommunityRewardFraction(), communityRewardFraction);
  }

  function test_Reverts_WhenRegistryIsTheNullAddress() public {
    vm.warp(block.timestamp + l2StartTime);
    mintGoldSchedule = new MintGoldSchedule(true);
    mintGoldSchedule.initialize();

    vm.expectRevert("The registry address cannot be the zero address");
    mintGoldSchedule.activate(
      l2StartTime,
      communityRewardFraction,
      carbonOffsettingPartner,
      carbonOffsettingFraction,
      address(0)
    );
  }

  function test_Reverts_WhenCommunityFractionIsZero() public {
    vm.warp(block.timestamp + l2StartTime);
    mintGoldSchedule = new MintGoldSchedule(true);
    mintGoldSchedule.initialize();

    vm.expectRevert(
      "Value must be different from existing community reward fraction and less than 1."
    );
    mintGoldSchedule.activate(
      l2StartTime,
      0,
      carbonOffsettingPartner,
      carbonOffsettingFraction,
      registryAddress
    );
  }

  function test_Reverts_WhenCarbonOffsettingPartnerIsNullAddress() public {
    vm.warp(block.timestamp + l2StartTime);
    mintGoldSchedule = new MintGoldSchedule(true);
    mintGoldSchedule.initialize();

    vm.expectRevert("Partner cannot be the zero address.");
    mintGoldSchedule.activate(
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
    mintGoldSchedule = new MintGoldSchedule(true);

    mintGoldSchedule.initialize();

    vm.expectRevert("identifier has no registry entry");
    mintGoldSchedule.activate(
      l2StartTime,
      communityRewardFraction,
      carbonOffsettingPartner,
      carbonOffsettingFraction,
      registryAddress
    );
  }

  function test_Reverts_WhenCalledTwice() public {
    newMintGold();
    vm.expectRevert("Contract has already been activated.");

    vm.prank(mintGoldOwner);

    mintGoldSchedule.activate(
      l2StartTime,
      communityRewardFraction,
      carbonOffsettingPartner,
      carbonOffsettingFraction,
      registryAddress
    );
  }
}

contract MintGoldScheduleTest_setCommunityRewardFraction is MintGoldScheduleTest {
  function setUp() public override {
    super.setUp();
    newMintGold();
  }
  function test_ShouldSetNewFraction() public {
    vm.prank(mintGoldOwner);
    mintGoldSchedule.setCommunityRewardFraction(newCommunityRewardFraction);
    assertEq(mintGoldSchedule.getCommunityRewardFraction(), newCommunityRewardFraction);
  }
  function test_Emits_CommunityRewardFractionSetEvent() public {
    vm.expectEmit(true, true, true, true);
    emit CommunityRewardFractionSet(newCommunityRewardFraction);
    vm.prank(mintGoldOwner);
    mintGoldSchedule.setCommunityRewardFraction(newCommunityRewardFraction);
  }
  function test_Reverts_WhenCalledByOtherThanOwner() public {
    vm.expectRevert("Ownable: caller is not the owner");
    vm.prank(randomAddress);
    mintGoldSchedule.setCommunityRewardFraction(newCommunityRewardFraction);
  }
  function test_Reverts_WhenFractionIsTheSame() public {
    vm.expectRevert(
      "Value must be different from existing community reward fraction and less than 1."
    );
    vm.prank(mintGoldOwner);
    mintGoldSchedule.setCommunityRewardFraction(communityRewardFraction);
  }
  function test_Reverts_WhenSumOfFractionsGtOne() public {
    vm.expectRevert("Sum of partner fractions must be less than or equal to 1.");
    vm.prank(mintGoldOwner);
    mintGoldSchedule.setCommunityRewardFraction((FIXED1 - 1));
  }
  function test_Reverts_WhenDependenciesNotSet() public {
    mintGoldSchedule = new MintGoldSchedule(true);

    goldToken.setGoldTokenMintingScheduleAddress(address(mintGoldSchedule));

    vm.prank(mintGoldOwner);
    mintGoldSchedule.initialize();

    vm.expectRevert("Minting schedule has not been activated.");
    vm.prank(mintGoldOwner);
    mintGoldSchedule.setCommunityRewardFraction(communityRewardFraction);
  }
  function test_Reverts_WhenFractionChangesAfter15Years() public {
    vm.warp(block.timestamp + (15 * YEAR + 4 * DAY));

    assertEq(mintGoldSchedule.totalMintedBySchedule(), 0, "Incorrect mintableAmount");

    vm.prank(randomAddress);
    mintGoldSchedule.mintAccordingToSchedule();

    vm.warp(block.timestamp + (15 * YEAR) + (4 * DAY));

    vm.expectRevert(
      "Can only update fraction once block reward calculation for years 15-30 has been implemented."
    );

    vm.prank(mintGoldOwner);
    mintGoldSchedule.setCommunityRewardFraction(((FIXED1 / 4) * 3));
  }
}

contract MintGoldScheduleTest_setCarbonOffsettingFund is MintGoldScheduleTest {
  function setUp() public override {
    super.setUp();
    newMintGold();
  }

  function test_ShouldSetNewPartner() public {
    vm.prank(mintGoldOwner);
    mintGoldSchedule.setCarbonOffsettingFund(newPartner, carbonOffsettingFraction);
    assertEq(mintGoldSchedule.carbonOffsettingPartner(), newPartner);
  }
  function test_ShouldSetNewFraction() public {
    vm.prank(mintGoldOwner);
    mintGoldSchedule.setCarbonOffsettingFund(carbonOffsettingPartner, newCarbonOffsettingFraction);
    assertEq(mintGoldSchedule.getCarbonOffsettingFraction(), newCarbonOffsettingFraction);
  }

  function test_Emits_CarbonOffsettingFundSetEvent() public {
    vm.expectEmit(true, true, true, true);
    emit CarbonOffsettingFundSet(newPartner, carbonOffsettingFraction);
    vm.prank(mintGoldOwner);
    mintGoldSchedule.setCarbonOffsettingFund(newPartner, carbonOffsettingFraction);
  }

  function test_Reverts_WhenCalledByOtherThanOwner() public {
    vm.expectRevert("Ownable: caller is not the owner");
    vm.prank(randomAddress);
    mintGoldSchedule.setCarbonOffsettingFund(newPartner, carbonOffsettingFraction);
  }

  function test_Reverts_WhenPartnerAndFractionAreTheSame() public {
    vm.expectRevert("Partner and value must be different from existing carbon offsetting fund.");
    vm.prank(mintGoldOwner);
    mintGoldSchedule.setCarbonOffsettingFund(carbonOffsettingPartner, carbonOffsettingFraction);
  }

  function test_Reverts_WhenSumOfFractionsGtOne() public {
    vm.expectRevert("Sum of partner fractions must be less than or equal to 1.");
    vm.prank(mintGoldOwner);
    mintGoldSchedule.setCarbonOffsettingFund(carbonOffsettingPartner, (FIXED1 - 1));
  }

  function test_Reverts_WhenDependenciesNotSet() public {
    mintGoldSchedule = new MintGoldSchedule(true);

    goldToken.setGoldTokenMintingScheduleAddress(address(mintGoldSchedule));

    vm.prank(mintGoldOwner);
    mintGoldSchedule.initialize();

    vm.expectRevert("Minting schedule has not been activated.");
    vm.prank(mintGoldOwner);
    mintGoldSchedule.setCarbonOffsettingFund(carbonOffsettingPartner, carbonOffsettingFraction);
  }

  function test_Reverts_WhenFractionChangesAfter15Years() public {
    vm.warp(block.timestamp + (15 * YEAR + 4 * DAY));

    assertEq(mintGoldSchedule.totalMintedBySchedule(), 0, "Incorrect mintableAmount");

    vm.prank(randomAddress);
    mintGoldSchedule.mintAccordingToSchedule();

    vm.warp(block.timestamp + (15 * YEAR) + (4 * DAY));

    vm.expectRevert(
      "Can only update fraction once block reward calculation for years 15-30 has been implemented."
    );

    vm.prank(mintGoldOwner);
    mintGoldSchedule.setCarbonOffsettingFund(carbonOffsettingPartner, ((FIXED1 / 4) * 3));
  }
}

contract MintGoldScheduleTest_mintAccordingToSchedule_L1 is MintGoldScheduleTest {
  uint256 initialMintGoldAmount;

  function setUp() public override {
    super.setUpL1();

    mintGoldSchedule = new MintGoldSchedule(true);
    mintGoldSchedule.initialize();
  }

  function test_Reverts_WhenMintingOnL1() public {
    vm.warp(block.timestamp + 3 * MONTH + 1 * DAY);

    vm.expectRevert("This method is not supported in L1.");
    vm.prank(randomAddress);
    mintGoldSchedule.mintAccordingToSchedule();
  }
}

contract MintGoldScheduleTest_mintAccordingToSchedule is MintGoldScheduleTest {
  uint256 initialMintGoldAmount;
  uint256 mintPerPeriod;

  function setUp() public override {
    super.setUp();

    newMintGold();
  }

  function test_Reverts_WhenDependenciesAreNotSet() public {
    mintGoldSchedule = new MintGoldSchedule(true);

    vm.prank(mintGoldOwner);
    mintGoldSchedule.initialize();

    vm.expectRevert("Minting schedule has not been activated.");
    vm.prank(randomAddress);
    mintGoldSchedule.mintAccordingToSchedule();
  }

  function test_ShouldAllowMintingAsSoon1SecondAfterSettingDependencies() public {
    uint256 communityFundBalanceBefore = goldToken.balanceOf(address(governance));
    vm.prank(randomAddress);
    mintGoldSchedule.mintAccordingToSchedule();
    uint256 communityFundBalanceAfter = goldToken.balanceOf(address(governance));
    assertGt(communityFundBalanceAfter, communityFundBalanceBefore);
  }

  function test_Reverts_WhenMintableAmountIsZero() public {
    vm.prank(randomAddress);
    mintGoldSchedule.mintAccordingToSchedule();

    vm.expectRevert("Mintable amount must be greater than zero");
    vm.prank(randomAddress);
    mintGoldSchedule.mintAccordingToSchedule();
  }

  function test_ShouldAllowToMint25Percent2years9MonthsPostL2Launch() public {
    vm.warp(block.timestamp + 2 * YEAR + 267 * DAY + 63868); // 25% time since L2

    uint256 expectedMintedAmount = (L2_FIFTEEN_YEAR_GOLD_SUPPLY - L1_MINTED_GOLD_SUPPLY) / 4;

    vm.prank(randomAddress);
    mintGoldSchedule.mintAccordingToSchedule();

    assertApproxEqRel(mintGoldSchedule.totalMintedBySchedule(), expectedMintedAmount, 1e10);
  }

  function test_ShouldAllowToMint50Percent5AndHalfYearsPostL2Launch() public {
    vm.warp(block.timestamp + (5 * YEAR) + (170 * DAY) + 41338);

    uint256 expectedMintedAmount = (L2_FIFTEEN_YEAR_GOLD_SUPPLY - L1_MINTED_GOLD_SUPPLY) / 2;
    vm.prank(randomAddress);
    mintGoldSchedule.mintAccordingToSchedule();

    assertApproxEqRel(mintGoldSchedule.totalMintedBySchedule(), expectedMintedAmount, 1e10);
  }

  function test_ShouldAllowToMint75Percent11YearsAnd3MonthsPostL2Launch() public {
    vm.warp(block.timestamp + 8 * YEAR + 73 * DAY + 18807);

    uint256 expectedMintedAmount = ((L2_FIFTEEN_YEAR_GOLD_SUPPLY - L1_MINTED_GOLD_SUPPLY) / 4) * 3;

    vm.prank(randomAddress);
    mintGoldSchedule.mintAccordingToSchedule();

    assertApproxEqRel(mintGoldSchedule.totalMintedBySchedule(), expectedMintedAmount, 1e10);
  }

  function test_ShouldAllowToMint100Percent11YearsPostL2Launch() public {
    uint256 communityFundBalanceBefore = goldToken.balanceOf(address(governance));
    uint256 carbonOffsettingPartnerBalanceBefore = goldToken.balanceOf(carbonOffsettingPartner);
    vm.warp(block.timestamp + (11 * YEAR));

    vm.prank(randomAddress);
    mintGoldSchedule.mintAccordingToSchedule();

    assertApproxEqRel(
      mintGoldSchedule.totalMintedBySchedule(),
      MAX_L2_COMMUNITY_DISTRIBUTION + MAX_L2_CARBON_FUND_DISTRIBUTION,
      1e10
    );

    uint256 communityFundBalanceAfter = goldToken.balanceOf(address(governance));
    uint256 carbonOffsettingPartnerBalanceAfter = goldToken.balanceOf(carbonOffsettingPartner);

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

    assertEq(mintGoldSchedule.totalMintedBySchedule(), 0, "Incorrect mintableAmount");

    vm.prank(randomAddress);
    mintGoldSchedule.mintAccordingToSchedule();

    assertApproxEqRel(
      mintGoldSchedule.totalMintedBySchedule(),
      MAX_L2_COMMUNITY_DISTRIBUTION + MAX_L2_CARBON_FUND_DISTRIBUTION,
      1e10
    );
  }

  function test_Reverts_WhenMintingSecondTimeAfter15Years() public {
    vm.warp(block.timestamp + (15 * YEAR) + (1 * DAY));

    vm.prank(randomAddress);
    mintGoldSchedule.mintAccordingToSchedule();

    assertApproxEqRel(
      mintGoldSchedule.totalMintedBySchedule(),
      MAX_L2_COMMUNITY_DISTRIBUTION + MAX_L2_CARBON_FUND_DISTRIBUTION,
      1e10
    );

    vm.expectRevert("Block reward calculation for years 15-30 unimplemented");

    vm.prank(randomAddress);
    mintGoldSchedule.mintAccordingToSchedule();
  }
}

contract MintGoldScheduleTest_getMintableAmount is MintGoldScheduleTest {
  uint256 initialMintGoldAmount;

  function setUp() public override {
    super.setUp();

    newMintGold();
  }

  function test_ShouldReturnFullAmountAvailableForThisReleasePeriod() public {
    vm.warp(block.timestamp + 1 * DAY);
    assertApproxEqRel(mintGoldSchedule.getMintableAmount(), DAILY_MINT_AMOUNT_LOWER, 1e10);
  }

  function test_ShouldReturnOnlyAmountNotYetMinted() public {
    vm.warp(block.timestamp + 1 * DAY);
    vm.prank(randomAddress);
    mintGoldSchedule.mintAccordingToSchedule();

    vm.warp(block.timestamp + 1 * DAY + 1);
    assertApproxEqRel(mintGoldSchedule.getMintableAmount(), DAILY_MINT_AMOUNT_LOWER, 1e10);
  }

  function test_ShouldReturnOnlyUpToMaxL2DistributionBeforeItIsMinted() public {
    vm.warp(block.timestamp + 16 * YEAR);
    assertApproxEqRel(
      mintGoldSchedule.getMintableAmount(),
      MAX_L2_COMMUNITY_DISTRIBUTION + MAX_L2_CARBON_FUND_DISTRIBUTION,
      1e10
    );
  }

  function test_Reverts_When15YearsHavePassedAndAllLinearScheduleHaseBeenReleased() public {
    vm.warp(block.timestamp + 15 * YEAR);

    vm.prank(randomAddress);
    mintGoldSchedule.mintAccordingToSchedule();
    vm.expectRevert("Block reward calculation for years 15-30 unimplemented");
    mintGoldSchedule.getMintableAmount();
  }

  function test_Reverts_WhenDependenciesNotSet() public {
    mintGoldSchedule = new MintGoldSchedule(true);

    vm.prank(mintGoldOwner);
    mintGoldSchedule.initialize();

    vm.expectRevert("Minting schedule has not been activated.");

    mintGoldSchedule.getMintableAmount();
  }
}
