import fontStyles from '@celo/react-components/styles/fonts'
import { getContactPhoneNumber } from '@celo/utils/src/contacts'
import * as React from 'react'
import { StyleSheet, Text } from 'react-native'
import { EscrowedPayment } from 'src/escrow/actions'

interface Props {
  payment: EscrowedPayment
}

export default function EscrowedPaymentLineItem(props: Props) {
  const { message, recipient } = props.payment
  const recipientPhoneNumber =
    typeof recipient === 'string' ? recipient : getContactPhoneNumber(recipient)
  return (
    <Text numberOfLines={1} ellipsizeMode="middle" style={styles.oneLine}>
      <Text style={[fontStyles.subSmall]}>
        {recipientPhoneNumber} - {message}
      </Text>
    </Text>
  )
}

const styles = StyleSheet.create({
  oneLine: {
    flexDirection: 'row',
  },
})
