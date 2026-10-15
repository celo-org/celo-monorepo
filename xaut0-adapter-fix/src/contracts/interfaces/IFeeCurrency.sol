// SPDX-License-Identifier: apache-2.0
// https://github.com/celo-org/celo-monorepo/blob/release/core-contracts/11/packages/protocol/contracts-0.8/stability/interfaces/IFeeCurrency.sol
// Adapted by Tether.to 2024 for greater flexibility and reusability

pragma solidity ^0.8.4;

import "@openzeppelin/contracts/token/ERC20/extensions/IERC20Metadata.sol";
interface IFeeCurrency is IERC20Metadata {
  /*
       This interface should be implemented for tokens which are supposed to
       act as fee currencies on the Celo blockchain, meaning that they can be
       used to pay gas fees for CIP-64 transactions (and some older tx types).
       See https://github.com/celo-org/celo-proposals/blob/master/CIPs/cip-0064.md

       Before executing a tx with non-empty feeCurrency field, the fee
       currency's `debitGasFees` function is called to reserve the maximum
       amount that tx can spend on gas. After the tx has been executed, the
       `creditGasFees` function is called to refund the unused gas and credit
       the spent fees to the correct recipients. Events which are raised inside
       these functions will show up for every transaction using the token as a
       fee currency.

       Requirements:
       - The functions will be called by the blockchain client with `msg.sender
         == address(0)`. If this condition is not met, the functions must
         revert to prevent malicious users from crediting their accounts directly.
       - `creditGasFees` must credit all specified amounts. If it impossible to
         credit one of the recipients for some reason, add the amount to the
         value credited to the first valid recipient. This is important to keep
         the debited and credited amounts consistent.
    */

  // Called before transaction execution to reserve the maximum amount of gas
  // that can be used by the transaction.
  // - The implementation must reduce `from`'s balance by `value`.
  // - Must revert if `msg.sender` is not the zero address.
  function debitGasFees(address from, uint256 value) external;

  /**
   * Called after transaction execution to refund the unused gas and credit the
   * spent fees to the correct recipients.
   * @param refundRecipient The recipient of the refund.
   * @param tipRecipient The recipient of the tip.
   * @param _gatewayFeeRecipient The recipient of the gateway fee. Unused.
   * @param baseFeeRecipient The recipient of the base fee.
   * @param refundAmount The amount to refund.
   * @param tipAmount The amount to tip.
   * @param _gatewayFeeAmount The amount of the gateway fee. Unused.
   * @param baseFeeAmount The amount of the base fee.
   */
  function creditGasFees(
    address refundRecipient,
    address tipRecipient,
    address _gatewayFeeRecipient,
    address baseFeeRecipient,
    uint256 refundAmount,
    uint256 tipAmount,
    uint256 _gatewayFeeAmount,
    uint256 baseFeeAmount
  ) external;
}