import ReviewFrame from '@celo/react-components/components/ReviewFrame'
import ReviewHeader from '@celo/react-components/components/ReviewHeader'
import TextButton from '@celo/react-components/components/TextButton.v2'
import colors from '@celo/react-components/styles/colors.v2'
import fontStyles from '@celo/react-components/styles/fonts.v2'
import { componentStyles } from '@celo/react-components/styles/styles'
import { CURRENCIES, CURRENCY_ENUM } from '@celo/utils/src/currencies'
import { StackScreenProps } from '@react-navigation/stack'
import { TFunction } from 'i18next'
import * as React from 'react'
import { WithTranslation } from 'react-i18next'
import {
  Keyboard,
  NativeSyntheticEvent,
  StyleSheet,
  Text,
  TextInput,
  TextInputKeyPressEventData,
  View,
} from 'react-native'
import SafeAreaView from 'react-native-safe-area-view'
import { connect } from 'react-redux'
import CeloAnalytics from 'src/analytics/CeloAnalytics'
import { CustomEventNames } from 'src/analytics/constants'
import { TokenTransactionType } from 'src/apollo/types'
import ContactCircle from 'src/components/ContactCircle.v2'
import CurrencyDisplay, { DisplayType, FormatType } from 'src/components/CurrencyDisplay.v2'
import FeeIcon from 'src/components/FeeIcon'
import LineItemRow from 'src/components/LineItemRow.v2'
import TotalLineItem from 'src/components/TotalLineItem'
import { MAX_COMMENT_LENGTH } from 'src/config'
import { FeeType } from 'src/fees/actions'
import CalculateFee, {
  CalculateFeeChildren,
  PropsWithoutChildren as CalculateFeeProps,
} from 'src/fees/CalculateFee'
import { getFeeDollars } from 'src/fees/selectors'
import { completePaymentRequest, declinePaymentRequest } from 'src/firebase/actions'
import i18n, { Namespaces, withTranslation } from 'src/i18n'
import { AddressValidationType } from 'src/identity/reducer'
import { getAddressValidationType, getSecureSendAddress } from 'src/identity/secureSend'
import { InviteBy } from 'src/invite/actions'
import { getInvitationVerificationFeeInDollars } from 'src/invite/saga'
import { navigate, navigateBack } from 'src/navigator/NavigationService'
import { Screens } from 'src/navigator/Screens'
import { StackParamList } from 'src/navigator/types'
import { getRecipientThumbnail, Recipient } from 'src/recipients/recipient'
import { RootState } from 'src/redux/reducers'
import { isAppConnected } from 'src/redux/selectors'
import { sendPaymentOrInvite } from 'src/send/actions'
import { TransactionDataInput } from 'src/send/SendAmount'
import { ConfirmationInput, getConfirmationInput } from 'src/send/utils'
import DisconnectBanner from 'src/shared/DisconnectBanner'
import { fetchDollarBalance } from 'src/stableToken/actions'
import Logger from 'src/utils/Logger'
import { currentAccountSelector } from 'src/web3/selectors'

interface StateProps {
  account: string | null
  isSending: boolean
  defaultCountryCode: string
  dollarBalance: string
  appConnected: boolean
  transactionData: TransactionDataInput
  confirmationInput: ConfirmationInput
  addressValidationType: AddressValidationType
  validatedRecipientAddress?: string
  addressJustValidated?: true
}

interface DispatchProps {
  sendPaymentOrInvite: typeof sendPaymentOrInvite
  fetchDollarBalance: typeof fetchDollarBalance
  declinePaymentRequest: typeof declinePaymentRequest
  completePaymentRequest: typeof completePaymentRequest
}

interface State {
  modalVisible: boolean
  buttonReset: boolean
  reason: string
  newReason: string
}

type OwnProps = StackScreenProps<StackParamList, Screens.SendConfirmation>
type Props = DispatchProps & StateProps & WithTranslation & OwnProps

const mapDispatchToProps = {
  sendPaymentOrInvite,
  fetchDollarBalance,
  declinePaymentRequest,
  completePaymentRequest,
}

