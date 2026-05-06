// SPDX-License-Identifier: LGPL-3.0-only
pragma solidity >=0.8.7 <0.8.20;

import { Test } from "celo-foundry-8/Test.sol";

import { GasSponsoredOFTBridge } from "@celo-contracts-8/common/GasSponsoredOFTBridge.sol";
import {
  IOFT,
  SendParam,
  MessagingFee,
  MessagingReceipt,
  OFTReceipt
} from "@celo-contracts-8/common/interfaces/ILayerZeroOFT.sol";
import { ISortedOracles } from "@celo-contracts/stability/interfaces/ISortedOracles.sol";
import { IERC20Metadata } from "@openzeppelin/contracts8/token/ERC20/extensions/IERC20Metadata.sol";

import { MockERC20 } from "./mocks/MockERC20.sol";
import { MockOFT } from "./mocks/MockOFT.sol";
import { MockSortedOraclesForBridge } from "./mocks/MockSortedOraclesForBridge.sol";

contract GasSponsoredOFTBridgeTestBase is Test {
  GasSponsoredOFTBridge public bridge;
  MockERC20 public token;
  MockOFT public mockOft;
  MockSortedOraclesForBridge public mockOracle;

  address public user = actor("user");
  address public operator = actor("operator");
  address public oracleRateFeedId = address(0xFEED);

  // 1 CELO = 0.50 USD  =>  medianRate returns (0.5e24, 1e24)
  // i.e. 1 CELO buys 0.5 USDT
  uint256 constant ORACLE_NUMERATOR = 0.5e24;
  uint256 constant ORACLE_DENOMINATOR = 1e24;

  uint256 constant MAX_GAS = 1 ether;
  uint256 constant DEFAULT_PRICE_FACTOR = 12_000; // 1.2x

  event LogSend(
    address indexed sender,
    address indexed oft,
    uint256 amountLD,
    uint256 nativeFee,
    uint256 feeInToken,
    uint256 totalAmount
  );
  event LogSetMaxGas(uint256 maxGas);
  event LogSetPriceFactor(uint256 oldPriceFactor, uint256 newPriceFactor);
  event LogOperatorChanged(address indexed operator, bool enabled);
  event LogExecute(address indexed operator, address indexed target, uint256 value, bytes data);

  function setUp() public {
    // Deploy mocks
    token = new MockERC20("Tether USD", "USDT", 6);
    mockOft = new MockOFT(address(token));
    mockOracle = new MockSortedOraclesForBridge();
    mockOracle.setMedianRate(oracleRateFeedId, ORACLE_NUMERATOR, ORACLE_DENOMINATOR);

    // Deploy bridge
    bridge = new GasSponsoredOFTBridge(token, ISortedOracles(address(mockOracle)), oracleRateFeedId, MAX_GAS);

    // Fund the bridge with CELO so it can sponsor gas
    vm.deal(address(bridge), 10 ether);

    // Give user tokens and approve bridge
    token.mint(user, 1_000_000e6); // 1M USDT
    vm.prank(user);
    token.approve(address(bridge), type(uint256).max);

    // Set up operator and whitelist the mock OFT
    bridge.setOperator(operator, true);
    bridge.setAllowedOFT(address(mockOft), true);
  }

  function _defaultSendParam(uint256 amount) internal pure returns (SendParam memory) {
    return
      SendParam({
        dstEid: 30101, // Ethereum mainnet EID
        to: bytes32(uint256(uint160(address(0xBEEF)))),
        amountLD: amount,
        minAmountLD: amount,
        extraOptions: "",
        composeMsg: "",
        oftCmd: ""
      });
  }

  function _defaultFee(uint256 nativeFee) internal pure returns (MessagingFee memory) {
    return MessagingFee({ nativeFee: nativeFee, lzTokenFee: 0 });
  }
}

// =============================================================================
// send()
// =============================================================================

