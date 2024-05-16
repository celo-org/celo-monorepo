// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.5.13;
pragma experimental ABIEncoderV2;

import "celo-foundry/Test.sol";
import "../../contracts/common/FixidityLib.sol";
import "../../contracts/common/Registry.sol";
import "../../contracts/common/Freezer.sol";
import "../../contracts/common/GoldToken.sol";
import "../../contracts/common/MintGoldSchedule.sol";
import "../../contracts/governance/Governance.sol";
import "../../contracts/stability/test/MockStableToken.sol";
import "@test-sol/utils/ECDSAHelper.sol";
import { Constants } from "@test-sol/constants.sol";
import "../../contracts-0.8/common/IsL2Check.sol";

// XXX(soloseng): add L1 test.
contract MintGoldScheduleMockTunnel is ForgeTest {
  struct InitParams {
    uint256 _communityRewardFraction;
    address _carbonOffsettingPartner;
    uint256 _carbonOffsettingFraction;
    address _mintGoldOwner;
    address registryAddress;
  }

  address payable mintGoldScheduleContractAddress;
  MintGoldSchedule private mintGoldScheduleTunnel;

  constructor(address _mintGoldContractAddress) public {
    mintGoldScheduleContractAddress = address(uint160(_mintGoldContractAddress));
    mintGoldScheduleTunnel = MintGoldSchedule(mintGoldScheduleContractAddress);
  }

  function MockInitialize(
    address sender,
    InitParams calldata params
  ) external returns (bool, bytes memory) {
    bytes4 selector = bytes4(keccak256("initialize(uint256,address,uint256,address,address)"));

    bytes memory dataFirstHalf;
    {
      // Encode the first half of the parameters
      dataFirstHalf = abi.encode(
        params._communityRewardFraction,
        params._carbonOffsettingPartner,
        params._carbonOffsettingFraction,
        params._mintGoldOwner,
        params.registryAddress
      );
    }

    // Concatenate the selector, first half, and second half
    bytes memory data = abi.encodePacked(selector, dataFirstHalf);

    vm.prank(sender);
    (bool success, ) = address(mintGoldScheduleTunnel).call(data);
    require(success, "unsuccessful tunnel call");
  }
}

