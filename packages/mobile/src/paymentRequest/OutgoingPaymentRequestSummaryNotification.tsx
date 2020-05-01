import * as React from 'react'
import { WithTranslation } from 'react-i18next'
import { Image, StyleSheet } from 'react-native'
import { connect } from 'react-redux'
import { PaymentRequest } from 'src/account/types'
import CeloAnalytics from 'src/analytics/CeloAnalytics'
import { CustomEventNames } from 'src/analytics/constants'
import { cancelPaymentRequest, updatePaymentRequestNotified } from 'src/firebase/actions'
import { Namespaces, withTranslation } from 'src/i18n'
import {
  addressToE164NumberSelector,
  AddressToE164NumberType,
  e164NumberToAddressSelector,
  E164NumberToAddressType,
} from 'src/identity/reducer'
import { sendDollar } from 'src/images/Images'
import { navigate } from 'src/navigator/NavigationService'
import { Stacks } from 'src/navigator/Screens'
import SummaryNotification from 'src/notifications/SummaryNotification'
import { listItemRenderer } from 'src/paymentRequest/OutgoingPaymentRequestListScreen'
import PaymentRequestNotificationInner from 'src/paymentRequest/PaymentRequestNotificationInner'
import { getSenderFromPaymentRequest } from 'src/paymentRequest/utils'
import { NumberToRecipient } from 'src/recipients/recipient'
import { recipientCacheSelector } from 'src/recipients/reducer'
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
  addressToE164Number: AddressToE164NumberType
  recipientCache: NumberToRecipient
}

type Props = OwnProps & DispatchProps & WithTranslation & StateProps

const mapStateToProps = (state: RootState): StateProps => ({
  e164PhoneNumberAddressMapping: e164NumberToAddressSelector(state),
  addressToE164Number: addressToE164NumberSelector(state),
  recipientCache: recipientCacheSelector(state),
})

// Payment Request notification for the notification center on home screen
export class OutgoingPaymentRequestSummaryNotification extends React.Component<Props> {
  onReview = () => {
    CeloAnalytics.track(CustomEventNames.outgoing_request_payment_review)
    navigate(Stacks.OutgoingRequestStack)
  }

  itemRenderer = (item: PaymentRequest) => {
    return (
      <PaymentRequestNotificationInner
        key={item.uid}
        amount={item.amount}
        requesterRecipient={getSenderFromPaymentRequest(
          item,
          this.props.addressToE164Number,
          this.props.recipientCache
        )}
      />
    )
  }

  render() {
    const { recipientCache, requests, t } = this.props
    return requests.length === 1 ? (
      listItemRenderer({
        addressToE164Number: this.props.addressToE164Number,
        recipientCache,
        // accessing via this.props.<...> to avoid shadowing
        cancelPaymentRequest: this.props.cancelPaymentRequest,
        updatePaymentRequestNotified: this.props.updatePaymentRequestNotified,
      })(requests[0])
    ) : (
      <SummaryNotification<PaymentRequest>
        items={requests}
        title={t('outgoingPaymentRequests')}
        icon={<Image source={sendDollar} style={styles.image} resizeMode="contain" />}
        onReview={this.onReview}
        itemRenderer={this.itemRenderer}
      />
    )
  }
}

const styles = StyleSheet.create({
  image: {
    width: 40,
    height: 40,
  },
})

export default connect<StateProps, DispatchProps, {}, RootState>(mapStateToProps, {
  cancelPaymentRequest,
  updatePaymentRequestNotified,
})(withTranslation(Namespaces.walletFlow5)(OutgoingPaymentRequestSummaryNotification))
