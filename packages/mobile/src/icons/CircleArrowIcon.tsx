import colors from '@celo/react-components/styles/colors'
import { elevationShadowStyle } from '@celo/react-components/styles/styles'
import * as React from 'react'
import { StyleSheet, View, ViewStyle } from 'react-native'
import Svg, { Path } from 'react-native-svg'

const SIZE = 24

interface Props {
  style?: ViewStyle
}

export default function CircleArrowIcon({ style }: Props) {
  return (
    <View style={[styles.container, style]}>
      <Svg width={13} height={9} viewBox="0 0 13 9" fill="none">
        <Path
          d="M1 4.5h11m0 0L8.264 1M12 4.5L8.264 8"
          stroke={colors.dark}
          strokeWidth={1.5}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </Svg>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'white',
    width: SIZE,
    height: SIZE,
    borderRadius: SIZE / 2,
    alignItems: 'center',
    justifyContent: 'center',
    ...elevationShadowStyle(3),
  },
})
