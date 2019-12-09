import { AttestationUtils, PhoneNumberUtils, SignatureUtils } from '@celo/utils'
import { concurrentMap, sleep } from '@celo/utils/lib/async'
import { notEmpty, zip3 } from '@celo/utils/lib/collections'
import { parseSolidityStringArray } from '@celo/utils/lib/parsing'
import BigNumber from 'bignumber.js'
import fetch from 'cross-fetch'
import { Address, CeloContract, NULL_ADDRESS } from '../base'
import { Attestations } from '../generated/types/Attestations'
import { ClaimTypes, IdentityMetadataWrapper } from '../identity'
import {
  BaseWrapper,
  proxyCall,
  toTransactionObject,
  tupleParser,
  valueToBigNumber,
  valueToInt,
} from './BaseWrapper'

const parseSignature = SignatureUtils.parseSignature

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

export interface UnselectedRequest {
  blockNumber: number
  attestationsRequested: number
  attestationRequestFeeToken: string
}

interface GetCompletableAttestationsResponse {
  0: string[]
  1: string[]
  2: string[]
  3: string[]
}
function parseGetCompletableAttestations(response: GetCompletableAttestationsResponse) {
  const metadataURLs = parseSolidityStringArray(
    response[2].map(valueToInt),
    (response[3] as unknown) as string
  )

  return zip3(response[0].map(valueToInt), response[1], metadataURLs).map(
    ([blockNumber, issuer, metadataURL]) => ({ blockNumber, issuer, metadataURL })
  )
}

