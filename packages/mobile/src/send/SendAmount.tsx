import Button, { BtnSizes, BtnTypes } from '@celo/react-components/components/Button.v2'
import NumberKeypad from '@celo/react-components/components/NumberKeypad'
import fontStyles from '@celo/react-components/styles/fonts.v2'
import variables from '@celo/react-components/styles/variables'
import { parseInputAmount } from '@celo/utils/src/parsing'
import { StackScreenProps } from '@react-navigation/stack'
import BigNumber from 'bignumber.js'
import * as React from 'react'
import { useTranslation } from 'react-i18next'
import { ScrollView, StyleSheet, Text, View } from 'react-native'
import { getNumberFormatSettings } from 'react-native-localize'
import SafeAreaView from 'react-native-safe-area-view'
import { useDispatch } from 'react-redux'
import { hideAlert, showError } from 'src/alert/actions'
import CeloAnalytics from 'src/analytics/CeloAnalytics'
import { CustomEventNames } from 'src/analytics/constants'
import { TokenTransactionType } from 'src/apollo/types'
import { ErrorMessages } from 'src/app/ErrorMessages'
import {
  DAILY_PAYMENT_LIMIT_CUSD,
  DOLLAR_TRANSACTION_MIN_AMOUNT,
  NUMBER_INPUT_MAX_DECIMALS,
} from 'src/config'
import { getFeeEstimateDollars } from 'src/fees/selectors'
import { Namespaces } from 'src/i18n'
import { fetchAddressesAndValidate } from 'src/identity/actions'
import {
  AddressValidationType,
  e164NumberToAddressSelector,
  secureSendPhoneNumberMappingSelector,
} from 'src/identity/reducer'
import { getAddressValidationType } from 'src/identity/secureSend'
import { RecipientVerificationStatus } from 'src/identity/types'
import {
  convertDollarsToLocalAmount,
  convertDollarsToMaxSupportedPrecision,
  convertLocalAmountToDollars,
} from 'src/localCurrency/convert'
import {
  getLocalCurrencyCode,
  getLocalCurrencyExchangeRate,
  getLocalCurrencySymbol,
} from 'src/localCurrency/selectors'
import { navigate } from 'src/navigator/NavigationService'
import { Screens } from 'src/navigator/Screens'
import { StackParamList } from 'src/navigator/types'
import { getRecipientVerificationStatus, Recipient, RecipientKind } from 'src/recipients/recipient'
import useSelector from 'src/redux/useSelector'
import { getRecentPayments } from 'src/send/selectors'
import { dailyAmountRemaining, getFeeType, isPaymentLimitReached } from 'src/send/utils'
import DisconnectBanner from 'src/shared/DisconnectBanner'
import { fetchDollarBalance } from 'src/stableToken/actions'
import { stableTokenBalanceSelector } from 'src/stableToken/reducer'

export interface TransactionDataInput {
  recipient: Recipient
  amount: BigNumber
  type: TokenTransactionType
  reason?: string
  firebasePendingRequestUid?: string | null
}

type RouteProps = StackScreenProps<StackParamList, Screens.SendAmount>
type Props = RouteProps

const { decimalSeparator } = getNumberFormatSettings()

