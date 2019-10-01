import Button, { BtnTypes } from '@celo/react-components/components/Button'
import LoadingLabel from '@celo/react-components/components/LoadingLabel'
import colors from '@celo/react-components/styles/colors'
import { fontStyles } from '@celo/react-components/styles/fonts'
import { componentStyles } from '@celo/react-components/styles/styles'
import { ValidatorKind } from '@celo/utils/src/inputValidation'
import { parseInputAmount } from '@celo/utils/src/parsing'
import BigNumber from 'bignumber.js'
import * as React from 'react'
import { withNamespaces, WithNamespaces } from 'react-i18next'
import { StyleSheet, Text, TextStyle, TouchableWithoutFeedback, View } from 'react-native'
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view'
import { NavigationInjectedProps } from 'react-navigation'
import { connect } from 'react-redux'
import { hideAlert, showError, showMessage } from 'src/alert/actions'
import CeloAnalytics from 'src/analytics/CeloAnalytics'
import { CustomEventNames } from 'src/analytics/constants'
import componentWithAnalytics from 'src/analytics/wrapper'
import { ErrorMessages } from 'src/app/ErrorMessages'
import Avatar from 'src/components/Avatar'
import {
  DOLLAR_TRANSACTION_MIN_AMOUNT,
  MAX_COMMENT_LENGTH,
  NUMBER_INPUT_MAX_DECIMALS,
} from 'src/config'
import { FeeType } from 'src/fees/actions'
import EstimateFee from 'src/fees/EstimateFee'
import { getFeeEstimateDollars } from 'src/fees/selectors'
import { CURRENCIES, CURRENCY_ENUM } from 'src/geth/consts'
import i18n, { Namespaces } from 'src/i18n'
import { fetchPhoneAddresses } from 'src/identity/actions'
import { VerificationStatus } from 'src/identity/contactMapping'
import { E164NumberToAddressType } from 'src/identity/reducer'
import { LocalCurrencyCode } from 'src/localCurrency/consts'
import {
  convertDollarsToMaxSupportedPrecision,
  convertLocalAmountToDollars,
} from 'src/localCurrency/convert'
import { getLocalCurrencyCode, getLocalCurrencyExchangeRate } from 'src/localCurrency/selectors'
import { headerWithBackButton } from 'src/navigator/Headers'
import { navigate } from 'src/navigator/NavigationService'
import { Screens } from 'src/navigator/Screens'
import {
  getAddressFromRecipient,
  getRecipientVerificationStatus,
  Recipient,
  RecipientKind,
} from 'src/recipients/recipient'
import { RootState } from 'src/redux/reducers'
import LabeledTextInput from 'src/send/LabeledTextInput'
import { ConfirmationInput } from 'src/send/SendConfirmation'
import DisconnectBanner from 'src/shared/DisconnectBanner'
import { fetchDollarBalance } from 'src/stableToken/actions'
import { TransactionTypes } from 'src/transactions/reducer'
import { getBalanceColor, getFeeDisplayValue, getMoneyDisplayValue } from 'src/utils/formatting'

interface State {
  amount: string
  reason: string
  characterLimitExceeded: boolean
}

type Navigation = NavigationInjectedProps['navigation']

interface OwnProps {
  navigation: Navigation
}

type Props = StateProps & DispatchProps & OwnProps & WithNamespaces

