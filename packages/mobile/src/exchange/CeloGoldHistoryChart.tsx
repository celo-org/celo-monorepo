import colors from '@celo/react-components/styles/colors'
import fontStyles from '@celo/react-components/styles/fonts'
import variables from '@celo/react-components/styles/variables'
import BigNumber from 'bignumber.js'
import _ from 'lodash'
import React, { useCallback, useState } from 'react'
import { WithTranslation } from 'react-i18next'
import { ActivityIndicator, LayoutChangeEvent, StyleSheet, Text, View } from 'react-native'
import { Circle, G, Line, Text as SvgText } from 'react-native-svg'
import { useExchangeRate } from 'src/exchange/hooks'
import { exchangeHistorySelector } from 'src/exchange/reducer'
import { Namespaces, withTranslation } from 'src/i18n'
import { LocalCurrencyCode } from 'src/localCurrency/consts'
import { convertDollarsToLocalAmount } from 'src/localCurrency/convert'
import { getLocalCurrencyExchangeRate } from 'src/localCurrency/selectors'
import useSelector from 'src/redux/useSelector'
import { goldToDollarAmount } from 'src/utils/currencyExchange'
import { getLocalCurrencyDisplayValue } from 'src/utils/formatting'
import { formatFeedDate } from 'src/utils/time'
import { VictoryGroup, VictoryLine, VictoryScatter } from 'victory-native'

const CHART_POINTS_NUMBER = 60
const CHART_WIDTH = variables.width - variables.contentPadding * 2
const CHART_HEIGHT = 180
const CHART_MIN_VERTICAL_RANGE = 0.1 // one cent
const CHART_DOMAIN_PADDING = { y: [30, 30] as [number, number], x: [5, 5] as [number, number] }

interface OwnProps {
  testID?: string
}

type Props = WithTranslation & OwnProps

// ChartAwareSvgText draws text on the chart with avareness of its edges.
// Example: we want to draw some text at {x:10,y:10}(coordinates of the center).
// The text width is 33px and if draw it right away it will be cuted by the chart edges.
// The component will adjust coordinates to {x: (textWidthInPixels/2), y: 10}
function ChartAwareSvgText({
  position,
  x,
  y,
  value,
  chartWidth,
}: {
  position: 'top' | 'bottom'
  x: number
  y: number
  value: string
  chartWidth: number
}) {
  if (position === 'top') {
    y = y - 16
  } else if (position === 'bottom') {
    y = y + 25
  }
  const [adjustedX, setAdjustedX] = useState(x)
  const onLayout = useCallback(
    ({
      nativeEvent: {
        layout: { width },
      },
    }: LayoutChangeEvent) => {
      if (Math.abs(width - chartWidth) > 2) {
        if (x - width / 2 < 0) {
          setAdjustedX(width / 2)
        }
        if (x + width / 2 > chartWidth) {
          setAdjustedX(chartWidth - width / 2)
        }
      }
    },
    [x]
  )
  return (
    // @ts-ignore
    <SvgText onLayout={onLayout} fill="black" fontSize="14" x={adjustedX} y={y} textAnchor="middle">
      {value}
    </SvgText>
  )
}

