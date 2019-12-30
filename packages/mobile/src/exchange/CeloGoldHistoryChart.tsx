import colors from '@celo/react-components/styles/colors'
import variables from '@celo/react-components/styles/variables'
import _ from 'lodash'
import React, { useCallback, useState } from 'react'
import { Dimensions, Text, View } from 'react-native'
import { LineChart } from 'react-native-chart-kit'
import { connect } from 'react-redux'
import { exchangeHistorySelector } from 'src/exchange/reducer'
import { RootState } from 'src/redux/reducers'

const CHART_POINTS_NUMBER = 30

const styles = {
  container: {
    paddingHorizontal: variables.contentPadding,
  },
}

interface StateProps {
  exchangeHistory: any
}

type Props = StateProps

const mapStateToProps = (state: RootState): StateProps => ({
  exchangeHistory: exchangeHistorySelector(state),
})

function CeloGoldHistoryChart({ exchangeHistory }: Props) {
  const [range] = useState(20 * 24 * 60 * 60 * 1000) // 30 days

  const calculateGroup = useCallback((er) => {
    return Math.floor(er.timestamp / (range / CHART_POINTS_NUMBER))
  }, [])

  if (!exchangeHistory.celoGoldExchangeRates.length || exchangeHistory.isLoading) {
    return <Text>Loading...</Text>
  }

  const groupedExchangeHistory = _.groupBy(exchangeHistory.celoGoldExchangeRates, calculateGroup)
  const latestGroup = calculateGroup(
    exchangeHistory.celoGoldExchangeRates[exchangeHistory.celoGoldExchangeRates.length - 1]
  )
  const chartData = _.range(
    Math.min(CHART_POINTS_NUMBER, Object.keys(groupedExchangeHistory).length),
    0,
    -1
  ).map((i) => {
    const group = groupedExchangeHistory[latestGroup - i + 1]
    return group ? _.meanBy(group, (er) => parseFloat(er.exchangeRate)) : 0
  })
  return (
    <View style={styles.container}>
      <LineChart
        data={{
          labels: [],
          datasets: [
            {
              data: chartData,
            },
          ],
        }}
        width={Dimensions.get('window').width - variables.contentPadding * 2} // from react-native
        height={220}
        chartConfig={{
          backgroundGradientFrom: colors.background,
          backgroundGradientTo: colors.background,
          color: (opacity = 1) => `rgba(0, 0, 0)`,
          labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
          style: {
            borderRadius: 16,
          },
        }}
        bezier={true}
        style={{ paddingRight: 0 }}
        withDots={false}
        withShadow={false}
        withInnerLines={false}
        withOuterLines={false}
        withVerticalLabels={false}
        withHorizontalLabels={false}
        yLabelsOffset={0}
        xLabelsOffset={0}
      />
    </View>
  )
}
export default connect(mapStateToProps)(CeloGoldHistoryChart)
