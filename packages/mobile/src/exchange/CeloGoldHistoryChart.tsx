import colors from '@celo/react-components/styles/colors'
import fontStyles from '@celo/react-components/styles/fonts'
import variables from '@celo/react-components/styles/variables'
import _ from 'lodash'
import React, { useCallback, useState } from 'react'
import { Dimensions, StyleSheet, Text, View } from 'react-native'
import { LineChart } from 'react-native-chart-kit'
import { connect } from 'react-redux'
import { convertDollarsToLocalAmount } from 'src/localCurrency/convert'
import {
  useExchangeRate,
  useLocalCurrencyCode,
  useLocalCurrencySymbol,
} from 'src/localCurrency/hooks'
import { getMoneyDisplayValue } from 'src/utils/formatting'

import { Circle, Line, Text as SvgText } from 'react-native-svg'
import { exchangeHistorySelector } from 'src/exchange/reducer'
import { CURRENCY_ENUM } from 'src/geth/consts'
import { RootState } from 'src/redux/reducers'
import useSelector from 'src/redux/useSelector'
import { getRateForMakerToken, getTakerAmount } from 'src/utils/currencyExchange'

const CHART_POINTS_NUMBER = 30

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: variables.contentPadding,
  },
  goldPrice: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: variables.contentPadding,
  },
  goldPriceTitle: {
    ...fontStyles.body,
    fontSize: 20,
    lineHeight: 28,
  },
  goldPriceValues: { alignItems: 'flex-end' },
  goldPriceCurrentValue: {
    fontSize: 24,
  },
  goldPriceChange: {
    ...fontStyles.body,
    ...fontStyles.semiBold,
    color: colors.celoGreen,
  },
})

interface StateProps {
  exchangeHistory: any
}

type Props = StateProps

const mapStateToProps = (state: RootState): StateProps => ({
  exchangeHistory: exchangeHistorySelector(state),
})

