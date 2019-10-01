import { ECIES, IdentityUtils, SignatureUtils } from '@celo/utils'
import { zip3 } from '@celo/utils/lib/collections'
import BigNumber from 'bignumber.js'
import * as Web3Utils from 'web3-utils'
import { Address, CeloToken } from '../base'
import { Attestations } from '../generated/types/Attestations'
import { BaseWrapper, proxyCall, proxySend, toBigNumber, toNumber, wrapSend } from './BaseWrapper'
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

function attestationMessageToSign(identifierHash: string, account: Address) {
  const messageHash: string = Web3Utils.soliditySha3(
    { type: 'bytes32', value: identifierHash },
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
   * Returns the set wallet address for the account
   * @param account Account
   */
  getWalletAddress = proxyCall(this.contract.methods.getWalletAddress)

  /**
   * Returns the metadataURL for the account
   * @param account Account
   */
  getMetadataURL = proxyCall(this.contract.methods.getMetadataURL)

  /**
   * Sets the data encryption of the account
   * @param encryptionKey The key to set
   */
  setAccountDataEncryptionKey = proxySend(
    this.kit,
    this.contract.methods.setAccountDataEncryptionKey
  )

  /**
   * Sets the metadataURL for the account
   * @param url The url to set
   */
  setMetadataURL = proxySend(this.kit, this.contract.methods.setMetadataURL)

  /**
   * Returns the attestation stats of a identifier/account pair
   * @param identifier eg. Phone Number
   * @param account Account
   */
  getAttestationStat: (identifier: string, account: Address) => Promise<AttestationStat> = async (
    identifier: string,
    account: Address
  ) => {
    const identifierHash = await IdentityUtils.identityHash(identifier)
    const stat = await this.contract.methods.getAttestationStats(identifierHash, account).call()
    return { completed: toNumber(stat[0]), total: toNumber(stat[1]) }
  }

  /**
   * Returns the current configuration parameters for the contract.
   * @param tokens List of tokens used for attestation fees.
   */
  setWalletAddress = proxySend(this.kit, this.contract.methods.setWalletAddress)

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
   * @param identifier
   * @param account
   */
  async getActionableAttestations(
    identifier: string,
    account: Address
  ): Promise<ActionableAttestation[]> {
    const identifierHash = await IdentityUtils.identityHash(identifier)
    const expirySeconds = await this.attestationExpirySeconds()
    const nowInUnixSeconds = Math.floor(new Date().getTime() / 1000)

    const issuers = await this.contract.methods
      .getAttestationIssuers(identifierHash, account)
      .call()
    const issuerState = Promise.all(
      issuers.map((issuer) =>
        this.contract.methods
          .getAttestationState(identifierHash, account, issuer)
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
   * @param identifier The identifier of the attestation
   * @param account The account of the attestation
   * @param issuer The issuer of the attestation
   * @param code The code received by the validator
   */
  async complete(identifier: string, account: Address, issuer: Address, code: string) {
    const identifierHash = await IdentityUtils.identityHash(identifier)
    const expectedSourceMessage = attestationMessageToSign(identifierHash, account)
    const { r, s, v } = parseSignature(expectedSourceMessage, code, issuer.toLowerCase())
    return wrapSend(this.kit, this.contract.methods.complete(identifierHash, v, r, s))
  }

  /**
   * Given a list of issuers, finds the matching issuer for a given code
   * @param identifier The identifier of the attestation
   * @param account The account of the attestation
   * @param code The code received by the validator
   * @param issuers The list of potential issuers
   */
  async findMatchingIssuer(identifier: string, account: Address, code: string, issuers: string[]) {
    const identifierHash = await IdentityUtils.identityHash(identifier)
    for (const issuer of issuers) {
      const expectedSourceMessage = attestationMessageToSign(identifierHash, account)
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
      attestationExpirySeconds: await this.attestationExpirySeconds(),
      attestationRequestFees: fees,
    }
  }

  /**
   * Lookup mapped walleet addresses for a given list of hashes of phone numbers
   * @param phoneNumberHashes The hashes of phone numbers to lookup
   */
  async lookupIdentifiers(
    identifierHashes: string[]
  ): Promise<Record<string, Record<string, AttestationStat>>> {
    // Unfortunately can't be destructured
    const stats = await this.contract.methods.batchGetAttestationStats(identifierHashes).call()

    const toNum = (n: string) => new BigNumber(n).toNumber()
    const matches = stats[0].map(toNum)
    const addresses = stats[1]
    const completed = stats[2].map(toNum)
    const total = stats[3].map(toNum)
    // Map of identifier hash -> (Map of address -> AttestationStat)
    const result: Record<string, Record<string, AttestationStat>> = {}

    let rIndex = 0

    for (let pIndex = 0; pIndex < identifierHashes.length; pIndex++) {
      const pHash = identifierHashes[pIndex]
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
   * Requests attestations for a identifier
   * @param identifier The identifier for which to request attestations for
   * @param attestationsRequested The number of attestations to request
   * @param token The token with which to pay for the attestation fee
   */
  async request(identifier: string, attestationsRequested: number, token: CeloToken) {
    const identifierHash = await IdentityUtils.identityHash(identifier)
    const tokenAddress = await this.kit.registry.addressFor(token)
    return wrapSend(
      this.kit,
      this.contract.methods.request(identifierHash, attestationsRequested, tokenAddress)
    )
  }

  /**
   * Reveals the identifier to the issuer of the attestation on-chain
   * @param identifer The identifier which requested attestation
   * @param issuer The address of issuer of the attestation
   */
  async reveal(identifer: string, issuer: Address) {
    const publicKey: string = (await this.contract.methods
      .getDataEncryptionKey(issuer)
      .call()) as any

    if (!publicKey) {
      throw new Error('Issuer data encryption key is null')
    }

    const encryptedIdentifier: any =
      '0x' +
      ECIES.Encrypt(
        Buffer.from(publicKey.slice(2), 'hex'),
        Buffer.from(identifer, 'utf8')
      ).toString('hex')

    return wrapSend(
      this.kit,
      this.contract.methods.reveal(
        await IdentityUtils.identityHash(identifer),
        encryptedIdentifier,
        issuer,
        true
      )
    )
  }

  /**
   * Validates a given code by the issuer on-chain
   * @param identifer The identifer which requested attestation
   * @param account The account which requested attestation
   * @param issuer The address of the issuer of the attestation
   * @param code The code send by the issuer
   */
  async validateAttestationCode(
    identifer: string,
    account: Address,
    issuer: Address,
    code: string
  ) {
    const identifierHash = await IdentityUtils.identityHash(identifer)
    const expectedSourceMessage = attestationMessageToSign(identifierHash, account)
    const { r, s, v } = parseSignature(expectedSourceMessage, code, issuer.toLowerCase())
    return this.contract.methods.validateAttestationCode(identifierHash, account, v, r, s).call()
  }
}
