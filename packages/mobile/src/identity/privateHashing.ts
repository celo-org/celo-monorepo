import { ContractKit } from '@celo/contractkit'
import { getPhoneHash, isE164Number, PhoneNumberUtils } from '@celo/utils/src/phoneNumbers'
import crypto from 'crypto'
import BlindThresholdBls from 'react-native-blind-threshold-bls'
import { call, put, select } from 'redux-saga/effects'
import { e164NumberSelector } from 'src/account/selectors'
import { IdentityEvents } from 'src/analytics/Events'
import ValoraAnalytics from 'src/analytics/ValoraAnalytics'
import { ErrorMessages } from 'src/app/ErrorMessages'
import networkConfig from 'src/geth/networkConfig'
import { updateE164PhoneNumberSalts } from 'src/identity/actions'
import { postToPhoneNumPrivacyService } from 'src/identity/phoneNumPrivacyService'
import { e164NumberToSaltSelector, E164NumberToSaltType } from 'src/identity/reducer'
import { isUserBalanceSufficient } from 'src/identity/utils'
import { navigate, navigateBack } from 'src/navigator/NavigationService'
import { Screens } from 'src/navigator/Screens'
import { transferStableToken } from 'src/stableToken/actions'
import { stableTokenBalanceSelector } from 'src/stableToken/reducer'
import { generateStandbyTransactionId } from 'src/transactions/actions'
import { waitForTransactionWithId } from 'src/transactions/saga'
import Logger from 'src/utils/Logger'
import { getContractKit } from 'src/web3/contracts'
import { getConnectedUnlockedAccount } from 'src/web3/saga'
import { currentAccountSelector } from 'src/web3/selectors'

const TAG = 'identity/privateHashing'
const SIGN_MESSAGE_ENDPOINT = '/getDistributedBlindedSalt'
export const SALT_CHAR_LENGTH = 13
export const LOOKUP_GAS_FEE_ESTIMATE = 0.03

export interface PhoneNumberHashDetails {
  e164Number: string
  phoneHash: string
  salt: string
}

// Fetch and cache a phone number's salt and hash
export function* fetchPhoneHashPrivate(e164Number: string) {
  try {
    const details: PhoneNumberHashDetails = yield call(doFetchPhoneHashPrivate, e164Number)
    return details
  } catch (error) {
    if (error.message === ErrorMessages.SALT_QUOTA_EXCEEDED) {
      Logger.error(
        `${TAG}@fetchPhoneHashPrivate`,
        'Salt quota exceeded, navigating to quota purchase screen'
      )
      const quotaPurchaseSuccess: boolean = yield call(navigateToQuotaPurchaseScreen)
      if (quotaPurchaseSuccess) {
        // If quota purchase was successful, try lookup a second time
        const details: PhoneNumberHashDetails = yield call(doFetchPhoneHashPrivate, e164Number)
        return details
      } else {
        throw new Error(ErrorMessages.SALT_QUOTA_EXCEEDED)
      }
    } else {
      Logger.error(`${TAG}@fetchPhoneHashPrivate`, 'Unknown error', error)
      throw new Error(ErrorMessages.SALT_FETCH_FAILURE)
    }
  }
}

function* doFetchPhoneHashPrivate(e164Number: string) {
  const account: string = yield call(getConnectedUnlockedAccount)
  Logger.debug(`${TAG}@fetchPrivatePhoneHash`, 'Fetching phone hash details')
  const saltCache: E164NumberToSaltType = yield select(e164NumberToSaltSelector)
  const cachedSalt = saltCache[e164Number]

  if (cachedSalt) {
    Logger.debug(`${TAG}@fetchPrivatePhoneHash`, 'Salt was cached')
    const phoneHash = getPhoneHash(e164Number, cachedSalt)
    return { e164Number, phoneHash, salt: cachedSalt }
  }

  Logger.debug(`${TAG}@fetchPrivatePhoneHash`, 'Salt was not cached, fetching')
  const contractKit: ContractKit = yield call(getContractKit)
  const selfPhoneDetails: PhoneNumberHashDetails | undefined = yield call(
    getUserSelfPhoneHashDetails
  )
  const selfPhoneHash = selfPhoneDetails?.phoneHash
  const details: PhoneNumberHashDetails = yield call(
    getPhoneHashPrivate,
    e164Number,
    account,
    contractKit,
    selfPhoneHash
  )
  yield put(updateE164PhoneNumberSalts({ [e164Number]: details.salt }))
  return details
}

// Unlike the getPhoneHash in utils, this leverages the phone number
// privacy service to compute a secure, unique salt for the phone number
// and then appends it before hashing.
async function getPhoneHashPrivate(
  e164Number: string,
  account: string,
  contractKit: ContractKit,
  selfPhoneHash?: string
): Promise<PhoneNumberHashDetails> {
  const salt = await getPhoneNumberSalt(e164Number, account, contractKit, selfPhoneHash)
  const phoneHash = getPhoneHash(e164Number, salt)
  return {
    e164Number,
    phoneHash,
    salt,
  }
}

