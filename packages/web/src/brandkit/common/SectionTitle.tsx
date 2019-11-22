import { StyleSheet, View, ViewStyle } from 'react-native'
import { H4 } from 'src/fonts/Fonts'
import { colors, standardStyles } from 'src/styles'

interface Props {
  children: string
  containerStyle?: ViewStyle
}

export default function SectionTitle({ children, containerStyle }: Props) {
  return (
    <View style={[styles.border, standardStyles.blockMarginTop, containerStyle]}>
      <H4>{children}</H4>
    </View>
  )
}

const styles = StyleSheet.create({
  border: {
    paddingBottom: 10,
    marginVertical: 20,
  },
})