contract MintGoldScheduleTest is Test, ECDSAHelper, Constants, IsL2Check {
  using FixidityLib for FixidityLib.Fraction;

  Registry registry;
  GoldToken goldToken;
  Governance governance;

  MintGoldSchedule mintGoldSchedule;
  MintGoldSchedule mintGoldSchedule2;

  address owner = address(this);

  address registryAddress;
  address goldTokenOwner = actor("goldTokenOwner");
  address governanceOwner = actor("governanceOwner");
  address mintGoldOwner = actor("mintGoldOwner");
  address communityRewardFund = actor("communityRewardFund");
  address carbonOffsettingPartner = actor("carbonOffsettingPartner");

  address newBeneficiary = actor("newBeneficiary");
  address randomAddress = actor("randomAddress");

  address constant l1RegistryAddress = 0x000000000000000000000000000000000000ce10;

  uint256 constant DAILY_MINT_AMOUNT_UPPER = 6749 ether; // 6,749 Gold
  uint256 constant DAILY_MINT_AMOUNT_LOWER = 6748 ether; // 6,748 Gold

  uint256 constant GENESIS_GOLD_SUPPLY = 600000000 ether; // 600 million Gold
  uint256 constant L1_MINTED_GOLD_SUPPLY = 692702432463315819704447326; // as of May 15 2024
  uint256 constant FIFTEEN_YEAR_GOLD_SUPPLY = 800000000 ether; // 800 million Gold

  uint256 constant MAX_L2_DISTRIBUTION = FIFTEEN_YEAR_GOLD_SUPPLY - L1_MINTED_GOLD_SUPPLY; // 107.2 million Gold

  uint256 constant MAX_L2_COMMUNITY_DISTRIBUTION = MAX_L2_DISTRIBUTION / 4; // 26.8 million Gold

  uint256 constant MAX_L2_CARBON_FUND_DISTRIBUTION = MAX_L2_DISTRIBUTION / 1000; // 107,297 Gold

  uint256 constant L2_FIFTEEN_YEAR_GOLD_SUPPLY =
    L1_MINTED_GOLD_SUPPLY + MAX_L2_COMMUNITY_DISTRIBUTION + MAX_L2_CARBON_FUND_DISTRIBUTION;

  uint256 constant MINUTE = 60;
  uint256 constant HOUR = 60 * MINUTE;
  uint256 constant DAY = 24 * HOUR;
  uint256 constant MONTH = 30 * DAY;
  uint256 constant YEAR = 365 * DAY;

  uint256 constant communityRewardFraction = FIXED1 / 4; // 25%
  uint256 constant carbonOffsettingFraction = FIXED1 / 1000; // 0.1%
  uint256 constant newCommunityRewardFraction = FIXED1 / 2; // 50%
  uint256 constant newCarbonOffsettingFraction = FIXED1 / 500; // 0.2%

  MintGoldScheduleMockTunnel.InitParams initParams;

  event CommunityRewardFractionSet(uint256 fraction);
  event CarbonOffsettingFundSet(address indexed partner, uint256 fraction);

  function setUp() public {
    setUpL1();

    // Setup L2 after minting L1 supply.
    registryAddress = proxyAdminAddress;
    deployCodeTo("Registry.sol", abi.encode(false), registryAddress);
    registry = Registry(registryAddress);

    registry.setAddressFor("GoldToken", address(goldToken));
    registry.setAddressFor("Governance", address(governance));

    vm.prank(goldTokenOwner);
    goldToken.setRegistry(registryAddress);

    initParams = MintGoldScheduleMockTunnel.InitParams({
      _communityRewardFraction: communityRewardFraction,
      _carbonOffsettingPartner: carbonOffsettingPartner,
      _carbonOffsettingFraction: carbonOffsettingFraction,
      _mintGoldOwner: mintGoldOwner,
      registryAddress: registryAddress
    });
  }

  function setUpL1() public {
    registryAddress = l1RegistryAddress;

    deployCodeTo("Registry.sol", abi.encode(false), registryAddress);
    registry = Registry(registryAddress);

    vm.prank(goldTokenOwner);
    goldToken = new GoldToken(true);
    vm.prank(governanceOwner);
    governance = new Governance(true);

    registry.setAddressFor("GoldToken", address(goldToken));
    registry.setAddressFor("Governance", address(governance));

    vm.prank(goldTokenOwner);
    goldToken.initialize(registryAddress);

    // Mint L1 supply
    vm.prank(address(0));
    goldToken.mint(randomAddress, L1_MINTED_GOLD_SUPPLY);
  }

  function newMintGold() internal returns (MintGoldSchedule) {
    // warp to scheduled L2 start time.
    vm.warp(block.timestamp + 1715808537); // Arbitary later date (May 15 2024)
    mintGoldSchedule = new MintGoldSchedule(true);

    vm.prank(goldTokenOwner);
    goldToken.setGoldTokenMintingScheduleAddress(address(mintGoldSchedule));
    MintGoldScheduleMockTunnel tunnel = new MintGoldScheduleMockTunnel(address(mintGoldSchedule));

    tunnel.MockInitialize(owner, initParams);
  }
}

