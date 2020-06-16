import RequestMessagingCard from '@celo/react-components/components/RequestMessagingCard'
import * as React from 'react'
import { WithTranslation } from 'react-i18next'
import { Image, StyleSheet, View } from 'react-native'
import CeloAnalytics from 'src/analytics/CeloAnalytics'
import { CustomEventNames } from 'src/analytics/constants'
import { ErrorMessages } from 'src/app/ErrorMessages'
import CurrencyDisplay from 'src/components/CurrencyDisplay'
import { EscrowedPayment } from 'src/escrow/actions'
import { CURRENCIES, CURRENCY_ENUM } from 'src/geth/consts'
import { Namespaces, withTranslation } from 'src/i18n'
import { inviteFriendsIcon } from 'src/images/Images'
import { InviteDetails } from 'src/invite/actions'
import { sendSms } from 'src/invite/saga'
import { navigate } from 'src/navigator/NavigationService'
import { Screens } from 'src/navigator/Screens'
import { divideByWei } from 'src/utils/formatting'
import Logger from 'src/utils/Logger'

interface OwnProps {
  payment: EscrowedPayment
  invitees: InviteDetails[]
}

type Props = OwnProps & WithTranslation

const TAG = 'EscrowedPaymentListItem'

const testID = 'EscrowedPaymentListItem'

export class EscrowedPaymentListItem extends React.PureComponent<Props> {
  onRemind = async () => {
    const { payment, t, invitees } = this.props
    const recipientPhoneNumber = payment.recipientPhone
    CeloAnalytics.track(CustomEventNames.clicked_escrowed_payment_send_message)

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
    CeloAnalytics.track(CustomEventNames.clicked_escrowed_payment_notification)
    navigate(Screens.ReclaimPaymentConfirmationScreen, { reclaimPaymentInput })
  }
  getCTA = () => {
    const { t } = this.props
    const ctas = []
    if (this.getDisplayName()) {
      ctas.push({
        text: t('global:remind'),
        onPress: this.onRemind,
      })
    }
    ctas.push({
      text: t('global:reclaim'),
      onPress: this.onReclaimPayment,
    })
    return ctas
  }

  getDisplayName() {
    const { payment } = this.props
    // TODO(Rossy) Get contact number from recipient cache here
    return payment.recipientPhone
  }

  render() {
    const { t, payment } = this.props
    const mobile = this.getDisplayName() || t('global:unknown').toLowerCase()
    const amount = {
      value: divideByWei(payment.amount),
      currencyCode: CURRENCIES[CURRENCY_ENUM.DOLLAR].code,
    }

    return (
      <View style={styles.container}>
        <RequestMessagingCard
          title={t('escrowPaymentNotificationTitle', { mobile })}
          amount={<CurrencyDisplay amount={amount} />}
          details={payment.message}
          // TODO: use new avatar
          icon={<Image source={inviteFriendsIcon} style={styles.image} resizeMode="contain" />}
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
  body: {
    marginTop: 5,
    flexDirection: 'row',
  },
  image: {
    width: 30,
    height: 30,
  },
  payment: {
    flex: 1,
  },
})

export default withTranslation(Namespaces.inviteFlow11)(EscrowedPaymentListItem)
