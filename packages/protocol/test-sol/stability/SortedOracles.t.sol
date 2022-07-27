// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.5.13;

import { Test, console2 as console } from "celo-foundry/Test.sol";

import { MockBreakerBox } from "contracts/stability/test/MockBreakerBox.sol";
import { MockStableToken } from "contracts/stability/test/MockStableToken.sol";

import { SortedOracles } from "contracts/stability/SortedOracles.sol";

contract SortedOraclesTest is Test {
  address deployer;
  address notOwner;
  address oracle;

  uint256 aReportExpiry = 3600;

  MockBreakerBox mockBreakerBox;
  MockStableToken mockStableToken;

  bytes32 constant MOCK_EXCHANGE_ID = keccak256(abi.encodePacked("mockExchange"));

  event ReportExpirySet(uint256 reportExpiry);
  event TokenReportExpirySet(address token, uint256 reportExpiry);
  event BreakerBoxUpdated(address indexed newBreakerBox);

  SortedOracles testee;

  function setUp() public {
    deployer = actor("deployer");
    notOwner = actor("notOwner");
    oracle = actor("oracle");

    changePrank(deployer);

    mockBreakerBox = new MockBreakerBox();
    mockStableToken = new MockStableToken();

    vm.mockCall(
      address(mockStableToken),
      abi.encodeWithSelector(mockStableToken.getExchangeRegistryId.selector),
      abi.encode(MOCK_EXCHANGE_ID)
    );

    testee = new SortedOracles(true);
    testee.initialize(aReportExpiry);
  }
}

contract SortedOraclesTest_initializeAndSetters is SortedOraclesTest {
  /* ---------- Initilizer ---------- */
  function test_initialize_shouldSetOwner() public {
    assert(testee.owner() == deployer);
  }

  function test_initialize_shouldSetReportExpiry() public {
    assertEq(testee.reportExpirySeconds(), aReportExpiry);
  }

  function test_initialize_shouldNotBeCallableAgain() public {
    vm.expectRevert("contract already initialized");
    testee.initialize(aReportExpiry);
  }

  /* ---------- Setters ---------- */

  function test_setReportExpiry_whenCalledByNonOwner_shouldRevert() public {
    changePrank(notOwner);
    vm.expectRevert("Ownable: caller is not the owner");
    testee.setReportExpiry(9999);
  }

  function test_setReportExpiry_shouldUpdateAndEmit() public {
    uint256 newReportExpiry = aReportExpiry + 1;
    vm.expectEmit(false, false, false, true);
    emit ReportExpirySet(newReportExpiry);

    testee.setReportExpiry(newReportExpiry);
    assertEq(testee.reportExpirySeconds(), newReportExpiry);
  }

  function test_setTokenReportExpiry_whenCalledByNonOwner_shouldRevert() public {
    changePrank(notOwner);
    vm.expectRevert("Ownable: caller is not the owner");
    testee.setTokenReportExpiry(address(mockStableToken), 9999);
  }

  function test_setTokenReportExpiry_shouldUpdateAndEmit() public {
    vm.expectEmit(true, false, false, true);
    emit TokenReportExpirySet(address(mockStableToken), 9999);

    testee.setTokenReportExpiry(address(mockStableToken), 9999);
    assertEq(testee.tokenReportExpirySeconds(address(mockStableToken)), 9999);
  }

  function test_setBreakerBox_whenCalledByNonOwner_shouldRevert() public {
    changePrank(notOwner);
    vm.expectRevert("Ownable: caller is not the owner");
    testee.setBreakerBox(MockBreakerBox(address(0)));
  }

  function test_setBreakerBox_shouldUpdateAndEmit() public {
    assertEq(address(testee.breakerBox()), address(0));
    vm.expectEmit(true, false, false, false);
    emit BreakerBoxUpdated(address(mockBreakerBox));

    testee.setBreakerBox(mockBreakerBox);
    assertEq(address(testee.breakerBox()), address(mockBreakerBox));
  }
}

contract SortedOraclesTest_report is SortedOraclesTest {
  function test_report_shouldCallBreakerBoxWithExchangeId() public {
    testee.addOracle(address(mockStableToken), oracle);
    testee.setBreakerBox(mockBreakerBox);

    vm.expectCall(
      address(mockBreakerBox),
      abi.encodeWithSelector(mockBreakerBox.checkBreakers.selector, MOCK_EXCHANGE_ID)
    );

    changePrank(oracle);

    testee.report(address(mockStableToken), 9999, address(0), address(0));
  }
}
