import Touchable from '@celo/react-components/components/Touchable'
import ExchangeArrow from '@celo/react-components/icons/ExchangeArrow'
import colors from '@celo/react-components/styles/colors'
import { fontStyles } from '@celo/react-components/styles/fonts'
import variables from '@celo/react-components/styles/variables'
import BigNumber from 'bignumber.js'
import gql from 'graphql-tag'
import * as React from 'react'
import { useTranslation } from 'react-i18next'
import { Image, StyleSheet, Text, View } from 'react-native'
import { ExchangeItemFragment } from 'src/apollo/types'
import CurrencyDisplay from 'src/components/CurrencyDisplay'
import { CURRENCIES, CURRENCY_ENUM } from 'src/geth/consts'
import { Namespaces } from 'src/i18n'
import { exchangeGoldGreen, exchangeGreenGold } from 'src/images/Images'
import { navigateToExchangeReview } from 'src/transactions/actions'
import { TransactionStatus } from 'src/transactions/reducer'
import { formatFeedTime, getDatetimeDisplayString } from 'src/utils/time'

type Props = ExchangeItemFragment & {
  status: TransactionStatus
}

// TODO(jeanregisser): ExchangeFeedItem and TransferFeedItem renders are very similar, we should use the same building blocks
// so the parts that need to be identical stay the same as we change the code (main layout)
export function ExchangeFeedItem(props: Props) {
  const { t, i18n } = useTranslation(Namespaces.walletFlow5)
  const { amount, makerAmount, takerAmount, status, timestamp } = props

  const onPress = () => {
    navigateToExchangeReview(timestamp, {
      makerAmount,
      takerAmount,
    })
  }

  const icon =
    makerAmount.currencyCode === CURRENCIES[CURRENCY_ENUM.GOLD].code
      ? exchangeGoldGreen
      : exchangeGreenGold
  const timeFormatted = formatFeedTime(timestamp, i18n)
  const dateTimeFormatted = getDatetimeDisplayString(timestamp, t, i18n)
  const isPending = status === TransactionStatus.Pending
  const exchangeStyle = [styles.exchangeCurrency, isPending && { color: colors.gray }]
  const isSent = new BigNumber(amount.value).isNegative()

  return (
    <Touchable onPress={onPress}>
      <View style={styles.container}>
        <View style={styles.imageContainer}>
          <Image source={icon} style={styles.image} resizeMode="contain" />
        </View>
        <View style={styles.contentContainer}>
          <View style={styles.titleContainer}>
            <Text style={fontStyles.bodySmallSemiBold}>{t('exchange')}</Text>
            <CurrencyDisplay
              amount={amount}
              style={[
                styles.amount,
                isSent ? fontStyles.activityCurrencySent : fontStyles.activityCurrencyReceived,
              ]}
            />
          </View>
          <View style={styles.exchangeContainer}>
            <CurrencyDisplay
              amount={makerAmount}
              useColors={true}
              hideSymbol={true}
              style={exchangeStyle}
            />
            <View style={styles.arrow}>
              <ExchangeArrow />
            </View>
            <CurrencyDisplay
              amount={takerAmount}
              useColors={true}
              hideSymbol={true}
              style={exchangeStyle}
            />
          </View>
          <View style={styles.statusContainer}>
            {isPending && (
              <Text style={styles.transactionStatus}>
                <Text style={styles.textPending}>{t('confirmingExchange')}</Text>
                {' ' + timeFormatted}
              </Text>
            )}
            {status === TransactionStatus.Complete && (
              <Text style={styles.transactionStatus}>{dateTimeFormatted}</Text>
            )}
            {status === TransactionStatus.Failed && (
              <Text style={styles.transactionStatus}>
                <Text style={styles.textStatusFailed}>{t('exchangeFailed')}</Text>
                {' ' + timeFormatted}
              </Text>
            )}
          </View>
        </View>
      </View>
    </Touchable>
  )
}

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

const styles = StyleSheet.create({
  arrow: {
    paddingHorizontal: 5,
    paddingBottom: 8,
  },
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    flex: 1,
    padding: variables.contentPadding,
  },
  imageContainer: {
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    height: 40,
    width: 40,
  },
  image: {
    width: 40,
  },
  contentContainer: {
    flex: 1,
    marginLeft: variables.contentPadding,
  },
  titleContainer: {
    flexDirection: 'row',
    marginTop: 3,
  },
  amount: {
    marginLeft: 'auto',
    paddingLeft: 10,
  },
  exchangeContainer: {
    alignItems: 'center',
    flexDirection: 'row',
  },
  exchangeCurrency: {
    ...fontStyles.semiBold,
    fontSize: 16,
    lineHeight: 20,
  },
  statusContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  textPending: {
    ...fontStyles.bodySmallBold,
    fontSize: 13,
    lineHeight: 18,
    color: colors.celoGreen,
  },
  transactionStatus: {
    ...fontStyles.bodySmall,
    color: colors.lightGray,
  },
  textStatusFailed: {
    ...fontStyles.semiBold,
    fontSize: 13,
    lineHeight: 17,
    color: colors.darkSecondary,
  },
})

export default ExchangeFeedItem
