import colors from '@celo/react-components/styles/colors'
import fontStyles from '@celo/react-components/styles/fonts'
import BigNumber from 'bignumber.js'
import * as React from 'react'
import { WithTranslation } from 'react-i18next'
import { StyleSheet, Text, View } from 'react-native'
import { CURRENCIES, CURRENCY_ENUM } from 'src/geth/consts'
import { Namespaces, withTranslation } from 'src/i18n'
import { getExchangeRateDisplayValue } from 'src/utils/formatting'

interface ExchangeRateProps {
  showFinePrint?: boolean
  makerToken: CURRENCY_ENUM
  rate: BigNumber
}

type Props = ExchangeRateProps & WithTranslation

export class ExchangeRate extends React.PureComponent<Props> {
  render() {
    const { t, rate, showFinePrint } = this.props
    const isRateValid = !rate.isZero() && rate.isFinite()
    const takerToken =
      this.props.makerToken === CURRENCY_ENUM.DOLLAR ? CURRENCY_ENUM.GOLD : CURRENCY_ENUM.DOLLAR

    const makerTokenCode = CURRENCIES[this.props.makerToken].code
    const takerTokenCode = CURRENCIES[takerToken].code
    return (
      <View style={styles.rate}>
        <Text style={[styles.rateText, fontStyles.bodySecondary]}>
          {isRateValid ? t('exchangeRate') : t('loadingExchangeRate')}
        </Text>
        {isRateValid && (
          <Text style={styles.ratio}>{` ${getExchangeRateDisplayValue(
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

export default withTranslation(Namespaces.exchangeFlow9)(ExchangeRate)