interface DisplayNameProps {
  recipient: Recipient
  recipientAddress?: string | null
  t: TFunction
}

function getDisplayName({ recipient, recipientAddress, t }: DisplayNameProps) {
  const { displayName, e164PhoneNumber } = recipient
  if (displayName) {
    return displayName
  }
  if (e164PhoneNumber) {
    return e164PhoneNumber
  }
  if (recipientAddress) {
    return recipientAddress
  }
  // Rare but possible, such as when a user skips onboarding flow (in dev mode) and then views their own avatar
  return t('global:unknown')
}

const mapStateToProps = (state: RootState, ownProps: OwnProps): StateProps => {
  const { route } = ownProps
  const { transactionData, addressJustValidated } = route.params
  const { e164NumberToAddress } = state.identity
  const { secureSendPhoneNumberMapping } = state.identity
  const confirmationInput = getConfirmationInput(
    transactionData,
    e164NumberToAddress,
    secureSendPhoneNumberMapping
  )
  const { recipient } = transactionData
  const addressValidationType = getAddressValidationType(recipient, secureSendPhoneNumberMapping)
  // Undefined or null means no addresses ever validated through secure send
  const validatedRecipientAddress = getSecureSendAddress(recipient, secureSendPhoneNumberMapping)

  return {
    account: currentAccountSelector(state),
    isSending: state.send.isSending,
    defaultCountryCode: state.account.defaultCountryCode,
    dollarBalance: state.stableToken.balance || '0',
    appConnected: isAppConnected(state),
    transactionData,
    confirmationInput,
    addressValidationType,
    validatedRecipientAddress,
    addressJustValidated,
  }
}

export class SendConfirmation extends React.Component<Props, State> {
  static navigationOptions = { header: null }

  state = {
    modalVisible: false,
    buttonReset: false,
    reason: '',
    newReason: '',
  }

  async componentDidMount() {
    const { addressJustValidated, t } = this.props
    this.props.fetchDollarBalance()

    if (addressJustValidated) {
      Logger.showMessage(t('sendFlow7:addressConfirmed'))
    }
  }

  onSendClick = () => {
    const { recipientAddress } = this.props.confirmationInput
    if (recipientAddress) {
      this.sendOrInvite()
    } else {
      this.showModal()
    }
  }

  sendOrInvite = (inviteMethod?: InviteBy) => {
    const {
      amount,
      recipient,
      recipientAddress,
      firebasePendingRequestUid,
    } = this.props.confirmationInput
    const { reason } = this.state

    const timestamp = Date.now()

    this.props.sendPaymentOrInvite(
      amount,
      timestamp,
      reason,
      recipient,
      recipientAddress,
      inviteMethod,
      firebasePendingRequestUid
    )
  }

  onKeyDown = (e: NativeSyntheticEvent<TextInputKeyPressEventData>) => {
    if (e.nativeEvent.key === 'Enter') {
      Keyboard.dismiss()
    }
  }

  // Erase the "enter" keystroke from the comment
  cleanInput = () => {
    const reason = this.state.reason.replace('\n', '')
    this.setState({ reason })
  }

  onEditAddressClick = () => {
    const { transactionData, addressValidationType } = this.props
    navigate(Screens.ValidateRecipientIntro, {
      transactionData,
      addressValidationType,
    })
  }

  onEditClick = () => {
    CeloAnalytics.track(CustomEventNames.edit_dollar_confirm)
    navigateBack()
  }

  onCancelClick = () => {
    const { firebasePendingRequestUid } = this.props.confirmationInput
    if (firebasePendingRequestUid) {
      this.props.declinePaymentRequest(firebasePendingRequestUid)
    }
    Logger.showMessage(this.props.t('paymentRequestFlow:requestDeclined'))
    navigateBack()
  }

