import * as React from 'react'
import getConfig from 'next/config'
import { LayoutChangeEvent, StyleSheet, Text, View } from 'react-native'
import Racer from 'src/dev/Racer'
import { I18nProps, withNamespaces } from 'src/i18n'
import { colors, fonts, standardStyles, textStyles } from 'src/styles'
import Button, { BTN, SIZE } from '../shared/Button.3'

interface BoardProps {
  leaders: Competitor[]
}

interface Competitor {
  identity: string
  points: number
}

interface State {
  width: number
  page: number
}

class LeaderBoard extends React.PureComponent<BoardProps & I18nProps, State> {
  state: State = {
    width: 0,
    page: 0,
  }

  onLayout = (event: LayoutChangeEvent) => {
    const { width } = event.nativeEvent.layout
    this.setState({ width })
  }

  onExpand = () => {
    const { page } = this.state
    this.setState({ page: page + 1 })
  }

  render() {
    const { page } = this.state
    const { pageLength } = getConfig().publicRuntimeConfig.LEADERBOARD
    const showExpandButton = this.props.leaders.length >= (page + 1) * pageLength
    const sortedLeaders = this.props.leaders.sort(sorter).slice(0, pageLength * (page + 1))
    const maxPoints = round(sortedLeaders[0].points * 1.1, 100)
    const width = this.state.width
    return (
      <View onLayout={this.onLayout}>
        {sortedLeaders
          .map(({ points, identity }) => {
            return {
              identity,
              relativePoints: round((points / maxPoints) * width),
            }
          })
          .map((leader, index) => ({ ...leader, color: getJersey(index) }))
          .map((leader) => (
            <Racer
              key={leader.identity}
              relativePoints={leader.relativePoints}
              color={leader.color}
              identity={leader.identity}
            />
          ))}
        <Axis max={maxPoints} />
        {showExpandButton && (
          <View style={[styles.buttonExpand, standardStyles.elementalMarginTop]}>
            <Button
              text={this.props.t('expandLeaderboard')}
              kind={BTN.NAKED}
              size={SIZE.normal}
              onPress={this.onExpand}
            />
          </View>
        )}
      </View>
    )
  }
}
export default withNamespaces('dev')(LeaderBoard)

const JERSEYS = [colors.primary, colors.lightBlue, colors.red, colors.purple, colors.gold]

function getJersey(rank: number): colors {
  const index = rank % JERSEYS.length
  return JERSEYS[index]
}

function sorter(alpha: Competitor, bravo: Competitor) {
  if (alpha.points === bravo.points) {
    return 0
  } else if (alpha.points < bravo.points) {
    return 1
  }
  return -1
}

const PORTIONS = 8

function Axis({ max }: { max: number }) {
  const scaled_max = max / Math.pow(10, 20)
  const portion = scaled_max / PORTIONS

  return (
    <View style={[standardStyles.row, styles.xaxis]}>
      {Array(PORTIONS)
        .fill(portion)
        .map((ratio, index) => {
          const amount = round(ratio * index)
          return (
            <Text key={amount} style={[fonts.small, textStyles.invert]}>
              {amount}
            </Text>
          )
        })}
      <Text key={max} style={[fonts.small, textStyles.invert]}>
        {round(scaled_max)}
      </Text>
    </View>
  )
}

const styles = StyleSheet.create({
  xaxis: {
    justifyContent: 'space-between',
  },
  buttonExpand: {
    alignItems: 'center',
  },
})

function round(number: number, magnitude?: number) {
  const precision = magnitude || 10
  return Math.ceil(number / precision) * precision
}