interface StateProps {
  dollarBalance: string
  estimateFeeDollars?: BigNumber
  defaultCountryCode: string
  e164NumberToAddress: E164NumberToAddressType
  feeType: FeeType | null
  localCurrencyCode: LocalCurrencyCode | null
  localCurrencyExchangeRate: number | null | undefined
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
    case VerificationStatus.UNKNOWN:
      return null
    case VerificationStatus.UNVERIFIED:
      return FeeType.INVITE
    case VerificationStatus.VERIFIED:
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

export class SendAmount extends React.Component<Props, State> {
  static navigationOptions = () => ({
    ...headerWithBackButton,
    headerTitle: i18n.t('sendFlow7:sendOrRequest'),
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

  componentWillUnmount() {
    this.props.hideAlert()
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
    this.props.fetchPhoneAddresses([recipient.e164PhoneNumber])
  }

  getDollarsAmount = () => {
    const parsedInputAmount = parseInputAmount(this.state.amount)
    const { localCurrencyCode, localCurrencyExchangeRate } = this.props

    let dollarsAmount
    if (localCurrencyCode) {
      dollarsAmount =
        convertLocalAmountToDollars(parsedInputAmount, localCurrencyExchangeRate) ||
        new BigNumber('')
    } else {
      dollarsAmount = parsedInputAmount
    }

    return convertDollarsToMaxSupportedPrecision(dollarsAmount)
  }

  getNewAccountBalance = () => {
    return new BigNumber(this.props.dollarBalance)
      .minus(this.getDollarsAmount())
      .minus(this.props.estimateFeeDollars || 0)
  }

  isAmountValid = () => {
    const isAmountValid = parseInputAmount(this.state.amount).isGreaterThan(
      DOLLAR_TRANSACTION_MIN_AMOUNT
    )
    return {
      isAmountValid,
      isDollarBalanceSufficient: isAmountValid && this.getNewAccountBalance().isGreaterThan(0),
    }
  }

  getRecipient = (): Recipient => {
    return getRecipient(this.props.navigation)
  }

  getVerificationStatus = () => {
    return getVerificationStatus(this.props.navigation, this.props.e164NumberToAddress)
  }

  getConfirmationInput = (type: TransactionTypes) => {
    const amount = this.getDollarsAmount()
    const recipient = this.getRecipient()
    // TODO (Rossy) Remove address field from some recipient types.
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
    const verificationStatus = this.getVerificationStatus()
    let confirmationInput: ConfirmationInput

    if (verificationStatus === VerificationStatus.VERIFIED) {
      confirmationInput = this.getConfirmationInput(TransactionTypes.SENT)
      CeloAnalytics.track(CustomEventNames.transaction_details, {
        recipientAddress: confirmationInput.recipientAddress,
      })
    } else {
      confirmationInput = this.getConfirmationInput(TransactionTypes.INVITE_SENT)
      CeloAnalytics.track(CustomEventNames.send_invite_details)
    }

    this.props.hideAlert()
    CeloAnalytics.track(CustomEventNames.send_continue)
    navigate(Screens.SendConfirmation, { confirmationInput })
  }

  onRequest = () => {
    CeloAnalytics.track(CustomEventNames.request_payment_continue)
    const confirmationInput = this.getConfirmationInput(TransactionTypes.PAY_REQUEST)
    navigate(Screens.PaymentRequestConfirmation, { confirmationInput })
  }

  renderButtons = (isAmountValid: boolean, isDollarBalanceSufficient: boolean) => {
    const { t } = this.props
    const { characterLimitExceeded } = this.state
    const verificationStatus = this.getVerificationStatus()

    const requestDisabled =
      !isAmountValid || verificationStatus !== VerificationStatus.VERIFIED || characterLimitExceeded
    const sendDisabled =
      !isAmountValid ||
      !isDollarBalanceSufficient ||
      characterLimitExceeded ||
      verificationStatus === VerificationStatus.UNKNOWN

    const separatorContainerStyle =
      sendDisabled && requestDisabled
        ? style.separatorContainerInactive
        : style.separatorContainerActive
    const separatorStyle =
      sendDisabled && requestDisabled ? style.buttonSeparatorInactive : style.buttonSeparatorActive

    return (
      <View style={[componentStyles.bottomContainer, style.buttonContainer]}>
        {verificationStatus !== VerificationStatus.UNVERIFIED && (
          <View style={style.button}>
            <Button
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
            onPress={this.onSend}
            text={verificationStatus === VerificationStatus.VERIFIED ? t('send') : t('invite')}
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
    const { isAmountValid, isDollarBalanceSufficient } = this.isAmountValid()

    const onPress = () => {
      if (!isAmountValid) {
        this.props.showError(ErrorMessages.INVALID_AMOUNT)
        return
      }

      if (!isDollarBalanceSufficient) {
        this.props.showError(ErrorMessages.NSF_DOLLARS)
        return
      }
    }

    if (!isAmountValid) {
      return (
        <TouchableWithoutFeedback onPress={onPress}>
          {this.renderButtons(false, isDollarBalanceSufficient)}
        </TouchableWithoutFeedback>
      )
    }
    return this.renderButtons(true, isDollarBalanceSufficient)
  }

  render() {
    const { t, feeType, estimateFeeDollars, localCurrencyCode } = this.props
    const newAccountBalance = this.getNewAccountBalance()
    const recipient = this.getRecipient()
    const verificationStatus = this.getVerificationStatus()

    return (
      <View style={style.body}>
        {feeType && <EstimateFee feeType={feeType} />}
        <KeyboardAwareScrollView keyboardShouldPersistTaps="always">
          <DisconnectBanner />
          <Avatar
            name={recipient.displayName}
            recipient={recipient}
            e164Number={recipient.e164PhoneNumber}
            address={recipient.address}
          />
          <View style={style.inviteDescription}>
            <LoadingLabel
              isLoading={verificationStatus === VerificationStatus.UNKNOWN}
              loadingLabelText={t('loadingVerificationStatus')}
              labelText={
                verificationStatus === VerificationStatus.UNVERIFIED
                  ? t('inviteMoneyEscrow')
                  : undefined
              }
              labelTextStyle={fontStyles.center}
            />
          </View>
          <LabeledTextInput
            keyboardType="numeric"
            title={localCurrencyCode ? localCurrencyCode : CURRENCIES[CURRENCY_ENUM.DOLLAR].symbol}
            placeholder={t('amount')}
            labelStyle={style.amountLabel as TextStyle}
            placeholderTextColor={colors.celoGreenInactive}
            autocorrect={false}
            value={this.state.amount}
            onChangeText={this.onAmountChanged}
            autoFocus={true}
            numberOfDecimals={NUMBER_INPUT_MAX_DECIMALS}
            validator={ValidatorKind.Decimal}
            lng={this.props.lng}
          />
          <LabeledTextInput
            keyboardType="default"
            title={t('for')}
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
              valueText={getFeeDisplayValue(estimateFeeDollars)}
              valueTextStyle={fontStyles.semiBold}
            />
            <View style={style.balanceContainer}>
              <Text style={fontStyles.bodySmall}>{t('newAccountBalance')}</Text>
              <Text
                style={[
                  fontStyles.bodySmall,
                  fontStyles.semiBold,
                  { color: getBalanceColor(newAccountBalance) },
                ]}
              >
                {getMoneyDisplayValue(newAccountBalance)}
              </Text>
            </View>
          </View>
        </KeyboardAwareScrollView>
        {this.renderBottomContainer()}
      </View>
    )
  }
}

const style = StyleSheet.create({
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
  balanceContainer: {
    marginTop: 7,
    marginBottom: 15,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
})

export default componentWithAnalytics(
  connect<StateProps, DispatchProps, OwnProps, RootState>(
    mapStateToProps,
    {
      fetchDollarBalance,
      showError,
      hideAlert,
      showMessage,
      fetchPhoneAddresses,
    }
  )(withNamespaces(Namespaces.sendFlow7)(SendAmount))
)
