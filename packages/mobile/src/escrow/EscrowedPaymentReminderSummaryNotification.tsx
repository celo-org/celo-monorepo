import * as React from 'react'
import { WithTranslation } from 'react-i18next'
import { Image } from 'react-native'
import { HomeEvents } from 'src/analytics/Events'
import ValoraAnalytics from 'src/analytics/ValoraAnalytics'
import { EscrowedPayment } from 'src/escrow/actions'
import EscrowedPaymentLineItem from 'src/escrow/EscrowedPaymentLineItem'
import { listItemRenderer } from 'src/escrow/EscrowedPaymentListScreen'
import { NotificationBannerCTATypes, NotificationBannerTypes } from 'src/home/NotificationBox'
import { Namespaces, withTranslation } from 'src/i18n'
import { notificationInvite } from 'src/images/Images'
import { InviteDetails } from 'src/invite/actions'
import { navigate } from 'src/navigator/NavigationService'
import { Screens } from 'src/navigator/Screens'
import SummaryNotification from 'src/notifications/SummaryNotification'

interface OwnProps {
  payments: EscrowedPayment[]
  invitees: InviteDetails[]
}

type Props = OwnProps & WithTranslation

export class EscrowedPaymentReminderSummaryNotification extends React.Component<Props> {
  onReview = () => {
    ValoraAnalytics.track(HomeEvents.notification_select, {
      notificationType: NotificationBannerTypes.escrow_tx_summary,
      selectedAction: NotificationBannerCTATypes.review,
    })
    navigate(Screens.EscrowedPaymentListScreen)
  }

  itemRenderer = (item: EscrowedPayment) => {
    return <EscrowedPaymentLineItem payment={item} key={item.paymentID} />
  }

  render() {
    const { payments, invitees, t } = this.props
    return payments.length === 1 ? (
      listItemRenderer({ payment: payments[0], invitees })
    ) : (
      <SummaryNotification<EscrowedPayment>
        items={payments}
        title={t('escrowedPaymentReminderSummaryTitle', { count: payments.length })}
        detailsI18nKey="walletFlow5:escrowedPaymentReminderSummaryDetails"
        icon={<Image source={notificationInvite} resizeMode="contain" />}
        onReview={this.onReview}
        itemRenderer={this.itemRenderer}
      />
    )
  }
}

export default withTranslation<Props>(Namespaces.walletFlow5)(
  EscrowedPaymentReminderSummaryNotification
)
