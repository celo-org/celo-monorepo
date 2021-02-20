import * as React from 'react'
import { WithTranslation } from 'react-i18next'
import { Image } from 'react-native'
import { connect } from 'react-redux'
import { HomeEvents } from 'src/analytics/Events'
import ValoraAnalytics from 'src/analytics/ValoraAnalytics'
import { NotificationBannerCTATypes, NotificationBannerTypes } from 'src/home/NotificationBox'
import { Namespaces, withTranslation } from 'src/i18n'
import { notificationIncomingRequest } from 'src/images/Images'
import { navigate } from 'src/navigator/NavigationService'
import { Screens } from 'src/navigator/Screens'
import SummaryNotification from 'src/notifications/SummaryNotification'
import { listItemRenderer } from 'src/paymentRequest/IncomingPaymentRequestListScreen'
import PaymentRequestNotificationInner from 'src/paymentRequest/PaymentRequestNotificationInner'
import { PaymentRequest } from 'src/paymentRequest/types'
import { getRecipientFromAddress, RecipientInfo } from 'src/recipients/recipient'
import { recipientInfoSelector } from 'src/recipients/reducer'
import { RootState } from 'src/redux/reducers'

interface OwnProps {
  requests: PaymentRequest[]
}

type Props = OwnProps & WithTranslation & StateProps

interface StateProps {
  recipientInfo: RecipientInfo
}

const mapStateToProps = (state: RootState): StateProps => ({
  recipientInfo: recipientInfoSelector(state),
})

// Payment Request notification for the notification center on home screen
export class IncomingPaymentRequestSummaryNotification extends React.Component<Props> {
  onReview = () => {
    ValoraAnalytics.track(HomeEvents.notification_select, {
      notificationType: NotificationBannerTypes.incoming_tx_request,
      selectedAction: NotificationBannerCTATypes.review,
    })
    navigate(Screens.IncomingPaymentRequestListScreen)
  }

  itemRenderer = (item: PaymentRequest) => {
    return (
      <PaymentRequestNotificationInner
        key={item.uid}
        amount={item.amount}
        recipient={getRecipientFromAddress(item.requesterAddress, this.props.recipientInfo)}
        t={this.props.t}
      />
    )
  }

  render() {
    const { recipientInfo, requests, t } = this.props

    return requests.length === 1 ? (
      listItemRenderer({
        recipientInfo,
      })(requests[0])
    ) : (
      <SummaryNotification<PaymentRequest>
        items={requests}
        title={t('incomingPaymentRequestsSummaryTitle', { count: requests.length })}
        detailsI18nKey="walletFlow5:incomingPaymentRequestsSummaryDetails"
        icon={<Image source={notificationIncomingRequest} resizeMode="contain" />}
        onReview={this.onReview}
        itemRenderer={this.itemRenderer}
      />
    )
  }
}

export default connect<StateProps, {}, {}, RootState>(
  mapStateToProps,
  {}
)(withTranslation<Props>(Namespaces.walletFlow5)(IncomingPaymentRequestSummaryNotification))
