import React from 'react'
import { WithTranslation } from 'react-i18next'
import { NavigationInjectedProps } from 'react-navigation'
import { connect } from 'react-redux'
import { getIncomingPaymentRequests } from 'src/account/selectors'
import { PaymentRequest } from 'src/account/types'
import { updatePaymentRequestStatus } from 'src/firebase/actions'
import i18n, { Namespaces, withTranslation } from 'src/i18n'
import { fetchPhoneAddresses } from 'src/identity/actions'
import { e164NumberToAddressSelector, E164NumberToAddressType } from 'src/identity/reducer'
import {
  NotificationList,
  titleWithBalanceNavigationOptions,
  useBalanceInNavigationParam,
} from 'src/notifications/NotificationList'
import IncomingPaymentRequestListItem from 'src/paymentRequest/IncomingPaymentRequestListItem'
import { getRecipientFromPaymentRequest } from 'src/paymentRequest/utils'
import { NumberToRecipient } from 'src/recipients/recipient'
import { recipientCacheSelector } from 'src/recipients/reducer'
import { RootState } from 'src/redux/reducers'

interface StateProps {
  dollarBalance: string | null
  paymentRequests: PaymentRequest[]
  e164PhoneNumberAddressMapping: E164NumberToAddressType
  recipientCache: NumberToRecipient
}

interface DispatchProps {
  updatePaymentRequestStatus: typeof updatePaymentRequestStatus
  fetchPhoneAddresses: typeof fetchPhoneAddresses
}

const mapStateToProps = (state: RootState): StateProps => ({
  dollarBalance: state.stableToken.balance,
  paymentRequests: getIncomingPaymentRequests(state),
  e164PhoneNumberAddressMapping: e164NumberToAddressSelector(state),
  recipientCache: recipientCacheSelector(state),
})

type Props = NavigationInjectedProps & WithTranslation & StateProps & DispatchProps

export const listItemRenderer = (params: {
  recipientCache: NumberToRecipient
  updatePaymentRequestStatus: typeof updatePaymentRequestStatus
}) => (request: PaymentRequest, key: number | undefined = undefined) => {
  const requester = getRecipientFromPaymentRequest(request, params.recipientCache)

  return (
    <IncomingPaymentRequestListItem
      key={key}
      id={request.uid || ''}
      amount={request.amount}
      updatePaymentRequestStatus={params.updatePaymentRequestStatus}
      requester={requester}
      comment={request.comment}
    />
  )
}

const IncomingPaymentRequestListScreen = (props: Props) => {
  const { recipientCache, dollarBalance, navigation } = props
  useBalanceInNavigationParam(dollarBalance, navigation)
  return (
    <NotificationList
      items={props.paymentRequests}
      listItemRenderer={listItemRenderer({
        updatePaymentRequestStatus: props.updatePaymentRequestStatus,
        recipientCache,
      })}
      dollarBalance={props.dollarBalance}
    />
  )
}

IncomingPaymentRequestListScreen.navigationOptions = titleWithBalanceNavigationOptions(
  i18n.t('walletFlow5:incomingPaymentRequests')
)

export default connect<StateProps, DispatchProps, {}, RootState>(
  mapStateToProps,
  {
    updatePaymentRequestStatus,
    fetchPhoneAddresses,
  }
)(withTranslation(Namespaces.paymentRequestFlow)(IncomingPaymentRequestListScreen))
