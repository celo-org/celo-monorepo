import { ECIES, PhoneNumberUtils, SignatureUtils } from '@celo/utils'
import { zip3 } from '@celo/utils/lib/collections'
import BigNumber from 'bignumber.js'
import * as Web3Utils from 'web3-utils'
import { CeloToken } from '../base'
import { Attestations } from '../generated/types/Attestations'
import { BaseWrapper, proxyCall, proxySend, toNumber, tupleParser, wrapSend } from './BaseWrapper'
const parseSignature = SignatureUtils.parseSignature

export interface AttestationStat {
  completed: number
  total: number
}

export enum AttestationState {
  None,
  Incomplete,
  Complete,
}

export interface ActionableAttestation {
  issuer: string
  attestationState: AttestationState
  time: number
  publicKey: string
}

const parseAttestationInfo = (rawState: { 0: string; 1: string }) => ({
  attestationState: parseInt(rawState[0], 10),
  time: parseInt(rawState[1], 10),
})

function attestationMessageToSign(phoneHash: string, account: string) {
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
   * @param {string} phoneNumber Phone Number
   * @param {string} account Account
   */
  getAttestationStat = proxyCall(
    this.contract.methods.getAttestationStats,
    tupleParser(PhoneNumberUtils.getPhoneHash, (x: string) => x),
    (stat) => ({ completed: toNumber(stat[0]), total: toNumber(stat[1]) })
  )

  /**
   * Returns the set wallet address for the account
   * @param {string} account Account
   */
  getWalletAddress = proxyCall(this.contract.methods.getWalletAddress)

  /**
   * Sets the data encryption of the account
   * @param {string} encryptionKey The key to set
   */
  setAccountDataEncryptionKey = proxySend(
    this.kit,
    this.contract.methods.setAccountDataEncryptionKey
  )

  /**
   * Sets the wallet address for the account
   * @param {string} address The address to set
   */
  setWalletAddress = proxySend(this.kit, this.contract.methods.setWalletAddress)

  /**
   * Calculates the amount of CeloToken to request Attestations
   * @param {CeloToken} token The token to pay for attestations for
   * @param {number} attestationsRequested The number of attestations to request
   */
  async approveAttestationFee(token: CeloToken, attestationsRequested: number) {
    const tokenContract = await this.kit.contracts.getContract(token)
    const fee = await this.attestationFeeRequired(token, attestationsRequested)
    return tokenContract.approve(this.address, fee.toString())
  }

  /**
   * Approves the transfer of CeloToken to request Attestations
   * @param {CeloToken} token  The token to pay for attestations for
   * @param {number} attestationsRequested  The number of attestations to request
   */
  async attestationFeeRequired(token: CeloToken, attestationsRequested: number) {
    const tokenAddress = await this.kit.registry.addressFor(token)
    const attestationFee = await this.contract.methods.getAttestationRequestFee(tokenAddress).call()
    return new BigNumber(attestationFee).times(attestationsRequested)
  }

  /**
   * Returns an array of attestations that can be completed, along with the issuers public key
   * @param {string} phoneNumber
   * @param {string} account
   */
  async getActionableAttestations(
    phoneNumber: string,
    account: string
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
    // @ts-ignore
    const publicKeys: Promise<string[]> = Promise.all(
      issuers.map((issuer) => this.contract.methods.getDataEncryptionKey(issuer).call())
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
   * @param {string} phoneNumber The phone number of the attestation
   * @param {string} account The account of the attestation
   * @param {string} issuer The issuer of the attestation
   * @param {string} code The code received by the validator
   */
  complete(phoneNumber: string, account: string, issuer: string, code: string) {
    const phoneHash = PhoneNumberUtils.getPhoneHash(phoneNumber)
    const expectedSourceMessage = attestationMessageToSign(phoneHash, account)
    const { r, s, v } = parseSignature(expectedSourceMessage, code, issuer.toLowerCase())
    return wrapSend(this.kit, this.contract.methods.complete(phoneHash, v, r, s))
  }

  /**
   * Given a list of issuers, finds the matching issuer for a given code
   * @param {string} phoneNumber The phone number of the attestation
   * @param {string} account The account of the attestation
   * @param {string} code The code received by the validator
   * @param {string[]} issuers The list of potential issuers
   */
  findMatchingIssuer(
    phoneNumber: string,
    account: string,
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
   * @param {string[]} phoneNumberHashes The hashes of phone numbers to lookup
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
   * @param {string} phoneNumber The phone number for which to request attestations for
   * @param {number} attestationsRequested The number of attestations to request
   * @param {string} token The token with which to pay for the attestation fee
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
   * @param {string} phoneNumber The phone number which requested attestation
   * @param {string} issuer The address of issuer of the attestation
   */
  async reveal(phoneNumber: string, issuer: string) {
    const publicKey = await this.contract.methods.getDataEncryptionKey(issuer).call()

    if (!publicKey) {
      throw new Error('Issuer data encryption key is null')
    }

    const encryptedPhone: any =
      '0x' +
      ECIES.Encrypt(
        // @ts-ignore
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
   * @param {string} phoneNumber The phone number which requested attestation
   * @param {string} account The account which requested attestation
   * @param {string} issuer The address of the issuer of the attestation
   * @param {string} code The code send by the issuer
   */
  async validateAttestationCode(
    phoneNumber: string,
    account: string,
    issuer: string,
    code: string
  ) {
    const phoneHash = PhoneNumberUtils.getPhoneHash(phoneNumber)
    const expectedSourceMessage = attestationMessageToSign(phoneHash, account)
    const { r, s, v } = parseSignature(expectedSourceMessage, code, issuer.toLowerCase())
    return this.contract.methods.validateAttestationCode(phoneHash, account, v, r, s).call()
  }
}
