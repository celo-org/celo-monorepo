import { ContractKit } from '@celo/contractkit'
import { getPhoneHash, isE164Number, PhoneNumberUtils } from '@celo/utils/src/phoneNumbers'
import crypto from 'crypto'
import BlindThresholdBls from 'react-native-blind-threshold-bls'
import { call, put, select } from 'redux-saga/effects'
import { ErrorMessages } from 'src/app/ErrorMessages'
import { PHONE_NUM_PRIVACY_PUBLIC_KEY, PHONE_NUM_PRIVACY_SERVICE } from 'src/config'
import { updateE164PhoneNumberSalts } from 'src/identity/actions'
import { e164NumberToSaltSelector, E164NumberToSaltType } from 'src/identity/reducer'
import Logger from 'src/utils/Logger'
import { getContractKit } from 'src/web3/contracts'
import { currentAccountSelector } from 'src/web3/selectors'

const TAG = 'identity/privacy'
const SIGN_MESSAGE_ENDPOINT = '/getBlindedSalt'

export interface PhoneNumberHashDetails {
  e164Number: string
  phoneHash: string
  salt: string
}

// Fetch and cache a phone number's salt and hash
export function* fetchPhoneHashPrivate(e164Number: string) {
  try {
    Logger.debug(`${TAG}@fetchPrivatePhoneHash`, 'Fetching phone hash details')
    const saltCache: E164NumberToSaltType = yield select(e164NumberToSaltSelector)
    const cachedSalt = saltCache[e164Number]

    if (cachedSalt) {
      Logger.debug(`${TAG}@fetchPrivatePhoneHash`, 'Salt was cached')
      const phoneHash = getPhoneHash(e164Number, cachedSalt)
      return { e164Number, phoneHash, salt: cachedSalt }
    }

    Logger.debug(`${TAG}@fetchPrivatePhoneHash`, 'Salt was not cached, fetching')
    const account: string = yield select(currentAccountSelector)
    const contractKit = yield call(getContractKit)
    const details: PhoneNumberHashDetails = yield call(
      getPhoneHashPrivate,
      e164Number,
      account,
      contractKit
    )
    yield put(updateE164PhoneNumberSalts({ [e164Number]: details.salt }))
    return details
  } catch (error) {
    if (error.message === ErrorMessages.SALT_QUOTA_EXCEEDED) {
      Logger.error(
        `${TAG}@fetchPrivatePhoneHash`,
        'Salt quota exceeded, navigating to quota purchase screen'
      )
      // TODO nav to quota purchase screen
    } else {
      Logger.error(`${TAG}@fetchPrivatePhoneHash`, 'Unknown error', error)
      throw new Error(ErrorMessages.SALT_FETCH_FAILURE)
    }
  }
}

// Unlike the getPhoneHash in utils, this leverage the phone number
// privacy service to compute a secure, unique salt for the phone number
// and then appends it before hashing.
async function getPhoneHashPrivate(
  e164Number: string,
  account: string,
  contractKit: ContractKit
): Promise<PhoneNumberHashDetails> {
  const salt = await getPhoneNumberSalt(e164Number, account, contractKit)
  const phoneHash = getPhoneHash(e164Number, salt)
  return {
    e164Number,
    phoneHash,
    salt,
  }
}

async function getPhoneNumberSalt(e164Number: string, account: string, contractKit: ContractKit) {
  Logger.debug(`${TAG}@getPhoneNumberSalt`, 'Getting phone number salt')

  if (!isE164Number(e164Number)) {
    throw new Error(ErrorMessages.INVALID_PHONE_NUMBER)
  }

  Logger.debug(`${TAG}@getPhoneNumberSalt`, 'Retrieving blinded message')
  const base64BlindedMessage = await BlindThresholdBls.blindMessage(e164Number)
  const hashedPhoneNumber = PhoneNumberUtils.getPhoneHash(e164Number)
  const base64BlindSig = await postToSignMessage(
    base64BlindedMessage,
    account,
    hashedPhoneNumber,
    contractKit
  )
  Logger.debug(`${TAG}@getPhoneNumberSalt`, 'Retrieving unblinded signature')
  const base64UnblindedSig = await BlindThresholdBls.unblindMessage(
    base64BlindSig,
    PHONE_NUM_PRIVACY_PUBLIC_KEY
  )
  Logger.debug(`${TAG}@getPhoneNumberSalt`, 'Converting sig to salt')
  return getSaltFromThresholdSignature(base64UnblindedSig)
}

interface SignMessageResponse {
  success: boolean
  signature: string
}

// Send the blinded message off to the phone number privacy service and
// get back the theshold signed blinded message
async function postToSignMessage(
  base64BlindedMessage: string,
  account: string,
  hashedPhoneNumber: string,
  contractKit: ContractKit
) {
  Logger.debug(`${TAG}@postToSignMessage`, `Posting to ${SIGN_MESSAGE_ENDPOINT}`)
  const body = JSON.stringify({
    blindedQueryPhoneNumber: base64BlindedMessage.trim(),
    account,
  })

  // Sign payload using account privkey
  const authHeader = await contractKit.web3.eth.sign(body, account)

  const res = await fetch(PHONE_NUM_PRIVACY_SERVICE + SIGN_MESSAGE_ENDPOINT, {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      Authorization: authHeader,
    },
    body,
  })

  if (!res.ok) {
    handleSignMessageFailure(res)
  }

  Logger.debug(`${TAG}@postToSignMessage`, 'Response ok. Parsing.')
  const signResponse = (await res.json()) as SignMessageResponse
  return signResponse.signature
}

function handleSignMessageFailure(res: Response) {
  Logger.error(`${TAG}@handleSignMessageFailure`, `Response not okay. Status ${res.status}`)
  switch (res.status) {
    case 403:
      throw new Error(ErrorMessages.SALT_QUOTA_EXCEEDED)
    default:
      throw new Error('Failure getting blinded sig')
  }
}

// This is the algorithm that creates a salt from the unblinded message signatures
// It simply hashes it with sha256 and encodes it to hex
// If we ever need to compute salts anywhere other than here then we should move this to the utils package
export function getSaltFromThresholdSignature(base64Sig: string) {
  if (!base64Sig) {
    throw new Error('Invalid base64Sig')
  }

  const sigBuf = Buffer.from(base64Sig, 'base64')
  return crypto
    .createHash('sha256')
    .update(sigBuf)
    .digest('hex')
}
