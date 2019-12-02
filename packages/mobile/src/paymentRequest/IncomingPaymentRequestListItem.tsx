import BaseNotification from '@celo/react-components/components/BaseNotification'
import ContactCircle from '@celo/react-components/components/ContactCircle'
import colors from '@celo/react-components/styles/colors'
import fontStyles from '@celo/react-components/styles/fonts'
import variables from '@celo/react-components/styles/variables'
import BigNumber from 'bignumber.js'
import * as React from 'react'
import { WithNamespaces, withNamespaces } from 'react-i18next'
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import { PaymentRequestStatus } from 'src/account'
import CeloAnalytics from 'src/analytics/CeloAnalytics'
import { CustomEventNames } from 'src/analytics/constants'
import { updatePaymentRequestStatus } from 'src/firebase/actions'
import { Namespaces } from 'src/i18n'
import { navigate } from 'src/navigator/NavigationService'
import { Screens } from 'src/navigator/Screens'
import NotificationAmount from 'src/paymentRequest/NotificationAmount'
import { getRecipientThumbnail, Recipient } from 'src/recipients/recipient'
import { TransactionTypes } from 'src/transactions/reducer'
import { multiplyByWei } from 'src/utils/formatting'
import Logger from 'src/utils/Logger'

interface OwnProps {
  requester: Recipient
  amount: string
  comment: string
  id: string
  updatePaymentRequestStatus: typeof updatePaymentRequestStatus
}

type Props = OwnProps & WithNamespaces

export class IncomingPaymentRequestListItem extends React.Component<Props> {
  onPay = () => {
    const { amount, comment: reason, requester: recipient } = this.props
    navigate(Screens.SendConfirmation, {
      confirmationInput: {
        reason,
        recipient,
        amount: new BigNumber(amount),
        recipientAddress: recipient.address,
        type: TransactionTypes.PAY_REQUEST,
      },
      onConfirm: this.onPaymentSuccess,
      onCancel: this.onPaymentDecline,
    })
  }

  onPaymentSuccess = () => {
    const { id } = this.props
    this.props.updatePaymentRequestStatus(id.toString(), PaymentRequestStatus.COMPLETED)
    Logger.showMessage(this.props.t('requestPaid'))
    CeloAnalytics.track(CustomEventNames.incoming_request_payment_pay)
    this.onFinalized()
  }

  onPaymentDecline = () => {
    const { id } = this.props
    this.props.updatePaymentRequestStatus(id.toString(), PaymentRequestStatus.DECLINED)
    Logger.showMessage(this.props.t('requestDeclined'))
    CeloAnalytics.track(CustomEventNames.incoming_request_payment_decline)
    this.onFinalized()
  }

  onFinalized = () => {
    navigate(Screens.IncomingPaymentRequestListScreen)
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
    return this.props.requester.displayId !== this.props.requester.displayName
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
          callout={<NotificationAmount amount={multiplyByWei(this.props.amount)} />}
        >
          <View>
            {this.isDisplayingNumber() && (
              <Text style={[fontStyles.subSmall, styles.phoneNumber]}>
                {this.props.requester.displayId}
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
  comment: {
    paddingTop: variables.contentPadding,
  },
  phoneNumber: {
    color: colors.dark,
  },
})

export default withNamespaces(Namespaces.global)(IncomingPaymentRequestListItem)
