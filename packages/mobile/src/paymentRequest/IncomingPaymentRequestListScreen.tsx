import { CURRENCY_ENUM } from '@celo/utils/src/currencies'
import React from 'react'
import { WithTranslation } from 'react-i18next'
import { View } from 'react-native'
import { connect } from 'react-redux'
import { getIncomingPaymentRequests } from 'src/account/selectors'
import i18n, { Namespaces, withTranslation } from 'src/i18n'
import { fetchAddressesAndValidate } from 'src/identity/actions'
import {
  addressToE164NumberSelector,
  AddressToE164NumberType,
  AddressValidationType,
  e164NumberToAddressSelector,
  E164NumberToAddressType,
} from 'src/identity/reducer'
import { HeaderTitleWithBalance } from 'src/navigator/Headers'
import { NotificationList } from 'src/notifications/NotificationList'
import { declinePaymentRequest } from 'src/paymentRequest/actions'
import IncomingPaymentRequestListItem from 'src/paymentRequest/IncomingPaymentRequestListItem'
import { PaymentRequest } from 'src/paymentRequest/types'
import {
  getAddressValidationCheckCache,
  getRequesterFromPaymentRequest,
} from 'src/paymentRequest/utils'
import { NumberToRecipient } from 'src/recipients/recipient'
import { recipientCacheSelector } from 'src/recipients/reducer'
import { RootState } from 'src/redux/reducers'

interface StateProps {
  dollarBalance: string | null
  paymentRequests: PaymentRequest[]
  e164PhoneNumberAddressMapping: E164NumberToAddressType
  addressToE164Number: AddressToE164NumberType
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
  const addressToE164Number = addressToE164NumberSelector(state)
  const e164PhoneNumberAddressMapping = e164NumberToAddressSelector(state)
  const recipientCache = recipientCacheSelector(state)
  const { secureSendPhoneNumberMapping } = state.identity
  // TODO use Reselect for this to avoid recomputing it on each redux
  // action dispatch (which will trigger this mapStateToProps)
  const addressValidationCheckCache = getAddressValidationCheckCache(
    paymentRequests,
    addressToE164Number,
    recipientCache,
    secureSendPhoneNumberMapping
  )

  return {
    dollarBalance: state.stableToken.balance,
    paymentRequests,
    addressToE164Number,
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
  addressToE164Number: AddressToE164NumberType
  recipientCache: NumberToRecipient
  declinePaymentRequest: typeof declinePaymentRequest
  addressValidationCheckCache?: AddressValidationCheckCache
}) => (request: PaymentRequest, key: number | undefined = undefined) => {
  const { addressValidationCheckCache, addressToE164Number, recipientCache } = props
  const requester = getRequesterFromPaymentRequest(request, addressToE164Number, recipientCache)
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
    const { paymentRequests, addressToE164Number, recipientCache } = this.props

    // TODO: Look into creating a batch lookup function so we dont rerender on each lookup
    paymentRequests.forEach((paymentRequest) => {
      const recipient = getRequesterFromPaymentRequest(
        paymentRequest,
        addressToE164Number,
        recipientCache
      )
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
)(withTranslation<Props>(Namespaces.paymentRequestFlow)(IncomingPaymentRequestListScreen))
