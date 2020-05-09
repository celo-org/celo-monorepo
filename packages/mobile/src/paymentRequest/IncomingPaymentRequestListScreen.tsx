import React from 'react'
import { WithTranslation } from 'react-i18next'
import { View } from 'react-native'
import { NavigationInjectedProps } from 'react-navigation'
import { connect } from 'react-redux'
import { getIncomingPaymentRequests } from 'src/account/selectors'
import { PaymentRequest } from 'src/account/types'
import { declinePaymentRequest } from 'src/firebase/actions'
import i18n, { Namespaces, withTranslation } from 'src/i18n'
import { fetchPhoneAddressesAndRecipientVerificationStatus } from 'src/identity/actions'
import { e164NumberToAddressSelector, E164NumberToAddressType } from 'src/identity/reducer'
import {
  NotificationList,
  titleWithBalanceNavigationOptions,
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
  manualAddressValidationRequired: boolean
  fullValidationRequired: boolean
}

interface DispatchProps {
  declinePaymentRequest: typeof declinePaymentRequest
  fetchPhoneAddressesAndRecipientVerificationStatus: typeof fetchPhoneAddressesAndRecipientVerificationStatus
}

const mapStateToProps = (state: RootState): StateProps => {
  const { manualAddressValidationRequired, fullValidationRequired } = state.send
  return {
    dollarBalance: state.stableToken.balance,
    paymentRequests: getIncomingPaymentRequests(state),
    e164PhoneNumberAddressMapping: e164NumberToAddressSelector(state),
    recipientCache: recipientCacheSelector(state),
    manualAddressValidationRequired,
    fullValidationRequired,
  }
}

const mapDispatchToProps = {
  declinePaymentRequest,
  fetchPhoneAddressesAndRecipientVerificationStatus,
}

type Props = NavigationInjectedProps & WithTranslation & StateProps & DispatchProps

export const listItemRenderer = (params: {
  recipientCache: NumberToRecipient
  declinePaymentRequest: typeof declinePaymentRequest
  fetchPhoneAddressesAndRecipientVerificationStatus: typeof fetchPhoneAddressesAndRecipientVerificationStatus
  manualAddressValidationRequired: boolean
  fullValidationRequired: boolean
}) => (request: PaymentRequest, key: number | undefined = undefined) => {
  const requester = getRecipientFromPaymentRequest(request, params.recipientCache)

  return (
    <View key={key}>
      <IncomingPaymentRequestListItem
        id={request.uid || ''}
        amount={request.amount}
        requester={requester}
        comment={request.comment}
        declinePaymentRequest={params.declinePaymentRequest}
        fetchPhoneAddressesAndRecipientVerificationStatus={
          params.fetchPhoneAddressesAndRecipientVerificationStatus
        }
        manualAddressValidationRequired={params.manualAddressValidationRequired}
        fullValidationRequired={params.fullValidationRequired}
      />
    </View>
  )
}

const IncomingPaymentRequestListScreen = (props: Props) => {
  return (
    <NotificationList
      items={props.paymentRequests}
      listItemRenderer={listItemRenderer(props)}
      dollarBalance={props.dollarBalance}
    />
  )
}

IncomingPaymentRequestListScreen.navigationOptions = titleWithBalanceNavigationOptions(
  i18n.t('walletFlow5:incomingPaymentRequests')
)

export default connect<StateProps, DispatchProps, {}, RootState>(
  mapStateToProps,
  mapDispatchToProps
)(withTranslation(Namespaces.paymentRequestFlow)(IncomingPaymentRequestListScreen))
