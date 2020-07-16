import colors from '@celo/react-components/styles/colors.v2'
import { StyleSheet } from 'react-native'

const CIRCLE_SIZE = 5

const circle = {
  flex: 0,
  height: CIRCLE_SIZE,
  width: CIRCLE_SIZE,
  borderRadius: CIRCLE_SIZE,
  marginHorizontal: 5,
}

export default StyleSheet.create({
  circlePassive: {
    ...circle,
    backgroundColor: colors.inactive,
  },
  circleActive: {
    ...circle,
    backgroundColor: colors.dark,
  },
  circlePassiveOnboarding: {
    ...circle,
    backgroundColor: colors.onboardingBrownLight,
    opacity: 0.5,
  },
  circleActiveOnboarding: {
    ...circle,
    backgroundColor: colors.onboardingBlue,
  },
})
