import * as React from 'react'
import { StyleSheet, View } from 'react-native'
import OvalCoin from 'src/shared/OvalCoin'
import { Line, Path } from 'src/shared/svg'
import { colors, standardStyles } from 'src/styles'
import Svg from 'svgs'

function Phone() {
  return (
    <>
      <View style={styles.absoluteCenter}>
        <GreenLine />
      </View>
      <Svg width="100%" height="100%" viewBox="0 0 153 358" fill="none" style={svgStyle}>
        <Path
          d="M17.8473 2.64592L139.728 17.2761C147.016 18.1508 152.5 24.333 152.5 31.6727V327.146C152.5 334.517 146.969 340.716 139.645 341.552L17.7584 355.469C8.56117 356.519 0.5 349.326 0.5 340.069V18.0355C0.5 8.74263 8.62072 1.53839 17.8473 2.64592Z"
          stroke="white"
          style={[styles.animations, styles.appear]}
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
    </>
  )
}

function GreenLine() {
  return (
    <View
      style={[standardStyles.row, standardStyles.centered, styles.lightspeed, styles.animations]}
    >
      <View style={styles.line} />
      <View style={styles.onLine}>
        <OvalCoin color={colors.primary} size={20} />
      </View>
    </View>
  )
}

export default React.memo(Phone)

const LINE_OFFSET = 150

const svgStyle = {
  zIndex: 1,
}

const styles = StyleSheet.create({
  absoluteCenter: {
    position: 'absolute',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  animations: {
    animationDuration: '1.2s',
    animationIterationCount: 1,
    animationTimingFunction: 'linear',
    animationFillMode: 'both',
  },
  appear: {
    animationKeyframes: [
      {
        '0%': {
          opacity: 0.5,
        },
        '100%': {
          opacity: 1,
        },
      },
    ],
  },
  lightspeed: {
    animationKeyframes: [
      {
        '0%': {
          transform: [{ translateX: `calc(-${LINE_OFFSET * 3}px)` }],
        },
        '40%': {
          transform: [
            {
              translateX: `calc(-${LINE_OFFSET}px)`,
            },
          ],
        },
        '100%': {
          transform: [{ translateX: 0 }],
        },
      },
    ],
  },
  line: {
    borderBottomColor: colors.primary,
    borderBottomWidth: 1,
    width: `calc(50vw + ${LINE_OFFSET}px)`,
  },
  onLine: {
    transform: [{ translateX: -5 }],
  },
})
