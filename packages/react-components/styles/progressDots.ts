import colors from '@celo/react-components/styles/colors.v2'
import { StyleSheet } from 'react-native'

const PROGRESS_CIRCLE_PASSIVE_SIZE = 6
const PROGRESS_CIRCLE_ACTIVE_SIZE = 8

const circle = {
  flex: 0,
  borderRadius: 8,
  marginHorizontal: 5,
}

export default StyleSheet.create({
  circlePassive: {
    ...circle,
    backgroundColor: colors.inactive,
    height: PROGRESS_CIRCLE_PASSIVE_SIZE,
    width: PROGRESS_CIRCLE_PASSIVE_SIZE,
  },
  circleActive: {
    ...circle,
    backgroundColor: colors.dark,
    height: PROGRESS_CIRCLE_ACTIVE_SIZE,
    width: PROGRESS_CIRCLE_ACTIVE_SIZE,
  },
})
