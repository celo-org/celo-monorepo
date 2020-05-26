import Button, { BtnTypes } from '@celo/react-components/components/Button'
import KeyboardAwareScrollView from '@celo/react-components/components/KeyboardAwareScrollView'
import KeyboardSpacer from '@celo/react-components/components/KeyboardSpacer'
import LoadingLabel from '@celo/react-components/components/LoadingLabel'
import TextInput, { TextInputProps } from '@celo/react-components/components/TextInput'
import ValidatedTextInput, {
  DecimalValidatorProps,
  ValidatedTextInputProps,
} from '@celo/react-components/components/ValidatedTextInput'
import withTextInputLabeling from '@celo/react-components/components/WithTextInputLabeling'
import colors from '@celo/react-components/styles/colors'
import { fontStyles } from '@celo/react-components/styles/fonts'
import { componentStyles } from '@celo/react-components/styles/styles'
import { ValidatorKind } from '@celo/utils/src/inputValidation'
import { parseInputAmount } from '@celo/utils/src/parsing'
import { StackScreenProps } from '@react-navigation/stack'
import BigNumber from 'bignumber.js'
import * as React from 'react'
import { WithTranslation } from 'react-i18next'
import { StyleSheet, TextStyle, TouchableWithoutFeedback, View } from 'react-native'
import { getNumberFormatSettings } from 'react-native-localize'
import SafeAreaView from 'react-native-safe-area-view'
import { connect } from 'react-redux'
import { hideAlert, showError, showMessage } from 'src/alert/actions'
import CeloAnalytics from 'src/analytics/CeloAnalytics'
import { CustomEventNames } from 'src/analytics/constants'
import { TokenTransactionType } from 'src/apollo/types'
import { ErrorMessages } from 'src/app/ErrorMessages'
import Avatar from 'src/components/Avatar'
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
import { getLocalCurrencyCode, getLocalCurrencyExchangeRate } from 'src/localCurrency/selectors'
import { HeaderTitleWithBalance, headerWithBackButton } from 'src/navigator/Headers'
import { navigate } from 'src/navigator/NavigationService'
import { Screens } from 'src/navigator/Screens'
import { StackParamList } from 'src/navigator/types'
import { getRecipientVerificationStatus, Recipient } from 'src/recipients/recipient'
import { RootState } from 'src/redux/reducers'
import { PaymentInfo } from 'src/send/reducers'
import { getRecentPayments } from 'src/send/selectors'
import { dailyAmountRemaining, getFeeType } from 'src/send/utils'
import DisconnectBanner from 'src/shared/DisconnectBanner'
import { fetchDollarBalance } from 'src/stableToken/actions'
import { withDecimalSeparator } from 'src/utils/withDecimalSeparator'

export interface TransactionDataInput {
  recipient: Recipient
  amount: BigNumber
  reason: string
  type: TokenTransactionType
  firebasePendingRequestUid?: string | null
}

const AmountInput = withDecimalSeparator(
  withTextInputLabeling<ValidatedTextInputProps<DecimalValidatorProps>>(ValidatedTextInput)
)
const CommentInput = withTextInputLabeling<TextInputProps>(TextInput)

interface State {
  amount: string
  reason: string
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

export class SendAmount extends React.Component<Props, State> {
  static navigationOptions = {
    ...headerWithBackButton,
    headerTitle: <HeaderTitleWithBalance title={i18n.t('sendFlow7:sendOrRequest')} />,
  }

  state: State = {
    amount: '',
    reason: '',
  }

  componentDidMount = () => {
    this.props.fetchDollarBalance()
    this.fetchLatestAddressesAndValidate()
  }

  fetchLatestAddressesAndValidate = () => {
    const { recipient } = this.props

    if (recipient.e164PhoneNumber) {
      this.props.fetchAddressesAndValidate(recipient.e164PhoneNumber)
    }
  }

  getDollarsAmount = () => {
    const parsedInputAmount = parseInputAmount(this.state.amount, decimalSeparator)

    const { localCurrencyExchangeRate } = this.props

    const dollarsAmount =
      convertLocalAmountToDollars(parsedInputAmount, localCurrencyExchangeRate) || new BigNumber('')

    return convertDollarsToMaxSupportedPrecision(dollarsAmount)
  }

  getNewAccountBalance = () => {
    return new BigNumber(this.props.dollarBalance)
      .minus(this.getDollarsAmount())
      .minus(this.props.estimateFeeDollars || 0)
  }

  isAmountValid = () => {
    const isAmountValid = parseInputAmount(
      this.state.amount,
      decimalSeparator
    ).isGreaterThanOrEqualTo(DOLLAR_TRANSACTION_MIN_AMOUNT)
    return {
      isAmountValid,
      isDollarBalanceSufficient:
        isAmountValid && this.getNewAccountBalance().isGreaterThanOrEqualTo(0),
    }
  }

