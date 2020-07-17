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
  bottomBorder: {
    borderBottomColor: colors.gray,
    borderBottomWidth: 1,
  },
  button: {
    // by default buttons have padding on all sides this resets so it can align with left
    paddingLeft: 0,
    // default is center which means with the icon its a little to far right for our usecase
    justifyContent: 'flex-start',
  },
})
