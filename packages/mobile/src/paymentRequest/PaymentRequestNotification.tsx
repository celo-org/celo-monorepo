import BaseNotification from '@celo/react-components/components/BaseNotification'
import ContactCircle from '@celo/react-components/components/ContactCircle'
import colors from '@celo/react-components/styles/colors'
import fontStyles from '@celo/react-components/styles/fonts'
import variables from '@celo/react-components/styles/variables'
import BigNumber from 'bignumber.js'
import * as React from 'react'
import { WithNamespaces, withNamespaces } from 'react-i18next'
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import { PaymentRequestStatuses } from 'src/account'
import CeloAnalytics from 'src/analytics/CeloAnalytics'
import { CustomEventNames } from 'src/analytics/constants'
import { componentWithAnalytics } from 'src/analytics/wrapper'
import { updatePaymentRequestStatus } from 'src/firebase/actions'
import { Namespaces } from 'src/i18n'
import { navigate } from 'src/navigator/NavigationService'
import { Screens } from 'src/navigator/Screens'
import NotificationAmount from 'src/paymentRequest/NotificationAmount'
import Logger from 'src/utils/Logger'
import { getRecipientThumbnail, Recipient } from 'src/utils/recipient'

interface OwnProps {
  requester: Recipient
  amount: string
  comment: string
  id: string
  updatePaymentRequestStatus: typeof updatePaymentRequestStatus
  fee: BigNumber
}

type Props = OwnProps & WithNamespaces

export class PaymentRequestNotification extends React.Component<Props> {
  onPay = () => {
    const { amount, comment: reason, fee, requester: recipient } = this.props
    navigate(Screens.SendConfirmation, {
      confirmationInput: {
        reason,
        recipient,
        fee,
        amount: new BigNumber(amount),
        recipientAddress: recipient.address,
      },
      isPaymentRequest: true,
      onConfirm: this.onPaymentSuccess,
      onCancel: this.onPaymentDecline,
    })
  }

  onPaymentSuccess = () => {
    const { id } = this.props
    this.props.updatePaymentRequestStatus(id.toString(), PaymentRequestStatuses.COMPLETED)
    Logger.showMessage(this.props.t('requestPaid'))
    CeloAnalytics.track(CustomEventNames.request_payment_pay)
    this.onFinalized()
  }

  onPaymentDecline = () => {
    const { id } = this.props
    this.props.updatePaymentRequestStatus(id.toString(), PaymentRequestStatuses.DECLINED)
    Logger.showMessage(this.props.t('requestDeclined'))
    CeloAnalytics.track(CustomEventNames.request_payment_decline)
    this.onFinalized()
  }

  onFinalized = () => {
    navigate(Screens.PaymentRequestListScreen)
  }

  getCTA = () => {
    return [
      {
        text: this.props.t('pay'),
        onPress: this.onPay,
      },
      {
        text: this.props.t('decline'),
        onPress: this.onPaymentDecline,
      },
    ]
  }

  isDisplayingNumber = () => {
    return this.props.requester.displayPhoneNumber !== this.props.requester.displayName
  }

  render() {
    const { requester } = this.props
    return (
      <TouchableOpacity onPress={this.onPay}>
        <BaseNotification
          icon={
            <ContactCircle
              size={30}
              address={requester.address}
              name={requester.displayName}
              thumbnailPath={getRecipientThumbnail(requester)}
            />
          }
          title={requester.displayName}
          ctas={this.getCTA()}
          roundedBorders={false}
          callout={<NotificationAmount amount={this.props.amount} />}
        >
          <View style={styles.body}>
            {this.isDisplayingNumber() && (
              <Text style={[fontStyles.subSmall, styles.phoneNumber]}>
                {this.props.requester.displayPhoneNumber}
              </Text>
            )}
            <Text style={[fontStyles.subSmall, styles.comment]}>{this.props.comment}</Text>
          </View>
        </BaseNotification>
      </TouchableOpacity>
    )
  }
}

const styles = StyleSheet.create({
  body: {},
  comment: {
    paddingTop: variables.contentPadding,
  },
  phoneNumber: {
    color: colors.dark,
  },
})

export default componentWithAnalytics(
  withNamespaces(Namespaces.paymentRequestFlow)(PaymentRequestNotification)
)
