import { memo } from 'react'
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

const SIZE = {
  small: 25,
  medium: 50,
}

export default memo(function Spinner(props: Props) {
  return <LottieBase path={PATHS[props.color]} size={SIZE[props.size]} />
})
