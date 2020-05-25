import Button, { BtnSizes, BtnTypes } from '@celo/react-components/components/Button.v2'
import KeyboardSpacer from '@celo/react-components/components/KeyboardSpacer'
import LoadingLabel from '@celo/react-components/components/LoadingLabel'
import NumberKeypad from '@celo/react-components/components/NumberKeypad'
import colors from '@celo/react-components/styles/colors'
import fontStyles from '@celo/react-components/styles/fonts.v2'
import { componentStyles } from '@celo/react-components/styles/styles'
import variables from '@celo/react-components/styles/variables'
import { ValidatorKind } from '@celo/utils/src/inputValidation'
import { parseInputAmount } from '@celo/utils/src/parsing'
import { StackScreenProps } from '@react-navigation/stack'
import BigNumber from 'bignumber.js'
import * as React from 'react'
import { useTranslation, WithTranslation } from 'react-i18next'
import {
  ScrollView,
  StyleSheet,
  Text,
  TextStyle,
  TouchableWithoutFeedback,
  View,
} from 'react-native'
import { getNumberFormatSettings } from 'react-native-localize'
import SafeAreaView from 'react-native-safe-area-view'
import { connect } from 'react-redux'
import { hideAlert, showError, showMessage } from 'src/alert/actions'
import CeloAnalytics from 'src/analytics/CeloAnalytics'
import { CustomEventNames } from 'src/analytics/constants'
import { TokenTransactionType } from 'src/apollo/types'
import { ErrorMessages } from 'src/app/ErrorMessages'
import CurrencyDisplay, { FormatType } from 'src/components/CurrencyDisplay'
import {
  DAILY_PAYMENT_LIMIT_CUSD,
  DOLLAR_TRANSACTION_MIN_AMOUNT,
  MAX_COMMENT_LENGTH,
  NUMBER_INPUT_MAX_DECIMALS,
} from 'src/config'
import { FeeType } from 'src/fees/actions'
import EstimateFee from 'src/fees/EstimateFee'
import { getFeeEstimateDollars } from 'src/fees/selectors'
import { CURRENCIES, CURRENCY_ENUM } from 'src/geth/consts'
import i18n, { Namespaces, withTranslation } from 'src/i18n'
import { fetchAddressesAndValidate } from 'src/identity/actions'
import { AddressValidationType, RecipientVerificationStatus } from 'src/identity/reducer'
import { getAddressValidationType } from 'src/identity/secureSend'
import { LocalCurrencyCode, LocalCurrencySymbol } from 'src/localCurrency/consts'
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
import { HeaderTitleWithBalance, headerWithBackButton } from 'src/navigator/Headers'
import { navigate } from 'src/navigator/NavigationService'
import { Screens } from 'src/navigator/Screens'
import { StackParamList } from 'src/navigator/types'
import { getRecipientVerificationStatus, Recipient } from 'src/recipients/recipient'
import { RootState } from 'src/redux/reducers'
import useSelector from 'src/redux/useSelector'
import { PaymentInfo } from 'src/send/reducers'
import { getRecentPayments } from 'src/send/selectors'
import { dailyAmountRemaining, getFeeType } from 'src/send/utils'
import DisconnectBanner from 'src/shared/DisconnectBanner'
import { fetchDollarBalance } from 'src/stableToken/actions'
import { withDecimalSeparator } from 'src/utils/withDecimalSeparator'

export interface TransactionDataInput {
  recipient: Recipient
  amount: BigNumber
  type: TokenTransactionType
  firebasePendingRequestUid?: string | null
}

interface State {
  amount: string
}

type OwnProps = StackScreenProps<StackParamList, Screens.SendAmount>
type Props = StateProps & DispatchProps & OwnProps & WithTranslation

