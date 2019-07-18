import { Attestations } from '@celo/contractkit/types/Attestations'
import { ECIES, PhoneNumberUtils, SignatureUtils } from '@celo/utils'
import BigNumber from 'bignumber.js'
import { Dictionary, zip } from 'lodash'
import * as Web3Utils from 'web3-utils'
import { CeloTokenType } from './erc20-utils'
const parseSignature = SignatureUtils.parseSignature

export async function makeApproveAttestationFeeTx(
  attestations: Attestations,
  tokenContract: CeloTokenType,
  attestationsRequested: number
) {
  const feeToApprove = await getAttestationFee(attestations, tokenContract, attestationsRequested)
  return tokenContract.methods.approve(attestations._address, feeToApprove.toString())
}

export async function getAttestationFee(
  attestations: Attestations,
  tokenContract: CeloTokenType,
  attestationsRequested: number
) {
  const attestationFee = await attestations.methods
    .getAttestationRequestFee(tokenContract._address)
    .call()
  return new BigNumber(attestationFee).times(attestationsRequested)
}

export function attestationMessageToSign(phoneHash: string, account: string) {
  const messageHash: string = Web3Utils.soliditySha3(
    { type: 'bytes32', value: phoneHash },
    { type: 'address', value: account }
  )
  return messageHash
}

export function makeRequestTx(
  attestations: Attestations,
  phoneHash: string,
  attestationsRequested: number,
  tokenContract: CeloTokenType
) {
  return attestations.methods.request(phoneHash, attestationsRequested, tokenContract._address)
}

type IssuerAttestationState = Array<
  [
    string,
    {
      0: string
      1: string
    }
  ]
>

export async function getAttestationState(
  attestations: Attestations,
  phoneHash: string,
  account: string
) {
  const issuers = await attestations.methods.getAttestationIssuers(phoneHash, account).call()
  const issuerState = await Promise.all(
    issuers.map((issuer: any) =>
      attestations.methods.getAttestationState(phoneHash, account, issuer).call()
    )
  )

  return zip(issuers, issuerState) as IssuerAttestationState
}

export enum AttestationState {
  None,
  Incomplete,
  Complete,
}

export async function makeRevealTx(
  attestations: Attestations,
  phoneNumber: string,
  issuer: string
) {
  const publicKey = await attestations.methods.getDataEncryptionKey(issuer).call()

  const encryptedPhone: any =
    '0x' +
    ECIES.Encrypt(
      // @ts-ignore
      Buffer.from(publicKey.slice(2), 'hex'),
      Buffer.from(phoneNumber, 'utf8')
    ).toString('hex')
  return attestations.methods.reveal(
    PhoneNumberUtils.getPhoneHash(phoneNumber),
    encryptedPhone,
    issuer,
    true
  )
}

export function findMatchingIssuer(
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
      continue
    }
  }
  return null
}

export interface ActionableAttestation {
  issuer: string
  attestationState: AttestationState
  time: number
}
export async function getActionableAttestations(
  attestations: Attestations,
  phoneHash: string,
  account: string
): Promise<ActionableAttestation[]> {
  const attestationExpirySeconds = parseInt(
    await attestations.methods.attestationExpirySeconds().call(),
    16
  )
  const attestationStates = await getAttestationState(attestations, phoneHash, account)
  const now = Math.floor(new Date().getTime() / 1000)
  return attestationStates
    .map(([issuer, issuerState]) => ({
      issuer,
      attestationState: parseInt(issuerState[0], 10),
      time: parseInt(issuerState[1], 10),
    }))
    .filter(
      (attestation) =>
        attestation.attestationState === AttestationState.Incomplete &&
        now < attestation.time + attestationExpirySeconds
    )
}

export function makeCompleteTx(
  attestations: Attestations,
  phoneHash: string,
  account: string,
  issuer: string,
  code: string
) {
  const expectedSourceMessage = attestationMessageToSign(phoneHash, account)
  const { r, s, v } = parseSignature(expectedSourceMessage, code, issuer.toLowerCase())
  return attestations.methods.complete(phoneHash, v, r, s)
}

