import BaseNotification from '@celo/react-components/components/BaseNotification'
import variables from '@celo/react-components/styles/variables'
import * as React from 'react'
import { WithNamespaces, withNamespaces } from 'react-i18next'
import { Image, StyleSheet, View } from 'react-native'
import CeloAnalytics from 'src/analytics/CeloAnalytics'
import { CustomEventNames } from 'src/analytics/constants'
import { EscrowedPayment } from 'src/escrow/actions'
import EscrowedPaymentLineItem from 'src/escrow/EscrowedPaymentLineItem'
import { Namespaces } from 'src/i18n'
import { inviteFriendsIcon } from 'src/images/Images'
import { navigate } from 'src/navigator/NavigationService'
import { Stacks } from 'src/navigator/Screens'

interface OwnProps {
  payments: EscrowedPayment[]
}

type Props = OwnProps & WithNamespaces

const PREVIEW_SIZE = 2

export class EscrowedPaymentReminderSummaryNotification extends React.Component<Props> {
  getTotal() {
    return this.props.payments.length
  }

  getTitle() {
    const { t } = this.props
    return this.getTotal() > 1
      ? t('escrowedPaymentReminderWithCount_plural', { count: this.getTotal() })
      : t('escrowedPaymentReminder')
  }
  getCTA = () => {
    return [
      {
        text: this.props.t('review'),
        onPress: () => {
          CeloAnalytics.track(CustomEventNames.escrowed_payment_review)
          navigate(Stacks.EscrowStack)
        },
      },
    ]
  }
  render() {
    const { payments } = this.props
    return (
      <BaseNotification
        title={this.getTitle()}
        icon={<Image source={inviteFriendsIcon} style={styles.image} resizeMode="contain" />}
        ctas={this.getCTA()}
        roundedBorders={true}
      >
        <View style={styles.body}>
          <View style={styles.requests}>
            {payments.slice(0, PREVIEW_SIZE).map((payment, key) => {
              return <EscrowedPaymentLineItem payment={payment} key={key} />
            })}
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
  requests: {
    flex: 1,
  },
  counter: {
    paddingLeft: variables.contentPadding,
    justifyContent: 'flex-end',
  },
})

export default withNamespaces(Namespaces.walletFlow5)(EscrowedPaymentReminderSummaryNotification)
