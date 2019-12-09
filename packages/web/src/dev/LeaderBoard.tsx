import * as React from 'react'
import LazyLoad from 'react-lazyload'
import { LayoutChangeEvent, StyleSheet, Text, View } from 'react-native'
import Fade from 'react-reveal/Fade'
import Racer from 'src/dev/Racer'
import { H2, H3 } from 'src/fonts/Fonts'
import { I18nProps, Trans, withNamespaces } from 'src/i18n'
import Chevron, { Direction } from 'src/icons/chevron'
import { ScreenProps, ScreenSizes, withScreenSize } from 'src/layout/ScreenSize'
import { CeloLinks, hashNav } from 'src/shared/menu-items'
import { colors, fonts, standardStyles, textStyles } from 'src/styles'

import Button, { BTN, SIZE } from 'src/shared/Button.3'

interface BoardProps {
  leaders: Competitor[]
  isLoading: boolean
}

interface Competitor {
  identity: string
  address: string
  points: number
}

interface State {
  width: number
  isExpanded: boolean
}

const PRECISION = 100

const DELAY_MS = 150

const MOBILE_PORTIONS = 4

const PORTIONS = 8

const INITIAL_MAX = 8

const EXPANDED_MAX = 50

const JERSEYS = [colors.primary, colors.lightBlue, colors.red, colors.purple, colors.gold]

function round(number: number, magnitude?: number) {
  const precision = magnitude || 10
  return Math.ceil(number / precision) * precision
}

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

class LeaderBoard extends React.PureComponent<BoardProps & I18nProps & ScreenProps, State> {
  state: State = {
    width: 0,
    isExpanded: false,
  }

  onLayout = (event: LayoutChangeEvent) => {
    const { width } = event.nativeEvent.layout
    this.setState({ width })
  }

  onToggleExpanse = () => {
    this.setState((state) => ({ isExpanded: !state.isExpanded }))
  }

  render() {
    const { t, leaders, screen, isLoading } = this.props
    const { isExpanded } = this.state
    const showExpandButton = leaders.length >= INITIAL_MAX + 1

    const leadersWithBTUs = leaders.map((leader) => ({
      points: leader.points / Math.pow(10, 18),
      identity: leader.identity === 'Unknown account' ? leader.address : leader.identity,
    }))

    if (leadersWithBTUs.length < 1) {
      return null
    }

    const realMax = leaders.length > EXPANDED_MAX ? EXPANDED_MAX : leaders.length
    const sortedLeaders = leadersWithBTUs.sort(sorter).slice(0, isExpanded ? realMax : INITIAL_MAX)
    const maxPoints = round(sortedLeaders[0].points * 1.1, PRECISION)
    const width = this.state.width
    return (
      <View nativeID={hashNav.build.leaderboard}>
        <H3 style={textStyles.invert}>{t('ranking')}</H3>
        <H2 style={[textStyles.invert, standardStyles.elementalMargin]}>{t('leaderboardTitle')}</H2>
        <View onLayout={this.onLayout}>
          {sortedLeaders
            .map(({ points, identity }) => {
              return { identity, relativePoints: round((points / maxPoints) * width) }
            })
            .map((leader, index) => ({ ...leader, color: getJersey(index) }))
            .map((leader, index) => (
              <LazyLoad key={index} height={65}>
                <Fade delay={DELAY_MS + index * 10}>
                  <Racer
                    relativePoints={leader.relativePoints}
                    color={leader.color}
                    identity={leader.identity}
                  />
                </Fade>
              </LazyLoad>
            ))}
          <Axis max={maxPoints} isMobile={screen === ScreenSizes.MOBILE} />
          <Fade delay={DELAY_MS} when={!isLoading}>
            <Text style={[fonts.small, textStyles.invert]}>{t('unitOfMeasure')}</Text>
          </Fade>
          {showExpandButton && (
            <Fade delay={DELAY_MS}>
              <View style={[styles.buttonExpand, standardStyles.elementalMarginTop]}>
                <Button
                  text={isExpanded ? t('collapseLeaderboard') : t('expandLeaderboard')}
                  kind={BTN.TERTIARY}
                  iconRight={
                    <Chevron
                      direction={isExpanded ? Direction.up : Direction.down}
                      size={12}
                      color={colors.primary}
                    />
                  }
                  size={SIZE.normal}
                  onPress={this.onToggleExpanse}
                />
              </View>
            </Fade>
          )}
          <View
            style={[
              standardStyles.centered,
              standardStyles.elementalMarginTop,
              standardStyles.blockMarginBottomTablet,
            ]}
          >
            <Text style={[fonts.p, textStyles.invert, textStyles.center, styles.prizeInfo]}>
              <Trans i18nKey="prizeInfo">
                <Link href={CeloLinks.stakeOffTerms}>Terms and Conditions</Link>
              </Trans>
            </Text>
          </View>
        </View>
      </View>
    )
  }
}

export default withScreenSize<BoardProps>(withNamespaces('dev')(LeaderBoard))

interface AxisProps {
  max: number
  isMobile: boolean
}

function Axis({ max, isMobile }: AxisProps) {
  const scaledMax = max
  const numberOfPortions = isMobile ? MOBILE_PORTIONS : PORTIONS
  const portion = scaledMax / numberOfPortions
  return (
    <View style={[standardStyles.row, styles.xaxis, standardStyles.elementalMargin]}>
      {Array(numberOfPortions)
        .fill(portion)
        .map((ratio, index) => {
          const amount = round(ratio * index, PRECISION)
          return (
            <Fade key={`${index}-${amount}`} delay={DELAY_MS}>
              <Text style={[fonts.small, textStyles.invert]}>{amount}</Text>
            </Fade>
          )
        })}
      <Fade key={max} delay={DELAY_MS}>
        <Text style={[fonts.small, textStyles.invert]}>{round(scaledMax)}</Text>
      </Fade>
    </View>
  )
}

function Link({ children, href }) {
  return <Button style={textStyles.invert} kind={BTN.INLINE} text={children} href={href} />
}

const styles = StyleSheet.create({
  xaxis: {
    justifyContent: 'space-between',
  },
  buttonExpand: {
    alignItems: 'center',
  },
  prizeInfo: {
    maxWidth: 450,
  },
})
