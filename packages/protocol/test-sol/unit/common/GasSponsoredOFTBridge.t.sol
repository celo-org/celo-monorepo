// SPDX-License-Identifier: LGPL-3.0-only
pragma solidity >=0.8.7 <0.8.20;

import { Test } from "celo-foundry-8/Test.sol";

import { GasSponsoredOFTBridge } from "@celo-contracts-8/common/GasSponsoredOFTBridge.sol";
import { IOFT, SendParam, MessagingFee, MessagingReceipt, OFTReceipt } from "@celo-contracts-8/common/interfaces/ILayerZeroOFT.sol";
import { ISortedOracles } from "@celo-contracts/stability/interfaces/ISortedOracles.sol";
import { IERC20 } from "@openzeppelin/contracts8/token/ERC20/IERC20.sol";
import { IERC20Metadata } from "@openzeppelin/contracts8/token/ERC20/extensions/IERC20Metadata.sol";

import { MockERC20 } from "./mocks/MockERC20.sol";
import { MockOFT } from "./mocks/MockOFT.sol";
import { MockSortedOraclesForBridge } from "./mocks/MockSortedOraclesForBridge.sol";

contract GasSponsoredOFTBridgeTestBase is Test {
  GasSponsoredOFTBridge public bridge;
  MockERC20 public usdt;
  MockERC20 public usdc;
  MockOFT public usdtOft;
  MockOFT public usdcOft;
  MockSortedOraclesForBridge public mockOracle;

  address public user = actor("user");
  address public operator = actor("operator");
  address public usdtRateFeedId = address(0xFEED1);
  address public usdcRateFeedId = address(0xFEED2);

  // 1 CELO = 0.50 USD => medianRate returns (0.5e24, 1e24)
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
  event LogOFTConfigSet(
    address indexed oft,
    address indexed token,
    address oracleRateFeedId,
    uint256 tokenPrecision
  );
  event LogOFTConfigRemoved(address indexed oft);

  function setUp() public {
    // Deploy mocks
    usdt = new MockERC20("Tether USD", "USDT", 6);
    usdc = new MockERC20("USD Coin", "USDC", 6);
    usdtOft = new MockOFT(address(usdt));
    usdcOft = new MockOFT(address(usdc));
    mockOracle = new MockSortedOraclesForBridge();
    mockOracle.setMedianRate(usdtRateFeedId, ORACLE_NUMERATOR, ORACLE_DENOMINATOR);
    mockOracle.setMedianRate(usdcRateFeedId, ORACLE_NUMERATOR, ORACLE_DENOMINATOR);

    // Deploy bridge (multi-token: no token in constructor)
    bridge = new GasSponsoredOFTBridge(ISortedOracles(address(mockOracle)), MAX_GAS);

    // Register OFTs
    bridge.setOFTConfig(address(usdtOft), usdt, usdtRateFeedId);
    bridge.setOFTConfig(address(usdcOft), usdc, usdcRateFeedId);

    // Fund the bridge with CELO
    vm.deal(address(bridge), 10 ether);

    // Give user tokens and approve bridge
    usdt.mint(user, 1_000_000e6);
    usdc.mint(user, 1_000_000e6);
    vm.startPrank(user);
    usdt.approve(address(bridge), type(uint256).max);
    usdc.approve(address(bridge), type(uint256).max);
    vm.stopPrank();

    // Set up operator
    bridge.setOperator(operator, true);
  }

  function _defaultSendParam(uint256 amount) internal pure returns (SendParam memory) {
    return
      SendParam({
        dstEid: 30101,
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
// send() with multi-token
// =============================================================================

contract GasSponsoredOFTBridge_Send is GasSponsoredOFTBridgeTestBase {
  function test_Send_USDT_HappyPath() public {
    uint256 bridgeAmount = 100e6;
    uint256 nativeFee = 0.01 ether;
    uint256 expectedFee = (0.01e18 * ORACLE_NUMERATOR * 1e6 * DEFAULT_PRICE_FACTOR) /
      (ORACLE_DENOMINATOR * 1e18 * 10_000);

    uint256 userBalanceBefore = usdt.balanceOf(user);

    vm.prank(user);
    bridge.send(IOFT(address(usdtOft)), _defaultSendParam(bridgeAmount), _defaultFee(nativeFee));

    assertEq(usdt.balanceOf(user), userBalanceBefore - bridgeAmount - expectedFee);
    assertEq(usdt.balanceOf(address(usdtOft)), bridgeAmount);
    assertEq(usdt.balanceOf(address(bridge)), expectedFee);
  }

  function test_Send_USDC_HappyPath() public {
    uint256 bridgeAmount = 200e6;
    uint256 nativeFee = 0.02 ether;
    uint256 expectedFee = (0.02e18 * ORACLE_NUMERATOR * 1e6 * DEFAULT_PRICE_FACTOR) /
      (ORACLE_DENOMINATOR * 1e18 * 10_000);

    uint256 userBalanceBefore = usdc.balanceOf(user);

    vm.prank(user);
    bridge.send(IOFT(address(usdcOft)), _defaultSendParam(bridgeAmount), _defaultFee(nativeFee));

    assertEq(usdc.balanceOf(user), userBalanceBefore - bridgeAmount - expectedFee);
    assertEq(usdc.balanceOf(address(usdcOft)), bridgeAmount);
    assertEq(usdc.balanceOf(address(bridge)), expectedFee);
  }

  function test_Send_BothTokensIndependently() public {
    vm.prank(user);
    bridge.send(IOFT(address(usdtOft)), _defaultSendParam(50e6), _defaultFee(0.01 ether));

    vm.prank(user);
    bridge.send(IOFT(address(usdcOft)), _defaultSendParam(75e6), _defaultFee(0.01 ether));

    // Each OFT got its bridge amount
    assertEq(usdt.balanceOf(address(usdtOft)), 50e6);
    assertEq(usdc.balanceOf(address(usdcOft)), 75e6);
    // Bridge collected fees in both tokens
    assertGt(usdt.balanceOf(address(bridge)), 0);
    assertGt(usdc.balanceOf(address(bridge)), 0);
  }

  function test_Send_EmitsLogSend() public {
    uint256 bridgeAmount = 50e6;
    uint256 nativeFee = 0.02 ether;
    uint256 expectedFee = (0.02e18 * ORACLE_NUMERATOR * 1e6 * DEFAULT_PRICE_FACTOR) /
      (ORACLE_DENOMINATOR * 1e18 * 10_000);

    vm.expectEmit(true, true, false, true);
    emit LogSend(
      user,
      address(usdtOft),
      bridgeAmount,
      nativeFee,
      expectedFee,
      bridgeAmount + expectedFee
    );

    vm.prank(user);
    bridge.send(IOFT(address(usdtOft)), _defaultSendParam(bridgeAmount), _defaultFee(nativeFee));
  }

  function test_Revert_Send_OFTNotRegistered() public {
    MockOFT rogue = new MockOFT(address(usdt));

    vm.prank(user);
    vm.expectRevert("OFT not registered");
    bridge.send(IOFT(address(rogue)), _defaultSendParam(100e6), _defaultFee(0.01 ether));
  }

  function test_Revert_Send_GasLimitExceeded() public {
    vm.prank(user);
    vm.expectRevert("Gas limit exceeded");
    bridge.send(IOFT(address(usdtOft)), _defaultSendParam(100e6), _defaultFee(MAX_GAS + 1));
  }

  function test_Revert_Send_InsufficientCeloBalance() public {
    vm.prank(address(bridge));
    (bool ok, ) = address(0xdead).call{ value: address(bridge).balance }("");
    require(ok);
    bridge.setMaxGas(2 ether);

    vm.prank(user);
    vm.expectRevert("Insufficient CELO balance");
    bridge.send(IOFT(address(usdtOft)), _defaultSendParam(100e6), _defaultFee(1 ether));
  }

  function test_Revert_Send_NoOracleRate() public {
    mockOracle.setMedianRate(usdtRateFeedId, 0, 0);

    vm.prank(user);
    vm.expectRevert("No oracle rate available");
    bridge.send(IOFT(address(usdtOft)), _defaultSendParam(100e6), _defaultFee(0.01 ether));
  }

  function test_Revert_Send_ZeroNumeratorOracle() public {
    mockOracle.setMedianRate(usdtRateFeedId, 0, 1e24);

    vm.prank(user);
    vm.expectRevert("Oracle rate numerator is zero");
    bridge.send(IOFT(address(usdtOft)), _defaultSendParam(100e6), _defaultFee(0.01 ether));
  }

  function test_Revert_Send_LzTokenFeeNotSupported() public {
    vm.prank(user);
    vm.expectRevert("LZ token fee not supported");
    bridge.send(
      IOFT(address(usdtOft)),
      _defaultSendParam(100e6),
      MessagingFee({ nativeFee: 0.01 ether, lzTokenFee: 1 })
    );
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

    uint256 total = bridge.quoteSend(
      IOFT(address(usdtOft)),
      _defaultSendParam(bridgeAmount),
      _defaultFee(nativeFee)
    );
    assertEq(total, bridgeAmount + expectedFee);
  }

  function test_QuoteSend_ZeroNativeFee() public {
    uint256 total = bridge.quoteSend(
      IOFT(address(usdtOft)),
      _defaultSendParam(100e6),
      _defaultFee(0)
    );
    assertEq(total, 100e6);
  }

  function test_QuoteSend_DifferentTokens_DifferentRates() public {
    // Set different rates for USDT and USDC
    mockOracle.setMedianRate(usdtRateFeedId, 0.5e24, 1e24); // 1 CELO = 0.5 USDT
    mockOracle.setMedianRate(usdcRateFeedId, 1e24, 1e24); // 1 CELO = 1.0 USDC

    uint256 usdtTotal = bridge.quoteSend(
      IOFT(address(usdtOft)),
      _defaultSendParam(100e6),
      _defaultFee(0.1 ether)
    );
    uint256 usdcTotal = bridge.quoteSend(
      IOFT(address(usdcOft)),
      _defaultSendParam(100e6),
      _defaultFee(0.1 ether)
    );

    uint256 usdtFee = usdtTotal - 100e6;
    uint256 usdcFee = usdcTotal - 100e6;
    // USDC fee should be 2x USDT fee (1.0 vs 0.5 rate)
    assertEq(usdcFee, usdtFee * 2);
  }

  function test_Revert_QuoteSend_UnregisteredOFT() public {
    MockOFT rogue = new MockOFT(address(usdt));
    vm.expectRevert("OFT not registered");
    bridge.quoteSend(IOFT(address(rogue)), _defaultSendParam(100e6), _defaultFee(0.01 ether));
  }
}

// =============================================================================
// OFT config management
// =============================================================================

contract GasSponsoredOFTBridge_OFTConfig is GasSponsoredOFTBridgeTestBase {
  function test_SetOFTConfig_StoresCorrectly() public {
    (IERC20 token, address feedId, uint256 precision) = bridge.oftConfigs(address(usdtOft));
    assertEq(address(token), address(usdt));
    assertEq(feedId, usdtRateFeedId);
    assertEq(precision, 1e6);
  }

  function test_SetOFTConfig_EmitsEvent() public {
    MockERC20 newToken = new MockERC20("DAI", "DAI", 18);
    MockOFT newOft = new MockOFT(address(newToken));

    vm.expectEmit(true, true, false, true);
    emit LogOFTConfigSet(address(newOft), address(newToken), address(0xFEED3), 1e18);

    bridge.setOFTConfig(address(newOft), newToken, address(0xFEED3));
  }

  function test_SetOFTConfig_18DecimalToken() public {
    MockERC20 dai = new MockERC20("DAI", "DAI", 18);
    MockOFT daiOft = new MockOFT(address(dai));
    bridge.setOFTConfig(address(daiOft), dai, address(0xFEED3));

    (, , uint256 precision) = bridge.oftConfigs(address(daiOft));
    assertEq(precision, 1e18);
  }

  function test_RemoveOFTConfig() public {
    bridge.removeOFTConfig(address(usdtOft));

    (IERC20 token, , ) = bridge.oftConfigs(address(usdtOft));
    assertEq(address(token), address(0));

    // Sending should now fail
    vm.prank(user);
    vm.expectRevert("OFT not registered");
    bridge.send(IOFT(address(usdtOft)), _defaultSendParam(100e6), _defaultFee(0.01 ether));
  }

  function test_RemoveOFTConfig_EmitsEvent() public {
    vm.expectEmit(true, false, false, false);
    emit LogOFTConfigRemoved(address(usdtOft));
    bridge.removeOFTConfig(address(usdtOft));
  }

  function test_Revert_RemoveOFTConfig_NotRegistered() public {
    vm.expectRevert("OFT not registered");
    bridge.removeOFTConfig(address(0x1234));
  }

  function test_Revert_SetOFTConfig_ZeroOFT() public {
    vm.expectRevert("OFT is zero address");
    bridge.setOFTConfig(address(0), usdt, usdtRateFeedId);
  }

  function test_Revert_SetOFTConfig_ZeroToken() public {
    vm.expectRevert("Token is zero address");
    bridge.setOFTConfig(address(0x1234), IERC20Metadata(address(0)), usdtRateFeedId);
  }

  function test_Revert_SetOFTConfig_ZeroFeedId() public {
    vm.expectRevert("Feed ID is zero address");
    bridge.setOFTConfig(address(0x1234), usdt, address(0));
  }

  function test_Revert_SetOFTConfig_NotOwner() public {
    vm.prank(user);
    vm.expectRevert("Ownable: caller is not the owner");
    bridge.setOFTConfig(address(0x1234), usdt, usdtRateFeedId);
  }
}

// =============================================================================
// Price factor
// =============================================================================

contract GasSponsoredOFTBridge_PriceFactor is GasSponsoredOFTBridgeTestBase {
  function test_PriceFactor_AffectsFee() public {
    uint256 nativeFee = 0.01 ether;
    uint256 bridgeAmount = 100e6;

    uint256 total1 = bridge.quoteSend(
      IOFT(address(usdtOft)),
      _defaultSendParam(bridgeAmount),
      _defaultFee(nativeFee)
    );

    bridge.setPriceFactor(20_000); // 2.0x

    uint256 total2 = bridge.quoteSend(
      IOFT(address(usdtOft)),
      _defaultSendParam(bridgeAmount),
      _defaultFee(nativeFee)
    );

    uint256 fee1 = total1 - bridgeAmount;
    uint256 fee2 = total2 - bridgeAmount;
    assertGt(fee2, fee1);
    assertEq(fee2 * 3, fee1 * 5); // 2.0/1.2 = 5/3
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

  function test_SetSortedOracles() public {
    MockSortedOraclesForBridge newOracle = new MockSortedOraclesForBridge();
    bridge.setSortedOracles(ISortedOracles(address(newOracle)));
    assertEq(address(bridge.sortedOracles()), address(newOracle));
  }

  function test_Revert_SetSortedOracles_ZeroAddress() public {
    vm.expectRevert("Oracle is zero address");
    bridge.setSortedOracles(ISortedOracles(address(0)));
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
    vm.prank(operator);
    vm.expectRevert("Execute call failed");
    bridge.execute(address(usdtOft), 0, abi.encodeWithSignature("nonExistentFunction()"));
  }
}

// =============================================================================
// Constructor
// =============================================================================

contract GasSponsoredOFTBridge_Constructor is Test {
  function test_Revert_Constructor_ZeroOracle() public {
    vm.expectRevert("Oracle is zero address");
    new GasSponsoredOFTBridge(ISortedOracles(address(0)), 1 ether);
  }

  function test_Constructor_SetsDefaults() public {
    MockSortedOraclesForBridge oracle = new MockSortedOraclesForBridge();
    GasSponsoredOFTBridge b = new GasSponsoredOFTBridge(ISortedOracles(address(oracle)), 5 ether);
    assertEq(b.maxGas(), 5 ether);
    assertEq(b.priceFactor(), 12_000);
    assertEq(address(b.sortedOracles()), address(oracle));
  }
}
