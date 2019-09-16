import { ECIES, PhoneNumberUtils, SignatureUtils } from '@celo/utils'
import BigNumber from 'bignumber.js'
import { zip } from 'lodash'
import * as Web3Utils from 'web3-utils'
import { Attestations } from '../generated/types/Attestations'
import { BaseWrapper, proxyCall, proxySend, toNumber, tupleParser, wrapSend } from './BaseWrapper'
import { CeloToken } from './TokenWrapper'
const parseSignature = SignatureUtils.parseSignature

export interface AttestationStat {
  completed: number
  total: number
}

export interface IssuerAttestationState {
  [issuer: string]: {}
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
  attestationExpirySeconds = proxyCall(
    this.contract.methods.attestationExpirySeconds,
    undefined,
    toNumber
  )

  getAttestationStat = proxyCall(
    this.contract.methods.getAttestationStats,
    tupleParser(PhoneNumberUtils.getPhoneHash, (x: string) => x),
    (stat) => ({ completed: toNumber(stat[0]), total: toNumber(stat[1]) })
  )

  getWalletAddress = proxyCall(this.contract.methods.getWalletAddress)

  setAccountDataEncryptionKey = proxySend(
    this.kit,
    this.contract.methods.setAccountDataEncryptionKey
  )

  setWalletAddress = proxySend(this.kit, this.contract.methods.setWalletAddress)

  async approveAttestationFee(token: CeloToken, attestationsRequested: number) {
    const fee = await this.attestationFeeRequired(token.address, attestationsRequested)
    return token.approve(this.address, fee.toString())
  }

  async attestationFeeRequired(tokenAddress: string, attestationsRequested: number) {
    const attestationFee = await this.contract.methods.getAttestationRequestFee(tokenAddress).call()
    return new BigNumber(attestationFee).times(attestationsRequested)
  }

  async getActionableAttestations(
    phoneNumber: string,
    account: string
  ): Promise<ActionableAttestation[]> {
    const phoneHash = PhoneNumberUtils.getPhoneHash(phoneNumber)
    const expirySeconds = await this.attestationExpirySeconds()
    const nowInUnixSeconds = Math.floor(new Date().getTime() / 1000)

    const issuers = await this.contract.methods.getAttestationIssuers(phoneHash, account).call()
    const issuerState = Promise.all(
      issuers.map((issuer: any) =>
        this.contract.methods
          .getAttestationState(phoneHash, account, issuer)
          .call()
          .then(parseAttestationInfo)
      )
    )
    const publicKeys = Promise.all(
      issuers.map((issuer) => this.contract.methods.getDataEncryptionKey(issuer).call())
    )

    return ((zip(issuers, await issuerState, await publicKeys) as unknown) as Array<
      [string, { attestationState: number; time: number }, string]
    >)
      .filter(
        ([_issuer, attestation, publicKey]) =>
          attestation.attestationState === AttestationState.Incomplete &&
          nowInUnixSeconds < attestation.time + expirySeconds &&
          publicKey !== null &&
          publicKey !== '0x0'
      )
      .map(([issuer, attestation, publicKey]) => ({ ...attestation, issuer, publicKey }))
  }

  complete(phoneNumber: string, account: string, issuer: string, code: string) {
    const phoneHash = PhoneNumberUtils.getPhoneHash(phoneNumber)
    const expectedSourceMessage = attestationMessageToSign(phoneHash, account)
    const { r, s, v } = parseSignature(expectedSourceMessage, code, issuer.toLowerCase())
    return wrapSend(this.kit, this.contract.methods.complete(phoneHash, v, r, s))
  }

  findMatchingIssuer(
    phoneHash: string,
    account: string,
    code: string,
    issuers: string[]
  ): string | null {
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

  async request(phoneNumber: string, attestationsRequested: number, token: CeloToken) {
    const phoneHash = PhoneNumberUtils.getPhoneHash(phoneNumber)
    return wrapSend(
      this.kit,
      this.contract.methods.request(phoneHash, attestationsRequested, token.address)
    )
  }

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
