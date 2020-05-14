import { CURRENCY_ENUM } from '@celo/utils/src/currencies'
import React from 'react'
import { WithTranslation } from 'react-i18next'
import { View } from 'react-native'
import { NavigationInjectedProps } from 'react-navigation'
import { connect } from 'react-redux'
import { getIncomingPaymentRequests } from 'src/account/selectors'
import { PaymentRequest } from 'src/account/types'
import { declinePaymentRequest } from 'src/firebase/actions'
import i18n, { Namespaces, withTranslation } from 'src/i18n'
import { fetchPhoneAddressesAndCheckIfRecipientValidationRequired } from 'src/identity/actions'
import { e164NumberToAddressSelector, E164NumberToAddressType } from 'src/identity/reducer'
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
  fetchPhoneAddressesAndCheckIfRecipientValidationRequired: typeof fetchPhoneAddressesAndCheckIfRecipientValidationRequired
}

export interface AddressValidationCheckCache {
  [e164Number: string]: {
    addressValidationRequired: boolean
    fullValidationRequired: boolean
  }
}

const mapStateToProps = (state: RootState): StateProps => {
  const paymentRequests = getIncomingPaymentRequests(state)
  const e164PhoneNumberAddressMapping = e164NumberToAddressSelector(state)
  const recipientCache = recipientCacheSelector(state)
  const { secureSendPhoneNumberMapping } = state.send
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
  fetchPhoneAddressesAndCheckIfRecipientValidationRequired,
}

type Props = NavigationInjectedProps & WithTranslation & StateProps & DispatchProps

export const listItemRenderer = (params: {
  recipientCache: NumberToRecipient
  declinePaymentRequest: typeof declinePaymentRequest
  addressValidationCheckCache?: AddressValidationCheckCache
}) => (request: PaymentRequest, key: number | undefined = undefined) => {
  const requester = getRecipientFromPaymentRequest(request, params.recipientCache)
  const { addressValidationCheckCache } = params
  let validationDetails

  if (addressValidationCheckCache) {
    if (!requester.e164PhoneNumber) {
      throw Error('Error finding phone number')
    }
    validationDetails = addressValidationCheckCache[requester.e164PhoneNumber]
  }

  return (
    <View key={key}>
      <IncomingPaymentRequestListItem
        id={request.uid || ''}
        amount={request.amount}
        requester={requester}
        comment={request.comment}
        declinePaymentRequest={params.declinePaymentRequest}
        validationDetails={validationDetails}
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
    // need to check latest mapping to prevent user from accepting fradulent requests
    this.fetchLatestPhoneAddressesAndRecipientVerificationStatuses()
  }

  fetchLatestPhoneAddressesAndRecipientVerificationStatuses = () => {
    const { paymentRequests } = this.props

    // TODO: look into creating a batch lookup function so we dont rerender on each lookup
    paymentRequests.forEach((paymentRequest) => {
      const recipient = getRecipientFromPaymentRequest(paymentRequest, this.props.recipientCache)
      const { e164PhoneNumber } = recipient
      if (!e164PhoneNumber) {
        throw new Error('Missing recipient e164Number for payment request')
      }

      this.props.fetchPhoneAddressesAndCheckIfRecipientValidationRequired(e164PhoneNumber)
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
