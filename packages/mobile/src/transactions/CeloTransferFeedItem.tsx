// VIEW that's used on the CELO screen activity feed for CELO transfers (in or out).

import Touchable from '@celo/react-components/components/Touchable'
import colors from '@celo/react-components/styles/colors'
import fontStyles from '@celo/react-components/styles/fonts.v2'
import variables from '@celo/react-components/styles/variables'
import BigNumber from 'bignumber.js'
import * as React from 'react'
import { useTranslation } from 'react-i18next'
import { StyleSheet, Text, View } from 'react-native'
import { CeloExchangeEvents } from 'src/analytics/Events'
import ValoraAnalytics from 'src/analytics/ValoraAnalytics'
import { TransferItemFragment } from 'src/apollo/types'
import CurrencyDisplay from 'src/components/CurrencyDisplay'
import { formatShortenedAddress } from 'src/components/ShortenedAddress'
import { Namespaces } from 'src/i18n'
import { navigateToPaymentTransferReview } from 'src/transactions/actions'
import { TransactionStatus } from 'src/transactions/types'
import { getDatetimeDisplayString } from 'src/utils/time'

type Props = TransferItemFragment & {
  status?: TransactionStatus
}

export function CeloTransferFeedItem(props: Props) {
  const { t, i18n } = useTranslation(Namespaces.walletFlow5)
  const { address, amount, comment, status, timestamp, type } = props
  const onPress = () => {
    ValoraAnalytics.track(CeloExchangeEvents.celo_transaction_select)

    navigateToPaymentTransferReview(type, timestamp, {
      address,
      comment,
      amount,
      type,
      // fee TODO: add fee here.
    })
  }

  const dateTimeFormatted = getDatetimeDisplayString(timestamp, i18n)
  const isPending = status === TransactionStatus.Pending
  const isWithdrawal = new BigNumber(amount.value).isNegative()

  return (
    <Touchable onPress={onPress}>
      <View style={styles.container}>
        <View style={styles.firstRow}>
          <View style={styles.desc}>
            <Text style={styles.txMode}>
              {t(isWithdrawal ? 'feedItemGoldWithdrawal' : 'feedItemGoldReceived', {
                address: formatShortenedAddress(address),
              })}
            </Text>
          </View>
          <View>
            <CurrencyDisplay amount={amount} style={styles.amount} />
          </View>
        </View>
        <View style={styles.secondRow}>
          <Text style={styles.time}>{isPending ? t('confirmingExchange') : dateTimeFormatted}</Text>
        </View>
      </View>
    </Touchable>
  )
}

const styles = StyleSheet.create({
  container: {
    justifyContent: 'space-between',
    flex: 1,
    padding: variables.contentPadding,
  },
  firstRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    flex: 1,
    paddingBottom: 2,
  },
  desc: {
    flexDirection: 'row',
  },
  txMode: {
    ...fontStyles.regular500,
    color: colors.dark,
  },
  amount: {
    ...fontStyles.regular500,
    color: colors.dark,
  },
  time: {
    ...fontStyles.small,
    color: colors.gray4,
  },
  secondRow: {},
})

export default CeloTransferFeedItem
