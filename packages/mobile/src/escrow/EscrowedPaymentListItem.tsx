import RequestMessagingCard from '@celo/react-components/components/RequestMessagingCard'
import * as React from 'react'
import { WithTranslation } from 'react-i18next'
import { StyleSheet, View } from 'react-native'
import { connect } from 'react-redux'
import { HomeEvents } from 'src/analytics/Events'
import ValoraAnalytics from 'src/analytics/ValoraAnalytics'
import { ErrorMessages } from 'src/app/ErrorMessages'
import ContactCircle from 'src/components/ContactCircle'
import CurrencyDisplay from 'src/components/CurrencyDisplay'
import { EscrowedPayment } from 'src/escrow/actions'
import { CURRENCIES, CURRENCY_ENUM } from 'src/geth/consts'
import { NotificationBannerCTATypes, NotificationBannerTypes } from 'src/home/NotificationBox'
import { Namespaces, withTranslation } from 'src/i18n'
import { InviteDetails } from 'src/invite/actions'
import { sendSms } from 'src/invite/saga'
import { navigate } from 'src/navigator/NavigationService'
import { Screens } from 'src/navigator/Screens'
import { NumberToRecipient, Recipient } from 'src/recipients/recipient'
import { RootState } from 'src/redux/reducers'
import { divideByWei } from 'src/utils/formatting'
import Logger from 'src/utils/Logger'

interface OwnProps {
  payment: EscrowedPayment
  invitees: InviteDetails[]
}

interface StateProps {
  phoneRecipientCache: NumberToRecipient
}

type Props = OwnProps & WithTranslation & StateProps

const TAG = 'EscrowedPaymentListItem'

const testID = 'EscrowedPaymentListItem'

const mapStateToProps = (state: RootState): StateProps => {
  return {
    phoneRecipientCache: state.recipients.phoneRecipientCache,
  }
}

export class EscrowedPaymentListItem extends React.PureComponent<Props> {
  onRemind = async () => {
    const { payment, t, invitees } = this.props
    const recipientPhoneNumber = payment.recipientPhone
    ValoraAnalytics.track(HomeEvents.notification_select, {
      notificationType: NotificationBannerTypes.escrow_tx_pending,
      selectedAction: NotificationBannerCTATypes.remind,
    })

    try {
      const inviteDetails = invitees.find(
        (inviteeObj) => recipientPhoneNumber === inviteeObj.e164Number
      )

      let message
      if (!inviteDetails) {
        message = t('walletFlow5:escrowedPaymentReminderSmsNoData')
      } else {
        const { inviteCode, inviteLink } = inviteDetails
        message = t('walletFlow5:escrowedPaymentReminderSms', {
          code: inviteCode,
          link: inviteLink,
        })
      }

      await sendSms(recipientPhoneNumber, message)
    } catch (error) {
      // TODO: use the showError saga instead of the Logger.showError, which is a hacky temp thing we used for a while that doesn't actually work on iOS
      Logger.showError(ErrorMessages.SMS_ERROR)
      Logger.error(TAG, `Error sending SMS to ${recipientPhoneNumber}`, error)
    }
  }
  onReclaimPayment = () => {
    const { payment } = this.props
    const reclaimPaymentInput = payment
    ValoraAnalytics.track(HomeEvents.notification_select, {
      notificationType: NotificationBannerTypes.escrow_tx_pending,
      selectedAction: NotificationBannerCTATypes.reclaim,
    })
    navigate(Screens.ReclaimPaymentConfirmationScreen, { reclaimPaymentInput })
  }
  getCTA = () => {
    const { t } = this.props
    const ctas = []
    ctas.push({
      text: t('global:remind'),
      onPress: this.onRemind,
    })
    ctas.push({
      text: t('global:reclaim'),
      onPress: this.onReclaimPayment,
    })
    return ctas
  }

  render() {
    const { t, payment, phoneRecipientCache } = this.props
    const amount = {
      value: divideByWei(payment.amount),
      currencyCode: CURRENCIES[CURRENCY_ENUM.DOLLAR].code,
    }
    const recipient: Recipient = phoneRecipientCache[payment.recipientPhone] ?? {
      e164PhoneNumber: payment.recipientPhone,
    }

    return (
      <View style={styles.container}>
        <RequestMessagingCard
          title={t('escrowPaymentNotificationTitle', { mobile: payment.recipientPhone })}
          amount={<CurrencyDisplay amount={amount} />}
          details={payment.message}
          icon={
            <ContactCircle
              recipient={recipient}
              // TODO: Add thumbnailPath={}
            />
          }
          callToActions={this.getCTA()}
          testID={testID}
        />
      </View>
    )
  }
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
})

export default connect<StateProps, {}, {}, RootState>(
  mapStateToProps,
  {}
)(withTranslation<Props>(Namespaces.inviteFlow11)(EscrowedPaymentListItem))
