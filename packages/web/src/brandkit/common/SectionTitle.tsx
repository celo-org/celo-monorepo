import { StyleSheet, View } from 'react-native'
import { H4 } from 'src/fonts/Fonts'
import { colors, standardStyles } from 'src/styles'

export default function SectionTitle({ children }) {
  return (
    <View style={[styles.border, standardStyles.blockMarginTop]}>
      <H4>{children}</H4>
    </View>
  )
}

const styles = StyleSheet.create({
  border: {
    borderBottomColor: colors.light,
    borderBottomWidth: 1,
    paddingBottom: 10,
    marginVertical: 20,
  },
})
