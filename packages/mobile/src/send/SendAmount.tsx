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
import BigNumber from 'bignumber.js'
import * as React from 'react'
import { WithTranslation } from 'react-i18next'
import { StyleSheet, TextStyle, TouchableWithoutFeedback, View } from 'react-native'
import { getNumberFormatSettings } from 'react-native-localize'
import SafeAreaView from 'react-native-safe-area-view'
import { NavigationInjectedProps } from 'react-navigation'
import { connect } from 'react-redux'
import { hideAlert, showError, showMessage } from 'src/alert/actions'
import CeloAnalytics from 'src/analytics/CeloAnalytics'
import { CustomEventNames } from 'src/analytics/constants'
import componentWithAnalytics from 'src/analytics/wrapper'
import { TokenTransactionType } from 'src/apollo/types'
import { ErrorMessages } from 'src/app/ErrorMessages'
import Avatar from 'src/components/Avatar'
import CurrencyDisplay, { FormatType } from 'src/components/CurrencyDisplay'
import {
  DOLLAR_TRANSACTION_MIN_AMOUNT,
  MAX_COMMENT_LENGTH,
  NUMBER_INPUT_MAX_DECIMALS,
} from 'src/config'
import { FeeType } from 'src/fees/actions'
import EstimateFee from 'src/fees/EstimateFee'
import { getFeeEstimateDollars } from 'src/fees/selectors'
import { CURRENCIES, CURRENCY_ENUM } from 'src/geth/consts'
import i18n, { Namespaces, withTranslation } from 'src/i18n'
import { fetchPhoneAddresses } from 'src/identity/actions'
import { RecipientVerificationStatus } from 'src/identity/contactMapping'
import { E164NumberToAddressType } from 'src/identity/reducer'
import { LocalCurrencyCode, LocalCurrencySymbol } from 'src/localCurrency/consts'
import {
  convertDollarsToMaxSupportedPrecision,
  convertLocalAmountToDollars,
} from 'src/localCurrency/convert'
import { getLocalCurrencyCode, getLocalCurrencyExchangeRate } from 'src/localCurrency/selectors'
import { HeaderTitleWithBalance, headerWithBackButton } from 'src/navigator/Headers'
import { navigate } from 'src/navigator/NavigationService'
import { Screens } from 'src/navigator/Screens'
import {
  getAddressFromRecipient,
  getRecipientVerificationStatus,
  Recipient,
  RecipientKind,
} from 'src/recipients/recipient'
import { RootState } from 'src/redux/reducers'
import { ConfirmationInput } from 'src/send/SendConfirmation'
import DisconnectBanner from 'src/shared/DisconnectBanner'
import { fetchDollarBalance } from 'src/stableToken/actions'
import { withDecimalSeparator } from 'src/utils/withDecimalSeparator'

const AmountInput = withDecimalSeparator(
  withTextInputLabeling<ValidatedTextInputProps<DecimalValidatorProps>>(ValidatedTextInput)
)
const CommentInput = withTextInputLabeling<TextInputProps>(TextInput)

interface State {
  amount: string
  reason: string
  characterLimitExceeded: boolean
}

type Navigation = NavigationInjectedProps['navigation']

interface OwnProps {
  navigation: Navigation
}

type Props = StateProps & DispatchProps & OwnProps & WithTranslation

interface StateProps {
  dollarBalance: string
  estimateFeeDollars?: BigNumber
  defaultCountryCode: string
  e164NumberToAddress: E164NumberToAddressType
  feeType: FeeType | null
  localCurrencyCode: LocalCurrencyCode
  localCurrencyExchangeRate: string | null | undefined
}

interface DispatchProps {
  fetchDollarBalance: typeof fetchDollarBalance
  showMessage: typeof showMessage
  showError: typeof showError
  hideAlert: typeof hideAlert
  fetchPhoneAddresses: typeof fetchPhoneAddresses
}

function getRecipient(navigation: Navigation): Recipient {
  const recipient = navigation.getParam('recipient')
  if (!recipient) {
    throw new Error('Recipient expected')
  }
  return recipient
}

function getVerificationStatus(
  navigation: Navigation,
  e164NumberToAddress: E164NumberToAddressType
) {
  return getRecipientVerificationStatus(getRecipient(navigation), e164NumberToAddress)
}

function getFeeType(
  navigation: Navigation,
  e164NumberToAddress: E164NumberToAddressType
): FeeType | null {
  const verificationStatus = getVerificationStatus(navigation, e164NumberToAddress)

  switch (verificationStatus) {
    case RecipientVerificationStatus.UNKNOWN:
      return null
    case RecipientVerificationStatus.UNVERIFIED:
      return FeeType.INVITE
    case RecipientVerificationStatus.VERIFIED:
      return FeeType.SEND
  }
}

const mapStateToProps = (state: RootState, ownProps: NavigationInjectedProps): StateProps => {
  const { navigation } = ownProps
  const { e164NumberToAddress } = state.identity
  const feeType = getFeeType(navigation, e164NumberToAddress)
  return {
    dollarBalance: state.stableToken.balance || '0',
    estimateFeeDollars: getFeeEstimateDollars(state, feeType),
    defaultCountryCode: state.account.defaultCountryCode,
    e164NumberToAddress,
    feeType,
    localCurrencyCode: getLocalCurrencyCode(state),
    localCurrencyExchangeRate: getLocalCurrencyExchangeRate(state),
  }
}

