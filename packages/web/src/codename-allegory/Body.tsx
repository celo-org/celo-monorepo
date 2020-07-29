import * as React from 'react'
import { Image, StyleSheet, View } from 'react-native'
import Cambio from 'src/codename-allegory/cambio-flower.jpg'
import RingsGlyph from 'src/logos/RingsGlyph'
import AspectRatio from 'src/shared/AspectRatio'
import { colors, standardStyles } from 'src/styles'
import Poem from 'src/codename-allegory/Poem'

export default function Body() {
  return (
    <View style={styles.root}>
      <RingsGlyph color={colors.dark} height={30} />
      <AspectRatio ratio={1} style={styles.flower}>
        <Image source={Cambio} style={standardStyles.image} />
      </AspectRatio>
      <Poem />
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