contract GasSponsoredOFTBridge_Send is GasSponsoredOFTBridgeTestBase {
  function test_Send_HappyPath() public {
    uint256 bridgeAmount = 100e6; // 100 USDT
    uint256 nativeFee = 0.01 ether; // 0.01 CELO for LZ fee

    // Expected fee in USDT:
    // 0.01 CELO * (0.5e24 / 1e24) * (1e6 / 1e18) * (12000 / 10000)
    // = 0.01 * 0.5 * 1e-12 * 1.2 (but in 6-decimal token)
    // = 0.01e18 * 0.5e24 * 1e6 * 12000 / (1e24 * 1e18 * 10000)
    // = 6000 (= 0.006 USDT)
    uint256 expectedFee = (0.01e18 * ORACLE_NUMERATOR * 1e6 * DEFAULT_PRICE_FACTOR) /
      (ORACLE_DENOMINATOR * 1e18 * 10_000);

    uint256 userBalanceBefore = token.balanceOf(user);
    uint256 bridgeCeloBefore = address(bridge).balance;

    vm.prank(user);
    (MessagingReceipt memory msgReceipt, OFTReceipt memory oftReceipt) = bridge.send(
      IOFT(address(mockOft)),
      _defaultSendParam(bridgeAmount),
      _defaultFee(nativeFee)
    );

    // User paid bridgeAmount + fee
    assertEq(token.balanceOf(user), userBalanceBefore - bridgeAmount - expectedFee);
    // Bridge spent CELO
    assertEq(address(bridge).balance, bridgeCeloBefore - nativeFee);
    // OFT received the bridge amount
    assertEq(token.balanceOf(address(mockOft)), bridgeAmount);
    // Bridge collected the fee
    assertEq(token.balanceOf(address(bridge)), expectedFee);
    // Receipts are populated
    assertEq(oftReceipt.amountSentLD, bridgeAmount);
    assertEq(msgReceipt.nonce, 1);
  }

  function test_Send_EmitsLogSend() public {
    uint256 bridgeAmount = 50e6;
    uint256 nativeFee = 0.02 ether;
    uint256 expectedFee = (0.02e18 * ORACLE_NUMERATOR * 1e6 * DEFAULT_PRICE_FACTOR) /
      (ORACLE_DENOMINATOR * 1e18 * 10_000);

    vm.expectEmit(true, true, false, true);
    emit LogSend(user, address(mockOft), bridgeAmount, nativeFee, expectedFee, bridgeAmount + expectedFee);

    vm.prank(user);
    bridge.send(IOFT(address(mockOft)), _defaultSendParam(bridgeAmount), _defaultFee(nativeFee));
  }

  function test_Revert_Send_GasLimitExceeded() public {
    vm.prank(user);
    vm.expectRevert("Gas limit exceeded");
    bridge.send(
      IOFT(address(mockOft)),
      _defaultSendParam(100e6),
      _defaultFee(MAX_GAS + 1) // exceeds limit
    );
  }

  function test_Revert_Send_InsufficientCeloBalance() public {
    // Drain the bridge's CELO
    vm.prank(address(bridge));
    (bool ok, ) = address(0xdead).call{ value: address(bridge).balance }("");
    require(ok);

    // Increase maxGas so it won't revert on that check
    bridge.setMaxGas(2 ether);

    vm.prank(user);
    vm.expectRevert("Insufficient CELO balance");
    bridge.send(IOFT(address(mockOft)), _defaultSendParam(100e6), _defaultFee(1 ether));
  }

  function test_Revert_Send_NoOracleRate() public {
    // Set oracle to return 0 denominator (no rate)
    mockOracle.setMedianRate(oracleRateFeedId, 0, 0);

    vm.prank(user);
    vm.expectRevert("No oracle rate available");
    bridge.send(IOFT(address(mockOft)), _defaultSendParam(100e6), _defaultFee(0.01 ether));
  }

  function test_Revert_Send_StaleOracleRate() public {
    mockOracle.setExpired(oracleRateFeedId, true);

    vm.prank(user);
    vm.expectRevert("Oracle rate is stale");
    bridge.send(IOFT(address(mockOft)), _defaultSendParam(100e6), _defaultFee(0.01 ether));
  }

  function test_Revert_Send_OFTNotWhitelisted() public {
    MockOFT rogue = new MockOFT(address(token));

    vm.prank(user);
    vm.expectRevert("OFT not whitelisted");
    bridge.send(IOFT(address(rogue)), _defaultSendParam(100e6), _defaultFee(0.01 ether));
  }
}

