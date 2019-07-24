import ReviewFrame from '@celo/react-components/components/ReviewFrame'
import ReviewHeader from '@celo/react-components/components/ReviewHeader'
import colors from '@celo/react-components/styles/colors'
import { CURRENCY_ENUM } from '@celo/utils/src/currencies'
import BigNumber from 'bignumber.js'
import * as React from 'react'
import { withNamespaces, WithNamespaces } from 'react-i18next'
import { ActivityIndicator, StyleSheet, View } from 'react-native'
import Modal from 'react-native-modal'
import { NavigationInjectedProps } from 'react-navigation'
import { connect } from 'react-redux'
import CeloAnalytics from 'src/analytics/CeloAnalytics'
import { CustomEventNames } from 'src/analytics/constants'
import componentWithAnalytics from 'src/analytics/wrapper'
import InviteOptionsModal from 'src/components/InviteOptionsModal'
import i18n from 'src/i18n'
import { InviteBy } from 'src/invite/actions'
import { navigateBack } from 'src/navigator/NavigationService'
import { RootState } from 'src/redux/reducers'
import { isAppConnected } from 'src/redux/selectors'
import { sendPaymentOrInvite } from 'src/send/actions'
import { getSuggestedFeeDollars } from 'src/send/selectors'
import TransferConfirmationCard from 'src/send/TransferConfirmationCard'
import DisconnectBanner from 'src/shared/DisconnectBanner'
import { fetchDollarBalance } from 'src/stableToken/actions'
import { TransactionTypes } from 'src/transactions/reducer'
import { Recipient } from 'src/utils/recipient'

const numeral = require('numeral')

export interface ConfirmationInput {
  recipient: Recipient
  amount: BigNumber
  reason: string
  recipientAddress?: string | null
  fee: BigNumber
}
interface StateProps {
  isSending: boolean
  defaultCountryCode: string
  dollarBalance: BigNumber
  suggestedFeeDollars: BigNumber
  appConnected: boolean
}

interface DispatchProps {
  sendPaymentOrInvite: typeof sendPaymentOrInvite
  fetchDollarBalance: typeof fetchDollarBalance
}

const mapDispatchToProps = {
  sendPaymentOrInvite,
  fetchDollarBalance,
}

const mapStateToProps = (state: RootState): StateProps => {
  return {
    isSending: state.send.isSending,
    defaultCountryCode: state.account.defaultCountryCode,
    dollarBalance: new BigNumber(state.stableToken.balance || 0),
    suggestedFeeDollars: getSuggestedFeeDollars(state),
    appConnected: isAppConnected(state),
  }
}

interface State {
  modalVisible: boolean
  buttonReset: boolean
}

type Props = NavigationInjectedProps & DispatchProps & StateProps & WithNamespaces

class SendConfirmation extends React.Component<Props, State> {
  static navigationOptions = { header: null }

  state = {
    modalVisible: false,
    buttonReset: false,
  }

  async componentDidMount() {
    this.props.fetchDollarBalance()
  }

  getNavParams = () => {
    return this.props.navigation.state.params || {}
  }

  getConfirmationInput(): ConfirmationInput {
    const confirmationInput = this.props.navigation.getParam('confirmationInput', '')
    if (confirmationInput === '') {
      throw new Error('Confirmation input missing')
    }
    return confirmationInput
  }

  onSendButtonClick = () => {
    const { recipientAddress } = this.getConfirmationInput()
    if (recipientAddress) {
      this.sendOrInvite()
    } else {
      this.showModal()
    }
  }

  sendOrInvite = (inviteMethod?: InviteBy) => {
    const { amount, reason, recipient, recipientAddress } = this.getConfirmationInput()
    const { onConfirm } = this.getNavParams()

    this.props.sendPaymentOrInvite(
      amount,
      reason,
      recipient,
      recipientAddress,
      inviteMethod,
      onConfirm
    )
  }

  onPressEdit = () => {
    const { onCancel } = this.getNavParams()

    this.getConfirmationInput().recipientAddress
      ? CeloAnalytics.track(CustomEventNames.edit_dollar_confirm)
      : CeloAnalytics.track(CustomEventNames.edit_send_invite)
    if (onCancel) {
      onCancel()
    } else {
      navigateBack()
    }
  }

  renderHeader = () => {
    const { isPaymentRequest } = this.getNavParams()
    const { t } = this.props
    const { recipientAddress } = this.getConfirmationInput()
    const showInvite = !recipientAddress
    let title

    if (isPaymentRequest) {
      title = t('payRequest')
    } else if (showInvite) {
      title = t('inviteVerifyPayment')
    } else {
      title = t('reviewPayment')
    }

    return <ReviewHeader title={title} />
  }

  renderFooter = () => {
    return this.props.isSending ? <ActivityIndicator size="large" color={colors.celoGreen} /> : null
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

  render() {
    const { t, appConnected, isSending } = this.props
    const { amount, reason, recipient, recipientAddress, fee } = this.getConfirmationInput()

    const currentBalance = this.props.dollarBalance
    const amountWithFees = new BigNumber(numeral(amount).value()).plus(
      this.props.suggestedFeeDollars
    )
    const userHasEnough = amountWithFees.isLessThanOrEqualTo(currentBalance)
    const { isPaymentRequest } = this.getNavParams()
    let primaryBtnInfo = {
      action: this.onSendButtonClick,
      text: t('send'),
      disabled: isSending || !userHasEnough || !appConnected,
    }
    let secondaryBtnInfo = { action: this.onPressEdit, text: t('edit'), disabled: isSending }
    if (isPaymentRequest) {
      primaryBtnInfo = {
        action: this.sendOrInvite,
        text: i18n.t('paymentRequestFlow:pay'),
        disabled: isSending || !userHasEnough || !appConnected,
      }
      secondaryBtnInfo = {
        action: this.onPressEdit,
        text: i18n.t('paymentRequestFlow:decline'),
        disabled: isSending,
      }
    }
    return (
      <View style={styles.container}>
        <DisconnectBanner />
        <ReviewFrame
          HeaderComponent={this.renderHeader}
          FooterComponent={this.renderFooter}
          confirmButton={primaryBtnInfo}
          modifyButton={secondaryBtnInfo}
          shouldReset={this.state.buttonReset}
        >
          <TransferConfirmationCard
            recipient={recipient}
            address={recipientAddress || ''}
            e164PhoneNumber={recipient.e164PhoneNumber}
            comment={reason}
            value={amount}
            currency={CURRENCY_ENUM.DOLLAR} // User can only send in Dollars
            fee={fee}
            type={isPaymentRequest && TransactionTypes.PAY_REQUEST}
            dollarBalance={this.props.dollarBalance}
          />
          <Modal
            isVisible={this.state.modalVisible}
            style={styles.modal}
            useNativeDriver={true}
            hideModalContentWhileAnimating={true}
            onBackButtonPress={this.cancelModal}
          >
            <View style={styles.modalContainer}>
              <InviteOptionsModal
                onWhatsApp={this.sendWhatsApp}
                onSMS={this.sendSMS}
                onCancel={this.cancelModal}
                cancelText={t('cancel')}
                SMSText={t('inviteFlow11:inviteWithSMS')}
                whatsAppText={t('inviteFlow11:inviteWithWhatsapp')}
                margin={15}
              />
            </View>
          </Modal>
        </ReviewFrame>
      </View>
    )
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    paddingTop: 20,
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
})

export default componentWithAnalytics(
  connect<StateProps, DispatchProps, {}, RootState>(
    mapStateToProps,
    mapDispatchToProps
  )(withNamespaces('sendFlow7')(SendConfirmation))
)
