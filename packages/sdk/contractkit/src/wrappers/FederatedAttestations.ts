import { FederatedAttestations } from '@celo/abis/types/web3/FederatedAttestations'
import { Address, CeloTransactionObject, toTransactionObject } from '@celo/connect'
import { registerAttestation as buildRegisterAttestationTypedData } from '@celo/utils/lib/typed-data-constructors'
import { BaseWrapper, proxyCall, proxySend } from './BaseWrapper'

export class FederatedAttestationsWrapper extends BaseWrapper<FederatedAttestations> {
  /**
   * @notice Returns identifiers mapped to `account` by signers of `trustedIssuers`
   * @param account Address of the account
   * @param trustedIssuers Array of n issuers whose identifier mappings will be used
   * @return countsPerIssuer Array of number of identifiers returned per issuer
   * @return identifiers Array (length == sum([0])) of identifiers
   * @dev Adds identifier info to the arrays in order of provided trustedIssuers
   * @dev Expectation that only one attestation exists per (identifier, issuer, account)
   */
  lookupIdentifiers: (
    account: Address,
    trustedIssuers: Address[]
  ) => Promise<{
    countsPerIssuer: string[]
    identifiers: string[]
  }> = proxyCall(this.contract.methods.lookupIdentifiers)

  /**
   * @notice Returns info about attestations for `identifier` produced by
   *    signers of `trustedIssuers`
   * @param identifier Hash of the identifier
   * @param trustedIssuers Array of n issuers whose attestations will be included
   * @return countsPerIssuer Array of number of attestations returned per issuer
   *          For m (== sum([0])) found attestations:
   * @return accounts Array of m accounts
   * @return signers Array of m signers
   * @return issuedOns Array of m issuedOns
   * @return publishedOns Array of m publishedOns
   * @dev Adds attestation info to the arrays in order of provided trustedIssuers
   * @dev Expectation that only one attestation exists per (identifier, issuer, account)
   */
  lookupAttestations: (
    identifier: string,
    trustedIssuers: Address[]
  ) => Promise<{
    countsPerIssuer: string[]
    accounts: Address[]
    signers: Address[]
    issuedOns: string[]
    publishedOns: string[]
  }> = proxyCall(this.contract.methods.lookupAttestations)

  /**
   * @notice Validates the given attestation and signature
   * @param identifier Hash of the identifier to be attested
   * @param issuer Address of the attestation issuer
   * @param account Address of the account being mapped to the identifier
   * @param issuedOn Time at which the issuer issued the attestation in Unix time
   * @param signer Address of the signer of the attestation
   * @param v The recovery id of the incoming ECDSA signature
   * @param r Output value r of the ECDSA signature
   * @param s Output value s of the ECDSA signature
   * @dev Throws if attestation has been revoked
   * @dev Throws if signer is not an authorized AttestationSigner of the issuer
   */
  validateAttestationSig: (
    identifier: string,
    issuer: Address,
    account: Address,
    signer: Address,
    issuedOn: number,
    v: number | string,
    r: string | number[],
    s: string | number[]
  ) => Promise<void> = proxyCall(this.contract.methods.validateAttestationSig)

  /**
   * @return keccak 256 of abi encoded parameters
   */
  getUniqueAttestationHash: (
    identifier: string,
    issuer: Address,
    account: Address,
    signer: Address,
    issuedOn: number
  ) => Promise<string> = proxyCall(this.contract.methods.getUniqueAttestationHash)

  /**
   * @notice Registers an attestation directly from the issuer
   * @param identifier Hash of the identifier to be attested
   * @param account Address of the account being mapped to the identifier
   * @param issuedOn Time at which the issuer issued the attestation in Unix time
   * @dev Attestation signer and issuer in storage is set to msg.sender
   * @dev Throws if an attestation with the same (identifier, issuer, account) already exists
   */
  registerAttestationAsIssuer: (
    identifier: string,
    account: Address,
    issuedOn: number
  ) => CeloTransactionObject<void> = proxySend(
    this.connection,
    this.contract.methods.registerAttestationAsIssuer
  )

  /**
   * @notice Generates a valid signature and registers the attestation
   * @param identifier Hash of the identifier to be attested
   * @param issuer Address of the attestation issuer
   * @param account Address of the account being mapped to the identifier
   * @param issuedOn Time at which the issuer issued the attestation in Unix time
   * @param signer Address of the signer of the attestation
   * @dev Throws if an attestation with the same (identifier, issuer, account) already exists
   */
  async registerAttestation(
    identifier: string,
    issuer: Address,
    account: Address,
    signer: Address,
    issuedOn: number
  ) {
    const chainId = await this.connection.chainId()
    const typedData = buildRegisterAttestationTypedData(chainId, this.address, {
      identifier,
      issuer,
      account,
      signer,
      issuedOn,
    })
    const sig = await this.connection.signTypedData(signer, typedData)
    return toTransactionObject(
      this.connection,
      this.contract.methods.registerAttestation(
        identifier,
        issuer,
        account,
        signer,
        issuedOn,
        sig.v,
        sig.r,
        sig.s
      )
    )
  }

  /**
   * @notice Revokes an attestation
   * @param identifier Hash of the identifier to be revoked
   * @param issuer Address of the attestation issuer
   * @param account Address of the account mapped to the identifier
   * @dev Throws if sender is not the issuer, signer, or account
   */
  revokeAttestation: (
    identifier: string,
    issuer: Address,
    account: Address
  ) => CeloTransactionObject<void> = proxySend(
    this.connection,
    this.contract.methods.revokeAttestation
  )

  /**
   * @notice Revokes attestations [identifiers <-> accounts] from issuer
   * @param issuer Address of the issuer of all attestations to be revoked
   * @param identifiers Hash of the identifiers
   * @param accounts Addresses of the accounts mapped to the identifiers
   *   at the same indices
   * @dev Throws if the number of identifiers and accounts is not the same
   * @dev Throws if sender is not the issuer or currently registered signer of issuer
   * @dev Throws if an attestation is not found for identifiers[i] <-> accounts[i]
   */
  batchRevokeAttestations: (
    issuer: Address,
    identifiers: string[],
    accounts: Address[]
  ) => CeloTransactionObject<void> = proxySend(
    this.connection,
    this.contract.methods.batchRevokeAttestations
  )
}
