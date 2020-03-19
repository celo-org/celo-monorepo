import * as React from 'react'
import { StyleSheet, Text, View } from 'react-native'
import Fade from 'react-reveal/Fade'
import { Status } from 'src/home/roadmap/milestones'
import { useScreenSize } from 'src/layout/ScreenSize'
import CoinHalfFull from 'src/shared/CoinHalfFull'
import HollowCoin from 'src/shared/HollowOval'
import OvalCoin from 'src/shared/OvalCoin'
import { colors, fonts, textStyles } from 'src/styles'

interface Props {
  status: Status
  date?: string
  title: string
  text: string
  index: number
  isLast?: boolean
}

const heading = [fonts.legal, textStyles.heavy]

export default React.memo(function GoldStone({ date, title, text, isLast, index, status }: Props) {
  const { isMobile } = useScreenSize()
  const Coin = getCoinType(status)
  const delay = 30 * index * status
  return (
    <View style={[styles.container, isMobile && styles.containerMobile]}>
      <View
        style={
          status === Status.complete
            ? [
                styles.thruline,
                isLast && {
                  // @ts-ignore
                  background: `linear-gradient(${colors.gold}, ${colors.white})`,
                },
              ]
            : styles.noline
        }
      />

      <View style={styles.box}>
        <View style={status === Status.complete ? styles.coin : styles.futureCoin}>
          <Fade delay={delay}>
            <Coin size={18} color={colors.gold} />
          </Fade>
        </View>
        <Fade delay={delay}>
          <Text style={[...heading, styles.date]}>{date}</Text>
          <Text style={heading}>{title}</Text>
          <Text style={fonts.legal}>{text}</Text>
        </Fade>
      </View>
    </View>
  )
})

function getCoinType(status: Status) {
  switch (status) {
    case Status.complete:
      return OvalCoin
    case Status.unstarted:
      return HollowCoin
    case Status.inprogress:
      return CoinHalfFull
  }
}

const HORIZONTAL_SPACE = 25
const DISTANCE_COIN_TO_BE_CENTER_ONLINE = 11

const styles = StyleSheet.create({
  date: { color: colors.goldDark },
  container: {
    maxWidth: 450,
    marginHorizontal: 15,
    flexDirection: 'row',
  },
  containerMobile: {
    height: 'inherit',
    marginHorizontal: 10,
    paddingRight: 10,
  },
  thruline: {
    width: 2,
    backgroundColor: colors.gold,
    transform: [{ translateY: 10 }],
  },
  noline: {
    width: 2,
    visibility: 'hidden',
  },
  box: {
    marginVertical: 0,
    paddingHorizontal: HORIZONTAL_SPACE,
    paddingBottom: 30,
    flex: 1,
  },
  futureCoin: {
    position: 'absolute',
    transform: [
      { translateX: -HORIZONTAL_SPACE - DISTANCE_COIN_TO_BE_CENTER_ONLINE - 1 },
      { translateY: 1 },
    ],
  },
  coin: {
    position: 'absolute',
    transform: [
      { translateX: -HORIZONTAL_SPACE - DISTANCE_COIN_TO_BE_CENTER_ONLINE },
      { translateY: 1 },
    ],
  },
})
