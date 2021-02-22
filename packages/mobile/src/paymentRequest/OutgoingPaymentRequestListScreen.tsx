import React from 'react'
import { WithTranslation } from 'react-i18next'
import { View } from 'react-native'
import { connect } from 'react-redux'
import i18n, { Namespaces, withTranslation } from 'src/i18n'
import { e164NumberToAddressSelector, E164NumberToAddressType } from 'src/identity/reducer'
import {
  NotificationList,
  titleWithBalanceNavigationOptions,
} from 'src/notifications/NotificationList'
import { cancelPaymentRequest, updatePaymentRequestNotified } from 'src/paymentRequest/actions'
import OutgoingPaymentRequestListItem from 'src/paymentRequest/OutgoingPaymentRequestListItem'
import { getOutgoingPaymentRequests } from 'src/paymentRequest/selectors'
import { PaymentRequest } from 'src/paymentRequest/types'
import { getRecipientFromAddress, RecipientInfo } from 'src/recipients/recipient'
import { recipientInfoSelector } from 'src/recipients/reducer'
import { RootState } from 'src/redux/reducers'

interface StateProps {
  dollarBalance: string | null
  paymentRequests: PaymentRequest[]
  e164PhoneNumberAddressMapping: E164NumberToAddressType
  recipientInfo: RecipientInfo
}

interface DispatchProps {
  cancelPaymentRequest: typeof cancelPaymentRequest
  updatePaymentRequestNotified: typeof updatePaymentRequestNotified
}

const mapStateToProps = (state: RootState): StateProps => ({
  dollarBalance: state.stableToken.balance,
  paymentRequests: getOutgoingPaymentRequests(state),
  e164PhoneNumberAddressMapping: e164NumberToAddressSelector(state),
  recipientInfo: recipientInfoSelector(state),
})

type Props = WithTranslation & StateProps & DispatchProps

export const listItemRenderer = (params: {
  recipientInfo: RecipientInfo
  cancelPaymentRequest: typeof cancelPaymentRequest
  updatePaymentRequestNotified: typeof updatePaymentRequestNotified
}) => (request: PaymentRequest, key: number | undefined = undefined) => {
  const requestee = getRecipientFromAddress(request.requesteeAddress, params.recipientInfo)
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
})(withTranslation<Props>(Namespaces.paymentRequestFlow)(OutgoingPaymentRequestListScreen))
