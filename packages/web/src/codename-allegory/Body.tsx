import * as React from 'react'
import { Image, StyleSheet, View } from 'react-native'
import AspectRatio from 'src/shared/AspectRatio'
import Cambio from 'src/codename-allegory/cambio-flower.jpg'
import { standardStyles, colors } from 'src/styles'
import RingsGlyph from 'src/logos/RingsGlyph'

export default function Body() {
  return (
    <View style={styles.root}>
      <RingsGlyph color={colors.dark} height={30} />
      <AspectRatio ratio={1} style={styles.flower}>
        <Image source={Cambio} style={standardStyles.image} />
      </AspectRatio>
    </View>
  )
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    marginHorizontal: 24,
    alignItems: 'center',
  },
  flower: {
    marginTop: 60,
    maxWidth: 1200,
    width: '100%',
  },
})
