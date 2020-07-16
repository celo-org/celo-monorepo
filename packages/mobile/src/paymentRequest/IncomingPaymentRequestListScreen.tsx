import { CURRENCY_ENUM } from '@celo/utils/src/currencies'
import React from 'react'
import { WithTranslation } from 'react-i18next'
import { View } from 'react-native'
import { connect } from 'react-redux'
import { getIncomingPaymentRequests } from 'src/account/selectors'
import { PaymentRequest } from 'src/account/types'
import i18n, { Namespaces, withTranslation } from 'src/i18n'
import { HeaderTitleWithBalance } from 'src/navigator/Headers'
import { NotificationList } from 'src/notifications/NotificationList'
import IncomingPaymentRequestListItem from 'src/paymentRequest/IncomingPaymentRequestListItem'
import { getRecipientFromPaymentRequest } from 'src/paymentRequest/utils'
import { NumberToRecipient } from 'src/recipients/recipient'
import { recipientCacheSelector } from 'src/recipients/reducer'
import { RootState } from 'src/redux/reducers'

interface StateProps {
  dollarBalance: string | null
  paymentRequests: PaymentRequest[]
  recipientCache: NumberToRecipient
}

const mapStateToProps = (state: RootState): StateProps => {
  return {
    dollarBalance: state.stableToken.balance,
    paymentRequests: getIncomingPaymentRequests(state),
    recipientCache: recipientCacheSelector(state),
  }
}

type Props = WithTranslation & StateProps

export const listItemRenderer = (props: { recipientCache: NumberToRecipient }) => (
  request: PaymentRequest,
  key: number | undefined = undefined
) => (
  <View key={key}>
    <IncomingPaymentRequestListItem
      id={request.uid || ''}
      amount={request.amount}
      requester={getRecipientFromPaymentRequest(request, props.recipientCache)}
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