  getTransactionData = (type: TokenTransactionType): TransactionDataInput => ({
    recipient: this.props.recipient,
    amount: this.getDollarsAmount(),
    reason: this.state.reason,
    type,
  })

  onAmountChanged = (amount: string) => {
    this.props.hideAlert()
    this.setState({ amount })
  }

  onReasonChanged = (reason: string) => {
    this.setState({ reason })
  }

  showLimitReachedError = (now: number) => {
    const dailyRemainingcUSD = dailyAmountRemaining(now, this.props.recentPayments)
    const dailyRemaining = convertDollarsToLocalAmount(
      dailyRemainingcUSD,
      this.props.localCurrencyExchangeRate
    )
    const dailyLimit = convertDollarsToLocalAmount(
      DAILY_PAYMENT_LIMIT_CUSD,
      this.props.localCurrencyExchangeRate
    )
    const currencySymbol = LocalCurrencySymbol[this.props.localCurrencyCode]

    const translationParams = {
      currencySymbol,
      dailyRemaining,
      dailyLimit,
      dailyRemainingcUSD,
      dailyLimitcUSD: DAILY_PAYMENT_LIMIT_CUSD,
    }
    this.props.showError(ErrorMessages.PAYMENT_LIMIT_REACHED, null, translationParams)
  }

  onSend = () => {
    const { recipientVerificationStatus, addressValidationType } = this.props

    const { isDollarBalanceSufficient } = this.isAmountValid()
    if (!isDollarBalanceSufficient) {
      this.props.showError(ErrorMessages.NSF_TO_SEND)
      return
    }

    let transactionData: TransactionDataInput

    if (recipientVerificationStatus === RecipientVerificationStatus.VERIFIED) {
      transactionData = this.getTransactionData(TokenTransactionType.Sent)
      CeloAnalytics.track(CustomEventNames.transaction_details)
    } else {
      transactionData = this.getTransactionData(TokenTransactionType.InviteSent)
      CeloAnalytics.track(CustomEventNames.send_invite_details)
    }

    this.props.hideAlert()

    if (addressValidationType !== AddressValidationType.NONE) {
      navigate(Screens.ValidateRecipientIntro, {
        transactionData,
        addressValidationType,
      })
    } else {
      CeloAnalytics.track(CustomEventNames.send_continue)
      navigate(Screens.SendConfirmation, { transactionData })
    }
  }

  onRequest = () => {
    const { addressValidationType } = this.props
    const transactionData = this.getTransactionData(TokenTransactionType.PayRequest)

    if (addressValidationType !== AddressValidationType.NONE) {
      navigate(Screens.ValidateRecipientIntro, {
        transactionData,
        addressValidationType,
        isPaymentRequest: true,
      })
    } else {
      CeloAnalytics.track(CustomEventNames.request_payment_continue)
      navigate(Screens.PaymentRequestConfirmation, { transactionData })
    }
  }

  renderButtons = (isAmountValid: boolean) => {
    const { t, recipientVerificationStatus } = this.props

    const requestDisabled =
      !isAmountValid || recipientVerificationStatus !== RecipientVerificationStatus.VERIFIED
    const sendDisabled =
      !isAmountValid || recipientVerificationStatus === RecipientVerificationStatus.UNKNOWN

    const separatorContainerStyle =
      sendDisabled && requestDisabled
        ? style.separatorContainerInactive
        : style.separatorContainerActive
    const separatorStyle =
      sendDisabled && requestDisabled ? style.buttonSeparatorInactive : style.buttonSeparatorActive

    return (
      <View style={[componentStyles.bottomContainer, style.buttonContainer]}>
        {recipientVerificationStatus !== RecipientVerificationStatus.UNVERIFIED && (
          <View style={style.button}>
            <Button
              testID="Request"
              onPress={this.onRequest}
              text={t('request')}
              accessibilityLabel={t('request')}
              standard={false}
              type={BtnTypes.PRIMARY}
              disabled={requestDisabled}
            />
          </View>
        )}
        <View style={[style.separatorContainer, separatorContainerStyle]}>
          <View style={[style.buttonSeparator, separatorStyle]} />
        </View>
        <View style={style.button}>
          <Button
            testID="Send"
            onPress={this.onSend}
            text={
              recipientVerificationStatus === RecipientVerificationStatus.VERIFIED
                ? t('send')
                : t('invite')
            }
            accessibilityLabel={t('send')}
            standard={false}
            type={BtnTypes.PRIMARY}
            disabled={sendDisabled}
          />
        </View>
      </View>
    )
  }

