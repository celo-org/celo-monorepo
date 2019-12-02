import BaseNotification from '@celo/react-components/components/BaseNotification'
import ContactCircle from '@celo/react-components/components/ContactCircle'
import colors from '@celo/react-components/styles/colors'
import fontStyles from '@celo/react-components/styles/fonts'
import variables from '@celo/react-components/styles/variables'
import * as React from 'react'
import { WithNamespaces, withNamespaces } from 'react-i18next'
import { StyleSheet, Text, View } from 'react-native'
import { PaymentRequestStatus } from 'src/account'
import CeloAnalytics from 'src/analytics/CeloAnalytics'
import { CustomEventNames } from 'src/analytics/constants'
import { updatePaymentRequestNotified, updatePaymentRequestStatus } from 'src/firebase/actions'
import { Namespaces } from 'src/i18n'
import { navigate } from 'src/navigator/NavigationService'
import { Screens } from 'src/navigator/Screens'
import NotificationAmount from 'src/paymentRequest/NotificationAmount'
import { getRecipientThumbnail, Recipient } from 'src/recipients/recipient'
import { multiplyByWei } from 'src/utils/formatting'

interface OwnProps {
  requester: Recipient
  amount: string
  comment: string
  id: string
  updatePaymentRequestStatus: typeof updatePaymentRequestStatus
  updatePaymentRequestNotified: typeof updatePaymentRequestNotified
}

type Props = OwnProps & WithNamespaces

export class OutgoingPaymentRequestListItem extends React.Component<Props> {
  onRemind = () => {
    const { id } = this.props
    this.props.updatePaymentRequestNotified(id.toString(), false)
    CeloAnalytics.track(CustomEventNames.outgoing_request_payment_remind)
    this.onFinalized()
  }

  onCancel = () => {
    const { id } = this.props
    this.props.updatePaymentRequestStatus(id.toString(), PaymentRequestStatus.CANCELLED)
    CeloAnalytics.track(CustomEventNames.outgoing_request_payment_cancel)
  }

  onFinalized = () => {
    navigate(Screens.OutgoingPaymentRequestListScreen)
  }

  getCTA = () => {
    return [
      {
        text: this.props.t('remind'),
        onPress: this.onRemind,
      },
      {
        text: this.props.t('cancel'),
        onPress: this.onCancel,
      },
    ]
  }

  isDisplayingNumber = () => {
    return this.props.requester.displayId !== this.props.requester.displayName
  }

  render() {
    const { requester } = this.props
    return (
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

export default withNamespaces(Namespaces.global)(OutgoingPaymentRequestListItem)
