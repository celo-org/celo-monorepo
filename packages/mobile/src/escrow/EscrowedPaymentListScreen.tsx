import * as React from 'react'
import { WithTranslation } from 'react-i18next'
import { View } from 'react-native'
import { NavigationInjectedProps } from 'react-navigation'
import { connect } from 'react-redux'
import { EscrowedPayment } from 'src/escrow/actions'
import EscrowedPaymentListItem from 'src/escrow/EscrowedPaymentListItem'
import { getReclaimableEscrowPayments } from 'src/escrow/reducer'
import i18n, { Namespaces, withTranslation } from 'src/i18n'
import { InviteDetails } from 'src/invite/actions'
import { inviteesSelector } from 'src/invite/reducer'
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
  invitees: InviteDetails[]
}

const mapStateToProps = (state: RootState): StateProps => ({
  dollarBalance: state.stableToken.balance,
  sentEscrowedPayments: getReclaimableEscrowPayments(state),
  recipientCache: recipientCacheSelector(state),
  invitees: inviteesSelector(state),
})

interface SentEscrowPaymentsAndInvitees {
  payment: EscrowedPayment
  invitees: InviteDetails[]
}

type Props = NavigationInjectedProps & WithTranslation & StateProps

export const listItemRenderer = (
  item: SentEscrowPaymentsAndInvitees,
  key: number | undefined = undefined
) => {
  const { payment, invitees } = item
  return (
    <View key={key}>
      <EscrowedPaymentListItem payment={payment} invitees={invitees} />
    </View>
  )
}

const EscrowedPaymentListScreen = (props: Props) => {
  const items: SentEscrowPaymentsAndInvitees[] = props.sentEscrowedPayments.map((payment) => ({
    payment,
    invitees: props.invitees,
  }))
  return (
    <NotificationList
      items={items}
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
