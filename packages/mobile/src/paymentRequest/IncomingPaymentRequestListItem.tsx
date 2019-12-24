import BaseNotification from '@celo/react-components/components/BaseNotification'
import ContactCircle from '@celo/react-components/components/ContactCircle'
import fontStyles from '@celo/react-components/styles/fonts'
import BigNumber from 'bignumber.js'
import * as React from 'react'
import { WithTranslation } from 'react-i18next'
import { Image, StyleSheet, Text, View } from 'react-native'
import { PaymentRequestStatus } from 'src/account/types'
import CeloAnalytics from 'src/analytics/CeloAnalytics'
import { CustomEventNames } from 'src/analytics/constants'
import { updatePaymentRequestStatus } from 'src/firebase/actions'
import { CURRENCIES, CURRENCY_ENUM } from 'src/geth/consts'
import { Namespaces, withTranslation } from 'src/i18n'
import { unknownUserIcon } from 'src/images/Images'
import { navigate } from 'src/navigator/NavigationService'
import { Screens } from 'src/navigator/Screens'
import { getRecipientThumbnail, Recipient } from 'src/recipients/recipient'
import { TransactionTypes } from 'src/transactions/reducer'
import { getCentAwareMoneyDisplay } from 'src/utils/formatting'
import Logger from 'src/utils/Logger'

interface OwnProps {
  requester: Recipient
  amount: string
  comment: string
  id: string
  updatePaymentRequestStatus: typeof updatePaymentRequestStatus
}

type Props = OwnProps & WithTranslation

const AVATAR_SIZE = 40

export class IncomingPaymentRequestListItem extends React.Component<Props> {
  onPay = () => {
    const { amount, comment: reason, requester: recipient } = this.props
    navigate(Screens.SendConfirmation, {
      confirmationInput: {
        reason,
        recipient,
        amount: new BigNumber(amount),
        recipientAddress: recipient.address,
        type: TransactionTypes.PAY_REQUEST,
      },
      onConfirm: this.onPaymentSuccess,
      onCancel: this.onPaymentDecline,
    })
  }

  onPaymentSuccess = () => {
    const { id } = this.props
    this.props.updatePaymentRequestStatus(id.toString(), PaymentRequestStatus.COMPLETED)
    Logger.showMessage(this.props.t('requestPaid'))
    CeloAnalytics.track(CustomEventNames.incoming_request_payment_pay)
  }

  onPaymentDecline = () => {
    const { id } = this.props
    this.props.updatePaymentRequestStatus(id.toString(), PaymentRequestStatus.DECLINED)
    Logger.showMessage(this.props.t('requestDeclined'))
    CeloAnalytics.track(CustomEventNames.incoming_request_payment_decline)
  }

  getCTA = () => {
    return [
      {
        text: this.props.t('global:pay'),
        onPress: this.onPay,
      },
      {
        text: this.props.t('global:decline'),
        onPress: this.onPaymentDecline,
      },
    ]
  }

  render() {
    const { requester, t } = this.props
    return (
      <View style={styles.container}>
        <BaseNotification
          icon={
            <ContactCircle
              size={AVATAR_SIZE}
              address={requester.address}
              name={requester.displayName}
              thumbnailPath={getRecipientThumbnail(requester)}
            >
              <Image source={unknownUserIcon} style={styles.unknownUser} />
            </ContactCircle>
          }
          title={t('incomingPaymentRequestNotificationTitle', {
            name: requester.displayName,
            amount:
              CURRENCIES[CURRENCY_ENUM.DOLLAR].symbol + getCentAwareMoneyDisplay(this.props.amount),
          })}
          ctas={this.getCTA()}
          onPress={this.onPay}
        >
          <Text style={fontStyles.bodySmall}>{this.props.comment || t('defaultComment')}</Text>
        </BaseNotification>
      </View>
    )
  }
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  unknownUser: {
    height: AVATAR_SIZE,
    width: AVATAR_SIZE,
    justifyContent: 'center',
    alignItems: 'center',
  },
})

export default withTranslation(Namespaces.paymentRequestFlow)(IncomingPaymentRequestListItem)
