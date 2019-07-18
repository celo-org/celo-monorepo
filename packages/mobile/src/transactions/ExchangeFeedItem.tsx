import Touchable from '@celo/react-components/components/Touchable'
import ExchangeArrow from '@celo/react-components/icons/ExchangeArrow'
import colors from '@celo/react-components/styles/colors'
import { fontStyles } from '@celo/react-components/styles/fonts'
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

export class ExchangeFeedItem extends React.PureComponent<Props> {
  navigateToExchangeReview = () => {
    const { inValue, outValue, inSymbol, timestamp } = this.props

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

  render() {
    const {
      showImage,
      t,
      inSymbol,
      inValue,
      status,
      outValue,
      outSymbol,
      timestamp,
      i18n,
    } = this.props
    const inCurrency = resolveCurrency(inSymbol)
    const outCurrency = resolveCurrency(outSymbol)
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

    const opacityStyle = { opacity: isPending ? 0.3 : 1 }

    return (
      <Touchable onPress={this.navigateToExchangeReview}>
        <View style={styles.container}>
          {showImage && (
            <View style={[styles.imageContainer, opacityStyle]}>
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
          <View style={[styles.contentContainer, showImage && styles.imagePadding]}>
            <View style={styles.textContainer}>
              <View style={opacityStyle}>
                <Text style={fontStyles.bodySmallSemiBold}>{t('exchange')}</Text>
              </View>
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
            <View style={[styles.amountContainer, opacityStyle]}>
              <Text style={[fontStyles.activityCurrency, inStyle]}>
                {inCurrency === CURRENCY_ENUM.DOLLAR && '$'}
                {getMoneyDisplayValue(inValue)}
              </Text>
              <View style={styles.arrow}>
                <ExchangeArrow />
              </View>
              <Text style={[fontStyles.activityCurrency, outStyle]}>
                {outCurrency === CURRENCY_ENUM.DOLLAR && '$'}
                {getMoneyDisplayValue(outValue)}
              </Text>
            </View>
          </View>
        </View>
      </Touchable>
    )
  }
}

const styles = StyleSheet.create({
  arrow: {
    paddingHorizontal: 5,
    paddingBottom: 5,
  },
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    flex: 1,
    paddingTop: 20,
    paddingLeft: 10,
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderColor: colors.listBorder,
    paddingRight: 10,
  },
  amountContainer: {
    alignSelf: 'flex-start',
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  textContainer: {
    flex: 1,
    justifyContent: 'flex-start',
  },
  textPending: {
    fontSize: 13,
    lineHeight: 18,
  },
  transactionStatus: {
    paddingTop: 25,
    paddingBottom: 10,
  },
  imagePadding: {
    marginLeft: 10,
  },
})

export default withNamespaces(Namespaces.walletFlow5)(ExchangeFeedItem)
