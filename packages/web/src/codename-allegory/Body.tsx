import * as React from 'react'
import { Image, StyleSheet, Text, View } from 'react-native'
import Fade from 'react-reveal/Fade'
import Cambio from 'src/codename-allegory/cambio-flower.jpg'
import Poem from 'src/codename-allegory/Poem'
import RingsGlyph from 'src/logos/RingsGlyph'
import AspectRatio from 'src/shared/AspectRatio'
import { colors, fonts, standardStyles, textStyles } from 'src/styles'

export default React.memo(function Body() {
  return (
    <View style={styles.root}>
      <RingsGlyph color={colors.dark} height={30} />
      <AspectRatio ratio={1} style={styles.flower}>
        <Image source={Cambio} style={standardStyles.image} />
      </AspectRatio>
      <Poem />
      <Fade duration={1800} delay={1200}>
        <View style={styles.footer}>
          <Text style={[fonts.legal, textStyles.center, standardStyles.elementalMargin]}>
            <RingsGlyph height={15} color={colors.dark} />
            {'  '}
            Imagined with Celo
          </Text>
          <Text style={[fonts.legal, textStyles.center]}>Design & Built by cLabs, 🄯 Celo 2020</Text>
        </View>
      </Fade>
    </View>
  )
})

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
  footer: {
    marginVertical: 30,
  },
})
