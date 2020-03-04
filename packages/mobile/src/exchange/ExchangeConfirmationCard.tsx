import colors from '@celo/react-components/styles/colors'
import BigNumber from 'bignumber.js'
import * as React from 'react'
import { WithTranslation } from 'react-i18next'
import { StyleSheet, View } from 'react-native'
import { MoneyAmount } from 'src/apollo/types'
import CurrencyDisplay, { DisplayType } from 'src/components/CurrencyDisplay'
import FeeIcon from 'src/components/FeeIcon'
import LineItemRow from 'src/components/LineItemRow'
import ExchangeRate from 'src/exchange/ExchangeRate'
import { CURRENCIES, CURRENCY_ENUM } from 'src/geth/consts'
import { Namespaces, withTranslation } from 'src/i18n'
import RoundedArrow from 'src/shared/RoundedArrow'

export interface ExchangeConfirmationCardProps {
  makerAmount: MoneyAmount
  takerAmount: MoneyAmount
  fee?: string
  tobinTax?: string
  exchangeRate?: BigNumber
}

type Props = ExchangeConfirmationCardProps & WithTranslation

const getExchangeRate = (props: Props) => {
  const { makerAmount, takerAmount, exchangeRate } = props

  if (exchangeRate) {
    return exchangeRate
  }

  // For feed drilldown, the exchange rate has not been provided
  return new BigNumber(makerAmount.value).dividedBy(takerAmount.value)
}

export function ExchangeConfirmationCard(props: Props) {
  const { t, makerAmount, takerAmount, fee, tobinTax } = props

  // TODO: improve this with a generic helper
  const makerToken =
    makerAmount.currencyCode === CURRENCIES[CURRENCY_ENUM.DOLLAR].code
      ? CURRENCY_ENUM.DOLLAR
      : CURRENCY_ENUM.GOLD
  const takerToken = makerToken === CURRENCY_ENUM.DOLLAR ? CURRENCY_ENUM.GOLD : CURRENCY_ENUM.DOLLAR

  return (
    <View style={styles.container}>
      <View style={styles.exchange}>
        <CurrencyDisplay type={DisplayType.Big} amount={makerAmount} size={36} useColors={true} />
        <View style={styles.arrow}>
          <RoundedArrow />
        </View>
        <CurrencyDisplay type={DisplayType.Big} amount={takerAmount} size={36} useColors={true} />
      </View>

      <View style={styles.title}>
        <ExchangeRate rate={getExchangeRate(props)} makerToken={makerToken} />
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
          amount={tobinTax}
          title={t('exchangeFee')}
          titleIcon={<FeeIcon isExchange={true} />}
        />
      </View>
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
