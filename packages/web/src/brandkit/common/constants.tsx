import { StyleSheet } from 'react-native'
import { colors } from 'src/styles'

export const GAP = 10

export const brandStyles = StyleSheet.create({
  gap: {
    marginHorizontal: GAP,
  },
  tiling: {
    flexWrap: 'wrap',
    flexDirection: 'row',
  },
  fullBorder: {
    borderWidth: 1,
    borderColor: colors.gray,
  },
  button: {
    transform: [{ translateX: -20 }],
  },
})
