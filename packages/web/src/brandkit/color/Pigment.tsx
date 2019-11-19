import { Text, View, StyleSheet, ViewStyle } from 'react-native'
import * as React from 'react'
import { colors, fonts, standardStyles } from 'src/styles'
import hexRgba from 'hex-rgba'
import { GAP } from 'src/brandkit/common/constants'
import yiq from 'yiq'

export interface Props {
  hex: string
  cmyk: string
  name: string
}

export default React.memo(function Pigment({ hex, cmyk, name }: Props) {
  console.log(JSON.stringify(hexToMachineRGB(hex)))

  const inline: ViewStyle = { backgroundColor: hex }

  if (hex === colors.white) {
    inline.borderColor = colors.gray
    inline.borderWidth = 1
  }

  return (
    <View style={standardStyles.elementalMarginBottom}>
      <View style={[standardStyles.centered, styles.box]}>
        <View style={[standardStyles.centered, styles.pigment, inline]}>
          <Text style={{ color: getContrastingColor(hex) }}>Copy</Text>
        </View>
      </View>
      <View style={styles.gap}>
        <Text style={fonts.h5}>{name}</Text>
        <Text style={fonts.small}>{hex}</Text>
        <Text style={fonts.small}>{hexToHumanRGB(hex)}</Text>
        <Text style={fonts.small}>CMYK {cmyk}</Text>
      </View>
    </View>
  )
})

const styles = StyleSheet.create({
  gap: { marginHorizontal: GAP },
  box: {
    borderColor: colors.gray,
    borderWidth: 1,
    padding: 30,
    margin: GAP,
  },
  pigment: {
    minWidth: 95,
    minHeight: 95,
    width: '85%',
    height: '85%',
  },
  pigmentHover: {
    transform: [{ scaleX: 1.2 }, { scaleY: 1.2 }],
  },
})

function hexToHumanRGB(hex: string) {
  return hexRgba(hex)
    .toUpperCase()
    .replace('A(', 'A (')
}

function hexToMachineRGB(hex) {
  const rgba = hexRgba(hex)
  const [red, green, blue, alpha] = rgba
    .replace('rgba(', '')
    .replace(')', '')
    .split(',')

  return { red, green, blue }
}

function getContrastingColor(hex: string) {
  return yiq(hex, { white: colors.white, black: colors.dark })
}
