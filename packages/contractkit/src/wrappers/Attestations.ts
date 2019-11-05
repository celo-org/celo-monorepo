import { ECIES, PhoneNumberUtils, SignatureUtils } from '@celo/utils'
import { sleep } from '@celo/utils/lib/async'
import { zip3 } from '@celo/utils/lib/collections'
import BigNumber from 'bignumber.js'
import * as Web3Utils from 'web3-utils'
import { Address, CeloContract, NULL_ADDRESS } from '../base'
import { Attestations } from '../generated/types/Attestations'
import {
  BaseWrapper,
  proxyCall,
  toBigNumber,
  toNumber,
  toTransactionObject,
  tupleParser,
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
  attestationState: AttestationState
  blockNumber: number
  publicKey: string
}

const parseAttestationInfo = (rawState: { 0: string; 1: string }) => ({
  attestationState: parseInt(rawState[0], 10),
  blockNumber: parseInt(rawState[1], 10),
})

function attestationMessageToSign(phoneHash: string, account: Address) {
  const messageHash: string = Web3Utils.soliditySha3(
    { type: 'bytes32', value: phoneHash },
    { type: 'address', value: account }
  )
  return messageHash
}

const stringIdentity = (x: string) => x
export class AttestationsWrapper extends BaseWrapper<Attestations> {
  /**
   *  Returns the time an attestation can be completable before it is considered expired
   */
  attestationExpiryBlocks = proxyCall(
    this.contract.methods.attestationExpiryBlocks,
    undefined,
    toNumber
  )

  /**
   * Returns the attestation request fee in a given currency.
   * @param address Token address.
   * @returns The fee as big number.
   */
  attestationRequestFees = proxyCall(
    this.contract.methods.attestationRequestFees,
    undefined,
    toBigNumber
  )

  selectIssuersWaitBlocks = proxyCall(
    this.contract.methods.selectIssuersWaitBlocks,
    undefined,
    toNumber
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
      blockNumber: toNumber(res[0]),
      attestationsRequested: toNumber(res[1]),
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
    (stat) => ({ completed: toNumber(stat[0]), total: toNumber(stat[1]) })
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
    return tokenContract.approve(this.address, fee.toString())
  }

  /**
   * Returns an array of attestations that can be completed, along with the issuers public key
   * @param phoneNumber
   * @param account
   */
  async getActionableAttestations(
    phoneNumber: string,
    account: Address
  ): Promise<ActionableAttestation[]> {
    const accounts = await this.kit.contracts.getAccounts()
    const phoneHash = PhoneNumberUtils.getPhoneHash(phoneNumber)
    const expiryBlocks = await this.attestationExpiryBlocks()
    const currentBlockNumber = await this.kit.web3.eth.getBlockNumber()

    const issuers = await this.contract.methods.getAttestationIssuers(phoneHash, account).call()
    const issuerState = Promise.all(
      issuers.map((issuer) =>
        this.contract.methods
          .getAttestationState(phoneHash, account, issuer)
          .call()
          .then(parseAttestationInfo)
      )
    )

    // Typechain is not properly typing getDataEncryptionKey
    const publicKeys: Promise<string[]> = Promise.all(
      issuers.map((issuer) => accounts.getDataEncryptionKey(issuer) as any)
    )

    const isIncomplete = (status: AttestationState) => status === AttestationState.Incomplete
    const hasNotExpired = (blockNumber: number) => currentBlockNumber < blockNumber + expiryBlocks
    const isValidKey = (key: string) => key !== null && key !== '0x0'

    return zip3(issuers, await issuerState, await publicKeys)
      .filter(
        ([_issuer, attestation, publicKey]) =>
          isIncomplete(attestation.attestationState) &&
          hasNotExpired(attestation.blockNumber) &&
          isValidKey(publicKey)
      )
      .map(([issuer, attestation, publicKey]) => ({
        ...attestation,
        issuer,
        publicKey: publicKey.toString(),
      }))
  }

  /**
   * Completes an attestation with the corresponding code
   * @param phoneNumber The phone number of the attestation
   * @param account The account of the attestation
   * @param issuer The issuer of the attestation
   * @param code The code received by the validator
   */
  complete(phoneNumber: string, account: Address, issuer: Address, code: string) {
    const phoneHash = PhoneNumberUtils.getPhoneHash(phoneNumber)
    const expectedSourceMessage = attestationMessageToSign(phoneHash, account)
    const { r, s, v } = parseSignature(expectedSourceMessage, code, issuer.toLowerCase())
    return toTransactionObject(this.kit, this.contract.methods.complete(phoneHash, v, r, s))
  }

  /**
   * Given a list of issuers, finds the matching issuer for a given code
   * @param phoneNumber The phone number of the attestation
   * @param account The account of the attestation
   * @param code The code received by the validator
   * @param issuers The list of potential issuers
   */
  findMatchingIssuer(
    phoneNumber: string,
    account: Address,
    code: string,
    issuers: string[]
  ): string | null {
    const phoneHash = PhoneNumberUtils.getPhoneHash(phoneNumber)
    for (const issuer of issuers) {
      const expectedSourceMessage = attestationMessageToSign(phoneHash, account)
      try {
        parseSignature(expectedSourceMessage, code, issuer.toLowerCase())
        return issuer
      } catch (error) {
        console.log(error)
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

    const toNum = (n: string) => new BigNumber(n).toNumber()
    const matches = stats[0].map(toNum)
    const addresses = stats[1]
    const completed = stats[2].map(toNum)
    const total = stats[3].map(toNum)
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
   * @param token The token with which to pay for the attestation fee
   */
  async selectIssuers(phoneNumber: string) {
    const phoneHash = PhoneNumberUtils.getPhoneHash(phoneNumber)
    return toTransactionObject(this.kit, this.contract.methods.selectIssuers(phoneHash))
  }

  /**
   * Reveals the phone number to the issuer of the attestation on-chain
   * @param phoneNumber The phone number which requested attestation
   * @param issuer The address of issuer of the attestation
   */
  async reveal(phoneNumber: string, issuer: Address) {
    const accounts = await this.kit.contracts.getAccounts()
    const publicKey: string = (await accounts.getDataEncryptionKey(issuer)) as any

    if (!publicKey) {
      throw new Error('Issuer data encryption key is null')
    }

    const encryptedPhone: any =
      '0x' +
      ECIES.Encrypt(
        Buffer.from(publicKey.slice(2), 'hex'),
        Buffer.from(phoneNumber, 'utf8')
      ).toString('hex')

    return toTransactionObject(
      this.kit,
      this.contract.methods.reveal(
        PhoneNumberUtils.getPhoneHash(phoneNumber),
        encryptedPhone,
        issuer,
        true
      )
    )
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
    const phoneHash = PhoneNumberUtils.getPhoneHash(phoneNumber)
    const expectedSourceMessage = attestationMessageToSign(phoneHash, account)
    const { r, s, v } = parseSignature(expectedSourceMessage, code, issuer.toLowerCase())
    const result = await this.contract.methods
      .validateAttestationCode(phoneHash, account, v, r, s)
      .call()
    return result.toLowerCase() !== NULL_ADDRESS
  }
}