// =============================================================================
// quoteSend()
// =============================================================================

contract GasSponsoredOFTBridge_QuoteSend is GasSponsoredOFTBridgeTestBase {
  function test_QuoteSend_ReturnsCorrectTotal() public {
    uint256 bridgeAmount = 200e6;
    uint256 nativeFee = 0.05 ether;

    uint256 expectedFee = (0.05e18 * ORACLE_NUMERATOR * 1e6 * DEFAULT_PRICE_FACTOR) /
      (ORACLE_DENOMINATOR * 1e18 * 10_000);

    uint256 total = bridge.quoteSend(_defaultSendParam(bridgeAmount), _defaultFee(nativeFee));
    assertEq(total, bridgeAmount + expectedFee);
  }

  function test_QuoteSend_ZeroNativeFee() public {
    uint256 bridgeAmount = 100e6;
    uint256 total = bridge.quoteSend(_defaultSendParam(bridgeAmount), _defaultFee(0));
    assertEq(total, bridgeAmount);
  }
}

// =============================================================================
// Price factor
// =============================================================================

contract GasSponsoredOFTBridge_PriceFactor is GasSponsoredOFTBridgeTestBase {
  function test_PriceFactor_AffectsFee() public {
    uint256 nativeFee = 0.01 ether;
    uint256 bridgeAmount = 100e6;

    // Get fee at default 1.2x
    uint256 total1 = bridge.quoteSend(_defaultSendParam(bridgeAmount), _defaultFee(nativeFee));

    // Change to 2.0x
    bridge.setPriceFactor(20_000);
    uint256 total2 = bridge.quoteSend(_defaultSendParam(bridgeAmount), _defaultFee(nativeFee));

    // Fee portion at 2.0x should be larger than at 1.2x
    uint256 fee1 = total1 - bridgeAmount;
    uint256 fee2 = total2 - bridgeAmount;
    assertGt(fee2, fee1);
    // 2.0x / 1.2x = 5/3
    assertEq(fee2 * 3, fee1 * 5);
  }

  function test_Revert_SetPriceFactor_Zero() public {
    vm.expectRevert("Price factor must be > 0");
    bridge.setPriceFactor(0);
  }

  function test_Revert_SetPriceFactor_NotOwner() public {
    vm.prank(user);
    vm.expectRevert("Ownable: caller is not the owner");
    bridge.setPriceFactor(15_000);
  }
}

// =============================================================================
// Access control
// =============================================================================

