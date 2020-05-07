import Touchable from '@celo/react-components/components/Touchable'
import colors from '@celo/react-components/styles/colors.v2'
import fontStyles from '@celo/react-components/styles/fonts.v2'
import variables from '@celo/react-components/styles/variables'
import BigNumber from 'bignumber.js'
import gql from 'graphql-tag'
import * as React from 'react'
import { useTranslation } from 'react-i18next'
import { StyleSheet, Text, View } from 'react-native'
import { ExchangeItemFragment } from 'src/apollo/types'
import CurrencyDisplay, { FormatType } from 'src/components/CurrencyDisplay'
import { CURRENCIES, CURRENCY_ENUM } from 'src/geth/consts'
import { Namespaces } from 'src/i18n'
import { useLocalCurrencyCode } from 'src/localCurrency/hooks'
import { navigateToExchangeReview } from 'src/transactions/actions'
import { TransactionStatus } from 'src/transactions/reducer'
import { getDatetimeDisplayString } from 'src/utils/time'

type Props = ExchangeItemFragment & {
  status?: TransactionStatus
}

export function ExchangeFeedItem(props: Props) {
  const { t, i18n } = useTranslation(Namespaces.walletFlow5)
  const { amount, makerAmount, takerAmount, status, timestamp } = props
  const localCurrencyCode = useLocalCurrencyCode()

  const onPress = () => {
    navigateToExchangeReview(timestamp, {
      makerAmount,
      takerAmount,
    })
  }

  const isSellGoldTx = makerAmount.currencyCode === CURRENCIES[CURRENCY_ENUM.GOLD].code
  const dateTimeFormatted = getDatetimeDisplayString(timestamp, t, i18n)
  const isPending = status === TransactionStatus.Pending
  // We always show Local Currency to cGLD exchage rate
  // independent of transaction type
  const exchangeRate = new BigNumber((isSellGoldTx ? takerAmount : makerAmount).value).dividedBy(
    (isSellGoldTx ? makerAmount : takerAmount).value
  )

  const isRateValid = !exchangeRate.isZero() && exchangeRate.isFinite()

  return (
    <Touchable onPress={onPress}>
      <View style={styles.container}>
        <View style={styles.firstRow}>
          <View style={styles.desc}>
            <Text style={styles.txMode}>
              {isSellGoldTx ? t('feedItemGoldSold') : t('feedItemGoldPurchased')}
            </Text>
            {isRateValid && (
              <>
                <Text style={styles.exchangeRate}> @ </Text>
                <CurrencyDisplay
                  amount={{ value: exchangeRate, currencyCode: localCurrencyCode }}
                  formatType={FormatType.ExchangeRate}
                  hideSymbol={true}
                  hideCode={false}
                  showLocalAmount={false}
                  style={styles.exchangeRate}
                />
              </>
            )}
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
  arrow: {
    paddingHorizontal: 5,
    paddingBottom: 8,
  },
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
  exchangeRate: {
    ...fontStyles.regular500,
    color: colors.dark,
  },
  amount: {
    ...fontStyles.regular500,
    color: colors.dark,
    marginRight: 12,
  },
  time: {
    ...fontStyles.small,
    color: colors.gray4,
  },
  secondRow: {},
})

ExchangeFeedItem.fragments = {
  exchange: gql`
    fragment ExchangeItem on TokenExchange {
      __typename
      type
      hash
      amount {
        value
        currencyCode
        localAmount {
          value
          currencyCode
          exchangeRate
        }
      }
      timestamp
      takerAmount {
        value
        currencyCode
        localAmount {
          value
          currencyCode
          exchangeRate
        }
      }
      makerAmount {
        value
        currencyCode
        localAmount {
          value
          currencyCode
          exchangeRate
        }
      }
    }
  `,
}

export default ExchangeFeedItem