interface StateProps {
  dollarBalance: string
  estimateFeeDollars: BigNumber | undefined
  defaultCountryCode: string
  feeType: FeeType | null
  localCurrencyCode: LocalCurrencyCode
  localCurrencyExchangeRate: string | null | undefined
  recipient: Recipient
  recipientVerificationStatus: RecipientVerificationStatus
  addressValidationType: AddressValidationType
  recentPayments: PaymentInfo[]
}

interface DispatchProps {
  fetchDollarBalance: typeof fetchDollarBalance
  showMessage: typeof showMessage
  showError: typeof showError
  hideAlert: typeof hideAlert
  fetchAddressesAndValidate: typeof fetchAddressesAndValidate
}

const mapStateToProps = (state: RootState, ownProps: OwnProps): StateProps => {
  const { route } = ownProps
  const recipient = route.params.recipient
  const { secureSendPhoneNumberMapping } = state.identity
  const addressValidationType = getAddressValidationType(recipient, secureSendPhoneNumberMapping)
  const { e164NumberToAddress } = state.identity
  const recipientVerificationStatus = getRecipientVerificationStatus(recipient, e164NumberToAddress)
  const feeType = getFeeType(recipientVerificationStatus)
  const recentPayments = getRecentPayments(state)

  return {
    dollarBalance: state.stableToken.balance || '0',
    estimateFeeDollars: getFeeEstimateDollars(state, feeType),
    defaultCountryCode: state.account.defaultCountryCode,
    feeType,
    localCurrencyCode: getLocalCurrencyCode(state),
    localCurrencyExchangeRate: getLocalCurrencyExchangeRate(state),
    recipient,
    recipientVerificationStatus,
    addressValidationType,
    recentPayments,
  }
}

const mapDispatchToProps = {
  fetchDollarBalance,
  showError,
  hideAlert,
  showMessage,
  fetchAddressesAndValidate,
}

const { decimalSeparator } = getNumberFormatSettings()

