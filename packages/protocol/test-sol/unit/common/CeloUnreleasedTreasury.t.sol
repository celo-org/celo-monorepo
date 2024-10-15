// SPDX-License-Identifier: UNLICENSED
pragma solidity >=0.8.7 <0.8.20;
pragma experimental ABIEncoderV2;

import "celo-foundry-8/Test.sol";
import "@celo-contracts/common/FixidityLib.sol";
import "@celo-contracts/common/interfaces/IRegistry.sol";
import "@celo-contracts/common/interfaces/ICeloToken.sol";
import "@celo-contracts/governance/interfaces/IGovernance.sol";
import { CeloUnreleasedTreasury } from "@celo-contracts-8/common/CeloUnreleasedTreasury.sol";
import "@celo-contracts-8/common/IsL2Check.sol";
import { TestConstants } from "@test-sol/constants.sol";

import "@test-sol/unit/governance/mock/MockGovernance.sol";

contract CeloUnreleasedTreasuryTest is Test, TestConstants, IsL2Check {
  using FixidityLib for FixidityLib.Fraction;

  IRegistry registry;
  ICeloToken celoToken;
  MockGovernance governance;

  CeloUnreleasedTreasury celoUnreleasedTreasury;

  address owner = address(this);

  address celoTokenAddress = actor("celoTokenAddress");
  address epochManagerAddress = actor("epochManagerAddress");

  address celoDistributionOwner = actor("celoDistributionOwner");
  address communityRewardFund = actor("communityRewardFund");
  address carbonOffsettingPartner = actor("carbonOffsettingPartner");

  address newPartner = actor("newPartner");
  address randomAddress = actor("randomAddress");

  uint256 constant DAILY_DISTRIBUTION_AMOUNT = 6748256563599655349558; // 6,748 Celo

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
    deployCodeTo("Registry.sol", abi.encode(false), PROXY_ADMIN_ADDRESS);
  }

  function setUpL1() public {
    deployCodeTo("Registry.sol", abi.encode(false), REGISTRY_ADDRESS);
    registry = IRegistry(REGISTRY_ADDRESS);

    deployCodeTo("GoldToken.sol", abi.encode(true), celoTokenAddress);
    celoToken = ICeloToken(celoTokenAddress);
    celoToken.initialize(REGISTRY_ADDRESS);
    // Using a mock contract, as foundry does not allow for library linking when using deployCodeTo
    governance = new MockGovernance();

    registry.setAddressFor("CeloToken", address(celoToken));

    registry.setAddressFor("Governance", address(governance));
    registry.setAddressFor("EpochManager", address(epochManagerAddress));

    vm.deal(address(0), CELO_SUPPLY_CAP);
    assertEq(celoToken.allocatedSupply(), 0, "starting total supply not zero.");
    // Mint L1 supply
    vm.prank(address(0));
    celoToken.mint(randomAddress, L1_MINTED_CELO_SUPPLY);
    assertEq(celoToken.allocatedSupply(), L1_MINTED_CELO_SUPPLY, "total supply incorrect.");
  }

  function newCeloUnreleasedTreasury() internal returns (CeloUnreleasedTreasury) {
    vm.warp(block.timestamp + l2StartTime);
    vm.prank(celoDistributionOwner);
    celoUnreleasedTreasury = new CeloUnreleasedTreasury(true);
    registry.setAddressFor("CeloUnreleasedTreasury", address(celoUnreleasedTreasury));

    vm.deal(address(celoUnreleasedTreasury), L2_INITIAL_STASH_BALANCE);

    vm.prank(celoDistributionOwner);
    celoUnreleasedTreasury.initialize(REGISTRY_ADDRESS);
  }
}

