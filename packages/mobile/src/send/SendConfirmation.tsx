import ReviewFrame from '@celo/react-components/components/ReviewFrame'
import ReviewHeader from '@celo/react-components/components/ReviewHeader'
import colors from '@celo/react-components/styles/colors'
import { CURRENCY_ENUM } from '@celo/utils/src/currencies'
import BigNumber from 'bignumber.js'
import * as React from 'react'
import { WithTranslation } from 'react-i18next'
import { ActivityIndicator, StyleSheet, View } from 'react-native'
import Modal from 'react-native-modal'
import SafeAreaView from 'react-native-safe-area-view'
import { NavigationInjectedProps } from 'react-navigation'
import { connect } from 'react-redux'
import CeloAnalytics from 'src/analytics/CeloAnalytics'
import { CustomEventNames } from 'src/analytics/constants'
import componentWithAnalytics from 'src/analytics/wrapper'
import InviteOptionsModal from 'src/components/InviteOptionsModal'
import { FeeType } from 'src/fees/actions'
import CalculateFee, {
  CalculateFeeChildren,
  PropsWithoutChildren as CalculateFeeProps,
} from 'src/fees/CalculateFee'
import { getFeeDollars } from 'src/fees/selectors'
import i18n, { Namespaces, withTranslation } from 'src/i18n'
import { InviteBy } from 'src/invite/actions'
import { navigateBack } from 'src/navigator/NavigationService'
import { Recipient } from 'src/recipients/recipient'
import { RootState } from 'src/redux/reducers'
import { isAppConnected } from 'src/redux/selectors'
import { sendPaymentOrInvite } from 'src/send/actions'
import TransferReviewCard from 'src/send/TransferReviewCard'
import DisconnectBanner from 'src/shared/DisconnectBanner'
import { fetchDollarBalance } from 'src/stableToken/actions'
import { TransactionTypes } from 'src/transactions/reducer'
import { currentAccountSelector } from 'src/web3/selectors'

export interface ConfirmationInput {
  recipient: Recipient
  amount: BigNumber
  reason: string
  recipientAddress?: string | null
  type: TransactionTypes
}

interface StateProps {
  account: string | null
  isSending: boolean
  defaultCountryCode: string
  dollarBalance: string
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
    account: currentAccountSelector(state),
    isSending: state.send.isSending,
    defaultCountryCode: state.account.defaultCountryCode,
    dollarBalance: state.stableToken.balance || '0',
    appConnected: isAppConnected(state),
  }
}

interface State {
  modalVisible: boolean
  buttonReset: boolean
}

type Props = NavigationInjectedProps & DispatchProps & StateProps & WithTranslation

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
    confirmationInput.amount = new BigNumber(confirmationInput.amount)
    return confirmationInput
  }

  onSendClick = () => {
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

  onEditClick = () => {
    CeloAnalytics.track(CustomEventNames.edit_dollar_confirm)
    const { onCancel } = this.getNavParams()
    if (onCancel) {
      onCancel()
    }
    navigateBack()
  }

  renderHeader = () => {
    const { t } = this.props
    const { type } = this.getConfirmationInput()
    let title

    if (type === TransactionTypes.PAY_REQUEST) {
      title = t('payRequest')
    } else if (type === TransactionTypes.INVITE_SENT) {
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

  renderWithAsyncFee: CalculateFeeChildren = (asyncFee) => {
    const { t, appConnected, isSending, dollarBalance } = this.props
    const { amount, reason, recipient, recipientAddress, type } = this.getConfirmationInput()

    const fee = getFeeDollars(asyncFee.result)
    const amountWithFee = amount.plus(fee || 0)
    const userHasEnough = !asyncFee.loading && amountWithFee.isLessThanOrEqualTo(dollarBalance)
    const isPrimaryButtonDisabled = isSending || !userHasEnough || !appConnected || !!asyncFee.error

    let primaryBtnInfo
    let secondaryBtnInfo
    if (type === TransactionTypes.PAY_REQUEST) {
      primaryBtnInfo = {
        action: this.sendOrInvite,
        text: i18n.t('global:pay'),
        disabled: isPrimaryButtonDisabled,
      }
      secondaryBtnInfo = {
        action: this.onEditClick,
        text: i18n.t('global:decline'),
        disabled: isSending,
      }
    } else {
      primaryBtnInfo = {
        action: this.onSendClick,
        text: t('send'),
        disabled: isPrimaryButtonDisabled,
      }
      secondaryBtnInfo = { action: this.onEditClick, text: t('edit'), disabled: isSending }
    }

    return (
      <SafeAreaView style={styles.container}>
        <DisconnectBanner />
        <ReviewFrame
          HeaderComponent={this.renderHeader}
          FooterComponent={this.renderFooter}
          confirmButton={primaryBtnInfo}
          modifyButton={secondaryBtnInfo}
          shouldReset={this.state.buttonReset}
        >
          <TransferReviewCard
            recipient={recipient}
            address={recipientAddress || ''}
            e164PhoneNumber={recipient.e164PhoneNumber}
            comment={reason}
            value={amount}
            currency={CURRENCY_ENUM.DOLLAR} // User can only send in Dollars
            fee={fee}
            isLoadingFee={asyncFee.loading}
            feeError={asyncFee.error}
            type={type}
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
      </SafeAreaView>
    )
  }

  render() {
    const { account } = this.props
    if (!account) {
      throw Error('Account is required')
    }

    const { amount, reason, recipientAddress } = this.getConfirmationInput()

    const feeProps: CalculateFeeProps = recipientAddress
      ? { feeType: FeeType.SEND, account, recipientAddress, amount, comment: reason }
      : { feeType: FeeType.INVITE, account, amount, comment: reason }

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
  )(withTranslation(Namespaces.sendFlow7)(SendConfirmation))
)
