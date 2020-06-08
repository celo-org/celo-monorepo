import { ContractKit } from '@celo/contractkit'
import crypto from 'crypto'
import { call, put } from 'redux-saga/effects'
import { addContactsMatches } from 'src/identity/actions'
import { postToPhoneNumPrivacyService } from 'src/identity/phoneNumPrivacyService'
import { getUserSelfPhoneHashDetails, PhoneNumberHashDetails } from 'src/identity/privateHashing'
import { ContactMatches } from 'src/identity/types'
import { NumberToRecipient } from 'src/recipients/recipient'
import Logger from 'src/utils/Logger'
import { getContractKit } from 'src/web3/contracts'
import { getConnectedUnlockedAccount } from 'src/web3/saga'

const TAG = 'identity/matchmaking'
const MATCHMAKING_ENDPOINT = '/getContactMatches'
// Eventually, the matchmaking process will use blinded numbers same as salt lookups
// But for now numbers are simply hashed using this static salt
const SALT = '__celo__'

// Uses the phone number privacy service to find mutual matches between Celo users
export function* fetchContactMatches(e164NumberToRecipients: NumberToRecipient) {
  const account: string = yield call(getConnectedUnlockedAccount)
  Logger.debug(TAG, 'Starting contact matchmaking')
  const contractKit: ContractKit = yield call(getContractKit)
  const selfPhoneDetails: PhoneNumberHashDetails | undefined = yield call(
    getUserSelfPhoneHashDetails
  )

  if (!selfPhoneDetails) {
    Logger.warn(TAG, 'User must be verified with cached phone hash details')
    return
  }

  const selfPhoneNumObfuscated = obfuscateNumberForMatchmaking(selfPhoneDetails.e164Number)
  const obfucsatedNumToE164Number = getContactNumsObfuscated(e164NumberToRecipients)

  const matchHashes: string[] = yield call(
    postToMatchmaking,
    account,
    contractKit,
    selfPhoneNumObfuscated,
    selfPhoneDetails.phoneHash,
    Object.keys(obfucsatedNumToE164Number)
  )

  if (!matchHashes || !matchHashes.length) {
    Logger.debug(TAG, 'No matches found')
    return
  }

  const matches = getMatchedContacts(e164NumberToRecipients, obfucsatedNumToE164Number, matchHashes)
  yield put(addContactsMatches(matches))
}

function getContactNumsObfuscated(e164NumberToRecipients: NumberToRecipient) {
  const hashes: Record<string, string> = {}
  for (const e164Number of Object.keys(e164NumberToRecipients)) {
    // TODO For large contact lists, would be faster to these hashes
    // in a native module.
    const hash = obfuscateNumberForMatchmaking(e164Number)
    hashes[hash] = e164Number
  }
  return hashes
}

// Hashes the phone number using a static salt
// This is different than the phone + unique salt hashing that
// we use for numbers getting verified and going on chain
// Matchmaking doesn't support per-number salts yet
export function obfuscateNumberForMatchmaking(e164Number: string) {
  return crypto
    .createHash('sha256')
    .update(e164Number + SALT)
    .digest('base64')
}

interface MatchmakingRequest {
  account: string
  userPhoneNumber: string
  contactPhoneNumbers: string[]
  hashedPhoneNumber: string
}

interface MatchmakingResponse {
  success: boolean
  matchedContacts: Array<{
    phoneNumber: string
  }>
}

async function postToMatchmaking(
  account: string,
  contractKit: ContractKit,
  selfPhoneNumObfuscated: string,
  selfPhoneHash: string,
  contactNumsObfuscated: string[]
) {
  const body: MatchmakingRequest = {
    account,
    userPhoneNumber: selfPhoneNumObfuscated,
    contactPhoneNumbers: contactNumsObfuscated,
    hashedPhoneNumber: selfPhoneHash,
  }

  const response = await postToPhoneNumPrivacyService<MatchmakingResponse>(
    account,
    contractKit,
    body,
    MATCHMAKING_ENDPOINT
  )
  return response.matchedContacts.map((match) => match.phoneNumber)
}

function getMatchedContacts(
  e164NumberToRecipients: NumberToRecipient,
  obfucsatedNumToE164Number: Record<string, string>,
  matchHashes: string[]
) {
  const matches: ContactMatches = {}
  for (const match of matchHashes) {
    const e164Number = obfucsatedNumToE164Number[match]
    if (!e164Number) {
      throw new Error('Number missing in hash map, should never happen')
    }

    const recipient = e164NumberToRecipients[e164Number]
    if (!recipient) {
      throw new Error('Recipient missing in recipient map, should never happen')
    }

    matches[e164Number] = { contactId: recipient.contactId }
  }
  return matches
}
