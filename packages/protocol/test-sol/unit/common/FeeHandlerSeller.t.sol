// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.5.13;
pragma experimental ABIEncoderV2;

// Helper contracts

import { CeloTokenMock } from "@test-sol/unit/common/CeloTokenMock.sol";
import { FeeHandlerSeller } from "@celo-contracts/common/FeeHandlerSeller.sol";
import { MentoFeeHandlerSeller } from "@celo-contracts/common/MentoFeeHandlerSeller.sol";
import { UniswapFeeHandlerSeller } from "@celo-contracts/common/UniswapFeeHandlerSeller.sol";

import { Utils } from "@test-sol/utils.sol";
import "@test-sol/utils/WhenL2.sol";

contract FeeHandlerSellerTest is Utils {
  event OracleAddressSet(address _token, address _oracle);

  // Actors
  address RECEIVER_ADDRESS = actor("Arbitrary Receiver");
  address NON_OWNER_ADDRESS = actor("Arbitrary Non-Owner");

  // Contract instances
  CeloTokenMock celoToken; // Using mock token to work around missing transfer precompile
  FeeHandlerSeller mentoFeeHandlerSeller;
  FeeHandlerSeller uniswapFeeHandlerSeller;

  address oracle;
  address sortedOracles;

  // Helper data structures
  FeeHandlerSeller[] feeHandlerSellerInstances;

  function setUp() public {
    super.setUp();

    celoToken = new CeloTokenMock();
    oracle = actor("oracle");
    sortedOracles = actor("sortedOracles");

    registry.setAddressFor("SortedOracles", sortedOracles);

    mentoFeeHandlerSeller = new MentoFeeHandlerSeller(true);
    uniswapFeeHandlerSeller = new UniswapFeeHandlerSeller(true);

    feeHandlerSellerInstances.push(mentoFeeHandlerSeller);
    feeHandlerSellerInstances.push(uniswapFeeHandlerSeller);
  }
}

contract FeeHandlerSellerTest_L2 is WhenL2, FeeHandlerSellerTest {}

contract FeeHandlerSellerTest_Transfer is FeeHandlerSellerTest {
  uint256 constant ZERO_CELOTOKEN = 0;
  uint256 constant ONE_CELOTOKEN = 1e18;

  function test_FeeHandlerSeller_ShouldTransfer_WhenCalledByOwner() public {
    for (uint256 i = 0; i < feeHandlerSellerInstances.length; i++) {
      celoToken.setBalanceOf(RECEIVER_ADDRESS, ZERO_CELOTOKEN); // Reset balance of receiver
      assertEq(
        celoToken.balanceOf(RECEIVER_ADDRESS),
        ZERO_CELOTOKEN,
        "Balance of receiver should be 0 at start"
      );
      celoToken.setBalanceOf(address(feeHandlerSellerInstances[i]), ONE_CELOTOKEN); // Faucet contract
      assertEq(
        celoToken.balanceOf(address(feeHandlerSellerInstances[i])),
        ONE_CELOTOKEN,
        "Balance of contract should be 1 at start"
      );

      vm.prank(feeHandlerSellerInstances[i].owner());
      feeHandlerSellerInstances[i].transfer(address(celoToken), ONE_CELOTOKEN, RECEIVER_ADDRESS);

      assertEq(
        celoToken.balanceOf(RECEIVER_ADDRESS),
        ONE_CELOTOKEN,
        "Balance of receiver should be 1 after transfer"
      );
      assertEq(
        celoToken.balanceOf(address(feeHandlerSellerInstances[i])),
        ZERO_CELOTOKEN,
        "Balance of contract should be 0 after transfer"
      );
    }
  }

  function test_FeeHandlerSeller_ShouldRevert_WhenCalledByNonOwner() public {
    for (uint256 i = 0; i < feeHandlerSellerInstances.length; i++) {
      vm.prank(NON_OWNER_ADDRESS);

      vm.expectRevert("Ownable: caller is not the owner");
      feeHandlerSellerInstances[i].transfer(address(celoToken), ONE_CELOTOKEN, RECEIVER_ADDRESS);
    }
  }
}

contract FeeHandlerSellerTest_Transfer_L2 is
  FeeHandlerSellerTest_L2,
  FeeHandlerSellerTest_Transfer
{}

contract FeeHandlerSellerTest_SetMinimumReports is FeeHandlerSellerTest {
  address ARBITRARY_TOKEN_ADDRESS = actor("Arbitrary Token Address");
  uint256 constant ARBITRARY_NR_OF_MINIMUM_REPORTS = 15;

  function test_SetMinimumReports_ShouldSucceedWhen_CalledByOwner() public {
    for (uint256 i = 0; i < feeHandlerSellerInstances.length; i++) {
      vm.prank(feeHandlerSellerInstances[i].owner());

      feeHandlerSellerInstances[i].setMinimumReports(
        ARBITRARY_TOKEN_ADDRESS,
        ARBITRARY_NR_OF_MINIMUM_REPORTS
      );

      assertEq(
        feeHandlerSellerInstances[i].minimumReports(ARBITRARY_TOKEN_ADDRESS),
        ARBITRARY_NR_OF_MINIMUM_REPORTS,
        "Number of minimum reports don't match"
      );
    }
  }

  function test_SetMinimumReports_ShouldRevertWhen_CalledByNonOwner() public {
    for (uint256 i = 0; i < feeHandlerSellerInstances.length; i++) {
      vm.prank(NON_OWNER_ADDRESS);

      vm.expectRevert("Ownable: caller is not the owner");
      feeHandlerSellerInstances[i].setMinimumReports(
        ARBITRARY_TOKEN_ADDRESS,
        ARBITRARY_NR_OF_MINIMUM_REPORTS
      );
    }
  }
}

contract FeeHandlerSellerTest_SetMinimumReports_L2 is
  FeeHandlerSellerTest_L2,
  FeeHandlerSellerTest_SetMinimumReports
{}

contract FeeHandlerSellerTest_setOracleAddress is FeeHandlerSellerTest {
  function test_Reverts_WhenCalledByNonOwner() public {
    vm.prank(NON_OWNER_ADDRESS);
    vm.expectRevert("Ownable: caller is not the owner");
    uniswapFeeHandlerSeller.setOracleAddress(address(celoToken), oracle);
  }

  function test_SetsCorrectly() public {
    uniswapFeeHandlerSeller.setOracleAddress(address(celoToken), oracle);
    assertEq(uniswapFeeHandlerSeller.getOracleAddress(address(celoToken)), oracle);
  }

  function test_DefaultIsSortedOracles() public {
    uniswapFeeHandlerSeller.initialize(REGISTRY_ADDRESS, new address[](0), new uint256[](0));
    assertEq(uniswapFeeHandlerSeller.getOracleAddress(address(celoToken)), sortedOracles);
  }

  function test_Emits_OracleAddressSet() public {
    vm.expectEmit(false, false, false, true);
    emit OracleAddressSet(address(celoToken), oracle);
    uniswapFeeHandlerSeller.setOracleAddress(address(celoToken), oracle);
  }
}

contract FeeHandlerSellerTest_setOracleAddress_L2 is
  FeeHandlerSellerTest_L2,
  FeeHandlerSellerTest_setOracleAddress
{}
