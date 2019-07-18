import ReviewFrame from '@celo/react-components/components/ReviewFrame'
import ReviewHeader from '@celo/react-components/components/ReviewHeader'
import colors from '@celo/react-components/styles/colors'
import { CURRENCY_ENUM } from '@celo/utils/src/currencies'
import BigNumber from 'bignumber.js'
import * as React from 'react'
import { withNamespaces, WithNamespaces } from 'react-i18next'
import { StyleSheet, View } from 'react-native'
import { NavigationInjectedProps } from 'react-navigation'
import { connect } from 'react-redux'
import { PaymentRequestStatuses } from 'src/account'
import { showError } from 'src/alert/actions'
import CeloAnalytics from 'src/analytics/CeloAnalytics'
import { CustomEventNames } from 'src/analytics/constants'
import componentWithAnalytics from 'src/analytics/wrapper'
import { ErrorMessages } from 'src/app/ErrorMessages'
import { ERROR_BANNER_DURATION } from 'src/config'
import { writePaymentRequest } from 'src/firebase/firebase'
import { currencyToShortMap } from 'src/geth/consts'
import { navigate, navigateBack } from 'src/navigator/NavigationService'
import { Screens } from 'src/navigator/Screens'
import { RootState } from 'src/redux/reducers'
import TransferConfirmationCard from 'src/send/TransferConfirmationCard'
import DisconnectBanner from 'src/shared/DisconnectBanner'
import { TransactionTypes } from 'src/transactions/reducer'
import Logger from 'src/utils/Logger'
import { Recipient } from 'src/utils/recipient'
import { currentAccountSelector } from 'src/web3/selectors'

const TAG = 'send/RequestConfirmation'

export interface ConfirmationInput {
  recipient: Recipient
  amount: BigNumber
  reason: string
  recipientAddress: string
}

interface StateProps {
  e164PhoneNumber: string
  account: string | null
}

interface DispatchProps {
  writePaymentRequest: typeof writePaymentRequest
  showError: typeof showError
}

const mapDispatchToProps = {
  writePaymentRequest,
  showError,
}

const mapStateToProps = (state: RootState): StateProps => {
  return {
    e164PhoneNumber: state.account.e164PhoneNumber,
    account: currentAccountSelector(state),
  }
}

type Props = NavigationInjectedProps & DispatchProps & StateProps & WithNamespaces

class RequestConfirmation extends React.Component<Props> {
  static navigationOptions = { header: null }

  getConfirmationInput(): ConfirmationInput {
    const confirmationInput = this.props.navigation.getParam('confirmationInput', '')
    if (confirmationInput === '') {
      throw new Error('Confirmation input missing')
    }
    return confirmationInput
  }

  onConfirm = async () => {
    const {
      amount,
      reason,
      recipient,
      recipientAddress: requesteeAddress,
    } = this.getConfirmationInput()
    CeloAnalytics.track(CustomEventNames.request_payment_request, {
      requesteeAddress,
    })

    const { t } = this.props
    if (!recipient || !recipient.e164PhoneNumber) {
      throw new Error("Can't request from recipient without valid e164 number")
    }

    const address = this.props.account
    if (!address) {
      throw new Error("Can't request without a valid account")
    }

    const paymentInfo = {
      amount: amount.toString(),
      // TODO: discuss if sending address would be better
      // Would help with protection of PII but would possibly make the UX worst?
      timestamp: new Date(),
      requesterAddress: address,
      requesterE164Number: this.props.e164PhoneNumber,
      requesteeAddress,
      currency: currencyToShortMap[CURRENCY_ENUM.DOLLAR],
      comment: reason,
      status: PaymentRequestStatuses.REQUESTED,
      notified: false,
    }

    if (requesteeAddress) {
      try {
        this.props.writePaymentRequest(paymentInfo)
      } catch (error) {
        Logger.error(TAG, 'Payment request failed, show error message', error)
        this.props.showError(ErrorMessages.PAYMENT_REQUEST_FAILED, ERROR_BANNER_DURATION)
        return
      }
    } else {
      // TODO: handle unverified recepients, maybe send them a sms to download the app?
      this.props.showError(ErrorMessages.CAN_NOT_REQUEST_FROM_UNVERIFIED, ERROR_BANNER_DURATION)
      Logger.info(
        'RequestConfirmation/onConfirm',
        'Currently requesting from unverified users is not supported'
      )
    }
    navigate(Screens.WalletHome)
    Logger.showMessage(t('requestSent'))
  }

  onPressEdit = () => {
    CeloAnalytics.track(CustomEventNames.request_payment_edit)
    navigateBack()
  }

  renderHeader = () => {
    const { t } = this.props
    const { recipientAddress: requesteeAddress } = this.getConfirmationInput()
    const showInvite = !requesteeAddress
    const title = showInvite ? t('inviteVerifyPayment') : t('reviewPayment')
    return <ReviewHeader title={title} />
  }

  render() {
    const { t } = this.props
    const {
      amount,
      reason,
      recipient,
      recipientAddress: requesteeAddress,
    } = this.getConfirmationInput()

    return (
      <View style={styles.container}>
        <DisconnectBanner />
        <ReviewFrame
          HeaderComponent={this.renderHeader}
          confirmButton={{
            action: this.onConfirm,
            text: t('request'),
            disabled: false,
          }}
          modifyButton={{ action: this.onPressEdit, text: t('edit'), disabled: false }}
        >
          <TransferConfirmationCard
            type={TransactionTypes.PAY_REQUEST}
            recipient={recipient}
            address={requesteeAddress || ''}
            e164PhoneNumber={recipient.e164PhoneNumber}
            comment={reason}
            value={amount}
            currency={CURRENCY_ENUM.DOLLAR} // User can only request in Dollars
          />
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
})

export default componentWithAnalytics(
  connect<StateProps, DispatchProps, {}, RootState>(
    mapStateToProps,
    mapDispatchToProps
  )(withNamespaces('sendFlow7')(RequestConfirmation))
)
