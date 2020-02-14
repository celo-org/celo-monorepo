import * as React from 'react'
import { StyleSheet, View } from 'react-native'
import OvalCoin from 'src/shared/OvalCoin'
import { Line, Path } from 'src/shared/svg'
import { colors, standardStyles } from 'src/styles'
import Svg from 'svgs'

function Phone() {
  return (
    <View style={styles.container}>
      <View style={styles.absoluteCenter}>
        <GreenLine />
      </View>
      <Svg width="100%" height="100%" viewBox="0 0 153 358" fill="none" style={svgStyle}>
        <Path
          d="M17.8473 2.64592L139.728 17.2761C147.016 18.1508 152.5 24.333 152.5 31.6727V327.146C152.5 334.517 146.969 340.716 139.645 341.552L17.7584 355.469C8.56117 356.519 0.5 349.326 0.5 340.069V18.0355C0.5 8.74263 8.62072 1.53839 17.8473 2.64592Z"
          stroke="white"
        />
        <Line
          x1="1"
          y1="178.5"
          x2="79"
          y2="178.5"
          stroke={colors.dark}
          strokeOpacity="0.8"
          strokeWidth="40"
        />
      </Svg>
    </View>
  )
}

function GreenLine() {
  return (
    <View style={[standardStyles.row, standardStyles.centered]}>
      <View style={[styles.line, styles.arrow, styles.animations]} />
      <View style={[styles.arrowhead, styles.animations]}>
        <OvalCoin color={colors.primary} size={16} />
      </View>
    </View>
  )
}

export default React.memo(Phone)

const LINE_DISTANCE = 280

const svgStyle = {
  zIndex: 1,
}

const styles = StyleSheet.create({
  absoluteCenter: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  container: {
    maxHeight: 350,
    height: '100%',
  },
  animations: {
    animationDuration: '1s',
    animationIterationCount: 1,
    animationTimingFunction: 'linear',
    animationFillMode: 'both',
  },
  arrowhead: {
    animationKeyframes: [
      {
        '0%': {
          opacity: 0.5,
          transform: [{ translateX: -LINE_DISTANCE }],
        },
        '100%': {
          opacity: 1,
          transform: [{ translateX: -5 }],
        },
      },
    ],
  },
  arrow: {
    transformOrigin: 'left',
    animationKeyframes: [
      {
        '0%': {
          opacity: 0.6,
          transform: [{ scaleX: 0 }],
        },
        '100%': {
          opacity: 1,
          transform: [{ scaleX: 1 }],
        },
      },
    ],
  },
  line: {
    width: LINE_DISTANCE,
    height: 1,
    backgroundColor: colors.primary,
  },
})
