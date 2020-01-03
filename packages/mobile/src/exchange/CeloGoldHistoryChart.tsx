import colors from '@celo/react-components/styles/colors'
import fontStyles from '@celo/react-components/styles/fonts'
import variables from '@celo/react-components/styles/variables'
import BigNumber from 'bignumber.js'
import _ from 'lodash'
import React, { useCallback, useEffect, useState } from 'react'
import {
  ActivityIndicator,
  Dimensions,
  LayoutChangeEvent,
  StyleSheet,
  Text,
  View,
} from 'react-native'
import { LineChart } from 'react-native-chart-kit'
import { connect, useDispatch } from 'react-redux'
import { syncCeloGoldExchangeRateHistory } from 'src/exchange/actions'
import { LocalCurrencyCode } from 'src/localCurrency/consts'
import { useDollarsToLocalAmount, useLocalCurrencyCode } from 'src/localCurrency/hooks'
import { getLocalCurrencyDisplayValue } from 'src/utils/formatting'

import { Circle, G, Line, Text as SvgText } from 'react-native-svg'
import { useGoldToDollarAmount } from 'src/exchange/hooks'
import { exchangeHistorySelector } from 'src/exchange/reducer'
import { RootState } from 'src/redux/reducers'

const CHART_POINTS_NUMBER = 60
const CHART_WIDTH = Dimensions.get('window').width - variables.contentPadding * 2
const CHART_HEIGHT = 180

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
  loader: {
    width: CHART_WIDTH + 32,
    height: CHART_HEIGHT + 130,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rangePeriod: {
    textAlign: 'center',
    fontSize: 16,
    paddingBottom: 4,
    color: colors.gray,
  },
  chartStyle: {
    paddingRight: 0,
    paddingTop: 32,
    marginTop: -32,
    paddingBottom: 16,
  },
})

interface StateProps {
  exchangeHistory: any
}

type Props = StateProps

const mapStateToProps = (state: RootState): StateProps => ({
  exchangeHistory: exchangeHistorySelector(state),
})

function ChartAwareSvgText({
  position,
  x,
  y,
  value,
}: {
  position: 'top' | 'bottom'
  x: number
  y: number
  value: string
}) {
  if (position === 'top') {
    y = y - 16
  } else if (position === 'bottom') {
    y = y + 25
  }
  const [realX, setRealX] = useState(x)
  const onLayout = useCallback(
    ({
      nativeEvent: {
        layout: { width },
      },
    }: LayoutChangeEvent) => {
      if (x - width / 2 < 0) {
        setRealX(width / 2)
      }
      if (x + width / 2 > CHART_WIDTH) {
        setRealX(CHART_WIDTH - width / 2)
      }
    },
    [x]
  )
  return (
    <SvgText onLayout={onLayout} fill="black" fontSize="14" x={realX} y={y} textAnchor="middle">
      {value}
    </SvgText>
  )
}

function renderDotOnChart(chartData: Array<{ amount: number | BigNumber; displayValue: string }>) {
  let lowestRateIdx = 0,
    highestRateIdx = 0
  chartData.forEach((rate, idx) => {
    if (rate.amount > chartData[highestRateIdx].amount) {
      highestRateIdx = idx
    }
    if (rate.amount < chartData[lowestRateIdx].amount) {
      lowestRateIdx = idx
    }
  })
  return ({ x, y, index }: { x: number; y: number; index: number }) => {
    switch (index) {
      case chartData.length - 1:
        return (
          <G key={index}>
            <Circle cx={x} cy={y} r="5" fill={'black'} />
            <Line x1={0} y1={y} x2={x} y2={y} stroke={colors.listBorder} strokeWidth="1" />
          </G>
        )

      case highestRateIdx:
        return (
          <ChartAwareSvgText
            x={x}
            y={y}
            key={index}
            value={chartData[highestRateIdx].displayValue}
            position={'top'}
          />
        )

      case lowestRateIdx:
        return (
          <ChartAwareSvgText
            x={x}
            y={y}
            key={index}
            value={chartData[lowestRateIdx].displayValue}
            position={'bottom'}
          />
        )

      default:
        return null
    }
  }
}