contract GasSponsoredOFTBridge_AccessControl is GasSponsoredOFTBridgeTestBase {
  function test_SetMaxGas_OnlyOwner() public {
    bridge.setMaxGas(5 ether);
    assertEq(bridge.maxGas(), 5 ether);
  }

  function test_Revert_SetMaxGas_NotOwner() public {
    vm.prank(user);
    vm.expectRevert("Ownable: caller is not the owner");
    bridge.setMaxGas(5 ether);
  }

  function test_SetOperator() public {
    address newOp = address(0x1234);
    bridge.setOperator(newOp, true);
    assertTrue(bridge.operators(newOp));

    bridge.setOperator(newOp, false);
    assertFalse(bridge.operators(newOp));
  }

  function test_Revert_SetOperator_NotOwner() public {
    vm.prank(user);
    vm.expectRevert("Ownable: caller is not the owner");
    bridge.setOperator(address(0x1234), true);
  }

  function test_SetSortedOracles() public {
    MockSortedOraclesForBridge newOracle = new MockSortedOraclesForBridge();
    bridge.setSortedOracles(ISortedOracles(address(newOracle)));
    assertEq(address(bridge.sortedOracles()), address(newOracle));
  }

  function test_Revert_SetSortedOracles_ZeroAddress() public {
    vm.expectRevert("Oracle is zero address");
    bridge.setSortedOracles(ISortedOracles(address(0)));
  }

  function test_SetOracleRateFeedId() public {
    address newFeed = address(0xABCD);
    bridge.setOracleRateFeedId(newFeed);
    assertEq(bridge.oracleRateFeedId(), newFeed);
  }

  function test_Revert_SetOracleRateFeedId_ZeroAddress() public {
    vm.expectRevert("Feed ID is zero address");
    bridge.setOracleRateFeedId(address(0));
  }

  function test_SetAllowedOFT() public {
    address newOft = address(0x9999);
    bridge.setAllowedOFT(newOft, true);
    assertTrue(bridge.allowedOFTs(newOft));

    bridge.setAllowedOFT(newOft, false);
    assertFalse(bridge.allowedOFTs(newOft));
  }

  function test_Revert_SetAllowedOFT_NotOwner() public {
    vm.prank(user);
    vm.expectRevert("Ownable: caller is not the owner");
    bridge.setAllowedOFT(address(0x9999), true);
  }
}

// =============================================================================
// execute()
// =============================================================================

contract GasSponsoredOFTBridge_Execute is GasSponsoredOFTBridgeTestBase {
  function test_Execute_OperatorCanCall() public {
    address target = address(0xBEEF);
    vm.deal(address(bridge), 1 ether);

    vm.prank(operator);
    bridge.execute(target, 0.1 ether, "");

    assertEq(target.balance, 0.1 ether);
  }

  function test_Execute_OwnerCanCall() public {
    address target = address(0xBEEF);
    bridge.execute(target, 0, "");
  }

  function test_Revert_Execute_NotOperator() public {
    vm.prank(user);
    vm.expectRevert("Not operator or owner");
    bridge.execute(address(0xBEEF), 0, "");
  }

  function test_Revert_Execute_CannotCallSelf() public {
    vm.prank(operator);
    vm.expectRevert("Cannot call self");
    bridge.execute(address(bridge), 0, abi.encodeWithSignature("setMaxGas(uint256)", 999));
  }

  function test_Revert_Execute_CallFails() public {
    // Call an address that will revert
    vm.prank(operator);
    vm.expectRevert("Execute call failed");
    bridge.execute(address(mockOft), 0, abi.encodeWithSignature("nonExistentFunction()"));
  }
}

// =============================================================================
// Constructor validation
// =============================================================================

contract GasSponsoredOFTBridge_Constructor is Test {
  function test_Revert_Constructor_ZeroToken() public {
    MockSortedOraclesForBridge oracle = new MockSortedOraclesForBridge();
    vm.expectRevert("Token is zero address");
    new GasSponsoredOFTBridge(
      IERC20Metadata(address(0)),
      ISortedOracles(address(oracle)),
      address(0xFEED),
      1 ether
    );
  }

  function test_Revert_Constructor_ZeroOracle() public {
    MockERC20 tok = new MockERC20("T", "T", 6);
    vm.expectRevert("Oracle is zero address");
    new GasSponsoredOFTBridge(tok, ISortedOracles(address(0)), address(0xFEED), 1 ether);
  }

  function test_Revert_Constructor_ZeroFeedId() public {
    MockERC20 tok = new MockERC20("T", "T", 6);
    MockSortedOraclesForBridge oracle = new MockSortedOraclesForBridge();
    vm.expectRevert("Feed ID is zero address");
    new GasSponsoredOFTBridge(tok, ISortedOracles(address(oracle)), address(0), 1 ether);
  }
}
