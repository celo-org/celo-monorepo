import * as React from 'react'
import { WithTranslation } from 'react-i18next'
import { View } from 'react-native'
import { NavigationInjectedProps } from 'react-navigation'
import { connect } from 'react-redux'
import { EscrowedPayment } from 'src/escrow/actions'
import EscrowedPaymentListItem from 'src/escrow/EscrowedPaymentListItem'
import { getReclaimableEscrowPayments } from 'src/escrow/saga'
import { updatePaymentRequestStatus } from 'src/firebase/actions'
import i18n, { Namespaces, withTranslation } from 'src/i18n'
import { fetchPhoneAddresses } from 'src/identity/actions'
import {
  NotificationList,
  titleWithBalanceNavigationOptions,
  useBalanceInNavigationParam,
} from 'src/notifications/NotificationList'
import { NumberToRecipient } from 'src/recipients/recipient'
import { recipientCacheSelector } from 'src/recipients/reducer'
import { RootState } from 'src/redux/reducers'

interface StateProps {
  dollarBalance: string | null
  sentEscrowedPayments: EscrowedPayment[]
  recipientCache: NumberToRecipient
}

interface DispatchProps {
  updatePaymentRequestStatus: typeof updatePaymentRequestStatus
  fetchPhoneAddresses: typeof fetchPhoneAddresses
}

const mapStateToProps = (state: RootState): StateProps => ({
  dollarBalance: state.stableToken.balance,
  sentEscrowedPayments: getReclaimableEscrowPayments(state.escrow.sentEscrowedPayments),
  recipientCache: recipientCacheSelector(state),
})

type Props = NavigationInjectedProps & WithTranslation & StateProps & DispatchProps

export const listItemRenderer = (payment: EscrowedPayment, key: number | undefined = undefined) => {
  return (
    <View key={key}>
      <EscrowedPaymentListItem payment={payment} />
    </View>
  )
}

const EscrowedPaymentListScreen = (props: Props) => {
  const { dollarBalance, navigation } = props
  useBalanceInNavigationParam(dollarBalance, navigation)
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

export default connect<StateProps, DispatchProps, {}, RootState>(mapStateToProps, {
  updatePaymentRequestStatus,
  fetchPhoneAddresses,
})(withTranslation(Namespaces.global)(EscrowedPaymentListScreen))
