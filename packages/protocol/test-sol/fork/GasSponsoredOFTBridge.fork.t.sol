// SPDX-License-Identifier: LGPL-3.0-only
pragma solidity >=0.8.7 <0.8.20;

import { Test } from "celo-foundry-8/Test.sol";
import "forge-std-8/console.sol";

import { GasSponsoredOFTBridge } from "@celo-contracts-8/common/GasSponsoredOFTBridge.sol";
import {
  IOFT,
  SendParam,
  MessagingFee,
  MessagingReceipt,
  OFTReceipt
} from "@celo-contracts-8/common/interfaces/ILayerZeroOFT.sol";
import { ISortedOracles } from "@celo-contracts/stability/interfaces/ISortedOracles.sol";
import { IERC20 } from "@openzeppelin/contracts8/token/ERC20/IERC20.sol";
import { IERC20Metadata } from "@openzeppelin/contracts8/token/ERC20/extensions/IERC20Metadata.sol";
import { SafeERC20 } from "@openzeppelin/contracts8/token/ERC20/utils/SafeERC20.sol";

// =============================================================================
// Mock OFT for fork testing (simulates LayerZero OFT send behavior)
// =============================================================================
contract ForkMockOFT is IOFT {
  using SafeERC20 for IERC20;

  address public immutable _token;
  uint64 private _nonce;

  constructor(address token_) {
    _token = token_;
  }

  function token() external view override returns (address) {
    return _token;
  }

  function send(
    SendParam calldata _sendParam,
    MessagingFee calldata,
    address
  ) external payable override returns (MessagingReceipt memory msgReceipt, OFTReceipt memory oftReceipt) {
    // Pull tokens from the bridge (simulates OFT locking/burning tokens)
    IERC20(_token).safeTransferFrom(msg.sender, address(this), _sendParam.amountLD);
    _nonce++;

    msgReceipt = MessagingReceipt({
      guid: keccak256(abi.encodePacked(_nonce, block.timestamp)),
      nonce: _nonce,
      fee: MessagingFee({ nativeFee: msg.value, lzTokenFee: 0 })
    });

    oftReceipt = OFTReceipt({
      amountSentLD: _sendParam.amountLD,
      amountReceivedLD: _sendParam.amountLD
    });
  }
}

