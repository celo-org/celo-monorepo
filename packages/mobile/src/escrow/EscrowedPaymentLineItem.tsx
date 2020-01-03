import fontStyles from '@celo/react-components/styles/fonts'
import * as React from 'react'
import { Trans, WithTranslation, withTranslation } from 'react-i18next'
import { StyleSheet, Text } from 'react-native'
import { EscrowedPayment } from 'src/escrow/actions'
import { CURRENCIES, CURRENCY_ENUM } from 'src/geth/consts'
import { Namespaces } from 'src/i18n'
import { divideByWei, getCentAwareMoneyDisplay } from 'src/utils/formatting'

interface Props {
  payment: EscrowedPayment
}

function EscrowedPaymentLineItem(props: Props & WithTranslation) {
  const { amount, recipientPhone } = props.payment
  return (
    <Text numberOfLines={1} ellipsizeMode="middle" style={styles.oneLine}>
      <Trans
        i18nKey="escrowPaymentNotificationLine"
        // @ts-ignore tOptions prop is missing in type bindings, but exists in the implementation
        tOptions={{ context: !recipientPhone ? 'missingRecipientPhone' : null }}
        values={{
          amount:
            CURRENCIES[CURRENCY_ENUM.DOLLAR].symbol +
            getCentAwareMoneyDisplay(divideByWei(amount.toString())),
          recipientPhone,
        }}
      >
        <Text style={styles.phone}>{{ recipientPhone }} for </Text>
        <Text style={styles.amount}>{{ amount }}</Text>
      </Trans>
    </Text>
  )
}

const styles = StyleSheet.create({
  oneLine: {
    flexDirection: 'row',
  },
  phone: fontStyles.subSmall,
  amount: {
    ...fontStyles.subSmall,
    ...fontStyles.semiBold,
  },
})

export default withTranslation(Namespaces.inviteFlow11)(EscrowedPaymentLineItem)
