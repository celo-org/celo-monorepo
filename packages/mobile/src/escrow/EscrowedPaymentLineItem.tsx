import fontStyles from '@celo/react-components/styles/fonts'
import * as React from 'react'
import { Trans, withNamespaces, WithNamespaces } from 'react-i18next'
import { StyleSheet, Text } from 'react-native'
import { EscrowedPayment } from 'src/escrow/actions'
import { CURRENCIES, CURRENCY_ENUM } from 'src/geth/consts'
import { divideByWei, getCentAwareMoneyDisplay } from 'src/utils/formatting'

interface Props {
  payment: EscrowedPayment
}

function EscrowedPaymentLineItem(props: Props & WithNamespaces) {
  const { amount, recipientPhone } = props.payment
  return (
    <Text numberOfLines={1} ellipsizeMode="middle" style={styles.oneLine}>
      {/* 
      // @ts-ignore tOptions prop is missing in type bindings, but exists in the implementation */}
      <Trans
        i18nKey="escrowPaymentNotificationLine"
        tOptions={{ context: !recipientPhone ? 'missingRecipientPhone' : null }}
        values={{
          amount:
            CURRENCIES[CURRENCY_ENUM.DOLLAR].symbol +
            getCentAwareMoneyDisplay(divideByWei(amount.toString())),
          recipientPhone,
        }}
      >
        <Text style={fontStyles.subSmall}>{{ recipientPhone }} for </Text>
        <Text style={[fontStyles.subSmall, fontStyles.semiBold]}>{{ amount }}</Text>
      </Trans>
    </Text>
  )
}

const styles = StyleSheet.create({
  oneLine: {
    flexDirection: 'row',
  },
})

export default withNamespaces('inviteFlow11')(EscrowedPaymentLineItem)