contract CeloUnreleasedTreasuryTest_initialize is CeloUnreleasedTreasuryTest {
  function setUp() public override {
    super.setUp();
    vm.warp(block.timestamp + l2StartTime);

    vm.prank(celoDistributionOwner);
    celoUnreleasedTreasury = new CeloUnreleasedTreasury(true);
    registry.setAddressFor("CeloUnreleasedTreasury", address(celoUnreleasedTreasury));
    vm.prank(celoDistributionOwner);
    celoUnreleasedTreasury.initialize(REGISTRY_ADDRESS);
  }

  function test_ShouldSetAnOwnerToCeloUnreleasedTreasuryInstance() public {
    assertEq(celoUnreleasedTreasury.owner(), celoDistributionOwner);
  }

  function test_ShouldSetRegistryAddressToCeloUnreleasedTreasuryInstance() public {
    assertEq(address(celoUnreleasedTreasury.registry()), REGISTRY_ADDRESS);
  }

  function test_Reverts_WhenRegistryIsTheNullAddress() public {
    celoUnreleasedTreasury = new CeloUnreleasedTreasury(true);
    registry.setAddressFor("CeloUnreleasedTreasury", address(celoUnreleasedTreasury));
    vm.expectRevert("Cannot register the null address");
    celoUnreleasedTreasury.initialize(address(0));
  }

  function test_Reverts_WhenReceivingNativeTokens() public {
    (bool success, ) = address(celoUnreleasedTreasury).call{ value: 1 ether }("");
    assertFalse(success);

    address payable payableAddress = payable((address(celoUnreleasedTreasury)));

    bool success2 = payableAddress.send(1 ether);
    assertFalse(success2);

    vm.expectRevert();
    payableAddress.transfer(1 ether);
  }
}

contract CeloUnreleasedTreasuryTest_release is CeloUnreleasedTreasuryTest {
  function setUp() public override {
    super.setUp();
    newCeloUnreleasedTreasury();
  }

  function test_ShouldTransferToRecepientAddress() public {
    uint256 _balanceBefore = randomAddress.balance;
    vm.prank(epochManagerAddress);

    celoUnreleasedTreasury.release(randomAddress, 4);
    uint256 _balanceAfter = randomAddress.balance;
    assertGt(_balanceAfter, _balanceBefore);
  }

  function test_Reverts_WhenCalledByOtherThanEpochManager() public {
    vm.prank(randomAddress);

    vm.expectRevert("Only the EpochManager contract can call this function.");
    celoUnreleasedTreasury.release(randomAddress, 4);
  }
}
contract CeloUnreleasedTreasuryTest_getRemainingBalanceToRelease is CeloUnreleasedTreasuryTest {
  uint256 _startingBalance;
  function setUp() public override {
    super.setUp();
    newCeloUnreleasedTreasury();
    _startingBalance = address(celoUnreleasedTreasury).balance;
  }

  function test_ShouldReturnContractBalanceBeforeFirstRelease() public {
    uint256 _remainingBalance = celoUnreleasedTreasury.getRemainingBalanceToRelease();

    assertEq(_startingBalance, _remainingBalance);
  }

  function test_ShouldReturnRemainingBalanceToReleaseAfterFirstRelease() public {
    vm.prank(epochManagerAddress);

    celoUnreleasedTreasury.release(randomAddress, 4);
    uint256 _remainingBalance = celoUnreleasedTreasury.getRemainingBalanceToRelease();
    assertEq(_remainingBalance, _startingBalance - 4);
  }

  function test_RemainingBalanceToReleaseShouldRemainUnchangedAfterCeloTransferBackToContract()
    public
  {
    vm.prank(epochManagerAddress);

    celoUnreleasedTreasury.release(randomAddress, 4);
    uint256 _remainingBalanceBeforeTransfer = celoUnreleasedTreasury.getRemainingBalanceToRelease();
    assertEq(_remainingBalanceBeforeTransfer, _startingBalance - 4);
    // set the contract balance to mock a CELO token transfer
    vm.deal(address(celoUnreleasedTreasury), L2_INITIAL_STASH_BALANCE);
    uint256 _remainingBalanceAfterTransfer = celoUnreleasedTreasury.getRemainingBalanceToRelease();
    assertEq(_remainingBalanceAfterTransfer, _remainingBalanceBeforeTransfer);
  }
}
