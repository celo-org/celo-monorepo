import { AttestationUtils, SignatureUtils } from '@celo/utils'
import { concurrentMap, sleep } from '@celo/utils/lib/async'
import { notEmpty, zip3 } from '@celo/utils/lib/collections'
import { parseSolidityStringArray } from '@celo/utils/lib/parsing'
import BigNumber from 'bignumber.js'
import fetch from 'cross-fetch'
import { Address, CeloContract, NULL_ADDRESS } from '../base'
import { Attestations } from '../generated/Attestations'
import { ClaimTypes, IdentityMetadataWrapper } from '../identity'
import {
  BaseWrapper,
  proxyCall,
  toTransactionObject,
  valueToBigNumber,
  valueToInt,
} from './BaseWrapper'

export interface AttestationStat {
  completed: number
  total: number
}

export interface AttestationStateForIssuer {
  attestationState: AttestationState
}

export interface AttestationsToken {
  address: Address
  fee: BigNumber
}

export interface AttestationsConfig {
  attestationExpiryBlocks: number
  attestationRequestFees: AttestationsToken[]
}

/**
 * Contract for managing identities
 */
export enum AttestationState {
  None,
  Incomplete,
  Complete,
}

export interface ActionableAttestation {
  issuer: Address
  blockNumber: number
  attestationServiceURL: string
  name: string | undefined
}

type AttestationServiceRunningCheckResult =
  | { isValid: true; result: ActionableAttestation }
  | { isValid: false; issuer: Address }

interface AttesationServiceRevealRequest {
  account: Address
  phoneNumber: string
  issuer: string
  salt?: string
  smsRetrieverAppSig?: string
}

export interface UnselectedRequest {
  blockNumber: number
  attestationsRequested: number
  attestationRequestFeeToken: string
}

// Map of identifier -> (Map of address -> AttestationStat)
export type IdentifierLookupResult = Record<
  string,
  Record<Address, AttestationStat | undefined> | undefined
>

interface GetCompletableAttestationsResponse {
  0: string[]
  1: string[]
  2: string[]
  3: string
}
function parseGetCompletableAttestations(response: GetCompletableAttestationsResponse) {
  const metadataURLs = parseSolidityStringArray(
    response[2].map(valueToInt),
    (response[3] as unknown) as string
  )

  return zip3(
    response[0].map(valueToInt),
    response[1],
    metadataURLs
  ).map(([blockNumber, issuer, metadataURL]) => ({ blockNumber, issuer, metadataURL }))
}

export class AttestationsWrapper extends BaseWrapper<Attestations> {
  /**
   *  Returns the time an attestation can be completable before it is considered expired
   */
  attestationExpiryBlocks = proxyCall(
    this.contract.methods.attestationExpiryBlocks,
    undefined,
    valueToInt
  )

  /**
   * Returns the attestation request fee in a given currency.
   * @param address Token address.
   * @returns The fee as big number.
   */
  attestationRequestFees = proxyCall(
    this.contract.methods.attestationRequestFees,
    undefined,
    valueToBigNumber
  )

  selectIssuersWaitBlocks = proxyCall(
    this.contract.methods.selectIssuersWaitBlocks,
    undefined,
    valueToInt
  )

  /**
   * @notice Returns the unselected attestation request for an identifier/account pair, if any.
   * @param identifier Attestation identifier (e.g. phone hash)
   * @param account Address of the account
   */
  getUnselectedRequest = proxyCall(
    this.contract.methods.getUnselectedRequest,
    undefined,
    (res) => ({
      blockNumber: valueToInt(res[0]),
      attestationsRequested: valueToInt(res[1]),
      attestationRequestFeeToken: res[2],
    })
  )

  /**
   * @notice Waits for appropriate block numbers for before issuer can be selected
   * @param identifier Attestation identifier (e.g. phone hash)
   * @param account Address of the account
   */
  waitForSelectingIssuers = async (
    identifier: string,
    account: Address,
    timeoutSeconds = 120,
    pollDurationSeconds = 1
  ) => {
    const startTime = Date.now()
    const unselectedRequest = await this.getUnselectedRequest(identifier, account)
    const waitBlocks = await this.selectIssuersWaitBlocks()

    if (unselectedRequest.blockNumber === 0) {
      throw new Error('No unselectedRequest to wait for')
    }
    // Technically should use subscriptions here but not all providers support it.
    // TODO: Use subscription if provider supports
    while (Date.now() - startTime < timeoutSeconds * 1000) {
      const blockNumber = await this.kit.web3.eth.getBlockNumber()
      if (blockNumber >= unselectedRequest.blockNumber + waitBlocks) {
        return
      }
      await sleep(pollDurationSeconds * 1000)
    }
  }

  /**
   * Returns the issuers of attestations for a phoneNumber/account combo
   * @param identifier Attestation identifier (e.g. phone hash)
   * @param account Address of the account
   */
  getAttestationIssuers = proxyCall(this.contract.methods.getAttestationIssuers)

