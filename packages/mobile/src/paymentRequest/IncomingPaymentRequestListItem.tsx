import ContactCircle from '@celo/react-components/components/ContactCircle'
import RequestMessagingCard from '@celo/react-components/components/RequestMessagingCard'
import BigNumber from 'bignumber.js'
import * as React from 'react'
import { WithTranslation } from 'react-i18next'
import { StyleSheet, View } from 'react-native'
import { HomeEvents } from 'src/analytics/Events'
import ValoraAnalytics from 'src/analytics/ValoraAnalytics'
import { TokenTransactionType } from 'src/apollo/types'
import CurrencyDisplay from 'src/components/CurrencyDisplay'
import { declinePaymentRequest } from 'src/firebase/actions'
import { CURRENCIES, CURRENCY_ENUM } from 'src/geth/consts'
import { NotificationBannerCTATypes, NotificationBannerTypes } from 'src/home/NotificationBox'
import { Namespaces, withTranslation } from 'src/i18n'
import { AddressValidationType } from 'src/identity/reducer'
import { navigate } from 'src/navigator/NavigationService'
import { Screens } from 'src/navigator/Screens'
import { getRecipientThumbnail, Recipient } from 'src/recipients/recipient'
import { TransactionDataInput } from 'src/send/SendAmount'
import Logger from 'src/utils/Logger'

interface OwnProps {
  requester: Recipient
  amount: string
  comment: string
  id: string
  declinePaymentRequest: typeof declinePaymentRequest
  addressValidationType?: AddressValidationType
}

type Props = OwnProps & WithTranslation

export class IncomingPaymentRequestListItem extends React.Component<Props> {
  onPay = () => {
    const { id, amount, comment: reason, requester: recipient, addressValidationType } = this.props

    const transactionData: TransactionDataInput = {
      reason,
      recipient,
      amount: new BigNumber(amount),
      type: TokenTransactionType.PayRequest,
      firebasePendingRequestUid: id,
    }

    ValoraAnalytics.track(HomeEvents.notification_select, {
      notificationType: NotificationBannerTypes.incoming_tx_request,
      selectedAction: NotificationBannerCTATypes.pay,
    })

    if (addressValidationType && addressValidationType !== AddressValidationType.NONE) {
      navigate(Screens.ValidateRecipientIntro, { transactionData, addressValidationType })
    } else {
      navigate(Screens.SendConfirmation, { transactionData })
    }
  }

  onPaymentDecline = () => {
    const { id } = this.props
    ValoraAnalytics.track(HomeEvents.notification_select, {
      notificationType: NotificationBannerTypes.incoming_tx_request,
      selectedAction: NotificationBannerCTATypes.decline,
    })
    this.props.declinePaymentRequest(id)
    Logger.showMessage(this.props.t('requestDeclined'))
  }

  getCTA = () => {
    return [
      {
        text: this.props.t('global:send'),
        onPress: this.onPay,
      },
      {
        text: this.props.t('global:decline'),
        onPress: this.onPaymentDecline,
      },
    ]
  }

  render() {
    const { requester, id, comment, t } = this.props
    const name = requester.displayName
    const amount = {
      value: this.props.amount,
      currencyCode: CURRENCIES[CURRENCY_ENUM.DOLLAR].code,
    }

    return (
      <View style={styles.container}>
        <RequestMessagingCard
          testID={`IncomingPaymentRequestNotification/${id}`}
          title={t('incomingPaymentRequestNotificationTitle', { name })}
          details={comment}
          amount={<CurrencyDisplay amount={amount} />}
          icon={
            <ContactCircle
              address={requester.address}
              name={requester.displayName}
              thumbnailPath={getRecipientThumbnail(requester)}
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

export default withTranslation<Props>(Namespaces.paymentRequestFlow)(IncomingPaymentRequestListItem)