  renderBottomContainer = () => {
    const { isAmountValid } = this.isAmountValid()

    const onPress = () => {
      if (!isAmountValid) {
        this.props.showError(ErrorMessages.INVALID_AMOUNT)
        return
      }
    }

    if (!isAmountValid) {
      return (
        <TouchableWithoutFeedback onPress={onPress}>
          {this.renderButtons(false)}
        </TouchableWithoutFeedback>
      )
    }
    return this.renderButtons(true)
  }

  render() {
    const {
      t,
      feeType,
      estimateFeeDollars,
      localCurrencyCode,
      recipient,
      recipientVerificationStatus,
    } = this.props

    return (
      <SafeAreaView
        // Force inset as this screen uses auto focus and KeyboardSpacer padding is initially
        // incorrect because of that
        forceInset={{ bottom: 'always' }}
        style={style.body}
      >
        {feeType && <EstimateFee feeType={feeType} />}
        <KeyboardAwareScrollView
          keyboardShouldPersistTaps="always"
          contentContainerStyle={style.contentContainer}
        >
          <DisconnectBanner />
          <Avatar
            name={recipient.displayName}
            recipient={recipient}
            e164Number={recipient.e164PhoneNumber}
            address={recipient.address}
          />
          <View style={style.inviteDescription}>
            <LoadingLabel
              isLoading={recipientVerificationStatus === RecipientVerificationStatus.UNKNOWN}
              loadingLabelText={t('loadingVerificationStatus')}
              labelText={
                recipientVerificationStatus === RecipientVerificationStatus.UNVERIFIED
                  ? t('inviteMoneyEscrow')
                  : undefined
              }
              labelTextStyle={fontStyles.center}
            />
          </View>
          <AmountInput
            keyboardType="numeric"
            title={
              localCurrencyCode !== LocalCurrencyCode.USD
                ? LocalCurrencySymbol[localCurrencyCode]
                : CURRENCIES[CURRENCY_ENUM.DOLLAR].symbol
            }
            placeholder={t('amount')}
            labelStyle={style.amountLabel as TextStyle}
            placeholderTextColor={colors.celoGreenInactive}
            autoCorrect={false}
            value={this.state.amount}
            onChangeText={this.onAmountChanged}
            autoFocus={true}
            numberOfDecimals={NUMBER_INPUT_MAX_DECIMALS}
            validator={ValidatorKind.Decimal}
          />
          <CommentInput
            title={t('global:for')}
            placeholder={t('groceriesRent')}
            value={this.state.reason}
            maxLength={MAX_COMMENT_LENGTH}
            onChangeText={this.onReasonChanged}
          />
          <View style={style.feeContainer}>
            <LoadingLabel
              isLoading={!estimateFeeDollars}
              loadingLabelText={t('estimatingFee')}
              labelText={t('estimatedFee')}
              valueText={
                estimateFeeDollars && (
                  <CurrencyDisplay
                    amount={{
                      value: estimateFeeDollars,
                      currencyCode: CURRENCIES[CURRENCY_ENUM.DOLLAR].code,
                    }}
                    formatType={FormatType.Fee}
                  />
                )
              }
              valueTextStyle={fontStyles.semiBold}
            />
          </View>
        </KeyboardAwareScrollView>
        {this.renderBottomContainer()}
        <KeyboardSpacer />
      </SafeAreaView>
    )
  }
}

const style = StyleSheet.create({
  contentContainer: {
    paddingTop: 8,
  },
  body: {
    flex: 1,
    backgroundColor: 'white',
    flexDirection: 'column',
    justifyContent: 'space-between',
  },
  avatar: {
    marginTop: 10,
    alignSelf: 'center',
    margin: 'auto',
  },
  label: {
    alignSelf: 'center',
    color: colors.dark,
  },
  inviteDescription: {
    marginVertical: 2,
    paddingHorizontal: 65,
    textAlign: 'center',
  },
  amountLabel: {
    color: colors.celoGreen,
  },
  buttonContainer: {
    display: 'flex',
    flexDirection: 'row',
  },
  button: {
    flex: 1,
  },
  separatorContainer: {
    height: 50,
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-around',
  },
  separatorContainerInactive: {
    backgroundColor: colors.celoGreenInactive,
  },
  separatorContainerActive: {
    backgroundColor: colors.celoGreen,
  },
  buttonSeparatorInactive: {
    backgroundColor: colors.celoDarkGreenInactive,
  },
  buttonSeparatorActive: {
    backgroundColor: colors.celoDarkGreen,
  },
  buttonSeparator: {
    width: 2,
    height: 40,
  },
  feeContainer: {
    marginTop: 15,
  },
})

export default connect<StateProps, DispatchProps, OwnProps, RootState>(
  mapStateToProps,
  mapDispatchToProps
)(withTranslation(Namespaces.sendFlow7)(SendAmount))
