import colors from '@celo/react-components/styles/colors'
import * as React from 'react'
import { StyleSheet, View } from 'react-native'
import Svg, { Defs, G, LinearGradient, Path, Stop } from 'react-native-svg'

export enum LogoTypes {
  COLOR = 'COLOR',
  DARK = 'DARK',
  LIGHT = 'LIGHT',
}

interface Props {
  height?: number
  type?: LogoTypes
}

export default function Logo({ height = 32, type = LogoTypes.COLOR }: Props) {
  let fill
  switch (type) {
    case LogoTypes.DARK:
      fill = colors.dark
      break
    case LogoTypes.LIGHT:
      fill = colors.light
      break
    default:
      fill = 'url(#prefix__paint0_linear)'
      break
  }

  return (
    <View style={styles.container}>
      <Svg width={height} height={height} viewBox="0 0 32 32" fill="none">
        <G>
          <Path
            d="M18.39 26.77c1.072-8.36 5.002-13.12 10.943-17.434l-3.037-4.003c-3.886 2.98-8.13 7.205-10.095 13.032-1.608-4.76-4.958-8.94-10.363-13.032L2.667 9.425C9.41 14.228 12.807 19.61 13.744 26.77h4.646z"
            fill={fill}
          />
        </G>
        <Defs>
          <LinearGradient
            id="prefix__paint0_linear"
            x1={34.337}
            y1={10.054}
            x2={28.937}
            y2={30.49}
            gradientUnits="userSpaceOnUse"
          >
            <Stop offset={0.118} stopColor="#35D07F" />
            <Stop offset={0.802} stopColor="#FBCC5C" />
          </LinearGradient>
        </Defs>
      </Svg>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    shadowOffset: { width: 0, height: 0 },
    shadowRadius: 2,
    shadowOpacity: 1,
    shadowColor: 'rgba(46, 51, 56, 0.15)',
  },
})
