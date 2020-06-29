import ContactCircle from '@celo/react-components/components/ContactCircle'
import RequestMessagingCard from '@celo/react-components/components/RequestMessagingCard'
import * as React from 'react'
import { WithTranslation } from 'react-i18next'
import { StyleSheet, View } from 'react-native'
import CeloAnalytics from 'src/analytics/CeloAnalytics'
import { AnalyticsEvents } from 'src/analytics/Events'
import CurrencyDisplay from 'src/components/CurrencyDisplay'
import { cancelPaymentRequest, updatePaymentRequestNotified } from 'src/firebase/actions'
import { CURRENCIES, CURRENCY_ENUM } from 'src/geth/consts'
import { Namespaces, withTranslation } from 'src/i18n'
import { getRecipientThumbnail, Recipient } from 'src/recipients/recipient'
import Logger from 'src/utils/Logger'

interface OwnProps {
  requestee: Recipient
  amount: string
  comment: string
  id: string
  cancelPaymentRequest: typeof cancelPaymentRequest
  updatePaymentRequestNotified: typeof updatePaymentRequestNotified
}

type Props = OwnProps & WithTranslation

export class OutgoingPaymentRequestListItem extends React.Component<Props> {
  onRemind = () => {
    const { id, t } = this.props
    this.props.updatePaymentRequestNotified(id, false)
    CeloAnalytics.track(AnalyticsEvents.outgoing_request_payment_remind)
    Logger.showMessage(t('sendFlow7:reminderSent'))
  }

  onCancel = () => {
    const { id } = this.props
    this.props.cancelPaymentRequest(id)
  }

  getCTA = () => {
    return [
      {
        text: this.props.t('global:remind'),
        onPress: this.onRemind,
      },
      {
        text: this.props.t('global:cancel'),
        onPress: this.onCancel,
      },
    ]
  }

  render() {
    const { requestee, id, comment, t } = this.props
    const name = requestee.displayName
    const amount = {
      value: this.props.amount,
      currencyCode: CURRENCIES[CURRENCY_ENUM.DOLLAR].code,
    }

    return (
      <View style={styles.container}>
        <RequestMessagingCard
          testID={`OutgoingPaymentRequestNotification/${id}`}
          title={t('outgoingPaymentRequestNotificationTitle', { name })}
          amount={<CurrencyDisplay amount={amount} />}
          details={comment}
          icon={
            <ContactCircle
              address={requestee.address}
              name={name}
              thumbnailPath={getRecipientThumbnail(requestee)}
            />
          }
          callToActions={this.getCTA()}
        />
      </View>
    )
  }
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
})

export default withTranslation<Props>(Namespaces.paymentRequestFlow)(OutgoingPaymentRequestListItem)
