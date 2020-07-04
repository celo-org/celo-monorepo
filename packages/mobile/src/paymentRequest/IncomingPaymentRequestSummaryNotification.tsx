import * as React from 'react'
import { WithTranslation } from 'react-i18next'
import { Image } from 'react-native'
import { connect } from 'react-redux'
import { PaymentRequest } from 'src/account/types'
import { HomeEvents } from 'src/analytics/Events'
import ValoraAnalytics from 'src/analytics/ValoraAnalytics'
import { declinePaymentRequest } from 'src/firebase/actions'
import { NotificationBannerCTATypes, NotificationBannerTypes } from 'src/home/NotificationBox'
import { Namespaces, withTranslation } from 'src/i18n'
import {
  addressToE164NumberSelector,
  AddressToE164NumberType,
  e164NumberToAddressSelector,
  E164NumberToAddressType,
} from 'src/identity/reducer'
import { notificationIncomingRequest } from 'src/images/Images'
import { navigate } from 'src/navigator/NavigationService'
import { Screens } from 'src/navigator/Screens'
import SummaryNotification from 'src/notifications/SummaryNotification'
import { listItemRenderer } from 'src/paymentRequest/IncomingPaymentRequestListScreen'
import PaymentRequestNotificationInner from 'src/paymentRequest/PaymentRequestNotificationInner'
import { getRecipientFromPaymentRequest } from 'src/paymentRequest/utils'
import { NumberToRecipient } from 'src/recipients/recipient'
import { recipientCacheSelector } from 'src/recipients/reducer'
import { RootState } from 'src/redux/reducers'

interface OwnProps {
  requests: PaymentRequest[]
}

interface DispatchProps {
  declinePaymentRequest: typeof declinePaymentRequest
}

type Props = OwnProps & DispatchProps & WithTranslation & StateProps

interface StateProps {
  e164PhoneNumberAddressMapping: E164NumberToAddressType
  addressToE164Number: AddressToE164NumberType
  recipientCache: NumberToRecipient
}

const mapStateToProps = (state: RootState): StateProps => {
  return {
    e164PhoneNumberAddressMapping: e164NumberToAddressSelector(state),
    addressToE164Number: addressToE164NumberSelector(state),
    recipientCache: recipientCacheSelector(state),
  }
}

const mapDispatchToProps = {
  declinePaymentRequest,
}

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
        recipient={getRecipientFromPaymentRequest(item, this.props.recipientCache)}
      />
    )
  }

  render() {
    const { recipientCache, requests, t } = this.props

    return requests.length === 1 ? (
      listItemRenderer({
        // accessing via this.props.<...> to avoid shadowing
        declinePaymentRequest: this.props.declinePaymentRequest,
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

export default connect<StateProps, DispatchProps, {}, RootState>(
  mapStateToProps,
  mapDispatchToProps
)(withTranslation<Props>(Namespaces.walletFlow5)(IncomingPaymentRequestSummaryNotification))
