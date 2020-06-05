import { ContractKit } from '@celo/contractkit'
import crypto from 'crypto'
import { call, put, select } from 'redux-saga/effects'
import { e164NumberSelector } from 'src/account/selectors'
import { addContactsMatches } from 'src/identity/actions'
import { postToPGPNP } from 'src/identity/pgpnp'
import { NumberToRecipient } from 'src/recipients/recipient'
import Logger from 'src/utils/Logger'
import { getContractKit } from 'src/web3/contracts'
import { getConnectedUnlockedAccount } from 'src/web3/saga'
import { currentAccountSelector } from 'src/web3/selectors'

const TAG = 'identity/matchmaking'
const MATCHMAKING_ENDPOINT = '/getContactMatches'
// Eventually, the matchmaking process will use blinded numbers same as salt lookups
// But for now numbers are simply hashed using this static salt
const SALT = '__celo__'

export interface ContactMatch {
  e164Number: string
  contactId: string
}

// Uses the PGPNP service to find mutual matches between Celo users
export function* fetchContactMatches(e164NumberToRecipients: NumberToRecipient) {
  yield call(getConnectedUnlockedAccount)
  Logger.debug(TAG, 'Starting contact matchmaking')
  const e164Number: string = yield select(e164NumberSelector)
  const account: string = yield select(currentAccountSelector)
  const contractKit: ContractKit = yield call(getContractKit)

  const selfHash = hashNumber(e164Number)
  const hashToE164Number = getContactNumberHashes(e164NumberToRecipients)

  const matchHashes: string[] = yield call(
    postToMatchmaking,
    account,
    contractKit,
    selfHash,
    Object.keys(hashToE164Number)
  )

  if (!matchHashes || !matchHashes.length) {
    Logger.debug(TAG, 'No matches found')
    return
  }

  const matches = getMatchedContacts(e164NumberToRecipients, hashToE164Number, matchHashes)
  yield put(addContactsMatches(matches))
}

function getContactNumberHashes(e164NumberToRecipients: NumberToRecipient) {
  const hashes: Record<string, string> = {}
  for (const e164Number of Object.keys(e164NumberToRecipients)) {
    // TODO For large contact lists, would be faster to these hashes
    // in a native module.
    const hash = hashNumber(e164Number)
    hashes[hash] = e164Number
  }
  return hashes
}

function hashNumber(e164Number: string) {
  return crypto
    .createHash('sha256')
    .update(e164Number + SALT)
    .digest('base64')
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
  selfPhoneHash: string,
  contactHashes: string[]
) {
  const body = JSON.stringify({
    account,
    userPhoneNumber: selfPhoneHash,
    contactPhoneNumbers: contactHashes,
  })

  const response = await postToPGPNP<MatchmakingResponse>(
    account,
    contractKit,
    body,
    MATCHMAKING_ENDPOINT
  )
  return Object.values(response.matchedContacts)
}

function getMatchedContacts(
  e164NumberToRecipients: NumberToRecipient,
  hashToE164Number: Record<string, string>,
  matchHashes: string[]
) {
  const matches: ContactMatch[] = []
  for (const match of matchHashes) {
    const e164Number = hashToE164Number[match]
    if (!e164Number) {
      throw new Error('Number missing in hash map, should never happen')
    }

    const recipient = e164NumberToRecipients[e164Number]
    if (!recipient) {
      throw new Error('Recipient missing in recipient map, should never happen')
    }

    matches.push({ e164Number, contactId: recipient.contactId })
  }
  return matches
}
