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
import { fetchAddressesAndValidate } from 'src/identity/actions'
import {
  addressToE164NumberSelector,
  AddressToE164NumberType,
  AddressValidationType,
  e164NumberToAddressSelector,
  E164NumberToAddressType,
  SecureSendPhoneNumberMapping,
} from 'src/identity/reducer'
import { notificationIncomingRequest } from 'src/images/Images'
import { navigate } from 'src/navigator/NavigationService'
import { Screens } from 'src/navigator/Screens'
import SummaryNotification from 'src/notifications/SummaryNotification'
import { listItemRenderer } from 'src/paymentRequest/IncomingPaymentRequestListScreen'
import PaymentRequestNotificationInner from 'src/paymentRequest/PaymentRequestNotificationInner'
import {
  AddressValidationCheckCache,
  getAddressValidationCheckCache,
  getRecipientFromPaymentRequest,
} from 'src/paymentRequest/utils'
import { NumberToRecipient } from 'src/recipients/recipient'
import { recipientCacheSelector } from 'src/recipients/reducer'
import { RootState } from 'src/redux/reducers'

interface OwnProps {
  paymentRequests: PaymentRequest[]
}

interface DispatchProps {
  declinePaymentRequest: typeof declinePaymentRequest
  fetchAddressesAndValidate: typeof fetchAddressesAndValidate
}

type Props = OwnProps & DispatchProps & WithTranslation & StateProps

interface StateProps {
  e164PhoneNumberAddressMapping: E164NumberToAddressType
  addressToE164Number: AddressToE164NumberType
  recipientCache: NumberToRecipient
  secureSendPhoneNumberMapping: SecureSendPhoneNumberMapping
  addressValidationCheckCache: AddressValidationCheckCache
}

const mapStateToProps = (state: RootState, ownProps: OwnProps): StateProps => {
  const { paymentRequests } = ownProps
  const e164PhoneNumberAddressMapping = e164NumberToAddressSelector(state)
  const addressToE164Number = addressToE164NumberSelector(state)
  const recipientCache = recipientCacheSelector(state)
  const { secureSendPhoneNumberMapping } = state.identity
  const addressValidationCheckCache = getAddressValidationCheckCache(
    paymentRequests,
    recipientCache,
    secureSendPhoneNumberMapping
  )

  return {
    e164PhoneNumberAddressMapping,
    addressToE164Number,
    recipientCache,
    secureSendPhoneNumberMapping,
    addressValidationCheckCache,
  }
}

const mapDispatchToProps = {
  declinePaymentRequest,
  fetchAddressesAndValidate,
}

// Payment Request notification for the notification center on home screen
export class IncomingPaymentRequestSummaryNotification extends React.Component<Props> {
  componentDidMount() {
    // Need to check latest address mappings to prevent user from accepting fradulent requests
    this.fetchLatestAddressesAndValidate()
  }

  fetchLatestAddressesAndValidate = () => {
    const { paymentRequests, secureSendPhoneNumberMapping } = this.props

    paymentRequests.forEach((paymentRequest) => {
      const recipient = getRecipientFromPaymentRequest(paymentRequest, this.props.recipientCache)
      const { e164PhoneNumber } = recipient
      if (!e164PhoneNumber) {
        return
      }

      // Skip the fetch if we already know we need to do Secure Send for a number
      if (
        secureSendPhoneNumberMapping[e164PhoneNumber] &&
        secureSendPhoneNumberMapping[e164PhoneNumber].addressValidationType !==
          AddressValidationType.NONE
      ) {
        return
      }

      this.props.fetchAddressesAndValidate(e164PhoneNumber)
    })
  }

  onReview = () => {
    ValoraAnalytics.track(HomeEvents.notification_select, {
      notificationType: NotificationBannerTypes.incoming_tx_request,
      selectedAction: NotificationBannerCTATypes.review,
    })
    navigate(Screens.IncomingPaymentRequestListScreen, {
      addressValidationCheckCache: this.props.addressValidationCheckCache,
    })
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
    const { recipientCache, paymentRequests, t } = this.props

    return paymentRequests.length === 1 ? (
      listItemRenderer({
        // accessing via this.props.<...> to avoid shadowing
        declinePaymentRequest: this.props.declinePaymentRequest,
        recipientCache,
        addressValidationCheckCache: this.props.addressValidationCheckCache,
      })(paymentRequests[0])
    ) : (
      <SummaryNotification<PaymentRequest>
        items={paymentRequests}
        title={t('incomingPaymentRequestsSummaryTitle', { count: paymentRequests.length })}
        detailsI18nKey="walletFlow5:incomingPaymentRequestsSummaryDetails"
        icon={<Image source={notificationIncomingRequest} resizeMode="contain" />}
        onReview={this.onReview}
        itemRenderer={this.itemRenderer}
      />
    )
  }
}

export default connect<StateProps, DispatchProps, OwnProps, RootState>(
  mapStateToProps,
  mapDispatchToProps
)(withTranslation<Props>(Namespaces.walletFlow5)(IncomingPaymentRequestSummaryNotification))