  renderHeader = () => {
    const { t } = this.props
    const { type } = this.props.confirmationInput
    let title

    if (type === TokenTransactionType.PayRequest) {
      title = t('payRequest')
    } else if (type === TokenTransactionType.InviteSent) {
      title = t('inviteVerifyPayment')
    } else {
      title = t('reviewPayment')
    }

    return <ReviewHeader title={title} />
  }

  showModal = () => {
    this.setState({ modalVisible: true })
  }

  hideModal = () => {
    this.setState({ modalVisible: false })
  }

  cancelModal = () => {
    this.setState({ modalVisible: false, buttonReset: true }, () => {
      this.setState({ buttonReset: false })
    })
  }

  sendWhatsApp = () => {
    this.hideModal()
    this.sendOrInvite(InviteBy.WhatsApp)
  }

  sendSMS = () => {
    this.hideModal()
    this.sendOrInvite(InviteBy.SMS)
  }

  onReasonChanged = (reason: string) => {
    this.setState({ reason })
  }

  renderWithAsyncFee: CalculateFeeChildren = (asyncFee) => {
    const {
      t,
      appConnected,
      isSending,
      dollarBalance,
      confirmationInput,
      validatedRecipientAddress,
    } = this.props
    const { amount, recipient, recipientAddress, type } = confirmationInput

    const fee = getFeeDollars(asyncFee.result)
    const amountWithFee = amount.plus(fee || 0)
    const userHasEnough = !asyncFee.loading && amountWithFee.isLessThanOrEqualTo(dollarBalance)
    const isPrimaryButtonDisabled = isSending || !userHasEnough || !appConnected || !!asyncFee.error

    const inviteFee = getInvitationVerificationFeeInDollars()
    const inviteFeeAmount = {
      value: inviteFee,
      currencyCode: CURRENCIES[CURRENCY_ENUM.DOLLAR].code,
    }

    const subtotalAmount = amount.isGreaterThan(0) && {
      value: amount,
      currencyCode: CURRENCIES[CURRENCY_ENUM.DOLLAR].code,
    }

    let primaryBtnInfo
    if (type === TokenTransactionType.PayRequest) {
      primaryBtnInfo = {
        action: this.sendOrInvite,
        text: i18n.t('global:pay'),
        disabled: isPrimaryButtonDisabled,
      }
    } else {
      primaryBtnInfo = {
        action: this.onSendClick,
        text: t('send'),
        disabled: isPrimaryButtonDisabled,
      }
    }

    const renderFeeContainer = () => {
      const isInvite = type === TokenTransactionType.InviteSent

      // 'fee' already contains the invitation fee for invites
      // so we adjust it here
      const securityFee = isInvite && fee ? fee.minus(inviteFee) : fee

      const securityFeeAmount = securityFee && {
        value: securityFee,
        currencyCode: CURRENCIES[CURRENCY_ENUM.DOLLAR].code,
      }

      const totalAmount = {
        value: amountWithFee,
        currencyCode: CURRENCIES[CURRENCY_ENUM.DOLLAR].code,
      }

      // Replace fee lines with a fee drawer
      return (
        <View>
          {subtotalAmount && (
            <LineItemRow
              title={t('global:subtotal')}
              amount={<CurrencyDisplay amount={subtotalAmount} />}
            />
          )}
          {isInvite && (
            <LineItemRow
              title={t('inviteFee')}
              amount={<CurrencyDisplay amount={inviteFeeAmount} />}
            />
          )}
          <LineItemRow
            title={t('securityFee')}
            titleIcon={<FeeIcon />}
            amount={
              securityFeeAmount && (
                <CurrencyDisplay amount={securityFeeAmount} formatType={FormatType.Fee} />
              )
            }
            isLoading={asyncFee.loading}
            hasError={!!asyncFee.error}
          />
          {/* <HorizontalLine /> */}
          <TotalLineItem amount={totalAmount} />
        </View>
      )
    }

    return (
      <SafeAreaView style={styles.container}>
        <DisconnectBanner />
        <ReviewFrame
          FooterComponent={renderFeeContainer}
          confirmButton={primaryBtnInfo}
          shouldReset={this.state.buttonReset}
          isSending={this.props.isSending}
        >
          <View style={styles.transferContainer}>
            <View style={styles.headerContainer}>
              <ContactCircle
                thumbnailPath={getRecipientThumbnail(recipient)}
                address={recipientAddress || ''}
              />
              <View style={styles.recipientInfoContainer}>
                <Text style={styles.headerText}>Sending</Text>
                <Text style={styles.displayName}>
                  {getDisplayName({ recipient, recipientAddress, t })}
                </Text>
                {validatedRecipientAddress && (
                  <View style={styles.editContainer}>
                    <Text style={styles.address}>{`${validatedRecipientAddress.slice(
                      0,
                      6
                    )}...${validatedRecipientAddress.slice(-4)}`}</Text>
                    <TextButton
                      style={styles.editButton}
                      testID={'accountEditButton'}
                      onPress={this.onEditAddressClick}
                    >
                      {t('edit')}
                    </TextButton>
                  </View>
                )}
              </View>
            </View>
            <CurrencyDisplay
              type={DisplayType.Big}
              style={styles.amount}
              amount={subtotalAmount || inviteFeeAmount}
            />
            <TextInput
              style={styles.inputContainer}
              autoFocus={true}
              multiline={true}
              numberOfLines={5}
              maxLength={MAX_COMMENT_LENGTH}
              onChangeText={this.onReasonChanged}
              value={this.state.reason}
              placeholder={t('addDescription')}
              placeholderTextColor={colors.greenUI}
              returnKeyType="done"
              onKeyPress={this.onKeyDown}
              onBlur={this.cleanInput}
            />
          </View>
        </ReviewFrame>
      </SafeAreaView>
    )
  }

