import * as React from 'react'
import { WithTranslation } from 'react-i18next'
import { Image } from 'react-native'
import { connect } from 'react-redux'
import { HomeEvents } from 'src/analytics/Events'
import ValoraAnalytics from 'src/analytics/ValoraAnalytics'
import { NotificationBannerCTATypes, NotificationBannerTypes } from 'src/home/NotificationBox'
import { Namespaces, withTranslation } from 'src/i18n'
import { e164NumberToAddressSelector, E164NumberToAddressType } from 'src/identity/reducer'
import { notificationOutgoingRequest } from 'src/images/Images'
import { navigate } from 'src/navigator/NavigationService'
import { Screens } from 'src/navigator/Screens'
import SummaryNotification from 'src/notifications/SummaryNotification'
import { cancelPaymentRequest, updatePaymentRequestNotified } from 'src/paymentRequest/actions'
import { listItemRenderer } from 'src/paymentRequest/OutgoingPaymentRequestListScreen'
import PaymentRequestNotificationInner from 'src/paymentRequest/PaymentRequestNotificationInner'
import { PaymentRequest } from 'src/paymentRequest/types'
import { getRecipientFromAddress, RecipientInfo } from 'src/recipients/recipient'
import { recipientInfoSelector } from 'src/recipients/reducer'
import { RootState } from 'src/redux/reducers'

interface OwnProps {
  requests: PaymentRequest[]
}

interface DispatchProps {
  cancelPaymentRequest: typeof cancelPaymentRequest
  updatePaymentRequestNotified: typeof updatePaymentRequestNotified
}

interface StateProps {
  e164PhoneNumberAddressMapping: E164NumberToAddressType
  recipientInfo: RecipientInfo
}

type Props = OwnProps & DispatchProps & WithTranslation & StateProps

const mapStateToProps = (state: RootState): StateProps => ({
  e164PhoneNumberAddressMapping: e164NumberToAddressSelector(state),
  recipientInfo: recipientInfoSelector(state),
})

// Payment Request notification for the notification center on home screen
export class OutgoingPaymentRequestSummaryNotification extends React.Component<Props> {
  onReview = () => {
    ValoraAnalytics.track(HomeEvents.notification_select, {
      notificationType: NotificationBannerTypes.outgoing_tx_request,
      selectedAction: NotificationBannerCTATypes.review,
    })
    navigate(Screens.OutgoingPaymentRequestListScreen)
  }

  itemRenderer = (item: PaymentRequest) => {
    return (
      <PaymentRequestNotificationInner
        key={item.uid}
        amount={item.amount}
        recipient={getRecipientFromAddress(item.requesteeAddress, this.props.recipientInfo)}
        t={this.props.t}
      />
    )
  }

  render() {
    const { requests, t } = this.props
    return requests.length === 1 ? (
      listItemRenderer({
        recipientInfo: this.props.recipientInfo,
        // accessing via this.props.<...> to avoid shadowing
        cancelPaymentRequest: this.props.cancelPaymentRequest,
        updatePaymentRequestNotified: this.props.updatePaymentRequestNotified,
      })(requests[0])
    ) : (
      <SummaryNotification<PaymentRequest>
        items={requests}
        title={t('outgoingPaymentRequestsSummaryTitle', { count: requests.length })}
        detailsI18nKey="walletFlow5:outgoingPaymentRequestsSummaryDetails"
        icon={<Image source={notificationOutgoingRequest} resizeMode="contain" />}
        onReview={this.onReview}
        itemRenderer={this.itemRenderer}
      />
    )
  }
}

export default connect<StateProps, DispatchProps, {}, RootState>(mapStateToProps, {
  cancelPaymentRequest,
  updatePaymentRequestNotified,
})(withTranslation<Props>(Namespaces.walletFlow5)(OutgoingPaymentRequestSummaryNotification))
