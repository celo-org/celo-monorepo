import { Escrow } from '@celo/abis/types/web3/Escrow'
import { Address, CeloTransactionObject } from '@celo/connect'
import { BaseWrapper, proxyCall, proxySend } from './BaseWrapper'

/**
 * Contract for handling reserve for stable currencies
 */
export class EscrowWrapper extends BaseWrapper<Escrow> {
  /**
   * @notice Gets the unique escrowed payment for a given payment ID
   * @param paymentId The ID of the payment to get.
   * @return An EscrowedPayment struct which holds information such
   * as; recipient identifier, sender address, token address, value, etc.
   */
  escrowedPayments = proxyCall(this.contract.methods.escrowedPayments)

  /**
   * @notice Gets array of all Escrowed Payments received by identifier.
   * @param identifier The hash of an identifier of the receiver of the escrowed payment.
   * @return An array containing all the IDs of the Escrowed Payments that were received
   * by the specified receiver.
   */
  getReceivedPaymentIds = proxyCall(this.contract.methods.getReceivedPaymentIds)

  /**
   * @notice Gets array of all Escrowed Payment IDs sent by sender.
   * @param sender The address of the sender of the escrowed payments.
   * @return An array containing all the IDs of the Escrowed Payments that were sent by the
   * specified sender.
   */
  getSentPaymentIds = proxyCall(this.contract.methods.getSentPaymentIds)

  /**
   * @notice Gets trusted issuers set as default for payments by `transfer` function.
   * @return An array of addresses of trusted issuers.
   */
  getDefaultTrustedIssuers = proxyCall(this.contract.methods.getDefaultTrustedIssuers)

  /**
   * @notice Gets array of all trusted issuers set per paymentId.
   * @param paymentId The ID of the payment to get.
   * @return An array of addresses of trusted issuers set for an escrowed payment.
   */
  getTrustedIssuersPerPayment = proxyCall(this.contract.methods.getTrustedIssuersPerPayment)

  /**
   * @notice Transfer tokens to a specific user. Supports both identity with privacy (an empty
   *         identifier and 0 minAttestations) and without (with identifier and minAttestations).
   *         Sets trustedIssuers to the issuers listed in `defaultTrustedIssuers`.
   *         (To override this and set custom trusted issuers, use `transferWithTrustedIssuers`.)
   * @param identifier The hashed identifier of a user to transfer to.
   * @param token The token to be transferred.
   * @param value The amount to be transferred.
   * @param expirySeconds The number of seconds before the sender can revoke the payment.
   * @param paymentId The address of the temporary wallet associated with this payment. Users must
   *        prove ownership of the corresponding private key to withdraw from escrow.
   * @param minAttestations The min number of attestations required to withdraw the payment.
   * @return True if transfer succeeded.
   * @dev Throws if 'token' or 'value' is 0.
   * @dev Throws if identifier is null and minAttestations > 0.
   * @dev If minAttestations is 0, trustedIssuers will be set to empty list.
   * @dev msg.sender needs to have already approved this contract to transfer
   */
  transfer: (
    identifier: string,
    token: Address,
    value: number | string,
    expirySeconds: number,
    paymentId: Address,
    minAttestations: number
  ) => CeloTransactionObject<boolean> = proxySend(this.connection, this.contract.methods.transfer)

  /**
   * @notice Withdraws tokens for a verified user.
   * @param paymentId The ID for the EscrowedPayment struct that contains all relevant information.
   * @param v The recovery id of the incoming ECDSA signature.
   * @param r Output value r of the ECDSA signature.
   * @param s Output value s of the ECDSA signature.
   * @return True if withdraw succeeded.
   * @dev Throws if 'token' or 'value' is 0.
   * @dev Throws if msg.sender does not prove ownership of the withdraw key.
   */
  withdraw: (
    paymentId: Address,
    v: number | string,
    r: string | number[],
    s: string | number[]
  ) => CeloTransactionObject<boolean> = proxySend(this.connection, this.contract.methods.withdraw)

  /**
   * @notice Revokes tokens for a sender who is redeeming a payment after it has expired.
   * @param paymentId The ID for the EscrowedPayment struct that contains all relevant information.
   * @dev Throws if 'token' or 'value' is 0.
   * @dev Throws if msg.sender is not the sender of payment.
   * @dev Throws if redeem time hasn't been reached yet.
   */
  revoke: (paymentId: string) => CeloTransactionObject<boolean> = proxySend(
    this.connection,
    this.contract.methods.revoke
  )

  /**
   * @notice Transfer tokens to a specific user. Supports both identity with privacy (an empty
   *         identifier and 0 minAttestations) and without (with identifier
   *         and attestations completed by trustedIssuers).
   * @param identifier The hashed identifier of a user to transfer to.
   * @param token The token to be transferred.
   * @param value The amount to be transferred.
   * @param expirySeconds The number of seconds before the sender can revoke the payment.
   * @param paymentId The address of the temporary wallet associated with this payment. Users must
   *        prove ownership of the corresponding private key to withdraw from escrow.
   * @param minAttestations The min number of attestations required to withdraw the payment.
   * @param trustedIssuers Array of issuers whose attestations in FederatedAttestations.sol
   *        will be accepted to prove ownership over an identifier.
   * @return True if transfer succeeded.
   * @dev Throws if 'token' or 'value' is 0.
   * @dev Throws if identifier is null and minAttestations > 0.
   * @dev Throws if minAttestations == 0 but trustedIssuers are provided.
   * @dev msg.sender needs to have already approved this contract to transfer.
   */
  transferWithTrustedIssuers: (
    identifier: string,
    token: Address,
    value: number | string,
    expirySeconds: number,
    paymentId: Address,
    minAttestations: number,
    trustedIssuers: Address[]
  ) => CeloTransactionObject<boolean> = proxySend(
    this.connection,
    this.contract.methods.transferWithTrustedIssuers
  )
}

export type EscrowWrapperType = EscrowWrapper
