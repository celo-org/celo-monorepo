import Touchable from '@celo/react-components/components/Touchable'
import colors from '@celo/react-components/styles/colors'
import fontStyles from '@celo/react-components/styles/fonts.v2'
import variables from '@celo/react-components/styles/variables'
import BigNumber from 'bignumber.js'
import * as React from 'react'
import { useTranslation } from 'react-i18next'
import { StyleSheet, Text, View } from 'react-native'
import { MoneyAmount, TokenTransactionType } from 'src/apollo/types'
import CurrencyDisplay, { FormatType } from 'src/components/CurrencyDisplay'
import { Namespaces } from 'src/i18n'
import { TransactionStatus } from 'src/transactions/types'

interface Props {
  type: TokenTransactionType
  amount: MoneyAmount
  title: string
  info: React.ReactNode | string | null | undefined
  icon: React.ReactNode
  timestamp: number
  status: TransactionStatus
  onPress: () => void
}

export function TransactionFeedItem(props: Props) {
  const { t } = useTranslation(Namespaces.walletFlow5)

  const { type, amount, title, info, icon, status, onPress } = props

  const isReceived = new BigNumber(amount.value).isPositive()
  const isPending = status === TransactionStatus.Pending

  const subtitle = isPending ? t('confirmingTransaction') : info

  return (
    <Touchable onPress={onPress}>
      <View style={styles.container}>
        <View style={styles.iconContainer}>{icon}</View>
        <View style={styles.contentContainer}>
          <View style={styles.titleContainer}>
            <Text style={styles.title}>{title}</Text>
            <CurrencyDisplay
              amount={amount}
              formatType={
                type === TokenTransactionType.NetworkFee ? FormatType.NetworkFee : undefined
              }
              hideSign={!isReceived}
              showExplicitPositiveSign={true}
              style={[styles.amount, isReceived && styles.amountReceived]}
            />
          </View>
          {!!subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
        </View>
      </View>
    </Touchable>
  )
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: variables.contentPadding,
  },
  iconContainer: {
    flexDirection: 'column',
    alignItems: 'center',
  },
  contentContainer: {
    flex: 1,
    marginLeft: variables.contentPadding,
  },
  titleContainer: {
    flexDirection: 'row',
    marginTop: -1,
  },
  title: {
    ...fontStyles.regular500,
  },
  subtitle: {
    ...fontStyles.small,
    color: colors.gray4,
    paddingTop: 2,
  },
  amount: {
    ...fontStyles.regular500,
    marginLeft: 'auto',
    paddingLeft: 10,
  },
  amountReceived: {
    color: colors.greenUI,
  },
})

export default TransactionFeedItem
