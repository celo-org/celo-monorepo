import { CeloContract, ContractKit } from '@celo/contractkit'
import {
  AccountAuthRequest,
  AccountAuthResponseSuccess,
  DappKitRequestMeta,
  DappKitRequestTypes,
  DappKitResponseStatus,
  parseDappkitResponseDeeplink,
  PhoneNumberUtils,
  serializeDappKitRequestDeeplink,
  SignTxRequest,
  SignTxResponseSuccess,
  TxToSignParam,
} from '@celo/utils'
import { Linking } from 'expo'
import { Contact, Fields, getContactsAsync, PhoneNumber } from 'expo-contacts'
import { E164Number, parsePhoneNumberFromString } from 'libphonenumber-js'
import { chunk, find, flatMap, flatten, fromPairs, zipObject } from 'lodash'
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
      const dappKitResponse = parseDappkitResponseDeeplink(url)
      if (
        dappKitResponse.type === DappKitRequestTypes.ACCOUNT_ADDRESS &&
        dappKitResponse.status === DappKitResponseStatus.SUCCESS
      ) {
        callback(dappKitResponse.address)
      }
    } catch (error) {}
  })
}

export function waitForAccountAuth(requestId: string): Promise<AccountAuthResponseSuccess> {
  return new Promise((resolve, reject) => {
    const handler = ({ url }: { url: string }) => {
      try {
        const dappKitResponse = parseDappkitResponseDeeplink(url)
        if (
          requestId === dappKitResponse.requestId &&
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

export function waitForSignedTxs(requestId: string): Promise<SignTxResponseSuccess> {
  return new Promise((resolve, reject) => {
    const handler = ({ url }: { url: string }) => {
      try {
        const dappKitResponse = parseDappkitResponseDeeplink(url)
        if (
          requestId === dappKitResponse.requestId &&
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
      const dappKitResponse = parseDappkitResponseDeeplink(url)
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

export enum FeeCurrency {
  cUSD = 'cUSD',
  cGLD = 'cGLD',
}

async function getFeeCurrencyContractAddress(
  kit: ContractKit,
  feeCurrency: FeeCurrency
): Promise<string> {
  switch (feeCurrency) {
    case FeeCurrency.cUSD:
      return kit.registry.addressFor(CeloContract.StableToken)
    case FeeCurrency.cGLD:
      return kit.registry.addressFor(CeloContract.GoldToken)
    default:
      return kit.registry.addressFor(CeloContract.StableToken)
  }
}

export interface TxParams<T> {
  tx: TransactionObject<T>
  from: string
  to?: string
  feeCurrency?: FeeCurrency
  estimatedGas?: number
  value?: string
}

export async function requestTxSig<T>(
  kit: ContractKit,
  txParams: TxParams<T>[],
  meta: DappKitRequestMeta
) {
  // TODO: For multi-tx payloads, we for now just assume the same from address for all txs. We should apply a better heuristic
  const baseNonce = await kit.web3.eth.getTransactionCount(txParams[0].from)
  const txs: TxToSignParam[] = await Promise.all(
    txParams.map(async (txParam, index) => {
      const feeCurrency = txParam.feeCurrency ? txParam.feeCurrency : FeeCurrency.cGLD
      const feeCurrencyContractAddress = await getFeeCurrencyContractAddress(kit, feeCurrency)
      const value = txParam.value === undefined ? '0' : txParam.value

      const estimatedTxParams = {
        feeCurrency: feeCurrencyContractAddress,
        from: txParam.from,
        value,
      } as any
      const estimatedGas =
        txParam.estimatedGas === undefined
          ? await txParam.tx.estimateGas(estimatedTxParams)
          : txParam.estimatedGas

      return {
        txData: txParam.tx.encodeABI(),
        estimatedGas,
        nonce: baseNonce + index,
        feeCurrencyAddress: feeCurrencyContractAddress,
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
  const phoneNumberObjects = (flatMap(contacts, (contact) => {
    return contact.phoneNumbers
      ? flatMap(contact.phoneNumbers, (phoneNumber) => {
          const e164Number = isValidPhoneNumber(phoneNumber)
          return e164Number ? { e164Number, id: contact.id } : []
        })
      : []
  }) as unknown) as [{ e164Number: E164Number; id: string }]
  const flattened = phoneNumberObjects.map(({ e164Number, id }) => [e164Number.toString(), id])
  return fromPairs(flattened)
}

async function lookupPhoneNumbersOnAttestations(
  kit: ContractKit,
  allPhoneNumbers: { [phoneNumber: string]: string }
): Promise<{ [address: string]: PhoneNumberMappingEntry }> {
  const attestations = await kit.contracts.getAttestations()
  const nestedResult = await Promise.all(
    chunk(Object.keys(allPhoneNumbers), 20).map(async (phoneNumbers) => {
      const hashedPhoneNumbers = phoneNumbers.map(PhoneNumberUtils.getPhoneHash)

      const phoneNumbersByHash = zipObject(hashedPhoneNumbers, phoneNumbers)

      const result = await attestations.lookupPhoneNumbers(hashedPhoneNumbers)

      return flatMap(Object.keys(result), (phoneHash) => {
        const attestationStats = result[phoneHash]
        return Object.keys(attestationStats).map((address) => ({
          address,
          phoneNumber: phoneNumbersByHash[phoneHash],
          id: allPhoneNumbers[phoneNumbersByHash[phoneHash]],
          attestationStat: attestationStats[address],
        }))
      })
    })
  )

  return fromPairs(flatten(nestedResult).map((entry) => [entry.address, entry]))
}

export interface ContactsById {
  [id: string]: Contact
}
export interface PhoneNumberMappingEntryByAddress {
  [address: string]: PhoneNumberMappingEntry
}
export async function fetchContacts(
  kit: ContractKit
): Promise<{ rawContacts: ContactsById; phoneNumbersByAddress: PhoneNumberMappingEntryByAddress }> {
  const contacts = await getContactsAsync({
    fields: [Fields.PhoneNumbers, Fields.Image],
  })

  const filteredContacts = contacts.data.filter((contact) => {
    return (
      contact.phoneNumbers && find(contact.phoneNumbers, (p) => isValidPhoneNumber(p) !== undefined)
    )
  })

  const rawContacts = fromPairs(filteredContacts.map((contact) => [contact.id, contact]))

  // @ts-ignore
  const phoneNumbersToContacts = createPhoneNumberToContactMapping(filteredContacts)

  const phoneNumbersByAddress = await lookupPhoneNumbersOnAttestations(kit, phoneNumbersToContacts)

  return {
    rawContacts,
    phoneNumbersByAddress,
  }
}

export function getContactForAddress(
  address: string,
  rawContacts: ContactsById,
  addressMapping: PhoneNumberMappingEntryByAddress
): Contact | undefined {
  const entry = addressMapping[address]

  if (entry === undefined) {
    return undefined
  }

  const contact = rawContacts[entry.id]
  if (contact === undefined) {
    return undefined
  }

  return contact
}
