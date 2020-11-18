import { E164Number } from '@celo/utils/lib/io'
import crypto from 'crypto'
import debugFactory from 'debug'
import {
  AuthSigner,
  MatchmakingRequest,
  MatchmakingResponse,
  queryOdis,
  ServiceContext,
} from './query'

const debug = debugFactory('kit:odis:matchmaking')

const MATCHMAKING_ENDPOINT = '/getContactMatches'
// Eventually, the matchmaking process will use blinded numbers same as salt lookups
// But for now numbers are simply hashed using this static salt
const SALT = '__celo__'

// Uses the phone number privacy service to find mutual matches between Celo users
export async function getContactMatches(
  e164NumberCaller: E164Number,
  e164NumberContacts: E164Number[],
  account: string,
  phoneNumberIdentifier: string,
  signer: AuthSigner,
  context: ServiceContext,
  clientVersion?: string
): Promise<E164Number[]> {
  const selfPhoneNumObfuscated = obfuscateNumberForMatchmaking(e164NumberCaller)
  const obfucsatedNumToE164Number = getContactNumsObfuscated(e164NumberContacts)

  const body: MatchmakingRequest = {
    account,
    userPhoneNumber: selfPhoneNumObfuscated,
    contactPhoneNumbers: Object.keys(obfucsatedNumToE164Number),
    hashedPhoneNumber: phoneNumberIdentifier,
    version: clientVersion ? clientVersion : 'unknown',
    authenticationMethod: signer.authenticationMethod,
  }

  const response = await queryOdis<MatchmakingResponse>(signer, body, context, MATCHMAKING_ENDPOINT)

  const matchHashes: string[] = response.matchedContacts.map((match) => match.phoneNumber)

  if (!matchHashes || !matchHashes.length) {
    debug('No matches found')
    return []
  }

  return getMatchedContacts(obfucsatedNumToE164Number, matchHashes)
}

function getContactNumsObfuscated(e164NumberMatches: E164Number[]) {
  const hashes: Record<string, string> = {}
  for (const e164Number of e164NumberMatches) {
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

/**
 * Constructs a mapping between contact's phone numbers and
 * their on-chain identifier
 * @param obfucsatedNumToE164Number map of obfuscated number to original number
 * @param matchHashes list of obfuscated numbers that are matched
 */
function getMatchedContacts(
  obfucsatedNumToE164Number: Record<string, string>,
  matchHashes: string[]
): E164Number[] {
  const matches: E164Number[] = []
  for (const match of matchHashes) {
    const e164Number = obfucsatedNumToE164Number[match]
    if (!e164Number) {
      throw new Error('Number missing in hash map, should never happen')
    }
    matches.push(e164Number)
  }
  return matches
}
