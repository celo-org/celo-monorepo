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
    status?: TransactionStatus
    showGoldAmount: boolean
  }

type ExchangeProps = ReturnType<typeof getDollarExchangeProps>

function getDollarExchangeProps({ inValue, outValue }: Props) {
  return {
    icon: require('src/transactions/ExchangeGreenGold.png'),
    dollarAmount: inValue,
    dollarDirection: '-',
    goldAmount: outValue,
    goldDirection: '',
    inColor: colors.celoGreen,
    outColor: colors.celoGold,
  }
}

function getGoldExchangeProps({ inValue, outValue }: Props) {
  return {
    icon: require('src/transactions/ExchangeGoldGreen.png'),
    dollarAmount: outValue,
    dollarDirection: '',
    goldAmount: inValue,
    goldDirection: '-',
    inColor: colors.celoGold,
    outColor: colors.celoGreen,
  }
}

function getGoldAmountProps({ goldAmount, goldDirection }: ExchangeProps) {
  return {
    amount: goldAmount,
    amountDirection: goldDirection,
    amountColor: colors.celoGold,
  }
}

function getDollarAmountProps({ dollarAmount, dollarDirection }: ExchangeProps) {
  return {
    amount: dollarAmount,
    amountDirection: dollarDirection,
    amountColor: colors.celoGreen,
  }
}

export function ExchangeFeedItem(props: Props) {
  const { showGoldAmount, inSymbol, inValue, outValue, status, timestamp, t, i18n } = props

  const onPress = () => {
    navigateToExchangeReview(timestamp, {
      makerToken: resolveCurrency(inSymbol),
      makerAmount: new BigNumber(inValue),
      takerAmount: new BigNumber(outValue),
    })
  }

  const inCurrency = resolveCurrency(inSymbol)
  const exchangeProps =
    inCurrency === CURRENCY_ENUM.DOLLAR
      ? getDollarExchangeProps(props)
      : getGoldExchangeProps(props)
  const { amount, amountDirection, amountColor } = showGoldAmount
    ? getGoldAmountProps(exchangeProps)
    : getDollarAmountProps(exchangeProps)

  const timeFormatted = formatFeedTime(timestamp, i18n)
  const dateTimeFormatted = getDatetimeDisplayString(timestamp, t, i18n)
  const isPending = status === TransactionStatus.Pending

  const { inColor, outColor, icon } = exchangeProps
  const inStyle = { color: isPending ? colors.gray : inColor }
  const outStyle = { color: isPending ? colors.gray : outColor }

  return (
    <Touchable onPress={onPress}>
      <View style={styles.container}>
        <View style={styles.imageContainer}>
          <Image source={icon} style={styles.image} resizeMode="contain" />
        </View>
        <View style={styles.contentContainer}>
          <View style={styles.titleContainer}>
            <Text style={fontStyles.bodySmallSemiBold}>{t('exchange')}</Text>
            <Text
              style={[
                amountDirection === '-'
                  ? fontStyles.activityCurrencySent
                  : {
                      ...fontStyles.activityCurrencyReceived,
                      color: amountColor,
                    },
                styles.amount,
              ]}
            >
              {amountDirection}
              {getMoneyDisplayValue(amount)}
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
    color: colors.celoGreen,
  },
  transactionStatus: {
    color: colors.lightGray,
  },
  localAmount: {
    marginLeft: 'auto',
    paddingLeft: 10,
    fontSize: 14,
    lineHeight: 18,
    color: colors.lightGray,
  },
})

export default withNamespaces(Namespaces.walletFlow5)(React.memo(ExchangeFeedItem))
