import { parsePhoneNumber } from '@celo/utils/src/phoneNumbers'
import * as fuzzysort from 'fuzzysort'
import { MinimalContact } from 'react-native-contacts'
import { AddressToE164NumberType, E164NumberToAddressType } from 'src/identity/reducer'
import Logger from 'src/utils/Logger'

const TAG = 'utils/recipient'

export enum RecipientKind {
  MobileNumber = 'mobileNumber',
  Contact = 'contact',
  QrCode = 'QrCode',
}

export type Recipient = RecipientWithMobileNumber | RecipientWithContact | RecipientWithQrCode

interface IRecipient {
  kind: RecipientKind
  address?: string
  displayName: string
  displayPhoneNumber: string
  e164PhoneNumber?: string
}

export interface RecipientWithMobileNumber extends IRecipient {
  kind: RecipientKind.MobileNumber
  e164PhoneNumber: string // MobileNumber recipients always have a parsable number
}

export interface RecipientWithContact extends IRecipient {
  kind: RecipientKind.Contact
  phoneNumberLabel: string
  contactId: string
  thumbnailPath?: string
}

export interface RecipientWithQrCode extends IRecipient {
  kind: RecipientKind.QrCode
  address: string
  phoneNumberLabel?: string
  contactId?: string
  thumbnailPath?: string
}

export interface NumberToRecipient {
  [number: string]: RecipientWithContact
}

// TODO(Rossy): Add support for sending to addresses: https://github.com/celo-org/celo-monorepo/issues/3883
// export interface AddressOnlyRecipient extends IRecipient {
// }

export function phoneNumberToRecipient(
  e164Number: string,
  address: string | null,
  recipientCache: NumberToRecipient
): Recipient {
  const recipient = recipientCache[e164Number]
  return recipient
    ? {
        kind: RecipientKind.Contact,
        e164PhoneNumber: e164Number,
        displayPhoneNumber: e164Number,
        address: address || undefined,
        phoneNumberLabel: recipient.phoneNumberLabel,
        displayName: recipient.displayName,
        thumbnailPath: recipient.thumbnailPath,
        contactId: recipient.contactId,
      }
    : {
        kind: RecipientKind.MobileNumber,
        e164PhoneNumber: e164Number,
        displayPhoneNumber: e164Number,
        address: address || undefined,
        displayName: e164Number,
      }
}

/**
 * Transforms contacts into a map of e164Number to recipients based on phone numbers from contacts.
 * If a contact has no phone numbers it won't result in any recipients.
 */
export function contactsToRecipients(
  contacts: MinimalContact[],
  defaultCountryCode: string,
  e164NumberToAddress: E164NumberToAddressType
) {
  try {
    //  We need a map of e164Number to recipients so we can efficiently
    //    update them later as the latest contact mappings arrive from the contact calls.
    const e164NumberToRecipients: NumberToRecipient = {}
    // Recipients without e164Numbers go here instead
    const otherRecipients: NumberToRecipient = {}

    for (const contact of contacts) {
      if (!contact.phoneNumbers || !contact.phoneNumbers.length) {
        // Skip contacts without phone numbers
        continue
      }

      for (const phoneNumber of contact.phoneNumbers) {
        const parsedNumber = parsePhoneNumber(phoneNumber.number, defaultCountryCode)

        if (parsedNumber) {
          if (e164NumberToRecipients[parsedNumber.e164Number]) {
            // Skip duplicate phone numbers
            continue
          }
          e164NumberToRecipients[parsedNumber.e164Number] = {
            kind: RecipientKind.Contact,
            displayName: contact.displayName,
            displayPhoneNumber: parsedNumber.displayNumber,
            e164PhoneNumber: parsedNumber.e164Number,
            phoneNumberLabel: phoneNumber.label,
            address: e164NumberToAddress[parsedNumber.e164Number] || undefined,
            contactId: contact.recordID,
            thumbnailPath: contact.thumbnailPath,
          }
        } else {
          otherRecipients[phoneNumber.number] = {
            kind: RecipientKind.Contact,
            displayName: contact.displayName,
            displayPhoneNumber: phoneNumber.number,
            phoneNumberLabel: phoneNumber.label,
            contactId: contact.recordID,
            thumbnailPath: contact.thumbnailPath,
          }
        }
      }
    }

    return { e164NumberToRecipients, otherRecipients }
  } catch (error) {
    Logger.error(TAG, 'Failed to build recipients cache', error)
    return null
  }
}