async function getPhoneNumberSalt(
  e164Number: string,
  account: string,
  contractKit: ContractKit,
  selfPhoneHash?: string
) {
  Logger.debug(`${TAG}@getPhoneNumberSalt`, 'Getting phone number salt')

  if (!isE164Number(e164Number)) {
    throw new Error(ErrorMessages.INVALID_PHONE_NUMBER)
  }

  Logger.debug(`${TAG}@getPhoneNumberSalt`, 'Retrieving blinded message')
  const base64PhoneNumber = Buffer.from(e164Number).toString('base64')
  const base64BlindedMessage = (await BlindThresholdBls.blindMessage(base64PhoneNumber)).trim()
  const base64BlindSig = await postToSignMessage(
    base64BlindedMessage,
    account,
    contractKit,
    selfPhoneHash
  )
  Logger.debug(`${TAG}@getPhoneNumberSalt`, 'Retrieving unblinded signature')
  const { pgpnpPubKey } = networkConfig
  const base64UnblindedSig = await BlindThresholdBls.unblindMessage(base64BlindSig, pgpnpPubKey)
  Logger.debug(`${TAG}@getPhoneNumberSalt`, 'Converting sig to salt')
  return getSaltFromThresholdSignature(base64UnblindedSig)
}

interface SignMessageRequest {
  account: string
  blindedQueryPhoneNumber: string
  hashedPhoneNumber?: string
}

interface SignMessageResponse {
  success: boolean
  combinedSignature: string
}

// Send the blinded message off to the phone number privacy service and
// get back the theshold signed blinded message
async function postToSignMessage(
  base64BlindedMessage: string,
  account: string,
  contractKit: ContractKit,
  selfPhoneHash?: string
) {
  const body: SignMessageRequest = {
    account,
    blindedQueryPhoneNumber: base64BlindedMessage,
    hashedPhoneNumber: selfPhoneHash,
  }

  try {
    const response = await postToPhoneNumPrivacyService<SignMessageResponse>(
      account,
      contractKit,
      body,
      SIGN_MESSAGE_ENDPOINT
    )
    return response.combinedSignature
  } catch (error) {
    if (error.message === ErrorMessages.PGPNP_QUOTA_ERROR) {
      throw new Error(ErrorMessages.SALT_QUOTA_EXCEEDED)
    }
    throw error
  }
}

// This is the algorithm that creates a salt from the unblinded message signatures
// It simply hashes it with sha256 and encodes it to hex
// If we ever need to compute salts anywhere other than here then we should move this to the utils package
export function getSaltFromThresholdSignature(base64Sig: string) {
  if (!base64Sig) {
    throw new Error('Invalid base64Sig')
  }

  // Currently uses 13 chars for a 78 bit salt
  const sigBuf = Buffer.from(base64Sig, 'base64')
  return crypto
    .createHash('sha256')
    .update(sigBuf)
    .digest('base64')
    .slice(0, SALT_CHAR_LENGTH)
}

// Get the wallet user's own phone hash details if they're cached
// null otherwise
export function* getUserSelfPhoneHashDetails() {
  const e164Number: string = yield select(e164NumberSelector)
  if (!e164Number) {
    return undefined
  }

  const saltCache: E164NumberToSaltType = yield select(e164NumberToSaltSelector)
  const salt = saltCache[e164Number]

  if (!salt) {
    return undefined
  }

  const details: PhoneNumberHashDetails = {
    e164Number,
    salt,
    phoneHash: PhoneNumberUtils.getPhoneHash(e164Number, salt),
  }

  return details
}

function* navigateToQuotaPurchaseScreen() {
  try {
    yield new Promise((resolve, reject) => {
      navigate(Screens.PhoneNumberLookupQuota, {
        onBuy: resolve,
        onSkip: () => reject('skipped'),
      })
    })

    const ownAddress: string = yield select(currentAccountSelector)
    const txId = generateStandbyTransactionId(ownAddress)

    const userBalance = yield select(stableTokenBalanceSelector)
    const userBalanceSufficient = isUserBalanceSufficient(userBalance, LOOKUP_GAS_FEE_ESTIMATE)
    if (!userBalanceSufficient) {
      throw Error(ErrorMessages.INSUFFICIENT_BALANCE)
    }

    yield put(
      transferStableToken({
        recipientAddress: ownAddress, // send payment to yourself
        amount: '0.01', // one penny
        comment: 'Lookup Quota Purchase',
        txId,
      })
    )

    const quotaPurchaseTxSuccess = yield call(waitForTransactionWithId, txId)
    if (!quotaPurchaseTxSuccess) {
      throw new Error('Purchase tx failed')
    }

    ValoraAnalytics.track(IdentityEvents.phone_number_lookup_purchase_complete)
    Logger.debug(`${TAG}@navigateToQuotaPurchaseScreen`, `Quota purchase successful`)
    navigateBack()
    return true
  } catch (error) {
    if (error === 'skipped') {
      ValoraAnalytics.track(IdentityEvents.phone_number_lookup_purchase_skip)
    } else {
      ValoraAnalytics.track(IdentityEvents.phone_number_lookup_purchase_error, {
        error: error.message,
      })
    }
    Logger.error(
      `${TAG}@navigateToQuotaPurchaseScreen`,
      `Quota purchase cancelled or skipped`,
      error
    )
    navigateBack()
    return false
  }
}