contract MintGoldScheduleTest_initialize_L1 is MintGoldScheduleTest {
  uint256 initialMintGoldAmount;

  function setUp() public {
    super.setUpL1();
    initParams = MintGoldScheduleMockTunnel.InitParams({
      _communityRewardFraction: communityRewardFraction,
      _carbonOffsettingPartner: carbonOffsettingPartner,
      _carbonOffsettingFraction: carbonOffsettingFraction,
      _mintGoldOwner: mintGoldOwner,
      registryAddress: registryAddress
    });
  }

  function test_Reverts_WhenInitializingOnL1() public {
    vm.warp(block.timestamp + 1715808537); // Arbitary later date (May 15 2024)
    mintGoldSchedule = new MintGoldSchedule(true);

    vm.prank(goldTokenOwner);
    goldToken.setGoldTokenMintingScheduleAddress(address(mintGoldSchedule));
    MintGoldScheduleMockTunnel tunnel = new MintGoldScheduleMockTunnel(address(mintGoldSchedule));
    vm.expectRevert();
    tunnel.MockInitialize(owner, initParams);
  }
}
contract MintGoldScheduleTest_Initialize is MintGoldScheduleTest {
  function test_ShouldSetBeneficiariesToMintGoldScheduleInstance() public {
    newMintGold();
    assertEq(mintGoldSchedule.communityRewardFund(), address(governance));
    assertEq(mintGoldSchedule.carbonOffsettingPartner(), initParams._carbonOffsettingPartner);
  }

  function test_ShouldSetAOwnerToMintGoldScheduleInstance() public {
    newMintGold();
    assertEq(mintGoldSchedule.owner(), initParams._mintGoldOwner);
  }

  function test_ShouldHaveZeroTotalMintedByScheduleOnInit() public {
    newMintGold();
    assertEq(mintGoldSchedule.totalMinted(), 0);
  }

  function test_Reverts_WhenRegistryIsTheNullAddress() public {
    mintGoldSchedule = new MintGoldSchedule(true);
    initParams.registryAddress = address(0);
    MintGoldScheduleMockTunnel tunnel = new MintGoldScheduleMockTunnel(address(mintGoldSchedule));
    vm.expectRevert("unsuccessful tunnel call");
    tunnel.MockInitialize(owner, initParams);
  }
  function test_Reverts_WhenMintGoldBeneficiaryIsTheNullAddress() public {
    mintGoldSchedule = new MintGoldSchedule(true);
    initParams._communityRewardFraction = 0;
    MintGoldScheduleMockTunnel tunnel = new MintGoldScheduleMockTunnel(address(mintGoldSchedule));
    vm.expectRevert("unsuccessful tunnel call");
    tunnel.MockInitialize(owner, initParams);
  }
}

