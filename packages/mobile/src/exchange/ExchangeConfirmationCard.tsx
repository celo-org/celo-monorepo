import colors from '@celo/react-components/styles/colors'
import { fontStyles } from '@celo/react-components/styles/fonts'
import BigNumber from 'bignumber.js'
import * as React from 'react'
import { withNamespaces, WithNamespaces } from 'react-i18next'
import { StyleSheet, Text, View } from 'react-native'
import CurrencyDisplay from 'src/components/CurrencyDisplay'
import ExchangeRate from 'src/exchange/ExchangeRate'
import { CURRENCY_ENUM } from 'src/geth/consts'
import { Namespaces } from 'src/i18n'
import RoundedArrow from 'src/shared/RoundedArrow'

export interface ExchangeConfirmationCardProps {
  token: CURRENCY_ENUM
  newDollarBalance: string
  newGoldBalance: string
  leftCurrencyAmount: BigNumber
  rightCurrencyAmount: BigNumber
  exchangeRate: string | null
  fee: string
}

type Props = ExchangeConfirmationCardProps & WithNamespaces

class ExchangeConfirmationCard extends React.PureComponent<Props> {
  takerToken() {
    return this.props.token === CURRENCY_ENUM.DOLLAR ? CURRENCY_ENUM.GOLD : CURRENCY_ENUM.DOLLAR
  }

  renderNewBalances = (newDollarBalance: string, newGoldBalance: string) => {
    const { t } = this.props

    return (
      <View style={styles.newBalanceContainer}>
        <View style={styles.line} />

        <View style={styles.titleContainer}>
          <Text style={[fontStyles.pCurrency, styles.title]}>{t('newBalance')}</Text>
        </View>
        <View style={styles.tabular}>
          <Text style={fontStyles.bodySecondary}>{t('celoDollars')}</Text>
          <Text numberOfLines={1} style={[fontStyles.currency, styles.dollar]}>
            ${newDollarBalance}
          </Text>
        </View>

        <View style={styles.tabular}>
          <Text style={fontStyles.bodySecondary}>{t('celoGold')}</Text>
          <Text numberOfLines={1} style={[fontStyles.currency, styles.gold]}>
            {newGoldBalance}
          </Text>
        </View>
      </View>
    )
  }

  exchangeRateToDisplay() {
    const { leftCurrencyAmount, rightCurrencyAmount, exchangeRate } = this.props

    if (exchangeRate && exchangeRate.length > 0) {
      return new BigNumber(exchangeRate)
    }

    return rightCurrencyAmount.dividedBy(leftCurrencyAmount)
  }

  render() {
    const { newDollarBalance, newGoldBalance, leftCurrencyAmount, rightCurrencyAmount } = this.props

    const shouldRenderBalance = newDollarBalance.length > 0 && newGoldBalance.length > 0
    return (
      <View style={styles.container}>
        <View style={styles.exchange}>
          <CurrencyDisplay
            amount={leftCurrencyAmount.toString()}
            size={36}
            type={this.props.token}
            balanceOutOfSync={false}
          />
          <View style={styles.arrow}>
            <RoundedArrow />
          </View>

          <CurrencyDisplay
            amount={rightCurrencyAmount.toString()}
            size={36}
            type={this.takerToken()}
            balanceOutOfSync={false}
          />
        </View>

        <View style={styles.title}>
          <ExchangeRate rate={this.exchangeRateToDisplay()} makerToken={this.props.token} />
        </View>

        {shouldRenderBalance && this.renderNewBalances(newDollarBalance, newGoldBalance)}
      </View>
    )
  }
}

export default withNamespaces(Namespaces.exchangeFlow9)(ExchangeConfirmationCard)

const styles = StyleSheet.create({
  container: {
    minHeight: 300,
    flex: 1,
    borderWidth: 1,
    borderColor: colors.darkLightest,
    justifyContent: 'center',
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
  fee: {
    color: colors.dark,
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
