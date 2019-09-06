import Touchable from '@celo/react-components/components/Touchable'
import ExchangeArrow from '@celo/react-components/icons/ExchangeArrow'
import colors from '@celo/react-components/styles/colors'
import { fontStyles } from '@celo/react-components/styles/fonts'
import variables from '@celo/react-components/styles/variables'
import BigNumber from 'bignumber.js'
import * as React from 'react'
import { WithNamespaces, withNamespaces } from 'react-i18next'
import { Image, StyleSheet, Text, View } from 'react-native'
import { HomeExchangeFragment } from 'src/apollo/types'
import { CURRENCY_ENUM, resolveCurrency } from 'src/geth/consts'
import { Namespaces } from 'src/i18n'
import { navigateToExchangeReview } from 'src/transactions/actions'
import { ExchangeStandby, TransactionStatus } from 'src/transactions/reducer'
import { getMoneyDisplayValue } from 'src/utils/formatting'
import { formatFeedTime, getDatetimeDisplayString } from 'src/utils/time'

type Props = (HomeExchangeFragment | ExchangeStandby) &
  WithNamespaces & {
    showImage: boolean
    status?: TransactionStatus
  }

export function ExchangeFeedItem(props: Props) {
  const { showImage, t, inSymbol, inValue, status, outValue, outSymbol, timestamp, i18n } = props

  const onPress = () => {
    // TODO get missing values from HomeExchange.Fragment
    navigateToExchangeReview(timestamp, {
      token: resolveCurrency(inSymbol),
      newDollarBalance: '',
      newGoldBalance: '',
      leftCurrencyAmount: new BigNumber(inValue),
      rightCurrencyAmount: new BigNumber(outValue),
      exchangeRate: '',
      fee: '',
    })
  }

  const inCurrency = resolveCurrency(inSymbol)
  const outCurrency = resolveCurrency(outSymbol)
  const dollarAmount = inCurrency === CURRENCY_ENUM.DOLLAR ? inValue : outValue
  const dollarDirection = inCurrency === CURRENCY_ENUM.DOLLAR ? '-' : ''
  const timeFormatted = formatFeedTime(timestamp, i18n)
  const dateTimeFormatted = getDatetimeDisplayString(timestamp, t, i18n)
  const isPending = status === TransactionStatus.Pending

  const inStyle = {
    color: isPending
      ? colors.gray
      : inCurrency === CURRENCY_ENUM.DOLLAR
        ? colors.celoGreen
        : colors.celoGold,
  }

  const outStyle = {
    color: isPending
      ? colors.gray
      : outCurrency === CURRENCY_ENUM.DOLLAR
        ? colors.celoGreen
        : colors.celoGold,
  }

  return (
    <Touchable onPress={onPress}>
      <View style={styles.container}>
        {showImage && (
          <View style={styles.imageContainer}>
            <Image
              source={
                inCurrency === CURRENCY_ENUM.DOLLAR
                  ? require(`src/transactions/ExchangeGreenGold.png`)
                  : require(`src/transactions/ExchangeGoldGreen.png`)
              }
              style={styles.image}
              resizeMode="contain"
            />
          </View>
        )}
        <View style={[styles.contentContainer, showImage && styles.contentContainerWithImage]}>
          <View style={styles.titleContainer}>
            <Text style={fontStyles.bodySmallSemiBold}>{t('exchange')}</Text>
            <Text
              style={[
                dollarDirection === '-'
                  ? fontStyles.activityCurrencySent
                  : fontStyles.activityCurrencyReceived,
                styles.amount,
              ]}
            >
              {dollarDirection}
              {getMoneyDisplayValue(dollarAmount)}
            </Text>
          </View>
          <View style={styles.exchangeContainer}>
            <Text style={[fontStyles.activityCurrency, inStyle]}>
              {getMoneyDisplayValue(inValue)}
            </Text>
            <View style={styles.arrow}>
              <ExchangeArrow />
            </View>
            <Text style={[fontStyles.activityCurrency, outStyle]}>
              {getMoneyDisplayValue(outValue)}
            </Text>
          </View>
          <View style={styles.statusContainer}>
            {isPending && (
              <Text style={[fontStyles.bodySmall, styles.transactionStatus]}>
                <Text style={[fontStyles.bodySmallBold, styles.textPending]}>
                  {t('confirmingExchange')}
                </Text>
                {' ' + timeFormatted}
              </Text>
            )}
            {status === TransactionStatus.Complete && (
              <Text style={[fontStyles.bodySmall, styles.transactionStatus]}>
                {dateTimeFormatted}
              </Text>
            )}
            {status === TransactionStatus.Failed && (
              <Text style={[fontStyles.bodySmall, styles.transactionStatus]}>
                <Text style={fontStyles.linkSmall}>{t('exchangeFailed')}</Text>
                {' ' + timeFormatted}
              </Text>
            )}
          </View>
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
  },
  contentContainerWithImage: {
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
    // alignSelf: 'flex-start',
    alignItems: 'center',
    flexDirection: 'row',
    // justifyContent: 'flex-end',
  },
  statusContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  textPending: {
    fontSize: 13,
    lineHeight: 18,
  },
  transactionStatus: {
    color: '#BDBDBD',
  },
  localAmount: {
    marginLeft: 'auto',
    paddingLeft: 10,
    fontSize: 14,
    lineHeight: 18,
    color: '#BDBDBD',
  },
})

// @ts-ignore
export default withNamespaces(Namespaces.walletFlow5)(React.memo(ExchangeFeedItem))
