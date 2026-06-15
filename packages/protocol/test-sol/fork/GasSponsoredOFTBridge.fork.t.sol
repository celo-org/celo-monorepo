// SPDX-License-Identifier: LGPL-3.0-only
pragma solidity >=0.8.7 <0.8.20;

import { Test } from "celo-foundry-8/Test.sol";
import "forge-std-8/console.sol";

import { GasSponsoredOFTBridge } from "@celo-contracts-8/common/GasSponsoredOFTBridge.sol";
import { IOFT, SendParam, MessagingFee, MessagingReceipt, OFTReceipt } from "@celo-contracts-8/common/interfaces/ILayerZeroOFT.sol";
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
  )
    external
    payable
    override
    returns (MessagingReceipt memory msgReceipt, OFTReceipt memory oftReceipt)
  {
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
  address constant SORTED_ORACLES = 0xefB84935239dAcdecF7c5bA76d8dE40b077B7b33;
  address constant USDT = 0x48065fbBE25f71C9282ddf5e1cD6D6A887483D5e;
  address constant USDT_ADAPTER = 0x0E2A3e05bc9A16F5292A6170456A710cb89C6f72;
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

    // Deploy multi-token bridge
    bridge = new GasSponsoredOFTBridge(ISortedOracles(SORTED_ORACLES), MAX_GAS);

    // Deploy a mock OFT for USDT
    mockOft = new ForkMockOFT(USDT);

    // Register the OFT with USDT config
    bridge.setOFTConfig(address(mockOft), IERC20Metadata(USDT), USDT_ADAPTER);

    // Set up operator
    bridge.setOperator(operator, true);

    vm.stopPrank();

    // Fund the bridge with CELO
    vm.deal(address(bridge), 100 ether);

    // Mint USDT to user
    deal(USDT, user, 10_000e6);

    // User approves the bridge
    vm.prank(user);
    IERC20(USDT).approve(address(bridge), type(uint256).max);
  }

  // =========================================================================
  // Deployment verification
  // =========================================================================

  function test_Fork_Deployment_StateIsCorrect() public {
    assertEq(address(bridge.sortedOracles()), SORTED_ORACLES);
    assertEq(bridge.maxGas(), MAX_GAS);
    assertEq(bridge.priceFactor(), 12_000);
    assertEq(bridge.owner(), deployer);

    (IERC20 token, address feedId, uint256 precision) = bridge.oftConfigs(address(mockOft));
    assertEq(address(token), USDT);
    assertEq(feedId, USDT_ADAPTER);
    assertEq(precision, 1e6);
  }

  // =========================================================================
  // Oracle integration
  // =========================================================================

  function test_Fork_OracleRateIsLive() public {
    (uint256 numerator, uint256 denominator) = ISortedOracles(SORTED_ORACLES).medianRate(
      USDT_ADAPTER
    );
    assertGt(denominator, 0, "Oracle has no rate");

    uint256 celoInUsdScaled = (numerator * 1e18) / denominator;
    assertGt(celoInUsdScaled, 0.001e18, "Rate too low");
    assertLt(celoInUsdScaled, 100e18, "Rate too high");
  }

  // =========================================================================
  // quoteSend() with real oracle
  // =========================================================================

  function test_Fork_QuoteSend_ReturnsRealisticTotal() public {
    uint256 bridgeAmount = 100e6;
    uint256 nativeFee = 0.1 ether;

    uint256 total = bridge.quoteSend(
      IOFT(address(mockOft)),
      _makeSendParam(bridgeAmount),
      MessagingFee({ nativeFee: nativeFee, lzTokenFee: 0 })
    );
    uint256 feeInUsdt = total - bridgeAmount;

    assertGt(feeInUsdt, 0, "Fee should be > 0");
    assertLt(feeInUsdt, bridgeAmount, "Fee should be less than bridge amount");
  }

  function test_Fork_QuoteSend_ScalesWithNativeFee() public {
    uint256 bridgeAmount = 100e6;

    uint256 total1 = bridge.quoteSend(
      IOFT(address(mockOft)),
      _makeSendParam(bridgeAmount),
      MessagingFee({ nativeFee: 0.1 ether, lzTokenFee: 0 })
    );
    uint256 total2 = bridge.quoteSend(
      IOFT(address(mockOft)),
      _makeSendParam(bridgeAmount),
      MessagingFee({ nativeFee: 1 ether, lzTokenFee: 0 })
    );

    uint256 fee1 = total1 - bridgeAmount;
    uint256 fee2 = total2 - bridgeAmount;
    assertApproxEqRel(fee2, fee1 * 10, 0.001e18, "Fee should scale ~linearly");
  }

  // =========================================================================
  // send() E2E
  // =========================================================================

  function test_Fork_Send_EndToEnd() public {
    uint256 bridgeAmount = 500e6;
    uint256 nativeFee = 0.05 ether;

    SendParam memory sendParam = _makeSendParam(bridgeAmount);
    MessagingFee memory fee = MessagingFee({ nativeFee: nativeFee, lzTokenFee: 0 });
    uint256 expectedTotal = bridge.quoteSend(IOFT(address(mockOft)), sendParam, fee);

    uint256 userBalBefore = IERC20(USDT).balanceOf(user);
    uint256 bridgeCeloBefore = address(bridge).balance;

    vm.prank(user);
    bridge.send(IOFT(address(mockOft)), sendParam, fee);

    uint256 userPaid = userBalBefore - IERC20(USDT).balanceOf(user);
    assertEq(userPaid, expectedTotal, "User should pay exact quoted total");
    assertEq(
      bridgeCeloBefore - address(bridge).balance,
      nativeFee,
      "Bridge should spend exact native fee"
    );
    assertEq(
      IERC20(USDT).balanceOf(address(mockOft)),
      bridgeAmount,
      "OFT should receive bridge amount"
    );
  }

  function test_Fork_Send_MultipleSendsAccumulateFees() public {
    uint256 bridgeAmount = 100e6;
    uint256 nativeFee = 0.01 ether;
    SendParam memory sendParam = _makeSendParam(bridgeAmount);
    MessagingFee memory fee = MessagingFee({ nativeFee: nativeFee, lzTokenFee: 0 });

    for (uint256 i = 0; i < 3; i++) {
      vm.prank(user);
      bridge.send(IOFT(address(mockOft)), sendParam, fee);
    }

    uint256 singleFee = bridge.quoteSend(IOFT(address(mockOft)), sendParam, fee) - bridgeAmount;
    assertEq(IERC20(USDT).balanceOf(address(bridge)), singleFee * 3);
  }

  // =========================================================================
  // Operator withdrawals
  // =========================================================================

  function test_Fork_Execute_WithdrawAccumulatedFees() public {
    vm.prank(user);
    bridge.send(
      IOFT(address(mockOft)),
      _makeSendParam(1000e6),
      MessagingFee({ nativeFee: 0.1 ether, lzTokenFee: 0 })
    );

    uint256 feesCollected = IERC20(USDT).balanceOf(address(bridge));
    assertGt(feesCollected, 0);

    address treasury = makeAddr("treasury");
    vm.prank(operator);
    bridge.execute(
      USDT,
      0,
      abi.encodeWithSelector(IERC20.transfer.selector, treasury, feesCollected)
    );

    assertEq(IERC20(USDT).balanceOf(treasury), feesCollected);
    assertEq(IERC20(USDT).balanceOf(address(bridge)), 0);
  }

  function test_Fork_Execute_RefundCelo() public {
    address treasury = makeAddr("treasury");
    uint256 bridgeCelo = address(bridge).balance;

    vm.prank(operator);
    bridge.execute(treasury, 1 ether, "");

    assertEq(treasury.balance, 1 ether);
    assertEq(address(bridge).balance, bridgeCelo - 1 ether);
  }

  // =========================================================================
  // Edge cases
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
    address user2 = makeAddr("user2");
    deal(USDT, user2, 10_000e6);

    vm.prank(user2);
    vm.expectRevert();
    bridge.send(
      IOFT(address(mockOft)),
      _makeSendParam(100e6),
      MessagingFee({ nativeFee: 0.01 ether, lzTokenFee: 0 })
    );
  }

  function test_Fork_LZEndpointExists() public {
    uint256 codeSize;
    address endpoint = LZ_ENDPOINT_V2;
    assembly {
      codeSize := extcodesize(endpoint)
    }
    assertGt(codeSize, 0, "LZ EndpointV2 should have code on Celo mainnet");
  }

  // =========================================================================
  // Helpers
  // =========================================================================

  function _makeSendParam(uint256 amount) internal pure returns (SendParam memory) {
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
}
