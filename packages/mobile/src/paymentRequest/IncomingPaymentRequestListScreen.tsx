import { CURRENCY_ENUM } from '@celo/utils/src/currencies'
import { StackScreenProps } from '@react-navigation/stack/lib/typescript/src/types'
import React from 'react'
import { WithTranslation } from 'react-i18next'
import { View } from 'react-native'
import { connect } from 'react-redux'
import { getIncomingPaymentRequests } from 'src/account/selectors'
import { PaymentRequest } from 'src/account/types'
import { declinePaymentRequest } from 'src/firebase/actions'
import i18n, { Namespaces, withTranslation } from 'src/i18n'
import { HeaderTitleWithBalance } from 'src/navigator/Headers'
import { Screens } from 'src/navigator/Screens'
import { StackParamList } from 'src/navigator/types'
import { NotificationList } from 'src/notifications/NotificationList'
import IncomingPaymentRequestListItem from 'src/paymentRequest/IncomingPaymentRequestListItem'
import {
  AddressValidationCheckCache,
  getRecipientFromPaymentRequest,
} from 'src/paymentRequest/utils'
import { NumberToRecipient } from 'src/recipients/recipient'
import { recipientCacheSelector } from 'src/recipients/reducer'
import { RootState } from 'src/redux/reducers'

type NavProps = StackScreenProps<StackParamList, Screens.IncomingPaymentRequestListScreen>
interface StateProps {
  dollarBalance: string | null
  paymentRequests: PaymentRequest[]
  recipientCache: NumberToRecipient
}

interface DispatchProps {
  declinePaymentRequest: typeof declinePaymentRequest
}

const mapStateToProps = (state: RootState): StateProps => {
  return {
    dollarBalance: state.stableToken.balance,
    paymentRequests: getIncomingPaymentRequests(state),
    recipientCache: recipientCacheSelector(state),
  }
}

const mapDispatchToProps = {
  declinePaymentRequest,
}

type Props = WithTranslation & StateProps & DispatchProps & NavProps

export const listItemRenderer = (props: {
  recipientCache: NumberToRecipient
  declinePaymentRequest: typeof declinePaymentRequest
  addressValidationCheckCache: AddressValidationCheckCache
}) => (request: PaymentRequest, key: number | undefined = undefined) => {
  const requester = getRecipientFromPaymentRequest(request, props.recipientCache)
  const { addressValidationCheckCache } = props
  let addressValidationType

  if (addressValidationCheckCache && requester.e164PhoneNumber) {
    addressValidationType = addressValidationCheckCache[requester.e164PhoneNumber]
  }

  return (
    <View key={key}>
      <IncomingPaymentRequestListItem
        id={request.uid || ''}
        amount={request.amount}
        requester={requester}
        comment={request.comment}
        declinePaymentRequest={props.declinePaymentRequest}
        addressValidationType={addressValidationType}
      />
    </View>
  )
}

class IncomingPaymentRequestListScreen extends React.Component<Props> {
  static navigationOptions = () => ({
    headerTitle: (
      <HeaderTitleWithBalance
        title={i18n.t('walletFlow5:incomingPaymentRequests')}
        token={CURRENCY_ENUM.DOLLAR}
      />
    ),
  })

  render = () => {
    const { recipientCache, paymentRequests } = this.props
    const { addressValidationCheckCache } = this.props.route.params
    return (
      <NotificationList
        items={paymentRequests}
        listItemRenderer={listItemRenderer({
          declinePaymentRequest: this.props.declinePaymentRequest,
          recipientCache,
          addressValidationCheckCache,
        })}
        dollarBalance={this.props.dollarBalance}
      />
    )
  }
}

export default connect<StateProps, DispatchProps, {}, RootState>(
  mapStateToProps,
  mapDispatchToProps
)(withTranslation<Props>(Namespaces.paymentRequestFlow)(IncomingPaymentRequestListScreen))
