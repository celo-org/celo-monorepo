import fontStyles from '@celo/react-components/styles/fonts'
import * as React from 'react'
import { WithNamespaces, withNamespaces } from 'react-i18next'
import { StyleSheet, Text } from 'react-native'
import { Namespaces } from 'src/i18n'

function PaymentRequestListEmpty(props: WithNamespaces) {
  return <Text style={[fontStyles.bodySecondary, styles.empty]}>{props.t('empty')}</Text>
}

const styles = StyleSheet.create({
  empty: {
    textAlign: 'center',
    marginTop: 30,
  },
})
export default withNamespaces(Namespaces.paymentRequestFlow)(PaymentRequestListEmpty)
