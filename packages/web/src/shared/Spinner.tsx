import { memo } from 'react'
import { StyleSheet, View } from 'react-native'
import LottieBase from 'src/animate/LottieBase'
import { colors } from 'src/styles'
interface Props {
  color: colors.white | colors.dark | colors.primary
  size: 'small' | 'medium'
}

const PATHS = {
  [colors.primary]: 'greenSpinner.json',
  [colors.white]: 'whiteSpinner.json',
  [colors.dark]: 'darkSpinner.json',
}

export default memo(function Spinner(props: Props) {
  return (
    <View style={styles[props.size]}>
      <LottieBase path={PATHS[props.color]} />
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
