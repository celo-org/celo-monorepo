import { ECIES, PhoneNumberUtils, SignatureUtils } from '@celo/utils'
import { zip3 } from '@celo/utils/lib/collections'
import BigNumber from 'bignumber.js'
import * as Web3Utils from 'web3-utils'
import { Address, CeloToken } from '../base'
import { Attestations } from '../generated/types/Attestations'
import {
  BaseWrapper,
  proxyCall,
  proxySend,
  toBigNumber,
  toNumber,
  tupleParser,
  wrapSend,
} from './BaseWrapper'
const parseSignature = SignatureUtils.parseSignature

export interface AttestationStat {
  completed: number
  total: number
}

export interface AttestationsToken {
  address: Address
  fee: BigNumber
}

export interface AttestationsConfig {
  attestationExpirySeconds: number
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
  time: number
  publicKey: string
}

const parseAttestationInfo = (rawState: { 0: string; 1: string }) => ({
  attestationState: parseInt(rawState[0], 10),
  time: parseInt(rawState[1], 10),
})

function attestationMessageToSign(phoneHash: string, account: Address) {
  const messageHash: string = Web3Utils.soliditySha3(
    { type: 'bytes32', value: phoneHash },
    { type: 'address', value: account }
  )
  return messageHash
}

export class AttestationsWrapper extends BaseWrapper<Attestations> {
  /**
   *  Returns the time an attestation can be completable before it is considered expired
   */
  attestationExpirySeconds = proxyCall(
    this.contract.methods.attestationExpirySeconds,
    undefined,
    toNumber
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
    tupleParser(PhoneNumberUtils.getPhoneHash, (x: string) => x),
    (stat) => ({ completed: toNumber(stat[0]), total: toNumber(stat[1]) })
  )

  /**
   * Returns the set wallet address for the account
   * @param account Account
   */
  getWalletAddress = proxyCall(this.contract.methods.getWalletAddress)

  /**
   * Sets the data encryption of the account
   * @param encryptionKey The key to set
   */
  setAccountDataEncryptionKey = proxySend(
    this.kit,
    this.contract.methods.setAccountDataEncryptionKey
  )

  /**
   * Sets the wallet address for the account
   * @param address The address to set
   */
  setWalletAddress = proxySend(this.kit, this.contract.methods.setWalletAddress)

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
      attestationExpirySeconds: await this.attestationExpirySeconds(),
      attestationRequestFees: fees,
    }
  }

  /**
   * Calculates the amount of CeloToken to request Attestations
   * @param token The token to pay for attestations for
   * @param attestationsRequested The number of attestations to request
   */
  async approveAttestationFee(token: CeloToken, attestationsRequested: number) {
    const tokenContract = await this.kit.contracts.getContract(token)
    const fee = await this.attestationFeeRequired(token, attestationsRequested)
    return tokenContract.approve(this.address, fee.toString())
  }

  /**
   * Approves the transfer of CeloToken to request Attestations
   * @param token  The token to pay for attestations for
   * @param attestationsRequested  The number of attestations to request
   */
  async attestationFeeRequired(token: CeloToken, attestationsRequested: number) {
    const tokenAddress = await this.kit.registry.addressFor(token)
    const attestationFee = await this.contract.methods.getAttestationRequestFee(tokenAddress).call()
    return new BigNumber(attestationFee).times(attestationsRequested)
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
    const phoneHash = PhoneNumberUtils.getPhoneHash(phoneNumber)
    const expirySeconds = await this.attestationExpirySeconds()
    const nowInUnixSeconds = Math.floor(new Date().getTime() / 1000)

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
      issuers.map((issuer) => this.contract.methods.getDataEncryptionKey(issuer).call() as any)
    )

    const isIncomplete = (status: AttestationState) => status === AttestationState.Incomplete
    const hasNotExpired = (time: number) => nowInUnixSeconds < time + expirySeconds
    const isValidKey = (key: string) => key !== null && key !== '0x0'

    return zip3(issuers, await issuerState, await publicKeys)
      .filter(
        ([_issuer, attestation, publicKey]) =>
          isIncomplete(attestation.attestationState) &&
          hasNotExpired(attestation.time) &&
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
    return wrapSend(this.kit, this.contract.methods.complete(phoneHash, v, r, s))
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
   * @param token The token with which to pay for the attestation fee
   */
  async request(phoneNumber: string, attestationsRequested: number, token: CeloToken) {
    const phoneHash = PhoneNumberUtils.getPhoneHash(phoneNumber)
    const tokenAddress = await this.kit.registry.addressFor(token)
    return wrapSend(
      this.kit,
      this.contract.methods.request(phoneHash, attestationsRequested, tokenAddress)
    )
  }

  /**
   * Reveals the phone number to the issuer of the attestation on-chain
   * @param phoneNumber The phone number which requested attestation
   * @param issuer The address of issuer of the attestation
   */
  async reveal(phoneNumber: string, issuer: Address) {
    const publicKey: string = (await this.contract.methods
      .getDataEncryptionKey(issuer)
      .call()) as any

    if (!publicKey) {
      throw new Error('Issuer data encryption key is null')
    }

    const encryptedPhone: any =
      '0x' +
      ECIES.Encrypt(
        Buffer.from(publicKey.slice(2), 'hex'),
        Buffer.from(phoneNumber, 'utf8')
      ).toString('hex')

    return wrapSend(
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
    return this.contract.methods.validateAttestationCode(phoneHash, account, v, r, s).call()
  }
}
