import {
  AccountAuthRequest,
  DappKitRequestMeta,
  DappKitRequestTypes,
  DappKitResponse,
  DappKitResponseStatus,
  parseDappkitResponseDepplink,
  PhoneNumberUtils,
  serializeDappKitRequestDeeplink,
  SignTxRequest,
  TxToSignParam,
} from '@celo/utils'
import {
  Attestations,
  CeloTokenType,
  GoldToken,
  lookupPhoneNumbers,
  StableToken,
} from '@celo/walletkit'
import { Linking } from 'expo'
import { Contact, Fields, getContactsAsync, PhoneNumber } from 'expo-contacts'
import { E164Number, parsePhoneNumberFromString } from 'libphonenumber-js'
import { chunk, Dictionary, flatten, fromPairs, zipObject } from 'lodash'
import Web3 from 'web3'
import { TransactionObject } from 'web3/eth/types'

export {
  AccountAuthRequest,
  DappKitRequestMeta,
  serializeDappKitRequestDeeplink,
  SignTxRequest,
} from '@celo/utils/'

export function listenToAccount(callback: (account: string) => void) {
  return Linking.addEventListener('url', ({ url }: { url: string }) => {
    try {
      const [dappKitResponse] = parseDappkitResponseDepplink(url)
      if (
        dappKitResponse.type === DappKitRequestTypes.ACCOUNT_ADDRESS &&
        dappKitResponse.status === DappKitResponseStatus.SUCCESS
      ) {
        callback(dappKitResponse.address)
      }
    } catch (error) {}
  })
}

export function waitForAccountAuth(requestId: string): Promise<DappKitResponse> {
  return new Promise((resolve, reject) => {
    const handler = ({ url }: { url: string }) => {
      try {
        const [dappKitResponse, returnedRequestId] = parseDappkitResponseDepplink(url)
        if (
          requestId === returnedRequestId &&
          dappKitResponse.type === DappKitRequestTypes.ACCOUNT_ADDRESS &&
          dappKitResponse.status === DappKitResponseStatus.SUCCESS
        ) {
          Linking.removeEventListener('url', handler)
          resolve(dappKitResponse)
        }
      } catch (error) {
        reject(error)
      }
    }
    Linking.addEventListener('url', handler)
  })
}

export function waitForSignedTxs(requestId: string): Promise<DappKitResponse> {
  return new Promise((resolve, reject) => {
    const handler = ({ url }: { url: string }) => {
      try {
        const [dappKitResponse, returnedRequestId] = parseDappkitResponseDepplink(url)
        if (
          requestId === returnedRequestId &&
          dappKitResponse.type === DappKitRequestTypes.SIGN_TX &&
          dappKitResponse.status === DappKitResponseStatus.SUCCESS
        ) {
          Linking.removeEventListener('url', handler)
          resolve(dappKitResponse)
        }
      } catch (error) {
        reject(error)
      }
    }
    Linking.addEventListener('url', handler)
  })
}

export function listenToSignedTxs(callback: (signedTxs: string[]) => void) {
  return Linking.addEventListener('url', ({ url }: { url: string }) => {
    try {
      const [dappKitResponse] = parseDappkitResponseDepplink(url)
      if (
        dappKitResponse.type === DappKitRequestTypes.SIGN_TX &&
        dappKitResponse.status === DappKitResponseStatus.SUCCESS
      ) {
        callback(dappKitResponse.rawTxs)
      }
    } catch (error) {}
  })
}

export function requestAccountAddress(meta: DappKitRequestMeta) {
  Linking.openURL(serializeDappKitRequestDeeplink(AccountAuthRequest(meta)))
}

export enum GasCurrency {
  cUSD = 'cUSD',
  cGLD = 'cGLD',
}

async function getGasCurrencyContract(
  web3: Web3,
  gasCurrency: GasCurrency
): Promise<CeloTokenType> {
  switch (gasCurrency) {
    case GasCurrency.cUSD:
      return StableToken(web3)
    case GasCurrency.cGLD:
      return GoldToken(web3)
    default:
      return StableToken(web3)
  }
}

export interface TxParams<T> {
  tx: TransactionObject<T>
  from: string
  to: string
  gasCurrency: GasCurrency
  estimatedGas?: number
  value?: string
}

