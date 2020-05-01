import * as React from 'react'
import { WithTranslation } from 'react-i18next'
import { View } from 'react-native'
import { NavigationInjectedProps } from 'react-navigation'
import { connect } from 'react-redux'
import { EscrowedPayment } from 'src/escrow/actions'
import EscrowedPaymentListItem from 'src/escrow/EscrowedPaymentListItem'
import { getReclaimableEscrowPayments } from 'src/escrow/reducer'
import i18n, { Namespaces, withTranslation } from 'src/i18n'
import {
  NotificationList,
  titleWithBalanceNavigationOptions,
} from 'src/notifications/NotificationList'
import { NumberToRecipient } from 'src/recipients/recipient'
import { recipientCacheSelector } from 'src/recipients/reducer'
import { RootState } from 'src/redux/reducers'

interface StateProps {
  dollarBalance: string | null
  sentEscrowedPayments: EscrowedPayment[]
  recipientCache: NumberToRecipient
}

const mapStateToProps = (state: RootState): StateProps => ({
  dollarBalance: state.stableToken.balance,
  sentEscrowedPayments: getReclaimableEscrowPayments(state),
  recipientCache: recipientCacheSelector(state),
})

type Props = NavigationInjectedProps & WithTranslation & StateProps

export const listItemRenderer = (payment: EscrowedPayment, key: number | undefined = undefined) => {
  return (
    <View key={key}>
      <EscrowedPaymentListItem payment={payment} />
    </View>
  )
}

const EscrowedPaymentListScreen = (props: Props) => {
  return (
    <NotificationList
      items={props.sentEscrowedPayments}
      listItemRenderer={listItemRenderer}
      dollarBalance={props.dollarBalance}
    />
  )
}

EscrowedPaymentListScreen.navigationOptions = titleWithBalanceNavigationOptions(
  i18n.t('walletFlow5:escrowedPaymentReminder')
)

export default connect<StateProps, {}, {}, RootState>(mapStateToProps)(
  withTranslation(Namespaces.global)(EscrowedPaymentListScreen)
)