const stringIdentity = (x: string) => x
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
   * @param identifier Hash of the identifier.
   * @param account Address of the account.
   */
  getUnselectedRequest = proxyCall(
    this.contract.methods.getUnselectedRequest,
    tupleParser(PhoneNumberUtils.getPhoneHash, (x: string) => x),
    (res) => ({
      blockNumber: valueToInt(res[0]),
      attestationsRequested: valueToInt(res[1]),
      attestationRequestFeeToken: res[2],
    })
  )

  waitForSelectingIssuers = async (
    phoneNumber: string,
    account: Address,
    timeoutSeconds = 120,
    pollDurationSeconds = 1
  ) => {
    const startTime = Date.now()
    const unselectedRequest = await this.getUnselectedRequest(phoneNumber, account)
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
   * @param phoneNumber Phone Number
   * @param account Account
   */
  getAttestationIssuers = proxyCall(
    this.contract.methods.getAttestationIssuers,
    tupleParser(PhoneNumberUtils.getPhoneHash, (x: string) => x)
  )

  /**
   * Returns the attestation state of a phone number/account/issuer tuple
   * @param phoneNumber Phone Number
   * @param account Account
   */
  getAttestationState: (
    phoneNumber: string,
    account: Address,
    issuer: Address
  ) => Promise<AttestationStateForIssuer> = proxyCall(
    this.contract.methods.getAttestationState,
    tupleParser(PhoneNumberUtils.getPhoneHash, stringIdentity, stringIdentity),
    (state) => ({ attestationState: parseInt(state[0], 10) })
  )

  /**
   * Returns the attestation stats of a phone number/account pair
   * @param phoneNumber Phone Number
   * @param account Account
   */
  getAttestationStat: (
    phoneNumber: string,
    account: Address
  ) => Promise<AttestationStat> = proxyCall(
    this.contract.methods.getAttestationStats,
    tupleParser(PhoneNumberUtils.getPhoneHash, stringIdentity),
    (stat) => ({ completed: valueToInt(stat[0]), total: valueToInt(stat[1]) })
  )

  /**
   * Calculates the amount of StableToken required to request Attestations
   * @param attestationsRequested  The number of attestations to request
   */
  async attestationFeeRequired(attestationsRequested: number) {
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
    const fee = await this.attestationFeeRequired(attestationsRequested)
    return tokenContract.approve(this.address, fee.toFixed())
  }

  /**
   * Returns an array of attestations that can be completed, along with the issuers' attestation
   * service urls
   * @param phoneNumber
   * @param account
   */
  async getActionableAttestations(
    phoneNumber: string,
    account: Address
  ): Promise<ActionableAttestation[]> {
    const phoneHash = PhoneNumberUtils.getPhoneHash(phoneNumber)

    const result = await this.contract.methods.getCompletableAttestations(phoneHash, account).call()

    const results = await concurrentMap(
      5,
      parseGetCompletableAttestations(result),
      this.isIssuerRunningAttestationService
    )

    return results.map((_) => (_.isValid ? _.result : null)).filter(notEmpty)
  }

  /**
   * Returns an array of issuer addresses that were found to not run the attestation service
   * @param phoneNumber
   * @param account
   */
  async getNonCompliantIssuers(phoneNumber: string, account: Address): Promise<Address[]> {
    const phoneHash = PhoneNumberUtils.getPhoneHash(phoneNumber)

    const result = await this.contract.methods.getCompletableAttestations(phoneHash, account).call()

    const withAttestationServiceURLs = await concurrentMap(
      5,
      parseGetCompletableAttestations(result),
      this.isIssuerRunningAttestationService
    )

    return withAttestationServiceURLs.map((_) => (_.isValid ? null : _.issuer)).filter(notEmpty)
  }

  private async isIssuerRunningAttestationService(arg: {
    blockNumber: number
    issuer: string
    metadataURL: string
  }): Promise<AttestationServiceRunningCheckResult> {
    try {
      const metadata = await IdentityMetadataWrapper.fetchFromURL(arg.metadataURL)
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
   * @param phoneNumber The phone number of the attestation
   * @param account The account of the attestation
   * @param issuer The issuer of the attestation
   * @param code The code received by the validator
   */
  async complete(phoneNumber: string, account: Address, issuer: Address, code: string) {
    const phoneHash = PhoneNumberUtils.getPhoneHash(phoneNumber)
    const accounts = await this.kit.contracts.getAccounts()
    const attestationSigner = await accounts.getAttestationSigner(issuer)
    const expectedSourceMessage = AttestationUtils.getAttestationMessageToSignFromPhoneHash(
      phoneHash,
      account
    )
    const { r, s, v } = parseSignature(expectedSourceMessage, code, attestationSigner)
    return toTransactionObject(this.kit, this.contract.methods.complete(phoneHash, v, r, s))
  }

  /**
   * Given a list of issuers, finds the matching issuer for a given code
   * @param phoneNumber The phone number of the attestation
   * @param account The account of the attestation
   * @param code The code received by the validator
   * @param issuers The list of potential issuers
   */
  async findMatchingIssuer(
    phoneNumber: string,
    account: Address,
    code: string,
    issuers: string[]
  ): Promise<string | null> {
    const phoneHash = PhoneNumberUtils.getPhoneHash(phoneNumber)
    const accounts = await this.kit.contracts.getAccounts()
    const expectedSourceMessage = AttestationUtils.getAttestationMessageToSignFromPhoneHash(
      phoneHash,
      account
    )
    for (const issuer of issuers) {
      const attestationSigner = await accounts.getAttestationSigner(issuer)

      try {
        parseSignature(expectedSourceMessage, code, attestationSigner)
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
   * Lookup mapped walleet addresses for a given list of hashes of phone numbers
   * @param phoneNumberHashes The hashes of phone numbers to lookup
   */
  async lookupPhoneNumbers(
    phoneNumberHashes: string[]
  ): Promise<Record<string, Record<string, AttestationStat>>> {
    // Unfortunately can't be destructured
    const stats = await this.contract.methods.batchGetAttestationStats(phoneNumberHashes).call()

    const matches = stats[0].map(valueToInt)
    const addresses = stats[1]
    const completed = stats[2].map(valueToInt)
    const total = stats[3].map(valueToInt)
    // Map of phone hash -> (Map of address -> AttestationStat)
    const result: Record<string, Record<string, AttestationStat>> = {}

    let rIndex = 0

    for (let pIndex = 0; pIndex < phoneNumberHashes.length; pIndex++) {
      const pHash = phoneNumberHashes[pIndex]
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
   * Requests attestations for a phone number
   * @param phoneNumber The phone number for which to request attestations for
   * @param attestationsRequested The number of attestations to request
   */
  async request(phoneNumber: string, attestationsRequested: number) {
    const phoneHash = PhoneNumberUtils.getPhoneHash(phoneNumber)
    const tokenAddress = await this.kit.registry.addressFor(CeloContract.StableToken)
    return toTransactionObject(
      this.kit,
      this.contract.methods.request(phoneHash, attestationsRequested, tokenAddress)
    )
  }

  /**
   * Selects the issuers for previously requested attestations for a phone number
   * @param phoneNumber The phone number for which to request attestations for
   */
  selectIssuers(phoneNumber: string) {
    const phoneHash = PhoneNumberUtils.getPhoneHash(phoneNumber)
    return toTransactionObject(this.kit, this.contract.methods.selectIssuers(phoneHash))
  }

  revealPhoneNumberToIssuer(
    phoneNumber: string,
    account: Address,
    issuer: Address,
    serviceURL: string
  ) {
    return fetch(serviceURL + '/attestations', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        account,
        phoneNumber,
        issuer,
      }),
    })
  }

  /**
   * Validates a given code by the issuer on-chain
   * @param phoneNumber The phone number which requested attestation
   * @param account The account which requested attestation
   * @param issuer The address of the issuer of the attestation
   * @param code The code send by the issuer
   */
  async validateAttestationCode(
    phoneNumber: string,
    account: Address,
    issuer: Address,
    code: string
  ) {
    const accounts = await this.kit.contracts.getAccounts()
    const attestationSigner = await accounts.getAttestationSigner(issuer)
    const phoneHash = PhoneNumberUtils.getPhoneHash(phoneNumber)
    const expectedSourceMessage = AttestationUtils.getAttestationMessageToSignFromPhoneHash(
      phoneHash,
      account
    )
    const { r, s, v } = parseSignature(expectedSourceMessage, code, attestationSigner)
    const result = await this.contract.methods
      .validateAttestationCode(phoneHash, account, v, r, s)
      .call()
    return result.toLowerCase() !== NULL_ADDRESS
  }
}
