import BaseNotification from '@celo/react-components/components/BaseNotification'
import fontStyles from '@celo/react-components/styles/fonts'
import * as React from 'react'
import { Trans, WithTranslation } from 'react-i18next'
import { Image, StyleSheet, Text, View } from 'react-native'
import { connect } from 'react-redux'
import CeloAnalytics from 'src/analytics/CeloAnalytics'
import { CustomEventNames } from 'src/analytics/constants'
import { componentWithAnalytics } from 'src/analytics/wrapper'
import { ErrorMessages } from 'src/app/ErrorMessages'
import CurrencyDisplay from 'src/components/CurrencyDisplay'
import { EscrowedPayment } from 'src/escrow/actions'
import { CURRENCIES, CURRENCY_ENUM } from 'src/geth/consts'
import { Namespaces, withTranslation } from 'src/i18n'
import { inviteFriendsIcon } from 'src/images/Images'
import { InviteDetails } from 'src/invite/actions'
import { generateInviteLink, sendSms } from 'src/invite/saga'
import { navigate } from 'src/navigator/NavigationService'
import { Screens } from 'src/navigator/Screens'
import { RootState } from 'src/redux/reducers'
import { divideByWei } from 'src/utils/formatting'
import Logger from 'src/utils/Logger'

interface OwnProps {
  payment: EscrowedPayment
}

interface StateProps {
  invitees: InviteDetails[]
}

const mapStateToProps = (state: RootState): StateProps => ({
  invitees: state.invite.invitees,
})

type Props = OwnProps & WithTranslation & StateProps

const TAG = 'EscrowedPaymentListItem'

export class EscrowedPaymentListItem extends React.PureComponent<Props> {
  onRemind = async () => {
    const { payment, t, invitees } = this.props
    const recipientPhoneNumber = payment.recipientPhone
    CeloAnalytics.track(CustomEventNames.clicked_escrowed_payment_send_message)
    // TODO(Tarik): add a UI that allows user to choose between SMS and Whatsapp (currently only SMS) for reminder message
    try {
      const inviteDetails = invitees.find(
        (inviteeObj) => recipientPhoneNumber === inviteeObj.e164Number
      )

      // OPEN QUESTION: EscrowedPayment and InviteDetails appear to store redundant data but have different sources of truth. Should we consolidate
      // them to avoid throwing the below error? Appears to me invitee data is stored on send and escrow data is fetched from the smart contract

      // OPEN QUESTION: Appears to me we won't have inivtee data when local data is wiped. is this an appropriate compromise in that case?
      if (!inviteDetails) {
        await sendSms(
          // OPEN QUESTION: why do we have to send inviteCode and link if link is derived from inviteCode?
          recipientPhoneNumber,
          t('walletFlow5:escrowedPaymentReminderSmsNoData')
        )
      } else {
        const { inviteCode } = inviteDetails
        // OPEN QUESTION: this function creates a unique link every time a reminder is sent. is this desirable?
        const link = await generateInviteLink(inviteCode)
        await sendSms(
          // OPEN QUESTION: why do we have to send inviteCode and link if link is derived from inviteCode?
          recipientPhoneNumber,
          t('walletFlow5:escrowedPaymentReminderSms', {
            code: inviteCode,
            link,
          })
        )
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
    // TODO(Rossy) Get contact number from recipient cache here
    return payment.recipientPhone
  }

  render() {
    const { t, payment } = this.props
    const mobile = this.getDisplayName() || t('global:unknown').toLowerCase()

    return (
      <View style={styles.container}>
        <BaseNotification
          title={
            <Trans
              i18nKey="escrowPaymentNotificationTitl"
              ns={Namespaces.inviteFlow11}
              values={{ mobile }}
            >
              Invited and paid {{ mobile }} (
              <CurrencyDisplay
                amount={{
                  value: divideByWei(payment.amount),
                  currencyCode: CURRENCIES[CURRENCY_ENUM.DOLLAR].code,
                }}
              />
              )
            </Trans>
          }
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
  connect<StateProps, {}, {}, RootState>(mapStateToProps)(
    withTranslation(Namespaces.inviteFlow11)(EscrowedPaymentListItem)
  )
)
