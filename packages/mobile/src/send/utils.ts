import BigNumber from 'bignumber.js'
import { useMemo } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { call, put, select } from 'redux-saga/effects'
import { showError } from 'src/alert/actions'
import { TokenTransactionType } from 'src/apollo/types'
import { ErrorMessages } from 'src/app/ErrorMessages'
import { ALERT_BANNER_DURATION, DAILY_PAYMENT_LIMIT_CUSD } from 'src/config'
import { exchangeRatePairSelector } from 'src/exchange/reducer'
import { FeeType } from 'src/fees/actions'
import { CURRENCY_ENUM } from 'src/geth/consts'
import { getAddressFromPhoneNumber } from 'src/identity/contactMapping'
import { E164NumberToAddressType, SecureSendPhoneNumberMapping } from 'src/identity/reducer'
import { RecipientVerificationStatus } from 'src/identity/types'
import { LocalCurrencyCode, LocalCurrencySymbol } from 'src/localCurrency/consts'
import { convertDollarsToLocalAmount, convertLocalAmountToDollars } from 'src/localCurrency/convert'
import { fetchExchangeRate } from 'src/localCurrency/saga'
import {
  getLocalCurrencyCode,
  getLocalCurrencyExchangeRate,
  getLocalCurrencySymbol,
} from 'src/localCurrency/selectors'
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
import { getRecentPayments } from 'src/send/selectors'
import { TransactionDataInput } from 'src/send/SendAmount'
import { getRateForMakerToken, goldToDollarAmount } from 'src/utils/currencyExchange'
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

export function useDailyTransferLimitValidator(
  amount: BigNumber,
  currency: CURRENCY_ENUM
): [boolean, () => void] {
  const dispatch = useDispatch()

  const exchangeRatePair = useSelector(exchangeRatePairSelector)

  const dollarAmount = useMemo(() => {
    if (currency === CURRENCY_ENUM.DOLLAR) {
      return amount
    } else {
      const exchangeRate = getRateForMakerToken(
        exchangeRatePair,
        CURRENCY_ENUM.DOLLAR,
        CURRENCY_ENUM.GOLD
      )
      return goldToDollarAmount(amount, exchangeRate) || new BigNumber(0)
    }
  }, [amount, currency])

  const recentPayments = useSelector(getRecentPayments)
  const localCurrencyExchangeRate = useSelector(getLocalCurrencyExchangeRate)
  const localCurrencySymbol = useSelector(getLocalCurrencySymbol)

  const now = Date.now()

  const isLimitReached = _isPaymentLimitReached(now, recentPayments, dollarAmount.toNumber())
  const showLimitReachedBanner = () => {
    dispatch(
      showLimitReachedError(now, recentPayments, localCurrencyExchangeRate, localCurrencySymbol)
    )
  }
  return [isLimitReached, showLimitReachedBanner]
}

export function _isPaymentLimitReached(
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
  const dailyRemainingcUSD = dailyAmountRemaining(now, recentPayments).toFixed(2)
  const dailyRemaining = convertDollarsToLocalAmount(
    dailyRemainingcUSD,
    localCurrencyExchangeRate
  )?.decimalPlaces(2)
  const dailyLimit = convertDollarsToLocalAmount(
    DAILY_PAYMENT_LIMIT_CUSD,
    localCurrencyExchangeRate
  )?.decimalPlaces(2)

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
    address: data.address.toLowerCase(),
    displayId: data.e164PhoneNumber,
    displayName: data.displayName || cachedRecipient?.displayName || 'anonymous',
    e164PhoneNumber: data.e164PhoneNumber,
    phoneNumberLabel: cachedRecipient?.phoneNumberLabel,
    thumbnailPath: cachedRecipient?.thumbnailPath,
    contactId: cachedRecipient?.contactId,
  }
  yield put(storeLatestInRecents(recipient))

  if (data.amount) {
    if (data.token === 'CELO') {
      navigate(Screens.WithdrawCeloReviewScreen, {
        amount: new BigNumber(data.amount),
        recipientAddress: data.address.toLowerCase(),
        feeEstimate: new BigNumber(0),
      })
    } else if (data.token === 'cUSD' || !data.token) {
      const currency = data.currencyCode
        ? (data.currencyCode as LocalCurrencyCode)
        : yield select(getLocalCurrencyCode)
      const exchangeRate: string = yield call(fetchExchangeRate, currency)
      const dollarAmount = convertLocalAmountToDollars(data.amount, exchangeRate)
      if (!dollarAmount) {
        Logger.warn(TAG, '@handleSendPaymentData null amount')
        return
      }
      const transactionData: TransactionDataInput = {
        recipient,
        amount: dollarAmount,
        reason: data.comment,
        type: TokenTransactionType.PayPrefill,
      }
      navigate(Screens.SendConfirmation, {
        transactionData,
        isFromScan: true,
        currencyInfo: { localCurrencyCode: currency, localExchangeRate: exchangeRate },
      })
    }
  } else {
    if (data.token === 'CELO') {
      Logger.warn(TAG, '@handleSendPaymentData no amount given in CELO withdrawal')
      return
    } else if (data.token === 'cUSD' || !data.token) {
      navigate(Screens.SendAmount, { recipient, isFromScan: true, isOutgoingPaymentRequest })
    }
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
