import ContactCircle from '@celo/react-components/components/ContactCircle'
import ReviewFrame from '@celo/react-components/components/ReviewFrame'
import ReviewHeader from '@celo/react-components/components/ReviewHeader'
import TextButton from '@celo/react-components/components/TextButton.v2'
import colors from '@celo/react-components/styles/colors.v2'
import fontStyles from '@celo/react-components/styles/fonts.v2'
import { CURRENCIES, CURRENCY_ENUM } from '@celo/utils/src/currencies'
import { StackScreenProps } from '@react-navigation/stack'
import * as React from 'react'
import { WithTranslation } from 'react-i18next'
import { StyleSheet, Text, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { connect } from 'react-redux'
import CeloAnalytics from 'src/analytics/CeloAnalytics'
import { CustomEventNames } from 'src/analytics/constants'
import { TokenTransactionType } from 'src/apollo/types'
import BackButton from 'src/components/BackButton.v2'
import CommentTextInput from 'src/components/CommentTextInput'
import CurrencyDisplay, { DisplayType } from 'src/components/CurrencyDisplay'
import FeeDrawer from 'src/components/FeeDrawer'
import InviteOptionsModal from 'src/components/InviteOptionsModal'
import ShortenedAddress from 'src/components/ShortenedAddress'
import TotalLineItem from 'src/components/TotalLineItem.v2'
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
import { LocalCurrencyCode } from 'src/localCurrency/consts'
import { convertDollarsToLocalAmount } from 'src/localCurrency/convert'
import { getLocalCurrencyCode, getLocalCurrencyExchangeRate } from 'src/localCurrency/selectors'
import { emptyHeader } from 'src/navigator/Headers.v2'
import { navigate } from 'src/navigator/NavigationService'
import { Screens } from 'src/navigator/Screens'
import { StackParamList } from 'src/navigator/types'
import { getDisplayName, getRecipientThumbnail } from 'src/recipients/recipient'
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
  defaultCountryCode: string | null
  dollarBalance: string
  appConnected: boolean
  transactionData: TransactionDataInput
  confirmationInput: ConfirmationInput
  addressValidationType: AddressValidationType
  validatedRecipientAddress?: string
  addressJustValidated?: boolean
  localCurrencyCode: LocalCurrencyCode
  localCurrencyExchangeRate?: string | null
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
  comment: string
}

type OwnProps = StackScreenProps<StackParamList, Screens.SendConfirmation>
type Props = DispatchProps & StateProps & WithTranslation & OwnProps

const mapDispatchToProps = {
  sendPaymentOrInvite,
  fetchDollarBalance,
  declinePaymentRequest,
  completePaymentRequest,
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
  const localCurrencyCode = getLocalCurrencyCode(state)
  const localCurrencyExchangeRate = getLocalCurrencyExchangeRate(state)

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
    localCurrencyCode,
    localCurrencyExchangeRate,
  }
}

export const sendConfirmationScreenNavOptions = () => ({
  ...emptyHeader,
  headerLeft: () => <BackButton eventName={CustomEventNames.send_confirm_back} />,
})

export class SendConfirmation extends React.Component<Props, State> {
  state = {
    modalVisible: false,
    buttonReset: false,
    comment: '',
  }

  componentDidMount() {
    const { addressJustValidated, t } = this.props
    this.props.fetchDollarBalance()

    if (addressJustValidated) {
      Logger.showMessage(t('sendFlow7:addressConfirmed'))
    }
  }

  onSendClick = () => {
    const { type } = this.props.confirmationInput
    if (type === TokenTransactionType.InviteSent) {
      this.showInviteModal()
    } else {
      this.sendOrInvite()
    }
  }

  sendOrInvite = (inviteMethod?: InviteBy) => {
    const {
      amount,
      recipient,
      recipientAddress,
      firebasePendingRequestUid,
    } = this.props.confirmationInput
    const { comment } = this.state

    const timestamp = Date.now()

    CeloAnalytics.track(CustomEventNames.send_confirm, {
      method: this.props.route.params?.isFromScan ? 'scan' : 'search',
      localCurrencyExchangeRate: this.props.localCurrencyExchangeRate,
      localCurrency: this.props.localCurrencyCode,
      dollarAmount: amount,
      localCurrencyAmount: convertDollarsToLocalAmount(
        amount,
        this.props.localCurrencyExchangeRate
      ),
      isInvite: !recipientAddress,
    })

    this.props.sendPaymentOrInvite(
      amount,
      timestamp,
      comment,
      recipient,
      recipientAddress,
      inviteMethod,
      firebasePendingRequestUid
    )
  }