  /**
   * Returns the attestation state of a phone number/account/issuer tuple
   * @param identifier Attestation identifier (e.g. phone hash)
   * @param account Address of the account
   */
  getAttestationState: (
    identifier: string,
    account: Address,
    issuer: Address
  ) => Promise<AttestationStateForIssuer> = proxyCall(
    this.contract.methods.getAttestationState,
    undefined,
    (state) => ({ attestationState: valueToInt(state[0]) })
  )

  /**
   * Returns the attestation stats of a phone number/account pair
   * @param identifier Attestation identifier (e.g. phone hash)
   * @param account Address of the account
   */
  getAttestationStat: (
    identifier: string,
    account: Address
  ) => Promise<AttestationStat> = proxyCall(
    this.contract.methods.getAttestationStats,
    undefined,
    (stat) => ({ completed: valueToInt(stat[0]), total: valueToInt(stat[1]) })
  )

  /**
   * Calculates the amount of StableToken required to request Attestations
   * @param attestationsRequested  The number of attestations to request
   */
  async getAttestationFeeRequired(attestationsRequested: number) {
    const tokenAddress = await this.kit.registry.addressFor(CeloContract.StableToken)
    const attestationFee = await this.contract.methods.getAttestationRequestFee(tokenAddress).call()
    return new BigNumber(attestationFee).times(attestationsRequested)
  }

  /**
   * Approves the necessary amount of StableToken to request Attestations
   * @param attestationsRequested The number of attestations to request
   */
  async approveAttestationFee(attestationsRequested: number) {
    const tokenContract = await this.kit.contracts.getContract(CeloContract.StableToken)
    const fee = await this.getAttestationFeeRequired(attestationsRequested)
    return tokenContract.approve(this.address, fee.toFixed())
  }

  /**
   * Returns an array of attestations that can be completed, along with the issuers' attestation
   * service urls
   * @param identifier Attestation identifier (e.g. phone hash)
   * @param account Address of the account
   */
  async getActionableAttestations(
    identifier: string,
    account: Address
  ): Promise<ActionableAttestation[]> {
    const result = await this.contract.methods
      .getCompletableAttestations(identifier, account)
      .call()

    const results = await concurrentMap(
      5,
      parseGetCompletableAttestations(result),
      this.isIssuerRunningAttestationService
    )

    return results.map((_) => (_.isValid ? _.result : null)).filter(notEmpty)
  }

  /**
   * Returns an array of issuer addresses that were found to not run the attestation service
   * @param identifier Attestation identifier (e.g. phone hash)
   * @param account Address of the account
   */
  async getNonCompliantIssuers(identifier: string, account: Address): Promise<Address[]> {
    const result = await this.contract.methods
      .getCompletableAttestations(identifier, account)
      .call()

    const withAttestationServiceURLs = await concurrentMap(
      5,
      parseGetCompletableAttestations(result),
      this.isIssuerRunningAttestationService
    )

    return withAttestationServiceURLs.map((_) => (_.isValid ? null : _.issuer)).filter(notEmpty)
  }

  private isIssuerRunningAttestationService = async (arg: {
    blockNumber: number
    issuer: string
    metadataURL: string
  }): Promise<AttestationServiceRunningCheckResult> => {
    try {
      const metadata = await IdentityMetadataWrapper.fetchFromURL(this.kit, arg.metadataURL)
      const attestationServiceURLClaim = metadata.findClaim(ClaimTypes.ATTESTATION_SERVICE_URL)

      if (attestationServiceURLClaim === undefined) {
        throw new Error(`No attestation service URL registered for ${arg.issuer}`)
      }

      const nameClaim = metadata.findClaim(ClaimTypes.NAME)

      // TODO: Once we have status indicators, we should check if service is up
      // https://github.com/celo-org/celo-monorepo/issues/1586
      return {
        isValid: true,
        result: {
          blockNumber: arg.blockNumber,
          issuer: arg.issuer,
          attestationServiceURL: attestationServiceURLClaim.url,
          name: nameClaim ? nameClaim.name : undefined,
        },
      }
    } catch (error) {
      return { isValid: false, issuer: arg.issuer }
    }
  }

  /**
   * Completes an attestation with the corresponding code
   * @param identifier Attestation identifier (e.g. phone hash)
   * @param account Address of the account
   * @param issuer The issuer of the attestation
   * @param code The code received by the validator
   */
  async complete(identifier: string, account: Address, issuer: Address, code: string) {
    const accounts = await this.kit.contracts.getAccounts()
    const attestationSigner = await accounts.getAttestationSigner(issuer)
    const expectedSourceMessage = AttestationUtils.getAttestationMessageToSignFromIdentifier(
      identifier,
      account
    )
    const { r, s, v } = SignatureUtils.parseSignature(
      expectedSourceMessage,
      code,
      attestationSigner
    )
    return toTransactionObject(this.kit, this.contract.methods.complete(identifier, v, r, s))
  }