const attestationCodeRegex = new RegExp(/(.* |^)([a-zA-Z0-9=_-]{87,88})($| .*)/)

export function messageContainsAttestationCode(message: string) {
  return attestationCodeRegex.test(message)
}

export function extractAttestationCodeFromMessage(message: string) {
  if (!message) {
    throw new Error('Empty message')
  }

  const sanitizedMessage = sanitizeBase64(message)
  if (!messageContainsAttestationCode(sanitizedMessage)) {
    throw new Error('Message did not contain verification code')
  }

  const matches = sanitizedMessage.match(attestationCodeRegex)
  if (!matches || matches.length < 3) {
    return null
  }
  return decodeAttestationCode(matches[2])
}

export function sanitizeBase64(base64String: string) {
  // Replace occurrences of ¿ with _. Unsure why that is happening right now
  return base64String.replace(/(¿|§)/gi, '_')
}

export function decodeAttestationCode(base64String: string) {
  return '0x' + Buffer.from(base64String, 'base64').toString('hex')
}

export function validateAttestationCode(
  attestations: Attestations,
  phoneHash: string,
  account: string,
  issuer: string,
  code: string
) {
  const expectedSourceMessage = attestationMessageToSign(phoneHash, account)
  const { r, s, v } = parseSignature(expectedSourceMessage, code, issuer.toLowerCase())
  return attestations.methods.validateAttestationCode(phoneHash, account, v, r, s).call()
}

interface AttestationStat {
  completed: number
  total: number
}
export async function lookupPhoneNumbers(attestations: Attestations, phoneNumberHashes: string[]) {
  // Unfortunately can't be destructured
  const stats = await attestations.methods.batchGetAttestationStats(phoneNumberHashes).call()

  const toNum = (n: string) => new BigNumber(n).toNumber()
  const matches = stats[0].map(toNum)
  const addresses = stats[1]
  const completed = stats[2].map(toNum)
  const total = stats[3].map(toNum)
  // Map of phone hash -> (Map of address -> AttestationStat)
  const result: Dictionary<Dictionary<AttestationStat> | undefined> = {}

  let rIndex = 0

  for (let pIndex = 0; pIndex < phoneNumberHashes.length; pIndex++) {
    const pHash = phoneNumberHashes[pIndex]
    const numberOfMatches = matches[pIndex]
    if (numberOfMatches === 0) {
      continue
    }

    const matchingAddresses: Dictionary<AttestationStat> = {}
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

export function getWalletAddress(attestations: Attestations, account: string) {
  return attestations.methods.getWalletAddress(account).call()
}

/**
 * @param attestations Attestations contract
 * @param account Account address
 * @return {Promise<string>} Hex encoded string with leading '0x' of encryption data key
 */
export function getDataEncryptionKey(attestations: Attestations, account: string) {
  // Known error with typechain around TS typing of solidity bytes: https://github.com/ethereum-ts/TypeChain/issues/98
  // @ts-ignore
  return (attestations.methods.getDataEncryptionKey(account).call() as any) as Promise<string>
}

export function makeSetWalletAddressTx(attestations: Attestations, address: string) {
  return attestations.methods.setWalletAddress(address)
}

export function makeSetDataEncryptionKeyTx(attestations: Attestations, publicKey: string) {
  // Known error with typechain around TS typing of solidity bytes: https://github.com/ethereum-ts/TypeChain/issues/98
  // @ts-ignore
  return attestations.methods.setAccountDataEncryptionKey(publicKey)
}

export function makeSetAccountTx(attestations: Attestations, address: string, publicKey: string) {
  // Known error with typechain around TS typing of solidity bytes: https://github.com/ethereum-ts/TypeChain/issues/98
  // @ts-ignore
  return attestations.methods.setAccount(publicKey, address)
}