  onEditAddressClick = () => {
    const { transactionData, addressValidationType } = this.props
    CeloAnalytics.track(CustomEventNames.send_secure_edit)
    navigate(Screens.ValidateRecipientIntro, {
      transactionData,
      addressValidationType,
    })
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

  showInviteModal = () => {
    this.setState({ modalVisible: true })
  }

  hideInviteModal = () => {
    this.setState({ modalVisible: false })
  }

  cancelModal = () => {
    this.setState({ modalVisible: false, buttonReset: true }, () => {
      this.setState({ buttonReset: false })
    })
  }

  sendWhatsApp = () => {
    this.hideInviteModal()
    this.sendOrInvite(InviteBy.WhatsApp)
  }

  sendSMS = () => {
    this.hideInviteModal()
    this.sendOrInvite(InviteBy.SMS)
  }

  onCommentChange = (comment: string) => {
    this.setState({ comment })
  }

  onBlur = () => {
    const comment = this.state.comment.trim()
    this.setState({ comment })
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
    const { amount, recipient, recipientAddress, type, reason } = confirmationInput

    const fee = getFeeDollars(asyncFee.result)
    const amountWithFee = amount.plus(fee || 0)
    const userHasEnough = !asyncFee.loading && amountWithFee.isLessThanOrEqualTo(dollarBalance)
    const isPrimaryButtonDisabled = isSending || !userHasEnough || !appConnected || !!asyncFee.error

    const isInvite = type === TokenTransactionType.InviteSent
    const inviteFee = getInvitationVerificationFeeInDollars()

    const subtotalAmount = {
      value: amount || inviteFee,
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
        text: t('global:send'),
        disabled: isPrimaryButtonDisabled,
      }
    }

    const paymentRequestComment = reason || ''

    const renderFeeContainer = () => {
      // 'fee' already contains the invitation fee for invites
      // so we adjust it here
      const securityFee = isInvite && fee ? fee.minus(inviteFee) : fee

      CeloAnalytics.track(CustomEventNames.fee_rendered, { feeType: 'Security', fee: securityFee })
      const totalAmount = {
        value: amountWithFee,
        currencyCode: CURRENCIES[CURRENCY_ENUM.DOLLAR].code,
      }

      return (
        <View style={styles.feeContainer}>
          <FeeDrawer
            testID={'feeDrawer/SendConfirmation'}
            isEstimate={true}
            currency={CURRENCY_ENUM.DOLLAR}
            inviteFee={inviteFee}
            isInvite={isInvite}
            securityFee={securityFee}
            feeLoading={asyncFee.loading}
            feeHasError={!!asyncFee.error}
            totalFee={fee}
          />
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
            {isInvite && <Text style={styles.inviteText}>{t('inviteMoneyEscrow')}</Text>}
            <View style={styles.headerContainer}>
              <ContactCircle
                name={this.props.transactionData.recipient.displayName}
                thumbnailPath={getRecipientThumbnail(recipient)}
                address={recipientAddress || ''}
              />
              <View style={styles.recipientInfoContainer}>
                <Text style={styles.headerText} testID="HeaderText">
                  {t('sending')}
                </Text>
                <Text style={styles.displayName}>
                  {getDisplayName({ recipient, recipientAddress, t })}
                </Text>
                {validatedRecipientAddress && (
                  <View style={styles.editContainer}>
                    <ShortenedAddress style={styles.address} address={validatedRecipientAddress} />
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
              type={DisplayType.Default}
              style={styles.amount}
              amount={subtotalAmount}
            />
            {type === TokenTransactionType.PayRequest ? (
              <View>
                <Text style={styles.paymentRequestComment}>{paymentRequestComment}</Text>
              </View>
            ) : (
              <CommentTextInput
                testID={'send'}
                onCommentChange={this.onCommentChange}
                comment={this.state.comment}
                onBlur={this.onBlur}
              />
            )}
          </View>
          <InviteOptionsModal
            isVisible={this.state.modalVisible}
            onWhatsApp={this.sendWhatsApp}
            onSMS={this.sendSMS}
            onCancel={this.cancelModal}
          />
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
    backgroundColor: colors.light,
    padding: 8,
  },
  feeContainer: {
    padding: 16,
    paddingBottom: 8,
  },
  inviteText: {
    ...fontStyles.small,
    color: colors.gray4,
    paddingBottom: 24,
  },
  transferContainer: {
    alignItems: 'flex-start',
    paddingBottom: 24,
  },
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  recipientInfoContainer: {
    paddingLeft: 8,
  },
  headerText: {
    ...fontStyles.regular,
    color: colors.gray4,
  },
  displayName: {
    ...fontStyles.regular500,
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
  amount: {
    paddingVertical: 8,
    ...fontStyles.largeNumber,
  },
  paymentRequestComment: {
    ...fontStyles.large,
    color: colors.gray5,
  },
})

export default connect<StateProps, DispatchProps, OwnProps, RootState>(
  mapStateToProps,
  mapDispatchToProps
)(withTranslation<Props>(Namespaces.sendFlow7)(SendConfirmation))
