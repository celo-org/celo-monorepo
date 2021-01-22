import { CURRENCY_ENUM } from '@celo/utils/src/currencies'
import React from 'react'
import { WithTranslation } from 'react-i18next'
import { View } from 'react-native'
import { connect } from 'react-redux'
import i18n, { Namespaces, withTranslation } from 'src/i18n'
import { addressToDisplayNameSelector, addressToE164NumberSelector } from 'src/identity/reducer'
import { HeaderTitleWithBalance } from 'src/navigator/Headers'
import { NotificationList } from 'src/notifications/NotificationList'
import IncomingPaymentRequestListItem from 'src/paymentRequest/IncomingPaymentRequestListItem'
import { getIncomingPaymentRequests } from 'src/paymentRequest/selectors'
import { PaymentRequest } from 'src/paymentRequest/types'
import { getRecipientFromAddress, RecipientInfo } from 'src/recipients/recipient'
import { phoneRecipientCacheSelector, valoraRecipientCacheSelector } from 'src/recipients/reducer'
import { RootState } from 'src/redux/reducers'

interface StateProps {
  dollarBalance: string | null
  paymentRequests: PaymentRequest[]
  recipientInfo: RecipientInfo
}

const mapStateToProps = (state: RootState): StateProps => ({
  dollarBalance: state.stableToken.balance,
  paymentRequests: getIncomingPaymentRequests(state),
  recipientInfo: {
    addressToE164Number: addressToE164NumberSelector(state),
    phoneRecipientCache: phoneRecipientCacheSelector(state),
    valoraRecipientCache: valoraRecipientCacheSelector(state),
    addressToDisplayName: addressToDisplayNameSelector(state),
  },
})

type Props = WithTranslation & StateProps

export const listItemRenderer = (props: { recipientInfo: RecipientInfo }) => (
  request: PaymentRequest,
  key: number | undefined = undefined
) => (
  <View key={key}>
    <IncomingPaymentRequestListItem
      id={request.uid || ''}
      amount={request.amount}
      requester={getRecipientFromAddress(request.requesterAddress, props.recipientInfo)}
      comment={request.comment}
    />
  </View>
)

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
    return (
      <NotificationList
        items={this.props.paymentRequests}
        listItemRenderer={listItemRenderer(this.props)}
        dollarBalance={this.props.dollarBalance}
      />
    )
  }
}

export default connect<StateProps, {}, {}, RootState>(
  mapStateToProps,
  {}
)(withTranslation<Props>(Namespaces.paymentRequestFlow)(IncomingPaymentRequestListScreen))
