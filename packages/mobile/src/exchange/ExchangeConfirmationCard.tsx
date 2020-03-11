import * as React from 'react'
import { StyleSheet, View } from 'react-native'
import { MoneyAmount } from 'src/apollo/types'
import CurrencyDisplay, { DisplayType } from 'src/components/CurrencyDisplay'
import ExchangeRate from 'src/exchange/ExchangeRate'
import RoundedArrow from 'src/shared/RoundedArrow'

export interface ExchangeConfirmationCardProps {
  makerAmount: MoneyAmount
  takerAmount: MoneyAmount
}

type Props = ExchangeConfirmationCardProps

export default function ExchangeConfirmationCard(props: Props) {
  const { makerAmount, takerAmount } = props

  return (
    <View style={styles.container}>
      <View style={styles.exchange}>
        <CurrencyDisplay type={DisplayType.Big} amount={makerAmount} size={36} useColors={true} />
        <View style={styles.arrow}>
          <RoundedArrow />
        </View>
        <CurrencyDisplay type={DisplayType.Big} amount={takerAmount} size={36} useColors={true} />
      </View>
      <View style={styles.details}>
        <ExchangeRate makerAmount={makerAmount} takerAmount={takerAmount} showFinePrint={true} />
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  arrow: {
    marginHorizontal: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  exchange: {
    marginTop: 20,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  details: {
    marginVertical: 10,
  },
})