function CeloGoldHistoryChart({ exchangeHistory }: Props) {
  const drawValueOnChart = useCallback(
    (position: 'top' | 'bottom', x: number, y: number, value: string) => {
      if (position === 'top') {
        y = y - 16
      } else if (position === 'bottom') {
        y = y + 25 // 16 + 14/2
      }
      return (
        <SvgText fill="black" fontSize="14" x={x} y={y} textAnchor="middle">
          {value}
        </SvgText>
      )
    },
    [Math.random()]
  )
  const [range] = useState(30 * 24 * 60 * 60 * 1000) // 30 days
  const exchangeRatePair = useSelector((state) => state.exchange.exchangeRatePair)
  const localCurrencyCode = useLocalCurrencyCode()
  const localCurrencySymbol = useLocalCurrencySymbol()
  const exchangeRate = getRateForMakerToken(
    exchangeRatePair,
    CURRENCY_ENUM.DOLLAR,
    CURRENCY_ENUM.GOLD
  )
  const isRateValid = !exchangeRate.isZero() && exchangeRate.isFinite()
  const dollarRateValue = getTakerAmount(1, exchangeRate)
  const localExchangeRate = useExchangeRate()
  const localRateValue = convertDollarsToLocalAmount(dollarRateValue, localExchangeRate)
  let localRateFormattedValue =
    localRateValue || dollarRateValue === null
      ? getMoneyDisplayValue(localRateValue || 0)
      : getMoneyDisplayValue(dollarRateValue || 0)
  if (localCurrencySymbol) {
    localRateFormattedValue = localCurrencySymbol + localRateFormattedValue
  } else if (localCurrencyCode) {
    localRateFormattedValue = localRateFormattedValue + ' ' + localCurrencyCode
  }

  const calculateGroup = useCallback((er) => {
    return Math.floor(er.timestamp / (range / CHART_POINTS_NUMBER))
  }, [])

  if (!isRateValid || !exchangeHistory.celoGoldExchangeRates.length || exchangeHistory.isLoading) {
    return <Text>Loading...</Text>
  }

  const groupedExchangeHistory = _.groupBy(exchangeHistory.celoGoldExchangeRates, calculateGroup)
  const latestGroup = calculateGroup(
    exchangeHistory.celoGoldExchangeRates[exchangeHistory.celoGoldExchangeRates.length - 1]
  )
  const chartData = _.range(
    Math.min(CHART_POINTS_NUMBER - 1, Object.keys(groupedExchangeHistory).length),
    0,
    -1
  ).map((i) => {
    const group = groupedExchangeHistory[latestGroup - i + 1]
    return group ? _.meanBy(group, (er) => parseFloat(er.exchangeRate)) : 0
  })
  // chartData.push(parseFloat(dollarRateValue.toString()))
  console.log(chartData)
  console.log(parseFloat(dollarRateValue.toString()))
  let lowestRateIdx = 0,
    highestRateIdx = 0
  chartData.forEach((rate, idx) => {
    if (rate > chartData[highestRateIdx]) {
      highestRateIdx = idx
    }
    if (rate < chartData[lowestRateIdx]) {
      lowestRateIdx = idx
    }
  })

  const rateChange = dollarRateValue.minus(chartData[0])
  const rateChangeInPercentage = dollarRateValue.div(chartData[0]).minus(1)
  const chartWidth = Dimensions.get('window').width - variables.contentPadding * 2
  return (
    <View style={styles.container}>
      <View style={styles.goldPrice}>
        <View>
          <Text style={styles.goldPriceTitle}>Gold Price</Text>
        </View>
        <View style={styles.goldPriceValues}>
          <Text style={styles.goldPriceCurrentValue}>{localRateFormattedValue}</Text>
          <Text style={styles.goldPriceChange}>
            {rateChange.toFixed(2)} ({rateChangeInPercentage.toFixed(2)}%)
          </Text>
        </View>
      </View>
      <LineChart
        data={{
          labels: [],
          datasets: [
            {
              data: chartData,
            },
          ],
        }}
        width={chartWidth} // from react-native
        height={220}
        chartConfig={{
          backgroundGradientFrom: colors.background,
          backgroundGradientTo: colors.background,
          color: (opacity = 1) => `rgba(0, 0, 0)`,
          labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
          style: {
            borderRadius: 16,
          },
          propsForDots: {
            r: '0',
            strokeWidth: '0',
          },
        }}
        bezier={true}
        style={{
          // paddingRight: 48,
          paddingTop: 32,
          paddingBottom: 32,
        }}
        withDots={true}
        withShadow={false}
        withInnerLines={false}
        withOuterLines={false}
        withVerticalLabels={false}
        withHorizontalLabels={false}
        renderDotContent={({ x, y, index }) => {
          switch (index) {
            case chartData.length - 1:
              return (
                <>
                  <Circle cx={x} cy={y} r="5" fill={colors.celoGreen} />
                  <Line x1={0} y1={y} x2={x} y2={y} stroke={colors.listBorder} strokeWidth="1" />
                </>
              )

            case highestRateIdx:
              console.log(chartData[highestRateIdx])
              return (
                <>
                  <Circle cx={x} cy={y} r="4" fill={`rgba(0, 0, 0)`} />
                  {drawValueOnChart(
                    'top',
                    x,
                    y,
                    convertDollarsToLocalAmount(
                      chartData[highestRateIdx],
                      localExchangeRate
                    ).toFixed(4)
                  )}
                </>
              )
            case lowestRateIdx:
              return (
                <>
                  <Circle cx={x} cy={y} r="4" fill={`rgba(0, 0, 0)`} />
                  {drawValueOnChart(
                    'bottom',
                    x,
                    y,
                    convertDollarsToLocalAmount(
                      chartData[lowestRateIdx],
                      localExchangeRate
                    ).toFixed(4)
                  )}
                </>
              )
            default:
              return null
          }
        }}
      />
    </View>
  )
}
export default connect(mapStateToProps)(CeloGoldHistoryChart)