function Loader() {
  return (
    <View style={styles.loader}>
      <ActivityIndicator size="large" color={colors.celoGreen} />
    </View>
  )
}

function CeloGoldHistoryChart({ exchangeHistory }: Props) {
  const dispatch = useDispatch()
  const calculateGroup = useCallback((er) => {
    return Math.floor(er.timestamp / (range / CHART_POINTS_NUMBER))
  }, [])

  const localCurrencyCode = useLocalCurrencyCode()
  const displayLocalCurrency = useCallback(
    (amount: BigNumber.Value) =>
      getLocalCurrencyDisplayValue(amount, localCurrencyCode || LocalCurrencyCode.USD, true),
    [localCurrencyCode]
  )
  const goldToDollars = useCallback(useGoldToDollarAmount, [])
  const dollarsToLocal = useCallback(useDollarsToLocalAmount, [])

  const [range] = useState(30 * 24 * 60 * 60 * 1000) // 30 days
  useEffect(() => {
    const interval = setInterval(() => {
      dispatch(syncCeloGoldExchangeRateHistory())
    }, 600000) // Sync history every 10 minutes
    return () => {
      clearInterval(interval)
    }
  }, [])
  if (!exchangeHistory.celoGoldExchangeRates.length || exchangeHistory.isLoading) {
    return <Loader />
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
    const localAmount = dollarsToLocal(
      group ? _.meanBy(group, (er) => parseFloat(er.exchangeRate)) : 0
    )
    return {
      amount: localAmount ? localAmount : 0,
      displayValue: localAmount ? displayLocalCurrency(localAmount) : '',
    }
  })

  const currentGoldRateInLocalCurrency = dollarsToLocal(goldToDollars(1))
  const oldestGoldRateInLocalCurrency = chartData[0].amount
  if (oldestGoldRateInLocalCurrency == null || currentGoldRateInLocalCurrency == null) {
    return <Loader />
  }
  // We need displayValue to show min/max on the chart. In case the
  // current value is min/max we do not need to show it once again,
  // therefor displayValue = ''
  chartData.push({ amount: currentGoldRateInLocalCurrency, displayValue: '' })
  const rateChange = currentGoldRateInLocalCurrency.minus(oldestGoldRateInLocalCurrency)
  const rateChangeInPercentage = currentGoldRateInLocalCurrency
    .div(oldestGoldRateInLocalCurrency)
    .minus(1)
    .multipliedBy(100)
  const renderDot = renderDotOnChart(chartData)

  return (
    <View style={styles.container}>
      <View style={styles.goldPrice}>
        <View>
          <Text style={styles.goldPriceTitle}>Gold Price</Text>
        </View>
        <View style={styles.goldPriceValues}>
          <Text style={styles.goldPriceCurrentValue}>
            {displayLocalCurrency(currentGoldRateInLocalCurrency)}
          </Text>
          <Text style={styles.goldPriceChange}>
            {rateChange.gt(0) ? '▴' : '▾'} {rateChange.toFixed(2)} ({rateChangeInPercentage.toFixed(
              2
            )}%)
          </Text>
        </View>
      </View>
      {/*
          // @ts-ignore */}
      <LineChart
        data={{
          labels: [],
          datasets: [
            {
              data: chartData.map((el) => el.amount),
            },
          ],
        }}
        width={CHART_WIDTH}
        height={CHART_HEIGHT}
        chartConfig={{
          backgroundGradientFrom: colors.background,
          backgroundGradientTo: colors.background,
          color: (opacity = 1) => `rgba(0, 0, 0)`,
          labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
          propsForDots: {
            r: '0',
            strokeWidth: '0',
          },
        }}
        bezier={true}
        style={styles.chartStyle}
        withDots={true}
        withShadow={false}
        withInnerLines={false}
        withOuterLines={false}
        withVerticalLabels={false}
        withHorizontalLabels={false}
        renderDotContent={renderDot}
      />
      <Text style={styles.rangePeriod}>30d</Text>
    </View>
  )
}
export default connect(mapStateToProps)(CeloGoldHistoryChart)