const { decimalSeparator } = getNumberFormatSettings()

export class SendAmount extends React.Component<Props, State> {
  static navigationOptions = () => ({
    ...headerWithBackButton,
    headerTitle: <HeaderTitleWithBalance title={i18n.t('sendFlow7:sendOrRequest')} />,
  })

  state: State = {
    amount: '',
    reason: '',
    characterLimitExceeded: false,
  }

  componentDidMount() {
    this.props.fetchDollarBalance()
    this.fetchLatestPhoneAddress()
  }

  fetchLatestPhoneAddress = () => {
    const recipient = this.getRecipient()
    if (recipient.kind === RecipientKind.QrCode || recipient.kind === RecipientKind.Address) {
      // Skip for QR codes or Addresses
      return
    }
    if (!recipient.e164PhoneNumber) {
      throw new Error('Missing recipient e164Number')
    }
    this.props.fetchPhoneAddresses(recipient.e164PhoneNumber)
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

  getRecipient = (): Recipient => {
    return getRecipient(this.props.navigation)
  }

  getVerificationStatus = () => {
    return getVerificationStatus(this.props.navigation, this.props.e164NumberToAddress)
  }

  getConfirmationInput = (type: TokenTransactionType) => {
    const amount = this.getDollarsAmount()
    const recipient = this.getRecipient()
    const recipientAddress = getAddressFromRecipient(recipient, this.props.e164NumberToAddress)

    const confirmationInput: ConfirmationInput = {
      recipient,
      amount,
      reason: this.state.reason,
      recipientAddress,
      type,
    }
    return confirmationInput
  }

  onAmountChanged = (amount: string) => {
    this.props.hideAlert()
    this.setState({ amount })
  }

  onReasonChanged = (reason: string) => {
    const characterLimitExceeded = reason.length > MAX_COMMENT_LENGTH
    if (characterLimitExceeded) {
      this.props.showMessage(this.props.t('characterLimitExceeded', { max: MAX_COMMENT_LENGTH }))
    } else {
      this.props.hideAlert()
    }

    this.setState({ reason, characterLimitExceeded })
  }

  onSend = () => {
    const { isDollarBalanceSufficient } = this.isAmountValid()
    if (!isDollarBalanceSufficient) {
      this.props.showError(ErrorMessages.NSF_TO_SEND)
      return
    }

    const verificationStatus = this.getVerificationStatus()
    let confirmationInput: ConfirmationInput

    if (verificationStatus === RecipientVerificationStatus.VERIFIED) {
      confirmationInput = this.getConfirmationInput(TokenTransactionType.Sent)
      CeloAnalytics.track(CustomEventNames.transaction_details, {
        recipientAddress: confirmationInput.recipientAddress,
      })
    } else {
      confirmationInput = this.getConfirmationInput(TokenTransactionType.InviteSent)
      CeloAnalytics.track(CustomEventNames.send_invite_details)
    }

    this.props.hideAlert()
    CeloAnalytics.track(CustomEventNames.send_continue)
    navigate(Screens.SendConfirmation, { confirmationInput })
  }

  onRequest = () => {
    CeloAnalytics.track(CustomEventNames.request_payment_continue)
    const confirmationInput = this.getConfirmationInput(TokenTransactionType.PayRequest)
    navigate(Screens.PaymentRequestConfirmation, { confirmationInput })
  }

  renderButtons = (isAmountValid: boolean) => {
    const { t } = this.props
    const { characterLimitExceeded } = this.state
    const verificationStatus = this.getVerificationStatus()

    const requestDisabled =
      !isAmountValid ||
      verificationStatus !== RecipientVerificationStatus.VERIFIED ||
      characterLimitExceeded
    const sendDisabled =
      !isAmountValid ||
      characterLimitExceeded ||
      verificationStatus === RecipientVerificationStatus.UNKNOWN

    const separatorContainerStyle =
      sendDisabled && requestDisabled
        ? style.separatorContainerInactive
        : style.separatorContainerActive
    const separatorStyle =
      sendDisabled && requestDisabled ? style.buttonSeparatorInactive : style.buttonSeparatorActive

    return (
      <View style={[componentStyles.bottomContainer, style.buttonContainer]}>
        {verificationStatus !== RecipientVerificationStatus.UNVERIFIED && (
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
              verificationStatus === RecipientVerificationStatus.VERIFIED ? t('send') : t('invite')
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
    const { t, feeType, estimateFeeDollars, localCurrencyCode } = this.props
    const recipient = this.getRecipient()
    const verificationStatus = this.getVerificationStatus()

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
              isLoading={verificationStatus === RecipientVerificationStatus.UNKNOWN}
              loadingLabelText={t('loadingVerificationStatus')}
              labelText={
                verificationStatus === RecipientVerificationStatus.UNVERIFIED
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
            maxLength={70}
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

export default componentWithAnalytics(
  connect<StateProps, DispatchProps, OwnProps, RootState>(mapStateToProps, {
    fetchDollarBalance,
    showError,
    hideAlert,
    showMessage,
    fetchPhoneAddresses,
  })(withTranslation(Namespaces.sendFlow7)(SendAmount))
)
