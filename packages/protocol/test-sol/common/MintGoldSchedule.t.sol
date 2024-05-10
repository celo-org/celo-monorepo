// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.5.13;
pragma experimental ABIEncoderV2;

import "celo-foundry/Test.sol";
import "../../contracts/common/FixidityLib.sol";
import "../../contracts/common/Registry.sol";
import "../../contracts/common/Freezer.sol";
import "../../contracts/common/GoldToken.sol";
import "../../contracts/common/MintGoldSchedule.sol";
import "../../contracts/stability/test/MockStableToken.sol";
import "@test-sol/utils/ECDSAHelper.sol";
import "../../contracts-0.8/common/IsL2Check.sol";

// XXX(soloseng): add L1 test.
contract MintGoldScheduleMockTunnel is ForgeTest {
  struct InitParams {
    uint256 mintStartTime;
    uint256 mintCliffTime;
    uint256 numMintingPeriods;
    uint256 mintingPeriod;
    uint256 _totalAmountToMint;
    address payable _beneficiary;
    address _mintGoldOwner;
    uint256 initialDistributionRatio;
    address registryAddress;
  }

  address payable mintGoldScheduleContractAddress;
  MintGoldSchedule private mintGoldScheduleTunnel;

  constructor(address _mintGoldContractAddress) public {
    mintGoldScheduleContractAddress = address(uint160(_mintGoldContractAddress));
    mintGoldScheduleTunnel = MintGoldSchedule(mintGoldScheduleContractAddress);
  }

  function MockInitialize(address sender, InitParams calldata params)
    external
    returns (bool, bytes memory)
  {
    bytes4 selector = bytes4(
      keccak256(
        "initialize(uint256,uint256,uint256,uint256,uint256,address,address,uint256,address)"
      )
    );

    bytes memory dataFirstHalf;
    {
      // Encode the first half of the parameters
      dataFirstHalf = abi.encode(
        params.mintStartTime,
        params.mintCliffTime,
        params.numMintingPeriods,
        params.mintingPeriod,
        params._totalAmountToMint,
        params._beneficiary,
        params._mintGoldOwner,
        params.initialDistributionRatio,
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

contract MintGoldScheduleTest is Test, ECDSAHelper, IsL2Check {
  using FixidityLib for FixidityLib.Fraction;

  Registry registry;
  GoldToken goldToken;

  MintGoldSchedule mintGoldSchedule;
  MintGoldSchedule mintGoldSchedule2;

  address owner = address(this);

  address registryAddress;
  address goldTokenOwner = actor("goldTokenOwner");
  address mintGoldOwner = actor("mintGoldOwner");
  address beneficiary = actor("beneficiary");
  address newBeneficiary = actor("newBeneficiary");
  address randomAddress = actor("randomAddress");

  address constant l1RegistryAddress = 0x000000000000000000000000000000000000ce10;

  // uint256 constant TOTAL_AMOUNT = 10 ether;
  uint256 constant TOTAL_AMOUNT = 600000000 ether;
  uint256 constant MINUTE = 60;
  uint256 constant HOUR = 60 * MINUTE;
  uint256 constant DAY = 24 * HOUR;
  uint256 constant MONTH = 30 * DAY;
  uint256 constant YEAR = 365 * DAY;

  MintGoldScheduleMockTunnel.InitParams initParams;

  event MintGoldInstanceCreated(address indexed beneficiary, address indexed atAddress);
  event MintGoldInstanceDestroyed(address indexed contractAddress);
  event DistributionLimitSet(address indexed beneficiary, uint256 maxDistribution);
  event BeneficiarySet(address indexed beneficiary);

  function setUp() public {
    registryAddress = proxyAdminAddress;

    deployCodeTo("Registry.sol", abi.encode(false), registryAddress);
    registry = Registry(registryAddress);

    vm.prank(goldTokenOwner);
    goldToken = new GoldToken(true);

    registry.setAddressFor("GoldToken", address(goldToken));

    vm.prank(goldTokenOwner);
    goldToken.initialize(registryAddress);

    initParams = MintGoldScheduleMockTunnel.InitParams({
      mintStartTime: block.timestamp + 5 * MINUTE,
      mintCliffTime: 1 * HOUR,
      numMintingPeriods: 5475,
      mintingPeriod: 1 * DAY,
      _totalAmountToMint: TOTAL_AMOUNT,
      _beneficiary: address(uint160(beneficiary)),
      _mintGoldOwner: mintGoldOwner,
      initialDistributionRatio: 1000,
      registryAddress: registryAddress
    });

    vm.deal(randomAddress, 1000 ether);
  }

  function newMintGold(bool startReleasing) internal returns (MintGoldSchedule) {
    mintGoldSchedule = new MintGoldSchedule(true);

    vm.prank(goldTokenOwner);
    goldToken.setGoldTokenMintingScheduleAddress(address(mintGoldSchedule));
    MintGoldScheduleMockTunnel tunnel = new MintGoldScheduleMockTunnel(address(mintGoldSchedule));

    tunnel.MockInitialize(owner, initParams);

    if (startReleasing) {
      vm.warp(block.timestamp + initParams.mintCliffTime + initParams.mintingPeriod + 1);
    }
  }
}

contract MintGoldScheduleTest_Initialize is MintGoldScheduleTest {
  uint256 public maxUint256 = 0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF;

  function test_ShouldSetABeneficiaryToMintGoldScheduleInstance() public {
    newMintGold(false);
    assertEq(mintGoldSchedule.beneficiary(), initParams._beneficiary);
  }

  function test_ShouldSetAReleaseOwnerToMintGoldScheduleInstance() public {
    newMintGold(false);
    assertEq(mintGoldSchedule.owner(), initParams._mintGoldOwner);
  }

  function test_ShouldSetMintGoldScheduleNumberOfPeriods() public {
    newMintGold(false);
    (, , uint256 mintGoldNumPeriods, ) = mintGoldSchedule.mintingSchedule();
    assertEq(mintGoldNumPeriods, initParams.numMintingPeriods);
  }

  function test_ShouldSetTotalAmountToMint() public {
    newMintGold(false);

    assertEq(mintGoldSchedule.totalAmountToMint(), initParams._totalAmountToMint);
  }

  function test_ShouldSetMintGoldSchedulePeriod() public {
    newMintGold(false);
    (, , , uint256 mintGoldPeriod) = mintGoldSchedule.mintingSchedule();
    assertEq(mintGoldPeriod, initParams.mintingPeriod);
  }

  function test_ShouldSetMintGoldStartTime() public {
    newMintGold(false);
    (uint256 mintGoldStartTime, , , ) = mintGoldSchedule.mintingSchedule();
    assertEq(mintGoldStartTime, initParams.mintStartTime);
  }

  function test_ShouldSetMintGoldScheduleCliffTime() public {
    newMintGold(false);
    (, uint256 mintGoldCliffTime, , ) = mintGoldSchedule.mintingSchedule();
    uint256 expectedCliffTime = initParams.mintStartTime + initParams.mintCliffTime;
    assertEq(mintGoldCliffTime, expectedCliffTime);
  }

  function test_ShouldSetReleaseOwnerToMintGoldScheduleInstance() public {
    newMintGold(false);
    assertEq(mintGoldSchedule.owner(), initParams._mintGoldOwner);
  }

  function test_ShouldHaveZeroTotalMintedOnInit() public {
    newMintGold(false);
    assertEq(mintGoldSchedule.totalMinted(), 0);
  }

  function test_Reverts_WhenMintGoldBeneficiaryIsTheNullAddress() public {
    mintGoldSchedule = new MintGoldSchedule(true);
    initParams._beneficiary = address(0);
    MintGoldScheduleMockTunnel tunnel = new MintGoldScheduleMockTunnel(address(mintGoldSchedule));
    vm.expectRevert("unsuccessful tunnel call");
    tunnel.MockInitialize(owner, initParams);
  }

  function test_Reverts_WhenMintGoldPeriodsAreZero() public {
    mintGoldSchedule2 = new MintGoldSchedule(true);
    initParams.numMintingPeriods = 0;
    MintGoldScheduleMockTunnel tunnel = new MintGoldScheduleMockTunnel(address(mintGoldSchedule2));
    vm.expectRevert("unsuccessful tunnel call");
    tunnel.MockInitialize(owner, initParams);
  }

  function test_Reverts_WhenTotalAmountToMintIsZero() public {
    mintGoldSchedule2 = new MintGoldSchedule(true);
    initParams._totalAmountToMint = 0;
    MintGoldScheduleMockTunnel tunnel = new MintGoldScheduleMockTunnel(address(mintGoldSchedule2));
    vm.expectRevert("unsuccessful tunnel call");
    tunnel.MockInitialize(owner, initParams);
  }

  function test_Reverts_ForVeryLargeTotalAmountToMint() public {
    mintGoldSchedule = new MintGoldSchedule(true);
    initParams._totalAmountToMint = maxUint256;
    initParams.initialDistributionRatio = 999;
    MintGoldScheduleMockTunnel tunnel = new MintGoldScheduleMockTunnel(address(mintGoldSchedule));
    vm.expectRevert("unsuccessful tunnel call");
    tunnel.MockInitialize(owner, initParams);

    initParams.initialDistributionRatio = 1000;
    tunnel = new MintGoldScheduleMockTunnel(address(mintGoldSchedule));
    vm.expectRevert("unsuccessful tunnel call");
    tunnel.MockInitialize(owner, initParams);
  }
}
// TODO:(Soloseng) convert to multiple beneficiaries
contract MintGoldScheduleTest_SetBeneficiary is MintGoldScheduleTest {
  function setUp() public {
    super.setUp();
    newMintGold(false);
  }

  function test_ShouldSetBeneficiary() public {
    vm.prank(mintGoldOwner);
    mintGoldSchedule.setBeneficiary(address(uint160((newBeneficiary))));
    assertEq(mintGoldSchedule.beneficiary(), newBeneficiary);
  }

  function test_Reverts_WhenCalledByOtherThanOwner() public {
    vm.expectRevert("Ownable: caller is not the owner");
    vm.prank(randomAddress);
    mintGoldSchedule.setBeneficiary(address(uint160((newBeneficiary))));
  }

  function test_Emits_BeneficiarySetEvent() public {
    vm.expectEmit(true, true, true, true);
    emit BeneficiarySet(newBeneficiary);
    vm.prank(mintGoldOwner);
    mintGoldSchedule.setBeneficiary(address(uint160((newBeneficiary))));
  }
}

contract MintGoldScheduleTest_SetMaxDistribution is MintGoldScheduleTest {
  function setUp() public {
    super.setUp();
    initParams.initialDistributionRatio = 0;
    newMintGold(false);
  }

  function test_ShouldSetMaxDistributionTo5Celo_WhenMaxDistributionIsSetTo50Percent() public {
    vm.prank(mintGoldOwner);
    mintGoldSchedule.setMaxDistribution(500);
    assertEq(mintGoldSchedule.maxDistribution(), TOTAL_AMOUNT / 2);
  }

  function test_ShouldSetMaxDistributionTo5Celo_WhenMaxDistributionIsSetTo100Percent() public {
    vm.prank(mintGoldOwner);
    mintGoldSchedule.setMaxDistribution(1000);
    assertTrue(mintGoldSchedule.maxDistribution() >= TOTAL_AMOUNT);
  }

  function test_Reverts_WhenTryingToLowerMaxDistribution_WhenMaxDistributionIsSetTo100Percent()
    public
  {
    vm.prank(mintGoldOwner);
    mintGoldSchedule.setMaxDistribution(1000);
    vm.prank(mintGoldOwner);
    vm.expectRevert("Cannot set max distribution lower if already set to 1000");
    mintGoldSchedule.setMaxDistribution(500);
  }
}

contract MintGoldScheduleTest_MintAccordingToSchedule_L1 is MintGoldScheduleTest {
  uint256 initialMintGoldAmount;

  function setUp() public {
    registryAddress = l1RegistryAddress;

    beneficiary = actor("beneficiary");

    registryAddress = l1RegistryAddress;

    deployCodeTo("Registry.sol", abi.encode(false), registryAddress);
    registry = Registry(registryAddress);

    vm.prank(goldTokenOwner);
    goldToken = new GoldToken(true);

    registry.setAddressFor("GoldToken", address(goldToken));

    vm.prank(goldTokenOwner);
    goldToken.initialize(registryAddress);

    initParams = MintGoldScheduleMockTunnel.InitParams({
      mintStartTime: block.timestamp + 5 * MINUTE,
      mintCliffTime: HOUR,
      numMintingPeriods: 4,
      mintingPeriod: 3 * MONTH,
      _totalAmountToMint: TOTAL_AMOUNT,
      _beneficiary: address(uint160(beneficiary)),
      _mintGoldOwner: mintGoldOwner,
      initialDistributionRatio: 1000,
      registryAddress: registryAddress
    });

    vm.deal(randomAddress, 1000 ether);

    initParams.initialDistributionRatio = 0;
    initialMintGoldAmount = initParams._totalAmountToMint;
    newMintGold(false);
  }

  function test_Reverts_WhenMintingOnL1() public {
    vm.prank(mintGoldOwner);
    mintGoldSchedule.setMaxDistribution(1000);

    vm.warp(block.timestamp + 3 * MONTH + 1 * DAY);

    vm.expectRevert("Only VM can call");
    vm.prank(randomAddress);
    mintGoldSchedule.mintAccordingToSchedule();
  }
}

contract MintGoldScheduleTest_MintAccordingToSchedule is MintGoldScheduleTest {
  uint256 initialMintGoldAmount;
  uint256 mintPerPeriod;

  function setUp() public {
    super.setUp();

    initParams.initialDistributionRatio = 0;
    initialMintGoldAmount = initParams._totalAmountToMint;
    mintPerPeriod = initParams._totalAmountToMint / initParams.numMintingPeriods;
    newMintGold(false);
  }

  function test_Reverts_BeforeTheReleaseCliffHasPassed() public {
    vm.prank(mintGoldOwner);
    mintGoldSchedule.setMaxDistribution(1000);

    vm.warp(block.timestamp + 30 * MINUTE);
    vm.expectRevert("Mintable amount must be greater than zero");
    vm.prank(randomAddress);
    mintGoldSchedule.mintAccordingToSchedule();
  }

  function test_Reverts_WhenMintableAmountIsZero() public {
    vm.prank(mintGoldOwner);
    mintGoldSchedule.setMaxDistribution(1000);
    vm.warp(block.timestamp + 3 * MONTH + 1 * DAY);
    vm.prank(randomAddress);
    mintGoldSchedule.mintAccordingToSchedule();

    vm.expectRevert("Mintable amount must be greater than zero");
    vm.prank(randomAddress);
    mintGoldSchedule.mintAccordingToSchedule();
  }

  function test_ShouldAllowToMint25PercentAfterQuarterOfTimePassed_WhenMaxDistributionIs100Percent()
    public
  {
    vm.prank(mintGoldOwner);
    mintGoldSchedule.setMaxDistribution(1000);

    uint256 beneficiaryBalanceBefore = goldToken.balanceOf(initParams._beneficiary);
    vm.warp(block.timestamp + 1370 * DAY);
    uint256 expectedMintableAmount = mintPerPeriod * ((initParams.numMintingPeriods + 1) / 4);

    vm.prank(randomAddress);
    mintGoldSchedule.mintAccordingToSchedule();

    assertEq(expectedMintableAmount, mintGoldSchedule.totalMinted(), "Incorrect mintableAmount");

    uint256 beneficiaryBalanceAfter = goldToken.balanceOf(initParams._beneficiary);
    assertEq(beneficiaryBalanceAfter - beneficiaryBalanceBefore, expectedMintableAmount);
  }

  function test_ShouldAllowToMint50PercentAfterHalfTimeHasPassed_WhenMaxDistributionIs100Percent()
    public
  {
    vm.prank(mintGoldOwner);
    mintGoldSchedule.setMaxDistribution(1000);

    uint256 beneficiaryBalanceBefore = goldToken.balanceOf(initParams._beneficiary);
    vm.warp(block.timestamp + (7 * YEAR) + (183 * DAY) + (1 * DAY));
    uint256 expectedMintableAmount = mintPerPeriod * ((initParams.numMintingPeriods + 1) / 2);

    vm.prank(randomAddress);
    mintGoldSchedule.mintAccordingToSchedule();

    assertEq(expectedMintableAmount, mintGoldSchedule.totalMinted(), "Incorrect mintableAmount");

    uint256 beneficiaryBalanceAfter = goldToken.balanceOf(initParams._beneficiary);
    assertEq(beneficiaryBalanceAfter - beneficiaryBalanceBefore, expectedMintableAmount);
  }

  function test_ShouldAllowToMint75PercentAfter11YearsAnd3Months_WhenMaxDistributionIs100Percent()
    public
  {
    vm.prank(mintGoldOwner);
    mintGoldSchedule.setMaxDistribution(1000);

    uint256 beneficiaryBalanceBefore = goldToken.balanceOf(initParams._beneficiary);
    vm.warp(block.timestamp + 4108 * DAY);

    uint256 expectedMintableAmount = (mintPerPeriod * ((initParams.numMintingPeriods + 1) / 4) * 3);

    vm.prank(randomAddress);
    mintGoldSchedule.mintAccordingToSchedule();

    assertEq(expectedMintableAmount, mintGoldSchedule.totalMinted(), "Incorrect mintableAmount");

    uint256 beneficiaryBalanceAfter = goldToken.balanceOf(initParams._beneficiary);
    assertEq(beneficiaryBalanceAfter - beneficiaryBalanceBefore, expectedMintableAmount);
  }

  function test_ShouldAllowToMint100PercentAfter15Years_WhenMaxDistributionIs100Percent() public {
    vm.prank(mintGoldOwner);
    mintGoldSchedule.setMaxDistribution(1000);

    uint256 beneficiaryBalanceBefore = goldToken.balanceOf(initParams._beneficiary);
    vm.warp(block.timestamp + (15 * YEAR) + (1 * DAY));
    uint256 expectedMintableAmount = initialMintGoldAmount;

    vm.prank(randomAddress);
    mintGoldSchedule.mintAccordingToSchedule();

    assertEq(expectedMintableAmount, mintGoldSchedule.totalMinted(), "Incorrect mintableAmount");

    uint256 beneficiaryBalanceAfter = goldToken.balanceOf(initParams._beneficiary);
    assertEq(beneficiaryBalanceAfter - beneficiaryBalanceBefore, expectedMintableAmount);
  }

  function test_ShouldOnlyAllowDistributionOfInitialBalance_WhenTheMintingScheduleHasFullyReleased_WhenTotalAmountToMintIsIncreased_WhenMaxDistributionIs100Percent()
    public
  {
    uint256 increaseAmount = 1 ether / 2;
    vm.prank(mintGoldOwner);
    mintGoldSchedule.setMaxDistribution(1000);
    uint256 beneficiaryBalanceBefore = goldToken.balanceOf(initParams._beneficiary);
    vm.prank(randomAddress);
    mintGoldSchedule.increaseTotalAmountToMint(increaseAmount);
    vm.warp(block.timestamp + (15 * YEAR) + (1 * DAY));

    uint256 newMintPerPeriod = (initParams._totalAmountToMint + increaseAmount) /
      initParams.numMintingPeriods;
    uint256 expectedMintableAmount = (newMintPerPeriod) * (initParams.numMintingPeriods);

    vm.prank(randomAddress);
    mintGoldSchedule.mintAccordingToSchedule();

    uint256 beneficiaryBalanceAfter = goldToken.balanceOf(initParams._beneficiary);
    assertGe(beneficiaryBalanceAfter, beneficiaryBalanceBefore + expectedMintableAmount);
  }

  function test_ShouldOnlyAllowDistributionOfHalfInitialBalanceAndHalfIncrease_WhenTheMintingScheduleIsHalfwayReleased_WhenTotalAmountToMintIsIncreased_WhenMaxDistributionIs100Percent()
    public
  {
    vm.prank(mintGoldOwner);
    mintGoldSchedule.setMaxDistribution(1000);
    uint256 increaseAmount = 1 ether / 2;
    vm.prank(randomAddress);
    mintGoldSchedule.increaseTotalAmountToMint(increaseAmount);
    uint256 beneficiaryBalanceBefore = goldToken.balanceOf(initParams._beneficiary);

    vm.warp(block.timestamp + (7 * YEAR) + (183 * DAY) + 15 * MINUTE);

    uint256 newMintPerPeriod = (initParams._totalAmountToMint + increaseAmount) /
      initParams.numMintingPeriods;
    uint256 expectedMintableAmount = newMintPerPeriod * ((initParams.numMintingPeriods + 1) / 2);
    vm.prank(randomAddress);
    mintGoldSchedule.mintAccordingToSchedule();
    uint256 beneficiaryBalanceAfter = goldToken.balanceOf(initParams._beneficiary);
    assertEq(beneficiaryBalanceAfter, beneficiaryBalanceBefore + expectedMintableAmount);
  }

  function test_Reverts_WhenMintingMoreThan50Percent_WhenTheMintingScheduleHasFullyReleased_WhenTotalAmountToMintIsIncreased_WhenMaxDistributionIs50Percent()
    public
  {
    vm.prank(mintGoldOwner);
    mintGoldSchedule.setMaxDistribution(500);

    vm.prank(randomAddress);
    mintGoldSchedule.increaseTotalAmountToMint(1 ether / 2);
    vm.warp(block.timestamp + (15 * YEAR) + (1 * DAY));
    uint256 beneficiaryBalanceBefore = goldToken.balanceOf(initParams._beneficiary);
    uint256 expectedMintableAmount = TOTAL_AMOUNT / 2;

    vm.prank(randomAddress);
    mintGoldSchedule.mintAccordingToSchedule();

    uint256 beneficiaryBalanceAfter = goldToken.balanceOf(initParams._beneficiary);
    assertEq(beneficiaryBalanceAfter, beneficiaryBalanceBefore + expectedMintableAmount);

    vm.prank(randomAddress);
    vm.expectRevert("Mintable amount must be greater than zero");
    mintGoldSchedule.mintAccordingToSchedule();
  }

  function test_ShouldOnlyAllowMintingOf50Percent_WhenMaxDistributionIs50Percent_WhenMaxDistributionIsSetLower()
    public
  {
    vm.prank(mintGoldOwner);
    mintGoldSchedule.setMaxDistribution(500);

    uint256 beneficiaryBalanceBefore = goldToken.balanceOf(initParams._beneficiary);
    vm.warp(block.timestamp + (15 * YEAR) + (1 * DAY));
    uint256 expectedMintableAmount = initialMintGoldAmount / 2;

    vm.prank(randomAddress);
    mintGoldSchedule.mintAccordingToSchedule();

    assertEq(expectedMintableAmount, mintGoldSchedule.totalMinted(), "Incorrect mintableAmount");

    uint256 beneficiaryBalanceAfter = goldToken.balanceOf(initParams._beneficiary);
    assertEq(beneficiaryBalanceAfter - beneficiaryBalanceBefore, expectedMintableAmount);
  }

  function test_Reverts_WhenMintingMoreThan50Percent_WhenMaxDistributionIs50Percent_WhenMaxDistributionIsSetLower()
    public
  {
    vm.prank(mintGoldOwner);
    mintGoldSchedule.setMaxDistribution(500);
    uint256 beneficiaryBalanceBefore = goldToken.balanceOf(initParams._beneficiary);
    vm.warp(block.timestamp + (15 * YEAR) + (1 * DAY));
    uint256 expectedMintableAmount = initialMintGoldAmount / 2;

    mintGoldSchedule.mintAccordingToSchedule();

    assertEq(expectedMintableAmount, mintGoldSchedule.totalMinted(), "Incorrect mintableAmount");

    uint256 beneficiaryBalanceAfter = goldToken.balanceOf(initParams._beneficiary);
    assertEq(beneficiaryBalanceAfter - beneficiaryBalanceBefore, expectedMintableAmount);
    vm.warp(block.timestamp + (10 * DAY));
    vm.expectRevert("Mintable amount must be greater than zero");
    vm.prank(randomAddress);
    mintGoldSchedule.mintAccordingToSchedule();
  }

  function test_ShouldAllowMintingOf100Percent_WhenMaxDistributionIs100Percent_WhenMaxDistributionIsSetLower()
    public
  {
    vm.prank(mintGoldOwner);
    mintGoldSchedule.setMaxDistribution(1000);

    uint256 beneficiaryBalanceBefore = goldToken.balanceOf(initParams._beneficiary);
    vm.warp(block.timestamp + (15 * YEAR) + (1 * DAY));
    uint256 expectedMintableAmount = initialMintGoldAmount;

    vm.prank(randomAddress);
    mintGoldSchedule.mintAccordingToSchedule();

    assertEq(expectedMintableAmount, mintGoldSchedule.totalMinted(), "Incorrect mintableAmount");

    uint256 beneficiaryBalanceAfter = goldToken.balanceOf(initParams._beneficiary);
    assertEq(beneficiaryBalanceAfter - beneficiaryBalanceBefore, expectedMintableAmount);
  }
  function test_Emits_MintGoldInstanceDestroyedWhenTotalAmountHasBeenMinted() public {
    vm.prank(mintGoldOwner);
    mintGoldSchedule.setMaxDistribution(1000);

    vm.warp(block.timestamp + (15 * YEAR) + (1 * DAY));
    uint256 expectedMintableAmount = initialMintGoldAmount;

    vm.expectEmit(true, true, true, true);
    emit MintGoldInstanceDestroyed(address(mintGoldSchedule));
    vm.prank(randomAddress);
    mintGoldSchedule.mintAccordingToSchedule();
  }
}

contract MintGoldScheduleTest_MintAccordingToSchedule_SelfDestruct is MintGoldScheduleTest {
  uint256 initialMintGoldAmount;
  function setUp() public {
    super.setUp();

    initParams.initialDistributionRatio = 0;
    initialMintGoldAmount = initParams._totalAmountToMint;
    newMintGold(false);

    vm.prank(mintGoldOwner);
    mintGoldSchedule.setMaxDistribution(1000);

    vm.warp(block.timestamp + 15 * YEAR + 3 * MONTH);
    uint256 expectedMintableAmount = initialMintGoldAmount;

    vm.prank(randomAddress);
    mintGoldSchedule.mintAccordingToSchedule();
  }
  function test_ShouldSelfDistructWhenTotalAmountHasBeenMinted() public {
    vm.expectRevert();
    mintGoldSchedule.totalMinted();
  }
}

contract MintGoldScheduleTest_GetCurrentReleasedTotalAmount is MintGoldScheduleTest {
  uint256 initialMintGoldAmount;
  uint256 mintPerPeriod;

  function setUp() public {
    super.setUp();
    newMintGold(false);
    initialMintGoldAmount = initParams._totalAmountToMint;
    mintPerPeriod = initParams._totalAmountToMint / initParams.numMintingPeriods;
  }

  function test_ShouldReturnZeroIfBeforeCliffStartTime() public {
    vm.warp(block.timestamp + 1);
    assertEq(mintGoldSchedule.getCurrentReleasedTotalAmount(), 0);
  }

  function test_ShouldReturn2PercentOfTotalAmountOfGoldRightAfter3Months() public {
    vm.warp(block.timestamp + 110 * DAY);
    assertEq(mintGoldSchedule.getCurrentReleasedTotalAmount(), mintPerPeriod * 109);
  }

  function test_ShouldReturn10PercentOfTotalAmountOfGoldRightAfter18Months() public {
    vm.warp(block.timestamp + 18 * MONTH + 1 * DAY);
    assertEq(mintGoldSchedule.getCurrentReleasedTotalAmount(), mintPerPeriod * 540);
  }

  function test_ShouldReturnAtLeast50PercentOfTotalAmountOfGoldRightAfter7AndHalfYears() public {
    vm.warp(block.timestamp + (7 * YEAR) + (183 * DAY) + (1 * DAY));
    assertGe(mintGoldSchedule.getCurrentReleasedTotalAmount(), initialMintGoldAmount / 2);
  }

  function test_ShouldReturn100PercentOfTotalAmountOfGoldRightAfter15Years() public {
    vm.warp(block.timestamp + 15 * YEAR + 1 * DAY);
    assertEq(mintGoldSchedule.getCurrentReleasedTotalAmount(), initialMintGoldAmount);
  }
}

contract MintGoldScheduleTest_GetMintableAmount is MintGoldScheduleTest {
  uint256 initialMintGoldAmount;
  uint256 mintPerPeriod;

  function setUp() public {
    super.setUp();
    initParams.initialDistributionRatio = 500;

    newMintGold(false);
    initialMintGoldAmount = initParams._totalAmountToMint;
    mintPerPeriod = initParams._totalAmountToMint / initParams.numMintingPeriods;
  }

  function test_ShouldReturnFullAmountAvailableForThisReleasePeriod() public {
    vm.prank(mintGoldOwner);
    mintGoldSchedule.setMaxDistribution(1000);

    vm.warp(block.timestamp + 6 * MONTH + 1 * DAY);
    assertEq(mintGoldSchedule.getMintableAmount(), mintPerPeriod * 180);
  }

  function test_ShouldReturnOnlyAmountNotYetMinted() public {
    vm.prank(mintGoldOwner);
    mintGoldSchedule.setMaxDistribution(1000);

    vm.warp(block.timestamp + 3 * MONTH + 1 * DAY);
    vm.prank(randomAddress);
    mintGoldSchedule.mintAccordingToSchedule();
    vm.warp(block.timestamp + 3 * MONTH);
    assertEq(mintGoldSchedule.getMintableAmount(), mintPerPeriod * 90);
  }

  function test_ShouldReturnOnlyUpToItsOwnBalance() public {
    vm.prank(mintGoldOwner);
    mintGoldSchedule.setMaxDistribution(1000);

    vm.warp(block.timestamp + 6 * MONTH + 1 * DAY);

    uint256 expectedMintableAmount = mintPerPeriod * 180;

    assertEq(mintGoldSchedule.getMintableAmount(), expectedMintableAmount);
  }

  function test_ShouldReturnOnlyUpToMaxDistribution() public {
    vm.prank(mintGoldOwner);
    mintGoldSchedule.setMaxDistribution(250);

    vm.warp(block.timestamp + 50 * MONTH);
    assertEq(mintGoldSchedule.getMintableAmount(), initialMintGoldAmount / 4);
  }
}
