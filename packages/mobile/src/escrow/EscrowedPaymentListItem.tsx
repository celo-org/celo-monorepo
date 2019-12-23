import BaseNotification from '@celo/react-components/components/BaseNotification'
import fontStyles from '@celo/react-components/styles/fonts'
import * as React from 'react'
import { WithTranslation } from 'react-i18next'
import { Image, Platform, StyleSheet, Text, View } from 'react-native'
import SendIntentAndroid from 'react-native-send-intent'
import CeloAnalytics from 'src/analytics/CeloAnalytics'
import { CustomEventNames } from 'src/analytics/constants'
import { componentWithAnalytics } from 'src/analytics/wrapper'
import { ErrorMessages } from 'src/app/ErrorMessages'
import { EscrowedPayment } from 'src/escrow/actions'
import { CURRENCIES, CURRENCY_ENUM } from 'src/geth/consts'
import { Namespaces, withTranslation } from 'src/i18n'
import { inviteFriendsIcon } from 'src/images/Images'
import { navigate } from 'src/navigator/NavigationService'
import { Screens } from 'src/navigator/Screens'
import { divideByWei, getCentAwareMoneyDisplay } from 'src/utils/formatting'
import { navigateToURI } from 'src/utils/linking'
import Logger from 'src/utils/Logger'

interface OwnProps {
  payment: EscrowedPayment
}

type Props = OwnProps & WithTranslation

const TAG = 'EscrowedPaymentListItem'

export class EscrowedPaymentListItem extends React.PureComponent<Props> {
  onRemind = () => {
    const { payment, t } = this.props
    const recipientPhoneNumber = payment.recipientPhone
    CeloAnalytics.track(CustomEventNames.clicked_escrowed_payment_send_message)
    // TODO: open up whatsapp/text message slider with pre populated message
    try {
      if (Platform.OS === 'android') {
        SendIntentAndroid.sendSms(recipientPhoneNumber, t('walletFlow5:escrowedPaymentReminderSms'))
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
    return payment.recipientContact ? payment.recipientContact.displayName : payment.recipientPhone
  }

  render() {
    const { t, payment } = this.props
    return (
      <View style={styles.container}>
        <BaseNotification
          title={t('escrowPaymentNotificationTitle', {
            mobile: this.getDisplayName() || t('global:unknown'),
            amount:
              CURRENCIES[CURRENCY_ENUM.DOLLAR].symbol +
              getCentAwareMoneyDisplay(divideByWei(payment.amount)),
          })}
          icon={<Image source={inviteFriendsIcon} style={styles.image} resizeMode="contain" />}
          ctas={this.getCTA()}
        >
          <Text style={fontStyles.bodySmall}>{payment.message || t('defaultComment')}</Text>
        </BaseNotification>
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

export default componentWithAnalytics(
  withTranslation(Namespaces.inviteFlow11)(EscrowedPaymentListItem)
)