  /**
   * Given a list of issuers, finds the matching issuer for a given code
   * @param identifier Attestation identifier (e.g. phone hash)
   * @param account Address of the account
   * @param code The code received by the validator
   * @param issuers The list of potential issuers
   */
  async findMatchingIssuer(
    identifier: string,
    account: Address,
    code: string,
    issuers: string[]
  ): Promise<string | null> {
    const accounts = await this.kit.contracts.getAccounts()
    const expectedSourceMessage = AttestationUtils.getAttestationMessageToSignFromIdentifier(
      identifier,
      account
    )
    for (const issuer of issuers) {
      const attestationSigner = await accounts.getAttestationSigner(issuer)

      try {
        SignatureUtils.parseSignature(expectedSourceMessage, code, attestationSigner)
        return issuer
      } catch (error) {
        continue
      }
    }
    return null
  }

  /**
   * Returns the current configuration parameters for the contract.
   * @param tokens List of tokens used for attestation fees.
   */
  async getConfig(tokens: string[]): Promise<AttestationsConfig> {
    const fees = await Promise.all(
      tokens.map(async (token) => {
        const fee = await this.attestationRequestFees(token)
        return { fee, address: token }
      })
    )
    return {
      attestationExpiryBlocks: await this.attestationExpiryBlocks(),
      attestationRequestFees: fees,
    }
  }

  /**
   * Lookup mapped wallet addresses for a given list of identifiers
   * @param identifiers Attestation identifiers (e.g. phone hashes)
   */
  async lookupIdentifiers(identifiers: string[]): Promise<IdentifierLookupResult> {
    // Unfortunately can't be destructured
    const stats = await this.contract.methods.batchGetAttestationStats(identifiers).call()

    const matches = stats[0].map(valueToInt)
    const addresses = stats[1]
    const completed = stats[2].map(valueToInt)
    const total = stats[3].map(valueToInt)
    // Map of identifier -> (Map of address -> AttestationStat)
    const result: IdentifierLookupResult = {}

    let rIndex = 0

    for (let pIndex = 0; pIndex < identifiers.length; pIndex++) {
      const pHash = identifiers[pIndex]
      const numberOfMatches = matches[pIndex]
      if (numberOfMatches === 0) {
        continue
      }

      const matchingAddresses: Record<string, AttestationStat> = {}
      for (let mIndex = 0; mIndex < numberOfMatches; mIndex++) {
        const matchingAddress = addresses[rIndex]
        matchingAddresses[matchingAddress] = {
          completed: completed[rIndex],
          total: total[rIndex],
        }
        rIndex++
      }

      result[pHash] = matchingAddresses
    }

    return result
  }

  /**
   * Requests a new attestation
   * @param identifier Attestation identifier (e.g. phone hash)
   * @param attestationsRequested The number of attestations to request
   */
  async request(identifier: string, attestationsRequested: number) {
    const tokenAddress = await this.kit.registry.addressFor(CeloContract.StableToken)
    return toTransactionObject(
      this.kit,
      this.contract.methods.request(identifier, attestationsRequested, tokenAddress)
    )
  }

  /**
   * Selects the issuers for previously requested attestations for a phone number
   * @param identifier Attestation identifier (e.g. phone hash)
   */
  selectIssuers(identifier: string) {
    return toTransactionObject(this.kit, this.contract.methods.selectIssuers(identifier))
  }

  revealPhoneNumberToIssuer(
    phoneNumber: string,
    account: Address,
    issuer: Address,
    serviceURL: string,
    salt?: string,
    smsRetrieverAppSig?: string
  ) {
    const body: AttesationServiceRevealRequest = {
      account,
      phoneNumber,
      issuer,
      salt,
      smsRetrieverAppSig,
    }
    return fetch(serviceURL + '/attestations', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    })
  }

  /**
   * Validates a given code by the issuer on-chain
   * @param identifier Attestation identifier (e.g. phone hash)
   * @param account The address of the account which requested attestation
   * @param issuer The address of the issuer of the attestation
   * @param code The code send by the issuer
   */
  async validateAttestationCode(
    identifier: string,
    account: Address,
    issuer: Address,
    code: string
  ) {
    const accounts = await this.kit.contracts.getAccounts()
    const attestationSigner = await accounts.getAttestationSigner(issuer)
    const expectedSourceMessage = AttestationUtils.getAttestationMessageToSignFromIdentifier(
      identifier,
      account
    )
    const { r, s, v } = SignatureUtils.parseSignature(
      expectedSourceMessage,
      code,
      attestationSigner
    )
    const result = await this.contract.methods
      .validateAttestationCode(identifier, account, v, r, s)
      .call()
    return result.toLowerCase() !== NULL_ADDRESS
  }
}
