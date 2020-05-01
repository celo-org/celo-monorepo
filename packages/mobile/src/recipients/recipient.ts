import { parsePhoneNumber } from '@celo/utils/src/phoneNumbers'
import * as fuzzysort from 'fuzzysort'
import { MinimalContact } from 'react-native-contacts'
import {
  getAddressFromPhoneNumber,
  getVerificationStatusFromPhoneNumber,
  RecipientVerificationStatus,
} from 'src/identity/contactMapping'
import { AddressToE164NumberType, E164NumberToAddressType } from 'src/identity/reducer'
import Logger from 'src/utils/Logger'

const TAG = 'recipients/recipient'

export enum RecipientKind {
  MobileNumber = 'MobileNumber',
  Contact = 'Contact',
  QrCode = 'QrCode',
  Address = 'Address',
}

export type Recipient =
  | RecipientWithMobileNumber
  | RecipientWithContact
  | RecipientWithQrCode
  | RecipientWithAddress

interface IRecipient {
  kind: RecipientKind
  displayName: string
  displayId?: string
  e164PhoneNumber?: string
  address?: string
}

export interface RecipientWithMobileNumber extends IRecipient {
  kind: RecipientKind.MobileNumber
  e164PhoneNumber: string // MobileNumber recipients always have a parsable number
}

export interface RecipientWithContact extends IRecipient {
  kind: RecipientKind.Contact
  contactId: string
  phoneNumberLabel?: string
  thumbnailPath?: string
}

export interface RecipientWithQrCode extends IRecipient {
  kind: RecipientKind.QrCode
  address: string
  phoneNumberLabel?: string
  contactId?: string
  thumbnailPath?: string
}

export interface RecipientWithAddress extends IRecipient {
  kind: RecipientKind.Address
  address: string
}

export interface NumberToRecipient {
  [number: string]: RecipientWithContact
}

/**
 * Transforms contacts into a map of e164Number to recipients based on phone numbers from contacts.
 * If a contact has no phone numbers it won't result in any recipients.
 */
export function contactsToRecipients(contacts: MinimalContact[], defaultCountryCode: string) {
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
            displayId: parsedNumber.displayNumber,
            e164PhoneNumber: parsedNumber.e164Number,
            phoneNumberLabel: phoneNumber.label,
            contactId: contact.recordID,
            thumbnailPath: contact.thumbnailPath,
          }
        } else {
          otherRecipients[phoneNumber.number] = {
            kind: RecipientKind.Contact,
            displayName: contact.displayName,
            displayId: phoneNumber.number,
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
    throw error
  }
}

export function getAddressFromRecipient(
  recipient: Recipient,
  e164NumberToAddress: E164NumberToAddressType
): string | null | undefined {
  if (recipient.kind === RecipientKind.QrCode || recipient.kind === RecipientKind.Address) {
    return recipient.address
  }

  if (!recipient.e164PhoneNumber) {
    throw new Error('Missing recipient e164Number')
  }

  return getAddressFromPhoneNumber(recipient.e164PhoneNumber, e164NumberToAddress)
}

export function getRecipientFromAddress(
  address: string,
  addressToE164Number: AddressToE164NumberType,
  recipientCache: NumberToRecipient
) {
  const e164PhoneNumber = addressToE164Number[address]
  return e164PhoneNumber ? recipientCache[e164PhoneNumber] : undefined
}

export function getRecipientVerificationStatus(
  recipient: Recipient,
  e164NumberToAddress: E164NumberToAddressType
): RecipientVerificationStatus {
  if (recipient.kind === RecipientKind.QrCode || recipient.kind === RecipientKind.Address) {
    return RecipientVerificationStatus.VERIFIED
  }

  if (!recipient.e164PhoneNumber) {
    throw new Error('No recipient e164Number found')
  }

  return getVerificationStatusFromPhoneNumber(recipient.e164PhoneNumber, e164NumberToAddress)
}

export function getRecipientThumbnail(recipient?: Recipient) {
  return recipient && recipient.kind === RecipientKind.Contact ? recipient.thumbnailPath : undefined
}

type PreparedRecipient = Recipient & {
  displayPrepared: Fuzzysort.Prepared | undefined
  phonePrepared: Fuzzysort.Prepared | undefined
}

type FuzzyRecipient = Recipient | PreparedRecipient

const SCORE_THRESHOLD = -6000

const fuzzysortOptions = {
  keys: ['displayName', 'e164PhoneNumber', 'address'],
  threshold: SCORE_THRESHOLD,
}

const fuzzysortPreparedOptions = {
  keys: ['displayPrepared', 'phonePrepared', 'addressPrepared'],
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
    addressPrepared: r.address ? fuzzysort.prepare(r.address) : undefined,
  }))

  return (query: string) => {
    return executeFuzzySearch(preparedRecipients, query, fuzzysortPreparedOptions, shouldSort)
  }
}

// Returns true if two recipients are equivalent
// This isn't trivial because two recipients of diff types (Qr code vs contact)
// could potentially refer to the same recipient
export function areRecipientsEquivalent(recipient1: Recipient, recipient2: Recipient) {
  if (recipient1 === recipient2) {
    return true
  }

  if (
    recipient1.e164PhoneNumber &&
    recipient2.e164PhoneNumber &&
    recipient1.e164PhoneNumber === recipient2.e164PhoneNumber
  ) {
    return true
  }

  if (recipient1.address && recipient2.address && recipient1.address === recipient2.address) {
    return true
  }

  // Todo(Rossy) there's still the case where one recip's e164Number gets resolved to another's address
  // but to detect that we'll need to wire in the mappings and check there too

  return false
}