function SendAmount(props: Props) {
  // static navigationOptions = {
  // ...headerWithBackButton,
  // headerTitle: <HeaderTitleWithBalance title={i18n.t('sendFlow7:sendOrRequest')} />,
  // }

  // componentDidMount = () => {
  // this.props.fetchDollarBalance()
  // this.fetchLatestAddressesAndValidate()
  // }

  // fetchLatestAddressesAndValidate = () => {
  // const { recipient } = this.props

  // if (recipient.e164PhoneNumber) {
  // this.props.fetchAddressesAndValidate(recipient.e164PhoneNumber)
  // }
  // }

  // getDollarsAmount = () => {
  // const parsedInputAmount = parseInputAmount(this.state.amount, decimalSeparator)

  // const { localCurrencyExchangeRate } = this.props

  // const dollarsAmount =
  // convertLocalAmountToDollars(parsedInputAmount, localCurrencyExchangeRate) || new BigNumber('')

  // return convertDollarsToMaxSupportedPrecision(dollarsAmount)
  // }

  // getNewAccountBalance = () => {
  // return new BigNumber(this.props.dollarBalance)
  // .minus(this.getDollarsAmount())
  // .minus(this.props.estimateFeeDollars || 0)
  // }

  // isAmountValid = () => {
  // const isAmountValid = parseInputAmount(
  // this.state.amount,
  // decimalSeparator
  // ).isGreaterThanOrEqualTo(DOLLAR_TRANSACTION_MIN_AMOUNT)
  // return {
  // isAmountValid,
  // isDollarBalanceSufficient:
  // isAmountValid && this.getNewAccountBalance().isGreaterThanOrEqualTo(0),
  // }
  // }

  // getTransactionData = (type: TokenTransactionType): TransactionDataInput => ({
  // recipient: this.props.recipient,
  // amount: this.getDollarsAmount(),
  // type,
  // })

  // onAmountChanged = (amount: string) => {
  // this.props.hideAlert()
  // this.setState({ amount })
  // }

  // showLimitReachedError = (now: number) => {
  // const dailyRemainingcUSD = dailyAmountRemaining(now, this.props.recentPayments)
  // const dailyRemaining = convertDollarsToLocalAmount(
  // dailyRemainingcUSD,
  // this.props.localCurrencyExchangeRate
  // )
  // const dailyLimit = convertDollarsToLocalAmount(
  // DAILY_PAYMENT_LIMIT_CUSD,
  // this.props.localCurrencyExchangeRate
  // )
  // const currencySymbol = LocalCurrencySymbol[this.props.localCurrencyCode]

  // const translationParams = {
  // currencySymbol,
  // dailyRemaining,
  // dailyLimit,
  // dailyRemainingcUSD,
  // dailyLimitcUSD: DAILY_PAYMENT_LIMIT_CUSD,
  // }
  // this.props.showError(ErrorMessages.PAYMENT_LIMIT_REACHED, null, translationParams)
  // }

  const { t } = useTranslation(Namespaces.sendFlow7)

  const localCurrencyCode = useSelector(getLocalCurrencyCode)
  const localCurrencyExchangeRate = useSelector(getLocalCurrencyExchangeRate)
  const localCurrencySymbol = useSelector(getLocalCurrencySymbol)
  const [amount, setAmount] = React.useState('')

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
    if (!amount) {
      setAmount('0' + decimalSeparator)
    } else {
      setAmount(amount + decimalSeparator)
    }
  }, [amount, setAmount])

  // const onRequestSendPressed = useCallback(() => {
  // const { addressValidationType } = this.props
  // const transactionData = this.getTransactionData(TokenTransactionType.PayRequest)

  // if (addressValidationType !== AddressValidationType.NONE) {
  // navigate(Screens.ValidateRecipientIntro, {
  // transactionData,
  // addressValidationType,
  // isPaymentRequest: true,
  // })
  // } else {
  // CeloAnalytics.track(CustomEventNames.request_payment_continue)
  // navigate(Screens.PaymentRequestConfirmation, { transactionData })
  // }
  // }, [])

  // const onSend = useCallback(() => {
  // const { recipientVerificationStatus, addressValidationType } = this.props

  // const { isDollarBalanceSufficient } = this.isAmountValid()
  // if (!isDollarBalanceSufficient) {
  // this.props.showError(ErrorMessages.NSF_TO_SEND)
  // return
  // }

  // let transactionData: TransactionDataInput

  // if (recipientVerificationStatus === RecipientVerificationStatus.VERIFIED) {
  // transactionData = this.getTransactionData(TokenTransactionType.Sent)
  // CeloAnalytics.track(CustomEventNames.transaction_details)
  // } else {
  // transactionData = this.getTransactionData(TokenTransactionType.InviteSent)
  // CeloAnalytics.track(CustomEventNames.send_invite_details)
  // }

  // this.props.hideAlert()

  // if (addressValidationType !== AddressValidationType.NONE) {
  // navigate(Screens.ValidateRecipientIntro, {
  // transactionData,
  // addressValidationType,
  // })
  // } else {
  // CeloAnalytics.track(CustomEventNames.send_continue)
  // navigate(Screens.SendConfirmation, { transactionData })
  // }
  // })

  return (
    <SafeAreaView style={styles.paddedContainer}>
      <DisconnectBanner />
      <ScrollView contentContainerStyle={styles.contentContainer}>
        <View style={styles.showAmountContainer}>
          <View style={styles.currencySymbolContainer}>
            <Text style={styles.currencySymbol}>{localCurrencySymbol}</Text>
          </View>
          <View style={styles.amountContainer}>
            <Text style={styles.amount}>{amount ? amount : '0'}</Text>
          </View>
          <View style={styles.currencySymbolContainer}>
            <Text style={styles.currencySymbolTransparent}>{localCurrencySymbol}</Text>
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
        text={t('review')}
        type={BtnTypes.SECONDARY}
        onPress={() => {}}
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

export default connect<StateProps, DispatchProps, OwnProps, RootState>(
  mapStateToProps,
  mapDispatchToProps
)(withTranslation(Namespaces.sendFlow7)(SendAmount))
