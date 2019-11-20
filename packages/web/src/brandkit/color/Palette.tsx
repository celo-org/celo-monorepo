import Pigment, { ColorData } from 'src/brandkit/color/Pigment'
import { Text, View, StyleSheet } from 'react-native'
import { fonts, standardStyles } from 'src/styles'
import { H1, H2, H3, H4 } from 'src/fonts/Fonts'
import { GAP } from 'src/brandkit/common/constants'

interface Props {
  colors: ColorData[]
  title: string
  text: string
}

export default function Palette({ text, title, colors }: Props) {
  return (
    <View style={standardStyles.blockMarginBottom}>
      <Text style={[fonts.h5, styles.gap]}>{title}</Text>
      <Text style={[fonts.p, standardStyles.elementalMarginBottom, styles.gap]}>{text}</Text>
      <View style={styles.swatch}>
        {colors.map(({ name, hex, cmyk }) => {
          return <Pigment key={hex} name={name} hex={hex} cmyk={cmyk} />
        })}
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  swatch: {
    flexWrap: 'wrap',
    flexDirection: 'row',
  },
  gap: {
    marginHorizontal: GAP,
  },
})
