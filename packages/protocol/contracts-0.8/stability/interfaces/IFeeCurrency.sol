pragma solidity ^0.8.13;

import "@openzeppelin/contracts8/token/ERC20/IERC20.sol";

interface IFeeCurrency is IERC20 {
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

       Notes on compatibility:
       - There are two versions of `creditGasFees`: one for the current
         (2024-01-16) blockchain implementation and a more future-proof version
         that avoids deprecated fields and allows new recipients that might
         become necessary on later blockchain implementations. Both versions
         should be implemented to increase compatibility.
       - Future Celo blockchain implementations might provide a way for plain
         ERC-20 tokens to be used as gas currencies without implementing this
         interface. If this sounds preferable to you, please contact cLabs
         before implementing this interface for your token.
    */

  // Called before transaction execution to reserve the maximum amount of gas
  // that can be used by the transaction.
  // - The implementation must reduce `from`'s balance by `value`.
  // - Must revert if `msg.sender` is not the zero address.
  function debitGasFees(address from, uint256 value) external;

  // New function signature, will be used when all fee currencies have migrated.
  // Credited amounts are gas refund, base fee and tip. Additional components
  // might be added, like an L1 gas fee when Celo becomes and L2.
  // - The implementation must increase each `recipient`'s balance by respective `value`.
  // - Must revert if `msg.sender` is not the zero address.
  // - Must revert if `recipients` and `amounts` have different lengths.
  function creditGasFees(address[] calldata recipients, uint256[] calldata amounts) external;

  // Old function signature for backwards compatibility
  // - Must revert if `msg.sender` is not the zero address.
  // - `refund` must be credited to `from`
  // - `tipTxFee` must be credited to `feeRecipient`
  // - `baseTxFee` must be credited to `communityFund`
  // - `gatewayFeeRecipient` and `gatewayFee` only exist for backwards
  //   compatibility reasons and will always be zero.
  function creditGasFees(
    address from,
    address feeRecipient,
    address gatewayFeeRecipient,
    address communityFund,
    uint256 refund,
    uint256 tipTxFee,
    uint256 gatewayFee,
    uint256 baseTxFee
  ) external;
}