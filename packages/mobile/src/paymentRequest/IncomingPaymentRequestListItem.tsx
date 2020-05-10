import BaseNotification from '@celo/react-components/components/BaseNotification'
import ContactCircle from '@celo/react-components/components/ContactCircle'
import fontStyles from '@celo/react-components/styles/fonts'
import BigNumber from 'bignumber.js'
import * as React from 'react'
import { Trans, WithTranslation } from 'react-i18next'
import { Image, StyleSheet, Text, View } from 'react-native'
import { TokenTransactionType } from 'src/apollo/types'
import CurrencyDisplay from 'src/components/CurrencyDisplay'
import { declinePaymentRequest } from 'src/firebase/actions'
import { CURRENCIES, CURRENCY_ENUM } from 'src/geth/consts'
import { Namespaces, withTranslation } from 'src/i18n'
import { fetchPhoneAddressesAndCheckIfRecipientValidationRequired } from 'src/identity/actions'
import { unknownUserIcon } from 'src/images/Images'
import { navigate } from 'src/navigator/NavigationService'
import { Screens } from 'src/navigator/Screens'
import { getRecipientThumbnail, Recipient } from 'src/recipients/recipient'
import { TransactionData } from 'src/send/SendAmount'
import Logger from 'src/utils/Logger'

interface OwnProps {
  requester: Recipient
  amount: string
  comment: string
  id: string
  declinePaymentRequest: typeof declinePaymentRequest
  fetchPhoneAddressesAndCheckIfRecipientValidationRequired: typeof fetchPhoneAddressesAndCheckIfRecipientValidationRequired
  manualAddressValidationRequired: boolean
  fullValidationRequired: boolean
}

type Props = OwnProps & WithTranslation

const AVATAR_SIZE = 40

export class IncomingPaymentRequestListItem extends React.Component<Props> {
  componentDidMount() {
    // need to check latest mapping to prevent user from accepting fradulent requests
    this.fetchLatestPhoneAddressesAndRecipientVerificationStatus()
  }

  fetchLatestPhoneAddressesAndRecipientVerificationStatus = () => {
    const { requester: recipient } = this.props

    if (!recipient.e164PhoneNumber) {
      throw new Error('Missing recipient e164Number')
    }

    this.props.fetchPhoneAddressesAndCheckIfRecipientValidationRequired(recipient.e164PhoneNumber)
  }

  onPay = () => {
    const {
      id,
      amount,
      comment: reason,
      requester: recipient,
      manualAddressValidationRequired,
      fullValidationRequired,
    } = this.props

    const transactionData: TransactionData = {
      reason,
      recipient,
      amount: new BigNumber(amount),
      type: TokenTransactionType.PayRequest,
      firebasePendingRequestUid: id,
    }

    if (manualAddressValidationRequired) {
      navigate(Screens.ConfirmRecipient, { transactionData, fullValidationRequired })
    } else {
      navigate(Screens.SendConfirmation, { transactionData })
    }
  }

  onPaymentDecline = () => {
    const { id } = this.props
    this.props.declinePaymentRequest(id)
    Logger.showMessage(this.props.t('requestDeclined'))
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
    const { requester, id, t } = this.props
    const name = requester.displayName

    return (
      <View style={styles.container}>
        <BaseNotification
          testID={`IncomingPaymentRequestNotification/${id}`}
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
          title={
            <Trans
              i18nKey="incomingPaymentRequestNotificationTitle"
              ns={Namespaces.paymentRequestFlow}
              values={{ name }}
            >
              {{ name }} requested{' '}
              <CurrencyDisplay
                amount={{
                  value: this.props.amount,
                  currencyCode: CURRENCIES[CURRENCY_ENUM.DOLLAR].code,
                }}
              />
            </Trans>
          }
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
