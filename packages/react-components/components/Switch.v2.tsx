import Touchable from '@celo/react-components/components/Touchable'
import colors from '@celo/react-components/styles/colors.v2'
import { elevationShadowStyle } from '@celo/react-components/styles/styles'
import * as React from 'react'
import { Animated, StyleSheet, ViewStyle } from 'react-native'

const OFF_POSITION = 1
const ON_POSITION = 11
const SCALE = 2

interface Props {
  value: boolean
  onValueChange: (val: boolean) => void
  style?: ViewStyle
}

function getPostion(value: boolean) {
  return value ? ON_POSITION : OFF_POSITION
}

function Switch({ value, onValueChange, style }: Props) {
  const onPress = React.useCallback(() => onValueChange(!value), [value, onValueChange])
  const translateX = React.useRef(new Animated.Value(getPostion(value))).current

  React.useEffect(() => {
    Animated.spring(translateX, {
      toValue: getPostion(value),
      useNativeDriver: true,
    }).start()
  }, [value])

  return (
    <Touchable style={[styles.root, style, value && styles.on]} borderless={true} onPress={onPress}>
      <Animated.View style={{ ...styles.nob, transform: [{ scale: SCALE }, { translateX }] }} />
    </Touchable>
  )
}

const styles = StyleSheet.create({
  nob: {
    backgroundColor: colors.gray2,
    width: 11,
    height: 11,
    borderRadius: 20,
    ...elevationShadowStyle(1),
  },
  root: {
    alignItems: 'center',
    flexDirection: 'row',
    margin: 4,
    width: 34,
    height: 14,
    borderRadius: 20,
    backgroundColor: colors.gray3,
  },
  on: {
    backgroundColor: colors.greenUI,
  },
})

export default Switch