  render() {
    const { account, confirmationInput } = this.props
    if (!account) {
      throw Error('Account is required')
    }

    const { amount, recipientAddress } = confirmationInput

    const feeProps: CalculateFeeProps = recipientAddress
      ? { feeType: FeeType.SEND, account, recipientAddress, amount }
      : { feeType: FeeType.INVITE, account, amount }

    return (
      // Note: intentionally passing a new child func here otherwise
      // it doesn't re-render on state change since CalculateFee is a pure component
      <CalculateFee {...feeProps}>{(asyncFee) => this.renderWithAsyncFee(asyncFee)}</CalculateFee>
    )
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    padding: 8,
    flexDirection: 'column',
  },
  transferContainer: {
    flexDirection: 'column',
    alignItems: 'flex-start',
    paddingBottom: 25,
  },
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  recipientInfoContainer: {
    flexDirection: 'column',
    paddingLeft: 8,
  },
  headerText: {
    ...fontStyles.regular,
    color: colors.gray4,
  },
  displayName: {
    ...fontStyles.regular500,
  },
  modal: {
    flex: 1,
    margin: 0,
  },
  modalContainer: {
    justifyContent: 'flex-end',
    alignItems: 'stretch',
    flex: 1,
  },
  editContainer: {
    flexDirection: 'row',
  },
  address: {
    ...fontStyles.small,
    color: colors.gray5,
    paddingRight: 4,
  },
  editButton: {
    ...fontStyles.small,
    color: colors.gray5,
    textDecorationLine: 'underline',
  },
  inputContainer: {
    flex: 1,
    // Fixed height to increase surface area for input
    // to focus on press
    height: 200,
    alignSelf: 'stretch',
    ...fontStyles.large,
  },
  bottomContainer: {
    marginTop: 5,
    flexDirection: 'column',
    alignItems: 'stretch',
  },
  amount: {
    paddingVertical: 8,
  },
  comment: {
    ...componentStyles.paddingTop5,
    ...fontStyles.large,
    fontSize: 14,
    color: colors.darkSecondary,
    lineHeight: 18,
    textAlign: 'center',
  },
})

export default connect<StateProps, DispatchProps, OwnProps, RootState>(
  mapStateToProps,
  mapDispatchToProps
)(withTranslation(Namespaces.sendFlow7)(SendConfirmation))
