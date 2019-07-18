import colors from '@celo/react-components/styles/colors'
import fontStyles from '@celo/react-components/styles/fonts'
import { CURRENCIES, CURRENCY_ENUM as Tokens } from '@celo/utils'
import BigNumber from 'bignumber.js'
import * as React from 'react'
import { withNamespaces, WithNamespaces } from 'react-i18next'
import { StyleSheet, Text, View } from 'react-native'
import { Namespaces } from 'src/i18n'
import { getExchangeDisplayValueFromBigNum } from 'src/utils/formatting'

interface ExchangeRateProps {
  showFinePrint?: boolean
  makerToken: Tokens
  rate: BigNumber
}

type Props = ExchangeRateProps & WithNamespaces

export class ExchangeRate extends React.PureComponent<Props> {
  render() {
    const { t, rate, showFinePrint } = this.props
    const isRateValid = !rate.isZero() && rate.isFinite()
    const takerToken = this.props.makerToken === Tokens.DOLLAR ? Tokens.GOLD : Tokens.DOLLAR

    const makerTokenCode = CURRENCIES[this.props.makerToken].code
    const takerTokenCode = CURRENCIES[takerToken].code
    return (
      <View style={styles.rate}>
        <Text style={[styles.rateText, fontStyles.bodySecondary]}>
          {isRateValid ? t('exchangeRate') : t('loadingExchangeRate')}
        </Text>
        {isRateValid && (
          <Text style={styles.ratio}>{` ${getExchangeDisplayValueFromBigNum(
            rate
          )} ${makerTokenCode} : 1 ${takerTokenCode}`}</Text>
        )}
        {showFinePrint && <Text style={styles.finePrint}>{t('includeExchangeFee')}</Text>}
      </View>
    )
  }
}

const styles = StyleSheet.create({
  rate: {
    paddingVertical: 10,
    justifyContent: 'center',
  },
  rateText: {
    textAlign: 'center',
  },
  ratio: {
    textAlign: 'center',
    color: colors.dark,
  },
  finePrint: {
    textAlign: 'center',
    fontSize: 12,
    color: colors.darkSecondary,
  },
})

export default withNamespaces(Namespaces.exchangeFlow9)(ExchangeRate)
