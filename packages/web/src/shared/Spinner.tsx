import * as React from 'react'
import { StyleSheet, View } from 'react-native'
import LottieBase from 'src/animate/LottieBase'
import { colors } from 'src/styles'
interface Props {
  color: colors.white | colors.dark | colors.primary
  size: 'small' | 'medium'
}

const DATA = {
  [colors.primary]: require('src/shared/greenSpinner.json'),
  [colors.white]: require('src/shared/whiteSpinner.json'),
  [colors.dark]: require('src/shared/darkSpinner.json'),
}

export default React.memo(function Spinner(props: Props) {
  return (
    <View accessibilityLabel="loading" style={styles[props.size]}>
      <LottieBase loop={true} data={DATA[props.color]} />
    </View>
  )
})

const styles = StyleSheet.create({
  small: {
    width: 25,
    height: 25,
  },
  medium: {
    width: 50,
    height: 50,
  },
})
