import * as React from 'react'
import { WithTranslation } from 'react-i18next'
import { Image } from 'react-native'
import { connect } from 'react-redux'
import { HomeEvents } from 'src/analytics/Events'
import ValoraAnalytics from 'src/analytics/ValoraAnalytics'
import { NotificationBannerCTATypes, NotificationBannerTypes } from 'src/home/NotificationBox'
import { Namespaces, withTranslation } from 'src/i18n'
import { addressToE164NumberSelector, AddressToE164NumberType } from 'src/identity/reducer'
import { notificationIncomingRequest } from 'src/images/Images'
import { navigate } from 'src/navigator/NavigationService'
import { Screens } from 'src/navigator/Screens'
import SummaryNotification from 'src/notifications/SummaryNotification'
import { listItemRenderer } from 'src/paymentRequest/IncomingPaymentRequestListScreen'
import PaymentRequestNotificationInner from 'src/paymentRequest/PaymentRequestNotificationInner'
import { PaymentRequest } from 'src/paymentRequest/types'
import { getRequesterFromPaymentRequest } from 'src/paymentRequest/utils'
import { NumberToRecipient } from 'src/recipients/recipient'
import { recipientCacheSelector } from 'src/recipients/reducer'
import { RootState } from 'src/redux/reducers'

interface OwnProps {
  requests: PaymentRequest[]
}

type Props = OwnProps & WithTranslation & StateProps

interface StateProps {
  addressToE164Number: AddressToE164NumberType
  recipientCache: NumberToRecipient
}

const mapStateToProps = (state: RootState): StateProps => ({
  addressToE164Number: addressToE164NumberSelector(state),
  recipientCache: recipientCacheSelector(state),
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
        recipient={getRequesterFromPaymentRequest(
          item,
          this.props.addressToE164Number,
          this.props.recipientCache
        )}
      />
    )
  }

  render() {
    const { addressToE164Number, recipientCache, requests, t } = this.props

    return requests.length === 1 ? (
      listItemRenderer({
        addressToE164Number,
        recipientCache,
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
