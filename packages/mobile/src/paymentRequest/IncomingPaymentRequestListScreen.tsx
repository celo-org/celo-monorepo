import { CURRENCY_ENUM } from '@celo/utils/src/currencies'
import React from 'react'
import { WithTranslation } from 'react-i18next'
import { View } from 'react-native'
import { connect } from 'react-redux'
import { getIncomingPaymentRequests } from 'src/account/selectors'
import { PaymentRequest } from 'src/account/types'
import { declinePaymentRequest } from 'src/firebase/actions'
import i18n, { Namespaces, withTranslation } from 'src/i18n'
import { fetchAddressesAndValidate } from 'src/identity/actions'
import {
  AddressValidationType,
  e164NumberToAddressSelector,
  E164NumberToAddressType,
} from 'src/identity/reducer'
import { HeaderTitleWithBalance } from 'src/navigator/Headers'
import { NotificationList } from 'src/notifications/NotificationList'
import IncomingPaymentRequestListItem from 'src/paymentRequest/IncomingPaymentRequestListItem'
import {
  getAddressValidationCheckCache,
  getRecipientFromPaymentRequest,
} from 'src/paymentRequest/utils'
import { NumberToRecipient } from 'src/recipients/recipient'
import { recipientCacheSelector } from 'src/recipients/reducer'
import { RootState } from 'src/redux/reducers'
interface StateProps {
  dollarBalance: string | null
  paymentRequests: PaymentRequest[]
  e164PhoneNumberAddressMapping: E164NumberToAddressType
  recipientCache: NumberToRecipient
  addressValidationCheckCache: AddressValidationCheckCache
}

interface DispatchProps {
  declinePaymentRequest: typeof declinePaymentRequest
  fetchAddressesAndValidate: typeof fetchAddressesAndValidate
}

export interface AddressValidationCheckCache {
  [e164Number: string]: AddressValidationType
}

const mapStateToProps = (state: RootState): StateProps => {
  const paymentRequests = getIncomingPaymentRequests(state)
  const e164PhoneNumberAddressMapping = e164NumberToAddressSelector(state)
  const recipientCache = recipientCacheSelector(state)
  const { secureSendPhoneNumberMapping } = state.identity
  const addressValidationCheckCache = getAddressValidationCheckCache(
    paymentRequests,
    recipientCache,
    secureSendPhoneNumberMapping
  )

  return {
    dollarBalance: state.stableToken.balance,
    paymentRequests,
    e164PhoneNumberAddressMapping,
    recipientCache,
    addressValidationCheckCache,
  }
}

const mapDispatchToProps = {
  declinePaymentRequest,
  fetchAddressesAndValidate,
}

type Props = WithTranslation & StateProps & DispatchProps

export const listItemRenderer = (props: {
  recipientCache: NumberToRecipient
  declinePaymentRequest: typeof declinePaymentRequest
  addressValidationCheckCache?: AddressValidationCheckCache
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

  componentDidMount() {
    // Need to check latest mapping to prevent user from accepting fradulent requests
    this.fetchLatestAddressesAndValidate()
  }

  fetchLatestAddressesAndValidate = () => {
    const { paymentRequests } = this.props

    // TODO: Look into creating a batch lookup function so we dont rerender on each lookup
    paymentRequests.forEach((paymentRequest) => {
      const recipient = getRecipientFromPaymentRequest(paymentRequest, this.props.recipientCache)
      const { e164PhoneNumber } = recipient
      if (e164PhoneNumber) {
        this.props.fetchAddressesAndValidate(e164PhoneNumber)
      }
    })
  }

  render = () => {
    return (
      <NotificationList
        items={this.props.paymentRequests}
        listItemRenderer={listItemRenderer(this.props)}
        dollarBalance={this.props.dollarBalance}
      />
    )
  }
}

export default connect<StateProps, DispatchProps, {}, RootState>(
  mapStateToProps,
  mapDispatchToProps
)(withTranslation(Namespaces.paymentRequestFlow)(IncomingPaymentRequestListScreen))
