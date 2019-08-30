import { Image, StyleSheet } from 'react-native'
import { colors } from '../styles'
import { memo } from 'react'
interface Props {
  color: colors.white | colors.dark | colors.primary
  size: 'small' | 'medium' | 'large'
}

const SPINNERS = {
  [colors.primary]: require('src/shared/greenSpinner.gif'),
  [colors.white]: require('src/shared/whiteSpinner.gif'),
  [colors.dark]: require('src/shared/darkSpinner.gif'),
}

export default memo(function Spinner(props: Props) {
  return <Image resizeMode={'contain'} source={SPINNERS[props.color]} style={styles[props.size]} />
})

const styles = StyleSheet.create({
  small: {
    height: 20,
    width: 20,
  },
  medium: {
    height: 30,
    width: 30,
  },
  large: {
    height: 50,
    width: 50,
  },
})
