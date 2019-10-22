import colors from '@celo/react-components/styles/colors'
import { fontStyles } from '@celo/react-components/styles/fonts'
import BigNumber from 'bignumber.js'
import * as React from 'react'
import { withNamespaces, WithNamespaces } from 'react-i18next'
import { StyleSheet, Text, View } from 'react-native'
import CurrencyDisplay from 'src/components/CurrencyDisplay'
import LineItemRow from 'src/components/LineItemRow'
import ExchangeRate from 'src/exchange/ExchangeRate'
import FeeExchangeIcon from 'src/exchange/FeeExchangeIcon'
import { CURRENCY_ENUM } from 'src/geth/consts'
import { Namespaces } from 'src/i18n'
import FeeIcon from 'src/send/FeeIcon'
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

type Props = ExchangeConfirmationCardProps & WithNamespaces

class ExchangeConfirmationCard extends React.PureComponent<Props> {
  getTakerToken() {
    return this.props.makerToken === CURRENCY_ENUM.DOLLAR
      ? CURRENCY_ENUM.GOLD
      : CURRENCY_ENUM.DOLLAR
  }

  getTobinTax() {
    return '0.01'
  }

  getExchangeRate() {
    const { makerAmount, takerAmount, exchangeRate } = this.props

    if (exchangeRate) {
      return exchangeRate
    }

    // For feed drilldown, the exchange rate has not been provided
    return makerAmount.dividedBy(takerAmount)
  }

  renderNewBalances = (newDollarBalance: BigNumber, newGoldBalance: BigNumber) => {
    const { t } = this.props

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

  render() {
    const {
      t,
      newDollarBalance,
      newGoldBalance,
      makerAmount,
      takerAmount,
      makerToken: token,
      fee,
    } = this.props

    return (
      <View style={styles.container}>
        <View style={styles.exchange}>
          <CurrencyDisplay amount={makerAmount} size={36} type={this.props.makerToken} />
          <View style={styles.arrow}>
            <RoundedArrow />
          </View>
          <CurrencyDisplay amount={takerAmount} size={36} type={this.getTakerToken()} />
        </View>

        <View style={styles.title}>
          <ExchangeRate rate={this.getExchangeRate()} makerToken={token} />
        </View>

        <View style={styles.feeContainer}>
          <LineItemRow
            currencySymbol={this.getTakerToken()}
            amount={fee}
            title={t('securityFee')}
            titleIcon={<FeeIcon />}
          />
          <LineItemRow
            currencySymbol={this.getTakerToken()}
            amount={this.getTobinTax()}
            title={t('exchangeFee')}
            titleIcon={<FeeExchangeIcon />}
          />
        </View>

        {newDollarBalance &&
          newGoldBalance &&
          this.renderNewBalances(newDollarBalance, newGoldBalance)}
      </View>
    )
  }
}

const styles = StyleSheet.create({
  container: {
    minHeight: 300,
    flex: 1,
    borderWidth: 1,
    borderColor: colors.darkLightest,
    justifyContent: 'center',
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
    paddingTop: 30,
    paddingBottom: 20,
    flex: 1,
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

export default withNamespaces(Namespaces.exchangeFlow9)(ExchangeConfirmationCard)
