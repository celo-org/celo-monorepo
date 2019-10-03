import BaseNotification from '@celo/react-components/components/BaseNotification'
import * as React from 'react'
import { WithNamespaces, withNamespaces } from 'react-i18next'
import { Image, Linking, Platform, StyleSheet, View } from 'react-native'
import SendIntentAndroid from 'react-native-send-intent'
import CeloAnalytics from 'src/analytics/CeloAnalytics'
import { CustomEventNames } from 'src/analytics/constants'
import { componentWithAnalytics } from 'src/analytics/wrapper'
import { EscrowedPayment } from 'src/escrow/actions'
import EscrowedPaymentLineItem from 'src/escrow/EscrowedPaymentLineItem'
import { Namespaces } from 'src/i18n'
import { inviteFriendsIcon } from 'src/images/Images'
import { navigate } from 'src/navigator/NavigationService'
import { Screens } from 'src/navigator/Screens'
import Logger from 'src/utils/Logger'

interface OwnProps {
  payment: EscrowedPayment
}

type Props = OwnProps & WithNamespaces

export class EscrowedPaymentReminderNotification extends React.PureComponent<Props> {
  getCTA = () => {
    const { payment, t } = this.props
    const recipientPhoneNumber = payment.recipientPhone
    return [
      {
        text: t('sendMessage'),
        onPress: () => {
          CeloAnalytics.track(CustomEventNames.clicked_escrowed_payment_send_message)
          // TODO: open up whatsapp/text message slider with pre populated message
          try {
            if (Platform.OS === 'android') {
              SendIntentAndroid.sendSms(recipientPhoneNumber, t('escrowedPaymentReminderSms'))
            } else {
              // TODO look into using MFMessageComposeViewController to prefill the body for iOS
              Linking.openURL(`sms:${recipientPhoneNumber}`)
            }
          } catch {
            Logger.showError(t('SMSError'))
            Logger.error(
              'EscrowedPaymentReminderNotification/',
              t('SMSErrorDetails', {
                recipientNumber: recipientPhoneNumber,
              })
            )
          }
        },
      },
      {
        text: this.props.t('reclaimPayment'),
        onPress: () => {
          const reclaimPaymentInput = payment
          CeloAnalytics.track(CustomEventNames.clicked_escrowed_payment_notification)
          navigate(Screens.ReclaimPaymentConfirmationScreen, { reclaimPaymentInput })
        },
      },
    ]
  }

  getTitle() {
    const { t, payment } = this.props
    const displayName = payment.recipientContact
      ? payment.recipientContact.displayName
      : payment.recipientPhone
    return t('escrowedPaymentReminder', { mobile: displayName })
  }

  render() {
    const { payment } = this.props

    return (
      <BaseNotification
        title={this.getTitle()}
        icon={<Image source={inviteFriendsIcon} style={styles.image} resizeMode="contain" />}
        ctas={this.getCTA()}
        roundedBorders={true}
      >
        <View style={styles.body}>
          <View style={styles.payment}>
            <EscrowedPaymentLineItem payment={payment} />
          </View>
        </View>
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
  withNamespaces(Namespaces.walletFlow5)(EscrowedPaymentReminderNotification)
)