// =============================================================================
// Fork integration test
// =============================================================================
contract GasSponsoredOFTBridgeForkTest is Test {
  // --- Celo Mainnet addresses ---
  address constant REGISTRY = 0x000000000000000000000000000000000000ce10;
  address constant SORTED_ORACLES = 0xefB84935239dAcdecF7c5bA76d8dE40b077B7b33;
  address constant USDT = 0x48065fbBE25f71C9282ddf5e1cD6D6A887483D5e; // Native bridge USDT (6 decimals)
  address constant USDT_ADAPTER = 0x0E2A3e05bc9A16F5292A6170456A710cb89C6f72; // Fee currency adapter for USDT
  address constant CUSD = 0x765DE816845861e75A25fCA122bb6898B8B1282a;
  address constant LZ_ENDPOINT_V2 = 0x1a44076050125825900e736c501f859c50fE728c;

  GasSponsoredOFTBridge public bridge;
  ForkMockOFT public mockOft;

  address public deployer;
  address public user;
  address public operator;

  uint256 constant MAX_GAS = 5 ether;

  function setUp() public {
    deployer = makeAddr("deployer");
    user = makeAddr("user");
    operator = makeAddr("operator");

    vm.startPrank(deployer);

    // Deploy the bridge against real Celo mainnet state
    bridge = new GasSponsoredOFTBridge(
      IERC20Metadata(USDT),
      ISortedOracles(SORTED_ORACLES),
      USDT_ADAPTER, // Uses the adapter as rateFeedId (has equivalentToken -> cUSD)
      MAX_GAS
    );

    // Deploy a mock OFT (since we don't have a real USDT OFT on Celo)
    mockOft = new ForkMockOFT(USDT);

    // Set up operator and whitelist the mock OFT
    bridge.setOperator(operator, true);
    bridge.setAllowedOFT(address(mockOft), true);

    vm.stopPrank();

    // Fund the bridge with CELO for gas sponsoring
    vm.deal(address(bridge), 100 ether);

    // Mint USDT to user via deal (Foundry cheatcode)
    deal(USDT, user, 10_000e6); // 10,000 USDT

    // User approves the bridge to spend USDT
    vm.prank(user);
    IERC20(USDT).approve(address(bridge), type(uint256).max);

    // On a fork snapshot, oracle reports may be naturally expired.
    // Mock the staleness check so fork tests exercise rate conversion logic.
    // (Staleness revert is covered by unit tests.)
    vm.mockCall(
      SORTED_ORACLES,
      abi.encodeWithSelector(ISortedOracles.isOldestReportExpired.selector, USDT_ADAPTER),
      abi.encode(false, address(0))
    );
  }

  // =========================================================================
  // Deployment verification
  // =========================================================================

  function test_Fork_Deployment_StateIsCorrect() public {
    assertEq(address(bridge.token()), USDT);
    assertEq(address(bridge.sortedOracles()), SORTED_ORACLES);
    assertEq(bridge.oracleRateFeedId(), USDT_ADAPTER);
    assertEq(bridge.maxGas(), MAX_GAS);
    assertEq(bridge.priceFactor(), 12_000);
    assertEq(bridge.tokenPrecision(), 1e6); // USDT has 6 decimals
    assertEq(bridge.owner(), deployer);
    assertTrue(bridge.operators(operator));
  }

  function test_Fork_TokenMetadata() public {
    IERC20Metadata usdt = IERC20Metadata(USDT);
    assertEq(usdt.decimals(), 6);
    console.log("USDT name:", usdt.name());
    console.log("USDT symbol:", usdt.symbol());
    console.log("USDT totalSupply:", usdt.totalSupply());
  }

  // =========================================================================
  // Oracle integration
  // =========================================================================

  function test_Fork_OracleRateIsLive() public {
    (uint256 numerator, uint256 denominator) = ISortedOracles(SORTED_ORACLES).medianRate(
      USDT_ADAPTER
    );

    console.log("Oracle numerator:", numerator);
    console.log("Oracle denominator:", denominator);

    // Denominator should be 1e24 (FIXED1_UINT) if rates exist
    assertGt(denominator, 0, "Oracle has no rate");

    // Rate should be sensible: numerator/denominator is CELO price in USD
    // CELO is somewhere between $0.01 and $100
    uint256 celoInUsdScaled = (numerator * 1e18) / denominator; // scale to 18 decimals
    console.log("CELO price in USD (1e18 scaled):", celoInUsdScaled);
    assertGt(celoInUsdScaled, 0.001e18, "Rate too low"); // > $0.001
    assertLt(celoInUsdScaled, 100e18, "Rate too high"); // < $100
  }

  // =========================================================================
  // quoteSend() with real oracle
  // =========================================================================

  function test_Fork_QuoteSend_ReturnsRealisticTotal() public {
    uint256 bridgeAmount = 100e6; // 100 USDT
    uint256 nativeFee = 0.1 ether; // 0.1 CELO for LZ messaging

    SendParam memory sendParam = _makeSendParam(bridgeAmount);
    MessagingFee memory fee = MessagingFee({ nativeFee: nativeFee, lzTokenFee: 0 });

    uint256 total = bridge.quoteSend(sendParam, fee);
    uint256 feeInUsdt = total - bridgeAmount;

    console.log("Bridge amount (USDT, 6 dec):", bridgeAmount);
    console.log("LZ native fee (CELO wei):", nativeFee);
    console.log("Fee in USDT (6 dec):", feeInUsdt);
    console.log("Total USDT needed (6 dec):", total);
    console.log("Fee in human USDT:", feeInUsdt, "/ 1e6");

    // Fee should be positive and reasonable
    assertGt(feeInUsdt, 0, "Fee should be > 0");
    // 0.1 CELO at ~$0.09 = ~$0.009, with 1.2x ≈ $0.011 -> 11000 in 6-dec
    // But CELO price could vary, so wide bounds
    assertLt(feeInUsdt, bridgeAmount, "Fee should be less than bridge amount");
  }

  function test_Fork_QuoteSend_ScalesWithNativeFee() public {
    uint256 bridgeAmount = 100e6;

    uint256 total1 = bridge.quoteSend(
      _makeSendParam(bridgeAmount),
      MessagingFee({ nativeFee: 0.1 ether, lzTokenFee: 0 })
    );
    uint256 total2 = bridge.quoteSend(
      _makeSendParam(bridgeAmount),
      MessagingFee({ nativeFee: 1 ether, lzTokenFee: 0 })
    );

    uint256 fee1 = total1 - bridgeAmount;
    uint256 fee2 = total2 - bridgeAmount;

    // 10x native fee should give ~10x token fee (small rounding diff from integer division)
    assertApproxEqRel(fee2, fee1 * 10, 0.001e18, "Fee should scale ~linearly with native fee");
  }

  // =========================================================================
  // send() end-to-end with real oracle + mock OFT
  // =========================================================================

  function test_Fork_Send_EndToEnd() public {
    uint256 bridgeAmount = 500e6; // 500 USDT
    uint256 nativeFee = 0.05 ether; // 0.05 CELO

    // Get expected fee first
    SendParam memory sendParam = _makeSendParam(bridgeAmount);
    MessagingFee memory fee = MessagingFee({ nativeFee: nativeFee, lzTokenFee: 0 });
    uint256 expectedTotal = bridge.quoteSend(sendParam, fee);
    uint256 expectedFeeInUsdt = expectedTotal - bridgeAmount;

    console.log("=== send() E2E ===");
    console.log("Bridge amount:", bridgeAmount);
    console.log("Expected fee in USDT:", expectedFeeInUsdt);
    console.log("Expected total:", expectedTotal);

    uint256 userBalBefore = IERC20(USDT).balanceOf(user);
    uint256 bridgeCeloBefore = address(bridge).balance;

    vm.prank(user);
    (MessagingReceipt memory msgReceipt, OFTReceipt memory oftReceipt) = bridge.send(
      IOFT(address(mockOft)),
      sendParam,
      fee
    );

    // Verify user paid exactly bridgeAmount + fee
    uint256 userPaid = userBalBefore - IERC20(USDT).balanceOf(user);
    assertEq(userPaid, expectedTotal, "User should pay exact quoted total");

    // Verify bridge CELO was spent
    uint256 celoSpent = bridgeCeloBefore - address(bridge).balance;
    assertEq(celoSpent, nativeFee, "Bridge should spend exact native fee");

    // Verify OFT received the bridge amount
    assertEq(IERC20(USDT).balanceOf(address(mockOft)), bridgeAmount, "OFT should receive bridge amount");

    // Verify bridge collected the fee
    assertEq(
      IERC20(USDT).balanceOf(address(bridge)),
      expectedFeeInUsdt,
      "Bridge should collect fee in USDT"
    );

    // Verify receipts
    assertEq(oftReceipt.amountSentLD, bridgeAmount);
    assertGt(uint256(msgReceipt.nonce), 0);

    console.log("User paid total:", userPaid);
    console.log("CELO spent:", celoSpent);
    console.log("Fee collected by bridge:", IERC20(USDT).balanceOf(address(bridge)));
    console.log("SUCCESS: Full send() E2E passed");
  }

  function test_Fork_Send_MultipleSendsAccumulateFees() public {
    uint256 bridgeAmount = 100e6;
    uint256 nativeFee = 0.01 ether;
    SendParam memory sendParam = _makeSendParam(bridgeAmount);
    MessagingFee memory fee = MessagingFee({ nativeFee: nativeFee, lzTokenFee: 0 });

    // Do 3 sends
    for (uint256 i = 0; i < 3; i++) {
      vm.prank(user);
      bridge.send(IOFT(address(mockOft)), sendParam, fee);
    }

    // Bridge should have collected 3x fee
    uint256 singleFee = bridge.quoteSend(sendParam, fee) - bridgeAmount;
    assertEq(
      IERC20(USDT).balanceOf(address(bridge)),
      singleFee * 3,
      "Fees should accumulate over multiple sends"
    );
  }

  // =========================================================================
  // Operator withdrawals (execute)
  // =========================================================================

  function test_Fork_Execute_WithdrawAccumulatedFees() public {
    // First do a send to accumulate fees
    uint256 bridgeAmount = 1000e6;
    uint256 nativeFee = 0.1 ether;
    vm.prank(user);
    bridge.send(
      IOFT(address(mockOft)),
      _makeSendParam(bridgeAmount),
      MessagingFee({ nativeFee: nativeFee, lzTokenFee: 0 })
    );

    uint256 feesCollected = IERC20(USDT).balanceOf(address(bridge));
    assertGt(feesCollected, 0);

    // Operator withdraws the accumulated USDT fees
    address treasury = makeAddr("treasury");
    bytes memory transferCall = abi.encodeWithSelector(
      IERC20.transfer.selector,
      treasury,
      feesCollected
    );

    vm.prank(operator);
    bridge.execute(USDT, 0, transferCall);

    assertEq(IERC20(USDT).balanceOf(treasury), feesCollected);
    assertEq(IERC20(USDT).balanceOf(address(bridge)), 0);

    console.log("Operator withdrew USDT fees:", feesCollected);
  }

  function test_Fork_Execute_RefundCelo() public {
    // Operator can withdraw excess CELO
    address treasury = makeAddr("treasury");
    uint256 bridgeCelo = address(bridge).balance;

    vm.prank(operator);
    bridge.execute(treasury, 1 ether, "");

    assertEq(treasury.balance, 1 ether);
    assertEq(address(bridge).balance, bridgeCelo - 1 ether);
  }

  // =========================================================================
  // Edge cases on fork
  // =========================================================================

  function test_Fork_Revert_MaxGasExceeded() public {
    vm.prank(user);
    vm.expectRevert("Gas limit exceeded");
    bridge.send(
      IOFT(address(mockOft)),
      _makeSendParam(100e6),
      MessagingFee({ nativeFee: MAX_GAS + 1, lzTokenFee: 0 })
    );
  }

  function test_Fork_Revert_InsufficientCeloBalance() public {
    // Drain the bridge's CELO
    vm.prank(deployer);
    bridge.setMaxGas(200 ether);

    vm.prank(operator);
    bridge.execute(makeAddr("drain"), address(bridge).balance, "");

    vm.prank(user);
    vm.expectRevert("Insufficient CELO balance");
    bridge.send(
      IOFT(address(mockOft)),
      _makeSendParam(100e6),
      MessagingFee({ nativeFee: 1 ether, lzTokenFee: 0 })
    );
  }

  function test_Fork_Revert_InsufficientTokenAllowance() public {
    // User with no approval
    address user2 = makeAddr("user2");
    deal(USDT, user2, 10_000e6);

    vm.prank(user2);
    vm.expectRevert(); // SafeERC20 will revert on transferFrom
    bridge.send(
      IOFT(address(mockOft)),
      _makeSendParam(100e6),
      MessagingFee({ nativeFee: 0.01 ether, lzTokenFee: 0 })
    );
  }

  // =========================================================================
  // LZ endpoint verification (read-only)
  // =========================================================================

  function test_Fork_LZEndpointExists() public {
    uint256 codeSize;
    address endpoint = LZ_ENDPOINT_V2;
    assembly {
      codeSize := extcodesize(endpoint)
    }
    assertGt(codeSize, 0, "LZ EndpointV2 should have code on Celo mainnet");
    console.log("LZ EndpointV2 code size:", codeSize);
  }

  // =========================================================================
  // Helpers
  // =========================================================================

  function _makeSendParam(uint256 amount) internal pure returns (SendParam memory) {
    return
      SendParam({
        dstEid: 30101, // Ethereum mainnet LZ eid
        to: bytes32(uint256(uint160(address(0xBEEF)))),
        amountLD: amount,
        minAmountLD: amount,
        extraOptions: "",
        composeMsg: "",
        oftCmd: ""
      });
  }
}