function renderPointOnChart(
  chartData: Array<{ amount: number | BigNumber; displayValue: string }>
) {
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
  return ({ datum, x, y }: { x: number; y: number; datum: { _x: number; _y: number } }) => {
    const idx = datum._x
    switch (idx) {
      case chartData.length - 1:
        return (
          <G key={idx}>
            <Circle cx={x} cy={y} r="5" fill={'black'} />
            <Line x1={0} y1={y} x2={x} y2={y} stroke={colors.listBorder} strokeWidth="1" />
          </G>
        )

      case highestRateIdx:
        return (
          <ChartAwareSvgText
            x={x}
            y={y}
            key={idx}
            value={chartData[highestRateIdx].displayValue}
            position={'top'}
            chartWidth={CHART_WIDTH}
          />
        )

      case lowestRateIdx:
        return (
          <ChartAwareSvgText
            x={x}
            y={y}
            key={idx}
            value={chartData[lowestRateIdx].displayValue}
            position={'bottom'}
            chartWidth={CHART_WIDTH}
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

function CeloGoldHistoryChart({ t, testID, i18n }: Props) {
  const calculateGroup = useCallback((er) => {
    return Math.floor(er.timestamp / (range / CHART_POINTS_NUMBER))
  }, [])

  // We hardcode localCurrencyCode to null, hence the chart will always show cGLD to cUSD no matter what.
  // TODO: revert this back to `useLocalCurrencyCode()` when we have history data for cGDL to Local Currency.
  const localCurrencyCode = null
  const displayLocalCurrency = useCallback(
    (amount: BigNumber.Value) =>
      getLocalCurrencyDisplayValue(amount, localCurrencyCode || LocalCurrencyCode.USD, true),
    [localCurrencyCode]
  )
  const exchangeRate = useExchangeRate()
  const goldToDollars = useCallback((amount) => goldToDollarAmount(amount, exchangeRate), [
    exchangeRate,
  ])
  const localExchangeRate = useSelector(getLocalCurrencyExchangeRate)
  const dollarsToLocal = useCallback(
    (amount) => convertDollarsToLocalAmount(amount, localCurrencyCode ? localExchangeRate : 1),
    [localExchangeRate]
  )
  const [range] = useState(30 * 24 * 60 * 60 * 1000) // 30 days
  const exchangeHistory = useSelector(exchangeHistorySelector)

  if (!exchangeHistory.celoGoldExchangeRates.length) {
    return <Loader />
  }

  const groupedExchangeHistory = _.groupBy(exchangeHistory.celoGoldExchangeRates, calculateGroup)
  const latestExchangeRate =
    exchangeHistory.celoGoldExchangeRates[exchangeHistory.celoGoldExchangeRates.length - 1]
  const latestGroup = calculateGroup(latestExchangeRate)
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
      amount: localAmount ? localAmount.toNumber() : 0,
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
  chartData.push({ amount: currentGoldRateInLocalCurrency.toNumber(), displayValue: '' })
  const rateChange = currentGoldRateInLocalCurrency.minus(oldestGoldRateInLocalCurrency)
  const rateChangeInPercentage = currentGoldRateInLocalCurrency
    .div(oldestGoldRateInLocalCurrency)
    .minus(1)
    .multipliedBy(100)
  const RenderPoint = renderPointOnChart(chartData)

  const values = chartData.map((el) => el.amount)
  const min = Math.min(...values)
  const max = Math.max(...values)
  let domain
  // ensure that vertical chart range is at least CHART_MIN_VERTICAL_RANGE
  if (max - min < CHART_MIN_VERTICAL_RANGE) {
    const offset = CHART_MIN_VERTICAL_RANGE - (max - min) / 2
    domain = {
      y: [min - offset, max + offset] as [number, number],
      x: [0, chartData.length] as [number, number],
    }
  }
  const rateWentUp = rateChange.gt(0)

  return (
    <View style={styles.container} testID={testID}>
      <View style={styles.goldPrice}>
        <View>
          <Text style={styles.goldPriceTitle}>{t('goldPrice')}</Text>
        </View>
        <View style={styles.goldPriceValues}>
          <Text style={styles.goldPriceCurrentValue}>
            {displayLocalCurrency(currentGoldRateInLocalCurrency)}
          </Text>
          <Text style={rateWentUp ? styles.goldPriceWentUp : styles.goldPriceWentDown}>
            {rateWentUp ? '▴' : '▾'} {rateChange.toFormat(2)} ({rateChangeInPercentage.toFormat(2)}
            %)
          </Text>
        </View>
      </View>
      <VictoryGroup
        domainPadding={CHART_DOMAIN_PADDING}
        singleQuadrantDomainPadding={false}
        padding={{ left: 0 }}
        width={CHART_WIDTH}
        height={CHART_HEIGHT}
        data={chartData.map((el) => el.amount)}
        domain={domain}
      >
        <VictoryLine interpolation="monotoneX" />
        {/* 
        // @ts-ignore */}
        <VictoryScatter dataComponent={<RenderPoint />} />
      </VictoryGroup>
      <View style={styles.range}>
        <Text style={styles.timeframe}>
          {formatFeedDate(latestExchangeRate.timestamp - range, i18n)}
        </Text>
        <Text style={styles.timeframe}>{formatFeedDate(latestExchangeRate.timestamp, i18n)}</Text>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: variables.contentPadding,
  },
  goldPrice: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: variables.contentPadding,
    paddingBottom: variables.contentPadding,
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
  goldPriceWentUp: {
    ...fontStyles.body,
    ...fontStyles.semiBold,
    color: colors.celoGreen,
  },
  goldPriceWentDown: {
    ...fontStyles.body,
    ...fontStyles.semiBold,
    color: colors.errorRed,
  },

  loader: {
    width: CHART_WIDTH + 32,
    height: CHART_HEIGHT + 130,
    alignItems: 'center',
    justifyContent: 'center',
  },
  timeframe: {
    color: colors.gray,
    fontSize: 16,
  },
  chartStyle: {
    paddingRight: 0,
    paddingTop: 32,
    marginTop: -32,
    paddingBottom: 16,
  },
  range: {
    justifyContent: 'space-between',
    flexDirection: 'row',
    paddingBottom: 4,
  },
})

export default withTranslation(Namespaces.exchangeFlow9)(CeloGoldHistoryChart)
