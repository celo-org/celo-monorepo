import React from 'react'
import { WithTranslation } from 'react-i18next'
import { View } from 'react-native'
import { NavigationInjectedProps } from 'react-navigation'
import { connect } from 'react-redux'
import { getOutgoingPaymentRequests } from 'src/account/selectors'
import { PaymentRequest } from 'src/account/types'
import { cancelPaymentRequest, updatePaymentRequestNotified } from 'src/firebase/actions'
import i18n, { Namespaces, withTranslation } from 'src/i18n'
import {
  AddressToE164NumberType,
  e164NumberToAddressSelector,
  E164NumberToAddressType,
} from 'src/identity/reducer'
import {
  NotificationList,
  titleWithBalanceNavigationOptions,
} from 'src/notifications/NotificationList'
import OutgoingPaymentRequestListItem from 'src/paymentRequest/OutgoingPaymentRequestListItem'
import { getSenderFromPaymentRequest } from 'src/paymentRequest/utils'
import { NumberToRecipient } from 'src/recipients/recipient'
import { recipientCacheSelector } from 'src/recipients/reducer'
import { RootState } from 'src/redux/reducers'

interface StateProps {
  dollarBalance: string | null
  paymentRequests: PaymentRequest[]
  e164PhoneNumberAddressMapping: E164NumberToAddressType
  recipientCache: NumberToRecipient
  addressToE164Number: AddressToE164NumberType
}

interface DispatchProps {
  cancelPaymentRequest: typeof cancelPaymentRequest
  updatePaymentRequestNotified: typeof updatePaymentRequestNotified
}

const mapStateToProps = (state: RootState): StateProps => ({
  dollarBalance: state.stableToken.balance,
  paymentRequests: getOutgoingPaymentRequests(state),
  e164PhoneNumberAddressMapping: e164NumberToAddressSelector(state),
  recipientCache: recipientCacheSelector(state),
  addressToE164Number: state.identity.addressToE164Number,
})

type Props = NavigationInjectedProps & WithTranslation & StateProps & DispatchProps

export const listItemRenderer = (params: {
  recipientCache: NumberToRecipient
  addressToE164Number: AddressToE164NumberType
  cancelPaymentRequest: typeof cancelPaymentRequest
  updatePaymentRequestNotified: typeof updatePaymentRequestNotified
}) => (request: PaymentRequest, key: number | undefined = undefined) => {
  const requestee = getSenderFromPaymentRequest(
    request,
    params.addressToE164Number,
    params.recipientCache
  )
  return (
    <View key={key}>
      <OutgoingPaymentRequestListItem
        id={request.uid || ''}
        amount={request.amount}
        requestee={requestee}
        comment={request.comment}
        cancelPaymentRequest={params.cancelPaymentRequest}
        updatePaymentRequestNotified={params.updatePaymentRequestNotified}
      />
    </View>
  )
}

const OutgoingPaymentRequestListScreen = (props: Props) => {
  return (
    <NotificationList
      items={props.paymentRequests}
      listItemRenderer={listItemRenderer(props)}
      dollarBalance={props.dollarBalance}
    />
  )
}

OutgoingPaymentRequestListScreen.navigationOptions = titleWithBalanceNavigationOptions(
  i18n.t('walletFlow5:outgoingPaymentRequests')
)

export default connect<StateProps, DispatchProps, {}, RootState>(mapStateToProps, {
  cancelPaymentRequest,
  updatePaymentRequestNotified,
})(withTranslation(Namespaces.paymentRequestFlow)(OutgoingPaymentRequestListScreen))
