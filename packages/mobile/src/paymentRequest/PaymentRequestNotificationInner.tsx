import fontStyles from '@celo/react-components/styles/fonts'
import * as React from 'react'
import { Trans, WithTranslation, withTranslation } from 'react-i18next'
import { StyleSheet, Text } from 'react-native'
import CurrencyDisplay from 'src/components/CurrencyDisplay'
import { CURRENCIES, CURRENCY_ENUM } from 'src/geth/consts'
import { Namespaces } from 'src/i18n'
import { Recipient } from 'src/recipients/recipient'

interface Props {
  requesterE164Number: string
  amount: string
  requesterRecipient: Recipient | null
}

function PaymentRequestNotificationInner(props: Props & WithTranslation) {
  const { requesterE164Number, amount, requesterRecipient } = props
  const displayName = (requesterRecipient && requesterRecipient.displayName) || requesterE164Number

  return (
    <Text numberOfLines={1} ellipsizeMode="middle" style={styles.oneLine}>
      <Trans
        i18nKey="paymentRequestNotificationLine"
        ns={Namespaces.paymentRequestFlow}
        values={{
          displayName,
        }}
      >
        <Text style={fontStyles.subSmall}>{{ displayName }} for </Text>
        <CurrencyDisplay
          style={fontStyles.subSmall}
          amount={{
            value: amount,
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
})

export default withTranslation(Namespaces.paymentRequestFlow)(PaymentRequestNotificationInner)
