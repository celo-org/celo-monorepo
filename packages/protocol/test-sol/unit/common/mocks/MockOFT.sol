// SPDX-License-Identifier: LGPL-3.0-only
pragma solidity >=0.8.7 <0.8.20;

import "@openzeppelin/contracts8/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts8/token/ERC20/utils/SafeERC20.sol";
import { IOFT, SendParam, MessagingFee, MessagingReceipt, OFTReceipt } from "@celo-contracts-8/common/interfaces/ILayerZeroOFT.sol";

/**
 * @dev Mock OFT that accepts token transfers and consumes the native fee.
 */
contract MockOFT is IOFT {
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
    // Pull tokens from caller (the bridge contract)
    IERC20(_token).safeTransferFrom(msg.sender, address(this), _sendParam.amountLD);

    _nonce++;

    msgReceipt = MessagingReceipt({
      guid: keccak256(abi.encodePacked(_nonce)),
      nonce: _nonce,
      fee: MessagingFee({ nativeFee: msg.value, lzTokenFee: 0 })
    });

    oftReceipt = OFTReceipt({
      amountSentLD: _sendParam.amountLD,
      amountReceivedLD: _sendParam.amountLD
    });
  }
}
