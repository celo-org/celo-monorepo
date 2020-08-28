import BigNumber from 'bignumber.js'
import { call, put, select, take } from 'redux-saga/effects'
import { showError } from 'src/alert/actions'
import { TokenTransactionType } from 'src/apollo/types'
import { ErrorMessages } from 'src/app/ErrorMessages'
import { ALERT_BANNER_DURATION, DAILY_PAYMENT_LIMIT_CUSD } from 'src/config'
import { FeeType } from 'src/fees/actions'
import { getAddressFromPhoneNumber } from 'src/identity/contactMapping'
import { E164NumberToAddressType, SecureSendPhoneNumberMapping } from 'src/identity/reducer'
import { RecipientVerificationStatus } from 'src/identity/types'
import {
  Actions,
  FetchCurrentRateFailureAction,
  FetchCurrentRateSuccessAction,
  selectPreferredCurrency,
} from 'src/localCurrency/actions'
import { LocalCurrencyCode, LocalCurrencySymbol } from 'src/localCurrency/consts'
import { convertDollarsToLocalAmount, convertLocalAmountToDollars } from 'src/localCurrency/convert'
import { getLocalCurrencyExchangeRate } from 'src/localCurrency/selectors'
import { navigate } from 'src/navigator/NavigationService'
import { Screens } from 'src/navigator/Screens'
import { UriData, uriDataFromUrl } from 'src/qrcode/schema'
import {
  Recipient,
  RecipientKind,
  RecipientWithContact,
  RecipientWithQrCode,
} from 'src/recipients/recipient'
import { storeLatestInRecents } from 'src/send/actions'
import { PaymentInfo } from 'src/send/reducers'
import { TransactionDataInput } from 'src/send/SendAmount'
import Logger from 'src/utils/Logger'
import { timeDeltaInHours } from 'src/utils/time'

const TAG = 'send/utils'

export interface ConfirmationInput {
  recipient: Recipient
  amount: BigNumber
  reason?: string
  recipientAddress: string | null | undefined
  type: TokenTransactionType
  firebasePendingRequestUid?: string | null
}

export const getConfirmationInput = (
  transactionData: TransactionDataInput,
  e164NumberToAddress: E164NumberToAddressType,
  secureSendPhoneNumberMapping: SecureSendPhoneNumberMapping
): ConfirmationInput => {
  const { recipient } = transactionData
  let recipientAddress: string | null | undefined

  if (recipient.kind === RecipientKind.QrCode || recipient.kind === RecipientKind.Address) {
    recipientAddress = recipient.address
  } else if (recipient.e164PhoneNumber) {
    recipientAddress = getAddressFromPhoneNumber(
      recipient.e164PhoneNumber,
      e164NumberToAddress,
      secureSendPhoneNumberMapping,
      recipient.address
    )
  }

  return { ...transactionData, recipientAddress }
}

export const getFeeType = (
  recipientVerificationStatus: RecipientVerificationStatus
): FeeType | null => {
  switch (recipientVerificationStatus) {
    case RecipientVerificationStatus.UNKNOWN:
      return null
    case RecipientVerificationStatus.UNVERIFIED:
      return FeeType.INVITE
    case RecipientVerificationStatus.VERIFIED:
      return FeeType.SEND
  }
}

// exported for tests
export function dailyAmountRemaining(now: number, recentPayments: PaymentInfo[]) {
  return DAILY_PAYMENT_LIMIT_CUSD - dailySpent(now, recentPayments)
}

function dailySpent(now: number, recentPayments: PaymentInfo[]) {
  // We are only interested in the last 24 hours
  const paymentsLast24Hours = recentPayments.filter(
    (p: PaymentInfo) => timeDeltaInHours(now, p.timestamp) < 24
  )

  const amount: number = paymentsLast24Hours.reduce((sum, p: PaymentInfo) => sum + p.amount, 0)
  return amount
}

export function isPaymentLimitReached(
  now: number,
  recentPayments: PaymentInfo[],
  initial: number
): boolean {
  const amount = dailySpent(now, recentPayments) + initial
  return amount > DAILY_PAYMENT_LIMIT_CUSD
}

export function showLimitReachedError(
  now: number,
  recentPayments: PaymentInfo[],
  localCurrencyExchangeRate: string | null | undefined,
  localCurrencySymbol: LocalCurrencySymbol | null
) {
  const dailyRemainingcUSD = dailyAmountRemaining(now, recentPayments)
  const dailyRemaining = convertDollarsToLocalAmount(dailyRemainingcUSD, localCurrencyExchangeRate)
  const dailyLimit = convertDollarsToLocalAmount(
    DAILY_PAYMENT_LIMIT_CUSD,
    localCurrencyExchangeRate
  )

  const translationParams = {
    currencySymbol: localCurrencySymbol,
    dailyRemaining,
    dailyLimit,
    dailyRemainingcUSD,
    dailyLimitcUSD: DAILY_PAYMENT_LIMIT_CUSD,
  }

  return showError(ErrorMessages.PAYMENT_LIMIT_REACHED, ALERT_BANNER_DURATION, translationParams)
}

export function* handleSendPaymentData(
  data: UriData,
  cachedRecipient?: RecipientWithContact,
  isOutgoingPaymentRequest?: true
) {
  const recipient: RecipientWithQrCode = {
    kind: RecipientKind.QrCode,
    address: data.address,
    displayId: data.e164PhoneNumber,
    displayName: data.displayName || cachedRecipient?.displayName || 'anonymous',
    e164PhoneNumber: data.e164PhoneNumber,
    phoneNumberLabel: cachedRecipient?.phoneNumberLabel,
    thumbnailPath: cachedRecipient?.thumbnailPath,
    contactId: cachedRecipient?.contactId,
  }
  yield put(storeLatestInRecents(recipient))

  if (data.currencyCode) {
    yield put(selectPreferredCurrency(data.currencyCode as LocalCurrencyCode))
    const action: FetchCurrentRateSuccessAction | FetchCurrentRateFailureAction = yield take([
      Actions.FETCH_CURRENT_RATE_SUCCESS,
      Actions.FETCH_CURRENT_RATE_FAILURE,
    ])
    if (action.type === Actions.FETCH_CURRENT_RATE_FAILURE) {
      yield put(showError(ErrorMessages.EXCHANGE_RATE_FAILED))
      Logger.warn(TAG, '@handleSendPaymentData failed to fetch current rate')
      return
    }
  }

  if (data.amount) {
    // TODO: integrate with SendConfirmation component
    const exchangeRate = yield select(getLocalCurrencyExchangeRate)
    const amount = convertLocalAmountToDollars(data.amount, exchangeRate)
    if (!amount) {
      Logger.warn(TAG, '@handleSendPaymentData null amount')
      return
    }
    const transactionData: TransactionDataInput = {
      recipient,
      amount,
      reason: data.comment,
      type: TokenTransactionType.PayPrefill,
    }
    navigate(Screens.SendConfirmation, { transactionData, isFromScan: true })
  } else {
    navigate(Screens.SendAmount, { recipient, isFromScan: true, isOutgoingPaymentRequest })
  }
}

export function* handlePaymentDeeplink(deeplink: string) {
  try {
    const paymentData = uriDataFromUrl(deeplink)
    yield call(handleSendPaymentData, paymentData)
  } catch (e) {
    Logger.warn('handlePaymentDeepLink', `deeplink ${deeplink} failed with ${e}`)
  }
}
