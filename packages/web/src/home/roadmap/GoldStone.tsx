import * as React from 'react'
import { StyleSheet, Text, View } from 'react-native'
import Fade from 'react-reveal/Fade'
import { useScreenSize } from 'src/layout/ScreenSize'
import OvalCoin from 'src/shared/OvalCoin'
import { colors, fonts, textStyles } from 'src/styles'

interface Props {
  date: string
  title: string
  text: string
  index: number
  isLast?: boolean
}

const heading = [fonts.p, textStyles.heavy]

export default React.memo(function GoldStone({ date, title, text, isLast, index }: Props) {
  const { isMobile } = useScreenSize()
  return (
    <View style={[styles.container, isMobile && styles.containerMobile]}>
      <View
        style={[
          styles.thruline,
          isLast && {
            // @ts-ignore
            background: `linear-gradient(${colors.gold}, ${colors.white})`,
          },
        ]}
      />
      <View style={styles.box}>
        <View style={styles.coin}>
          <OvalCoin size={20} color={colors.gold} />
        </View>
        <Fade right={true} delay={10 * index}>
          <Text style={[...heading, styles.date]}>{date}</Text>
          <Text style={heading}>{title}</Text>
          <Text style={fonts.p}>{text}</Text>
        </Fade>
      </View>
    </View>
  )
})

const styles = StyleSheet.create({
  date: { color: colors.gold },
  container: {
    marginHorizontal: 15,
    flexDirection: 'row',
    flex: 1,
  },
  containerMobile: {
    height: 'inherit',
    marginHorizontal: 5,
    paddingRight: 10,
  },
  thruline: {
    width: 3,
    backgroundColor: colors.gold,
    transform: [{ translateY: 5 }],
  },
  box: {
    marginVertical: 0,
    paddingLeft: 15,
    paddingBottom: 75,
    flex: 1,
  },
  coin: {
    position: 'absolute',
    transform: [{ translateX: -27 }, { translateY: 5 }],
  },
})