function SendAmount(props: Props) {
  const dispatch = useDispatch()

  const isRequest = props.route.params?.isRequest ?? false
  const recipient = props.route.params.recipient

  React.useEffect(() => {
    dispatch(fetchDollarBalance())
    if (recipient.kind === RecipientKind.QrCode || recipient.kind === RecipientKind.Address) {
      return
    }

    if (!recipient.e164PhoneNumber) {
      throw Error('Recipient phone number is required if not sending via QR Code or address')
    }

    dispatch(fetchAddressesAndValidate(recipient.e164PhoneNumber))
  }, [])

  const { t } = useTranslation(Namespaces.sendFlow7)

  const [amount, setAmount] = React.useState('')

  const localCurrencyCode = useSelector(getLocalCurrencyCode)
  const localCurrencyExchangeRate = useSelector(getLocalCurrencyExchangeRate)
  const localCurrencySymbol = useSelector(getLocalCurrencySymbol)
  const e164NumberToAddress = useSelector(e164NumberToAddressSelector)
  const dollarBalance = useSelector(stableTokenBalanceSelector)
  const recipientVerificationStatus = getRecipientVerificationStatus(recipient, e164NumberToAddress)
  const feeType = getFeeType(recipientVerificationStatus)
  const estimateFeeDollars = useSelector(getFeeEstimateDollars(feeType))

  const maxLength = React.useMemo(() => {
    const decimalPos = amount.indexOf(decimalSeparator ?? '.')
    if (decimalPos === -1) {
      return null
    }
    return decimalPos + NUMBER_INPUT_MAX_DECIMALS + 1
  }, [amount, decimalSeparator])

  const onDigitPress = React.useCallback(
    (digit) => {
      if ((amount === '' && digit === 0) || (maxLength && amount.length + 1 > maxLength)) {
        return
      }
      setAmount(amount + digit.toString())
    },
    [amount, setAmount]
  )

  const onBackspacePress = React.useCallback(() => {
    setAmount(amount.substr(0, amount.length - 1))
  }, [amount, setAmount])

  const onDecimalPress = React.useCallback(() => {
    const decimalPos = amount.indexOf(decimalSeparator ?? '.')
    if (decimalPos !== -1) {
      return
    }

    if (!amount) {
      setAmount('0' + decimalSeparator)
    } else {
      setAmount(amount + decimalSeparator)
    }
  }, [amount, setAmount])

  const getDollarAmount = React.useCallback(
    (localAmount: BigNumber.Value) => {
      const dollarsAmount =
        convertLocalAmountToDollars(localAmount, localCurrencyExchangeRate) || new BigNumber('')

      return convertDollarsToMaxSupportedPrecision(dollarsAmount)
    },
    [localCurrencyExchangeRate]
  )

  const parsedLocalAmount = parseInputAmount(amount, decimalSeparator)
  const dollarAmount = getDollarAmount(parsedLocalAmount)

  const newAccountBalance = new BigNumber(dollarBalance || '')
    .minus(dollarAmount)
    .minus(estimateFeeDollars || 0)

  const isAmountValid = parsedLocalAmount.isGreaterThanOrEqualTo(DOLLAR_TRANSACTION_MIN_AMOUNT)
  const isDollarBalanceSufficient = isAmountValid && newAccountBalance.isGreaterThanOrEqualTo(0)

  const reviewBtnDisabled =
    !isAmountValid || recipientVerificationStatus === RecipientVerificationStatus.UNKNOWN

  const secureSendPhoneNumberMapping = useSelector(secureSendPhoneNumberMappingSelector)
  const addressValidationType: AddressValidationType = getAddressValidationType(
    recipient,
    secureSendPhoneNumberMapping
  )

  const getTransactionData = React.useCallback(
    (type: TokenTransactionType): TransactionDataInput => ({
      recipient,
      amount: dollarAmount,
      type,
      reason: '',
    }),
    [recipient, dollarAmount]
  )
  const recentPayments = useSelector(getRecentPayments)

  const showLimitReachedError = React.useCallback(
    (now: number) => {
      const dailyRemainingcUSD = dailyAmountRemaining(now, recentPayments)
      const dailyRemaining = convertDollarsToLocalAmount(
        dailyRemainingcUSD,
        localCurrencyExchangeRate
      )
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
      dispatch(showError(ErrorMessages.PAYMENT_LIMIT_REACHED, null, translationParams))
    },
    [recentPayments]
  )

  const continueAnalyticsParams = React.useMemo(() => {
    return {
      method: props.route.params?.isFromScan ? 'scan' : 'search',
      localCurrencyExchangeRate,
      localCurrency: localCurrencyCode,
      dollarAmount,
      localCurrencyAmount: convertDollarsToLocalAmount(dollarAmount, localCurrencyExchangeRate),
    }
  }, [props.route, localCurrencyCode, localCurrencyExchangeRate, dollarAmount])

  const onSend = React.useCallback(() => {
    if (!isDollarBalanceSufficient) {
      dispatch(showError(ErrorMessages.NSF_TO_SEND))
      return
    }

    const now = Date.now()
    const isLimitReached = isPaymentLimitReached(now, recentPayments, dollarAmount.toNumber())
    if (isLimitReached) {
      showLimitReachedError(now)
      return
    }

    let transactionData: TransactionDataInput

    if (recipientVerificationStatus === RecipientVerificationStatus.VERIFIED) {
      transactionData = getTransactionData(TokenTransactionType.Sent)
      CeloAnalytics.track(CustomEventNames.transaction_details)
    } else {
      transactionData = getTransactionData(TokenTransactionType.InviteSent)
      CeloAnalytics.track(CustomEventNames.send_invite_details)
    }

    dispatch(hideAlert())

    if (addressValidationType !== AddressValidationType.NONE) {
      navigate(Screens.ValidateRecipientIntro, {
        transactionData,
        addressValidationType,
      })
    } else {
      CeloAnalytics.track(CustomEventNames.send_continue, continueAnalyticsParams)
      navigate(Screens.SendConfirmation, { transactionData })
    }
  }, [
    recipientVerificationStatus,
    addressValidationType,
    recentPayments,
    dollarAmount,
    getTransactionData,
  ])

  const onRequest = React.useCallback(() => {
    const transactionData = getTransactionData(TokenTransactionType.PayRequest)

    if (addressValidationType !== AddressValidationType.NONE) {
      navigate(Screens.ValidateRecipientIntro, {
        transactionData,
        addressValidationType,
        isPaymentRequest: true,
      })
    } else if (recipientVerificationStatus !== RecipientVerificationStatus.VERIFIED) {
      CeloAnalytics.track(CustomEventNames.request_unavailable, continueAnalyticsParams)
      navigate(Screens.PaymentRequestUnavailable, { transactionData })
    } else {
      CeloAnalytics.track(CustomEventNames.request_continue, continueAnalyticsParams)
      navigate(Screens.PaymentRequestConfirmation, { transactionData })
    }
  }, [addressValidationType, getTransactionData])

  return (
    <SafeAreaView style={styles.paddedContainer}>
      <DisconnectBanner />
      <ScrollView contentContainerStyle={styles.contentContainer}>
        <View style={styles.showAmountContainer}>
          <View style={styles.currencySymbolContainer}>
            <Text style={styles.currencySymbol}>{localCurrencySymbol || localCurrencyCode}</Text>
          </View>
          <View style={styles.amountContainer}>
            <Text style={styles.amount}>{amount ? amount : '0'}</Text>
          </View>
          <View style={styles.currencySymbolContainer}>
            <Text style={styles.currencySymbolTransparent}>
              {localCurrencySymbol || localCurrencyCode}
            </Text>
          </View>
        </View>
        <NumberKeypad
          onDigitPress={onDigitPress}
          onBackspacePress={onBackspacePress}
          decimalSeparator={decimalSeparator}
          onDecimalPress={onDecimalPress}
        />
      </ScrollView>
      <Button
        style={styles.nextBtn}
        size={BtnSizes.FULL}
        text={t('global:review')}
        type={BtnTypes.SECONDARY}
        onPress={isRequest ? onRequest : onSend}
        disabled={reviewBtnDisabled}
        testID="Review"
      />
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  paddedContainer: {
    flex: 1,
    paddingHorizontal: variables.contentPadding,
  },
  contentContainer: {
    flex: 1,
  },
  showAmountContainer: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
  },
  amountContainer: {
    justifyContent: 'center',
  },
  currencySymbolContainer: {
    justifyContent: 'center',
  },
  currencySymbol: {
    ...fontStyles.regular,
    fontSize: 32,
    lineHeight: 64,
    marginRight: 8,
  },
  currencySymbolTransparent: {
    ...fontStyles.regular,
    color: 'transparent',
    fontSize: 32,
    lineHeight: 64,
    marginLeft: 8,
  },
  amount: {
    ...fontStyles.regular,
    fontSize: 64,
    lineHeight: 88,
  },
  nextBtn: {
    paddingVertical: variables.contentPadding,
  },
})

export default SendAmount
