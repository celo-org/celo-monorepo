import fontStyles from '@celo/react-components/styles/fonts'
import * as React from 'react'
import { StyleSheet, Text } from 'react-native'
import { EscrowedPayment } from 'src/escrow/actions'
import { divideByWei, getCentAwareMoneyDisplay } from 'src/utils/formatting'

interface Props {
  payment: EscrowedPayment
}

export default function EscrowedPaymentLineItem(props: Props) {
  const { amount, message, recipientPhone } = props.payment
  return (
    <Text numberOfLines={1} ellipsizeMode="middle" style={styles.oneLine}>
      <Text style={[fontStyles.subSmall]}>
        {recipientPhone} - {message}
      </Text>
      <Text style={[fontStyles.subSmall, fontStyles.semiBold]}>
        {' '}
        ${getCentAwareMoneyDisplay(divideByWei(amount.toString()))}
      </Text>
    </Text>
  )
}

const styles = StyleSheet.create({
  oneLine: {
    flexDirection: 'row',
  },
})
