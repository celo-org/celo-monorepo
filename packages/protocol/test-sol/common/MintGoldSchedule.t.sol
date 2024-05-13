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
    address payable _beneficiary;
    address _mintGoldOwner;
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
    bytes4 selector = bytes4(keccak256("initialize(address,address,address)"));

    bytes memory dataFirstHalf;
    {
      // Encode the first half of the parameters
      dataFirstHalf = abi.encode(
        params._beneficiary,
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

  uint256 constant DAILY_MINT_AMOUNT_UPPER = 36531 ether; // 36,531 Gold
  uint256 constant DAILY_MINT_AMOUNT_LOWER = 36529 ether; // 36,529 Gold
  uint256 constant GENESIS_GOLD_SUPPLY = 600000000 ether; // 600 million Gold
  uint256 constant FIFTEEN_YEAR_GOLD_SUPPLY = 800000000 ether; // 800 million Gold
  uint256 constant FIFTEEN_YEAR_MINTED_SUPPLY_LOWER = 199999990 ether; // 199.99 million Gold
  uint256 constant FIFTEEN_YEAR_MINTED_SUPPLY_UPPER = 200000000 ether; // 199.99 million Gold
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
    registryAddress = l1RegistryAddress;

    deployCodeTo("Registry.sol", abi.encode(false), registryAddress);
    registry = Registry(registryAddress);

    vm.prank(goldTokenOwner);
    goldToken = new GoldToken(true);

    registry.setAddressFor("GoldToken", address(goldToken));

    vm.prank(goldTokenOwner);
    goldToken.initialize(registryAddress);

    vm.prank(address(0));
    goldToken.mint(randomAddress, GENESIS_GOLD_SUPPLY);

    // Setup L2 after minting genesis supply.
    registryAddress = proxyAdminAddress;
    deployCodeTo("Registry.sol", abi.encode(false), registryAddress);
    registry = Registry(registryAddress);

    registry.setAddressFor("GoldToken", address(goldToken));

    vm.prank(goldTokenOwner);
    goldToken.setRegistry(registryAddress);

    initParams = MintGoldScheduleMockTunnel.InitParams({
      _beneficiary: address(uint160(beneficiary)),
      _mintGoldOwner: mintGoldOwner,
      registryAddress: registryAddress
    });

    vm.deal(randomAddress, 1000 ether);
  }

  function newMintGold() internal returns (MintGoldSchedule) {
    mintGoldSchedule = new MintGoldSchedule(true);

    vm.prank(goldTokenOwner);
    goldToken.setGoldTokenMintingScheduleAddress(address(mintGoldSchedule));
    MintGoldScheduleMockTunnel tunnel = new MintGoldScheduleMockTunnel(address(mintGoldSchedule));

    tunnel.MockInitialize(owner, initParams);
    // warp to schedule start time.
    vm.warp(block.timestamp + 1587587214);
  }
}

contract MintGoldScheduleTest_Initialize is MintGoldScheduleTest {
  uint256 public maxUint256 = 0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF;

  function test_ShouldSetABeneficiaryToMintGoldScheduleInstance() public {
    newMintGold();
    assertEq(mintGoldSchedule.beneficiary(), initParams._beneficiary);
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
    initParams._beneficiary = address(0);
    MintGoldScheduleMockTunnel tunnel = new MintGoldScheduleMockTunnel(address(mintGoldSchedule));
    vm.expectRevert("unsuccessful tunnel call");
    tunnel.MockInitialize(owner, initParams);
  }
}
// TODO:(Soloseng) convert to multiple beneficiaries
contract MintGoldScheduleTest_SetBeneficiary is MintGoldScheduleTest {
  function setUp() public {
    super.setUp();
    newMintGold();
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
      _beneficiary: address(uint160(beneficiary)),
      _mintGoldOwner: mintGoldOwner,
      registryAddress: registryAddress
    });

    vm.deal(randomAddress, 1000 ether);

    newMintGold();
  }

  function test_Reverts_WhenMintingOnL1() public {
    vm.warp(block.timestamp + 3 * MONTH + 1 * DAY);

    vm.expectRevert("This method is not supported in L1.");
    vm.prank(randomAddress);
    mintGoldSchedule.mintAccordingToSchedule();
  }
}

