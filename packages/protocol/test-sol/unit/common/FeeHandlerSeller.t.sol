// SPDX-License-Identifier: LGPL-3.0-only
pragma solidity >=0.8.7 <0.8.20;

// Helper contracts
import "celo-foundry-8/Test.sol";
import { TestConstants } from "@test-sol/constants.sol";

import { GoldTokenMock } from "@test-sol/unit/common/GoldTokenMock.sol";
import { FeeHandlerSeller } from "@celo-contracts-8/common/FeeHandlerSeller.sol";
import { MentoFeeHandlerSeller } from "@celo-contracts-8/common/MentoFeeHandlerSeller.sol";
import { UniswapFeeHandlerSeller } from "@celo-contracts-8/common/UniswapFeeHandlerSeller.sol";

contract FeeHandlerSellerTest is Test, TestConstants {
  // Actors
  address RECEIVER_ADDRESS = actor("Arbitrary Receiver");
  address NON_OWNER_ADDRESS = actor("Arbitrary Non-Owner");

  // Contract instances
  GoldTokenMock celoToken; // Using mock token to work around missing transfer precompile
  FeeHandlerSeller mentoFeeHandlerSeller;
  FeeHandlerSeller uniswapFeeHandlerSeller;

  // Contract addresses
  address MOCK_CELO_TOKEN_ADDRESS;

  // Helper data structures
  FeeHandlerSeller[] feeHandlerSellerInstances;

  function setUp() public {
    celoToken = new GoldTokenMock();
    MOCK_CELO_TOKEN_ADDRESS = address(celoToken);

    mentoFeeHandlerSeller = new MentoFeeHandlerSeller(true);
    uniswapFeeHandlerSeller = new UniswapFeeHandlerSeller(true);

    feeHandlerSellerInstances.push(mentoFeeHandlerSeller);
    feeHandlerSellerInstances.push(uniswapFeeHandlerSeller);
  }
}

contract FeeHandlerSellerTest_Transfer is FeeHandlerSellerTest {
  uint256 constant ZERO_CELOTOKEN = 0;
  uint256 constant ONE_CELOTOKEN = 1000000000000000000;

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
      feeHandlerSellerInstances[i].transfer(
        MOCK_CELO_TOKEN_ADDRESS,
        ONE_CELOTOKEN,
        RECEIVER_ADDRESS
      );

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
      feeHandlerSellerInstances[i].transfer(
        MOCK_CELO_TOKEN_ADDRESS,
        ONE_CELOTOKEN,
        RECEIVER_ADDRESS
      );
    }
  }
}

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
