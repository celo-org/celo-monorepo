import BaseNotification from '@celo/react-components/components/BaseNotification'
import * as React from 'react'
import { WithNamespaces, withNamespaces } from 'react-i18next'
import { Image, Platform, StyleSheet, View } from 'react-native'
import SendIntentAndroid from 'react-native-send-intent'
import CeloAnalytics from 'src/analytics/CeloAnalytics'
import { CustomEventNames } from 'src/analytics/constants'
import { componentWithAnalytics } from 'src/analytics/wrapper'
import { ErrorMessages } from 'src/app/ErrorMessages'
import { EscrowedPayment } from 'src/escrow/actions'
import { Namespaces } from 'src/i18n'
import { inviteFriendsIcon } from 'src/images/Images'
import { navigate } from 'src/navigator/NavigationService'
import { Screens } from 'src/navigator/Screens'
import NotificationAmount from 'src/paymentRequest/NotificationAmount'
import { navigateToURI } from 'src/utils/linking'
import Logger from 'src/utils/Logger'

interface OwnProps {
  payment: EscrowedPayment
}

type Props = OwnProps & WithNamespaces

const TAG = 'EscrowedPaymentListItem'

export class EscrowedPaymentListItem extends React.PureComponent<Props> {
  onSendMessage = () => {
    const { payment, t } = this.props
    const recipientPhoneNumber = payment.recipientPhone
    CeloAnalytics.track(CustomEventNames.clicked_escrowed_payment_send_message)
    // TODO: open up whatsapp/text message slider with pre populated message
    try {
      if (Platform.OS === 'android') {
        SendIntentAndroid.sendSms(recipientPhoneNumber, t('escrowedPaymentReminderSms'))
      } else {
        // TODO look into using MFMessageComposeViewController to prefill the body for iOS
        navigateToURI(`sms:${recipientPhoneNumber}`)
      }
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
    return [
      {
        text: t('sendMessage'),
        onPress: this.onSendMessage,
      },
      {
        text: t('reclaimPayment'),
        onPress: this.onReclaimPayment,
      },
    ]
  }

  getTitle() {
    const { t, payment } = this.props
    const displayName = payment.recipientContact
      ? payment.recipientContact.displayName
      : payment.recipientPhone
    return t('escrowedPaymentReminderListItemTitle', { mobile: displayName })
  }

  render() {
    const { payment } = this.props

    return (
      <BaseNotification
        title={this.getTitle()}
        icon={<Image source={inviteFriendsIcon} style={styles.image} resizeMode="contain" />}
        ctas={this.getCTA()}
        roundedBorders={false}
        callout={<NotificationAmount amount={payment.amount} />}
      >
        <View style={styles.body} />
      </BaseNotification>
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
  payment: {
    flex: 1,
  },
})

export default componentWithAnalytics(
  withNamespaces(Namespaces.walletFlow5)(EscrowedPaymentListItem)
)