contract MintGoldScheduleTest_MintAccordingToSchedule is MintGoldScheduleTest {
  uint256 initialMintGoldAmount;
  uint256 mintPerPeriod;

  function setUp() public {
    super.setUp();

    newMintGold();
  }

  function test_ShouldAllowMintingAsSoonAsDeployed() public {
    uint256 beneficiaryBalanceBefore = goldToken.balanceOf(initParams._beneficiary);
    vm.prank(randomAddress);
    mintGoldSchedule.mintAccordingToSchedule();
    uint256 beneficiaryBalanceAfter = goldToken.balanceOf(initParams._beneficiary);
    assertGt(beneficiaryBalanceAfter, beneficiaryBalanceBefore);
  }

  function test_Reverts_WhenMintableAmountIsZero() public {
    vm.prank(randomAddress);
    mintGoldSchedule.mintAccordingToSchedule();

    vm.expectRevert("Mintable amount must be greater than zero");
    vm.prank(randomAddress);
    mintGoldSchedule.mintAccordingToSchedule();
  }

  function test_ShouldAllowToMint25PercentAfter3years9MonthsSinceGenesis() public {
    uint256 beneficiaryBalanceBefore = goldToken.balanceOf(initParams._beneficiary);
    vm.warp(block.timestamp + 3 * YEAR + 273 * DAY + 64799);
    uint256 expectedMintedAmount = (FIFTEEN_YEAR_GOLD_SUPPLY - GENESIS_GOLD_SUPPLY) / 4;

    vm.prank(randomAddress);
    mintGoldSchedule.mintAccordingToSchedule();

    assertEq(mintGoldSchedule.totalMinted(), expectedMintedAmount, "Incorrect mintableAmount");

    uint256 beneficiaryBalanceAfter = goldToken.balanceOf(initParams._beneficiary);
    assertEq(beneficiaryBalanceAfter - beneficiaryBalanceBefore, expectedMintedAmount);
  }

  function test_ShouldAllowToMint50PercentAfter7AndHalfYearsSinceGenesis() public {
    uint256 beneficiaryBalanceBefore = goldToken.balanceOf(initParams._beneficiary);
    vm.warp(block.timestamp + (7 * YEAR) + (182 * DAY) + 43199);
    uint256 expectedMintedAmount = (FIFTEEN_YEAR_GOLD_SUPPLY - GENESIS_GOLD_SUPPLY) / 2;

    vm.prank(randomAddress);
    mintGoldSchedule.mintAccordingToSchedule();

    assertEq(mintGoldSchedule.totalMinted(), expectedMintedAmount, "Incorrect mintableAmount");

    uint256 beneficiaryBalanceAfter = goldToken.balanceOf(initParams._beneficiary);
    assertEq(beneficiaryBalanceAfter - beneficiaryBalanceBefore, expectedMintedAmount);
  }

  function test_ShouldAllowToMint75PercentAfter11YearsAnd3MonthsSinceGenesis() public {
    uint256 beneficiaryBalanceBefore = goldToken.balanceOf(initParams._beneficiary);
    vm.warp(block.timestamp + 11 * YEAR + 91 * DAY + 21599);

    uint256 expectedMintedAmount = (((FIFTEEN_YEAR_GOLD_SUPPLY - GENESIS_GOLD_SUPPLY) / 4) * 3);

    vm.prank(randomAddress);
    mintGoldSchedule.mintAccordingToSchedule();

    assertEq(mintGoldSchedule.totalMinted(), expectedMintedAmount, "Incorrect mintableAmount");

    uint256 beneficiaryBalanceAfter = goldToken.balanceOf(initParams._beneficiary);
    assertEq(beneficiaryBalanceAfter - beneficiaryBalanceBefore, expectedMintedAmount);
  }

  function test_ShouldAllowToMint100PercentAfter15YearsSinceGenesys() public {
    uint256 beneficiaryBalanceBefore = goldToken.balanceOf(initParams._beneficiary);
    vm.warp(block.timestamp + (14 * YEAR) + (364 * DAY) + 86389);

    vm.prank(randomAddress);
    mintGoldSchedule.mintAccordingToSchedule();

    assertGe(
      mintGoldSchedule.totalMinted(),
      FIFTEEN_YEAR_MINTED_SUPPLY_LOWER,
      "Incorrect mintableAmount"
    );
    assertLe(
      mintGoldSchedule.totalMinted(),
      FIFTEEN_YEAR_MINTED_SUPPLY_UPPER,
      "Incorrect mintableAmount"
    );

    uint256 beneficiaryBalanceAfter = goldToken.balanceOf(initParams._beneficiary);
    assertGe(beneficiaryBalanceAfter - beneficiaryBalanceBefore, FIFTEEN_YEAR_MINTED_SUPPLY_LOWER);
    assertLe(beneficiaryBalanceAfter - beneficiaryBalanceBefore, FIFTEEN_YEAR_MINTED_SUPPLY_UPPER);
  }

  function test_Reverts_WhenMintingSecondTimeAfter15Years() public {
    vm.warp(block.timestamp + (15 * YEAR) + (1 * DAY));

    vm.prank(randomAddress);
    mintGoldSchedule.mintAccordingToSchedule();

    assertGe(
      mintGoldSchedule.totalMinted(),
      FIFTEEN_YEAR_MINTED_SUPPLY_LOWER,
      "Incorrect mintableAmount"
    );
    assertLe(
      mintGoldSchedule.totalMinted(),
      FIFTEEN_YEAR_MINTED_SUPPLY_UPPER,
      "Incorrect mintableAmount"
    );

    vm.expectRevert("Block reward calculation for years 15-30 unimplemented");

    vm.prank(randomAddress);
    mintGoldSchedule.mintAccordingToSchedule();
  }
  function test_ShouldMintUpToLinearSuppplyAfter15Years() public {
    vm.warp(block.timestamp + (15 * YEAR) + (1 * DAY));

    assertLt(
      mintGoldSchedule.totalMinted(),
      FIFTEEN_YEAR_MINTED_SUPPLY_UPPER,
      "Incorrect mintableAmount"
    );

    vm.prank(randomAddress);
    mintGoldSchedule.mintAccordingToSchedule();

    assertGe(
      mintGoldSchedule.totalMinted(),
      FIFTEEN_YEAR_MINTED_SUPPLY_LOWER,
      "Incorrect mintableAmount"
    );
    assertLe(
      mintGoldSchedule.totalMinted(),
      FIFTEEN_YEAR_MINTED_SUPPLY_UPPER,
      "Incorrect mintableAmount"
    );
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
    assertGe(mintGoldSchedule.getMintableAmount(), DAILY_MINT_AMOUNT_LOWER);
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

  function test_ShouldReturnOnlyUpTo15YearsOfDistributionBeforeItIsMinted() public {
    vm.warp(block.timestamp + 16 * YEAR);

    assertGe(
      mintGoldSchedule.getMintableAmount(),
      FIFTEEN_YEAR_MINTED_SUPPLY_LOWER,
      "Incorrect mintableAmount"
    );
    assertLe(
      mintGoldSchedule.getMintableAmount(),
      FIFTEEN_YEAR_MINTED_SUPPLY_UPPER,
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
