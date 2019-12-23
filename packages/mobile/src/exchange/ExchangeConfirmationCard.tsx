import colors from '@celo/react-components/styles/colors'
import { fontStyles } from '@celo/react-components/styles/fonts'
import BigNumber from 'bignumber.js'
import * as React from 'react'
import { WithTranslation } from 'react-i18next'
import { StyleSheet, Text, View } from 'react-native'
import CurrencyDisplay from 'src/components/CurrencyDisplay'
import FeeIcon from 'src/components/FeeIcon'
import LineItemRow from 'src/components/LineItemRow'
import ExchangeRate from 'src/exchange/ExchangeRate'
import { CURRENCY_ENUM } from 'src/geth/consts'
import { Namespaces, withTranslation } from 'src/i18n'
import {
  useDollarsToLocalAmount,
  useLocalCurrencyCode,
  useLocalCurrencySymbol,
} from 'src/localCurrency/hooks'
import RoundedArrow from 'src/shared/RoundedArrow'
import { getMoneyDisplayValue } from 'src/utils/formatting'

export interface ExchangeConfirmationCardProps {
  makerToken: CURRENCY_ENUM
  makerAmount: BigNumber
  takerAmount: BigNumber
  fee?: string
  exchangeRate?: BigNumber
  newDollarBalance?: BigNumber
  newGoldBalance?: BigNumber
}

type Props = ExchangeConfirmationCardProps & WithTranslation

const getTakerToken = (props: Props) => {
  return props.makerToken === CURRENCY_ENUM.DOLLAR ? CURRENCY_ENUM.GOLD : CURRENCY_ENUM.DOLLAR
}

const getExchangeRate = (props: Props) => {
  const { makerAmount, takerAmount, exchangeRate } = props

  if (exchangeRate) {
    return exchangeRate
  }

  // For feed drilldown, the exchange rate has not been provided
  return makerAmount.dividedBy(takerAmount)
}

const renderNewBalances = (
  props: Props,
  newDollarBalance: BigNumber,
  newGoldBalance: BigNumber
) => {
  const { t } = props

  return (
    <View style={styles.newBalanceContainer}>
      <View style={styles.line} />

      <View style={styles.titleContainer}>
        <Text style={[fontStyles.pCurrency, styles.title]}>{t('newBalance')}</Text>
      </View>
      <View style={styles.tabular}>
        <Text style={fontStyles.bodySecondary}>{t('global:celoDollars')}</Text>
        <Text numberOfLines={1} style={[fontStyles.body, styles.dollar]}>
          {getMoneyDisplayValue(newDollarBalance, CURRENCY_ENUM.DOLLAR, true)}
        </Text>
      </View>

      <View style={styles.tabular}>
        <Text style={fontStyles.bodySecondary}>{t('global:celoGold')}</Text>
        <Text numberOfLines={1} style={[fontStyles.body, styles.gold]}>
          {getMoneyDisplayValue(newGoldBalance, CURRENCY_ENUM.GOLD, true)}
        </Text>
      </View>
    </View>
  )
}

export function ExchangeConfirmationCard(props: Props) {
  const {
    t,
    newDollarBalance,
    newGoldBalance,
    makerAmount,
    takerAmount,
    makerToken: token,
    fee,
  } = props

  const localCurrencyCode = useLocalCurrencyCode()
  const localCurrencySymbol = useLocalCurrencySymbol()
  const localMakerAmount = useDollarsToLocalAmount(props.makerAmount)
  const localTakerAmount = useDollarsToLocalAmount(props.takerAmount)

  const takerToken = getTakerToken(props)

  return (
    <View style={styles.container}>
      <View style={styles.exchange}>
        <CurrencyDisplay
          amount={
            props.makerToken === CURRENCY_ENUM.DOLLAR && localCurrencyCode
              ? new BigNumber(localMakerAmount || 0)
              : makerAmount
          }
          size={36}
          type={props.makerToken}
          currencySymbol={localCurrencySymbol}
        />
        <View style={styles.arrow}>
          <RoundedArrow />
        </View>
        <CurrencyDisplay
          amount={
            takerToken === CURRENCY_ENUM.DOLLAR && localCurrencyCode
              ? new BigNumber(localTakerAmount || 0)
              : takerAmount
          }
          size={36}
          type={takerToken}
          currencySymbol={localCurrencySymbol}
        />
      </View>

      <View style={styles.title}>
        <ExchangeRate rate={getExchangeRate(props)} makerToken={token} />
      </View>

      <View style={styles.feeContainer}>
        <LineItemRow
          currencySymbol={takerToken}
          amount={fee || '0.00'}
          title={t('securityFee')}
          titleIcon={<FeeIcon />}
        />
        <LineItemRow
          currencySymbol={takerToken}
          amount={'0.01'}
          title={t('exchangeFee')}
          titleIcon={<FeeIcon isExchange={true} />}
        />
      </View>

      {newDollarBalance &&
        newGoldBalance &&
        renderNewBalances(props, newDollarBalance, newGoldBalance)}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    borderWidth: 1,
    borderColor: colors.darkLightest,
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  feeContainer: {
    marginBottom: 10,
    paddingHorizontal: 50,
  },
  arrow: {
    marginHorizontal: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabular: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignSelf: 'stretch',
    paddingHorizontal: 40,
    marginVertical: 5,
    marginHorizontal: 10,
  },
  line: {
    borderBottomColor: colors.darkLightest,
    borderBottomWidth: 1,
    margin: 10,
  },
  exchange: {
    marginTop: 20,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  titleContainer: {
    paddingTop: 15,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    marginVertical: 10,
  },
  newBalanceContainer: {
    marginBottom: 20,
  },
  gold: {
    color: colors.celoGold,
  },
  dollar: {
    color: colors.celoGreen,
  },
})

export default withTranslation(Namespaces.exchangeFlow9)(ExchangeConfirmationCard)
