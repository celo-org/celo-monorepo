import * as React from 'react'
import { WithTranslation } from 'react-i18next'
import { Image, StyleSheet } from 'react-native'
import { connect } from 'react-redux'
import { PaymentRequest } from 'src/account/types'
import CeloAnalytics from 'src/analytics/CeloAnalytics'
import { CustomEventNames } from 'src/analytics/constants'
import { updatePaymentRequestNotified, updatePaymentRequestStatus } from 'src/firebase/actions'
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
import { NumberToRecipient, phoneNumberToRecipient } from 'src/recipients/recipient'
import { recipientCacheSelector } from 'src/recipients/reducer'
import { RootState } from 'src/redux/reducers'

interface OwnProps {
  requests: PaymentRequest[]
}

interface DispatchProps {
  updatePaymentRequestStatus: typeof updatePaymentRequestStatus
  updatePaymentRequestNotified: typeof updatePaymentRequestNotified
}

type Props = OwnProps & DispatchProps & WithTranslation & StateProps

interface StateProps {
  e164PhoneNumberAddressMapping: E164NumberToAddressType
  addressToE164Number: AddressToE164NumberType
  recipientCache: NumberToRecipient
}

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

  getRequesterRecipient = (requesterE164Number: string) => {
    return phoneNumberToRecipient(
      requesterE164Number,
      this.props.e164PhoneNumberAddressMapping[requesterE164Number],
      this.props.recipientCache
    )
  }

  itemRenderer = (item: PaymentRequest) => {
    return (
      <PaymentRequestNotificationInner
        key={item.uid}
        amount={item.amount}
        requesterE164Number={item.requesterE164Number}
        requesterRecipient={this.getRequesterRecipient(item.requesterE164Number)}
      />
    )
  }

  render() {
    const { recipientCache, requests, t } = this.props
    return requests.length === 1 ? (
      listItemRenderer({
        addressToE164Number: this.props.addressToE164Number,
        updatePaymentRequestStatus: this.props.updatePaymentRequestStatus,
        updatePaymentRequestNotified: this.props.updatePaymentRequestNotified,
        recipientCache,
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

export default connect<StateProps, DispatchProps, {}, RootState>(
  mapStateToProps,
  {
    updatePaymentRequestStatus,
    updatePaymentRequestNotified,
  }
)(withTranslation(Namespaces.walletFlow5)(OutgoingPaymentRequestSummaryNotification))
