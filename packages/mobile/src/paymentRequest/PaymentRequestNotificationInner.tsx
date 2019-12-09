import fontStyles from '@celo/react-components/styles/fonts'
import * as React from 'react'
import { StyleSheet, Text } from 'react-native'
import { CURRENCIES, CURRENCY_ENUM } from 'src/geth/consts'
import i18n from 'src/i18n'
import { Recipient } from 'src/recipients/recipient'
import { getCentAwareMoneyDisplay } from 'src/utils/formatting'

interface Props {
  requesterE164Number: string
  amount: string
  requesterRecipient: Recipient | null
}

export default function PaymentRequestNotificationInner(props: Props) {
  const { requesterE164Number, amount, requesterRecipient } = props
  return (
    <Text numberOfLines={1} ellipsizeMode="middle" style={styles.oneLine}>
      <Text style={[fontStyles.subSmall]}>
        {(requesterRecipient && requesterRecipient.displayName) || requesterE164Number}{' '}
        {i18n.t('global:for')}
      </Text>
      <Text style={[fontStyles.subSmall, fontStyles.semiBold]}>
        {' ' + CURRENCIES[CURRENCY_ENUM.DOLLAR].symbol + getCentAwareMoneyDisplay(amount)}
      </Text>
    </Text>
  )
}

const styles = StyleSheet.create({
  oneLine: {
    flexDirection: 'row',
  },
})
