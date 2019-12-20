import variables from '@celo/react-components/styles/variables'
import * as React from 'react'
import { WithNamespaces, withNamespaces } from 'react-i18next'
import { Image, StyleSheet } from 'react-native'
import CeloAnalytics from 'src/analytics/CeloAnalytics'
import { CustomEventNames } from 'src/analytics/constants'
import { EscrowedPayment } from 'src/escrow/actions'
import EscrowedPaymentLineItem from 'src/escrow/EscrowedPaymentLineItem'
import { listItemRenderer } from 'src/escrow/EscrowedPaymentListScreen'
import { Namespaces } from 'src/i18n'
import { inviteFriendsIcon } from 'src/images/Images'
import { navigate } from 'src/navigator/NavigationService'
import { Stacks } from 'src/navigator/Screens'
import SummaryNotification from 'src/notifications/SummaryNotification'

interface OwnProps {
  payments: EscrowedPayment[]
}

type Props = OwnProps & WithNamespaces

export class EscrowedPaymentReminderSummaryNotification extends React.Component<Props> {
  onReview = () => {
    CeloAnalytics.track(CustomEventNames.escrowed_payment_review)
    navigate(Stacks.EscrowStack)
  }

  itemRenderer = (item: EscrowedPayment) => {
    return <EscrowedPaymentLineItem payment={item} key={item.paymentID} />
  }

  render() {
    const { payments, t } = this.props
    return payments.length === 1 ? (
      listItemRenderer(payments[0])
    ) : (
      <SummaryNotification<EscrowedPayment>
        items={payments}
        title={t('escrowedPaymentReminder')}
        icon={<Image source={inviteFriendsIcon} style={styles.image} resizeMode="contain" />}
        onReview={this.onReview}
        itemRenderer={this.itemRenderer}
      />
    )
  }
}

const styles = StyleSheet.create({
  body: {
    marginTop: 5,
    flexDirection: 'row',
  },
  image: {
    width: 30,
    height: 30,
  },
  requests: {
    flex: 1,
  },
  counter: {
    paddingLeft: variables.contentPadding,
    justifyContent: 'flex-end',
  },
})

export default withNamespaces(Namespaces.walletFlow5)(EscrowedPaymentReminderSummaryNotification)
