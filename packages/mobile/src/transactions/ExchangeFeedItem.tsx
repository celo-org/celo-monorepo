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
import { LocalCurrencyCode, LocalCurrencySymbol } from 'src/localCurrency/consts'
import { convertDollarsToLocalAmount } from 'src/localCurrency/convert'
import {
  useExchangeRate,
  useLocalCurrencyCode,
  useLocalCurrencySymbol,
} from 'src/localCurrency/hooks'
import { navigateToExchangeReview } from 'src/transactions/actions'
import { ExchangeStandby, TransactionStatus } from 'src/transactions/reducer'
import { getMoneyDisplayValue } from 'src/utils/formatting'
import { formatFeedTime, getDatetimeDisplayString } from 'src/utils/time'

type Props = (HomeExchangeFragment | ExchangeStandby) &
  WithNamespaces & {
    status?: TransactionStatus
    showGoldAmount: boolean
  }

type ExchangeInputProps = Props & {
  localCurrencyCode: LocalCurrencyCode | null
  localCurrencySymbol: LocalCurrencySymbol | null
  localExchangeRate: number | null | undefined
}
type ExchangeProps =
  | ReturnType<typeof getDollarExchangeProps>
  | ReturnType<typeof getGoldExchangeProps>

function getLocalAmount(
  dollarAmount: BigNumber.Value,
  localExchangeRate: number | null | undefined
) {
  const localAmount = convertDollarsToLocalAmount(dollarAmount, localExchangeRate)
  if (!localAmount) {
    return null
  }

  return localAmount.toString()
}

function getDollarExchangeProps({
  inValue: dollarAmount,
  outValue: goldAmount,
  localCurrencyCode,
  localCurrencySymbol,
  localExchangeRate,
}: ExchangeInputProps) {
  const localAmount = getLocalAmount(dollarAmount, localExchangeRate)
  return {
    icon: require('src/transactions/ExchangeGreenGold.png'),
    dollarAmount,
    dollarDirection: '-',
    localCurrencyCode,
    localCurrencySymbol,
    localAmount,
    goldAmount,
    goldDirection: '',
    inValue: localCurrencyCode ? localAmount : dollarAmount,
    inColor: colors.celoGreen,
    outValue: goldAmount,
    outColor: colors.celoGold,
  }
}

function getGoldExchangeProps({
  inValue: goldAmount,
  outValue: dollarAmount,
  localCurrencyCode,
  localCurrencySymbol,
  localExchangeRate,
}: ExchangeInputProps) {
  const localAmount = getLocalAmount(dollarAmount, localExchangeRate)
  return {
    icon: require('src/transactions/ExchangeGoldGreen.png'),
    dollarAmount,
    dollarDirection: '',
    localCurrencyCode,
    localCurrencySymbol,
    localAmount,
    goldAmount,
    goldDirection: '-',
    inValue: goldAmount,
    inColor: colors.celoGold,
    outValue: localCurrencyCode ? localAmount : dollarAmount,
    outColor: colors.celoGreen,
  }
}

function getGoldAmountProps({ goldAmount: amount, goldDirection: amountDirection }: ExchangeProps) {
  return {
    amount,
    amountDirection,
    amountColor: colors.celoGold,
    displayAmount: `${amountDirection}${getMoneyDisplayValue(amount)}`,
  }
}

function getDollarAmountProps({
  dollarAmount,
  dollarDirection: amountDirection,
  localCurrencyCode,
  localCurrencySymbol,
  localAmount,
}: ExchangeProps) {
  const amount = localCurrencyCode ? localAmount : dollarAmount
  return {
    amount,
    amountDirection,
    amountColor: colors.celoGreen,
    displayAmount: amount
      ? `${amountDirection}${localCurrencySymbol +
          getMoneyDisplayValue(amount) +
          (localCurrencyCode || '')}`
      : '-',
  }
}

export function ExchangeFeedItem(props: Props) {
  const { showGoldAmount, inSymbol, status, timestamp, t, i18n } = props

  const localCurrencyCode = useLocalCurrencyCode()
  const localCurrencySymbol = useLocalCurrencySymbol()
  const localExchangeRate = useExchangeRate()

  const onPress = () => {
    navigateToExchangeReview(timestamp, {
      makerToken: resolveCurrency(inSymbol),
      makerAmount: new BigNumber(props.inValue),
      takerAmount: new BigNumber(props.outValue),
    })
  }

  const inCurrency = resolveCurrency(inSymbol)
  const exchangeInputProps = { ...props, localCurrencyCode, localCurrencySymbol, localExchangeRate }
  const exchangeProps =
    inCurrency === CURRENCY_ENUM.DOLLAR
      ? getDollarExchangeProps(exchangeInputProps)
      : getGoldExchangeProps(exchangeInputProps)
  const amountProps = showGoldAmount
    ? getGoldAmountProps(exchangeProps)
    : getDollarAmountProps(exchangeProps)

  const { inValue, outValue } = exchangeProps
  const { displayAmount, amountDirection, amountColor } = amountProps

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
              {displayAmount}
            </Text>
          </View>
          <View style={styles.exchangeContainer}>
            <Text style={[fontStyles.activityCurrency, inStyle]}>
              {inValue ? getMoneyDisplayValue(inValue) : '-'}
            </Text>
            <View style={styles.arrow}>
              <ExchangeArrow />
            </View>
            <Text style={[fontStyles.activityCurrency, outStyle]}>
              {outValue ? getMoneyDisplayValue(outValue) : '-'}
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
