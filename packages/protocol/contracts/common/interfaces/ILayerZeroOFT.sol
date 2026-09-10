// SPDX-License-Identifier: MIT
pragma solidity >=0.8.7 <0.8.20;

/**
 * @title Minimal LayerZero OFT interfaces
 * @notice Only the types and function signatures needed by GasSponsoredOFTBridge.
 * The actual OFT contracts are deployed independently (e.g. by Stargate or the token issuer).
 */

struct MessagingFee {
  uint256 nativeFee;
  uint256 lzTokenFee;
}

struct MessagingReceipt {
  bytes32 guid;
  uint64 nonce;
  MessagingFee fee;
}

struct SendParam {
  uint32 dstEid;
  bytes32 to;
  uint256 amountLD;
  uint256 minAmountLD;
  bytes extraOptions;
  bytes composeMsg;
  bytes oftCmd;
}

struct OFTReceipt {
  uint256 amountSentLD;
  uint256 amountReceivedLD;
}

interface IOFT {
  function send(
    SendParam calldata _sendParam,
    MessagingFee calldata _fee,
    address _refundAddress
  ) external payable returns (MessagingReceipt memory, OFTReceipt memory);

  function token() external view returns (address);
}
