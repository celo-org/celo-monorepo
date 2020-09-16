import { OdisUtils } from '@celo/contractkit'
import { PhoneNumberHashDetails } from '@celo/contractkit/lib/identity/odis/phone-number-identifier'
import { AuthSigner, ServiceContext } from '@celo/contractkit/lib/identity/odis/query'
import { getPhoneHash, isE164Number, PhoneNumberUtils } from '@celo/utils/src/phoneNumbers'
import DeviceInfo from 'react-native-device-info'
import { call, put, select } from 'redux-saga/effects'
import { e164NumberSelector } from 'src/account/selectors'
import { IdentityEvents } from 'src/analytics/Events'
import ValoraAnalytics from 'src/analytics/ValoraAnalytics'
import { ErrorMessages } from 'src/app/ErrorMessages'
import networkConfig from 'src/geth/networkConfig'
import { updateE164PhoneNumberSalts } from 'src/identity/actions'
import { ReactBlsBlindingClient } from 'src/identity/bls-blinding-client'
import {
  e164NumberToSaltSelector,
  E164NumberToSaltType,
  isBalanceSufficientForSigRetrievalSelector,
} from 'src/identity/reducer'
import { isUserBalanceSufficient } from 'src/identity/utils'
import { navigate, navigateBack } from 'src/navigator/NavigationService'
import { Screens } from 'src/navigator/Screens'
import { transferStableToken } from 'src/stableToken/actions'
import { stableTokenBalanceSelector } from 'src/stableToken/reducer'
import { waitForTransactionWithId } from 'src/transactions/saga'
import { newTransactionContext } from 'src/transactions/types'
import Logger from 'src/utils/Logger'
import { getAuthSignerForAccount } from 'src/web3/dataEncryptionKey'
import { getConnectedAccount, unlockAccount } from 'src/web3/saga'
import { currentAccountSelector } from 'src/web3/selectors'

const TAG = 'identity/privateHashing'
export const LOOKUP_GAS_FEE_ESTIMATE = 0.03

// Fetch and cache a phone number's salt and hash
export function* fetchPhoneHashPrivate(e164Number: string) {
  try {
    const details: PhoneNumberHashDetails = yield call(doFetchPhoneHashPrivate, e164Number)
    return details
  } catch (error) {
    if (error.message === ErrorMessages.ODIS_INSUFFICIENT_BALANCE) {
      Logger.error(`${TAG}@fetchPhoneHashPrivate`, 'ODIS insufficient balance', error)
      throw error
    } else if (error.message === ErrorMessages.SALT_QUOTA_EXCEEDED) {
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

/**
 * Retrieve the salt from the cache if present,
 * otherwise query from the service
 */
function* doFetchPhoneHashPrivate(e164Number: string) {
  const account: string = yield call(getConnectedAccount)
  Logger.debug(`${TAG}@fetchPrivatePhoneHash`, 'Fetching phone hash details')
  const saltCache: E164NumberToSaltType = yield select(e164NumberToSaltSelector)
  const cachedSalt = saltCache[e164Number]

  if (cachedSalt) {
    Logger.debug(`${TAG}@fetchPrivatePhoneHash`, 'Salt was cached')
    const phoneHash = getPhoneHash(e164Number, cachedSalt)
    const cachedDetails: PhoneNumberHashDetails = { e164Number, phoneHash, pepper: cachedSalt }
    return cachedDetails
  }

  Logger.debug(`${TAG}@fetchPrivatePhoneHash`, 'Salt was not cached, fetching')
  const isBalanceSufficientForQuota = yield select(isBalanceSufficientForSigRetrievalSelector)
  if (!isBalanceSufficientForQuota) {
    throw new Error(ErrorMessages.ODIS_INSUFFICIENT_BALANCE)
  }
  const selfPhoneDetails: PhoneNumberHashDetails | undefined = yield call(
    getUserSelfPhoneHashDetails
  )
  const selfPhoneHash = selfPhoneDetails?.phoneHash
  const details: PhoneNumberHashDetails = yield call(
    getPhoneHashPrivate,
    e164Number,
    account,
    selfPhoneHash
  )
  yield put(updateE164PhoneNumberSalts({ [e164Number]: details.pepper }))
  return details
}

// Unlike the getPhoneHash in utils, this leverages the phone number
// privacy service to compute a secure, unique salt for the phone number
// and then appends it before hashing.
function* getPhoneHashPrivate(e164Number: string, account: string, selfPhoneHash?: string) {
  if (!isE164Number(e164Number)) {
    throw new Error(ErrorMessages.INVALID_PHONE_NUMBER)
  }

  const authSigner: AuthSigner = yield call(getAuthSignerForAccount, account)
  // Unlock the account if the authentication is signed by the wallet
  if (authSigner.authenticationMethod === OdisUtils.Query.AuthenticationMethod.WALLET_KEY) {
    const success: boolean = yield call(unlockAccount, account)
    if (!success) {
      throw new Error(ErrorMessages.INCORRECT_PIN)
    }
  }

  const { odisPubKey, odisUrl } = networkConfig
  const serviceContext: ServiceContext = {
    odisUrl,
    odisPubKey,
  }
  const blsBlindingClient = new ReactBlsBlindingClient(odisPubKey)
  try {
    return yield call(
      OdisUtils.PhoneNumberIdentifier.getPhoneNumberIdentifier,
      e164Number,
      account,
      authSigner,
      serviceContext,
      selfPhoneHash,
      DeviceInfo.getVersion(),
      blsBlindingClient
    )
  } catch (error) {
    if (error.message === ErrorMessages.ODIS_QUOTA_ERROR) {
      throw new Error(ErrorMessages.SALT_QUOTA_EXCEEDED)
    }
    throw error
  }
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
    pepper: salt,
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
    const userBalance = yield select(stableTokenBalanceSelector)
    const userBalanceSufficient = isUserBalanceSufficient(userBalance, LOOKUP_GAS_FEE_ESTIMATE)
    if (!userBalanceSufficient) {
      throw Error(ErrorMessages.INSUFFICIENT_BALANCE)
    }

    const context = newTransactionContext(TAG, 'Purchase lookup quota')
    yield put(
      transferStableToken({
        recipientAddress: ownAddress, // send payment to yourself
        amount: '0.01', // one penny
        comment: 'Lookup Quota Purchase',
        context,
      })
    )

    const quotaPurchaseTxSuccess = yield call(waitForTransactionWithId, context.id)
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