export function getRecipientFromAddress(
  address: string,
  addressToE164Number: AddressToE164NumberType,
  recipientCache: NumberToRecipient
) {
  const e164PhoneNumber = addressToE164Number[address]
  return e164PhoneNumber ? recipientCache[e164PhoneNumber] : undefined
}

export function getRecipientThumbnail(recipient: Recipient) {
  return recipient.kind === RecipientKind.Contact ? recipient.thumbnailPath : undefined
}

type PreparedRecipient = Recipient & {
  displayPrepared: Fuzzysort.Prepared | undefined
  phonePrepared: Fuzzysort.Prepared | undefined
}

type FuzzyRecipient = Recipient | PreparedRecipient

const SCORE_THRESHOLD = -6000

const fuzzysortOptions = {
  keys: ['displayName', 'e164PhoneNumber'],
  threshold: SCORE_THRESHOLD,
}

const fuzzysortPreparedOptions = {
  keys: ['displayPrepared', 'phonePrepared'],
  threshold: SCORE_THRESHOLD,
}

const fuzzysortToRecipients = (
  fuzzyResults: Fuzzysort.KeysResults<FuzzyRecipient>
): FuzzyRecipient[] => {
  // This is the fastest way to map the 'obj' into a results array
  // https://jsperf.com/set-iterator-vs-foreach/16
  const result = []
  for (let _len = fuzzyResults.length, _key = 0; _key < _len; _key++) {
    result[_key] = fuzzyResults[_key].obj
  }
  return result
}

const nameCompare = (a: FuzzyRecipient, b: FuzzyRecipient) => {
  const nameA = a.displayName.toUpperCase()
  const nameB = b.displayName.toUpperCase()

  let comparison = 0
  if (nameA > nameB) {
    comparison = 1
  } else if (nameA < nameB) {
    comparison = -1
  }
  return comparison
}

const executeFuzzySearch = (
  recipients: FuzzyRecipient[],
  query: string,
  options: Fuzzysort.KeysOptions<FuzzyRecipient>,
  shouldSort?: boolean
): FuzzyRecipient[] => {
  const parsedQuery = query.replace(/[()-\s/\\]/g, '')
  if (parsedQuery === '' || parsedQuery.length < 2) {
    // fuzzysort does not handle empty string query
    if (shouldSort) {
      return recipients.sort(nameCompare)
    } else {
      return recipients
    }
  }

  return fuzzysortToRecipients(fuzzysort.go(parsedQuery, recipients, options))
}

export const filterRecipients = (recipients: Recipient[], query: string, shouldSort?: boolean) => {
  return executeFuzzySearch(recipients, query, fuzzysortOptions, shouldSort)
}

export const filterRecipientFactory = (recipients: Recipient[], shouldSort?: boolean) => {
  const preparedRecipients = recipients.map((r) => ({
    ...r,
    displayPrepared: fuzzysort.prepare(r.displayName),
    phonePrepared: r.e164PhoneNumber ? fuzzysort.prepare(r.e164PhoneNumber) : undefined,
  }))

  return (query: string) => {
    return executeFuzzySearch(preparedRecipients, query, fuzzysortPreparedOptions, shouldSort)
  }
}

export const buildRecentRecipients = (
  allRecipients: RecipientWithContact[],
  recentPhoneNumbers: string[],
  defaultDisplayName: string
): Recipient[] =>
  recentPhoneNumbers
    .map((recentNumber) => {
      const recipientsWithContacts: Recipient[] = allRecipients.filter(
        (recipient) => recipient.e164PhoneNumber === recentNumber
      )
      if (recipientsWithContacts.length > 0) {
        return recipientsWithContacts
      }
      const recipientWithNumber: Recipient = {
        kind: RecipientKind.MobileNumber,
        displayName: defaultDisplayName,
        displayPhoneNumber: recentNumber,
        e164PhoneNumber: recentNumber,
      }
      return [recipientWithNumber]
    })
    .reduce((a, b) => a.concat(b), []) // poor mans flatMap
