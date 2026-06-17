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

  /// @dev Amount of dust the OFT drops from each send (simulates shared-decimal
  ///      normalization where amountSentLD = amountLD - dust). Defaults to 0.
  uint256 public dust;

  constructor(address token_) {
    _token = token_;
  }

  function token() external view override returns (address) {
    return _token;
  }

  /// @dev Test helper to simulate shared-decimal dust removal.
  function setDust(uint256 dust_) external {
    dust = dust_;
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
    // Bridgeable amount after dropping shared-decimal dust.
    uint256 amountSent = _sendParam.amountLD - dust;

    // Pull only the bridgeable amount from caller (the bridge contract); the
    // dust is left behind, mirroring a real OFT's _removeDust behaviour.
    IERC20(_token).safeTransferFrom(msg.sender, address(this), amountSent);

    _nonce++;

    msgReceipt = MessagingReceipt({
      guid: keccak256(abi.encodePacked(_nonce)),
      nonce: _nonce,
      fee: MessagingFee({ nativeFee: msg.value, lzTokenFee: 0 })
    });

    oftReceipt = OFTReceipt({ amountSentLD: amountSent, amountReceivedLD: amountSent });
  }
}
