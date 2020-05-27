import ReviewFrame from '@celo/react-components/components/ReviewFrame'
import ReviewHeader from '@celo/react-components/components/ReviewHeader'
import colors from '@celo/react-components/styles/colors'
import { CURRENCY_ENUM } from '@celo/utils/src/currencies'
import { StackScreenProps } from '@react-navigation/stack'
import * as React from 'react'
import { WithTranslation } from 'react-i18next'
import { StyleSheet } from 'react-native'
import SafeAreaView from 'react-native-safe-area-view'
import { connect } from 'react-redux'
import { PaymentRequestStatus } from 'src/account/types'
import { showError } from 'src/alert/actions'
import CeloAnalytics from 'src/analytics/CeloAnalytics'
import { CustomEventNames } from 'src/analytics/constants'
import { writePaymentRequest } from 'src/firebase/actions'
import { currencyToShortMap } from 'src/geth/consts'
import { Namespaces, withTranslation } from 'src/i18n'
import { navigateBack } from 'src/navigator/NavigationService'
import { Screens } from 'src/navigator/Screens'
import { StackParamList } from 'src/navigator/types'
import PaymentRequestReviewCard from 'src/paymentRequest/PaymentRequestReviewCard'
import { RootState } from 'src/redux/reducers'
import { ConfirmationInput, getConfirmationInput } from 'src/send/utils'
import DisconnectBanner from 'src/shared/DisconnectBanner'
import Logger from 'src/utils/Logger'
import { currentAccountSelector } from 'src/web3/selectors'

// @ts-ignore
const TAG = 'paymentRequest/confirmation'

interface StateProps {
  e164PhoneNumber: string
  account: string | null
  confirmationInput: ConfirmationInput
}

interface DispatchProps {
  showError: typeof showError
  writePaymentRequest: typeof writePaymentRequest
}

const mapDispatchToProps = { showError, writePaymentRequest }

const mapStateToProps = (state: RootState, ownProps: OwnProps): StateProps => {
  const { route } = ownProps
  const transactionData = route.params.transactionData
  const { e164NumberToAddress } = state.identity
  const { secureSendPhoneNumberMapping } = state.identity
  const confirmationInput = getConfirmationInput(
    transactionData,
    e164NumberToAddress,
    secureSendPhoneNumberMapping
  )
  return {
    confirmationInput,
    e164PhoneNumber: state.account.e164PhoneNumber,
    account: currentAccountSelector(state),
  }
}

type OwnProps = StackScreenProps<StackParamList, Screens.PaymentRequestConfirmation>

type Props = DispatchProps & StateProps & WithTranslation & OwnProps

class PaymentRequestConfirmation extends React.Component<Props> {
  static navigationOptions = { header: null }

  onConfirm = async () => {
    const {
      amount,
      reason,
      recipient,
      recipientAddress: requesteeAddress,
    } = this.props.confirmationInput

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

    if (!requesteeAddress) {
      throw new Error('Error passing through the requestee address')
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
      status: PaymentRequestStatus.REQUESTED,
      notified: false,
    }

    this.props.writePaymentRequest(paymentInfo)
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
    } = this.props.confirmationInput

    return (
      <SafeAreaView style={styles.container}>
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
      </SafeAreaView>
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

export default connect<StateProps, DispatchProps, OwnProps, RootState>(
  mapStateToProps,
  mapDispatchToProps
)(withTranslation(Namespaces.sendFlow7)(PaymentRequestConfirmation))
