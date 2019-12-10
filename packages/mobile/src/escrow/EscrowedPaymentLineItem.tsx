import fontStyles from '@celo/react-components/styles/fonts'
import * as React from 'react'
import { withNamespaces, WithNamespaces } from 'react-i18next'
import { StyleSheet, Text } from 'react-native'
import { EscrowedPayment } from 'src/escrow/actions'
import { divideByWei, getCentAwareMoneyDisplay } from 'src/utils/formatting'

interface Props {
  payment: EscrowedPayment
}

function EscrowedPaymentLineItem(props: Props & WithNamespaces) {
  const { t } = props
  const { amount, recipientPhone } = props.payment
  return (
    <Text numberOfLines={1} ellipsizeMode="middle" style={styles.oneLine}>
      <Text style={[fontStyles.subSmall]}>
        {recipientPhone ? recipientPhone : t('unknown')} {t('for')}
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

export default withNamespaces('global')(EscrowedPaymentLineItem)