contract MintGoldScheduleTest_setCommunityRewardFraction is MintGoldScheduleTest {
  function setUp() public {
    super.setUp();
    newMintGold();
  }
  function test_ShouldSetNewFraction() public {
    vm.prank(mintGoldOwner);
    mintGoldSchedule.setCommunityRewardFraction(newCommunityRewardFraction);
    assertEq(mintGoldSchedule.getCommunityRewardFraction(), newCommunityRewardFraction);
  }
  function test_Emits_BeneficiarySetEvent() public {
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
}

contract MintGoldScheduleTest_setCarbonOffsettingFund is MintGoldScheduleTest {
  function setUp() public {
    super.setUp();
    newMintGold();
  }

  function test_ShouldSetNewBeneficiary() public {
    vm.prank(mintGoldOwner);
    mintGoldSchedule.setCarbonOffsettingFund(newBeneficiary, carbonOffsettingFraction);
    assertEq(mintGoldSchedule.carbonOffsettingPartner(), newBeneficiary);
  }
  function test_ShouldSetNewFraction() public {
    vm.prank(mintGoldOwner);
    mintGoldSchedule.setCarbonOffsettingFund(carbonOffsettingPartner, newCarbonOffsettingFraction);
    assertEq(mintGoldSchedule.getCarbonOffsettingFraction(), newCarbonOffsettingFraction);
  }

  function test_Reverts_WhenCalledByOtherThanOwner() public {
    vm.expectRevert("Ownable: caller is not the owner");
    vm.prank(randomAddress);
    mintGoldSchedule.setCarbonOffsettingFund(newBeneficiary, carbonOffsettingFraction);
  }

  function test_Reverts_WhenPartnerAndFractionAreTheSame() public {
    vm.expectRevert("Partner and value must be different from existing carbon offsetting fund.");
    vm.prank(mintGoldOwner);
    mintGoldSchedule.setCarbonOffsettingFund(carbonOffsettingPartner, carbonOffsettingFraction);
  }

  function test_Emits_BeneficiarySetEvent() public {
    vm.expectEmit(true, true, true, true);
    emit CarbonOffsettingFundSet(newBeneficiary, carbonOffsettingFraction);
    vm.prank(mintGoldOwner);
    mintGoldSchedule.setCarbonOffsettingFund(newBeneficiary, carbonOffsettingFraction);
  }
}

contract MintGoldScheduleTest_MintAccordingToSchedule is MintGoldScheduleTest {
  uint256 initialMintGoldAmount;
  uint256 mintPerPeriod;

  function setUp() public {
    super.setUp();

    newMintGold();
    vm.warp(block.timestamp + 1);
  }

  function test_ShouldAllowMintingAsSoon1SecondAfterDeployement() public {
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

    assertEq(mintGoldSchedule.totalMinted(), expectedMintedAmount, "Incorrect mintableAmount");
  }

  function test_ShouldAllowToMint50Percent5AndHalfYearsPostL2Launch() public {
    vm.warp(block.timestamp + (5 * YEAR) + (170 * DAY) + 41338);

    uint256 expectedMintedAmountUpper = ((L2_FIFTEEN_YEAR_GOLD_SUPPLY - L1_MINTED_GOLD_SUPPLY) /
      2) + 1 ether;
    uint256 expectedMintedAmountLower = (L2_FIFTEEN_YEAR_GOLD_SUPPLY - L1_MINTED_GOLD_SUPPLY) / 2;
    vm.prank(randomAddress);
    mintGoldSchedule.mintAccordingToSchedule();

    assertLe(mintGoldSchedule.totalMinted(), expectedMintedAmountUpper, "Incorrect mintableAmount");
    assertGe(mintGoldSchedule.totalMinted(), expectedMintedAmountLower, "Incorrect mintableAmount");
  }

  function test_ShouldAllowToMint75Percent11YearsAnd3MonthsPostL2Launch() public {
    vm.warp(block.timestamp + 8 * YEAR + 73 * DAY + 18807);

    uint256 expectedMintedAmountUpper = (((L2_FIFTEEN_YEAR_GOLD_SUPPLY - L1_MINTED_GOLD_SUPPLY) /
      4) * 3) + 1 ether;
    uint256 expectedMintedAmountLower = ((L2_FIFTEEN_YEAR_GOLD_SUPPLY - L1_MINTED_GOLD_SUPPLY) /
      4) * 3;

    vm.prank(randomAddress);
    mintGoldSchedule.mintAccordingToSchedule();

    assertLe(mintGoldSchedule.totalMinted(), expectedMintedAmountUpper, "Incorrect mintableAmount");
    assertGe(mintGoldSchedule.totalMinted(), expectedMintedAmountLower, "Incorrect mintableAmount");
  }

  function test_ShouldAllowToMint100Percent11YearsPostL2Launch() public {
    uint256 communityFundBalanceBefore = goldToken.balanceOf(address(governance));
    uint256 carbonOffsettingPartnerBalanceBefore = goldToken.balanceOf(
      initParams._carbonOffsettingPartner
    );
    vm.warp(block.timestamp + (11 * YEAR));

    vm.prank(randomAddress);
    mintGoldSchedule.mintAccordingToSchedule();

    assertLe(
      mintGoldSchedule.totalMinted(),
      MAX_L2_COMMUNITY_DISTRIBUTION + MAX_L2_CARBON_FUND_DISTRIBUTION,
      "Incorrect mintableAmount"
    );
    assertGe(
      mintGoldSchedule.totalMinted(),
      MAX_L2_COMMUNITY_DISTRIBUTION + MAX_L2_CARBON_FUND_DISTRIBUTION - 1 ether,
      "Incorrect mintableAmount"
    );

    uint256 communityFundBalanceAfter = goldToken.balanceOf(address(governance));
    uint256 carbonOffsettingPartnerBalanceAfter = goldToken.balanceOf(
      initParams._carbonOffsettingPartner
    );

    assertLe(communityFundBalanceAfter - communityFundBalanceBefore, MAX_L2_COMMUNITY_DISTRIBUTION);
    assertGe(
      communityFundBalanceAfter - communityFundBalanceBefore,
      MAX_L2_COMMUNITY_DISTRIBUTION - 1 ether
    );

    assertLe(
      carbonOffsettingPartnerBalanceAfter - carbonOffsettingPartnerBalanceBefore,
      MAX_L2_CARBON_FUND_DISTRIBUTION
    );
    assertGe(
      carbonOffsettingPartnerBalanceAfter - carbonOffsettingPartnerBalanceBefore,
      MAX_L2_CARBON_FUND_DISTRIBUTION - 1 ether
    );
  }

  function test_Reverts_WhenSumOfPartnerFractionGreaterThan1() public {
    vm.prank(mintGoldOwner);

    mintGoldSchedule.setCarbonOffsettingFund(carbonOffsettingPartner, ((FIXED1 / 4) * 3));

    vm.expectRevert("Sum of partner fractions must be less than 1.");
    vm.prank(randomAddress);
    mintGoldSchedule.mintAccordingToSchedule();
  }
  function test_ShouldMintUpToLinearSuppplyAfter15Years() public {
    vm.warp(block.timestamp + (15 * YEAR) + (1 * DAY));

    assertEq(mintGoldSchedule.totalMinted(), 0, "Incorrect mintableAmount");

    vm.prank(randomAddress);
    mintGoldSchedule.mintAccordingToSchedule();

    assertGe(
      mintGoldSchedule.totalMinted(),
      MAX_L2_COMMUNITY_DISTRIBUTION + MAX_L2_CARBON_FUND_DISTRIBUTION - 1 ether,
      "Incorrect mintableAmount"
    );
    assertLe(
      mintGoldSchedule.totalMinted(),
      MAX_L2_COMMUNITY_DISTRIBUTION + MAX_L2_CARBON_FUND_DISTRIBUTION,
      "Incorrect mintableAmount"
    );
  }

  function test_Reverts_WhenMintingSecondTimeAfter15Years() public {
    vm.warp(block.timestamp + (15 * YEAR) + (1 * DAY));

    vm.prank(randomAddress);
    mintGoldSchedule.mintAccordingToSchedule();

    assertGe(
      mintGoldSchedule.totalMinted(),
      MAX_L2_COMMUNITY_DISTRIBUTION + MAX_L2_CARBON_FUND_DISTRIBUTION - 1 ether,
      "Incorrect mintableAmount"
    );
    assertLe(
      mintGoldSchedule.totalMinted(),
      MAX_L2_COMMUNITY_DISTRIBUTION + MAX_L2_CARBON_FUND_DISTRIBUTION,
      "Incorrect mintableAmount"
    );

    vm.expectRevert("Block reward calculation for years 15-30 unimplemented");

    vm.prank(randomAddress);
    mintGoldSchedule.mintAccordingToSchedule();
  }
}

contract MintGoldScheduleTest_GetMintableAmount is MintGoldScheduleTest {
  uint256 initialMintGoldAmount;

  function setUp() public {
    super.setUp();

    newMintGold();
  }

  function test_ShouldReturnFullAmountAvailableForThisReleasePeriod() public {
    vm.prank(mintGoldOwner);

    vm.warp(block.timestamp + 1 * DAY);
    assertGe(mintGoldSchedule.getMintableAmount(), DAILY_MINT_AMOUNT_LOWER); //6748178479252521135373
    assertLe(mintGoldSchedule.getMintableAmount(), DAILY_MINT_AMOUNT_UPPER);
  }

  function test_ShouldReturnOnlyAmountNotYetMinted() public {
    vm.warp(block.timestamp + 1 * DAY);
    vm.prank(randomAddress);
    mintGoldSchedule.mintAccordingToSchedule();

    vm.warp(block.timestamp + 1 * DAY);
    assertGe(mintGoldSchedule.getMintableAmount(), DAILY_MINT_AMOUNT_LOWER);
    assertLe(mintGoldSchedule.getMintableAmount(), DAILY_MINT_AMOUNT_UPPER);
  }

  function test_ShouldReturnOnlyUpToMaxL2DistributionBeforeItIsMinted() public {
    vm.warp(block.timestamp + 16 * YEAR);

    assertGe(
      mintGoldSchedule.getMintableAmount(),
      MAX_L2_COMMUNITY_DISTRIBUTION + MAX_L2_CARBON_FUND_DISTRIBUTION - 1 ether,
      "Incorrect mintableAmount"
    );
    assertLe(
      mintGoldSchedule.getMintableAmount(),
      MAX_L2_COMMUNITY_DISTRIBUTION + MAX_L2_CARBON_FUND_DISTRIBUTION,
      "Incorrect mintableAmount"
    );
  }

  function test_Reverts_When15YearsHavePassedAndAllLinearScheduleHaseBeenReleased() public {
    vm.warp(block.timestamp + 15 * YEAR);

    vm.prank(randomAddress);
    mintGoldSchedule.mintAccordingToSchedule();
    vm.expectRevert("Block reward calculation for years 15-30 unimplemented");
    mintGoldSchedule.getMintableAmount();
  }
}
