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
import { bindActionCreators } from 'redux'
import { PaymentRequestStatuses } from 'src/account'
import { showError } from 'src/alert/actions'
import CeloAnalytics from 'src/analytics/CeloAnalytics'
import { CustomEventNames } from 'src/analytics/constants'
import componentWithAnalytics from 'src/analytics/wrapper'
import { ErrorMessages } from 'src/app/ErrorMessages'
import { writePaymentRequest } from 'src/firebase/firebase'
import { currencyToShortMap } from 'src/geth/consts'
import { Namespaces } from 'src/i18n'
import { navigate, navigateBack } from 'src/navigator/NavigationService'
import { Screens } from 'src/navigator/Screens'
import PaymentRequestReviewCard from 'src/paymentRequest/PaymentRequestReviewCard'
import { Recipient } from 'src/recipients/recipient'
import { RootState } from 'src/redux/reducers'
import DisconnectBanner from 'src/shared/DisconnectBanner'
import Logger from 'src/utils/Logger'
import { currentAccountSelector } from 'src/web3/selectors'

const TAG = 'paymentRequest/confirmation'

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

// Use bindActionCreators to workaround a typescript error with the shorthand syntax with redux-thunk actions
// see https://github.com/DefinitelyTyped/DefinitelyTyped/issues/37369
const mapDispatchToProps = (dispatch: any) =>
  bindActionCreators(
    {
      writePaymentRequest,
      showError,
    },
    dispatch
  )

const mapStateToProps = (state: RootState): StateProps => {
  return {
    e164PhoneNumber: state.account.e164PhoneNumber,
    account: currentAccountSelector(state),
  }
}

type Props = NavigationInjectedProps & DispatchProps & StateProps & WithNamespaces

class PaymentRequestConfirmation extends React.Component<Props> {
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
    if (!recipient || (!recipient.e164PhoneNumber && !recipient.address)) {
      throw new Error("Can't request from recipient without valid e164 number or a wallet address")
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

    try {
      this.props.writePaymentRequest(paymentInfo)
    } catch (error) {
      Logger.error(TAG, 'Payment request failed, show error message', error)
      this.props.showError(ErrorMessages.PAYMENT_REQUEST_FAILED)
      return
    }

    navigate(Screens.WalletHome)
    Logger.showMessage(t('requestSent'))
  }

  onPressEdit = () => {
    CeloAnalytics.track(CustomEventNames.request_payment_edit)
    navigateBack()
  }

  renderHeader = () => <ReviewHeader title={this.props.t('requestPayment')} />

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
          <PaymentRequestReviewCard
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
  )(withNamespaces(Namespaces.sendFlow7)(PaymentRequestConfirmation))
)
