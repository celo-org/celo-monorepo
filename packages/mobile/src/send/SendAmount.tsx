import Button, { BtnSizes, BtnTypes } from '@celo/react-components/components/Button.v2'
import NumberKeypad from '@celo/react-components/components/NumberKeypad'
import fontStyles from '@celo/react-components/styles/fonts.v2'
import variables from '@celo/react-components/styles/variables'
import { CURRENCY_ENUM } from '@celo/utils/src/currencies'
import { parseInputAmount } from '@celo/utils/src/parsing'
import { RouteProp } from '@react-navigation/native'
import { StackScreenProps } from '@react-navigation/stack'
import BigNumber from 'bignumber.js'
import * as React from 'react'
import { useTranslation } from 'react-i18next'
import { ScrollView, StyleSheet, Text, View } from 'react-native'
import { getNumberFormatSettings } from 'react-native-localize'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useDispatch } from 'react-redux'
import { hideAlert, showError } from 'src/alert/actions'
import { RequestEvents, SendEvents } from 'src/analytics/Events'
import ValoraAnalytics from 'src/analytics/ValoraAnalytics'
import { TokenTransactionType } from 'src/apollo/types'
import { ErrorMessages } from 'src/app/ErrorMessages'
import BackButton from 'src/components/BackButton.v2'
import {
  ALERT_BANNER_DURATION,
  DAILY_PAYMENT_LIMIT_CUSD,
  DOLLAR_TRANSACTION_MIN_AMOUNT,
  NUMBER_INPUT_MAX_DECIMALS,
} from 'src/config'
import { getFeeEstimateDollars } from 'src/fees/selectors'
import i18n, { Namespaces } from 'src/i18n'
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
import { emptyHeader, HeaderTitleWithBalance } from 'src/navigator/Headers.v2'
import { navigate } from 'src/navigator/NavigationService'
import { Screens } from 'src/navigator/Screens'
import { StackParamList } from 'src/navigator/types'
import { getRecipientVerificationStatus, Recipient, RecipientKind } from 'src/recipients/recipient'
import useSelector from 'src/redux/useSelector'
import { getFeeType, useDailyTransferLimitValidator } from 'src/send/utils'
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

export const sendAmountScreenNavOptions = ({
  route,
}: {
  route: RouteProp<StackParamList, Screens.SendAmount>
}) => {
  const title = route.params?.isOutgoingPaymentRequest
    ? i18n.t('paymentRequestFlow:request')
    : i18n.t('sendFlow7:send')

  const eventName = route.params?.isOutgoingPaymentRequest
    ? RequestEvents.request_amount_back
    : SendEvents.send_amount_back

  return {
    ...emptyHeader,
    headerLeft: () => <BackButton eventName={eventName} />,
    headerTitle: () => <HeaderTitleWithBalance title={title} token={CURRENCY_ENUM.DOLLAR} />,
  }
}

function SendAmount(props: Props) {
  const dispatch = useDispatch()

  const { isOutgoingPaymentRequest, recipient } = props.route.params

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

  const getDollarAmount = (localAmount: BigNumber.Value) => {
    const dollarsAmount =
      convertLocalAmountToDollars(localAmount, localCurrencyExchangeRate) || new BigNumber('')

    return convertDollarsToMaxSupportedPrecision(dollarsAmount)
  }

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
  const localCurrencyAmount = convertDollarsToLocalAmount(dollarAmount, localCurrencyExchangeRate)

  const continueAnalyticsParams = React.useMemo(() => {
    return {
      isScan: !!props.route.params?.isFromScan,
      isInvite: recipientVerificationStatus !== RecipientVerificationStatus.VERIFIED,
      localCurrencyExchangeRate,
      localCurrency: localCurrencyCode,
      dollarAmount: dollarAmount.toString(),
      localCurrencyAmount: localCurrencyAmount
        ? localCurrencyAmount.toString()
        : localCurrencyAmount,
    }
  }, [props.route, localCurrencyCode, localCurrencyExchangeRate, dollarAmount])

  const [isTransferLimitReached, showLimitReachedBanner] = useDailyTransferLimitValidator(
    dollarAmount,
    CURRENCY_ENUM.DOLLAR
  )

  const onSend = React.useCallback(() => {
    if (!isDollarBalanceSufficient) {
      dispatch(showError(ErrorMessages.NSF_TO_SEND))
      return
    }

    if (isTransferLimitReached) {
      showLimitReachedBanner()
      return
    }

    const transactionData =
      recipientVerificationStatus === RecipientVerificationStatus.VERIFIED
        ? getTransactionData(TokenTransactionType.Sent)
        : getTransactionData(TokenTransactionType.InviteSent)

    dispatch(hideAlert())

    if (
      addressValidationType !== AddressValidationType.NONE &&
      recipient.kind !== RecipientKind.QrCode &&
      recipient.kind !== RecipientKind.Address
    ) {
      navigate(Screens.ValidateRecipientIntro, {
        transactionData,
        addressValidationType,
      })
    } else {
      ValoraAnalytics.track(SendEvents.send_amount_continue, continueAnalyticsParams)
      navigate(Screens.SendConfirmation, {
        transactionData,
        isFromScan: props.route.params?.isFromScan,
      })
    }
  }, [recipientVerificationStatus, addressValidationType, dollarAmount, getTransactionData])

  const onRequest = React.useCallback(() => {
    if (dollarAmount.isGreaterThan(DAILY_PAYMENT_LIMIT_CUSD)) {
      dispatch(
        showError(ErrorMessages.REQUEST_LIMIT, ALERT_BANNER_DURATION, {
          limit: DAILY_PAYMENT_LIMIT_CUSD,
        })
      )
      return
    }

    const transactionData = getTransactionData(TokenTransactionType.PayRequest)

    if (
      addressValidationType !== AddressValidationType.NONE &&
      recipient.kind !== RecipientKind.QrCode &&
      recipient.kind !== RecipientKind.Address
    ) {
      navigate(Screens.ValidateRecipientIntro, {
        transactionData,
        addressValidationType,
        isOutgoingPaymentRequest: true,
      })
    } else if (recipientVerificationStatus !== RecipientVerificationStatus.VERIFIED) {
      ValoraAnalytics.track(RequestEvents.request_unavailable, continueAnalyticsParams)
      navigate(Screens.PaymentRequestUnavailable, { transactionData })
    } else {
      ValoraAnalytics.track(RequestEvents.request_amount_continue, continueAnalyticsParams)
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
        onPress={isOutgoingPaymentRequest ? onRequest : onSend}
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
