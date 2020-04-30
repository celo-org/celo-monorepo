import fontStyles from '@celo/react-components/styles/fonts'
import * as React from 'react'
import { Trans, WithTranslation, withTranslation } from 'react-i18next'
import { StyleSheet, Text } from 'react-native'
import CurrencyDisplay from 'src/components/CurrencyDisplay'
import { EscrowedPayment } from 'src/escrow/actions'
import { CURRENCIES, CURRENCY_ENUM } from 'src/geth/consts'
import { Namespaces } from 'src/i18n'
import { divideByWei } from 'src/utils/formatting'

interface Props {
  payment: EscrowedPayment
}

function EscrowedPaymentLineItem(props: Props & WithTranslation) {
  const { amount, recipientPhone } = props.payment
  return (
    <Text numberOfLines={1} ellipsizeMode="middle" style={styles.oneLine}>
      <Trans
        i18nKey="escrowPaymentNotificationLine"
        ns={Namespaces.inviteFlow11}
        tOptions={{ context: !recipientPhone ? 'missingRecipientPhone' : null }}
        values={{
          recipientPhone,
        }}
      >
        <Text style={styles.phone}>{{ recipientPhone }} for </Text>
        <CurrencyDisplay
          style={styles.amount}
          amount={{
            value: divideByWei(amount),
            currencyCode: CURRENCIES[CURRENCY_ENUM.DOLLAR].code,
          }}
        />
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
  },
})

export default withTranslation(Namespaces.inviteFlow11)(EscrowedPaymentLineItem)