export async function requestTxSig<T>(
  web3: Web3,
  txParams: TxParams<T>[],
  meta: DappKitRequestMeta
) {
  // TODO: For multi-tx payloads, we for now just assume the same from address for all txs. We should apply a better heuristic
  const baseNonce = await web3.eth.getTransactionCount(txParams[0].from)
  const txs: TxToSignParam[] = await Promise.all(
    txParams.map(async (txParam, index) => {
      const gasCurrencyContract = await getGasCurrencyContract(web3, txParam.gasCurrency)
      const value = txParam.value === undefined ? '0' : txParam.value

      const estimatedTxParams = {
        gasCurrency: gasCurrencyContract.options.address,
        from: txParam.from,
        value,
      }
      const estimatedGas =
        txParam.estimatedGas === undefined
          ? //
            // @ts-ignore
            await txParam.tx.estimateGas(estimatedTxParams)
          : txParam.estimatedGas

      return {
        txData: txParam.tx.encodeABI(),
        estimatedGas,
        nonce: baseNonce + index,
        gasCurrencyAddress: gasCurrencyContract._address,
        value,
        ...txParam,
      }
    })
  )
  const request = SignTxRequest(txs, meta)

  Linking.openURL(serializeDappKitRequestDeeplink(request))
}

function isValidPhoneNumber(phoneNumber: PhoneNumber): E164Number | undefined {
  if (phoneNumber.number === undefined) {
    return undefined
  }
  const parsedPhoneNumber = parsePhoneNumberFromString(phoneNumber.number)

  if (parsedPhoneNumber === undefined) {
    return undefined
  }

  if (!parsedPhoneNumber.isValid()) {
    return undefined
  }

  return parsedPhoneNumber.number
}

export interface PhoneNumberMappingEntry {
  address: string
  phoneNumber: string
  id: string
  attestationStat: {
    total: number
    completed: number
  }
}

function createPhoneNumberToContactMapping(contacts: Contact[]) {
  // @ts-ignore
  const phoneNumberObjects: [{ e164Number: E164Number; id: string }] = contacts.flatMap(
    (contact) => {
      return contact.phoneNumbers
        ? contact.phoneNumbers.flatMap((phoneNumber) => {
            const e164Number = isValidPhoneNumber(phoneNumber)
            return e164Number ? { e164Number, id: contact.id } : []
          })
        : []
    }
  )
  const flattened = phoneNumberObjects.map(({ e164Number, id }) => [e164Number.toString(), id])
  return fromPairs(flattened)
}

async function lookupPhoneNumbersOnAttestations(
  web3: Web3,
  allPhoneNumbers: Dictionary<string>
): Promise<Dictionary<PhoneNumberMappingEntry>> {
  const attestations = await Attestations(web3)
  const nestedResult = await Promise.all(
    chunk(Object.keys(allPhoneNumbers), 20).map(async (phoneNumbers) => {
      const hashedPhoneNumbers = phoneNumbers.map(PhoneNumberUtils.getPhoneHash)

      const phoneNumbersByHash = zipObject(hashedPhoneNumbers, phoneNumbers)

      const result = await lookupPhoneNumbers(attestations, hashedPhoneNumbers)

      return Object.entries(result).flatMap(([phoneHash, attestationStats]) =>
        Object.entries(attestationStats).map(([address, attestationStat]) => ({
          address,
          phoneNumber: phoneNumbersByHash[phoneHash],
          id: allPhoneNumbers[phoneNumbersByHash[phoneHash]],
          attestationStat,
        }))
      )
    })
  )

  return fromPairs(flatten(nestedResult).map((entry) => [entry.address, entry]))
}

export async function fetchContacts(
  web3: Web3
): Promise<[Dictionary<Contact>, Dictionary<PhoneNumberMappingEntry>]> {
  const contacts = await getContactsAsync({
    fields: [Fields.PhoneNumbers, Fields.Image],
  })

  const filteredContacts = contacts.data.filter((contact) => {
    return (
      contact.phoneNumbers && contact.phoneNumbers.some((p) => isValidPhoneNumber(p) !== undefined)
    )
  })

  const rawContacts = fromPairs(filteredContacts.map((contact) => [contact.id, contact]))

  // @ts-ignore
  const phoneNumbersToContacts = createPhoneNumberToContactMapping(filteredContacts)

  const phoneNumbersWithAddresses = await lookupPhoneNumbersOnAttestations(
    web3,
    phoneNumbersToContacts
  )

  return [rawContacts, phoneNumbersWithAddresses]
}
